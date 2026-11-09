import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toDecimal, toPrismaQtyDecimal } from "@/domain/money";

const CreateTransferSchema = z.object({
  sourceStoreId: z.string().uuid("Invalid source store ID"),
  destStoreId: z.string().uuid("Invalid destination store ID"),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid("Invalid product ID"),
      quantity: z.union([z.string(), z.number()]),
    })
  ).min(1, "At least one item is required for transfer"),
});

export async function GET(_req: NextRequest) {
  try {
    const ctx = await getRequestContext();

    const transfers = await prisma.stockTransfer.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        sourceStore: { select: { id: true, name: true, code: true } },
        destStore: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, barcode: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return jsonOk({ transfers });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = CreateTransferSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const { sourceStoreId, destStoreId, notes, items } = parsed.data;

    if (sourceStoreId === destStoreId) {
      throw new AppError("INVALID_TRANSFER", "Source and destination store cannot be the same", 400);
    }

    const transferNumber = `TRF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create StockTransfer record
      const transfer = await tx.stockTransfer.create({
        data: {
          tenantId: ctx.tenantId,
          transferNumber,
          sourceStoreId,
          destStoreId,
          status: "completed",
          notes: notes || null,
          shippedAt: new Date(),
          receivedAt: new Date(),
        },
      });

      // 2. Process each item: decrement source, increment destination, create transfer item
      for (const item of items) {
        const qtyDec = toDecimal(item.quantity);

        // Record transfer item
        await tx.stockTransferItem.create({
          data: {
            tenantId: ctx.tenantId,
            transferId: transfer.id,
            productId: item.productId,
            quantity: toPrismaQtyDecimal(qtyDec),
            receivedQty: toPrismaQtyDecimal(qtyDec),
          },
        });

        // Decrement source store stock
        await tx.stockLevel.upsert({
          where: {
            tenantId_storeId_productId: {
              tenantId: ctx.tenantId,
              storeId: sourceStoreId,
              productId: item.productId,
            },
          },
          update: {
            quantity: { decrement: toPrismaQtyDecimal(qtyDec) },
          },
          create: {
            tenantId: ctx.tenantId,
            storeId: sourceStoreId,
            productId: item.productId,
            quantity: toPrismaQtyDecimal(qtyDec.negated()),
          },
        });

        // Record source movement: transfer_out
        await tx.inventoryMovement.create({
          data: {
            tenantId: ctx.tenantId,
            storeId: sourceStoreId,
            productId: item.productId,
            movementType: "transfer_out",
            quantityDelta: toPrismaQtyDecimal(qtyDec.negated()),
            referenceType: "transfer",
            referenceId: transfer.id,
            reason: `Transfert vers ${destStoreId} (${transfer.transferNumber})`,
            idempotencyKey: `mv_trf_out_${transfer.id}_${item.productId}`,
            createdBy: ctx.userId,
          },
        });

        // Increment destination store stock
        await tx.stockLevel.upsert({
          where: {
            tenantId_storeId_productId: {
              tenantId: ctx.tenantId,
              storeId: destStoreId,
              productId: item.productId,
            },
          },
          update: {
            quantity: { increment: toPrismaQtyDecimal(qtyDec) },
          },
          create: {
            tenantId: ctx.tenantId,
            storeId: destStoreId,
            productId: item.productId,
            quantity: toPrismaQtyDecimal(qtyDec),
          },
        });

        // Record destination movement: transfer_in
        await tx.inventoryMovement.create({
          data: {
            tenantId: ctx.tenantId,
            storeId: destStoreId,
            productId: item.productId,
            movementType: "transfer_in",
            quantityDelta: toPrismaQtyDecimal(qtyDec),
            referenceType: "transfer",
            referenceId: transfer.id,
            reason: `Transfert reçu depuis ${sourceStoreId} (${transfer.transferNumber})`,
            idempotencyKey: `mv_trf_in_${transfer.id}_${item.productId}`,
            createdBy: ctx.userId,
          },
        });
      }

      return transfer;
    });

    return jsonOk({ success: true, transfer: result });
  } catch (err) {
    return handleApiError(err);
  }
}
