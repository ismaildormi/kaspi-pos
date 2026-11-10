"use client";

import React, { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Sparkles,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Barcode,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Package,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { uploadProductImage } from "@/lib/supabase-storage";

interface AIProductData {
  name: string;
  category: string;
  suggestedPriceMAD: number;
  costPriceMAD: number;
  barcode: string | null;
  unit: string;
  taxRate: number;
  description: string;
}

const DICT = {
  ar: {
    backPos: "العودة لنقطة البيع (POS)",
    title: "إضافة المنتجات بالذكاء الاصطناعي",
    subtitle: "التقط صورة لمنتج مغربي وسيقوم النظام بالتعرف على الاسم، الباركود، التصنيف والأسعار المقترحة تلقائياً.",
    addAnother: "إضافة منتج آخر",
    viewPos: "الانتقال لنقطة البيع",
    replaceImage: "تغيير الصورة",
    dropzoneTitle: "اسحب وأفلت صورة المنتج هنا",
    dropzoneDesc: "أو انقر لاختيار صورة من جهازك (JPG, PNG, WebP)",
    resetAll: "إعادة تعيين وبدء فحص جديد",
    productCardTitle: "بيانات المنتج المستخرجة",
    productCardDesc: "راجع وعدل البيانات قبل اعتمادها في الكتالوج ونقطة البيع.",
    analyzingTitle: "جاري التعرف على المنتج والباركود بالذكاء الاصطناعي...",
    analyzingDesc: "فحص العبوة، واستخراج الاسم التجاري ومقارنة الأسعار...",
    nameLabel: "اسم المنتج التجاري",
    categoryLabel: "التصنيف المقترح",
    barcodeLabel: "رمز الباركود (EAN)",
    salePriceLabel: "سعر البيع المقترح (MAD)",
    costPriceLabel: "سعر الشراء والتكلفة (MAD)",
    taxRateLabel: "نسبة الضريبة (TVA %)",
    cancel: "إلغاء",
    saving: "جاري الحفظ في الكتالوج...",
    confirmAdd: "تأكيد وإضافة المنتج للكتالوج",
    emptyTitle: "لا توجد بيانات مستخرجة بعد",
    emptyDesc: "التقط أو ارفع صورة للمنتج وسيقوم المحرك الذكي بملء جميع الحقول تلقائياً في ثوانٍ.",
    invalidImage: "يرجى اختيار ملف صورة صالح (JPEG, PNG, WEBP).",
    failedAnalyze: "تعذر التعرف على المنتج. يرجى تجربة صورة أوضح أو إدخال البيانات يدوياً.",
    savedSuccess: "تمت إضافة المنتج بنجاح إلى كتالوج المتجر!",
  },
  fr: {
    backPos: "Retour au POS",
    title: "Intégration Produit par IA",
    subtitle: "Prenez en photo un article marocain, l'IA détecte automatiquement le nom, code-barres EAN, catégorie et tarifs suggérés.",
    addAnother: "Ajouter un autre",
    viewPos: "Voir dans la caisse",
    replaceImage: "Remplacer l'image",
    dropzoneTitle: "Glissez l'image de l'article ici",
    dropzoneDesc: "ou cliquez pour choisir un fichier (JPG, PNG, WebP)",
    resetAll: "Réinitialiser et recommencer",
    productCardTitle: "Fiche Produit Détectée",
    productCardDesc: "Vérifiez et ajustez les informations avant validation dans votre inventaire.",
    analyzingTitle: "Analyse visuelle et reconnaissance de l'article en cours...",
    analyzingDesc: "Extraction des données produit par vision IA et détection du code EAN...",
    nameLabel: "Désignation commerciale",
    categoryLabel: "Catégorie suggérée",
    barcodeLabel: "Code-barres EAN",
    salePriceLabel: "Prix de vente (MAD)",
    costPriceLabel: "Prix d'achat estimé (MAD)",
    taxRateLabel: "Taux TVA (%)",
    cancel: "Annuler",
    saving: "Enregistrement...",
    confirmAdd: "Valider et Ajouter au Catalogue",
    emptyTitle: "En attente d'une photo de produit...",
    emptyDesc: "Déposez une photo de votre article à gauche pour que le moteur IA analyse l'emballage et préremplisse la fiche automatiquement.",
    invalidImage: "Veuillez sélectionner un fichier image valide (JPEG, PNG, WEBP).",
    failedAnalyze: "Échec de l'analyse visuelle de l'article.",
    savedSuccess: "Produit enregistré avec succès dans le catalogue !",
  },
  en: {
    backPos: "Back to POS",
    title: "AI Product Onboarding",
    subtitle: "Take a photo of an item, the AI automatically detects name, EAN barcode, category, and suggested pricing.",
    addAnother: "Add another",
    viewPos: "View in register",
    replaceImage: "Replace image",
    dropzoneTitle: "Drag & drop product photo here",
    dropzoneDesc: "or click to browse a file (JPG, PNG, WebP)",
    resetAll: "Reset and start new scan",
    productCardTitle: "Detected Product Details",
    productCardDesc: "Review and edit information before saving to catalog and POS register.",
    analyzingTitle: "Visual AI recognition and barcode detection in progress...",
    analyzingDesc: "Scanning packaging, extracting brand name and suggested pricing...",
    nameLabel: "Commercial Product Name",
    categoryLabel: "Suggested Category",
    barcodeLabel: "EAN Barcode",
    salePriceLabel: "Suggested Retail Price (MAD)",
    costPriceLabel: "Estimated Cost Price (MAD)",
    taxRateLabel: "Tax Rate (VAT %)",
    cancel: "Cancel",
    saving: "Saving...",
    confirmAdd: "Confirm and Add to Catalog",
    emptyTitle: "Waiting for product photo...",
    emptyDesc: "Upload a picture of the item on the left and the AI engine will auto-fill all fields in seconds.",
    invalidImage: "Please select a valid image file (JPEG, PNG, WEBP).",
    failedAnalyze: "Visual analysis failed. Please try a clearer picture.",
    savedSuccess: "Product saved successfully into store catalog!",
  },
};

export default function AIProductOnboardPage() {
  const locale = (useLocale() || "fr") as "ar" | "fr" | "en";
  const t = DICT[locale] || DICT.fr;
  const [isPending, startTransition] = useTransition();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<AIProductData | null>(null);
  const [providerInfo, setProviderInfo] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg(t.invalidImage);
      return;
    }

    // Upload to Supabase Storage in background
    uploadProductImage(file, "tenant-default")
      .then((url) => setUploadedImageUrl(url))
      .catch((err) => console.warn("[Supabase AI Onboard Upload Warning]:", err));

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsAnalyzing(true);

      try {
        const res = await fetch("/api/ai/product-onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: dataUrl,
            mimeType: file.type || "image/jpeg",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to analyze product image");
        }

        setFormData(data.data);
        setProviderInfo(data.provider);
      } catch (err: any) {
        console.error("AI Analysis error:", err);
        setErrorMsg(err.message || t.failedAnalyze);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveToCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            salePrice: formData.suggestedPriceMAD,
            costPrice: formData.costPriceMAD,
            barcode: formData.barcode,
            unit: formData.unit,
            taxRate: formData.taxRate,
            description: formData.description,
            imageUrl: uploadedImageUrl || undefined,
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error?.message || "Failed to save product");
        }

        setSuccessMsg(t.savedSuccess);
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to create product");
      }
    });
  };

  const resetForm = () => {
    setImagePreview(null);
    setUploadedImageUrl(null);
    setFormData(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setProviderInfo(null);
  };

  return (
    <div dir="ltr" className="min-h-screen bg-zinc-950 text-white pb-16 select-none">
      {/* Top Navbar */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/pos`}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backPos}</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{t.title}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                    Gemini Vision
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-400">
                  {t.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* Banner Alert if Success */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-zinc-900 border border-zinc-700 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
              <span className="text-sm font-semibold">{successMsg}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {t.addAnother}
              </button>
              <Link
                href={`/${locale}/pos`}
                className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
              >
                {t.viewPos}
              </Link>
            </div>
          </div>
        )}

        {/* Banner Alert if Error */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-zinc-900 border border-zinc-700 text-zinc-300 flex items-center gap-3 text-sm shadow-xs">
            <AlertCircle className="w-5 h-5 text-white shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Upload / Dropzone */}
          <div className="lg:col-span-5 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleImageFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[360px] text-center bg-zinc-900/40 ${
                isDragging
                  ? "border-white bg-zinc-900"
                  : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFile(file);
                }}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative w-full h-72 rounded-2xl overflow-hidden group">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-full object-contain bg-zinc-950"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold shadow-md flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      {t.replaceImage}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mx-auto shadow-inner">
                    <UploadCloud className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {t.dropzoneTitle}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-[260px] mx-auto">
                      {t.dropzoneDesc}
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-mono border border-zinc-700">
                      JPEG, PNG, WEBP (Max 10MB)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {imagePreview && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.resetAll}</span>
              </button>
            )}
          </div>

          {/* Right Column: AI Extraction Results & Pre-filled Form */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <div>
                  <h2 className="font-bold text-white text-base">
                    {t.productCardTitle}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {t.productCardDesc}
                  </p>
                </div>
                {providerInfo && (
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Source: {providerInfo}
                  </span>
                )}
              </div>

              {isAnalyzing ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-white" />
                  <h3 className="font-bold text-white text-sm">
                    {t.analyzingTitle}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    {t.analyzingDesc}
                  </p>
                </div>
              ) : formData ? (
                <form onSubmit={handleSaveToCatalog} className="space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t.nameLabel}</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-semibold text-white focus:outline-none focus:border-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{t.categoryLabel}</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-white transition-all"
                      />
                    </div>

                    {/* Barcode */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{t.barcodeLabel}</span>
                      </label>
                      <input
                        type="text"
                        value={formData.barcode || ""}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="Ex: 6111234567890"
                        className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-white focus:outline-none focus:border-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Sale Price */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        {t.salePriceLabel}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.suggestedPriceMAD}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            suggestedPriceMAD: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono font-bold text-white focus:outline-none focus:border-white transition-all"
                      />
                    </div>

                    {/* Cost Price */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        {t.costPriceLabel}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.costPriceMAD}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            costPriceMAD: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-white focus:outline-none focus:border-white transition-all"
                      />
                    </div>

                    {/* Tax Rate */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        {t.taxRateLabel}
                      </label>
                      <select
                        value={formData.taxRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            taxRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full h-11 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-white focus:outline-none focus:border-white transition-all cursor-pointer"
                      >
                        <option value={20}>20% (Standard)</option>
                        <option value={14}>14% (Transport / Énergie)</option>
                        <option value={10}>10% (Restauration / Hôtellerie)</option>
                        <option value={7}>7% (Produits de base)</option>
                        <option value={0}>0% (Exonéré)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t.saving}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t.confirmAdd}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-2">
                  <Package className="w-10 h-10 text-zinc-700 stroke-[1.2]" />
                  <p className="text-sm font-medium text-zinc-400">
                    {t.emptyTitle}
                  </p>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    {t.emptyDesc}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
