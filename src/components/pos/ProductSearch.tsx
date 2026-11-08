"use client";

import React, { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Barcode, X, Loader2, Terminal } from "lucide-react";
import { toast } from "sonner";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { offlineDb, type OfflineProduct } from "@/client/db";
import { playBarcodeScanSound, playErrorSound, playTapSound } from "@/lib/audio";

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
    clearCart,
    holdCurrentCart,
    openPaymentModal,
    setStoreProfile,
    cart,
  } = usePosStore();

  const isSlashCommand = searchQuery.trim().startsWith("/");

  useEffect(() => {
    inputRef.current?.focus();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

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

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const code = searchQuery.trim();
    if (!code) return;

    // Handle Linear/OpenAI-style Slash Commands (/clear, /hold, /pay, /grocery, /restaurant, /fashion, /electronics)
    if (code.startsWith("/")) {
      playTapSound();
      const cmd = code.toLowerCase();
      setSearchQuery("");
      if (cmd === "/clear") {
        clearCart();
        toast.success("Panier vidé (/clear)");
        return;
      }
      if (cmd === "/hold") {
        if (cart.length > 0) {
          holdCurrentCart();
          toast.success("Commande mise en attente (/hold)");
        } else {
          playErrorSound();
          toast.error("Le panier est vide");
        }
        return;
      }
      if (cmd === "/pay" || cmd === "/checkout") {
        if (cart.length > 0) {
          openPaymentModal();
        } else {
          playErrorSound();
          toast.error("Ajoutez un article avant d'encaisser");
        }
        return;
      }
      if (cmd === "/grocery" || cmd === "/restaurant" || cmd === "/fashion" || cmd === "/electronics") {
        const nextMode = cmd.slice(1) as any;
        setStoreProfile(nextMode, true);
        toast.success(`Mode métier basculé sur : ${nextMode.toUpperCase()}`);
        return;
      }
      toast.info("Commandes : /pay, /hold, /clear, /grocery, /restaurant, /fashion, /electronics");
      return;
    }

    setSearchQuery("");
    inputRef.current?.focus();
    setIsScanning(true);

    try {
      let matchedProduct: PosProduct | undefined;

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

      if (!matchedProduct && products.length > 0) {
        const lowerCode = code.toLowerCase();
        matchedProduct =
          products.find(
            (p) => p.barcode && p.barcode.toLowerCase() === lowerCode
          ) || products.find((p) => p.sku.toLowerCase() === lowerCode);
      }

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

      if (matchedProduct) {
        playBarcodeScanSound();
        addProductByBarcode(matchedProduct);
        return;
      }

      playErrorSound();
      toast.error("Article introuvable pour ce code-barres", {
        style: {
          background: "#09090b",
          color: "#f87171",
          border: "1px solid #7f1d1d",
        },
      });
    } catch {
      playErrorSound();
      toast.error("Article introuvable pour ce code-barres", {
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
    <div className="relative w-full group">
      <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-zinc-400">
        {isScanning ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : isSlashCommand ? (
          <Terminal className="w-4 h-4 text-amber-400" />
        ) : (
          <Search className="w-4 h-4 group-focus-within:text-white transition-colors" />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setTimeout(() => {
            const active = document.activeElement?.tagName.toLowerCase();
            if (
              active !== "input" &&
              active !== "textarea" &&
              active !== "select" &&
              !isPaymentModalOpen
            ) {
              inputRef.current?.focus();
            }
          }, 80);
        }}
        placeholder={`${t("searchPlaceholder")}  •  /pay  /hold  /clear`}
        className="w-full h-11 ps-10 pe-32 rounded-xl bg-zinc-900/90 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all shadow-inner"
      />

      <div className="absolute inset-y-0 end-0 flex items-center pe-2.5 gap-1.5">
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              inputRef.current?.focus();
            }}
            className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-white/10 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-950/90 border border-white/10 text-[10px] font-mono text-zinc-400">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isScanning ? "bg-amber-400 animate-ping" : "bg-emerald-400"
            }`}
          />
          <Barcode className="w-3 h-3 text-zinc-400" />
          <span>F2 / ⌘K</span>
        </div>
      </div>
    </div>
  );
};
