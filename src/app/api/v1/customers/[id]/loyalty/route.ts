import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { calculateDiscountForPoints } from "@/server/loyalty/engine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: {
        tenantId_id: {
          tenantId: ctx.tenantId,
          id,
        },
      },
      select: { id: true, name: true, phone: true },
    });

    if (!customer) {
      throw new AppError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
    }

    const pointsLedger = await prisma.loyaltyPoint.findMany({
      where: {
        tenantId: ctx.tenantId,
        customerId: id,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalPoints = pointsLedger.reduce((sum, entry) => sum + entry.deltaPoints, 0);
    const redeemableValueMAD = calculateDiscountForPoints(totalPoints);

    return jsonOk({
      customer,
      totalPoints,
      redeemableValueMAD,
      history: pointsLedger,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
