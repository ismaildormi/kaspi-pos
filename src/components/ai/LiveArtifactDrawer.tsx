"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Code2,
  Download,
  Eye,
  FileDiff,
  GitBranch,
  Loader2,
  Sigma,
  Table2,
} from "lucide-react";
import { AppleBackButton } from "@/components/common/AppleBackButton";
import { touchWasmResource } from "@/lib/zebra-x/core/wasm-watchdog";

export type LiveArtifactKind =
  | "html_preview"
  | "mermaid"
  | "markmap"
  | "diff"
  | "katex"
  | "table_data"
  | "model_3d";

export interface LiveArtifactItem {
  id: string;
  kind: LiveArtifactKind;
  title: string;
  content: string;
  secondaryContent?: string;
  oldLabel?: string;
  newLabel?: string;
}

interface LiveArtifactDrawerProps {
  artifact: LiveArtifactItem | null;
  locale: "ar" | "fr" | "en";
  onClose: () => void;
}

interface MindmapNode {
  content: string;
  children?: MindmapNode[];
}

function renderMindmapTree(node: MindmapNode, depth = 0, keyPrefix = "root"): React.ReactNode {
  const palette = [
    "border-emerald-400/50 bg-emerald-500/15 text-emerald-200",
    "border-sky-400/40 bg-sky-500/10 text-sky-200",
    "border-amber-400/40 bg-amber-500/10 text-amber-200",
    "border-white/20 bg-white/5 text-zinc-200",
  ];
  const cls = palette[Math.min(depth, palette.length - 1)];
  let prevLabel: string;
  let cleanLabel = String(node.content || "");
  do {
    prevLabel = cleanLabel;
    cleanLabel = cleanLabel.replace(/<[^<>]*>/g, "");
  } while (cleanLabel !== prevLabel);
  cleanLabel = cleanLabel.replace(/[<>]/g, "").trim();

  return (
    <div key={keyPrefix} className={depth > 0 ? "ms-4 ps-3 border-s border-white/15 mt-2" : "mt-1"}>
      {cleanLabel && (
        <span className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-medium ${cls}`}>
          {cleanLabel}
        </span>
      )}
      {Array.isArray(node.children) && node.children.length > 0 && (
        <div className="space-y-1">
          {node.children.map((ch, idx) => renderMindmapTree(ch, depth + 1, `${keyPrefix}-${idx}`))}
        </div>
      )}
    </div>
  );
}

function downloadTextBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const LiveArtifactDrawer: React.FC<LiveArtifactDrawerProps> = ({
  artifact,
  locale,
  onClose,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedSvg, setRenderedSvg] = useState<string>("");
  const [mindmapRoot, setMindmapRoot] = useState<MindmapNode | null>(null);
  const [diffChunks, setDiffChunks] = useState<Array<{ added?: boolean; removed?: boolean; value: string }>>([]);
  const [showRawCode, setShowRawCode] = useState(false);
  const domRenderRef = useRef<HTMLDivElement>(null);

  const isAr = locale === "ar";

  useEffect(() => {
    setError(null);
    setRenderedSvg("");
    setMindmapRoot(null);
    setDiffChunks([]);
    setShowRawCode(false);
    if (domRenderRef.current) domRenderRef.current.replaceChildren();

    if (!artifact) return;

    let cancelled = false;
    const loadArtifact = async () => {
      setBusy(true);
      try {
        if (artifact.kind === "mermaid") {
          const mermaidMod = await import("mermaid");
          const mermaid = (mermaidMod as any).default ?? mermaidMod;
          mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
            securityLevel: "strict",
          });
          const id = `xz-mermaid-${Date.now()}`;
          const res = await mermaid.render(id, artifact.content);
          if (cancelled) return;
          setRenderedSvg(res.svg);
          if (domRenderRef.current && typeof DOMParser !== "undefined") {
            const doc = new DOMParser().parseFromString(res.svg, "image/svg+xml");
            const svgEl = doc.documentElement;
            if (svgEl && svgEl.tagName.toLowerCase() === "svg") {
              svgEl.querySelectorAll("script, foreignObject").forEach((n) => n.remove());
              svgEl.querySelectorAll("*").forEach((el) => {
                for (const attr of Array.from(el.attributes)) {
                  if (attr.name.toLowerCase().startsWith("on")) {
                    el.removeAttribute(attr.name);
                  }
                }
              });
              svgEl.style.maxWidth = "100%";
              svgEl.style.height = "auto";
              domRenderRef.current.replaceChildren(document.importNode(svgEl, true));
            }
          }
          touchWasmResource("live-artifact-mermaid", "Mermaid Diagram", () => {
            setRenderedSvg("");
          });
        } else if (artifact.kind === "markmap") {
          const { Transformer } = await import("markmap-lib");
          const transformer = new Transformer();
          const { root } = transformer.transform(artifact.content);
          if (!cancelled) setMindmapRoot(root as unknown as MindmapNode);
        } else if (artifact.kind === "katex") {
          const katexMod = await import("katex");
          const katex = (katexMod as any).default ?? katexMod;
          const mml = katex.renderToString(artifact.content, {
            throwOnError: false,
            strict: false,
            trust: false,
            displayMode: true,
            output: "mathml",
          });
          if (!cancelled && domRenderRef.current && typeof DOMParser !== "undefined") {
            const doc = new DOMParser().parseFromString(`<div>${mml}</div>`, "text/html");
            const wrap = doc.body.firstElementChild;
            if (wrap) domRenderRef.current.replaceChildren(document.importNode(wrap, true));
          }
        } else if (artifact.kind === "diff") {
          const diffLib = await import("diff");
          const chunks = diffLib.diffLines(
            artifact.content || "",
            artifact.secondaryContent || ""
          );
          if (!cancelled) setDiffChunks(chunks);
        } else if (artifact.kind === "model_3d") {
          // Dynamically inject Google model-viewer web component only when inspecting a .glb URL
          if (typeof customElements !== "undefined" && !customElements.get("model-viewer")) {
            await new Promise<void>((resolve, reject) => {
              const s = document.createElement("script");
              s.type = "module";
              s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
              s.onload = () => resolve();
              s.onerror = () => reject(new Error("Could not load 3D model-viewer"));
              document.head.appendChild(s);
            });
          }
          if (!cancelled && domRenderRef.current) {
            const safeUrl = /^https:\/\/|^blob:|^data:/i.test(artifact.content.trim())
              ? artifact.content.trim()
              : "";
            if (safeUrl) {
              const mv = document.createElement("model-viewer");
              mv.setAttribute("src", safeUrl);
              mv.setAttribute("alt", artifact.title);
              mv.setAttribute("camera-controls", "");
              mv.setAttribute("auto-rotate", "");
              mv.style.width = "100%";
              mv.style.height = "100%";
              domRenderRef.current.replaceChildren(mv);
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to render live preview");
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    void loadArtifact();
    return () => {
      cancelled = true;
    };
  }, [artifact]);

  if (!artifact) return null;

  const icon =
    artifact.kind === "mermaid" || artifact.kind === "markmap" ? (
      <GitBranch className="w-4 h-4 text-emerald-400" />
    ) : artifact.kind === "diff" ? (
      <FileDiff className="w-4 h-4 text-amber-400" />
    ) : artifact.kind === "katex" ? (
      <Sigma className="w-4 h-4 text-emerald-400" />
    ) : artifact.kind === "table_data" ? (
      <Table2 className="w-4 h-4 text-emerald-400" />
    ) : artifact.kind === "model_3d" ? (
      <Box className="w-4 h-4 text-emerald-400" />
    ) : (
      <Eye className="w-4 h-4 text-emerald-400" />
    );

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="fixed bottom-4 end-4 sm:end-[452px] z-[55] w-[92vw] sm:w-[460px] h-[590px] max-h-[calc(100vh-4.5rem)] kaspi-polar-aurora-orbit kaspi-ai-assistant-shield rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 print:hidden font-sans"
    >
      <div className="border-b border-white/15 px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-[var(--kaspi-text-primary)] truncate">
              {artifact.title}
            </h4>
            <p className="text-[10px] text-[var(--kaspi-text-muted)] uppercase">
              HEYUKA Live Sandbox • {artifact.kind}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowRawCode((v) => !v)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 text-[10px] cursor-pointer"
            title={isAr ? "الكود / المعاينة" : "Code / Preview"}
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>

          {(artifact.kind === "html_preview" || renderedSvg || artifact.kind === "markmap") && (
            <button
              type="button"
              onClick={() => {
                if (renderedSvg) {
                  downloadTextBlob(renderedSvg, `${artifact.title || "diagram"}.svg`, "image/svg+xml");
                } else if (artifact.kind === "html_preview") {
                  downloadTextBlob(artifact.content, `${artifact.title || "preview"}.html`, "text/html");
                } else {
                  downloadTextBlob(artifact.content, `${artifact.title || "mindmap"}.md`, "text/markdown");
                }
              }}
              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] cursor-pointer"
              title={isAr ? "تحميل المخرج" : "Download Artifact"}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          <AppleBackButton onClick={onClose} locale={locale} title={isAr ? "إغلاق المعاينة" : "Close preview"} />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 kaspi-no-scrollbar">
        {busy && (
          <div className="flex items-center justify-center h-full gap-2 text-xs text-zinc-300">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>{isAr ? "جارٍ تجهيز البث الحي..." : "Rendering live preview..."}</span>
          </div>
        )}

        {error && !busy && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        {showRawCode ? (
          <pre className="p-3 rounded-xl bg-zinc-950/90 border border-white/10 text-[11px] font-mono text-zinc-100 overflow-x-auto whitespace-pre-wrap">
            {artifact.content}
          </pre>
        ) : (
          <>
            {artifact.kind === "html_preview" && !busy && (
              <iframe
                title={artifact.title}
                srcDoc={artifact.content}
                sandbox="allow-scripts"
                className="w-full h-full min-h-[440px] rounded-xl border border-white/15 bg-white"
              />
            )}

            {(artifact.kind === "mermaid" || artifact.kind === "katex" || artifact.kind === "model_3d") && (
              <div
                ref={domRenderRef}
                className={`w-full ${
                  artifact.kind === "model_3d" ? "h-[450px]" : "min-h-[260px]"
                } rounded-xl bg-zinc-950/70 border border-white/10 p-3 flex items-center justify-center overflow-auto text-white`}
              />
            )}

            {artifact.kind === "markmap" && mindmapRoot && !busy && (
              <div className="rounded-xl bg-zinc-950/70 border border-white/10 p-3 overflow-auto">
                {renderMindmapTree(mindmapRoot)}
              </div>
            )}

            {artifact.kind === "diff" && !busy && (
              <div className="rounded-xl bg-zinc-950/85 border border-white/10 overflow-hidden font-mono text-[11px]">
                <div className="px-3 py-1.5 bg-white/[0.04] border-b border-white/10 flex justify-between text-[10px] text-zinc-400">
                  <span>- {artifact.oldLabel || "Original"}</span>
                  <span>+ {artifact.newLabel || "Updated"}</span>
                </div>
                <div className="p-2 space-y-0.5 overflow-x-auto">
                  {diffChunks.map((part, i) => {
                    const cls = part.added
                      ? "bg-emerald-500/20 text-emerald-200"
                      : part.removed
                      ? "bg-red-500/20 text-red-200"
                      : "text-zinc-300";
                    const prefix = part.added ? "+ " : part.removed ? "- " : "  ";
                    return (
                      <pre key={i} className={`px-1.5 py-0.5 whitespace-pre-wrap ${cls}`}>
                        {part.value
                          .split("\n")
                          .filter((l, idx, arr) => idx < arr.length - 1 || l !== "")
                          .map((l) => `${prefix}${l}`)
                          .join("\n")}
                      </pre>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LiveArtifactDrawer;
