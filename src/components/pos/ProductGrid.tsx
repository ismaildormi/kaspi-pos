"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Package, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
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
      <div className="h-72 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl p-8 text-center select-none bg-zinc-950/40">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
          <Package className="w-6 h-6 stroke-[1.5]" />
        </div>
        <p className="text-sm font-semibold text-white">Aucun produit dans le catalogue</p>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          Commencez par ajouter des produits ou importer votre stock depuis un fichier CSV/Excel.
        </p>
        <div className="flex gap-2 mt-4">
          <Link
            href="/dashboard/products/import"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition"
          >
            <span>Importer CSV</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/dashboard/products/ai-onboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-700 font-semibold text-xs hover:bg-zinc-800 transition"
          >
            <span>Scan IA</span>
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

        return (
          <button
            key={product.id}
            onClick={() => addToCart(product)}
            className="group relative flex flex-col justify-between p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-500 active:scale-[0.98] transition-all text-start shadow-xs hover:shadow-md cursor-pointer"
          >
            {/* Top row: Image placeholder / initial + Stock Badge */}
            <div className="flex items-start justify-between gap-2 w-full mb-3">
              {/* Product Placeholder Square */}
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-white font-mono font-bold text-base shrink-0 group-hover:border-zinc-500 transition-colors">
                {initial}
              </div>

              {product.trackStock && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                    isOutOfStock
                      ? "bg-zinc-950 text-zinc-500 border-zinc-800"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700"
                  }`}
                >
                  {product.stockQuantity} {t("inStock")}
                </span>
              )}
            </div>

            {/* Middle: Product Name & SKU/Category */}
            <div className="my-auto py-0.5">
              <span className="text-[11px] text-zinc-400 font-mono block truncate">
                {product.categoryName || product.sku}
              </span>
              <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 mt-0.5 group-hover:text-zinc-100 transition-colors">
                {product.name}
              </h3>
            </div>

            {/* Bottom Row: Price & Add icon */}
            <div className="flex items-end justify-between gap-2 mt-3 pt-2.5 border-t border-zinc-800/80 w-full">
              <div>
                <span className="text-lg font-bold text-white font-mono tracking-tight">
                  {product.salePrice.toFixed(2)}
                </span>
                <span className="text-xs font-medium text-zinc-400 ms-1">
                  {tCommon("currency")}
                </span>
              </div>

              <div className="w-7 h-7 rounded-lg bg-zinc-800 group-hover:bg-white text-zinc-300 group-hover:text-black flex items-center justify-center transition-all border border-zinc-700 group-hover:border-white">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
