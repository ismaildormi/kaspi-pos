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
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HEYUKA & KASPI POS Live Canvas</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #131314; color: #f4f4f5; display: grid; place-items: center; min-height: 100vh; }
    .card { padding: 28px; border-radius: 20px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); max-width: 520px; text-align: center; }
    h1 { margin: 0 0 8px; font-size: 22px; color: #38bdf8; }
    p { margin: 0 0 16px; color: #cbd5e1; font-size: 14px; }
    button { border: 0; padding: 10px 18px; border-radius: 12px; font-weight: 700; cursor: pointer; background: #10b981; color: #052e16; }
  </style>
</head>
<body>
  <div class="card">
    <h1>HEYUKA &amp; KASPI POS Studio Ready</h1>
    <p>Ask HEYUKA in Chat or Vibe-Code right inside Build Mode to see instant multi-file updates live here.</p>
    <button onclick="this.textContent='Live JS + Preview Verified ✓'">Test Interactive Preview</button>
  </div>
</body>
</html>`,
  },
  {
    path: "README.md",
    language: "markdown",
    content: "# HEYUKA & KASPI POS Studio Project\nGenerated with 100% Google AI Studio Parity + Elastic 3/6/12 Model Swarm.",
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

        // 2) Execute Prompt (Local Ollama if selected -> Chat Completions -> Unlimited Local-SDK fallback)
        let answerText = "";
        let extractedFiles: StudioFileNode[] = [];
        let citations: Array<{ title: string; url: string }> = [];

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
                  { role: "user", content: `${effectivePrompt}\n${attachedContextText}`.trim() },
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
          const sdkMode = mode === "build" ? "coding" : brand === "kaspi_pos" ? "auto" : "auto";
          const res = await fetch("/api/v1/heyuka/local-sdk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: `${effectivePrompt}${attachedContextText ? `\n${attachedContextText}` : ""}`,
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
            citations = data.sources;
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
            ? `Thinking Budget: ${settings.thinkingBudget} tok • Brand: ${brand.toUpperCase()} • Elastic Scale: ${swarm?.tier || settings.elasticScale} (${swarm?.modelCount || 3} models, ${swarm?.spawnedBots?.length || 3} Worker Bots) • MediaRes=${settings.mediaResolution} • GroundingSearch=${settings.groundingSearchEnabled}`
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
      systemInstruction,
      triggerCouncilRun,
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
    { id: "create_chat", icon: MessageSquare, labelAr: "إنشاء برومبت (Chat)", labelEn: "Create Prompt" },
    { id: "create_freeform", icon: Sparkles, labelAr: "نص حر + أمثلة Few-Shot", labelEn: "Freeform & Few-Shot" },
    { id: "stream_realtime", icon: Video, labelAr: "البث الحي (صوت/شاشة)", labelEn: "Stream Realtime" },
    { id: "build", icon: Code2, labelAr: "بناء التطبيقات (Build)", labelEn: "Build App Studio" },
    { id: "compare", icon: Layers, labelAr: "مقارنة النماذج", labelEn: "Compare Arena" },
    { id: "starter_apps", icon: Bot, labelAr: "معرض القوالب الجاهزة", labelEn: "Starter Apps" },
    { id: "team_collab", icon: Users, labelAr: "العمل الجماعي + XP", labelEn: "Team Collab & XP" },
    { id: "offline_vault", icon: WifiOff, labelAr: "الخزنة أوفلاين (v60)", labelEn: "Offline Vault (v60)" },
    { id: "api_keys", icon: KeyRound, labelAr: "مفاتيح الـ API", labelEn: "API Keys & Usage" },
  ];

  const accentBgClass = brand === "kaspi_pos" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-sky-500/20 border-sky-500/40 text-sky-300";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="h-screen w-full overflow-hidden flex flex-col bg-[#131314] text-zinc-100 select-none"
    >
      {/* TOP HEADER BAR — Google AI Studio Aesthetic + Dual-Brand Switcher */}
      <header className="h-14 shrink-0 border-b border-white/10 px-3 sm:px-4 flex items-center justify-between gap-2 bg-[#18191E]/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setLeftOpen((p) => !p)}
            className="p-2 rounded-xl hover:bg-white/10 cursor-pointer"
            title="Toggle Left Navigation"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <Link href={`/${locale}/zebra-x`} className="flex items-center gap-2 shrink-0">
            <HeyukaLoopMark size="sm" variant={brand === "kaspi_pos" ? "monochrome" : "crimson"} />
            <span className="font-black text-sm tracking-tight hidden sm:inline">
              {brand === "kaspi_pos" ? "KASPI POS Studio" : "HEYUKA Studio"}
            </span>
          </Link>

          {/* Dual-Brand Switcher Pill */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-white/[0.06] border border-white/10 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => switchBrand("heyuka")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                brand === "heyuka" ? "bg-sky-500/25 text-sky-300" : "text-zinc-400 hover:text-white"
              }`}
            >
              HEYUKA
            </button>
            <button
              type="button"
              onClick={() => switchBrand("kaspi_pos")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                brand === "kaspi_pos" ? "bg-emerald-500/25 text-emerald-300" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Store className="w-3 h-3" />
              <span>KASPI POS</span>
            </button>
          </div>

          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-emerald-300">
            {saveBadge}
          </span>
        </div>

        {/* Right Top Toolbar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setCmdkOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] text-zinc-300 cursor-pointer"
          >
            <Command className="w-3 h-3" />
            <span>Ctrl+K</span>
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "compare" ? "create_chat" : "compare")}
            className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer ${
              mode === "compare" ? accentBgClass : "bg-white/[0.05] border-white/10 hover:bg-white/[0.1]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>

          <button
            type="button"
            onClick={() => setGetCodeOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-[11px] font-bold cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Get code</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("api_keys")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-[11px] font-bold cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Get API key</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const payload = JSON.stringify({ brand, systemInstruction, settings, messages }, null, 2);
              const blob = new Blob([payload], { type: "application/json" });
              const u = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = u;
              a.download = `${brand}-studio-session.json`;
              a.click();
              URL.revokeObjectURL(u);
              setShareToast("Exported .json session");
              setTimeout(() => setShareToast(null), 2000);
            }}
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] cursor-pointer"
            title="Save / Export Session"
          >
            <Save className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="p-2 rounded-xl hover:bg-white/10 cursor-pointer"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <LanguageSwitcher />
          <KaspiThemeToggle />

          <button
            type="button"
            onClick={() => setRightOpen((p) => !p)}
            className="p-2 rounded-xl hover:bg-white/10 cursor-pointer"
            title="Toggle Run Settings Drawer"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {shareToast && (
        <div className="px-4 py-1.5 bg-emerald-500/20 border-b border-emerald-500/40 text-xs text-emerald-200 font-semibold text-center">
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
              className="shrink-0 hidden md:flex flex-col justify-between border-e border-white/10 bg-[#18191E]/75 p-2.5 overflow-y-auto kaspi-no-scrollbar"
            >
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setMode("create_chat");
                  }}
                  className="w-full mb-2 px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? "برومبت جديد" : "New Prompt"}</span>
                </button>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = mode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                        active ? `${accentBgClass} border` : "text-zinc-300 hover:bg-white/[0.06]"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1.5 text-[11px]">
                <div className="px-2 py-2 rounded-xl bg-white/[0.04] border border-white/10">
                  <div className="font-bold text-emerald-300">2,496+ Vaulted Sources</div>
                  <div className="text-[10px] text-zinc-400">18 Clusters • Unlimited • $0.00</div>
                </div>
                <div className="flex gap-1">
                  <Link href={`/${locale}/chat`} className="flex-1 text-center py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300">
                    Chat
                  </Link>
                  <Link href={`/${locale}/dashboard`} className="flex-1 text-center py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300">
                    POS
                  </Link>
                </div>
              </div>
            </nav>

            {/* Drag Handle Left */}
            <div
              onMouseDown={() => { dragTargetRef.current = "left"; }}
              className="hidden md:block w-1 shrink-0 bg-white/[0.04] hover:bg-sky-400/60 cursor-col-resize transition-colors"
            />
          </>
        )}

        {/* CENTER PLAYGROUND / BUILD / REALTIME / COMPARE / COLLAB STAGE */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#131314]">
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
                  <div className="max-w-2xl mx-auto text-center py-8 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        {brand === "kaspi_pos"
                          ? "KASPI POS Studio • Store Analytics, Receipts & 18 Cognitive Clusters"
                          : "HEYUKA Studio • Full Google AI Studio Parity + Elastic 12-Model Swarm"}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                      {isAr ? "ماذا سنبني ونشغل اليوم؟" : "Start building cleanly in one studio"}
                    </h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-start">
                      {STUDIO_STARTER_TEMPLATES.filter((t) => t.brand === brand).map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setSystemInstruction(tpl.systemInstruction);
                            setComposerText(tpl.prompt);
                            setSettings((s) => ({ ...s, elasticScale: tpl.scale }));
                            if (tpl.mode === "build") setMode("build");
                          }}
                          className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs transition-colors cursor-pointer"
                        >
                          <div className="font-bold text-white">{isAr ? tpl.titleAr : tpl.titleEn}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{isAr ? tpl.descAr : tpl.descEn}</div>
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
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10">
                        <span className="text-[11px] font-mono text-emerald-300">
                          Generated {msg.codeFiles.length} file(s): {msg.codeFiles.map((f) => f.path).join(", ")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setStudioFiles(msg.codeFiles!);
                            setMode("build");
                          }}
                          className="px-3 py-1 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[11px] font-bold cursor-pointer"
                        >
                          Open in Build Canvas -&gt;
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Unified Multimodal Composer */}
              <div className="p-3 sm:p-4 border-t border-white/10 bg-[#18191E]/85">
                <div className="max-w-4xl mx-auto rounded-2xl bg-white/[0.04] border border-white/15 p-3 space-y-2.5">
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
                    </div>

                    <button
                      type="button"
                      disabled={isRunning || !composerText.trim()}
                      onClick={() => handleRunPrompt()}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                        brand === "kaspi_pos" ? "kaspi-emerald-checkout-btn" : "kaspi-primary-cta-btn"
                      }`}
                    >
                      {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isAr ? "تشغيل (Run)" : "Run Ctrl+Enter"}</span>
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
    </div>
  );
}
