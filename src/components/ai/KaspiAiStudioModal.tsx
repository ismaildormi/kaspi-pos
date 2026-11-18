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
  FolderOpen,
  Square,
  CheckCircle2,
  Image as ImageIcon,
  Film,
  Store,
  BarChart3,
  Layers,
  MapPin,
  AtSign,
  Library as LibraryIcon,
  LayoutGrid,
  Activity,
  MousePointerClick,
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
  checkClientAiHordeJobStatus,
  detectEffectiveModality,
  executeArenaTurnClientFirst,
  sanitizeExplanationFromCodeLeaks,
} from "@/lib/ai/arena-client-runner";
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
import {
  UNIVERSAL_INTEGRATIONS_CATALOG,
  detectIntegrationsMentionedInText,
} from "@/lib/ai/integrations-registry";
import {
  appendArtifactToLibrary,
  buildUnifiedLibraryContextSummary,
  loadKaspiLibrary,
  saveKaspiLibrary,
  saveLocationToLibrary,
  saveSkillToLibrary,
  syncConnectedPluginsToLibrary,
  type KaspiLocalLibraryState,
  type LibraryArtifactItem,
  type LibraryBusinessKnowledge,
  type StoreMapsLocation,
} from "@/lib/ai/kaspi-library-memory";
import { KaspiPluginsCenter, type VaultConnectionItem } from "./os/KaspiPluginsCenter";
import { KaspiMapsLocationPanel } from "./os/KaspiMapsLocationPanel";
import { KaspiLibraryView } from "./os/KaspiLibraryView";
import { KaspiBusinessOsPanel } from "./os/KaspiBusinessOsPanel";
import { KaspiVisualSetupModal } from "./os/KaspiVisualSetupModal";
import { usePosStore } from "@/client/store/usePosStore";
import { getApiUrl } from "@/client/sync-engine";
import { toast } from "sonner";

interface KaspiAiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  initialTab?: string;
}

type ActiveCanvasView =
  | "arena"
  | "leaderboard"
  | "library"
  | "plugins"
  | "maps"
  | "business_os"
  | "visual_setup"
  | "puck_builder"
  | "open_tools"
  | "help";
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
  modality: "code" | "text" | "search" | "image" | "video";
  outputA: ArenaModelOutput;
  outputB: ArenaModelOutput | null;
  voteOutcome: BattleOutcome | null;
  expandedA?: boolean;
  expandedB?: boolean;
  suggestedPluginIds?: string[];
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
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveCanvasView>("arena");
  const [openToolTab, setOpenToolTab] = useState<OpenSourceSubTool>("puck");
  const [focusPluginServiceId, setFocusPluginServiceId] = useState<string | null>(null);
  const [openPluginVisualSetup, setOpenPluginVisualSetup] = useState(false);
  const [vaultConnections, setVaultConnections] = useState<VaultConnectionItem[]>([]);
  const [libraryState, setLibraryState] = useState<KaspiLocalLibraryState>(() =>
    loadKaspiLibrary("default")
  );

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
  const [buildElapsedMs, setBuildElapsedMs] = useState<number>(0);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const homeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const followTextareaRef = useRef<HTMLTextAreaElement>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);

  const autoResizeTextarea = (el: HTMLTextAreaElement | null, minPx: number, maxPx: number) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(maxPx, Math.max(minPx, el.scrollHeight))}px`;
  };

  const formatElapsedArena = (ms: number): string => {
    const secs = Math.max(0.1, ms / 1000);
    if (secs < 60) return `${secs.toFixed(1)}s`;
    const mins = Math.floor(secs / 60);
    const rem = (secs % 60).toFixed(1);
    return `${mins}m ${rem}s`;
  };

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

  // 2. Load Threads & Local On-Device Library + Encrypted Integration Metadata
  useEffect(() => {
    if (!isOpen) return;
    setLibraryState(loadKaspiLibrary(storageScopeKey));

    fetch(getApiUrl("/api/ai/integrations"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.success) return;
        if (Array.isArray(data.connections)) {
          setVaultConnections(data.connections);
          const summaries = data.connections.map((c: VaultConnectionItem) => ({
            serviceId: c.serviceId,
            name: UNIVERSAL_INTEGRATIONS_CATALOG.find((x) => x.id === c.serviceId)?.name || c.serviceId,
            verificationStatus: c.verificationStatus,
            permissionPreset: c.permissionPreset,
            approvalPolicy: c.approvalPolicy,
            verifiedIdentity: c.verifiedIdentity,
            updatedAt: c.updatedAt,
          }));
          setLibraryState(syncConnectedPluginsToLibrary(storageScopeKey, summaries));
        }
        if (data.location && typeof data.location.lat === "number") {
          setLibraryState(saveLocationToLibrary(storageScopeKey, data.location));
        }
      })
      .catch(() => {});

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

  const handleConnectionsUpdated = (nextConns: VaultConnectionItem[]) => {
    setVaultConnections(nextConns);
    const summaries = nextConns.map((c) => ({
      serviceId: c.serviceId,
      name: UNIVERSAL_INTEGRATIONS_CATALOG.find((x) => x.id === c.serviceId)?.name || c.serviceId,
      verificationStatus: c.verificationStatus,
      permissionPreset: c.permissionPreset,
      approvalPolicy: c.approvalPolicy,
      verifiedIdentity: c.verifiedIdentity,
      updatedAt: c.updatedAt,
    }));
    setLibraryState(syncConnectedPluginsToLibrary(storageScopeKey, summaries));
  };

  const handleSaveLocation = (loc: StoreMapsLocation) => {
    setLibraryState(saveLocationToLibrary(storageScopeKey, loc));
  };

  const handleSaveSkill = (skill: {
    name: string;
    description: string;
    instructionPrompt: string;
    category: string;
  }) => {
    setLibraryState(saveSkillToLibrary(storageScopeKey, skill));
  };

  const handleUpdateKnowledge = (knowledge: LibraryBusinessKnowledge) => {
    const cur = loadKaspiLibrary(storageScopeKey);
    const next = { ...cur, knowledge };
    saveKaspiLibrary(storageScopeKey, next);
    setLibraryState(next);
  };

  const handleDeleteArtifact = (id: string) => {
    const cur = loadKaspiLibrary(storageScopeKey);
    const next = { ...cur, artifacts: cur.artifacts.filter((a) => a.id !== id) };
    saveKaspiLibrary(storageScopeKey, next);
    setLibraryState(next);
  };

  const handleOpenArtifactInCanvas = (item: LibraryArtifactItem) => {
    const synthTurn: ArenaTurnRecord = {
      turnId: `lib-view-${item.id}`,
      timestamp: item.createdAt,
      userPrompt: item.prompt,
      mode: "direct",
      modality: item.kind === "video" ? "video" : item.kind === "image" ? "image" : "code",
      outputA: {
        modelId: "library-restored",
        modelName: item.modelName || "Library Saved Project",
        providerLabel: "Local Machine Library",
        status: "completed",
        latencyMs: 10,
        replyMarkdown: `Restored "${item.title}" from your local machine Library memory.`,
        stepsLog: ["Loaded cleanly from on-device Library"],
        modalityExecuted: item.kind === "video" ? "video" : item.kind === "image" ? "image" : "code",
        files: item.files || [],
        previewHtml: item.previewHtml || null,
        imageUrl: item.imageUrl || null,
      },
      outputB: null,
      voteOutcome: null,
    };
    const newId = `chat-lib-${Date.now().toString(36)}`;
    const thread: ArenaConversationThread = {
      id: newId,
      title: item.title,
      createdAt: item.createdAt,
      updatedAt: new Date().toISOString(),
      turns: [synthTurn],
    };
    persistThreads([thread, ...threads]);
    setActiveThreadId(newId);
    setSelectedSide("A");
    setPreviewOrCode("preview");
    setActiveView("arena");
  };

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
          let data: { done?: boolean; imgUrl?: string | null } | null = null;
          try {
            data = await checkClientAiHordeJobStatus(job.jobId);
          } catch {
            const res = await fetch(
              getApiUrl(`/api/ai/arena-execute?action=image_status&id=${encodeURIComponent(job.jobId)}`)
            );
            if (res.ok) data = await res.json();
          }
          if (data?.done && data?.imgUrl) {
            const resolvedUrl = data.imgUrl;
            setThreads((prev) => {
              const updated = prev.map((th) =>
                th.id !== activeThread.id
                  ? th
                  : {
                      ...th,
                      turns: th.turns.map((tn) => {
                        if (tn.turnId !== job.turnId) return tn;
                        if (job.side === "A") {
                          return { ...tn, outputA: { ...tn.outputA, imageUrl: resolvedUrl } };
                        }
                        if (tn.outputB) {
                          return { ...tn, outputB: { ...tn.outputB, imageUrl: resolvedUrl } };
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

  // Live elapsed timer when active build is running
  useEffect(() => {
    if (!isExecuting) {
      setBuildElapsedMs(0);
      return;
    }
    const t0 = Date.now();
    setBuildElapsedMs(100);
    const id = setInterval(() => {
      setBuildElapsedMs(Date.now() - t0);
    }, 200);
    return () => clearInterval(id);
  }, [isExecuting]);

  const updateTurnInThread = (
    targetThreadId: string,
    turnId: string,
    updater: (turn: ArenaTurnRecord) => ArenaTurnRecord
  ) => {
    setThreads((prev) => {
      const next = prev.map((t) =>
        t.id !== targetThreadId
          ? t
          : {
              ...t,
              updatedAt: new Date().toISOString(),
              turns: t.turns.map((tr) => (tr.turnId === turnId ? updater(tr) : tr)),
            }
      );
      try {
        localStorage.setItem(`${ARENA_HISTORY_PREFIX}${storageScopeKey}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Send Prompt to Multi-Stage Arena Engine (Immediate Live Split Building + Streaming Progress)
  const handleSendPrompt = async (customPrompt?: string) => {
    const promptText = (customPrompt ?? promptInput).trim();
    if (!promptText || isExecuting) return;

    setIsExecuting(true);
    setPromptInput("");
    if (homeTextareaRef.current) homeTextareaRef.current.style.height = "auto";
    if (followTextareaRef.current) followTextareaRef.current.style.height = "auto";
    setActiveView("arena");
    setPlusMenuOpen(false);
    setModeDropdownOpen(false);
    setModalityDropdownOpen(false);

    const filesSnapshot = [...attachedFiles];
    setAttachedFiles([]);

    // Capture prior conversation & project files BEFORE appending optimistic building turn
    const priorThread = activeThread;
    const priorTurn = latestTurn;
    const history = priorThread
      ? priorThread.turns.flatMap((t) => [
          { role: "user" as const, content: t.userPrompt },
          { role: "assistant" as const, content: t.outputA.replyMarkdown },
        ])
      : [];

    const predictedModality = detectEffectiveModality(
      modality,
      promptText,
      priorTurn?.modality
    );

    const turnId = `turn-${Date.now().toString(36)}`;
    const isSingle = arenaMode === "direct";
    const buildingTurn: ArenaTurnRecord = {
      turnId,
      timestamp: new Date().toISOString(),
      userPrompt: promptText,
      attachments: filesSnapshot.length > 0 ? filesSnapshot : undefined,
      mode: arenaMode,
      modality: predictedModality,
      outputA: {
        modelId: modelAId,
        modelName: "Option A",
        providerLabel: "KASPI AI",
        status: "building",
        latencyMs: 0,
        replyMarkdown: "",
        stepsLog: ["Initializing workspace & analyzing requirements..."],
        modalityExecuted: predictedModality,
        files: [],
        previewHtml: null,
      },
      outputB: isSingle
        ? null
        : {
            modelId: modelBId,
            modelName: "Option B",
            providerLabel: "KASPI AI",
            status: "building",
            latencyMs: 0,
            replyMarkdown: "",
            stepsLog: ["Initializing workspace & analyzing requirements..."],
            modalityExecuted: predictedModality,
            files: [],
            previewHtml: null,
          },
      voteOutcome: null,
    };

    const targetThreadId = priorThread?.id || `chat-${Date.now().toString(36)}`;
    if (priorThread) {
      persistThreads(
        threads.map((t) =>
          t.id === priorThread.id
            ? { ...t, updatedAt: new Date().toISOString(), turns: [...t.turns, buildingTurn] }
            : t
        )
      );
    } else {
      const newThread: ArenaConversationThread = {
        id: targetThreadId,
        title: promptText.slice(0, 48),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        turns: [buildingTurn],
      };
      persistThreads([newThread, ...threads]);
      setActiveThreadId(targetThreadId);
    }

    setSelectedSide("A");
    setPreviewOrCode("preview");

    const controller = new AbortController();
    abortCtrlRef.current = controller;

    try {
      const libraryContextSnippet = buildUnifiedLibraryContextSummary(storageScopeKey);
      const result = await executeArenaTurnClientFirst({
        prompt: promptText,
        mode: arenaMode,
        modality,
        modelAId,
        modelBId,
        history,
        previousTurnModality: priorTurn?.modality,
        previousFilesA: priorTurn?.outputA.files,
        previousFilesB: priorTurn?.outputB?.files,
        includeStoreContext,
        libraryContextSnippet,
        attachments: filesSnapshot.map((f) => ({
          name: f.name,
          type: f.type,
          textExcerpt: f.textExcerpt,
        })),
        serverExecuteUrl: getApiUrl("/api/ai/arena-execute"),
        signal: controller.signal,
        onProgress: (upd) => {
          updateTurnInThread(targetThreadId, turnId, (tr) => {
            if (upd.side === "A") {
              return {
                ...tr,
                outputA: {
                  ...tr.outputA,
                  stepsLog: upd.stepsLog,
                  replyMarkdown: upd.replyDraft ?? tr.outputA.replyMarkdown,
                },
              };
            }
            if (upd.side === "B" && tr.outputB) {
              return {
                ...tr,
                outputB: {
                  ...tr.outputB,
                  stepsLog: upd.stepsLog,
                  replyMarkdown: upd.replyDraft ?? tr.outputB.replyMarkdown,
                },
              };
            }
            return tr;
          });
        },
      });

      const finalOutputA = result.outputA;
      const finalOutputB = result.outputB;

      // Detect external integrations needed/mentioned so ChatGPT-style Connect Cards show inline!
      const connectedIds = [
        ...vaultConnections.map((c) => c.serviceId),
        ...(libraryState.location ? ["maps_location"] : []),
      ];
      const suggested = detectIntegrationsMentionedInText(
        `${promptText}\n${finalOutputA.replyMarkdown}\n${finalOutputB?.replyMarkdown || ""}`,
        connectedIds
      );

      // Save created sites/apps/stores/videos into user's persistent On-Device Library!
      if (finalOutputA.previewHtml) {
        const kind: LibraryArtifactItem["kind"] =
          result.effectiveModality === "video"
            ? "video"
            : /(store|shop|boutique|متجر|عبايات)/i.test(promptText)
            ? "store"
            : /(game|arcade|لعبة)/i.test(promptText)
            ? "game"
            : /(website|landing|موقع|صفحة)/i.test(promptText)
            ? "website"
            : "app";
        setLibraryState(
          appendArtifactToLibrary(storageScopeKey, {
            kind,
            title: promptText.slice(0, 48),
            prompt: promptText,
            modelName: "KASPI AI",
            previewHtml: finalOutputA.previewHtml,
            files: finalOutputA.files,
          })
        );
      }

      updateTurnInThread(targetThreadId, turnId, (tr) => ({
        ...tr,
        modality: result.effectiveModality || tr.modality,
        outputA: finalOutputA,
        outputB: finalOutputB,
        suggestedPluginIds: suggested.map((s) => s.id),
      }));

      setSelectedSide("A");
      setPreviewOrCode("preview");
      const preferredEntry =
        finalOutputA.files.find((f) => f.path === "index.html") || finalOutputA.files[0];
      if (preferredEntry) {
        setSelectedFilePath(preferredEntry.path);
      }
      setShowBuiltBadge(true);
    } catch (err: any) {
      updateTurnInThread(targetThreadId, turnId, (tr) => ({
        ...tr,
        outputA:
          tr.outputA.status === "building"
            ? {
                ...tr.outputA,
                status: "failed",
                replyMarkdown:
                  err?.name === "AbortError"
                    ? "تم إيقاف البناء بناءً على طلبك."
                    : `تعذر إكمال البناء: ${String(err?.message || err)}`,
              }
            : tr.outputA,
        outputB:
          tr.outputB && tr.outputB.status === "building"
            ? {
                ...tr.outputB,
                status: "failed",
                replyMarkdown:
                  err?.name === "AbortError"
                    ? "Stopped."
                    : `Build interrupted: ${String(err?.message || err)}`,
              }
            : tr.outputB,
      }));
      if (err?.name !== "AbortError") {
        toast.error(`تعذر تنفيذ الطلب في Arena: ${String(err?.message || err)}`);
      }
    } finally {
      setIsExecuting(false);
      abortCtrlRef.current = null;
    }
  };

  // Real Human Preference Vote (Updates Leaderboard silently while keeping workspace blind & clean)
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
      toast.success("Recorded preference: Option A");
    } else if (outcome === "model_b") {
      setSelectedSide("B");
      toast.success("Recorded preference: Option B");
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
        latestTurn.outputB?.modalityExecuted === "image" ||
        (latestTurn.outputA.status === "building" &&
          ["code", "video", "image"].includes(latestTurn.outputA.modalityExecuted)))
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
    if (!turn.outputB) return "KASPI AI";
    return `Option ${side}`;
  };

  const handleToggleExpandSteps = (turnId: string, side: "A" | "B") => {
    const updated = threads.map((th) =>
      th.id !== activeThreadId
        ? th
        : {
            ...th,
            turns: th.turns.map((tr) =>
              tr.turnId !== turnId
                ? tr
                : side === "A"
                ? { ...tr, expandedA: !tr.expandedA }
                : { ...tr, expandedB: !tr.expandedB }
            ),
          }
    );
    persistThreads(updated);
  };

  const renderArenaControlsBar = (opts: { openUpwards: boolean; compact?: boolean }) => {
    const posClass = opts.openUpwards ? "bottom-10" : "top-10";
    const plusPosClass = opts.openUpwards ? "bottom-10" : "bottom-10";
    return (
      <div className="flex items-center gap-1.5 flex-wrap relative">
        {/* + Add Files / Screenshot / Voice / Store Context */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setPlusMenuOpen(!plusMenuOpen);
              setModeDropdownOpen(false);
              setModalityDropdownOpen(false);
            }}
            className={`${
              opts.compact ? "w-7 h-7" : "w-8 h-8"
            } rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer`}
            title="Add files, screenshot, voice, or POS Store Data"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {plusMenuOpen && (
            <div
              className={`absolute left-0 ${plusPosClass} z-50 w-60 rounded-xl bg-[#252525] border border-white/15 shadow-2xl py-1.5 text-xs`}
            >
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
                      : "Store Context Detached: pure client Arena mode"
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

        {/* Mode Dropdown (`Battle Mode`, `Agent Mode`, `Side by Side`, `Direct`) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setModeDropdownOpen(!modeDropdownOpen);
              setPlusMenuOpen(false);
              setModalityDropdownOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 ${
              opts.compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"
            } rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-medium text-zinc-200 cursor-pointer`}
          >
            <Swords className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {arenaMode === "battle"
                ? "Battle"
                : arenaMode === "agent"
                ? "Agent Mode"
                : arenaMode === "side_by_side"
                ? "Side by Side"
                : arenaMode === "autonomous"
                ? "Autonomous"
                : arenaMode === "integration"
                ? "Integration"
                : "Direct"}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {modeDropdownOpen && (
            <div
              className={`absolute left-0 ${posClass} z-50 w-68 rounded-xl bg-[#252525] border border-white/15 shadow-2xl py-1.5 text-xs`}
            >
              {[
                { id: "battle" as const, title: "Battle Mode", desc: "Battle 2 anonymous models", Icon: Swords },
                { id: "agent" as const, title: "Agent Mode", desc: "Multi-step planning & execution", Icon: Cpu },
                {
                  id: "side_by_side" as const,
                  title: "Side by Side",
                  desc: "Compare 2 models of your choice",
                  Icon: MessageSquare,
                },
                { id: "direct" as const, title: "Direct", desc: "Single-model chat & authorized tools", Icon: Bot },
                {
                  id: "autonomous" as const,
                  title: "Autonomous Mode",
                  desc: "Recurring workflows, monitoring & alerts",
                  Icon: Activity,
                },
                {
                  id: "integration" as const,
                  title: "Integration Mode",
                  desc: "Connect apps, APIs & Visual Screenshot Setup",
                  Icon: AtSign,
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

        {/* Capability Selector (`Auto`, `Code`, `Text`, `Search`, `Image`, `Video`) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setModalityDropdownOpen(!modalityDropdownOpen);
              setPlusMenuOpen(false);
              setModeDropdownOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 ${
              opts.compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"
            } rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-medium text-zinc-200 cursor-pointer`}
          >
            {modality === "search" ? (
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
            ) : modality === "image" ? (
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            ) : modality === "video" ? (
              <Film className="w-3.5 h-3.5 text-emerald-400" />
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
                : modality === "video"
                ? "Video (.webm)"
                : "Text Chat"}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {modalityDropdownOpen && (
            <div
              className={`absolute left-0 ${posClass} z-50 w-60 rounded-xl bg-[#252525] border border-white/15 shadow-2xl py-1.5 text-xs`}
            >
              {[
                { id: "auto" as const, title: "Auto", desc: "Smart routing (Code / Search / Image / Chat)" },
                { id: "code" as const, title: "Code", desc: "Live Web Apps, Sites, Stores + Files + Zip" },
                { id: "text" as const, title: "Text Chat", desc: "Reasoning, Strategy & Copywriting" },
                { id: "search" as const, title: "Web Search", desc: "Live Web Research & Verified Sources" },
                { id: "image" as const, title: "Image Gen", desc: "Visual Artwork & Product Graphics" },
                { id: "video" as const, title: "Promo Video", desc: "Multi-Scene HD Promo Video + .webm Export" },
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold">
            <Store className="w-3 h-3" />
            <span>POS</span>
          </span>
        )}
      </div>
    );
  };

  // Strict blind Arena policy: hide model picker dropdowns & internal providers completely so users see clean results only.
  const renderModelPickers = (_compact?: boolean) => null;

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

              {/* Clean Arena + Business OS Sidebar Nav (Matches Uploaded Screenshots!) */}
              <div className="p-2 space-y-0.5 text-xs relative">
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
                  onClick={() => {
                    setActiveView("library");
                    setExploreMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    activeView === "library"
                      ? "bg-white/10 text-white font-semibold"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <LibraryIcon className="w-4 h-4 text-emerald-400" />
                    <span>Library</span>
                  </span>
                  {libraryState.artifacts.length > 0 && (
                    <span className="text-[10px] font-mono text-zinc-400">
                      {libraryState.artifacts.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFocusPluginServiceId(null);
                    setOpenPluginVisualSetup(false);
                    setActiveView("plugins");
                    setExploreMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    activeView === "plugins"
                      ? "bg-white/10 text-white font-semibold"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <AtSign className="w-4 h-4 text-emerald-400" />
                    <span>Plugins</span>
                  </span>
                  {vaultConnections.length > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      {vaultConnections.length}
                    </span>
                  )}
                </button>

                {/* Explore Button + Floating Popover (`Maps`, `Business Manager`, `Visual Setup`) matching Screenshot 2! */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExploreMenuOpen(!exploreMenuOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      exploreMenuOpen || activeView === "maps" || activeView === "business_os" || activeView === "visual_setup"
                        ? "bg-white/10 text-white font-semibold ring-1 ring-emerald-500/40"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <LayoutGrid className="w-4 h-4 text-zinc-300" />
                      <span>Explore</span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {exploreMenuOpen && (
                    <div className="mt-1 ml-2 p-1.5 rounded-2xl bg-[#242424] border border-white/15 shadow-2xl space-y-0.5 text-xs z-50">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveView("maps");
                          setExploreMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-white font-semibold cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span>Maps</span>
                        </span>
                        {libraryState.location && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveView("business_os");
                          setExploreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-zinc-200 cursor-pointer"
                      >
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>Business OS &amp; Workflows</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveView("visual_setup");
                          setExploreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-zinc-200 cursor-pointer"
                      >
                        <MousePointerClick className="w-4 h-4 text-emerald-400" />
                        <span>Visual Screenshot Setup</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveView("puck_builder");
                          setExploreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-zinc-200 cursor-pointer"
                      >
                        <Store className="w-4 h-4 text-emerald-400" />
                        <span>Puck Store Builder</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView("leaderboard");
                    setExploreMenuOpen(false);
                  }}
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
                      : activeView === "plugins"
                      ? "KASPI AI — Universal Plugins & Permissions"
                      : activeView === "library"
                      ? "KASPI AI — Local Business Memory Library"
                      : activeView === "maps"
                      ? "KASPI AI — Real Store Geolocation (Maps)"
                      : activeView === "business_os"
                      ? "KASPI AI — Business Manager & Workflows OS"
                      : activeView === "visual_setup"
                      ? "KASPI AI — Visual Screenshot Setup Assistant"
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

            {activeView === "plugins" && (
              <div className="flex-1 overflow-y-auto p-6 bg-[#141414]">
                <KaspiPluginsCenter
                  connections={vaultConnections}
                  libraryState={libraryState}
                  initialFocusServiceId={focusPluginServiceId}
                  initialOpenVisualSetup={openPluginVisualSetup}
                  onConnectionsUpdated={handleConnectionsUpdated}
                  onSaveSkill={handleSaveSkill}
                  onOpenMapsPanel={() => setActiveView("maps")}
                />
              </div>
            )}

            {activeView === "library" && (
              <div className="flex-1 overflow-y-auto p-6 bg-[#141414]">
                <KaspiLibraryView
                  libraryState={libraryState}
                  onUpdateKnowledge={handleUpdateKnowledge}
                  onDeleteArtifact={handleDeleteArtifact}
                  onOpenArtifactInCanvas={handleOpenArtifactInCanvas}
                  onOpenMapsPanel={() => setActiveView("maps")}
                />
              </div>
            )}

            {activeView === "maps" && (
              <div className="flex-1 overflow-y-auto p-6 bg-[#141414]">
                <KaspiMapsLocationPanel
                  currentLocation={libraryState.location}
                  onSaveLocation={handleSaveLocation}
                />
              </div>
            )}

            {activeView === "business_os" && (
              <div className="flex-1 overflow-y-auto p-6 bg-[#141414]">
                <KaspiBusinessOsPanel />
              </div>
            )}

            {activeView === "visual_setup" && (
              <div className="flex-1 overflow-y-auto p-6 bg-[#141414]">
                <div className="max-w-4xl mx-auto">
                  <KaspiVisualSetupModal
                    onClose={() => setActiveView("arena")}
                    onQuickConnectCredentials={async (serviceId, fields) => {
                      const res = await fetch(getApiUrl("/api/ai/integrations"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "connect", serviceId, fields }),
                      });
                      const d = await res.json();
                      if (d?.success && d.connection) {
                        const nextList =
                          Array.isArray(d.connections) && d.connections.length > 0
                            ? d.connections
                            : [d.connection, ...vaultConnections.filter((c) => c.serviceId !== serviceId)];
                        handleConnectionsUpdated(nextList);
                        toast.success(d.connection.verificationMessage || "Connected!");
                      }
                    }}
                  />
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
                  <h2 className="text-lg font-bold text-white">
                    KASPI AI — Autonomous Multi-Agent Arena &amp; Business OS
                  </h2>
                  <p>
                    KASPI AI executes multi-stage architectural planning, modular codebase generation, interactive storefront &amp; app engineering, live web research, promo video creation, and universal plugin orchestration — presenting clean blind outputs so you judge purely on result quality.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-1">
                      <div className="font-bold text-emerald-400">Multi-Stage Builder (Code / Stores / Apps)</div>
                      <p className="text-[11px] text-zinc-400">
                        Automatically inspects links, plans architecture, generates separate stylesheets, data catalogs &amp; interactive logic, verifies output, and compiles live preview + ZIP.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-1">
                      <div className="font-bold text-emerald-400">Plugins, Maps, Library &amp; Visual Setup</div>
                      <p className="text-[11px] text-zinc-400">
                        Connect POS stores, WhatsApp, GitHub, Vercel, Stripe, verify real store GPS coordinates, and get click-by-click annotated guidance from screenshots.
                      </p>
                    </div>
                  </div>
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

                  {/* Clean Expanding Arena Prompt Box */}
                  <div className="rounded-2xl bg-[#232323]/95 border border-white/15 shadow-2xl p-4 focus-within:border-emerald-500/50 transition-colors">
                    <textarea
                      ref={homeTextareaRef}
                      rows={3}
                      dir="auto"
                      value={promptInput}
                      onChange={(e) => {
                        setPromptInput(e.target.value);
                        autoResizeTextarea(e.currentTarget, 84, 280);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendPrompt();
                        }
                      }}
                      placeholder="Ask anything, describe your e-commerce storefront, app, promo video, or web research..."
                      className="w-full min-h-[84px] max-h-[280px] overflow-y-auto bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
                    />

                    {/* Composer Toolbar (`+`, `Battle v`, `Auto/Code/Search/Image/Video v`, Send) */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10">
                      {renderArenaControlsBar({ openUpwards: false, compact: false })}

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

                  {renderModelPickers(false)}
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

                      const renderOptionCard = (side: "A" | "B", out: ArenaModelOutput, label: string) => {
                        const isExpanded = side === "A" ? turn.expandedA : turn.expandedB;
                        const voteKey = side === "A" ? "model_a" : "model_b";
                        const isBuildingSide = out.status === "building";
                        return (
                          <div
                            onClick={() => setSelectedSide(side)}
                            className={`rounded-xl p-3 border transition-all cursor-pointer ${
                              hasSplitCanvas && selectedSide === side
                                ? "bg-[#222] border-[#10b981]/60 shadow-lg"
                                : "bg-[#1e1e1e] border-white/10 hover:border-white/25"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    isBuildingSide
                                      ? "bg-white animate-pulse"
                                      : side === "B"
                                      ? "bg-emerald-400"
                                      : "bg-zinc-200"
                                  }`}
                                />
                                <span className="text-xs font-bold text-white truncate">{label}</span>
                                {turn.voteOutcome === voteKey && (
                                  <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!isBuildingSide && (
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
                                )}
                                {turn.outputB && !isBuildingSide && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVote(turn.turnId, voteKey);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                                      turn.voteOutcome === voteKey
                                        ? "bg-emerald-500 text-black border-emerald-400"
                                        : "bg-white/5 hover:bg-white/10 text-zinc-200 border-white/15"
                                    }`}
                                  >
                                    {side} is better
                                  </button>
                                )}
                              </div>
                            </div>

                            {out.replyMarkdown ? (
                              <div dir="auto" className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                {sanitizeExplanationFromCodeLeaks(
                                  out.replyMarkdown,
                                  Boolean(out.previewHtml),
                                  turn.userPrompt
                                )}
                              </div>
                            ) : isBuildingSide ? (
                              <div className="text-xs text-zinc-400 animate-pulse py-1">
                                Generating...
                              </div>
                            ) : null}

                            {out.stepsLog.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/5 space-y-1 text-[11px] text-zinc-400">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-zinc-300 min-w-0">
                                    {isBuildingSide ? (
                                      <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                                    ) : (
                                      <CheckCircle2
                                        className={`w-3.5 h-3.5 shrink-0 ${
                                          out.status === "completed" ? "text-emerald-400" : "text-amber-400"
                                        }`}
                                      />
                                    )}
                                    <span className="truncate">
                                      {isBuildingSide ? "Building..." : out.stepsLog[out.stepsLog.length - 1]}
                                    </span>
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {out.stepsLog.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleExpandSteps(turn.turnId, side);
                                        }}
                                        className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                                      >
                                        {isExpanded ? "Hide" : "Show steps"}
                                      </button>
                                    )}
                                    <span className="font-mono text-[10px] text-zinc-500">
                                      {isBuildingSide
                                        ? `(${formatElapsedArena(buildElapsedMs)})`
                                        : out.latencyMs >= 1000
                                        ? formatElapsedArena(out.latencyMs)
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                                {(isExpanded || isBuildingSide) && (
                                  <div className="pl-5 text-[10px] text-zinc-400 space-y-1 pt-1">
                                    {out.stepsLog.map((st, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5">
                                        {isBuildingSide && idx === out.stepsLog.length - 1 ? (
                                          <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-400 shrink-0" />
                                        ) : (
                                          <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                        )}
                                        <span className="truncate">{st}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      };

                      return (
                        <div key={turn.turnId} className="space-y-3">
                          {/* User Message Bubble */}
                          <div className="flex justify-end">
                            <div
                              dir="auto"
                              className="max-w-[88%] px-3.5 py-2.5 rounded-2xl bg-[#2a2a2a] border border-white/10 text-xs text-zinc-100 leading-relaxed whitespace-pre-wrap"
                            >
                              {turn.userPrompt}
                            </div>
                          </div>

                          {/* Option Cards (Side by Side if no split canvas, stacked if split canvas) */}
                          <div
                            className={`grid gap-3 ${
                              !hasSplitCanvas && turn.outputB ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                            }`}
                          >
                            {renderOptionCard("A", turn.outputA, labelA)}
                            {turn.outputB && renderOptionCard("B", turn.outputB, labelB)}
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

                          {/* ChatGPT-style Inline Plugin Connection Cards + Screenshot Setup Button */}
                          {turn.suggestedPluginIds && turn.suggestedPluginIds.length > 0 && (
                            <div className="p-3 rounded-xl bg-[#191b1c] border border-emerald-500/30 space-y-2">
                              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <AtSign className="w-3.5 h-3.5" />
                                <span>Connect Required Plugins or Guide Setup</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {turn.suggestedPluginIds
                                  .map((pid) => UNIVERSAL_INTEGRATIONS_CATALOG.find((x) => x.id === pid))
                                  .filter(Boolean)
                                  .map((plugin) => (
                                    <div
                                      key={plugin!.id}
                                      className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-[#141414] border border-white/10"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          style={{ backgroundColor: plugin!.brandColor }}
                                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-extrabold text-[10px]"
                                        >
                                          {plugin!.monogram}
                                        </span>
                                        <div>
                                          <div className="text-[11px] font-bold text-white">
                                            {plugin!.name}
                                          </div>
                                          <div className="text-[9px] text-zinc-400">
                                            {plugin!.authMethod === "geolocation" ? "Real GPS Pin" : plugin!.authMethod.toUpperCase()}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (plugin!.id === "maps_location") {
                                              setActiveView("maps");
                                              return;
                                            }
                                            setFocusPluginServiceId(plugin!.id);
                                            setOpenPluginVisualSetup(false);
                                            setActiveView("plugins");
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-bold text-[10px] cursor-pointer"
                                        >
                                          Connect
                                        </button>
                                        {plugin!.id !== "maps_location" && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setFocusPluginServiceId(plugin!.id);
                                              setOpenPluginVisualSetup(true);
                                              setActiveView("plugins");
                                            }}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-300 cursor-pointer"
                                            title="Guide me with screenshots"
                                          >
                                            <MousePointerClick className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Quick Visual Setup Launch if screenshot image was attached */}
                          {turn.attachments?.some((a) => a.dataUrl?.startsWith("data:image/")) && (
                            <button
                              type="button"
                              onClick={() => setActiveView("visual_setup")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 cursor-pointer"
                            >
                              <MousePointerClick className="w-3.5 h-3.5" />
                              <span>Open Annotated Screenshot Setup Assistant</span>
                            </button>
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

                  {/* Follow-up Composer (Full Arena Tools, Modes, & Models!) */}
                  <div className="p-3 border-t border-white/10">
                    {attachedFiles.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        {attachedFiles.map((f, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-200"
                          >
                            <Paperclip className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[120px]">{f.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="hover:text-white cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="rounded-xl bg-[#232323] border border-white/15 p-2.5 focus-within:border-emerald-500/45 transition-colors">
                      <textarea
                        ref={followTextareaRef}
                        rows={2}
                        dir="auto"
                        value={promptInput}
                        onChange={(e) => {
                          setPromptInput(e.target.value);
                          autoResizeTextarea(e.currentTarget, 44, 220);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendPrompt();
                          }
                        }}
                        placeholder="Ask a follow up... (Shift+Enter for new line)"
                        className="w-full min-h-[44px] max-h-[220px] overflow-y-auto bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none mb-2 resize-none leading-relaxed"
                      />
                      <div className="flex items-center justify-between gap-2">
                        {renderArenaControlsBar({ openUpwards: true, compact: true })}

                        {isExecuting ? (
                          <button
                            type="button"
                            onClick={() => abortCtrlRef.current?.abort()}
                            className="w-7 h-7 rounded-lg bg-white text-black hover:bg-zinc-200 flex items-center justify-center cursor-pointer shrink-0"
                            title="Stop generating"
                          >
                            <Square className="w-3 h-3 fill-current" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendPrompt()}
                            disabled={!promptInput.trim()}
                            className="w-7 h-7 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black flex items-center justify-center cursor-pointer disabled:opacity-40 shrink-0"
                          >
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                      {renderModelPickers(true)}
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
                        {activeOutput.status === "building" && !activeOutput.previewHtml ? (
                          <div className="m-auto text-center space-y-4 p-8 max-w-sm">
                            {/* Animated Wireframe Masonry Bricks matching Arena Building UX */}
                            <div className="grid grid-cols-3 gap-1.5 w-16 h-14 mx-auto opacity-80">
                              <div className="col-span-2 bg-zinc-500/70 rounded animate-pulse" />
                              <div className="col-span-1 bg-zinc-600/70 rounded animate-pulse" />
                              <div className="col-span-1 bg-zinc-600/70 rounded animate-pulse" />
                              <div className="col-span-2 bg-emerald-500/40 rounded animate-pulse" />
                              <div className="col-span-2 bg-zinc-500/70 rounded animate-pulse" />
                              <div className="col-span-1 bg-zinc-600/70 rounded animate-pulse" />
                            </div>
                            <div className="space-y-1.5">
                              <div className="text-base font-bold text-white tracking-tight">
                                Building...
                              </div>
                              <div className="text-xs text-zinc-400 leading-relaxed">
                                Preview will appear when agent is done working
                              </div>
                              <div className="text-[11px] font-mono text-emerald-400 pt-1">
                                {formatElapsedArena(buildElapsedMs)}
                              </div>
                            </div>
                          </div>
                        ) : activeOutput.modalityExecuted === "image" ? (
                          <div className="m-auto text-center space-y-4 p-6">
                            {activeOutput.imageUrl ? (
                              <div className="space-y-3">
                                <img
                                  src={activeOutput.imageUrl}
                                  alt={latestTurn.userPrompt}
                                  onError={(ev) => {
                                    const imgEl = ev.currentTarget;
                                    if (!imgEl.dataset.proxied && activeOutput.imageUrl) {
                                      imgEl.dataset.proxied = "1";
                                      imgEl.src = getApiUrl(
                                        `/api/ai/arena-execute?action=image_proxy&url=${encodeURIComponent(
                                          activeOutput.imageUrl
                                        )}`
                                      );
                                    }
                                  }}
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
                                  Generating high-resolution artwork...
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  Preview will appear momentarily
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
                              sandbox="allow-scripts allow-forms allow-modals allow-downloads"
                              title={`Live Preview Option ${selectedSide}`}
                              className="w-full h-full border-0 bg-white"
                            />
                          </div>
                        ) : (
                          <div className="p-6 max-w-2xl w-full rounded-2xl bg-[#181818] border border-white/10 space-y-4 my-4">
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                              <span className="text-xs font-bold text-emerald-400">
                                {getTabDisplayLabel(latestTurn, selectedSide)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setModality("code");
                                  handleSendPrompt(
                                    `${latestTurn.userPrompt}\n\nBuild the complete live interactive application now.`
                                  );
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black text-[11px] font-bold cursor-pointer"
                              >
                                Compile to Live Preview
                              </button>
                            </div>
                            <div dir="auto" className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                              {activeOutput.replyMarkdown}
                            </div>
                          </div>
                        )}

                        {showBuiltBadge && activeOutput.status !== "building" && (
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
                      /* Source Files Tree & Code Inspector (Nested Folder Tree matching Arena) */
                      <div className="flex-1 flex overflow-hidden bg-[#141414]">
                        <div className="w-60 border-r border-white/10 bg-[#181818] flex flex-col shrink-0">
                          <div className="px-3.5 py-2.5 border-b border-white/10 text-[11px] font-bold tracking-wider text-zinc-400 uppercase flex items-center justify-between">
                            <span>FILES</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {activeOutput.files.length}
                            </span>
                          </div>
                          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono">
                            {(() => {
                              const folderMap = new Map<string, ArenaProjectFileItem[]>();
                              const rootFiles: ArenaProjectFileItem[] = [];
                              for (const file of activeOutput.files) {
                                const slashIdx = file.path.lastIndexOf("/");
                                if (slashIdx > 0) {
                                  const dir = file.path.slice(0, slashIdx);
                                  const arr = folderMap.get(dir) || [];
                                  arr.push(file);
                                  folderMap.set(dir, arr);
                                } else {
                                  rootFiles.push(file);
                                }
                              }
                              return (
                                <>
                                  {Array.from(folderMap.entries()).map(([dir, dirFiles]) => {
                                    const isCollapsed = Boolean(collapsedFolders[dir]);
                                    return (
                                      <div key={dir} className="space-y-0.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setCollapsedFolders((prev) => ({
                                              ...prev,
                                              [dir]: !prev[dir],
                                            }))
                                          }
                                          className="w-full flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 text-zinc-300 text-left cursor-pointer"
                                        >
                                          {isCollapsed ? (
                                            <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                          ) : (
                                            <FolderOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                          )}
                                          <span className="truncate font-semibold">{dir}</span>
                                        </button>
                                        {!isCollapsed &&
                                          dirFiles.map((file) => (
                                            <button
                                              key={file.path}
                                              type="button"
                                              onClick={() => setSelectedFilePath(file.path)}
                                              className={`w-full flex items-center gap-2 pl-6 pr-2 py-1.5 rounded-lg text-left cursor-pointer ${
                                                selectedFilePath === file.path
                                                  ? "bg-white/10 text-white font-bold"
                                                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                              }`}
                                            >
                                              <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-300 uppercase shrink-0">
                                                {file.language.slice(0, 4)}
                                              </span>
                                              <span className="truncate">{file.name}</span>
                                            </button>
                                          ))}
                                      </div>
                                    );
                                  })}
                                  {rootFiles.map((file) => (
                                    <button
                                      key={file.path}
                                      type="button"
                                      onClick={() => setSelectedFilePath(file.path)}
                                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left cursor-pointer ${
                                        selectedFilePath === file.path
                                          ? "bg-white/10 text-white font-bold"
                                          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                      }`}
                                    >
                                      <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-300 uppercase shrink-0">
                                        {file.language.slice(0, 4)}
                                      </span>
                                      <span className="truncate">{file.name}</span>
                                    </button>
                                  ))}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden bg-[#141414]">
                          {(() => {
                            const f =
                              activeOutput.files.find((x) => x.path === selectedFilePath) ||
                              activeOutput.files[0];
                            if (!f)
                              return (
                                <div className="m-auto text-center text-xs text-zinc-500 space-y-2 p-6">
                                  <FileText className="w-8 h-8 mx-auto opacity-40" />
                                  <div>
                                    {activeOutput.status === "building"
                                      ? "Files are being written by the agent..."
                                      : "Select a generated file from the tree to inspect source code."}
                                  </div>
                                </div>
                              );
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
