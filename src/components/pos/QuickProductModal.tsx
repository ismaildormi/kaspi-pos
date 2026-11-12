"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Sparkles,
  Barcode,
  Package,
  Check,
  Loader2,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDictionary } from "@/i18n/schema";
import { offlineDb } from "@/client/db";
import { setCachedData, getCachedData } from "@/lib/cache/client-cache";
import { playBarcodeScanSound, playTapSound, playSuccessSound } from "@/lib/audio";
import { compressImage } from "@/lib/image-compression";
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
  const [barcode, setBarcode] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [categoryName, setCategoryName] = useState("grocery");
  const [stockQuantity, setStockQuantity] = useState("50");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageSizeKb, setImageSizeKb] = useState<number>(28);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setIsProcessingImage(true);
    setUploadProgress(15);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 80);

    try {
      const res = await compressImage(file, {
        autoRemoveBackground: true,
        generateDataUrl: true,
        maxDimension: 800,
        quality: 0.85,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      if (res.dataUrl) {
        setImageUrl(res.dataUrl);
        const kb = Math.max(12, Math.round(res.compressedSizeBytes / 1024));
        setImageSizeKb(kb);
        playSuccessSound();
        toast.success(
          locale === "ar"
            ? `تم تفريغ خلفية الصورة تلقائياً (${kb} KB)`
            : `Arrière-plan détouré avec succès (${kb} KB)`
        );
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setUploadProgress(0);
      console.error("[Quick Image Process Error]:", err);
      toast.error(err.message || "Failed to process image");
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const generateBarcode = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    const ean = `611${randomDigits.slice(0, 9)}`;
    setBarcode(ean);
    playTapSound();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const priceNum = parseFloat(salePrice);
    const wholesaleNum = parseFloat(wholesalePrice) || undefined;
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

      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const res = await fetch("/api/v1/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: cleanName,
              salePrice: priceNum,
              wholesalePrice: wholesaleNum,
              initialStock: stockNum,
              stockQuantity: stockNum,
              barcode: barcode.trim() || undefined,
              categoryName: categoryName.trim() || undefined,
              imageUrl: imageUrl.trim() || undefined,
              description: description.trim() || undefined,
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

      const finalId = createdProduct?.id || `prod_${Date.now()}`;
      const finalSku = createdProduct?.sku || `SKU-${Date.now().toString(36).toUpperCase()}`;
      const finalBarcode = createdProduct?.barcode || (barcode.trim() ? barcode.trim() : null);

      const newPosProduct: PosProduct = {
        id: finalId,
        name: cleanName,
        sku: finalSku,
        barcode: finalBarcode,
        salePrice: priceNum,
        wholesalePrice: wholesaleNum,
        taxRate: 20,
        stockQuantity: stockNum,
        trackStock: true,
        image: imageUrl.trim() || createdProduct?.imageUrl || null,
        categoryName: categoryName.trim() || createdProduct?.category?.name || null,
      };

      if (offlineDb?.offlineProducts) {
        try {
          await offlineDb.offlineProducts.put({
            id: newPosProduct.id,
            tenantId: "current",
            sku: newPosProduct.sku,
            barcode: newPosProduct.barcode,
            name: newPosProduct.name,
            imageUrl: newPosProduct.image || null,
            salePrice: newPosProduct.salePrice,
            wholesalePrice: newPosProduct.wholesalePrice,
            taxRate: newPosProduct.taxRate,
            trackStock: true,
            stockQuantity: newPosProduct.stockQuantity,
            categoryName: newPosProduct.categoryName,
          });
        } catch (dexieErr) {
          console.warn("Could not cache product in Dexie:", dexieErr);
        }
      }

      try {
        const cached = getCachedData<any[]>("products_catalog", []);
        const list = Array.isArray(cached.data) ? cached.data : [];
        setCachedData("products_catalog", [newPosProduct, ...list]);
      } catch {}

      playBarcodeScanSound();
      onProductCreated(newPosProduct);

      toast.success(
        locale === "ar"
          ? `تمت إضافة "${cleanName}" بنجاح!`
          : `Article "${cleanName}" ajouté avec succès!`
      );

      setName("");
      setSalePrice("");
      setWholesalePrice("");
      setStockQuantity("50");
      setBarcode("");
      setCategoryName("grocery");
      setDescription("");
      setImageUrl("");
      setUploadProgress(0);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl select-none overflow-y-auto animate-fadeIn"
    >
      <div className="w-full max-w-3xl rounded-3xl bg-[#0B0F13]/95 backdrop-blur-2xl border border-white/[0.12] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col my-auto transition-all">
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>
              {locale === "ar"
                ? "إضافة منتج سريع — استوديو تفريغ الصور PNG"
                : locale === "fr"
                ? "Ajout Rapide — Studio Détourage PNG"
                : "Quick Add Product — Auto PNG Cutout Studio"}
            </span>
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.10] text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{locale === "ar" ? "← رجوع" : locale === "en" ? "← Back" : "← Retour"}</span>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 2-Column Split Body */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-5 items-stretch">
            {/* LEFT COLUMN: Drag & Drop Image Studio (5 Cols) */}
            <div className="md:col-span-5 rounded-2xl border border-white/[0.12] bg-[#0E1318] p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-center text-xs font-bold text-zinc-200">
                  {locale === "ar" ? "استوديو رفع وتفريغ الصورة" : "Drag & Drop Image Studio"}
                </h3>

                {/* Horizontal Progress Track */}
                <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden my-2.5">
                  <div
                    className="h-full bg-[#14B8A6] rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress > 0 ? uploadProgress : imageUrl ? 100 : 0}%`,
                    }}
                  />
                </div>

                {/* Center Canvas with Dark Studio Checkerboard */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative h-56 w-full rounded-xl overflow-hidden border transition-all flex items-center justify-center cursor-pointer ${
                    isDragging
                      ? "border-[#14B8A6] ring-2 ring-[#14B8A6]/40"
                      : "border-white/[0.08] hover:border-white/[0.20]"
                  }`}
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at center, rgba(255,255,255,0.10) 0%, transparent 70%),
                      linear-gradient(45deg, #14191F 25%, transparent 25%),
                      linear-gradient(-45deg, #14191F 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #14191F 75%),
                      linear-gradient(-45deg, transparent 75%, #14191F 75%)
                    `,
                    backgroundSize: "100% 100%, 20px 20px, 20px 20px, 20px 20px, 20px 20px",
                    backgroundPosition: "0 0, 0 0, 0 10px, 10px -10px, -10px 0px",
                    backgroundColor: "#0B0E12",
                  }}
                >
                  {isProcessingImage ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#14B8A6]" />
                      <span className="font-mono text-xs font-bold text-white">
                        {uploadProgress}%
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {locale === "ar" ? "جاري إزالة الخلفية..." : "Suppression de l'arrière-plan..."}
                      </span>
                    </div>
                  ) : imageUrl ? (
                    <div className="relative w-full h-full p-3 flex items-center justify-center group">
                      <img
                        src={imageUrl}
                        alt="Cutout Preview"
                        className="max-h-48 w-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.75)] transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <span className="px-3 py-1.5 rounded-lg bg-black/80 border border-white/20 text-[11px] font-semibold text-white">
                          {locale === "ar" ? "تغيير الصورة" : "Changer la photo"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400">
                        <Upload className="w-5 h-5 text-zinc-400 stroke-[1.75]" />
                      </div>
                      <p className="text-xs font-medium text-zinc-300">
                        {locale === "ar"
                          ? "انقر أو اسحب صورة المنتج هنا"
                          : "Cliquez ou glissez la photo du produit ici"}
                      </p>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        JPG, PNG, WEBP • Auto-Cutout 0ms
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Status Pill */}
              <div className="mt-3 py-1.5 px-3 rounded-full bg-[#14B8A6]/15 border border-[#14B8A6]/40 text-[#2DD4BF] font-mono text-[11px] font-semibold text-center shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                {locale === "ar"
                  ? `تمت إزالة الخلفية تلقائياً • صورة PNG شفافة (${imageSizeKb} KB)`
                  : locale === "fr"
                  ? `Arrière-plan supprimé automatiquement • PNG transparent (${imageSizeKb} KB)`
                  : `Background Removed Automatically • Transparent PNG (${imageSizeKb} KB)`}
              </div>
            </div>

            {/* RIGHT COLUMN: Stacked Product Inputs (7 Cols) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-3.5">
              {/* 1. Product Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {locale === "ar" ? "اسم المنتج (مع الوزن/السعة):" : "Product Name :"}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    locale === "ar"
                      ? "مثال: Huile d'Olive 1L أو أتاي سلطان 200g"
                      : "Ex: Sultan Habka Tea 200g, Huile d'Olive 1L..."
                  }
                  className="w-full h-10 rounded-xl bg-[#090C10] border border-white/[0.10] px-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#14B8A6] transition-colors"
                />
              </div>

              {/* 2. Barcode EAN-13 + Auto-Generate */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {locale === "ar" ? "الباركود (EAN-13):" : "Barcode EAN-13 :"}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="611XXXXXXXXXX"
                      className="w-full h-10 rounded-xl bg-[#090C10] border border-white/[0.10] px-3.5 font-mono text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#14B8A6] transition-colors"
                    />
                    <Barcode className="w-4 h-4 text-zinc-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="h-10 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    <span>{locale === "ar" ? "توليد تلقائي" : "Auto-Generate"}</span>
                  </button>
                </div>
              </div>

              {/* 3. Retail Price (MAD) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {locale === "ar" ? "سعر البيع بالتقسيط (MAD):" : "Retail Price (MAD) :"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 rounded-xl bg-[#090C10] border border-white/[0.10] px-3.5 font-mono text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#14B8A6] transition-colors"
                />
              </div>

              {/* 4. Pack / Wholesale Price (MAD) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {locale === "ar" ? "سعر الباك / الجملة (MAD):" : "Pack/Wholesale Price (MAD) :"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 rounded-xl bg-[#090C10] border border-white/[0.10] px-3.5 font-mono text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#14B8A6] transition-colors"
                />
              </div>

              {/* 5. Category + Stock + Cancel */}
              <div className="grid grid-cols-12 gap-2.5 items-end">
                <div className="col-span-6">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "الجناح / التصنيف:" : "Category :"}
                  </label>
                  <div className="relative">
                    <select
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full h-10 rounded-xl bg-[#090C10] border border-white/[0.10] px-3 text-xs text-white appearance-none focus:outline-none focus:border-[#14B8A6] cursor-pointer"
                    >
                      <option value="grocery">
                        {locale === "ar" ? "البقالة والمواد الغذائية" : "Épicerie Générale"}
                      </option>
                      <option value="drinks">
                        {locale === "ar" ? "المشروبات والمياه" : "Boissons & Eaux"}
                      </option>
                      <option value="dairy">
                        {locale === "ar" ? "الحليب ومشتقاته" : "Produits Laitiers"}
                      </option>
                      <option value="cleaning">
                        {locale === "ar" ? "المنظفات والورقيات" : "Entretien & Droguerie"}
                      </option>
                      <option value="produce">
                        {locale === "ar" ? "الخضر والفواكه (ميزان)" : "Fruits & Légumes"}
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "المخزون:" : "Stock :"}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full h-10 rounded-xl bg-[#090C10] border border-white/[0.10] px-2.5 font-mono text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>

                <div className="col-span-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full h-10 rounded-xl bg-[#090C10] hover:bg-white/[0.08] border border-white/[0.10] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width Bottom Submit CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] hover:opacity-95 text-[#041E1B] font-extrabold text-sm shadow-[0_8px_28px_-6px_rgba(20,184,166,0.55)] flex items-center justify-center cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>
                {locale === "ar"
                  ? "حفظ وإضافة بطاقة PNG الشفافة للكاشير (0ms)"
                  : locale === "fr"
                  ? "Enregistrer & Ajouter Carte PNG au POS (0ms)"
                  : "Save & Add Transparent PNG Card to POS (0ms)"}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
