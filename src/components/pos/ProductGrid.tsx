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
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const isWeighableProduct = (p: PosProduct) =>
    Boolean(
      p.isScaleItem ||
        p.weightUnit === "kg" ||
        (p as any).unit === "kg" ||
        p.categoryId === "produce" ||
        p.categoryName === "produce" ||
        p.sku === "DEMO-GRO-03"
    );

  const parseDraftWeight = (raw: string | undefined): number => {
    if (raw === undefined) return 1;
    const normalized = raw.replace(",", ".").trim();
    if (!normalized) return 0;
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const formatQtyBadge = (qty: number, weighable: boolean) => {
    const clean = Number.isInteger(qty) ? String(qty) : Number(qty.toFixed(3)).toString();
    return weighable ? `${clean}kg` : clean;
  };

  // Smooth scroll to top-left when a product is scanned or added to cart
  useEffect(() => {
    if (lastInteractedProductId && gridContainerRef.current) {
      gridContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [lastInteractedProductId, cart]);

  const baseProducts = useMemo(() => {
    if (storeType === "grocery") {
      const nonGrocerySkus = ["DEMO-RES-", "DEMO-FAS-", "DEMO-ELC-", "DEMO-BUT-", "DEMO-BAK-"];
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
              className="kaspi-polar-aurora-orbit kaspi-emerald-checkout-btn flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{locale === "ar" ? "منتج جديد" : locale === "en" ? "New Product" : "Nouvel Article"}</span>
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
        const weighable = isWeighableProduct(product);

        // Price resolution based on tier
        const effectiveUnitPrice =
          pricingTier === "wholesale" && product.wholesalePrice
            ? product.wholesalePrice
            : product.salePrice;

        const rawWeightDraft = weightDrafts[product.id] ?? "1";
        const draftWeightKg = parseDraftWeight(rawWeightDraft);
        const computedWeightedPrice = Math.round(effectiveUnitPrice * draftWeightKg * 100) / 100;
        const accumulatedTotal = effectiveUnitPrice * inCartQty;

        return (
          <div
            key={product.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (weighable) {
                if (draftWeightKg <= 0) return;
                playBarcodeScanSound();
                addToCart(product, Number(draftWeightKg.toFixed(3)));
                return;
              }
              playBarcodeScanSound();
              addToCart(product);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (weighable) {
                  if (draftWeightKg <= 0) return;
                  playBarcodeScanSound();
                  addToCart(product, Number(draftWeightKg.toFixed(3)));
                  return;
                }
                playBarcodeScanSound();
                addToCart(product);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (inCartQty > 0) {
                playBarcodeScanSound();
                updateItemQuantity(product.id, weighable ? -0.25 : -1);
              }
            }}
            className={`group relative min-h-[240px] p-3.5 rounded-2xl kaspi-product-orbit-card ${
              inCartQty > 0 || lastInteractedProductId === product.id
                ? "kaspi-orbit-active"
                : ""
            } flex flex-col items-center justify-between text-center overflow-hidden cursor-pointer select-none transition-all duration-150 active:scale-[0.98] backdrop-blur-2xl focus:outline-none`}
          >
            {/* Specular Top Edge Glass Reflection */}
            <div className="absolute top-0 inset-x-6 h-[1.5px] rounded-b-full bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-75" />

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
              <span className="absolute top-3 right-3 z-10 min-w-7 h-7 px-1.5 rounded-full bg-[#10b981] text-white font-mono font-bold text-[11px] flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.55)] animate-in zoom-in-75">
                {formatQtyBadge(inCartQty, weighable)}
              </span>
            )}

            {/* 3-Dot Options Popover */}
            {openMenuProductId === product.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-x-2 top-2 bottom-2 z-30 p-2.5 rounded-xl kaspi-polar-aurora-orbit kaspi-opaque-glass-modal border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex flex-col justify-between animate-in zoom-in-95 duration-150 overflow-y-auto"
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

            {/* Translucent Crystal Glass Thumbnail Slot */}
            <div className={`kaspi-product-white-box w-full ${weighable ? "h-28" : "h-32"} mb-2 group-hover:scale-[1.02] transition-transform duration-200`}>
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
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl kaspi-glass-surface flex items-center justify-center text-[var(--kaspi-text-secondary)]">
                    <ShoppingBag className="w-6 h-6 stroke-[1.75]" />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Centered Title, Measure & Auto-Multiplying / Weighable Live Price */}
            <div className="w-full flex flex-col items-center justify-center pt-2 border-t border-white/[0.08]">
              {/* Line 1: Product Name */}
              <h3 className="font-sans font-semibold text-[13px] leading-tight text-white line-clamp-2 w-full text-center">
                {product.name}
              </h3>

              {weighable ? (
                <>
                  {/* Interactive Translucent Glass Stepper: - [ 1.250 kg ] + */}
                  <div
                    dir="ltr"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full mt-2 h-8 rounded-full kaspi-glass-surface flex items-center justify-between px-1 gap-1"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextVal = Math.max(0.25, Math.round((draftWeightKg - 0.25) * 1000) / 1000);
                        setWeightDrafts((prev) => ({ ...prev, [product.id]: nextVal.toFixed(3) }));
                      }}
                      className="w-6 h-6 rounded-full kaspi-glass-btn flex items-center justify-center font-mono font-bold text-xs cursor-pointer active:scale-95"
                      aria-label="Decrease weight"
                    >
                      −
                    </button>

                    <div className="relative flex-1 min-w-0 flex items-center justify-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rawWeightDraft === "1" ? "1.250" : rawWeightDraft}
                        placeholder="1.000"
                        aria-label={locale === "ar" ? "الوزن بالكيلو" : "Weight (kg)"}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter" && draftWeightKg > 0) {
                            e.preventDefault();
                            playBarcodeScanSound();
                            addToCart(product, Number(draftWeightKg.toFixed(3)));
                          }
                        }}
                        onChange={(e) => {
                          const next = e.target.value.replace(",", ".");
                          if (next === "" || /^[0-9]*\.?[0-9]{0,3}$/.test(next)) {
                            setWeightDrafts((prev) => ({ ...prev, [product.id]: next }));
                          }
                        }}
                        className="w-full h-6 !bg-transparent !border-0 text-center font-mono font-bold text-xs text-white tabular-nums focus:outline-none pe-3"
                      />
                      <span className="pointer-events-none absolute end-1 top-1/2 -translate-y-1/2 text-[9.5px] font-mono text-zinc-400">
                        kg
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={draftWeightKg <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextVal = Math.round((draftWeightKg + 0.25) * 1000) / 1000;
                        setWeightDrafts((prev) => ({ ...prev, [product.id]: nextVal.toFixed(3) }));
                        playBarcodeScanSound();
                        addToCart(product, 0.25);
                      }}
                      className="w-6 h-6 rounded-full kaspi-glass-btn flex items-center justify-center font-mono font-bold text-xs cursor-pointer active:scale-95"
                      title={locale === "ar" ? "إضافة الوزن للسلة" : "Add weighted item"}
                    >
                      +
                    </button>
                  </div>

                  <div className="w-full flex items-center justify-between text-[11px] font-mono mt-1.5 px-0.5">
                    <span className="text-zinc-400">
                      {locale === "ar" ? "الوزن الفوري" : "Weighable Kg"}
                    </span>
                    <span className="font-extrabold text-white tabular-nums">
                      {computedWeightedPrice.toFixed(2)} MAD
                    </span>
                  </div>

                  {inCartQty > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 mt-0.5 tabular-nums">
                      {accumulatedTotal.toFixed(2)} MAD ({formatQtyBadge(inCartQty, true)})
                    </span>
                  )}
                </>
              ) : inCartQty === 0 ? (
                <div className="font-mono font-extrabold text-[15px] text-white mt-1 tabular-nums">
                  {effectiveUnitPrice.toFixed(2)}{" "}
                  <span className="text-[11px] font-normal text-zinc-400">MAD</span>
                </div>
              ) : (
                <div className="flex flex-col items-center mt-1">
                  <span className="font-mono font-black text-[15.5px] text-emerald-400 tabular-nums tracking-tight">
                    {accumulatedTotal.toFixed(2)}{" "}
                    <span className="text-[11px] font-bold opacity-80">MAD</span>
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
