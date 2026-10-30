import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";

const UpdateTableSchema = z.object({
  status: z.enum(["available", "occupied", "reserved", "billing"]).optional(),
  currentSaleId: z.string().uuid().nullable().optional(),
  name: z.string().optional(),
  capacity: z.number().int().min(1).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateTableSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const table = await prisma.diningTable.findUnique({
      where: {
        tenantId_id: {
          tenantId: ctx.tenantId,
          id,
        },
      },
    });

    if (!table) {
      throw new AppError("TABLE_NOT_FOUND", "Table not found", 404);
    }

    const updated = await prisma.diningTable.update({
      where: { id },
      data: parsed.data,
    });

    return jsonOk({ table: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
