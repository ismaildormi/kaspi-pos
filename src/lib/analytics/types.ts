export type AnalyticsRange = "today" | "7d" | "30d" | "all";

export type AnalyticsMetric =
  | "sales"
  | "items"
  | "cost_value"
  | "retail_value"
  | "alerts"
  | "consigne"
  | "payment_cash"
  | "payment_card"
  | "payment_credit";

export interface AnalyticsPoint {
  key: string;
  label: string;
  fullDate: string;
  value: number;
  secondaryValue: number;
  count: number;
  deltaPct: number | null;
}

export interface AnalyticsSummary {
  totalValue: number;
  previousPeriodValue: number;
  deltaPct: number;
  peakLabel: string;
  peakValue: number;
  transactionCount: number;
  averageBasket: number;
  costValue: number;
  retailValue: number;
  marginMad: number;
  marginPct: number;
  cashTotal: number;
  cardTotal: number;
  creditTotal: number;
  lowStockCount: number;
  expiringSoonCount: number;
  totalSkus: number;
  totalUnits: number;
}

export interface AnalyticsSparklineSnapshot {
  values: number[];
  deltaPct: number;
  currentValue: number;
}

export interface AnalyticsTimeseriesPayload {
  metric: AnalyticsMetric;
  range: AnalyticsRange;
  currency: string;
  isOfflineFallback?: boolean;
  points: AnalyticsPoint[];
  summary: AnalyticsSummary;
  sparklines?: Partial<Record<AnalyticsMetric, AnalyticsSparklineSnapshot>>;
}
