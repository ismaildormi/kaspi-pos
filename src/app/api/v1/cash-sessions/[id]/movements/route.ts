import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, jsonError, handleApiError } from "@/server/http/response";
import { recordCashMovement } from "@/server/cash-shift/engine";

const MovementSchema = z.object({
  type: z.enum(["cash_in", "cash_out", "supplier_payout", "petty_cash"]),
  amount: z.union([z.number(), z.string()]),
  reason: z.string().min(1, "La raison du mouvement est requise"),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await context.params;
    const body = await req.json();
    const parsed = MovementSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { fullName: true, email: true },
    });

    const summary = await recordCashMovement({
      tenantId: ctx.tenantId,
      sessionId: id,
      userId: ctx.userId,
      userName: user?.fullName || user?.email || "Caissier",
      type: parsed.data.type,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
    });

    return jsonOk({ session: summary });
  } catch (err: any) {
    return handleApiError(err);
  }
}
