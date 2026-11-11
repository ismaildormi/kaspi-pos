"use client";

import React, { useState } from "react";
import { Scale, ArrowLeft, Plus, Check, Delete } from "lucide-react";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";
import { playTapSound, playSuccessSound } from "@/lib/audio";

interface SquarePluScalePanelProps {
  onBack: () => void;
}

export const SQUARE_GROCERY_PLUS = [
  { plu: "4011", nameAr: "موز مستورد ممتاز", nameFr: "Bananes Importées", pricePerKg: 14.0 },
  { plu: "4012", nameAr: "برتقال عصير نافيل", nameFr: "Oranges à Jus", pricePerKg: 6.0 },
  { plu: "4065", nameAr: "طماطم سوس سلطة", nameFr: "Tomates Rondes", pricePerKg: 7.0 },
  { plu: "4080", nameAr: "بطاطس بيضاء للقلي", nameFr: "Pommes de Terre", pricePerKg: 6.5 },
  { plu: "4090", nameAr: "بصل جاف بلدي", nameFr: "Oignons Jaunes", pricePerKg: 5.5 },
  { plu: "4129", nameAr: "تفاح أطلس أحمر (غالا)", nameFr: "Pommes Gala Atlas", pricePerKg: 12.5 },
];

export function SquarePluScalePanel({ onBack }: SquarePluScalePanelProps) {
  const { locale } = useAppDictionary();
  const { addToCart } = usePosStore();

  const [selectedPlu, setSelectedPlu] = useState(SQUARE_GROCERY_PLUS[0]);
  const [weightKg, setWeightKg] = useState<number>(1.0);
  const [keypadInput, setKeypadInput] = useState<string>("1.000");

  const weightPresets = [0.25, 0.5, 1.0, 2.0, 5.0];

  const handleKeypadPress = (val: string) => {
    playTapSound();
    if (val === "C") {
      setKeypadInput("0");
      setWeightKg(0);
      return;
    }
    if (val === "BACK") {
      const next = keypadInput.length > 1 ? keypadInput.slice(0, -1) : "0";
      setKeypadInput(next);
      const parsed = parseFloat(next);
      if (!isNaN(parsed)) setWeightKg(parsed);
      return;
    }
    if (val === "." && keypadInput.includes(".")) return;

    const next = keypadInput === "0" && val !== "." ? val : keypadInput + val;
    setKeypadInput(next);
    const parsed = parseFloat(next);
    if (!isNaN(parsed) && parsed > 0) {
      setWeightKg(parsed);
    }
  };

  const handleSelectPreset = (w: number) => {
    playTapSound();
    setWeightKg(w);
    setKeypadInput(w.toFixed(3));
  };

  const handleAddToCart = () => {
    if (!selectedPlu || weightKg <= 0) return;
    playSuccessSound();

    const lineTotal = Math.round(selectedPlu.pricePerKg * weightKg * 100) / 100;
    const displayName =
      locale === "ar"
        ? `${selectedPlu.nameAr} (${weightKg.toFixed(3)} kg)`
        : `${selectedPlu.nameFr} (${weightKg.toFixed(3)} kg)`;

    const pluProduct: PosProduct = {
      id: `plu_${selectedPlu.plu}`,
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
    onBack();
  };

  const lineTotal = (selectedPlu.pricePerKg * weightKg).toFixed(2);

  return (
    <div dir="ltr" className="h-full flex flex-col space-y-3 p-1 animate-fadeIn select-none">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="h-8 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === "ar" ? "العودة للشبكة" : "Grille Articles"}</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#14B8A6]">
            <Scale className="w-4 h-4" />
            <span>{locale === "ar" ? "ميزان وخضر وفواكه (PLU)" : "Balance & Fruits/Légumes (PLU)"}</span>
          </div>
        </div>

        <span className="font-mono text-xs text-zinc-400">
          PLU #{selectedPlu.plu} • {selectedPlu.pricePerKg.toFixed(2)} MAD/kg
        </span>
      </div>

      {/* Main Split Grid: 4-Digit PLU Produce Cards on Left, Touch Keypad on Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-y-auto">
        {/* Left Side (7 Cols): PLU Produce Cards Matrix */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5 auto-rows-max">
          {SQUARE_GROCERY_PLUS.map((item) => {
            const isSelected = selectedPlu.plu === item.plu;
            return (
              <button
                key={item.plu}
                type="button"
                onClick={() => {
                  playTapSound();
                  setSelectedPlu(item);
                }}
                className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between h-[100px] ${
                  isSelected
                    ? "bg-[#14B8A6]/15 border-[#14B8A6] shadow-[0_0_15px_rgba(20,184,166,0.25)] ring-1 ring-[#14B8A6]"
                    : "bg-[#0D1116] hover:bg-[#11171E] border-white/[0.08] text-zinc-300 hover:border-white/[0.2]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-mono font-black text-[#14B8A6]">
                    #{item.plu}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#14B8A6]" />}
                </div>

                <span className="font-sans font-semibold text-xs leading-snug line-clamp-2 text-white">
                  {locale === "ar" ? item.nameAr : item.nameFr}
                </span>

                <div className="flex items-baseline justify-between border-t border-white/[0.06] pt-1 mt-1">
                  <span className="font-mono font-black text-xs text-white">
                    {item.pricePerKg.toFixed(2)}
                  </span>
                  <span className="text-[9.5px] font-semibold text-zinc-400">MAD/kg</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side (5 Cols): Square Touch Keypad & Presets */}
        <div className="lg:col-span-5 flex flex-col justify-between p-3.5 rounded-2xl bg-[#0D1116] border border-white/[0.08] space-y-3">
          {/* Active Produce Header */}
          <div className="pb-2 border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#14B8A6] font-bold">PLU #{selectedPlu.plu}</span>
              <h4 className="font-bold text-sm text-white">{locale === "ar" ? selectedPlu.nameAr : selectedPlu.nameFr}</h4>
            </div>
            <div className="text-end font-mono">
              <span className="text-xs text-zinc-400 block">{selectedPlu.pricePerKg.toFixed(2)} MAD/kg</span>
            </div>
          </div>

          {/* Measured Weight Display */}
          <div className="p-2.5 rounded-xl bg-[#080B0E] border border-white/[0.08] flex items-baseline justify-between">
            <span className="text-xs font-semibold text-zinc-400">
              {locale === "ar" ? "الوزن المقاس:" : "Poids mesuré :"}
            </span>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                {keypadInput}
              </span>
              <span className="text-xs font-bold text-zinc-400">kg</span>
            </div>
          </div>

          {/* Weight Presets Bar */}
          <div className="grid grid-cols-5 gap-1">
            {weightPresets.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleSelectPreset(w)}
                className={`h-7 rounded-md text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                  weightKg === w
                    ? "bg-[#14B8A6] text-[#041E1B] border-[#14B8A6]"
                    : "bg-[#131920] border-white/[0.08] text-zinc-300 hover:text-white"
                }`}
              >
                {w >= 1 ? `${w}kg` : `${w * 1000}g`}
              </button>
            ))}
          </div>

          {/* 3×4 Numeric Touch Keypad */}
          <div className="grid grid-cols-3 gap-1.5 flex-1 max-h-48">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "C"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                className="h-9 rounded-lg bg-[#131920] hover:bg-[#1A222B] active:scale-[0.98] border border-white/[0.07] text-white font-mono font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
              >
                {key}
              </button>
            ))}
          </div>

          {/* Calculated Total & Add CTA */}
          <div className="pt-2 border-t border-white/[0.08] space-y-2">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xs font-bold text-zinc-400">
                {locale === "ar" ? "المجموع المحسوب:" : "Montant Ligne :"}
              </span>
              <span className="text-xl font-black text-[#14B8A6] tabular-nums">
                {lineTotal} <span className="text-xs text-zinc-400">MAD</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="h-11 w-full rounded-xl bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#041E1B] font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {locale === "ar"
                  ? `إضافة للسلة (${lineTotal} MAD)`
                  : `Ajouter au Panier (${lineTotal} MAD)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
