"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  FileCode2,
  FolderGit2,
  Globe,
  Layers,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  PanelLeft,
  Paperclip,
  Pin,
  Plus,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Store,
  Terminal,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import Dexie from "dexie";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { HeyukaLoopMark } from "@/components/heyuka/HeyukaLoopMark";
import { HeyukaMarkdownMessage } from "@/components/heyuka/HeyukaMarkdownMessage";
import { useHybridDictation } from "@/lib/heyuka/use-hybrid-dictation";
import {
  STUDIO_STARTER_TEMPLATES,
  type StudioBrand,
  type StudioStarterTemplate,
  type SwarmCouncilNode,
  type WorkerBotExecution,
} from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";
import { StudioRightRunSettings } from "./StudioRightRunSettings";
import { StudioWorkbenchTabs, type AntigravityPaneTab } from "./StudioWorkbenchTabs";
import {
  DEFAULT_RUN_SETTINGS,
  estimateTokenCount,
  type AttachedMediaItem,
  type ContextCacheItem,
  type RightRunSettings,
  type StudioFileNode,
  type StudioMessage,
  type StudioModelId,
} from "./studio-types";

interface StudioThreadRecord {
  id: string;
  brand: StudioBrand;
  title: string;
  pinned?: boolean;
  updatedAt: string;
  messages: StudioMessage[];
  files?: StudioFileNode[];
}

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
    content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HEYUKA x KASPI Workspace</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="card">
    <h1>Antigravity Workspace Ready</h1>
    <p>Ask the agent to scaffold apps, analyze KASPI POS metrics, or verify scripts in Terminal.</p>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
  },
  {
    path: "styles.css",
    language: "css",
    content: `body { font-family: system-ui, -apple-system, sans-serif; background: #101010; color: #F7EAEA; margin: 0; display: grid; place-items: center; min-height: 100vh; }
.card { max-width: 560px; padding: 28px; border-radius: 14px; background: #161618; border: 1px solid rgba(255,255,255,0.1); }
h1 { margin: 0 0 8px; font-size: 20px; color: #F7EAEA; }
p { margin: 0; color: #A1A1AA; font-size: 14px; line-height: 1.5; }`,
  },
  {
    path: "app.js",
    language: "js",
    content: `console.log("Workspace initialized cleanly.");`,
  },
];

const DEFAULT_AUTOMATIONS = [
  {
    id: "auto_pos_audit",
    titleEn: "Daily KASPI POS Sales & Stock Check",
    titleAr: "تقرير المبيعات والمخزون اليومي لـ KASPI POS",
    prompt:
      "Generate a clean KASPI POS daily report covering Cash vs TPE Card split, TTC VAT summary, low stock alerts, and export checklist.",
  },
  {
    id: "auto_app_scaffold",
    titleEn: "Scaffold Full-Stack App + Tests",
    titleAr: "بناء تطبيق متكامل مع اختبارات التشغيل",
    prompt:
      "Build a responsive multi-file dashboard application (`index.html`, `styles.css`, `app.js`) with clean layout and interactive data table.",
  },
  {
    id: "auto_web_research",
    titleEn: "Live Web Research & Summary",
    titleAr: "بحث مباشر في الويب مع تلخيص المصادر",
    prompt: "Search the web for the latest Morocco retail e-invoicing and POS fiscal standards and summarize key points with sources.",
  },
];

const UNIFIED_MODELS: Array<{ id: StudioModelId; label: string }> = [
  { id: "heyuka-omni", label: "HEYUKA Omni (Unified)" },
  { id: "heyuka-core", label: "HEYUKA Core (Unified)" },
  { id: "heyuka-vision", label: "HEYUKA Vision (Unified)" },
  { id: "multi-agent-3", label: "Elastic Swarm (3-12x)" },
  { id: "kaspi-pos-analyst", label: "KASPI POS Specialist" },
];

export function HeyukaUnifiedStudioWorkspace({
  initialBrand = "heyuka",
}: {
  initialBrand?: StudioBrand;
}) {
  const localeRaw = useLocale();
  const locale: "ar" | "fr" | "en" = localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const isAr = locale === "ar";

  // Unified Antigravity Layout State (identical structure for HEYUKA & KASPI POS)
  const [brand, setBrand] = useState<StudioBrand>(initialBrand);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [rightTab, setRightTab] = useState<AntigravityPaneTab>("files");
  const [rightWidthPx, setRightWidthPx] = useState(520);
  const dragResizeRef = useRef(false);

  // Conversations & Active Session
  const [threads, setThreads] = useState<StudioThreadRecord[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>(`conv_${initialBrand}_default`);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [studioFiles, setStudioFiles] = useState<StudioFileNode[]>(STARTER_FILES);
  const [checkpoints, setCheckpoints] = useState<Array<{ id: string; label: string; at: string; files: StudioFileNode[] }>>([]);
  const [focusFilePath, setFocusFilePath] = useState<string | null>(null);
  const [changedDrawerOpen, setChangedDrawerOpen] = useState(false);

  // Agent & Customizations State
  const [settings, setSettings] = useState<RightRunSettings>(DEFAULT_RUN_SETTINGS);
  const [executionPolicy, setExecutionPolicy] = useState<"planning" | "fast" | "turbo">("planning");
  const [systemInstruction, setSystemInstruction] = useState<string>(
    initialBrand === "kaspi_pos"
      ? "You are KASPI POS AI Engineer inside Antigravity Studio. Assist with store analytics, TTC invoicing, inventory, 80mm ESC/POS receipts, and full project generation."
      : "You are HEYUKA AI Engineer inside Antigravity Studio. Build production software, analyze fetched links, verify commands, and organize sources autonomously."
  );

  // Composer State (Auto-growing textarea + attachments + hybrid Mic + @ / menus)
  const [composerText, setComposerText] = useState("");
  const [attachments, setAttachments] = useState<AttachedMediaItem[]>([]);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [policyMenuOpen, setPolicyMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runningSec, setRunningSec] = useState(0);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contextCaches, setContextCaches] = useState<ContextCacheItem[]>([]);
  const [councilData, setCouncilData] = useState<{
    tier: string;
    modelCount: number;
    complexityScore: number;
    nodes: SwarmCouncilNode[];
    spawnedBots: WorkerBotExecution[];
  } | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Antigravity Modals (Automations, Customizations, Settings) — all inside KaspiGlassModalPortal
  const [automationsOpen, setAutomationsOpen] = useState(false);
  const [customizationsOpen, setCustomizationsOpen] = useState(false);
  const [customTab, setCustomTab] = useState<"rules" | "engine">("rules");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<
    "general" | "appearance" | "shortcuts" | "models" | "projects"
  >("appearance");
  const [enhancingMagic, setEnhancingMagic] = useState(false);

  const [appearance, setAppearance] = useState<{
    themeMode: "light" | "dark";
    preset: string;
    contrast: "default" | "strong";
    backgroundHex: string;
    foregroundHex: string;
    accentHex: string;
  }>({
    themeMode: "dark",
    preset: "Default Dark",
    contrast: "default",
    backgroundHex: "#101010",
    foregroundHex: "#F7EAEA",
    accentHex: "#007ACC",
  });

  const dbRef = useRef<StudioLocalDexieDb | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Hybrid Voice Dictation (Web Speech API + MediaRecorder -> /api/ai/transcribe Whisper Darija fallback)
  const dictation = useHybridDictation({
    locale,
    onTranscript: useCallback((txt: string) => {
      setComposerText((prev) => (prev ? `${prev} ${txt}` : txt));
    }, []),
  });

  // Dynamic Auto-Expanding Composer Textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 44), 280)}px`;
  }, [composerText]);

  // Running elapsed seconds timer
  useEffect(() => {
    if (!isRunning) {
      setRunningSec(0);
      return;
    }
    const timer = setInterval(() => setRunningSec((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Smooth scroll to latest turn
  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isRunning]);

  // Load saved appearance & threads from IndexedDB/localStorage
  useEffect(() => {
    try {
      const savedApp = localStorage.getItem("heyuka_studio_appearance_v2");
      if (savedApp) {
        const parsed = JSON.parse(savedApp);
        if (parsed?.backgroundHex && parsed?.accentHex) setAppearance(parsed);
      }
      const savedThreads = localStorage.getItem("heyuka_antigravity_threads_v1");
      if (savedThreads) {
        const parsedThreads = JSON.parse(savedThreads);
        if (Array.isArray(parsedThreads)) setThreads(parsedThreads);
      }
    } catch {}
  }, []);

  const updateAppearance = (next: typeof appearance) => {
    setAppearance(next);
    try {
      localStorage.setItem("heyuka_studio_appearance_v2", JSON.stringify(next));
    } catch {}
  };

  // Pointer drag resize for right IDE pane
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragResizeRef.current) return;
      setRightWidthPx(Math.min(760, Math.max(340, window.innerWidth - e.clientX)));
    };
    const onUp = () => {
      dragResizeRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Load active IndexedDB state & URL query parameters (`?brand=`, `?q=`)
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
          if (Array.isArray(parsed.files) && parsed.files.length > 0) setStudioFiles(parsed.files);
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
          payload: JSON.stringify({ messages: messages.slice(-24), files: studioFiles, systemInstruction }),
        });
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [brand, messages, studioFiles, systemInstruction]);

  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const qBrand = qs.get("brand");
      if (qBrand === "kaspi_pos" || qBrand === "heyuka") {
        setBrand(qBrand);
      }
      const qText = qs.get("q");
      if (qText) setComposerText(qText);
      const qTab = qs.get("pane");
      if (qTab === "files" || qTab === "terminal" || qTab === "browser" || qTab === "changes") {
        setRightTab(qTab);
        setRightOpen(true);
      }
    } catch {}
  }, []);

  const switchBrand = (nextBrand: StudioBrand) => {
    setBrand(nextBrand);
    setSystemInstruction(
      nextBrand === "kaspi_pos"
        ? "You are KASPI POS AI Engineer inside Antigravity Studio. Assist with store analytics, TTC invoicing, inventory, 80mm ESC/POS receipts, and full project generation."
        : "You are HEYUKA AI Engineer inside Antigravity Studio. Build production software, analyze fetched links, verify commands, and organize sources autonomously."
    );
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("brand", nextBrand);
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };

  const persistCurrentThread = (nextMsgs: StudioMessage[], nextFiles: StudioFileNode[]) => {
    if (nextMsgs.length === 0) return;
    const firstUser = nextMsgs.find((m) => m.role === "user")?.content || "New Conversation";
    const title = firstUser.replace(/\s+/g, " ").slice(0, 46);
    setThreads((prev) => {
      const existing = prev.find((t) => t.id === activeThreadId);
      const updated: StudioThreadRecord = {
        id: activeThreadId,
        brand,
        title: existing?.title || title,
        pinned: existing?.pinned ?? false,
        updatedAt: new Date().toISOString(),
        messages: nextMsgs.slice(-24),
        files: nextFiles,
      };
      const merged = [updated, ...prev.filter((t) => t.id !== activeThreadId)].slice(0, 20);
      try {
        localStorage.setItem("heyuka_antigravity_threads_v1", JSON.stringify(merged));
      } catch {}
      return merged;
    });
  };

  const startNewConversation = () => {
    const newId = `conv_${Date.now()}`;
    setActiveThreadId(newId);
    setMessages([]);
    setStudioFiles(STARTER_FILES);
    setChangedDrawerOpen(false);
    setComposerText("");
    textareaRef.current?.focus();
  };

  const handleAttachFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const item: AttachedMediaItem = {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          dataUrl: typeof reader.result === "string" ? reader.result : undefined,
        };
        setAttachments((prev) => [...prev, item]);
      };
      if (file.type.startsWith("image/") || file.size < 2_500_000) {
        reader.readAsDataURL(file);
      }
    });
  };

  const totalChangedLines = useMemo(
    () => studioFiles.reduce((s, f) => s + f.content.split(/\r?\n/).length, 0),
    [studioFiles]
  );

  // Core Antigravity Autonomous Agent Loop
  const handleRunPrompt = async (overrideText?: string, branchHistory?: StudioMessage[]) => {
    const rawPrompt = (overrideText ?? composerText).trim();
    if (!rawPrompt || isRunning) return;

    const userMsg: StudioMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: rawPrompt,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      tokensIn: estimateTokenCount(rawPrompt),
      createdAt: new Date().toISOString(),
    };

    const baseHistory = branchHistory ?? messages;
    const nextHistory = [...baseHistory, userMsg];
    setMessages(nextHistory);
    if (!overrideText) {
      setComposerText("");
      setAttachments([]);
    }
    setPlusMenuOpen(false);
    setPolicyMenuOpen(false);
    setModelMenuOpen(false);
    setMentionOpen(false);
    setIsRunning(true);

    const t0 = performance.now();
    try {
      const attSummary = (userMsg.attachments || [])
        .map((a) => `[Attached File: ${a.name} (${a.mimeType}, ${Math.round(a.sizeBytes / 1024)}KB)]`)
        .join("\n");
      const cacheSummary =
        contextCaches.length > 0
          ? `\n\n[PINNED CONTEXT]\n${contextCaches.map((c) => `--- ${c.label} ---\n${c.content.slice(0, 1200)}`).join("\n")}`
          : "";
      const fullPromptPayload = `${rawPrompt}${attSummary ? `\n\n${attSummary}` : ""}${cacheSummary}`;

      const urlsInPrompt = rawPrompt.match(/https?:\/\/[^\s]+/gi) || [];
      let citations: Array<{ title: string; url: string }> = [];

      // Optional live web research enrichment when URLs exist or web search enabled
      if (urlsInPrompt.length > 0) {
        try {
          const wr = await fetch("/api/v1/web/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: urlsInPrompt[0], query: rawPrompt.slice(0, 160), lang: locale }),
          });
          if (wr.ok) {
            const wd = await wr.json();
            if (Array.isArray(wd?.results)) citations = [...citations, ...wd.results];
          }
        } catch {}
      }

      // Trigger Swarm metadata planning silently in background
      const swarmPromise = fetch("/api/v1/studio/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: rawPrompt, scale: settings.elasticScale, brand, locale }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.ok && d?.council) {
            setCouncilData(d.council);
            return d.council;
          }
          return null;
        })
        .catch(() => null);

      const imgAtt = (userMsg.attachments || []).find((a) => a.mimeType.startsWith("image/") && a.dataUrl);

      let answerText = "";
      let reasoningText = "";
      let extractedFiles: StudioFileNode[] = [];

      // Call unified /api/v1/heyuka/chat-web with clean role validation (systemInstruction separate!)
      try {
        const chatRes = await fetch("/api/v1/heyuka/chat-web", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: settings.model,
            elasticScale: settings.elasticScale,
            brand,
            executionPolicy: executionPolicy === "turbo" ? "turbo" : "auto",
            mode: "auto",
            deepThink: true,
            webSearch: true,
            locale,
            systemInstruction,
            imageBase64: imgAtt?.dataUrl,
            workspaceFiles: studioFiles.slice(0, 6).map((f) => ({ path: f.path, content: f.content })),
            messages: [
              ...baseHistory.slice(-8).map((m) => ({
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

      if (!answerText) {
        const res = await fetch("/api/v1/heyuka/local-sdk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: fullPromptPayload, mode: "studio", locale }),
        });
        const data = await res.json();
        answerText = String(data?.answer || data?.reply || "Workspace task completed.");
        if (Array.isArray(data?.studioFiles) && data.studioFiles.length > 0) {
          extractedFiles = data.studioFiles.map((f: any) => ({
            path: String(f.path || "app.txt"),
            language: String(f.language || "text"),
            content: String(f.content || ""),
          }));
        }
      }

      // If runnable script was created, log crisp verification trace in Terminal
      const runnableFile = extractedFiles.find((f) => /\.(js|ts|py|sh)$/i.test(f.path));
      if (runnableFile?.content) {
        try {
          const lang = runnableFile.path.endsWith(".py") ? "python" : runnableFile.path.endsWith(".sh") ? "bash" : "javascript";
          const execRes = await fetch("/api/v1/sandbox/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language: lang, code: runnableFile.content.slice(0, 6000) }),
          });
          if (execRes.ok) {
            const ex = await execRes.json();
            const out = String(ex?.stdout || ex?.output || "").trim();
            if (out) setTerminalLogs((p) => [...p, `Verified ${runnableFile.path}: ${out.slice(0, 220)}`]);
          }
        } catch {}
      }

      await swarmPromise;
      const elapsedMs = Math.max(80, Math.round(performance.now() - t0));
      const outTok = estimateTokenCount(answerText);

      let updatedWorkspaceFiles = studioFiles;
      if (extractedFiles.length > 0) {
        updatedWorkspaceFiles = extractedFiles;
        setStudioFiles(extractedFiles);
        setFocusFilePath(extractedFiles[0]?.path || null);
        setCheckpoints((prev) => [
          { id: `cp_${Date.now()}`, label: rawPrompt.slice(0, 32), at: new Date().toISOString(), files: extractedFiles },
          ...prev.slice(0, 9),
        ]);
        setRightTab("files");
        setRightOpen(true);
      }

      const assistantMsg: StudioMessage = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: answerText,
        thoughts: reasoningText || `Analyzed prompt -> Selected capabilities -> Generated structured answer`,
        thinkingSeconds: Number((elapsedMs / 1000).toFixed(1)),
        tokensIn: userMsg.tokensIn,
        tokensOut: outTok,
        latencyMs: elapsedMs,
        tokPerSec: Math.round((outTok / elapsedMs) * 1000),
        viewMode: "markdown",
        citations: citations.length > 0 ? citations : undefined,
        codeFiles: extractedFiles.length > 0 ? extractedFiles : undefined,
        createdAt: new Date().toISOString(),
      };

      const finalMsgs = [...nextHistory, assistantMsg];
      setMessages(finalMsgs);
      persistCurrentThread(finalMsgs, updatedWorkspaceFiles);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `Completed local recovery note: ${err?.message || "Ready for next instruction."}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleMagicRefine = async () => {
    if (!composerText.trim() || enhancingMagic) return;
    setEnhancingMagic(true);
    try {
      const mRes = await fetch("/api/v1/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: composerText, brand, scale: settings.elasticScale, locale, enhanceOnly: true }),
      });
      const md = await mRes.json();
      if (md?.ok && md?.enhancedPrompt) {
        setComposerText(md.enhancedPrompt);
        setStatusNotice(isAr ? "تم تحسين الطلب بنجاح" : "Prompt structured with Magic Spec");
        setTimeout(() => setStatusNotice(null), 2200);
      }
    } catch {} finally {
      setEnhancingMagic(false);
    }
  };

  const isLight = appearance.themeMode === "light";
  const pageBg = isLight ? "#FFFFFF" : appearance.backgroundHex;
  const sideBg = isLight ? "#F8F9FA" : "#141416";
  const cardBg = isLight ? "#FFFFFF" : "#161618";
  const pageText = isLight ? "#111827" : appearance.foregroundHex;
  const mutedText = isLight ? "text-gray-500" : "text-zinc-400";
  const borderCls = isLight
    ? appearance.contrast === "strong"
      ? "border-gray-300"
      : "border-gray-200"
    : appearance.contrast === "strong"
    ? "border-white/[0.16]"
    : "border-white/[0.08]";

  const starterPrompts =
    brand === "kaspi_pos"
      ? [
          isAr ? "حلل مبيعات اليوم في KASPI POS وأنشئ تقرير مع توصيات المخزون" : "Analyze daily KASPI POS turnover, VAT summary & low stock items",
          isAr ? "صمم واجهة فاتورة حرارية 80mm قابلة للطباعة لـ KASPI POS" : "Build a clean 80mm thermal receipt template (`index.html`, `styles.css`)",
          isAr ? "اعمل فحص شامل للأسعار وهامش الربح بالدرهم المغربي TTC" : "Audit Moroccan TTC retail margins and export actionable table",
        ]
      : [
          isAr ? "ابنِ لوحة تحكم متكاملة مع ملفات HTML/CSS/JS ومعاينة فورية" : "Build a clean interactive web app (`index.html`, `styles.css`, `app.js`)",
          isAr ? "ابحث في الويب ولخص أهم المستجدات مع المصادر" : "Search live web sources and compile a structured technical brief",
          isAr ? "اكتب سكربت Node/Python وجرّبه مباشرة في الـ Terminal" : "Write and verify a utility script cleanly in the workspace",
        ];

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{ backgroundColor: pageBg, color: pageText }}
      className="h-screen w-full flex flex-col overflow-hidden text-sm antialiased"
    >
      {/* Top Calm Antigravity Bar (Identical layout for HEYUKA Studio & KASPI POS Studio) */}
      <header
        style={{ backgroundColor: sideBg }}
        className={`h-11 px-3 border-b ${borderCls} flex items-center justify-between gap-2 shrink-0 select-none z-20`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setLeftOpen((p) => !p)}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${isLight ? "hover:bg-gray-200 text-gray-600" : "hover:bg-white/[0.08] text-zinc-400"}`}
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <HeyukaLoopMark size="sm" variant="monochrome" />
            <span className="font-semibold text-xs sm:text-[13px] tracking-tight truncate">
              {brand === "kaspi_pos" ? "KASPI POS Studio" : "HEYUKA Studio"}
            </span>
          </div>

          <div className={`hidden sm:flex items-center rounded-md p-0.5 text-[11px] border ${borderCls}`}>
            <button
              type="button"
              onClick={() => switchBrand("heyuka")}
              className={`px-2 py-0.5 rounded cursor-pointer font-medium transition-colors ${
                brand === "heyuka"
                  ? "text-white"
                  : isLight
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              style={brand === "heyuka" ? { backgroundColor: appearance.accentHex } : undefined}
            >
              HEYUKA
            </button>
            <button
              type="button"
              onClick={() => switchBrand("kaspi_pos")}
              className={`px-2 py-0.5 rounded cursor-pointer font-medium transition-colors ${
                brand === "kaspi_pos"
                  ? "text-white"
                  : isLight
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              style={brand === "kaspi_pos" ? { backgroundColor: appearance.accentHex } : undefined}
            >
              KASPI POS
            </button>
          </div>
        </div>

        {/* Top-Right Antigravity Pane Controls: Files | Terminal | Browser | Settings */}
        <div className="flex items-center gap-1 shrink-0">
          {(
            [
              { id: "files" as const, label: isAr ? "الملفات" : "Files", icon: FileCode2 },
              { id: "terminal" as const, label: "Terminal", icon: Terminal },
              { id: "browser" as const, label: isAr ? "المتصفح" : "Browser", icon: Globe },
            ] as const
          ).map((btn) => {
            const Icon = btn.icon;
            const active = rightOpen && rightTab === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  if (rightOpen && rightTab === btn.id) {
                    setRightOpen(false);
                  } else {
                    setRightTab(btn.id);
                    setRightOpen(true);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  active
                    ? isLight
                      ? "bg-gray-200 text-gray-900"
                      : "bg-white/[0.12] text-white"
                    : isLight
                    ? "text-gray-600 hover:bg-gray-200/70"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" style={active ? { color: appearance.accentHex } : undefined} />
                <span className="hidden md:inline">{btn.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${isLight ? "hover:bg-gray-200 text-gray-600" : "hover:bg-white/[0.08] text-zinc-400"}`}
            title="Settings & Appearance"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 3-Column IDE Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT SIDEBAR — Exact Antigravity Nav (+ New Conversation, Automations, Customizations, Pinned/Projects, Settings) */}
        {leftOpen && (
          <aside
            style={{ backgroundColor: sideBg }}
            className={`w-[228px] shrink-0 hidden md:flex flex-col justify-between border-e ${borderCls} p-2.5 select-none`}
          >
            <div className="space-y-3 min-h-0 flex-1 flex flex-col">
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={startNewConversation}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                    isLight ? "hover:bg-gray-200/80 text-gray-800" : "hover:bg-white/[0.07] text-zinc-200"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 opacity-75" />
                  <span>{isAr ? "محادثة جديدة" : "New Conversation"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutomationsOpen(true)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                    isLight ? "hover:bg-gray-200/80 text-gray-700" : "hover:bg-white/[0.07] text-zinc-300"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 opacity-75" />
                  <span>{isAr ? "الأتمتة" : "Automations"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomizationsOpen(true)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                    isLight ? "hover:bg-gray-200/80 text-gray-700" : "hover:bg-white/[0.07] text-zinc-300"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 opacity-75" />
                  <span>{isAr ? "التخصيصات" : "Customizations"}</span>
                </button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 min-h-0 overflow-y-auto kaspi-no-scrollbar space-y-3 pt-1">
                {threads.length > 0 && (
                  <div className="space-y-1">
                    <p className={`px-2 text-[10px] font-semibold uppercase tracking-wider ${mutedText}`}>
                      {isAr ? "المحادثات" : "Conversations"}
                    </p>
                    {threads.map((th) => {
                      const active = th.id === activeThreadId;
                      return (
                        <div
                          key={th.id}
                          className={`group flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            active
                              ? isLight
                                ? "bg-gray-200 text-gray-900 font-medium"
                                : "bg-white/[0.09] text-white font-medium"
                              : isLight
                              ? "text-gray-600 hover:bg-gray-200/60"
                              : "text-zinc-400 hover:bg-white/[0.05]"
                          }`}
                          onClick={() => {
                            setActiveThreadId(th.id);
                            setMessages(th.messages || []);
                            if (th.files?.length) setStudioFiles(th.files);
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {th.pinned ? (
                              <Pin className="w-3 h-3 shrink-0 opacity-60" />
                            ) : (
                              <MessageSquare className="w-3 h-3 shrink-0 opacity-50" />
                            )}
                            <span className="truncate">{th.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const remaining = threads.filter((x) => x.id !== th.id);
                              setThreads(remaining);
                              try {
                                localStorage.setItem("heyuka_antigravity_threads_v1", JSON.stringify(remaining));
                              } catch {}
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Projects Switcher */}
                <div className="space-y-1">
                  <p className={`px-2 text-[10px] font-semibold uppercase tracking-wider ${mutedText}`}>
                    {isAr ? "المشاريع" : "Projects"}
                  </p>
                  <button
                    type="button"
                    onClick={() => switchBrand("kaspi_pos")}
                    className={`w-full px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                      brand === "kaspi_pos"
                        ? isLight
                          ? "bg-gray-200 text-gray-900 font-medium"
                          : "bg-white/[0.09] text-white font-medium"
                        : isLight
                        ? "text-gray-600 hover:bg-gray-200/60"
                        : "text-zinc-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 shrink-0" style={brand === "kaspi_pos" ? { color: appearance.accentHex } : undefined} />
                    <span className="truncate">KASPI POS SaaS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchBrand("heyuka")}
                    className={`w-full px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                      brand === "heyuka"
                        ? isLight
                          ? "bg-gray-200 text-gray-900 font-medium"
                          : "bg-white/[0.09] text-white font-medium"
                        : isLight
                        ? "text-gray-600 hover:bg-gray-200/60"
                        : "text-zinc-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    <FolderGit2 className="w-3.5 h-3.5 shrink-0" style={brand === "heyuka" ? { color: appearance.accentHex } : undefined} />
                    <span className="truncate">HEYUKA Workspace</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Settings */}
            <div className={`pt-2 border-t ${borderCls}`}>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                  isLight ? "text-gray-600 hover:bg-gray-200/80 hover:text-gray-900" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span>{isAr ? "الإعدادات" : "Settings"}</span>
              </button>
            </div>
          </aside>
        )}

        {/* CENTER AGENT CONVERSATION PANEL */}
        <main style={{ backgroundColor: pageBg }} className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            {messages.length === 0 ? (
              <div className="h-full max-w-2xl mx-auto flex flex-col justify-center items-center text-center space-y-5 pb-10">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center justify-center gap-2">
                    <HeyukaLoopMark size="md" variant="monochrome" />
                    <h1 className="text-xl font-semibold tracking-tight">
                      {brand === "kaspi_pos" ? "KASPI POS Studio" : "HEYUKA Studio"}
                    </h1>
                  </div>
                  <p className={`text-xs ${mutedText}`}>
                    {isAr
                      ? "مساحة عمل موحدة: ملفات المشروع، Terminal حي، ومتصفح بحث متكامل."
                      : "Unified workspace with live workspace files, Terminal, Browser & Search."}
                  </p>
                </div>

                <div className="w-full max-w-lg space-y-1.5">
                  {starterPrompts.map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      onClick={() => void handleRunPrompt(promptText)}
                      className={`w-full text-start px-3.5 py-2.5 rounded-xl border text-xs cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                        isLight
                          ? "bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-800"
                          : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-zinc-200"
                      }`}
                    >
                      <span className="truncate">{promptText}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id} className={`space-y-2 ${isUser ? "flex flex-col items-end" : ""}`}>
                      {isUser ? (
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm whitespace-pre-wrap border ${
                            isLight
                              ? "bg-[#F3F4F6] border-gray-200 text-gray-900"
                              : "bg-[#18191D] border-white/[0.08] text-zinc-100"
                          }`}
                        >
                          {msg.content}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {/* Antigravity Thought Step Accordion */}
                          {msg.thoughts && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setExpandedThoughts((p) => ({ ...p, [msg.id]: !p[msg.id] }))}
                                className={`inline-flex items-center gap-1.5 text-xs cursor-pointer ${mutedText} hover:opacity-100`}
                              >
                                <ChevronRight
                                  className={`w-3.5 h-3.5 transition-transform ${
                                    expandedThoughts[msg.id] ? "rotate-90" : ""
                                  }`}
                                />
                                <span>
                                  {isAr
                                    ? `التفكير لمدة ${msg.thinkingSeconds || 1}ث`
                                    : `Thought for ${msg.thinkingSeconds || 1}s`}
                                </span>
                              </button>
                              {expandedThoughts[msg.id] && (
                                <div
                                  className={`mt-1.5 pl-4 border-l-2 ${borderCls} text-[11px] font-mono whitespace-pre-wrap ${mutedText}`}
                                >
                                  {msg.thoughts}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Badges (Files Edited / Citations) */}
                          {msg.codeFiles && msg.codeFiles.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {msg.codeFiles.map((cf) => (
                                <button
                                  key={cf.path}
                                  type="button"
                                  onClick={() => {
                                    setStudioFiles(msg.codeFiles!);
                                    setFocusFilePath(cf.path);
                                    setRightTab("files");
                                    setRightOpen(true);
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono cursor-pointer transition-colors ${
                                    isLight
                                      ? "bg-gray-50 border-gray-200 hover:border-[#007ACC] text-gray-800"
                                      : "bg-white/[0.04] border-white/[0.09] hover:border-[#007ACC] text-zinc-200"
                                  }`}
                                >
                                  <FileCode2 className="w-3 h-3" style={{ color: appearance.accentHex }} />
                                  <span>{cf.path}</span>
                                  <span className="text-emerald-500">+{cf.content.split(/\r?\n/).length}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Rich Markdown Output via shared HeyukaMarkdownMessage */}
                          <div className="text-xs sm:text-[13px] leading-relaxed">
                            <HeyukaMarkdownMessage
                              markdown={msg.content}
                              onOpenCodeInStudio={(lang, code, filePath) => {
                                const targetPath = filePath || `snippet.${lang || "txt"}`;
                                setStudioFiles((prev) => {
                                  const exists = prev.some((f) => f.path === targetPath);
                                  return exists
                                    ? prev.map((f) => (f.path === targetPath ? { ...f, language: lang, content: code } : f))
                                    : [...prev, { path: targetPath, language: lang, content: code }];
                                });
                                setFocusFilePath(targetPath);
                                setRightTab("files");
                                setRightOpen(true);
                              }}
                            />
                          </div>

                          {/* Grounding Source Links */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {msg.citations
                                .filter((c) => c.url && /^https?:\/\//i.test(c.url))
                                .slice(0, 5)
                                .map((cit, cIdx) => (
                                  <button
                                    key={`${cit.url}-${cIdx}`}
                                    type="button"
                                    onClick={() => {
                                      setRightTab("browser");
                                      setRightOpen(true);
                                    }}
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] cursor-pointer ${
                                      isLight ? "bg-gray-50 border-gray-200 text-[#007ACC]" : "bg-white/[0.04] border-white/[0.08] text-sky-400"
                                    }`}
                                  >
                                    <Globe className="w-3 h-3" />
                                    <span className="truncate max-w-[180px]">{cit.title}</span>
                                  </button>
                                ))}
                            </div>
                          )}

                          {/* Action Icons Row */}
                          <div className={`flex items-center gap-2 pt-1 ${mutedText}`}>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                setCopiedId(msg.id);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="p-1 rounded hover:bg-white/10 cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {isRunning && (
                  <div className={`flex items-center gap-2 text-xs ${mutedText} py-2`}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: appearance.accentHex }} />
                    <span>
                      {isAr ? `جاري التنفيذ... (${runningSec}ث)` : `Working... (${runningSec}s)`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BOTTOM WORKSPACE FILE BAR + AUTO-EXPANDING ANTIGRAVITY COMPOSER */}
          <div className="px-4 sm:px-6 pb-3 pt-1 shrink-0">
            <div className="max-w-3xl mx-auto space-y-2">
              {/* "N files changed +X -0 | Review" Strip matching IMG_5822.MOV */}
              {studioFiles.length > 0 && (
                <div className={`rounded-xl border ${borderCls} ${isLight ? "bg-[#F8F9FA]" : "bg-[#141416]"} overflow-hidden text-xs`}>
                  <div className="px-3 py-1.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setChangedDrawerOpen((p) => !p)}
                      className="flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <span className="font-mono">{studioFiles.length} files changed</span>
                      <span className="font-mono text-emerald-500">+{totalChangedLines}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setRightTab("changes");
                          setRightOpen(true);
                        }}
                        className={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium cursor-pointer ${
                          isLight ? "bg-white border-gray-300 hover:bg-gray-100" : "bg-white/[0.06] border-white/[0.12] hover:bg-white/[0.12]"
                        }`}
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => setChangedDrawerOpen((p) => !p)}
                        className={`p-1 rounded cursor-pointer ${mutedText}`}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${changedDrawerOpen ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>
                  {changedDrawerOpen && (
                    <div className={`px-3 py-2 border-t ${borderCls} space-y-1`}>
                      {studioFiles.map((f) => (
                        <button
                          key={f.path}
                          type="button"
                          onClick={() => {
                            setFocusFilePath(f.path);
                            setRightTab("files");
                            setRightOpen(true);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-mono cursor-pointer ${
                            isLight ? "hover:bg-gray-200/60" : "hover:bg-white/[0.06]"
                          }`}
                        >
                          <span>{f.path}</span>
                          <span className="text-emerald-500">+{f.content.split(/\r?\n/).length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status Alerts (Audio Error / Magic Notice) */}
              {(dictation.statusError || statusNotice) && (
                <div className={`px-3 py-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${borderCls} ${isLight ? "bg-gray-50" : "bg-[#161618]"}`}>
                  <span>{dictation.statusError || statusNotice}</span>
                  <button
                    type="button"
                    onClick={() => {
                      dictation.clearError();
                      setStatusNotice(null);
                    }}
                    className="cursor-pointer opacity-70 hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Staged Attachments Preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att) => (
                    <span
                      key={att.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${borderCls}`}
                    >
                      <Paperclip className="w-3 h-3 opacity-60" />
                      <span className="truncate max-w-[160px]">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments((p) => p.filter((x) => x.id !== att.id))}
                        className="cursor-pointer opacity-70 hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Main Antigravity Composer Container */}
              <div
                style={{ backgroundColor: cardBg }}
                className={`relative rounded-2xl border ${borderCls} px-3.5 py-2.5 shadow-sm space-y-2`}
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  dir="auto"
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onPaste={(e) => {
                    const items = Array.from(e.clipboardData?.items || []);
                    const pasted = items.map((i) => i.getAsFile()).filter(Boolean) as File[];
                    if (pasted.length > 0) {
                      const dt = new DataTransfer();
                      pasted.forEach((f) => dt.items.add(f));
                      handleAttachFiles(dt.files);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleRunPrompt();
                    }
                  }}
                  placeholder={
                    isAr
                      ? "اسأل أي شيء، أرفق ملفات أو روابط، أو استعمل الميكروفون..."
                      : "Ask anything, @ to mention, / for workflows..."
                  }
                  className="w-full bg-transparent text-xs sm:text-sm leading-relaxed focus:outline-none resize-none overflow-y-auto"
                />

                {/* Bottom Bar Inside Composer (Exact Antigravity Layout) */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Left Controls: + | Policy | Model */}
                  <div className="relative flex flex-wrap items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setPolicyMenuOpen(false);
                        setModelMenuOpen(false);
                        setPlusMenuOpen((p) => !p);
                      }}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isLight ? "hover:bg-gray-100 text-gray-600" : "hover:bg-white/[0.08] text-zinc-400"}`}
                      title="Add context, image or file"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPlusMenuOpen(false);
                        setModelMenuOpen(false);
                        setPolicyMenuOpen((p) => !p);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                        isLight ? "hover:bg-gray-100 text-gray-700" : "hover:bg-white/[0.07] text-zinc-300"
                      }`}
                    >
                      <span className="capitalize">{executionPolicy}</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPlusMenuOpen(false);
                        setPolicyMenuOpen(false);
                        setModelMenuOpen((p) => !p);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                        isLight ? "hover:bg-gray-100 text-gray-700" : "hover:bg-white/[0.07] text-zinc-300"
                      }`}
                    >
                      <span>{UNIFIED_MODELS.find((m) => m.id === settings.model)?.label || settings.model}</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>

                    {/* + Dropdown */}
                    {plusMenuOpen && (
                      <div
                        style={{ backgroundColor: cardBg }}
                        className={`absolute bottom-10 start-0 w-56 rounded-xl border ${borderCls} p-1.5 shadow-xl z-30 text-xs space-y-0.5`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setPlusMenuOpen(false);
                            fileInputRef.current?.click();
                          }}
                          className={`w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer ${
                            isLight ? "hover:bg-gray-100" : "hover:bg-white/[0.08]"
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Upload Image, Audio or File</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPlusMenuOpen(false);
                            setMentionOpen((p) => !p);
                          }}
                          className={`w-full text-start px-2.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer ${
                            isLight ? "hover:bg-gray-100" : "hover:bg-white/[0.08]"
                          }`}
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>@ Mention Workspace Item</span>
                        </button>
                      </div>
                    )}

                    {/* Policy Dropdown */}
                    {policyMenuOpen && (
                      <div
                        style={{ backgroundColor: cardBg }}
                        className={`absolute bottom-10 start-8 w-44 rounded-xl border ${borderCls} p-1.5 shadow-xl z-30 text-xs space-y-0.5`}
                      >
                        {(["planning", "fast", "turbo"] as const).map((pol) => (
                          <button
                            key={pol}
                            type="button"
                            onClick={() => {
                              setExecutionPolicy(pol);
                              setPolicyMenuOpen(false);
                            }}
                            className={`w-full text-start px-2.5 py-1.5 rounded-lg flex items-center justify-between capitalize cursor-pointer ${
                              isLight ? "hover:bg-gray-100" : "hover:bg-white/[0.08]"
                            }`}
                          >
                            <span>{pol}</span>
                            {executionPolicy === pol && <Check className="w-3.5 h-3.5" style={{ color: appearance.accentHex }} />}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Equal Unified Models Dropdown */}
                    {modelMenuOpen && (
                      <div
                        style={{ backgroundColor: cardBg }}
                        className={`absolute bottom-10 start-16 w-64 rounded-xl border ${borderCls} p-1.5 shadow-xl z-30 text-xs space-y-0.5`}
                      >
                        <div className={`px-2.5 py-1 text-[10px] ${mutedText}`}>
                          All models share full equal capabilities
                        </div>
                        {UNIFIED_MODELS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSettings((s) => ({ ...s, model: m.id }));
                              setModelMenuOpen(false);
                            }}
                            className={`w-full text-start px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                              isLight ? "hover:bg-gray-100" : "hover:bg-white/[0.08]"
                            }`}
                          >
                            <span>{m.label}</span>
                            {settings.model === m.id && <Check className="w-3.5 h-3.5" style={{ color: appearance.accentHex }} />}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* @ Mention Picker */}
                    {mentionOpen && (
                      <div
                        style={{ backgroundColor: cardBg }}
                        className={`absolute bottom-10 start-0 w-56 rounded-xl border ${borderCls} p-1.5 shadow-xl z-30 text-xs space-y-0.5`}
                      >
                        {["@workspace ", "@kaspi_pos ", "@terminal ", "@browser "].map((token) => (
                          <button
                            key={token}
                            type="button"
                            onClick={() => {
                              setComposerText((p) => `${p}${token}`);
                              setMentionOpen(false);
                            }}
                            className={`w-full text-start px-2.5 py-1 rounded font-mono cursor-pointer ${
                              isLight ? "hover:bg-gray-100" : "hover:bg-white/[0.08]"
                            }`}
                          >
                            {token}
                          </button>
                        ))}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAttachFiles(e.target.files)}
                    />
                  </div>

                  {/* Right Controls: Working Mic + Magic Refine + Send */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(dictation.listening || dictation.transcribing) && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
                        {dictation.transcribing
                          ? "Transcribing..."
                          : `REC ${Math.floor(dictation.elapsedSec / 60)}:${String(dictation.elapsedSec % 60).padStart(2, "0")}`}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => void dictation.toggle()}
                      className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                        dictation.listening
                          ? "bg-rose-600 text-white animate-pulse"
                          : isLight
                          ? "hover:bg-gray-100 text-gray-600"
                          : "hover:bg-white/[0.08] text-zinc-400"
                      }`}
                      title={dictation.listening ? "Stop audio capture" : "Record audio / dictate"}
                    >
                      {dictation.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      disabled={enhancingMagic || !composerText.trim()}
                      onClick={() => void handleMagicRefine()}
                      className={`p-1.5 rounded-full cursor-pointer disabled:opacity-35 transition-colors ${
                        isLight ? "hover:bg-gray-100 text-gray-600" : "hover:bg-white/[0.08] text-zinc-400"
                      }`}
                      title="Magic Refine (/api/v1/magic)"
                    >
                      <Sparkles className={`w-4 h-4 ${enhancingMagic ? "animate-spin" : ""}`} />
                    </button>

                    <button
                      type="button"
                      disabled={isRunning || !composerText.trim()}
                      onClick={() => void handleRunPrompt()}
                      style={
                        composerText.trim() && !isRunning
                          ? { backgroundColor: appearance.accentHex, color: "#FFFFFF" }
                          : undefined
                      }
                      className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-35 transition-colors ${
                        isLight ? "bg-gray-200 text-gray-700" : "bg-white/[0.1] text-zinc-300"
                      }`}
                      title="Send (Enter)"
                    >
                      {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUp className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT SPLIT WORKSPACE PANE (Changes | Files | Terminal | Browser) */}
        {rightOpen && (
          <>
            <div
              onMouseDown={() => {
                dragResizeRef.current = true;
              }}
              className={`hidden lg:block w-1 shrink-0 cursor-col-resize transition-colors ${
                isLight ? "bg-gray-200 hover:bg-[#007ACC]" : "bg-white/[0.05] hover:bg-[#007ACC]"
              }`}
            />
            <div
              style={{ width: rightWidthPx }}
              className={`shrink-0 hidden lg:flex flex-col border-s ${borderCls} min-h-0`}
            >
              <StudioWorkbenchTabs
                brand={brand}
                locale={locale}
                files={studioFiles}
                onChangeFiles={setStudioFiles}
                checkpoints={checkpoints}
                onSaveCheckpoint={(label) =>
                  setCheckpoints((prev) => [{ id: `cp_${Date.now()}`, label, at: new Date().toISOString(), files: studioFiles }, ...prev])
                }
                onRestoreCheckpoint={(id) => {
                  const found = checkpoints.find((c) => c.id === id);
                  if (found) setStudioFiles(found.files);
                }}
                onRunPromptFromChild={(txt) => void handleRunPrompt(txt)}
                onInjectContextText={(label, txt) => {
                  setContextCaches((p) => [
                    { id: `cache_${Date.now()}`, label, content: txt, ttlHours: 24, tokensEstimate: estimateTokenCount(txt), createdAt: new Date().toISOString() },
                    ...p,
                  ]);
                  setStatusNotice(`Attached ${label} to AI context`);
                  setTimeout(() => setStatusNotice(null), 2000);
                }}
                councilData={councilData}
                focusFilePath={focusFilePath}
                activeTab={rightTab}
                onChangeTab={setRightTab}
                onClosePane={() => setRightOpen(false)}
                terminalLogsFromAgent={terminalLogs}
                themeMode={appearance.themeMode}
                appearance={{
                  backgroundHex: pageBg,
                  foregroundHex: pageText,
                  accentHex: appearance.accentHex,
                  contrastMode: appearance.contrast,
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* AUTOMATIONS MODAL (<KaspiGlassModalPortal>) */}
      <KaspiGlassModalPortal isOpen={automationsOpen} onClose={() => setAutomationsOpen(false)}>
        <div
          style={{ backgroundColor: cardBg, color: pageText }}
          className={`max-w-lg w-full rounded-2xl border ${borderCls} p-5 space-y-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Clock className="w-4 h-4" style={{ color: appearance.accentHex }} />
              <span>{isAr ? "الأتمتة التلقائية" : "Automations"}</span>
            </div>
            <button type="button" onClick={() => setAutomationsOpen(false)} className="p-1 rounded hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-xs">
            {DEFAULT_AUTOMATIONS.map((auto) => (
              <button
                key={auto.id}
                type="button"
                onClick={() => {
                  setAutomationsOpen(false);
                  void handleRunPrompt(auto.prompt);
                }}
                className={`w-full text-start p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-2 ${borderCls} ${
                  isLight ? "hover:bg-gray-50" : "hover:bg-white/[0.04]"
                }`}
              >
                <div>
                  <div className="font-semibold">{isAr ? auto.titleAr : auto.titleEn}</div>
                  <div className={`text-[11px] mt-0.5 line-clamp-1 ${mutedText}`}>{auto.prompt}</div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      </KaspiGlassModalPortal>

      {/* CUSTOMIZATIONS MODAL (Organized Rules, Context & Advanced Engine — Never clutttering screen!) */}
      <KaspiGlassModalPortal isOpen={customizationsOpen} onClose={() => setCustomizationsOpen(false)}>
        <div
          style={{ backgroundColor: cardBg, color: pageText }}
          className={`max-w-2xl w-full rounded-2xl border ${borderCls} p-5 space-y-4 max-h-[82vh] flex flex-col`}
        >
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Wrench className="w-4 h-4" style={{ color: appearance.accentHex }} />
              <span>{isAr ? "تخصيصات الوكيل والقواعد" : "Customizations & Agent Engine"}</span>
            </div>
            <button type="button" onClick={() => setCustomizationsOpen(false)} className="p-1 rounded hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={`flex gap-1 border-b ${borderCls} pb-2 text-xs shrink-0`}>
            <button
              type="button"
              onClick={() => setCustomTab("rules")}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                customTab === "rules" ? "text-white" : mutedText
              }`}
              style={customTab === "rules" ? { backgroundColor: appearance.accentHex } : undefined}
            >
              Rules &amp; Instructions
            </button>
            <button
              type="button"
              onClick={() => setCustomTab("engine")}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                customTab === "engine" ? "text-white" : mutedText
              }`}
              style={customTab === "engine" ? { backgroundColor: appearance.accentHex } : undefined}
            >
              Model Parameters &amp; Cache
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {customTab === "rules" ? (
              <div className="space-y-3 text-xs">
                <p className={mutedText}>
                  {isAr
                    ? "حدد تعليمات دائمة يتبعها المساعد تلقائياً في كل محادثة."
                    : "Persistent instructions automatically followed across every conversation."}
                </p>
                <textarea
                  rows={7}
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${borderCls} bg-transparent text-xs focus:outline-none`}
                />
              </div>
            ) : (
              <StudioRightRunSettings
                brand={brand}
                locale={locale}
                settings={settings}
                onChange={setSettings}
                systemInstruction={systemInstruction}
                historyTokens={0}
                filesTokens={0}
                promptTokens={estimateTokenCount(composerText)}
                contextCaches={contextCaches}
                onAddCache={(c) => setContextCaches((p) => [c, ...p])}
                onRemoveCache={(id) => setContextCaches((p) => p.filter((x) => x.id !== id))}
              />
            )}
          </div>
        </div>
      </KaspiGlassModalPortal>

      {/* SETTINGS MODAL — Exact Antigravity Two-Column Settings (IMG_5822.MOV 00:23–00:26) */}
      <KaspiGlassModalPortal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <div
          style={{ backgroundColor: cardBg, color: pageText }}
          className={`max-w-2xl w-full rounded-2xl border ${borderCls} overflow-hidden flex flex-col sm:flex-row min-h-[420px] max-h-[82vh]`}
        >
          {/* Left Settings Nav */}
          <div
            style={{ backgroundColor: sideBg }}
            className={`w-full sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-e ${borderCls} p-3 flex flex-col justify-between text-xs`}
          >
            <div className="space-y-1">
              <p className={`px-2 pb-1 text-[11px] font-semibold ${mutedText}`}>Settings</p>
              {(
                [
                  { id: "general" as const, label: "General" },
                  { id: "appearance" as const, label: "Appearance" },
                  { id: "shortcuts" as const, label: "Shortcuts" },
                  { id: "models" as const, label: "Models" },
                  { id: "projects" as const, label: "Projects" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSettingsSection(item.id)}
                  className={`w-full text-start px-2.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                    settingsSection === item.id
                      ? "text-white"
                      : isLight
                      ? "text-gray-700 hover:bg-gray-200/70"
                      : "text-zinc-300 hover:bg-white/[0.06]"
                  }`}
                  style={settingsSection === item.id ? { backgroundColor: appearance.accentHex } : undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className={`px-2.5 py-1.5 rounded-lg border ${borderCls} text-xs cursor-pointer`}
            >
              Close
            </button>
          </div>

          {/* Right Settings Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
            {settingsSection === "appearance" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Appearance</h3>

                <div className={`p-3 rounded-xl border ${borderCls} flex items-center justify-between`}>
                  <span>Theme Mode</span>
                  <div className="flex gap-1.5">
                    {(["light", "dark"] as const).map((tm) => (
                      <button
                        key={tm}
                        type="button"
                        onClick={() =>
                          updateAppearance({
                            ...appearance,
                            themeMode: tm,
                            preset: tm === "light" ? "Clean Light" : "Default Dark",
                            backgroundHex: tm === "light" ? "#FFFFFF" : "#101010",
                            foregroundHex: tm === "light" ? "#111827" : "#F7EAEA",
                          })
                        }
                        className={`px-3 py-1 rounded-md capitalize border cursor-pointer font-medium ${
                          appearance.themeMode === tm ? "text-white border-transparent" : borderCls
                        }`}
                        style={appearance.themeMode === tm ? { backgroundColor: appearance.accentHex } : undefined}
                      >
                        {tm}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${borderCls} flex items-center justify-between`}>
                  <span>Contrast</span>
                  <div className="flex gap-1.5">
                    {(["default", "strong"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateAppearance({ ...appearance, contrast: c })}
                        className={`px-3 py-1 rounded-md capitalize border cursor-pointer font-medium ${
                          appearance.contrast === c ? "text-white border-transparent" : borderCls
                        }`}
                        style={appearance.contrast === c ? { backgroundColor: appearance.accentHex } : undefined}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className={`p-3 rounded-xl border ${borderCls} flex items-center justify-between`}>
                    <span>Background</span>
                    <div className="flex items-center gap-2 font-mono">
                      <input
                        type="color"
                        value={appearance.backgroundHex}
                        onChange={(e) => updateAppearance({ ...appearance, backgroundHex: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent"
                      />
                      <span>{appearance.backgroundHex}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${borderCls} flex items-center justify-between`}>
                    <span>Foreground</span>
                    <div className="flex items-center gap-2 font-mono">
                      <input
                        type="color"
                        value={appearance.foregroundHex}
                        onChange={(e) => updateAppearance({ ...appearance, foregroundHex: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent"
                      />
                      <span>{appearance.foregroundHex}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl border ${borderCls} flex items-center justify-between`}>
                    <span>Accent</span>
                    <div className="flex items-center gap-2 font-mono">
                      <input
                        type="color"
                        value={appearance.accentHex}
                        onChange={(e) => updateAppearance({ ...appearance, accentHex: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent"
                      />
                      <span>{appearance.accentHex}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsSection === "models" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Models (Unified Equal Capability)</h3>
                <p className={mutedText}>
                  Every model in HEYUKA &amp; KASPI POS Studio has equal access to Files, Terminal, Web Browser, Search, and KASPI POS Store Intelligence.
                </p>
                <div className="space-y-2">
                  {UNIFIED_MODELS.map((m) => (
                    <div key={m.id} className={`p-3 rounded-xl border ${borderCls} flex items-center justify-between`}>
                      <div>
                        <div className="font-semibold">{m.label}</div>
                        <div className={`text-[10px] font-mono ${mutedText}`}>{m.id} • Full Agent Tools Ready</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, model: m.id }))}
                        className={`px-2.5 py-1 rounded-md border text-[11px] font-medium cursor-pointer ${
                          settings.model === m.id ? "text-white border-transparent" : borderCls
                        }`}
                        style={settings.model === m.id ? { backgroundColor: appearance.accentHex } : undefined}
                      >
                        {settings.model === m.id ? "Active" : "Select"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settingsSection === "general" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">General</h3>
                <div className={`p-3 rounded-xl border ${borderCls} space-y-1.5`}>
                  <div className="font-medium">Active Brand Workspace</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => switchBrand("heyuka")}
                      className={`px-3 py-1 rounded-md border cursor-pointer ${brand === "heyuka" ? "text-white border-transparent" : borderCls}`}
                      style={brand === "heyuka" ? { backgroundColor: appearance.accentHex } : undefined}
                    >
                      HEYUKA Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => switchBrand("kaspi_pos")}
                      className={`px-3 py-1 rounded-md border cursor-pointer ${brand === "kaspi_pos" ? "text-white border-transparent" : borderCls}`}
                      style={brand === "kaspi_pos" ? { backgroundColor: appearance.accentHex } : undefined}
                    >
                      KASPI POS Studio
                    </button>
                  </div>
                </div>
              </div>
            )}

            {settingsSection === "shortcuts" && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
                <div className={`p-3 rounded-xl border ${borderCls} flex justify-between`}>
                  <span>Send Message</span>
                  <kbd className="font-mono opacity-80">Enter</kbd>
                </div>
                <div className={`p-3 rounded-xl border ${borderCls} flex justify-between`}>
                  <span>New Line</span>
                  <kbd className="font-mono opacity-80">Shift + Enter</kbd>
                </div>
              </div>
            )}

            {settingsSection === "projects" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Starter Blueprints</h3>
                <div className="space-y-2">
                  {STUDIO_STARTER_TEMPLATES.map((tpl: StudioStarterTemplate) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setSettingsOpen(false);
                        void handleRunPrompt(tpl.prompt);
                      }}
                      className={`w-full text-start p-3 rounded-xl border ${borderCls} cursor-pointer ${
                        isLight ? "hover:bg-gray-50" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="font-semibold">{isAr ? tpl.titleAr : tpl.titleEn}</div>
                      <div className={`text-[11px] ${mutedText}`}>{isAr ? tpl.descAr : tpl.descEn}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </KaspiGlassModalPortal>
    </div>
  );
}
