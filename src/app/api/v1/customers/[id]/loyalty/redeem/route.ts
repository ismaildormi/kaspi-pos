import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { calculateDiscountForPoints } from "@/server/loyalty/engine";

const RedeemSchema = z.object({
  points: z.number().int().positive("Points to redeem must be a positive integer"),
  saleId: z.string().uuid().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await params;
    const body = await req.json();
    const parsed = RedeemSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const { points, saleId, idempotencyKey } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
      });

      if (!customer) {
        throw new AppError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
      }

      // Check current points balance
      const ledger = await tx.loyaltyPoint.findMany({
        where: {
          tenantId: ctx.tenantId,
          customerId: id,
        },
        select: { deltaPoints: true },
      });

      const currentBalance = ledger.reduce((sum, entry) => sum + entry.deltaPoints, 0);

      if (currentBalance < points) {
        throw new AppError(
          "INSUFFICIENT_POINTS",
          `Customer only has ${currentBalance} points, cannot redeem ${points} points`,
          400
        );
      }

      const key = idempotencyKey || `redeem_${id}_${Date.now()}`;

      // Insert redemption ledger entry (negative points)
      const record = await tx.loyaltyPoint.create({
        data: {
          tenantId: ctx.tenantId,
          customerId: id,
          saleId: saleId || null,
          deltaPoints: -points,
          reason: "redeem",
          idempotencyKey: key,
          actorUserId: ctx.userId,
        },
      });

      const newBalance = currentBalance - points;
      const discountGrantedMAD = calculateDiscountForPoints(points);

      return {
        record,
        newBalance,
        discountGrantedMAD,
      };
    });

    return jsonOk(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
