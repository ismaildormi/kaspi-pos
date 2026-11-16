import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError } from "@/server/http/response";
import type {
  AnalyticsMetric,
  AnalyticsPoint,
  AnalyticsRange,
  AnalyticsSparklineSnapshot,
  AnalyticsSummary,
} from "@/lib/analytics/types";

interface BucketDef {
  key: string;
  label: string;
  fullDate: string;
  startMs: number;
  endMs: number;
}

const VALID_RANGES = new Set<AnalyticsRange>(["today", "7d", "30d", "all"]);
const VALID_METRICS = new Set<AnalyticsMetric>([
  "sales",
  "items",
  "cost_value",
  "retail_value",
  "alerts",
  "consigne",
  "payment_cash",
  "payment_card",
  "payment_credit",
]);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcDeltaPct(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function buildBuckets(range: AnalyticsRange, allStartDate: Date): BucketDef[] {
  const now = new Date();
  const buckets: BucketDef[] = [];

  if (range === "today") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    for (let h = 0; h < 24; h++) {
      const bStart = new Date(startOfDay.getTime() + h * 3600_000);
      const bEnd = new Date(bStart.getTime() + 3600_000 - 1);
      const hh = String(h).padStart(2, "0");
      buckets.push({
        key: `${hh}:00`,
        label: `${hh}:00`,
        fullDate: `${bStart.toISOString().slice(0, 10)} ${hh}:00`,
        startMs: bStart.getTime(),
        endMs: bEnd.getTime(),
      });
    }
    return buckets;
  }

  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 86_400_000);
      const dEnd = new Date(d.getTime() + 86_400_000 - 1);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.push({
        key: iso,
        label,
        fullDate: iso,
        startMs: d.getTime(),
        endMs: dEnd.getTime(),
      });
    }
    return buckets;
  }

  // range === "all": Monthly buckets from earliest tenant/sale date (minimum 6 months window)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const effectiveStart =
    allStartDate < sixMonthsAgo
      ? new Date(allStartDate.getFullYear(), allStartDate.getMonth(), 1)
      : sixMonthsAgo;

  // Cap monthly buckets at 24 months max so SVG axis stays crisp
  const cursor = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), 1);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cursor <= currentMonthStart && buckets.length < 24) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const nextMonth = new Date(year, month + 1, 1);
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      label: key,
      fullDate: key,
      startMs: cursor.getTime(),
      endMs: nextMonth.getTime() - 1,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

function findBucketIndex(ts: number, buckets: BucketDef[]): number {
  for (let i = 0; i < buckets.length; i++) {
    if (ts >= buckets[i].startMs && ts <= buckets[i].endMs) {
      return i;
    }
  }
  return -1;
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);

    const rawRange = (searchParams.get("range") || "7d") as AnalyticsRange;
    const range: AnalyticsRange = VALID_RANGES.has(rawRange) ? rawRange : "7d";

    const rawMetric = (searchParams.get("metric") || "sales") as AnalyticsMetric;
    const metric: AnalyticsMetric = VALID_METRICS.has(rawMetric) ? rawMetric : "sales";
    const storeId = searchParams.get("storeId");

    const now = new Date();
    const nowMs = now.getTime();
    const tenantCreatedAt = await prisma.tenant
      .findUnique({
        where: { id: ctx.tenantId },
        select: { createdAt: true },
      })
      .then((t) => t?.createdAt ?? new Date(now.getFullYear(), now.getMonth() - 5, 1))
      .catch(() => new Date(now.getFullYear(), now.getMonth() - 5, 1));

    const buckets = buildBuckets(range, tenantCreatedAt);
    const windowStart = new Date(buckets[0].startMs);
    const windowSpanMs = Math.max(86_400_000, nowMs - buckets[0].startMs);
    const prevWindowStart = new Date(buckets[0].startMs - windowSpanMs);

    // Fetch current + prior period real sales, catalog stock, and inventory movements in parallel
    const [sales, priorSales, products, movements] = await Promise.all([
      prisma.sale
        .findMany({
          where: {
            tenantId: ctx.tenantId,
            status: "completed",
            ...(storeId ? { storeId } : {}),
            createdAt: { gte: windowStart, lte: now },
          },
          select: {
            id: true,
            grandTotal: true,
            paymentMethod: true,
            createdAt: true,
            completedAt: true,
            payments: {
              select: { method: true, amount: true },
            },
            items: {
              select: { quantity: true, lineTotal: true, costSnapshot: true },
            },
          },
          orderBy: { createdAt: "asc" },
        })
        .catch(() => []),
      prisma.sale
        .findMany({
          where: {
            tenantId: ctx.tenantId,
            status: "completed",
            ...(storeId ? { storeId } : {}),
            createdAt: { gte: prevWindowStart, lt: windowStart },
          },
          select: {
            grandTotal: true,
            paymentMethod: true,
            payments: { select: { method: true, amount: true } },
            items: { select: { quantity: true } },
          },
        })
        .catch(() => []),
      prisma.product
        .findMany({
          where: { tenantId: ctx.tenantId, isActive: true, deletedAt: null },
          select: {
            id: true,
            costPrice: true,
            salePrice: true,
            lowStockThreshold: true,
            expiryDate: true,
            stockLevels: {
              select: { quantity: true },
            },
          },
        })
        .catch(() => []),
      prisma.inventoryMovement
        .findMany({
          where: {
            tenantId: ctx.tenantId,
            ...(storeId ? { storeId } : {}),
            createdAt: { gte: windowStart, lte: now },
          },
          select: {
            movementType: true,
            quantityDelta: true,
            unitCost: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        })
        .catch(() => []),
    ]);

    // Real current inventory snapshots
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let totalUnits = 0;
    let lowStockCount = 0;
    let expiringSoonCount = 0;
    const sevenDaysFromNowMs = nowMs + 7 * 86_400_000;

    for (const p of products) {
      const qty = p.stockLevels.reduce((acc, s) => acc + Number(s.quantity || 0), 0);
      const cost = Number(p.costPrice || 0);
      const salePrice = Number(p.salePrice || 0);
      const threshold = Number(p.lowStockThreshold ?? 5);

      if (qty > 0) {
        totalUnits += qty;
        totalCostValue += cost * qty;
        totalRetailValue += salePrice * qty;
      }
      if (qty <= threshold) {
        lowStockCount += 1;
      }
      if (p.expiryDate && p.expiryDate.getTime() <= sevenDaysFromNowMs) {
        expiringSoonCount += 1;
      }
    }

    totalCostValue = round2(totalCostValue);
    totalRetailValue = round2(totalRetailValue);
    const marginMad = round2(Math.max(0, totalRetailValue - totalCostValue));
    const marginPct =
      totalRetailValue > 0 ? round2((marginMad / totalRetailValue) * 100) : 0;

    // Accumulate bucket values per series
    const salesPerBucket = new Array<number>(buckets.length).fill(0);
    const countPerBucket = new Array<number>(buckets.length).fill(0);
    const itemsPerBucket = new Array<number>(buckets.length).fill(0);
    const cashPerBucket = new Array<number>(buckets.length).fill(0);
    const cardPerBucket = new Array<number>(buckets.length).fill(0);
    const creditPerBucket = new Array<number>(buckets.length).fill(0);
    const costPerBucket = new Array<number>(buckets.length).fill(0);
    const alertsPerBucket = new Array<number>(buckets.length).fill(0);
    const consignePerBucket = new Array<number>(buckets.length).fill(0);

    let cashTotal = 0;
    let cardTotal = 0;
    let creditTotal = 0;
    let totalSalesValue = 0;
    let totalItemsQty = 0;

    for (const sale of sales) {
      const ts = (sale.completedAt || sale.createdAt).getTime();
      const idx = findBucketIndex(ts, buckets);
      const gross = Number(sale.grandTotal || 0);
      totalSalesValue += gross;

      const qtySum = sale.items.reduce((a, it) => a + Number(it.quantity || 0), 0);
      const costSum = sale.items.reduce(
        (a, it) => a + Number(it.costSnapshot || 0) * Number(it.quantity || 0),
        0
      );
      totalItemsQty += qtySum;

      let sCash = 0;
      let sCard = 0;
      let sCredit = 0;
      if (sale.payments.length > 0) {
        for (const p of sale.payments) {
          const amt = Number(p.amount || 0);
          if (p.method === "cash") sCash += amt;
          else if (p.method === "card") sCard += amt;
          else if (p.method === "credit") sCredit += amt;
        }
      } else {
        if (sale.paymentMethod === "cash") sCash = gross;
        else if (sale.paymentMethod === "card") sCard = gross;
        else if (sale.paymentMethod === "credit") sCredit = gross;
      }

      cashTotal += sCash;
      cardTotal += sCard;
      creditTotal += sCredit;

      if (idx >= 0) {
        salesPerBucket[idx] += gross;
        countPerBucket[idx] += 1;
        itemsPerBucket[idx] += qtySum;
        cashPerBucket[idx] += sCash;
        cardPerBucket[idx] += sCard;
        creditPerBucket[idx] += sCredit;
        costPerBucket[idx] += costSum;
      }
    }

    for (const m of movements) {
      const idx = findBucketIndex(m.createdAt.getTime(), buckets);
      if (idx >= 0) {
        const absQty = Math.abs(Number(m.quantityDelta || 0));
        if (m.movementType === "waste" || m.movementType === "adjustment") {
          alertsPerBucket[idx] += absQty;
        }
        if (m.movementType === "purchase" || m.movementType === "return") {
          consignePerBucket[idx] += Number(m.quantityDelta || 0);
        }
        if (m.unitCost) {
          costPerBucket[idx] += absQty * Number(m.unitCost);
        }
      }
    }

    // Reconstruct historical stock cost/retail trajectory cleanly by walking backwards from real current valuation
    const costSeries = new Array<number>(buckets.length).fill(totalCostValue);
    const retailSeries = new Array<number>(buckets.length).fill(totalRetailValue);
    if (buckets.length > 1) {
      let runningRetail = totalRetailValue;
      let runningCost = totalCostValue;
      for (let i = buckets.length - 1; i >= 0; i--) {
        retailSeries[i] = round2(Math.max(0, runningRetail));
        costSeries[i] = round2(Math.max(0, runningCost));
        runningRetail = Math.max(0, runningRetail - salesPerBucket[i] * 0.25);
        runningCost = Math.max(0, runningCost - costPerBucket[i]);
      }
    }

    // Select series for requested metric
    const getSeriesByMetric = (m: AnalyticsMetric): number[] => {
      switch (m) {
        case "items":
          return itemsPerBucket;
        case "cost_value":
          return costSeries;
        case "retail_value":
          return retailSeries;
        case "alerts":
          return alertsPerBucket.map((v) => v + lowStockCount);
        case "consigne":
          return consignePerBucket;
        case "payment_cash":
          return cashPerBucket;
        case "payment_card":
          return cardPerBucket;
        case "payment_credit":
          return creditPerBucket;
        case "sales":
        default:
          return salesPerBucket;
      }
    };

    const primarySeries = getSeriesByMetric(metric);
    const points: AnalyticsPoint[] = buckets.map((b, i) => {
      const val = round2(primarySeries[i] ?? 0);
      const prev = i > 0 ? round2(primarySeries[i - 1] ?? 0) : null;
      return {
        key: b.key,
        label: b.label,
        fullDate: b.fullDate,
        value: val,
        secondaryValue: round2(
          metric === "cost_value"
            ? retailSeries[i] ?? 0
            : metric === "retail_value"
            ? costSeries[i] ?? 0
            : itemsPerBucket[i] ?? 0
        ),
        count: countPerBucket[i] ?? 0,
        deltaPct: prev !== null ? calcDeltaPct(val, prev) : null,
      };
    });

    // Previous period comparison totals
    let prevTotal = 0;
    for (const ps of priorSales) {
      const gross = Number(ps.grandTotal || 0);
      if (metric === "items") {
        prevTotal += ps.items.reduce((a, it) => a + Number(it.quantity || 0), 0);
      } else if (metric === "payment_cash") {
        prevTotal +=
          ps.payments.length > 0
            ? ps.payments.filter((p) => p.method === "cash").reduce((a, p) => a + Number(p.amount), 0)
            : ps.paymentMethod === "cash"
            ? gross
            : 0;
      } else if (metric === "payment_card") {
        prevTotal +=
          ps.payments.length > 0
            ? ps.payments.filter((p) => p.method === "card").reduce((a, p) => a + Number(p.amount), 0)
            : ps.paymentMethod === "card"
            ? gross
            : 0;
      } else if (metric === "payment_credit") {
        prevTotal +=
          ps.payments.length > 0
            ? ps.payments.filter((p) => p.method === "credit").reduce((a, p) => a + Number(p.amount), 0)
            : ps.paymentMethod === "credit"
            ? gross
            : 0;
      } else {
        prevTotal += gross;
      }
    }

    const totalForMetric = (() => {
      switch (metric) {
        case "items":
          return round2(totalItemsQty);
        case "cost_value":
          return totalCostValue;
        case "retail_value":
          return totalRetailValue;
        case "alerts":
          return lowStockCount + expiringSoonCount;
        case "consigne":
          return round2(consignePerBucket.reduce((a, v) => a + v, 0));
        case "payment_cash":
          return round2(cashTotal);
        case "payment_card":
          return round2(cardTotal);
        case "payment_credit":
          return round2(creditTotal);
        case "sales":
        default:
          return round2(totalSalesValue);
      }
    })();

    let peakLabel = points[0]?.label || "--";
    let peakValue = 0;
    for (const pt of points) {
      if (pt.value > peakValue) {
        peakValue = pt.value;
        peakLabel = pt.label;
      }
    }

    const summary: AnalyticsSummary = {
      totalValue: totalForMetric,
      previousPeriodValue: round2(prevTotal),
      deltaPct: calcDeltaPct(totalForMetric, prevTotal),
      peakLabel,
      peakValue: round2(peakValue),
      transactionCount: sales.length,
      averageBasket:
        sales.length > 0 ? round2(totalSalesValue / sales.length) : 0,
      costValue: totalCostValue,
      retailValue: totalRetailValue,
      marginMad,
      marginPct,
      cashTotal: round2(cashTotal),
      cardTotal: round2(cardTotal),
      creditTotal: round2(creditTotal),
      lowStockCount,
      expiringSoonCount,
      totalSkus: products.length,
      totalUnits: round2(totalUnits),
    };

    const sparkMetrics: AnalyticsMetric[] = [
      "sales",
      "items",
      "cost_value",
      "retail_value",
      "alerts",
      "payment_cash",
      "payment_card",
      "payment_credit",
    ];
    const sparklines: Partial<Record<AnalyticsMetric, AnalyticsSparklineSnapshot>> = {};
    for (const sm of sparkMetrics) {
      const series = getSeriesByMetric(sm);
      const tail = series.slice(-10).map(round2);
      const last = tail[tail.length - 1] ?? 0;
      const prev = tail[tail.length - 2] ?? 0;
      sparklines[sm] = {
        values: tail,
        deltaPct: calcDeltaPct(last, prev),
        currentValue: round2(series.reduce((a, v) => a + v, 0)),
      };
    }

    return jsonOk({
      metric,
      range,
      currency: ctx.activeTenant.currency || "MAD",
      points,
      summary,
      sparklines,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
