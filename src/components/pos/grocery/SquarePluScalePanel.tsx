"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Scale,
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  X,
  Coins,
  Weight,
  Layers,
} from "lucide-react";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";
import { getCachedData } from "@/lib/cache/client-cache";
import { playTapSound, playSuccessSound } from "@/lib/audio";
import { toast } from "sonner";

interface SquarePluScalePanelProps {
  onBack: () => void;
  products?: PosProduct[];
}

export interface PluItem {
  plu: string;
  nameAr: string;
  nameFr: string;
  pricePerKg: number;
  isCustom?: boolean;
}

const DEFAULT_PLU_ITEMS: PluItem[] = [
  { plu: "4011", nameAr: "موز مستورد ممتاز", nameFr: "Bananes Importées", pricePerKg: 14.0 },
  { plu: "4012", nameAr: "برتقال عصير نافيل", nameFr: "Oranges à Jus", pricePerKg: 6.0 },
  { plu: "4065", nameAr: "طماطم سوس سلطة", nameFr: "Tomates Rondes", pricePerKg: 7.0 },
  { plu: "4080", nameAr: "بطاطس بيضاء للقلي", nameFr: "Pommes de Terre", pricePerKg: 6.5 },
  { plu: "4090", nameAr: "بصل جاف بلدي", nameFr: "Oignons Jaunes", pricePerKg: 5.5 },
  { plu: "4129", nameAr: "تفاح أطلس أحمر (غالا)", nameFr: "Pommes Gala Atlas", pricePerKg: 12.5 },
  { plu: "4135", nameAr: "زيتون أسود بلدي", nameFr: "Olives Noires Beldi", pricePerKg: 28.0 },
  { plu: "4150", nameAr: "تمور المجهول مغربية", nameFr: "Dattes Majhoul Maroc", pricePerKg: 75.0 },
];

export function SquarePluScalePanel({ onBack, products: propProducts }: SquarePluScalePanelProps) {
  const { locale } = useAppDictionary();
  const { addToCart } = usePosStore();

  // Load custom PLU items from localStorage
  const [customPlus, setCustomPlus] = useState<PluItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("kaspi_custom_plu_items");
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn("Failed to parse custom PLUs", e);
      }
    }
    return [];
  });

  const catalogProducts = useMemo<PosProduct[]>(() => {
    if (propProducts && propProducts.length > 0) return propProducts;
    try {
      const cached = getCachedData<PosProduct[]>("products_catalog", []);
      if (Array.isArray(cached.data)) return cached.data;
    } catch {}
    return [];
  }, [propProducts]);

  // Merge real catalog items that are weighted / produce with custom & default PLUs
  const allPluItems = useMemo(() => {
    const list: PluItem[] = [...DEFAULT_PLU_ITEMS, ...customPlus];

    // Add any catalog products marked as scale items or kg
    catalogProducts.forEach((p: PosProduct) => {
      if (p.isScaleItem || p.weightUnit === "kg" || p.categoryId === "produce") {
        const skuNumber = p.sku?.replace(/\D/g, "").slice(-4) || "4099";
        const alreadyExists = list.some((item) => item.plu === skuNumber || item.nameFr === p.name);
        if (!alreadyExists) {
          list.push({
            plu: skuNumber,
            nameAr: p.name,
            nameFr: p.name,
            pricePerKg: p.salePrice || 10,
            isCustom: true,
          });
        }
      }
    });

    return list;
  }, [customPlus, catalogProducts]);

  const [selectedPlu, setSelectedPlu] = useState<PluItem>(allPluItems[0]);

  // Dual Calculation Mode: "weight" (kg/g) or "amount" (customer wants X MAD)
  const [calcMode, setCalcMode] = useState<"weight" | "amount">("weight");

  // Input states
  const [weightInput, setWeightInput] = useState<string>("1.000");
  const [amountInput, setAmountInput] = useState<string>("10.00");

  // Modal to add custom PLU item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPluCode, setNewPluCode] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [newNameFr, setNewNameFr] = useState("");
  const [newPriceKg, setNewPriceKg] = useState("");

  const weightPresets = [0.25, 0.5, 1.0, 2.0, 5.0];
  const amountPresets = [5, 10, 15, 20, 50];

  const handleKeypadPress = (val: string) => {
    playTapSound();

    if (calcMode === "weight") {
      if (val === "C") {
        setWeightInput("0");
        return;
      }
      if (val === "BACK") {
        setWeightInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
        return;
      }
      if (val === "." && weightInput.includes(".")) return;
      setWeightInput((prev) => (prev === "0" && val !== "." ? val : prev + val));
    } else {
      if (val === "C") {
        setAmountInput("0");
        return;
      }
      if (val === "BACK") {
        setAmountInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
        return;
      }
      if (val === "." && amountInput.includes(".")) return;
      setAmountInput((prev) => (prev === "0" && val !== "." ? val : prev + val));
    }
  };

  const handleSelectWeightPreset = (w: number) => {
    playTapSound();
    setWeightInput(w.toFixed(3));
  };

  const handleSelectAmountPreset = (amt: number) => {
    playTapSound();
    setAmountInput(amt.toFixed(2));
  };

  // Math Calculations: Real zero-math for the cashier
  const currentWeightKg = parseFloat(weightInput) || 0;
  const currentTargetAmount = parseFloat(amountInput) || 0;

  // In Weight Mode: Total = Weight × Price/kg
  const computedTotalFromWeight = Math.round(selectedPlu.pricePerKg * currentWeightKg * 100) / 100;

  // In Amount Mode: Weight = Amount ÷ Price/kg
  const computedWeightFromAmountKg =
    selectedPlu.pricePerKg > 0 ? currentTargetAmount / selectedPlu.pricePerKg : 0;
  const computedWeightGrams = Math.round(computedWeightFromAmountKg * 1000);

  const handleAddToCart = () => {
    playSuccessSound();

    if (calcMode === "weight") {
      if (currentWeightKg <= 0) return;
      const lineTotal = computedTotalFromWeight;
      const displayName =
        locale === "ar"
          ? `${selectedPlu.nameAr} (${currentWeightKg.toFixed(3)} كغ)`
          : `${selectedPlu.nameFr} (${currentWeightKg.toFixed(3)} kg)`;

      const pluProduct: PosProduct = {
        id: `plu_${selectedPlu.plu}_${Date.now()}`,
        name: displayName,
        sku: `PLU-${selectedPlu.plu}`,
        barcode: `20${selectedPlu.plu}00000`,
        salePrice: lineTotal,
        taxRate: 0,
        trackStock: true,
        stockQuantity: 999,
        categoryId: "produce",
        isScaleItem: true,
      };
      addToCart(pluProduct, 1);
    } else {
      if (currentTargetAmount <= 0) return;
      const displayName =
        locale === "ar"
          ? `${selectedPlu.nameAr} (${computedWeightGrams} غرام - ${computedWeightFromAmountKg.toFixed(3)} كغ)`
          : `${selectedPlu.nameFr} (${computedWeightGrams}g - ${computedWeightFromAmountKg.toFixed(3)}kg)`;

      const pluProduct: PosProduct = {
        id: `plu_${selectedPlu.plu}_${Date.now()}`,
        name: displayName,
        sku: `PLU-${selectedPlu.plu}`,
        barcode: `20${selectedPlu.plu}00000`,
        salePrice: currentTargetAmount,
        taxRate: 0,
        trackStock: true,
        stockQuantity: 999,
        categoryId: "produce",
        isScaleItem: true,
      };
      addToCart(pluProduct, 1);
    }

    onBack();
  };

  const handleSaveCustomPlu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPluCode.trim() || !newNameFr.trim() || !newPriceKg.trim()) {
      toast.error(locale === "ar" ? "يرجى ملء جميع الحقول" : "Veuillez remplir tous les champs");
      return;
    }

    const price = parseFloat(newPriceKg);
    if (isNaN(price) || price <= 0) {
      toast.error(locale === "ar" ? "يرجى إدخال سعر صحيح لكل كغ" : "Prix au kg invalide");
      return;
    }

    const newItem: PluItem = {
      plu: newPluCode.trim(),
      nameAr: newNameAr.trim() || newNameFr.trim(),
      nameFr: newNameFr.trim(),
      pricePerKg: price,
      isCustom: true,
    };

    const updated = [newItem, ...customPlus];
    setCustomPlus(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("kaspi_custom_plu_items", JSON.stringify(updated));
    }

    setSelectedPlu(newItem);
    setIsAddModalOpen(false);
    setNewPluCode("");
    setNewNameAr("");
    setNewNameFr("");
    setNewPriceKg("");
    toast.success(locale === "ar" ? "تمت إضافة السلعة للميزان بنجاح" : "Article pesé ajouté avec succès");
  };

  const handleDeletePlu = (plu: string) => {
    const updated = customPlus.filter((item) => item.plu !== plu);
    setCustomPlus(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("kaspi_custom_plu_items", JSON.stringify(updated));
    }
    if (selectedPlu.plu === plu) {
      setSelectedPlu(allPluItems[0]);
    }
    toast.info(locale === "ar" ? "تم حذف السلعة من قائمة الميزان" : "Article retiré");
  };

  return (
    <div dir="ltr" className="h-full flex flex-col space-y-2 p-2 select-none overflow-hidden text-start">
      {/* Top Bar with Back Button & Add PLU Item */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-8 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === "ar" ? "العودة للشبكة" : "Grille Articles"}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-[#14B8A6]">
            <Scale className="w-4 h-4" />
            <span>{locale === "ar" ? "ميزان وخضر وفواكه (PLU)" : "Balance & Fruits/Légumes (PLU)"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 px-2.5 rounded-lg bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 border border-[#14B8A6]/40 text-[#14B8A6] hover:text-[#2DD4BF] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{locale === "ar" ? "+ إضافة سلعة للميزان (PLU)" : "+ Nouvel Article Pesé"}</span>
          </button>

          <span className="hidden sm:inline font-mono text-[11px] text-zinc-400 bg-white/[0.04] px-2 py-1 rounded-md border border-white/[0.06]">
            PLU #{selectedPlu.plu} • {selectedPlu.pricePerKg.toFixed(2)} MAD/kg
          </span>
        </div>
      </div>

      {/* Main Split Grid: 7 Cols PLU Produce Matrix + 5 Cols Compact Dual Calculator */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-0 overflow-hidden items-start">
        {/* Left Side (7 Cols): PLU Produce Cards Matrix */}
        <div className="lg:col-span-7 h-full overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
            {allPluItems.map((item) => {
              const isSelected = selectedPlu.plu === item.plu;
              return (
                <div
                  key={item.plu}
                  onClick={() => {
                    playTapSound();
                    setSelectedPlu(item);
                  }}
                  className={`relative p-2.5 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between h-[92px] ${
                    isSelected
                      ? "bg-[#14B8A6]/15 border-[#14B8A6] shadow-[0_0_12px_rgba(20,184,166,0.25)] ring-1 ring-[#14B8A6]"
                      : "bg-[#0D1116] hover:bg-[#11171E] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-black text-[#14B8A6]">
                      #{item.plu}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlu(item.plu);
                          }}
                          className="text-zinc-500 hover:text-rose-400 p-0.5"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#14B8A6]" />}
                    </div>
                  </div>

                  <span className="font-sans font-semibold text-xs leading-snug line-clamp-2 text-white">
                    {locale === "ar" ? item.nameAr : item.nameFr}
                  </span>

                  <div className="flex items-baseline justify-between border-t border-white/[0.06] pt-1">
                    <span className="font-mono font-black text-xs text-white">
                      {item.pricePerKg.toFixed(2)}
                    </span>
                    <span className="text-[9.5px] font-semibold text-zinc-400">MAD/kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side (5 Cols): Compact Dual Mode Calculator (Fits 100% in viewport) */}
        <div className="lg:col-span-5 h-full max-h-[calc(100vh-140px)] flex flex-col justify-between p-2.5 rounded-2xl bg-[#0D1116] border border-white/[0.08] space-y-2 overflow-y-auto">
          {/* Active Item Title & Price */}
          <div className="pb-1.5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <div>
              <span className="text-[9.5px] font-mono text-[#14B8A6] font-bold">PLU #{selectedPlu.plu}</span>
              <h4 className="font-bold text-xs text-white line-clamp-1">
                {locale === "ar" ? selectedPlu.nameAr : selectedPlu.nameFr}
              </h4>
            </div>
            <span className="text-xs font-mono font-black text-white">
              {selectedPlu.pricePerKg.toFixed(2)} <span className="text-[9.5px] text-zinc-400 font-normal">MAD/kg</span>
            </span>
          </div>

          {/* Dual Mode Switcher: By Weight (kg) vs. By Target Amount (MAD) */}
          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[#080B0E] border border-white/[0.06] shrink-0">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setCalcMode("weight");
              }}
              className={`h-7 rounded-md text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                calcMode === "weight"
                  ? "bg-[#14B8A6] text-[#041E1B] shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Weight className="w-3 h-3" />
              <span>{locale === "ar" ? "حساب بالوزن (كغ)" : "Par Poids (kg)"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTapSound();
                setCalcMode("amount");
              }}
              className={`h-7 rounded-md text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                calcMode === "amount"
                  ? "bg-[#14B8A6] text-[#041E1B] shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>{locale === "ar" ? "حساب بالدرهم (X DH)" : "Par Montant (DH)"}</span>
            </button>
          </div>

          {/* Primary Calculation Display */}
          {calcMode === "weight" ? (
            <div className="p-2 rounded-xl bg-[#080B0E] border border-white/[0.08] flex items-baseline justify-between shrink-0">
              <span className="text-[11px] font-semibold text-zinc-400">
                {locale === "ar" ? "الوزن المقاس:" : "Poids mesuré :"}
              </span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-xl font-black text-white tabular-nums tracking-tight">
                  {weightInput}
                </span>
                <span className="text-[11px] font-bold text-zinc-400">kg</span>
              </div>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-[#080B0E] border border-teal-500/30 space-y-1 shrink-0">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-semibold text-zinc-400">
                  {locale === "ar" ? "مبلغ الزبون:" : "Montant demandé :"}
                </span>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-xl font-black text-white tabular-nums">
                    {amountInput}
                  </span>
                  <span className="text-[11px] font-bold text-teal-400">MAD</span>
                </div>
              </div>

              {/* Exact Weight To Put on Scale */}
              <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between text-[11.5px] font-mono">
                <span className="font-bold text-teal-300">
                  {locale === "ar" ? "الوزن الواجب وضعه:" : "Poids à servir :"}
                </span>
                <span className="font-black text-teal-300 text-sm">
                  {computedWeightGrams}g ({computedWeightFromAmountKg.toFixed(3)}kg)
                </span>
              </div>
            </div>
          )}

          {/* Quick Presets Bar */}
          <div className="grid grid-cols-5 gap-1 shrink-0">
            {calcMode === "weight"
              ? weightPresets.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleSelectWeightPreset(w)}
                    className={`h-6.5 rounded-md text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      currentWeightKg === w
                        ? "bg-[#14B8A6] text-[#041E1B] border-[#14B8A6]"
                        : "bg-[#131920] border-white/[0.08] text-zinc-300 hover:text-white"
                    }`}
                  >
                    {w >= 1 ? `${w}kg` : `${w * 1000}g`}
                  </button>
                ))
              : amountPresets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectAmountPreset(amt)}
                    className={`h-6.5 rounded-md text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      currentTargetAmount === amt
                        ? "bg-[#14B8A6] text-[#041E1B] border-[#14B8A6]"
                        : "bg-[#131920] border-white/[0.08] text-zinc-300 hover:text-white"
                    }`}
                  >
                    {amt} DH
                  </button>
                ))}
          </div>

          {/* 3×4 Compact Touch Keypad */}
          <div className="grid grid-cols-3 gap-1 shrink-0">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "C"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                className="h-8 rounded-lg bg-[#131920] hover:bg-[#1A222B] active:scale-[0.98] border border-white/[0.07] text-white font-mono font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
              >
                {key}
              </button>
            ))}
          </div>

          {/* Real Zero-Math Footer & Add CTA */}
          <div className="pt-1.5 border-t border-white/[0.08] space-y-1.5 shrink-0">
            <div className="flex items-baseline justify-between font-mono text-xs">
              <span className="font-bold text-zinc-400">
                {locale === "ar" ? "المجموع المحسوب:" : "Total à ajouter :"}
              </span>
              <span className="text-lg font-black text-[#14B8A6] tabular-nums">
                {calcMode === "weight" ? computedTotalFromWeight.toFixed(2) : currentTargetAmount.toFixed(2)}{" "}
                <span className="text-[10px] text-zinc-400">MAD</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="h-9.5 w-full rounded-xl bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#041E1B] font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {calcMode === "weight"
                  ? locale === "ar"
                    ? `إضافة للسلة (${computedTotalFromWeight.toFixed(2)} MAD)`
                    : `Ajouter au Panier (${computedTotalFromWeight.toFixed(2)} MAD)`
                  : locale === "ar"
                  ? `إضافة للسلة (${currentTargetAmount.toFixed(2)} MAD • ${computedWeightGrams}g)`
                  : `Ajouter au Panier (${currentTargetAmount.toFixed(2)} MAD • ${computedWeightGrams}g)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add Custom PLU Weighted Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#0D1116] border border-white/[0.12] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#14B8A6]" />
                <span>{locale === "ar" ? "إضافة سلعة جديدة للميزان (PLU)" : "Nouvel Article Pesé (PLU)"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPlu} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  {locale === "ar" ? "كود PLU (4 أرقام مثل 4020):" : "Code PLU (4 chiffres, ex: 4020) :"}
                </label>
                <input
                  type="text"
                  value={newPluCode}
                  onChange={(e) => setNewPluCode(e.target.value)}
                  placeholder="4020"
                  maxLength={6}
                  required
                  className="w-full h-8 px-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-mono font-bold focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  {locale === "ar" ? "اسم السلعة (عربي):" : "Nom de l'article (Arabe) :"}
                </label>
                <input
                  type="text"
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  placeholder="مثال: تمر بلدي، زيتون، لوز..."
                  className="w-full h-8 px-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  {locale === "ar" ? "اسم السلعة (فرنسي أو عام):" : "Nom de l'article (Français) :"}
                </label>
                <input
                  type="text"
                  value={newNameFr}
                  onChange={(e) => setNewNameFr(e.target.value)}
                  placeholder="Ex: Olives Beldi, Amandes..."
                  required
                  className="w-full h-8 px-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  {locale === "ar" ? "الثمن لكل كيلوغرام (MAD / kg):" : "Prix au Kilogramme (MAD / kg) :"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newPriceKg}
                  onChange={(e) => setNewPriceKg(e.target.value)}
                  placeholder="24.50"
                  required
                  className="w-full h-8 px-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-mono font-black focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-8 px-3 rounded-lg bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700"
                >
                  {locale === "ar" ? "إلغاء" : "Annuler"}
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-lg bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#041E1B] font-bold"
                >
                  {locale === "ar" ? "حفظ وإضافة" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
