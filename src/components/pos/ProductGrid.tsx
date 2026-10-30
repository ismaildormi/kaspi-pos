"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Package, Plus } from "lucide-react";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";

interface ProductGridProps {
  products: PosProduct[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const t = useTranslations("Pos");
  const tCommon = useTranslations("Common");
  const { searchQuery, activeCategoryId, addToCart } = usePosStore();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (activeCategoryId && p.categoryId !== activeCategoryId) {
        return false;
      }
      // Search term filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
        return matchName || matchSku || matchBarcode;
      }
      return true;
    });
  }, [products, activeCategoryId, searchQuery]);

  if (filteredProducts.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center select-none">
        <Package className="w-10 h-10 mb-2 text-slate-600 stroke-[1.5]" />
        <p className="text-sm font-medium text-slate-400">Aucun produit trouvé</p>
        <p className="text-xs text-slate-500 mt-1">
          Modifiez vos filtres ou effectuez une nouvelle recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pb-4 select-none">
      {filteredProducts.map((product) => {
        const isOutOfStock = product.trackStock && (product.stockQuantity ?? 0) <= 0;
        const isLowStock =
          product.trackStock &&
          (product.stockQuantity ?? 0) > 0 &&
          (product.stockQuantity ?? 0) <= 5;

        return (
          <button
            key={product.id}
            onClick={() => addToCart(product)}
            className="group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 active:scale-[0.98] transition-all text-start shadow-sm hover:shadow-md cursor-pointer"
          >
            {/* Top row: Category tag & Stock Badge */}
            <div className="flex items-center justify-between gap-1 w-full text-[11px] mb-2">
              <span className="text-slate-400 truncate max-w-[90px]">
                {product.categoryName || product.sku}
              </span>

              {product.trackStock && (
                <span
                  className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                    isOutOfStock
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : isLowStock
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {product.stockQuantity} {t("inStock")}
                </span>
              )}
            </div>

            {/* Middle: Product Name */}
            <div className="my-auto py-1">
              <h3 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
                {product.name}
              </h3>
            </div>

            {/* Bottom Row: Price & Add icon */}
            <div className="flex items-end justify-between gap-2 mt-3 pt-2 border-t border-slate-700/40 w-full">
              <div>
                <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono tracking-tight">
                  {product.salePrice.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-slate-400 ms-1">
                  {tCommon("currency")}
                </span>
              </div>

              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500 text-emerald-400 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
