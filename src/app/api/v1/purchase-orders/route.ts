import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toDecimal, toPrismaDecimal, toPrismaQtyDecimal, roundMoney } from "@/domain/money";

const POItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.union([z.string(), z.number()]),
  unitCost: z.union([z.string(), z.number()]),
  taxRate: z.union([z.string(), z.number()]).optional().default(20.00),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(), // YYYY-MM-DD
});

const CreatePOSchema = z.object({
  storeId: z.string().uuid("Invalid store ID"),
  supplierId: z.string().uuid("Invalid supplier ID"),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
  items: z.array(POItemSchema).min(1, "Purchase order must contain at least one item"),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        supplier: {
          select: { id: true, name: true, phone: true, ice: true },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ purchaseOrders });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = CreatePOSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const { storeId, supplierId, notes, idempotencyKey, items } = parsed.data;

    // Check store exists in tenant
    const store = await prisma.store.findUnique({
      where: { tenantId_id: { tenantId: ctx.tenantId, id: storeId } },
    });
    if (!store) {
      throw new AppError("STORE_NOT_FOUND", "Store not found in tenant", 404);
    }

    // Check supplier exists in tenant
    const supplier = await prisma.supplier.findUnique({
      where: { tenantId_id: { tenantId: ctx.tenantId, id: supplierId } },
    });
    if (!supplier) {
      throw new AppError("SUPPLIER_NOT_FOUND", "Supplier not found in tenant", 404);
    }

    // Verify all products belong to tenant
    const productIds = items.map((i) => i.productId);
    const existingProducts = await prisma.product.findMany({
      where: {
        tenantId: ctx.tenantId,
        id: { in: productIds },
      },
    });

    if (existingProducts.length !== productIds.length) {
      throw new AppError("PRODUCT_NOT_FOUND", "One or more products do not exist in this tenant", 404);
    }

    // Compute totals
    let totalCostSum = toDecimal(0);
    let totalTaxSum = toDecimal(0);

    const preparedItems = items.map((item) => {
      const qty = toDecimal(item.quantity);
      const unitCost = toDecimal(item.unitCost);
      const taxRate = toDecimal(item.taxRate);

      const lineCost = roundMoney(qty.times(unitCost));
      const lineTax = roundMoney(lineCost.times(taxRate).dividedBy(100));

      totalCostSum = totalCostSum.plus(lineCost);
      totalTaxSum = totalTaxSum.plus(lineTax);

      return {
        productId: item.productId,
        quantity: toPrismaQtyDecimal(qty),
        unitCost: toPrismaDecimal(unitCost),
        taxRate: toPrismaDecimal(taxRate),
        totalCost: toPrismaDecimal(lineCost),
        batchNumber: item.batchNumber || null,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
      };
    });

    const orderNumber = `PO-${Date.now().toString().slice(-6)}`;

    // Create purchase order and items in a transaction
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        tenantId: ctx.tenantId,
        storeId,
        supplierId,
        orderNumber,
        status: "ordered",
        orderedAt: new Date(),
        totalAmount: toPrismaDecimal(totalCostSum.plus(totalTaxSum)),
        taxAmount: toPrismaDecimal(totalTaxSum),
        notes: notes || null,
        idempotencyKey: idempotencyKey || null,
        items: {
          create: preparedItems,
        },
      },
      include: {
        items: true,
        supplier: true,
      },
    });

    return jsonOk({ purchaseOrder }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
