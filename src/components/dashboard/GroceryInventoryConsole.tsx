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
  Search,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react";
import { useAppDictionary } from "@/i18n/schema";
import { toast } from "sonner";
import { playSuccessSound, playTapSound } from "@/lib/audio";

interface GroceryInventoryConsoleProps {
  initialProducts: any[];
}

export function GroceryInventoryConsole({ initialProducts }: GroceryInventoryConsoleProps) {
  const { locale } = useAppDictionary();
  const [activeTab, setActiveTab] = useState<"shelf" | "dlc" | "shrinkage">("dlc");

  // Reference Grocery Items matching Blueprint (Image 3)
  const defaultItems = [
    {
      id: "prod-1",
      name: "Sultan Habka Tea 200g",
      aisle: "Rayon A2",
      packInfo: "36 Pack / 12 Unit",
      dlc: "2026-11-20",
      dlcLabel: "Yellow",
      dlcVariant: "yellow",
      salePrice: 16.0,
      stockQuantity: 12,
      imageUrl: null,
    },
    {
      id: "prod-2",
      name: "Atlas Olive Oil 1L",
      aisle: "Rayon B3",
      packInfo: "36 Pack / 12 Unit",
      dlc: "2026-11-25",
      dlcLabel: "Orange",
      dlcVariant: "orange",
      salePrice: 85.0,
      stockQuantity: 12,
      imageUrl: null,
    },
    {
      id: "prod-3",
      name: "Couscous Royal 1kg",
      aisle: "Rayon D1",
      packInfo: "36 Pack / 12 Unit",
      dlc: "2027-01-15",
      dlcLabel: "Green",
      dlcVariant: "green",
      salePrice: 18.0,
      stockQuantity: 24,
      imageUrl: null,
    },
    {
      id: "prod-4",
      name: "Atlalus Olive Oil 1kg",
      aisle: "Rayon A2",
      packInfo: "36 Pack / 12 Unit",
      dlc: "2027-01-15",
      dlcLabel: "Green",
      dlcVariant: "green",
      salePrice: 78.0,
      stockQuantity: 18,
      imageUrl: null,
    },
  ];

  const [productsList, setProductsList] = useState(() => {
    if (initialProducts && initialProducts.length > 0) {
      return initialProducts.map((p, idx) => ({
        ...p,
        aisle: p.aisle || `Rayon ${["A2", "B3", "D1", "C4"][idx % 4]}`,
        packInfo: "36 Pack / 12 Unit",
        dlc: p.dlc || (idx % 2 === 0 ? "2026-11-20" : "2027-01-15"),
        dlcLabel: idx % 3 === 0 ? "Yellow" : idx % 3 === 1 ? "Orange" : "Green",
        dlcVariant: idx % 3 === 0 ? "yellow" : idx % 3 === 1 ? "orange" : "green",
      }));
    }
    return defaultItems;
  });

  // Consigne Tracker state
  const [gasFull, setGasFull] = useState(45);
  const [gasEmpty, setGasEmpty] = useState(12);
  const [cratesFull, setCratesFull] = useState(30);
  const [cratesEmpty, setCratesEmpty] = useState(8);

  // Shrinkage Log state
  const [shrinkageLogs, setShrinkageLogs] = useState<Array<{ id: string; name: string; qty: number; reason: string; date: string }>>([
    {
      id: "1",
      name: "Lait UHT 1L",
      qty: 2,
      reason: locale === "ar" ? "قنينة مثقوبة أثناء التفريغ" : "Emballage percé à la réception",
      date: "09:30",
    },
    {
      id: "2",
      name: "Yaourt Fraise 110g",
      qty: 4,
      reason: locale === "ar" ? "تجاوز تاريخ الصلاحية DLC" : "Périmé",
      date: "Hier",
    },
  ]);

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
        : "Promo déstockage -30% appliquée avec succès !"
    );
  };

  const handlePrintShelfLabel = (product: any) => {
    playTapSound();
    toast.info(
      locale === "ar"
        ? `جاري طباعة بطاقة الرف 40x30mm لمنتج: ${product.name}`
        : `Impression étiquette rayon 40x30mm pour: ${product.name}`
    );
  };

  return (
    <div dir="ltr" className="space-y-6">
      {/* 4 Frosted Liquid Glass KPI Cards matching Image 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Cost Value MAD */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent backdrop-blur-xl border border-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_12px_30px_-10px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Total Cost Value MAD</span>
            <ArrowUpRight className="w-4 h-4 text-[#2DD4BF]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              2,450,000{" "}
              <span className="text-sm font-semibold text-zinc-400">MAD</span>
            </span>
          </div>
        </div>

        {/* Card 2: Retail Shelf Value MAD */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent backdrop-blur-xl border border-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_12px_30px_-10px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div className="text-xs font-semibold text-zinc-400">
            <span>Retail Shelf Value MAD</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              3,980,000{" "}
              <span className="text-sm font-semibold text-zinc-400">MAD</span>
            </span>
          </div>
        </div>

        {/* Card 3: DLC Expiry Alerts */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent backdrop-blur-xl border border-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_12px_30px_-10px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>DLC Expiry Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              38{" "}
              <span className="text-sm font-semibold text-zinc-400">items</span>
            </span>
          </div>
        </div>

        {/* Card 4: Gas & Crate Consigne Balance */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent backdrop-blur-xl border border-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_12px_30px_-10px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Gas & Crate Consigne Balance</span>
            <Package className="w-4 h-4 text-[#2DD4BF]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#5EEAD4] font-mono tracking-tight">
              +{gasFull}
            </span>
            <span className="text-xs font-semibold text-zinc-400">Units /</span>
            <span className="text-sm font-bold text-rose-400 font-mono">
              -{gasEmpty}
            </span>
            <span className="text-xs font-semibold text-zinc-400">Empty</span>
          </div>
        </div>
      </div>

      {/* Horizontal Underlined Tabs matching Image 3 */}
      <div className="flex items-center gap-6 border-b border-white/[0.08] text-sm font-semibold select-none pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("shelf")}
          className={`pb-3 transition-colors cursor-pointer relative ${
            activeTab === "shelf"
              ? "text-[#2DD4BF] font-bold border-b-2 border-[#2DD4BF]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          [Shelf & Warehouse Stock]
        </button>
        <span className="text-zinc-600 pb-3">|</span>
        <button
          type="button"
          onClick={() => setActiveTab("dlc")}
          className={`pb-3 transition-colors cursor-pointer relative ${
            activeTab === "dlc"
              ? "text-[#2DD4BF] font-bold border-b-2 border-[#2DD4BF]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          [DLC Expiry & -30% Clearance]
        </button>
        <span className="text-zinc-600 pb-3">|</span>
        <button
          type="button"
          onClick={() => setActiveTab("shrinkage")}
          className={`pb-3 transition-colors cursor-pointer relative ${
            activeTab === "shrinkage"
              ? "text-[#2DD4BF] font-bold border-b-2 border-[#2DD4BF]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          [Consigne & Shrinkage Audit]
        </button>
      </div>

      {/* =======================================================================
         TAB 1 & 2: DATA TABLE (Matching Image 3 Blueprint)
         ======================================================================= */}
      {activeTab !== "shrinkage" ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0E1318]/90 backdrop-blur-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121820] text-zinc-400 font-semibold border-b border-white/[0.08]">
              <tr>
                <th className="py-3.5 px-5">Product</th>
                <th className="py-3.5 px-4">Aisle</th>
                <th className="py-3.5 px-4">Pack vs Unit</th>
                <th className="py-3.5 px-4">DLC</th>
                <th className="py-3.5 px-4">-30% Promo</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {productsList.map((item) => {
                const isYellow = item.dlcVariant === "yellow";
                const isOrange = item.dlcVariant === "orange";
                const badgeClass = isYellow
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : isOrange
                  ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Product Name + Transparent Cutout on Checkerboard */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[linear-gradient(45deg,#18181b_25%,transparent_25%),linear-gradient(-45deg,#18181b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181b_75%),linear-gradient(-45deg,transparent_75%,#18181b_75%)] bg-[size:8px_8px] bg-[#0A0D10] border border-white/10 p-1 flex items-center justify-center shrink-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain filter drop-shadow"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold font-mono text-zinc-300 bg-zinc-900 rounded-lg">
                              PNG
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

                    {/* Aisle Badge */}
                    <td className="py-3.5 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#131920] border border-white/10 text-zinc-300">
                        {item.aisle}
                      </span>
                    </td>

                    {/* Pack vs Unit */}
                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      {item.packInfo}
                    </td>

                    {/* DLC Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border font-mono ${badgeClass}`}
                      >
                        {item.dlc} ({item.dlcLabel})
                      </span>
                    </td>

                    {/* -30% Promo Pill Button */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleApplyClearanceMarkdown(item.id)}
                        className="px-3.5 py-1 rounded-full bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#041E1B] font-extrabold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        -30% Promo
                      </button>
                    </td>

                    {/* Print 40x30mm Shelf Label Button */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handlePrintShelfLabel(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#151B22] hover:bg-[#1C242E] border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Print 40x30mm Shelf Label</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* =======================================================================
           TAB 3: CONSIGNE & SHRINKAGE AUDIT
           ======================================================================= */
        <div className="space-y-4 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent backdrop-blur-xl border border-white/[0.12] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2DD4BF]" />
              <span>Consigne Gas & Crate Tracking</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Bouteilles de Gaz</span>
                  <span className="text-[#5EEAD4] font-mono">100 DH / consigne</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Pleines: <strong className="text-white font-mono">{gasFull}</strong></span>
                  <span>Vides: <strong className="text-white font-mono">{gasEmpty}</strong></span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setGasFull((v) => v + 1); }}
                    className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                  >
                    + Pleine
                  </button>
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setGasEmpty((v) => Math.max(0, v - 1)); }}
                    className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                  >
                    - Vide
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Casiers Bouteilles</span>
                  <span className="text-[#5EEAD4] font-mono">15 DH / consigne</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Pleins: <strong className="text-white font-mono">{cratesFull}</strong></span>
                  <span>Vides: <strong className="text-white font-mono">{cratesEmpty}</strong></span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setCratesFull((v) => v + 1); }}
                    className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                  >
                    + Plein
                  </button>
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setCratesEmpty((v) => Math.max(0, v - 1)); }}
                    className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                  >
                    - Vide
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
