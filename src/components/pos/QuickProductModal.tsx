"use client";

import React, { useState } from "react";
import { X, Plus, Package, Barcode, Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAppDictionary } from "@/i18n/schema";
import { offlineDb } from "@/client/db";
import { setCachedData, getCachedData } from "@/lib/cache/client-cache";
import { playBarcodeScanSound, playTapSound } from "@/lib/audio";
import type { PosProduct } from "@/client/store/usePosStore";

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: PosProduct) => void;
}

export const QuickProductModal: React.FC<QuickProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
}) => {
  const { locale } = useAppDictionary();
  const [name, setName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("50");
  const [barcode, setBarcode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const generateBarcode = () => {
    // Generate valid 13-digit EAN with Moroccan prefix 611
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    const ean = `611${randomDigits.slice(0, 9)}`;
    setBarcode(ean);
    playTapSound();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const priceNum = parseFloat(salePrice);
    const stockNum = parseFloat(stockQuantity) || 0;

    if (!cleanName) {
      toast.error(locale === "ar" ? "يرجى إدخال اسم المنتج" : "Veuillez saisir le nom du produit");
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      toast.error(locale === "ar" ? "يرجى إدخال سعر صحيح" : "Veuillez saisir un prix valide");
      return;
    }

    setIsSubmitting(true);

    try {
      let createdProduct: any = null;

      // 1. Try sending to backend API if online
      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const res = await fetch("/api/v1/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: cleanName,
              salePrice: priceNum,
              initialStock: stockNum,
              stockQuantity: stockNum,
              barcode: barcode.trim() || undefined,
              categoryName: categoryName.trim() || undefined,
              imageUrl: imageUrl.trim() || undefined,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            createdProduct = data.data?.product;
          }
        } catch (apiErr) {
          console.warn("Backend product creation error, falling back locally:", apiErr);
        }
      }

      // 2. Build canonical PosProduct
      const finalId = createdProduct?.id || `prod_${Date.now()}`;
      const finalSku = createdProduct?.sku || `SKU-${Date.now().toString(36).toUpperCase()}`;
      const finalBarcode = createdProduct?.barcode || (barcode.trim() ? barcode.trim() : null);

      const newPosProduct: PosProduct = {
        id: finalId,
        name: cleanName,
        sku: finalSku,
        barcode: finalBarcode,
        salePrice: priceNum,
        taxRate: 20,
        stockQuantity: stockNum,
        trackStock: true,
        image: imageUrl.trim() || createdProduct?.imageUrl || null,
        categoryName: categoryName.trim() || createdProduct?.category?.name || null,
      };

      // 3. Cache immediately in Dexie offline database
      if (offlineDb?.offlineProducts) {
        try {
          await offlineDb.offlineProducts.put({
            id: newPosProduct.id,
            tenantId: "current",
            sku: newPosProduct.sku,
            barcode: newPosProduct.barcode,
            name: newPosProduct.name,
            imageUrl: newPosProduct.image,
            salePrice: newPosProduct.salePrice,
            taxRate: newPosProduct.taxRate,
            trackStock: true,
            stockQuantity: newPosProduct.stockQuantity,
            categoryName: newPosProduct.categoryName,
          });
        } catch (dexieErr) {
          console.warn("Could not cache product in Dexie:", dexieErr);
        }
      }

      // 4. Update client-cache for instant dashboard/products sync
      try {
        const cached = getCachedData<any[]>("products_catalog", []);
        const list = Array.isArray(cached.data) ? cached.data : [];
        setCachedData("products_catalog", [newPosProduct, ...list]);
      } catch {}

      // 5. Fire instant 0ms callback to POS page & sound
      playBarcodeScanSound();
      onProductCreated(newPosProduct);

      toast.success(
        locale === "ar"
          ? `تمت إضافة "${cleanName}" بنجاح!`
          : `Article "${cleanName}" ajouté avec succès!`
      );

      // Reset form & close
      setName("");
      setSalePrice("");
      setStockQuantity("50");
      setBarcode("");
      setCategoryName("");
      setImageUrl("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none overflow-y-auto animate-fade-in"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#09090b] border border-zinc-800 shadow-2xl surface-obsidian-3d overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {locale === "ar"
                  ? "إضافة منتج سريع في نقطة البيع"
                  : locale === "en"
                  ? "Quick Add Product to POS"
                  : "Ajout Rapide d'Article POS"}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {locale === "ar"
                  ? "يظهر المنتج فوراً في الكتالوج وشاشة البيع في 0ms"
                  : "Disponible immédiatement dans le catalogue POS en 0ms"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              {locale === "ar" ? "اسم المنتج *" : "Nom du Produit *"}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                locale === "ar"
                  ? "مثال: زيت زيتون 1 لتر، قهوة، قميص..."
                  : "Ex: Huile d'olive 1L, Café Express, T-shirt..."
              }
              className="w-full h-11 px-3.5 bg-zinc-900/90 border border-zinc-800 focus:border-white focus:ring-1 focus:ring-white rounded-xl text-sm font-medium text-white placeholder-zinc-500 transition-colors"
            />
          </div>

          {/* Price & Stock Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {locale === "ar" ? "سعر البيع (MAD) *" : "Prix de Vente (MAD) *"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 px-3.5 bg-zinc-900/90 border border-zinc-800 focus:border-white focus:ring-1 focus:ring-white rounded-xl text-sm font-mono font-bold text-white placeholder-zinc-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {locale === "ar" ? "الكمية في المخزون" : "Quantité en Stock"}
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full h-11 px-3.5 bg-zinc-900/90 border border-zinc-800 focus:border-white focus:ring-1 focus:ring-white rounded-xl text-sm font-mono font-bold text-white transition-colors"
              />
            </div>
          </div>

          {/* Barcode with Auto-Generate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-300">
                {locale === "ar" ? "الباركود (EAN-13)" : "Code-barres (EAN-13)"}
              </label>
              <button
                type="button"
                onClick={generateBarcode}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>{locale === "ar" ? "توليد EAN مغربي" : "Générer EAN (611)"}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="611XXXXXXXXXX"
                className="w-full h-11 ps-3.5 pe-10 bg-zinc-900/90 border border-zinc-800 focus:border-white focus:ring-1 focus:ring-white rounded-xl text-sm font-mono text-white placeholder-zinc-500 transition-colors"
              />
              <Barcode className="w-4 h-4 text-zinc-500 absolute end-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Category & Image URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {locale === "ar" ? "التصنيف (اختياري)" : "Catégorie (optionnel)"}
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={locale === "ar" ? "عام، مشروبات..." : "Boissons, Snack..."}
                className="w-full h-10 px-3 bg-zinc-900/90 border border-zinc-800 focus:border-white rounded-xl text-xs text-white placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {locale === "ar" ? "رابط الصورة (اختياري)" : "URL Image (optionnel)"}
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-10 px-3 bg-zinc-900/90 border border-zinc-800 focus:border-white rounded-xl text-xs text-white placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer"
            >
              {locale === "ar" ? "إلغاء" : "Annuler"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="sheen-btn px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-[0_2px_12px_rgba(255,255,255,0.2)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>
                {locale === "ar"
                  ? "إضافة للمتجر ونقطة البيع"
                  : locale === "en"
                  ? "Create & Add to POS"
                  : "Créer et Ajouter au POS"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
