import React from "react";
import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getSafeServerContext } from "@/server/auth/context";
import {
  TrendingUp,
  ArrowUpRight,
  ShoppingBag,
  Package,
  Users,
  ArrowRight,
  FileSpreadsheet,
  Scan,
  Barcode,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Layers,
} from "lucide-react";
import { FloatingCommerceCanvas } from "@/components/ui/FloatingCommerceCanvas";
import type { StoreBusinessType } from "@/client/store/usePosStore";
import { getDictionary, type Locale } from "@/i18n/schema";

export const dynamic = "force-dynamic";

/**
 * 3D Isometric Stacked Crates Illustration matching Zoomed-In Card
 * (1 Vibrant Emerald/Teal Crate stacked on 2 Dark Slate Crates with lattice cutouts)
 */
function IsometricCratesIllustration({ className = "w-16 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bottom Left Slate Crate */}
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

      {/* Bottom Right Slate Crate */}
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

      {/* Top Stacked Teal/Green Crate */}
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

export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "ar" || rawLocale === "en" ? rawLocale : "fr") as Locale;
  const t = getDictionary(locale);

  const ctx = await getSafeServerContext();
  const tenantId = ctx.tenantId;
  const isFallbackTenant = tenantId === "00000000-0000-0000-0000-000000000000";

  let productsCount = 0;
  let salesCount = 0;
  let customersCount = 0;
  let outOfStockCount = 0;
  let workspaceRecord: { responseBody: unknown } | null = null;
  let salesAgg: { _sum: { grandTotal: unknown } } = { _sum: { grandTotal: null } };

  if (!isFallbackTenant) {
    try {
      [productsCount, salesCount, customersCount, outOfStockCount, workspaceRecord, salesAgg] =
        await Promise.all([
          prisma.product.count({ where: { tenantId } }).catch(() => 0),
          prisma.sale
            .count({ where: { tenantId, status: "completed" } })
            .catch(() => 0),
          prisma.customer.count({ where: { tenantId } }).catch(() => 0),
          prisma.stockLevel
            .count({ where: { tenantId, quantity: { lte: 0 } } })
            .catch(() => 0),
          prisma.idempotencyRecord
            .findUnique({
              where: {
                tenantId_scope_key: {
                  tenantId,
                  scope: "workspace_config",
                  key: "store_profile",
                },
              },
            })
            .catch(() => null),
          prisma.sale
            .aggregate({
              where: { tenantId, status: "completed" },
              _sum: { grandTotal: true },
            })
            .catch(() => ({ _sum: { grandTotal: null } })),
        ]);
    } catch (err) {
      console.warn("[DashboardOverviewPage] Fallback metrics used:", err);
    }
  }

  const workspacePayload =
    workspaceRecord?.responseBody && typeof workspaceRecord.responseBody === "object"
      ? (workspaceRecord.responseBody as Record<string, unknown>)
      : {};

  const validStoreTypes: StoreBusinessType[] = [
    "grocery",
    "restaurant",
    "butchery",
    "bakery",
    "fashion",
    "electronics",
    "tech",
    "wholesale",
  ];
  const rawStoreType = String(workspacePayload.storeType || "grocery") as StoreBusinessType;
  const currentStoreType: StoreBusinessType = validStoreTypes.includes(rawStoreType)
    ? rawStoreType
    : "grocery";

  const shouldAutoOpenOnboarding = Boolean(
    workspacePayload.onboardingCompleted === false ||
      (!workspaceRecord && Number(productsCount) === 0)
  );

  const totalSalesMad = Number(salesAgg?._sum?.grandTotal || 0).toFixed(2);
  const avgBasketMad = salesCount > 0 ? (Number(totalSalesMad) / salesCount).toFixed(2) : "0.00";
  const shelfHealthPercent = productsCount > 0
    ? Math.max(0, Math.min(100, Math.round(((productsCount - outOfStockCount) / productsCount) * 100)))
    : 100;
  const safeDisplayName = String(ctx.activeTenant?.displayName || t.dashboard.title);
  const safeLegalName = String(ctx.activeTenant?.legalName || safeDisplayName);

  return (
    <div dir="ltr" className="relative space-y-8 select-none">
      <FloatingCommerceCanvas opacity="opacity-[0.04]" className="top-0 h-96 -z-10" />
      {/* Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {safeDisplayName}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {(() => {
                const map: Record<string, { ar: string; en: string; fr: string }> = {
                  restaurant: { ar: "مطعم ومقهى • KDS", en: "Restaurant & Café • KDS", fr: "Restaurant & Café • KDS" },
                  butchery: { ar: "مجزرة ولحوم • ميزان", en: "Butchery & Meats • Scale", fr: "Boucherie & Viandes • Balance" },
                  bakery: { ar: "مخبزة وحلويات", en: "Bakery & Pastry", fr: "Boulangerie & Pâtisserie" },
                  fashion: { ar: "أزياء وملابس • مقاسات", en: "Fashion & Apparel • Sizes", fr: "Mode & Prêt-à-Porter • Tailles" },
                  electronics: { ar: "إلكترونيات • IMEI", en: "Tech & Electronics • IMEI", fr: "Tech & Électronique • IMEI" },
                  tech: { ar: "إلكترونيات • IMEI", en: "Tech & Electronics • IMEI", fr: "Tech & Électronique • IMEI" },
                  wholesale: { ar: "جملة وتوزيع • B2B", en: "Wholesale & Distribution • B2B", fr: "Grossiste & Distribution • B2B" },
                  grocery: { ar: "بقالة وسوبرماركت • EAN", en: "Supermarket & Grocery • EAN", fr: "Supermarché & Épicerie • EAN" },
                };
                const s = map[currentStoreType] || map.grocery;
                return locale === "ar" ? s.ar : locale === "en" ? s.en : s.fr;
              })()}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            {safeLegalName} • {t.dashboard.currencyNote}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/dashboard/products/import`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>{t.dashboard.importExcel}</span>
          </Link>
          <Link
            href={`/${locale}/pos`}
            className="sheen-btn inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 transition-all hover:bg-zinc-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] cursor-pointer"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>{t.dashboard.openPos}</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards (Multi-Layered Frosted Glass matching Blueprint) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue / Daily Register Sales */}
        <div className="kaspi-frosted-card kaspi-frosted-card-hover group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-300 text-xs font-semibold">
            <span>
              {locale === "ar"
                ? "مبيعات الصندوق اليومية"
                : locale === "en"
                ? "Daily Register Sales"
                : "Chiffre d'Affaires Caisse"}
            </span>
            <ArrowUpRight className="h-4 w-4 text-white/80" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {totalSalesMad} {t.common.currency}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {locale === "ar"
                ? `متوسط سلة المشتريات: ${avgBasketMad} MAD`
                : locale === "en"
                ? `Average Basket: ${avgBasketMad} MAD`
                : `Panier Moyen : ${avgBasketMad} MAD`}
            </p>
          </div>
        </div>

        {/* KPI 2: FMCG Velocity / Transactions */}
        <div className="kaspi-frosted-card kaspi-frosted-card-hover group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-300 text-xs font-semibold">
            <span>
              {locale === "ar"
                ? "حركة السلع الممسوحة"
                : locale === "en"
                ? "Scanned Items & FMCG Velocity"
                : "Articles Scannés & Rotation"}
            </span>
            <Barcode className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono tracking-tight">{salesCount}</div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {locale === "ar"
                ? "دوران السلع الاستهلاكية السريعة اليوم"
                : locale === "en"
                ? "Fast-moving goods turnover today"
                : "Rotation active des produits du jour"}
            </p>
          </div>
        </div>

        {/* KPI 3: Shelf Low-Stock & Expiry Alerts (with Red Alert Icon) */}
        <div className="kaspi-frosted-card kaspi-frosted-card-hover group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-300 text-xs font-semibold">
            <span>
              {locale === "ar"
                ? "تنبيهات الصلاحية والرفوف"
                : locale === "en"
                ? "DLC Expiry Alerts"
                : "Alertes Péremption & Rupture"}
            </span>
            <AlertTriangle className="h-4 w-4 text-[#F87171]" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {outOfStockCount || productsCount} <span className="text-sm font-semibold text-zinc-400">items</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {locale === "ar"
                ? `${outOfStockCount} نفدت من الرف • 0 قريبة الانتهاء`
                : locale === "en"
                ? `${outOfStockCount} Out of stock • 0 Expiring soon`
                : `${outOfStockCount} En rupture • 0 Proches péremption`}
            </p>
          </div>
        </div>

        {/* KPI 4: Gas & Crate Consigne Balance with 3D Stacked Crates (Matching Blueprint 1:1 Across All Modes) */}
        <div className="kaspi-frosted-card kaspi-frosted-card-hover relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between">
          <div className="text-xs font-semibold text-zinc-300">
            <span>
              {locale === "ar"
                ? "رصيد الرهن: الغاز والصناديق"
                : locale === "en"
                ? "Gas & Crate Consigne Balance"
                : "Solde Consignes Gaz & Casiers"}
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-2">
            <div className="flex items-baseline whitespace-nowrap">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                +45
              </span>
              <span className="text-xs font-semibold text-zinc-400 mx-1.5 whitespace-nowrap">Units ·</span>
              <span className="text-sm font-bold text-[#F87171] font-mono">
                -12
              </span>
              <span className="text-xs font-semibold text-zinc-400 ms-1 whitespace-nowrap">Empty</span>
            </div>
            <IsometricCratesIllustration className="w-16 h-12 shrink-0 drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* Quick Launch Cards (Frosted Glass Translucent Surface) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fast POS CTA */}
        <div className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
              {t.dashboard.offlineModeActive}
            </div>
            <h2 className="text-lg font-bold text-white">{t.dashboard.fastPosTitle}</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {t.dashboard.fastPosDesc}
            </p>
          </div>
          <div className="mt-6">
            <Link
              href={`/${locale}/pos`}
              className="sheen-btn inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
            >
              <span>{t.dashboard.launchPosBtn}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* WhatsApp Reports CTA */}
        <div className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
              {t.dashboard.automationBadge}
            </div>
            <h2 className="text-lg font-bold text-white">{t.dashboard.zReportTitle}</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {t.dashboard.zReportDesc}
            </p>
          </div>
          <div className="mt-6">
            <Link
              href={`/${locale}/dashboard/reports`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-zinc-900/80 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800"
            >
              <span>{t.dashboard.viewReportsBtn}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
