"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  Eye,
  FileDiff,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Loader2,
  Presentation,
  Printer,
  Scissors,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  ActionConfirmationPayloadSchema,
  BarcodeLabelPayloadSchema,
  DiagramPayloadSchema,
  LiveHtmlArtifactPayloadSchema,
  OfficeExportPayloadSchema,
  PdfReportPayloadSchema,
  ReceiptTicketPayloadSchema,
  TextDiffPayloadSchema,
  UiTourPayloadSchema,
  ImageAssetPayloadSchema,
  type ImageAssetPayload,
  type ActionConfirmationPayload,
  type BarcodeLabelPayload,
  type DiagramPayload,
  type LiveHtmlArtifactPayload,
  type OfficeExportPayload,
  type PdfReportPayload,
  type ReceiptTicketPayload,
  type TextDiffPayload,
  type UiTourPayload,
} from "@/lib/zebra-x/core/bridge-schema";
import { runPreReplyReflectionGate } from "@/lib/zebra-x/core/reflection-gate";
import {
  buildPdfPayloadFromReceipt,
  generateAndDownloadArabicPdf,
  generateAndDownloadExcelXlsx,
  generateAndDownloadPowerPointPptx,
  generateAndDownloadWordDocx,
  renderReceiptTicketPng,
} from "@/lib/zebra-x/tools/docs-export-engine";
import {
  generateBarcodePngDataUrl,
  launchLiveUiGuide,
} from "@/lib/zebra-x/tools/vision-screen-tools";
import {
  enqueueOfflineConfirmedAction,
  recordActivityBreadcrumb,
} from "@/lib/zebra-x/core/activity-sensor";
import { classifyCognitiveIntentAndSources } from "@/lib/zebra-x/core/cognitive-brain-registry";
import {
  HeyukaSyntaxCodeView,
  getFileBadgeMeta,
} from "@/components/heyuka/HeyukaSyntaxCodeView";
import type { LiveArtifactItem } from "./LiveArtifactDrawer";

interface XZebraRichMessageProps {
  message: any;
  rawText: string;
  locale: "ar" | "fr" | "en";
  isUser: boolean;
  onOpenArtifact?: (artifact: LiveArtifactItem) => void;
}

function decodeBase64Json<T>(b64: string): T | null {
  try {
    const bin = atob(b64.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

function makeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const badge = getFileBadgeMeta(undefined, lang);
  const extMap: Record<string, string> = {
    python: "py",
    py: "py",
    typescript: "ts",
    tsx: "tsx",
    javascript: "js",
    js: "js",
    html: "html",
    css: "css",
    json: "json",
    yaml: "yml",
    yml: "yml",
    sql: "sql",
    bash: "sh",
    sh: "sh",
    markdown: "md",
    md: "md",
    svg: "svg",
  };
  const ext = extMap[(lang || "").toLowerCase()] || "txt";
  const lineCount = code.split("\n").length;

  return (
    <div dir="ltr" className="my-2.5 rounded-xl overflow-hidden border border-white/15 bg-[#121317] shadow-lg">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1A1C23] border-b border-white/10 text-[10px] text-zinc-300">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider"
            style={{
              backgroundColor: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.color}55`,
            }}
          >
            {badge.extLabel}
          </span>
          <span className="font-mono uppercase text-zinc-200">{lang || "code"}</span>
          <span className="text-[9px] text-zinc-500 font-mono">({lineCount} lines)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:text-white cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `heyuka-export.${ext}`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </button>
        </div>
      </div>
      <HeyukaSyntaxCodeView code={code} language={lang || "text"} maxHeightClass="max-h-[420px]" />
    </div>
  );
}

function InlineFormattedLine({ text }: { text: string }) {
  // Parse **bold**, `code`, and [label](url) cleanly
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.startsWith("**") && tok.endsWith("**")) {
          return (
            <strong key={i} className="font-bold text-white">
              {tok.slice(2, -2)}
            </strong>
          );
        }
        if (tok.startsWith("`") && tok.endsWith("`")) {
          return (
            <code
              key={i}
              className="px-1 py-0.5 rounded bg-white/10 font-mono text-[11px] text-emerald-300"
            >
              {tok.slice(1, -1)}
            </code>
          );
        }
        const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, label, href] = linkMatch;
          const isExternal = /^https?:\/\//i.test(href);
          return (
            <a
              key={i}
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
            >
              {label}
            </a>
          );
        }
        return <React.Fragment key={i}>{tok}</React.Fragment>;
      })}
    </>
  );
}

function MarkdownProseBlock({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/(```[\w-]*\n[\s\S]*?```)/g);
  return (
    <div className="space-y-2">
      {blocks.map((block, bIdx) => {
        const codeMatch = block.match(/^```([\w-]*)\n([\s\S]*?)```$/);
        if (codeMatch) {
          return <CodeBlock key={bIdx} lang={codeMatch[1]} code={codeMatch[2].trimEnd()} />;
        }

        const lines = block.split("\n");
        const elements: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];

          // Parse GFM Markdown table when separator line follows
          if (
            line.trim().startsWith("|") &&
            i + 1 < lines.length &&
            /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])
          ) {
            const headers = line
              .split("|")
              .slice(1, -1)
              .map((h) => h.trim());
            i += 2;
            const rows: string[][] = [];
            while (i < lines.length && lines[i].trim().startsWith("|")) {
              rows.push(
                lines[i]
                  .split("|")
                  .slice(1, -1)
                  .map((c) => c.trim())
              );
              i++;
            }
            elements.push(
              <div
                key={`tbl-${i}`}
                className="overflow-x-auto rounded-xl border border-white/15 bg-black/30 my-1.5"
              >
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-white/[0.06] border-b border-white/15">
                      {headers.map((h, hi) => (
                        <th key={hi} className="px-2.5 py-1.5 text-start font-bold text-white">
                          <InlineFormattedLine text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, ri) => (
                      <tr key={ri} className="border-b border-white/5 last:border-0">
                        {headers.map((_, ci) => (
                          <td key={ci} className="px-2.5 py-1.5 text-zinc-200">
                            <InlineFormattedLine text={r[ci] || ""} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            continue;
          }

          if (!line.trim()) {
            i++;
            continue;
          }

          if (line.startsWith("### ") || line.startsWith("## ") || line.startsWith("# ")) {
            const clean = line.replace(/^#{1,3}\s+/, "");
            elements.push(
              <h4 key={`h-${i}`} className="font-bold text-white text-xs pt-1">
                <InlineFormattedLine text={clean} />
              </h4>
            );
            i++;
            continue;
          }

          if (/^\s*[-*•]\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
              items.push(lines[i].replace(/^\s*[-*•]\s+/, ""));
              i++;
            }
            elements.push(
              <ul key={`ul-${i}`} className="space-y-1 ps-3 list-disc list-inside text-zinc-200">
                {items.map((it, li) => (
                  <li key={li}>
                    <InlineFormattedLine text={it} />
                  </li>
                ))}
              </ul>
            );
            continue;
          }

          elements.push(
            <p key={`p-${i}`} className="leading-relaxed">
              <InlineFormattedLine text={line} />
            </p>
          );
          i++;
        }

        return <React.Fragment key={bIdx}>{elements}</React.Fragment>;
      })}
    </div>
  );
}

function PdfReportCard({
  payload,
  locale,
}: {
  payload: PdfReportPayload;
  locale: "ar" | "fr" | "en";
}) {
  const [downloading, setDownloading] = useState(false);
  const isAr = locale === "ar";
  return (
    <div className="my-2 p-3 rounded-xl border border-emerald-500/35 bg-emerald-950/25 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{payload.title}</p>
            <p className="text-[10px] text-zinc-400">
              {payload.rows.length} {isAr ? "صفوف جاهزة في جدول PDF" : "lignes prêtes en PDF"}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={downloading}
          onClick={async () => {
            setDownloading(true);
            try {
              await generateAndDownloadArabicPdf(payload);
              void recordActivityBreadcrumb({
                kind: "ai_tool",
                route: window.location.pathname,
                label: `Downloaded PDF: ${payload.title}`,
              });
            } finally {
              setDownloading(false);
            }
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold shrink-0 cursor-pointer disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{isAr ? "تحميل PDF" : "Télécharger PDF"}</span>
        </button>
      </div>
    </div>
  );
}

function ReceiptTicketCard({
  receipt,
  locale,
}: {
  receipt: ReceiptTicketPayload;
  locale: "ar" | "fr" | "en";
}) {
  const isAr = locale === "ar";
  const [busyPdf, setBusyPdf] = useState(false);
  const pngUrl = useMemo(() => {
    if (typeof document === "undefined") return "";
    return renderReceiptTicketPng(receipt);
  }, [receipt]);

  return (
    <div className="my-2 p-2.5 rounded-xl border border-white/15 bg-zinc-950/85 space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5" />
          {isAr ? `تذكرة ${receipt.receiptNumber}` : `Ticket ${receipt.receiptNumber}`}
        </span>
        <span className="font-mono text-white font-bold">{receipt.grandTotalMAD} MAD</span>
      </div>

      {pngUrl && (
        <img
          src={pngUrl}
          alt={receipt.receiptNumber}
          className="w-full max-h-56 object-contain rounded-lg bg-white p-1 border border-zinc-800"
        />
      )}

      <div className="flex items-center justify-end gap-2">
        {pngUrl && (
          <a
            href={pngUrl}
            download={`ticket-${receipt.receiptNumber}.png`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold"
          >
            <Download className="w-3 h-3" />
            <span>PNG</span>
          </a>
        )}
        <button
          type="button"
          disabled={busyPdf}
          onClick={async () => {
            setBusyPdf(true);
            try {
              const pdfSpec = buildPdfPayloadFromReceipt(receipt, locale);
              await generateAndDownloadArabicPdf(pdfSpec, `ticket-${receipt.receiptNumber}.pdf`);
            } finally {
              setBusyPdf(false);
            }
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold cursor-pointer"
        >
          {busyPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
          <span>{isAr ? "تحميل PDF" : "PDF"}</span>
        </button>
      </div>
    </div>
  );
}

function ActionConfirmCard({
  action,
  locale,
}: {
  action: ActionConfirmationPayload;
  locale: "ar" | "fr" | "en";
}) {
  const [status, setStatus] = useState<"idle" | "busy" | "confirmed" | "queued" | "cancelled" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const isAr = locale === "ar";

  const handleConfirm = async () => {
    setStatus("busy");
    setErrorMsg("");

    let endpoint = "/api/v1/sales";
    let method: "POST" | "PATCH" = "POST";
    let payload: Record<string, unknown> = {};

    if (action.kind === "sell_cart_checkout") {
      const clientSaleId = makeUuid();
      endpoint = "/api/v1/sales";
      method = "POST";
      payload = {
        clientSaleId,
        idempotencyKey: `xzebra_${action.actionId}_${clientSaleId}`,
        customerId: action.customerId,
        subtotal: action.subtotalMAD,
        discountTotal: action.discountTotalMAD,
        taxTotal: action.taxTotalMAD,
        grandTotal: action.grandTotalMAD,
        paidTotal: action.grandTotalMAD,
        changeDue: 0,
        paymentMethod: action.paymentMethod,
        items: action.items.map((it, idx) => ({
          productId: it.productId,
          lineNo: idx + 1,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
          discountAmount: it.discountAmount,
        })),
      };
    } else if (action.productId) {
      endpoint = `/api/v1/products/${action.productId}`;
      method = "PATCH";
      payload =
        action.kind === "apply_discount"
          ? { salePrice: action.newPriceMAD }
          : { stockQuantity: action.newStockQty };
    }

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("OFFLINE");
      }
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || d?.error || `HTTP ${res.status}`);
      }
      setStatus("confirmed");
      void recordActivityBreadcrumb({
        kind: "sale",
        route: window.location.pathname,
        label: action.title,
        detail: action.summary,
      });
    } catch (err: any) {
      if (err?.message === "OFFLINE" || (typeof navigator !== "undefined" && !navigator.onLine)) {
        await enqueueOfflineConfirmedAction({
          endpoint,
          method,
          bodyJson: JSON.stringify(payload),
          summary: action.summary,
        });
        setStatus("queued");
        return;
      }
      setErrorMsg(err?.message || "Action failed");
      setStatus("error");
    }
  };

  return (
    <div className="my-2 p-3 rounded-xl border border-amber-400/40 bg-amber-950/25 space-y-2">
      <div className="flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white">{action.title}</p>
          <p className="text-[11px] text-zinc-300 mt-0.5">{action.summary}</p>
          <p className="text-xs font-mono font-bold text-emerald-400 mt-1">
            Total: {action.grandTotalMAD.toFixed(2)} MAD ({action.paymentMethod.toUpperCase()})
          </p>
        </div>
      </div>

      {status === "confirmed" ? (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{isAr ? "تم التنفيذ وتسجيل العملية بنجاح" : "Exécuté et enregistré avec succès"}</span>
        </div>
      ) : status === "queued" ? (
        <div className="text-[11px] text-amber-300 font-semibold">
          {isAr
            ? "⏳ محفوظ في قائمة الانتظار (Offline) وسيتم مزامنته تلقائياً عند عودة الشبكة."
            : "⏳ Mis en file locale (hors-ligne) et synchronisé automatiquement dès reconnexion."}
        </div>
      ) : status === "cancelled" ? (
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <XCircle className="w-3.5 h-3.5" />
          <span>{isAr ? "تم إلغاء العملية" : "Action annulée"}</span>
        </div>
      ) : (
        <>
          {errorMsg && <p className="text-[10px] text-red-400">{errorMsg}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={status === "busy"}
              onClick={() => setStatus("cancelled")}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] cursor-pointer"
            >
              {isAr ? "إلغاء" : "Annuler"}
            </button>
            <button
              type="button"
              disabled={status === "busy"}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold cursor-pointer disabled:opacity-50"
            >
              {status === "busy" && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{isAr ? "تأكيد التنفيذ" : "Confirmer"}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function OfficeExportCard({
  payload,
  locale,
}: {
  payload: OfficeExportPayload;
  locale: "ar" | "fr" | "en";
}) {
  const [busy, setBusy] = useState(false);
  const [doneFile, setDoneFile] = useState<string | null>(null);
  const isAr = locale === "ar";

  const icon =
    payload.format === "xlsx" ? (
      <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
    ) : payload.format === "pptx" ? (
      <Presentation className="w-4 h-4 text-amber-400 shrink-0" />
    ) : (
      <FileText className="w-4 h-4 text-sky-400 shrink-0" />
    );

  const label = payload.format.toUpperCase();

  return (
    <div className="my-2 p-2.5 rounded-xl border border-emerald-500/35 bg-zinc-950/85 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{payload.title}</p>
          <p className="text-[10px] text-zinc-400">
            {doneFile ? `Exported ${doneFile}` : `${label} • HEYUKA Office Export`}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const res =
              payload.format === "xlsx"
                ? await generateAndDownloadExcelXlsx(payload)
                : payload.format === "pptx"
                ? await generateAndDownloadPowerPointPptx(payload)
                : await generateAndDownloadWordDocx(payload);
            setDoneFile(res.filename);
          } finally {
            setBusy(false);
          }
        }}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] shrink-0 cursor-pointer disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
        <span>{isAr ? `تحميل ${label}` : `Download ${label}`}</span>
      </button>
    </div>
  );
}

function DiagramCard({
  diagram,
  locale,
  onOpen,
}: {
  diagram: DiagramPayload;
  locale: "ar" | "fr" | "en";
  onOpen?: (item: LiveArtifactItem) => void;
}) {
  const isAr = locale === "ar";
  return (
    <div className="my-2 p-2.5 rounded-xl border border-emerald-500/35 bg-zinc-950/85 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{diagram.title}</p>
          <p className="text-[10px] text-zinc-400 uppercase">{diagram.kind} • HEYUKA Visual</p>
        </div>
      </div>
      {onOpen && (
        <button
          type="button"
          onClick={() =>
            onOpen({
              id: `diag-${Date.now()}`,
              kind: diagram.kind,
              title: diagram.title,
              content: diagram.code,
            })
          }
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] shrink-0 cursor-pointer"
        >
          <Eye className="w-3 h-3" />
          <span>{isAr ? "معاينة حيّة" : "Live View"}</span>
        </button>
      )}
    </div>
  );
}

function BarcodeLabelCard({
  spec,
  locale,
}: {
  spec: BarcodeLabelPayload;
  locale: "ar" | "fr" | "en";
}) {
  const [pngUrl, setPngUrl] = useState("");
  const isAr = locale === "ar";

  useEffect(() => {
    let active = true;
    generateBarcodePngDataUrl({ bcid: spec.bcid, text: spec.text })
      .then((u) => {
        if (active) setPngUrl(u);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [spec]);

  return (
    <div className="my-2 p-2.5 rounded-xl border border-white/15 bg-zinc-950/85 space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
          <Barcode className="w-3.5 h-3.5" />
          {spec.label || spec.text}
        </span>
        {spec.priceMAD && <span className="font-mono text-white font-bold">{spec.priceMAD} MAD</span>}
      </div>
      {pngUrl && (
        <img
          src={pngUrl}
          alt={spec.text}
          className="max-h-28 mx-auto rounded-lg bg-white p-1.5 border border-zinc-800"
        />
      )}
      {pngUrl && (
        <div className="flex justify-end">
          <a
            href={pngUrl}
            download={`barcode-${spec.text.replace(/[^\w-]+/g, "")}.png`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-[10px] font-bold"
          >
            <Download className="w-3 h-3" />
            <span>{isAr ? "حفظ الملصق" : "Save Label"}</span>
          </a>
        </div>
      )}
    </div>
  );
}

function LiveHtmlArtifactCard({
  payload,
  locale,
  onOpen,
}: {
  payload: LiveHtmlArtifactPayload;
  locale: "ar" | "fr" | "en";
  onOpen?: (item: LiveArtifactItem) => void;
}) {
  const isAr = locale === "ar";
  return (
    <div className="my-2 p-2.5 rounded-xl border border-emerald-500/35 bg-zinc-950/85 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{payload.title}</p>
          <p className="text-[10px] text-zinc-400">
            {payload.modelUrl ? "3D Model Viewer" : "Interactive HTML Sandbox"}
          </p>
        </div>
      </div>
      {onOpen && (
        <button
          type="button"
          onClick={() =>
            onOpen({
              id: `art-${Date.now()}`,
              kind: payload.modelUrl ? "model_3d" : "html_preview",
              title: payload.title,
              content: payload.modelUrl || payload.html,
            })
          }
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] shrink-0 cursor-pointer"
        >
          <Eye className="w-3 h-3" />
          <span>{isAr ? "تشغيل حي" : "Run Live"}</span>
        </button>
      )}
    </div>
  );
}

function TextDiffCard({
  diffPayload,
  locale,
  onOpen,
}: {
  diffPayload: TextDiffPayload;
  locale: "ar" | "fr" | "en";
  onOpen?: (item: LiveArtifactItem) => void;
}) {
  const isAr = locale === "ar";
  return (
    <div className="my-2 p-2.5 rounded-xl border border-amber-500/35 bg-zinc-950/85 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <FileDiff className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{diffPayload.title}</p>
          <p className="text-[10px] text-zinc-400">
            {diffPayload.oldLabel} → {diffPayload.newLabel}
          </p>
        </div>
      </div>
      {onOpen && (
        <button
          type="button"
          onClick={() =>
            onOpen({
              id: `diff-${Date.now()}`,
              kind: "diff",
              title: diffPayload.title,
              content: diffPayload.oldText,
              secondaryContent: diffPayload.newText,
              oldLabel: diffPayload.oldLabel,
              newLabel: diffPayload.newLabel,
            })
          }
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] shrink-0 cursor-pointer"
        >
          <Eye className="w-3 h-3" />
          <span>{isAr ? "عرض الفروقات" : "View Diff"}</span>
        </button>
      )}
    </div>
  );
}

function UiTourCard({
  tour,
  locale,
}: {
  tour: UiTourPayload;
  locale: "ar" | "fr" | "en";
}) {
  const isAr = locale === "ar";
  return (
    <div className="my-2 p-2.5 rounded-xl border border-emerald-500/35 bg-zinc-950/85 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{tour.title}</p>
          <p className="text-[10px] text-zinc-400">{tour.steps.length} interactive steps</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void launchLiveUiGuide(tour.steps)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] shrink-0 cursor-pointer"
      >
        <Compass className="w-3 h-3" />
        <span>{isAr ? "أرني على الشاشة" : "Show on Screen"}</span>
      </button>
    </div>
  );
}

function decodeImageAssetPayload(b64: string): ImageAssetPayload | null {
  try {
    const bin = atob(b64.trim());
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const jsonStr = new TextDecoder("utf-8").decode(bytes);
    const parsed = ImageAssetPayloadSchema.safeParse(JSON.parse(jsonStr));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function GeneratedImageCard({
  asset,
  locale,
}: {
  asset: ImageAssetPayload;
  locale: "ar" | "fr" | "en";
}) {
  const isAr = locale === "ar";
  const [cutting, setCutting] = useState(false);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const activeSrc = cutoutUrl || asset.proxyUrl || asset.imageUrl;
  const safeFileName = `${(asset.title || "heyuka-image")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, "-")
    .slice(0, 40) || "heyuka-image"}${cutoutUrl ? "-cutout.png" : ".png"}`;

  const handleCutout = async () => {
    if (cutting) return;
    setCutting(true);
    try {
      const { removeImageBackgroundLocal } = await import("@/lib/zebra-x/media-client");
      const res = await removeImageBackgroundLocal(asset.imageUrl);
      if (res?.dataUrl) {
        setCutoutUrl(res.dataUrl);
      }
    } catch {
      // Preserve preview gracefully if browser canvas fails
    } finally {
      setCutting(false);
    }
  };

  return (
    <div className="my-2 rounded-2xl border border-white/15 bg-slate-950/75 overflow-hidden shadow-lg max-w-md">
      <div className="relative bg-zinc-950/90 flex items-center justify-center p-2">
        <img
          src={activeSrc}
          alt={asset.title}
          loading="lazy"
          className="max-h-72 w-full object-contain rounded-xl"
        />
      </div>
      <div className="px-3 py-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 bg-zinc-950/85">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-white truncate">{asset.title}</p>
          <p className="text-[10px] text-zinc-400 truncate">
            {cutoutUrl ? "Transparent PNG • HEYUKA Vision" : asset.source || "HEYUKA Studio"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!cutoutUrl && (
            <button
              type="button"
              disabled={cutting}
              onClick={() => void handleCutout()}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-100 text-[10px] font-semibold cursor-pointer disabled:opacity-50"
              title={isAr ? "تفريغ الخلفية" : "Remove Background"}
            >
              {cutting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scissors className="w-3 h-3" />}
              <span>{isAr ? "تفريغ" : "Cutout"}</span>
            </button>
          )}
          <a
            href={activeSrc}
            download={safeFileName}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold"
          >
            <Download className="w-3 h-3" />
            <span>{isAr ? "تحميل" : "Save"}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export const XZebraRichMessage: React.FC<XZebraRichMessageProps> = ({
  message,
  rawText,
  locale,
  isUser,
  onOpenArtifact,
}) => {
  // Collect inline markers emitted inside text PLUS structured markers from tool output parts
  const { cleanText, toolMarkers } = useMemo(() => {
    const markers: string[] = [];
    if (Array.isArray(message?.parts)) {
      for (const p of message.parts) {
        const out = p?.output ?? p?.result;
        if (out && typeof out === "object" && typeof out.inlineMarker === "string") {
          if (!rawText.includes(out.inlineMarker) && !markers.includes(out.inlineMarker)) {
            markers.push(out.inlineMarker);
          }
        }
        if (out && typeof out === "object" && Array.isArray(out.images)) {
          for (const item of out.images.slice(0, 2)) {
            if (
              item &&
              typeof item.inlineMarker === "string" &&
              !rawText.includes(item.inlineMarker) &&
              !markers.includes(item.inlineMarker)
            ) {
              markers.push(item.inlineMarker);
            }
          }
        }
      }
    }

    const combined = markers.length > 0 ? `${rawText}\n\n${markers.join("\n")}` : rawText;
    if (isUser) return { cleanText: combined, toolMarkers: markers };

    const gated = runPreReplyReflectionGate({
      draftText: combined,
      expectedLocale: locale,
    });
    return { cleanText: gated.cleanedText, toolMarkers: markers };
  }, [message, rawText, locale, isUser]);

  void toolMarkers;

  const segments = cleanText.split(
    /(!\[[^\]]*\]\((?:https?:\/\/|\/api\/ai\/media-tools)[^\s)]+\)|\[KASPI_IMAGE:[^\]]+\]|\[KASPI_MEDIA_IMAGE:[^\]]+\]|\[KASPI_PDF_REPORT:[^\]]+\]|\[KASPI_RECEIPT_TICKET:[^\]]+\]|\[KASPI_ACTION_CONFIRM:[^\]]+\]|\[KASPI_OFFICE_EXPORT:[^\]]+\]|\[KASPI_DIAGRAM:[^\]]+\]|\[KASPI_BARCODE_LABEL:[^\]]+\]|\[KASPI_LIVE_ARTIFACT:[^\]]+\]|\[KASPI_TEXT_DIFF:[^\]]+\]|\[KASPI_UI_TOUR:[^\]]+\])/g
  );

  const cognitiveBadges = useMemo(() => {
    if (isUser || cleanText.length < 60) return [];
    const classified = classifyCognitiveIntentAndSources(cleanText.slice(0, 600), locale);
    return classified.stageBadges;
  }, [isUser, cleanText, locale]);

  return (
    <div dir="auto" className="space-y-1.5 text-xs">
      {!isUser && cognitiveBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          {cognitiveBadges.map((b, bIdx) => (
            <span
              key={bIdx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.05] border border-white/10 text-zinc-300"
            >
              <span>{b.icon}</span>
              <span>{b.label}</span>
            </span>
          ))}
        </div>
      )}
      {segments.map((part, idx) => {
        if (!part) return null;

        const kaspiImgMatch = part.match(/^\[KASPI_IMAGE:([^\]]+)\]$/);
        if (kaspiImgMatch) {
          const parsedImg = decodeImageAssetPayload(kaspiImgMatch[1]);
          if (parsedImg) {
            return <GeneratedImageCard key={idx} asset={parsedImg} locale={locale} />;
          }
        }

        const mdImgMatch = part.match(/^!\[([^\]]*)\]\(((?:https?:\/\/|\/api\/ai\/media-tools)[^\s)]+)\)$/);
        if (mdImgMatch) {
          const [, altText, mdUrl] = mdImgMatch;
          const proxy = mdUrl.startsWith("/")
            ? mdUrl
            : `/api/ai/media-tools?action=image_proxy&url=${encodeURIComponent(mdUrl)}`;
          return (
            <GeneratedImageCard
              key={idx}
              asset={{
                title: altText || "HEYUKA Visual",
                imageUrl: mdUrl,
                proxyUrl: proxy,
                source: "HEYUKA Visual",
              }}
              locale={locale}
            />
          );
        }

        const imgMatch = part.match(/^\[KASPI_MEDIA_IMAGE:([^|\]]+)\|([^\]]+)\]$/);
        if (imgMatch) {
          const [, mediaUrl, fileName] = imgMatch;
          return (
            <div key={idx} className="rounded-xl border border-white/15 bg-zinc-950/70 p-2 space-y-1.5 my-1.5">
              <img
                src={mediaUrl}
                alt={fileName}
                className="max-h-40 w-full object-contain rounded-lg bg-zinc-900"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-400 truncate">{fileName}</span>
                <a
                  href={mediaUrl}
                  download={fileName}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-semibold"
                >
                  <Download className="w-3 h-3" />
                  <span>Save</span>
                </a>
              </div>
            </div>
          );
        }

        const pdfMatch = part.match(/^\[KASPI_PDF_REPORT:([^\]]+)\]$/);
        if (pdfMatch) {
          const parsed = PdfReportPayloadSchema.safeParse(decodeBase64Json(pdfMatch[1]));
          if (parsed.success) {
            return <PdfReportCard key={idx} payload={parsed.data} locale={locale} />;
          }
          return null;
        }

        const ticketMatch = part.match(/^\[KASPI_RECEIPT_TICKET:([^\]]+)\]$/);
        if (ticketMatch) {
          const parsed = ReceiptTicketPayloadSchema.safeParse(decodeBase64Json(ticketMatch[1]));
          if (parsed.success) {
            return <ReceiptTicketCard key={idx} receipt={parsed.data} locale={locale} />;
          }
          return null;
        }

        const confirmMatch = part.match(/^\[KASPI_ACTION_CONFIRM:([^\]]+)\]$/);
        if (confirmMatch) {
          const parsed = ActionConfirmationPayloadSchema.safeParse(decodeBase64Json(confirmMatch[1]));
          if (parsed.success) {
            return <ActionConfirmCard key={idx} action={parsed.data} locale={locale} />;
          }
          return null;
        }

        const officeMatch = part.match(/^\[KASPI_OFFICE_EXPORT:([^\]]+)\]$/);
        if (officeMatch) {
          const parsed = OfficeExportPayloadSchema.safeParse(decodeBase64Json(officeMatch[1]));
          if (parsed.success) {
            return <OfficeExportCard key={idx} payload={parsed.data} locale={locale} />;
          }
          return null;
        }

        const diagramMatch = part.match(/^\[KASPI_DIAGRAM:([^\]]+)\]$/);
        if (diagramMatch) {
          const parsed = DiagramPayloadSchema.safeParse(decodeBase64Json(diagramMatch[1]));
          if (parsed.success) {
            return <DiagramCard key={idx} diagram={parsed.data} locale={locale} onOpen={onOpenArtifact} />;
          }
          return null;
        }

        const barcodeMatch = part.match(/^\[KASPI_BARCODE_LABEL:([^\]]+)\]$/);
        if (barcodeMatch) {
          const parsed = BarcodeLabelPayloadSchema.safeParse(decodeBase64Json(barcodeMatch[1]));
          if (parsed.success) {
            return <BarcodeLabelCard key={idx} spec={parsed.data} locale={locale} />;
          }
          return null;
        }

        const liveMatch = part.match(/^\[KASPI_LIVE_ARTIFACT:([^\]]+)\]$/);
        if (liveMatch) {
          const parsed = LiveHtmlArtifactPayloadSchema.safeParse(decodeBase64Json(liveMatch[1]));
          if (parsed.success) {
            return <LiveHtmlArtifactCard key={idx} payload={parsed.data} locale={locale} onOpen={onOpenArtifact} />;
          }
          return null;
        }

        const diffMatch = part.match(/^\[KASPI_TEXT_DIFF:([^\]]+)\]$/);
        if (diffMatch) {
          const parsed = TextDiffPayloadSchema.safeParse(decodeBase64Json(diffMatch[1]));
          if (parsed.success) {
            return <TextDiffCard key={idx} diffPayload={parsed.data} locale={locale} onOpen={onOpenArtifact} />;
          }
          return null;
        }

        const tourMatch = part.match(/^\[KASPI_UI_TOUR:([^\]]+)\]$/);
        if (tourMatch) {
          const parsed = UiTourPayloadSchema.safeParse(decodeBase64Json(tourMatch[1]));
          if (parsed.success) {
            return <UiTourCard key={idx} tour={parsed.data} locale={locale} />;
          }
          return null;
        }

        return isUser ? (
          <div key={idx} className="whitespace-pre-wrap leading-relaxed">
            {part}
          </div>
        ) : (
          <MarkdownProseBlock key={idx} markdown={part} />
        );
      })}
    </div>
  );
};

export default XZebraRichMessage;
