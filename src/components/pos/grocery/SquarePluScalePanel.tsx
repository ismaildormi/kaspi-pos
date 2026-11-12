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

  // Read weighted items dynamically from merchant catalog + custom PLU items (No hardcoded demo items)
  const allPluItems = useMemo<PluItem[]>(() => {
    const list: PluItem[] = [...customPlus];

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

  const fallbackPlu: PluItem = useMemo(() => {
    if (catalogProducts.length > 0) {
      const p = catalogProducts[0];
      return {
        plu: p.sku?.replace(/\D/g, "").slice(-4) || "1001",
        nameAr: p.name,
        nameFr: p.name,
        pricePerKg: Number(p.salePrice || p.price || 10),
        isCustom: false,
      };
    }
    return {
      plu: "1001",
      nameAr: locale === "ar" ? "منتج بالوزن" : locale === "en" ? "Weighed Product" : "Article Pesé",
      nameFr: locale === "en" ? "Weighed Product" : locale === "ar" ? "منتج بالوزن" : "Article Pesé",
      pricePerKg: 10,
      isCustom: false,
    };
  }, [catalogProducts, locale]);

  const [selectedPlu, setSelectedPlu] = useState<PluItem | null>(() => allPluItems[0] || fallbackPlu);

  useEffect(() => {
    if (!selectedPlu) {
      setSelectedPlu(allPluItems[0] || fallbackPlu);
    } else if (allPluItems.length > 0 && !allPluItems.some((item) => item.plu === selectedPlu.plu)) {
      setSelectedPlu(allPluItems[0] || fallbackPlu);
    }
  }, [allPluItems, fallbackPlu, selectedPlu]);

  const effectiveSelectedPlu = selectedPlu || allPluItems[0] || fallbackPlu;

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

  const weightPresets = [0.25, 0.5, 1.0, 2.0];
  const amountPresets = [10, 15, 20, 50];

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

  // Math Calculations: Real zero-math for the worker
  const activePlu = effectiveSelectedPlu;
  const activePricePerKg = activePlu ? activePlu.pricePerKg : 0;
  const currentWeightKg = parseFloat(weightInput) || 0;
  const currentTargetAmount = parseFloat(amountInput) || 0;

  // In Weight Mode: Total = Weight × Price/kg
  const computedTotalFromWeight = Math.round(activePricePerKg * currentWeightKg * 100) / 100;

  // In Amount Mode: Weight = Amount ÷ Price/kg
  const computedWeightFromAmountKg = activePricePerKg > 0 ? currentTargetAmount / activePricePerKg : 0;
  const computedWeightGrams = Math.round(computedWeightFromAmountKg * 1000);

  const handleAddToCart = () => {
    if (!activePlu) {
      toast.error(
        locale === "ar"
          ? "يرجى اختيار سلعة أولاً"
          : locale === "en"
          ? "Please select an item first"
          : "Veuillez sélectionner un article"
      );
      return;
    }

    playSuccessSound();

    if (calcMode === "weight") {
      if (currentWeightKg <= 0) return;
      const lineTotal = computedTotalFromWeight;
      const displayName =
        locale === "ar"
          ? `${activePlu.nameAr} (${currentWeightKg.toFixed(3)} كغ)`
          : locale === "en"
          ? `${activePlu.nameFr || activePlu.nameAr} (${currentWeightKg.toFixed(3)} kg)`
          : `${activePlu.nameFr} (${currentWeightKg.toFixed(3)} kg)`;

      const pluProduct: PosProduct = {
        id: `plu_${activePlu.plu}_${Date.now()}`,
        name: displayName,
        sku: `PLU-${activePlu.plu}`,
        barcode: `20${activePlu.plu}00000`,
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
          ? `${activePlu.nameAr} (${computedWeightGrams} غرام - ${computedWeightFromAmountKg.toFixed(3)} كغ)`
          : locale === "en"
          ? `${activePlu.nameFr || activePlu.nameAr} (${computedWeightGrams}g - ${computedWeightFromAmountKg.toFixed(3)}kg)`
          : `${activePlu.nameFr} (${computedWeightGrams}g - ${computedWeightFromAmountKg.toFixed(3)}kg)`;

      const pluProduct: PosProduct = {
        id: `plu_${activePlu.plu}_${Date.now()}`,
        name: displayName,
        sku: `PLU-${activePlu.plu}`,
        barcode: `20${activePlu.plu}00000`,
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
      toast.error(
        locale === "ar"
          ? "يرجى ملء جميع الحقول"
          : locale === "en"
          ? "Please fill all required fields"
          : "Veuillez remplir tous les champs"
      );
      return;
    }

    const price = parseFloat(newPriceKg);
    if (isNaN(price) || price <= 0) {
      toast.error(
        locale === "ar"
          ? "يرجى إدخال سعر صحيح لكل كغ"
          : locale === "en"
          ? "Invalid price per kg"
          : "Prix au kg invalide"
      );
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
    toast.success(
      locale === "ar"
        ? "تمت إضافة السلعة للميزان بنجاح"
        : locale === "en"
        ? "Scale item added successfully"
        : "Article pesé ajouté avec succès"
    );
  };

  const handleDeletePlu = (plu: string) => {
    const updated = customPlus.filter((item) => item.plu !== plu);
    setCustomPlus(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("kaspi_custom_plu_items", JSON.stringify(updated));
    }
    if (selectedPlu?.plu === plu) {
      setSelectedPlu(updated[0] || fallbackPlu);
    }
    toast.info(
      locale === "ar"
        ? "تم حذف السلعة من قائمة الميزان"
        : locale === "en"
        ? "Item removed from scale list"
        : "Article retiré"
    );
  };

  return (
    <div dir="ltr" className="h-full flex flex-col space-y-2 p-2 select-none overflow-hidden text-start">
      {/* Top Bar with Back Button & Add PLU Item */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-8 px-2.5 rounded-lg bg-[#111113] hover:bg-[#18181B] border border-white/[0.08] text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>
              {locale === "ar" ? "العودة للشبكة" : locale === "en" ? "Product Grid" : "Grille Articles"}
            </span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Scale className="w-4 h-4 text-zinc-400" />
            <span>
              {locale === "ar"
                ? "الميزان والخضر/اللحوم (PLU)"
                : locale === "en"
                ? "Scale & Produce/Meat (PLU)"
                : "Balance & Fruits/Légumes (PLU)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 px-3 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>
              {locale === "ar"
                ? "+ إضافة سلعة للميزان"
                : locale === "en"
                ? "+ New Weighed Item"
                : "+ Nouvel Article Pesé"}
            </span>
          </button>

          {activePlu && (
            <span className="hidden sm:inline font-mono text-[11px] text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.08]">
              PLU #{activePlu.plu} • {activePlu.pricePerKg.toFixed(2)} MAD/kg
            </span>
          )}
        </div>
      </div>

      {/* Main Split Grid: 7 Cols PLU Produce Matrix + 5 Cols Compact Dual Calculator */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-0 overflow-hidden items-start">
        {/* Left Side (7 Cols): PLU Produce Cards Matrix */}
        <div className="lg:col-span-7 h-full overflow-y-auto pr-1">
          {allPluItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-[#0D0D10] border border-dashed border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400">
                <Scale className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">
                {locale === "ar" ? "لا توجد سلع ميزان مضافة" : locale === "en" ? "No weighed items" : "Aucun article pesé"}
              </p>
              <p className="text-xs text-zinc-400 max-w-xs">
                {locale === "ar"
                  ? "أضف سلعة بالوزن (خضر، فواكه، توابل، زيتون) للبدء في الحساب التلقائي"
                  : locale === "en"
                  ? "Add a weighed item (produce, meat, spices, bulk) to start automatic calculation"
                  : "Ajoutez un article au poids (fruits, légumes, vrac) pour démarrer"}
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer"
              >
                {locale === "ar" ? "+ إضافة أول سلعة للميزان" : locale === "en" ? "+ Add First Item" : "+ Ajouter un premier article"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
              {allPluItems.map((item) => {
                const isSelected = activePlu?.plu === item.plu;
                return (
                  <div
                    key={item.plu}
                    onClick={() => {
                      playTapSound();
                      setSelectedPlu(item);
                    }}
                    className={`relative p-2.5 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between h-[92px] ${
                      isSelected
                        ? "bg-white text-zinc-950 border-white shadow-xs"
                        : "bg-[#0D0D10] hover:bg-[#121216] border-white/[0.08] text-zinc-300 hover:border-white/[0.20]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-mono font-black ${isSelected ? "text-zinc-950" : "text-zinc-400"}`}>
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
                            className={`p-0.5 transition-colors ${isSelected ? "text-zinc-600 hover:text-rose-600" : "text-zinc-500 hover:text-rose-400"}`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />}
                      </div>
                    </div>

                    <span className={`font-sans font-semibold text-xs leading-snug line-clamp-2 ${isSelected ? "text-zinc-950 font-bold" : "text-white"}`}>
                      {locale === "ar" ? item.nameAr : item.nameFr}
                    </span>

                    <div className={`flex items-baseline justify-between border-t pt-1 ${isSelected ? "border-zinc-200" : "border-white/[0.06]"}`}>
                      <span className={`font-mono font-black text-xs ${isSelected ? "text-zinc-950" : "text-white"}`}>
                        {item.pricePerKg.toFixed(2)}
                      </span>
                      <span className={`text-[9.5px] font-semibold ${isSelected ? "text-zinc-700" : "text-zinc-400"}`}>MAD/kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side (5 Cols): Compact Dual Mode Calculator (Fits 100% in viewport) */}
        <div className="lg:col-span-5 h-full max-h-[calc(100vh-140px)] flex flex-col justify-between p-2.5 rounded-2xl bg-[#0D0D10] border border-white/[0.08] space-y-2 overflow-y-auto">
          {activePlu ? (
            <>
              {/* Active Item Title & Price */}
              <div className="pb-1.5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[9.5px] font-mono text-zinc-400 font-bold">PLU #{activePlu.plu}</span>
                  <h4 className="font-bold text-xs text-white line-clamp-1">
                    {locale === "ar" ? activePlu.nameAr : activePlu.nameFr}
                  </h4>
                </div>
                <span className="text-xs font-mono font-black text-white">
                  {activePlu.pricePerKg.toFixed(2)} <span className="text-[9.5px] text-zinc-400 font-normal">MAD/kg</span>
                </span>
              </div>

              {/* Dual Mode Switcher: By Weight (kg) vs. By Target Amount (MAD) */}
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[#111113] border border-white/[0.08] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setCalcMode("weight");
                  }}
                  className={`h-7 rounded-md text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    calcMode === "weight"
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Weight className="w-3 h-3" />
                  <span>
                    {locale === "ar" ? "حساب بالوزن (كغ)" : locale === "en" ? "By Weight (kg)" : "Par Poids (kg)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setCalcMode("amount");
                  }}
                  className={`h-7 rounded-md text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    calcMode === "amount"
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Coins className="w-3 h-3" />
                  <span>
                    {locale === "ar" ? "حساب بالدرهم (MAD)" : locale === "en" ? "By Amount (MAD)" : "Par Montant (DH)"}
                  </span>
                </button>
              </div>

              {/* Primary Calculation Display */}
              {calcMode === "weight" ? (
                <div className="p-2.5 rounded-xl bg-[#111113] border border-white/[0.08] flex items-baseline justify-between shrink-0">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {locale === "ar" ? "الوزن المقاس:" : locale === "en" ? "Measured Weight:" : "Poids mesuré :"}
                  </span>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-xl font-black text-white tabular-nums tracking-tight">
                      {weightInput}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400">kg</span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-[#111113] border border-white/[0.12] space-y-1.5 shrink-0">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {locale === "ar" ? "مبلغ الزبون:" : locale === "en" ? "Target Amount:" : "Montant demandé :"}
                    </span>
                    <div className="flex items-baseline gap-1 font-mono">
                      <span className="text-xl font-black text-white tabular-nums">
                        {amountInput}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">MAD</span>
                    </div>
                  </div>

                  {/* Exact Weight To Put on Scale */}
                  <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[11.5px] font-mono">
                    <span className="font-bold text-zinc-400">
                      {locale === "ar" ? "الوزن الواجب وضعه:" : locale === "en" ? "Target Weight to Serve:" : "Poids à servir :"}
                    </span>
                    <span className="font-black text-white text-sm">
                      {computedWeightGrams}g ({computedWeightFromAmountKg.toFixed(3)}kg)
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Presets Bar */}
              <div className="grid grid-cols-4 gap-1 shrink-0">
                {calcMode === "weight"
                  ? weightPresets.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleSelectWeightPreset(w)}
                        className={`h-7 rounded-md text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          currentWeightKg === w
                            ? "bg-white text-zinc-950 border-white shadow-xs"
                            : "bg-[#111113] border-white/[0.08] text-zinc-300 hover:text-white"
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
                        className={`h-7 rounded-md text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          currentTargetAmount === amt
                            ? "bg-white text-zinc-950 border-white shadow-xs"
                            : "bg-[#111113] border-white/[0.08] text-zinc-300 hover:text-white"
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
                    className="h-10 rounded-xl bg-[#111113] hover:bg-[#18181B] active:scale-[0.98] border border-white/[0.08] text-white font-mono font-bold text-sm flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Real Zero-Math Footer & Add CTA */}
              <div className="pt-2 border-t border-white/[0.08] space-y-2 shrink-0">
                <div className="flex items-baseline justify-between font-mono text-xs">
                  <span className="font-bold text-zinc-400">
                    {locale === "ar" ? "المجموع المحسوب:" : locale === "en" ? "Calculated Total:" : "Total à ajouter :"}
                  </span>
                  <span className="text-lg font-black text-white tabular-nums">
                    {calcMode === "weight" ? computedTotalFromWeight.toFixed(2) : currentTargetAmount.toFixed(2)}{" "}
                    <span className="text-[10px] text-zinc-400">MAD</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="h-10 w-full rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {calcMode === "weight"
                      ? locale === "ar"
                        ? `إضافة للسلة (${computedTotalFromWeight.toFixed(2)} MAD)`
                        : locale === "en"
                        ? `Add to Cart (${computedTotalFromWeight.toFixed(2)} MAD)`
                        : `Ajouter au Panier (${computedTotalFromWeight.toFixed(2)} MAD)`
                      : locale === "ar"
                      ? `إضافة للسلة (${currentTargetAmount.toFixed(2)} MAD • ${computedWeightGrams}g)`
                      : locale === "en"
                      ? `Add to Cart (${currentTargetAmount.toFixed(2)} MAD • ${computedWeightGrams}g)`
                      : `Ajouter au Panier (${currentTargetAmount.toFixed(2)} MAD • ${computedWeightGrams}g)`}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-400">
              <Scale className="w-8 h-8 text-zinc-600 mb-1" />
              <p className="text-xs font-bold text-white">
                {locale === "ar" ? "اختر أو أضف سلعة ميزان" : locale === "en" ? "Select a weighed item" : "Sélectionnez un article pesé"}
              </p>
              <p className="text-[11px] text-zinc-500">
                {locale === "ar" ? "اضغط على + إضافة سلعة للبدء" : locale === "en" ? "Click + New Item to start" : "Cliquez sur + Nouvel Article"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Custom PLU Weighted Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="kaspi-frosted-glass w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-zinc-400" />
                <span>
                  {locale === "ar"
                    ? "إضافة سلعة جديدة للميزان (PLU)"
                    : locale === "en"
                    ? "New Weighed Item (PLU)"
                    : "Nouvel Article Pesé (PLU)"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPlu} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  {locale === "ar"
                    ? "كود PLU (4 أرقام مثل 4020):"
                    : locale === "en"
                    ? "PLU Code (4 digits, e.g. 4020):"
                    : "Code PLU (4 chiffres, ex: 4020) :"}
                </label>
                <input
                  type="text"
                  value={newPluCode}
                  onChange={(e) => setNewPluCode(e.target.value)}
                  placeholder="4020"
                  className="w-full h-9 px-3 bg-[#111113] border border-white/[0.08] focus:border-white rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  {locale === "ar" ? "اسم السلعة بالعربية:" : locale === "en" ? "Item Name (Arabic):" : "Nom en Arabe :"}
                </label>
                <input
                  type="text"
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  placeholder={locale === "ar" ? "مثال: زيتون أحمر مشرمل" : "Ex: Red Olives"}
                  className="w-full h-9 px-3 bg-[#111113] border border-white/[0.08] focus:border-white rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  {locale === "ar"
                    ? "اسم السلعة بالفرنسية (أو اللاتينية):"
                    : locale === "en"
                    ? "Item Name (Latin / English):"
                    : "Nom en Français :"}
                </label>
                <input
                  type="text"
                  value={newNameFr}
                  onChange={(e) => setNewNameFr(e.target.value)}
                  placeholder="Ex: Olives Rouges"
                  className="w-full h-9 px-3 bg-[#111113] border border-white/[0.08] focus:border-white rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  {locale === "ar"
                    ? "السعر للكيلوغرام (MAD / kg):"
                    : locale === "en"
                    ? "Price per kg (MAD / kg):"
                    : "Prix au kilo (MAD / kg) :"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPriceKg}
                  onChange={(e) => setNewPriceKg(e.target.value)}
                  placeholder="25.00"
                  className="w-full h-9 px-3 bg-[#111113] border border-white/[0.08] focus:border-white rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  {locale === "ar" ? "إلغاء" : locale === "en" ? "Cancel" : "Annuler"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer"
                >
                  {locale === "ar" ? "حفظ وإضافة" : locale === "en" ? "Save & Add" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
