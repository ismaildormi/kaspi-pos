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
  DollarSign,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Package,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

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

  // Dropzone and preview states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states populated by AI
  const [formData, setFormData] = useState<AIProductData | null>(null);
  const [providerInfo, setProviderInfo] = useState<string | null>(null);
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

    setErrorMsg(null);
    setSuccessMsg(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      setImagePreview(dataUri);
      await analyzeImage(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (dataUri: string) => {
    setIsAnalyzing(true);
    setFormData(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/ai/product-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUri }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze product image");
      }

      setFormData(data.product);
      setProviderInfo(`${data.provider || "AI Vision"} • ${data.model || "Gemini Flash"}`);
    } catch (err: any) {
      console.error("[AI Onboard Error]:", err);
      setErrorMsg(
        isRtl
          ? "تعذر تحليل صورة المنتج تلقائياً. يمكنك إدخال البيانات يدوياً."
          : "Échec de l'analyse automatique de l'image. Vous pouvez saisir les détails manuellement."
      );
      // Fallback empty form so user can still proceed
      setFormData({
        name: "",
        category: "Épicerie Générale",
        suggestedPriceMAD: 10.0,
        costPriceMAD: 7.5,
        barcode: null,
        unit: "piece",
        taxRate: 20,
        description: "",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !formData.name.trim()) return;

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
    setFormData(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setProviderInfo(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/pos`}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              {isRtl ? (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة لنقطة البيع (POS)</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour au POS</span>
                </>
              )}
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{isRtl ? "إضافة المنتجات بالذكاء الاصطناعي" : "Intégration Produit par IA"}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Gemini Vision
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500">
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
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold">{successMsg}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                {isRtl ? "إضافة منتج آخر" : "Ajouter un autre"}
              </button>
              <Link
                href={`/${locale}/pos`}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                {isRtl ? "عرض في POS" : "Ouvrir dans POS"}
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 text-xs shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Dropzone & Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? "صورة المنتج أو العبوة" : "Image du Produit"}</span>
              </h2>

              {/* Hidden File Input */}
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

              {/* Drag & Drop Zone */}
              {!imagePreview ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[280px] ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50/60 scale-[1.01]"
                      : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-4 shadow-xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-1">
                    {isRtl ? "اسحب وأفلت صورة المنتج هنا" : "Glissez l'image du produit ici"}
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    {isRtl
                      ? "أو انقر لاختيار صورة من جهازك (PNG, JPG, WEBP)"
                      : "ou cliquez pour parcourir les fichiers (PNG, JPG, WEBP)"}
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isRtl ? "استخراج فوري بالذكاء الاصطناعي" : "Détection Automatique"}</span>
                  </span>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-72 object-contain bg-slate-900/50"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 shadow-md cursor-pointer"
                    >
                      {isRtl ? "تغيير الصورة" : "Changer d'image"}
                    </button>
                    <button
                      type="button"
                      onClick={() => analyzeImage(imagePreview)}
                      disabled={isAnalyzing}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isRtl ? "إعادة التحليل" : "Réanalyser"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status and Provider Tag */}
              {providerInfo && (
                <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="font-semibold">{isRtl ? "المحرك النشط:" : "Moteur IA :"}</span>
                  <span className="font-mono text-emerald-700 font-bold">{providerInfo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Extraction & Editable Product Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {isRtl ? "بيانات المنتج المستخرجة" : "Détails du Produit Détecté"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isRtl
                      ? "يمكنك تعديل أي حقل قبل الحفظ النهائي في الكتالوج"
                      : "Vérifiez et modifiez les informations avant l'enregistrement"}
                  </p>
                </div>
                {isAnalyzing && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>{isRtl ? "جاري التحليل الذكي..." : "Analyse IA en cours..."}</span>
                  </div>
                )}
              </div>

              {!formData && !isAnalyzing ? (
                <div className="py-16 text-center text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-sm font-medium">
                    {isRtl
                      ? "قم برفع صورة المنتج للبدء في استخراج البيانات تلقائياً"
                      : "Veuillez charger une photo de produit pour générer les détails"}
                  </p>
                </div>
              ) : isAnalyzing ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-spin">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {isRtl ? "الذكاء الاصطناعي يفحص الصورة..." : "L'IA analyse le produit..."}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      {isRtl
                        ? "يتم الآن تحديد اسم العلامة التجارية، الباركود، التصنيف، واقتراح السعر الأنسب للسوق المغربي"
                        : "Identification du nom, lecture du code-barres, classification et estimation des prix en MAD."}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProduct} className="space-y-5">
                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {isRtl ? "اسم المنتج التجاري *" : "Nom du Produit *"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData?.name || ""}
                        onChange={(e) =>
                          setFormData((prev) => prev && { ...prev, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold text-slate-900"
                        placeholder="Ex: Coca-Cola 330ml Canette"
                      />
                    </div>
                  </div>

                  {/* Category & Barcode Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isRtl ? "التصنيف المقترح" : "Catégorie Suggérée"}</span>
                      </label>
                      <input
                        type="text"
                        value={formData?.category || ""}
                        onChange={(e) =>
                          setFormData((prev) => prev && { ...prev, category: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                        placeholder="Ex: Boissons"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isRtl ? "الباركود (EAN / Barcode)" : "Code-barres (EAN)"}</span>
                      </label>
                      <input
                        type="text"
                        value={formData?.barcode || ""}
                        onChange={(e) =>
                          setFormData((prev) => prev && { ...prev, barcode: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono text-slate-900"
                        placeholder="Ex: 5449000000996"
                      />
                    </div>
                  </div>

                  {/* Prices: Sale Price & Cost Price in MAD */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                      <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isRtl ? "سعر البيع (TTC MAD) *" : "Prix de Vente (MAD) *"}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.05"
                          required
                          value={formData?.suggestedPriceMAD || 0}
                          onChange={(e) =>
                            setFormData(
                              (prev) =>
                                prev && {
                                  ...prev,
                                  suggestedPriceMAD: parseFloat(e.target.value) || 0,
                                }
                            )
                          }
                          className="w-full px-3 py-2 text-base font-bold bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-emerald-950"
                        />
                        <span className="text-xs font-bold text-emerald-800">MAD</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 mt-1">
                        {isRtl ? "السعر التقديري المقترح للمستهلك" : "Estimation basée sur le marché marocain"}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {isRtl ? "سعر التكلفة التقديري (HT MAD)" : "Prix d'Achat Estimé (MAD)"}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.05"
                          value={formData?.costPriceMAD || 0}
                          onChange={(e) =>
                            setFormData(
                              (prev) =>
                                prev && {
                                  ...prev,
                                  costPriceMAD: parseFloat(e.target.value) || 0,
                                }
                            )
                          }
                          className="w-full px-3 py-2 text-base font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                        />
                        <span className="text-xs font-bold text-slate-600">MAD</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {isRtl ? "توقع هامش الربح لمحل البقالة" : "Marge brute estimée pour épicerie"}
                      </p>
                    </div>
                  </div>

                  {/* Unit & Tax Rate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isRtl ? "وحدة البيع" : "Unité de vente"}</span>
                      </label>
                      <select
                        value={formData?.unit || "piece"}
                        onChange={(e) =>
                          setFormData((prev) => prev && { ...prev, unit: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 cursor-pointer"
                      >
                        <option value="piece">{isRtl ? "قطعة (Pièce)" : "Pièce"}</option>
                        <option value="kg">{isRtl ? "كيلوغرام (Kg)" : "Kilogramme (kg)"}</option>
                        <option value="liter">{isRtl ? "لتر (Litre)" : "Litre (L)"}</option>
                        <option value="meter">{isRtl ? "متر (Mètre)" : "Mètre (m)"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {isRtl ? "نسبة الضريبة (TVA المغرب)" : "Taux de TVA (%)"}
                      </label>
                      <select
                        value={formData?.taxRate ?? 20}
                        onChange={(e) =>
                          setFormData(
                            (prev) => prev && { ...prev, taxRate: Number(e.target.value) }
                          )
                        }
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 cursor-pointer"
                      >
                        <option value={20}>20% ({isRtl ? "النسبة العامة" : "Taux normal"})</option>
                        <option value={14}>14% ({isRtl ? "نقل، كهرباء" : "Transport, élec."})</option>
                        <option value={10}>10% ({isRtl ? "أغذية، فنادق" : "Restauration, huiles"})</option>
                        <option value={7}>7% ({isRtl ? "سكر، شاي، حليب" : "Produits de base"})</option>
                        <option value={0}>0% ({isRtl ? "معفى من الضريبة" : "Exonéré"})</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {isRtl ? "الوصف والملاحظات" : "Description du Produit"}
                    </label>
                    <textarea
                      rows={2}
                      value={formData?.description || ""}
                      onChange={(e) =>
                        setFormData((prev) => prev && { ...prev, description: e.target.value })
                      }
                      className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 resize-none"
                      placeholder="Notes ou détails supplémentaires..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isRtl ? "إلغاء وتفريغ" : "Réinitialiser"}
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || isAnalyzing}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{isRtl ? "جاري الحفظ في الكتالوج..." : "Enregistrement..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isRtl ? "حفظ المنتج في الكتالوج" : "Enregistrer dans le Catalogue"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
