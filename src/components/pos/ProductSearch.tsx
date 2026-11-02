"use client";

import React, { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Barcode, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { offlineDb, type OfflineProduct } from "@/client/db";

interface ProductSearchProps {
  products: PosProduct[];
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ products }) => {
  const t = useTranslations("Pos");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    addProductByBarcode,
    isPaymentModalOpen,
  } = usePosStore();

  // Keep barcode input auto-focused when POS is active and no modal input is focused
  useEffect(() => {
    inputRef.current?.focus();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      // Auto-redirect printable scanner keystrokes to the barcode input if nothing else is focused
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused =
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (
        !isInputFocused &&
        !isPaymentModalOpen &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isPaymentModalOpen]);

  // Handle Barcode Scanner & Manual Enter Lookup
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const code = searchQuery.trim();
    if (!code) return;

    // Immediately clear input and keep focus for rapid consecutive barcode scans
    setSearchQuery("");
    inputRef.current?.focus();
    setIsScanning(true);

    try {
      let matchedProduct: PosProduct | undefined;

      // 1. First, check the local Dexie database (IndexedDB) for 100% offline capability
      if (offlineDb) {
        try {
          const dexieExactMatch = await offlineDb.offlineProducts
            .where("barcode")
            .equals(code)
            .first();

          if (dexieExactMatch) {
            matchedProduct = dexieExactMatch;
          } else {
            const lowerCode = code.toLowerCase();
            const dexieCaseInsensitive = await offlineDb.offlineProducts
              .filter(
                (p: OfflineProduct) =>
                  Boolean(p.barcode && p.barcode.toLowerCase() === lowerCode) ||
                  p.sku.toLowerCase() === lowerCode
              )
              .first();

            if (dexieCaseInsensitive) {
              matchedProduct = dexieCaseInsensitive;
            }
          }
        } catch (dexieErr) {
          console.warn("[POS Barcode] Dexie lookup warning:", dexieErr);
        }
      }

      // Check in-memory products prop if not yet matched in Dexie
      if (!matchedProduct && products.length > 0) {
        const lowerCode = code.toLowerCase();
        matchedProduct =
          products.find(
            (p) => p.barcode && p.barcode.toLowerCase() === lowerCode
          ) || products.find((p) => p.sku.toLowerCase() === lowerCode);
      }

      // 2. If not in Dexie, call the backend Barcode Lookup API endpoint
      if (!matchedProduct) {
        const res = await fetch(
          `/api/v1/products/barcode?code=${encodeURIComponent(code)}`
        );

        if (res.ok) {
          const data = await res.json();
          const apiProduct: PosProduct | undefined =
            data?.product || data?.data?.product;

          if (apiProduct) {
            matchedProduct = {
              id: apiProduct.id,
              name: apiProduct.name,
              sku: apiProduct.sku,
              barcode: apiProduct.barcode,
              price: Number(apiProduct.price ?? apiProduct.salePrice ?? 0),
              salePrice: Number(apiProduct.salePrice ?? apiProduct.price ?? 0),
              taxRate: Number(apiProduct.taxRate ?? 20),
              trackStock: Boolean(apiProduct.trackStock ?? true),
              stockQuantity: Number(apiProduct.stockQuantity ?? 0),
              categoryId: apiProduct.categoryId,
              categoryName: apiProduct.categoryName,
            };

            // Cache into Dexie for future offline scans
            if (offlineDb) {
              offlineDb.offlineProducts
                .put({
                  ...matchedProduct,
                  tenantId: "current",
                })
                .catch(() => {});
            }
          }
        }
      }

      // 3. If found: Call addProductByBarcode(product) in the Zustand store
      if (matchedProduct) {
        addProductByBarcode(matchedProduct);
        return;
      }

      // 4. If not found: Show a red Toast notification
      toast.error("Product not found in this store", {
        style: {
          background: "#09090b",
          color: "#f87171",
          border: "1px solid #7f1d1d",
        },
      });
    } catch (err) {
      toast.error("Product not found in this store", {
        style: {
          background: "#09090b",
          color: "#f87171",
          border: "1px solid #7f1d1d",
        },
      });
    } finally {
      setIsScanning(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-zinc-400">
        {isScanning ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Re-focus if blur wasn't caused by clicking another interactive input/button
          setTimeout(() => {
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (
              !isPaymentModalOpen &&
              activeTag !== "input" &&
              activeTag !== "textarea" &&
              activeTag !== "select"
            ) {
              inputRef.current?.focus();
            }
          }, 150);
        }}
        placeholder={t("searchPlaceholder")}
        autoFocus
        className="w-full h-11 ps-10 pe-16 bg-zinc-900 hover:bg-zinc-900/90 focus:bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white transition-all font-medium"
      />

      <div className="absolute inset-y-0 end-0 flex items-center pe-3 gap-1.5">
        {searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              inputRef.current?.focus();
            }}
            className="p-1 text-zinc-400 hover:text-white rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Barcode className="w-3 h-3" />
            <span>F2</span>
          </span>
        )}
      </div>
    </div>
  );
};
