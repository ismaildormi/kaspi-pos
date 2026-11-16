"use client";

import React, { useState } from "react";
import {
  Layers,
  Clock,
  Trash2,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Printer,
  Percent,
} from "lucide-react";
import { useAppDictionary } from "@/i18n/schema";
import { toast } from "sonner";
import { playSuccessSound, playTapSound } from "@/lib/audio";
import { KaspiMiniSparkline } from "@/components/analytics/KaspiMiniSparkline";
import { KaspiGlassAnalyticsModal } from "@/components/analytics/KaspiGlassAnalyticsModal";
import { useKaspiAnalytics } from "@/lib/analytics/useKaspiAnalytics";
import type { AnalyticsMetric } from "@/lib/analytics/types";

interface GroceryInventoryConsoleProps {
  initialProducts: any[];
}

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
        {/* Left Face */}
        <path d="M12 48 L38 61 L38 72 L12 59 Z" fill="#242C37" stroke="#3A4657" strokeWidth="0.8" />
        <rect x="18" y="52" width="6" height="3" rx="0.5" fill="#14181F" transform="skewY(26)" />
        <rect x="27" y="48" width="6" height="3" rx="0.5" fill="#14181F" transform="skewY(26)" />
        
        {/* Right Face */}
        <path d="M38 61 L64 48 L64 59 L38 72 Z" fill="#1C232C" stroke="#3A4657" strokeWidth="0.8" />
        <rect x="42" y="58" width="6" height="3" rx="0.5" fill="#14181F" transform="skewY(-26)" />
        <rect x="51" y="62" width="6" height="3" rx="0.5" fill="#14181F" transform="skewY(-26)" />

        {/* Top Rim */}
        <path d="M38 43 L64 30 L38 18 L12 30 Z" fill="#2E3744" stroke="#48566A" strokeWidth="0.8" />
        <path d="M38 41 L59 30 L38 21 L17 30 Z" fill="#181D24" />
      </g>

      {/* Bottom Right Slate Crate */}
      <g opacity="0.95">
        {/* Left Face */}
        <path d="M46 51 L68 62 L68 73 L46 62 Z" fill="#242C37" stroke="#3A4657" strokeWidth="0.8" />
        <rect x="50" y="54" width="5" height="3" rx="0.5" fill="#14181F" transform="skewY(26)" />
        <rect x="58" y="50" width="5" height="3" rx="0.5" fill="#14181F" transform="skewY(26)" />

        {/* Right Face */}
        <path d="M68 62 L94 49 L94 60 L68 73 Z" fill="#1A2028" stroke="#3A4657" strokeWidth="0.8" />
        <rect x="72" y="60" width="5" height="3" rx="0.5" fill="#14181F" transform="skewY(-26)" />
        <rect x="81" y="65" width="5" height="3" rx="0.5" fill="#14181F" transform="skewY(-26)" />

        {/* Top Rim */}
        <path d="M68 47 L94 34 L68 22 L42 34 Z" fill="#2B3441" stroke="#48566A" strokeWidth="0.8" />
        <path d="M68 45 L89 34 L68 25 L47 34 Z" fill="#161B22" />
      </g>

      {/* Top Stacked Teal/Green Crate */}
      <g>
        {/* Left Face */}
        <path d="M22 28 L48 41 L48 53 L22 40 Z" fill="#0D9488" stroke="#2DD4BF" strokeWidth="1" />
        <rect x="28" y="31" width="7" height="3.5" rx="0.75" fill="#042F2E" transform="skewY(26)" />
        <rect x="37" y="27" width="7" height="3.5" rx="0.75" fill="#042F2E" transform="skewY(26)" />

        {/* Right Face */}
        <path d="M48 41 L74 28 L74 40 L48 53 Z" fill="#0F766E" stroke="#2DD4BF" strokeWidth="1" />
        <rect x="52" y="38" width="7" height="3.5" rx="0.75" fill="#042F2E" transform="skewY(-26)" />
        <rect x="61" y="43" width="7" height="3.5" rx="0.75" fill="#042F2E" transform="skewY(-26)" />

        {/* Top Rim (Luminous Mint-Teal) */}
        <path d="M48 23 L74 10 L48 0 L22 10 Z" fill="#14B8A6" stroke="#5EEAD4" strokeWidth="1" />
        <path d="M48 20 L68 10 L48 2 L28 10 Z" fill="#042F2E" />
        <line x1="48" y1="2" x2="48" y2="20" stroke="#0D9488" strokeWidth="1" />
        <line x1="28" y1="10" x2="68" y2="10" stroke="#0D9488" strokeWidth="1" />
      </g>
    </svg>
  );
}

export function GroceryInventoryConsole({ initialProducts }: GroceryInventoryConsoleProps) {
  const { locale } = useAppDictionary();
  const [activeTab, setActiveTab] = useState<"shelf" | "dlc" | "shrinkage">("dlc");

  const [activeMetricModal, setActiveMetricModal] = useState<{
    metric: AnalyticsMetric;
    title: string;
    unitLabel: string;
  } | null>(null);
  const { data: analytics } = useKaspiAnalytics("retail_value", "7d", true);
  const sparks = analytics?.sparklines;

  // Clean universal inventory state (zero fake demo items)
  const defaultItems: any[] = [];

  const [productsList, setProductsList] = useState(() => {
    if (initialProducts && initialProducts.length > 0) {
      const nowMs = Date.now();
      return initialProducts.map((p) => {
        const qty = Number(p.stockQuantity ?? 0);
        const lowThresh = Number(p.lowStockThreshold ?? 5);
        const rawDlc = typeof p.dlc === "string" && p.dlc && p.dlc !== "—" ? p.dlc : "";
        let dlcVariant: "yellow" | "orange" | "green" = "green";
        let dlcLabel: "Yellow" | "Orange" | "Green" = "Green";
        if (rawDlc) {
          const daysLeft = (new Date(rawDlc).getTime() - nowMs) / 86400000;
          if (daysLeft <= 7) {
            dlcVariant = "orange";
            dlcLabel = "Orange";
          } else if (daysLeft <= 30) {
            dlcVariant = "yellow";
            dlcLabel = "Yellow";
          }
        } else if (qty <= lowThresh) {
          dlcVariant = "orange";
          dlcLabel = "Orange";
        }
        return {
          ...p,
          aisle: p.aisle || (locale === "ar" ? "عام" : "Général"),
          packInfo: `${qty} ${p.unit || "u"}`,
          dlc: rawDlc || "—",
          dlcLabel,
          dlcVariant,
        };
      });
    }
    return defaultItems;
  });

  // Real computed inventory metrics (zero hardcoded figures)
  const totalCostValueMad = productsList.reduce(
    (sum, p) => sum + Number(p.costPrice || 0) * Math.max(0, Number(p.stockQuantity || 0)),
    0
  );
  const totalRetailValueMad = productsList.reduce(
    (sum, p) => sum + Number(p.salePrice || 0) * Math.max(0, Number(p.stockQuantity || 0)),
    0
  );
  const dlcAlertCount = productsList.filter((p) => p.dlcVariant !== "green").length;
  const totalUnitsOnShelf = productsList.reduce(
    (sum, p) => sum + Math.max(0, Number(p.stockQuantity || 0)),
    0
  );
  const lowOrEmptyCount = productsList.filter(
    (p) => Number(p.stockQuantity || 0) <= Number(p.lowStockThreshold ?? 5)
  ).length;

  // Consigne Tracker state (manual container deposit ledger below)
  const [gasFull, setGasFull] = useState(0);
  const [gasEmpty, setGasEmpty] = useState(0);
  const [cratesFull, setCratesFull] = useState(0);
  const [cratesEmpty, setCratesEmpty] = useState(0);

  const getDlcColorText = (variant: string, label: string) => {
    if (variant === "yellow" || label.toLowerCase() === "yellow") {
      return locale === "ar" ? "أصفر" : locale === "fr" ? "Jaune" : "Yellow";
    }
    if (variant === "orange" || label.toLowerCase() === "orange" || variant === "red" || label.toLowerCase() === "red") {
      return locale === "ar" ? "برتقالي" : locale === "fr" ? "Orange" : "Orange";
    }
    return locale === "ar" ? "أخضر" : locale === "fr" ? "Vert" : "Green";
  };

  const handleApplyClearanceMarkdown = (productId: string) => {
    playSuccessSound();
    setProductsList((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const oldPrice = Number(p.salePrice) || 15;
          const discounted = Math.round(oldPrice * 0.7 * 100) / 100;
          return {
            ...p,
            salePrice: discounted,
            isDiscounted: true,
          };
        }
        return p;
      })
    );
    toast.success(
      locale === "ar"
        ? "تم تطبيق تخفيض تصفية سريع -30% وتحديث سعر الرف فورا!"
        : locale === "en"
        ? "Applied -30% clearance markdown successfully!"
        : "Promo déstockage -30% appliquée avec succès !"
    );
  };

  const handlePrintShelfLabel = (product: any) => {
    playTapSound();
    toast.info(
      locale === "ar"
        ? `جاري طباعة بطاقة الرف 40x30mm لمنتج: ${product.name}`
        : locale === "en"
        ? `Printing 40x30mm shelf label for: ${product.name}`
        : `Impression étiquette rayon 40x30mm pour: ${product.name}`
    );
  };

  const costTitle = locale === "ar" ? "إجمالي قيمة الشراء (MAD)" : locale === "fr" ? "Valeur d'Achat Stock (MAD)" : "Total Cost Value MAD";
  const retailTitle = locale === "ar" ? "إجمالي قيمة بيع الرفوف (MAD)" : locale === "fr" ? "Valeur Marchande Rayon (MAD)" : "Retail Shelf Value MAD";
  const alertsTitle = locale === "ar" ? "تنبيهات اقتراب انتهاء الصلاحية والنفاد" : locale === "fr" ? "Alertes DLC & Stock Faible" : "Expiry & Low-Stock Alerts";
  const stockTitle = locale === "ar" ? "إجمالي وحدات المخزون والصناديق" : locale === "fr" ? "Unités en Stock & Ruptures" : "Total Stock Units & Alerts";

  return (
    <div dir="ltr" className="space-y-6">
      {/* 4 Interactive Frosted Glass KPI Cards (100% Real Computed Inventory Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Cost Value MAD */}
        <button
          type="button"
          onClick={() => setActiveMetricModal({ metric: "cost_value", title: costTitle, unitLabel: "MAD" })}
          className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between text-start cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 gap-2">
            <span>{costTitle}</span>
            <ArrowUpRight className="w-4 h-4 text-[#2DD4BF] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div className="mt-3 space-y-2.5">
            <span className="text-2xl font-black text-white font-mono tracking-tight block">
              {totalCostValueMad.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
              <span className="text-sm font-semibold text-zinc-400">MAD</span>
            </span>
            <KaspiMiniSparkline
              values={sparks?.cost_value?.values}
              deltaPct={sparks?.cost_value?.deltaPct ?? 0}
              positiveIsGood={true}
            />
          </div>
        </button>

        {/* Card 2: Retail Shelf Value MAD */}
        <button
          type="button"
          onClick={() => setActiveMetricModal({ metric: "retail_value", title: retailTitle, unitLabel: "MAD" })}
          className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between text-start cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 gap-2">
            <span>{retailTitle}</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div className="mt-3 space-y-2.5">
            <span className="text-2xl font-black text-white font-mono tracking-tight block">
              {totalRetailValueMad.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
              <span className="text-sm font-semibold text-zinc-400">MAD</span>
            </span>
            <KaspiMiniSparkline
              values={sparks?.retail_value?.values}
              deltaPct={sparks?.retail_value?.deltaPct ?? 0}
              positiveIsGood={true}
            />
          </div>
        </button>

        {/* Card 3: Real DLC & Threshold Alerts */}
        <button
          type="button"
          onClick={() =>
            setActiveMetricModal({
              metric: "alerts",
              title: alertsTitle,
              unitLabel: locale === "ar" ? "تنبيه" : "alerts",
            })
          }
          className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between text-start cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 gap-2">
            <span>{alertsTitle}</span>
            <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0" />
          </div>
          <div className="mt-3 space-y-2.5">
            <span className="text-2xl font-black text-white font-mono tracking-tight block">
              {dlcAlertCount}{" "}
              <span className="text-sm font-semibold text-zinc-400">
                {locale === "ar" ? "سلعة" : locale === "fr" ? "articles" : "items"}
              </span>
            </span>
            <KaspiMiniSparkline
              values={sparks?.alerts?.values}
              deltaPct={sparks?.alerts?.deltaPct ?? 0}
              positiveIsGood={false}
            />
          </div>
        </button>

        {/* Card 4: Real Stock Units vs Low/Out Alerts */}
        <button
          type="button"
          onClick={() =>
            setActiveMetricModal({
              metric: "items",
              title: stockTitle,
              unitLabel: locale === "ar" ? "وحدة" : "u",
            })
          }
          className="kaspi-frosted-card kaspi-frosted-card-hover kaspi-polar-aurora-orbit group relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between text-start cursor-pointer"
        >
          <div className="text-xs font-semibold text-zinc-300">
            <span>{stockTitle}</span>
          </div>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-2xl font-black text-white font-mono tracking-tight">
                  {Math.round(totalUnitsOnShelf)}
                </span>
                <span className="text-xs font-semibold text-zinc-400">
                  {locale === "ar" ? "وحدة" : "Units"}
                </span>
                <span className="text-xs font-semibold text-zinc-500 mx-0.5">·</span>
                <span className="text-sm font-bold text-[#F87171] font-mono">
                  {lowOrEmptyCount}
                </span>
                <span className="text-xs font-semibold text-[#F87171]/80">
                  {locale === "ar" ? "منخفض" : locale === "fr" ? "Faible" : "Low"}
                </span>
              </div>
              <KaspiMiniSparkline
                values={sparks?.items?.values}
                deltaPct={sparks?.items?.deltaPct ?? 0}
                positiveIsGood={true}
              />
            </div>
            <IsometricCratesIllustration className="w-14 h-11 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>
        </button>
      </div>

      <KaspiGlassAnalyticsModal
        isOpen={activeMetricModal !== null}
        onClose={() => setActiveMetricModal(null)}
        metric={activeMetricModal?.metric || "retail_value"}
        title={activeMetricModal?.title || retailTitle}
        unitLabel={activeMetricModal?.unitLabel || "MAD"}
        locale={locale}
      />

      {/* Sleek Translucent Aurora Pill Tabs */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold select-none pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("shelf")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "shelf"
              ? "kaspi-glass-btn kaspi-orbit-active text-white font-semibold"
              : "kaspi-frosted-glass text-zinc-400 hover:text-white"
          }`}
        >
          {locale === "ar" ? "مخزون الرفوف والمستودع" : locale === "fr" ? "Stock Rayon & Entrepôt" : "Shelf & Warehouse Stock"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("dlc")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "dlc"
              ? "kaspi-glass-btn kaspi-orbit-active text-white font-semibold"
              : "kaspi-frosted-glass text-zinc-400 hover:text-white"
          }`}
        >
          {locale === "ar" ? "تواريخ الصلاحية وتخفيض -30%" : locale === "fr" ? "DLC & Déstockage -30%" : "DLC Expiry & -30% Clearance"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("shrinkage")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "shrinkage"
              ? "kaspi-glass-btn kaspi-orbit-active text-white font-semibold"
              : "kaspi-frosted-glass text-zinc-400 hover:text-white"
          }`}
        >
          {locale === "ar" ? "تدقيق الرهن والهالك" : locale === "fr" ? "Audit Consignes & Démarque" : "Consigne & Shrinkage Audit"}
        </button>
      </div>

      {/* =======================================================================
         TAB 1 & 2: DATA TABLE (Matching Image Blueprint)
         ======================================================================= */}
      {activeTab !== "shrinkage" ? (
        <div className="kaspi-frosted-card rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.05] text-[var(--kaspi-text-secondary)] font-semibold border-b border-white/[0.08]">
              <tr>
                <th className="py-3.5 px-5">{locale === "ar" ? "المنتج" : locale === "fr" ? "Article" : "Product"}</th>
                <th className="py-3.5 px-4">{locale === "ar" ? "الجناح / الرف" : locale === "fr" ? "Rayon" : "Aisle"}</th>
                <th className="py-3.5 px-4">{locale === "ar" ? "الصندوق مقابل الوحدة" : locale === "fr" ? "Colis vs Unité" : "Pack vs Unit"}</th>
                <th className="py-3.5 px-4">{locale === "ar" ? "تاريخ الصلاحية (DLC)" : "DLC"}</th>
                <th className="py-3.5 px-4">{locale === "ar" ? "تخفيض -30%" : "-30% Promo"}</th>
                <th className="py-3.5 px-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {productsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 text-zinc-400">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500">
                        <Package className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <p className="font-bold text-sm text-white">
                        {locale === "ar" ? "لا توجد منتجات مسجلة في المخزون" : locale === "en" ? "No items in inventory" : "Aucun article dans l'inventaire"}
                      </p>
                      <p className="text-xs text-zinc-500 max-w-sm">
                        {locale === "ar"
                          ? "أضف منتجاتك من الكتالوج أو من شاشة البيع السريع لتتبع الرفوف وتواريخ الصلاحية"
                          : locale === "en"
                          ? "Add items from catalog or POS to track aisles and expiry dates"
                          : "Ajoutez vos articles depuis le catalogue ou l'écran POS pour suivre les rayons et DLC"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                productsList.map((item) => {
                  const isYellow = item.dlcVariant === "yellow";
                  const isOrange = item.dlcVariant === "orange";
                  const badgeClass = isYellow
                    ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#FBBF24]"
                    : isOrange
                    ? "bg-[#EA580C]/15 border-[#EA580C]/30 text-[#FB923C]"
                    : "bg-[#10B981]/15 border-[#10B981]/30 text-[#34D399]";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                    {/* Product Name + White-Background Product PNG Thumbnail */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl kaspi-product-white-box p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-[92%] h-[92%] object-contain"
                            />
                          ) : (
                            <div className="w-full h-full rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-[var(--kaspi-text-secondary)]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block">
                            {item.name}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {item.salePrice ? `${Number(item.salePrice).toFixed(2)} MAD` : ""}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Aisle Pill (Pure Translucent Frosted Crystal Pill) */}
                    <td className="py-3.5 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold kaspi-glass-surface text-[var(--kaspi-text-secondary)]">
                        {item.aisle}
                      </span>
                    </td>

                    {/* Pack vs Unit */}
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-300">
                      {item.packInfo}
                    </td>

                    {/* DLC Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold border whitespace-nowrap ${badgeClass}`}
                      >
                        {item.dlc} ({getDlcColorText(item.dlcVariant, item.dlcLabel)})
                      </span>
                    </td>

                    {/* -30% Promo Luminous White Glass Pill Button */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleApplyClearanceMarkdown(item.id)}
                        className="kaspi-glass-btn px-4 py-1.5 rounded-full text-white font-semibold text-xs transition-all active:scale-95 cursor-pointer"
                      >
                        -30% Promo
                      </button>
                    </td>

                    {/* Print 40x30mm Shelf Label Button */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handlePrintShelfLabel(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#181C22] hover:bg-[#222832] border border-white/10 text-white text-xs font-medium transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{locale === "ar" ? "طباعة لاصقة 40×30 مم" : locale === "fr" ? "Imprimer Étiquette 40×30mm" : "Print 40x30mm Shelf Label"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      ) : (
        /* =======================================================================
           TAB 3: CONSIGNE & SHRINKAGE AUDIT
           ======================================================================= */
        <div className="space-y-4 animate-fadeIn">
          <div className="kaspi-frosted-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2DD4BF]" />
              <span>{locale === "ar" ? "تتبع رهن القنينات والصناديق والهالك" : locale === "fr" ? "Suivi Consignes Gaz & Casiers" : "Consigne Gas & Crate Tracking"}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{locale === "ar" ? "قنينات الغاز (بوطاغاز)" : locale === "en" ? "Gas Bottles (Butagaz)" : "Bouteilles de Gaz (Butagaz)"}</span>
                  <span className="text-[#5EEAD4] font-mono">{locale === "ar" ? "100 درهم / رهن" : locale === "fr" ? "100 DH / consigne" : "100 MAD / deposit"}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{locale === "ar" ? "ممتلئة:" : locale === "fr" ? "Pleines :" : "Full:"} <strong className="text-white font-mono">{gasFull}</strong></span>
                  <span>{locale === "ar" ? "فارغة:" : locale === "fr" ? "Vides :" : "Empty:"} <strong className="text-white font-mono">{gasEmpty}</strong></span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setGasFull((v) => v + 1); }}
                    className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                  >
                    {locale === "ar" ? "+ ممتلئة" : locale === "fr" ? "+ Pleine" : "+ Full"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setGasEmpty((v) => Math.max(0, v - 1)); }}
                    className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                  >
                    {locale === "ar" ? "- فارغة" : locale === "fr" ? "- Vide" : "- Empty"}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{locale === "ar" ? "صناديق المشروبات الغازية" : locale === "en" ? "Bottle & Soda Crates" : "Casiers Bouteilles / Sodas"}</span>
                  <span className="text-[#5EEAD4] font-mono">{locale === "ar" ? "15 درهم / رهن" : locale === "fr" ? "15 DH / consigne" : "15 MAD / deposit"}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{locale === "ar" ? "ممتلئة:" : locale === "fr" ? "Pleins :" : "Full:"} <strong className="text-white font-mono">{cratesFull}</strong></span>
                  <span>{locale === "ar" ? "فارغة:" : locale === "fr" ? "Vides :" : "Empty:"} <strong className="text-white font-mono">{cratesEmpty}</strong></span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setCratesFull((v) => v + 1); }}
                    className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                  >
                    {locale === "ar" ? "+ ممتلئ" : locale === "fr" ? "+ Plein" : "+ Full"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setCratesEmpty((v) => Math.max(0, v - 1)); }}
                    className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                  >
                    {locale === "ar" ? "- فارغ" : locale === "fr" ? "- Vide" : "- Empty"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
