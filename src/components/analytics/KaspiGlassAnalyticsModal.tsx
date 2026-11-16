"use client";

import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Layers, CreditCard, ShoppingBag } from "lucide-react";
import { AppleBackButton } from "@/components/common/AppleBackButton";
import { KaspiGlassAnalyticsChart } from "./KaspiGlassAnalyticsChart";
import { useKaspiAnalytics } from "@/lib/analytics/useKaspiAnalytics";
import type { AnalyticsMetric, AnalyticsRange } from "@/lib/analytics/types";

interface KaspiGlassAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: AnalyticsMetric;
  title: string;
  unitLabel?: string;
  locale?: string;
}

const RANGES: Array<{ id: AnalyticsRange; ar: string; fr: string; en: string }> = [
  { id: "today", ar: "اليوم بالساعات", fr: "Aujourd'hui (Heures)", en: "Today (Hourly)" },
  { id: "7d", ar: "7 أيام", fr: "7 Jours", en: "7 Days" },
  { id: "30d", ar: "30 يوم", fr: "30 Jours", en: "30 Days" },
  { id: "all", ar: "منذ البداية", fr: "Depuis le début", en: "All Time" },
];

export const KaspiGlassAnalyticsModal: React.FC<KaspiGlassAnalyticsModalProps> = ({
  isOpen,
  onClose,
  metric,
  title,
  unitLabel = "MAD",
  locale = "fr",
}) => {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const { data, loading } = useKaspiAnalytics(metric, range, isOpen);

  if (!isOpen) return null;

  const summary = data?.summary;
  const deltaPct = summary?.deltaPct ?? 0;
  const isPositive = deltaPct >= 0;
  const formattedTotal =
    unitLabel === "MAD"
      ? `${(summary?.totalValue ?? 0).toFixed(2)} MAD`
      : `${summary?.totalValue ?? 0} ${unitLabel}`;

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/45 backdrop-blur-xl select-none overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="kaspi-opaque-glass-modal kaspi-polar-aurora-orbit w-full max-w-4xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple Header Row with Unified Back Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl kaspi-glass-btn flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[var(--kaspi-text-primary)] truncate">
                {title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-lg sm:text-xl font-bold text-[var(--kaspi-text-primary)] tabular-nums">
                  {formattedTotal}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border tabular-nums ${
                    isPositive
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/15 text-red-400 border-red-500/30"
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  <span>{Math.abs(deltaPct).toFixed(1)}%</span>
                </span>
              </div>
            </div>
          </div>

          <AppleBackButton onClick={onClose} locale={locale} />
        </div>

        {/* Timeframe Glass Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-2xl kaspi-frosted-card">
            {RANGES.map((r) => {
              const active = range === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "kaspi-glass-btn kaspi-orbit-active text-[var(--kaspi-text-primary)] shadow-sm"
                      : "text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)]"
                  }`}
                >
                  {locale === "ar" ? r.ar : locale === "en" ? r.en : r.fr}
                </button>
              );
            })}
          </div>

          {data?.isOfflineFallback && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold kaspi-glass-btn text-[var(--kaspi-text-muted)]">
              {locale === "ar" ? "بيانات الصندوق المحلية" : locale === "en" ? "Local Offline Ledger" : "Journal Local Hors-ligne"}
            </span>
          )}
        </div>

        {/* Interactive Smooth Area Curve */}
        <div className="kaspi-frosted-card rounded-2xl p-4 sm:p-5">
          <KaspiGlassAnalyticsChart
            points={data?.points || []}
            unitLabel={unitLabel}
            locale={locale}
            loading={loading}
          />
        </div>

        {/* Organized Real Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="kaspi-frosted-card rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--kaspi-text-muted)]">
              <span>{locale === "ar" ? "الذروة" : locale === "en" ? "Peak Period" : "Pic d'Activité"}</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-[var(--kaspi-text-primary)] tabular-nums">
              {unitLabel === "MAD"
                ? `${(summary?.peakValue ?? 0).toFixed(2)} MAD`
                : `${summary?.peakValue ?? 0} ${unitLabel}`}
            </div>
            <div className="text-[10px] text-[var(--kaspi-text-muted)] tabular-nums">
              {summary?.peakLabel || "--"}
            </div>
          </div>

          <div className="kaspi-frosted-card rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--kaspi-text-muted)]">
              <span>{locale === "ar" ? "متوسط السلة" : locale === "en" ? "Avg Basket" : "Panier Moyen"}</span>
              <ShoppingBag className="w-3.5 h-3.5 text-[var(--kaspi-text-muted)]" />
            </div>
            <div className="text-sm font-bold text-[var(--kaspi-text-primary)] tabular-nums">
              {(summary?.averageBasket ?? 0).toFixed(2)} MAD
            </div>
            <div className="text-[10px] text-[var(--kaspi-text-muted)] tabular-nums">
              {summary?.transactionCount ?? 0}{" "}
              {locale === "ar" ? "فاتورة" : locale === "en" ? "orders" : "tickets"}
            </div>
          </div>

          <div className="kaspi-frosted-card rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--kaspi-text-muted)]">
              <span>{locale === "ar" ? "هامش المخزون" : locale === "en" ? "Stock Margin" : "Marge Stock"}</span>
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-[var(--kaspi-text-primary)] tabular-nums">
              {(summary?.marginMad ?? 0).toFixed(2)} MAD
            </div>
            <div className="text-[10px] text-[var(--kaspi-text-muted)] tabular-nums">
              {(summary?.marginPct ?? 0).toFixed(1)}% • {summary?.totalSkus ?? 0} SKUs
            </div>
          </div>

          <div className="kaspi-frosted-card rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--kaspi-text-muted)]">
              <span>{locale === "ar" ? "تفصيل الأداء" : locale === "en" ? "Payments" : "Encaissements"}</span>
              <CreditCard className="w-3.5 h-3.5 text-[var(--kaspi-text-muted)]" />
            </div>
            <div className="text-xs font-bold text-[var(--kaspi-text-primary)] tabular-nums truncate">
              Cash {(summary?.cashTotal ?? 0).toFixed(0)} · Card {(summary?.cardTotal ?? 0).toFixed(0)}
            </div>
            <div className="text-[10px] text-[var(--kaspi-text-muted)] tabular-nums">
              Crédit {(summary?.creditTotal ?? 0).toFixed(2)} MAD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KaspiGlassAnalyticsModal;
