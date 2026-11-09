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

export default function AIProductOnboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
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
      setErrorMsg(
        isRtl
          ? "يرجى اختيار ملف صورة صالح (JPEG, PNG, WEBP)."
          : "Veuillez sélectionner un fichier image valide (JPEG, PNG, WEBP)."
      );
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
        setErrorMsg(
          err.message ||
            (isRtl
              ? "تعذر تحليل الصورة بواسطة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى."
              : "Impossible d'analyser l'image. Veuillez réessayer.")
        );
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

        setSuccessMsg(
          isRtl
            ? `تم حفظ المنتج "${formData.name}" بنجاح في قاعدة البيانات!`
            : `Le produit "${formData.name}" a été enregistré avec succès dans le catalogue !`
        );
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
              <span>{isRtl ? "العودة لنقطة البيع (POS)" : "Retour au POS"}</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{isRtl ? "إضافة المنتجات بالذكاء الاصطناعي" : "Intégration Produit par IA"}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                    Gemini Vision
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-400">
                  {isRtl
                    ? "التقط أو ارفع صورة المنتج ليتم استخراج الاسم والتصنيف والسعر تلقائياً"
                    : "Photographiez ou glissez une image produit pour extraction instantanée"}
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
                {isRtl ? "إضافة منتج آخر" : "Ajouter un autre"}
              </button>
              <Link
                href={`/${locale}/pos`}
                className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
              >
                {isRtl ? "الانتقال لنقطة البيع" : "Voir dans la caisse"}
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
                      {isRtl ? "تغيير الصورة" : "Remplacer l'image"}
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
                      {isRtl ? "اسحب وأفلت صورة المنتج هنا" : "Glissez l'image de l'article ici"}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-[260px] mx-auto">
                      {isRtl
                        ? "أو انقر لاختيار صورة من هاتفك أو جهازك (العلبة، الباركود، أو التغليف)"
                        : "Ou cliquez pour sélectionner une photo de packaging ou de code-barres"}
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
                <span>{isRtl ? "إعادة تعيين وبدء فحص جديد" : "Réinitialiser et recommencer"}</span>
              </button>
            )}
          </div>

          {/* Right Column: AI Extraction Results & Pre-filled Form */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <div>
                  <h2 className="font-bold text-white text-base">
                    {isRtl ? "بيانات المنتج المستخرجة" : "Fiche Produit Détectée"}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isRtl
                      ? "يمكنك مراجعة وتعديل أي معلومة قبل الحفظ النهائي"
                      : "Vérifiez ou ajustez les suggestions avant l'enregistrement"}
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
                    {isRtl ? "جاري التعرف على المنتج والباركود بالذكاء الاصطناعي..." : "Analyse visuelle et reconnaissance de l'article en cours..."}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    {isRtl
                      ? "يتم الآن قراءة الاسم، العبوة، وتوقع الأسعار المناسبة للسوق المغربي"
                      : "Extraction de la dénomination, estimation des prix MAD et lecture du code-barres"}
                  </p>
                </div>
              ) : formData ? (
                <form onSubmit={handleSaveToCatalog} className="space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{isRtl ? "اسم المنتج التجاري" : "Désignation commerciale"}</span>
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
                        <span>{isRtl ? "التصنيف المقترح" : "Catégorie suggérée"}</span>
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
                        <span>{isRtl ? "الباركود (EAN / Code-barres)" : "Code-barres EAN"}</span>
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
                        {isRtl ? "سعر البيع المقترح (MAD)" : "Prix de vente (MAD)"}
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
                        {isRtl ? "سعر الشراء / التكلفة (MAD)" : "Prix d'achat estimé (MAD)"}
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
                        {isRtl ? "نسبة الضريبة (TVA %)" : "Taux TVA (%)"}
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
                      {isRtl ? "إلغاء" : "Annuler"}
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{isRtl ? "جاري الحفظ في الكتالوج..." : "Enregistrement..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isRtl ? "تأكيد وإضافة المنتج للكتالوج" : "Valider et Ajouter au Catalogue"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-2">
                  <Package className="w-10 h-10 text-zinc-700 stroke-[1.2]" />
                  <p className="text-sm font-medium text-zinc-400">
                    {isRtl ? "لا توجد بيانات مستخرجة بعد" : "En attente d'une photo de produit..."}
                  </p>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    {isRtl
                      ? "قم بسحب صورة للمنتج في المربع المقابل لبدء الاستخراج الآلي"
                      : "Déposez une photo de packaging dans la zone à gauche pour pré-remplir ce formulaire"}
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
