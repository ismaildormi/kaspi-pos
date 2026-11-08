import { NextRequest } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, jsonError, handleApiError } from "@/server/http/response";
import { closeCashShift } from "@/server/cash-shift/engine";

const CloseShiftSchema = z.object({
  countedCash: z.union([z.number(), z.string()]),
  closingNotes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await context.params;
    const body = await req.json();
    const parsed = CloseShiftSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const summary = await closeCashShift({
      tenantId: ctx.tenantId,
      sessionId: id,
      userId: ctx.userId,
      countedCash: parsed.data.countedCash,
      closingNotes: parsed.data.closingNotes,
    });

    return jsonOk({ session: summary });
  } catch (err: any) {
    return handleApiError(err);
  }
}
