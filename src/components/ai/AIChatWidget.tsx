"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname } from "next/navigation";
import { getApiUrl } from "@/client/sync-engine";
import { AppleBackButton } from "@/components/common/AppleBackButton";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Loader2,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  RotateCcw,
  Zap,
  Paperclip,
  FileText,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Share2,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Square,
  ShieldCheck,
  Maximize2,
  Minimize2,
  PanelLeft,
  FolderOpen,
  ListTodo,
} from "lucide-react";
import { XZebraRichMessage } from "./XZebraRichMessage";
import { LiveArtifactDrawer, type LiveArtifactItem } from "./LiveArtifactDrawer";
import { XZebraThreadsSidebar } from "./XZebraThreadsSidebar";
import { probeAndChatLocalXZebra } from "@/lib/zebra-x/sovereign-brain";
import { removeImageBackgroundLocal } from "@/lib/zebra-x/media-client";
import {
  analyzeCsvDataframe,
  extractTextFromPdfBuffer,
  extractTextFromWordBuffer,
  parseExcelBufferToText,
} from "@/lib/zebra-x/tools/docs-export-engine";
import {
  decodeBarcodeFromImage,
  extractDominantColorPalette,
  resizeImageForSocialPlatforms,
  runBrowserOcrOnImage,
} from "@/lib/zebra-x/tools/vision-screen-tools";
import { releaseWasmResources } from "@/lib/zebra-x/core/wasm-watchdog";
import {
  deleteChatThread,
  listChatThreads,
  renameChatThread,
  saveChatThreadSnapshot,
  togglePinChatThread,
  type StoredChatThread,
} from "@/lib/zebra-x/core/chat-threads-store";
import {
  buildActivityContextSnapshot,
  installGlobalActivitySensor,
  recordActivityBreadcrumb,
} from "@/lib/zebra-x/core/activity-sensor";
import {
  recordOrReinforceMemory,
  registerVoyagerSkill,
  searchEvolvingMemory,
} from "@/lib/zebra-x/core/memory-engine";
import {
  resumeCoworkSession,
  saveCoworkCheckpoint,
  scanBrowserWorkspaceDirectory,
  type CoworkFileSummary,
  type LiveTaskItem,
} from "@/lib/zebra-x/core/cowork-session";

interface LocalChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: Array<{ type: string; url?: string; name?: string; mediaType?: string; text?: string }>;
}

export type SupportedLocale = "ar" | "fr" | "en";

export const AI_I18N: Record<
  SupportedLocale,
  {
    headerTitle: string;
    headerTitleAdmin: string;
    activeBadge: string;
    activeBadgeAdmin: string;
    subtitle: string;
    subtitleAdmin: string;
    quickPrompts: Array<{ text: string; icon: "trending" | "alert" | "bag" }>;
    quickPromptsAdmin: Array<{ text: string; icon: "trending" | "alert" | "bag" }>;
    inputPlaceholder: string;
    uploadTooltip: string;
    thinking: string;
    error: string;
    retry: string;
    documentAttachment: string;
    closeTitle: string;
    analyzePrompt: string;
    voiceInput: string;
    voiceListening: string;
    voiceStop: string;
    voiceNotSupported: string;
    voiceReadAloud: string;
    voiceAutoSpeak: string;
    dragTooltip: string;
    voiceLang: string;
    copy: string;
    copied: string;
    goodResponse: string;
    badResponse: string;
    share: string;
    thoughtHeader: string;
    scrollToBottom: string;
    cancelVoice: string;
  }
> = {
  ar: {
    headerTitle: "HEYUKA",
    headerTitleAdmin: "HEYUKA • المالك",
    activeBadge: "متصل ومباشر",
    activeBadgeAdmin: "وضع المالك",
    subtitle: "ذكاء KASPI الموحد لكل التخصصات وإدارة المتجر",
    subtitleAdmin: "العقل المركزي لشركة KASPI للعلوم والبرمجة والأعمال",
    quickPrompts: [
      { text: "ابحث عن كل قدراتك والمصادر المفتوحة لك وأعطها لي في جدول PDF", icon: "trending" },
      { text: "اعطيني كل الاحصائيات ديال مشروعي في جدول PDF", icon: "trending" },
      { text: "ابحث في Google Patents عن براءة اختراع نظام دفع ذكي مع مخطط PDF", icon: "bag" },
      { text: "شكون آخر زبون داز عندي وعطيني آخر تذكرة", icon: "alert" },
    ],
    quickPromptsAdmin: [
      { text: "إحصائيات المنصة والمداخيل في جدول PDF", icon: "trending" },
      { text: "عرض قائمة كافة المتاجر وحالة الاشتراكات", icon: "alert" },
      { text: "إحصائيات الاستهلاك والأداء العام للمنصة", icon: "bag" },
    ],
    inputPlaceholder: "اسأل HEYUKA أو أرسل صورة / صوت...",
    uploadTooltip: "إرفاق صورة أو فاتورة (OCR / إزالة الخلفية)",
    thinking: "HEYUKA يفكر ويحلل البيانات...",
    error: "تعذر إتمام الطلب مؤقتاً",
    retry: "إعادة المحاولة",
    documentAttachment: "مستند تجاري",
    closeTitle: "إغلاق ومحو الجلسة",
    analyzePrompt: "تحليل المستند أو الصورة المرفقة",
    voiceInput: "تحدث بالصوت",
    voiceListening: "جارٍ الاستماع... تحدث الآن",
    voiceStop: "إيقاف الاستماع",
    voiceNotSupported: "التسجيل الصوتي غير مدعوم في هذا المتصفح",
    voiceReadAloud: "قراءة الرد صوتياً",
    voiceAutoSpeak: "قراءة الردود تلقائياً",
    dragTooltip: "اسحب لتحريك النافذة",
    voiceLang: "لغة المحادثة الصوتية",
    copy: "نسخ الرد",
    copied: "تم النسخ بنجاح",
    goodResponse: "إجابة مفيدة",
    badResponse: "إجابة غير مفيدة",
    share: "مشاركة الرد",
    thoughtHeader: "تحليل HEYUKA",
    scrollToBottom: "الانتقال لآخر الرسائل",
    cancelVoice: "إلغاء التسجيل",
  },
  fr: {
    headerTitle: "HEYUKA",
    headerTitleAdmin: "HEYUKA • Propriétaire",
    activeBadge: "Actif en direct",
    activeBadgeAdmin: "Mode Souverain",
    subtitle: "Intelligence universelle KASPI & analyses POS",
    subtitleAdmin: "Cerveau souverain KASPI & métriques en direct",
    quickPrompts: [
      { text: "Donne-moi toutes les statistiques de mon magasin en PDF", icon: "trending" },
      { text: "Qui est le dernier client et quel est le dernier ticket ?", icon: "alert" },
      { text: "Quels produits risquent la rupture et prévision stock ?", icon: "bag" },
    ],
    quickPromptsAdmin: [
      { text: "Rapport global MRR et GMV de la plateforme en PDF", icon: "trending" },
      { text: "Liste des boutiques enregistrées et statuts d'abonnement", icon: "alert" },
      { text: "Statistiques globales d'utilisation sur la plateforme", icon: "bag" },
    ],
    inputPlaceholder: "Demandez à HEYUKA ou joignez une image...",
    uploadTooltip: "Joindre une image ou facture",
    thinking: "HEYUKA analyse et vérifie les données...",
    error: "Impossible de joindre HEYUKA",
    retry: "Réessayer",
    documentAttachment: "Document Commercial",
    closeTitle: "Fermer et effacer la session",
    analyzePrompt: "Analyser l'élément joint",
    voiceInput: "Commande vocale",
    voiceListening: "Écoute en cours... Parlez maintenant",
    voiceStop: "Arrêter l'écoute",
    voiceNotSupported: "Microphone non supporté sur ce navigateur",
    voiceReadAloud: "Lire la réponse à voix haute",
    voiceAutoSpeak: "Lecture vocale automatique",
    dragTooltip: "Glisser pour déplacer la fenêtre",
    voiceLang: "Langue vocale",
    copy: "Copier la réponse",
    copied: "Copié avec succès",
    goodResponse: "Bonne réponse",
    badResponse: "Mauvaise réponse",
    share: "Partager la réponse",
    thoughtHeader: "Vérifié par HEYUKA",
    scrollToBottom: "Défiler vers le bas",
    cancelVoice: "Annuler l'enregistrement",
  },
  en: {
    headerTitle: "HEYUKA",
    headerTitleAdmin: "HEYUKA • Owner",
    activeBadge: "Live Active",
    activeBadgeAdmin: "Sovereign Mode",
    subtitle: "Unified KASPI intelligence & live POS insights",
    subtitleAdmin: "Sovereign KASPI brain & universal telemetry",
    quickPrompts: [
      { text: "Give me all store statistics in a downloadable PDF table", icon: "trending" },
      { text: "Who was the last customer and show the last receipt ticket", icon: "alert" },
      { text: "Which products are low on stock and demand forecast?", icon: "bag" },
    ],
    quickPromptsAdmin: [
      { text: "What is our total platform MRR and GMV in PDF?", icon: "trending" },
      { text: "List all registered tenants and their subscription status", icon: "alert" },
      { text: "Platform-wide usage telemetry and operations", icon: "bag" },
    ],
    inputPlaceholder: "Ask HEYUKA, attach photo, or speak...",
    uploadTooltip: "Attach receipt image or photo",
    thinking: "HEYUKA is reasoning and verifying...",
    error: "Unable to reach HEYUKA",
    retry: "Retry",
    documentAttachment: "Commercial Document",
    closeTitle: "Close and wipe session",
    analyzePrompt: "Analyze attached image or document",
    voiceInput: "Voice input",
    voiceListening: "Listening... Speak now",
    voiceStop: "Stop listening",
    voiceNotSupported: "Speech recognition not supported on this browser",
    voiceReadAloud: "Read response aloud",
    voiceAutoSpeak: "Auto-speak responses",
    dragTooltip: "Drag to move window",
    voiceLang: "Voice Language",
    copy: "Copy response",
    copied: "Copied successfully",
    goodResponse: "Helpful response",
    badResponse: "Unhelpful response",
    share: "Share response",
    thoughtHeader: "Verified by HEYUKA",
    scrollToBottom: "Scroll to bottom",
    cancelVoice: "Cancel recording",
  },
};

/**
 * Robust Locale Detector:
 * Inspects pathname (/en/..., /fr/..., /ar/...), document cookies, and navigator.
 */
function resolveCurrentLocale(pathname: string): SupportedLocale {
  if (pathname.startsWith("/en") || pathname.includes("/en/")) return "en";
  if (pathname.startsWith("/fr") || pathname.includes("/fr/")) return "fr";
  if (pathname.startsWith("/ar") || pathname.includes("/ar/")) return "ar";

  if (typeof document !== "undefined") {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    if (cookieMatch) {
      const val = cookieMatch[1].toLowerCase().slice(0, 2);
      if (val === "en" || val === "fr" || val === "ar") return val as SupportedLocale;
    }
    const htmlLang = document.documentElement.lang?.toLowerCase().slice(0, 2);
    if (htmlLang === "en" || htmlLang === "fr" || htmlLang === "ar") {
      return htmlLang as SupportedLocale;
    }
  }

  return "ar";
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwnerSuperAdmin, setIsOwnerSuperAdmin] = useState(false);
  const [ownerBrainActive, setOwnerBrainActive] = useState(false);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    url: string;
  } | null>(null);
  const [localFallbackMessages, setLocalFallbackMessages] = useState<LocalChatMessage[]>([]);
  const [isLocalThinking, setIsLocalThinking] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<LiveArtifactItem | null>(null);
  const [thinkingElapsedSec, setThinkingElapsedSec] = useState(0);

  // Unified HEYUKA Glassmorphic Gemini/ChatGPT Conversation Studio States
  const [isExpanded, setIsExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("heyuka_active_thread_id");
        if (stored) return stored;
      } catch {}
    }
    return `heyuka-${Date.now()}`;
  });
  const [threadSearch, setThreadSearch] = useState("");
  const [savedThreads, setSavedThreads] = useState<StoredChatThread[]>([]);
  const [memoryStats, setMemoryStats] = useState<{ totalMemories: number; totalSkills: number }>({
    totalMemories: 0,
    totalSkills: 0,
  });
  const [coworkWorkspace, setCoworkWorkspace] = useState<{
    name: string;
    files: CoworkFileSummary[];
  } | null>(null);
  const [coworkTasks, setCoworkTasks] = useState<LiveTaskItem[]>([]);
  const [planOnlyMode, setPlanOnlyMode] = useState(false);
  const lastEvolvedMsgIdRef = useRef<string | null>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Position state for free mouse/touch dragging
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const widgetRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ChatGPT UI States
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, "up" | "down" | null>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);

  // 100% Free Zero-Token Voice Engine States (Browser Web Speech API & Web Audio API Visualizer)
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [micConnected, setMicConnected] = useState<boolean>(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastSpokenMessageIdRef = useRef<string | null>(null);

  // Real-time Audio Waveform Visualizer States (Web Audio API)
  const [audioWave, setAudioWave] = useState<number[]>([4, 6, 8, 12, 16, 20, 16, 12, 8, 14, 18, 12, 8, 6, 4, 3]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname() || "";
  const isAdminView = pathname.includes("/admin");

  // Dynamically resolve active locale from pathname and environment
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>(() =>
    resolveCurrentLocale(pathname)
  );

  useEffect(() => {
    const loc = resolveCurrentLocale(pathname);
    setActiveLocale(loc);
    if (pathname) {
      void recordActivityBreadcrumb({
        kind: "route",
        route: pathname,
        label: `Opened ${pathname}`,
      });
    }
  }, [pathname]);

  const t = AI_I18N[activeLocale] || AI_I18N.ar;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detect browser Web Speech API support on mount (100% Free, Zero Token)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSpeech =
        "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
      setSpeechSupported(!!hasSpeech);
      const hasTts = "speechSynthesis" in window;
      setTtsSupported(!!hasTts);
    }
  }, []);

  // Strictly hide AI Assistant Widget on authentication/public screens
  // Only render inside authenticated workspace routes (/dashboard/*, /pos/*, /admin/*)
  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password") ||
    pathname.includes("/auth");

  const isAuthenticatedWorkspaceRoute =
    pathname.includes("/dashboard") ||
    pathname.includes("/pos") ||
    pathname.includes("/admin");

  useEffect(() => {
    if (!isAuthenticatedWorkspaceRoute || isAuthPage) {
      setIsAuthenticated(false);
      return;
    }
    let active = true;
    installGlobalActivitySensor();
    fetch(getApiUrl("/api/v1/me"))
      .then(async (res) => {
        if (!active) return;
        setIsAuthenticated(res.ok);
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const u = data?.user || data?.data || data;
          const isOwner = Boolean(u?.isSuperAdmin || u?.role === "SUPER_ADMIN");
          setIsOwnerSuperAdmin(isOwner);
        }
      })
      .catch(() => {
        if (active) setIsAuthenticated(typeof navigator !== "undefined" && !navigator.onLine);
      });
    return () => {
      active = false;
    };
  }, [pathname, isAuthenticatedWorkspaceRoute, isAuthPage]);

  const shouldRenderWidget = !isAuthPage && isAuthenticatedWorkspaceRoute && isAuthenticated;

  // Listen for custom "open-master-ai", "open-ai-chat" events & Alt+X HUD shortcut (v7.8)
  useEffect(() => {
    const handleOpenAi = (ev: Event) => {
      setIsOpen((prev) => !prev);
      const customEv = ev as CustomEvent<{ prompt?: string }>;
      if (customEv.detail?.prompt) {
        setInput(customEv.detail.prompt);
      }
    };
    const handleOpenDirect = () => setIsOpen(true);
    const handleHotkey = (e: KeyboardEvent) => {
      if (!shouldRenderWidget) return;
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "x" || e.key === "X")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("open-master-ai", handleOpenAi);
    window.addEventListener("open-ai-chat", handleOpenAi);
    window.addEventListener("open-ai-studio", handleOpenDirect);
    window.addEventListener("keydown", handleHotkey);
    return () => {
      window.removeEventListener("open-master-ai", handleOpenAi);
      window.removeEventListener("open-ai-chat", handleOpenAi);
      window.removeEventListener("open-ai-studio", handleOpenDirect);
      window.removeEventListener("keydown", handleHotkey);
    };
  }, [shouldRenderWidget]);

  // Dragging event handlers across mouse and touch
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isExpanded) return;
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("a") ||
      target.closest("select")
    ) {
      return;
    }

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    if (!widgetRef.current) return;
    const rect = widgetRef.current.getBoundingClientRect();

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initX: rect.left,
      initY: rect.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStartRef.current.startX;
      const deltaY = clientY - dragStartRef.current.startY;

      const widgetWidth = widgetRef.current?.offsetWidth || 420;
      const widgetHeight = widgetRef.current?.offsetHeight || 580;

      const margin = 8;
      const maxX = Math.max(margin, window.innerWidth - widgetWidth - margin);
      const maxY = Math.max(margin, window.innerHeight - widgetHeight - margin);

      const newX = Math.min(Math.max(margin, dragStartRef.current.initX + deltaX), maxX);
      const newY = Math.min(Math.max(margin, dragStartRef.current.initY + deltaY), maxY);

      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  // Memoize transport with activeLocale passed in body and headers
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        body: { locale: activeLocale },
        headers: { "x-app-locale": activeLocale },
      }),
    [activeLocale]
  );

  const {
    messages: sdkMessages,
    sendMessage,
    setMessages,
    stop,
    clearError,
    status,
    error: sdkError,
    regenerate,
  } = useChat({
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming" || isLocalThinking;

  // Live Claude/ChatGPT-style elapsed timer running ONLY while a request is active
  useEffect(() => {
    if (!isLoading) {
      setThinkingElapsedSec(0);
      return;
    }
    const startMs = Date.now();
    const id = setInterval(() => {
      setThinkingElapsedSec(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isLoading]);

  // Zero-Token Text-to-Speech (TTS) Reader with Automatic Language Detection
  const speakMessage = (messageId: string, rawText: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown characters and links for natural human voice
    const cleanText = rawText
      .replace(/[#*_`~>•]/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Intelligent Automatic Language Detection for Spoken Reply (Zero Manual Buttons)
    const isArabic = /[\u0600-\u06FF]/.test(cleanText);
    const isFrench = /\b(le|la|les|un|une|des|du|de|en|est|sont|pour|dans|avec|ventes|stock|facture|recette|aujourd'hui|dh|mad)\b/i.test(cleanText);
    const detectedLangCode = isArabic ? "ar-SA" : (isFrench ? "fr-FR" : "en-US");
    const langPrefix = isArabic ? "ar" : (isFrench ? "fr" : "en");

    utterance.lang = detectedLangCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    try {
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
      if (matched) {
        utterance.voice = matched;
      }
    } catch {}

    utterance.onstart = () => setSpeakingMessageId(messageId);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Web Audio Synthesizer Sound Cue (Pleasant visionOS Tone Confirmation)
  const playSoundCue = (type: "start" | "stop" | "success") => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "start") {
        // Pleasant rising chime (520Hz -> 720Hz)
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "success") {
        // Warm confirmation chord
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // Soft descending tone (440Hz -> 330Hz)
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 300);
    } catch {}
  };

  // Real-time Audio Waveform Visualizer & MediaRecorder (Web Audio API - 100% Free Client-Side)
  const startAudioVisualizer = async () => {
    try {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setMicConnected(false);
        startSimulatedWave();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicConnected(true);

      // Initialize MediaRecorder for Whisper multilingual transcription
      audioChunksRef.current = [];
      try {
        const mimeType =
          typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/mp4";
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn("[KASPI MediaRecorder] Notice:", recErr);
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWave = () => {
        if (!isListeningRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        const samples: number[] = [];
        const step = Math.max(1, Math.floor(bufferLength / 16));
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          const normalized = 4 + (val / 255) * 22;
          samples.push(Math.round(normalized));
        }
        setAudioWave(samples);
        animFrameRef.current = requestAnimationFrame(updateWave);
      };

      animFrameRef.current = requestAnimationFrame(updateWave);
    } catch (err: any) {
      console.warn("[KASPI Voice] Mic stream notice:", err);
      setMicConnected(false);
      startSimulatedWave();
    }
  };

  const startSimulatedWave = () => {
    const updateSimulated = () => {
      if (!isListeningRef.current) return;
      const now = Date.now();
      const samples = Array.from({ length: 16 }, (_, i) => {
        const wave = Math.sin(now / 180 + i * 0.45) * 0.5 + 0.5;
        return Math.round(4 + wave * 18);
      });
      setAudioWave(samples);
      animFrameRef.current = requestAnimationFrame(updateSimulated);
    };
    animFrameRef.current = requestAnimationFrame(updateSimulated);
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setAudioWave([4, 6, 8, 12, 16, 20, 16, 12, 8, 14, 18, 12, 8, 6, 4, 3]);
  };

  // Finalize voice recording, transcribe via Groq Whisper with multilingual code-switching, and submit or fill input
  const finishVoiceInputAndTranscribe = async (autoSubmit = false) => {
    isListeningRef.current = false;
    setIsListening(false);
    playSoundCue("stop");
    stopAudioVisualizer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    const currentInputText = input.trim();

    // If audio was captured, run Whisper multilingual transcription
    if (audioChunksRef.current.length > 0) {
      setIsTranscribing(true);
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("file", audioBlob, "audio.webm");

        const res = await fetch("/api/ai/transcribe", {
          method: "POST",
          body: fd,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.text && data.text.trim()) {
            const transcribed = data.text.trim();
            setInput(transcribed);
            if (autoSubmit) {
              setAutoSpeak(true);
              setTimeout(() => {
                handleQuickPrompt(transcribed);
              }, 60);
              setIsTranscribing(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("[KASPI Transcribe] Notice:", err);
      } finally {
        setIsTranscribing(false);
      }
    }

    if (autoSubmit) {
      setAutoSpeak(true);
      const query =
        currentInputText ||
        (activeLocale === "ar"
          ? "كم مبيعات اليوم وما هي السلع المنخفضة في المخزون؟"
          : "Quelles sont les ventes d'aujourd'hui et le stock faible ?");
      handleQuickPrompt(query);
    }
  };

  // Zero-Token Continuous Voice Engine (Web Audio API + Resilient Speech-to-Text)
  // Guaranteed to open and visualize sound in any environment (Chrome, Safari, Edge, Tauri WebView)
  const toggleListening = async () => {
    if (isListening) {
      await finishVoiceInputAndTranscribe(false);
      return;
    }

    // Play pleasant activation sound cue so user hears it immediately
    playSoundCue("start");
    setAutoSpeak(true);

    // Immediately activate listening state and start real-time audio visualizer
    isListeningRef.current = true;
    setIsListening(true);
    await startAudioVisualizer();

    // Check for native SpeechRecognition (Google Chrome / Edge / Webkit)
    const SpeechRec =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;

        const navLang = typeof navigator !== "undefined" ? navigator.language || "" : "";
        recognition.lang = navLang.startsWith("fr") ? "fr-FR" : navLang.startsWith("en") ? "en-US" : "ar-MA";

        recognition.onresult = (event: any) => {
          let fullTranscript = "";
          for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript;
          }
          if (fullTranscript) {
            setInput(fullTranscript);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn("[KASPI Voice] STT notice:", e?.error);
        };

        recognition.onend = () => {
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognition.start();
      } catch (err) {
        console.warn("[KASPI Voice] Recognition initiation fallback:", err);
      }
    }
  };

  // ChatGPT-style Helper actions: Copy, Feedback, Share, Scroll
  const copyMessage = (id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => {
        setCopiedMessageId((prev) => (prev === id ? null : prev));
      }, 2000);
    }
  };

  const rateMessage = (id: string, rating: "up" | "down") => {
    setMessageFeedback((prev) => ({
      ...prev,
      [id]: prev[id] === rating ? null : rating,
    }));
  };

  const shareMessage = async (text: string) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "HEYUKA • KASPI",
          text,
        });
        return;
      } catch {}
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert(activeLocale === "ar" ? "تم نسخ نص الإجابة للمشاركة" : "Réponse copiée pour le partage");
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    setShowScrollBottom(distanceFromBottom > 100);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioVisualizer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handles immediate client/media actions (attached image BG cutout, web photo lookup)
  const executeImmediateMediaTool = async (
    query: string,
    attachedFile: { name: string; type: string; url: string } | null,
    targetLocale: SupportedLocale
  ): Promise<{ handled: boolean; text: string }> => {
    const q = query.trim();
    const lower = q.toLowerCase();
    const isAr = targetLocale === "ar";

    // 1. Real In-Browser Background Removal on attached image
    if (
      attachedFile?.type?.startsWith("image/") &&
      /(background|remove.*bg|transparent|cutout|خلفية|حيد\s*الخلفية|تفريغ|قص)/i.test(lower)
    ) {
      const cutout = await removeImageBackgroundLocal(attachedFile.url);
      void fetch(getApiUrl("/api/ai/zebra-trace"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "MEDIA_OP",
          outcomeStatus: "SUCCESS",
          modelUsed: "heyuka-cutout",
          userPrompt: q || "remove background",
          assistantResponse: "Removed background locally",
          toolNamesUsed: ["removeImageBackgroundLocal"],
        }),
      }).catch(() => {});
      return {
        handled: true,
        text: `${
          isAr ? "تمت إزالة الخلفية محلياً بنجاح:" : "Background removed locally:"
        }\n[KASPI_MEDIA_IMAGE:${cutout.dataUrl}|${attachedFile.name.replace(/\.[^.]+$/, "")}-cutout.png]`,
      };
    }

    // 1.5 Browser OCR (tesseract.js) on attached image
    if (
      attachedFile?.type?.startsWith("image/") &&
      /(ocr|extract.*text|read.*text|اقرأ\s*النص|استخرج\s*النص|استخراج\s*النص|نص\s*الصورة|قراءة\s*الورقة)/i.test(lower)
    ) {
      const ocr = await runBrowserOcrOnImage(attachedFile.url);
      return {
        handled: true,
        text: ocr.text
          ? `${isAr ? `**النص المستخرج (${ocr.confidence}%):**` : `**Extracted Text (${ocr.confidence}%):**`}\n\n${ocr.text}`
          : isAr
          ? "لم يُعثر على نص واضح داخل الصورة."
          : "No readable text detected in this image.",
      };
    }

    // 1.6 Browser Barcode / QR Decoding (@zxing/browser)
    if (
      attachedFile?.type?.startsWith("image/") &&
      /(scan.*qr|decode|read.*barcode|qr\s*code|اقرأ\s*الباركود|فك\s*الباركود|مسح\s*الباركود)/i.test(lower)
    ) {
      const decoded = await decodeBarcodeFromImage(attachedFile.url);
      return {
        handled: true,
        text: decoded.found
          ? `${isAr ? "**نتيجة قراءة الباركود:**" : "**Barcode Decoded:**"}\n- **Format:** \`${decoded.format}\`\n- **Code:** \`${decoded.text}\``
          : isAr
          ? "لم أتمكن من قراءة باركود أو QR واضح داخل الصورة."
          : "Could not detect a clear QR or barcode inside this image.",
      };
    }

    // 1.7 Multi-Platform Social Media Smart Resizer (Canvas 0-Server)
    if (
      attachedFile?.type?.startsWith("image/") &&
      /(social.*size|resize.*social|instagram.*tiktok|مقاسات|أحجام|تيكتوك|انستغرام|سوشيال)/i.test(lower)
    ) {
      const crops = await resizeImageForSocialPlatforms(attachedFile.url);
      const cards = crops
        .map(
          (c, i) =>
            `**${c.platform} (${c.dimensions})**\n[KASPI_MEDIA_IMAGE:${c.dataUrl}|social-${i + 1}-${c.dimensions}.png]`
        )
        .join("\n\n");
      return {
        handled: true,
        text: `${isAr ? "**تم تجهيز مقاسات السوشيال ميديا:**" : "**Ready-to-Post Social Sizes:**"}\n\n${cards}`,
      };
    }

    // 1.8 Brand Color Palette Extraction (Canvas Quantizer)
    if (
      attachedFile?.type?.startsWith("image/") &&
      /(palette|colors|hex|ألوان|الألوان|باليت|كود\s*اللون)/i.test(lower)
    ) {
      const colors = await extractDominantColorPalette(attachedFile.url, 5);
      const rows = colors.map((c) => `| \`${c.hex}\` | ${c.sharePercent}% |`).join("\n");
      return {
        handled: true,
        text: `${isAr ? "**لوحة الألوان المستخرجة:**" : "**Extracted Color Palette:**"}\n\n| Hex | Share |\n| --- | --- |\n${rows}`,
      };
    }

    // 2. Real Product Image Generation
    if (
      !attachedFile &&
      /(generate.*image|create.*image|product.*photo|رسم\s*صورة|صنع\s*صورة|توليد\s*صورة|صوب\s*لي\s*صورة|دير\s*صورة)/i.test(
        lower
      )
    ) {
      const res = await fetch(getApiUrl("/api/ai/media-tools"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_image", prompt: q }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.imageUrl) {
        const displayUrl = data.proxyImageUrl || data.imageUrl;
        void fetch(getApiUrl("/api/ai/zebra-trace"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "MEDIA_OP",
            outcomeStatus: "SUCCESS",
            modelUsed: "heyuka-media",
            userPrompt: q,
            assistantResponse: "Generated product image",
            toolNamesUsed: ["generateProductImage"],
          }),
        }).catch(() => {});
        return {
          handled: true,
          text: `${isAr ? "صورة المنتج المولدة:" : "Generated Product Photo:"}\n[KASPI_MEDIA_IMAGE:${displayUrl}|generated-product.png]`,
        };
      }
    }

    // 3. Real Web Product Photo Search
    if (
      !attachedFile &&
      /(search.*image|find.*photo|web.*image|جيب\s*صور|ابحث\s*عن\s*صور|صور\s*من\s*الويب)/i.test(lower)
    ) {
      const cleanQuery = q
        .replace(/(search.*image|find.*photo|web.*image|جيب\s*صور|ابحث\s*عن\s*صور|صور\s*من\s*الويب)/gi, "")
        .trim() || q;
      const res = await fetch(
        getApiUrl(`/api/ai/media-tools?action=web_images&q=${encodeURIComponent(cleanQuery)}`)
      );
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.results) && data.results.length > 0) {
        const cards = data.results
          .slice(0, 3)
          .map(
            (img: any, i: number) =>
              `[KASPI_MEDIA_IMAGE:${img.thumbUrl || img.imageUrl}|web-${i + 1}.jpg]`
          )
          .join("\n");
        return {
          handled: true,
          text: `${isAr ? "صور حقيقية من الويب:" : "Web Product Photos:"}\n${cards}`,
        };
      }
    }

    return { handled: false, text: "" };
  };

  // Fallback local node inference ONLY when cloud route is unreachable/offline
  const tryDeviceCoreFallback = async (
    query: string,
    targetLocale: SupportedLocale,
    activitySnapshot: string
  ): Promise<string> => {
    let kpiContext = "";
    try {
      const res = await fetch(getApiUrl("/api/v1/dashboard/kpis"));
      if (res.ok) {
        const data = await res.json();
        const d = data?.data || {};
        kpiContext = `\nLive POS KPIs (MAD): TodaySales=${Number(d.todaySales || 0).toFixed(2)}, TodayOrders=${Number(d.todayTransactions || 0)}, LowStockItems=${Number(d.lowStockItemsCount || 0)}.`;
      }
    } catch {}

    const ownerDirective =
      ownerBrainActive && isOwnerSuperAdmin
        ? " You are HEYUKA Sovereign Executive for KASPI POS."
        : " Reply politely as HEYUKA (by KASPI) in the user's exact language (Darija/AR/FR/EN). Never invent numbers.";

    const localRes = await probeAndChatLocalXZebra({
      messages: [
        {
          role: "system",
          content: `You are HEYUKA Unified Core owned by KASPI.${ownerDirective}${kpiContext}${
            activitySnapshot ? `\nRecent Activity:\n${activitySnapshot}` : ""
          }`,
        },
        { role: "user", content: query || t.analyzePrompt },
      ],
    });

    if (localRes.ok && localRes.text) {
      return localRes.text;
    }

    return targetLocale === "ar"
      ? "تعذر الوصول مؤقتاً إلى الخادم أو النواة المحلية لـ HEYUKA. تحقق من اتصال الإنترنت أو شغّل النواة المحلية."
      : targetLocale === "fr"
      ? "Le noyau cloud et le relais local HEYUKA sont momentanément indisponibles. Vérifiez votre connexion."
      : "Both cloud and local HEYUKA nodes are currently unreachable. Please check your connection.";
  };

  // Auto-scroll to bottom of chat when new tokens or messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sdkMessages, localFallbackMessages, isLoading, isOpen]);

  const handleComposerPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const pastedFile = item.getAsFile();
        if (!pastedFile) continue;
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
          setAttachment({
            name: pastedFile.name || `screenshot-${Date.now()}.png`,
            type: pastedFile.type || "image/png",
            url: String(reader.result || ""),
          });
        };
        reader.readAsDataURL(pastedFile);
        break;
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      setAttachment({
        name: file.name,
        type: file.type || "application/octet-stream",
        url: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const appendLocalExchange = (
    promptText: string,
    replyText: string,
    attachedFile?: { name: string; type: string; url: string } | null
  ) => {
    const userMsg: LocalChatMessage = {
      id: `local-u-${Date.now()}`,
      role: "user",
      content: promptText || t.analyzePrompt,
      parts: attachedFile
        ? [{ type: "file", mediaType: attachedFile.type, url: attachedFile.url, name: attachedFile.name }]
        : undefined,
    };
    const assistantId = `local-a-${Date.now() + 1}`;
    const assistantMsg: LocalChatMessage = {
      id: assistantId,
      role: "assistant",
      content: replyText,
    };
    setLocalFallbackMessages((prev) => [...prev, userMsg, assistantMsg]);
    if (autoSpeak) {
      speakMessage(assistantId, replyText);
    }
  };

  const dispatchChatRequest = async (
    messageText: string,
    currentAttachment: { name: string; type: string; url: string } | null
  ) => {
    setIsLocalThinking(true);
    try {
      const localMedia = await executeImmediateMediaTool(
        messageText,
        currentAttachment,
        activeLocale
      );
      if (localMedia.handled) {
        setIsLocalThinking(false);
        appendLocalExchange(messageText, localMedia.text, currentAttachment);
        return;
      }
    } catch (localErr) {
      console.warn("[HEYUKA] Media helper notice:", localErr);
    }

    const activitySnapshot = await buildActivityContextSnapshot();
    void recordActivityBreadcrumb({
      kind: "ai_tool",
      route: pathname || "/",
      label: `HEYUKA prompt: ${messageText.slice(0, 60)}`,
    });

    // Phase 2 Client Document Parser: extract PDF / Word (.docx) / Excel (.xlsx) / CSV in browser
    let enrichedMessageText = messageText;
    if (currentAttachment?.url?.startsWith("data:") && !currentAttachment.type?.startsWith("image/")) {
      try {
        const res = await fetch(currentAttachment.url);
        const buf = await res.arrayBuffer();
        const lowerName = currentAttachment.name.toLowerCase();
        let extractedDocText = "";

        if (currentAttachment.type === "application/pdf" || lowerName.endsWith(".pdf")) {
          const pdf = await extractTextFromPdfBuffer(buf);
          extractedDocText = `PDF (${pdf.pageCount} pages):\n${pdf.text}`;
        } else if (lowerName.endsWith(".docx") || currentAttachment.type.includes("wordprocessingml")) {
          const doc = await extractTextFromWordBuffer(buf);
          extractedDocText = `DOCX Content:\n${doc.text}`;
        } else if (lowerName.endsWith(".xlsx") || currentAttachment.type.includes("spreadsheetml")) {
          const sheet = await parseExcelBufferToText(buf);
          extractedDocText = `Excel Sheet "${sheet.sheetName}" (${sheet.rowCount} rows):\n${sheet.previewCsv}`;
        } else if (lowerName.endsWith(".csv") || currentAttachment.type.includes("csv") || currentAttachment.type.startsWith("text/")) {
          const rawCsv = new TextDecoder().decode(buf);
          const stats = lowerName.endsWith(".csv") ? await analyzeCsvDataframe(rawCsv) : null;
          extractedDocText = stats
            ? `CSV (${stats.rowCount} rows, columns: ${stats.columns.join(", ")}), numericStats=${JSON.stringify(stats.numericStats)}\nSample:\n${rawCsv.slice(0, 4000)}`
            : rawCsv.slice(0, 5000);
        }

        if (extractedDocText.trim()) {
          enrichedMessageText = `${messageText || t.analyzePrompt}\n\n[ATTACHED DOCUMENT CONTENT — ${currentAttachment.name}]\n${extractedDocText.slice(0, 7500)}`;
        }
      } catch (docErr) {
        console.warn("[HEYUKA] Browser document parse notice:", docErr);
      }
    }

    let recalledMemoryContext = "";
    try {
      const memRes = await searchEvolvingMemory(messageText || enrichedMessageText, 4);
      setMemoryStats({
        totalMemories: memRes.totalMemories || 0,
        totalSkills: memRes.totalSkills || 0,
      });
      if (Array.isArray(memRes.hits) && memRes.hits.length > 0) {
        recalledMemoryContext = memRes.hits
          .slice(0, 4)
          .map((h: any) => `- [${h?.kind || "memory"}] ${h?.content || h?.title || ""}`)
          .join("\n")
          .slice(0, 1500);
      }
    } catch {
      // Never block chat dispatch on local memory lookup
    }

    if (coworkWorkspace && coworkWorkspace.files.length > 0) {
      const wsContext = coworkWorkspace.files
        .slice(0, 8)
        .map((f) => `- [Workspace:${f.relativePath}] ${f.previewMarkdown.slice(0, 220)}`)
        .join("\n");
      recalledMemoryContext = `${recalledMemoryContext}\nCOWORK WORKSPACE DIRECTORY (${coworkWorkspace.name}):\n${wsContext}`.slice(
        0,
        2800
      );
    }

    if (planOnlyMode) {
      recalledMemoryContext = `${recalledMemoryContext}\n[Read-Only Plan Mode Active]: Present a clear structured numbered plan before recommending any execution step.`.trim();
    }

    const activeTaskId = `task-${Date.now()}`;
    const goalSummary = (messageText || enrichedMessageText || t.analyzePrompt).slice(0, 120);
    const nextTasks: LiveTaskItem[] = [
      ...coworkTasks.slice(-4).map((it) => ({
        ...it,
        status: it.status === "in_progress" ? ("completed" as const) : it.status,
      })),
      { id: activeTaskId, label: goalSummary, status: "in_progress" },
    ];
    setCoworkTasks(nextTasks);
    void saveCoworkCheckpoint({
      sessionId: activeThreadId,
      goal: goalSummary,
      workspaceName: coworkWorkspace?.name,
      tasks: nextTasks,
      openedFiles: coworkWorkspace?.files.map((f) => f.relativePath) || [],
      scratchpadNotes: [planOnlyMode ? "Plan Mode enabled" : "Direct Cowork execution"],
    });

    setIsLocalThinking(false);

    try {
      if (
        currentAttachment &&
        (currentAttachment.type?.startsWith("image/") || currentAttachment.type === "application/pdf")
      ) {
        await sendMessage(
          {
            text: enrichedMessageText || t.analyzePrompt,
            files: [
              {
                type: "file",
                mediaType: currentAttachment.type,
                url: currentAttachment.url,
              },
            ],
          },
          {
            body: {
              locale: activeLocale,
              activityContext: activitySnapshot,
              recalledMemoryContext,
            },
            headers: { "x-app-locale": activeLocale },
          }
        );
      } else {
        await sendMessage(
          { text: enrichedMessageText || messageText || t.analyzePrompt },
          {
            body: {
              locale: activeLocale,
              activityContext: activitySnapshot,
              recalledMemoryContext,
            },
            headers: { "x-app-locale": activeLocale },
          }
        );
      }
    } catch {
      setIsLocalThinking(true);
      const fallbackReply = await tryDeviceCoreFallback(
        enrichedMessageText,
        activeLocale,
        activitySnapshot
      );
      setIsLocalThinking(false);
      appendLocalExchange(messageText, fallbackReply, currentAttachment);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;

    const messageText = input;
    const currentAttachment = attachment;
    setInput("");
    setAttachment(null);
    if (composerTextareaRef.current) {
      composerTextareaRef.current.style.height = "auto";
    }
    await dispatchChatRequest(messageText, currentAttachment);
  };

  const handleQuickPrompt = async (promptText: string) => {
    setInput("");
    await dispatchChatRequest(promptText, null);
  };

  const allDisplayMessages = useMemo(() => {
    return [...sdkMessages, ...localFallbackMessages];
  }, [sdkMessages, localFallbackMessages]);

  const getMessageText = useCallback((m: any): string => {
    if (typeof m.content === "string") return m.content;
    if (Array.isArray(m.parts)) {
      return m.parts
        .map((p: any) => {
          if (p.type === "text") return p.text || "";
          return "";
        })
        .join("");
    }
    return "";
  }, []);

  // Sync active thread ID permanently to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("heyuka_active_thread_id", activeThreadId);
    } catch {}
  }, [activeThreadId]);

  // Restore saved chats permanently on open & refresh HEYUKA evolving memory stats
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    listChatThreads()
      .then((threads) => {
        if (!active) return;
        setSavedThreads(threads);
        if (allDisplayMessages.length === 0) {
          const match = threads.find((th) => th.id === activeThreadId);
          if (match && match.messages.length > 0) {
            try {
              setMessages?.(
                match.messages.map((msg) => ({
                  id: msg.id,
                  role: (msg.role === "user" ? "user" : "assistant") as "user" | "assistant",
                  parts: [{ type: "text" as const, text: msg.content }],
                }))
              );
            } catch {
              setLocalFallbackMessages(
                match.messages.map((msg) => ({
                  id: msg.id,
                  role: (msg.role === "user" ? "user" : "assistant") as "user" | "assistant",
                  content: msg.content,
                }))
              );
            }
          }
        }
      })
      .catch(() => {});

    searchEvolvingMemory("", 1)
      .then((mem) => {
        if (!active) return;
        setMemoryStats({
          totalMemories: mem.totalMemories || 0,
          totalSkills: mem.totalSkills || 0,
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isOpen, activeThreadId, allDisplayMessages.length]);

  // Auto-persist active conversation + run HEYUKA FSRS memory & Voyager skill evolution
  useEffect(() => {
    if (isLoading || allDisplayMessages.length === 0) return;

    const cleanMessages = allDisplayMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        id: m.id || `msg-${Math.random().toString(36).slice(2, 9)}`,
        role: m.role as string,
        content: getMessageText(m),
      }))
      .filter((m) => m.content.trim().length > 0);

    if (cleanMessages.length === 0) return;

    const timer = setTimeout(() => {
      saveChatThreadSnapshot({
        id: activeThreadId,
        messages: cleanMessages,
      })
        .then(() => listChatThreads())
        .then((threads) => setSavedThreads(threads))
        .catch(() => {});
    }, 450);

    const lastMsg = cleanMessages[cleanMessages.length - 1];
    if (
      lastMsg &&
      lastMsg.role === "assistant" &&
      lastMsg.id !== lastEvolvedMsgIdRef.current &&
      lastMsg.content.length >= 24
    ) {
      lastEvolvedMsgIdRef.current = lastMsg.id;
      const prevUser = [...cleanMessages].reverse().find((m) => m.role === "user");
      if (prevUser) {
        void (async () => {
          try {
            const snippet = `${prevUser.content.slice(0, 140)} -> ${lastMsg.content.slice(0, 260)}`;
            await recordOrReinforceMemory({
              title: prevUser.content.slice(0, 80) || "HEYUKA Chat Memory",
              content: snippet,
              tags: [
                "heyuka-chat",
                /\[KASPI_|```/.test(lastMsg.content) ? "skill-artifact" : "dialogue",
                isOwnerSuperAdmin ? "owner" : "merchant",
              ],
              language: activeLocale,
            });

            if (/\[KASPI_[A-Z_]+:|```/.test(lastMsg.content)) {
              const detectedTools: string[] = [];
              if (lastMsg.content.includes("[KASPI_IMAGE:")) detectedTools.push("generateProductImage");
              if (lastMsg.content.includes("[KASPI_PDF_REPORT:")) detectedTools.push("generatePdfReport");
              if (lastMsg.content.includes("[KASPI_OFFICE_EXPORT:")) detectedTools.push("createRichArtifactOrExport");
              if (lastMsg.content.includes("[KASPI_LIVE_ARTIFACT:")) detectedTools.push("createRichArtifactOrExport");
              if (lastMsg.content.includes("```")) detectedTools.push("executeCodeSandbox");

              await registerVoyagerSkill({
                name: prevUser.content.slice(0, 80) || "HEYUKA Skill",
                domain: "heyuka-unified-chat",
                summary: lastMsg.content.slice(0, 240),
                steps: [
                  prevUser.content.slice(0, 140),
                  lastMsg.content.slice(0, 240),
                ],
                toolNames: detectedTools,
                tags: ["kaspi-chat", activeLocale],
              });
            }

            const memStats = await searchEvolvingMemory("", 1);
            setMemoryStats({
              totalMemories: memStats.totalMemories || 0,
              totalSkills: memStats.totalSkills || 0,
            });
            setCoworkTasks((prev) => {
              const updated = prev.map((tk) =>
                tk.status === "in_progress" ? ({ ...tk, status: "completed" as const }) : tk
              );
              if (updated.length > 0) {
                void saveCoworkCheckpoint({
                  sessionId: activeThreadId,
                  goal: updated[updated.length - 1]?.label || "Session",
                  workspaceName: coworkWorkspace?.name,
                  tasks: updated,
                  openedFiles: coworkWorkspace?.files.map((f) => f.relativePath) || [],
                  scratchpadNotes: [lastMsg.content.slice(0, 180)],
                });
              }
              return updated;
            });
          } catch {
            // Best-effort client memory reinforcement
          }
        })();
      }
    }

    return () => clearTimeout(timer);
  }, [allDisplayMessages, isLoading, activeThreadId, activeLocale, isOwnerSuperAdmin, getMessageText]);

  const persistActiveThreadSnapshot = useCallback(async () => {
    const cleanMessages = allDisplayMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        id: m.id || `msg-${Math.random().toString(36).slice(2, 9)}`,
        role: m.role as string,
        content: getMessageText(m),
      }))
      .filter((m) => m.content.trim().length > 0);
    if (cleanMessages.length === 0) return;
    await saveChatThreadSnapshot({
      id: activeThreadId,
      messages: cleanMessages,
    });
  }, [allDisplayMessages, activeThreadId, getMessageText]);

  const refreshSavedThreads = useCallback(
    async (query = threadSearch) => {
      const items = await listChatThreads(query);
      setSavedThreads(items);
    },
    [threadSearch]
  );

  // Load & filter saved conversation threads + restore Cowork session checkpoints
  useEffect(() => {
    if (!isOpen || !isExpanded) return;
    void refreshSavedThreads(threadSearch);
    void resumeCoworkSession(activeThreadId).then((saved) => {
      if (saved && Array.isArray(saved.tasks)) {
        setCoworkTasks(saved.tasks);
      }
    });
  }, [isOpen, isExpanded, activeThreadId, threadSearch, refreshSavedThreads]);

  // Persist compact text snapshot cleanly after each completed exchange
  useEffect(() => {
    if (!isOpen || isLoading || allDisplayMessages.length === 0) return;
    const timer = setTimeout(() => {
      void persistActiveThreadSnapshot().then(() => {
        if (isExpanded) void refreshSavedThreads(threadSearch);
      });
    }, 280);
    return () => clearTimeout(timer);
  }, [
    isOpen,
    isLoading,
    allDisplayMessages.length,
    isExpanded,
    threadSearch,
    persistActiveThreadSnapshot,
    refreshSavedThreads,
  ]);

  const handleNewThread = () => {
    if (allDisplayMessages.length > 0) {
      void persistActiveThreadSnapshot().then(() => refreshSavedThreads(threadSearch));
    }
    try {
      stop?.();
      setMessages?.([]);
      clearError?.();
    } catch {}
    setLocalFallbackMessages([]);
    setAttachment(null);
    setActiveArtifact(null);
    setCoworkTasks([]);
    setInput("");
    setIsLocalThinking(false);
    setActiveThreadId(`heyuka-${Date.now()}`);
  };

  const handleSelectThread = (thread: StoredChatThread) => {
    if (thread.id === activeThreadId) return;
    if (allDisplayMessages.length > 0) {
      void persistActiveThreadSnapshot();
    }
    try {
      stop?.();
      clearError?.();
      setMessages?.(
        thread.messages.map((m) => ({
          id: m.id,
          role: m.role,
          parts: [{ type: "text" as const, text: m.content }],
        }))
      );
    } catch {}
    setLocalFallbackMessages([]);
    setAttachment(null);
    setActiveArtifact(null);
    setInput("");
    setIsLocalThinking(false);
    setActiveThreadId(thread.id);
  };

  const handleTogglePinThread = (id: string) => {
    void togglePinChatThread(id).then(() => refreshSavedThreads(threadSearch));
  };

  const handleRenameThread = (id: string, newTitle: string) => {
    void renameChatThread(id, newTitle).then(() => refreshSavedThreads(threadSearch));
  };

  const handleDeleteThread = (id: string) => {
    void deleteChatThread(id).then(() => refreshSavedThreads(threadSearch));
    if (id === activeThreadId) {
      try {
        stop?.();
        setMessages?.([]);
        clearError?.();
      } catch {}
      setLocalFallbackMessages([]);
      setActiveArtifact(null);
      setActiveThreadId(`heyuka-${Date.now()}`);
    }
  };

  /**
   * Persists a lightweight text snapshot to isolated Dexie storage if non-empty,
   * then auto-wipes volatile chat memory, stops streams/audio/TTS, resets
   * compact popup state, and releases WASM buffers so CPU/RAM return to 0.
   */
  const handleCloseChat = () => {
    if (allDisplayMessages.length > 0) {
      void persistActiveThreadSnapshot();
    }
    try {
      stop?.();
    } catch {}
    try {
      setMessages?.([]);
      clearError?.();
    } catch {}
    setLocalFallbackMessages([]);
    setAttachment(null);
    setActiveArtifact(null);
    setInput("");
    setIsLocalThinking(false);
    setCopiedMessageId(null);
    setMessageFeedback({});
    stopAudioVisualizer();
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    setIsExpanded(false);
    setPosition(null);
    void persistActiveThreadSnapshot();
    try {
      window.localStorage.setItem("heyuka_active_thread_id", activeThreadId);
    } catch {}
    void releaseWasmResources();
    setIsOpen(false);
  };

  if (!shouldRenderWidget) {
    return null;
  }

  const promptSuggestions = isAdminView ? t.quickPromptsAdmin : t.quickPrompts;

  return (
    <>
      {/* 
        Floating Draggable Window Modal with Glass Shield Backing 
        - Strict Viewport Bottom-Corner Initial Anchor: fixed bottom-4 end-4
        - Draggable anywhere via mouse & touch
        - Closed strictly when user clicks AppleBackButton ("رجوع")
      */}
      {isOpen && (
        <>
          {/* Subtle Ambient Backdrop Scrim (Zero Bleed-Through + Non-Closing Guard) */}
          <div
            className="fixed top-0 bottom-0 left-0 right-0 z-40 bg-black/45 backdrop-blur-[2px] pointer-events-none transition-opacity animate-in fade-in duration-200"
            aria-hidden="true"
          />

          <div
            ref={widgetRef}
            dir={activeLocale === "ar" ? "rtl" : "ltr"}
            style={
              !isExpanded && position
                ? {
                    position: "fixed",
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    bottom: "auto",
                    right: "auto",
                  }
                : undefined
            }
            className={`fixed ${
              isExpanded
                ? "inset-0 w-screen h-screen z-[100] origin-center animate-in fade-in duration-200"
                : `${
                    position ? "" : "bottom-4 end-4"
                  } z-50 w-[92vw] sm:w-[430px] max-h-[calc(100vh-4.5rem)] origin-bottom animate-in fade-in slide-in-from-bottom-4 duration-200 ${
                    isDragging ? "select-none cursor-grabbing opacity-95 transition-none" : ""
                  }`
            } print:hidden font-sans`}
          >
            <div
              style={isExpanded ? { backgroundColor: "#0B0E14" } : undefined}
              className={
                isExpanded
                  ? "relative w-full h-full bg-[#0B0E14] text-zinc-100 border-0 rounded-none shadow-2xl flex overflow-hidden"
                  : "relative w-full h-[590px] max-h-[calc(100vh-4.5rem)] kaspi-polar-aurora-orbit kaspi-ai-assistant-shield rounded-2xl shadow-2xl flex overflow-hidden"
              }
            >
              {/* Collapsible Gemini-style Conversation Sidebar (Expanded Workspace Only) */}
              {isExpanded && sidebarOpen && (
                <div className="absolute md:relative top-0 bottom-0 start-0 z-30 flex h-full shadow-2xl md:shadow-none">
                  <XZebraThreadsSidebar
                    threads={savedThreads}
                    activeThreadId={activeThreadId}
                    searchQuery={threadSearch}
                    locale={activeLocale}
                    onSearchChange={setThreadSearch}
                    onNewChat={handleNewThread}
                    onSelectThread={handleSelectThread}
                    onTogglePin={handleTogglePinThread}
                    onRename={handleRenameThread}
                    onDelete={handleDeleteThread}
                    onCloseSidebarMobile={() => setSidebarOpen(false)}
                  />
                </div>
              )}

              <div className="relative flex-1 min-w-0 flex flex-col h-full overflow-hidden" style={isExpanded ? { backgroundColor: "#0B0E14" } : undefined}>
                {/* Header with Official HEYUKA Emblem, Sidebar/Expand Toggles & Auto-Wipe Back Button */}
                <div
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  className={`border-b border-white/10 text-[var(--kaspi-text-primary)] px-4 py-3 flex items-center justify-between shadow-xs shrink-0 select-none ${
                    isExpanded ? "bg-[#0F131C]" : "cursor-grab active:cursor-grabbing"
                  }`}
                  title={isExpanded ? undefined : t.dragTooltip}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isExpanded && (
                      <button
                        type="button"
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-zinc-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title={
                          activeLocale === "ar"
                            ? "إظهار / إخفاء المحادثات"
                            : activeLocale === "fr"
                            ? "Afficher / masquer les discussions"
                            : "Toggle chats sidebar"
                        }
                        aria-label="Toggle threads sidebar"
                      >
                        <PanelLeft className="w-4 h-4" />
                      </button>
                    )}

                    <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      <img
                        src="/logo-mark.png"
                        alt="HEYUKA"
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-xs sm:text-sm tracking-wide text-[var(--kaspi-text-primary)] truncate">
                          {isAdminView ? t.headerTitleAdmin : t.headerTitle}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
                          <Zap className="w-2.5 h-2.5" />
                          {isAdminView ? t.activeBadgeAdmin : t.activeBadge}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--kaspi-text-muted)] font-normal truncate">
                        {isAdminView ? t.subtitleAdmin : t.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isOwnerSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => setOwnerBrainActive((prev) => !prev)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[10px] font-bold transition-colors cursor-pointer ${
                          ownerBrainActive
                            ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
                            : "kaspi-glass-surface border-white/15 text-zinc-300 hover:border-amber-500/40"
                        }`}
                        title="HEYUKA Sovereign Mode — KASPI Owner"
                      >
                        <ShieldCheck className="w-3 h-3 text-amber-300" />
                        <span>HEYUKA PRO</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded((prev) => {
                          const next = !prev;
                          if (next) setPosition(null);
                          return next;
                        });
                      }}
                      className="w-8 h-8 rounded-xl kaspi-glass-surface border border-white/15 text-zinc-200 hover:text-white hover:border-emerald-400/50 flex items-center justify-center transition-colors cursor-pointer"
                      title={
                        isExpanded
                          ? activeLocale === "ar"
                            ? "تصغير النافذة"
                            : activeLocale === "fr"
                            ? "Réduire la fenêtre"
                            : "Compact window"
                          : activeLocale === "ar"
                          ? "توسيع مساحة العمل"
                          : activeLocale === "fr"
                          ? "Agrandir l'espace de travail"
                          : "Expand workspace"
                      }
                      aria-label={isExpanded ? "Compact window" : "Expand workspace"}
                    >
                      {isExpanded ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleNewThread()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      title={
                        activeLocale === "ar"
                          ? "محادثة جديدة (تبقى المحادثات السابقة محفوظة)"
                          : activeLocale === "fr"
                          ? "Nouvelle discussion"
                          : "New Chat"
                      }
                      aria-label={activeLocale === "ar" ? "محادثة جديدة" : "New Chat"}
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      {isExpanded && (
                        <span>
                          {activeLocale === "ar"
                            ? "محادثة جديدة"
                            : activeLocale === "fr"
                            ? "Nouvelle discussion"
                            : "New Chat"}
                        </span>
                      )}
                    </button>

                    <AppleBackButton
                      onClick={handleCloseChat}
                      locale={activeLocale}
                      title={t.closeTitle}
                    />
                  </div>
                </div>

              {/* Messages Area with Doodle Wallpaper & Clean Scrollbar Suppression */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="relative flex-1 overflow-y-auto overflow-x-hidden kaspi-no-scrollbar p-3.5 space-y-3"
              >
                {/* Vector Doodle Wallpaper Layer (disabled in clean full-screen mode) */}
                <div className={`pointer-events-none absolute inset-0 overflow-hidden z-0 select-none text-[var(--kaspi-text-primary)] ${isExpanded ? "hidden" : ""}`}>
                  <svg
                    className="w-full h-full opacity-[0.04]"
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                  >
                    <defs>
                      <pattern
                        id="kaspi-pos-doodles-ai"
                        x="0"
                        y="0"
                        width="160"
                        height="160"
                        patternUnits="userSpaceOnUse"
                      >
                        <g
                          stroke="currentColor"
                          strokeWidth="1.25"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M 15 15 v 18 M 20 15 v 18 M 23 15 v 18 M 28 15 v 18 M 34 15 v 18 M 38 15 v 18" />
                          <path d="M 120 15 h 22 v 28 l -3 -2 l -3 2 l -3 -2 l -3 2 l -3 -2 l -3 2 l -4 -2 z M 125 22 h 12 M 125 27 h 8 M 125 32 h 10" />
                          <path d="M 70 20 h 18 l 3 22 h -24 z M 75 20 a 4 4 0 0 1 8 0" />
                          <path d="M 20 70 h 16 v 14 a 6 6 0 0 1 -6 6 h -4 a 6 6 0 0 1 -6 -6 z M 36 74 h 4 a 3 3 0 0 1 0 6 h -4 M 18 94 h 20" />
                          <path d="M 75 85 h 16 M 83 70 v 15 M 70 70 l 13 -6 l 13 6 M 68 76 a 5 3 0 0 0 10 0 z M 88 76 a 5 3 0 0 0 10 0 z" />
                          <path d="M 118 72 h 24 a 3 3 0 0 1 3 3 v 14 a 3 3 0 0 1 -3 3 h -24 a 3 3 0 0 1 -3 -3 v -14 a 3 3 0 0 1 3 -3 z M 115 78 h 30 M 120 86 h 5" />
                          <path d="M 22 125 a 8 3 0 1 0 16 0 a 8 3 0 1 0 -16 0 M 22 130 a 8 3 0 0 0 16 0 M 22 135 a 8 3 0 0 0 16 0" />
                          <path d="M 70 125 l 10 -10 h 14 v 14 l -10 10 z M 89 120 a 1.5 1.5 0 1 0 0 -3 a 1.5 1.5 0 0 0 0 3" />
                          <path d="M 125 125 l 1.5 3.5 l 3.5 1.5 l -3.5 1.5 l -1.5 3.5 l -1.5 -3.5 l -3.5 -1.5 l 3.5 -1.5 z M 142 140 l 1 2 l 2 1 l -2 1 l -1 2 l -1 -2 l -2 -1 l 2 -1 z" />
                          <path d="M 135 112 c -3 -3 -6 -3 -9 0 c -3 3 -6 3 -9 0 c 3 -3 6 -3 9 0 c 3 3 6 3 9 0" />
                        </g>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#kaspi-pos-doodles-ai)" />
                  </svg>
                </div>

                {/* Elevated Messages Content */}
                <div
                  className={
                    isExpanded
                      ? "relative z-10 space-y-4 max-w-3xl mx-auto w-full py-4"
                      : "relative z-10 space-y-3.5"
                  }
                >
                  {allDisplayMessages.length === 0 ? (
                    <div
                      className={`flex flex-col items-center justify-center text-center ${
                        isExpanded ? "min-h-[45vh] p-6" : "h-full p-3"
                      }`}
                    >
                      <div
                        className={`${
                          isExpanded
                            ? "w-16 h-16 rounded-3xl mb-4"
                            : "w-12 h-12 rounded-2xl mb-2.5"
                        } bg-white/[0.06] backdrop-blur-xl border border-white/15 flex items-center justify-center shadow-lg shadow-emerald-500/10`}
                      >
                        <img
                          src="/logo-mark.png"
                          alt="HEYUKA"
                          className={isExpanded ? "w-10 h-10 object-contain" : "w-7 h-7 object-contain"}
                        />
                      </div>
                      <h4
                        className={`font-bold text-white mb-1 tracking-tight ${
                          isExpanded ? "text-lg sm:text-xl" : "text-xs sm:text-sm"
                        }`}
                      >
                        {isAdminView ? t.headerTitleAdmin : t.headerTitle}
                      </h4>
                      <p
                        className={`text-zinc-400 leading-relaxed ${
                          isExpanded
                            ? "text-xs sm:text-sm max-w-md mb-6"
                            : "text-[11px] max-w-[280px] mb-3"
                        }`}
                      >
                        {isAdminView ? t.subtitleAdmin : t.subtitle}
                      </p>

                      {/* 100% Localized Quick Suggestion Chips */}
                      <div
                        className={`w-full text-start ${
                          isExpanded ? "grid grid-cols-1 sm:grid-cols-3 gap-2.5" : "space-y-2"
                        }`}
                      >
                        {promptSuggestions.map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleQuickPrompt(prompt.text)}
                            className="w-full p-2 rounded-xl kaspi-glass-surface hover:bg-white/[0.08] transition-all text-xs font-medium text-zinc-200 flex items-center gap-2.5 shadow-xs cursor-pointer group"
                          >
                            <div className="p-1 rounded-md bg-white/10 text-white group-hover:scale-110 transition-transform shrink-0">
                              {prompt.icon === "trending" && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                              {prompt.icon === "alert" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                              {prompt.icon === "bag" && <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />}
                            </div>
                            <span className="truncate">{prompt.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    allDisplayMessages.map((m) => {
                      const isUser = m.role === "user";
                      const textContent = getMessageText(m);
                      const fileParts = Array.isArray((m as any).parts)
                        ? (m as any).parts.filter(
                            (p: any) => p.type === "file" || p.type === "image"
                          )
                        : [];

                      return (
                        <div
                          key={m.id}
                          className={`flex items-start gap-2 ${
                            isUser ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {!isUser && (
                            <div className="w-7 h-7 rounded-full kaspi-glass-surface border border-[var(--kaspi-border-glass)] flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                          )}
                          <div
                            className={`group relative leading-relaxed text-start ${
                              isExpanded
                                ? isUser
                                  ? "max-w-[78%] px-4 py-2.5 rounded-2xl kaspi-frosted-surface border border-[var(--kaspi-border-glass)] text-[var(--kaspi-text-primary)] text-sm font-medium shadow-xs"
                                  : "w-full max-w-3xl px-1 py-2 bg-transparent border-0 text-[var(--kaspi-text-primary)] text-[14px] leading-7"
                                : isUser
                                  ? "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs bg-[var(--kaspi-text-primary)] text-[var(--kaspi-bg-primary)] font-medium rounded-tr-none shadow-xs"
                                  : "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs kaspi-frosted-surface border border-[var(--kaspi-border-glass)] text-[var(--kaspi-text-primary)] rounded-tl-none shadow-xs"
                            }`}
                          >
                            {/* File/Image attachments */}
                            {fileParts.map((f: any, fIdx: number) => {
                              const isImg =
                                f.type === "image" ||
                                f.mediaType?.startsWith("image/") ||
                                f.url?.startsWith("data:image/");
                              if (isImg) {
                                return (
                                  <img
                                    key={fIdx}
                                    src={f.url || f.image}
                                    alt={f.name || "Upload"}
                                    className="max-h-36 rounded-lg mb-2 object-cover border border-zinc-700 shadow-xs"
                                  />
                                );
                              }
                              return (
                                <div
                                  key={fIdx}
                                  className={`flex items-center gap-2 p-1.5 rounded-lg text-xs mb-2 ${
                                    isUser
                                      ? "bg-zinc-100 text-black"
                                      : "bg-zinc-800 text-zinc-300"
                                  }`}
                                >
                                  <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                                  <span className="truncate">{f.name || t.documentAttachment}</span>
                                </div>
                              );
                            })}

                            {/* Gated HEYUKA Message Body (Markdown Tables, PDF, Office, Diagrams, Live Preview, Generated Images) */}
                            <XZebraRichMessage
                              message={m}
                              rawText={textContent}
                              locale={activeLocale}
                              isUser={isUser}
                              onOpenArtifact={setActiveArtifact}
                            />

                            {/* ChatGPT Message Action Bar (Image 1, 2, 5) */}
                            {!isUser && (
                              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-zinc-400 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  {/* 1. Copy */}
                                  <button
                                    type="button"
                                    onClick={() => copyMessage(m.id, textContent)}
                                    className="p-1 rounded-md hover:bg-white/10 hover:text-zinc-200 transition-colors cursor-pointer"
                                    title={t.copy}
                                  >
                                    {copiedMessageId === m.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {/* 2. Thumbs Up */}
                                  <button
                                    type="button"
                                    onClick={() => rateMessage(m.id, "up")}
                                    className={`p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer ${
                                      messageFeedback[m.id] === "up"
                                        ? "text-emerald-400 bg-emerald-500/20"
                                        : "hover:text-zinc-200"
                                    }`}
                                    title={t.goodResponse}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                  </button>

                                  {/* 3. Thumbs Down */}
                                  <button
                                    type="button"
                                    onClick={() => rateMessage(m.id, "down")}
                                    className={`p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer ${
                                      messageFeedback[m.id] === "down"
                                        ? "text-red-400 bg-red-500/20"
                                        : "hover:text-zinc-200"
                                    }`}
                                    title={t.badResponse}
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                  </button>

                                  {/* 4. Speaker / Read Aloud */}
                                  {ttsSupported && (
                                    <button
                                      type="button"
                                      onClick={() => speakMessage(m.id, textContent)}
                                      className={`p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer ${
                                        speakingMessageId === m.id
                                          ? "text-emerald-400 bg-emerald-500/20 animate-pulse"
                                          : "hover:text-zinc-200"
                                      }`}
                                      title={speakingMessageId === m.id ? "إيقاف الصوت" : t.voiceReadAloud}
                                    >
                                      {speakingMessageId === m.id ? (
                                        <VolumeX className="w-3.5 h-3.5" />
                                      ) : (
                                        <Volume2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}

                                  {/* 5. Share */}
                                  <button
                                    type="button"
                                    onClick={() => shareMessage(textContent)}
                                    className="p-1 rounded-md hover:bg-white/10 hover:text-zinc-200 transition-colors cursor-pointer"
                                    title={t.share}
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* 6. Regenerate */}
                                  <button
                                    type="button"
                                    onClick={() => regenerate()}
                                    className="p-1 rounded-md hover:bg-white/10 hover:text-zinc-200 transition-colors cursor-pointer"
                                    title={t.retry}
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Status indicators */}
                                {copiedMessageId === m.id && (
                                  <span className="text-[10px] text-emerald-400 font-medium animate-in fade-in">
                                    {t.copied}
                                  </span>
                                )}
                                {messageFeedback[m.id] && (
                                  <span className="text-[10px] text-zinc-400 animate-in fade-in">
                                    {messageFeedback[m.id] === "up" ? t.goodResponse : t.badResponse}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {isLoading && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0">
                        <img src="/logo-mark.png" alt="HEYUKA" className="w-4 h-4 object-contain animate-pulse" />
                      </div>
                      <div className="kaspi-frosted-surface border border-emerald-500/30 text-[var(--kaspi-text-primary)] px-3 py-2 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 shadow-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
                        <span className="truncate">
                          {thinkingElapsedSec < 3
                            ? t.thinking
                            : thinkingElapsedSec < 7
                            ? activeLocale === "ar"
                              ? "جرد المصادر والأدوات والتدقيق..."
                              : "Scanning tools & verifying facts..."
                            : activeLocale === "ar"
                            ? "صياغة النتيجة النهائية بدقة..."
                            : "Polishing final answer..."}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                          ⏱ {String(Math.floor(thinkingElapsedSec / 60)).padStart(2, "0")}:
                          {String(thinkingElapsedSec % 60).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  )}

                  {sdkError && localFallbackMessages.length === 0 && (
                    <div className="p-3 rounded-xl kaspi-frosted-surface border border-[var(--kaspi-border-glass)] text-[var(--kaspi-text-primary)] text-xs flex items-center justify-between">
                      <span>{t.error}</span>
                      <button
                        type="button"
                        onClick={() => regenerate()}
                        className="p-1 rounded-md hover:bg-zinc-800 transition-colors text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t.retry}</span>
                      </button>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Floating Scroll to Bottom Button (ChatGPT style - Image 5) */}
              {showScrollBottom && (
                <button
                  type="button"
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="kaspi-glass-btn absolute bottom-16 start-1/2 -translate-x-1/2 z-20 w-7 h-7 rounded-full text-[var(--kaspi-text-primary)] shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title={t.scrollToBottom}
                  aria-label={t.scrollToBottom}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Composer Shell (Centered Floating Glass Pill when Expanded) */}
              <div
                className={
                  isExpanded
                    ? "w-full max-w-3xl mx-auto px-4 pb-4 shrink-0"
                    : "shrink-0"
                }
              >
                {/* Attachment Preview Badge */}
                {attachment && (
                  <div
                    className={
                      isExpanded
                        ? "mb-2 px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl flex items-center justify-between gap-2"
                        : "px-3 py-2 kaspi-frosted-surface border-t border-[var(--kaspi-border-glass)] flex items-center justify-between gap-2"
                    }
                  >
                    <div className="flex items-center gap-2 overflow-hidden text-xs text-zinc-300">
                      {attachment.type.startsWith("image/") ? (
                        <img
                          src={attachment.url}
                          alt="preview"
                          className="w-7 h-7 rounded-md object-cover border border-zinc-700 shrink-0"
                        />
                      ) : (
                        <FileText className="w-5 h-5 text-zinc-400 shrink-0" />
                      )}
                      <span className="truncate max-w-[220px] font-medium text-xs">
                        {attachment.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="p-1 text-zinc-400 hover:text-white rounded-full cursor-pointer hover:bg-zinc-800"
                      aria-label="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 
                  ChatGPT-Style Voice & Input Bar in KASPI Emerald Identity:
                  - Active Voice Recording State (Image 3): (X) Cancel, Animated Waveform Dots, [■] Stop, [↑] Submit
                  - Inactive Input State: [+] Attach, Rounded Pill, Mic, Circular [↑] Submit
                */}
                {isListening ? (
                  <div
                    className={
                      isExpanded
                        ? "p-3 px-4 rounded-2xl border border-emerald-500/35 kaspi-frosted-surface backdrop-blur-2xl shadow-xl flex items-center justify-between gap-3 shrink-0"
                        : "p-2.5 px-4 kaspi-frosted-surface backdrop-blur-xl border-t border-emerald-500/30 flex items-center justify-between gap-3 shrink-0"
                    }
                  >
                  {/* Left: Cancel button (X) */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleListening();
                      setInput("");
                    }}
                    className="w-8 h-8 rounded-full kaspi-glass-btn text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title={t.cancelVoice}
                    aria-label={t.cancelVoice}
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Center: Dynamic Animated Audio Dots / Wave Visualizer */}
                  <div className="flex-1 flex flex-col items-center justify-center px-2 min-w-0">
                    <div className="flex items-center justify-center gap-1 h-7">
                      {audioWave.map((h, idx) => (
                        <span
                          key={idx}
                          style={{ height: `${Math.max(4, h)}px` }}
                          className="w-1 rounded-full bg-emerald-400 transition-all duration-75 shadow-xs shadow-emerald-400/40"
                        />
                      ))}
                    </div>
                    {input ? (
                      <p className="text-[10px] text-zinc-300 max-w-full truncate text-center mt-0.5 font-medium">
                        {input}
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-400/80 max-w-full truncate text-center mt-0.5 animate-pulse">
                        {t.voiceListening}
                      </p>
                    )}
                  </div>

                  {/* Right: Pause/Stop button [■] */}
                  <button
                    type="button"
                    onClick={() => finishVoiceInputAndTranscribe(false)}
                    className="w-8 h-8 rounded-full kaspi-glass-btn text-[var(--kaspi-text-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
                    title={t.voiceStop}
                    aria-label={t.voiceStop}
                  >
                    <Square className="w-3.5 h-3.5 fill-current text-white" />
                  </button>

                  {/* Far Right: Submit button [↑] */}
                  <button
                    type="button"
                    onClick={() => finishVoiceInputAndTranscribe(true)}
                    className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md shadow-emerald-500/20 active:scale-95"
                    title={activeLocale === "ar" ? "إرسال الصوت" : "Envoyer"}
                    aria-label={activeLocale === "ar" ? "إرسال الصوت" : "Envoyer"}
                  >
                    <ArrowUp className="w-4 h-4 text-black stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col shrink-0">
                  {/* Interactive Microphone Connection Banner (when not connected or permitted yet) */}
                  {!micConnected && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className="mx-3 my-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer shadow-xs animate-in fade-in"
                    >
                      <div className="flex items-center gap-2">
                        <Mic className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                        <span>
                          {activeLocale === "ar"
                            ? "الميكروفون غير متصل • اضغط هنا لتوصيل الصوت"
                            : "Microphone non connecté • Cliquez pour autoriser le son"}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-black text-[10px] font-bold">
                        {activeLocale === "ar" ? "توصيل" : "Connecter"}
                      </span>
                    </button>
                  )}

                  {/* Multilingual Transcription In-Progress Indicator */}
                  {isTranscribing && (
                    <div className="px-3 py-1 bg-emerald-950/80 border-t border-emerald-500/30 flex items-center justify-center gap-2 text-xs text-emerald-300">
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                      <span className="text-[10px] font-medium">
                        {activeLocale === "ar"
                          ? "جارٍ تحويل الصوت فورا بالذكاء الاصطناعي..."
                          : "Transcription IA en cours..."}
                      </span>
                    </div>
                  )}

                  <form
                    onSubmit={handleSend}
                    className={
                      isExpanded
                        ? "p-2.5 px-3.5 rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-2xl shadow-xl flex items-center gap-2.5 shrink-0"
                        : "p-2.5 px-3 border-t border-[var(--kaspi-border-glass)] flex items-center gap-2 shrink-0 kaspi-frosted-surface backdrop-blur-md"
                    }
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.docx,.xlsx,.xls,.csv,.txt,.md,.json,.js,.ts,.tsx,.py,.html,.css,.sql,.xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Left: [+] Attachment Button (ChatGPT style) */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title={t.uploadTooltip}
                      aria-label={t.uploadTooltip}
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Center: Text Input Pill with Mic on the right inside */}
                    <div className="flex-1 relative flex items-center">
                      <textarea
                        ref={composerTextareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          const el = e.currentTarget;
                          el.style.height = "auto";
                          el.style.height = `${Math.min(el.scrollHeight, 136)}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            void handleSend();
                          }
                        }}
                        onPaste={handleComposerPaste}
                        placeholder={t.inputPlaceholder}
                        disabled={isLoading}
                        className="w-full ps-3.5 pe-9 py-2 text-xs kaspi-translucent-input rounded-2xl focus:outline-none transition-all placeholder:text-[var(--kaspi-text-muted)] border border-[var(--kaspi-border-glass)] text-[var(--kaspi-text-primary)] focus:border-emerald-500/60 resize-none max-h-36 overflow-y-auto kaspi-no-scrollbar leading-5"
                      />

                      {/* Right inside: Voice Mic Button */}
                      <button
                        type="button"
                        onClick={toggleListening}
                        className="absolute end-2 p-1 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        title={t.voiceInput}
                        aria-label={t.voiceInput}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Far Right: Circular [↑] Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading || (!input.trim() && !attachment)}
                      className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                      aria-label="Send Message"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                      ) : (
                        <ArrowUp className="w-4 h-4 text-black stroke-[2.5]" />
                      )}
                    </button>
                  </form>
                </div>
              )}
              </div>
              </div>
            </div>
          </div>

          <LiveArtifactDrawer
            artifact={activeArtifact}
            locale={activeLocale}
            onClose={() => setActiveArtifact(null)}
          />
        </>
      )}
    </>
  );
}

export default AIChatWidget;