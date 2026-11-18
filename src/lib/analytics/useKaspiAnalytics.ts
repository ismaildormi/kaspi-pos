"use client";

import { useState, useEffect, useCallback } from "react";
import { offlineDb } from "@/client/db";
import { getApiUrl } from "@/client/sync-engine";
import type {
  AnalyticsMetric,
  AnalyticsPoint,
  AnalyticsRange,
  AnalyticsTimeseriesPayload,
} from "./types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function buildOfflineBuckets(range: AnalyticsRange) {
  const now = new Date();
  const buckets: Array<{ key: string; label: string; fullDate: string; startMs: number; endMs: number }> = [];

  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    for (let h = 0; h < 24; h++) {
      const s = new Date(start.getTime() + h * 3600_000);
      const hh = String(h).padStart(2, "0");
      buckets.push({
        key: `${hh}:00`,
        label: `${hh}:00`,
        fullDate: `${s.toISOString().slice(0, 10)} ${hh}:00`,
        startMs: s.getTime(),
        endMs: s.getTime() + 3600_000 - 1,
      });
    }
    return buckets;
  }

  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86_400_000);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      buckets.push({
        key: iso,
        label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        fullDate: iso,
        startMs: d.getTime(),
        endMs: d.getTime() + 86_400_000 - 1,
      });
    }
    return buckets;
  }

  // Monthly buckets (last 6 months minimum or earliest local sale)
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 1).getTime() - 1;
    const key = `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      label: key,
      fullDate: key,
      startMs: mStart.getTime(),
      endMs: mEnd,
    });
  }
  return buckets;
}

async function buildOfflineFallback(
  metric: AnalyticsMetric,
  range: AnalyticsRange
): Promise<AnalyticsTimeseriesPayload> {
  const buckets = buildOfflineBuckets(range);
  const salesArr = offlineDb ? await offlineDb.offlineSales.toArray().catch(() => []) : [];
  const prodsArr = offlineDb ? await offlineDb.offlineProducts.toArray().catch(() => []) : [];

  const costValue = round2(
    prodsArr.reduce(
      (acc: number, p: any) => acc + Math.max(0, Number(p.costPrice || 0) * Number(p.stockQuantity || 0)),
      0
    )
  );
  const retailValue = round2(
    prodsArr.reduce(
      (acc: number, p: any) => acc + Math.max(0, Number(p.salePrice || 0) * Number(p.stockQuantity || 0)),
      0
    )
  );
  const lowStockCount = prodsArr.filter((p: any) => Number(p.stockQuantity || 0) <= 5).length;

  const vals = new Array<number>(buckets.length).fill(0);
  const counts = new Array<number>(buckets.length).fill(0);
  const items = new Array<number>(buckets.length).fill(0);
  let cashTotal = 0;
  let cardTotal = 0;
  let creditTotal = 0;
  let grossTotal = 0;
  let totalItems = 0;

  for (const s of salesArr) {
    const ts = Number(s.createdAt || 0);
    const idx = buckets.findIndex((b) => ts >= b.startMs && ts <= b.endMs);
    const g = Number(s.grandTotal || 0);
    const q = Array.isArray(s.items)
      ? s.items.reduce((a: number, it: any) => a + Number(it.quantity || 0), 0)
      : 0;
    const sCash = Array.isArray(s.payments)
      ? s.payments.filter((p: any) => p.method === "cash").reduce((a: number, p: any) => a + Number(p.amount || 0), 0)
      : 0;
    const sCard = Array.isArray(s.payments)
      ? s.payments.filter((p: any) => p.method === "card").reduce((a: number, p: any) => a + Number(p.amount || 0), 0)
      : 0;
    const sCredit = Array.isArray(s.payments)
      ? s.payments.filter((p: any) => p.method === "credit").reduce((a: number, p: any) => a + Number(p.amount || 0), 0)
      : 0;

    if (idx >= 0) {
      grossTotal += g;
      totalItems += q;
      cashTotal += sCash;
      cardTotal += sCard;
      creditTotal += sCredit;
      counts[idx] += 1;
      items[idx] += q;

      if (metric === "items") vals[idx] += q;
      else if (metric === "payment_cash") vals[idx] += sCash;
      else if (metric === "payment_card") vals[idx] += sCard;
      else if (metric === "payment_credit") vals[idx] += sCredit;
      else vals[idx] += g;
    }
  }

  if (metric === "cost_value") vals.fill(costValue);
  if (metric === "retail_value") vals.fill(retailValue);
  if (metric === "alerts") vals.fill(lowStockCount);

  const points: AnalyticsPoint[] = buckets.map((b, i) => ({
    key: b.key,
    label: b.label,
    fullDate: b.fullDate,
    value: round2(vals[i]),
    secondaryValue: round2(items[i]),
    count: counts[i],
    deltaPct: i > 0 ? calcDelta(vals[i], vals[i - 1]) : null,
  }));

  const totalValue =
    metric === "cost_value"
      ? costValue
      : metric === "retail_value"
      ? retailValue
      : metric === "alerts"
      ? lowStockCount
      : metric === "items"
      ? round2(totalItems)
      : metric === "payment_cash"
      ? round2(cashTotal)
      : metric === "payment_card"
      ? round2(cardTotal)
      : metric === "payment_credit"
      ? round2(creditTotal)
      : round2(grossTotal);

  let peakLabel = points[0]?.label || "--";
  let peakValue = 0;
  for (const pt of points) {
    if (pt.value > peakValue) {
      peakValue = pt.value;
      peakLabel = pt.label;
    }
  }

  return {
    metric,
    range,
    currency: "MAD",
    isOfflineFallback: true,
    points,
    summary: {
      totalValue,
      previousPeriodValue: 0,
      deltaPct: totalValue > 0 ? 100 : 0,
      peakLabel,
      peakValue: round2(peakValue),
      transactionCount: counts.reduce((a, v) => a + v, 0),
      averageBasket:
        counts.reduce((a, v) => a + v, 0) > 0
          ? round2(grossTotal / counts.reduce((a, v) => a + v, 0))
          : 0,
      costValue,
      retailValue,
      marginMad: round2(Math.max(0, retailValue - costValue)),
      marginPct: retailValue > 0 ? round2(((retailValue - costValue) / retailValue) * 100) : 0,
      cashTotal: round2(cashTotal),
      cardTotal: round2(cardTotal),
      creditTotal: round2(creditTotal),
      lowStockCount,
      expiringSoonCount: 0,
      totalSkus: prodsArr.length,
      totalUnits: round2(
        prodsArr.reduce((a: number, p: any) => a + Number(p.stockQuantity || 0), 0)
      ),
    },
  };
}

export function useKaspiAnalytics(
  metric: AnalyticsMetric,
  range: AnalyticsRange,
  enabled = true
) {
  const [data, setData] = useState<AnalyticsTimeseriesPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const url = getApiUrl(
        `/api/v1/analytics/timeseries?metric=${encodeURIComponent(metric)}&range=${encodeURIComponent(range)}`
      );
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        const payload = (json?.data || json) as AnalyticsTimeseriesPayload;
        if (payload && Array.isArray(payload.points)) {
          // If server totalValue is 0 or low, but offline sales exist in local Dexie ledger, prefer/merge local sales!
          if (offlineDb) {
            const localCount = await offlineDb.offlineSales.count().catch(() => 0);
            if (localCount > 0 && (payload.summary?.totalValue ?? 0) === 0) {
              const fallback = await buildOfflineFallback(metric, range);
              setData(fallback);
              return;
            }
          }
          setData(payload);
          return;
        }
      }
      const fallback = await buildOfflineFallback(metric, range);
      setData(fallback);
    } catch {
      const fallback = await buildOfflineFallback(metric, range);
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [metric, range, enabled]);

  useEffect(() => {
    refresh();

    if (typeof window === "undefined") return;

    const handleSync = () => {
      refresh();
    };

    window.addEventListener("kaspi-pos-sync", handleSync);
    window.addEventListener("kaspi_stock_updated", handleSync);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("kaspi-pos-sync");
      bc.onmessage = () => {
        refresh();
      };
    } catch {}

    return () => {
      window.removeEventListener("kaspi-pos-sync", handleSync);
      window.removeEventListener("kaspi_stock_updated", handleSync);
      if (bc) {
        bc.close();
      }
    };
  }, [refresh]);

  return { data, loading, refresh };
}
