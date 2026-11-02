"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Toaster, toast } from "sonner";
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
  const [backgroundJob, setBackgroundJob] = useState<{
    jobId: string;
    status: "previewing" | "ready" | "committed" | "failed";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll ProductImportJob status every 3 seconds when a background QStash job is active
  useEffect(() => {
    if (
      !backgroundJob ||
      backgroundJob.status === "committed" ||
      backgroundJob.status === "failed"
    ) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/products/import?jobId=${encodeURIComponent(backgroundJob.jobId)}`
        );
        if (!res.ok) return;

        const jobData = await res.json();
        if (jobData.status === "committed") {
          clearInterval(intervalId);
          setBackgroundJob(null);
          setImportSuccess({ count: jobData.validRows || 0 });
          toast.success(
            `CSV Import complete! ${jobData.validRows || 0} products committed.`
          );
        } else if (jobData.status === "failed") {
          clearInterval(intervalId);
          setBackgroundJob(null);
          setErrorMsg("Background CSV import failed. Please review your file.");
          toast.error("Background CSV import failed");
        }
      } catch {
        // Ignore transient polling errors
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [backgroundJob]);

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
      if (data.invalidRows.length > 0 && data.validRows.length === 0) {
        setActiveTab("invalid");
      } else {
        setActiveTab("valid");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Impossible de lire le fichier.");
      setFile(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData || previewData.validRows.length === 0) return;

    setIsCommitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          fileName: file?.name || "catalog-import.csv",
          rows: previewData.validRows,
        }),
      });

      const data = await res.json();

      if (!res.ok && res.status !== 202) {
        throw new Error(data.error || "Erreur lors de l'enregistrement en base.");
      }

      if (res.status === 202 || data.jobId) {
        setBackgroundJob({
          jobId: data.jobId,
          status: "previewing",
          message:
            data.message ||
            "Your file is being processed in the background. You can continue working.",
        });
        toast.info(
          "Your file is being processed in the background. You can continue working."
        );
        setPreviewData(null);
        setFile(null);
      } else {
        setImportSuccess({ count: data.importedCount });
        setPreviewData(null);
        setFile(null);
      }
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
    setBackgroundJob(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20 select-none">
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "#09090b",
            color: "#ffffff",
            border: "1px solid #27272a",
          },
        }}
      />
      {/* Top Navbar */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/pos`}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
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
            <div className="h-5 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-white">
                {isRtl ? "الهجرة الذكية واستيراد المنتجات (CSV)" : "Migration Intelligente & Import CSV"}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>{isRtl ? "تحميل نموذج CSV التجريبي" : "Télécharger modèle CSV"}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Asynchronous Trigger.dev Background Processing Banner */}
        {backgroundJob && (
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Your file is being processed in the background. You can continue working.
                </h3>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  Trigger.dev Job ID: {backgroundJob.jobId} • Polling status every 3s...
                </p>
              </div>
            </div>
            <Link
              href={`/${locale}/dashboard/products`}
              className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold shrink-0"
            >
              Retour au Catalogue
            </Link>
          </div>
        )}

        {/* Success Banner */}
        {importSuccess && (
          <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  {isRtl
                    ? `تم استيراد ${importSuccess.count} منتج بنجاح في الكتالوج!`
                    : `Félicitations ! ${importSuccess.count} produits importés avec succès !`}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isRtl
                    ? "المنتجات والمخزون الأولي جاهزة الآن للاستخدام في شاشة الكاشير."
                    : "Les articles et stocks initiaux sont immédiatement disponibles sur votre POS."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetAll}
                className="px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-xs font-semibold"
              >
                Importer un autre fichier
              </button>
              <Link
                href={`/${locale}/pos`}
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold"
              >
                Ouvrir la caisse (POS)
              </Link>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-zinc-400 hover:text-white"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Drag and Drop Zone */}
        {!previewData && !importSuccess && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const dropped = e.dataTransfer.files[0];
              if (dropped) handleFile(dropped);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all bg-zinc-900/40 ${
              isDragging
                ? "border-white bg-zinc-900"
                : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/60"
            }`}
          >
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

            {isLoadingPreview ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="w-10 h-10 animate-spin text-white mb-3" />
                <p className="text-sm font-bold text-white">
                  Analyse et détection des colonnes en cours...
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Vérification des doublons SKU et compatibilité tarifaire
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-4 shadow-sm">
                  <UploadCloud className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  {isRtl
                    ? "اسحب وأفلت ملف المنتجات (CSV) هنا"
                    : "Glissez-déposez votre fichier de produits (.csv)"}
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mb-4">
                  {isRtl
                    ? "يتوافق مع جميع صادرات برامج الكاشير في المغرب (Caissa, POSNEX, Excel, Odoo). سيتم التعرف التلقائي على الأعمدة."
                    : "Compatible avec les exports Caissa, POSNEX, Excel et Odoo. Détection automatique des colonnes."}
                </p>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-sm transition"
                >
                  {isRtl ? "اختيار ملف من الحاسوب" : "Parcourir mes fichiers"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview Section */}
        {previewData && (
          <div className="space-y-6">
            {/* Summary Bar */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Aperçu avant importation : {file?.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {previewData.summary.validCount} lignes valides prêtes à être injectées •{" "}
                  {previewData.summary.invalidCount} lignes avec alertes
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetAll}
                  className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Changer de fichier</span>
                </button>
                <button
                  onClick={handleCommitImport}
                  disabled={isCommitting || previewData.validRows.length === 0}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-sm disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                >
                  {isCommitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Importation en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>
                        Confirmer l&apos;import ({previewData.validRows.length} produits)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-zinc-800 pb-2">
              <button
                onClick={() => setActiveTab("valid")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "valid"
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Lignes Prêtes ({previewData.validRows.length})
              </button>
              <button
                onClick={() => setActiveTab("invalid")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "invalid"
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Lignes Ignorées / Erreurs ({previewData.invalidRows.length})
              </button>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-[450px]">
                <table className="w-full text-start text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 sticky top-0 font-mono">
                    <tr>
                      <th className="p-3 text-start">Ligne</th>
                      <th className="p-3 text-start">Nom Produit</th>
                      <th className="p-3 text-start">SKU / Réf</th>
                      <th className="p-3 text-start">Code-barres</th>
                      <th className="p-3 text-start">Catégorie</th>
                      <th className="p-3 text-end">Prix Vente</th>
                      <th className="p-3 text-end">Stock</th>
                      {activeTab === "invalid" && <th className="p-3 text-start">Raison du rejet</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    {(activeTab === "valid" ? previewData.validRows : previewData.invalidRows).map(
                      (row) => (
                        <tr key={row.rowNumber} className="hover:bg-zinc-950/40 transition">
                          <td className="p-3 text-zinc-500 font-mono">{row.rowNumber}</td>
                          <td className="p-3 text-white font-bold">{row.name}</td>
                          <td className="p-3 text-zinc-400 font-mono">{row.sku}</td>
                          <td className="p-3 text-zinc-400 font-mono">{row.barcode || "—"}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700">
                              {row.category}
                            </span>
                          </td>
                          <td className="p-3 text-end text-white font-mono font-bold">
                            {row.salePrice.toFixed(2)} MAD
                          </td>
                          <td className="p-3 text-end font-mono text-zinc-300">
                            {row.stockQuantity}
                          </td>
                          {activeTab === "invalid" && (
                            <td className="p-3 text-zinc-400 text-xs">
                              {row.errors.join(", ")}
                            </td>
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
