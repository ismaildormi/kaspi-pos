"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Scale,
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  Coins,
  Weight,
  Layers,
  Upload,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { AppleBackButton } from "@/components/common/AppleBackButton";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";
import { getCachedData, setCachedData } from "@/lib/cache/client-cache";
import { offlineDb } from "@/client/db";
import { compressImage } from "@/lib/image-compression";
import { playTapSound, playSuccessSound } from "@/lib/audio";
import { toast } from "sonner";

interface SquarePluScalePanelProps {
  onBack: () => void;
  products?: PosProduct[];
}

export interface PluItem {
  plu: string;
  nameAr: string;
  nameFr: string;
  pricePerKg: number;
  isCustom?: boolean;
  imageUrl?: string | null;
  productRef?: PosProduct;
}

export function SquarePluScalePanel({ onBack, products: propProducts }: SquarePluScalePanelProps) {
  const { locale } = useAppDictionary();
  const { addToCart } = usePosStore();

  // Load custom PLU items from localStorage
  const [customPlus, setCustomPlus] = useState<PluItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("kaspi_custom_plu_items");
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn("Failed to parse custom PLUs", e);
      }
    }
    return [];
  });

  const catalogProducts = useMemo<PosProduct[]>(() => {
    if (propProducts && propProducts.length > 0) return propProducts;
    try {
      const cached = getCachedData<PosProduct[]>("products_catalog", []);
      if (Array.isArray(cached.data)) return cached.data;
    } catch {}
    return [];
  }, [propProducts]);

  // Read weighted items dynamically from merchant catalog + custom PLU items (With Studio Photos)
  const allPluItems = useMemo<PluItem[]>(() => {
    const list: PluItem[] = customPlus.map((item) => {
      const matched = catalogProducts.find(
        (p) =>
          p.name?.toLowerCase() === item.nameFr?.toLowerCase() ||
          p.name?.toLowerCase() === item.nameAr?.toLowerCase() ||
          p.sku?.replace(/\D/g, "").slice(-4) === item.plu
      );
      return {
        ...item,
        imageUrl: item.imageUrl || (matched as any)?.imageUrl || matched?.image || null,
        productRef: matched,
      };
    });

    catalogProducts.forEach((p: PosProduct) => {
      if (
        p.isScaleItem ||
        p.weightUnit === "kg" ||
        (p as any).unit === "kg" ||
        p.categoryId === "produce" ||
        p.categoryName === "produce"
      ) {
        const skuNumber = p.sku?.replace(/\D/g, "").slice(-4) || "4099";
        const resolvedImg = (p as any).imageUrl || p.image || null;
        const alreadyExists = list.some((item) => item.plu === skuNumber || item.nameFr === p.name);
        if (!alreadyExists) {
          list.push({
            plu: skuNumber,
            nameAr: p.name,
            nameFr: p.name,
            pricePerKg: p.salePrice || 10,
            isCustom: false,
            imageUrl: resolvedImg,
            productRef: p,
          });
        }
      }
    });

    return list;
  }, [customPlus, catalogProducts]);

  const fallbackPlu: PluItem = useMemo(() => {
    if (catalogProducts.length > 0) {
      const p = catalogProducts[0];
      return {
        plu: p.sku?.replace(/\D/g, "").slice(-4) || "1001",
        nameAr: p.name,
        nameFr: p.name,
        pricePerKg: Number(p.salePrice || p.price || 10),
        isCustom: false,
        imageUrl: (p as any).imageUrl || p.image || null,
        productRef: p,
      };
    }
    return {
      plu: "1001",
      nameAr: locale === "ar" ? "منتج بالوزن" : locale === "en" ? "Weighed Product" : "Article Pesé",
      nameFr: locale === "en" ? "Weighed Product" : locale === "ar" ? "منتج بالوزن" : "Article Pesé",
      pricePerKg: 10,
      isCustom: false,
      imageUrl: null,
    };
  }, [catalogProducts, locale]);

  const [selectedPlu, setSelectedPlu] = useState<PluItem | null>(() => allPluItems[0] || fallbackPlu);

  useEffect(() => {
    if (!selectedPlu) {
      setSelectedPlu(allPluItems[0] || fallbackPlu);
    } else if (allPluItems.length > 0 && !allPluItems.some((item) => item.plu === selectedPlu.plu)) {
      setSelectedPlu(allPluItems[0] || fallbackPlu);
    }
  }, [allPluItems, fallbackPlu, selectedPlu]);

  const effectiveSelectedPlu = selectedPlu || allPluItems[0] || fallbackPlu;

  // Dual Calculation Mode: "weight" (kg/g) or "amount" (customer wants X MAD)
  const [calcMode, setCalcMode] = useState<"weight" | "amount">("weight");

  // Input states
  const [weightInput, setWeightInput] = useState<string>("1.000");
  const [amountInput, setAmountInput] = useState<string>("10.00");

  // Modal to add custom PLU item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPluCode, setNewPluCode] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [newNameFr, setNewNameFr] = useState("");
  const [newPriceKg, setNewPriceKg] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isProcessingPluImage, setIsProcessingPluImage] = useState(false);
  const pluFileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePluImageFile = async (file: File) => {
    setIsProcessingPluImage(true);
    try {
      const res = await compressImage(file, {
        autoRemoveBackground: true,
        generateDataUrl: true,
        maxDimension: 720,
        quality: 0.85,
      });
      if (res.dataUrl) {
        setNewImageUrl(res.dataUrl);
        playSuccessSound();
        toast.success(
          locale === "ar"
            ? "تم تجهيز وتفريغ صورة سلعة الميزان بنجاح"
            : locale === "en"
            ? "Scale item photo processed"
            : "Photo de l'article pesé préparée"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process image");
    } finally {
      setIsProcessingPluImage(false);
      if (pluFileInputRef.current) pluFileInputRef.current.value = "";
    }
  };

  const weightPresets = [0.25, 0.5, 1.0, 2.0];
  const amountPresets = [10, 15, 20, 50];

  const handleKeypadPress = (val: string) => {
    playTapSound();

    if (calcMode === "weight") {
      if (val === "C") {
        setWeightInput("");
        return;
      }
      if (val === "BACK") {
        setWeightInput((prev) => prev.slice(0, -1));
        return;
      }
      if (val === ".") {
        setWeightInput((prev) => {
          if (prev.includes(".")) return prev;
          return prev === "" ? "0." : `${prev}.`;
        });
        return;
      }
      setWeightInput((prev) => `${prev}${val}`);
    } else {
      if (val === "C") {
        setAmountInput("");
        return;
      }
      if (val === "BACK") {
        setAmountInput((prev) => prev.slice(0, -1));
        return;
      }
      if (val === ".") {
        setAmountInput((prev) => {
          if (prev.includes(".")) return prev;
          return prev === "" ? "0." : `${prev}.`;
        });
        return;
      }
      setAmountInput((prev) => `${prev}${val}`);
    }
  };

  const handleSelectWeightPreset = (w: number) => {
    playTapSound();
    setWeightInput(w.toFixed(3));
  };

  const handleSelectAmountPreset = (amt: number) => {
    playTapSound();
    setAmountInput(amt.toFixed(2));
  };

  // Math Calculations: Real zero-math for the worker (Supports free decimal clearing & commas)
  const activePlu = effectiveSelectedPlu;
  const activePricePerKg = activePlu ? activePlu.pricePerKg : 0;
  const currentWeightKg = parseFloat(weightInput.replace(",", ".")) || 0;
  const currentTargetAmount = parseFloat(amountInput.replace(",", ".")) || 0;

  // In Weight Mode: Total = Weight × Price/kg
  const computedTotalFromWeight = Math.round(activePricePerKg * currentWeightKg * 100) / 100;

  // In Amount Mode: Weight = Amount ÷ Price/kg
  const computedWeightFromAmountKg = activePricePerKg > 0 ? currentTargetAmount / activePricePerKg : 0;
  const computedWeightGrams = Math.round(computedWeightFromAmountKg * 1000);

  const handleAddToCart = () => {
    if (!activePlu) {
      toast.error(
        locale === "ar"
          ? "يرجى اختيار سلعة أولاً"
          : locale === "en"
          ? "Please select an item first"
          : "Veuillez sélectionner un article"
      );
      return;
    }

    if (calcMode === "weight") {
      if (currentWeightKg <= 0) return;
      playSuccessSound();
      if (activePlu.productRef) {
        addToCart(activePlu.productRef, Number(currentWeightKg.toFixed(3)));
      } else {
        const lineTotal = computedTotalFromWeight;
        const displayName =
          locale === "ar"
            ? `${activePlu.nameAr} (${currentWeightKg.toFixed(3)} كغ)`
            : locale === "en"
            ? `${activePlu.nameFr || activePlu.nameAr} (${currentWeightKg.toFixed(3)} kg)`
            : `${activePlu.nameFr} (${currentWeightKg.toFixed(3)} kg)`;

        const pluProduct: PosProduct = {
          id: `plu_${activePlu.plu}_${Date.now()}`,
          name: displayName,
          sku: `PLU-${activePlu.plu}`,
          barcode: `20${activePlu.plu}00000`,
          salePrice: lineTotal,
          taxRate: 0,
          trackStock: true,
          stockQuantity: 999,
          categoryId: "produce",
          image: activePlu.imageUrl || null,
          isScaleItem: true,
          weightUnit: "kg",
        };
        addToCart(pluProduct, 1);
      }
    } else {
      if (currentTargetAmount <= 0) return;
      playSuccessSound();
      const displayName =
        locale === "ar"
          ? `${activePlu.nameAr} (${computedWeightGrams} غرام - ${computedWeightFromAmountKg.toFixed(3)} كغ)`
          : locale === "en"
          ? `${activePlu.nameFr || activePlu.nameAr} (${computedWeightGrams}g - ${computedWeightFromAmountKg.toFixed(3)}kg)`
          : `${activePlu.nameFr} (${computedWeightGrams}g - ${computedWeightFromAmountKg.toFixed(3)}kg)`;

      const pluProduct: PosProduct = {
        id: `plu_${activePlu.plu}_${Date.now()}`,
        name: displayName,
        sku: `PLU-${activePlu.plu}`,
        barcode: `20${activePlu.plu}00000`,
        salePrice: currentTargetAmount,
        taxRate: 0,
        trackStock: true,
        stockQuantity: 999,
        categoryId: "produce",
        image: activePlu.imageUrl || null,
        isScaleItem: true,
        weightUnit: "kg",
      };
      addToCart(pluProduct, 1);
    }

    onBack();
  };

  const handleSaveCustomPlu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPluCode.trim() || !newNameFr.trim() || !newPriceKg.trim()) {
      toast.error(
        locale === "ar"
          ? "يرجى ملء جميع الحقول"
          : locale === "en"
          ? "Please fill all required fields"
          : "Veuillez remplir tous les champs"
      );
      return;
    }

    const price = parseFloat(newPriceKg);
    if (isNaN(price) || price <= 0) {
      toast.error(
        locale === "ar"
          ? "يرجى إدخال سعر صحيح لكل كغ"
          : locale === "en"
          ? "Invalid price per kg"
          : "Prix au kg invalide"
      );
      return;
    }

    const cleanImage = newImageUrl.trim() || null;

    const newItem: PluItem = {
      plu: newPluCode.trim(),
      nameAr: newNameAr.trim() || newNameFr.trim(),
      nameFr: newNameFr.trim(),
      pricePerKg: price,
      isCustom: true,
      imageUrl: cleanImage,
    };

    const updated = [newItem, ...customPlus];
    setCustomPlus(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("kaspi_custom_plu_items", JSON.stringify(updated));
    }

    // Persist in DB & Dexie so weighable PLU items and their photos sync across Smart Grid & PLU Scale
    const createdPosItem: PosProduct = {
      id: `plu_prod_${newItem.plu}_${Date.now()}`,
      name: newItem.nameAr || newItem.nameFr,
      sku: `PLU-${newItem.plu}`,
      barcode: `20${newItem.plu.padStart(4, "0")}00000`,
      salePrice: price,
      taxRate: 20,
      stockQuantity: 100,
      trackStock: true,
      categoryId: "produce",
      categoryName: "produce",
      image: cleanImage,
      isScaleItem: true,
      weightUnit: "kg",
    };

    if (typeof navigator !== "undefined" && navigator.onLine) {
      fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createdPosItem.name,
          sku: createdPosItem.sku,
          barcode: createdPosItem.barcode,
          salePrice: price,
          initialStock: 100,
          stockQuantity: 100,
          categoryName: "produce",
          imageUrl: cleanImage || undefined,
          unit: "kg",
          isScaleItem: true,
        }),
      }).catch(() => {});
    }

    if (offlineDb?.offlineProducts) {
      offlineDb.offlineProducts
        .put({
          id: createdPosItem.id,
          tenantId: "current",
          sku: createdPosItem.sku,
          barcode: createdPosItem.barcode,
          name: createdPosItem.name,
          imageUrl: cleanImage,
          salePrice: price,
          taxRate: 20,
          trackStock: true,
          stockQuantity: 100,
          categoryName: "produce",
          unit: "kg",
          isScaleItem: true,
        })
        .catch(() => {});
    }

    try {
      const cached = getCachedData<any[]>("products_catalog", []);
      const list = Array.isArray(cached.data) ? cached.data : [];
      setCachedData("products_catalog", [createdPosItem, ...list]);
    } catch {}

    setSelectedPlu(newItem);
    setIsAddModalOpen(false);
    setNewPluCode("");
    setNewNameAr("");
    setNewNameFr("");
    setNewPriceKg("");
    setNewImageUrl("");
    toast.success(
      locale === "ar"
        ? "تمت إضافة السلعة للميزان بنجاح"
        : locale === "en"
        ? "Scale item added successfully"
        : "Article pesé ajouté avec succès"
    );
  };

  const handleDeletePlu = (plu: string) => {
    const updated = customPlus.filter((item) => item.plu !== plu);
    setCustomPlus(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("kaspi_custom_plu_items", JSON.stringify(updated));
    }
    if (selectedPlu?.plu === plu) {
      setSelectedPlu(updated[0] || fallbackPlu);
    }
    toast.info(
      locale === "ar"
        ? "تم حذف السلعة من قائمة الميزان"
        : locale === "en"
        ? "Item removed from scale list"
        : "Article retiré"
    );
  };

  return (
    <div dir="ltr" className="h-full flex flex-col space-y-2 p-2 select-none overflow-hidden text-start">
      {/* Top Bar with Back Button & Add PLU Item */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-8 px-2.5 rounded-lg kaspi-frosted-glass text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>
              {locale === "ar" ? "العودة للشبكة" : locale === "en" ? "Product Grid" : "Grille Articles"}
            </span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Scale className="w-4 h-4 text-zinc-400" />
            <span>
              {locale === "ar"
                ? "الميزان والخضر/اللحوم (PLU)"
                : locale === "en"
                ? "Scale & Produce/Meat (PLU)"
                : "Balance & Fruits/Légumes (PLU)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-kaspi-add-plu-trigger="true"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 px-3 rounded-lg kaspi-glass-btn text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>
              {locale === "ar"
                ? "إضافة سلعة للميزان"
                : locale === "en"
                ? "New Weighed Item"
                : "Nouvel Article Pesé"}
            </span>
          </button>

          {activePlu && (
            <span className="hidden sm:inline font-mono text-[11px] text-zinc-400 kaspi-frosted-glass px-2.5 py-1 rounded-md">
              PLU #{activePlu.plu} • {activePlu.pricePerKg.toFixed(2)} MAD/kg
            </span>
          )}
        </div>
      </div>

      {/* Main Split Grid: 7 Cols PLU Produce Matrix + 5 Cols Compact Dual Calculator */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-0 overflow-hidden items-start">
        {/* Left Side (7 Cols): PLU Produce Cards Matrix with Studio Photos */}
        <div className="lg:col-span-7 h-full overflow-y-auto pr-1">
          {allPluItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl kaspi-polar-aurora-orbit kaspi-frosted-card space-y-3">
              <div className="w-12 h-12 rounded-xl kaspi-frosted-glass flex items-center justify-center text-zinc-400">
                <Scale className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">
                {locale === "ar" ? "لا توجد سلع ميزان مضافة" : locale === "en" ? "No weighed items" : "Aucun article pesé"}
              </p>
              <p className="text-xs text-zinc-400 max-w-xs">
                {locale === "ar"
                  ? "أضف سلعة بالوزن (خضر، فواكه، توابل، زيتون) للبدء في الحساب التلقائي"
                  : locale === "en"
                  ? "Add a weighed item (produce, meat, spices, bulk) to start automatic calculation"
                  : "Ajoutez un article au poids (fruits, légumes, vrac) pour démarrer"}
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl kaspi-polar-aurora-orbit kaspi-emerald-checkout-btn font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{locale === "ar" ? "إضافة أول سلعة للميزان" : locale === "en" ? "Add First Item" : "Ajouter un premier article"}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-2">
              {allPluItems.map((item) => {
                const isSelected = activePlu?.plu === item.plu;
                return (
                  <div
                    key={item.plu}
                    onClick={() => {
                      playTapSound();
                      setSelectedPlu(item);
                    }}
                    className={`relative p-2.5 rounded-2xl kaspi-product-orbit-card text-start transition-all cursor-pointer flex flex-col justify-between min-h-[158px] ${
                      isSelected ? "kaspi-orbit-active ring-1 ring-emerald-400/60" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-zinc-400">
                        #{item.plu}
                      </span>
                      <div className="flex items-center gap-1">
                        {item.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlu(item.plu);
                            }}
                            className="p-0.5 transition-colors text-zinc-400 hover:text-rose-400"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />}
                      </div>
                    </div>

                    {/* Unified Studio Photo Box */}
                    <div className="kaspi-product-white-box w-full h-20 mb-1.5">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={locale === "ar" ? item.nameAr : item.nameFr}
                          className="w-[92%] h-[92%] object-contain mx-auto"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Scale className="w-6 h-6 text-[var(--kaspi-text-muted)]" />
                        </div>
                      )}
                    </div>

                    <span className="font-sans font-semibold text-xs leading-snug line-clamp-1 text-white">
                      {locale === "ar" ? item.nameAr : item.nameFr}
                    </span>

                    <div className="flex items-baseline justify-between border-t border-white/[0.08] pt-1 mt-1">
                      <span className="font-mono font-black text-xs text-white tabular-nums">
                        {item.pricePerKg.toFixed(2)}
                      </span>
                      <span className="text-[9.5px] font-semibold text-zinc-400">MAD/kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side (5 Cols): Compact Dual Mode Calculator (Crystal Glass + Free Editable Input) */}
        <div className="lg:col-span-5 h-full max-h-[calc(100vh-140px)] flex flex-col justify-between p-3 rounded-2xl kaspi-polar-aurora-orbit kaspi-frosted-card space-y-2 overflow-y-auto">
          {activePlu ? (
            <>
              {/* Active Item Header with Photo Thumbnail */}
              <div className="pb-1.5 border-b border-white/[0.08] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="kaspi-product-white-box w-10 h-10 shrink-0 !p-1">
                    {activePlu.imageUrl ? (
                      <img
                        src={activePlu.imageUrl}
                        alt={locale === "ar" ? activePlu.nameAr : activePlu.nameFr}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Scale className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-mono text-zinc-400 font-bold block">PLU #{activePlu.plu}</span>
                    <h4 className="font-bold text-xs text-white truncate">
                      {locale === "ar" ? activePlu.nameAr : activePlu.nameFr}
                    </h4>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-white shrink-0 tabular-nums">
                  {activePlu.pricePerKg.toFixed(2)} <span className="text-[9.5px] text-zinc-400 font-normal">MAD/kg</span>
                </span>
              </div>

              {/* Dual Mode Switcher: By Weight (kg) vs. By Target Amount (MAD) */}
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl kaspi-frosted-glass shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setCalcMode("weight");
                  }}
                  className={`h-7 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    calcMode === "weight"
                      ? "kaspi-glass-btn kaspi-orbit-active font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Weight className="w-3 h-3" />
                  <span>
                    {locale === "ar" ? "حساب بالوزن (كغ)" : locale === "en" ? "By Weight (kg)" : "Par Poids (kg)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setCalcMode("amount");
                  }}
                  className={`h-7 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    calcMode === "amount"
                      ? "kaspi-glass-btn kaspi-orbit-active font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Coins className="w-3 h-3" />
                  <span>
                    {locale === "ar" ? "حساب بالدرهم (MAD)" : locale === "en" ? "By Amount (MAD)" : "Par Montant (DH)"}
                  </span>
                </button>
              </div>

              {/* Primary Calculation Display (Free Editable Decimal Field) */}
              {calcMode === "weight" ? (
                <div className="p-2.5 rounded-xl kaspi-frosted-glass flex items-center justify-between gap-2 shrink-0">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {locale === "ar" ? "الوزن المقاس:" : locale === "en" ? "Measured Weight:" : "Poids mesuré :"}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={weightInput}
                      placeholder="0.000"
                      aria-label={locale === "ar" ? "الوزن المقاس بالكيلو" : "Measured weight (kg)"}
                      onChange={(e) => {
                        const next = e.target.value.replace(",", ".");
                        if (next === "" || /^[0-9]*\.?[0-9]{0,3}$/.test(next)) {
                          setWeightInput(next);
                        }
                      }}
                      className="w-28 h-9 px-2.5 rounded-xl kaspi-translucent-input text-end font-mono text-lg font-black tabular-nums tracking-tight focus:outline-none"
                    />
                    <span className="text-[11px] font-bold text-zinc-400">kg</span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl kaspi-frosted-glass space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {locale === "ar" ? "مبلغ الزبون:" : locale === "en" ? "Target Amount:" : "Montant demandé :"}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={amountInput}
                        placeholder="0.00"
                        aria-label={locale === "ar" ? "مبلغ الزبون بالدرهم" : "Target amount (MAD)"}
                        onChange={(e) => {
                          const next = e.target.value.replace(",", ".");
                          if (next === "" || /^[0-9]*\.?[0-9]{0,2}$/.test(next)) {
                            setAmountInput(next);
                          }
                        }}
                        className="w-28 h-9 px-2.5 rounded-xl kaspi-translucent-input text-end font-mono text-lg font-black tabular-nums focus:outline-none"
                      />
                      <span className="text-[11px] font-bold text-zinc-400">MAD</span>
                    </div>
                  </div>

                  {/* Exact Weight To Put on Scale */}
                  <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[11.5px] font-mono">
                    <span className="font-bold text-zinc-400">
                      {locale === "ar" ? "الوزن الواجب وضعه:" : locale === "en" ? "Target Weight to Serve:" : "Poids à servir :"}
                    </span>
                    <span className="font-black text-white text-sm tabular-nums">
                      {computedWeightGrams}g ({computedWeightFromAmountKg.toFixed(3)}kg)
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Presets Bar */}
              <div className="grid grid-cols-4 gap-1.5 shrink-0 select-none">
                {calcMode === "weight"
                  ? weightPresets.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleSelectWeightPreset(w)}
                        className={`h-8 sm:h-7 min-h-[34px] rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                          currentWeightKg === w
                            ? "kaspi-glass-btn kaspi-orbit-active font-black"
                            : "kaspi-frosted-glass text-zinc-300 hover:text-white"
                        }`}
                      >
                        {w >= 1 ? `${w}kg` : `${w * 1000}g`}
                      </button>
                    ))
                  : amountPresets.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectAmountPreset(amt)}
                        className={`h-8 sm:h-7 min-h-[34px] rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                          currentTargetAmount === amt
                            ? "kaspi-glass-btn kaspi-orbit-active font-black"
                            : "kaspi-frosted-glass text-zinc-300 hover:text-white"
                        }`}
                      >
                        {amt} DH
                      </button>
                    ))}
              </div>

              {/* 3×4 Compact Touch Keypad */}
              <div className="grid grid-cols-3 gap-1.5 shrink-0 select-none">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "C"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="h-10 sm:h-9 min-h-[42px] rounded-xl kaspi-glass-btn font-mono font-bold text-sm flex items-center justify-center transition-all cursor-pointer active:scale-90 touch-manipulation"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Real Zero-Math Footer & Add CTA */}
              <div className="pt-2 border-t border-white/[0.08] space-y-2 shrink-0">
                <div className="flex items-baseline justify-between font-mono text-xs">
                  <span className="font-bold text-zinc-400">
                    {locale === "ar" ? "المجموع المحسوب:" : locale === "en" ? "Calculated Total:" : "Total à ajouter :"}
                  </span>
                  <span className="text-lg font-black text-white tabular-nums">
                    {calcMode === "weight" ? computedTotalFromWeight.toFixed(2) : currentTargetAmount.toFixed(2)}{" "}
                    <span className="text-[10px] text-zinc-400">MAD</span>
                  </span>
                </div>

                <button
                  type="button"
                  disabled={calcMode === "weight" ? currentWeightKg <= 0 : currentTargetAmount <= 0}
                  onClick={handleAddToCart}
                  className="h-10 w-full rounded-xl kaspi-polar-aurora-orbit kaspi-emerald-checkout-btn disabled:opacity-40 font-black text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {calcMode === "weight"
                      ? locale === "ar"
                        ? `إضافة للسلة (${computedTotalFromWeight.toFixed(2)} MAD)`
                        : locale === "en"
                        ? `Add to Cart (${computedTotalFromWeight.toFixed(2)} MAD)`
                        : `Ajouter au Panier (${computedTotalFromWeight.toFixed(2)} MAD)`
                      : locale === "ar"
                      ? `إضافة للسلة (${currentTargetAmount.toFixed(2)} MAD • ${computedWeightGrams}g)`
                      : locale === "en"
                      ? `Add to Cart (${currentTargetAmount.toFixed(2)} MAD • ${computedWeightGrams}g)`
                      : `Ajouter au Panier (${currentTargetAmount.toFixed(2)} MAD • ${computedWeightGrams}g)`}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-400">
              <Scale className="w-8 h-8 text-zinc-600 mb-1" />
              <p className="text-xs font-bold text-white">
                {locale === "ar" ? "اختر أو أضف سلعة ميزان" : locale === "en" ? "Select a weighed item" : "Sélectionnez un article pesé"}
              </p>
              <p className="text-[11px] text-zinc-500">
                {locale === "ar" ? "اضغط على إضافة سلعة للبدء" : locale === "en" ? "Click New Item to start" : "Cliquez sur Nouvel Article"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Custom PLU Weighted Item (Portal z-[9999] + Glass Image Uploader) */}
      <KaspiGlassModalPortal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <div
          data-kaspi-plu-modal="true"
          className="kaspi-opaque-glass-modal kaspi-polar-aurora-orbit w-full max-w-md max-h-[90vh] overflow-y-auto my-auto rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/[0.12] pb-3 gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[var(--kaspi-text-primary)] flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl kaspi-glass-btn flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-emerald-400" />
              </div>
              <span>
                {locale === "ar"
                  ? "إضافة سلعة جديدة للميزان (PLU)"
                  : locale === "en"
                  ? "New Weighed Item (PLU)"
                  : "Nouvel Article Pesé (PLU)"}
              </span>
            </h3>
            <AppleBackButton onClick={() => setIsAddModalOpen(false)} locale={locale} />
          </div>

          <input
            ref={pluFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePluImageFile(file);
            }}
          />

          <form onSubmit={handleSaveCustomPlu} className="space-y-3.5 text-xs">
            {/* Glass Image Uploader / Dropzone for Weighable PLU Item */}
            <div>
              <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1.5">
                {locale === "ar"
                  ? "صورة السلعة (رفع مباشر أو سحب وإفلات):"
                  : locale === "en"
                  ? "Item Photo (Upload or Drag & Drop):"
                  : "Photo de l'article (Téléverser ou Glisser) :"}
              </label>
              <div
                onClick={() => pluFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handlePluImageFile(file);
                }}
                data-kaspi-plu-photo-dropzone="true"
                className="kaspi-product-white-box relative h-32 w-full rounded-2xl border border-dashed border-white/25 hover:border-emerald-400/60 transition-all flex items-center justify-center cursor-pointer group"
              >
                {isProcessingPluImage ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    <span className="text-[11px] font-semibold text-[var(--kaspi-text-secondary)]">
                      {locale === "ar" ? "جاري تحسين وتفريغ الصورة..." : "Traitement de l'image..."}
                    </span>
                  </div>
                ) : newImageUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={newImageUrl}
                      alt="PLU Preview"
                      className="h-[90%] w-[90%] object-contain mx-auto drop-shadow-sm"
                    />
                    <span className="absolute bottom-1.5 end-2 px-2.5 py-1 rounded-lg kaspi-glass-btn text-[10px] font-bold">
                      {locale === "ar" ? "تغيير الصورة" : "Changer"}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 text-center p-3">
                    <div className="w-9 h-9 rounded-xl kaspi-glass-btn flex items-center justify-center">
                      <Upload className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-[var(--kaspi-text-primary)]">
                      {locale === "ar"
                        ? "اضغط لرفع صورة الخضر / الفواكه / اللحوم"
                        : locale === "en"
                        ? "Click or drop produce / meat photo"
                        : "Cliquez pour ajouter une photo produit"}
                    </span>
                    <span className="text-[10px] text-[var(--kaspi-text-muted)] font-mono">
                      PNG, JPG, WEBP • Auto Cutout Studio
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[var(--kaspi-text-muted)] shrink-0" />
                <input
                  type="url"
                  value={newImageUrl.startsWith("data:") ? "" : newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder={
                    locale === "ar"
                      ? "أو الصق رابط صورة مباشر (اختياري)..."
                      : "Ou collez une URL d'image directe (optionnel)..."
                  }
                  className="w-full h-8 px-2.5 kaspi-translucent-input rounded-lg text-[11px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                  {locale === "ar"
                    ? "كود PLU (4 أرقام):"
                    : locale === "en"
                    ? "PLU Code (4 digits):"
                    : "Code PLU (4 chiffres) :"}
                </label>
                <input
                  type="text"
                  value={newPluCode}
                  onChange={(e) => setNewPluCode(e.target.value)}
                  placeholder="4020"
                  dir="ltr"
                  className="w-full h-9 px-3 kaspi-translucent-input rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                  {locale === "ar"
                    ? "السعر للكيلو (MAD/kg):"
                    : locale === "en"
                    ? "Price / kg (MAD):"
                    : "Prix / kg (MAD) :"}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={newPriceKg}
                  onChange={(e) => {
                    const next = e.target.value.replace(",", ".");
                    if (next === "" || /^[0-9]*\.?[0-9]{0,2}$/.test(next)) {
                      setNewPriceKg(next);
                    }
                  }}
                  placeholder="25.00"
                  dir="ltr"
                  className="w-full h-9 px-3 kaspi-translucent-input rounded-xl font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                  {locale === "ar" ? "اسم السلعة بالعربية:" : locale === "en" ? "Name (Arabic):" : "Nom en Arabe :"}
                </label>
                <input
                  type="text"
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  placeholder={locale === "ar" ? "مثال: زيتون أحمر مشرمل" : "Ex: Red Olives"}
                  className="w-full h-9 px-3 kaspi-translucent-input rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[var(--kaspi-text-secondary)] font-semibold mb-1">
                  {locale === "ar"
                    ? "الاسم بالفرنسية / اللاتينية:"
                    : locale === "en"
                    ? "Name (Latin / FR):"
                    : "Nom en Français :"}
                </label>
                <input
                  type="text"
                  value={newNameFr}
                  onChange={(e) => setNewNameFr(e.target.value)}
                  placeholder="Ex: Olives Rouges"
                  className="w-full h-9 px-3 kaspi-translucent-input rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="pt-2.5 flex items-center justify-end gap-2 border-t border-white/[0.12]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl kaspi-glass-btn text-xs font-semibold cursor-pointer"
              >
                {locale === "ar" ? "إلغاء" : locale === "en" ? "Cancel" : "Annuler"}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl kaspi-emerald-checkout-btn font-bold text-xs shadow-xs cursor-pointer"
              >
                {locale === "ar" ? "حفظ وإضافة للميزان" : locale === "en" ? "Save & Add" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </KaspiGlassModalPortal>
    </div>
  );
}
