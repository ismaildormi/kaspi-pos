import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError } from "@/server/http/response";
import { toDecimal, roundMoney } from "@/domain/money";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    const storeId = searchParams.get("storeId");

    // Default to start of today in tenant timezone if not specified
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const fromDate = fromStr ? new Date(fromStr) : defaultFrom;
    const toDate = toStr ? new Date(toStr) : now;

    const sales = await prisma.sale.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: "completed",
        ...(storeId ? { storeId } : {}),
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        id: true,
        subtotal: true,
        discountTotal: true,
        taxTotal: true,
        grandTotal: true,
        paymentMethod: true,
        createdAt: true,
      },
    });

    let grossTotal = toDecimal(0);
    let netTotal = toDecimal(0);
    let taxTotal = toDecimal(0);
    let discountTotal = toDecimal(0);
    const byMethod: Record<string, { count: number; total: string }> = {};

    for (const s of sales) {
      grossTotal = grossTotal.plus(toDecimal(s.grandTotal));
      netTotal = netTotal.plus(toDecimal(s.subtotal));
      taxTotal = taxTotal.plus(toDecimal(s.taxTotal));
      discountTotal = discountTotal.plus(toDecimal(s.discountTotal));

      const method = s.paymentMethod;
      if (!byMethod[method]) {
        byMethod[method] = { count: 1, total: toDecimal(s.grandTotal).toFixed(2) };
      } else {
        const cur = toDecimal(byMethod[method].total).plus(toDecimal(s.grandTotal));
        byMethod[method].count += 1;
        byMethod[method].total = cur.toFixed(2);
      }
    }

    const orderCount = sales.length;
    const averageTicket = orderCount > 0 ? roundMoney(grossTotal.dividedBy(orderCount)).toFixed(2) : "0.00";

    return jsonOk({
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      orderCount,
      grossSales: grossTotal.toFixed(2),
      netSales: netTotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      discountTotal: discountTotal.toFixed(2),
      averageTicket,
      currency: ctx.activeTenant.currency || "MAD",
      byPaymentMethod: byMethod,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
