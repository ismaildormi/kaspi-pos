import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";

const CreateTableSchema = z.object({
  storeId: z.string().uuid("Invalid store ID"),
  tableNumber: z.string().min(1, "Table number required"),
  name: z.string().optional(),
  capacity: z.number().int().min(1).default(4),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");

    const tables = await prisma.diningTable.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(storeId ? { storeId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { tableNumber: "asc" },
    });

    return jsonOk({ tables, restaurantMode: ctx.activeTenant.restaurantMode });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = CreateTableSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const { storeId, tableNumber, name, capacity } = parsed.data;

    // Check store belongs to tenant
    const store = await prisma.store.findUnique({
      where: { tenantId_id: { tenantId: ctx.tenantId, id: storeId } },
    });
    if (!store) {
      throw new AppError("STORE_NOT_FOUND", "Store not found in tenant", 404);
    }

    const table = await prisma.diningTable.create({
      data: {
        tenantId: ctx.tenantId,
        storeId,
        tableNumber,
        name: name || null,
        capacity,
        status: "available",
      },
    });

    return jsonOk({ table }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
