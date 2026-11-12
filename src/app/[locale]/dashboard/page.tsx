import React from "react";
import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getSafeServerContext } from "@/server/auth/context";
import {
  TrendingUp,
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
import { DashboardOnboardingTrigger } from "@/components/dashboard/DashboardOnboardingTrigger";
import { FloatingCommerceCanvas } from "@/components/ui/FloatingCommerceCanvas";
import type { StoreBusinessType } from "@/client/store/usePosStore";
import { getDictionary, type Locale } from "@/i18n/schema";

export const dynamic = "force-dynamic";

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
          <DashboardOnboardingTrigger
            initialShopName={safeDisplayName}
            autoOpen={shouldAutoOpenOnboarding}
            currentStoreType={currentStoreType}
          />
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

      {/* KPI Cards (Dynamic Chameleon Adaptation based on Sector) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue / Daily Register Sales */}
        <div className="group relative rounded-3xl border border-white/10 surface-obsidian hover:border-white/20 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-dot-matrix opacity-10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>
                {currentStoreType === "grocery"
                  ? locale === "ar"
                    ? "مبيعات الصندوق اليومية"
                    : locale === "en"
                    ? "Daily Register Sales"
                    : "Chiffre d'Affaires Caisse"
                  : t.dashboard.kpiRevenue}
              </span>
              <TrendingUp className="h-4 w-4 text-white group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-titanium-gradient font-mono tracking-tight">
                {totalSalesMad} {t.common.currency}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {currentStoreType === "grocery"
                  ? locale === "ar"
                    ? `متوسط سلة المشتريات: ${avgBasketMad} MAD`
                    : locale === "en"
                    ? `Average Basket: ${avgBasketMad} MAD`
                    : `Panier Moyen : ${avgBasketMad} MAD`
                  : t.dashboard.kpiRevenueSub}
              </p>
            </div>
          </div>
        </div>

        {/* KPI 2: FMCG Velocity / Transactions */}
        <div className="group relative rounded-3xl border border-white/10 surface-obsidian hover:border-white/20 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-dot-matrix opacity-10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>
                {currentStoreType === "grocery"
                  ? locale === "ar"
                    ? "حركة السلع الممسوحة"
                    : locale === "en"
                    ? "Scanned Items & FMCG Velocity"
                    : "Articles Scannés & Rotation"
                  : t.dashboard.kpiTransactions}
              </span>
              <Barcode className="h-4 w-4 text-white group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-titanium-gradient font-mono tracking-tight">{salesCount}</div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {currentStoreType === "grocery"
                  ? locale === "ar"
                    ? "دوران السلع الاستهلاكية السريعة اليوم"
                    : locale === "en"
                    ? "Fast-moving goods turnover today"
                    : "Rotation active des produits du jour"
                  : t.dashboard.kpiTransactionsSub}
              </p>
            </div>
          </div>
        </div>

        {/* KPI 3: Shelf Low-Stock & DLC Expiry Alerts */}
        <div className="group relative rounded-3xl border border-white/10 surface-obsidian hover:border-white/20 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-dot-matrix opacity-10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>
                {currentStoreType === "grocery"
                  ? locale === "ar"
                    ? "تنبيهات الصلاحية والرفوف"
                    : locale === "en"
                    ? "Expiry & Shelf Alerts"
                    : "Alertes Péremption & Rupture"
                  : t.dashboard.kpiProducts}
              </span>
              <AlertTriangle className="h-4 w-4 text-teal-400 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-titanium-gradient font-mono tracking-tight">
                {currentStoreType === "grocery" ? outOfStockCount : productsCount}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {currentStoreType === "grocery"
                  ? locale === "ar"
                    ? `${outOfStockCount} نفدت من الرف • 0 قريبة الانتهاء`
                    : locale === "en"
                    ? `${outOfStockCount} Out of stock • 0 Expiring soon`
                    : `${outOfStockCount} En rupture • 0 Proches péremption`
                  : t.dashboard.kpiProductsSub}
              </p>
            </div>
          </div>
        </div>

        {/* KPI 4: Household Credit & Loyalty */}
        <div className="group relative rounded-3xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-900/80 hover:border-white/20 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-dot-matrix opacity-10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
              <span>
                {currentStoreType === "grocery"
                  ? locale === "ar"
                    ? "ديون كناش العائلات ونقاط الولاء"
                    : locale === "en"
                    ? "Household Credit & Loyalty"
                    : "Encours Carnet Ménages & Fidélité"
                  : t.dashboard.kpiCustomers}
              </span>
              <Users className="h-4 w-4 text-white group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-white font-mono">{customersCount}</div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {currentStoreType === "grocery"
                  ? locale === "ar"
                    ? "كناش كريدي العائلات النشطة بنظام المكافآت"
                    : locale === "en"
                    ? "Active household tabs & reward points"
                    : "Carnets ménages actifs avec points fidélité"
                  : t.dashboard.kpiCustomersSub}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supermarket Shelf & Expiry Radar Strip (Mode 1 Exclusive) */}
      {currentStoreType === "grocery" && (
        <div className="p-5 rounded-3xl border border-teal-500/25 bg-gradient-to-r from-zinc-950 via-[#070B0E] to-zinc-950 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>
                    {locale === "ar"
                      ? "رادار رفوف السوبرماركت وتواريخ الصلاحية"
                      : locale === "en"
                      ? "Supermarket Shelf & Expiry Radar"
                      : "Radar Rayons & Dates de Péremption (DLC)"}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {locale === "ar" ? "معيار المتاجر العصرية" : "Square Retail Standard"}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {locale === "ar"
                    ? "مراقبة ذكية فورية لسلامة المواد الاستهلاكية، حجز الفوارغ ورصيد قنينات الغاز والصناديق"
                    : "Contrôle automatique de fraîcheur, consignes bouteilles gaz et casiers"}
                </p>
              </div>
            </div>

            <Link
              href={`/${locale}/dashboard/inventory`}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 transition flex items-center gap-1"
            >
              <span>{locale === "ar" ? "فتح مراقبة الصلاحية والتصفية ←" : "Gérer le déstockage →"}</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                {locale === "ar" ? "سلامة الرفوف العامة" : "Santé Rayons"}
              </span>
              <span className="text-xl font-mono font-black text-emerald-400">{shelfHealthPercent}%</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {locale === "ar" ? "سلع سليمة ووفيرة" : "Stock conforme"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                {locale === "ar" ? "أقل من 15 يوم صلاحية" : "Péremption < 15j"}
              </span>
              <span className="text-xl font-mono font-black text-amber-400">0 {locale === "ar" ? "مواد" : "articles"}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {locale === "ar" ? "لا توجد مواد منتهية" : "Aucun périmé"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                {locale === "ar" ? "نفاد المخزون من الرف" : "Rupture Rayon"}
              </span>
              <span className="text-xl font-mono font-black text-red-400">{outOfStockCount} {locale === "ar" ? "مواد" : "articles"}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {locale === "ar"
                  ? outOfStockCount > 0
                    ? "تحتاج طلبية موزع"
                    : "المخزون متوفر بالكامل"
                  : outOfStockCount > 0
                  ? "À commander"
                  : "Rayons approvisionnés"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                {locale === "ar" ? "رهن الغاز والصناديق" : "Consignes Gaz/Casiers"}
              </span>
              <span className="text-xl font-mono font-black text-teal-300">
                {locale === "ar" ? "0 قنينات • 0 صناديق" : "0 bouteilles • 0 casiers"}
              </span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                {locale === "ar" ? "رصيد الرهن الصافي" : "Solde consigne"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fast POS CTA */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-white">
              {t.dashboard.offlineModeActive}
            </div>
            <h2 className="text-lg font-bold text-white">{t.dashboard.fastPosTitle}</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
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
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-white">
              {t.dashboard.automationBadge}
            </div>
            <h2 className="text-lg font-bold text-white">{t.dashboard.zReportTitle}</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t.dashboard.zReportDesc}
            </p>
          </div>
          <div className="mt-6">
            <Link
              href={`/${locale}/dashboard/reports`}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800"
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
