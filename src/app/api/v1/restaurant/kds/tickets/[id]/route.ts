import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { broadcastKitchenTicket } from "@/lib/kds-realtime";

const UpdateTicketSchema = z.object({
  status: z.enum(["new", "in_progress", "ready", "served", "canceled"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateTicketSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const { status } = parsed.data;

    const ticket = await prisma.kitchenTicket.findUnique({
      where: {
        tenantId_id: {
          tenantId: ctx.tenantId,
          id,
        },
      },
    });

    if (!ticket) {
      throw new AppError("TICKET_NOT_FOUND", "Kitchen ticket not found", 404);
    }

    const updated = await prisma.kitchenTicket.update({
      where: { id },
      data: {
        status,
        ...(status === "ready" ? { readyAt: new Date() } : {}),
        ...(status === "served" ? { servedAt: new Date() } : {}),
      },
      include: {
        items: true,
      },
    });

    // Broadcast update via Supabase Realtime
    broadcastKitchenTicket(ctx.tenantId, "ticket:updated", updated).catch((err) => {
      console.warn("[KDS Route] Broadcast update error:", err);
    });

    return jsonOk({ ticket: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
