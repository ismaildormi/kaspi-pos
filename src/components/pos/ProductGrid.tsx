"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Package, Plus, ArrowRight, ShoppingBag, MoreHorizontal, X } from "lucide-react";
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
  const {
    searchQuery,
    activeCategoryId,
    addToCart,
    updateItemQuantity,
    storeType,
    cart,
    pricingTier,
    lastInteractedProductId,
  } = usePosStore();
  const [openMenuProductId, setOpenMenuProductId] = useState<string | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll to top-left when a product is scanned or added to cart
  useEffect(() => {
    if (lastInteractedProductId && gridContainerRef.current) {
      gridContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [lastInteractedProductId, cart]);

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

  // Deduplicate identical product cards by normalized name + price or barcode
  const deduplicatedProducts = useMemo(() => {
    const map = new Map<string, PosProduct>();
    filteredProducts.forEach((p) => {
      const normName = p.name ? p.name.trim().toLowerCase() : "";
      const priceKey = (p.salePrice || p.price || 0).toFixed(2);
      const barcodeKey = p.barcode ? p.barcode.trim().toLowerCase() : "";
      const key = barcodeKey || `${normName}_${priceKey}` || p.id;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, p);
      } else {
        const pImg = (p as any).imageUrl || p.image;
        const existingImg = (existing as any).imageUrl || existing.image;
        if (!existingImg && pImg) {
          map.set(key, p);
        }
      }
    });
    return Array.from(map.values());
  }, [filteredProducts]);

  // Marjane / Asima auto-pin scanned & active cart products to #1 top of grid
  const sortedProducts = useMemo(() => {
    const cartItemMap = new Map<string, (typeof cart)[0]>();
    cart.forEach((item) => {
      cartItemMap.set(item.productId, item);
    });

    return [...deduplicatedProducts].sort((a, b) => {
      const aInCart = cartItemMap.get(a.id);
      const bInCart = cartItemMap.get(b.id);

      const aQty = aInCart ? aInCart.quantity : 0;
      const bQty = bInCart ? bInCart.quantity : 0;

      // Both in cart: sort by lastUpdatedAt descending (most recently scanned/tapped first)
      if (aQty > 0 && bQty > 0) {
        const aTime = aInCart?.lastUpdatedAt ?? 0;
        const bTime = bInCart?.lastUpdatedAt ?? 0;
        return bTime - aTime;
      }

      // Only a in cart -> a comes first
      if (aQty > 0 && bQty === 0) return -1;
      // Only b in cart -> b comes first
      if (aQty === 0 && bQty > 0) return 1;

      // Neither in cart: preserve original catalog order
      return 0;
    });
  }, [deduplicatedProducts, cart]);

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
    <div
      ref={gridContainerRef}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 overflow-y-auto pb-4 select-none scroll-smooth"
    >
      {sortedProducts.map((product) => {
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
          <div
            key={product.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              playBarcodeScanSound();
              addToCart(product);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                playBarcodeScanSound();
                addToCart(product);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (inCartQty > 0) {
                playBarcodeScanSound();
                updateItemQuantity(product.id, -1);
              }
            }}
            className={`group relative min-h-[225px] p-3.5 rounded-2xl kaspi-product-orbit-card ${
              inCartQty > 0 || lastInteractedProductId === product.id
                ? "kaspi-orbit-active"
                : ""
            } flex flex-col items-center justify-between text-center overflow-hidden cursor-pointer select-none transition-all duration-150 active:scale-[0.98] backdrop-blur-2xl focus:outline-none`}
          >
            {/* Top 3px Glowing Teal Accent Strip */}
            <div className="absolute top-0 inset-x-6 h-[2.5px] rounded-b-full bg-gradient-to-r from-transparent via-[#2DD4BF] to-transparent opacity-80" />

            {/* Subtle Top-Left 3-Dot (•••) Quick Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuProductId(openMenuProductId === product.id ? null : product.id);
              }}
              className="absolute top-2.5 left-2.5 z-20 w-6 h-6 rounded-lg bg-black/40 hover:bg-black/70 border border-white/15 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shadow-xs"
              title={locale === "ar" ? "خيارات وأوزان سريعة" : "Options & Poids"}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Top-Right Live Quantity Circle Badge (ONLY visible when inCartQty > 0) */}
            {inCartQty > 0 && (
              <span className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-[#2DD4BF] text-[#042F2E] font-mono font-black text-xs flex items-center justify-center shadow-[0_0_16px_rgba(45,212,191,0.7)] animate-in zoom-in-75">
                {inCartQty}
              </span>
            )}

            {/* 3-Dot Options Popover */}
            {openMenuProductId === product.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-x-2 top-2 bottom-2 z-30 p-2.5 rounded-xl kaspi-frosted-glass border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex flex-col justify-between animate-in zoom-in-95 duration-150 backdrop-blur-3xl overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-1 border-b border-white/10 shrink-0">
                  <span className="text-[10px] font-bold text-white truncate max-w-[120px]">
                    {product.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuProductId(null);
                    }}
                    className="w-5 h-5 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1. Weighed / Kg Presets */}
                <div className="my-1">
                  <span className="text-[9px] font-mono font-bold text-zinc-300 block mb-1">
                    {locale === "ar" ? "البيع بالوزن (Kg):" : "Vente au Poids (Kg) :"}
                  </span>
                  <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playBarcodeScanSound();
                        addToCart(product, 0.25, locale === "ar" ? "250g (ربع كيلو)" : "250g (1/4 Kg)");
                        setOpenMenuProductId(null);
                      }}
                      className="h-6 px-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer border border-white/10"
                    >
                      {locale === "ar" ? "250g (ربع)" : "250g (1/4)"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playBarcodeScanSound();
                        addToCart(product, 0.5, locale === "ar" ? "500g (نصف كيلو)" : "500g (1/2 Kg)");
                        setOpenMenuProductId(null);
                      }}
                      className="h-6 px-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer border border-white/10"
                    >
                      {locale === "ar" ? "500g (نصف)" : "500g (1/2)"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playBarcodeScanSound();
                        addToCart(product, 1, locale === "ar" ? "1 كيلو" : "1 Kg");
                        setOpenMenuProductId(null);
                      }}
                      className="h-6 px-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer border border-white/10"
                    >
                      {locale === "ar" ? "1 كيلو" : "1 Kg"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playBarcodeScanSound();
                        addToCart(product, 2, locale === "ar" ? "2 كيلو" : "2 Kg");
                        setOpenMenuProductId(null);
                      }}
                      className="h-6 px-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer border border-white/10"
                    >
                      {locale === "ar" ? "2 كيلو" : "2 Kg"}
                    </button>
                  </div>
                </div>

                {/* 2. Fashion Mode Sizes */}
                {storeType === "fashion" && (
                  <div className="mb-1">
                    <span className="text-[9px] font-mono font-bold text-zinc-300 block mb-1">
                      {locale === "ar" ? "المقاس (Taille):" : "Taille (Size) :"}
                    </span>
                    <div className="flex gap-1 justify-between font-mono text-[10px]">
                      {["S", "M", "L", "XL", "XXL"].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playBarcodeScanSound();
                            addToCart(product, 1, `Taille: ${sz}`);
                            setOpenMenuProductId(null);
                          }}
                          className="flex-1 h-5 rounded bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer border border-white/10"
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Electronics Mode Warranty */}
                {(storeType === "electronics" || storeType === "tech") && (
                  <div>
                    <span className="text-[9px] font-mono font-bold text-zinc-300 block mb-1">
                      {locale === "ar" ? "الضمان (Garantie):" : "Garantie :"}
                    </span>
                    <div className="flex gap-1 font-mono text-[9px]">
                      {[
                        { label: locale === "ar" ? "6 أشهر" : "6m", note: "Garantie 6m" },
                        { label: locale === "ar" ? "12 شهر" : "12m", note: "Garantie 12m" },
                        { label: locale === "ar" ? "بدون" : "Sans", note: "Sans Garantie" },
                      ].map((w) => (
                        <button
                          key={w.note}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playBarcodeScanSound();
                            addToCart(product, 1, w.note);
                            setOpenMenuProductId(null);
                          }}
                          className="flex-1 h-5 px-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer border border-white/10"
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Center Floating Pure White Studio Box */}
            <div className="kaspi-product-white-box w-full h-32 mb-2 shadow-[0_8px_20px_rgba(0,0,0,0.55)] group-hover:scale-[1.02] transition-transform duration-200">
              {imgSource ? (
                <img
                  src={imgSource}
                  alt={product.name}
                  className="w-[92%] h-[92%] object-contain mx-auto drop-shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                    <ShoppingBag className="w-6 h-6 stroke-[1.75]" />
                  </div>
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
          </div>
        );
      })}
    </div>
  );
};
