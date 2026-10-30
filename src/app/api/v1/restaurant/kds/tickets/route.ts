import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toPrismaQtyDecimal } from "@/domain/money";

const KDSTicketItemSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1, "Product name required"),
  quantity: z.union([z.string(), z.number()]),
  notes: z.string().optional(),
});

const CreateKDSTicketSchema = z.object({
  storeId: z.string().uuid("Invalid store ID"),
  tableId: z.string().uuid().optional(),
  saleId: z.string().uuid().optional(),
  notes: z.string().optional(),
  items: z.array(KDSTicketItemSchema).min(1, "Ticket must have at least one item"),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");

    const tickets = await prisma.kitchenTicket.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(storeId ? { storeId } : {}),
        ...(status
          ? { status: status as any }
          : { status: { in: ["new", "in_progress", "ready"] } }),
      },
      include: {
        items: true,
        table: {
          select: { id: true, tableNumber: true, name: true },
        },
      },
      orderBy: { sentAt: "asc" },
    });

    return jsonOk({ tickets });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = CreateKDSTicketSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const { storeId, tableId, saleId, notes, items } = parsed.data;

    // Check store exists in tenant
    const store = await prisma.store.findUnique({
      where: { tenantId_id: { tenantId: ctx.tenantId, id: storeId } },
    });
    if (!store) {
      throw new AppError("STORE_NOT_FOUND", "Store not found in tenant", 404);
    }

    const ticketNumber = `K-${Date.now().toString().slice(-4)}`;

    const ticket = await prisma.kitchenTicket.create({
      data: {
        tenantId: ctx.tenantId,
        storeId,
        tableId: tableId || null,
        saleId: saleId || null,
        ticketNumber,
        status: "new",
        notes: notes || null,
        items: {
          create: items.map((item) => ({
            productId: item.productId || null,
            productName: item.productName,
            quantity: toPrismaQtyDecimal(item.quantity),
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    return jsonOk({ ticket }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
