import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext, runWithTenantContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toDecimal, toPrismaDecimal, toPrismaQtyDecimal, roundMoney } from "@/domain/money";
import { calculatePointsEarned } from "@/server/loyalty/engine";
import { generateNextInvoiceNumber } from "@/server/db/invoice-sequence";

const SaleItemInputSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  lineNo: z.number().int().positive().optional(),
  quantity: z.union([z.string(), z.number()]),
  unitPrice: z.union([z.string(), z.number()]),
  taxRate: z.union([z.string(), z.number()]).optional().default(20.00),
  discountAmount: z.union([z.string(), z.number()]).optional().default(0),
}).strict();

const CreateSaleSchema = z.object({
  clientSaleId: z.string().uuid("Invalid clientSaleId"),
  idempotencyKey: z.string().min(1),
  storeId: z.string().uuid("Invalid store ID").optional().or(z.literal("")),
  customerId: z.string().uuid().optional(),
  tableId: z.string().uuid().optional(),
  redeemedPoints: z.number().int().nonnegative().optional().default(0),
  subtotal: z.union([z.string(), z.number()]),
  taxTotal: z.union([z.string(), z.number()]),
  discountTotal: z.union([z.string(), z.number()]).optional().default(0),
  grandTotal: z.union([z.string(), z.number()]),
  paidTotal: z.union([z.string(), z.number()]),
  changeDue: z.union([z.string(), z.number()]).optional().default(0),
  paymentMethod: z.enum(["cash", "card", "credit", "transfer"]).default("cash"),
  items: z.array(SaleItemInputSchema).min(1, "Sale must contain at least one item"),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = CreateSaleSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const {
      clientSaleId,
      idempotencyKey,
      storeId,
      customerId,
      tableId,
      redeemedPoints,
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      paidTotal,
      changeDue,
      paymentMethod,
      items,
    } = parsed.data;

    // Resolve storeId if omitted or empty
    let resolvedStoreId = storeId && storeId.trim().length > 0 ? storeId : null;
    if (!resolvedStoreId) {
      resolvedStoreId = ctx.storeIds?.[0] || null;
    }
    if (!resolvedStoreId) {
      const primaryStore = await prisma.store.findFirst({
        where: { tenantId: ctx.tenantId },
        select: { id: true },
      });
      resolvedStoreId = primaryStore?.id || null;
    }
    if (!resolvedStoreId) {
      // Create or use fallback primary store for tenant if needed
      const autoStore = await prisma.store.create({
        data: {
          tenantId: ctx.tenantId,
          name: "Point de Vente Principal",
          code: "POS-MAIN",
        },
      });
      resolvedStoreId = autoStore.id;
    }

    // 1. Check for existing idempotency replay
    const existing = await prisma.sale.findFirst({
      where: {
        tenantId: ctx.tenantId,
        OR: [{ clientSaleId }, { idempotencyKey }],
      },
      include: { items: true, payments: true },
    });

    if (existing) {
      return jsonOk({ sale: existing, replayed: true });
    }

    // 2. Fetch products to get accurate names and cost snapshots
    const productIds = items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: {
        tenantId: ctx.tenantId,
        id: { in: productIds },
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Verify all products exist and validate quantities
    for (const item of items) {
      if (!productMap.has(item.productId)) {
        throw new AppError("PRODUCT_NOT_FOUND", `Product not found: ${item.productId}`, 404);
      }
      const q = toDecimal(item.quantity);
      if (!q.gt(0)) {
        throw new AppError("INVALID_QUANTITY", "Quantity must be strictly greater than zero", 422);
      }
    }

    // Authoritative Server-Side Price & Total Verification (Anti-Tampering)
    let serverSubtotal = toDecimal(0);
    let serverTaxTotal = toDecimal(0);
    let serverDiscountTotal = toDecimal(0);

    const validatedItems = items.map((item, idx) => {
      const prod = productMap.get(item.productId)!;
      const qtyDec = toDecimal(item.quantity);
      // Authoritative catalog price takes precedence over client-supplied unitPrice
      const priceDec = prod.salePrice ? toDecimal(prod.salePrice) : toDecimal(item.unitPrice);
      const rawDisc = toDecimal(item.discountAmount || 0);
      const lineGross = qtyDec.times(priceDec);
      const discDec = rawDisc.gt(lineGross) ? lineGross : (rawDisc.lt(0) ? toDecimal(0) : rawDisc);
      const taxRateDec = toDecimal(item.taxRate ?? 20.00);

      const net = roundMoney(lineGross.minus(discDec));
      const tax = roundMoney(net.times(taxRateDec).dividedBy(100));
      const lineTotal = roundMoney(net.plus(tax));

      serverSubtotal = serverSubtotal.plus(net);
      serverTaxTotal = serverTaxTotal.plus(tax);
      serverDiscountTotal = serverDiscountTotal.plus(discDec);

      return {
        item,
        idx,
        prod,
        qtyDec,
        priceDec,
        discDec,
        taxRateDec,
        net,
        tax,
        lineTotal,
      };
    });

    const serverGrandTotal = roundMoney(serverSubtotal.plus(serverTaxTotal));
    const clientGrandTotalDec = toDecimal(grandTotal);
    const priceDiff = serverGrandTotal.minus(clientGrandTotalDec).abs();

    // If client price deviates by more than 0.15 MAD, block transaction and record audit incident
    if (priceDiff.gt(0.15)) {
      const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
      try {
        await prisma.auditLog.create({
          data: {
            tenantId: ctx.tenantId,
            actorUserId: ctx.userId,
            action: "SECURITY_PRICE_TAMPERING_BLOCKED",
            entityType: "sale",
            reason: `Price tampering detected: client grandTotal=${grandTotal}, server calculated=${serverGrandTotal.toFixed(2)}`,
            beforeState: { clientSaleId, grandTotal, itemsCount: items.length },
            afterState: { serverGrandTotal: serverGrandTotal.toFixed(2) },
            ip: clientIp,
          },
        });
      } catch (logErr) {
        console.error("Failed to log price tampering audit:", logErr);
      }

      throw new AppError(
        "PRICE_TAMPERING_DETECTED",
        "Sale total rejected: submitted amount does not match authoritative catalog pricing",
        400
      );
    }

    // 3. Execute atomic transaction in PostgreSQL with RLS context & DGI gap-less sequence
    const result = await runWithTenantContext(
      { tenantId: ctx.tenantId, userId: ctx.userId },
      async () => {
        return prisma.$transaction(async (tx) => {
          // Generate gap-less sequential receipt/invoice number (Article 145 CGI)
          const { invoiceNumber: receiptNumber } = await generateNextInvoiceNumber(
            ctx.tenantId,
            { prefix: "REC", tx }
          );

          // Link sale to active open CashSession if one is open for this store
          const activeCashSession = await tx.cashSession.findFirst({
            where: {
              tenantId: ctx.tenantId,
              storeId: resolvedStoreId,
              status: "open",
            },
            orderBy: { openedAt: "desc" },
            select: { id: true },
          });

          // Create Sale
          const sale = await tx.sale.create({
            data: {
              tenantId: ctx.tenantId,
              storeId: resolvedStoreId,
              cashSessionId: activeCashSession?.id || null,
              cashierUserId: ctx.userId,
              customerId: customerId || null,
              tableId: tableId || null,
              clientSaleId,
              idempotencyKey,
              receiptNumber,
              status: "completed",
              subtotal: toPrismaDecimal(subtotal),
              taxTotal: toPrismaDecimal(taxTotal),
              discountTotal: toPrismaDecimal(discountTotal),
              grandTotal: toPrismaDecimal(grandTotal),
              paidTotal: toPrismaDecimal(paidTotal),
              changeDue: toPrismaDecimal(changeDue),
              paymentMethod,
              completedAt: new Date(),
            },
          });

          // Create SaleItems and update inventory
          for (const vItem of validatedItems) {
            const { item, idx, prod, qtyDec, priceDec, discDec, taxRateDec, net, tax, lineTotal } = vItem;
            const nameSnapshot = prod?.name || "Article Divers";
            const skuSnapshot = prod?.sku || "DIVERS";

            await tx.saleItem.create({
              data: {
                tenantId: ctx.tenantId,
                saleId: sale.id,
                productId: item.productId,
                lineNo: item.lineNo || idx + 1,
                productNameSnapshot: nameSnapshot,
                skuSnapshot,
                quantity: toPrismaQtyDecimal(qtyDec),
                unitPrice: toPrismaDecimal(priceDec),
                discountAmount: toPrismaDecimal(discDec),
                taxRate: toPrismaDecimal(taxRateDec),
                taxAmount: toPrismaDecimal(tax),
                netAmount: toPrismaDecimal(net),
                lineTotal: toPrismaDecimal(lineTotal),
                costSnapshot: prod?.costPrice ? toPrismaDecimal(prod.costPrice) : null,
              },
            });

            // Record inventory movement (reduction)
            await tx.inventoryMovement.create({
              data: {
                tenantId: ctx.tenantId,
                storeId: resolvedStoreId,
                productId: item.productId,
                movementType: "sale",
                quantityDelta: toPrismaQtyDecimal(qtyDec.negated()),
                unitCost: prod?.costPrice ? toPrismaDecimal(prod.costPrice) : null,
                referenceType: "sale",
                referenceId: sale.id,
                reason: `Vente ${sale.receiptNumber}`,
                idempotencyKey: `mv_sale_${sale.id}_${item.productId}_${idx}`,
                createdBy: ctx.userId,
              },
            });

            // Decrement stock levels
            await tx.stockLevel.upsert({
              where: {
                tenantId_storeId_productId: {
                  tenantId: ctx.tenantId,
                  storeId: resolvedStoreId,
                  productId: item.productId,
                },
              },
              update: {
                quantity: { decrement: toPrismaQtyDecimal(qtyDec) },
              },
              create: {
                tenantId: ctx.tenantId,
                storeId: resolvedStoreId,
                productId: item.productId,
                quantity: toPrismaQtyDecimal(qtyDec.negated()),
              },
            });
          }

          // Record Sale Payment
      await tx.salePayment.create({
        data: {
          tenantId: ctx.tenantId,
          saleId: sale.id,
          method: paymentMethod,
          amount: toPrismaDecimal(grandTotal),
        },
      });

      // Handle Customer Credit and Loyalty
      if (customerId) {
        // Deduct redeemed loyalty points if customer used points on this checkout
        if (redeemedPoints && redeemedPoints > 0) {
          await tx.loyaltyPoint.create({
            data: {
              tenantId: ctx.tenantId,
              customerId,
              saleId: sale.id,
              deltaPoints: -Math.abs(redeemedPoints),
              reason: "redeem",
              idempotencyKey: `loyal_redeem_sale_${sale.id}`,
              actorUserId: ctx.userId,
            },
          });
        }

        // Loyalty points earning (1 pt per 10 MAD)
        const earnedPoints = calculatePointsEarned(toDecimal(grandTotal).toNumber());
        if (earnedPoints > 0) {
          await tx.loyaltyPoint.create({
            data: {
              tenantId: ctx.tenantId,
              customerId,
              saleId: sale.id,
              deltaPoints: earnedPoints,
              reason: "earn",
              idempotencyKey: `loyal_earn_sale_${sale.id}`,
              actorUserId: ctx.userId,
            },
          });
        }

        // If paid with Customer Credit, charge to customer debt ledger
        if (paymentMethod === "credit") {
          const cust = await tx.customer.findUnique({
            where: { tenantId_id: { tenantId: ctx.tenantId, id: customerId } },
          });

          if (cust) {
            const currentBal = toDecimal(cust.currentCreditBalance);
            const newBal = currentBal.plus(toDecimal(grandTotal));

            await tx.customer.update({
              where: { id: cust.id },
              data: {
                currentCreditBalance: toPrismaDecimal(newBal),
              },
            });

            await tx.customerCredit.create({
              data: {
                tenantId: ctx.tenantId,
                customerId: cust.id,
                saleId: sale.id,
                type: "charge",
                amount: toPrismaDecimal(grandTotal),
                balanceAfter: toPrismaDecimal(newBal),
                notes: `Achat à crédit (Ticket ${sale.receiptNumber})`,
                idempotencyKey: `cred_sale_${sale.id}`,
              },
            });
          }
        }
      }

        return sale;
      });
    }
  );

    // Revalidate dashboard and inventory pages across all locales
    try {
      revalidatePath("/[locale]/dashboard", "page");
      revalidatePath("/[locale]/dashboard/inventory", "page");
      revalidatePath("/[locale]/dashboard/reports", "page");
      revalidatePath("/[locale]/dashboard/products", "page");
    } catch {
      // Revalidation during background requests is best-effort
    }

    return jsonOk({ sale: result }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
