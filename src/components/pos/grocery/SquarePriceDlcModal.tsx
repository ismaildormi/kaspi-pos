"use client";

import React, { useState } from "react";
import { ScanBarcode, Search, Package, CheckCircle2, Plus } from "lucide-react";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";
import { playSuccessSound } from "@/lib/audio";

interface SquarePriceDlcModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: PosProduct[];
}

export function SquarePriceDlcModal({ isOpen, onClose, products }: SquarePriceDlcModalProps) {
  const { locale } = useAppDictionary();
  const { addToCart } = usePosStore();

  const [query, setQuery] = useState("");
  const [matchedProduct, setMatchedProduct] = useState<PosProduct | null>(null);

  if (!isOpen) return null;

  const handleSearch = (q: string) => {
    setQuery(q);
    const clean = q.trim().toLowerCase();
    if (!clean) {
      setMatchedProduct(null);
      return;
    }
    const match = products.find(
      (p) =>
        p.barcode?.toLowerCase() === clean ||
        p.sku?.toLowerCase() === clean ||
        p.name.toLowerCase().includes(clean)
    );
    if (match) {
      setMatchedProduct(match);
      playSuccessSound();
    }
  };

  const handleAddToCart = () => {
    if (!matchedProduct) return;
    playSuccessSound();
    addToCart(matchedProduct, 1);
    onClose();
  };

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
    >
      <div className="kaspi-frosted-glass w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-white">
              <ScanBarcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {locale === "ar"
                  ? "فاحص الثمن والصلاحية"
                  : locale === "en"
                  ? "Price & DLC Verifier"
                  : "Vérificateur Prix & DLC"}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {locale === "ar"
                  ? "امسح الباركود للتحقق الفوري من سعر الحبة، سعر الباك، الجناح وتاريخ الصلاحية"
                  : locale === "en"
                  ? "Scan a barcode to check unit price, pack price, aisle, and expiry date"
                  : "Scannez un code-barres pour vérifier prix unitaire, prix pack, rayon et DLC"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-lg bg-[#111113] hover:bg-[#18181B] border border-white/[0.08] text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{locale === "ar" ? "← رجوع" : locale === "en" ? "← Back" : "← Retour"}</span>
          </button>
        </div>

        {/* Barcode Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={
              locale === "ar"
                ? "امسح الباركود أو ابحث بالاسم..."
                : locale === "en"
                ? "Scan barcode or search by name..."
                : "Scannez code-barres ou recherchez par nom..."
            }
            className="w-full h-11 ps-10 pe-4 bg-[#111113] border border-white/[0.08] focus:border-white rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none font-mono transition-colors"
          />
        </div>

        {/* Result Card */}
        {matchedProduct ? (
          <div className="p-4 rounded-2xl bg-[#111113] border border-white/[0.08] space-y-4 animate-scale-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                  {matchedProduct.categoryName || (locale === "ar" ? "جناح عام" : "Rayon Général")}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">{matchedProduct.name}</h4>
                <span className="text-[11px] font-mono text-zinc-400 block mt-1">
                  SKU: {matchedProduct.sku} {matchedProduct.barcode ? `• EAN: ${matchedProduct.barcode}` : ""}
                </span>
              </div>
              <div className="text-end">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                  {locale === "ar" ? "سعر البيع" : "Prix Vente"}
                </span>
                <span className="text-2xl font-black font-mono text-white tabular-nums">
                  {matchedProduct.salePrice.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-zinc-400">MAD</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.08] text-xs font-mono">
              <div className="p-2 rounded-xl bg-[#09090B] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-400 block">
                  {locale === "ar" ? "سعر الباك:" : "Prix Pack :"}
                </span>
                <span className="text-xs font-bold text-white">
                  {matchedProduct.wholesalePrice
                    ? `${Number(matchedProduct.wholesalePrice).toFixed(2)} MAD`
                    : "—"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#09090B] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-400 block">
                  {locale === "ar" ? "الرصيد بالرف:" : "Stock Rayon :"}
                </span>
                <span className="text-xs font-bold text-white">
                  {matchedProduct.stockQuantity ?? 0} {locale === "ar" ? "قطعة" : "unités"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#09090B] border border-white/[0.06]">
                <span className="text-[10px] text-zinc-400 block">
                  {locale === "ar" ? "الصلاحية DLC:" : "Date DLC :"}
                </span>
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-zinc-400" />
                  <span>{locale === "ar" ? "صالحة" : "Valide"}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full h-11 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {locale === "ar"
                  ? "إضافة السلعة للسلة فوراً"
                  : locale === "en"
                  ? "Add Item to Cart Immediately"
                  : "Ajouter cet article au Panier"}
              </span>
            </button>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-white/[0.08] rounded-2xl bg-[#111113] space-y-2">
            <Package className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">
              {locale === "ar"
                ? "قم بتوجيه الماسح الضوئي نحو الباركود لعرض السعر والمخزون في أجزاء من الثانية"
                : locale === "en"
                ? "Scan an item to inspect its live price, pack, aisle, and DLC details"
                : "Scannez un article pour inspecter ses informations en direct"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
