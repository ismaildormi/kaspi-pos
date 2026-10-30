"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Download,
  RotateCcw,
  Tag,
  Barcode,
  Layers,
  Sparkles,
} from "lucide-react";

interface ParsedRow {
  rowNumber: number;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  salePrice: number;
  costPrice: number | null;
  stockQuantity: number;
  taxRate: number;
  isValid: boolean;
  errors: string[];
}

export default function ProductImportPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<{
    summary: { totalRows: number; validCount: number; invalidCount: number };
    validRows: ParsedRow[];
    invalidRows: ParsedRow[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"valid" | "invalid">("valid");
  const [importSuccess, setImportSuccess] = useState<{ count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setErrorMsg(
        isRtl
          ? "يرجى اختيار ملف بصيغة CSV (.csv)"
          : "Veuillez sélectionner un fichier au format CSV (.csv)."
      );
      return;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    setImportSuccess(null);
    setIsLoadingPreview(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("action", "preview");

      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse du fichier CSV");
      }

      setPreviewData(data);
      if (data.validRows.length === 0 && data.invalidRows.length > 0) {
        setActiveTab("invalid");
      } else {
        setActiveTab("valid");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Impossible d'analyser le fichier CSV");
      setPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.validRows.length === 0) return;

    setIsCommitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          rows: previewData.validRows,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement des produits.");
      }

      setImportSuccess({ count: data.importedCount });
      setPreviewData(null);
      setFile(null);
    } catch (err: any) {
      setErrorMsg(err?.message || "Échec de l'importation.");
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "name,sku,barcode,category,price,cost_price,stock,tax_rate\n" +
      "Coca-Cola 330ml Canette,SKU-COCA-330,5449000000996,Boissons,6.00,4.50,48,20\n" +
      "Lait UHT Demi-Ecreme 1L,SKU-LAIT-1L,6111000012345,Produits Laitiers,9.50,8.20,24,7\n" +
      "Biscuits Bimo Merendina,SKU-BIMO-MER,6111000098765,Biscuits & Confiserie,2.00,1.50,120,20\n" +
      "Eau Minerale Sidi Ali 1.5L,SKU-SIDI-ALI,6111000055555,Boissons,6.00,4.80,60,20\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modele_import_kasbi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setFile(null);
    setPreviewData(null);
    setErrorMsg(null);
    setImportSuccess(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
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
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-slate-900">
                {isRtl ? "الهجرة الذكية واستيراد المنتجات (CSV)" : "Migration Intelligente & Import CSV"}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isRtl ? "تحميل نموذج CSV التجريبي" : "Télécharger modèle CSV"}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Success Banner */}
        {importSuccess && (
          <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  {isRtl
                    ? `تم استيراد ${importSuccess.count} منتج بنجاح في الكتالوج!`
                    : `Félicitations ! ${importSuccess.count} produits importés avec succès !`}
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {isRtl
                    ? "المنتجات والمخزون الأولي جاهزة الآن للاستخدام في شاشة الكاشير."
                    : "Les articles et stocks initiaux sont immédiatement disponibles sur votre POS."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                {isRtl ? "استيراد ملف آخر" : "Importer un autre fichier"}
              </button>
              <Link
                href={`/${locale}/pos`}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                {isRtl ? "فتح نقطة البيع" : "Accéder au POS"}
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Dropzone */}
        {!previewData && !importSuccess && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px] ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/60 scale-[1.01]"
                  : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                {isRtl ? "اسحب وأفلت ملف CSV هنا" : "Glissez votre fichier CSV ici"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mb-6">
                {isRtl
                  ? "متوافق مع ملفات التصدير من Caissa, POSNEX, Loyverse, أو جداول Excel المصدرة بصيغة CSV."
                  : "Compatible avec les exports Caissa, POSNEX, Loyverse, ou tout fichier Excel exporté en CSV."}
              </p>

              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md transition-colors"
              >
                {isRtl ? "اختيار ملف من الحاسوب" : "Parcourir vos fichiers"}
              </button>
            </div>
          </div>
        )}

        {/* Loading Preview Spinner */}
        {isLoadingPreview && (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              {isRtl ? "جاري فحص وتدقيق بيانات الملف..." : "Vérification des lignes et détection des doublons..."}
            </p>
          </div>
        )}

        {/* Preview Section */}
        {previewData && (
          <div className="space-y-6">
            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 block mb-1">
                  {isRtl ? "إجمالي الأسطر المقروءة" : "Total Lignes"}
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {previewData.summary.totalRows}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
                <span className="text-xs text-emerald-700 font-semibold block mb-1">
                  {isRtl ? "المنتجات الصالحة للاستيراد" : "Lignes Valides"}
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  {previewData.summary.validCount}
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs">
                <span className="text-xs text-rose-700 font-semibold block mb-1">
                  {isRtl ? "الأسطر التي بها أخطاء (مستبعدة)" : "Lignes Erronées"}
                </span>
                <span className="text-2xl font-black text-rose-700">
                  {previewData.summary.invalidCount}
                </span>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              {/* Tab selector */}
              <div className="px-6 pt-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("valid")}
                    className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      activeTab === "valid"
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {isRtl
                      ? `المنتجات الجاهزة (${previewData.summary.validCount})`
                      : `Produits Valides (${previewData.summary.validCount})`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("invalid")}
                    className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      activeTab === "invalid"
                        ? "border-rose-600 text-rose-700"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {isRtl
                      ? `المستبعدات والأخطاء (${previewData.summary.invalidCount})`
                      : `Lignes Erronées (${previewData.summary.invalidCount})`}
                  </button>
                </div>

                <div className="pb-3 text-xs text-slate-500 font-mono">
                  {file?.name}
                </div>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto max-h-[380px]">
                {activeTab === "valid" ? (
                  previewData.validRows.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      {isRtl ? "لا توجد أسطر صالحة في هذا الملف." : "Aucune ligne valide trouvée."}
                    </div>
                  ) : (
                    <table className="w-full text-left rtl:text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">{isRtl ? "الاسم" : "Nom du Produit"}</th>
                          <th className="py-3 px-4">SKU</th>
                          <th className="py-3 px-4">{isRtl ? "الباركود" : "Code-barres"}</th>
                          <th className="py-3 px-4">{isRtl ? "التصنيف" : "Catégorie"}</th>
                          <th className="py-3 px-4 text-right rtl:text-left">{isRtl ? "السعر (MAD)" : "Prix Vente"}</th>
                          <th className="py-3 px-4 text-right rtl:text-left">{isRtl ? "المخزون" : "Stock"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {previewData.validRows.slice(0, 100).map((r) => (
                          <tr key={r.rowNumber} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 text-slate-400">{r.rowNumber}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900">{r.name}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-600">{r.sku}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-500">{r.barcode || "—"}</td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                                {r.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right rtl:text-left font-bold text-emerald-800">
                              {r.salePrice.toFixed(2)} MAD
                            </td>
                            <td className="py-2.5 px-4 text-right rtl:text-left text-slate-700">
                              {r.stockQuantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                ) : previewData.invalidRows.length === 0 ? (
                  <div className="py-12 text-center text-xs text-emerald-600 font-semibold">
                    {isRtl ? "ممتاز! لا توجد أي أخطاء في الملف." : "Aucune erreur détectée dans le fichier !"}
                  </div>
                ) : (
                  <table className="w-full text-left rtl:text-right text-xs">
                    <thead className="bg-rose-50 text-rose-800 font-semibold border-b border-rose-200">
                      <tr>
                        <th className="py-3 px-4"># Ligne</th>
                        <th className="py-3 px-4">{isRtl ? "الاسم" : "Nom"}</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">{isRtl ? "سبب الرفض" : "Erreurs Détectées"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {previewData.invalidRows.map((r) => (
                        <tr key={r.rowNumber} className="hover:bg-rose-50/40">
                          <td className="py-2.5 px-4 text-slate-400 font-mono">{r.rowNumber}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{r.name || "(Nom manquant)"}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">{r.sku || "—"}</td>
                          <td className="py-2.5 px-4 text-rose-700">
                            <ul className="list-disc list-inside space-y-0.5">
                              {r.errors.map((e, eIdx) => (
                                <li key={eIdx}>{e}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  {isRtl ? "إلغاء واختيار ملف آخر" : "Annuler et changer de fichier"}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isCommitting || previewData.validRows.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isCommitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRtl ? "جاري استيراد المنتجات..." : "Enregistrement en base..."}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isRtl
                          ? `تأكيد استيراد ${previewData.summary.validCount} منتج`
                          : `Confirmer l'importation (${previewData.summary.validCount} articles)`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
