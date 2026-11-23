"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Diff from "diff";
import { strToU8, zipSync } from "fflate";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  FolderOpen,
  Globe,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Tablet,
  Terminal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { HeyukaMarkdownMessage } from "@/components/heyuka/HeyukaMarkdownMessage";
import { HeyukaSyntaxCodeView, getFileBadgeMeta } from "@/components/heyuka/HeyukaSyntaxCodeView";
import { assembleMultiFilePreviewDocument } from "@/lib/heyuka/autonomous-builder-v24-v28";
import { scanSourceCodeForVulnerabilities } from "@/lib/zebra-x/tools/security-sast-auditor";
import type {
  ElasticScaleMode,
  StudioBrand,
  StudioStarterTemplate,
  SwarmCouncilNode,
  WorkerBotExecution,
} from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";
import type { StudioFileNode, StudioMode } from "./studio-types";

export type AntigravityPaneTab = "changes" | "files" | "terminal" | "browser";

interface BrowserSearchHit {
  title: string;
  url: string;
  snippet?: string;
}

interface BrowserTabState {
  id: string;
  title: string;
  url: string;
  kind: "google_home" | "search" | "page" | "reader";
  proxiedHtml: string;
  extractedText: string;
  searchHits: BrowserSearchHit[];
  history: string[];
  historyIdx: number;
  error: string | null;
}

function createInitialBrowserTab(idx = 1): BrowserTabState {
  return {
    id: `btab_${Date.now()}_${idx}`,
    title: "Google",
    url: "https://www.google.com/",
    kind: "google_home",
    proxiedHtml: "",
    extractedText: "",
    searchHits: [],
    history: ["https://www.google.com/"],
    historyIdx: 0,
    error: null,
  };
}

interface StudioWorkbenchTabsProps {
  mode?: StudioMode;
  brand: StudioBrand;
  locale: "ar" | "fr" | "en";
  files: StudioFileNode[];
  onChangeFiles: (next: StudioFileNode[]) => void;
  checkpoints: Array<{ id: string; label: string; at: string; files: StudioFileNode[] }>;
  onSaveCheckpoint: (label: string) => void;
  onRestoreCheckpoint: (id: string) => void;
  onRunPromptFromChild: (promptText: string) => void;
  onSelectTemplate?: (tpl: StudioStarterTemplate) => void;
  onInjectContextText: (label: string, text: string) => void;
  onCaptureFrameToChat?: (dataUrl: string, caption: string) => void;
  councilData?: {
    tier: string;
    modelCount: number;
    complexityScore: number;
    nodes: SwarmCouncilNode[];
    spawnedBots: WorkerBotExecution[];
  } | null;
  onTriggerCouncil?: (scale: ElasticScaleMode, promptText: string) => Promise<void>;
  focusFilePath?: string | null;
  activeTab?: AntigravityPaneTab;
  onChangeTab?: (tab: AntigravityPaneTab) => void;
  onClosePane?: () => void;
  terminalLogsFromAgent?: string[];
  externalBrowserRequest?: { url: string; ts: number } | null;
  themeMode?: "light" | "dark";
  appearance?: {
    backgroundHex: string;
    foregroundHex: string;
    accentHex: string;
    contrastMode: "default" | "strong";
  };
}

export function StudioWorkbenchTabs({
  brand,
  locale,
  files,
  onChangeFiles,
  checkpoints,
  onRestoreCheckpoint,
  onRunPromptFromChild,
  onInjectContextText,
  focusFilePath,
  activeTab,
  onChangeTab,
  onClosePane,
  terminalLogsFromAgent = [],
  externalBrowserRequest,
  themeMode = "dark",
  appearance,
}: StudioWorkbenchTabsProps) {
  const isAr = locale === "ar";
  const isLight = themeMode === "light";
  const accentHex = appearance?.accentHex || "#007ACC";

  const [internalTab, setInternalTab] = useState<AntigravityPaneTab>("files");
  const currentTab = activeTab ?? internalTab;
  const setTab = (next: AntigravityPaneTab) => {
    setInternalTab(next);
    onChangeTab?.(next);
  };

  // Files & Code Editor state
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || "index.html");
  const [fileFilter, setFileFilter] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [mdRenderMode, setMdRenderMode] = useState<"rendered" | "source">("rendered");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [newFilePrompt, setNewFilePrompt] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // Interactive Terminal state
  const [termLang, setTermLang] = useState<"shell" | "javascript" | "python" | "bash">("shell");
  const [termInput, setTermInput] = useState("");
  const [termBusy, setTermBusy] = useState(false);
  const [termHistory, setTermHistory] = useState<string[]>([]);
  const [histCursor, setHistCursor] = useState<number>(-1);
  const [termOutput, setTermOutput] = useState<Array<{ cmd?: string; out: string; isErr?: boolean }>>([
    {
      out: `HEYUKA x KASPI Antigravity Terminal ready (${brand === "kaspi_pos" ? "KASPI POS Workspace" : "HEYUKA Workspace"}).\nType 'ls', 'cat index.html', 'sast', 'node <code/file>', 'python <code>', or 'help'.`,
    },
  ]);
  const termInputRef = useRef<HTMLInputElement>(null);
  const termEndRef = useRef<HTMLDivElement>(null);

  // Embedded Chrome-Like Multi-Tab Browser (Google Search + Interactive Page Proxy + Live App Preview)
  const [browserSubMode, setBrowserSubMode] = useState<"web" | "preview">("web");
  const [browserTabs, setBrowserTabs] = useState<BrowserTabState[]>(() => [createInitialBrowserTab(1)]);
  const [activeBrowserTabId, setActiveBrowserTabId] = useState<string>(() => "");
  const activeBTab = useMemo(
    () => browserTabs.find((t) => t.id === activeBrowserTabId) || browserTabs[0],
    [browserTabs, activeBrowserTabId]
  );
  const [addressInput, setAddressInput] = useState("https://www.google.com/");
  const [googleBoxQuery, setGoogleBoxQuery] = useState("");
  const [browserPageMode, setBrowserPageMode] = useState<"live" | "reader">("live");
  const [browserLoading, setBrowserLoading] = useState(false);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewConsoleLogs, setPreviewConsoleLogs] = useState<string[]>([]);

  const updateActiveBTab = (patch: Partial<BrowserTabState>) => {
    const targetId = activeBTab?.id;
    setBrowserTabs((prev) => prev.map((t) => (t.id === targetId ? { ...t, ...patch } : t)));
  };

  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusFilePath && files.some((f) => f.path === focusFilePath)) {
      setSelectedPath(focusFilePath);
    } else if (!files.some((f) => f.path === selectedPath) && files[0]) {
      setSelectedPath(files[0].path);
    }
  }, [files, focusFilePath, selectedPath]);

  useEffect(() => {
    if (currentTab === "terminal") {
      setTimeout(() => termInputRef.current?.focus(), 60);
    }
  }, [currentTab]);

  useEffect(() => {
    if (terminalLogsFromAgent.length > 0) {
      const latest = terminalLogsFromAgent[terminalLogsFromAgent.length - 1];
      setTermOutput((prev) => [...prev, { out: `[Agent] ${latest}` }]);
    }
  }, [terminalLogsFromAgent]);

  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [termOutput, termBusy]);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev?.data?.source === "heyuka-preview-console") {
        setPreviewConsoleLogs((prev) => [`[${ev.data.level}] ${ev.data.message}`, ...prev].slice(0, 20));
      } else if (ev?.data?.source === "heyuka-studio-browser" && ev.data?.type === "navigate" && ev.data?.url) {
        void navigateBrowser(String(ev.data.url), true);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  });

  useEffect(() => {
    if (externalBrowserRequest?.url) {
      setTab("browser");
      setBrowserSubMode("web");
      void navigateBrowser(externalBrowserRequest.url, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalBrowserRequest?.ts]);

  const activeFile = useMemo(
    () => files.find((f) => f.path === selectedPath) || files[0] || { path: "index.html", language: "html", content: "" },
    [files, selectedPath]
  );

  const filteredFiles = useMemo(() => {
    const q = fileFilter.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, fileFilter]);

  const previewHtmlDoc = useMemo(() => {
    const raw = assembleMultiFilePreviewDocument(files) || "<html><body></body></html>";
    const bridge = `<script>(function(){var oe=console.error;function s(l,a){try{parent.postMessage({source:"heyuka-preview-console",level:l,message:[].slice.call(a).join(" ")},"*")}catch{}}console.error=function(){s("error",arguments);oe.apply(console,arguments)};window.onerror=function(m){s("error",[m])};})();</script>`;
    return raw.includes("</head>") ? raw.replace("</head>", `${bridge}</head>`) : `${bridge}${raw}`;
  }, [files]);

  const handleDownloadZip = () => {
    const entries: Record<string, Uint8Array> = {};
    for (const f of files) entries[f.path.replace(/^\/+/, "")] = strToU8(f.content);
    const zipped = zipSync(entries);
    const ab = zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer;
    const blob = new Blob([ab], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brand === "kaspi_pos" ? "kaspi-pos" : "heyuka"}-project.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runCommand = async (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;
    setTermHistory((p) => [cmd, ...p.slice(0, 29)]);
    setHistCursor(-1);

    if (cmd === "clear" || cmd === "cls") {
      setTermOutput([]);
      return;
    }

    if (termLang === "shell") {
      const parts = cmd.split(/\s+/);
      const bin = parts[0]?.toLowerCase() || "";
      const arg = parts.slice(1).join(" ").trim();

      if (bin === "help") {
        setTermOutput((p) => [
          ...p,
          {
            cmd,
            out: [
              "Available workspace commands:",
              "  ls / tree           - list workspace files",
              "  cat <filename>      - inspect file contents",
              "  grep <pattern>      - search across workspace files",
              "  sast                - run security audit on current workspace",
              "  node <expr>         - evaluate JS/Node in sandbox",
              "  python <expr>       - run Python code in cloud sandbox",
              "  bash <cmd>          - run Bash command in cloud sandbox",
              "  clear               - clear terminal output",
            ].join("\n"),
          },
        ]);
        return;
      }

      if (bin === "ls" || bin === "dir" || bin === "tree") {
        const list = files
          .map((f) => `${f.path.padEnd(28, " ")} ${f.content.length}B  (${f.content.split(/\r?\n/).length} lines)`)
          .join("\n");
        setTermOutput((p) => [...p, { cmd, out: list || "(empty workspace)" }]);
        return;
      }

      if (bin === "pwd") {
        setTermOutput((p) => [...p, { cmd, out: `/workspace/${brand}` }]);
        return;
      }

      if (bin === "echo") {
        setTermOutput((p) => [...p, { cmd, out: arg }]);
        return;
      }

      if (bin === "cat" || bin === "head") {
        const match = files.find((f) => f.path === arg || f.path.endsWith(arg));
        if (!match) {
          setTermOutput((p) => [...p, { cmd, out: `cat: ${arg || "<file>"}: No such file in workspace`, isErr: true }]);
          return;
        }
        setSelectedPath(match.path);
        const body = bin === "head" ? match.content.split(/\r?\n/).slice(0, 20).join("\n") : match.content;
        setTermOutput((p) => [...p, { cmd, out: body.slice(0, 4000) }]);
        return;
      }

      if (bin === "grep") {
        const q = arg.replace(/^["']|["']$/g, "").toLowerCase();
        if (!q) {
          setTermOutput((p) => [...p, { cmd, out: "Usage: grep <search-term>", isErr: true }]);
          return;
        }
        const hits: string[] = [];
        for (const f of files) {
          f.content.split(/\r?\n/).forEach((line, idx) => {
            if (line.toLowerCase().includes(q)) hits.push(`${f.path}:${idx + 1}: ${line.trim()}`);
          });
        }
        setTermOutput((p) => [...p, { cmd, out: hits.slice(0, 40).join("\n") || "No matches found." }]);
        return;
      }

      if (bin === "sast") {
        const findings: string[] = [];
        for (const f of files) {
          const audit = scanSourceCodeForVulnerabilities(f.content);
          findings.push(
            `${f.path}: risk=${audit.riskScore}/100 | ${audit.clean ? "CLEAN" : `${audit.findings.length} finding(s)`}`
          );
          for (const item of audit.findings.slice(0, 4)) {
            findings.push(`  - [${item.severity}] ${item.cwe}: ${item.title}`);
          }
        }
        setTermOutput((p) => [...p, { cmd, out: findings.join("\n") }]);
        return;
      }
    }

    // Determine sandbox language and payload
    let execLang: "javascript" | "python" | "bash" = termLang === "shell" ? "bash" : termLang;
    let execCode = cmd;
    if (termLang === "shell") {
      if (/^(node|js)\s+/i.test(cmd)) {
        execLang = "javascript";
        const rest = cmd.replace(/^(node|js)\s+/i, "").trim();
        const fileMatch = files.find((f) => f.path === rest);
        execCode = fileMatch ? fileMatch.content : rest;
      } else if (/^(python|python3|py)\s+/i.test(cmd)) {
        execLang = "python";
        const rest = cmd.replace(/^(python|python3|py)\s+/i, "").trim();
        const fileMatch = files.find((f) => f.path === rest);
        execCode = fileMatch ? fileMatch.content : rest;
      } else if (/^bash\s+/i.test(cmd)) {
        execLang = "bash";
        execCode = cmd.replace(/^bash\s+/i, "").trim();
      }
    }

    setTermBusy(true);
    try {
      let result: any = null;
      const sandboxRes = await fetch("/api/v1/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: execLang, code: execCode.slice(0, 12000) }),
      });

      if (sandboxRes.ok) {
        result = await sandboxRes.json();
      } else {
        // Zero-key Studio web execution fallback when visitor is not authenticated with an API key
        const webExec = await fetch("/api/v1/heyuka/chat-web", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sandbox_execute", language: execLang, code: execCode.slice(0, 12000) }),
        });
        result = await webExec.json().catch(() => null);
      }

      if (result && (result.stdout || result.stderr || typeof result.exitCode === "number")) {
        const text = [result.stdout, result.stderr ? `[stderr]\n${result.stderr}` : ""]
          .filter(Boolean)
          .join("\n");
        setTermOutput((p) => [
          ...p,
          {
            cmd,
            out: text || `(completed with exitCode ${result.exitCode ?? 0} • ${result.engine || "Sandbox"})`,
            isErr: Boolean(result.stderr && !result.stdout),
          },
        ]);
      } else {
        setTermOutput((p) => [...p, { cmd, out: "Execution completed with empty output." }]);
      }
    } catch (err: any) {
      setTermOutput((p) => [...p, { cmd, out: `Error: ${err?.message || "Execution failed"}`, isErr: true }]);
    } finally {
      setTermBusy(false);
    }
  };

  const navigateBrowser = async (targetRaw: string, pushHistory = true) => {
    const clean = targetRaw.trim();
    if (!clean) return;
    setBrowserSubMode("web");
    setAddressInput(clean);

    // Handle returning to Google Home directly
    if (/^https?:\/\/(www\.)?google\.[a-z.]+\/?$/i.test(clean) || clean.toLowerCase() === "google") {
      const nextHist = pushHistory
        ? [...activeBTab.history.slice(0, activeBTab.historyIdx + 1), "https://www.google.com/"]
        : activeBTab.history;
      updateActiveBTab({
        title: "Google",
        url: "https://www.google.com/",
        kind: "google_home",
        proxiedHtml: "",
        extractedText: "",
        searchHits: [],
        error: null,
        history: nextHist,
        historyIdx: pushHistory ? nextHist.length - 1 : activeBTab.historyIdx,
      });
      setAddressInput("https://www.google.com/");
      return;
    }

    setBrowserLoading(true);
    updateActiveBTab({ error: null });

    const isUrl = /^https?:\/\//i.test(clean) || (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(clean) && !/\s/.test(clean));
    const resolvedUrl = isUrl ? (clean.startsWith("http") ? clean : `https://${clean}`) : undefined;

    if (pushHistory) {
      const nextHist = [...activeBTab.history.slice(0, activeBTab.historyIdx + 1), resolvedUrl || clean];
      updateActiveBTab({ history: nextHist, historyIdx: nextHist.length - 1 });
    }

    try {
      const payload = resolvedUrl ? { url: resolvedUrl, query: clean, lang: locale } : { query: clean, lang: locale };
      const res = await fetch("/api/v1/studio/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        updateActiveBTab({
          error: data?.error || "Could not load page or search results. Try opening externally.",
        });
        return;
      }

      if (data.kind === "google_home") {
        updateActiveBTab({
          title: "Google",
          url: "https://www.google.com/",
          kind: "google_home",
          proxiedHtml: "",
          extractedText: "",
          searchHits: [],
          error: null,
        });
        setAddressInput("https://www.google.com/");
        return;
      }

      if (data.kind === "search") {
        setGoogleBoxQuery(clean);
        updateActiveBTab({
          title: data.title || `${clean} - Google Search`,
          url: data.url || clean,
          kind: "search",
          proxiedHtml: "",
          extractedText: "",
          searchHits: Array.isArray(data.results) ? data.results : [],
          error: null,
        });
        return;
      }

      const finalUrl = String(data.url || resolvedUrl || clean);
      setAddressInput(finalUrl);
      updateActiveBTab({
        title: String(data.title || finalUrl),
        url: finalUrl,
        kind: data.proxiedHtml ? "page" : "reader",
        proxiedHtml: String(data.proxiedHtml || ""),
        extractedText: String(data.extractedText || ""),
        searchHits: [],
        error: null,
      });
    } catch (err: any) {
      updateActiveBTab({ error: err?.message || "Network error while browsing." });
    } finally {
      setBrowserLoading(false);
    }
  };

  const surfaceCls = isLight ? "bg-white text-gray-900 border-gray-200" : "bg-[#101010] text-zinc-100 border-white/[0.08]";
  const chromeCls = isLight ? "bg-[#F8F9FA] border-gray-200" : "bg-[#141416] border-white/[0.08]";
  const subtleBtn = isLight
    ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
    : "bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300";

  return (
    <div className={`flex flex-col h-full min-h-0 select-text ${surfaceCls}`}>
      {/* Top IDE Split Header: Changes | Files | Terminal | Browser */}
      <div className={`px-2.5 h-10 border-b flex items-center justify-between gap-2 shrink-0 ${chromeCls}`}>
        <div className="flex items-center gap-0.5 text-[11px] font-medium overflow-x-auto kaspi-no-scrollbar">
          {(
            [
              { id: "changes" as const, label: isAr ? "التغييرات" : "Changes", icon: FileText },
              { id: "files" as const, label: isAr ? "الملفات" : "Files", icon: FolderOpen },
              { id: "terminal" as const, label: "Terminal", icon: Terminal },
              { id: "browser" as const, label: isAr ? "المتصفح وبحث" : "Browser", icon: Globe },
            ] as const
          ).map((tb) => {
            const Icon = tb.icon;
            const active = currentTab === tb.id;
            return (
              <button
                key={tb.id}
                type="button"
                onClick={() => setTab(tb.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  active
                    ? isLight
                      ? "bg-white text-gray-900 shadow-xs border border-gray-200"
                      : "bg-white/[0.1] text-white"
                    : isLight
                    ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" style={active ? { color: accentHex } : undefined} />
                <span>{tb.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleDownloadZip}
            className={`px-2 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer ${subtleBtn}`}
            title="Download workspace ZIP"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">.zip</span>
          </button>
          {onClosePane && (
            <button
              type="button"
              onClick={onClosePane}
              className={`p-1 rounded-md cursor-pointer ${subtleBtn}`}
              title="Close Right Pane"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: CHANGES / REVIEW */}
      {currentTab === "changes" && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">
              {files.length} {files.length === 1 ? "file" : "files"} in workspace
            </span>
            <div className="flex items-center gap-1.5">
              {checkpoints.length > 0 && (
                <button
                  type="button"
                  onClick={() => onRestoreCheckpoint(checkpoints[0].id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer ${subtleBtn}`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore Last</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setTab("browser");
                  setBrowserSubMode("preview");
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium text-white inline-flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                <Play className="w-3 h-3" />
                <span>Preview App</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {files.map((file) => {
              const badge = getFileBadgeMeta(file.path, file.language);
              const lineCount = file.content.split(/\r?\n/).length;
              const diffParts = Diff.diffLines("", file.content);
              return (
                <div
                  key={file.path}
                  className={`rounded-lg border overflow-hidden ${isLight ? "border-gray-200 bg-gray-50/70" : "border-white/[0.08] bg-[#161618]"}`}
                >
                  <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-inherit">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPath(file.path);
                        setTab("files");
                      }}
                      className="flex items-center gap-2 font-mono text-[11px] font-semibold hover:underline cursor-pointer truncate"
                    >
                      <span
                        style={{ color: badge.color, backgroundColor: badge.bg }}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      >
                        {badge.extLabel}
                      </span>
                      <span className="truncate">{file.path}</span>
                    </button>
                    <span className="font-mono text-[11px] text-emerald-500 shrink-0">+{lineCount}</span>
                  </div>
                  <pre dir="ltr" className="p-2.5 text-[11px] font-mono text-left overflow-x-auto max-h-40 leading-relaxed opacity-85">
                    {diffParts
                      .map((p) => p.value)
                      .join("")
                      .split(/\r?\n/)
                      .slice(0, 12)
                      .map((line, i) => `${String(i + 1).padStart(3, " ")} | ${line}`)
                      .join("\n")}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FILES & MARKDOWN/CODE VIEWER */}
      {currentTab === "files" && (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Search & File Tabs Row */}
          <div className={`px-2.5 py-2 border-b space-y-2 ${isLight ? "border-gray-200" : "border-white/[0.07]"}`}>
            <div className="flex items-center gap-1.5">
              <div className={`flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] ${isLight ? "bg-white border-gray-200" : "bg-white/[0.04] border-white/[0.08]"}`}>
                <Search className="w-3 h-3 opacity-60 shrink-0" />
                <input
                  type="text"
                  value={fileFilter}
                  onChange={(e) => setFileFilter(e.target.value)}
                  placeholder="Search files..."
                  className="w-full bg-transparent focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setNewFilePrompt((p) => !p)}
                className={`p-1.5 rounded-md cursor-pointer ${subtleBtn}`}
                title="New File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => uploadRef.current?.click()}
                className={`p-1.5 rounded-md cursor-pointer ${subtleBtn}`}
                title="Upload files"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <input
                ref={uploadRef}
                type="file"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const list = Array.from(e.target.files || []);
                  if (!list.length) return;
                  const added: StudioFileNode[] = [];
                  for (const f of list) {
                    const text = await f.text().catch(() => "");
                    if (text) {
                      const ext = f.name.split(".").pop()?.toLowerCase() || "text";
                      added.push({ path: f.name, language: ext, content: text.slice(0, 60000) });
                    }
                  }
                  if (added.length) {
                    onChangeFiles([...files.filter((x) => !added.some((a) => a.path === x.path)), ...added]);
                    setSelectedPath(added[0].path);
                  }
                  e.target.value = "";
                }}
              />
            </div>

            {newFilePrompt && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const cleanName = newFileName.trim();
                  if (!cleanName) return;
                  const ext = cleanName.split(".").pop()?.toLowerCase() || "text";
                  if (!files.some((f) => f.path === cleanName)) {
                    onChangeFiles([...files, { path: cleanName, language: ext, content: `// ${cleanName}\n` }]);
                  }
                  setSelectedPath(cleanName);
                  setNewFileName("");
                  setNewFilePrompt(false);
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. notes.md or utils.ts"
                  className={`flex-1 px-2.5 py-1 rounded-md border text-[11px] font-mono ${isLight ? "bg-white border-gray-300" : "bg-white/[0.05] border-white/[0.12]"}`}
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-white cursor-pointer"
                  style={{ backgroundColor: accentHex }}
                >
                  Create
                </button>
              </form>
            )}

            {/* Open file pills */}
            <div className="flex items-center gap-1 overflow-x-auto kaspi-no-scrollbar">
              {filteredFiles.map((f) => {
                const active = activeFile.path === f.path;
                const badge = getFileBadgeMeta(f.path, f.language);
                return (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => {
                      setSelectedPath(f.path);
                      setIsEditingCode(false);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono shrink-0 cursor-pointer border transition-colors ${
                      active
                        ? isLight
                          ? "bg-white border-gray-300 text-gray-900 font-semibold"
                          : "bg-white/[0.09] border-white/[0.16] text-white font-semibold"
                        : isLight
                        ? "border-transparent text-gray-600 hover:bg-gray-100"
                        : "border-transparent text-zinc-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span style={{ color: badge.color }}>{badge.extLabel}</span>
                    <span>{f.path}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Action Toolbar */}
          <div className={`px-3 py-1.5 border-b flex items-center justify-between gap-2 text-[11px] ${isLight ? "border-gray-200 bg-gray-50" : "border-white/[0.06] bg-[#141416]"}`}>
            <span className="font-mono opacity-75 truncate">{activeFile.path}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeFile.path.toLowerCase().endsWith(".md") && (
                <button
                  type="button"
                  onClick={() => setMdRenderMode((m) => (m === "rendered" ? "source" : "rendered"))}
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium ${subtleBtn}`}
                >
                  {mdRenderMode === "rendered" ? "Code" : "Preview"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditingCode((p) => !p)}
                className={`px-2 py-0.5 rounded inline-flex items-center gap-1 cursor-pointer ${subtleBtn}`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingCode ? "View" : "Edit"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeFile.content);
                  setCopiedPath(activeFile.path);
                  setTimeout(() => setCopiedPath(null), 1500);
                }}
                className={`px-2 py-0.5 rounded inline-flex items-center gap-1 cursor-pointer ${subtleBtn}`}
              >
                {copiedPath === activeFile.path ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPath === activeFile.path ? "Copied" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={() => onInjectContextText(activeFile.path, activeFile.content)}
                className={`px-2 py-0.5 rounded inline-flex items-center gap-1 cursor-pointer ${subtleBtn}`}
                title="Attach file to agent prompt"
              >
                <Code2 className="w-3 h-3" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {/* Code Editor / Syntax Viewer / Markdown Rendered View */}
          <div className="flex-1 min-h-0 overflow-auto p-3">
            {isEditingCode ? (
              <textarea
                dir="ltr"
                value={activeFile.content}
                onChange={(e) =>
                  onChangeFiles(files.map((f) => (f.path === activeFile.path ? { ...f, content: e.target.value } : f)))
                }
                spellCheck={false}
                className={`w-full h-full min-h-[260px] p-3 rounded-lg font-mono text-xs text-left focus:outline-none border resize-none ${
                  isLight ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#141416] border-white/[0.08] text-zinc-100"
                }`}
              />
            ) : activeFile.path.toLowerCase().endsWith(".md") && mdRenderMode === "rendered" ? (
              <div className={`rounded-xl p-4 border text-sm ${isLight ? "bg-white border-gray-200" : "bg-[#141416] border-white/[0.08]"}`}>
                <HeyukaMarkdownMessage
                  markdown={activeFile.content}
                  onOpenUrlInBrowser={(url) => void navigateBrowser(url, true)}
                />
              </div>
            ) : (
              <div dir="ltr" className="text-left">
                <HeyukaSyntaxCodeView code={activeFile.content} filePath={activeFile.path} language={activeFile.language} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE TERMINAL (100% WORKING) */}
      {currentTab === "terminal" && (
        <div dir="ltr" className="flex-1 min-h-0 flex flex-col bg-[#0D0E11] text-zinc-100 text-left">
          {/* Terminal Sub-bar */}
          <div className="px-3 py-1.5 border-b border-white/[0.08] bg-[#141416] flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <select
                value={termLang}
                onChange={(e) => setTermLang(e.target.value as typeof termLang)}
                className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] font-mono text-[11px] focus:outline-none"
              >
                <option value="shell">Shell (Workspace)</option>
                <option value="javascript">Node.js</option>
                <option value="python">Python 3</option>
                <option value="bash">Bash</option>
              </select>
              {["ls", "sast", "cat index.html", "node console.log(2+2)"].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void runCommand(q)}
                  className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.12] font-mono text-[10px] text-zinc-300 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onRunPromptFromChild(`Analyze this terminal output and help fix or extend it:\n${termOutput.slice(-4).map((x) => x.out).join("\n")}`)}
                className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[10px] text-zinc-300 cursor-pointer"
              >
                Send Output to AI
              </button>
              <button
                type="button"
                onClick={() => setTermOutput([])}
                className="p-1 rounded hover:bg-white/[0.1] text-zinc-400 cursor-pointer"
                title="Clear terminal"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Live Scrollable Terminal Console */}
          <div
            onClick={() => termInputRef.current?.focus()}
            className="flex-1 min-h-0 overflow-y-auto p-3 font-mono text-[11px] space-y-2.5 cursor-text"
          >
            {termOutput.map((entry, idx) => (
              <div key={idx} className="space-y-1">
                {entry.cmd && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span style={{ color: accentHex }} className="font-bold">
                      kaspi@antigravity:~/workspace$
                    </span>
                    <span>{entry.cmd}</span>
                  </div>
                )}
                <pre className={`whitespace-pre-wrap leading-relaxed break-words ${entry.isErr ? "text-rose-400" : "text-zinc-300"}`}>
                  {entry.out}
                </pre>
              </div>
            ))}

            {termBusy && <div className="text-zinc-400 animate-pulse">Executing...</div>}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = termInput;
                setTermInput("");
                void runCommand(val);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <span style={{ color: accentHex }} className="font-bold shrink-0">
                kaspi@antigravity:~/workspace$
              </span>
              <input
                ref={termInputRef}
                type="text"
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" && termHistory.length > 0) {
                    e.preventDefault();
                    const nextIdx = Math.min(histCursor + 1, termHistory.length - 1);
                    setHistCursor(nextIdx);
                    setTermInput(termHistory[nextIdx] || "");
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const nextIdx = histCursor - 1;
                    setHistCursor(nextIdx);
                    setTermInput(nextIdx >= 0 ? termHistory[nextIdx] || "" : "");
                  }
                }}
                placeholder="Type command (ls, cat index.html, node ..., python ..., help)..."
                className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              />
            </form>
            <div ref={termEndRef} />
          </div>
        </div>
      )}

      {/* TAB 4: CHROME-LIKE MULTI-TAB GOOGLE SEARCH + LIVE PROXY LINK BROWSER + APP PREVIEW */}
      {currentTab === "browser" && (
        <div dir="ltr" className="flex-1 min-h-0 flex flex-col">
          {/* Chrome-Style Tab Strip */}
          <div className={`px-2 pt-1.5 border-b flex items-center gap-1 overflow-x-auto kaspi-no-scrollbar ${chromeCls}`}>
            {browserTabs.map((bt) => {
              const isAct = bt.id === activeBTab.id && browserSubMode === "web";
              return (
                <div
                  key={bt.id}
                  onClick={() => {
                    setActiveBrowserTabId(bt.id);
                    setAddressInput(bt.url);
                    setBrowserSubMode("web");
                  }}
                  className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-lg text-[11px] max-w-[170px] cursor-pointer border-b-2 transition-colors shrink-0 ${
                    isAct
                      ? isLight
                        ? "bg-white text-gray-900 border-[#007ACC] font-medium"
                        : "bg-[#1e1f24] text-white border-[#007ACC] font-medium"
                      : isLight
                      ? "text-gray-600 border-transparent hover:bg-gray-200/60"
                      : "text-zinc-400 border-transparent hover:bg-white/[0.05]"
                  }`}
                >
                  <Globe className="w-3 h-3 shrink-0 text-[#4285F4]" />
                  <span className="truncate">{bt.title || "Google"}</span>
                  {browserTabs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = browserTabs.filter((x) => x.id !== bt.id);
                        setBrowserTabs(next);
                        if (activeBTab.id === bt.id && next[0]) {
                          setActiveBrowserTabId(next[0].id);
                          setAddressInput(next[0].url);
                        }
                      }}
                      className="opacity-50 hover:opacity-100 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                const nt = createInitialBrowserTab(browserTabs.length + 1);
                setBrowserTabs((prev) => [...prev, nt]);
                setActiveBrowserTabId(nt.id);
                setAddressInput(nt.url);
                setBrowserSubMode("web");
              }}
              className={`p-1.5 rounded-md cursor-pointer ${subtleBtn}`}
              title="New Browser Tab"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Chrome Omnibox Navigation Bar */}
          <div className={`px-2.5 py-2 border-b space-y-2 ${chromeCls}`}>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activeBTab.historyIdx <= 0}
                onClick={() => {
                  if (activeBTab.historyIdx > 0) {
                    const nextIdx = activeBTab.historyIdx - 1;
                    const prevUrl = activeBTab.history[nextIdx];
                    updateActiveBTab({ historyIdx: nextIdx });
                    void navigateBrowser(prevUrl, false);
                  }
                }}
                className={`p-1.5 rounded-md cursor-pointer disabled:opacity-35 ${subtleBtn}`}
                title="Back"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={activeBTab.historyIdx >= activeBTab.history.length - 1}
                onClick={() => {
                  if (activeBTab.historyIdx < activeBTab.history.length - 1) {
                    const nextIdx = activeBTab.historyIdx + 1;
                    const nextUrl = activeBTab.history[nextIdx];
                    updateActiveBTab({ historyIdx: nextIdx });
                    void navigateBrowser(nextUrl, false);
                  }
                }}
                className={`p-1.5 rounded-md cursor-pointer disabled:opacity-35 ${subtleBtn}`}
                title="Forward"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void navigateBrowser(activeBTab.url || addressInput, false)}
                className={`p-1.5 rounded-md cursor-pointer ${subtleBtn}`}
                title="Reload"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${browserLoading ? "animate-spin" : ""}`} />
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void navigateBrowser(addressInput, true);
                }}
                className="flex-1 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="Search Google or enter URL (https://...)..."
                  className={`w-full px-3 py-1 rounded-full border text-xs focus:outline-none ${
                    isLight
                      ? "bg-white border-gray-300 text-gray-900 focus:border-[#007ACC]"
                      : "bg-[#101010] border-white/[0.12] text-zinc-100 focus:border-[#007ACC]"
                  }`}
                />
                <button
                  type="submit"
                  disabled={browserLoading}
                  className="px-3 py-1 rounded-full text-xs font-medium text-white cursor-pointer shrink-0"
                  style={{ backgroundColor: accentHex }}
                >
                  {browserLoading ? "..." : "Go"}
                </button>
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void navigateBrowser("https://www.google.com/", true)}
                  className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                    browserSubMode === "web" && activeBTab.kind === "google_home" ? "text-white" : subtleBtn
                  }`}
                  style={
                    browserSubMode === "web" && activeBTab.kind === "google_home"
                      ? { backgroundColor: accentHex }
                      : undefined
                  }
                >
                  Google
                </button>
                {activeBTab.kind === "page" && activeBTab.proxiedHtml && (
                  <button
                    type="button"
                    onClick={() => {
                      setBrowserSubMode("web");
                      setBrowserPageMode((m) => (m === "live" ? "reader" : "live"));
                    }}
                    className={`px-2 py-1 rounded-md font-medium cursor-pointer ${subtleBtn}`}
                  >
                    {browserPageMode === "live" ? "Reader View" : "Live Webpage"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setBrowserSubMode("preview")}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    browserSubMode === "preview" ? "text-white" : subtleBtn
                  }`}
                  style={browserSubMode === "preview" ? { backgroundColor: accentHex } : undefined}
                >
                  App Preview ({files.length})
                </button>
              </div>

              {browserSubMode === "web" ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const content =
                        activeBTab.extractedText ||
                        activeBTab.searchHits.map((h) => `- [${h.title}](${h.url}): ${h.snippet || ""}`).join("\n");
                      if (content) onInjectContextText(activeBTab.title, content);
                    }}
                    disabled={!activeBTab.extractedText && activeBTab.searchHits.length === 0}
                    className={`px-2 py-0.5 rounded-md cursor-pointer disabled:opacity-40 ${subtleBtn}`}
                  >
                    Attach to AI
                  </button>
                  {/^https?:\/\//i.test(activeBTab.url) && (
                    <a
                      href={activeBTab.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1 rounded-md inline-flex items-center ${subtleBtn}`}
                      title="Open in OS browser"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {[
                    { id: "desktop" as const, icon: Monitor },
                    { id: "tablet" as const, icon: Tablet },
                    { id: "mobile" as const, icon: Smartphone },
                  ].map((vp) => {
                    const Icon = vp.icon;
                    return (
                      <button
                        key={vp.id}
                        type="button"
                        onClick={() => setViewport(vp.id)}
                        className={`p-1 rounded cursor-pointer ${viewport === vp.id ? "text-white" : subtleBtn}`}
                        style={viewport === vp.id ? { backgroundColor: accentHex } : undefined}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Browser Viewport Content */}
          <div className="flex-1 min-h-0 overflow-auto">
            {browserSubMode === "preview" ? (
              <div className="h-full flex flex-col gap-2 p-3">
                <div className="flex-1 min-h-[280px] flex justify-center">
                  <iframe
                    title="Antigravity App Preview"
                    srcDoc={previewHtmlDoc}
                    sandbox="allow-scripts allow-forms allow-modals"
                    className={`bg-white rounded-lg border border-white/10 transition-all ${
                      viewport === "mobile"
                        ? "w-[360px] h-full"
                        : viewport === "tablet"
                        ? "w-[740px] max-w-full h-full"
                        : "w-full h-full"
                    }`}
                  />
                </div>
                {previewConsoleLogs.length > 0 && (
                  <div className="p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-[10px] text-amber-300 max-h-24 overflow-y-auto">
                    {previewConsoleLogs.join("\n")}
                  </div>
                )}
              </div>
            ) : activeBTab.kind === "google_home" ? (
              /* Chrome Google Search Start Page matching IMG_5822.MOV & Antigravity screenshot */
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-5">
                <div className="text-4xl font-semibold tracking-tight select-none">
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335]">o</span>
                  <span className="text-[#FBBC05]">o</span>
                  <span className="text-[#4285F4]">g</span>
                  <span className="text-[#34A853]">l</span>
                  <span className="text-[#EA4335]">e</span>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (googleBoxQuery.trim()) void navigateBrowser(googleBoxQuery.trim(), true);
                  }}
                  className="w-full max-w-md space-y-3"
                >
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-xs ${
                      isLight
                        ? "bg-white border-gray-300 focus-within:border-[#007ACC]"
                        : "bg-[#202124] border-white/[0.14] focus-within:border-[#007ACC]"
                    }`}
                  >
                    <Search className="w-4 h-4 opacity-50 shrink-0" />
                    <input
                      type="text"
                      value={googleBoxQuery}
                      onChange={(e) => setGoogleBoxQuery(e.target.value)}
                      placeholder={isAr ? "ابحث في Google أو الصق أي رابط..." : "Search Google or type a URL..."}
                      className="w-full bg-transparent text-sm focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="submit"
                      disabled={browserLoading}
                      className={`px-4 py-1.5 rounded-md text-xs font-medium cursor-pointer ${subtleBtn}`}
                    >
                      Search Google
                    </button>
                    <button
                      type="button"
                      onClick={() => void navigateBrowser("https://en.wikipedia.org/wiki/Special:Random", true)}
                      className={`px-4 py-1.5 rounded-md text-xs font-medium cursor-pointer ${subtleBtn}`}
                    >
                      Explore Web
                    </button>
                  </div>
                </form>

                {activeBTab.error && (
                  <div className="max-w-md p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                    {activeBTab.error}
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-1.5 max-w-md pt-2 text-[11px]">
                  {[
                    "kaspi pos morocco",
                    "https://nextjs.org/docs",
                    "https://playwright.dev/python/docs/intro",
                    "morocco TVA dgi 2026",
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void navigateBrowser(q, true)}
                      className={`px-3 py-1 rounded-full cursor-pointer ${subtleBtn}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : activeBTab.kind === "search" ? (
              <div className="p-4 space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (googleBoxQuery.trim()) void navigateBrowser(googleBoxQuery.trim(), true);
                  }}
                  className="flex items-center gap-2 max-w-lg"
                >
                  <input
                    type="text"
                    value={googleBoxQuery}
                    onChange={(e) => setGoogleBoxQuery(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded-full border text-xs focus:outline-none ${
                      isLight ? "bg-white border-gray-300" : "bg-[#202124] border-white/[0.12]"
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-full text-xs text-white cursor-pointer"
                    style={{ backgroundColor: accentHex }}
                  >
                    Search
                  </button>
                </form>

                {activeBTab.searchHits.length === 0 ? (
                  <div className="p-4 rounded-xl border border-white/10 text-xs opacity-75">
                    No direct web hits matched. Try entering a full URL (`https://...`) above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeBTab.searchHits.map((hit, idx) => (
                      <div
                        key={`${hit.url}-${idx}`}
                        className={`p-3 rounded-xl border space-y-1 ${
                          isLight
                            ? "bg-white border-gray-200 hover:border-[#007ACC]"
                            : "bg-[#161618] border-white/[0.08] hover:border-[#007ACC]/50"
                        }`}
                      >
                        <div className="text-[11px] font-mono opacity-60 truncate">{hit.url}</div>
                        <button
                          type="button"
                          onClick={() => void navigateBrowser(hit.url, true)}
                          className="text-start text-sm font-semibold hover:underline cursor-pointer"
                          style={{ color: isLight ? "#1a0dab" : "#8ab4f8" }}
                        >
                          {hit.title}
                        </button>
                        {hit.snippet && <p className="text-xs opacity-80 leading-relaxed">{hit.snippet}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {activeBTab.error && (
                  <div className="m-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                    {activeBTab.error}
                  </div>
                )}

                {activeBTab.kind === "page" && activeBTab.proxiedHtml && browserPageMode === "live" ? (
                  <iframe
                    title={activeBTab.title}
                    srcDoc={activeBTab.proxiedHtml}
                    sandbox="allow-scripts allow-forms allow-modals"
                    className="flex-1 w-full h-full min-h-[380px] bg-white border-0"
                  />
                ) : (
                  <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-inherit">
                      <span className="text-xs font-semibold truncate">{activeBTab.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onRunPromptFromChild(
                            `Analyze and extract useful insights from ${activeBTab.url}:\n\n${activeBTab.extractedText.slice(0, 3500)}`
                          )
                        }
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium text-white cursor-pointer shrink-0"
                        style={{ backgroundColor: accentHex }}
                      >
                        Analyze with AI
                      </button>
                    </div>
                    <HeyukaMarkdownMessage
                      markdown={(activeBTab.extractedText || "Loading content...").slice(0, 12000)}
                      onOpenUrlInBrowser={(url) => void navigateBrowser(url, true)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
