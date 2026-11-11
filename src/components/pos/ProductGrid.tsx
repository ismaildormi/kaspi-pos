"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Package, Plus, ArrowRight, Scale, Utensils, Shirt, ShieldCheck } from "lucide-react";
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
  const tCommon = useTranslations("Common");
  const { locale } = useAppDictionary();
  const { searchQuery, activeCategoryId, addToCart, storeType, cart } = usePosStore();

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    // Do not filter product grid when typing a slash command (/pay, /clear, etc.)
    const isCommand = q.startsWith("/");

    return products.filter((p) => {
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
  }, [products, activeCategoryId, searchQuery]);

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
        {/* Soft Radial Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_75%)] transition-all duration-500 pointer-events-none" />

        {/* Interactive Multi-Ring Kinetic Badge */}
        <div className="relative mb-4 cursor-pointer">
          {/* Outer ring scales and illuminates on hover */}
          <div className="absolute -inset-3 rounded-3xl border border-white/5 group-hover:border-white/30 group-hover:scale-105 transition-all duration-500 bg-white/[0.02]" />
          
          {/* Inner 3D Container with sweeping laser */}
          <div className="relative w-14 h-14 rounded-2xl bg-zinc-900/90 border border-white/15 flex items-center justify-center text-white shadow-xl overflow-hidden group-hover:border-white/40 transition-colors">
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent top-0 animate-laser pointer-events-none opacity-60" />
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
              className="sheen-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md"
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pb-4 select-none">
      {filteredProducts.map((product) => {
        const isOutOfStock = product.trackStock && (product.stockQuantity ?? 0) <= 0;
        const initial = (product.name || "P").trim().charAt(0).toUpperCase();
        const cartItem = cart.find((i) => i.productId === product.id);
        const inCartQty = cartItem ? cartItem.quantity : 0;

        return (
          <button
            key={product.id}
            onClick={() => {
              playBarcodeScanSound();
              addToCart(product);
            }}
            className={`group relative flex flex-col justify-between p-3.5 rounded-xl border active:scale-[0.98] transition-all text-start shadow-xs cursor-pointer ${
              inCartQty > 0
                ? "border-white shadow-[0_0_18px_rgba(255,255,255,0.18)] bg-zinc-900 ring-1 ring-white/50"
                : "bg-zinc-900/80 hover:bg-zinc-900 border-white/10 hover:border-white/30"
            }`}
          >
            {/* Live Instant Quantity Counter Badge */}
            {inCartQty > 0 && (
              <div
                className={`absolute -top-2 -end-2 z-10 px-2 py-0.5 rounded-full font-black font-mono text-[11px] shadow-md border animate-scale-in ${
                  storeType === "grocery"
                    ? "bg-teal-400 text-zinc-950 border-teal-300 shadow-[0_0_14px_rgba(45,212,191,0.55)]"
                    : "bg-white text-zinc-950 border-white shadow-[0_2px_10px_rgba(255,255,255,0.45)]"
                }`}
              >
                ×{inCartQty}
              </div>
            )}

            {/* Top row: Avatar/Image + Stock Indicator */}
            <div className="flex items-start justify-between gap-2 w-full mb-2.5">
              {product.image ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-zinc-800 shrink-0 shadow-inner group-hover:border-white/30 transition-colors">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-zinc-800/90 border border-white/10 flex items-center justify-center text-white font-mono font-bold text-sm shrink-0 group-hover:border-white/30 transition-colors">
                  {initial}
                </div>
              )}

              <div className="flex flex-col items-end gap-1">
                {product.trackStock && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border ${
                      isOutOfStock
                        ? "bg-red-500/10 text-red-300 border-red-500/20"
                        : inCartQty > 0
                        ? "bg-white/15 text-white border-white/30 font-bold"
                        : "bg-white/[0.04] text-zinc-300 border-white/10"
                    }`}
                  >
                    {locale === "ar" ? `الرصيد: ${product.stockQuantity ?? 0}` : `Stock: ${product.stockQuantity ?? 0}`}
                  </span>
                )}

                {storeType === "grocery" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono text-teal-400">
                    <Scale className="w-2.5 h-2.5" />
                    <span>{product.barcode ? `EAN • ${product.barcode.slice(-4)}` : "PLU Code"}</span>
                  </span>
                )}
                {storeType === "restaurant" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-400">
                    <Utensils className="w-2.5 h-2.5" />
                    <span>Direct KDS</span>
                  </span>
                )}
                {storeType === "fashion" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono text-purple-400">
                    <Shirt className="w-2.5 h-2.5" />
                    <span>S • M • L • XL</span>
                  </span>
                )}
                {storeType === "electronics" && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono text-sky-400">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Garantie 12M</span>
                  </span>
                )}
              </div>
            </div>

            {/* Middle: Category & Title */}
            <div className="my-auto py-0.5">
              <span className="text-[10px] text-zinc-500 font-mono block truncate">
                {product.categoryName || product.sku}
              </span>
              <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 mt-0.5">
                {product.name}
              </h3>
            </div>

            {/* Bottom: Price & Add */}
            <div className="flex items-end justify-between gap-2 mt-3 pt-2.5 border-t border-white/10 w-full">
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-base font-extrabold text-white font-mono tracking-tight">
                    {product.salePrice.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 ms-1">
                    {tCommon("currency")}
                  </span>
                </div>
                {storeType === "grocery" && product.wholesalePrice && (
                  <span className="text-[10px] font-mono font-bold text-teal-400">
                    Pack: {Number(product.wholesalePrice).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="w-7 h-7 rounded-lg bg-white/[0.06] group-hover:bg-white text-zinc-300 group-hover:text-black flex items-center justify-center transition-all border border-white/10 group-hover:border-white">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
