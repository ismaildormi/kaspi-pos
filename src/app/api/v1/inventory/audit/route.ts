import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toDecimal, toPrismaQtyDecimal } from "@/domain/money";

const StockAuditSchema = z.object({
  productId: z.string().uuid(),
  mode: z.enum(["set_counted", "delta"]).default("set_counted"),
  countedQuantity: z.union([z.number(), z.string()]).optional(),
  quantityDelta: z.union([z.number(), z.string()]).optional(),
  movementType: z
    .enum(["adjustment", "purchase", "waste", "return"])
    .default("adjustment"),
  reason: z.string().max(250).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = StockAuditSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid stock audit payload",
        422
      );
    }

    const { productId, mode, countedQuantity, quantityDelta, movementType, reason } =
      parsed.data;

    let store = await prisma.store.findFirst({
      where: { tenantId: ctx.tenantId, isActive: true },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          tenantId: ctx.tenantId,
          name: "Magasin Principal",
          code: "MAIN-01",
          isActive: true,
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: {
          tenantId_id: {
            tenantId: ctx.tenantId,
            id: productId,
          },
        },
      });

      if (!product) {
        throw new AppError("PRODUCT_NOT_FOUND", "Product not found", 404);
      }

      const existingLevel = await tx.stockLevel.findUnique({
        where: {
          tenantId_storeId_productId: {
            tenantId: ctx.tenantId,
            storeId: store!.id,
            productId: product.id,
          },
        },
      });

      const currentQty = toDecimal(existingLevel?.quantity || 0);
      let newQty = currentQty;
      let delta = toDecimal(0);

      if (mode === "set_counted") {
        if (countedQuantity === undefined) {
          throw new AppError(
            "MISSING_COUNT",
            "countedQuantity is required when mode is set_counted",
            400
          );
        }
        newQty = toDecimal(countedQuantity);
        delta = newQty.minus(currentQty);
      } else {
        if (quantityDelta === undefined) {
          throw new AppError(
            "MISSING_DELTA",
            "quantityDelta is required when mode is delta",
            400
          );
        }
        delta = toDecimal(quantityDelta);
        newQty = currentQty.plus(delta);
      }

      const updatedStock = await tx.stockLevel.upsert({
        where: {
          tenantId_storeId_productId: {
            tenantId: ctx.tenantId,
            storeId: store!.id,
            productId: product.id,
          },
        },
        update: {
          quantity: toPrismaQtyDecimal(newQty),
        },
        create: {
          tenantId: ctx.tenantId,
          storeId: store!.id,
          productId: product.id,
          quantity: toPrismaQtyDecimal(newQty),
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          tenantId: ctx.tenantId,
          storeId: store!.id,
          productId: product.id,
          movementType,
          quantityDelta: toPrismaQtyDecimal(delta),
          referenceType: "stock_audit",
          reason:
            reason?.trim() ||
            (mode === "set_counted"
              ? `Inventaire physique: ${currentQty.toFixed(2)} -> ${newQty.toFixed(2)}`
              : `Ajustement manuel (${movementType})`),
          idempotencyKey: `audit_${crypto.randomUUID()}`,
          createdBy: ctx.userId || null,
        },
      });

      return {
        productId: product.id,
        productName: product.name,
        previousQuantity: Number(currentQty.toFixed(3)),
        newQuantity: Number(newQty.toFixed(3)),
        delta: Number(delta.toFixed(3)),
        stockLevelId: updatedStock.id,
        movementId: movement.id,
      };
    });

    return jsonOk(result, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
