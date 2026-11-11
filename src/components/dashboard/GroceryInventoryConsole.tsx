"use client";

import React, { useState } from "react";
import {
  Layers,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Percent,
  Plus,
  Minus,
  Barcode,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Package,
} from "lucide-react";
import { useAppDictionary } from "@/i18n/schema";
import { toast } from "sonner";
import { playSuccessSound, playTapSound } from "@/lib/audio";

interface GroceryInventoryConsoleProps {
  initialProducts: any[];
}

export function GroceryInventoryConsole({ initialProducts }: GroceryInventoryConsoleProps) {
  const { locale } = useAppDictionary();
  const [activeTab, setActiveTab] = useState<"shelf" | "dlc" | "shrinkage">("shelf");
  const [productsList, setProductsList] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAisle, setSelectedAisle] = useState("all");
  const [dlcFilter, setDlcFilter] = useState<"all" | "near" | "expired">("all");

  // Consigne Tracker state
  const [gasFull, setGasFull] = useState(18);
  const [gasEmpty, setGasEmpty] = useState(6);
  const [cratesFull, setCratesFull] = useState(12);
  const [cratesEmpty, setCratesEmpty] = useState(4);

  // Shrinkage Log state
  const [shrinkageLogs, setShrinkageLogs] = useState<Array<{ id: string; name: string; qty: number; reason: string; date: string }>>([
    {
      id: "1",
      name: "حليب معقم 1 لتر (UHT)",
      qty: 2,
      reason: locale === "ar" ? "قنينة مثقوبة أثناء التفريغ" : "Emballage percé",
      date: "Aujourd'hui 09:30",
    },
    {
      id: "2",
      name: "ياغورت فواكه 110g",
      qty: 4,
      reason: locale === "ar" ? "تجاوز تاريخ الصلاحية DLC" : "Périmé",
      date: "Hier 18:20",
    },
  ]);

  const aisles = [
    { id: "all", nameAr: "جميع الأجنحة", nameFr: "Tous les rayons" },
    { id: "dairy", nameAr: "الحليب والأجبان", nameFr: "Produits Laitiers" },
    { id: "drinks", nameAr: "المشروبات والمياه", nameFr: "Boissons & Eaux" },
    { id: "dry", nameAr: "البقالة الجافة والمعلبات", nameFr: "Épicerie Sèche" },
    { id: "cleaning", nameAr: "مواد التنظيف والورقيات", nameFr: "Entretien & Droguerie" },
  ];

  // Live Inventory Valuation
  const totalItemsCount = productsList.reduce((sum, p) => sum + (p.stockQuantity ?? 15), 0);
  const totalRetailValuation = productsList.reduce(
    (sum, p) => sum + (Number(p.salePrice) || 12) * (p.stockQuantity ?? 15),
    0
  );
  const totalCostValuation = totalRetailValuation * 0.78; // 22% estimated retail margin

  const handleApplyClearanceMarkdown = (productId: string) => {
    playSuccessSound();
    setProductsList((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const oldPrice = Number(p.salePrice) || 10;
          const discounted = Math.round(oldPrice * 0.7 * 100) / 100;
          return {
            ...p,
            salePrice: discounted,
            isDiscounted: true,
            discountLabel: "-30%",
          };
        }
        return p;
      })
    );
    toast.success(
      locale === "ar"
        ? "تم تطبيق تخفيض تصفية سريع -30% لمنع الخسارة قبل انتهاء الصلاحية!"
        : "Promo déstockage -30% appliquée avec succès !"
    );
  };

  const handleLogDamage = (product: any) => {
    playTapSound();
    const qty = 1;
    setShrinkageLogs((prev) => [
      {
        id: String(Date.now()),
        name: product.name,
        qty,
        reason: locale === "ar" ? "تلف أثناء العرض على الرف" : "Casse en rayon",
        date: "Maintenant",
      },
      ...prev,
    ]);
    toast.info(
      locale === "ar"
        ? `تم تسجيل إتلاف (${qty}) من "${product.name}" وخصمها من المخزون`
        : `Démarque enregistrée pour "${product.name}"`
    );
  };

  return (
    <div dir="ltr" className="space-y-6">
      {/* 3 Supermarket Navigation Tabs (Square Segmented Tab Bar) */}
      <div className="bg-[#0D1014] p-1 rounded-xl border border-white/[0.08] inline-flex items-center gap-1 overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab("shelf")}
          className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "shelf"
              ? "bg-[#14B8A6] text-[#041E1B] shadow-sm font-black"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04] font-semibold"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>
            {locale === "ar"
              ? "مخزون الرفوف والمستودع"
              : locale === "fr"
              ? "Stock Rayons & Réserve"
              : "Shelf & Warehouse Stock"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dlc")}
          className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "dlc"
              ? "bg-[#14B8A6] text-[#041E1B] shadow-sm font-black"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04] font-semibold"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {locale === "ar"
              ? "مراقبة الصلاحية DLC والتصفية (-30%)"
              : locale === "fr"
              ? "Péremptions DLC & Déstockage"
              : "DLC Expiry & Clearance"}
          </span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            activeTab === "dlc"
              ? "bg-[#041E1B]/20 text-[#041E1B]"
              : "bg-amber-400/20 text-amber-300"
          }`}>
            3
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shrinkage")}
          className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "shrinkage"
              ? "bg-[#14B8A6] text-[#041E1B] shadow-sm font-black"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04] font-semibold"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>
            {locale === "ar"
              ? "سجل التالف ورهن الغاز والصناديق"
              : locale === "fr"
              ? "Casse & Consignes Bouteilles"
              : "Shrinkage & Consigne Audit"}
          </span>
        </button>
      </div>

      {/* =======================================================================
         TAB 1: SHELF & WAREHOUSE STOCK + VALUATION
         ======================================================================= */}
      {activeTab === "shelf" && (
        <div className="space-y-5 animate-fadeIn">
          {/* Valuation Overview Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-3xl bg-zinc-950 border border-teal-500/20 shadow-lg">
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                {locale === "ar" ? "قيمة المخزون بسعر البيع (Retail)" : "Valeur Stock (Vente)"}
              </span>
              <span className="text-xl font-mono font-black text-white tabular-nums">
                {totalRetailValuation.toFixed(2)}{" "}
                <span className="text-xs font-normal text-zinc-400">MAD</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                {locale === "ar" ? "تكلفة الشراء التقديرية (Cost)" : "Coût d'Achat Estimé"}
              </span>
              <span className="text-xl font-mono font-black text-teal-300 tabular-nums">
                {totalCostValuation.toFixed(2)}{" "}
                <span className="text-xs font-normal text-zinc-400">MAD</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                {locale === "ar" ? "إجمالي القطع على الرف والمستودع" : "Nombre Total d'Unités"}
              </span>
              <span className="text-xl font-mono font-black text-white tabular-nums">
                {totalItemsCount}{" "}
                <span className="text-xs font-normal text-zinc-400">
                  {locale === "ar" ? "قطعة" : "unités"}
                </span>
              </span>
            </div>
          </div>

          {/* Aisle Filter Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {aisles.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedAisle(a.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
                  selectedAisle === a.id
                    ? "bg-white text-zinc-950 font-black border-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                }`}
              >
                {locale === "ar" ? a.nameAr : a.nameFr}
              </button>
            ))}
          </div>

          {/* Products Shelf Table */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <table className="w-full text-start text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4 text-start">السلعة / Article</th>
                  <th className="py-3 px-4 text-start">الجناح / Rayon</th>
                  <th className="py-3 px-4 text-center">الرصيد / Stock</th>
                  <th className="py-3 px-4 text-end">سعر البيع (MAD)</th>
                  <th className="py-3 px-4 text-end">سعر الباك (Pack)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {productsList.slice(0, 8).map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-zinc-950/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-white shrink-0">
                          {p.name ? p.name.charAt(0).toUpperCase() : "P"}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{p.name}</span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {p.barcode || p.sku}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {idx % 2 === 0 ? "الجناح 1: الأجبان" : "الجناح 2: المشروبات"}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {p.stockQuantity ?? 18}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-bold text-white">
                      {Number(p.salePrice || 12).toFixed(2)} MAD
                    </td>
                    <td className="py-3 px-4 text-end font-mono text-teal-300 font-bold">
                      {((Number(p.salePrice) || 12) * 6 * 0.95).toFixed(2)} MAD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =======================================================================
         TAB 2: DLC EXPIRATION & MARKDOWN RADAR (Clearance -30%)
         ======================================================================= */}
      {activeTab === "dlc" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <span className="font-bold block mb-0.5">
                {locale === "ar"
                  ? "نظام الحماية من الخسارة (Antigaspi & Déstockage Express):"
                  : "Protection contre les pertes & Déstockage Express :"}
              </span>
              <span>
                {locale === "ar"
                  ? "السلع المقترحة في هذه القائمة تقترب تواريخ صلاحيتها (DLC < 15 يوم). يمكنك تطبيق تخفيض تصفية فوري بنسبة -30% بنقرة واحدة لبيعها بسرعة للزبائن قبل انتهاء الصلاحية."
                  : "Ces articles approchent de leur DLC (< 15j). Appliquez une remise immédiate de -30% pour les écouler rapidement sans perte."}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: "exp_1",
                name: "حليب طازج مبستر 1 لتر",
                barcode: "611124500124",
                salePrice: 7.5,
                stock: 14,
                dlc: "18/11/2026",
                daysLeft: 7,
              },
              {
                id: "exp_2",
                name: "ياغورت كريمي طبيعي (Pack 4)",
                barcode: "611145200388",
                salePrice: 10.0,
                stock: 9,
                dlc: "20/11/2026",
                daysLeft: 9,
              },
              {
                id: "exp_3",
                name: "جبن أبيض طري مثلثات",
                barcode: "611198400192",
                salePrice: 16.0,
                stock: 6,
                dlc: "25/11/2026",
                daysLeft: 14,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono text-zinc-500">
                      EAN: {item.barcode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                      {locale === "ar"
                        ? `باقي ${item.daysLeft} أيام`
                        : `${item.daysLeft} jours restants`}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900 text-xs">
                    <span className="text-zinc-400">DLC: {item.dlc}</span>
                    <span className="font-mono text-zinc-300 font-bold">
                      {locale === "ar" ? "الكمية:" : "Stock:"} {item.stock}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <span className="text-base font-mono font-black text-white">
                    {item.salePrice.toFixed(2)} MAD
                  </span>

                  <button
                    type="button"
                    onClick={() => handleApplyClearanceMarkdown(item.id)}
                    className="sheen-btn px-3 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-zinc-950 text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-[0.98]"
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>
                      {locale === "ar" ? "تخفيض تصفية -30%" : "Promo Déstockage -30%"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================================
         TAB 3: SHRINKAGE (CASSE) & CONSIGNE RETURNABLE AUDIT
         ======================================================================= */}
      {activeTab === "shrinkage" && (
        <div className="space-y-5 animate-fadeIn">
          {/* Consigne Gas Bottles & Crates Tracker Grid */}
          <div className="p-5 rounded-3xl bg-zinc-950 border border-teal-500/25 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-400" />
              <span>
                {locale === "ar"
                  ? "رصيد رهن قنينات الغاز والصناديق (Consigne)"
                  : "Audit des Consignes Gaz & Casiers Bouteilles"}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gas Bottles */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {locale === "ar" ? "قنينات الغاز الكبيرة والصغيرة" : "Bouteilles de Gaz"}
                  </span>
                  <span className="text-xs font-mono font-bold text-teal-300">
                    {locale === "ar" ? "الرهن: 100 MAD" : "Consigne: 100 DH"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">
                      {locale === "ar" ? "المليئة بالمتجر:" : "Pleines:"}
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {gasFull}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">
                      {locale === "ar" ? "الفوارغ المسترجعة:" : "Vides:"}
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {gasEmpty}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setGasFull((v) => v + 1);
                    }}
                    className="flex-1 py-1 rounded-lg bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700 transition"
                  >
                    + استلام مليء
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setGasEmpty((v) => Math.max(0, v - 1));
                    }}
                    className="flex-1 py-1 rounded-lg bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700 transition"
                  >
                    - تسليم موزع
                  </button>
                </div>
              </div>

              {/* Crates */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {locale === "ar" ? "صناديق المشروبات الزجاجية" : "Casiers Boissons Verre"}
                  </span>
                  <span className="text-xs font-mono font-bold text-teal-300">
                    {locale === "ar" ? "الرهن: 15 MAD" : "Consigne: 15 DH"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">
                      {locale === "ar" ? "الصناديق المليئة:" : "Pleins:"}
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {cratesFull}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">
                      {locale === "ar" ? "الصناديق الفارغة:" : "Vides:"}
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {cratesEmpty}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setCratesFull((v) => v + 1);
                    }}
                    className="flex-1 py-1 rounded-lg bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700 transition"
                  >
                    + استلام مليء
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setCratesEmpty((v) => Math.max(0, v - 1));
                    }}
                    className="flex-1 py-1 rounded-lg bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700 transition"
                  >
                    - تسليم موزع
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Shrinkage & Damaged Goods Log */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <div className="p-3.5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {locale === "ar"
                  ? "سجل السلع التالفة والضائعة (Casse & Démarque)"
                  : "Registre des Pertes & Produits Endommagés"}
              </span>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {shrinkageLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{log.name}</span>
                    <span className="text-[11px] text-zinc-400">{log.reason} • {log.date}</span>
                  </div>
                  <span className="font-mono font-black text-red-400 px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    -{log.qty} {locale === "ar" ? "قطع" : "pcs"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
