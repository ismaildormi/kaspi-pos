import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toDecimal, toPrismaDecimal, toPrismaQtyDecimal, roundMoney } from "@/domain/money";
import { calculatePointsEarned } from "@/server/loyalty/engine";

const SaleItemInputSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  lineNo: z.number().int().positive().optional(),
  quantity: z.union([z.string(), z.number()]),
  unitPrice: z.union([z.string(), z.number()]),
  taxRate: z.union([z.string(), z.number()]).optional().default(20.00),
  discountAmount: z.union([z.string(), z.number()]).optional().default(0),
});

const CreateSaleSchema = z.object({
  clientSaleId: z.string().uuid("Invalid clientSaleId"),
  idempotencyKey: z.string().min(1),
  storeId: z.string().uuid("Invalid store ID"),
  customerId: z.string().uuid().optional(),
  subtotal: z.union([z.string(), z.number()]),
  taxTotal: z.union([z.string(), z.number()]),
  discountTotal: z.union([z.string(), z.number()]).optional().default(0),
  grandTotal: z.union([z.string(), z.number()]),
  paidTotal: z.union([z.string(), z.number()]),
  changeDue: z.union([z.string(), z.number()]).optional().default(0),
  paymentMethod: z.enum(["cash", "card", "credit", "transfer"]).default("cash"),
  items: z.array(SaleItemInputSchema).min(1, "Sale must contain at least one item"),
});

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
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      paidTotal,
      changeDue,
      paymentMethod,
      items,
    } = parsed.data;

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

    // 3. Execute atomic transaction in PostgreSQL
    const result = await prisma.$transaction(async (tx) => {
      const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

      // Create Sale
      const sale = await tx.sale.create({
        data: {
          tenantId: ctx.tenantId,
          storeId,
          cashierUserId: ctx.userId,
          customerId: customerId || null,
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
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const prod = productMap.get(item.productId);
        const nameSnapshot = prod?.name || "Article Divers";
        const skuSnapshot = prod?.sku || "DIVERS";
        const qtyDec = toDecimal(item.quantity);
        const priceDec = toDecimal(item.unitPrice);
        const discDec = toDecimal(item.discountAmount);
        const taxRateDec = toDecimal(item.taxRate);

        const net = roundMoney(qtyDec.times(priceDec).minus(discDec));
        const tax = roundMoney(net.times(taxRateDec).dividedBy(100));
        const lineTotal = roundMoney(net.plus(tax));

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
            storeId,
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
              storeId,
              productId: item.productId,
            },
          },
          update: {
            quantity: { decrement: toPrismaQtyDecimal(qtyDec) },
          },
          create: {
            tenantId: ctx.tenantId,
            storeId,
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

    return jsonOk({ sale: result }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
