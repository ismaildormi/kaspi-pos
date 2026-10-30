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

    const now = new Date();
    const fromDate = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = toStr ? new Date(toStr) : now;

    const saleItems = await prisma.saleItem.findMany({
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
        taxRate: true,
        netAmount: true,
        taxAmount: true,
        lineTotal: true,
      },
    });

    const taxSummary: Record<
      string,
      { ratePercent: string; baseHT: string; taxCollected: string; totalTTC: string }
    > = {};

    let totalBaseHT = toDecimal(0);
    let totalTaxCollected = toDecimal(0);
    let grandTotalTTC = toDecimal(0);

    for (const item of saleItems) {
      const rateKey = `${toDecimal(item.taxRate).toFixed(0)}%`;
      const net = toDecimal(item.netAmount);
      const tax = toDecimal(item.taxAmount);
      const total = toDecimal(item.lineTotal);

      totalBaseHT = totalBaseHT.plus(net);
      totalTaxCollected = totalTaxCollected.plus(tax);
      grandTotalTTC = grandTotalTTC.plus(total);

      if (!taxSummary[rateKey]) {
        taxSummary[rateKey] = {
          ratePercent: rateKey,
          baseHT: net.toFixed(2),
          taxCollected: tax.toFixed(2),
          totalTTC: total.toFixed(2),
        };
      } else {
        const curBase = toDecimal(taxSummary[rateKey].baseHT).plus(net);
        const curTax = toDecimal(taxSummary[rateKey].taxCollected).plus(tax);
        const curTotal = toDecimal(taxSummary[rateKey].totalTTC).plus(total);

        taxSummary[rateKey] = {
          ratePercent: rateKey,
          baseHT: curBase.toFixed(2),
          taxCollected: curTax.toFixed(2),
          totalTTC: curTotal.toFixed(2),
        };
      }
    }

    return jsonOk({
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      rates: Object.values(taxSummary),
      totals: {
        baseHT: roundMoney(totalBaseHT).toFixed(2),
        taxCollected: roundMoney(totalTaxCollected).toFixed(2),
        grandTotalTTC: roundMoney(grandTotalTTC).toFixed(2),
      },
      currency: ctx.activeTenant.currency || "MAD",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
