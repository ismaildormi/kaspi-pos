"use client";

import React, { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, Barcode, X } from "lucide-react";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";

interface ProductSearchProps {
  products: PosProduct[];
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ products }) => {
  const t = useTranslations("Pos");
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchQuery, setSearchQuery, addToCart } = usePosStore();

  // Global F2 keyboard shortcut to autofocus barcode input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle barcode scanner input (typically enters barcode string + sends Enter key)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const term = searchQuery.trim().toLowerCase();
      if (!term) return;

      // 1. Try exact barcode match first
      const matchedByBarcode = products.find(
        (p) => p.barcode && p.barcode.toLowerCase() === term
      );

      if (matchedByBarcode) {
        addToCart(matchedByBarcode);
        setSearchQuery("");
        return;
      }

      // 2. Try exact SKU match
      const matchedBySku = products.find((p) => p.sku.toLowerCase() === term);
      if (matchedBySku) {
        addToCart(matchedBySku);
        setSearchQuery("");
        return;
      }

      // 3. If single product matches query by name, add it directly
      const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(term)
      );
      if (filtered.length === 1) {
        addToCart(filtered[0]);
        setSearchQuery("");
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("searchPlaceholder")}
        autoFocus
        className="w-full h-11 ps-10 pe-16 bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
      />

      <div className="absolute inset-y-0 end-0 flex items-center pe-3 gap-1.5">
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery("")}
            className="p-1 text-slate-400 hover:text-white rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-700/60 text-slate-400 border border-slate-600/50">
            <Barcode className="w-3 h-3" />
            <span>F2</span>
          </span>
        )}
      </div>
    </div>
  );
};
