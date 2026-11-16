"use client";

import React, { useState } from "react";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { KaspiMiniSparkline } from "./KaspiMiniSparkline";
import { KaspiGlassAnalyticsChart } from "./KaspiGlassAnalyticsChart";
import { KaspiGlassAnalyticsModal } from "./KaspiGlassAnalyticsModal";
import { useKaspiAnalytics } from "@/lib/analytics/useKaspiAnalytics";
import type { AnalyticsMetric, AnalyticsRange } from "@/lib/analytics/types";

interface ReportsInteractiveAnalyticsProps {
  locale: string;
  currency: string;
  todaySalesCount: number;
  reportDateLabel: string;
  zReportTitle: string;
  transactionsCountLabel: string;
  labels: {
    dailySales: string;
    todayCash: string;
    todayCard: string;
    todayCredit: string;
  };
  initialTotals: {
    totalMad: number;
    cashMad: number;
    cardMad: number;
    creditMad: number;
  };
}

const RANGES: Array<{ id: AnalyticsRange; ar: string; fr: string; en: string }> = [
  { id: "today", ar: "اليوم بالساعات", fr: "Aujourd'hui", en: "Today" },
  { id: "7d", ar: "7 أيام", fr: "7 Jours", en: "7 Days" },
  { id: "30d", ar: "30 يوم", fr: "30 Jours", en: "30 Days" },
  { id: "all", ar: "منذ البداية", fr: "Depuis le début", en: "All Time" },
];

export const ReportsInteractiveAnalytics: React.FC<ReportsInteractiveAnalyticsProps> = ({
  locale,
  currency,
  todaySalesCount,
  reportDateLabel,
  zReportTitle,
  transactionsCountLabel,
  labels,
  initialTotals,
}) => {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const [activeChartMetric, setActiveChartMetric] = useState<AnalyticsMetric>("sales");
  const [modalConfig, setModalConfig] = useState<{
    metric: AnalyticsMetric;
    title: string;
  } | null>(null);

  const { data, loading } = useKaspiAnalytics(activeChartMetric, range, true);
  const sparks = data?.sparklines;

  const kpiCards: Array<{
    metric: AnalyticsMetric;
    title: string;
    amount: number;
    accent?: string;
  }> = [
    {
      metric: "sales",
      title: labels.dailySales,
      amount: initialTotals.totalMad,
    },
    {
      metric: "payment_cash",
      title: labels.todayCash,
      amount: initialTotals.cashMad,
    },
    {
      metric: "payment_card",
      title: labels.todayCard,
      amount: initialTotals.cardMad,
    },
    {
      metric: "payment_credit",
      title: labels.todayCredit,
      amount: initialTotals.creditMad,
      accent: "text-emerald-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Z-Report Glass KPI Cards with Click-to-Inspect Interactive Curves */}
      <div className="kaspi-frosted-card kaspi-polar-aurora-orbit rounded-3xl p-6 space-y-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {zReportTitle} ({reportDateLabel})
            </h2>
          </div>
          <span className="text-xs text-zinc-400 tabular-nums">
            {todaySalesCount} {transactionsCountLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => {
            const sp = sparks?.[card.metric];
            return (
              <button
                key={card.metric}
                type="button"
                onClick={() => setModalConfig({ metric: card.metric, title: card.title })}
                className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between text-start cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-300 font-semibold">{card.title}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="mt-3 space-y-2.5">
                  <div className={`text-2xl font-bold tabular-nums tracking-tight ${card.accent || "text-white"}`}>
                    {card.amount.toFixed(2)}{" "}
                    <span className="text-sm font-semibold text-zinc-400">{currency}</span>
                  </div>
                  <KaspiMiniSparkline
                    values={sp?.values}
                    deltaPct={sp?.deltaPct ?? 0}
                    positiveIsGood={true}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline YouTube Studio / Shopify Interactive Performance Curve */}
      <div className="kaspi-frosted-card kaspi-polar-aurora-orbit rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl kaspi-glass-btn flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {locale === "ar"
                  ? "منحنى المبيعات والأداء التفاعلي"
                  : locale === "en"
                  ? "Interactive Revenue & Payment Analytics"
                  : "Analyse Interactive des Ventes & Encaissements"}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {locale === "ar"
                  ? "مرّر المؤشر فوق المنحنى لاستعراض القيمة بالساعة أو اليوم"
                  : locale === "en"
                  ? "Hover over the curve for exact timestamps, revenue & growth arrows"
                  : "Survolez la courbe pour voir le détail par heure ou par jour"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Switcher */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl kaspi-frosted-card">
              {[
                { id: "sales" as AnalyticsMetric, label: labels.dailySales },
                { id: "payment_cash" as AnalyticsMetric, label: locale === "ar" ? "نقداً" : "Cash" },
                { id: "payment_card" as AnalyticsMetric, label: locale === "ar" ? "بطاقة" : "Carte" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveChartMetric(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    activeChartMetric === m.id
                      ? "kaspi-glass-btn text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Time Range Pills */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl kaspi-frosted-card">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    range === r.id
                      ? "kaspi-polar-aurora-orbit kaspi-orbit-active text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {locale === "ar" ? r.ar : locale === "en" ? r.en : r.fr}
                </button>
              ))}
            </div>
          </div>
        </div>

        <KaspiGlassAnalyticsChart
          points={data?.points || []}
          unitLabel="MAD"
          locale={locale}
          loading={loading}
        />
      </div>

      <KaspiGlassAnalyticsModal
        isOpen={modalConfig !== null}
        onClose={() => setModalConfig(null)}
        metric={modalConfig?.metric || "sales"}
        title={modalConfig?.title || labels.dailySales}
        unitLabel="MAD"
        locale={locale}
      />
    </div>
  );
};

export default ReportsInteractiveAnalytics;
