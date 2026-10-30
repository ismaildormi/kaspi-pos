import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError } from "@/server/http/response";
import { toDecimal } from "@/domain/money";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const now = new Date();
    const fromDate = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1); // 1st of current month
    const toDate = toStr ? new Date(toStr) : now;

    const items = await prisma.saleItem.findMany({
      where: {
        tenantId: ctx.tenantId,
        sale: {
          status: "completed",
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
      },
      select: {
        productId: true,
        productNameSnapshot: true,
        skuSnapshot: true,
        quantity: true,
        lineTotal: true,
      },
    });

    const productMap = new Map<
      string,
      { name: string; sku: string | null; quantity: number; revenue: number }
    >();

    for (const item of items) {
      const key = item.productId || item.productNameSnapshot;
      const current = productMap.get(key) || {
        name: item.productNameSnapshot,
        sku: item.skuSnapshot,
        quantity: 0,
        revenue: 0,
      };

      current.quantity += toDecimal(item.quantity).toNumber();
      current.revenue += toDecimal(item.lineTotal).toNumber();
      productMap.set(key, current);
    }

    const sortedProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map((p) => ({
        ...p,
        quantity: parseFloat(p.quantity.toFixed(3)),
        revenue: parseFloat(p.revenue.toFixed(2)),
      }));

    return jsonOk({
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      topProducts: sortedProducts,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
