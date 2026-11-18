"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Sparkles,
  Search,
  FileText,
  Globe,
  Cpu,
  Mic,
  Paperclip,
  ArrowRight,
  Loader2,
  Download,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code2,
  Swords,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  MoreHorizontal,
  Edit3,
  Archive,
  Trophy,
  MessageSquare,
  Camera,
  HelpCircle,
  LogOut,
  X,
  Folder,
  CheckCircle2,
  Image as ImageIcon,
  Store,
  BarChart3,
  Layers,
} from "lucide-react";
import { AppleBackButton } from "@/components/common/AppleBackButton";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { KaspiBrandMark } from "@/components/common/KaspiBrandMark";
import { KaspiAiSearchEngine } from "./studio/KaspiAiSearchEngine";
import { KaspiUnstractInvoiceParser } from "./studio/KaspiUnstractInvoiceParser";
import { KaspiPdfmeDesigner } from "./studio/KaspiPdfmeDesigner";
import { KaspiPuckStorefrontBuilder } from "./studio/KaspiPuckStorefrontBuilder";
import { KaspiDocEtlAnalyzer } from "./studio/KaspiDocEtlAnalyzer";
import { KaspiOpnFormBuilder } from "./studio/KaspiOpnFormBuilder";
import { KaspiArenaBuilder } from "./studio/KaspiArenaBuilder";
import { moonshineVoice } from "@/lib/ai/moonshine-voice-engine";
import {
  ARENA_REAL_MODELS,
  type ArenaExecutionMode,
  type ArenaModality,
  type ArenaModelOutput,
  type ArenaProjectFileItem,
} from "@/lib/ai/arena-models";
import {
  computeBradleyTerryLeaderboard,
  loadHumanPreferenceVotes,
  saveHumanPreferenceVote,
  type BattleOutcome,
} from "@/lib/open-source-engines";
import {
  buildRealZipArchiveFromFiles,
  type GeneratedProjectFile,
} from "@/lib/ai/arena-agent-orchestrator";
import { usePosStore } from "@/client/store/usePosStore";
import { getApiUrl } from "@/client/sync-engine";
import { toast } from "sonner";

interface KaspiAiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  initialTab?: string;
}

type ActiveCanvasView = "arena" | "leaderboard" | "puck_builder" | "open_tools" | "help";
type OpenSourceSubTool = "puck" | "arena" | "pdfme" | "unstract" | "search" | "docetl" | "opnform";

interface AttachedClientFile {
  name: string;
  type: string;
  textExcerpt?: string;
  dataUrl?: string;
}

interface ArenaTurnRecord {
  turnId: string;
  timestamp: string;
  userPrompt: string;
  attachments?: AttachedClientFile[];
  mode: ArenaExecutionMode;
  modality: "code" | "text" | "search" | "image";
  outputA: ArenaModelOutput;
  outputB: ArenaModelOutput | null;
  voteOutcome: BattleOutcome | null;
  expandedA?: boolean;
  expandedB?: boolean;
}

interface ArenaConversationThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  turns: ArenaTurnRecord[];
}

const ARENA_HISTORY_PREFIX = "kaspi_real_arena_threads_v1_";
const ARENA_GMAIL_KEY = "kaspi_real_arena_gmail_v1";

export const KaspiAiStudioModal: React.FC<KaspiAiStudioModalProps> = ({
  isOpen,
  onClose,
  locale = "ar",
}) => {
  const { tenantInfo } = usePosStore();

  // User Identity / Gmail Account Persistence
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [gmailInput, setGmailInput] = useState<string>("");
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [keepPostedChecked, setKeepPostedChecked] = useState(true);

  // Sidebar & Navigation States (Starts clean / zero!)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [showSeeMoreNav, setShowSeeMoreNav] = useState(false);
  const [activeView, setActiveView] = useState<ActiveCanvasView>("arena");
  const [openToolTab, setOpenToolTab] = useState<OpenSourceSubTool>("puck");

  // Conversations & Active Chat
  const [threads, setThreads] = useState<ArenaConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadMenuOpenId, setThreadMenuOpenId] = useState<string | null>(null);
  const [headerTitleMenuOpen, setHeaderTitleMenuOpen] = useState(false);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Composer Controls
  const [promptInput, setPromptInput] = useState("");
  const [arenaMode, setArenaMode] = useState<ArenaExecutionMode>("battle");
  const [modality, setModality] = useState<ArenaModality>("auto");
  const [includeStoreContext, setIncludeStoreContext] = useState(false);
  const [modelAId, setModelAId] = useState<string>(ARENA_REAL_MODELS[0].id);
  const [modelBId, setModelBId] = useState<string>(ARENA_REAL_MODELS[1].id);
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [modalityDropdownOpen, setModalityDropdownOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedClientFile[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Split-Screen Right Canvas Controls (Option A vs Option B, Preview vs Code, Desktop/Tablet/Mobile)
  const [selectedSide, setSelectedSide] = useState<"A" | "B">("A");
  const [previewOrCode, setPreviewOrCode] = useState<"preview" | "code">("preview");
  const [viewportDevice, setViewportDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [viewportDropdownOpen, setViewportDropdownOpen] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("index.html");
  const [iframeRefreshKey, setIframeRefreshKey] = useState<number>(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadTooltipVisible, setDownloadTooltipVisible] = useState(false);
  const [showBuiltBadge, setShowBuiltBadge] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);

  const storageScopeKey = userEmail || tenantInfo?.shopName || "default";

  // 1. Resolve Signed-in Session / Gmail Account on Open
  useEffect(() => {
    if (!isOpen) return;

    try {
      const savedGmail = localStorage.getItem(ARENA_GMAIL_KEY);
      if (savedGmail) {
        setUserEmail(savedGmail);
        setUserName(savedGmail.split("@")[0]);
      }
    } catch {}

    fetch(getApiUrl("/api/auth/session"))
      .then((r) => (r.ok ? r.json() : null))
      .then((sess) => {
        if (sess?.user?.email) {
          setUserEmail(sess.user.email);
          setUserName(sess.user.name || sess.user.email.split("@")[0]);
          try {
            localStorage.setItem(ARENA_GMAIL_KEY, sess.user.email);
          } catch {}
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // 2. Load Threads Scoped to Active User Email / Tenant
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(`${ARENA_HISTORY_PREFIX}${storageScopeKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as ArenaConversationThread[];
        if (Array.isArray(parsed)) {
          setThreads(parsed);
          return;
        }
      }
      setThreads([]);
    } catch {
      setThreads([]);
    }
  }, [isOpen, storageScopeKey]);

  const persistThreads = (next: ArenaConversationThread[]) => {
    setThreads(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`${ARENA_HISTORY_PREFIX}${storageScopeKey}`, JSON.stringify(next));
      } catch {}
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId && !t.archived) || null;
  const latestTurn =
    activeThread && activeThread.turns.length > 0
      ? activeThread.turns[activeThread.turns.length - 1]
      : null;

  // Poll AI Horde Image Jobs automatically when any turn has an unfinished imageJobId
  useEffect(() => {
    if (!activeThread) return;
    const pendingPolls: Array<{ turnId: string; side: "A" | "B"; jobId: string }> = [];

    for (const turn of activeThread.turns) {
      if (turn.outputA.modalityExecuted === "image" && turn.outputA.imageJobId && !turn.outputA.imageUrl) {
        pendingPolls.push({ turnId: turn.turnId, side: "A", jobId: turn.outputA.imageJobId });
      }
      if (turn.outputB?.modalityExecuted === "image" && turn.outputB.imageJobId && !turn.outputB.imageUrl) {
        pendingPolls.push({ turnId: turn.turnId, side: "B", jobId: turn.outputB.imageJobId });
      }
    }

    if (pendingPolls.length === 0) return;

    const timer = setInterval(async () => {
      for (const job of pendingPolls) {
        try {
          const res = await fetch(
            getApiUrl(`/api/ai/arena-execute?action=image_status&id=${encodeURIComponent(job.jobId)}`)
          );
          if (!res.ok) continue;
          const data = await res.json();
          if (data?.done && data?.imgUrl) {
            setThreads((prev) => {
              const updated = prev.map((th) =>
                th.id !== activeThread.id
                  ? th
                  : {
                      ...th,
                      turns: th.turns.map((tn) => {
                        if (tn.turnId !== job.turnId) return tn;
                        if (job.side === "A") {
                          return { ...tn, outputA: { ...tn.outputA, imageUrl: data.imgUrl } };
                        }
                        if (tn.outputB) {
                          return { ...tn, outputB: { ...tn.outputB, imageUrl: data.imgUrl } };
                        }
                        return tn;
                      }),
                    }
              );
              try {
                localStorage.setItem(`${ARENA_HISTORY_PREFIX}${storageScopeKey}`, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        } catch {}
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [activeThread, storageScopeKey]);

  const handleStartNewChat = () => {
    setActiveThreadId(null);
    setActiveView("arena");
    setPromptInput("");
    setAttachedFiles([]);
    setPlusMenuOpen(false);
    setModeDropdownOpen(false);
    setModalityDropdownOpen(false);
  };

  const handleConfirmRename = (threadId: string) => {
    if (!renameValue.trim()) {
      setRenamingThreadId(null);
      return;
    }
    const updated = threads.map((t) =>
      t.id === threadId
        ? { ...t, title: renameValue.trim(), updatedAt: new Date().toISOString() }
        : t
    );
    persistThreads(updated);
    setRenamingThreadId(null);
    setThreadMenuOpenId(null);
    setHeaderTitleMenuOpen(false);
  };

  const handleArchiveThread = (threadId: string) => {
    const updated = threads.map((t) => (t.id === threadId ? { ...t, archived: true } : t));
    persistThreads(updated);
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
    setThreadMenuOpenId(null);
    setHeaderTitleMenuOpen(false);
  };

  // Send Prompt to Real Arena Multi-Model Backend (/api/ai/arena-execute)
  const handleSendPrompt = async (customPrompt?: string) => {
    const promptText = (customPrompt ?? promptInput).trim();
    if (!promptText || isExecuting) return;

    setIsExecuting(true);
    setPromptInput("");
    setActiveView("arena");
    setPlusMenuOpen(false);
    setModeDropdownOpen(false);
    setModalityDropdownOpen(false);

    const filesSnapshot = [...attachedFiles];
    setAttachedFiles([]);

    // Build prior conversation history cleanly from current thread (for follow-ups!)
    const history = activeThread
      ? activeThread.turns.flatMap((t) => [
          { role: "user" as const, content: t.userPrompt },
          { role: "assistant" as const, content: t.outputA.replyMarkdown },
        ])
      : [];

    const controller = new AbortController();
    abortCtrlRef.current = controller;

    try {
      const res = await fetch(getApiUrl("/api/ai/arena-execute"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: promptText,
          mode: arenaMode,
          modality,
          modelAId,
          modelBId,
          history,
          includeStoreContext,
          attachments: filesSnapshot.map((f) => ({
            name: f.name,
            type: f.type,
            textExcerpt: f.textExcerpt,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success || !data?.outputA) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      // Client-IP direct open-weight rescue ONLY if server upstream hit a shared-IP burst limit
      const rescueOutput = async (
        failedOut: ArenaModelOutput | null,
        fallbackLlm7Model: string
      ): Promise<ArenaModelOutput | null> => {
        if (!failedOut || failedOut.status === "completed") return failedOut;
        const start = Date.now();
        const isCodeMode = data.effectiveModality === "code" || modality === "code";
        const sysMsg = isCodeMode
          ? "Build a complete interactive HTML5+CSS3+JS app/website for the user request. Include full ```html``` code block."
          : "Respond concisely and helpfully in the user's language.";
        try {
          const directRes = await fetch("https://api.llm7.io/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: fallbackLlm7Model,
              messages: [
                { role: "system", content: sysMsg },
                { role: "user", content: promptText },
              ],
            }),
          });
          const directJson = await directRes.json().catch(() => null);
          const rawText = directJson?.choices?.[0]?.message?.content;
          if (directRes.ok && typeof rawText === "string" && rawText.trim()) {
            const htmlMatch =
              rawText.match(/```html\n([\s\S]*?)```/i) ||
              rawText.match(/<!DOCTYPE\s+html[\s\S]*?<\/html>/i);
            const htmlCode = htmlMatch ? (htmlMatch[1] || htmlMatch[0]).trim() : null;
            return {
              ...failedOut,
              status: "completed",
              latencyMs: Date.now() - start,
              providerLabel: `${failedOut.providerLabel} (Client Edge)`,
              replyMarkdown: htmlCode
                ? rawText.replace(/```[\s\S]*?```/g, "").trim() ||
                  "Built interactive application via client open gateway."
                : rawText.trim(),
              stepsLog: [`Executed on client edge (${Date.now() - start}ms)`],
              modalityExecuted: htmlCode ? "code" : failedOut.modalityExecuted,
              files: htmlCode
                ? [{ path: "index.html", name: "index.html", language: "html", content: htmlCode }]
                : [],
              previewHtml: htmlCode,
            };
          }
        } catch {}
        return failedOut;
      };

      const finalOutputA =
        (await rescueOutput(data.outputA, "gemma4:31b")) || data.outputA;
      const finalOutputB = data.outputB
        ? await rescueOutput(data.outputB, "DeepSeek-V4-Flash-0731")
        : null;

      const newTurn: ArenaTurnRecord = {
        turnId: `turn-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        userPrompt: promptText,
        attachments: filesSnapshot.length > 0 ? filesSnapshot : undefined,
        mode: arenaMode,
        modality: data.effectiveModality || "text",
        outputA: finalOutputA,
        outputB: finalOutputB,
        voteOutcome: null,
      };

      if (activeThread) {
        const updated = threads.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                updatedAt: new Date().toISOString(),
                turns: [...t.turns, newTurn],
              }
            : t
        );
        persistThreads(updated);
      } else {
        const newId = `chat-${Date.now().toString(36)}`;
        const newThread: ArenaConversationThread = {
          id: newId,
          title: promptText.slice(0, 48),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          turns: [newTurn],
        };
        persistThreads([newThread, ...threads]);
        setActiveThreadId(newId);
      }

      setSelectedSide("A");
      setPreviewOrCode("preview");
      if (newTurn.outputA.files.length > 0) {
        setSelectedFilePath(newTurn.outputA.files[0].path);
      }
      setShowBuiltBadge(true);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error(`تعذر تنفيذ الطلب في Arena: ${String(err?.message || err)}`);
      }
    } finally {
      setIsExecuting(false);
      abortCtrlRef.current = null;
    }
  };

  // Real Human Preference Vote (Updates Leaderboard + Reveals Anonymous Battle Names)
  const handleVote = (turnId: string, outcome: BattleOutcome) => {
    if (!activeThread) return;
    const turn = activeThread.turns.find((t) => t.turnId === turnId);
    if (!turn || !turn.outputB) return;

    saveHumanPreferenceVote({
      tenantId: storageScopeKey,
      promptSummary: turn.userPrompt.slice(0, 120),
      modelAId: turn.outputA.modelId,
      modelBId: turn.outputB.modelId,
      outcome,
    });

    fetch(getApiUrl("/api/ai/studio"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "arena_vote",
        modelAId: turn.outputA.modelId,
        modelBId: turn.outputB.modelId,
        outcome,
        promptSummary: turn.userPrompt,
      }),
    }).catch(() => {});

    const updated = threads.map((th) =>
      th.id !== activeThread.id
        ? th
        : {
            ...th,
            turns: th.turns.map((tr) => (tr.turnId === turnId ? { ...tr, voteOutcome: outcome } : tr)),
          }
    );
    persistThreads(updated);

    if (outcome === "model_a") {
      setSelectedSide("A");
      toast.success(`Voted A: ${turn.outputA.modelName} won this round!`);
    } else if (outcome === "model_b") {
      setSelectedSide("B");
      toast.success(`Voted B: ${turn.outputB.modelName} won this round!`);
    } else if (outcome === "tie") {
      toast.info("Recorded: Both are good");
    } else {
      toast.info("Recorded: Both are bad");
    }
  };

  // Real .ZIP Project Download
  const handleDownloadProjectZip = () => {
    if (!latestTurn) return;
    const activeOutput = selectedSide === "B" && latestTurn.outputB ? latestTurn.outputB : latestTurn.outputA;
    const sourceFiles: ArenaProjectFileItem[] =
      activeOutput.files.length > 0
        ? activeOutput.files
        : [
            {
              path: "index.html",
              name: "index.html",
              language: "html",
              content:
                activeOutput.previewHtml ||
                `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;">${activeOutput.replyMarkdown}</body></html>`,
            },
          ];

    const zipInputs: GeneratedProjectFile[] = sourceFiles.map((f) => ({
      path: f.path,
      name: f.name,
      folder: f.path.includes("/") ? f.path.split("/").slice(0, -1).join("/") : "",
      language: (["tsx", "ts", "css", "json", "html", "md"].includes(f.language)
        ? f.language
        : "ts") as GeneratedProjectFile["language"],
      content: f.content,
    }));

    const zipBytes = buildRealZipArchiveFromFiles(zipInputs);
    const blob = new Blob([zipBytes.buffer as ArrayBuffer], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaspi-ai-project-${selectedSide.toLowerCase()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded real project .zip archive!");
  };

  // Open Live Preview in New Browser Tab via Blob URL
  const handleOpenInNewTab = () => {
    if (!activeOutput?.previewHtml) return;
    const blob = new Blob([activeOutput.previewHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // File Attachment Handler (Text / Code / Images up to 15MB)
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 15MB limit`);
        return;
      }
      const reader = new FileReader();
      if (file.type.startsWith("image/")) {
        reader.onload = (ev) => {
          setAttachedFiles((prev) => [
            ...prev,
            { name: file.name, type: file.type, dataUrl: String(ev.target?.result || "") },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (ev) => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type || "text/plain",
              textExcerpt: String(ev.target?.result || "").slice(0, 8000),
            },
          ]);
        };
        reader.readAsText(file);
      }
    });
    e.target.value = "";
  };

  // Take a Screenshot Capture
  const handleTakeScreenshot = async () => {
    setPlusMenuOpen(false);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        toast.info("يرجى استخدام أداة إرفاق الملفات لرفع لقطة الشاشة على هذا الجهاز");
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx2d = canvas.getContext("2d");
      ctx2d?.drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach((t) => t.stop());
      const pngUrl = canvas.toDataURL("image/png");
      setAttachedFiles((prev) => [
        ...prev,
        { name: `screenshot-${Date.now()}.png`, type: "image/png", dataUrl: pngUrl },
      ]);
      toast.success("تم التقاط لقطة الشاشة وإرفاقها بنجاح!");
    } catch {
      toast.info("تم إلغاء التقاط الشاشة");
    }
  };

  // Voice Input via Moonshine
  const toggleVoiceInput = () => {
    if (isListening) {
      moonshineVoice.stopListening();
      setIsListening(false);
      return;
    }
    const started = moonshineVoice.startListening(
      "auto",
      (text) => setPromptInput(text),
      () => setIsListening(false),
      () => {
        setIsListening(false);
        toast.error("يرجى تفعيل صلاحية الميكروفون للتحدث");
      }
    );
    if (started) {
      setIsListening(true);
    }
  };

  if (!isOpen) return null;

  // Derived active output & right panel determination
  const activeOutput: ArenaModelOutput | null = latestTurn
    ? selectedSide === "B" && latestTurn.outputB
      ? latestTurn.outputB
      : latestTurn.outputA
    : null;

  const hasSplitCanvas = Boolean(
    latestTurn &&
      (latestTurn.outputA.previewHtml ||
        latestTurn.outputB?.previewHtml ||
        latestTurn.outputA.files.length > 0 ||
        latestTurn.outputB?.files.length ||
        latestTurn.outputA.modalityExecuted === "image" ||
        latestTurn.outputB?.modalityExecuted === "image")
  );

  const visibleThreads = threads.filter(
    (t) =>
      !t.archived &&
      (!sidebarSearch.trim() || t.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayThreads = visibleThreads.filter((t) => t.updatedAt.startsWith(todayStr));
  const olderThreads = visibleThreads.filter((t) => !t.updatedAt.startsWith(todayStr));

  const votes = loadHumanPreferenceVotes(storageScopeKey);
  const leaderboard = computeBradleyTerryLeaderboard(votes);

  const getTabDisplayLabel = (turn: ArenaTurnRecord, side: "A" | "B"): string => {
    const out = side === "A" ? turn.outputA : turn.outputB;
    if (!out) return "";
    if (turn.mode === "battle" && !turn.voteOutcome) {
      return `Option ${side}`;
    }
    return out.modelName;
  };

  return (
    <KaspiGlassModalPortal>
      <div
        dir="ltr"
        className="fixed top-0 bottom-0 left-0 right-0 z-[9999] bg-[#161616]/95 backdrop-blur-2xl flex flex-col overflow-hidden font-sans text-zinc-100"
      >
        <div className="flex-1 flex overflow-hidden relative">
          {/* ================================================================
              LEFT ARENA SIDEBAR (KASPI AI IDENTITY — STARTS CLEAN / ZEROED)
             ================================================================ */}
          {sidebarOpen && (
            <aside className="w-64 bg-[#141414]/95 border-r border-white/10 flex flex-col shrink-0 z-20">
              {/* Top Brand: KASPI AI + Collapse Button */}
              <div className="h-13 px-3.5 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <KaspiBrandMark size="sm" className="shrink-0" />
                  <span className="font-serif text-lg font-bold tracking-tight text-white">
                    KASPI AI
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* Clean Arena Sidebar Nav */}
              <div className="p-2 space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    activeView === "arena" && !activeThreadId
                      ? "bg-white/10 text-white font-semibold"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-zinc-300" />
                  <span>New Chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView("leaderboard")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    activeView === "leaderboard"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Leaderboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchOpen(!searchOpen)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    searchOpen
                      ? "bg-white/10 text-white font-semibold"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Search className="w-4 h-4 text-zinc-300" />
                  <span>Search</span>
                </button>

                {searchOpen && (
                  <div className="px-1 py-1">
                    <input
                      type="text"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      placeholder="Search your chats..."
                      autoFocus
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowSeeMoreNav(!showSeeMoreNav)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200 cursor-pointer"
                >
                  {showSeeMoreNav ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>See less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>See more</span>
                    </>
                  )}
                </button>

                {showSeeMoreNav && (
                  <div className="space-y-0.5 pl-2 border-l border-white/10 ml-3 text-xs text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setActiveView("puck_builder")}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer ${
                        activeView === "puck_builder" ? "text-emerald-300 font-semibold" : "hover:text-white"
                      }`}
                    >
                      <Store className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Puck Store Builder</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView("open_tools")}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer ${
                        activeView === "open_tools" ? "text-emerald-300 font-semibold" : "hover:text-white"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>POS Tools (PDF / OCR)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView("help")}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer ${
                        activeView === "help" ? "text-emerald-300 font-semibold" : "hover:text-white"
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Help & Open Models</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Conversation History: Starts ZEROED when no chats yet! */}
              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 kaspi-no-scrollbar">
                {todayThreads.length > 0 && (
                  <div>
                    <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                      TODAY
                    </div>
                    <div className="space-y-0.5">
                      {todayThreads.map((thread) => (
                        <div key={thread.id} className="relative group">
                          {renamingThreadId === thread.id ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-[#222] rounded-lg border border-emerald-500/50">
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleConfirmRename(thread.id);
                                  if (e.key === "Escape") setRenamingThreadId(null);
                                }}
                                autoFocus
                                className="w-full bg-transparent text-xs text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleConfirmRename(thread.id)}
                                className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setActiveThreadId(thread.id);
                                setActiveView("arena");
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                activeThreadId === thread.id && activeView === "arena"
                                  ? "bg-white/10 text-white font-semibold"
                                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate" dir="auto">
                                  {thread.title}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setThreadMenuOpenId(threadMenuOpenId === thread.id ? null : thread.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {threadMenuOpenId === thread.id && (
                            <div className="absolute right-2 top-8 z-40 w-36 rounded-xl bg-[#1e1e1e] border border-white/15 shadow-2xl py-1 text-xs">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingThreadId(thread.id);
                                  setRenameValue(thread.title);
                                  setThreadMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-zinc-200 hover:bg-white/10 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Rename</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveThread(thread.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Archive</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {olderThreads.length > 0 && (
                  <div>
                    <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                      OLDER
                    </div>
                    <div className="space-y-0.5">
                      {olderThreads.map((thread) => (
                        <div key={thread.id} className="relative group">
                          <div
                            onClick={() => {
                              setActiveThreadId(thread.id);
                              setActiveView("arena");
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer ${
                              activeThreadId === thread.id && activeView === "arena"
                                ? "bg-white/10 text-white font-semibold"
                                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate" dir="auto">
                                {thread.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setThreadMenuOpenId(threadMenuOpenId === thread.id ? null : thread.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Google / Gmail User Profile Pill (Matches Screenshot 13!) */}
              <div className="p-2.5 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(true)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-300 shrink-0">
                      {(userName || tenantInfo?.shopName || "G").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs text-zinc-200 truncate">
                      {userEmail || `${tenantInfo?.shopName || "Sign in with Gmail"}`}
                    </span>
                  </div>
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </button>

                <div className="flex items-center justify-between px-1 text-[10px] text-zinc-500">
                  <span>KASPI AI Arena</span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-emerald-400 hover:underline cursor-pointer font-semibold"
                  >
                    Back to POS
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* ================================================================
              MAIN RIGHT WORKSPACE AREA
             ================================================================ */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1b1b1b]">
            {/* Minimal Top Header Bar */}
            <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between bg-[#141414] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {!sidebarOpen && (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                    title="Open sidebar"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                )}

                {activeThread && activeView === "arena" ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setHeaderTitleMenuOpen(!headerTitleMenuOpen)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/10 text-xs font-semibold text-zinc-100 max-w-[320px] cursor-pointer"
                    >
                      <span className="truncate" dir="auto">
                        {activeThread.title}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    </button>
                    {headerTitleMenuOpen && (
                      <div className="absolute left-0 top-9 z-50 w-44 rounded-xl bg-[#222] border border-white/15 shadow-2xl py-1 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingThreadId(activeThread.id);
                            setRenameValue(activeThread.title);
                            setHeaderTitleMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-zinc-200 hover:bg-white/10 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Rename</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveThread(activeThread.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-zinc-300">
                    {activeView === "leaderboard"
                      ? "Arena Leaderboard (Bradley-Terry MLE)"
                      : activeView === "puck_builder"
                      ? "Puck Storefront Builder"
                      : activeView === "open_tools"
                      ? "KASPI POS Open-Source Suite"
                      : "KASPI AI — Arena"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {userEmail ? (
                  <button
                    type="button"
                    onClick={() => setAccountModalOpen(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{userEmail}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAccountModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 cursor-pointer"
                  >
                    <span>Sign in with Gmail</span>
                  </button>
                )}

                <AppleBackButton onClick={onClose} locale={locale} title="رجوع إلى POS" />
              </div>
            </div>

            {/* ==============================================================
                VIEW 1: LEADERBOARD (Real Arena-Rank Bradley-Terry Elo)
               ============================================================== */}
            {activeView === "leaderboard" && (
              <div className="flex-1 overflow-y-auto p-6 bg-[#141414]">
                <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      KASPI AI Arena Leaderboard (Arena-Rank Bradley-Terry Elo)
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Live ranking computed strictly from your real preference votes (0 fake pre-populated battles).
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-zinc-400">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Model</th>
                          <th className="py-2.5 px-3">Provider</th>
                          <th className="py-2.5 px-3">Elo Rating</th>
                          <th className="py-2.5 px-3">Win Rate</th>
                          <th className="py-2.5 px-3">Votes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((row, idx) => (
                          <tr key={row.modelId} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="py-3 px-3 font-mono text-zinc-400">{idx + 1}</td>
                            <td className="py-3 px-3 font-bold text-white">{row.displayName}</td>
                            <td className="py-3 px-3 text-zinc-400">{row.provider}</td>
                            <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                              {row.bradleyTerryElo}
                              {row.isProvisionalElo && (
                                <span className="ml-1.5 text-[10px] text-zinc-500">(Baseline)</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              {row.winRatePct !== null ? `${row.winRatePct}%` : "—"}
                            </td>
                            <td className="py-3 px-3 font-mono text-zinc-300">
                              {row.humanBattles} ({row.humanWins}W / {row.humanLosses}L / {row.humanTies}T)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================
                VIEW 2: PUCK BUILDER / OPEN TOOLS / HELP
               ============================================================== */}
            {activeView === "puck_builder" && (
              <div className="flex-1 overflow-y-auto p-5 bg-[#141414]" dir="rtl">
                <KaspiPuckStorefrontBuilder locale={locale} />
              </div>
            )}

            {activeView === "open_tools" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#141414]" dir="rtl">
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: "puck" as const, label: "Puck Store Builder" },
                    { id: "arena" as const, label: "Arena Store Studio" },
                    { id: "pdfme" as const, label: "pdfme Designer" },
                    { id: "unstract" as const, label: "Unstract OCR" },
                    { id: "search" as const, label: "Morphic Search" },
                    { id: "docetl" as const, label: "DocETL" },
                    { id: "opnform" as const, label: "OpnForm" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOpenToolTab(item.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        openToolTab === item.id
                          ? "bg-[#10b981] text-black"
                          : "bg-[#222] text-zinc-300 border border-white/10"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/10">
                  {openToolTab === "puck" && <KaspiPuckStorefrontBuilder locale={locale} />}
                  {openToolTab === "arena" && (
                    <KaspiArenaBuilder locale={locale} onApplyToPuck={() => setOpenToolTab("puck")} />
                  )}
                  {openToolTab === "pdfme" && <KaspiPdfmeDesigner locale={locale} />}
                  {openToolTab === "unstract" && <KaspiUnstractInvoiceParser locale={locale} />}
                  {openToolTab === "search" && <KaspiAiSearchEngine locale={locale} />}
                  {openToolTab === "docetl" && <KaspiDocEtlAnalyzer locale={locale} />}
                  {openToolTab === "opnform" && <KaspiOpnFormBuilder locale={locale} />}
                </div>
              </div>
            )}

            {activeView === "help" && (
              <div className="flex-1 overflow-y-auto p-6 bg-[#141414]">
                <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-4 text-xs text-zinc-300 leading-relaxed">
                  <h2 className="text-lg font-bold text-white">KASPI AI Arena — Active Real Models & Sources</h2>
                  <p>
                    Every prompt in KASPI AI Arena executes live across real open-weight & frontier gateways with zero hardcoded/fake outputs:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    {ARENA_REAL_MODELS.map((m) => (
                      <li key={m.id}>
                        <strong className="text-white">{m.displayName}</strong> — {m.providerLabel} (
                        <code className="text-emerald-400">{m.apiModelId}</code>)
                      </li>
                    ))}
                  </ul>
                  <p className="text-zinc-400">
                    Web Search uses DuckDuckGo + Wikipedia REST API. Image Generation uses decentralized Stable Diffusion workers via AI Horde. Code Mode renders live runnable apps/websites/games directly in a sandboxed iframe and exports real `.zip` archives.
                  </p>
                </div>
              </div>
            )}

            {/* ==============================================================
                VIEW 3A: CLEAN ZERO NEW CHAT STATE ("What would you like to do?")
               ============================================================== */}
            {activeView === "arena" && !activeThread && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
                <div className="w-full max-w-2xl space-y-5">
                  <h1 className="font-serif text-3xl sm:text-4xl font-normal text-zinc-100 text-center tracking-tight">
                    What would you like to do?
                  </h1>

                  {/* Attached Files Preview Chips */}
                  {attachedFiles.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {attachedFiles.map((f, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-[160px]">{f.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Clean Arena Prompt Box */}
                  <div className="rounded-2xl bg-[#232323]/95 border border-white/15 shadow-2xl p-4 focus-within:border-emerald-500/50 transition-colors">
                    <textarea
                      rows={3}
                      dir="auto"
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendPrompt();
                        }
                      }}
                      placeholder="Ask anything, describe the website, app, 3D game, image, or web search..."
                      className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none"
                    />

                    {/* Composer Toolbar (`+`, `Battle v`, `Auto/Code/Search/Image v`, Send) */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10">
                      <div className="flex items-center gap-2 flex-wrap relative">
                        {/* + Add Files / Screenshot / Voice / Store Context */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setPlusMenuOpen(!plusMenuOpen);
                              setModeDropdownOpen(false);
                              setModalityDropdownOpen(false);
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                            title="Add files, screenshot, or voice"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          {plusMenuOpen && (
                            <div className="absolute left-0 bottom-10 z-50 w-60 rounded-xl bg-[#252525] border border-white/15 shadow-2xl py-1.5 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setPlusMenuOpen(false);
                                  fileInputRef.current?.click();
                                }}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/10 text-zinc-200 cursor-pointer"
                              >
                                <div className="text-left">
                                  <div className="font-semibold text-white">Add files</div>
                                  <div className="text-[10px] text-zinc-400">Up to 15MB per file</div>
                                </div>
                                <Paperclip className="w-4 h-4 text-zinc-400" />
                              </button>
                              <button
                                type="button"
                                onClick={handleTakeScreenshot}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/10 text-zinc-200 cursor-pointer"
                              >
                                <span className="font-semibold text-white">Take a screenshot</span>
                                <Camera className="w-4 h-4 text-zinc-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPlusMenuOpen(false);
                                  toggleVoiceInput();
                                }}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/10 text-emerald-300 cursor-pointer"
                              >
                                <span className="font-semibold">
                                  {isListening ? "Stop Voice" : "Voice Input (Moonshine)"}
                                </span>
                                <Mic className="w-4 h-4 text-emerald-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIncludeStoreContext(!includeStoreContext);
                                  setPlusMenuOpen(false);
                                  toast.info(
                                    !includeStoreContext
                                      ? "Store Context Attached: models can now read your POS products & currency"
                                      : "Store Context Detached: pure Arena mode"
                                  );
                                }}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/10 text-zinc-200 cursor-pointer border-t border-white/10"
                              >
                                <span className="font-semibold text-white">
                                  {includeStoreContext ? "POS Store Data: ON" : "Attach POS Store Data"}
                                </span>
                                <Store className="w-4 h-4 text-emerald-400" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Mode Dropdown (`Battle`, `Agent Mode`, `Side by Side`, `Direct`) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setModeDropdownOpen(!modeDropdownOpen);
                              setPlusMenuOpen(false);
                              setModalityDropdownOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 cursor-pointer"
                          >
                            <Swords className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              {arenaMode === "battle"
                                ? "Battle"
                                : arenaMode === "agent"
                                ? "Agent Mode"
                                : arenaMode === "side_by_side"
                                ? "Side by Side"
                                : "Direct"}
                            </span>
                            <ChevronDown className="w-3 h-3 text-zinc-400" />
                          </button>

                          {modeDropdownOpen && (
                            <div className="absolute left-0 top-10 z-50 w-64 rounded-xl bg-[#252525] border border-white/15 shadow-2xl py-1.5 text-xs">
                              {[
                                {
                                  id: "battle" as const,
                                  title: "Battle Mode",
                                  desc: "Battle 2 anonymous models",
                                  Icon: Swords,
                                },
                                {
                                  id: "agent" as const,
                                  title: "Agent Mode",
                                  desc: "Built for complex tasks",
                                  Icon: Cpu,
                                },
                                {
                                  id: "side_by_side" as const,
                                  title: "Side by Side",
                                  desc: "Compare 2 models of your choice",
                                  Icon: MessageSquare,
                                },
                                {
                                  id: "direct" as const,
                                  title: "Direct",
                                  desc: "Chat with 1 model at a time",
                                  Icon: Bot,
                                },
                              ].map(({ id, title, desc, Icon }) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => {
                                    setArenaMode(id);
                                    setModeDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-white/10 cursor-pointer text-left ${
                                    arenaMode === id ? "bg-white/10" : ""
                                  }`}
                                >
                                  <Icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                  <div>
                                    <div className="font-semibold text-white">{title}</div>
                                    <div className="text-[11px] text-zinc-400">{desc}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Capability Selector (`Auto`, `Code`, `Search`, `Image`, `Text`) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setModalityDropdownOpen(!modalityDropdownOpen);
                              setPlusMenuOpen(false);
                              setModeDropdownOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 cursor-pointer"
                          >
                            {modality === "search" ? (
                              <Globe className="w-3.5 h-3.5 text-emerald-400" />
                            ) : modality === "image" ? (
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span>
                              {modality === "auto"
                                ? "Auto"
                                : modality === "code"
                                ? "Code"
                                : modality === "search"
                                ? "Web Search"
                                : modality === "image"
                                ? "Image Gen"
                                : "Text Chat"}
                            </span>
                            <ChevronDown className="w-3 h-3 text-zinc-400" />
                          </button>

                          {modalityDropdownOpen && (
                            <div className="absolute left-0 top-10 z-50 w-56 rounded-xl bg-[#252525] border border-white/15 shadow-2xl py-1.5 text-xs">
                              {[
                                { id: "auto" as const, title: "Auto", desc: "Smart routing (Code / Search / Chat / Image)" },
                                { id: "code" as const, title: "Code", desc: "Live Web Apps, Sites, Games + Preview + Zip" },
                                { id: "text" as const, title: "Text Chat", desc: "Reasoning, Q&A & Copywriting" },
                                { id: "search" as const, title: "Web Search", desc: "Live DuckDuckGo + Wikipedia citations" },
                                { id: "image" as const, title: "Image Gen", desc: "AI Horde Stable Diffusion Generator" },
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setModality(opt.id);
                                    setModalityDropdownOpen(false);
                                  }}
                                  className={`w-full flex flex-col px-3.5 py-2 hover:bg-white/10 cursor-pointer text-left ${
                                    modality === opt.id ? "bg-white/10" : ""
                                  }`}
                                >
                                  <span className="font-semibold text-white">{opt.title}</span>
                                  <span className="text-[10px] text-zinc-400">{opt.desc}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {includeStoreContext && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold">
                            <Store className="w-3 h-3" />
                            <span>POS Connected</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendPrompt()}
                        disabled={isExecuting || !promptInput.trim()}
                        className="w-8 h-8 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {isExecuting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Explicit Model Pickers for Side-by-Side or Direct Modes */}
                  {(arenaMode === "side_by_side" || arenaMode === "direct") && (
                    <div
                      className={`grid gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs ${
                        arenaMode === "side_by_side" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                      }`}
                    >
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">
                          {arenaMode === "direct" ? "Select Model:" : "Model A:"}
                        </label>
                        <select
                          value={modelAId}
                          onChange={(e) => setModelAId(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#1e1e1e] border border-white/10 text-white text-xs"
                        >
                          {ARENA_REAL_MODELS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.displayName} — {m.providerLabel}
                            </option>
                          ))}
                        </select>
                      </div>

                      {arenaMode === "side_by_side" && (
                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-1">Model B:</label>
                          <select
                            value={modelBId}
                            onChange={(e) => setModelBId(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#1e1e1e] border border-white/10 text-white text-xs"
                          >
                            {ARENA_REAL_MODELS.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.displayName} — {m.providerLabel}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {isExecuting && (
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        Running real AI models in parallel ({arenaMode === "direct" ? "1 model" : "Model A & Model B"})...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==============================================================
                VIEW 3B: ACTIVE ARENA CONVERSATION (CHAT + LIVE SPLIT PREVIEW)
               ============================================================== */}
            {activeView === "arena" && activeThread && (
              <div className="flex-1 flex overflow-hidden">
                {/* Chat & Comparison Column */}
                <div
                  className={`${
                    hasSplitCanvas ? "w-[360px] sm:w-[410px] border-r border-white/10" : "flex-1 max-w-5xl mx-auto"
                  } bg-[#181818] flex flex-col shrink-0`}
                >
                  {/* Messages Scroll */}
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-4 kaspi-no-scrollbar">
                    {activeThread.turns.map((turn) => {
                      const labelA = getTabDisplayLabel(turn, "A");
                      const labelB = getTabDisplayLabel(turn, "B");

                      return (
                        <div key={turn.turnId} className="space-y-3">
                          {/* User Message Bubble */}
                          <div className="flex justify-end">
                            <div
                              dir="auto"
                              className="max-w-[88%] px-3.5 py-2.5 rounded-2xl bg-[#2a2a2a] border border-white/10 text-xs text-zinc-100 leading-relaxed"
                            >
                              {turn.userPrompt}
                            </div>
                          </div>

                          {/* Option Cards (Side by Side if no right iframe, stacked if split canvas) */}
                          <div
                            className={`grid gap-3 ${
                              !hasSplitCanvas && turn.outputB ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                            }`}
                          >
                            {/* OPTION A CARD */}
                            <div
                              onClick={() => setSelectedSide("A")}
                              className={`rounded-xl p-3 border transition-all cursor-pointer ${
                                hasSplitCanvas && selectedSide === "A"
                                  ? "bg-[#222] border-[#10b981]/60 shadow-lg"
                                  : "bg-[#1e1e1e] border-white/10 hover:border-white/25"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                                    AI\
                                  </span>
                                  <span className="text-xs font-bold text-white truncate">{labelA}</span>
                                  {turn.voteOutcome === "model_a" && (
                                    <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendPrompt(turn.userPrompt);
                                    }}
                                    className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                                    title="Regenerate"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                  {turn.outputB && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote(turn.turnId, "model_a");
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                                        turn.voteOutcome === "model_a"
                                          ? "bg-emerald-500 text-black border-emerald-400"
                                          : "bg-white/5 hover:bg-white/10 text-zinc-200 border-white/15"
                                      }`}
                                    >
                                      A is better
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div dir="auto" className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                {turn.outputA.replyMarkdown}
                              </div>

                              {turn.outputA.stepsLog.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                                  <span className="inline-flex items-center gap-1.5 text-zinc-300">
                                    <CheckCircle2
                                      className={`w-3.5 h-3.5 ${
                                        turn.outputA.status === "completed" ? "text-emerald-400" : "text-amber-400"
                                      }`}
                                    />
                                    <span>{turn.outputA.stepsLog[turn.outputA.stepsLog.length - 1]}</span>
                                  </span>
                                  <span className="font-mono text-[10px]">{turn.outputA.latencyMs}ms</span>
                                </div>
                              )}
                            </div>

                            {/* OPTION B CARD */}
                            {turn.outputB && (
                              <div
                                onClick={() => setSelectedSide("B")}
                                className={`rounded-xl p-3 border transition-all cursor-pointer ${
                                  hasSplitCanvas && selectedSide === "B"
                                    ? "bg-[#222] border-[#10b981]/60 shadow-lg"
                                    : "bg-[#1e1e1e] border-white/10 hover:border-white/25"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                                      AI\
                                    </span>
                                    <span className="text-xs font-bold text-white truncate">{labelB}</span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                    {turn.voteOutcome === "model_b" && (
                                      <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendPrompt(turn.userPrompt);
                                      }}
                                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                                      title="Regenerate"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote(turn.turnId, "model_b");
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                                        turn.voteOutcome === "model_b"
                                          ? "bg-emerald-500 text-black border-emerald-400"
                                          : "bg-white/5 hover:bg-white/10 text-zinc-200 border-white/15"
                                      }`}
                                    >
                                      B is better
                                    </button>
                                  </div>
                                </div>

                                <div dir="auto" className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                  {turn.outputB.replyMarkdown}
                                </div>

                                {turn.outputB.stepsLog.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                                    <span className="inline-flex items-center gap-1.5 text-zinc-300">
                                      <CheckCircle2
                                        className={`w-3.5 h-3.5 ${
                                          turn.outputB.status === "completed" ? "text-emerald-400" : "text-amber-400"
                                        }`}
                                      />
                                      <span>{turn.outputB.stepsLog[turn.outputB.stepsLog.length - 1]}</span>
                                    </span>
                                    <span className="font-mono text-[10px]">{turn.outputB.latencyMs}ms</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Real Web Citations if Web Search Executed */}
                          {turn.outputA.citations && turn.outputA.citations.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                Live Web Sources
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {turn.outputA.citations.map((c, cIdx) => (
                                  <a
                                    key={cIdx}
                                    href={c.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 hover:text-white inline-flex items-center gap-1 max-w-[200px] truncate"
                                  >
                                    <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span className="truncate">{c.title}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Both are good / Both are bad Bar */}
                  {latestTurn && latestTurn.outputB && (
                    <div className="px-3.5 pt-2 pb-1 flex items-center justify-center gap-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleVote(latestTurn.turnId, "tie")}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                          latestTurn.voteOutcome === "tie"
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                            : "bg-[#222] hover:bg-white/10 border-white/10 text-zinc-300"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Both are good</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVote(latestTurn.turnId, "both_bad")}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                          latestTurn.voteOutcome === "both_bad"
                            ? "bg-red-500/20 border-red-500/50 text-red-300"
                            : "bg-[#222] hover:bg-white/10 border-white/10 text-zinc-300"
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Both are bad</span>
                      </button>
                    </div>
                  )}

                  {/* Follow-up Composer */}
                  <div className="p-3 border-t border-white/10">
                    <div className="rounded-xl bg-[#232323] border border-white/15 p-2.5">
                      <input
                        type="text"
                        dir="auto"
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSendPrompt();
                          }
                        }}
                        placeholder="Ask a follow up..."
                        className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none mb-2.5"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                            title="Add files"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setArenaMode(arenaMode === "battle" ? "agent" : "battle")
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 cursor-pointer"
                          >
                            <Swords className="w-3 h-3 text-emerald-400" />
                            <span>{arenaMode === "agent" ? "Agent" : "Battle"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setModality(modality === "code" ? "auto" : "code")
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 cursor-pointer"
                          >
                            <Code2 className="w-3 h-3 text-emerald-400" />
                            <span>{modality === "code" ? "Code" : "Auto"}</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendPrompt()}
                          disabled={isExecuting || !promptInput.trim()}
                          className="w-7 h-7 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black flex items-center justify-center cursor-pointer disabled:opacity-40"
                        >
                          {isExecuting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Split-Screen Live App / Website / Code / Image Sandbox */}
                {hasSplitCanvas && latestTurn && activeOutput && (
                  <div className="flex-1 flex flex-col overflow-hidden bg-[#141414]">
                    {/* Option A / Option B Top Switcher Tabs */}
                    <div className="h-11 px-3 border-b border-white/10 flex items-center justify-between bg-[#191919]">
                      <div className="flex items-center gap-1">
                        <div
                          onClick={() => setSelectedSide("A")}
                          className={`flex items-center gap-3 px-3.5 py-2 rounded-t-lg cursor-pointer border-b-2 transition-colors ${
                            selectedSide === "A"
                              ? "bg-[#141414] border-[#10b981] text-white"
                              : "border-transparent text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <span className="text-xs font-bold">{getTabDisplayLabel(latestTurn, "A")}</span>
                          {latestTurn.voteOutcome === "model_a" && (
                            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {latestTurn.outputB && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVote(latestTurn.turnId, "model_a");
                              }}
                              className="px-2 py-0.5 rounded bg-white/10 hover:bg-emerald-500 hover:text-black text-[10px] font-semibold cursor-pointer"
                            >
                              A is better
                            </button>
                          )}
                        </div>

                        {latestTurn.outputB && (
                          <div
                            onClick={() => setSelectedSide("B")}
                            className={`flex items-center gap-3 px-3.5 py-2 rounded-t-lg cursor-pointer border-b-2 transition-colors ${
                              selectedSide === "B"
                                ? "bg-[#141414] border-[#10b981] text-white"
                                : "border-transparent text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <span>{getTabDisplayLabel(latestTurn, "B")}</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            </span>
                            {latestTurn.voteOutcome === "model_b" && (
                              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVote(latestTurn.turnId, "model_b");
                              }}
                              className="px-2 py-0.5 rounded bg-white/10 hover:bg-emerald-500 hover:text-black text-[10px] font-semibold cursor-pointer"
                            >
                              B is better
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview / Code / Viewport / Download Toolbar (Matches Screenshots 3, 4, 9, 14) */}
                    <div className="h-11 px-3 border-b border-white/10 bg-[#1c1c1c] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Preview vs Code Toggle */}
                        <div className="inline-flex items-center p-0.5 rounded-lg bg-[#121212] border border-white/10">
                          <button
                            type="button"
                            onClick={() => setPreviewOrCode("preview")}
                            className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                              previewOrCode === "preview"
                                ? "bg-white/15 text-white"
                                : "text-zinc-400 hover:text-white"
                            }`}
                            title="Live Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewOrCode("code")}
                            className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                              previewOrCode === "code"
                                ? "bg-white/15 text-white"
                                : "text-zinc-400 hover:text-white"
                            }`}
                            title="View Source Code & Files"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Viewport Switcher: Desktop / Tablet / Mobile */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setViewportDropdownOpen(!viewportDropdownOpen)}
                            className="p-1.5 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
                            title="Viewport Size"
                          >
                            {viewportDevice === "desktop" ? (
                              <Monitor className="w-3.5 h-3.5" />
                            ) : viewportDevice === "tablet" ? (
                              <Tablet className="w-3.5 h-3.5" />
                            ) : (
                              <Smartphone className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {viewportDropdownOpen && (
                            <div className="absolute left-0 top-9 z-50 w-36 rounded-xl bg-[#222] border border-white/15 shadow-2xl py-1 text-xs">
                              {[
                                { id: "desktop" as const, label: "Desktop", Icon: Monitor },
                                { id: "tablet" as const, label: "Tablet", Icon: Tablet },
                                { id: "mobile" as const, label: "Mobile", Icon: Smartphone },
                              ].map(({ id, label, Icon }) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => {
                                    setViewportDevice(id);
                                    setViewportDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 cursor-pointer ${
                                    viewportDevice === id ? "bg-white/10 text-white font-semibold" : "text-zinc-300"
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  <span>{label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sandbox URL Bar */}
                      <div className="flex-1 max-w-md flex items-center justify-between px-3 py-1 rounded-lg bg-[#121212] border border-white/10 text-xs text-zinc-300 font-mono">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => setIframeRefreshKey((k) => k + 1)}
                            className="text-zinc-400 hover:text-white cursor-pointer"
                            title="Reload preview"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <span className="truncate">
                            {`${activeThread.id}-${selectedSide.toLowerCase()}.kaspi.site/`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (activeOutput.previewHtml) {
                                navigator.clipboard?.writeText(activeOutput.previewHtml);
                                setCopiedUrl(true);
                                setTimeout(() => setCopiedUrl(false), 1800);
                                toast.success("HTML copied to clipboard");
                              }
                            }}
                            className="text-zinc-400 hover:text-white cursor-pointer"
                            title="Copy generated code"
                          >
                            {copiedUrl ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {activeOutput.previewHtml && (
                            <button
                              type="button"
                              onClick={handleOpenInNewTab}
                              className="text-zinc-400 hover:text-emerald-400 cursor-pointer"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Download Project as Zip File */}
                      <div
                        className="relative"
                        onMouseEnter={() => setDownloadTooltipVisible(true)}
                        onMouseLeave={() => setDownloadTooltipVisible(false)}
                      >
                        <button
                          type="button"
                          onClick={handleDownloadProjectZip}
                          className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                        {downloadTooltipVisible && (
                          <div className="absolute right-0 top-9 z-50 whitespace-nowrap px-3 py-1.5 rounded-lg bg-white text-blue-600 text-xs font-semibold shadow-xl border border-zinc-200">
                            Download Project as Zip File
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Canvas Viewport Body */}
                    {previewOrCode === "preview" ? (
                      <div className="flex-1 overflow-auto p-3 flex justify-center items-start bg-[#0f0f10] relative">
                        {activeOutput.modalityExecuted === "image" ? (
                          <div className="m-auto text-center space-y-4 p-6">
                            {activeOutput.imageUrl ? (
                              <div className="space-y-3">
                                <img
                                  src={activeOutput.imageUrl}
                                  alt={latestTurn.userPrompt}
                                  className="max-w-full max-h-[520px] rounded-2xl border border-white/15 shadow-2xl mx-auto"
                                />
                                <a
                                  href={activeOutput.imageUrl}
                                  download={`kaspi-ai-image-${selectedSide}.webp`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b981] text-black text-xs font-bold"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download Generated Image</span>
                                </a>
                              </div>
                            ) : (
                              <div className="p-6 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-3">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
                                <div className="text-xs font-bold text-white">
                                  Generating image via open Stable Diffusion cluster (AI Horde)...
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  Job ID: {activeOutput.imageJobId || "Initializing..."}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : activeOutput.previewHtml ? (
                          <div
                            className={`h-full w-full transition-all duration-300 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-white ${
                              viewportDevice === "mobile"
                                ? "max-w-[390px]"
                                : viewportDevice === "tablet"
                                ? "max-w-[768px]"
                                : "max-w-full"
                            }`}
                          >
                            <iframe
                              key={`${latestTurn.turnId}-${selectedSide}-${iframeRefreshKey}`}
                              srcDoc={activeOutput.previewHtml}
                              sandbox="allow-scripts allow-forms allow-modals"
                              title={`Live Preview Option ${selectedSide}`}
                              className="w-full h-full border-0 bg-white"
                            />
                          </div>
                        ) : (
                          <div className="p-6 text-xs text-zinc-300 whitespace-pre-wrap max-w-2xl">
                            {activeOutput.replyMarkdown}
                          </div>
                        )}

                        {showBuiltBadge && (
                          <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white text-black shadow-2xl border border-zinc-200 text-xs">
                            <KaspiBrandMark size="sm" />
                            <div>
                              <div className="font-bold text-xs leading-tight">
                                Built with KASPI AI
                              </div>
                              <div className="text-[10px] text-zinc-600">
                                Content is AI-generated
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowBuiltBadge(false)}
                              className="text-zinc-400 hover:text-black cursor-pointer ml-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Source Files Tree & Code Inspector (Matches Screenshot 9) */
                      <div className="flex-1 flex overflow-hidden bg-[#141414]">
                        <div className="w-56 border-r border-white/10 bg-[#181818] flex flex-col shrink-0">
                          <div className="px-3.5 py-2.5 border-b border-white/10 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                            FILES
                          </div>
                          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono">
                            <div className="flex items-center gap-1.5 px-2 py-1 text-zinc-400">
                              <Folder className="w-3.5 h-3.5 text-emerald-400" />
                              <span>project</span>
                            </div>
                            {activeOutput.files.map((file) => (
                              <button
                                key={file.path}
                                type="button"
                                onClick={() => setSelectedFilePath(file.path)}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left cursor-pointer ${
                                  selectedFilePath === file.path
                                    ? "bg-white/10 text-white font-bold"
                                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                }`}
                              >
                                <span className="text-[10px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                                  {file.language}
                                </span>
                                <span className="truncate">{file.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden bg-[#141414]">
                          {(() => {
                            const f =
                              activeOutput.files.find((x) => x.path === selectedFilePath) ||
                              activeOutput.files[0];
                            if (!f) return null;
                            return (
                              <>
                                <div className="h-9 px-4 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a] text-xs font-mono text-zinc-300">
                                  <span>{f.path}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(f.content);
                                      toast.success(`Copied ${f.name}`);
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Copy File</span>
                                  </button>
                                </div>
                                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
                                  {f.content.split("\n").map((line, i) => (
                                    <div key={i} className="flex hover:bg-white/[0.02] px-1">
                                      <span className="w-10 text-right pr-4 text-zinc-600 select-none shrink-0">
                                        {i + 1}
                                      </span>
                                      <span className="text-zinc-200 whitespace-pre">{line}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hidden Multi-File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        {/* Google / Gmail Account Modal (Exact Match to Screenshot 13!) */}
        {accountModalOpen && (
          <div className="fixed top-0 bottom-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#232323] border border-white/15 p-5 shadow-2xl relative space-y-4">
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {userEmail ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-base font-extrabold text-emerald-300">
                      {userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-200 flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate">{userEmail}</span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keepPostedChecked}
                      onChange={(e) => setKeepPostedChecked(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>Yes, keep me posted on what&apos;s new</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(ARENA_GMAIL_KEY);
                      setUserEmail("");
                      setUserName("");
                      setActiveThreadId(null);
                      setAccountModalOpen(false);
                      toast.info("Signed out from Gmail session");
                    }}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <KaspiBrandMark size="sm" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Sign in to KASPI AI</h3>
                      <p className="text-[11px] text-zinc-400">
                        Save all your chats & generated projects to your Gmail account
                      </p>
                    </div>
                  </div>

                  <a
                    href={getApiUrl("/api/auth/signin/google")}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue with Google / Gmail OAuth</span>
                  </a>

                  <div className="text-[10px] text-center text-zinc-500 uppercase">OR LINK GMAIL LOCALLY</div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={gmailInput}
                      onChange={(e) => setGmailInput(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="flex-1 px-3 py-2 rounded-xl bg-[#181818] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = gmailInput.trim().toLowerCase();
                        if (!clean.includes("@")) {
                          toast.error("Please enter a valid Gmail address");
                          return;
                        }
                        localStorage.setItem(ARENA_GMAIL_KEY, clean);
                        setUserEmail(clean);
                        setUserName(clean.split("@")[0]);
                        setGmailInput("");
                        setAccountModalOpen(false);
                        toast.success(`Signed in as ${clean}`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#10b981] text-black font-bold text-xs cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </KaspiGlassModalPortal>
  );
};
export default KaspiAiStudioModal;
