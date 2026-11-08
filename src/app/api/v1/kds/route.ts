import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toPrismaQtyDecimal, toDecimal } from "@/domain/money";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
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

    const [tables, tickets] = await Promise.all([
      prisma.diningTable.findMany({
        where: { tenantId: ctx.tenantId, storeId: store.id },
        orderBy: { tableNumber: "asc" },
      }),
      prisma.kitchenTicket.findMany({
        where: {
          tenantId: ctx.tenantId,
          storeId: store.id,
          status: { in: ["new", "in_progress", "ready"] },
        },
        include: {
          table: { select: { tableNumber: true, name: true } },
          items: true,
        },
        orderBy: { sentAt: "desc" },
        take: 30,
      }),
    ]);

    return jsonOk({
      tables,
      tickets: tickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        status: t.status,
        tableId: t.tableId,
        tableName: t.table?.name || t.table?.tableNumber || "Comptoir / Takeaway",
        notes: t.notes,
        sentAt: t.sentAt.toISOString(),
        readyAt: t.readyAt ? t.readyAt.toISOString() : null,
        items: t.items.map((it) => ({
          id: it.id,
          productName: it.productName,
          quantity: Number(it.quantity),
          status: it.status,
          notes: it.notes,
        })),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();

    const store = await prisma.store.findFirst({
      where: { tenantId: ctx.tenantId, isActive: true },
    });
    if (!store) {
      throw new AppError("STORE_NOT_FOUND", "No active store found", 404);
    }

    // Action 1: Update status of an existing KDS ticket (new -> in_progress -> ready -> served)
    if (body.action === "update_status" && body.ticketId) {
      const rawStatus = body.status === "preparing" ? "in_progress" : body.status;
      const nextStatus = rawStatus as "new" | "in_progress" | "ready" | "served";
      const updated = await prisma.kitchenTicket.update({
        where: { id: body.ticketId },
        data: {
          status: nextStatus,
          ...(nextStatus === "ready" ? { readyAt: new Date() } : {}),
          ...(nextStatus === "served" ? { servedAt: new Date() } : {}),
        },
      });

      if (nextStatus === "served" && updated.tableId) {
        await prisma.diningTable
          .update({
            where: { id: updated.tableId },
            data: { status: "available" },
          })
          .catch(() => {});
      }

      return jsonOk({ ticket: updated });
    }

    // Action 2: Dispatch a new order from POS cart to KDS
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      throw new AppError("EMPTY_TICKET", "Cannot send an empty order to KDS", 400);
    }

    const ticketNumber = `KDS-${Date.now().toString().slice(-5)}`;
    const tableId = body.tableId || null;

    const createdTicket = await prisma.kitchenTicket.create({
      data: {
        tenantId: ctx.tenantId,
        storeId: store.id,
        tableId,
        ticketNumber,
        status: "new",
        notes: body.notes || null,
        items: {
          create: items.map((item: any) => ({
            tenantId: ctx.tenantId,
            productId: item.productId || null,
            productName: item.name || "Article",
            quantity: toPrismaQtyDecimal(toDecimal(item.quantity || 1)),
            status: "pending",
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    if (tableId) {
      await prisma.diningTable
        .update({
          where: { id: tableId },
          data: { status: "occupied" },
        })
        .catch(() => {});
    }

    return jsonOk({ ticket: createdTicket }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
