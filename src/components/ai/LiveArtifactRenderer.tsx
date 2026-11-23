"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";
import { HeyukaSyntaxCodeView } from "@/components/heyuka/HeyukaSyntaxCodeView";
import {
  buildStandaloneHtmlDocument,
  downloadHtmlAsPdf,
  exportMarkdownTableToExcel,
  exportMarkdownTableToPdf,
  printHtmlDocument,
} from "@/lib/heyuka/html-to-pdf-export";

export function isRenderableHtmlArtifact(lang: string, code: string): boolean {
  const cleanLang = (lang || "").trim().toLowerCase();
  const body = String(code || "").trim();
  if (!body) return false;
  if (cleanLang === "html" || cleanLang === "htm") {
    return /<[a-z][\s\S]*>/i.test(body);
  }
  if (cleanLang === "svg") {
    return /<svg[\s\S]*>/i.test(body);
  }
  return false;
}

export function extractHtmlTitle(code: string, fallback = "KASPI / HEYUKA Document"): string {
  const titleMatch = code.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || code.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
  if (titleMatch?.[1]) {
    const clean = titleMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (clean) return clean.slice(0, 64);
  }
  if (/invoice|فاتورة|facture/i.test(code)) return "KASPI_Invoice_Document";
  return fallback;
}

/**
 * Shared Interactive HTML / Invoice / Report Artifact Renderer (iframe preview + direct PDF & Print)
 * mounted automatically across KASPI POS Chat, HEYUKA Standalone Chat, and Studio IDE.
 */
export function LiveHtmlPreviewCard({
  code,
  lang,
  filePath,
  onOpenCodeInStudio,
}: {
  code: string;
  lang: string;
  filePath?: string;
  onOpenCodeInStudio?: (lang: string, code: string, filePath?: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const docTitle = useMemo(
    () => filePath?.replace(/\.[a-z]+$/i, "") || extractHtmlTitle(code),
    [code, filePath]
  );
  const srcDoc = useMemo(() => buildStandaloneHtmlDocument(code, docTitle), [code, docTitle]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleDownloadHtml = () => {
    const ext = lang.toLowerCase() === "svg" ? "svg" : "html";
    const blob = new Blob([srcDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle.replace(/[^\w\u0600-\u06FF-]+/g, "-") || "document"}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      await downloadHtmlAsPdf(code, docTitle);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div dir="ltr" className="my-3 rounded-xl border border-white/[0.12] bg-[#121318] overflow-hidden shadow-lg">
      {/* Header Toolbar */}
      <div className="px-3 py-2 bg-[#1A1C23] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-1.5 py-0.5 rounded bg-[#007ACC]/20 border border-[#007ACC]/40 text-sky-300 font-mono text-[10px] font-bold">
            LIVE {lang.toUpperCase()}
          </span>
          <span className="font-medium text-zinc-200 truncate">{filePath || docTitle}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <div className="inline-flex rounded-lg border border-white/10 bg-black/30 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-2 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === "preview" ? "bg-[#007ACC] text-white font-semibold" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`px-2 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === "code" ? "bg-[#007ACC] text-white font-semibold" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Code</span>
            </button>
          </div>

          <button
            type="button"
            disabled={pdfBusy}
            onClick={() => void handleDownloadPdf()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer disabled:opacity-60"
            title="Download real PDF with RTL Arabic support"
          >
            {pdfBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            <span>تحميل PDF</span>
          </button>

          <button
            type="button"
            onClick={() => printHtmlDocument(code, docTitle)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-zinc-200 cursor-pointer"
            title="Print Document"
          >
            <Printer className="w-3 h-3" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-zinc-200 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-zinc-200 cursor-pointer"
            title="Download raw HTML"
          >
            <Download className="w-3 h-3" />
          </button>

          {onOpenCodeInStudio && (
            <button
              type="button"
              onClick={() => onOpenCodeInStudio(lang, code, filePath)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#007ACC]/20 hover:bg-[#007ACC]/35 text-sky-300 cursor-pointer"
            >
              <span>Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* Live iframe OR Source Code */}
      {viewMode === "preview" ? (
        <div className="p-2 bg-[#0b0b0d]">
          <iframe
            title={docTitle}
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-modals"
            className="w-full h-[360px] rounded-lg bg-white border border-white/10"
          />
        </div>
      ) : (
        <HeyukaSyntaxCodeView code={code} language={lang || "html"} filePath={filePath} maxHeightClass="max-h-[420px]" />
      )}
    </div>
  );
}

/**
 * Compact 1-Click Excel (.xlsx) & PDF export bar automatically rendered below Markdown tables.
 */
export function MarkdownTableExportBar({
  headers,
  rows,
  title = "KASPI_Data_Export",
}: {
  headers: string[];
  rows: string[][];
  title?: string;
}) {
  const [busyMode, setBusyMode] = useState<"excel" | "pdf" | null>(null);

  if (headers.length === 0 || rows.length === 0) return null;

  return (
    <div dir="auto" className="px-3 py-1.5 border-t border-white/[0.08] bg-white/[0.02] flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400">
      <span>
        {rows.length} rows × {headers.length} columns
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={busyMode !== null}
          onClick={async () => {
            setBusyMode("excel");
            try {
              await exportMarkdownTableToExcel(headers, rows, title);
            } finally {
              setBusyMode(null);
            }
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/35 text-emerald-300 font-semibold cursor-pointer disabled:opacity-50"
        >
          {busyMode === "excel" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
          <span>Excel (.xlsx)</span>
        </button>

        <button
          type="button"
          disabled={busyMode !== null}
          onClick={async () => {
            setBusyMode("pdf");
            try {
              await exportMarkdownTableToPdf(headers, rows, title);
            } finally {
              setBusyMode(null);
            }
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/35 text-rose-300 font-semibold cursor-pointer disabled:opacity-50"
        >
          {busyMode === "pdf" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
          <span>PDF</span>
        </button>
      </div>
    </div>
  );
}
