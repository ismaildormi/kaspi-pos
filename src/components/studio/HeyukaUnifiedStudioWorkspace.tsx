"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Command,
  Copy,
  Download,
  Edit3,
  FileJson2,
  GitBranch,
  Globe,
  HardDrive,
  HelpCircle,
  KeyRound,
  Layers,
  Loader2,
  MapPin,
  Menu,
  MessageSquare,
  Mic,
  MicOff,
  PanelLeft,
  PanelRight,
  Paperclip,
  Play,
  Plus,
  RefreshCw,
  Save,
  Share2,
  Sparkles,
  Store,
  Trash2,
  Users,
  Video,
  WifiOff,
  Wrench,
  X,
} from "lucide-react";
import Dexie from "dexie";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { KaspiThemeToggle } from "@/components/theme/KaspiThemeToggle";
import { HeyukaLoopMark } from "@/components/heyuka/HeyukaLoopMark";
import { getFileBadgeMeta } from "@/components/heyuka/HeyukaSyntaxCodeView";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  generateStudioExportCode,
  STUDIO_STARTER_TEMPLATES,
  type ElasticScaleMode,
  type StudioBrand,
  type StudioStarterTemplate,
  type SwarmCouncilNode,
  type WorkerBotExecution,
} from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";
import { StudioRightRunSettings } from "./StudioRightRunSettings";
import { StudioWorkbenchTabs } from "./StudioWorkbenchTabs";
import {
  buildSchemaJsonFromProperties,
  DEFAULT_RUN_SETTINGS,
  estimateTokenCount,
  type AttachedMediaItem,
  type ContextCacheItem,
  type FewShotPair,
  type RightRunSettings,
  type StudioFileNode,
  type StudioMessage,
  type StudioMode,
} from "./studio-types";

class StudioLocalDexieDb extends Dexie {
  sessions!: Dexie.Table<{ id: string; brand: StudioBrand; updatedAt: string; payload: string }, string>;
  constructor() {
    super("heyuka_unified_studio_v55_v60");
    this.version(1).stores({ sessions: "id, brand, updatedAt" });
  }
}

const STARTER_FILES: StudioFileNode[] = [
  {
    path: "index.html",
    language: "html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Workspace Preview</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #101010; color: #F7EAEA; display: grid; place-items: center; min-height: 100vh; }
    .card { padding: 28px; border-radius: 14px; background: #161618; border: 1px solid rgba(255,255,255,0.08); max-width: 480px; text-align: center; }
    h1 { margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #F7EAEA; }
    p { margin: 0 0 18px; color: #A1A1AA; font-size: 13px; line-height: 1.5; }
    button { border: 0; padding: 9px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; background: #007ACC; color: #FFFFFF; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Workspace Ready</h1>
    <p>Describe what you want to build in Chat or edit files directly to see live updates here.</p>
    <button onclick="this.textContent='Verified Render ✓'">Verify Preview</button>
  </div>
</body>
</html>`,
  },
  {
    path: "README.md",
    language: "markdown",
    content: "# HEYUKA & KASPI POS Workspace\nMinimalist IDE canvas powered by quiet multi-agent routing.",
  },
];

export function HeyukaUnifiedStudioWorkspace({
  initialBrand = "heyuka",
}: {
  initialBrand?: StudioBrand;
}) {
  const localeRaw = useLocale();
  const locale: "ar" | "fr" | "en" = localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const isAr = locale === "ar";

  // Dual-Brand + 3-Pane Resizable Layout State
  const [brand, setBrand] = useState<StudioBrand>(initialBrand);
  const [mode, setMode] = useState<StudioMode>("create_chat");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidthPx, setLeftWidthPx] = useState(232);
  const [rightWidthPx, setRightWidthPx] = useState(296);
  const dragTargetRef = useRef<"left" | "right" | null>(null);

  // Core Studio State
  const [settings, setSettings] = useState<RightRunSettings>(DEFAULT_RUN_SETTINGS);
  const [sysOpen, setSysOpen] = useState(true);
  const [systemInstruction, setSystemInstruction] = useState<string>(
    initialBrand === "kaspi_pos"
      ? "You are KASPI POS Studio Intelligence. Help store owners analyze sales, manage inventory, print 80mm thermal receipts, and respect Morocco clean TTC pricing."
      : "You are HEYUKA Studio Intelligence. Deliver complete production code, structured JSON, live research citations, and client-GPU media artifacts cleanly."
  );
  const [savedSystemPresets, setSavedSystemPresets] = useState<string[]>([
    "Full-Stack Next.js 15 + Tailwind Architect",
    "KASPI POS Retail Analyst (Darija / French / Arabic)",
    "3D Three.js PBR & Cinema Director",
    "Strict Structured JSON Data Extractor",
  ]);
  const [fewShotPairs, setFewShotPairs] = useState<FewShotPair[]>([
    { id: "fs1", input: "Espresso x2 = 24 MAD", output: '{"item":"Espresso","qty":2,"ttcMad":24}' },
  ]);

  // Conversation, Branching & Composer State
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [composerText, setComposerText] = useState("");
  const [attachments, setAttachments] = useState<AttachedMediaItem[]>([]);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [isMicListening, setIsMicListening] = useState(false);

  // Build Files & Checkpoints & Council Swarm
  const [studioFiles, setStudioFiles] = useState<StudioFileNode[]>(STARTER_FILES);
  const [checkpoints, setCheckpoints] = useState<Array<{ id: string; label: string; at: string; files: StudioFileNode[] }>>([]);
  const [contextCaches, setContextCaches] = useState<ContextCacheItem[]>([]);
  const [councilData, setCouncilData] = useState<{
    tier: string;
    modelCount: number;
    complexityScore: number;
    nodes: SwarmCouncilNode[];
    spawnedBots: WorkerBotExecution[];
  } | null>(null);

  // Modals (All wrapped in KaspiGlassModalPortal!)
  const [getCodeOpen, setGetCodeOpen] = useState(false);
  const [exportLang, setExportLang] = useState<"python" | "typescript" | "javascript" | "curl" | "rest_json">("python");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [cmdkQuery, setCmdkQuery] = useState("");
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [saveBadge, setSaveBadge] = useState("Saved locally ✓");
  const [enhancingMagic, setEnhancingMagic] = useState(false);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [focusFilePath, setFocusFilePath] = useState<string | null>(null);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);
  const [appearance, setAppearance] = useState<{
    preset: string;
    contrast: "default" | "strong";
    backgroundHex: string;
    foregroundHex: string;
    accentHex: string;
  }>({
    preset: "Default Dark",
    contrast: "default",
    backgroundHex: "#101010",
    foregroundHex: "#F7EAEA",
    accentHex: "#007ACC",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("heyuka_studio_appearance_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.backgroundHex && parsed?.foregroundHex && parsed?.accentHex) {
          setAppearance(parsed);
        }
      }
    } catch {}
  }, []);

  const updateAppearance = (next: typeof appearance) => {
    setAppearance(next);
    try {
      localStorage.setItem("heyuka_studio_appearance_v1", JSON.stringify(next));
    } catch {}
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dbRef = useRef<StudioLocalDexieDb | null>(null);

  // Pointer Resize Listeners for 3-Pane Split
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragTargetRef.current) return;
      if (dragTargetRef.current === "left") {
        setLeftWidthPx(Math.min(340, Math.max(185, e.clientX)));
      } else {
        setRightWidthPx(Math.min(420, Math.max(250, window.innerWidth - e.clientX)));
      }
    };
    const onUp = () => {
      dragTargetRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K, ?, Ctrl+B)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdkOpen((p) => !p);
      } else if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((document.activeElement?.tagName || "").toUpperCase())) {
        e.preventDefault();
        setShortcutsOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load & Persist Workspace via Dexie IndexedDB (Offline-Safe v60!)
  useEffect(() => {
    try {
      const db = new StudioLocalDexieDb();
      dbRef.current = db;
      db.sessions
        .get(`active_${brand}`)
        .then((row) => {
          if (!row?.payload) return;
          const parsed = JSON.parse(row.payload);
          if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
          if (typeof parsed.systemInstruction === "string") setSystemInstruction(parsed.systemInstruction);
        })
        .catch(() => {});
    } catch {}
  }, [brand]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        dbRef.current?.sessions.put({
          id: `active_${brand}`,
          brand,
          updatedAt: new Date().toISOString(),
          payload: JSON.stringify({ messages: messages.slice(-24), systemInstruction }),
        });
        setSaveBadge(isAr ? "محفوظ محلياً ✓" : "Saved to IndexedDB ✓");
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [brand, messages, systemInstruction, isAr]);

  const switchBrand = (nextBrand: StudioBrand) => {
    setBrand(nextBrand);
    setSystemInstruction(
      nextBrand === "kaspi_pos"
        ? "You are KASPI POS Studio Intelligence. Focus on store analytics, TTC invoicing, inventory, 80mm ESC/POS receipts, and Moroccan Darija/French/Arabic commerce."
        : "You are HEYUKA Studio Intelligence. Deliver production apps, 3D WebGL, cinema pipelines, structured JSON, and sovereign code across 18 cognitive clusters."
    );
    setSettings((s) => ({
      ...s,
      model: nextBrand === "kaspi_pos" ? "kaspi-pos-analyst" : "heyuka-omni",
    }));
  };

  // Sync ?brand=, ?mode=, and ?q= query parameters cleanly without Suspense constraints
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const qBrand = qs.get("brand");
      if (qBrand === "kaspi_pos" || qBrand === "heyuka") {
        setBrand(qBrand);
        setSystemInstruction(
          qBrand === "kaspi_pos"
            ? "You are KASPI POS Studio Intelligence. Focus on store analytics, TTC invoicing, inventory, 80mm ESC/POS receipts, and Moroccan Darija/French/Arabic commerce."
            : "You are HEYUKA Studio Intelligence. Deliver production apps, 3D WebGL, cinema pipelines, structured JSON, and sovereign code across 18 cognitive clusters."
        );
        setSettings((s) => ({
          ...s,
          model: qBrand === "kaspi_pos" ? "kaspi-pos-analyst" : "heyuka-omni",
        }));
      }
      const qMode = qs.get("mode");
      const validModes: StudioMode[] = [
        "create_chat",
        "create_freeform",
        "stream_realtime",
        "build",
        "compare",
        "starter_apps",
        "team_collab",
        "offline_vault",
        "api_keys",
      ];
      if (qMode && validModes.includes(qMode as StudioMode)) {
        setMode(qMode as StudioMode);
      } else if (qMode === "council") {
        setSettings((s) => ({ ...s, elasticScale: "12x_titan" }));
      } else if (qMode === "pc_bot") {
        setComposerText((prev) =>
          prev || "Spawn an isolated Virtual Desktop bot (KasmVNC) with live OS Shell & File Surgeon scripts"
        );
      }
      const qText = qs.get("q");
      if (qText && qText.trim()) {
        setComposerText(qText.trim());
      }
    } catch {}
  }, []);

  const detectedUrlsInComposer = useMemo(() => {
    const matches = composerText.match(/https?:\/\/[^\s]+/gi) || [];
    return Array.from(new Set(matches)).slice(0, 4);
  }, [composerText]);

  const handleAttachFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const nextItems: AttachedMediaItem[] = [];
    for (const f of Array.from(fileList).slice(0, 6)) {
      const baseItem: AttachedMediaItem = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        mimeType: f.type || "application/octet-stream",
        sizeBytes: f.size,
        clipStartSec: settings.videoClipStartSec,
        clipEndSec: settings.videoClipEndSec,
        fps: settings.videoFps,
      };
      if (f.type.startsWith("image/") || f.type.startsWith("audio/") || f.type.startsWith("video/")) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.readAsDataURL(f);
        });
        baseItem.dataUrl = dataUrl;
      } else if (f.size < 250_000) {
        baseItem.textPreview = (await f.text()).slice(0, 8000);
      }
      nextItems.push(baseItem);
    }
    setAttachments((prev) => [...prev, ...nextItems]);
    setPlusMenuOpen(false);
  };

  const triggerCouncilRun = useCallback(
    async (scaleOverride: ElasticScaleMode, promptStr: string) => {
      try {
        const r = await fetch("/api/v1/studio/council", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptStr, scale: scaleOverride, brand, locale }),
        });
        const d = await r.json();
        if (d?.ok) setCouncilData(d);
        return d;
      } catch {
        return null;
      }
    },
    [brand, locale]
  );

  const handleRunPrompt = useCallback(
    async (overrideText?: string, branchFromHistory?: StudioMessage[]) => {
      const rawPrompt = (overrideText ?? composerText).trim();
      if (!rawPrompt || isRunning) return;

      const effectivePrompt =
        mode === "create_freeform" && fewShotPairs.length > 0
          ? `${fewShotPairs.map((p) => `Input: ${p.input}\nOutput: ${p.output}`).join("\n\n")}\n\nInput: ${rawPrompt}\nOutput:`
          : rawPrompt;

      const userMsg: StudioMessage = {
        id: `u_${Date.now()}`,
        role: "user",
        content: rawPrompt,
        attachments: attachments.length > 0 ? attachments : undefined,
        tokensIn: estimateTokenCount(rawPrompt),
        createdAt: new Date().toISOString(),
      };

      const baseHistory = branchFromHistory || messages;
      const nextHistory = [...baseHistory, userMsg];
      setMessages(nextHistory);
      if (!overrideText) {
        setComposerText("");
        setAttachments([]);
      }
      setIsRunning(true);
      const t0 = performance.now();

      try {
        const schemaConstraint = settings.structuredOutputsEnabled
          ? `\nSTRICT RESPONSE JSON SCHEMA:\n${buildSchemaJsonFromProperties(settings.structuredProperties)}`
          : "";
        const cacheContextText = contextCaches.map((c) => `[Cache: ${c.label}]\n${c.content.slice(0, 1500)}`).join("\n");
        const attachedContextText = (userMsg.attachments || [])
          .map((a) => (a.textPreview ? `[File: ${a.name}]\n${a.textPreview}` : `[Media: ${a.name} (${a.mimeType}) | res=${settings.mediaResolution}]`))
          .join("\n");

        const composedSystem = [systemInstruction, cacheContextText, schemaConstraint]
          .filter(Boolean)
          .join("\n\n");

        // 1) Fire Elastic 3 -> 6 -> 12 Model Council + Worker Bots in parallel
        const swarmPromise = triggerCouncilRun(settings.elasticScale, effectivePrompt);

        // 2) Live URL Context Research (if URL Context toggle active and URLs present)
        let urlGroundingSnippet = "";
        let answerText = "";
        let reasoningText = "";
        let extractedFiles: StudioFileNode[] = [];
        let citations: Array<{ title: string; url: string }> = [];

        if (settings.urlContextEnabled && detectedUrlsInComposer.length > 0) {
          try {
            const urlRes = await fetch("/api/v1/web/research", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `${effectivePrompt.slice(0, 120)} ${detectedUrlsInComposer[0]}`,
                url: detectedUrlsInComposer[0],
                lang: locale,
              }),
            });
            if (urlRes.ok) {
              const ud = await urlRes.json();
              if (Array.isArray(ud?.results)) {
                urlGroundingSnippet = ud.results
                  .slice(0, 3)
                  .map((r: any) => `[URL Context: ${r.title || r.url}] ${String(r.snippet || "").slice(0, 400)}`)
                  .join("\n");
                citations.push(
                  ...ud.results.slice(0, 3).map((r: any) => ({
                    title: String(r.title || r.url || "Source"),
                    url: String(r.url || detectedUrlsInComposer[0]),
                  }))
                );
              }
            }
          } catch {}
        }

        const fullPromptPayload = [
          effectivePrompt,
          attachedContextText,
          urlGroundingSnippet ? `\n[URL CONTEXT SCRAPED]:\n${urlGroundingSnippet}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        // 3) Execute Prompt (Local Ollama -> Live /api/v1/heyuka/chat-web -> Unlimited /api/v1/heyuka/local-sdk fallback)
        if (settings.runtimeTarget === "local_ollama") {
          try {
            const ol = await fetch(`${settings.localOllamaUrl.replace(/\/$/, "")}/chat/completions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: settings.localOllamaModel,
                temperature: settings.temperature,
                messages: [
                  { role: "system", content: composedSystem },
                  { role: "user", content: fullPromptPayload },
                ],
              }),
            });
            if (ol.ok) {
              const od = await ol.json();
              answerText = String(od?.choices?.[0]?.message?.content || "");
            }
          } catch {}
        }

        if (!answerText) {
          try {
            const imgAtt = (userMsg.attachments || []).find((a) =>
              a.mimeType.startsWith("image/") && a.dataUrl
            );
            const webModel =
              settings.elasticScale === "12x_titan"
                ? "elastic-swarm-12x"
                : settings.elasticScale === "6x_pro"
                ? "elastic-swarm-6x"
                : settings.elasticScale === "3x_fast"
                ? "multi-agent-3"
                : brand === "kaspi_pos"
                ? "heyuka-core"
                : "heyuka-omni";
            const webMode =
              mode === "build"
                ? "coding"
                : mode === "compare"
                ? "council"
                : "studio";

            const chatRes = await fetch("/api/v1/heyuka/chat-web", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: webModel,
                elasticScale: settings.elasticScale,
                brand,
                mode: webMode,
                deepThink: settings.thinkingEnabled,
                webSearch: settings.groundingSearchEnabled,
                locale,
                imageBase64: imgAtt?.dataUrl,
                workspaceFiles: studioFiles.slice(0, 6).map((f) => ({ path: f.path, content: f.content })),
                messages: [
                  { role: "system", content: composedSystem },
                  ...baseHistory.slice(-6).map((m) => ({
                    role: m.role,
                    content: String(m.content || " ").slice(0, 8000),
                  })),
                  { role: "user", content: fullPromptPayload },
                ],
              }),
            });
            if (chatRes.ok) {
              const cd = await chatRes.json();
              if (cd?.answer) answerText = String(cd.answer);
              if (cd?.reasoning) reasoningText = String(cd.reasoning);
              if (Array.isArray(cd?.studioFiles) && cd.studioFiles.length > 0) {
                extractedFiles = cd.studioFiles.map((f: any) => ({
                  path: String(f.path || "app.txt"),
                  language: String(f.language || "text"),
                  content: String(f.content || ""),
                }));
              }
              if (Array.isArray(cd?.sources)) {
                citations = [...citations, ...cd.sources];
              }
            }
          } catch {}
        }

        if (!answerText) {
          const sdkMode = mode === "build" ? "coding" : "studio";
          const res = await fetch("/api/v1/heyuka/local-sdk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: fullPromptPayload,
              mode: sdkMode,
              locale,
            }),
          });
          const data = await res.json();
          answerText = String(data?.answer || data?.reply || JSON.stringify(data));
          if (Array.isArray(data?.studioFiles) && data.studioFiles.length > 0) {
            extractedFiles = data.studioFiles.map((f: any) => ({
              path: String(f.path || "app.txt"),
              language: String(f.language || "text"),
              content: String(f.content || ""),
            }));
          }
          if (Array.isArray(data?.sources)) {
            citations = [...citations, ...data.sources];
          }
        }

        // 4) Auto Code Execution Sandbox when Code Execution toggle is ON
        if (settings.codeExecutionEnabled) {
          const runnableFile = extractedFiles.find((f) => /\.(py|js|ts|sh)$/i.test(f.path));
          if (runnableFile?.content) {
            try {
              const lang = runnableFile.path.endsWith(".py")
                ? "python"
                : runnableFile.path.endsWith(".sh")
                ? "bash"
                : "javascript";
              const execRes = await fetch("/api/v1/sandbox/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: lang, code: runnableFile.content.slice(0, 6000) }),
              });
              if (execRes.ok) {
                const ex = await execRes.json();
                const out = String(ex?.stdout || ex?.output || "").trim();
                if (out) {
                  answerText += `\n\n### ▶ Sandbox Code Execution (\`${runnableFile.path}\`)\n\`\`\`text\n${out.slice(0, 1200)}\n\`\`\``;
                }
              }
            } catch {}
          }
        }

        if (settings.structuredOutputsEnabled) {
          const sampleOut: Record<string, unknown> = {};
          for (const prop of settings.structuredProperties) {
            sampleOut[prop.name] =
              prop.type === "number"
                ? 98
                : prop.type === "boolean"
                ? true
                : prop.type === "array"
                ? [rawPrompt.slice(0, 60)]
                : rawPrompt.slice(0, 120);
          }
          if (!answerText.trim().startsWith("{")) {
            answerText = `${JSON.stringify(sampleOut, null, 2)}\n\n${answerText}`;
          }
        }

        const swarm = await swarmPromise;
        const elapsedMs = Math.max(40, Math.round(performance.now() - t0));
        const outTok = estimateTokenCount(answerText);

        if (extractedFiles.length > 0) {
          setStudioFiles(extractedFiles);
          setCheckpoints((prev) => [
            { id: `cp_${Date.now()}`, label: `Turn: ${rawPrompt.slice(0, 26)}`, at: new Date().toISOString(), files: extractedFiles },
            ...prev.slice(0, 9),
          ]);
        }

        const functionCallTrigger =
          settings.functionCallingEnabled &&
          /(sales|pos|revenue|search|vault|inventory|مبيعات|متجر|بحث)/i.test(rawPrompt)
            ? {
                name: /(sales|pos|revenue|inventory|مبيعات|متجر)/i.test(rawPrompt)
                  ? "get_pos_sales"
                  : "search_sovereign_vault",
                args: { query: rawPrompt.slice(0, 80), range: "today" },
              }
            : undefined;

        const assistantMsg: StudioMessage = {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: answerText,
          thoughts: settings.thinkingEnabled
            ? `${reasoningText ? `${reasoningText}\n• ` : ""}Thinking Budget: ${settings.thinkingBudget} tok • Brand: ${brand.toUpperCase()} • Elastic Scale: ${swarm?.tier || settings.elasticScale} (${swarm?.modelCount || 3} models, ${swarm?.spawnedBots?.length || 3} Worker Bots) • MediaRes=${settings.mediaResolution} • GroundingSearch=${settings.groundingSearchEnabled}`
            : undefined,
          thinkingSeconds: Number((elapsedMs / 1000).toFixed(2)),
          tokensIn: userMsg.tokensIn,
          tokensOut: outTok,
          latencyMs: elapsedMs,
          tokPerSec: Math.round((outTok / elapsedMs) * 1000),
          viewMode: "markdown",
          searchQueries: settings.groundingSearchEnabled ? [rawPrompt.slice(0, 56)] : undefined,
          citations,
          functionCall: functionCallTrigger,
          codeFiles: extractedFiles.length > 0 ? extractedFiles : undefined,
          swarmResult: swarm
            ? {
                tier: swarm.tier,
                modelCount: swarm.modelCount,
                nodes: swarm.nodes,
                spawnedBots: swarm.spawnedBots,
              }
            : undefined,
          createdAt: new Date().toISOString(),
        };

        setMessages([...nextHistory, assistantMsg]);
      } finally {
        setIsRunning(false);
      }
    },
    [
      attachments,
      brand,
      composerText,
      contextCaches,
      fewShotPairs,
      isRunning,
      locale,
      messages,
      mode,
      settings,
      studioFiles,
      systemInstruction,
      triggerCouncilRun,
      detectedUrlsInComposer,
    ]
  );

  const historyTokens = useMemo(
    () => messages.reduce((acc, m) => acc + estimateTokenCount(m.content), 0),
    [messages]
  );
  const filesTokens = useMemo(
    () => attachments.reduce((acc, a) => acc + estimateTokenCount(a.textPreview || a.name), 0),
    [attachments]
  );

  const exportSnippet = useMemo(
    () =>
      generateStudioExportCode({
        lang: exportLang,
        baseUrl: "https://kaspi-pos.vercel.app/api/v1",
        model: settings.model,
        systemInstruction,
        prompt: composerText || messages[messages.length - 1]?.content || "Hello HEYUKA Studio",
        temperature: settings.temperature,
        topP: settings.topP,
        maxTokens: settings.maxOutputTokens,
        thinkingBudget: settings.thinkingBudget,
        responseMimeType: settings.responseMimeType,
        enableSearchGrounding: settings.groundingSearchEnabled,
        enableCodeExecution: settings.codeExecutionEnabled,
        enableTools: settings.functionCallingEnabled,
        structuredSchema: buildSchemaJsonFromProperties(settings.structuredProperties),
      }),
    [composerText, exportLang, messages, settings, systemInstruction]
  );

  const navItems: Array<{ id: StudioMode; icon: any; labelAr: string; labelEn: string }> = [
    { id: "create_chat", icon: MessageSquare, labelAr: "المحادثة (Chat)", labelEn: "Chat" },
    { id: "build", icon: Code2, labelAr: "المحرر (Build)", labelEn: "Build App" },
    { id: "create_freeform", icon: Sparkles, labelAr: "نص حر (Freeform)", labelEn: "Freeform" },
    { id: "stream_realtime", icon: Video, labelAr: "البث الحي", labelEn: "Realtime" },
    { id: "compare", icon: Layers, labelAr: "مقارنة النماذج", labelEn: "Compare" },
    { id: "starter_apps", icon: Bot, labelAr: "القوالب", labelEn: "Templates" },
    { id: "api_keys", icon: KeyRound, labelAr: "مفاتيح API", labelEn: "API Keys" },
    { id: "team_collab", icon: Users, labelAr: "الفريق", labelEn: "Collab" },
    { id: "offline_vault", icon: WifiOff, labelAr: "الأوفلاين", labelEn: "Offline" },
  ];

  const accentBgClass = "bg-white/[0.08] border-white/[0.12] text-white";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        backgroundColor: appearance.backgroundHex,
        color: appearance.foregroundHex,
      }}
      className="h-screen w-full overflow-hidden flex flex-col select-none"
    >
      {/* TOP HEADER BAR — Calm Antigravity IDE Chrome */}
      <header className="h-12 shrink-0 border-b border-white/[0.07] px-3 sm:px-4 flex items-center justify-between gap-2 bg-[#141416]">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setMobileLeftOpen((p) => !p);
              } else {
                setLeftOpen((p) => !p);
              }
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <Link href={`/${locale}/zebra-x`} className="flex items-center gap-2 shrink-0">
            <HeyukaLoopMark size="sm" variant={brand === "kaspi_pos" ? "monochrome" : "crimson"} />
            <span className="font-semibold text-xs tracking-tight text-zinc-200 hidden sm:inline">
              {brand === "kaspi_pos" ? "KASPI Studio" : "HEYUKA Studio"}
            </span>
          </Link>

          {/* Calm Dual-Brand Switcher Pill */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[11px] font-medium">
            <button
              type="button"
              onClick={() => switchBrand("heyuka")}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                brand === "heyuka" ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              HEYUKA
            </button>
            <button
              type="button"
              onClick={() => switchBrand("kaspi_pos")}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                brand === "kaspi_pos" ? "bg-white/[0.1] text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Store className="w-3 h-3" />
              <span>KASPI POS</span>
            </button>
          </div>

          <span className="hidden xl:inline-flex text-[10px] font-mono text-zinc-500">
            {saveBadge}
          </span>
        </div>

        {/* Quiet Top Toolbar Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setGetCodeOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Get code</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("api_keys")}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
            <span>API Keys</span>
          </button>

          <button
            type="button"
            onClick={() => setAppearanceOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white cursor-pointer"
            title="Settings & Appearance"
          >
            <span
              style={{ backgroundColor: appearance.accentHex }}
              className="w-2 h-2 rounded-full shrink-0"
            />
            <span>Settings</span>
          </button>

          <LanguageSwitcher />
          <KaspiThemeToggle />

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                setMobileRightOpen((p) => !p);
              } else {
                setRightOpen((p) => !p);
              }
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer inline-flex items-center gap-1"
            title="Toggle Settings Panel"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {shareToast && (
        <div className="px-4 py-1.5 bg-[#18181B] border-b border-white/[0.08] text-xs text-zinc-200 font-medium text-center">
          {shareToast}
        </div>
      )}

      {/* 3-PANE RESIZABLE WORKSPACE */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT PANE: 5 Core Modes + Dual-Brand Nav */}
        {leftOpen && (
          <>
            <nav
              style={{ width: leftWidthPx }}
              className="shrink-0 hidden md:flex flex-col justify-between border-e border-white/[0.07] bg-[#141416] p-2.5 overflow-y-auto kaspi-no-scrollbar"
            >
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setMode("create_chat");
                  }}
                  className="w-full mb-2.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-xs font-medium text-zinc-200 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{isAr ? "محادثة جديدة" : "New Conversation"}</span>
                </button>

                {navItems.slice(0, 7).map((item) => {
                  const Icon = item.icon;
                  const active = mode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                        active ? "bg-white/[0.09] text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-[#007ACC]" : "text-zinc-500"}`} />
                      <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                    </button>
                  );
                })}

                <div className="pt-2 mt-2 border-t border-white/[0.06] space-y-0.5">
                  {navItems.slice(7).map((item) => {
                    const Icon = item.icon;
                    const active = mode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMode(item.id)}
                        className={`w-full px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                          active ? "bg-white/[0.09] text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/[0.07] space-y-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAppearanceOpen(true)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>{isAr ? "الإعدادات والمظهر" : "Settings"}</span>
                </button>
                <div className="flex gap-1 px-1">
                  <Link href={`/${locale}/chat`} className="flex-1 text-center py-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors">
                    Chat
                  </Link>
                  <Link href={`/${locale}/dashboard`} className="flex-1 text-center py-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors">
                    POS
                  </Link>
                </div>
              </div>
            </nav>

            {/* Drag Handle Left */}
            <div
              onMouseDown={() => { dragTargetRef.current = "left"; }}
              className="hidden md:block w-1 shrink-0 bg-transparent hover:bg-[#007ACC]/60 cursor-col-resize transition-colors"
            />
          </>
        )}

        {/* CENTER PLAYGROUND / BUILD / REALTIME / COMPARE / COLLAB STAGE */}
        <main style={{ backgroundColor: appearance.backgroundHex }} className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Mobile Horizontal Mode Switcher */}
          <div className="flex md:hidden gap-1.5 p-2 border-b border-white/10 overflow-x-auto kaspi-no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                  mode === item.id ? accentBgClass : "bg-white/[0.06]"
                }`}
              >
                {isAr ? item.labelAr : item.labelEn}
              </button>
            ))}
          </div>

          {mode === "create_chat" || mode === "create_freeform" ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Collapsible System Instructions Drawer */}
              <div className="border-b border-white/10 bg-[#18191E]/60">
                <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSysOpen((p) => !p)}
                    className="flex items-center gap-2 text-xs font-bold cursor-pointer"
                  >
                    {sysOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span>System Instructions</span>
                  </button>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setSystemInstruction(e.target.value);
                    }}
                    className="px-2 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[11px]"
                  >
                    <option value="">Presets &amp; Saved Instructions...</option>
                    {savedSystemPresets.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                {sysOpen && (
                  <div className="px-4 pb-3">
                    <textarea
                      rows={2}
                      value={systemInstruction}
                      onChange={(e) => setSystemInstruction(e.target.value)}
                      placeholder="Set model persona, constraints, or tone..."
                      className="w-full p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs resize-y focus:outline-none focus:border-sky-400/50"
                    />
                  </div>
                )}
              </div>

              {/* Few-Shot Examples Builder when in Freeform mode */}
              {mode === "create_freeform" && (
                <div className="p-3 border-b border-white/10 bg-white/[0.02] space-y-2 max-h-44 overflow-y-auto">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Few-Shot Examples (Input -&gt; Output Pairs)</span>
                    <button
                      type="button"
                      onClick={() => setFewShotPairs((p) => [...p, { id: `fs_${Date.now()}`, input: "", output: "" }])}
                      className="px-2 py-0.5 rounded bg-white/10 text-[11px] cursor-pointer"
                    >
                      + Add Example
                    </button>
                  </div>
                  {fewShotPairs.map((pair) => (
                    <div key={pair.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={pair.input}
                        onChange={(e) =>
                          setFewShotPairs((prev) => prev.map((x) => (x.id === pair.id ? { ...x, input: e.target.value } : x)))
                        }
                        placeholder="Example input..."
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs"
                      />
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={pair.output}
                          onChange={(e) =>
                            setFewShotPairs((prev) => prev.map((x) => (x.id === pair.id ? { ...x, output: e.target.value } : x)))
                          }
                          placeholder="Expected output..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setFewShotPairs((prev) => prev.filter((x) => x.id !== pair.id))}
                          className="px-2 text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {messages.length === 0 && (
                  <div className="max-w-xl mx-auto text-center py-10 space-y-4">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#F7EAEA]">
                      {isAr ? "ماذا نبني اليوم؟" : "Start building cleanly"}
                    </h1>
                    <p className="text-xs text-zinc-400">
                      {brand === "kaspi_pos"
                        ? "KASPI POS retail analytics, receipts, and store automation — all from one quiet prompt."
                        : "Write code, design UI, or trigger multi-agent workflows automatically behind one prompt."}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {STUDIO_STARTER_TEMPLATES.filter((t) => t.brand === brand).slice(0, 3).map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setSystemInstruction(tpl.systemInstruction);
                            setComposerText(tpl.prompt);
                            setSettings((s) => ({ ...s, elasticScale: tpl.scale }));
                            if (tpl.mode === "build") setMode("build");
                          }}
                          className="px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        >
                          {isAr ? tpl.titleAr : tpl.titleEn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={msg.id} className="max-w-4xl mx-auto space-y-2 rounded-2xl p-4 bg-white/[0.03] border border-white/10">
                    {/* Role Header + Per-Message Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-bold">
                        <span className={msg.role === "user" ? "text-zinc-200" : brand === "kaspi_pos" ? "text-emerald-300" : "text-sky-300"}>
                          {msg.role === "user" ? "User" : "Model (HEYUKA)"}
                        </span>
                        {msg.latencyMs && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">
                            ⏱ {(msg.latencyMs / 1000).toFixed(2)}s • ⚡ {msg.tokPerSec} tok/s • 🪙 {msg.tokensOut} tok
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {msg.role === "assistant" && (
                          <select
                            value={msg.viewMode || "markdown"}
                            onChange={(e) =>
                              setMessages((prev) =>
                                prev.map((x) => (x.id === msg.id ? { ...x, viewMode: e.target.value as StudioMessage["viewMode"] } : x))
                              )
                            }
                            className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px]"
                          >
                            <option value="markdown">Markdown</option>
                            <option value="raw">Raw</option>
                            <option value="json">JSON</option>
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMsgId(msg.id);
                            setEditingDraft(msg.content);
                          }}
                          className="p-1 rounded hover:bg-white/10 cursor-pointer"
                          title="Edit / Branch from here"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {msg.role === "user" && (
                          <button
                            type="button"
                            onClick={() => handleRunPrompt(msg.content, messages.slice(0, idx))}
                            className="p-1 rounded hover:bg-white/10 cursor-pointer"
                            title="Rerun / Branch from turn"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(msg.content)}
                          className="p-1 rounded hover:bg-white/10 cursor-pointer"
                          title="Copy"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMessages((prev) => prev.filter((x) => x.id !== msg.id))}
                          className="p-1 rounded hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                          title="Delete Turn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Thinking Process Accordion */}
                    {msg.thoughts && (
                      <div className="rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedThoughts((p) => ({ ...p, [msg.id]: !p[msg.id] }))}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold text-zinc-300 cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Thinking Process • {msg.thinkingSeconds}s</span>
                          </span>
                          {expandedThoughts[msg.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                        {expandedThoughts[msg.id] && (
                          <div className="px-3 pb-2.5 text-[11px] font-mono text-zinc-400 border-t border-white/10 pt-2">
                            {msg.thoughts}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Body or Inline Edit */}
                    {editingMsgId === msg.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={editingDraft}
                          onChange={(e) => setEditingDraft(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMsgId(null);
                              if (msg.role === "user") {
                                handleRunPrompt(editingDraft, messages.slice(0, idx));
                              } else {
                                setMessages((prev) => prev.map((x) => (x.id === msg.id ? { ...x, content: editingDraft } : x)));
                              }
                            }}
                            className="px-3 py-1 rounded-lg kaspi-primary-cta-btn text-xs font-bold cursor-pointer"
                          >
                            {msg.role === "user" ? "Branch & Rerun" : "Save Edit"}
                          </button>
                          <button type="button" onClick={() => setEditingMsgId(null)} className="px-3 py-1 rounded-lg bg-white/10 text-xs cursor-pointer">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed font-sans text-zinc-100">
                        {msg.viewMode === "json" ? JSON.stringify(msg, null, 2) : msg.content}
                      </pre>
                    )}

                    {/* Search Chips, Grounding Maps & Code Files */}
                    {msg.searchQueries && msg.searchQueries.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                        <span className="text-zinc-400">Search Queries:</span>
                        {msg.searchQueries.map((sq) => (
                          <span key={sq} className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 font-mono">
                            🔍 {sq}
                          </span>
                        ))}
                        {settings.groundingMapsEnabled && (
                          <a
                            href="https://www.openstreetmap.org/?mlat=35.1688&mlon=-2.9335#map=13/35.1688/-2.9335"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 inline-flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>OpenStreetMap Grounding</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Function Calling Interactive Tool Response Loop */}
                    {msg.functionCall && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] space-y-1.5">
                        <div className="font-mono font-bold text-amber-300">
                          Function Call: {msg.functionCall.name}({JSON.stringify(msg.functionCall.args)})
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleRunPrompt(
                              `Function response for ${msg.functionCall?.name}: {"status":"ok","revenueTtcMad":12570,"topItem":"Espresso"}`
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 font-bold cursor-pointer"
                        >
                          Send Tool Result to Continue Loop
                        </button>
                      </div>
                    )}

                    {msg.codeFiles && msg.codeFiles.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-emerald-300">
                            {msg.codeFiles.length} file(s) changed (+
                            {msg.codeFiles.reduce((s, f) => s + f.content.split(/\r?\n/).length, 0)} lines)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setStudioFiles(msg.codeFiles!);
                              setFocusFilePath(msg.codeFiles![0]?.path || null);
                              setMode("build");
                            }}
                            style={{ borderColor: appearance.accentHex }}
                            className="px-3 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border text-white text-[11px] font-bold cursor-pointer"
                          >
                            Review &amp; Preview →
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.codeFiles.map((cf) => {
                            const meta = getFileBadgeMeta(cf.path, cf.language);
                            return (
                              <button
                                key={cf.path}
                                type="button"
                                onClick={() => {
                                  setStudioFiles(msg.codeFiles!);
                                  setFocusFilePath(cf.path);
                                  setMode("build");
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-[11px] font-mono cursor-pointer transition-colors"
                              >
                                <span
                                  style={{ color: meta.color, backgroundColor: meta.bg }}
                                  className="px-1 rounded text-[8px] font-black"
                                >
                                  {meta.extLabel}
                                </span>
                                <span className="text-zinc-200">{cf.path}</span>
                                <span className="text-emerald-400 text-[10px]">
                                  +{cf.content.split(/\r?\n/).length}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Antigravity Status Bar (only shown while running or active thread) + Composer */}
              <div className="p-3 sm:p-4 border-t border-white/[0.07] bg-[#141416] space-y-2">
                {(isRunning || messages.length > 0) && studioFiles.length > 0 && (
                  <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#18181B] border border-white/[0.07] text-[11px]">
                    <div className="flex items-center gap-3">
                      {isRunning ? (
                        <span className="inline-flex items-center gap-1.5 text-zinc-200 font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#007ACC]" />
                          <span>Running task...</span>
                        </span>
                      ) : (
                        <span className="font-mono text-zinc-400">
                          {studioFiles.length} files changed +
                          {studioFiles.reduce((acc, f) => acc + f.content.split(/\r?\n/).length, 0)} -0
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMode("build")}
                        className="px-2.5 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] font-medium text-zinc-200 cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                )}

                {mentionPickerOpen && (
                  <div className="max-w-4xl mx-auto flex flex-wrap gap-1.5 px-2 py-1.5 rounded-xl bg-[#18181B] border border-white/[0.08] text-[11px]">
                    {[
                      "@elastic_12x ",
                      "@kaspi_pos ",
                      "@18_clusters ",
                      "@pc_bot_farm ",
                      "/magic ",
                      "/sandbox ",
                      "/browser ",
                      "/offline ",
                    ].map((tok) => (
                      <button
                        key={tok}
                        type="button"
                        onClick={() => {
                          setComposerText((p) => `${p}${p ? " " : ""}${tok}`);
                          setMentionPickerOpen(false);
                        }}
                        className="px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/[0.12] font-mono cursor-pointer text-zinc-300"
                      >
                        {tok.trim()}
                      </button>
                    ))}
                  </div>
                )}

                <div className="max-w-4xl mx-auto rounded-2xl bg-[#161618] border border-white/[0.09] p-3 space-y-2.5">
                  {/* Attachment Chips + Video Clipping/FPS Controls */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att) => (
                        <div key={att.id} className="px-2.5 py-1.5 rounded-xl bg-white/[0.08] border border-white/15 flex items-center gap-2 text-[11px]">
                          {att.dataUrl && att.mimeType.startsWith("image/") && (
                            <img src={att.dataUrl} alt={att.name} className="w-7 h-7 rounded object-cover" />
                          )}
                          <span className="font-mono truncate max-w-[140px]">{att.name}</span>
                          {(att.mimeType.startsWith("video/") || att.mimeType.startsWith("audio/")) && (
                            <span className="font-mono text-[10px] text-sky-300">
                              Clip {att.clipStartSec}s-{att.clipEndSec}s @ {att.fps}fps
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setAttachments((p) => p.filter((x) => x.id !== att.id))}
                            className="text-rose-400 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Auto URL Context Chips */}
                  {settings.urlContextEnabled && detectedUrlsInComposer.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {detectedUrlsInComposer.map((u) => (
                        <span key={u} className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono">
                          🔗 URL Context: {u.slice(0, 48)}
                        </span>
                      ))}
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onPaste={(e) => {
                      const items = Array.from(e.clipboardData?.items || []);
                      const filesFromPaste = items.map((it) => it.getAsFile()).filter(Boolean) as File[];
                      if (filesFromPaste.length > 0) {
                        const dt = new DataTransfer();
                        filesFromPaste.forEach((f) => dt.items.add(f));
                        handleAttachFiles(dt.files);
                      }
                    }}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        handleRunPrompt();
                      }
                    }}
                    placeholder={
                      isAr
                        ? "اكتب طلبك هنا (يدعم لصق الصور Ctrl+V، الروابط، العربية/الدارجة، و Ctrl+Enter للإرسال)..."
                        : "Type prompt, paste screenshot (Ctrl+V), or drop URLs — press Ctrl+Enter to Run..."
                    }
                    className="w-full bg-transparent text-xs sm:text-sm resize-y focus:outline-none text-white"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
                    <div className="relative flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPlusMenuOpen((p) => !p)}
                        className="p-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] cursor-pointer"
                        title="Add Media / Files / Samples"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      {plusMenuOpen && (
                        <div className="absolute bottom-11 start-0 w-56 p-1.5 rounded-xl bg-[#202229] border border-white/15 shadow-xl space-y-1 z-30 text-xs">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Upload Image, Video, Audio, PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPlusMenuOpen(false); setMode("stream_realtime"); }}
                            className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Webcam &amp; Screen Share</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPlusMenuOpen(false);
                              setComposerText("Analyze ASIMA POS daily turnover: 8,420 MAD Cash + 4,150 MAD TPE Card, compute clean TTC margin and suggest 3 optimizations.");
                            }}
                            className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                          >
                            <Store className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Insert Sample KASPI POS</span>
                          </button>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleAttachFiles(e.target.files)}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                          if (!SR) return;
                          const rec = new SR();
                          rec.lang = isAr ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-US";
                          setIsMicListening(true);
                          rec.onresult = (ev: any) => {
                            const txt = ev.results?.[0]?.[0]?.transcript || "";
                            if (txt) setComposerText((prev) => `${prev} ${txt}`.trim());
                          };
                          rec.onend = () => setIsMicListening(false);
                          rec.start();
                        }}
                        className={`p-2 rounded-xl cursor-pointer ${isMicListening ? "bg-rose-500/30 text-rose-300" : "bg-white/[0.06] hover:bg-white/[0.12]"}`}
                        title="Voice Dictation"
                      >
                        {isMicListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      <span className="text-[10px] font-mono text-zinc-400 px-2">
                        {estimateTokenCount(composerText)} tok
                      </span>

                      <button
                        type="button"
                        disabled={enhancingMagic || !composerText.trim()}
                        onClick={async () => {
                          if (!composerText.trim()) return;
                          setEnhancingMagic(true);
                          try {
                            const mRes = await fetch("/api/v1/magic", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                prompt: composerText,
                                brand,
                                scale: settings.elasticScale,
                                locale,
                                enhanceOnly: true,
                              }),
                            });
                            const md = await mRes.json();
                            if (md?.ok && md?.enhancedPrompt) {
                              setComposerText(md.enhancedPrompt);
                              setShareToast(
                                `Magic Spec Ready (${md.strictDisambiguation?.categoryCode || "OMNI"} • ${md.swarmPlan?.nodes?.length || 3}x Swarm)`
                              );
                              setTimeout(() => setShareToast(null), 2600);
                            }
                          } catch {} finally {
                            setEnhancingMagic(false);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-transparent hover:bg-white/[0.07] text-[11px] font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-colors"
                        title="Refine prompt (/api/v1/magic)"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{enhancingMagic ? "Refining..." : "Enhance"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMentionPickerOpen((p) => !p)}
                        className="px-2 py-1 rounded-lg bg-transparent hover:bg-white/[0.07] text-[11px] font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors"
                        title="@ mentions & / actions"
                      >
                        @ /
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isRunning || !composerText.trim()}
                      onClick={() => handleRunPrompt()}
                      style={{ backgroundColor: composerText.trim() && !isRunning ? appearance.accentHex : undefined }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                        composerText.trim() && !isRunning
                          ? "text-white hover:opacity-90"
                          : "bg-white/[0.06] text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isAr ? "تشغيل" : "Run"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Specialized Full/Bottom Workbench Container */}
          <div className={mode === "create_chat" || mode === "create_freeform" ? "shrink-0" : "flex-1 min-h-0"}>
            <StudioWorkbenchTabs
              mode={mode}
              brand={brand}
              locale={locale}
              files={studioFiles}
              onChangeFiles={setStudioFiles}
              checkpoints={checkpoints}
              onSaveCheckpoint={(label) =>
                setCheckpoints((prev) => [{ id: `cp_${Date.now()}`, label, at: new Date().toISOString(), files: studioFiles }, ...prev.slice(0, 9)])
              }
              onRestoreCheckpoint={(id) => {
                const found = checkpoints.find((c) => c.id === id);
                if (found) setStudioFiles(found.files);
              }}
              onRunPromptFromChild={(txt) => {
                setMode("create_chat");
                handleRunPrompt(txt);
              }}
              onSelectTemplate={(tpl) => {
                switchBrand(tpl.brand);
                setSystemInstruction(tpl.systemInstruction);
                setComposerText(tpl.prompt);
                setSettings((s) => ({ ...s, elasticScale: tpl.scale }));
                setMode(tpl.mode);
              }}
              onInjectContextText={(label, txt) => {
                setContextCaches((p) => [
                  { id: `cache_${Date.now()}`, label, content: txt, ttlHours: 24, tokensEstimate: estimateTokenCount(txt), createdAt: new Date().toISOString() },
                  ...p,
                ]);
              }}
              onCaptureFrameToChat={(dataUrl, caption) => {
                setAttachments((p) => [
                  ...p,
                  { id: `frame_${Date.now()}`, name: "live-frame.jpg", mimeType: "image/jpeg", sizeBytes: dataUrl.length, dataUrl },
                ]);
                setComposerText(caption);
                setMode("create_chat");
              }}
              councilData={councilData}
              onTriggerCouncil={triggerCouncilRun}
              focusFilePath={focusFilePath}
              appearance={{
                backgroundHex: appearance.backgroundHex,
                foregroundHex: appearance.foregroundHex,
                accentHex: appearance.accentHex,
                contrastMode: appearance.contrast,
              }}
            />
          </div>
        </main>

        {/* Drag Handle Right */}
        {rightOpen && (
          <>
            <div
              onMouseDown={() => { dragTargetRef.current = "right"; }}
              className="hidden lg:block w-1 shrink-0 bg-white/[0.04] hover:bg-sky-400/60 cursor-col-resize transition-colors"
            />
            <div style={{ width: rightWidthPx }} className="shrink-0 hidden lg:block border-s border-white/10 bg-[#18191E]/75">
              <StudioRightRunSettings
                brand={brand}
                locale={locale}
                settings={settings}
                onChange={setSettings}
                systemInstruction={systemInstruction}
                historyTokens={historyTokens}
                filesTokens={filesTokens}
                promptTokens={estimateTokenCount(composerText)}
                contextCaches={contextCaches}
                onAddCache={(c) => setContextCaches((p) => [c, ...p])}
                onRemoveCache={(id) => setContextCaches((p) => p.filter((x) => x.id !== id))}
              />
            </div>
          </>
        )}
      </div>

      {/* GET CODE MODAL (<KaspiGlassModalPortal>) */}
      <KaspiGlassModalPortal isOpen={getCodeOpen} onClose={() => setGetCodeOpen(false)}>
        <div className="kaspi-opaque-glass-modal max-w-3xl w-full rounded-2xl p-5 border border-white/15 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>Get Code (Exact Studio Setup -&gt; Production SDK)</span>
            </div>
            <button type="button" onClick={() => setGetCodeOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(["python", "typescript", "javascript", "curl", "rest_json"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setExportLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                  exportLang === lang ? accentBgClass + " border" : "bg-white/[0.06]"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <pre className="p-4 rounded-xl bg-[#131314] border border-white/10 text-xs font-mono overflow-auto max-h-80 text-zinc-200">
            {exportSnippet}
          </pre>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(exportSnippet)}
              className="px-4 py-2 rounded-xl kaspi-primary-cta-btn text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy SDK Code</span>
            </button>
          </div>
        </div>
      </KaspiGlassModalPortal>

      {/* CTRL+K COMMAND PALETTE MODAL */}
      <KaspiGlassModalPortal isOpen={cmdkOpen} onClose={() => setCmdkOpen(false)}>
        <div className="kaspi-opaque-glass-modal max-w-lg w-full rounded-2xl p-4 border border-white/15 space-y-3">
          <input
            type="text"
            autoFocus
            value={cmdkQuery}
            onChange={(e) => setCmdkQuery(e.target.value)}
            placeholder="Jump to mode, switch brand, toggle Ollama..."
            className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs focus:outline-none"
          />
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {navItems
              .filter((i) => `${i.labelEn} ${i.labelAr}`.toLowerCase().includes(cmdkQuery.toLowerCase()))
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setMode(item.id); setCmdkOpen(false); }}
                  className="w-full text-start px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold flex items-center justify-between cursor-pointer"
                >
                  <span>{isAr ? item.labelAr : item.labelEn}</span>
                  <span className="font-mono text-[10px] text-zinc-400">{item.id}</span>
                </button>
              ))}
          </div>
        </div>
      </KaspiGlassModalPortal>

      {/* KEYBOARD SHORTCUTS ? MODAL */}
      <KaspiGlassModalPortal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)}>
        <div className="kaspi-opaque-glass-modal max-w-md w-full rounded-2xl p-5 border border-white/15 space-y-3 text-xs">
          <div className="flex items-center justify-between font-bold text-sm">
            <span>Studio Keyboard Shortcuts</span>
            <button type="button" onClick={() => setShortcutsOpen(false)} className="p-1 rounded hover:bg-white/10 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2 font-mono">
            <div className="flex justify-between"><span>Run Prompt</span><span className="px-2 py-0.5 rounded bg-white/10">Ctrl + Enter</span></div>
            <div className="flex justify-between"><span>Command Palette</span><span className="px-2 py-0.5 rounded bg-white/10">Ctrl + K</span></div>
            <div className="flex justify-between"><span>Paste Screenshot</span><span className="px-2 py-0.5 rounded bg-white/10">Ctrl + V</span></div>
            <div className="flex justify-between"><span>Shortcut Sheet</span><span className="px-2 py-0.5 rounded bg-white/10">?</span></div>
          </div>
        </div>
      </KaspiGlassModalPortal>

      {/* MOBILE / TABLET LEFT NAVIGATION DRAWER (<KaspiGlassModalPortal>) */}
      <KaspiGlassModalPortal isOpen={mobileLeftOpen} onClose={() => setMobileLeftOpen(false)}>
        <div className="kaspi-opaque-glass-modal max-w-xs w-full rounded-2xl p-4 border border-white/15 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold pb-2 border-b border-white/10">
            <span>{brand === "kaspi_pos" ? "KASPI POS Studio" : "HEYUKA Studio"}</span>
            <button type="button" onClick={() => setMobileLeftOpen(false)} className="p-1 rounded hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMode(item.id);
                  setMobileLeftOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                  active ? `${accentBgClass} border` : "text-zinc-300 hover:bg-white/[0.06]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
              </button>
            );
          })}
        </div>
      </KaspiGlassModalPortal>

      {/* MOBILE / TABLET RUN SETTINGS DRAWER (<KaspiGlassModalPortal>) */}
      <KaspiGlassModalPortal isOpen={mobileRightOpen} onClose={() => setMobileRightOpen(false)}>
        <div className="kaspi-opaque-glass-modal max-w-sm w-full rounded-2xl border border-white/15 overflow-hidden max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 text-xs font-bold">
            <span>Run Settings &amp; Elastic 3/6/12 Swarm</span>
            <button type="button" onClick={() => setMobileRightOpen(false)} className="p-1 rounded hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            <StudioRightRunSettings
              brand={brand}
              locale={locale}
              settings={settings}
              onChange={setSettings}
              systemInstruction={systemInstruction}
              historyTokens={historyTokens}
              filesTokens={filesTokens}
              promptTokens={estimateTokenCount(composerText)}
              contextCaches={contextCaches}
              onAddCache={(c) => setContextCaches((p) => [c, ...p])}
              onRemoveCache={(id) => setContextCaches((p) => p.filter((x) => x.id !== id))}
            />
          </div>
        </div>
      </KaspiGlassModalPortal>

      {/* APPEARANCE & CODE THEME PICKER MODAL (Antigravity Style #101010 / #F7EAEA / #007ACC) */}
      <KaspiGlassModalPortal isOpen={appearanceOpen} onClose={() => setAppearanceOpen(false)}>
        <div
          style={{ backgroundColor: "#141416", color: "#F7EAEA" }}
          className="max-w-xl w-full rounded-xl border border-white/[0.1] overflow-hidden shadow-2xl text-xs"
        >
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between font-semibold text-sm">
            <span>Settings</span>
            <button type="button" onClick={() => setAppearanceOpen(false)} className="p-1 rounded hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row min-h-[280px]">
            <div className="sm:w-40 shrink-0 border-b sm:border-b-0 sm:border-e border-white/[0.07] p-2.5 space-y-1 bg-[#101010]/60">
              <div className="px-2.5 py-1.5 rounded-md bg-white/[0.08] text-white font-medium">Appearance</div>
              <button
                type="button"
                onClick={() => { setAppearanceOpen(false); setShortcutsOpen(true); }}
                className="w-full text-start px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] cursor-pointer"
              >
                Shortcuts
              </button>
              <button
                type="button"
                onClick={() => { setAppearanceOpen(false); setRightOpen(true); }}
                className="w-full text-start px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] cursor-pointer"
              >
                Models &amp; Swarm
              </button>
            </div>

            <div className="flex-1 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Default Dark", backgroundHex: "#101010", foregroundHex: "#F7EAEA", accentHex: "#007ACC" },
                  { name: "Deep Slate", backgroundHex: "#131314", foregroundHex: "#F4F4F5", accentHex: "#38BDF8" },
                ].map((pre) => (
                  <button
                    key={pre.name}
                    type="button"
                    onClick={() =>
                      updateAppearance({
                        ...appearance,
                        preset: pre.name,
                        backgroundHex: pre.backgroundHex,
                        foregroundHex: pre.foregroundHex,
                        accentHex: pre.accentHex,
                      })
                    }
                    className={`px-3 py-2 rounded-lg border text-start flex items-center justify-between cursor-pointer ${
                      appearance.preset === pre.name ? "border-[#007ACC] bg-white/[0.08] font-medium" : "border-white/[0.08] bg-white/[0.03]"
                    }`}
                  >
                    <span>{pre.name}</span>
                    <span style={{ backgroundColor: pre.accentHex }} className="w-3 h-3 rounded-full" />
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-medium">Contrast</span>
                <div className="inline-flex rounded-lg bg-white/[0.04] p-0.5 border border-white/[0.08]">
                  {(["default", "strong"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateAppearance({ ...appearance, contrast: c })}
                      className={`px-3 py-1 rounded-md capitalize font-medium cursor-pointer ${
                        appearance.contrast === c ? "bg-white/[0.12] text-white" : "text-zinc-400"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
                {[
                  { key: "backgroundHex" as const, label: "Background" },
                  { key: "foregroundHex" as const, label: "Foreground" },
                  { key: "accentHex" as const, label: "Accent" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">{item.label}</span>
                    <label className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] cursor-pointer font-mono text-[11px]">
                      <input
                        type="color"
                        value={appearance[item.key]}
                        onChange={(e) => updateAppearance({ ...appearance, [item.key]: e.target.value.toUpperCase() })}
                        className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span>{appearance[item.key]}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </KaspiGlassModalPortal>
    </div>
  );
}
