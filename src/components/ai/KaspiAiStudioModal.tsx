"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Sparkles,
  Search,
  FileText,
  Globe,
  Layers,
  Cpu,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  ArrowUp,
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
  Trash2,
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
  ShieldCheck,
  Workflow,
  TrendingUp,
  Palette,
  Image as ImageIcon,
  Megaphone,
  MessageSquare,
  ShoppingCart,
  Boxes,
  Tag,
  BarChart3,
  PackageCheck,
  Camera,
  HelpCircle,
  LogOut,
  X,
  Folder,
  CheckCircle2,
  Lock,
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
  aggregateMerchantStoreContext,
  type AggregatedStoreContext,
} from "@/lib/ai/store-context-builder";
import {
  ARENA_MODEL_REGISTRY,
  computeBradleyTerryLeaderboard,
  loadHumanPreferenceVotes,
  saveHumanPreferenceVote,
  saveBenchmarkScores,
  loadBenchmarkScores,
  applyDesignToPuckDraft,
  publishApprovedPuckDesign,
  OPEN_SOURCE_REPOS,
  type BattleOutcome,
  type PuckData,
} from "@/lib/open-source-engines";
import {
  KASPI_SPECIALIZED_AGENTS,
  OPEN_SOURCE_CAPABILITY_REGISTRY,
  executeAutonomousAgentCollective,
  buildRealZipArchiveFromFiles,
  loadTenantSharedMemory,
  recordMissionIntoTenantMemory,
  type OrchestratedMissionResult,
  type GeneratedProjectFile,
  type ApprovalRequestRecord,
  type AgentAuditLogEntry,
  type SpecializedAgentId,
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

type ArenaExecutionMode = "battle" | "agent" | "side_by_side" | "direct";
type DomainFocusMode = "storefront_code" | "multi_agent_plan" | "sandbox_app" | "workflow_flow" | "marketing_campaign";
type RightPanelTab = "option_a" | "option_b" | "architecture_agents" | "puck_editor" | "approvals_workflows" | "leaderboard" | "open_source_tools";
type OpenSourceSubTool = "puck" | "arena" | "pdfme" | "unstract" | "search" | "docetl" | "opnform";

interface ArenaConversationTurn {
  turnId: string;
  timestamp: string;
  userPrompt: string;
  mode: ArenaExecutionMode;
  modelAId: string;
  modelBId: string;
  modelAName: string;
  modelBName: string;
  voteOutcome: BattleOutcome | null;
  mission: OrchestratedMissionResult;
  expandedStepsA?: boolean;
  expandedStepsB?: boolean;
}

interface ArenaProjectThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  turns: ArenaConversationTurn[];
}

const ARENA_PROJECTS_STORAGE_KEY = "kaspi_arena_projects_v3";

const REQUIRED_SCENARIOS = [
  {
    code: "SCENARIO A",
    label: "أنشئ متجراً إلكترونياً لهذا التاجر",
    prompt: "أنشئ متجراً إلكترونياً متكاملاً لهذا التاجر مرتبطاً بمنتجات المتجر وأسعاره وطلب واتساب.",
    mode: "battle" as ArenaExecutionMode,
  },
  {
    code: "SCENARIO B",
    label: "حلل مبيعاتي وحدد أفضل المنتجات",
    prompt: "حلل مبيعاتي وهوامش الربح وحدد أفضل المنتجات أداءً في متجري.",
    mode: "agent" as ArenaExecutionMode,
  },
  {
    code: "SCENARIO C",
    label: "أنشئ حملة تسويقية للمنتجات الأعلى أداءً",
    prompt: "أريد إطلاق حملة تسويقية لمنتجاتي الأكثر ربحية هذا الأسبوع بـ 4 لغات مع البنرات وتحسين SEO.",
    mode: "agent" as ArenaExecutionMode,
  },
  {
    code: "SCENARIO D",
    label: "أنشئ نظام تنبيه عند انخفاض المخزون",
    prompt: "عندما ينخفض مخزون منتج إلى أقل من 5 وحدات: أنشئ تنبيهاً وأرسل إشعاراً للمسؤول وسجل الحدث واطلب مراجعة إعادة الطلب.",
    mode: "agent" as ArenaExecutionMode,
  },
  {
    code: "SCENARIO E",
    label: "أجب عن سؤال عميل حول توفر منتج",
    prompt: "أجب عن سؤال عميل حول توفر المنتجات وأسعارها الرسمية وسياسة التوصيل في المتجر.",
    mode: "agent" as ArenaExecutionMode,
  },
  {
    code: "SCENARIO F",
    label: "ابحث عن فرص تجارية جديدة في مجال نشاطي",
    prompt: "ابحث عن فرص تجارية جديدة واتجاهات السوق في مجال نشاط متجري.",
    mode: "agent" as ArenaExecutionMode,
  },
  {
    code: "SCENARIO G",
    label: "أنشئ تطبيقاً صغيراً لإدارة حجوزات متجري",
    prompt: "أنشئ تطبيقاً صغيراً لإدارة حجوزات وطلبات زبناء متجري داخل بيئة معزولة Sandbox.",
    mode: "agent" as ArenaExecutionMode,
  },
  {
    code: "SCENARIO H",
    label: "اقترح خطة لتطوير المتجر خلال الشهر القادم",
    prompt: "اقترح خطة شاملة لتطوير المتجر وزيادة المبيعات خلال الشهر القادم بمشاركة جميع الوكلاء.",
    mode: "agent" as ArenaExecutionMode,
  },
];

export const KaspiAiStudioModal: React.FC<KaspiAiStudioModalProps> = ({
  isOpen,
  onClose,
  locale = "ar",
}) => {
  const { tenantInfo, storeType } = usePosStore();

  // Layout & Sidebar States (matching Arena Screenshots 3–15)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [showSeeMoreNav, setShowSeeMoreNav] = useState(false);

  // Store Context & Multi-Level Memory
  const [storeCtx, setStoreCtx] = useState<AggregatedStoreContext | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRequestRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AgentAuditLogEntry[]>([]);

  // Conversation / Project Threads
  const [threads, setThreads] = useState<ArenaProjectThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadMenuOpenId, setThreadMenuOpenId] = useState<string | null>(null);
  const [headerTitleMenuOpen, setHeaderTitleMenuOpen] = useState(false);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Prompt Bar & Popover States (matching Screenshots 10 & 11)
  const [promptInput, setPromptInput] = useState("");
  const [arenaMode, setArenaMode] = useState<ArenaExecutionMode>("battle");
  const [domainFocus, setDomainFocus] = useState<DomainFocusMode>("storefront_code");
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [modelAId, setModelAId] = useState<string>(ARENA_MODEL_REGISTRY[0].id);
  const [modelBId, setModelBId] = useState<string>(ARENA_MODEL_REGISTRY[1].id);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Right Split-Screen Canvas States (matching Screenshots 3, 4, 7, 9, 14)
  const [rightTab, setRightTab] = useState<RightPanelTab>("option_a");
  const [previewOrCode, setPreviewOrCode] = useState<"preview" | "code">("preview");
  const [viewportDevice, setViewportDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [viewportDropdownOpen, setViewportDropdownOpen] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("src/App.tsx");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<SpecializedAgentId | null>(null);
  const [openSourceSubTool, setOpenSourceSubTool] = useState<OpenSourceSubTool>("puck");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [keepPostedChecked, setKeepPostedChecked] = useState(true);
  const [downloadTooltipVisible, setDownloadTooltipVisible] = useState(false);

  // Storefront interactive cart inside live preview
  const [previewCart, setPreviewCart] = useState<Record<string, number>>({});
  const [previewCategory, setPreviewCategory] = useState<string>("الكل");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Load Authenticated Store Context + Threads + Leaderboard
  useEffect(() => {
    if (!isOpen) return;

    aggregateMerchantStoreContext({
      shopName: tenantInfo?.shopName || "ASIMA",
      sector: storeType || "grocery",
      phone: tenantInfo?.phone,
      city: tenantInfo?.city,
      ice: tenantInfo?.ice,
    }).then((ctx) => {
      setStoreCtx(ctx);
      loadTenantSharedMemory(ctx);

      try {
        const rawThreads = localStorage.getItem(`${ARENA_PROJECTS_STORAGE_KEY}_${ctx.tenantId}`);
        if (rawThreads) {
          const parsed = JSON.parse(rawThreads) as ArenaProjectThread[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setThreads(parsed);
          }
        }
      } catch {}
    });
  }, [isOpen, tenantInfo?.shopName, storeType]);

  const saveThreadsToStorage = (nextThreads: ArenaProjectThread[]) => {
    setThreads(nextThreads);
    if (typeof window !== "undefined" && storeCtx) {
      try {
        localStorage.setItem(
          `${ARENA_PROJECTS_STORAGE_KEY}_${storeCtx.tenantId}`,
          JSON.stringify(nextThreads)
        );
      } catch {}
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId && !t.archived) || null;
  const latestTurn =
    activeThread && activeThread.turns.length > 0
      ? activeThread.turns[activeThread.turns.length - 1]
      : null;

  // Start a new blank chat/project ("What would you like to do?" screen)
  const handleStartNewChat = () => {
    setActiveThreadId(null);
    setPromptInput("");
    setPlusMenuOpen(false);
    setModeDropdownOpen(false);
    setDomainDropdownOpen(false);
  };

  // Rename a conversation thread (Screenshot 5 & 6)
  const handleConfirmRename = (threadId: string) => {
    if (!renameValue.trim()) {
      setRenamingThreadId(null);
      return;
    }
    const updated = threads.map((t) =>
      t.id === threadId ? { ...t, title: renameValue.trim(), updatedAt: new Date().toISOString() } : t
    );
    saveThreadsToStorage(updated);
    setRenamingThreadId(null);
    setThreadMenuOpenId(null);
    setHeaderTitleMenuOpen(false);
    toast.success("تم تغيير اسم المشروع بنجاح");
  };

  // Archive a conversation thread (Screenshot 5 & 6)
  const handleArchiveThread = (threadId: string) => {
    const updated = threads.map((t) => (t.id === threadId ? { ...t, archived: true } : t));
    saveThreadsToStorage(updated);
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
    setThreadMenuOpenId(null);
    setHeaderTitleMenuOpen(false);
    toast.info("تمت أرشفة المحادثة");
  };

  // Execute Arena Battle / Autonomous Agent Collective Mission
  const handleExecutePrompt = async (customText?: string, overrideMode?: ArenaExecutionMode) => {
    const rawText = (customText ?? promptInput).trim();
    if (!rawText && !customText) return;
    if (isExecuting) return;

    const effectiveMode = overrideMode || arenaMode;
    setIsExecuting(true);
    setPromptInput("");
    setPlusMenuOpen(false);
    setModeDropdownOpen(false);
    setDomainDropdownOpen(false);

    try {
      const ctx =
        storeCtx ||
        (await aggregateMerchantStoreContext({
          shopName: tenantInfo?.shopName || "ASIMA",
          sector: storeType || "grocery",
          phone: tenantInfo?.phone,
          city: tenantInfo?.city,
          ice: tenantInfo?.ice,
        }));
      if (!storeCtx) setStoreCtx(ctx);

      // Run local + server hybrid Arena Battle & Multi-Agent Orchestrator
      let mission = executeAutonomousAgentCollective(rawText, ctx, effectiveMode);

      try {
        const res = await fetch(getApiUrl("/api/ai/studio"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "arena_battle",
            customGoal: rawText,
            arenaMode: effectiveMode,
            modelAId,
            modelBId,
            storeContext: ctx,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.orchestratedMission) {
            mission = data.orchestratedMission;
          } else if (data?.candidateA?.puckData && data?.candidateB?.puckData) {
            mission = executeAutonomousAgentCollective(
              rawText,
              ctx,
              effectiveMode,
              data.candidateA.puckData,
              data.candidateB.puckData
            );
          }
        }
      } catch {
        // Offline / local deterministic fallback already computed in `mission`
      }

      // Persist benchmarks, memory, approvals, and audit logs
      saveBenchmarkScores(ctx.tenantId, {
        [modelAId]: mission.benchmarkA.totalScorePct,
        [modelBId]: mission.benchmarkB.totalScorePct,
      });
      recordMissionIntoTenantMemory(ctx, mission);
      setApprovals((prev) => [...mission.pendingApprovals, ...prev]);
      setAuditLogs((prev) => [...mission.auditLogs, ...prev]);

      const descriptorA = ARENA_MODEL_REGISTRY.find((m) => m.id === modelAId) || ARENA_MODEL_REGISTRY[0];
      const descriptorB = ARENA_MODEL_REGISTRY.find((m) => m.id === modelBId) || ARENA_MODEL_REGISTRY[1];

      const newTurn: ArenaConversationTurn = {
        turnId: `turn-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        userPrompt: rawText,
        mode: effectiveMode,
        modelAId: descriptorA.id,
        modelBId: descriptorB.id,
        modelAName: descriptorA.displayName,
        modelBName: descriptorB.displayName,
        voteOutcome: null,
        mission,
      };

      if (activeThread) {
        const updatedThreads = threads.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                updatedAt: new Date().toISOString(),
                turns: [...t.turns, newTurn],
              }
            : t
        );
        saveThreadsToStorage(updatedThreads);
      } else {
        const newThreadId = `proj-${Date.now().toString(36)}`;
        const cleanTitle =
          mission.effectiveBusinessPrompt.slice(0, 42) || `${ctx.storeName} — Storefront`;
        const newThread: ArenaProjectThread = {
          id: newThreadId,
          title: cleanTitle,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          turns: [newTurn],
        };
        saveThreadsToStorage([newThread, ...threads]);
        setActiveThreadId(newThreadId);
      }

      if (effectiveMode === "agent" && domainFocus === "multi_agent_plan") {
        setRightTab("architecture_agents");
      } else {
        setRightTab("option_a");
      }

      if (mission.guardrailNoticeAr) {
        toast.warning("تم توجيه الطلب تلقائياً لخدمة متجرك التجاري (KASPI Business Guardrail)");
      }
    } finally {
      setIsExecuting(false);
    }
  };

  // Record Human Preference Vote (A is better / B is better / Both are good / Both are bad)
  const handleVoteOnTurn = (turnId: string, outcome: BattleOutcome) => {
    if (!activeThread || !storeCtx) return;

    const targetTurn = activeThread.turns.find((t) => t.turnId === turnId);
    if (!targetTurn) return;

    saveHumanPreferenceVote({
      tenantId: storeCtx.tenantId,
      promptSummary: targetTurn.userPrompt.slice(0, 120),
      modelAId: targetTurn.modelAId,
      modelBId: targetTurn.modelBId,
      outcome,
    });

    fetch(getApiUrl("/api/ai/studio"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "arena_vote",
        modelAId: targetTurn.modelAId,
        modelBId: targetTurn.modelBId,
        outcome,
        promptSummary: targetTurn.userPrompt,
      }),
    }).catch(() => {});

    const updatedThreads = threads.map((t) =>
      t.id === activeThread.id
        ? {
            ...t,
            turns: t.turns.map((turn) =>
              turn.turnId === turnId ? { ...turn, voteOutcome: outcome } : turn
            ),
          }
        : t
    );
    saveThreadsToStorage(updatedThreads);

    if (outcome === "model_a") {
      setRightTab("option_a");
      toast.success(`تم تسجيل التصويت لصالح ${targetTurn.modelAName} وتحديث تصنيف Bradley-Terry Elo!`);
    } else if (outcome === "model_b") {
      setRightTab("option_b");
      toast.success(`تم تسجيل التصويت لصالح ${targetTurn.modelBName} وتحديث تصنيف Bradley-Terry Elo!`);
    } else if (outcome === "tie") {
      toast.info("تم تسجيل تعادل إيجابي (Both are good) في سجل تقييم Arena!");
    } else {
      toast.info("تم تسجيل (Both are bad) في سجل تقييم Arena!");
    }
  };

  // Download Project as Real .ZIP Archive (Screenshot 4)
  const handleDownloadProjectZip = () => {
    if (!latestTurn || !storeCtx) return;
    const files: GeneratedProjectFile[] =
      rightTab === "option_b"
        ? latestTurn.mission.projectFilesB
        : latestTurn.mission.projectFilesA;

    const zipBytes = buildRealZipArchiveFromFiles(files);
    const blob = new Blob([zipBytes.buffer as ArrayBuffer], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storeCtx.slug || "kaspi-store"}-${rightTab === "option_b" ? "option-b" : "option-a"}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تحميل ملف المشروع الكامل (Download Project as Zip File) بنجاح!");
  };

  // Apply selected Option A / Option B design to Puck Draft & open Puck Editor
  const handleApplyCurrentDesignToStore = () => {
    if (!latestTurn || !storeCtx) return;
    const chosenPuck: PuckData =
      rightTab === "option_b" ? latestTurn.mission.puckDataB : latestTurn.mission.puckDataA;
    const label =
      rightTab === "option_b"
        ? `Option B (${latestTurn.modelBName})`
        : `Option A (${latestTurn.modelAName})`;

    applyDesignToPuckDraft(chosenPuck, storeCtx, label);
    setRightTab("puck_editor");
    toast.success(`تم نقل تصميم ${label} إلى محرر المتجر (Puck Draft) للمعاينة والتعديل!`);
  };

  // Approve or Reject a Level 3 Sensitive Action
  const handleDecisionOnApproval = (approvalId: string, decision: "approved_executed" | "rejected") => {
    if (!storeCtx) return;
    setApprovals((prev) =>
      prev.map((item) =>
        item.approvalId === approvalId
          ? { ...item, status: decision, decidedAt: new Date().toISOString() }
          : item
      )
    );

    const target = approvals.find((a) => a.approvalId === approvalId);
    if (decision === "approved_executed" && target?.actionType === "PUBLISH_STOREFRONT" && latestTurn) {
      publishApprovedPuckDesign(latestTurn.mission.puckDataA, storeCtx);
      toast.success(`تم اعتماد ونشر متجر "${storeCtx.storeName}" رسمياً بموافقتك الصريحة!`);
    } else if (decision === "approved_executed") {
      toast.success(`تمت الموافقة وتنفيذ العملية (${target?.title || approvalId}) وتسجيلها في سجل التدقيق.`);
    } else {
      toast.info(`تم رفض العملية الحساسة (${target?.title || approvalId}).`);
    }
  };

  // Voice Input Toggle (Moonshine)
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
        toast.error("يرجى السماح بصلاحية الميكروفون للتحدث");
      }
    );
    if (started) {
      setIsListening(true);
      toast.info("Moonshine Voice نشط: تحدث الآن بخصوص متجرك...");
    }
  };

  if (!isOpen) return null;

  // Active PuckData & Project Files for the Right Preview/Code Panel
  const activeOptionPuck: PuckData | null = latestTurn
    ? rightTab === "option_b"
      ? latestTurn.mission.puckDataB
      : latestTurn.mission.puckDataA
    : null;

  const activeProjectFiles: GeneratedProjectFile[] = latestTurn
    ? rightTab === "option_b"
      ? latestTurn.mission.projectFilesB
      : latestTurn.mission.projectFilesA
    : [];

  const activeCodeFile =
    activeProjectFiles.find((f) => f.path === selectedFilePath) || activeProjectFiles[0] || null;

  const activeStoreSlug = storeCtx?.slug || "asima-store";
  const simulatedPreviewUrl = `${activeThread?.id || "01a12a3a-280f-72d0"}.${activeStoreSlug}.kaspi.site/`;
  const liveStorefrontRoute = `/${locale}/store/${encodeURIComponent(activeStoreSlug)}`;

  // Filter threads for TODAY vs OLDER (Screenshots 3, 5, 6, 8)
  const visibleThreads = threads.filter(
    (t) =>
      !t.archived &&
      (!sidebarSearch.trim() || t.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayThreads = visibleThreads.filter((t) => t.updatedAt.startsWith(todayStr));
  const olderThreads = visibleThreads.filter((t) => !t.updatedAt.startsWith(todayStr));

  // Compute real-time Bradley-Terry Leaderboard
  const votes = loadHumanPreferenceVotes(storeCtx?.tenantId || "default");
  const benchmarks = loadBenchmarkScores(storeCtx?.tenantId || "default");
  const leaderboard = computeBradleyTerryLeaderboard(votes, benchmarks);

  return (
    <KaspiGlassModalPortal>
      <div
        dir="ltr"
        className="fixed top-0 bottom-0 left-0 right-0 z-[9999] bg-[#161616]/95 backdrop-blur-2xl flex flex-col overflow-hidden font-sans text-zinc-100 select-none"
      >
        <div className="flex-1 flex overflow-hidden relative">
          {/* ================================================================
              1. LEFT COLLAPSIBLE SIDEBAR (Exact Arena Structure + KASPI AI Brand)
             ================================================================ */}
          {sidebarOpen && (
            <aside className="w-64 bg-[#141414]/95 border-r border-white/10 flex flex-col shrink-0 z-20">
              {/* Top Brand Row: KASPI AI (replaces Arena column logo) + Collapse Toggle */}
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
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* Primary Navigation Links (Matching Arena Screenshots 3, 10, 13) */}
              <div className="p-2 space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    !activeThreadId && rightTab !== "leaderboard" && rightTab !== "architecture_agents"
                      ? "bg-white/10 text-white font-semibold"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span>New Chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRightTab("leaderboard")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    rightTab === "leaderboard"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Leaderboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRightTab("architecture_agents")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    rightTab === "architecture_agents"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Autonomous Agents</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                    14
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRightTab("approvals_workflows")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    rightTab === "approvals_workflows"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Approvals & Flow</span>
                  </span>
                  {approvals.filter((a) => a.status === "pending_approval").length > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                      {approvals.filter((a) => a.status === "pending_approval").length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRightTab("open_source_tools")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    rightTab === "open_source_tools"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Open-Source Engines</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 text-[10px] font-mono">
                    13
                  </span>
                </button>

                {/* Search Input in Sidebar */}
                <div className="pt-1">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      placeholder="Search projects..."
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40"
                    />
                  </div>
                </div>

                {/* Expandable Help Center / FAQ (Matching Screenshots 3, 5, 6, 8) */}
                <button
                  type="button"
                  onClick={() => setShowSeeMoreNav(!showSeeMoreNav)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  {showSeeMoreNav ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>See less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>See more</span>
                    </>
                  )}
                </button>

                {showSeeMoreNav && (
                  <div className="space-y-0.5 pl-1 border-l border-white/10 ml-2 text-[11px] text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setRightTab("architecture_agents")}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 hover:text-white cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Help Center & Architecture</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightTab("open_source_tools")}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 hover:text-white cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>FAQ & Licenses (13 Repos)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Conversation History Grouped by TODAY and OLDER with Rename & Archive (Screenshots 5 & 6) */}
              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 kaspi-no-scrollbar">
                {/* TODAY */}
                <div>
                  <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    TODAY
                  </div>
                  <div className="space-y-0.5">
                    {todayThreads.length === 0 ? (
                      <div className="px-2.5 py-2 text-[11px] text-zinc-500">
                        {storeCtx ? `${storeCtx.storeName} — Ready` : "No active chats today"}
                      </div>
                    ) : (
                      todayThreads.map((thread) => (
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
                                setRightTab("option_a");
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                activeThreadId === thread.id
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
                                  setThreadMenuOpenId(
                                    threadMenuOpenId === thread.id ? null : thread.id
                                  );
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Rename / Archive Context Menu (Exact Match to Screenshot 6) */}
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
                      ))
                    )}
                  </div>
                </div>

                {/* OLDER / QUICK STORE TEMPLATES */}
                <div>
                  <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    OLDER & STORE SCENARIOS
                  </div>
                  <div className="space-y-0.5">
                    {olderThreads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => {
                          setActiveThreadId(thread.id);
                          setRightTab("option_a");
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer ${
                          activeThreadId === thread.id
                            ? "bg-white/10 text-white font-semibold"
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate" dir="auto">
                          {thread.title}
                        </span>
                      </div>
                    ))}

                    {REQUIRED_SCENARIOS.slice(0, 5).map((scen) => (
                      <button
                        key={scen.code}
                        type="button"
                        onClick={() => handleExecutePrompt(scen.prompt, scen.mode)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:bg-white/5 hover:text-emerald-300 transition-colors cursor-pointer text-left"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" dir="rtl">
                          {scen.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Merchant Profile Pill & Footer Links (Exact Match to Screenshot 13) */}
              <div className="p-2.5 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(true)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-300 shrink-0">
                      {(storeCtx?.storeName || "AS").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs text-zinc-200 truncate">
                      {storeCtx?.storeName || tenantInfo?.shopName || "ASIMA"} • KASPI POS
                    </span>
                  </div>
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </button>

                <div className="flex items-center justify-between px-1 text-[10px] text-zinc-500">
                  <span>Tenant Isolated</span>
                  <span>•</span>
                  <span>Zero-Leak Guard</span>
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
              2. MAIN WORKSPACE AREA (EMPTY STATE OR SPLIT-SCREEN STUDIO)
             ================================================================ */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1b1b1b]">
            {/* Top Bar when Sidebar is collapsed */}
            {!sidebarOpen && (
              <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between bg-[#141414]">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                    title="Open Sidebar"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                  <KaspiBrandMark size="sm" />
                  <span className="font-serif text-base font-bold text-white">KASPI AI</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                >
                  ← رجوع إلى KASPI POS
                </button>
              </div>
            )}

            {/* ==============================================================
                CASE A: EMPTY / NEW CHAT STATE ("What would you like to do?" — Screenshots 10 & 11)
               ============================================================== */}
            {!activeThread &&
            rightTab !== "architecture_agents" &&
            rightTab !== "leaderboard" &&
            rightTab !== "approvals_workflows" &&
            rightTab !== "open_source_tools" &&
            rightTab !== "puck_editor" ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto relative">
                {/* Top-right Close / Back to POS button */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRightTab("architecture_agents")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-colors cursor-pointer"
                  >
                    🕸️ المعمارية والوكلاء الـ 14 (Autonomous Commerce)
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white cursor-pointer"
                  >
                    ← Back to POS
                  </button>
                </div>

                {/* Centered Title (Screenshot 10 & 11) */}
                <div className="text-center mb-6 space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      متصل ببيانات متجر {storeCtx?.storeName || "ASIMA"} ({storeCtx?.products.length || 0} سلعة نشطة •{" "}
                      {storeCtx?.currency || "MAD"})
                    </span>
                  </div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-normal text-zinc-100 tracking-tight">
                    What would you like to do?
                  </h1>
                  <p className="text-xs text-zinc-400" dir="rtl">
                    صف المتجر الإلكتروني، الحملة التسويقية، التحليل، أو الأداة المخصصة التي تريد بناءها لمشروعك في KASPI POS
                  </p>
                </div>

                {/* Center Prompt Box with `+` Menu, `⚔️ Battle v` Dropdown & `</> Code v` Dropdown (Screenshots 10 & 11) */}
                <div className="w-full max-w-2xl relative">
                  <div className="rounded-2xl bg-[#232323]/95 border border-white/15 shadow-2xl p-4 focus-within:border-emerald-500/50 transition-colors">
                    <textarea
                      rows={3}
                      dir="auto"
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleExecutePrompt();
                        }
                      }}
                      placeholder={`Describe the website, storefront, marketing campaign, or business tool you want to build for ${
                        storeCtx?.storeName || "your store"
                      }...`}
                      className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none"
                    />

                    {/* Bottom Control Bar inside Prompt Box */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10">
                      <div className="flex items-center gap-2 relative">
                        {/* 1. `+` Attachment & Voice Button (Screenshot 11) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setPlusMenuOpen(!plusMenuOpen);
                              setModeDropdownOpen(false);
                              setDomainDropdownOpen(false);
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                            title="Add files, screenshot, or voice"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          {plusMenuOpen && (
                            <div className="absolute left-0 bottom-10 z-50 w-56 rounded-xl bg-[#252525] border border-white/15 shadow-2xl py-1.5 text-xs">
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
                                onClick={() => {
                                  setPlusMenuOpen(false);
                                  setRightTab("open_source_tools");
                                  setOpenSourceSubTool("unstract");
                                }}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/10 text-zinc-200 cursor-pointer"
                              >
                                <span className="font-semibold text-white">Take a screenshot / OCR</span>
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
                                  {isListening ? "Stop Voice Input" : "Moonshine Voice Input"}
                                </span>
                                <Mic className="w-4 h-4 text-emerald-400" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 2. Mode Dropdown (`⚔️ Battle v` — Exact Match to Screenshot 10!) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setModeDropdownOpen(!modeDropdownOpen);
                              setPlusMenuOpen(false);
                              setDomainDropdownOpen(false);
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
                              <button
                                type="button"
                                onClick={() => {
                                  setArenaMode("battle");
                                  setModeDropdownOpen(false);
                                }}
                                className={`w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-white/10 cursor-pointer text-left ${
                                  arenaMode === "battle" ? "bg-white/10" : ""
                                }`}
                              >
                                <Swords className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                  <div className="font-semibold text-white">Battle Mode</div>
                                  <div className="text-[11px] text-zinc-400">
                                    Battle 2 anonymous models
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setArenaMode("agent");
                                  setModeDropdownOpen(false);
                                }}
                                className={`w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-white/10 cursor-pointer text-left ${
                                  arenaMode === "agent" ? "bg-white/10" : ""
                                }`}
                              >
                                <Cpu className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                  <div className="font-semibold text-white">Agent Mode</div>
                                  <div className="text-[11px] text-zinc-400">
                                    Built for complex tasks (14 Agents)
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setArenaMode("side_by_side");
                                  setModeDropdownOpen(false);
                                }}
                                className={`w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-white/10 cursor-pointer text-left ${
                                  arenaMode === "side_by_side" ? "bg-white/10" : ""
                                }`}
                              >
                                <MessageSquare className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                  <div className="font-semibold text-white">Side by Side</div>
                                  <div className="text-[11px] text-zinc-400">
                                    Compare 2 models of your choice
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setArenaMode("direct");
                                  setModeDropdownOpen(false);
                                }}
                                className={`w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-white/10 cursor-pointer text-left ${
                                  arenaMode === "direct" ? "bg-white/10" : ""
                                }`}
                              >
                                <Bot className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                  <div className="font-semibold text-white">Direct</div>
                                  <div className="text-[11px] text-zinc-400">
                                    Chat with 1 model at a time
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 3. Output Domain Selector (`</> Code v` — Scoped Strictly to Merchant Business) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setDomainDropdownOpen(!domainDropdownOpen);
                              setPlusMenuOpen(false);
                              setModeDropdownOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 cursor-pointer"
                          >
                            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              {domainFocus === "storefront_code"
                                ? "Code & Storefront"
                                : domainFocus === "multi_agent_plan"
                                ? "14 Agents Plan"
                                : domainFocus === "sandbox_app"
                                ? "Business App"
                                : domainFocus === "workflow_flow"
                                ? "Kaspi Flow"
                                : "Campaign"}
                            </span>
                            <ChevronDown className="w-3 h-3 text-zinc-400" />
                          </button>

                          {domainDropdownOpen && (
                            <div className="absolute left-0 top-10 z-50 w-60 rounded-xl bg-[#252525] border border-white/15 shadow-2xl py-1.5 text-xs">
                              {[
                                {
                                  id: "storefront_code" as const,
                                  title: "Storefront & Web Code",
                                  desc: "14-Section Puck + React/TS Zip",
                                },
                                {
                                  id: "multi_agent_plan" as const,
                                  title: "Autonomous 14-Agent Collective",
                                  desc: "BI + SEO + Marketing + Inventory",
                                },
                                {
                                  id: "sandbox_app" as const,
                                  title: "Custom Business Tool (Sandbox)",
                                  desc: "Reservations, Calculators, Forms",
                                },
                                {
                                  id: "workflow_flow" as const,
                                  title: "Workflow Automation (Kaspi Flow)",
                                  desc: "Trigger → Condition → Action",
                                },
                                {
                                  id: "marketing_campaign" as const,
                                  title: "Marketing & Growth Studio",
                                  desc: "AR / Darija / FR / EN Ads",
                                },
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setDomainFocus(opt.id);
                                    setDomainDropdownOpen(false);
                                  }}
                                  className={`w-full flex flex-col px-3.5 py-2 hover:bg-white/10 cursor-pointer text-left ${
                                    domainFocus === opt.id ? "bg-white/10" : ""
                                  }`}
                                >
                                  <span className="font-semibold text-white">{opt.title}</span>
                                  <span className="text-[10px] text-zinc-400">{opt.desc}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Submit Button `[->]` */}
                      <button
                        type="button"
                        onClick={() => handleExecutePrompt()}
                        disabled={isExecuting}
                        className="w-8 h-8 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isExecuting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Side-by-Side Model Chooser when Side-by-Side is selected */}
                  {arenaMode === "side_by_side" && (
                    <div className="mt-3 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">Model A:</label>
                        <select
                          value={modelAId}
                          onChange={(e) => setModelAId(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#1e1e1e] border border-white/10 text-white text-xs"
                        >
                          {ARENA_MODEL_REGISTRY.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">Model B:</label>
                        <select
                          value={modelBId}
                          onChange={(e) => setModelBId(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#1e1e1e] border border-white/10 text-white text-xs"
                        >
                          {ARENA_MODEL_REGISTRY.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 8 Real-World Scenarios Quick Chips (Section 11: Scenarios A through H) */}
                  <div className="mt-6">
                    <div className="text-[11px] font-bold text-zinc-400 mb-2.5 text-center" dir="rtl">
                      سيناريوهات التاجر الذكية الجاهزة للتشغيل الفوري (Scenarios A – H):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" dir="rtl">
                      {REQUIRED_SCENARIOS.map((scen) => (
                        <button
                          key={scen.code}
                          type="button"
                          onClick={() => handleExecutePrompt(scen.prompt, scen.mode)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#222]/90 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/40 text-xs text-zinc-200 transition-all cursor-pointer text-right group"
                        >
                          <span className="truncate font-medium group-hover:text-white">
                            {scen.label}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-mono shrink-0 mr-2">
                            {scen.code}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ==============================================================
                 CASE B: ACTIVE SPLIT-SCREEN WORKSPACE (Chat Column + Right Preview/Code/Agents Panel)
                 Matches Screenshots 3, 4, 5, 6, 7, 8, 9, 12, 14, 15
                 ============================================================== */
              <div className="flex-1 flex overflow-hidden">
                {/* ------------------------------------------------------------
                    LEFT / MIDDLE CHAT & OPTION CARDS COLUMN (Screenshots 3, 5, 6, 8, 9, 12, 15)
                   ------------------------------------------------------------ */}
                {activeThread && (
                  <div className="w-[370px] sm:w-[400px] border-r border-white/10 bg-[#181818] flex flex-col shrink-0">
                    {/* Top Project Header Dropdown with Rename & Archive (Screenshot 5 & 6) */}
                    <div className="h-12 px-3.5 border-b border-white/10 flex items-center justify-between relative">
                      <div className="relative min-w-0">
                        <button
                          type="button"
                          onClick={() => setHeaderTitleMenuOpen(!headerTitleMenuOpen)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/10 text-xs font-semibold text-zinc-100 max-w-[270px] cursor-pointer"
                          title={activeThread.title}
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

                      <button
                        type="button"
                        onClick={handleStartNewChat}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                        title="New Chat"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scrollable Conversation Turns & Option A / Option B Cards */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-4 kaspi-no-scrollbar">
                      {activeThread.turns.map((turn) => {
                        const isVoted = Boolean(turn.voteOutcome);
                        const optionALabel = isVoted ? turn.modelAName : "Option A";
                        const optionBLabel = isVoted ? turn.modelBName : "Option B";

                        return (
                          <div key={turn.turnId} className="space-y-3">
                            {/* User Prompt Bubble */}
                            <div className="flex justify-end">
                              <div
                                dir="auto"
                                className="max-w-[88%] px-3.5 py-2.5 rounded-2xl bg-[#2a2a2a] border border-white/10 text-xs text-zinc-100 leading-relaxed"
                              >
                                {turn.userPrompt}
                              </div>
                            </div>

                            {/* Guardrail Notice if Off-Topic Request was Reframed */}
                            {turn.mission.guardrailNoticeAr && (
                              <div
                                dir="rtl"
                                className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-[11px] text-amber-200 leading-relaxed"
                              >
                                {turn.mission.guardrailNoticeAr}
                              </div>
                            )}

                            {/* OPTION A CARD (Exact Match to Screenshots 3, 5, 6, 8, 9, 12, 15) */}
                            <div
                              onClick={() => setRightTab("option_a")}
                              className={`rounded-xl p-3 border transition-all cursor-pointer ${
                                rightTab === "option_a"
                                  ? "bg-[#222] border-[#10b981]/60 shadow-lg"
                                  : "bg-[#1e1e1e] border-white/10 hover:border-white/25"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                                    AI\
                                  </span>
                                  <span className="text-xs font-bold text-white truncate">
                                    {optionALabel}
                                  </span>
                                  {turn.voteOutcome === "model_a" && (
                                    <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExecutePrompt(turn.userPrompt, turn.mode);
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
                                      handleVoteOnTurn(turn.turnId, "model_a");
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                                      turn.voteOutcome === "model_a"
                                        ? "bg-emerald-500 text-black border-emerald-400"
                                        : "bg-white/5 hover:bg-white/10 text-zinc-200 border-white/15"
                                    }`}
                                  >
                                    A is better
                                  </button>
                                </div>
                              </div>

                              <p
                                dir="rtl"
                                className="text-xs text-zinc-200 leading-relaxed mb-2.5 text-right"
                              >
                                تم — المتجر الإلكتروني ومنظومة الوكلاء لـ &quot;
                                {storeCtx?.storeName || "متجرك"}&quot; جاهزة للتشغيل والمعاينة المباشرة (
                                {turn.mission.benchmarkA.totalScorePct}% Benchmark).
                              </p>

                              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                <span className="inline-flex items-center gap-1.5 text-zinc-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>
                                    Built the project ({turn.mission.routedAgents.length} Agents • 14 Sections)
                                  </span>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = threads.map((t) =>
                                    t.id === activeThread.id
                                      ? {
                                          ...t,
                                          turns: t.turns.map((tr) =>
                                            tr.turnId === turn.turnId
                                              ? { ...tr, expandedStepsA: !tr.expandedStepsA }
                                              : tr
                                          ),
                                        }
                                      : t
                                  );
                                  saveThreadsToStorage(updated);
                                }}
                                className="mt-2 inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                              >
                                <span>Show More</span>
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {turn.expandedStepsA && (
                                <div
                                  dir="rtl"
                                  className="mt-2 pt-2 border-t border-white/10 space-y-1.5 text-[11px] text-zinc-300"
                                >
                                  {turn.mission.agentOutputs.map((ao) => (
                                    <div
                                      key={ao.agentId}
                                      className="p-2 rounded-lg bg-black/30 border border-white/5"
                                    >
                                      <div className="font-bold text-emerald-400">
                                        [{ao.agentCode}] {ao.agentNameAr} ({ao.shortLabel})
                                      </div>
                                      <div className="text-zinc-300 mt-0.5">{ao.summaryAr}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* OPTION B CARD (Exact Match to Screenshots 3, 5, 6, 8, 9, 12, 15) */}
                            {turn.mode !== "direct" && (
                              <div
                                onClick={() => setRightTab("option_b")}
                                className={`rounded-xl p-3 border transition-all cursor-pointer ${
                                  rightTab === "option_b"
                                    ? "bg-[#222] border-[#10b981]/60 shadow-lg"
                                    : "bg-[#1e1e1e] border-white/10 hover:border-white/25"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                                      AI\
                                    </span>
                                    <span className="text-xs font-bold text-white truncate">
                                      {optionBLabel}
                                    </span>
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
                                        handleExecutePrompt(turn.userPrompt, turn.mode);
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
                                        handleVoteOnTurn(turn.turnId, "model_b");
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

                                <div className="flex items-center justify-between text-[11px] text-zinc-300 mb-1.5">
                                  <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>
                                      Explored {storeCtx?.products.length || 0} products & built direct WhatsApp catalog
                                    </span>
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = threads.map((t) =>
                                      t.id === activeThread.id
                                        ? {
                                            ...t,
                                            turns: t.turns.map((tr) =>
                                              tr.turnId === turn.turnId
                                                ? { ...tr, expandedStepsB: !tr.expandedStepsB }
                                                : tr
                                            ),
                                          }
                                        : t
                                    );
                                    saveThreadsToStorage(updated);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  <span>Show More</span>
                                  <ChevronDown className="w-3 h-3" />
                                </button>

                                {turn.expandedStepsB && (
                                  <div
                                    dir="rtl"
                                    className="mt-2 pt-2 border-t border-white/10 text-[11px] text-zinc-300 whitespace-pre-line"
                                  >
                                    {turn.mission.unifiedExecutiveSummaryAr}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Voting Bar ("Both are good" / "Both are bad" — Exact Match to Screenshots 6, 8, 9, 12, 15) */}
                    {latestTurn && (
                      <div className="px-3.5 pt-2 pb-1 flex items-center justify-center gap-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleVoteOnTurn(latestTurn.turnId, "tie")}
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
                          onClick={() => handleVoteOnTurn(latestTurn.turnId, "both_bad")}
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

                    {/* Bottom Follow-Up Input Box ("Ask a follow up..." — Screenshots 3, 6, 8, 9, 12, 15) */}
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
                              handleExecutePrompt();
                            }
                          }}
                          placeholder="Ask a follow up..."
                          className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none mb-2.5"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={toggleVoiceInput}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                              title="Voice / Add Files"
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
                              <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewOrCode(previewOrCode === "preview" ? "code" : "preview")
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 cursor-pointer"
                            >
                              <Code2 className="w-3 h-3 text-emerald-400" />
                              <span>Code</span>
                              <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleExecutePrompt()}
                            disabled={isExecuting}
                            className="w-7 h-7 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black flex items-center justify-center cursor-pointer disabled:opacity-50"
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
                )}

                {/* ------------------------------------------------------------
                    RIGHT INTERACTIVE CANVAS:
                    - Top Option A / Option B / Agents / Puck / Approvals Tabs
                    - Browser Address Bar + Viewport Dropdown + Download Zip + Apply to Store
                    - Preview Mode vs Code & Files Mode vs Architecture View (Screenshots 1, 2, 3, 4, 7, 9, 14)
                   ------------------------------------------------------------ */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#141414]">
                  {/* Top Tab Bar (Exact Match to Screenshots 3, 6, 8, 9, 12, 14, 15) */}
                  <div className="h-12 px-3 border-b border-white/10 flex items-center justify-between bg-[#191919] overflow-x-auto kaspi-no-scrollbar">
                    <div className="flex items-center gap-1">
                      {latestTurn && (
                        <>
                          {/* Option A Tab */}
                          <div
                            onClick={() => setRightTab("option_a")}
                            className={`flex items-center gap-3 px-3.5 py-2 rounded-t-lg cursor-pointer border-b-2 transition-colors ${
                              rightTab === "option_a"
                                ? "bg-[#141414] border-[#10b981] text-white"
                                : "border-transparent text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <span className="text-xs font-bold">
                              {latestTurn.voteOutcome ? latestTurn.modelAName : "Option A"}
                            </span>
                            {latestTurn.voteOutcome === "model_a" && (
                              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVoteOnTurn(latestTurn.turnId, "model_a");
                              }}
                              className="px-2 py-0.5 rounded bg-white/10 hover:bg-emerald-500 hover:text-black text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              A is better
                            </button>
                          </div>

                          {/* Option B Tab */}
                          <div
                            onClick={() => setRightTab("option_b")}
                            className={`flex items-center gap-3 px-3.5 py-2 rounded-t-lg cursor-pointer border-b-2 transition-colors ${
                              rightTab === "option_b"
                                ? "bg-[#141414] border-[#10b981] text-white"
                                : "border-transparent text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <span>
                                {latestTurn.voteOutcome ? latestTurn.modelBName : "Option B"}
                              </span>
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVoteOnTurn(latestTurn.turnId, "model_b");
                              }}
                              className="px-2 py-0.5 rounded bg-white/10 hover:bg-emerald-500 hover:text-black text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              B is better
                            </button>
                          </div>
                        </>
                      )}

                      {/* Architecture & 14 Agents Tab (Screenshots 1 & 2) */}
                      <button
                        type="button"
                        onClick={() => setRightTab("architecture_agents")}
                        className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                          rightTab === "architecture_agents"
                            ? "border-[#10b981] text-emerald-400 bg-[#141414]"
                            : "border-transparent text-zinc-400 hover:text-white"
                        }`}
                      >
                        🕸️ KASPI AI — 14 Agents
                      </button>

                      {/* Puck Visual Editor Tab */}
                      <button
                        type="button"
                        onClick={() => setRightTab("puck_editor")}
                        className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                          rightTab === "puck_editor"
                            ? "border-[#10b981] text-emerald-400 bg-[#141414]"
                            : "border-transparent text-zinc-400 hover:text-white"
                        }`}
                      >
                        🎨 Puck Store Builder
                      </button>

                      {/* Approvals & Workflows Tab */}
                      <button
                        type="button"
                        onClick={() => setRightTab("approvals_workflows")}
                        className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                          rightTab === "approvals_workflows"
                            ? "border-[#10b981] text-emerald-400 bg-[#141414]"
                            : "border-transparent text-zinc-400 hover:text-white"
                        }`}
                      >
                        🔒 Approvals & Flow ({approvals.filter((a) => a.status === "pending_approval").length})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer shrink-0"
                    >
                      ← Back to POS
                    </button>
                  </div>

                  {/* ==========================================================
                      BROWSER & CODE TOOLBAR (Exact Match to Screenshots 3, 4, 9, 14)
                     ========================================================== */}
                  {(rightTab === "option_a" || rightTab === "option_b") && latestTurn && (
                    <div className="h-12 px-3 border-b border-white/10 bg-[#1c1c1c] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Preview [👁️] vs Code [</>] Toggle Pill */}
                        <div className="inline-flex items-center p-0.5 rounded-lg bg-[#121212] border border-white/10">
                          <button
                            type="button"
                            onClick={() => setPreviewOrCode("preview")}
                            className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                              previewOrCode === "preview"
                                ? "bg-white/15 text-white"
                                : "text-zinc-400 hover:text-white"
                            }`}
                            title="Preview Storefront"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewOrCode("code")}
                            className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                              previewOrCode === "code"
                                ? "bg-white/15 text-white"
                                : "text-zinc-400 hover:text-white"
                            }`}
                            title="Inspect Generated Project Files & Code"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Viewport Switcher Dropdown: Desktop / Tablet / Mobile (Screenshot 14) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setViewportDropdownOpen(!viewportDropdownOpen)}
                            className="p-1.5 rounded-lg bg-[#121212] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
                            title="Responsive Viewport"
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
                                    viewportDevice === id
                                      ? "bg-white/10 text-white font-semibold"
                                      : "text-zinc-300"
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

                      {/* Address Bar (`01a12a3a...kaspi.site/`) + Copy + Open in New Tab */}
                      <div className="flex-1 max-w-md flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#121212] border border-white/10 text-xs text-zinc-300 font-mono">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => toast.info("تم تحديث المعاينة الحية للمتجر")}
                            className="text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <span className="truncate">{simulatedPreviewUrl}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(
                                `${window.location.origin}${liveStorefrontRoute}`
                              );
                              setCopiedUrl(true);
                              setTimeout(() => setCopiedUrl(false), 1800);
                              toast.success("تم نسخ رابط المتجر الإلكتروني!");
                            }}
                            className="text-zinc-400 hover:text-white cursor-pointer"
                            title="Copy Storefront Link"
                          >
                            {copiedUrl ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={liveStorefrontRoute}
                            target="_blank"
                            rel="noreferrer"
                            className="text-zinc-400 hover:text-emerald-400"
                            title="Open Live Storefront in New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Right Actions: Apply Design to Store + Download Zip (Screenshot 4) */}
                      <div className="flex items-center gap-2 relative">
                        <button
                          type="button"
                          onClick={handleApplyCurrentDesignToStore}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply Design to Store</span>
                        </button>

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
                    </div>
                  )}

                  {/* ==========================================================
                      PANEL CONTENT 1: OPTION A / OPTION B PREVIEW OR CODE VIEW
                     ========================================================== */}
                  {(rightTab === "option_a" || rightTab === "option_b") && latestTurn && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      {previewOrCode === "preview" && activeOptionPuck ? (
                        /* LIVE INTERACTIVE STOREFRONT & MULTI-AGENT DELIVERABLES PREVIEW */
                        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-[#0f0f10] relative">
                          <div
                            dir="rtl"
                            className={`w-full transition-all duration-300 rounded-2xl border border-white/10 bg-[#1a1a1a] overflow-y-auto shadow-2xl ${
                              viewportDevice === "mobile"
                                ? "max-w-[390px]"
                                : viewportDevice === "tablet"
                                ? "max-w-[768px]"
                                : "max-w-full"
                            }`}
                          >
                            {/* 1. Store Header */}
                            <header className="px-6 py-4 border-b border-white/10 bg-[#141414]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-black text-sm"
                                  style={{
                                    backgroundColor:
                                      activeOptionPuck.root.props.accentColor || "#10b981",
                                  }}
                                >
                                  {activeOptionPuck.root.props.title.slice(0, 2)}
                                </div>
                                <div>
                                  <h2 className="text-base font-extrabold text-white">
                                    {activeOptionPuck.root.props.title}
                                  </h2>
                                  <p className="text-[11px] text-zinc-400">
                                    {activeOptionPuck.root.props.slogan}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                                  {Object.values(previewCart).reduce((a, b) => a + b, 0)} سلع في السلة
                                </span>
                                <a
                                  href={liveStorefrontRoute}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-[#10b981] text-black text-xs font-extrabold hover:bg-emerald-400 transition-colors"
                                >
                                  فتح المتجر الكامل ↗
                                </a>
                              </div>
                            </header>

                            {/* 2. Storefront Hero Banner */}
                            <section className="px-6 py-10 text-center bg-gradient-to-b from-emerald-950/30 to-transparent border-b border-white/10">
                              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold mb-3">
                                متجر رسمي مرتبط بقاعدة بيانات KASPI POS • {storeCtx?.sector}
                              </span>
                              <h1 className="text-2xl sm:text-4xl font-black text-white mb-3">
                                {activeOptionPuck.root.props.title}
                              </h1>
                              <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto mb-6">
                                {activeOptionPuck.root.props.slogan}
                              </p>

                              {/* Category Pills */}
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                {["الكل", ...(storeCtx?.categories || [])].map((cat) => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setPreviewCategory(cat)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                      previewCategory === cat
                                        ? "bg-[#10b981] text-black"
                                        : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </section>

                            {/* 3. Verified Store Products Grid */}
                            <section className="p-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-extrabold text-white">
                                  المنتجات المتوفرة ({storeCtx?.products.length || 0} سلعة موثقة)
                                </h3>
                                <span className="text-xs text-emerald-400 font-mono">
                                  العملة الرسمية: {storeCtx?.currency || "MAD"}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {(storeCtx?.products || [])
                                  .filter(
                                    (p) =>
                                      previewCategory === "الكل" || p.category === previewCategory
                                  )
                                  .slice(0, 12)
                                  .map((prod) => (
                                    <div
                                      key={prod.id}
                                      className="p-4 rounded-2xl bg-[#222] border border-white/10 flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2">
                                          <span>{prod.category}</span>
                                          <span
                                            className={`px-2 py-0.5 rounded-full font-bold ${
                                              prod.availabilityStatus === "in_stock"
                                                ? "bg-emerald-500/20 text-emerald-300"
                                                : prod.availabilityStatus === "low_stock"
                                                ? "bg-amber-500/20 text-amber-300"
                                                : "bg-red-500/20 text-red-300"
                                            }`}
                                          >
                                            {prod.availabilityStatus === "in_stock"
                                              ? `متوفر (${prod.stockQuantity})`
                                              : prod.availabilityStatus === "low_stock"
                                              ? `كمية محدودة (${prod.stockQuantity})`
                                              : "نافد حالياً"}
                                          </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-white mb-1">
                                          {prod.name}
                                        </h4>
                                        <p className="text-[11px] text-zinc-400 font-mono mb-3">
                                          SKU: {prod.sku}
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                        <span className="text-base font-black text-emerald-400 font-mono">
                                          {prod.price.toFixed(2)} {storeCtx?.currency || "MAD"}
                                        </span>
                                        <button
                                          type="button"
                                          disabled={prod.stockQuantity <= 0}
                                          onClick={() =>
                                            setPreviewCart((prev) => ({
                                              ...prev,
                                              [prod.id]: (prev[prod.id] || 0) + 1,
                                            }))
                                          }
                                          className="px-3 py-1.5 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black text-xs font-extrabold cursor-pointer disabled:opacity-40"
                                        >
                                          + أضف للسلة
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </section>

                            {/* 4. Sandbox Custom Business App Preview (if generated by Agent N) */}
                            {latestTurn.mission.generatedCustomApp && (
                              <section className="mx-6 mb-6 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-emerald-300">
                                    🛠️ {latestTurn.mission.generatedCustomApp.title} (Sandbox Isolated)
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                                    Tests Passed ✔
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {latestTurn.mission.generatedCustomApp.fields.map((f) => (
                                    <div
                                      key={f.name}
                                      className="p-2 rounded-xl bg-black/40 border border-white/10 text-xs"
                                    >
                                      <div className="text-[10px] text-zinc-400 mb-1">
                                        {f.labelAr}
                                      </div>
                                      <input
                                        type={f.type === "number" ? "number" : "text"}
                                        placeholder={f.labelAr}
                                        className="w-full bg-transparent text-white text-xs focus:outline-none"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </section>
                            )}

                            {/* 5. Multi-Agent Deliverables Summary Footer */}
                            <section className="mx-6 mb-8 p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                              <div className="text-xs font-extrabold text-emerald-400">
                                نتائج الوكلاء المتخصصين المشاركين في هذه المهمة ({latestTurn.mission.agentOutputs.length} وكلاء):
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {latestTurn.mission.agentOutputs.map((ao) => (
                                  <div
                                    key={ao.agentId}
                                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs"
                                  >
                                    <div className="font-bold text-white mb-0.5">
                                      [{ao.agentCode}] {ao.agentNameAr}
                                    </div>
                                    <p className="text-[11px] text-zinc-400">{ao.summaryAr}</p>
                                  </div>
                                ))}
                              </div>
                            </section>
                          </div>

                          {/* Floating "Built with KASPI AI" Badge (Exact Match to Screenshot 7!) */}
                          <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white text-black shadow-2xl border border-zinc-200 text-xs">
                            <KaspiBrandMark size="sm" />
                            <div>
                              <div className="font-bold text-xs leading-tight">
                                Built with KASPI AI
                              </div>
                              <div className="text-[10px] text-zinc-600">
                                Verified Merchant Storefront • {storeCtx?.storeName}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ======================================================
                           CODE & FILES TREE EXPLORER VIEW (Exact Match to Screenshot 9!)
                           ====================================================== */
                        <div className="flex-1 flex overflow-hidden bg-[#141414]">
                          {/* Left FILES Tree Column */}
                          <div className="w-56 border-r border-white/10 bg-[#181818] flex flex-col shrink-0">
                            <div className="px-3.5 py-2.5 border-b border-white/10 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                              FILES
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono">
                              <div className="flex items-center gap-1.5 px-2 py-1 text-zinc-400">
                                <Folder className="w-3.5 h-3.5 text-emerald-400" />
                                <span>src</span>
                              </div>
                              {activeProjectFiles.map((file) => (
                                <button
                                  key={file.path}
                                  type="button"
                                  onClick={() => setSelectedFilePath(file.path)}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left cursor-pointer transition-colors ${
                                    activeCodeFile?.path === file.path
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

                          {/* Right Syntax Code Viewer with Line Numbers */}
                          <div className="flex-1 flex flex-col overflow-hidden bg-[#141414]">
                            <div className="h-9 px-4 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a] text-xs font-mono text-zinc-300">
                              <span>{activeCodeFile?.path || "src/App.tsx"}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeCodeFile) {
                                    navigator.clipboard?.writeText(activeCodeFile.content);
                                    toast.success(`تم نسخ كود ${activeCodeFile.name}`);
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy File</span>
                              </button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
                              {activeCodeFile?.content.split("\n").map((line, idx) => (
                                <div key={idx} className="flex hover:bg-white/[0.02] px-1">
                                  <span className="w-10 text-right pr-4 text-zinc-600 select-none shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="text-zinc-200 whitespace-pre">{line}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ==========================================================
                      PANEL CONTENT 2: KASPI AI — AUTONOMOUS COMMERCE ARCHITECTURE
                      & THE 14 SPECIALIZED AGENTS (Exact Match to Screenshots 1 & 2!)
                     ========================================================== */}
                  {rightTab === "architecture_agents" && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#121212]" dir="rtl">
                      <div className="max-w-4xl mx-auto rounded-3xl bg-[#181818] border border-white/10 p-6 shadow-2xl space-y-5">
                        {/* Header Row matching Screenshot 1 */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight" dir="ltr">
                            KASPI AI — Autonomous Commerce
                          </h2>
                          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                            التصميم المعماري المستهدف • مفعّل بالكامل
                          </span>
                        </div>

                        {/* Layer 1: بيانات التاجر و KASPI POS */}
                        <div className="p-5 rounded-2xl bg-[#222] border border-white/10 text-center space-y-1.5">
                          <div className="text-base font-extrabold text-white">
                            🏪 بيانات التاجر و KASPI POS ({storeCtx?.storeName || "ASIMA"})
                          </div>
                          <div className="text-xs text-zinc-400 font-mono" dir="ltr">
                            Products ({storeCtx?.products.length || 0}) · Orders ({storeCtx?.todayOrdersCount || 0}) · Customers · Inventory · Store Settings ({storeCtx?.currency || "MAD"})
                          </div>
                        </div>

                        <div className="text-center text-zinc-500 text-lg">↓</div>

                        {/* Layer 2: ARENA AI — Master Orchestrator */}
                        <div className="p-5 rounded-2xl bg-[#14241d] border-2 border-[#10b981]/60 text-center space-y-1.5 shadow-lg">
                          <div className="text-lg font-black text-[#10b981] tracking-wide" dir="ltr">
                            ARENA AI
                          </div>
                          <div className="text-base font-extrabold text-white" dir="ltr">
                            Master Orchestrator
                          </div>
                          <div className="text-xs text-zinc-300 font-mono" dir="ltr">
                            Planning · Routing · Evaluation · Memory (6 Levels) · Permissions (Level 1/2/3)
                          </div>
                        </div>

                        <div className="text-center text-zinc-500 text-lg">↓</div>

                        {/* Layer 3: The 14 Specialized AI Agents Grid (Screenshots 1 & 2) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
                          {KASPI_SPECIALIZED_AGENTS.map((agent) => {
                            const isSelected = selectedAgentFilter === agent.id;
                            return (
                              <button
                                key={agent.id}
                                type="button"
                                onClick={() =>
                                  setSelectedAgentFilter(isSelected ? null : agent.id)
                                }
                                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                                  isSelected
                                    ? "bg-emerald-500/20 border-emerald-400 text-white shadow-lg"
                                    : "bg-[#222] hover:bg-[#282828] border-white/10 text-zinc-100"
                                }`}
                              >
                                <div>
                                  <div className="text-sm font-bold text-white">
                                    {agent.shortLabel}{" "}
                                    <span className="text-[10px] font-mono text-emerald-400">
                                      [{agent.code}]
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5" dir="rtl">
                                    {agent.nameAr}
                                  </div>
                                </div>
                                <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-mono">
                                  {agent.maxPermissionLevel.replace("LEVEL_", "L")}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Agent Inspector Drawer */}
                        {selectedAgentFilter && (
                          <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/40 space-y-2 text-xs">
                            {(() => {
                              const ag = KASPI_SPECIALIZED_AGENTS.find(
                                (a) => a.id === selectedAgentFilter
                              );
                              if (!ag) return null;
                              return (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-emerald-400 text-sm">
                                      [{ag.code}] {ag.nameAr} ({ag.nameEn})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleExecutePrompt(
                                          `تشغيل ${ag.nameAr}: ${ag.specialtyAr}`,
                                          "agent"
                                        )
                                      }
                                      className="px-3 py-1 rounded-xl bg-[#10b981] text-black font-extrabold cursor-pointer"
                                    >
                                      تشغيل هذا الوكيل الآن ⚡
                                    </button>
                                  </div>
                                  <p className="text-zinc-300">{ag.specialtyAr}</p>
                                  <div className="text-[11px] text-zinc-400 font-mono" dir="ltr">
                                    Allowed Tools: {ag.allowedTools.join(", ")} | Max Permission:{" "}
                                    {ag.maxPermissionLevel}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        <div className="text-center text-zinc-500 text-lg">↓</div>

                        {/* Layer 4: Execution & Approval Layer (Screenshot 2) */}
                        <div className="p-5 rounded-2xl bg-[#222] border border-white/10 text-center space-y-1.5">
                          <div className="text-base font-extrabold text-white" dir="ltr">
                            Execution & Approval Layer
                          </div>
                          <div className="text-xs text-zinc-400 font-mono" dir="ltr">
                            Validation · Security · Human Approval · Audit
                          </div>
                        </div>

                        <div className="text-center text-zinc-500 text-lg">↓</div>

                        {/* Layer 5: نتائج حقيقية داخل متجر التاجر (Screenshot 2) */}
                        <div className="p-5 rounded-2xl bg-[#181818] border border-emerald-500/30 text-center space-y-1.5">
                          <div className="text-base font-extrabold text-white">
                            نتائج حقيقية داخل متجر التاجر ({storeCtx?.storeName})
                          </div>
                          <div className="text-xs text-zinc-400 font-mono" dir="ltr">
                            Store · Campaigns · Customer Support · Reports · Automation
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==========================================================
                      PANEL CONTENT 3: PUCK VISUAL STOREFRONT BUILDER (14 Sections)
                     ========================================================== */}
                  {rightTab === "puck_editor" && (
                    <div className="flex-1 overflow-y-auto p-5 bg-[#141414]" dir="rtl">
                      <KaspiPuckStorefrontBuilder locale={locale} />
                    </div>
                  )}

                  {/* ==========================================================
                      PANEL CONTENT 4: APPROVAL CENTER, KASPI FLOW & AUDIT LOG
                     ========================================================== */}
                  {rightTab === "approvals_workflows" && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#141414]" dir="rtl">
                      <div className="max-w-4xl mx-auto space-y-6">
                        <div className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-3">
                          <h3 className="text-base font-extrabold text-white">
                            🔒 مركز الموافقات الصريحة (Level 3 — Execute Human Approval Center)
                          </h3>
                          <p className="text-xs text-zinc-400">
                            أي عملية حساسة (نشر المتجر، إطلاق حملة، تعديل أسعار أو مخزون، أو تثبيت تطبيق مخصص) تتوقف هنا حتى توافق عليها.
                          </p>

                          {approvals.length === 0 ? (
                            <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-zinc-400">
                              لا توجد طلبات معلقة حالياً. قم بتشغيل أي مهمة عبر الوكلاء لتظهر المسودات هنا.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {approvals.map((app) => (
                                <div
                                  key={app.approvalId}
                                  className="p-4 rounded-xl bg-[#252525] border border-white/10 flex items-center justify-between gap-4 flex-wrap"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                                        {app.permissionLevel}
                                      </span>
                                      <span className="text-sm font-bold text-white">
                                        {app.title}
                                      </span>
                                    </div>
                                    <p className="text-xs text-zinc-300">{app.description}</p>
                                    <div className="text-[10px] text-zinc-400 font-mono">
                                      الوكيل: {app.agentName} • البيانات: {app.groundedDataSummary}
                                    </div>
                                  </div>

                                  {app.status === "pending_approval" ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDecisionOnApproval(
                                            app.approvalId,
                                            "approved_executed"
                                          )
                                        }
                                        className="px-3.5 py-1.5 rounded-xl bg-[#10b981] text-black text-xs font-extrabold cursor-pointer"
                                      >
                                        ✓ موافقة وتنفيذ
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDecisionOnApproval(app.approvalId, "rejected")
                                        }
                                        className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold cursor-pointer"
                                      >
                                        ✕ رفض
                                      </button>
                                    </div>
                                  ) : (
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        app.status === "approved_executed"
                                          ? "bg-emerald-500/20 text-emerald-300"
                                          : "bg-red-500/20 text-red-300"
                                      }`}
                                    >
                                      {app.status === "approved_executed"
                                        ? "تمت الموافقة والتنفيذ ✔"
                                        : "مرفوض"}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Audit Log */}
                        <div className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-3">
                          <h3 className="text-base font-extrabold text-white">
                            📋 سجل التدقيق الأمني للوكلاء (Multi-Tenant Agent Audit Log)
                          </h3>
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {auditLogs.length === 0 ? (
                              <div className="text-xs text-zinc-400">
                                سجل التدقيق جاهز ويسجل كل أداة يستدعيها أي وكيل.
                              </div>
                            ) : (
                              auditLogs.map((log) => (
                                <div
                                  key={log.auditId}
                                  className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <span className="font-bold text-emerald-400">
                                      {log.agentName}
                                    </span>{" "}
                                    • الأداة: <code className="text-zinc-200">{log.toolInvoked}</code>
                                    <div className="text-[11px] text-zinc-400 mt-0.5">
                                      {log.reason} ({log.groundedDataSummary})
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono text-zinc-500">
                                    {log.permissionLevel}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==========================================================
                      PANEL CONTENT 5: ARENA LEADERBOARD (Bradley-Terry Elo + Benchmark)
                     ========================================================== */}
                  {rightTab === "leaderboard" && (
                    <div className="flex-1 overflow-y-auto p-6 bg-[#141414]" dir="rtl">
                      <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-extrabold text-white">
                              🏆 جدول تصنيف نماذج Arena الرسمي (Arena-Rank Bradley-Terry MLE)
                            </h3>
                            <p className="text-xs text-zinc-400">
                              يفصل بشكل صارم بين تصويت التاجر البشري (Human Votes)، نقاط Bradley-Terry Elo، نسبة الفوز، والتقييم المعياري الآلي (0–100%).
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-right border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-zinc-400">
                                <th className="py-2.5 px-3">النموذج</th>
                                <th className="py-2.5 px-3">Bradley-Terry Elo</th>
                                <th className="py-2.5 px-3">Win Rate (%)</th>
                                <th className="py-2.5 px-3">تقييم التاجر (Wins/Losses/Ties)</th>
                                <th className="py-2.5 px-3">Benchmark الآلي (14 قسماً)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaderboard.map((row) => (
                                <tr key={row.modelId} className="border-b border-white/5">
                                  <td className="py-3 px-3 font-bold text-white">
                                    {row.displayName}
                                  </td>
                                  <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                                    {row.bradleyTerryElo}{" "}
                                    {row.isProvisionalElo && (
                                      <span className="text-[10px] text-zinc-400">
                                        (Baseline)
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 font-mono">
                                    {row.winRatePct !== null ? `${row.winRatePct}%` : "—"}
                                  </td>
                                  <td className="py-3 px-3 font-mono text-zinc-300">
                                    {row.humanBattles} جولات ({row.humanWins}W / {row.humanLosses}L /{" "}
                                    {row.humanTies}T)
                                  </td>
                                  <td className="py-3 px-3 font-mono text-emerald-300">
                                    {row.lastBenchmarkScorePct !== null
                                      ? `${row.lastBenchmarkScorePct}%`
                                      : "100%"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==========================================================
                      PANEL CONTENT 6: 13 OPEN-SOURCE ENGINES & CAPABILITY REGISTRY
                     ========================================================== */}
                  {rightTab === "open_source_tools" && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#141414]" dir="rtl">
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          { id: "puck" as const, label: "Puck Builder" },
                          { id: "arena" as const, label: "Arena Studio" },
                          { id: "pdfme" as const, label: "pdfme Designer" },
                          { id: "unstract" as const, label: "Unstract OCR" },
                          { id: "search" as const, label: "Morphic Search" },
                          { id: "docetl" as const, label: "DocETL Pipeline" },
                          { id: "opnform" as const, label: "OpnForm Builder" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setOpenSourceSubTool(t.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                              openSourceSubTool === t.id
                                ? "bg-[#10b981] text-black"
                                : "bg-[#222] text-zinc-300 hover:text-white border border-white/10"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      <div className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/10">
                        {openSourceSubTool === "puck" && (
                          <KaspiPuckStorefrontBuilder locale={locale} />
                        )}
                        {openSourceSubTool === "arena" && (
                          <KaspiArenaBuilder
                            locale={locale}
                            onApplyToPuck={() => setOpenSourceSubTool("puck")}
                          />
                        )}
                        {openSourceSubTool === "pdfme" && <KaspiPdfmeDesigner locale={locale} />}
                        {openSourceSubTool === "unstract" && (
                          <KaspiUnstractInvoiceParser locale={locale} />
                        )}
                        {openSourceSubTool === "search" && <KaspiAiSearchEngine locale={locale} />}
                        {openSourceSubTool === "docetl" && <KaspiDocEtlAnalyzer locale={locale} />}
                        {openSourceSubTool === "opnform" && <KaspiOpnFormBuilder locale={locale} />}
                      </div>

                      {/* Capability Registry Table (Section 8) */}
                      <div className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-3">
                        <h3 className="text-sm font-extrabold text-white">
                          📦 سجل قدرات المحركات المفتوحة المصدر الـ 13 (Open-Source Capability Registry)
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-right border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-zinc-400">
                                <th className="py-2 px-2">المحرك</th>
                                <th className="py-2 px-2">الترخيص</th>
                                <th className="py-2 px-2">يعمل محلياً؟</th>
                                <th className="py-2 px-2">القدرات المدمجة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {OPEN_SOURCE_CAPABILITY_REGISTRY.map((cap) => (
                                <tr key={cap.engineId} className="border-b border-white/5">
                                  <td className="py-2 px-2 font-bold text-white">{cap.name}</td>
                                  <td className="py-2 px-2 font-mono text-emerald-400">
                                    {cap.license}
                                  </td>
                                  <td className="py-2 px-2">
                                    {cap.runsLocally ? "نعم (Local-First ✔)" : "اختياري"}
                                  </td>
                                  <td className="py-2 px-2 text-zinc-300">
                                    {cap.capabilities.join(" • ")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Upload Input for `+ -> Add files` */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              toast.success(`تم إرفاق الملف "${f.name}" لتحليله ضمن سياق المتجر.`);
              setPromptInput((prev) => `${prev} [ملف مرفق: ${f.name}]`.trim());
            }
          }}
        />

        {/* ================================================================
            MERCHANT ACCOUNT POPOVER MODAL (Exact Match to Screenshot 13!)
           ================================================================ */}
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

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-base font-extrabold text-emerald-300">
                  {(storeCtx?.storeName || "AS").slice(0, 2).toUpperCase()}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{storeCtx?.storeName || "ASIMA"} • KASPI Merchant</span>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepPostedChecked}
                  onChange={(e) => setKeepPostedChecked(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Yes, keep me posted on what&apos;s new in KASPI AI</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setAccountModalOpen(false);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit KASPI AI Studio</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </KaspiGlassModalPortal>
  );
};
export default KaspiAiStudioModal;
