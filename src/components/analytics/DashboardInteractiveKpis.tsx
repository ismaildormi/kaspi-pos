"use client";

import React, { useState } from "react";
import { ArrowUpRight, Barcode, AlertTriangle, Flame, CheckCircle2 } from "lucide-react";
import { KaspiMiniSparkline } from "./KaspiMiniSparkline";
import { KaspiGlassAnalyticsModal } from "./KaspiGlassAnalyticsModal";
import { useKaspiAnalytics } from "@/lib/analytics/useKaspiAnalytics";
import type { AnalyticsMetric } from "@/lib/analytics/types";

export interface DashboardInteractiveKpisProps {
  locale: string;
  currency: string;
  totalSalesMad: string;
  avgBasketMad: string;
  salesCount: number;
  outOfStockCount: number;
  productsCount: number;
  totalUnits: number;
  streakDays?: number;
  weeklyConsistency?: boolean[];
}

function IsometricCratesIllustration({ className = "w-16 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g opacity="0.95">
        <path d="M12 48 L38 61 L38 72 L12 59 Z" fill="#242C37" stroke="#3A4657" strokeWidth="0.8" />
        <rect x="18" y="52" width="6" height="3" rx="0.5" fill="#14181F" transform="skewY(26)" />
        <rect x="27" y="48" width="6" height="3" rx="0.5" fill="#14181F" transform="skewY(26)" />
        <path d="M38 61 L64 48 L64 59 L38 72 Z" fill="#1C232C" stroke="#3A4657" strokeWidth="0.8" />
        <rect x="42" y="58" width="6" height="3" rx="0.5" fill="#14181F" transform="skewY(-26)" />
        <rect x="51" y="62" width="6" height="3" rx="0.5" fill="#14181F" transform="skewY(-26)" />
        <path d="M38 43 L64 30 L38 18 L12 30 Z" fill="#2E3744" stroke="#48566A" strokeWidth="0.8" />
        <path d="M38 41 L59 30 L38 21 L17 30 Z" fill="#181D24" />
      </g>
      <g opacity="0.95">
        <path d="M46 51 L68 62 L68 73 L46 62 Z" fill="#242C37" stroke="#3A4657" strokeWidth="0.8" />
        <rect x="50" y="54" width="5" height="3" rx="0.5" fill="#14181F" transform="skewY(26)" />
        <rect x="58" y="50" width="5" height="3" rx="0.5" fill="#14181F" transform="skewY(26)" />
        <path d="M68 62 L94 49 L94 60 L68 73 Z" fill="#1A2028" stroke="#3A4657" strokeWidth="0.8" />
        <rect x="72" y="60" width="5" height="3" rx="0.5" fill="#14181F" transform="skewY(-26)" />
        <rect x="81" y="65" width="5" height="3" rx="0.5" fill="#14181F" transform="skewY(-26)" />
        <path d="M68 47 L94 34 L68 22 L42 34 Z" fill="#2B3441" stroke="#48566A" strokeWidth="0.8" />
        <path d="M68 45 L89 34 L68 25 L47 34 Z" fill="#161B22" />
      </g>
      <g>
        <path d="M22 28 L48 41 L48 53 L22 40 Z" fill="#0D9488" stroke="#2DD4BF" strokeWidth="1" />
        <rect x="28" y="31" width="7" height="3.5" rx="0.75" fill="#042F2E" transform="skewY(26)" />
        <rect x="37" y="27" width="7" height="3.5" rx="0.75" fill="#042F2E" transform="skewY(26)" />
        <path d="M48 41 L74 28 L74 40 L48 53 Z" fill="#0F766E" stroke="#2DD4BF" strokeWidth="1" />
        <rect x="52" y="38" width="7" height="3.5" rx="0.75" fill="#042F2E" transform="skewY(-26)" />
        <rect x="61" y="43" width="7" height="3.5" rx="0.75" fill="#042F2E" transform="skewY(-26)" />
        <path d="M48 23 L74 10 L48 0 L22 10 Z" fill="#14B8A6" stroke="#5EEAD4" strokeWidth="1" />
        <path d="M48 20 L68 10 L48 2 L28 10 Z" fill="#042F2E" />
        <line x1="48" y1="2" x2="48" y2="20" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.6" />
        <line x1="38" y1="6" x2="38" y2="24" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.6" />
        <line x1="58" y1="6" x2="58" y2="24" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.6" />
      </g>
    </svg>
  );
}

export const DashboardInteractiveKpis: React.FC<DashboardInteractiveKpisProps> = ({
  locale,
  currency,
  totalSalesMad,
  avgBasketMad,
  salesCount,
  outOfStockCount,
  productsCount,
  totalUnits,
  streakDays = 0,
  weeklyConsistency = [false, false, false, false, false, false, false],
}) => {
  const [activeModal, setActiveModal] = useState<{
    metric: AnalyticsMetric;
    title: string;
    unitLabel: string;
  } | null>(null);

  const { data: analytics } = useKaspiAnalytics("sales", "7d", true);
  const sparks = analytics?.sparklines;
  const nextMilestone = streakDays < 7 ? 7 : streakDays < 14 ? 14 : streakDays < 30 ? 30 : 60;

  const salesTitle =
    locale === "ar"
      ? "مبيعات الصندوق اليومية"
      : locale === "en"
      ? "Daily Register Sales"
      : "Chiffre d'Affaires Caisse";

  const itemsTitle =
    locale === "ar"
      ? "حركة السلع الممسوحة"
      : locale === "en"
      ? "Scanned Items & Velocity"
      : "Articles Scannés & Rotation";

  const alertsTitle =
    locale === "ar"
      ? "تنبيهات الصلاحية والرفوف"
      : locale === "en"
      ? "Stock & Expiry Alerts"
      : "Alertes Péremption & Rupture";

  const consigneTitle =
    locale === "ar"
      ? "رصيد المخزون والصناديق"
      : locale === "en"
      ? "Stock & Consigne Balance"
      : "Solde Stock & Consignes";

  const clickHint =
    locale === "ar"
      ? "انقر لعرض المنحنى التفاعلي"
      : locale === "en"
      ? "Click for interactive chart"
      : "Cliquer pour l'analyse";

  return (
    <>
      {/* Subtle Apple-Clean Merchant Operational Streak Bar (`سلسلة النشاط اليومي / Daily Store Streak`) */}
      <div
        data-kaspi-daily-streak="true"
        className="kaspi-frosted-card rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl kaspi-glass-btn flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--kaspi-text-primary)] flex items-center gap-2">
              <span>
                {locale === "ar"
                  ? `سلسلة النشاط اليومي: ${streakDays} ${streakDays === 1 ? "يوم" : "أيام متتالية"}`
                  : locale === "en"
                  ? `Daily Store Streak: ${streakDays} consecutive ${streakDays === 1 ? "day" : "days"}`
                  : `Série d'Activité Quotidienne : ${streakDays} ${streakDays <= 1 ? "jour" : "jours"} consécutifs`}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {locale === "ar"
                  ? `الهدف القادم: ${nextMilestone} أيام`
                  : locale === "en"
                  ? `Next Milestone: ${nextMilestone}d`
                  : `Prochain cap : ${nextMilestone}j`}
              </span>
            </div>
            <p className="text-[11px] text-[var(--kaspi-text-muted)]">
              {locale === "ar"
                ? "محسوبة تلقائياً من فواتير البيع وورديات الصندوق الفعلية بالمتجر"
                : locale === "en"
                ? "Computed from real store sales & cash register shifts"
                : "Calculé en temps réel depuis vos ventes et sessions de caisse"}
            </p>
          </div>
        </div>

        {/* Weekly Consistency Dots (Last 7 Days) */}
        <div className="flex items-center gap-1.5" dir="ltr">
          <span className="text-[10px] font-mono text-[var(--kaspi-text-muted)] mr-1">
            7d:
          </span>
          {weeklyConsistency.map((activeDay, idx) => (
            <div
              key={idx}
              title={activeDay ? "Active Day" : "No Activity"}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono transition-all ${
                activeDay
                  ? "bg-emerald-500/25 border border-emerald-400/60 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  : "kaspi-glass-surface text-[var(--kaspi-text-muted)] opacity-60"
              }`}
            >
              {activeDay ? <CheckCircle2 className="w-3 h-3" /> : "·"}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue / Daily Register Sales */}
        <button
          type="button"
          onClick={() =>
            setActiveModal({ metric: "sales", title: salesTitle, unitLabel: "MAD" })
          }
          title={clickHint}
          className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between text-start cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-300 text-xs font-semibold gap-2">
            <span>{salesTitle}</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-400 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div className="mt-3 space-y-2.5">
            <div>
              <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {totalSalesMad} {currency}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {locale === "ar"
                  ? `متوسط سلة المشتريات: ${avgBasketMad} MAD`
                  : locale === "en"
                  ? `Average Basket: ${avgBasketMad} MAD`
                  : `Panier Moyen : ${avgBasketMad} MAD`}
              </p>
            </div>
            <KaspiMiniSparkline
              values={sparks?.sales?.values}
              deltaPct={sparks?.sales?.deltaPct ?? 0}
              positiveIsGood={true}
            />
          </div>
        </button>

        {/* KPI 2: Scanned Items & Velocity */}
        <button
          type="button"
          onClick={() =>
            setActiveModal({
              metric: "items",
              title: itemsTitle,
              unitLabel: locale === "ar" ? "وحدة" : "u",
            })
          }
          title={clickHint}
          className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between text-start cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-300 text-xs font-semibold gap-2">
            <span>{itemsTitle}</span>
            <Barcode className="h-4 w-4 text-zinc-400 group-hover:text-emerald-400 transition-colors shrink-0" />
          </div>
          <div className="mt-3 space-y-2.5">
            <div>
              <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {salesCount}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {locale === "ar"
                  ? "فواتير البيع المسجلة بالمتجر"
                  : locale === "en"
                  ? "Recorded completed orders"
                  : "Tickets de caisse validés"}
              </p>
            </div>
            <KaspiMiniSparkline
              values={sparks?.items?.values}
              deltaPct={sparks?.items?.deltaPct ?? 0}
              positiveIsGood={true}
            />
          </div>
        </button>

        {/* KPI 3: Shelf Low-Stock & Expiry Alerts */}
        <button
          type="button"
          onClick={() =>
            setActiveModal({
              metric: "alerts",
              title: alertsTitle,
              unitLabel: locale === "ar" ? "تنبيه" : "alerts",
            })
          }
          title={clickHint}
          className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between text-start cursor-pointer"
        >
          <div className="flex items-center justify-between text-zinc-300 text-xs font-semibold gap-2">
            <span>{alertsTitle}</span>
            <AlertTriangle className="h-4 w-4 text-[#F87171] shrink-0" />
          </div>
          <div className="mt-3 space-y-2.5">
            <div>
              <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {outOfStockCount}{" "}
                <span className="text-sm font-semibold text-zinc-400">
                  / {productsCount} SKUs
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {locale === "ar"
                  ? `${outOfStockCount} نفدت من المخزون`
                  : locale === "en"
                  ? `${outOfStockCount} Out of stock / threshold`
                  : `${outOfStockCount} En rupture de stock`}
              </p>
            </div>
            <KaspiMiniSparkline
              values={sparks?.alerts?.values}
              deltaPct={sparks?.alerts?.deltaPct ?? 0}
              positiveIsGood={false}
            />
          </div>
        </button>

        {/* KPI 4: Stock & Retail Shelf Valuation */}
        <button
          type="button"
          onClick={() =>
            setActiveModal({
              metric: "retail_value",
              title: consigneTitle,
              unitLabel: "MAD",
            })
          }
          title={clickHint}
          className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between text-start cursor-pointer"
        >
          <div className="text-xs font-semibold text-zinc-300">
            <span>{consigneTitle}</span>
          </div>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline whitespace-nowrap">
                <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                  +{Math.round(totalUnits)}
                </span>
                <span className="text-xs font-semibold text-zinc-400 mx-1.5 whitespace-nowrap">
                  {locale === "ar" ? "وحدة" : "Units"}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-zinc-400 block mt-0.5">
                {(analytics?.summary?.retailValue ?? 0).toFixed(0)} MAD{" "}
                {locale === "ar" ? "قيمة الرفوف" : locale === "en" ? "shelf value" : "valeur"}
              </span>
            </div>
            <IsometricCratesIllustration className="w-14 h-11 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>
        </button>
      </div>

      <KaspiGlassAnalyticsModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        metric={activeModal?.metric || "sales"}
        title={activeModal?.title || salesTitle}
        unitLabel={activeModal?.unitLabel || "MAD"}
        locale={locale}
      />
    </>
  );
};

export default DashboardInteractiveKpis;
