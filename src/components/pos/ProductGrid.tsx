"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Package, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { playBarcodeScanSound } from "@/lib/audio";
import { useAppDictionary } from "@/i18n/schema";

interface ProductGridProps {
  products: PosProduct[];
  onOpenQuickAdd?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onOpenQuickAdd }) => {
  const t = useTranslations("Pos");
  const { locale } = useAppDictionary();
  const { searchQuery, activeCategoryId, addToCart, storeType, cart, pricingTier } = usePosStore();

  const baseProducts = useMemo(() => {
    if (storeType === "grocery") {
      const nonGrocerySkus = ["DEMO-RES-", "DEMO-FAS-", "DEMO-ELC-", "DEMO-BUT-", "DEMO-BAK-", "DEMO-GRO-"];
      return products.filter(
        (p) =>
          !nonGrocerySkus.some(
            (prefix) =>
              p.sku?.toUpperCase().startsWith(prefix) ||
              p.barcode?.toUpperCase().startsWith(prefix)
          )
      );
    }
    return products;
  }, [products, storeType]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const isCommand = q.startsWith("/");

    return baseProducts.filter((p) => {
      if (activeCategoryId && p.categoryId !== activeCategoryId) {
        return false;
      }
      if (q && !isCommand) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
        return matchName || matchSku || matchBarcode;
      }
      return true;
    });
  }, [baseProducts, activeCategoryId, searchQuery]);

  if (filteredProducts.length === 0) {
    const emptyI18n = {
      ar: {
        title: "لا توجد منتجات مطابقة",
        subtitle: "أضف منتجاتك من الكتالوج أو قم باستيراد ملف Excel و CSV مباشرة",
        manage: "كتالوج المنتجات",
        import: "استيراد CSV",
      },
      fr: {
        title: "Aucun article trouvé",
        subtitle: "Ajoutez vos articles depuis le catalogue ou importez un fichier Excel/CSV",
        manage: "Gérer les Produits",
        import: "Importer CSV",
      },
      en: {
        title: "No products found",
        subtitle: "Add items from the catalog or import an Excel/CSV file directly",
        manage: "Manage Products",
        import: "Import CSV",
      },
    }[locale] || {
      title: "No products found",
      subtitle: "Add items from the catalog or import an Excel/CSV file directly",
      manage: "Manage Products",
      import: "Import CSV",
    };

    return (
      <div className="group h-80 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-2xl p-8 text-center select-none bg-zinc-900/30 bg-dot-matrix relative overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_75%)] transition-all duration-500 pointer-events-none" />

        <div className="relative mb-4 cursor-pointer">
          <div className="absolute -inset-3 rounded-3xl border border-white/5 group-hover:border-white/30 group-hover:scale-105 transition-all duration-500 bg-white/[0.02]" />
          
          <div className="relative w-14 h-14 rounded-2xl bg-zinc-900/90 border border-white/15 flex items-center justify-center text-white shadow-xl overflow-hidden group-hover:border-white/40 transition-colors">
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#14B8A6] to-transparent top-0 animate-laser pointer-events-none opacity-80" />
            <Package className="w-6 h-6 stroke-[1.8] group-hover:-translate-y-1 transition-transform duration-300 text-white" />
          </div>
        </div>

        <p className="text-sm font-bold text-white tracking-tight">{emptyI18n.title}</p>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          {emptyI18n.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          {onOpenQuickAdd && (
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="sheen-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#041E1B] font-black text-xs hover:opacity-95 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(20,184,166,0.35)] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{locale === "ar" ? "+ منتج جديد" : locale === "en" ? "+ New Product" : "+ Nouvel Article"}</span>
            </button>
          )}
          <Link
            href={`/${locale}/dashboard/products`}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/10 hover:border-white/20 font-bold text-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <span>{emptyI18n.manage}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/${locale}/dashboard/products/import`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/10 hover:border-white/20 font-semibold text-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <span>{emptyI18n.import}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 overflow-y-auto pb-4 select-none">
      {filteredProducts.map((product) => {
        const inCartItem = cart.find((i) => i.productId === product.id);
        const inCartQty = inCartItem ? inCartItem.quantity : 0;
        const imgSource = (product as any).imageUrl || product.image;

        // Price resolution based on tier
        const effectiveUnitPrice =
          pricingTier === "wholesale" && product.wholesalePrice
            ? product.wholesalePrice
            : product.salePrice;

        const accumulatedTotal = effectiveUnitPrice * inCartQty;

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => {
              playBarcodeScanSound();
              addToCart(product);
            }}
            className={`group relative h-[210px] rounded-2xl bg-[#0E1317] hover:bg-[#12191F] border ${
              inCartQty > 0 ? "border-[#14B8A6]/70 shadow-[0_0_20px_rgba(20,184,166,0.18)]" : "border-white/[0.08]"
            } hover:border-[#14B8A6]/50 p-4 flex flex-col items-center justify-between text-center overflow-hidden cursor-pointer select-none transition-all duration-150 active:scale-[0.98] shadow-[0_10px_28px_-10px_rgba(0,0,0,0.65)]`}
          >
            {/* Top 3px Glowing Teal Accent Strip */}
            <div className="absolute top-0 inset-x-6 h-[2.5px] rounded-b-full bg-gradient-to-r from-transparent via-[#14B8A6] to-transparent opacity-80" />

            {/* Top-Right Live Quantity Circle Badge (ONLY visible when inCartQty > 0) */}
            {inCartQty > 0 && (
              <span className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-[#14B8A6] text-[#041E1B] font-mono font-black text-xs flex items-center justify-center shadow-[0_0_16px_rgba(20,184,166,0.65)] animate-in zoom-in-75">
                {inCartQty}
              </span>
            )}

            {/* Center Floating Transparent PNG Cutout */}
            <div className="flex-1 flex items-center justify-center w-full py-1">
              {imgSource ? (
                <img
                  src={imgSource}
                  alt={product.name}
                  className="max-h-[96px] max-w-[120px] w-auto h-auto object-contain mx-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.75)] group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center text-[#2DD4BF]/70 shadow-inner group-hover:scale-105 transition-transform duration-200">
                  <ShoppingBag className="w-7 h-7 stroke-[1.75]" />
                </div>
              )}
            </div>

            {/* Bottom Centered Title, Measure & Auto-Multiplying Price */}
            <div className="w-full flex flex-col items-center justify-center pt-2 border-t border-white/[0.06]">
              {/* Line 1: Product Name & Measure */}
              <h3 className="font-sans font-medium text-[13px] leading-tight text-zinc-200 line-clamp-2 w-full text-center">
                {product.name}
              </h3>

              {/* Line 2: Price Display (Multiplies live when tapped multiple times) */}
              {inCartQty === 0 ? (
                <div className="font-mono font-extrabold text-[15px] text-white mt-1 tabular-nums">
                  {effectiveUnitPrice.toFixed(2)}{" "}
                  <span className="text-[11px] font-normal text-zinc-400">MAD</span>
                </div>
              ) : (
                <div className="flex flex-col items-center mt-1">
                  <span className="font-mono font-black text-[15.5px] text-[#2DD4BF] tabular-nums tracking-tight">
                    {accumulatedTotal.toFixed(2)}{" "}
                    <span className="text-[11px] font-bold text-[#2DD4BF]/80">MAD</span>
                  </span>
                  {inCartQty > 1 && (
                    <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      ({inCartQty} × {effectiveUnitPrice.toFixed(2)})
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
