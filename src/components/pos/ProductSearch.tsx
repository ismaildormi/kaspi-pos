"use client";

import React, { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Barcode, X, Loader2, Terminal } from "lucide-react";
import { toast } from "sonner";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { offlineDb, type OfflineProduct } from "@/client/db";
import { playBarcodeScanSound, playErrorSound, playTapSound } from "@/lib/audio";
import { normalizeMoroccanBarcode } from "@/lib/autonomous-fleet/barcode-auto-healer";

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

  // 0ms In-Memory Barcode & SKU Index
  const barcodeIndex = React.useMemo(() => {
    const map = new Map<string, PosProduct>();
    for (const p of products) {
      if (p.barcode) {
        map.set(p.barcode.trim().toLowerCase(), p);
      }
      if (p.sku) {
        map.set(p.sku.trim().toLowerCase(), p);
      }
    }
    return map;
  }, [products]);

  // Global Hardware Scanner keystroke buffer
  const scannerBufferRef = useRef<{ chars: string[]; lastKeyTime: number }>({
    chars: [],
    lastKeyTime: 0,
  });

  // Helper: Electronic Weight Scale Barcode Parser (EAN-13 prefixes 20-29) + Agent #08 AZERTY Auto-Healer
  const resolveScaleOrDirectProduct = (code: string): { product: PosProduct; quantity: number; wasHealed?: boolean } | null => {
    const healResult = normalizeMoroccanBarcode(code);
    const trimmed = healResult.normalized.trim().toLowerCase();
    const direct = barcodeIndex.get(trimmed);
    if (direct) {
      return { product: direct, quantity: 1, wasHealed: healResult.wasHealed };
    }

    // EAN-13 Electronic Scale Barcode: 13 digits, starting with 20 through 29
    if (trimmed.length === 13 && /^2[0-9]/.test(trimmed)) {
      const itemCode = trimmed.slice(2, 7); // digits 3-7 (SKU / item number)
      const weightRaw = parseInt(trimmed.slice(7, 12), 10); // digits 8-12 (weight in grams)
      const weightKg = !isNaN(weightRaw) && weightRaw > 0 ? weightRaw / 1000 : 1;

      // Try matching by itemCode, stripped zero code, or prefix+itemCode
      const match =
        barcodeIndex.get(itemCode) ||
        barcodeIndex.get(String(parseInt(itemCode, 10))) ||
        barcodeIndex.get(`2${itemCode}`) ||
        products.find(
          (p) =>
            p.sku.toLowerCase() === itemCode ||
            p.sku.toLowerCase() === String(parseInt(itemCode, 10)) ||
            (p.barcode && p.barcode.includes(itemCode))
        );

      if (match) {
        return { product: match, quantity: weightKg };
      }
    }

    return null;
  };

  useEffect(() => {
    inputRef.current?.focus();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      const now = Date.now();
      const timeDiff = now - scannerBufferRef.current.lastKeyTime;
      scannerBufferRef.current.lastKeyTime = now;

      // Hardware Barcode Scanner keystroke detector (intervals < 50ms)
      if (e.key === "Enter") {
        const rawBuffer = scannerBufferRef.current.chars.join("").trim();
        scannerBufferRef.current.chars = [];
        if (rawBuffer.length >= 3) {
          const matchResult = resolveScaleOrDirectProduct(rawBuffer);
          if (matchResult) {
            e.preventDefault();
            playBarcodeScanSound();
            addProductByBarcode(matchResult.product, matchResult.quantity);
            if (matchResult.quantity !== 1) {
              toast.success(`Ajouté (Balance): ${matchResult.product.name} (${matchResult.quantity.toFixed(3)} kg)`);
            } else {
              toast.success(`Ajouté (Scan): ${matchResult.product.name}`);
            }
            setSearchQuery("");
            return;
          }
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (timeDiff > 80) {
          // Reset buffer if human typing delay detected
          scannerBufferRef.current.chars = [e.key];
        } else {
          scannerBufferRef.current.chars.push(e.key);
        }
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
  }, [isPaymentModalOpen, barcodeIndex, addProductByBarcode, setSearchQuery]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const rawCode = searchQuery.trim();
    if (!rawCode) return;
    const healedScan = normalizeMoroccanBarcode(rawCode);
    const code = healedScan.normalized;

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
      // 0ms In-Memory Fast Lookup (Direct Barcode or Electronic Weight Scale 20-29)
      const scaleOrDirect = resolveScaleOrDirectProduct(code);
      if (scaleOrDirect) {
        playBarcodeScanSound();
        addProductByBarcode(scaleOrDirect.product, scaleOrDirect.quantity);
        if (scaleOrDirect.quantity !== 1) {
          toast.success(
            `Ajouté (Balance): ${scaleOrDirect.product.name} (${scaleOrDirect.quantity.toFixed(3)} kg)`
          );
        }
        setIsScanning(false);
        return;
      }

      let matchedProduct: PosProduct | undefined = undefined;

      if (!matchedProduct && offlineDb) {
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
    <div dir="ltr" className="relative w-full group rounded-xl kaspi-polar-aurora-orbit">
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
        className="w-full h-11 ps-11 pe-40 rounded-xl kaspi-translucent-input text-sm text-white placeholder:text-zinc-400 focus:outline-none transition-all shadow-inner"
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
        <div className="relative overflow-hidden hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-white/15 group-hover:border-white/30 group-focus-within:border-white/50 text-[10px] font-mono text-zinc-400 group-focus-within:text-white transition-all shadow-xs">
          {/* Animated Scanning Laser Bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isScanning ? "bg-white animate-ping" : "bg-emerald-400"
            }`}
          />
          <div className="relative flex items-center">
            <Barcode className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-focus-within:text-white transition-colors" />
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/80 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
          </div>
          <span className="tracking-wider">F2 / ⌘K</span>
        </div>
      </div>
    </div>
  );
};
