import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await params;

    const po = await prisma.purchaseOrder.findUnique({
      where: {
        tenantId_id: {
          tenantId: ctx.tenantId,
          id,
        },
      },
      include: {
        items: true,
      },
    });

    if (!po) {
      throw new AppError("PO_NOT_FOUND", "Purchase order not found", 404);
    }

    if (po.status === "received") {
      throw new AppError("ALREADY_RECEIVED", "Purchase order has already been received", 400);
    }

    if (po.status === "canceled") {
      throw new AppError("PO_CANCELED", "Cannot receive a canceled purchase order", 400);
    }

    // Process receiving atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark PO as received
      const updatedPo = await tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: "received",
          receivedAt: new Date(),
        },
      });

      // 2. For each item: record inventory movement and update stock level
      for (const item of po.items) {
        const movementKey = `po_rcv_${po.id}_${item.id}`;

        await tx.inventoryMovement.create({
          data: {
            tenantId: ctx.tenantId,
            storeId: po.storeId,
            productId: item.productId,
            movementType: "purchase",
            quantityDelta: item.quantity,
            unitCost: item.unitCost,
            referenceType: "purchase_order",
            referenceId: po.id,
            reason: `Reception of PO ${po.orderNumber}`,
            idempotencyKey: movementKey,
            createdBy: ctx.userId,
          },
        });

        // Upsert StockLevel
        await tx.stockLevel.upsert({
          where: {
            tenantId_storeId_productId: {
              tenantId: ctx.tenantId,
              storeId: po.storeId,
              productId: item.productId,
            },
          },
          update: {
            quantity: { increment: item.quantity },
          },
          create: {
            tenantId: ctx.tenantId,
            storeId: po.storeId,
            productId: item.productId,
            quantity: item.quantity,
          },
        });

        // Update product batch and expiry if specified
        if (item.batchNumber || item.expiryDate) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              ...(item.batchNumber ? { batchNumber: item.batchNumber } : {}),
              ...(item.expiryDate ? { expiryDate: item.expiryDate } : {}),
            },
          });
        }
      }

      return updatedPo;
    });

    return jsonOk({ purchaseOrder: result });
  } catch (err) {
    return handleApiError(err);
  }
}
