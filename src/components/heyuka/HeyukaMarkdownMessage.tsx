"use client";

import React, { useState } from "react";
import { Check, Copy, Download, FileText, PanelRight } from "lucide-react";
import { inferFilePathFromContext, repairTruncatedMarkdownAndCode } from "@/lib/heyuka/autonomous-builder-v24-v28";
import { HeyukaSyntaxCodeView, getFileBadgeMeta } from "@/components/heyuka/HeyukaSyntaxCodeView";
import {
  generateAndDownloadArabicPdf,
  generateAndDownloadExcelXlsx,
  generateAndDownloadPowerPointPptx,
  generateAndDownloadWordDocx,
} from "@/lib/zebra-x/tools/docs-export-engine";
import {
  OfficeExportPayloadSchema,
  PdfReportPayloadSchema,
} from "@/lib/zebra-x/core/bridge-schema";

function decodeBase64JsonSafe<T>(b64: string): T | null {
  try {
    const bin = atob(b64.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

interface HeyukaMarkdownMessageProps {
  markdown: string;
  onOpenCodeInStudio?: (lang: string, code: string, filePath?: string) => void;
}

const LANG_EXT_MAP: Record<string, string> = {
  html: "html",
  css: "css",
  js: "js",
  javascript: "js",
  ts: "ts",
  typescript: "ts",
  tsx: "tsx",
  jsx: "jsx",
  py: "py",
  python: "py",
  bash: "sh",
  sh: "sh",
  powershell: "ps1",
  ps1: "ps1",
  json: "json",
  sql: "sql",
  svg: "svg",
  md: "md",
  markdown: "md",
  text: "txt",
  txt: "txt",
};

function renderInlineTokens(text: string): React.ReactNode {
  const tokens = text.split(
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\)|\*[^*]+\*)/g
  );

  return (
    <>
      {tokens.map((tok, i) => {
        if (!tok) return null;
        if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
          return (
            <strong key={i} className="font-bold text-white">
              {tok.slice(2, -2)}
            </strong>
          );
        }
        if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
          return (
            <em key={i} className="italic text-zinc-200">
              {tok.slice(1, -1)}
            </em>
          );
        }
        if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
          return (
            <code
              key={i}
              dir="ltr"
              className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-white/10 font-mono text-[12px] text-rose-300"
            >
              {tok.slice(1, -1)}
            </code>
          );
        }
        const linkMatch = tok.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-400 underline underline-offset-2 hover:text-rose-300"
            >
              {linkMatch[1]}
            </a>
          );
        }
        return <React.Fragment key={i}>{tok}</React.Fragment>;
      })}
    </>
  );
}

function DeepSeekStyleCodeCard({
  lang,
  filePath,
  code,
  onOpenCodeInStudio,
}: {
  lang: string;
  filePath?: string;
  code: string;
  onOpenCodeInStudio?: (lang: string, code: string, filePath?: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const badge = getFileBadgeMeta(filePath, lang);
  const label = filePath || lang || "text";
  const ext = LANG_EXT_MAP[lang.toLowerCase()] || "txt";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleDownload = () => {
    const filename = filePath
      ? filePath.split("/").pop() || `heyuka-snippet.${ext}`
      : `heyuka-${lang || "prompt"}.${ext}`;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      dir="ltr"
      style={{ backgroundColor: "#111319" }}
      className="my-3 rounded-xl border border-white/[0.10] overflow-hidden shadow-md"
    >
      {/* Antigravity / VS Code File Header Bar */}
      <div
        style={{ backgroundColor: "#1B1D26" }}
        className="px-3.5 py-2 border-b border-white/[0.08] flex items-center justify-between gap-2 text-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            style={{ color: badge.color, backgroundColor: badge.bg }}
            className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0"
          >
            {badge.extLabel}
          </span>
          <span className="font-mono text-[11.5px] font-semibold text-zinc-200 truncate">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-zinc-300">
          {onOpenCodeInStudio && (
            <button
              type="button"
              onClick={() => onOpenCodeInStudio(lang, code, filePath)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
              title="Open this file in Antigravity Studio Code Editor"
            >
              <PanelRight className="w-3.5 h-3.5" />
              <span>Open in Studio</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1 text-[11px] font-medium hover:text-white cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-rose-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 text-[11px] font-medium hover:text-white cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <HeyukaSyntaxCodeView code={code} language={lang} filePath={filePath} />
    </div>
  );
}

export function HeyukaMarkdownMessage({
  markdown,
  onOpenCodeInStudio,
}: HeyukaMarkdownMessageProps) {
  const repairedMarkdown = repairTruncatedMarkdownAndCode(markdown).repaired;
  const parts = repairedMarkdown.split(
    /(```[a-zA-Z0-9_.-]*(?:[\t ]+(?:(?:path|file)=["']?[^\s"'\n]+["']?|[^\s"'\n]+\.[a-zA-Z0-9]+))?[\t ]*\n[\s\S]*?```)/g
  );

  let codeCounter = 1;

  return (
    <div className="space-y-2.5 text-[14px] text-zinc-100 leading-relaxed">
      {parts.map((part, pIdx) => {
        if (!part) return null;
        const fenceMatch = part.match(
          /^```([a-zA-Z0-9_.-]*)(?:[\t ]+(?:(?:path|file)=["']?([^\s"'\n]+)["']?|([^\s"'\n]+\.[a-zA-Z0-9]+)))?[\t ]*\n([\s\S]*?)```$/
        );
        if (fenceMatch) {
          const langRaw = fenceMatch[1] || "text";
          const explicitPath = fenceMatch[2] || fenceMatch[3] || "";
          const codeBody = fenceMatch[4].trimEnd();
          const prevProse = pIdx > 0 ? parts[pIdx - 1] || "" : "";
          const inferredPath = inferFilePathFromContext({
            explicitPath,
            langRaw,
            precedingText: prevProse,
            content: codeBody,
            counter: codeCounter++,
          });
          return (
            <DeepSeekStyleCodeCard
              key={pIdx}
              lang={langRaw}
              filePath={inferredPath}
              code={codeBody}
              onOpenCodeInStudio={onOpenCodeInStudio}
            />
          );
        }

        const lines = part.split("\n");
        const nodes: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();

          // GFM Table
          if (
            trimmed.startsWith("|") &&
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
              i += 1;
            }
            nodes.push(
              <div
                key={`tbl-${pIdx}-${i}`}
                dir="auto"
                className="overflow-x-auto rounded-xl border border-white/10 bg-[#1A1B21] my-2"
              >
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/[0.05] border-b border-white/10">
                      {headers.map((h, hi) => (
                        <th key={hi} dir="auto" className="px-3 py-2 text-start font-bold text-white">
                          {renderInlineTokens(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, ri) => (
                      <tr key={ri} className="border-b border-white/[0.05] last:border-0">
                        {headers.map((_, ci) => (
                          <td key={ci} dir="auto" className="px-3 py-2 text-zinc-200">
                            {renderInlineTokens(r[ci] || "")}
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

          if (!trimmed) {
            i += 1;
            continue;
          }

          if (/^---+$/.test(trimmed)) {
            nodes.push(<hr key={`hr-${pIdx}-${i}`} className="border-white/10 my-2" />);
            i += 1;
            continue;
          }

          // Headings cleanly rendered with dir="auto" (fixes ### in LTR /en/chat!)
          const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];
            const sizeCls =
              level === 1
                ? "text-lg font-extrabold text-white pt-2"
                : level === 2
                ? "text-base font-bold text-white pt-1.5"
                : "text-[14.5px] font-bold text-white pt-1";
            nodes.push(
              <h3 key={`hd-${pIdx}-${i}`} dir="auto" className={sizeCls}>
                {renderInlineTokens(headingText)}
              </h3>
            );
            i += 1;
            continue;
          }

          // Blockquote
          if (trimmed.startsWith("> ")) {
            nodes.push(
              <blockquote
                key={`bq-${pIdx}-${i}`}
                dir="auto"
                className="border-s-2 border-rose-500/60 ps-3 text-zinc-300 italic text-[13.5px]"
              >
                {renderInlineTokens(trimmed.slice(2))}
              </blockquote>
            );
            i += 1;
            continue;
          }

          // Unordered List
          if (/^\s*[-*•]\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
              items.push(lines[i].replace(/^\s*[-*•]\s+/, ""));
              i += 1;
            }
            nodes.push(
              <ul key={`ul-${pIdx}-${i}`} dir="auto" className="space-y-1.5 ps-5 list-disc text-zinc-200">
                {items.map((it, li) => (
                  <li key={li} dir="auto">
                    {renderInlineTokens(it)}
                  </li>
                ))}
              </ul>
            );
            continue;
          }

          // Ordered List
          if (/^\s*\d+\.\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
              items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
              i += 1;
            }
            nodes.push(
              <ol key={`ol-${pIdx}-${i}`} dir="auto" className="space-y-1.5 ps-5 list-decimal text-zinc-200">
                {items.map((it, li) => (
                  <li key={li} dir="auto">
                    {renderInlineTokens(it)}
                  </li>
                ))}
              </ol>
            );
            continue;
          }

          // [KASPI_PDF_REPORT:...] interactive PDF download card
          const pdfMatch = trimmed.match(/\[KASPI_PDF_REPORT:([A-Za-z0-9+/=_-]+)\]/);
          if (pdfMatch) {
            const rawDecoded = decodeBase64JsonSafe<unknown>(pdfMatch[1]);
            const parsedPdf = PdfReportPayloadSchema.safeParse(rawDecoded);
            if (parsedPdf.success) {
              const payload = parsedPdf.data;
              nodes.push(
                <div
                  key={`pdf-${pIdx}-${i}`}
                  dir="auto"
                  className="my-2.5 rounded-xl border border-rose-500/30 bg-[#181920] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{payload.title}</div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {payload.subtitle || "PDF Document • Client CPU Export ($0.00)"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void generateAndDownloadArabicPdf(payload, "ar")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل PDF</span>
                  </button>
                </div>
              );
              i += 1;
              continue;
            }
          }

          // [KASPI_OFFICE_EXPORT:...] interactive Word/Excel/PPTX download card
          const officeMatch = trimmed.match(/\[KASPI_OFFICE_EXPORT:([A-Za-z0-9+/=_-]+)\]/);
          if (officeMatch) {
            const rawOffice = decodeBase64JsonSafe<unknown>(officeMatch[1]);
            const parsedOffice = OfficeExportPayloadSchema.safeParse(rawOffice);
            if (parsedOffice.success) {
              const payload = parsedOffice.data;
              nodes.push(
                <div
                  key={`off-${pIdx}-${i}`}
                  dir="auto"
                  className="my-2.5 rounded-xl border border-emerald-500/30 bg-[#181920] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{payload.title}</div>
                    <div className="text-[11px] text-zinc-400">
                      {payload.format.toUpperCase()} • 100% Client Export
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (payload.format === "xlsx") void generateAndDownloadExcelXlsx(payload);
                      else if (payload.format === "pptx") void generateAndDownloadPowerPointPptx(payload);
                      else void generateAndDownloadWordDocx(payload);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .{payload.format}</span>
                  </button>
                </div>
              );
              i += 1;
              continue;
            }
          }

          // Standard Paragraph with dir="auto"
          nodes.push(
            <p key={`p-${pIdx}-${i}`} dir="auto" className="text-zinc-100 leading-relaxed">
              {renderInlineTokens(line)}
            </p>
          );
          i += 1;
        }

        return <React.Fragment key={pIdx}>{nodes}</React.Fragment>;
      })}
    </div>
  );
}
