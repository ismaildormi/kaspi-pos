"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Package,
  Plus,
  ArrowRight,
  ShoppingBag,
  MoreHorizontal,
  Image as ImageIcon,
  Pencil,
  FolderOpen,
  Trash2,
  Upload,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { offlineDb } from "@/client/db";
import { getCachedData, setCachedData } from "@/lib/cache/client-cache";
import { compressImage } from "@/lib/image-compression";
import { playBarcodeScanSound, playTapSound, playSuccessSound } from "@/lib/audio";
import { useAppDictionary } from "@/i18n/schema";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { AppleBackButton } from "@/components/common/AppleBackButton";
import { toast } from "sonner";

interface ProductGridProps {
  products: PosProduct[];
  onOpenQuickAdd?: () => void;
}

type ProductManageTab = "image" | "details" | "category";

const DEFAULT_CATEGORIES = [
  { id: "grocery", ar: "البقالة والمواد الغذائية", fr: "Épicerie & Alimentation", en: "Grocery & Pantry" },
  { id: "produce", ar: "الخضر والفواكه (الميزان)", fr: "Fruits & Légumes (Pesée)", en: "Produce & Vegetables (Kg)" },
  { id: "butchery", ar: "المجزرة واللحوم والدواجن", fr: "Boucherie & Volailles", en: "Butchery & Meats" },
  { id: "drinks_dairy", ar: "المشروبات والحليب ومشتقاته", fr: "Boissons & Produits Laitiers", en: "Drinks & Dairy" },
  { id: "bakery_cafe", ar: "المخبزة والحلويات والمقهى", fr: "Boulangerie & Café", en: "Bakery & Café" },
  { id: "fashion", ar: "الملابس والأزياء والأحذية", fr: "Mode & Prêt-à-Porter", en: "Fashion & Apparel" },
  { id: "electronics", ar: "الهواتف والإلكترونيات", fr: "Électronique & Téléphonie", en: "Electronics & Tech" },
  { id: "cleaning", ar: "المنظفات والعناية", fr: "Hygiène & Entretien", en: "Cleaning & Care" },
  { id: "wholesale", ar: "البيع بالجملة والكرتون", fr: "Vente en Gros & Cartons", en: "Wholesale & Bulk" },
];

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

  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<PosProduct> & { deleted?: boolean }>>({});
  const [managingProduct, setManagingProduct] = useState<PosProduct | null>(null);
  const [manageTab, setManageTab] = useState<ProductManageTab>("details");

  // Edit Form States inside the 3-Dot Glass Management Modal
  const [editName, setEditName] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editUnit, setEditUnit] = useState<"piece" | "kg">("piece");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("grocery");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const openManageModal = (product: PosProduct, initialTab: ProductManageTab = "details") => {
    playTapSound();
    setManagingProduct(product);
    setManageTab(initialTab);
    setEditName(product.name || "");
    setEditSalePrice(String(product.salePrice ?? 0));
    setEditCostPrice(String((product as any).costPrice ?? product.wholesalePrice ?? ""));
    setEditBarcode(product.barcode || "");
    setEditSku(product.sku || "");
    setEditStock(String(product.stockQuantity ?? 50));
    setEditUnit(isWeighableProduct(product) ? "kg" : "piece");
    setEditExpiryDate((product as any).expiryDate || "");
    setEditCategoryName(product.categoryName || product.categoryId || "grocery");
    setEditImageUrl((product as any).imageUrl || product.image || "");
  };

  const handlePhotoUpload = async (file: File) => {
    setIsProcessingPhoto(true);
    try {
      const res = await compressImage(file, {
        autoRemoveBackground: true,
        generateDataUrl: true,
        maxDimension: 720,
        quality: 0.85,
      });
      if (res.dataUrl) {
        setEditImageUrl(res.dataUrl);
        playSuccessSound();
        toast.success(
          locale === "ar"
            ? "تم تجهيز وتفريغ صورة المنتج بنجاح"
            : locale === "en"
            ? "Product image processed"
            : "Image produit préparée avec succès"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process image");
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProductChanges = async (e?: React.FormEvent, categoryOverride?: string) => {
    if (e) e.preventDefault();
    if (!managingProduct) return;

    const cleanName = editName.trim() || managingProduct.name;
    const parsedPrice = parseFloat(editSalePrice);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error(locale === "ar" ? "يرجى إدخال سعر بيع صحيح" : "Prix de vente invalide");
      return;
    }

    const parsedCost = editCostPrice.trim() ? parseFloat(editCostPrice) : undefined;
    const parsedStock = parseFloat(editStock) || 0;
    const finalCat = categoryOverride || editCategoryName.trim() || "grocery";
    const finalImg = editImageUrl.trim() || null;

    setIsSavingProduct(true);
    try {
      const patchPayload = {
        name: cleanName,
        salePrice: parsedPrice,
        costPrice: parsedCost,
        wholesalePrice: parsedCost,
        barcode: editBarcode.trim() || null,
        sku: editSku.trim() || managingProduct.sku,
        stockQuantity: parsedStock,
        unit: editUnit,
        categoryName: finalCat,
        imageUrl: finalImg,
        expiryDate: editExpiryDate || null,
      };

      if (typeof navigator !== "undefined" && navigator.onLine) {
        await fetch(`/api/v1/products/${managingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchPayload),
        }).catch(() => {});
      }

      const updatedFields: Partial<PosProduct> & Record<string, any> = {
        name: cleanName,
        salePrice: parsedPrice,
        wholesalePrice: parsedCost,
        costPrice: parsedCost,
        barcode: editBarcode.trim() || null,
        sku: editSku.trim() || managingProduct.sku,
        stockQuantity: parsedStock,
        unit: editUnit,
        weightUnit: editUnit === "kg" ? "kg" : undefined,
        isScaleItem: editUnit === "kg",
        categoryName: finalCat,
        categoryId: finalCat,
        image: finalImg,
        imageUrl: finalImg,
        expiryDate: editExpiryDate || null,
      };

      setLocalOverrides((prev) => ({
        ...prev,
        [managingProduct.id]: {
          ...(prev[managingProduct.id] || {}),
          ...updatedFields,
        },
      }));

      if (offlineDb?.offlineProducts) {
        await offlineDb.offlineProducts
          .put({
            id: managingProduct.id,
            tenantId: "current",
            sku: updatedFields.sku,
            barcode: updatedFields.barcode,
            name: updatedFields.name,
            imageUrl: finalImg,
            salePrice: parsedPrice,
            wholesalePrice: parsedCost,
            taxRate: managingProduct.taxRate ?? 20,
            trackStock: true,
            stockQuantity: parsedStock,
            categoryName: finalCat,
            unit: editUnit,
            isScaleItem: editUnit === "kg",
          })
          .catch(() => {});
      }

      try {
        const cached = getCachedData<any[]>("products_catalog", []);
        if (Array.isArray(cached.data)) {
          setCachedData(
            "products_catalog",
            cached.data.map((item) =>
              item.id === managingProduct.id ? { ...item, ...updatedFields } : item
            )
          );
        }
      } catch {}

      playSuccessSound();
      toast.success(
        locale === "ar"
          ? `تم حفظ تعديلات "${cleanName}" بنجاح`
          : locale === "en"
          ? `Updated "${cleanName}" successfully`
          : `"${cleanName}" mis à jour avec succès`
      );
      setManagingProduct(null);
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleCreateInlineCategory = async () => {
    const clean = newCategoryInput.trim();
    if (!clean) return;
    playTapSound();
    setCustomCategories((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setEditCategoryName(clean);
    setNewCategoryInput("");
    if (typeof navigator !== "undefined" && navigator.onLine) {
      fetch("/api/v1/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      }).catch(() => {});
    }
    toast.success(
      locale === "ar" ? `تم إنشاء الصنف "${clean}"` : `Catégorie "${clean}" créée`
    );
  };

  const handleDeleteProduct = async () => {
    if (!managingProduct) return;
    playTapSound();
    setIsSavingProduct(true);
    try {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        await fetch(`/api/v1/products/${managingProduct.id}`, {
          method: "DELETE",
        }).catch(() => {});
      }
      setLocalOverrides((prev) => ({
        ...prev,
        [managingProduct.id]: { deleted: true },
      }));
      if (offlineDb?.offlineProducts) {
        await offlineDb.offlineProducts.delete(managingProduct.id).catch(() => {});
      }
      toast.success(
        locale === "ar" ? "تم إخفاء/حذف المنتج من الشبكة" : "Article retiré de la grille"
      );
      setManagingProduct(null);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Smooth scroll to top-left when a product is scanned or added to cart
  useEffect(() => {
    if (lastInteractedProductId && gridContainerRef.current) {
      gridContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [lastInteractedProductId, cart]);

  const baseProducts = useMemo(() => {
    const merged = products
      .filter((p) => !localOverrides[p.id]?.deleted)
      .map((p) => (localOverrides[p.id] ? ({ ...p, ...localOverrides[p.id] } as PosProduct) : p));

    if (storeType === "grocery") {
      const nonGrocerySkus = ["DEMO-RES-", "DEMO-FAS-", "DEMO-ELC-", "DEMO-BUT-", "DEMO-BAK-"];
      return merged.filter(
        (p) =>
          !nonGrocerySkus.some(
            (prefix) =>
              p.sku?.toUpperCase().startsWith(prefix) ||
              p.barcode?.toUpperCase().startsWith(prefix)
          )
      );
    }
    return merged;
  }, [products, storeType, localOverrides]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const isCommand = q.startsWith("/");

    return baseProducts.filter((p) => {
      if (activeCategoryId && p.categoryId !== activeCategoryId && p.categoryName !== activeCategoryId) {
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

      if (aQty > 0 && bQty > 0) {
        const aTime = aInCart?.lastUpdatedAt ?? 0;
        const bTime = bInCart?.lastUpdatedAt ?? 0;
        return bTime - aTime;
      }

      if (aQty > 0 && bQty === 0) return -1;
      if (aQty === 0 && bQty > 0) return 1;
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
      <div className="group h-80 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-2xl p-8 text-center select-none kaspi-frosted-card relative overflow-hidden transition-all duration-300">
        <div className="relative mb-4 cursor-pointer">
          <div className="relative w-14 h-14 rounded-2xl kaspi-glass-btn flex items-center justify-center text-[var(--kaspi-text-primary)] shadow-xl overflow-hidden">
            <Package className="w-6 h-6 stroke-[1.8] group-hover:-translate-y-1 transition-transform duration-300" />
          </div>
        </div>

        <p className="text-sm font-bold text-[var(--kaspi-text-primary)] tracking-tight">{emptyI18n.title}</p>
        <p className="text-xs text-[var(--kaspi-text-secondary)] mt-1 max-w-sm">
          {emptyI18n.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          {onOpenQuickAdd && (
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="kaspi-emerald-checkout-btn flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{locale === "ar" ? "منتج جديد" : locale === "en" ? "New Product" : "Nouvel Article"}</span>
            </button>
          )}
          <Link
            href={`/${locale}/dashboard/products`}
            className="kaspi-glass-btn flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <span>{emptyI18n.manage}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/${locale}/dashboard/products/import`}
            className="kaspi-glass-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <span>{emptyI18n.import}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={gridContainerRef}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 overflow-y-auto pb-4 select-none scroll-smooth"
      >
        {sortedProducts.map((product) => {
          const inCartItem = cart.find((i) => i.productId === product.id);
          const inCartQty = inCartItem ? inCartItem.quantity : 0;
          const imgSource = (product as any).imageUrl || product.image;
          const weighable = isWeighableProduct(product);

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
              className={`group relative min-h-[244px] p-3.5 rounded-2xl kaspi-product-orbit-card ${
                inCartQty > 0 || lastInteractedProductId === product.id
                  ? "kaspi-orbit-active"
                  : ""
              } flex flex-col items-center justify-between text-center overflow-hidden cursor-pointer select-none transition-all duration-150 active:scale-[0.98] backdrop-blur-2xl focus:outline-none`}
            >
              {/* Specular Top Edge Glass Reflection */}
              <div className="absolute top-0 inset-x-6 h-[1.5px] rounded-b-full bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-75" />

              {/* Top-Left 3-Dot (•••) Merchant Product Management Trigger (Opens Portal Quick-Edit Modal) */}
              <button
                type="button"
                data-kaspi-product-menu-trigger={product.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openManageModal(product, "details");
                }}
                className="absolute top-2.5 left-2.5 z-20 w-7 h-7 rounded-xl kaspi-glass-btn flex items-center justify-center text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)] transition-all cursor-pointer shadow-xs"
                title={
                  locale === "ar"
                    ? "تغيير الصورة • تعديل المنتج • تغيير الصنف"
                    : locale === "en"
                    ? "Change Image • Edit Product • Change Category"
                    : "Changer photo • Modifier • Changer catégorie"
                }
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Top-Right Live Quantity Circle Badge (ONLY visible when inCartQty > 0) */}
              {inCartQty > 0 && (
                <span className="absolute top-3 right-3 z-10 min-w-7 h-7 px-1.5 rounded-full bg-[#10b981] text-white font-mono font-bold text-[11px] flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.55)] animate-in zoom-in-75">
                  {formatQtyBadge(inCartQty, weighable)}
                </span>
              )}

              {/* Clean Borderless Glass Thumbnail Slot */}
              <div
                className={`kaspi-product-white-box w-full ${
                  weighable ? "h-28" : "h-32"
                } mb-2 rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-200`}
              >
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
                    <div className="w-12 h-12 rounded-2xl kaspi-glass-surface flex items-center justify-center text-[var(--kaspi-text-secondary)]">
                      <ShoppingBag className="w-6 h-6 stroke-[1.75]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Centered Title, Measure & Auto-Multiplying / Weighable Live Price */}
              <div className="w-full flex flex-col items-center justify-center pt-2 border-t border-white/[0.08]">
                <h3 className="font-sans font-semibold text-[13px] leading-tight text-[var(--kaspi-text-primary)] line-clamp-2 w-full text-center">
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
                          className="w-full h-6 !bg-transparent !border-0 text-center font-mono font-bold text-xs text-[var(--kaspi-text-primary)] tabular-nums focus:outline-none pe-3"
                        />
                        <span className="pointer-events-none absolute end-1 top-1/2 -translate-y-1/2 text-[9.5px] font-mono text-[var(--kaspi-text-muted)]">
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
                      <span className="text-[var(--kaspi-text-muted)]">
                        {locale === "ar" ? "الوزن الفوري" : "Weighable Kg"}
                      </span>
                      <span className="font-extrabold text-[var(--kaspi-text-primary)] tabular-nums">
                        {computedWeightedPrice.toFixed(2)} MAD
                      </span>
                    </div>

                    {inCartQty > 0 && (
                      <span className="text-[10px] font-mono text-emerald-500 mt-0.5 tabular-nums font-bold">
                        {accumulatedTotal.toFixed(2)} MAD ({formatQtyBadge(inCartQty, true)})
                      </span>
                    )}
                  </>
                ) : inCartQty === 0 ? (
                  <div className="font-mono font-extrabold text-[15px] text-[var(--kaspi-text-primary)] mt-1 tabular-nums">
                    {effectiveUnitPrice.toFixed(2)}{" "}
                    <span className="text-[11px] font-normal text-[var(--kaspi-text-muted)]">MAD</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center mt-1">
                    <span className="font-mono font-black text-[15.5px] text-emerald-500 tabular-nums tracking-tight">
                      {accumulatedTotal.toFixed(2)}{" "}
                      <span className="text-[11px] font-bold opacity-80">MAD</span>
                    </span>
                    {inCartQty > 1 && (
                      <span className="text-[10px] font-mono text-[var(--kaspi-text-muted)] mt-0.5">
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

      {/* ====================================================================
         FLOATING GLASS PRODUCT MANAGEMENT MODAL (3-DOT ••• MENU VIA PORTAL)
         1. تغيير الصورة (Change Image)
         2. تعديل المنتج (Edit Product Details)
         3. تغيير الصنف / الفئة (Change Category / Classification)
         ==================================================================== */}
      <KaspiGlassModalPortal
        isOpen={managingProduct !== null}
        onClose={() => setManagingProduct(null)}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {managingProduct && (
          <div
            data-kaspi-product-manage-modal="true"
            className="kaspi-opaque-glass-modal kaspi-polar-aurora-orbit w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.12] pb-3.5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="kaspi-product-white-box w-11 h-11 rounded-2xl shrink-0">
                  {editImageUrl ? (
                    <img
                      src={editImageUrl}
                      alt={managingProduct.name}
                      className="w-[90%] h-[90%] object-contain"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-[var(--kaspi-text-secondary)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--kaspi-text-primary)] truncate">
                    {managingProduct.name}
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--kaspi-text-muted)] block">
                    SKU: {managingProduct.sku} • {Number(managingProduct.salePrice).toFixed(2)} MAD
                  </span>
                </div>
              </div>
              <AppleBackButton onClick={() => setManagingProduct(null)} locale={locale} />
            </div>

            {/* 3 Segmented Action Tabs: تغيير الصورة | تعديل المنتج | تغيير الصنف */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl kaspi-frosted-card">
              <button
                type="button"
                onClick={() => setManageTab("image")}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  manageTab === "image"
                    ? "kaspi-glass-btn kaspi-orbit-active shadow-xs"
                    : "text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)]"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {locale === "ar" ? "تغيير الصورة" : locale === "en" ? "Change Image" : "Changer Photo"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setManageTab("details")}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  manageTab === "details"
                    ? "kaspi-glass-btn kaspi-orbit-active shadow-xs"
                    : "text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)]"
                }`}
              >
                <Pencil className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {locale === "ar" ? "تعديل المنتج" : locale === "en" ? "Edit Product" : "Modifier Produit"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setManageTab("category")}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  manageTab === "category"
                    ? "kaspi-glass-btn kaspi-orbit-active shadow-xs"
                    : "text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)]"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {locale === "ar" ? "تغيير الصنف" : locale === "en" ? "Change Category" : "Catégorie"}
                </span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
            />

            {/* TAB 1: تغيير الصورة (CHANGE IMAGE) */}
            {manageTab === "image" && (
              <form onSubmit={handleSaveProductChanges} className="space-y-4 text-xs">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                  className="kaspi-product-white-box relative h-44 w-full rounded-2xl border border-dashed border-white/25 hover:border-emerald-400/60 transition-all flex items-center justify-center cursor-pointer"
                >
                  {isProcessingPhoto ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                      <span className="text-xs font-semibold text-[var(--kaspi-text-secondary)]">
                        {locale === "ar" ? "جاري تفريغ الخلفية وتحسين الصورة..." : "Détourage automatique..."}
                      </span>
                    </div>
                  ) : editImageUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={editImageUrl}
                        alt="Preview"
                        className="h-[90%] w-[90%] object-contain mx-auto"
                      />
                      <span className="absolute bottom-2 end-2 px-3 py-1 rounded-xl kaspi-glass-btn text-[11px] font-bold">
                        {locale === "ar" ? "رفع صورة أخرى" : "Remplacer"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center p-4">
                      <div className="w-10 h-10 rounded-2xl kaspi-glass-btn flex items-center justify-center">
                        <Upload className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-bold text-[var(--kaspi-text-primary)]">
                        {locale === "ar"
                          ? "اضغط لرفع صورة من جهازك أو اسحبها هنا"
                          : locale === "en"
                          ? "Click to upload or drag & drop product photo"
                          : "Cliquez ou glissez une nouvelle photo produit"}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--kaspi-text-muted)]">
                        PNG, JPG, WEBP • Auto Background Cutout
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                    {locale === "ar" ? "أو رابط صورة مباشر (URL):" : "Ou URL directe de l'image :"}
                  </label>
                  <input
                    type="url"
                    value={editImageUrl.startsWith("data:") ? "" : editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="https://..."
                    dir="ltr"
                    className="w-full h-10 px-3.5 kaspi-translucent-input rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.12]">
                  <button
                    type="button"
                    onClick={() => setManagingProduct(null)}
                    className="px-4 py-2 rounded-xl kaspi-glass-btn text-xs font-semibold cursor-pointer"
                  >
                    {locale === "ar" ? "إلغاء" : "Annuler"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="px-5 py-2 rounded-xl kaspi-emerald-checkout-btn font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{locale === "ar" ? "حفظ الصورة الجديدة" : "Enregistrer la photo"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: تعديل المنتج (EDIT PRODUCT DETAILS) */}
            {manageTab === "details" && (
              <form onSubmit={handleSaveProductChanges} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                    {locale === "ar" ? "اسم المنتج (AR / FR):" : "Nom de l'article (AR / FR) :"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-10 px-3.5 kaspi-translucent-input rounded-xl font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                      {locale === "ar" ? "سعر البيع (MAD):" : "Prix de Vente (MAD) :"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editSalePrice}
                      onChange={(e) => setEditSalePrice(e.target.value)}
                      dir="ltr"
                      className="w-full h-10 px-3.5 kaspi-translucent-input rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                      {locale === "ar" ? "سعر التكلفة / الجملة (MAD):" : "Prix d'Achat / Gros (MAD) :"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editCostPrice}
                      onChange={(e) => setEditCostPrice(e.target.value)}
                      placeholder="0.00"
                      dir="ltr"
                      className="w-full h-10 px-3.5 kaspi-translucent-input rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                      {locale === "ar" ? "الباركود (EAN-13):" : "Code-barres (EAN) :"}
                    </label>
                    <input
                      type="text"
                      value={editBarcode}
                      onChange={(e) => setEditBarcode(e.target.value)}
                      placeholder="611..."
                      dir="ltr"
                      className="w-full h-10 px-3.5 kaspi-translucent-input rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                      {locale === "ar" ? "رمز SKU:" : "Code SKU :"}
                    </label>
                    <input
                      type="text"
                      value={editSku}
                      onChange={(e) => setEditSku(e.target.value)}
                      dir="ltr"
                      className="w-full h-10 px-3.5 kaspi-translucent-input rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 items-end">
                  <div>
                    <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                      {locale === "ar" ? "كمية المخزون:" : "Stock disponible :"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      dir="ltr"
                      className="w-full h-10 px-3 kaspi-translucent-input rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                      {locale === "ar" ? "وحدة البيع:" : "Unité :"}
                    </label>
                    <div className="h-10 p-1 rounded-xl kaspi-frosted-card flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditUnit("piece")}
                        className={`flex-1 h-8 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          editUnit === "piece"
                            ? "kaspi-glass-btn kaspi-orbit-active"
                            : "text-[var(--kaspi-text-muted)]"
                        }`}
                      >
                        {locale === "ar" ? "قطعة" : "Unité"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditUnit("kg")}
                        className={`flex-1 h-8 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          editUnit === "kg"
                            ? "kaspi-glass-btn kaspi-orbit-active"
                            : "text-[var(--kaspi-text-muted)]"
                        }`}
                      >
                        Kg
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                      {locale === "ar" ? "تاريخ الصلاحية DLC:" : "Date DLC :"}
                    </label>
                    <input
                      type="date"
                      value={editExpiryDate}
                      onChange={(e) => setEditExpiryDate(e.target.value)}
                      dir="ltr"
                      className="w-full h-10 px-2.5 kaspi-translucent-input rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.12] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteProduct}
                    disabled={isSavingProduct}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{locale === "ar" ? "حذف المنتج" : "Supprimer"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setManagingProduct(null)}
                      className="px-4 py-2 rounded-xl kaspi-glass-btn text-xs font-semibold cursor-pointer"
                    >
                      {locale === "ar" ? "إلغاء" : "Annuler"}
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProduct}
                      className="px-5 py-2 rounded-xl kaspi-emerald-checkout-btn font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSavingProduct ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>{locale === "ar" ? "حفظ التعديلات" : "Enregistrer"}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 3: تغيير الصنف / الفئة (CHANGE CATEGORY / CLASSIFICATION) */}
            {manageTab === "category" && (
              <div className="space-y-4 text-xs">
                <p className="text-[11px] text-[var(--kaspi-text-secondary)]">
                  {locale === "ar"
                    ? "اختر الصنف الجديد لنقل المنتج إليه بنقرة واحدة، أو أنشئ صنفاً جديداً:"
                    : locale === "en"
                    ? "Select a category to reassign this item in 1 click, or create a new category:"
                    : "Sélectionnez une catégorie pour réaffecter cet article en 1 clic :"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {DEFAULT_CATEGORIES.map((cat) => {
                    const isSelected = editCategoryName === cat.id;
                    const label = locale === "ar" ? cat.ar : locale === "en" ? cat.en : cat.fr;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setEditCategoryName(cat.id);
                          handleSaveProductChanges(undefined, cat.id);
                        }}
                        className={`p-3 rounded-xl text-start flex items-center justify-between gap-2 transition cursor-pointer ${
                          isSelected
                            ? "kaspi-glass-btn kaspi-orbit-active font-bold"
                            : "kaspi-frosted-card hover:brightness-105"
                        }`}
                      >
                        <span className="truncate">{label}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}

                  {customCategories.map((cName) => {
                    const isSelected = editCategoryName === cName;
                    return (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => {
                          setEditCategoryName(cName);
                          handleSaveProductChanges(undefined, cName);
                        }}
                        className={`p-3 rounded-xl text-start flex items-center justify-between gap-2 transition cursor-pointer ${
                          isSelected
                            ? "kaspi-glass-btn kaspi-orbit-active font-bold"
                            : "kaspi-frosted-card hover:brightness-105"
                        }`}
                      >
                        <span className="truncate">{cName}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Inline + Create New Category */}
                <div className="pt-3 border-t border-white/[0.12] space-y-2">
                  <label className="block text-[var(--kaspi-text-secondary)] font-semibold">
                    {locale === "ar" ? "+ إنشاء صنف / جناح جديد:" : "+ Créer une nouvelle catégorie :"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      placeholder={locale === "ar" ? "مثال: أجبان ومشتقات الحليب..." : "Ex: Produits Bio & Frais..."}
                      className="flex-1 h-9 px-3 kaspi-translucent-input rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineCategory}
                      className="h-9 px-4 rounded-xl kaspi-emerald-checkout-btn font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{locale === "ar" ? "إضافة وتعيين" : "Créer"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </KaspiGlassModalPortal>
    </>
  );
};
