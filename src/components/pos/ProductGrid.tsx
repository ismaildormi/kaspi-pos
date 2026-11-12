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
  const tCommon = useTranslations("Common");
  const { locale } = useAppDictionary();
  const { searchQuery, activeCategoryId, addToCart, storeType, cart } = usePosStore();

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
        const inCartItem = cart.find((i) => i.productId === product.id);
        const inCartQty = inCartItem ? inCartItem.quantity : 0;

        return (
          <button
            key={product.id}
            onClick={() => {
              playBarcodeScanSound();
              addToCart(product);
            }}
            className={`group relative h-[142px] rounded-xl bg-[#0D0D10] hover:bg-[#121216] border ${
              inCartQty > 0 ? "border-white/40" : "border-white/[0.08]"
            } hover:border-white/[0.20] p-3.5 flex flex-col justify-between overflow-hidden transition-all duration-150 active:scale-[0.985] cursor-pointer shadow-sm text-start`}
          >
            {/* Row 1 (Top Header of Tile): Left Icon Box + Right Stock/Cart Pill */}
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-zinc-400" />
                )}
              </div>

              {inCartQty > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-white text-zinc-950 font-mono font-black text-[11px] shadow-sm">
                  ×{inCartQty}
                </span>
              ) : (
                product.trackStock && (
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] font-mono text-[10.5px] font-semibold text-zinc-300">
                    {locale === "ar"
                      ? `المخزون: ${product.stockQuantity ?? 0}`
                      : `Stock: ${product.stockQuantity ?? 0}`}
                  </span>
                )
              )}
            </div>

            {/* Row 2 (Middle Title & Code) */}
            <div className="my-auto pt-1">
              <h3 className="font-sans font-semibold text-[13.5px] leading-[1.28] text-white line-clamp-2">
                {product.name}
              </h3>
            </div>

            {/* Row 3 (Bottom Price & Uniform Plus Keycap) */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between w-full">
              <div className="flex items-baseline">
                <span className="font-mono font-extrabold text-[15px] text-white tabular-nums tracking-tight">
                  {product.salePrice.toFixed(2)}
                </span>
                <span className="text-[10.5px] font-semibold text-zinc-400 ms-1">
                  MAD
                </span>
              </div>

              <div className="w-7 h-7 rounded-lg bg-white/[0.06] group-hover:bg-white text-zinc-300 group-hover:text-zinc-950 border border-white/[0.08] flex items-center justify-center transition-colors">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
