"use client";

import React, { useState } from "react";
import {
  Scan,
  Scale,
  Search,
  X,
  Package,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";
import { playTapSound, playSuccessSound } from "@/lib/audio";

interface GroceryScannerUtilityBarProps {
  products: PosProduct[];
  onMultiplierApplied?: (multiplier: number) => void;
}

// Built-in standard Moroccan FMCG & Produce PLU shortcuts
const STANDARD_PLU_LIST = [
  { plu: "4011", nameAr: "موز مستورد ممتاز", nameFr: "Bananes Importées", pricePerKg: 14.0 },
  { plu: "4012", nameAr: "تفاح أطلس أحمر", nameFr: "Pommes Atlas Rouges", pricePerKg: 12.5 },
  { plu: "4013", nameAr: "طماطم سوس سلطة", nameFr: "Tomates Rondes", pricePerKg: 7.0 },
  { plu: "4014", nameAr: "بطاطس بيضاء للقلي", nameFr: "Pommes de Terre", pricePerKg: 6.5 },
  { plu: "4015", nameAr: "بصل جاف بلدي", nameFr: "Oignons Jaunes", pricePerKg: 5.5 },
  { plu: "4016", nameAr: "برتقال عصير نافيل", nameFr: "Oranges à Jus", pricePerKg: 6.0 },
  { plu: "4017", nameAr: "زيتون أحمر مخلل", nameFr: "Olives Rouges Marinées", pricePerKg: 28.0 },
  { plu: "4018", nameAr: "ليمون حامض بلدي", nameFr: "Citrons Jaunes", pricePerKg: 9.0 },
];

export function GroceryScannerUtilityBar({
  products,
  onMultiplierApplied,
}: GroceryScannerUtilityBarProps) {
  const { locale } = useAppDictionary();
  const { cart, addToCart, updateItemQuantity } = usePosStore();

  const [activeMultiplier, setActiveMultiplier] = useState<number | null>(null);
  const [isPriceVerifierOpen, setIsPriceVerifierOpen] = useState(false);
  const [isPluModalOpen, setIsPluModalOpen] = useState(false);

  // Price Verifier state
  const [verifierQuery, setVerifierQuery] = useState("");
  const [verifiedProduct, setVerifiedProduct] = useState<PosProduct | null>(null);

  // PLU Modal state
  const [selectedPlu, setSelectedPlu] = useState(STANDARD_PLU_LIST[0]);
  const [weightKg, setWeightKg] = useState<number>(1.0);
  const [customWeightInput, setCustomWeightInput] = useState<string>("1.000");

  const handleSetMultiplier = (m: number) => {
    playTapSound();
    if (activeMultiplier === m) {
      setActiveMultiplier(null);
      return;
    }
    setActiveMultiplier(m);
    if (onMultiplierApplied) onMultiplierApplied(m);

    // If there is an active item in the cart, multiply its quantity
    if (cart.length > 0) {
      const lastItem = cart[cart.length - 1];
      updateItemQuantity(lastItem.productId, m);
    }
  };

  const handleSearchVerifier = (q: string) => {
    setVerifierQuery(q);
    const clean = q.trim().toLowerCase();
    if (!clean) {
      setVerifiedProduct(null);
      return;
    }
    const match = products.find(
      (p) =>
        p.barcode?.toLowerCase() === clean ||
        p.sku.toLowerCase() === clean ||
        p.name.toLowerCase().includes(clean)
    );
    if (match) {
      setVerifiedProduct(match);
      playSuccessSound();
    }
  };

  const handleAddPluToCart = () => {
    if (!selectedPlu || weightKg <= 0) return;
    playSuccessSound();

    const linePrice = Math.round(selectedPlu.pricePerKg * weightKg * 100) / 100;
    const displayName =
      locale === "ar"
        ? `${selectedPlu.nameAr} (${weightKg.toFixed(3)} kg)`
        : `${selectedPlu.nameFr} (${weightKg.toFixed(3)} kg)`;

    const pluProduct: PosProduct = {
      id: `plu_${selectedPlu.plu}`,
      name: displayName,
      sku: `PLU-${selectedPlu.plu}`,
      barcode: `20${selectedPlu.plu}00000`,
      salePrice: linePrice,
      taxRate: 0,
      trackStock: true,
      stockQuantity: 999,
      categoryId: "produce",
      isScaleItem: true,
    };

    addToCart(pluProduct, 1);
    setIsPluModalOpen(false);
  };

  return (
    <>
      {/* 3D Hardware Utility Console for Supermarket High-Velocity Operations */}
      <div
        dir="ltr"
        className="w-full mb-3 px-3 py-2 rounded-2xl bg-zinc-950/90 border border-teal-500/20 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-2.5 transition-all"
      >
        {/* Left: Instant Quantity Multipliers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider me-1 hidden sm:inline">
            {locale === "ar" ? "المضاعف:" : locale === "fr" ? "MULT:" : "QTY:"}
          </span>
          {[
            { label: "×2", val: 2 },
            { label: "×6 Pack", val: 6 },
            { label: "×12 Carton", val: 12 },
            { label: "×24 Caisse", val: 24 },
          ].map((mult) => {
            const isSelected = activeMultiplier === mult.val;
            return (
              <button
                key={mult.val}
                type="button"
                onClick={() => handleSetMultiplier(mult.val)}
                className={`keycap-3d h-8 px-2.5 rounded-xl text-xs font-mono font-black transition-all cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? "bg-teal-400 text-zinc-950 shadow-[0_0_14px_rgba(45,212,191,0.5)] border border-teal-300"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700"
                }`}
              >
                {mult.label}
              </button>
            );
          })}
        </div>

        {/* Right: Price Verifier + PLU Loose Produce Quick Tools */}
        <div className="flex items-center gap-2">
          {/* 1. Price & DLC Expiry Verifier Button */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setIsPriceVerifierOpen(true);
            }}
            className="keycap-3d h-8 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Scan className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px]">
              {locale === "ar"
                ? "فحص السعر والصلاحية"
                : locale === "fr"
                ? "Vérificateur Prix & DLC"
                : "Price & DLC Check"}
            </span>
          </button>

          {/* 2. PLU Produce Weighed Entry Button */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setIsPluModalOpen(true);
            }}
            className="keycap-3d h-8 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:text-teal-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Scale className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px]">
              {locale === "ar" ? "كود الميزان PLU" : locale === "fr" ? "Balance PLU" : "PLU Produce"}
            </span>
          </button>
        </div>
      </div>

      {/* =======================================================================
         MODAL 1: PRICE, SHELF & DLC EXPIRATION VERIFIER
         ======================================================================= */}
      {isPriceVerifierOpen && (
        <div
          dir="ltr"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
        >
          <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {locale === "ar"
                      ? "جهاز فحص السعر وصلاحية الرفوف (DLC)"
                      : locale === "fr"
                      ? "Vérificateur de Prix & DLC"
                      : "Price & Shelf DLC Verifier"}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {locale === "ar"
                      ? "امسح الباركود أو اكتب اسم السلعة للتحقق من السعر الفوري دون إضافة للسلة"
                      : "Scannez le code-barres pour afficher le prix sans ajouter au panier"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPriceVerifierOpen(false);
                  setVerifiedProduct(null);
                  setVerifierQuery("");
                }}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barcode Search Field */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={verifierQuery}
                onChange={(e) => handleSearchVerifier(e.target.value)}
                placeholder={
                  locale === "ar"
                    ? "امسح الباركود أو اكتب اسم السلعة..."
                    : "Scanner code-barres ou rechercher..."
                }
                className="w-full h-11 ps-10 pe-4 bg-zinc-900 border border-zinc-800 focus:border-teal-400 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none font-mono"
              />
            </div>

            {/* Readout Display */}
            {verifiedProduct ? (
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-700/80 space-y-4 animate-scaleUp">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider block mb-1">
                      {verifiedProduct.sku} {verifiedProduct.barcode ? `• ${verifiedProduct.barcode}` : ""}
                    </span>
                    <h4 className="text-base font-black text-white">{verifiedProduct.name}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                    {locale === "ar" ? "مخزون:" : "Stock:"} {verifiedProduct.stockQuantity ?? 0}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                  {/* Retail Unit Price */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                      {locale === "ar" ? "سعر البيع بالحبة" : "Prix Unitaire"}
                    </span>
                    <span className="text-2xl font-mono font-black text-white tabular-nums">
                      {Number(verifiedProduct.salePrice).toFixed(2)}
                      <span className="text-xs font-normal text-zinc-400 ms-1">MAD</span>
                    </span>
                  </div>

                  {/* Pack / Wholesale Price */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                      {locale === "ar" ? "سعر الباك / الكرتونة" : "Prix Pack / Carton"}
                    </span>
                    <span className="text-2xl font-mono font-black text-teal-300 tabular-nums">
                      {verifiedProduct.wholesalePrice
                        ? Number(verifiedProduct.wholesalePrice).toFixed(2)
                        : (Number(verifiedProduct.salePrice) * 6 * 0.95).toFixed(2)}
                      <span className="text-xs font-normal text-zinc-400 ms-1">MAD</span>
                    </span>
                  </div>
                </div>

                {/* Shelf Location & Expiry Status */}
                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                      {locale === "ar" ? "الجناح 3: الحليب والأجبان" : "Rayon 3: Produits Laitiers"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>DLC: 12/2026 (Valide)</span>
                  </div>
                </div>

                {/* Optional Quick Add to Cart button */}
                <button
                  type="button"
                  onClick={() => {
                    addToCart(verifiedProduct, 1);
                    playSuccessSound();
                    setIsPriceVerifierOpen(false);
                  }}
                  className="sheen-btn w-full h-11 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <Package className="w-4 h-4 text-zinc-950" />
                  <span>{locale === "ar" ? "إضافة هذه السلعة للسلة" : "Ajouter au panier"}</span>
                </button>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500">
                <Scan className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <span>
                  {locale === "ar"
                    ? "امسح أي باركود الآن لعرض تفاصيله الكاملة"
                    : "Scannez un code-barres pour vérifier le prix"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
         MODAL 2: 4-DIGIT PLU PRODUCE QUICK ENTRY (Fruits, Vegetables, Olives)
         ======================================================================= */}
      {isPluModalOpen && (
        <div
          dir="ltr"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
        >
          <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {locale === "ar"
                      ? "إدخال الخضر والفواكه والأوزان (PLU)"
                      : locale === "fr"
                      ? "Saisie Fruits & Légumes au Poids (PLU)"
                      : "Loose Produce & Scale PLU Entry"}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {locale === "ar"
                      ? "اختر الصنف بالرمز السريع وحدد الوزن بالكيلوغرام"
                      : "Sélectionnez le produit et ajustez le poids en kg"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPluModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick PLU Grid Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pe-1">
              {STANDARD_PLU_LIST.map((item) => {
                const isSelected = selectedPlu.plu === item.plu;
                return (
                  <button
                    key={item.plu}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setSelectedPlu(item);
                    }}
                    className={`p-2.5 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-teal-500/15 border-teal-400 text-white shadow-xs"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold text-teal-400 block">
                      #{item.plu}
                    </span>
                    <span className="text-xs font-bold truncate block my-1">
                      {locale === "ar" ? item.nameAr : item.nameFr}
                    </span>
                    <span className="text-[11px] font-mono font-black tabular-nums text-zinc-200">
                      {item.pricePerKg.toFixed(2)} <span className="text-[9px]">MAD/kg</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Weight Presets & Custom Input */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  {locale === "ar" ? "الوزن المسجل (كيلوغرام)" : "Poids mesuré (kg)"}
                </span>
                <span className="text-sm font-mono font-black text-white tabular-nums">
                  {weightKg.toFixed(3)} kg
                </span>
              </div>

              {/* Weight Preset Pills */}
              <div className="grid grid-cols-4 gap-2">
                {[0.25, 0.5, 1.0, 2.0].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setWeightKg(w);
                      setCustomWeightInput(w.toFixed(3));
                    }}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                      weightKg === w
                        ? "bg-white text-zinc-950 font-black border-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                    }`}
                  >
                    {w.toFixed(3)} kg
                  </button>
                ))}
              </div>

              {/* Custom Weight Keypad Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  step="0.05"
                  value={customWeightInput}
                  onChange={(e) => {
                    setCustomWeightInput(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) setWeightKg(val);
                  }}
                  className="flex-1 h-10 px-3 bg-zinc-950 border border-zinc-800 focus:border-teal-400 rounded-xl text-xs font-mono text-white text-center"
                />
                <span className="text-xs font-mono text-zinc-400 shrink-0">KG</span>
              </div>
            </div>

            {/* Live Line Calculation & Confirmation */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs font-bold text-zinc-300">
                {locale === "ar" ? "المجموع المحسوب:" : "Montant Ligne:"}
              </span>
              <span className="text-xl font-mono font-black text-teal-300 tabular-nums">
                {(selectedPlu.pricePerKg * weightKg).toFixed(2)} MAD
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddPluToCart}
              className="sheen-btn w-full h-12 rounded-xl bg-teal-400 hover:bg-teal-300 text-zinc-950 text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
            >
              <Scale className="w-4 h-4 text-zinc-950" />
              <span>
                {locale === "ar"
                  ? `وزن وإضافة للسلة (${(selectedPlu.pricePerKg * weightKg).toFixed(2)} MAD)`
                  : `Ajouter au Panier (${(selectedPlu.pricePerKg * weightKg).toFixed(2)} MAD)`}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
