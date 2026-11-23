export interface EoqItemInput {
  sku: string;
  name: string;
  annualDemandUnits: number;
  orderingCostMad: number;
  holdingCostPerUnitYearMad: number;
  leadTimeDays: number;
  dailyStdDevUnits?: number;
}

export interface EoqItemResult {
  sku: string;
  name: string;
  optimalOrderQtyEoq: number;
  ordersPerYear: number;
  safetyStockUnits: number;
  reorderPointUnits: number;
  totalAnnualInventoryCostMad: number;
}

/**
 * Dominance v90.3 Part A: Exact Wilson EOQ & Safety Stock Optimizer (OR-Tools pattern).
 */
export function computeInventoryEoqAndSafetyStock(items: EoqItemInput[], serviceLevelZ = 1.645): EoqItemResult[] {
  return (items || []).map((item) => {
    const D = Math.max(1, Number(item.annualDemandUnits || 0));
    const S = Math.max(1, Number(item.orderingCostMad || 0));
    const H = Math.max(0.01, Number(item.holdingCostPerUnitYearMad || 0.01));
    const L = Math.max(1, Number(item.leadTimeDays || 1));
    const dailyMean = D / 365;
    const sigma = Number.isFinite(item.dailyStdDevUnits) ? Math.max(0, item.dailyStdDevUnits!) : dailyMean * 0.25;

    const eoq = Math.max(1, Math.round(Math.sqrt((2 * D * S) / H)));
    const safetyStock = Math.max(0, Math.ceil(serviceLevelZ * sigma * Math.sqrt(L)));
    const reorderPoint = Math.ceil(dailyMean * L + safetyStock);
    const totalAnnualCost = Number(((D / eoq) * S + (eoq / 2 + safetyStock) * H).toFixed(2));

    return {
      sku: item.sku,
      name: item.name,
      optimalOrderQtyEoq: eoq,
      ordersPerYear: Number((D / eoq).toFixed(2)),
      safetyStockUnits: safetyStock,
      reorderPointUnits: reorderPoint,
      totalAnnualInventoryCostMad: totalAnnualCost,
    };
  });
}

export interface BasketRuleResult {
  antecedent: string;
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
}

/**
 * Dominance v90.3 Part B: Apriori-style Market-Basket Association Rule Miner.
 */
export function runMarketBasketApriori(baskets: string[][], minSupport = 0.2, minConfidence = 0.5): BasketRuleResult[] {
  const cleanBaskets = (baskets || [])
    .map((b) => Array.from(new Set(b.map((x) => String(x).trim()).filter(Boolean))))
    .filter((b) => b.length > 0);
  const n = cleanBaskets.length;
  if (n === 0) return [];

  const singleCounts = new Map<string, number>();
  const pairCounts = new Map<string, number>();

  for (const basket of cleanBaskets) {
    for (let i = 0; i < basket.length; i++) {
      const a = basket[i];
      singleCounts.set(a, (singleCounts.get(a) || 0) + 1);
      for (let j = i + 1; j < basket.length; j++) {
        const b = basket[j];
        const key1 = `${a}\u0000${b}`;
        const key2 = `${b}\u0000${a}`;
        pairCounts.set(key1, (pairCounts.get(key1) || 0) + 1);
        pairCounts.set(key2, (pairCounts.get(key2) || 0) + 1);
      }
    }
  }

  const rules: BasketRuleResult[] = [];
  for (const [key, abCount] of pairCounts.entries()) {
    const [a, b] = key.split("\u0000");
    const support = abCount / n;
    if (support < minSupport) continue;
    const countA = singleCounts.get(a) || 1;
    const countB = singleCounts.get(b) || 1;
    const confidence = abCount / countA;
    if (confidence < minConfidence) continue;
    const lift = confidence / (countB / n);
    rules.push({
      antecedent: a,
      consequent: b,
      support: Number(support.toFixed(3)),
      confidence: Number(confidence.toFixed(3)),
      lift: Number(lift.toFixed(3)),
    });
  }

  rules.sort((x, y) => y.lift - x.lift || y.confidence - x.confidence);
  return rules.slice(0, 25);
}

/**
 * Dominance v90.3 Part C: Quantitative Forecast (EWMA), Historical VaR & Kelly Sizing.
 */
export function computeFinancialForecastAndVar(params: {
  dailyRevenuesMad: number[];
  winProb?: number;
  payoffRatioB?: number;
}) {
  const vals = (params.dailyRevenuesMad || []).filter((v) => Number.isFinite(v) && v >= 0);
  if (vals.length === 0) {
    return {
      ok: true,
      ewmaNextDayMad: 0,
      historicalVar95LossPct: 0,
      kellyOptimalFraction: 0,
    };
  }

  let ewma = vals[0];
  const alpha = 0.3;
  for (let i = 1; i < vals.length; i++) {
    ewma = alpha * vals[i] + (1 - alpha) * ewma;
  }

  const returns: number[] = [];
  for (let i = 1; i < vals.length; i++) {
    if (vals[i - 1] > 0) returns.push((vals[i] - vals[i - 1]) / vals[i - 1]);
  }
  returns.sort((a, b) => a - b);
  const idx95 = Math.max(0, Math.floor(returns.length * 0.05));
  const var95 = returns.length > 0 ? Math.max(0, -returns[idx95] * 100) : 0;

  const p = Math.min(0.99, Math.max(0.01, params.winProb ?? 0.6));
  const b = Math.max(0.1, params.payoffRatioB ?? 1.5);
  const q = 1 - p;
  const kelly = Math.max(0, Math.min(0.5, (b * p - q) / b));

  return {
    ok: true,
    observations: vals.length,
    ewmaNextDayMad: Number(ewma.toFixed(2)),
    historicalVar95LossPct: Number(var95.toFixed(2)),
    kellyOptimalFraction: Number(kelly.toFixed(4)),
  };
}

/**
 * Dominance v90.3 Part D: Game Theory Bargaining (Nash Split, ZOPA & BATNA + Contract Red-Flag Scanner).
 */
export function computeNegotiationBatnaZopa(params: {
  sellerReservationPrice: number;
  buyerMaxWillingness: number;
  sellerAsk: number;
  buyerInitialBid: number;
  contractText?: string;
}) {
  const sMin = Number(params.sellerReservationPrice);
  const bMax = Number(params.buyerMaxWillingness);
  const hasZopa = bMax >= sMin;
  const zopaWidth = hasZopa ? Number((bMax - sMin).toFixed(2)) : 0;
  const nashEquilibriumPrice = hasZopa
    ? Number(((sMin + bMax) / 2).toFixed(2))
    : Number(((params.sellerAsk + params.buyerInitialBid) / 2).toFixed(2));

  const redFlags: string[] = [];
  const txt = String(params.contractText || "");
  if (/(auto.?renew|تجديد تلقائي)/i.test(txt)) redFlags.push("Auto-renewal lock-in clause detected");
  if (/(unlimited liability|مسؤولية غير محدودة)/i.test(txt)) redFlags.push("Uncapped liability exposure detected");
  if (/(exclusivity|حصرية مطلقة)/i.test(txt)) redFlags.push("Broad exclusivity restriction detected");
  if (/(non-?refundable|غير قابل للاسترداد)/i.test(txt)) redFlags.push("Non-refundable payment trap detected");

  return {
    ok: true,
    hasZopa,
    zopaRange: hasZopa ? [sMin, bMax] : null,
    zopaWidth,
    nashBargainingTarget: nashEquilibriumPrice,
    recommendedCounterOffer: hasZopa
      ? Number((nashEquilibriumPrice + zopaWidth * 0.15).toFixed(2))
      : params.sellerReservationPrice,
    contractRedFlags: redFlags,
  };
}
