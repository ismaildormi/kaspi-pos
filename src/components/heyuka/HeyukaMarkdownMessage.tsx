"use client";

import React, { useState } from "react";
import { Check, Copy, Download, FileText, PanelRight } from "lucide-react";
import { inferFilePathFromContext, repairTruncatedMarkdownAndCode } from "@/lib/heyuka/autonomous-builder-v24-v28";
import { HeyukaSyntaxCodeView, getFileBadgeMeta } from "@/components/heyuka/HeyukaSyntaxCodeView";
import {
  LiveHtmlPreviewCard,
  MarkdownTableExportBar,
  isRenderableHtmlArtifact,
} from "@/components/ai/LiveArtifactRenderer";
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
  theme?: "dark" | "light";
  collapseLongCodeOverLines?: number;
  onOpenCodeInStudio?: (lang: string, code: string, filePath?: string) => void;
  onOpenUrlInBrowser?: (url: string) => void;
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

function resolveProseDir(sample: string, fallback: "rtl" | "ltr" = "ltr"): "rtl" | "ltr" {
  const clean = String(sample || "").trim();
  if (!clean) return fallback;
  const arCount = (clean.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
  const latinCount = (clean.match(/[A-Za-z]/g) || []).length;
  if (arCount >= 3 || (arCount > 0 && fallback === "rtl")) return "rtl";
  if (latinCount >= 6 && arCount === 0) return "ltr";
  return fallback;
}

function renderInlineTokens(
  text: string,
  onOpenUrlInBrowser?: (url: string) => void,
  isLight = false
): React.ReactNode {
  const tokens = text.split(
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\)|https?:\/\/[^\s)<>]+|\*[^*]+\*)/g
  );

  return (
    <>
      {tokens.map((tok, i) => {
        if (!tok) return null;
        if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
          const inner = tok.slice(2, -2);
          const strongEl = (
            <strong key={i} className={isLight ? "font-bold text-gray-950" : "font-bold text-white"}>
              {inner}
            </strong>
          );
          return !/[\u0600-\u06FF]/.test(inner) ? (
            <bdi key={i} dir="ltr">
              {strongEl}
            </bdi>
          ) : (
            strongEl
          );
        }
        if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
          return (
            <em key={i} className={isLight ? "italic text-gray-700" : "italic text-zinc-200"}>
              {tok.slice(1, -1)}
            </em>
          );
        }
        if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
          return (
            <bdi key={i} dir="ltr">
              <code
                className={`px-1.5 py-0.5 mx-0.5 rounded font-mono text-[12px] ${
                  isLight
                    ? "bg-gray-100 border border-gray-200 text-[#0369A1]"
                    : "bg-white/[0.09] text-sky-300"
                }`}
              >
                {tok.slice(1, -1)}
              </code>
            </bdi>
          );
        }
        const linkMatch = tok.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
        if (linkMatch) {
          const href = linkMatch[2];
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={
                onOpenUrlInBrowser
                  ? (e) => {
                      e.preventDefault();
                      onOpenUrlInBrowser(href);
                    }
                  : undefined
              }
              className={
                isLight
                  ? "text-[#007ACC] underline underline-offset-2 hover:text-sky-700 font-medium"
                  : "text-sky-400 underline underline-offset-2 hover:text-sky-300 font-medium"
              }
            >
              {linkMatch[1]}
            </a>
          );
        }
        if (/^https?:\/\/[^\s)<>]+$/i.test(tok)) {
          return (
            <a
              key={i}
              href={tok}
              target="_blank"
              rel="noopener noreferrer"
              onClick={
                onOpenUrlInBrowser
                  ? (e) => {
                      e.preventDefault();
                      onOpenUrlInBrowser(tok);
                    }
                  : undefined
              }
              className={
                isLight
                  ? "text-[#007ACC] underline underline-offset-2 hover:text-sky-700 break-all"
                  : "text-sky-400 underline underline-offset-2 hover:text-sky-300 break-all"
              }
            >
              {tok}
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
  collapseOverLines,
  onOpenCodeInStudio,
}: {
  lang: string;
  filePath?: string;
  code: string;
  collapseOverLines?: number;
  onOpenCodeInStudio?: (lang: string, code: string, filePath?: string) => void;
}) {
  const lineCount = code.split(/\r?\n/).length;
  const shouldAutoCollapse =
    typeof collapseOverLines === "number" && collapseOverLines > 0 && lineCount > collapseOverLines;
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const expanded = manualExpanded !== null ? manualExpanded : !shouldAutoCollapse;
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
        className="px-3.5 py-2 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs"
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
          <span className="text-[10px] font-mono text-emerald-400 shrink-0">+{lineCount}L</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-zinc-300">
          <button
            type="button"
            onClick={() => setManualExpanded((prev) => !(prev !== null ? prev : !shouldAutoCollapse))}
            className="text-[11px] font-medium text-zinc-400 hover:text-white cursor-pointer"
          >
            {expanded ? "Collapse" : `Show (${lineCount}L)`}
          </button>
          {onOpenCodeInStudio && (
            <button
              type="button"
              onClick={() => onOpenCodeInStudio(lang, code, filePath)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
              title="Open this file in Antigravity Studio Code Editor"
            >
              <PanelRight className="w-3.5 h-3.5" />
              <span>Open in Editor</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1 text-[11px] font-medium hover:text-white cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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

      {expanded && <HeyukaSyntaxCodeView code={code} language={lang} filePath={filePath} />}
    </div>
  );
}

export function HeyukaMarkdownMessage({
  markdown,
  theme = "dark",
  collapseLongCodeOverLines,
  onOpenCodeInStudio,
  onOpenUrlInBrowser,
}: HeyukaMarkdownMessageProps) {
  const isLight = theme === "light";
  const repairedMarkdown = repairTruncatedMarkdownAndCode(markdown).repaired;
  const proseSample = repairedMarkdown.replace(/```[\s\S]*?```/g, " ");
  const docDir: "rtl" | "ltr" = resolveProseDir(proseSample, "ltr");
  const parts = repairedMarkdown.split(
    /(```[a-zA-Z0-9_.-]*(?:[\t ]+(?:(?:path|file)=["']?[^\s"'\n]+["']?|[^\s"'\n]+\.[a-zA-Z0-9]+))?[\t ]*\n[\s\S]*?```)/g
  );

  let codeCounter = 1;

  return (
    <div dir={docDir} className={`space-y-3 text-[13.5px] sm:text-[14px] leading-[1.7] ${isLight ? "text-gray-800" : "text-zinc-100"}`}>
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
          if (typeof collapseLongCodeOverLines !== "number" && isRenderableHtmlArtifact(langRaw, codeBody)) {
            return (
              <LiveHtmlPreviewCard
                key={pIdx}
                lang={langRaw}
                filePath={inferredPath}
                code={codeBody}
                onOpenCodeInStudio={onOpenCodeInStudio}
              />
            );
          }
          return (
            <DeepSeekStyleCodeCard
              key={pIdx}
              lang={langRaw}
              filePath={inferredPath}
              code={codeBody}
              collapseOverLines={collapseLongCodeOverLines}
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
                className={`overflow-x-auto rounded-xl border my-2 ${isLight ? "border-gray-200 bg-gray-50" : "border-white/10 bg-[#1A1B21]"}`}
              >
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className={`border-b ${isLight ? "bg-gray-100 border-gray-200" : "bg-white/[0.05] border-white/10"}`}>
                      {headers.map((h, hi) => (
                        <th key={hi} dir="auto" className={`px-3 py-2 text-start font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                          {renderInlineTokens(h, onOpenUrlInBrowser, isLight)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, ri) => (
                      <tr key={ri} className={`border-b last:border-0 ${isLight ? "border-gray-200/80" : "border-white/[0.05]"}`}>
                        {headers.map((_, ci) => (
                          <td key={ci} dir="auto" className={`px-3 py-2 ${isLight ? "text-gray-800" : "text-zinc-200"}`}>
                            {renderInlineTokens(r[ci] || "", onOpenUrlInBrowser, isLight)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <MarkdownTableExportBar headers={headers} rows={rows} />
              </div>
            );
            continue;
          }

          if (!trimmed) {
            i += 1;
            continue;
          }

          if (/^---+$/.test(trimmed)) {
            nodes.push(<hr key={`hr-${pIdx}-${i}`} className={isLight ? "border-gray-200 my-2.5" : "border-white/10 my-2.5"} />);
            i += 1;
            continue;
          }

          // Headings cleanly rendered with dir="auto"
          const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];
            const sizeCls =
              level === 1
                ? `text-[17px] font-extrabold pt-2.5 ${isLight ? "text-gray-950" : "text-white"}`
                : level === 2
                ? `text-[15.5px] font-bold pt-2 border-t ${isLight ? "text-gray-900 border-gray-200/70" : "text-white border-white/[0.06]"}`
                : `text-[14px] font-bold pt-1 ${isLight ? "text-gray-900" : "text-zinc-100"}`;
            nodes.push(
              <h3 key={`hd-${pIdx}-${i}`} dir={resolveProseDir(headingText, docDir)} className={sizeCls}>
                {renderInlineTokens(headingText, onOpenUrlInBrowser, isLight)}
              </h3>
            );
            i += 1;
            continue;
          }

          // Blockquote
          if (trimmed.startsWith("> ")) {
            const bqText = trimmed.slice(2);
            nodes.push(
              <blockquote
                key={`bq-${pIdx}-${i}`}
                dir={resolveProseDir(bqText, docDir)}
                className={`border-s-2 border-[#007ACC]/70 ps-3 italic text-[13.5px] ${isLight ? "text-gray-600" : "text-zinc-300"}`}
              >
                {renderInlineTokens(bqText, onOpenUrlInBrowser, isLight)}
              </blockquote>
            );
            i += 1;
            continue;
          }

          // Unordered List (supports indented nested bullets cleanly)
          if (/^\s*[-*•]\s+/.test(line)) {
            const items: Array<{ text: string; children: string[] }> = [];
            while (i < lines.length && (/^\s*[-*•]\s+/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
              const cur = lines[i];
              const indent = cur.match(/^(\s*)/)?.[1].length || 0;
              const isBullet = /^\s*[-*•]\s+/.test(cur);
              if (isBullet && indent < 2) {
                items.push({ text: cur.replace(/^\s*[-*•]\s+/, ""), children: [] });
              } else if (isBullet && items.length > 0) {
                items[items.length - 1].children.push(cur.replace(/^\s*[-*•]\s+/, ""));
              } else if (items.length > 0 && cur.trim()) {
                items[items.length - 1].text += ` ${cur.trim()}`;
              } else {
                break;
              }
              i += 1;
            }
            const listDir = resolveProseDir(items.map((it) => `${it.text} ${it.children.join(" ")}`).join(" "), docDir);
            nodes.push(
              <ul key={`ul-${pIdx}-${i}`} dir={listDir} className={`space-y-2 ps-5 list-disc ${isLight ? "text-gray-800" : "text-zinc-200"}`}>
                {items.map((it, li) => (
                  <li key={li} dir={resolveProseDir(it.text, listDir)} className="leading-[1.7]">
                    <span>{renderInlineTokens(it.text, onOpenUrlInBrowser, isLight)}</span>
                    {it.children.length > 0 && (
                      <ul dir={listDir} className="mt-1.5 space-y-1 ps-5 list-[circle] opacity-90">
                        {it.children.map((ch, ci) => (
                          <li key={ci} dir={resolveProseDir(ch, listDir)}>
                            {renderInlineTokens(ch, onOpenUrlInBrowser, isLight)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            );
            continue;
          }

          // Ordered List (groups nested sub-bullets cleanly under their numbered step!)
          if (/^\s*\d+\.\s+/.test(line)) {
            const items: Array<{ text: string; subBullets: string[] }> = [];
            while (i < lines.length) {
              const cur = lines[i];
              if (/^\s*\d+\.\s+/.test(cur)) {
                items.push({ text: cur.replace(/^\s*\d+\.\s+/, ""), subBullets: [] });
                i += 1;
              } else if (/^\s*[-*•]\s+/.test(cur) && items.length > 0) {
                items[items.length - 1].subBullets.push(cur.replace(/^\s*[-*•]\s+/, ""));
                i += 1;
              } else {
                break;
              }
            }
            const listDir = resolveProseDir(items.map((it) => `${it.text} ${it.subBullets.join(" ")}`).join(" "), docDir);
            nodes.push(
              <ol key={`ol-${pIdx}-${i}`} dir={listDir} className={`space-y-2 ps-5 list-decimal ${isLight ? "text-gray-800" : "text-zinc-200"}`}>
                {items.map((it, li) => (
                  <li key={li} dir={resolveProseDir(it.text, listDir)} className="leading-[1.7]">
                    <span>{renderInlineTokens(it.text, onOpenUrlInBrowser, isLight)}</span>
                    {it.subBullets.length > 0 && (
                      <ul dir={listDir} className="mt-1.5 space-y-1 ps-5 list-disc opacity-90">
                        {it.subBullets.map((sb, sbi) => (
                          <li key={sbi} dir={resolveProseDir(sb, listDir)}>
                            {renderInlineTokens(sb, onOpenUrlInBrowser, isLight)}
                          </li>
                        ))}
                      </ul>
                    )}
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

          // Standard Paragraph inheriting document/line prose direction
          nodes.push(
            <p key={`p-${pIdx}-${i}`} dir={resolveProseDir(line, docDir)} className={`leading-[1.7] ${isLight ? "text-gray-800" : "text-zinc-100"}`}>
              {renderInlineTokens(line, onOpenUrlInBrowser, isLight)}
            </p>
          );
          i += 1;
        }

        return <React.Fragment key={pIdx}>{nodes}</React.Fragment>;
      })}
    </div>
  );
}
