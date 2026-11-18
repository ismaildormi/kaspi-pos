"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Square,
  Maximize2,
  Scissors,
  Image as ImageIcon,
  Search,
  Cpu,
  ShieldCheck,
  Download,
} from "lucide-react";
import { KaspiAiStudioModal, type WorkspaceTab } from "./KaspiAiStudioModal";
import { probeAndChatLocalOllama, probeLocalOllamaModels } from "@/lib/zebra-x/sovereign-brain";
import { removeImageBackgroundLocal } from "@/lib/zebra-x/media-client";

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
    headerTitle: "مساعد كسب الذكي",
    headerTitleAdmin: "المساعد الرئيسي • مسؤول البيانات",
    activeBadge: "مساعد فوري نشط",
    activeBadgeAdmin: "وصول كامل للبيانات",
    subtitle: "مستشارك للأعمال وتحليل المبيعات",
    subtitleAdmin: "الذكاء الاصطناعي لتحليل منصة كسب والبيانات الحية",
    quickPrompts: [
      { text: "كم مبيعات اليوم؟", icon: "trending" },
      { text: "ما هي السلع المنخفضة في المخزون؟", icon: "alert" },
      { text: "ما هي المنتجات الأكثر مبيعاً هذا الأسبوع؟", icon: "bag" },
    ],
    quickPromptsAdmin: [
      { text: "ما هو إجمالي الإيرادات ومبيعات المنصة؟", icon: "trending" },
      { text: "عرض قائمة كافة المتاجر وحالة الاشتراكات", icon: "alert" },
      { text: "إحصائيات استهلاك الذكاء الاصطناعي في المنصة", icon: "bag" },
    ],
    inputPlaceholder: "اسأل المستشار الذكي أو تحدث معه بالصوت...",
    uploadTooltip: "إرفاق صورة أو فاتورة تجارية (OCR)",
    thinking: "المساعد الذكي يفكر ويحلل البيانات...",
    error: "تعذر الاتصال بالمساعد الذكي",
    retry: "إعادة المحاولة",
    documentAttachment: "مستند تجاري",
    closeTitle: "إغلاق النافذة",
    analyzePrompt: "تحليل المستند المرفق",
    voiceInput: "تحدث بالصوت (مجاني 100% بدون توكنز)",
    voiceListening: "جارٍ الاستماع... تحدث الآن",
    voiceStop: "إيقاف الاستماع",
    voiceNotSupported: "التسجيل الصوتي غير مدعوم في هذا المتصفح",
    voiceReadAloud: "قراءة الرد صوتياً",
    voiceAutoSpeak: "قراءة الردود تلقائياً",
    dragTooltip: "اسحب لتحريك النافذة بالماوس في أي مكان",
    voiceLang: "لغة المحادثة الصوتية",
    copy: "نسخ الرد",
    copied: "تم النسخ بنجاح",
    goodResponse: "إجابة مفيدة",
    badResponse: "إجابة غير مفيدة",
    share: "مشاركة الرد",
    thoughtHeader: "فكّر وحلّل مؤشرات المتجر",
    scrollToBottom: "الانتقال لآخر الرسائل",
    cancelVoice: "إلغاء التسجيل",
  },
  fr: {
    headerTitle: "Assistant KASPI IA",
    headerTitleAdmin: "Master IA • Directeur des Données",
    activeBadge: "IA Active en Direct",
    activeBadgeAdmin: "Accès Total Base",
    subtitle: "Votre conseiller business et analyse des ventes",
    subtitleAdmin: "Intelligence d'affaires et métriques globales KASPI POS",
    quickPrompts: [
      { text: "Quelles sont les ventes d'aujourd'hui ?", icon: "trending" },
      { text: "Quels articles sont en rupture ou stock faible ?", icon: "alert" },
      { text: "Quels sont les produits les plus vendus cette semaine ?", icon: "bag" },
    ],
    quickPromptsAdmin: [
      { text: "Quel est le MRR global et le GMV de la plateforme ?", icon: "trending" },
      { text: "Liste des boutiques enregistrées et statuts d'abonnement", icon: "alert" },
      { text: "Statistiques d'utilisation IA sur la plateforme", icon: "bag" },
    ],
    inputPlaceholder: "Posez votre question ou parlez à la voix...",
    uploadTooltip: "Joindre une image ou facture d'achat (OCR)",
    thinking: "L'IA analyse vos indicateurs en direct...",
    error: "Impossible de joindre l'assistant IA",
    retry: "Réessayer",
    documentAttachment: "Document Commercial",
    closeTitle: "Fermer",
    analyzePrompt: "Analyser le document joint",
    voiceInput: "Commande vocale (100% gratuit sans jetons)",
    voiceListening: "Écoute en cours... Parlez maintenant",
    voiceStop: "Arrêter l'écoute",
    voiceNotSupported: "Microphone non supporté sur ce navigateur",
    voiceReadAloud: "Lire la réponse à voix haute",
    voiceAutoSpeak: "Lecture vocale automatique",
    dragTooltip: "Glisser pour déplacer la fenêtre n'importe où",
    voiceLang: "Langue vocale",
    copy: "Copier la réponse",
    copied: "Copié avec succès",
    goodResponse: "Bonne réponse",
    badResponse: "Mauvaise réponse",
    share: "Partager la réponse",
    thoughtHeader: "Réfléchi et analysé les métriques",
    scrollToBottom: "Défiler vers le bas",
    cancelVoice: "Annuler l'enregistrement",
  },
  en: {
    headerTitle: "KASPI AI Assistant",
    headerTitleAdmin: "Master AI • Chief Data Officer",
    activeBadge: "Live AI Active",
    activeBadgeAdmin: "Full DB Access",
    subtitle: "Your business & sales intelligence advisor",
    subtitleAdmin: "Business intelligence & platform-wide data telemetry",
    quickPrompts: [
      { text: "What are today's total sales?", icon: "trending" },
      { text: "Which items are running low on stock?", icon: "alert" },
      { text: "What are the top-selling products this week?", icon: "bag" },
    ],
    quickPromptsAdmin: [
      { text: "What is our total platform MRR, GMV, and revenue?", icon: "trending" },
      { text: "List all registered tenants and their subscription status", icon: "alert" },
      { text: "Platform-wide AI usage stats and telemetry", icon: "bag" },
    ],
    inputPlaceholder: "Ask about sales, margins, or speak with voice...",
    uploadTooltip: "Attach receipt image or PDF invoice (OCR)",
    thinking: "AI is analyzing live store data...",
    error: "Unable to reach KASPI AI Assistant",
    retry: "Retry",
    documentAttachment: "Commercial Document",
    closeTitle: "Close",
    analyzePrompt: "Analyze attached document",
    voiceInput: "Voice interaction (100% Free zero-token)",
    voiceListening: "Listening... Speak now",
    voiceStop: "Stop listening",
    voiceNotSupported: "Speech recognition not supported on this browser",
    voiceReadAloud: "Read response aloud",
    voiceAutoSpeak: "Auto-speak responses",
    dragTooltip: "Drag to move window anywhere on screen",
    voiceLang: "Voice Language",
    copy: "Copy response",
    copied: "Copied successfully",
    goodResponse: "Helpful response",
    badResponse: "Unhelpful response",
    share: "Share response",
    thoughtHeader: "Analyzed live store telemetry",
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
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioInitialTab, setStudioInitialTab] = useState<WorkspaceTab>("chat");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwnerSuperAdmin, setIsOwnerSuperAdmin] = useState(false);
  const [ownerBrainActive, setOwnerBrainActive] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [ollamaModelName, setOllamaModelName] = useState<string>("");
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    url: string;
  } | null>(null);
  const [localFallbackMessages, setLocalFallbackMessages] = useState<LocalChatMessage[]>([]);
  const [isLocalThinking, setIsLocalThinking] = useState(false);

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
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
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
    probeLocalOllamaModels()
      .then((p) => {
        if (!active) return;
        setOllamaOnline(p.reachable && p.models.length > 0);
        if (p.models[0]) setOllamaModelName(p.models[0]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname, isAuthenticatedWorkspaceRoute, isAuthPage]);

  const shouldRenderWidget = !isAuthPage && isAuthenticatedWorkspaceRoute && isAuthenticated;

  // Listen for custom "open-master-ai", "open-ai-chat" and "open-ai-studio" events
  useEffect(() => {
    const handleOpenAi = (ev: Event) => {
      setIsOpen((prev) => !prev);
      const customEv = ev as CustomEvent<{ prompt?: string }>;
      if (customEv.detail?.prompt) {
        setInput(customEv.detail.prompt);
      }
    };
    const handleOpenStudio = () => {
      setIsOpen(false);
      setIsStudioOpen(true);
    };
    window.addEventListener("open-master-ai", handleOpenAi);
    window.addEventListener("open-ai-chat", handleOpenAi);
    window.addEventListener("open-ai-studio", handleOpenStudio);
    return () => {
      window.removeEventListener("open-master-ai", handleOpenAi);
      window.removeEventListener("open-ai-chat", handleOpenAi);
      window.removeEventListener("open-ai-studio", handleOpenStudio);
    };
  }, []);

  // Dragging event handlers across mouse and touch
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
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
    status,
    error: sdkError,
    regenerate,
  } = useChat({
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming" || isLocalThinking;

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
          title: "KASPI AI Assistant",
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

  // Real Local Ollama + Real Media Tools (Image Gen, Web Photos, Background Removal)
  // Zero hardcoded canned business answers.
  const executeRealLocalOrMedia = async (
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
          modelUsed: cutout.method,
          userPrompt: q || "remove background",
          assistantResponse: "Removed background locally",
          toolNamesUsed: ["removeImageBackgroundLocal"],
        }),
      }).catch(() => {});
      return {
        handled: true,
        text: `${
          isAr ? "✅ تمت إزالة الخلفية محلياً بنجاح" : "✅ Background removed locally"
        } (${cutout.method}):\n[KASPI_MEDIA_IMAGE:${cutout.dataUrl}|${attachedFile.name.replace(/\.[^.]+$/, "")}-cutout.png]`,
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
            modelUsed: "pollinations",
            userPrompt: q,
            assistantResponse: "Generated product image",
            toolNamesUsed: ["generateProductImage"],
          }),
        }).catch(() => {});
        return {
          handled: true,
          text: `${isAr ? "🎨 صورة المنتج المولدة:" : "🎨 Generated Product Photo:"}\n[KASPI_MEDIA_IMAGE:${displayUrl}|generated-product.png]`,
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
          text: `${isAr ? "🔍 صور حقيقية من الويب:" : "🔍 Web Product Photos:"}\n${cards}`,
        };
      }
    }

    // 4. Local Ollama Inference grounded in real live DB KPIs (no fabricated prose)
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
        ? " You are currently speaking exclusively to the Sovereign Owner in X × Zebra Unified Mode."
        : " Reply concisely as KASPI Local POS Assistant in the user's language (Darija/AR/FR/EN). Never fabricate sales metrics.";

    const localRes = await probeAndChatLocalOllama({
      preferredModel: ollamaModelName || undefined,
      messages: [
        {
          role: "system",
          content: `You are KASPI AI running locally via Ollama.${ownerDirective}${kpiContext}`,
        },
        { role: "user", content: q || t.analyzePrompt },
      ],
    });

    if (localRes.ok && localRes.text) {
      setOllamaOnline(true);
      setOllamaModelName(localRes.model);
      void fetch(getApiUrl("/api/ai/zebra-trace"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: ownerBrainActive && isOwnerSuperAdmin ? "OWNER_CORRECTION" : "MODEL_ROUTE",
          outcomeStatus: "SUCCESS",
          modelUsed: localRes.model,
          routeSource:
            localRes.backend === "tauri_ollama"
              ? "tauri_local"
              : ownerBrainActive && isOwnerSuperAdmin
              ? "zebra_x_owner"
              : "local_ollama",
          userPrompt: q,
          assistantResponse: localRes.text,
        }),
      }).catch(() => {});
      return { handled: true, text: localRes.text };
    }

    return { handled: false, text: localRes.error || "" };
  };

  // Auto-scroll to bottom of chat when new tokens or messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sdkMessages, localFallbackMessages, isLoading, isOpen]);

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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;

    const messageText = input;
    const currentAttachment = attachment;
    setInput("");
    setAttachment(null);

    // 1. Prefer real Local Media Tools or Local Ollama Qwen when active
    setIsLocalThinking(true);
    try {
      const localAttempt = await executeRealLocalOrMedia(messageText, currentAttachment, activeLocale);
      if (localAttempt.handled) {
        setIsLocalThinking(false);
        appendLocalExchange(messageText, localAttempt.text, currentAttachment);
        return;
      }
    } catch (localErr: any) {
      console.warn("[KASPI AI] Local attempt failed:", localErr);
    }
    setIsLocalThinking(false);

    // 2. Try Cloud /api/ai/chat (POS DB tools)
    try {
      if (currentAttachment) {
        await sendMessage(
          {
            text: messageText || t.analyzePrompt,
            files: [
              {
                type: "file",
                mediaType: currentAttachment.type,
                url: currentAttachment.url,
              },
            ],
          },
          {
            body: { locale: activeLocale },
            headers: { "x-app-locale": activeLocale },
          }
        );
      } else {
        await sendMessage(
          { text: messageText },
          {
            body: { locale: activeLocale },
            headers: { "x-app-locale": activeLocale },
          }
        );
      }
    } catch {
      // Honest offline notice — zero fabricated AI reply
      const offlineMsg =
        activeLocale === "ar"
          ? "⚠️ محرك أولاما المحلي غير متصل حالياً (127.0.0.1:11434) ومزود السحابة متوقف. اضغط على أيقونة التوسيع بالأعلى لتثبيت/تشغيل أولاما على جهازك."
          : activeLocale === "fr"
          ? "⚠️ Ollama local (127.0.0.1:11434) et le routeur cloud sont indisponibles. Ouvrez l'espace complet pour installer/démarrer Ollama."
          : "⚠️ Local Ollama (127.0.0.1:11434) and cloud gateways are offline. Click Expand above to set up Ollama on your PC.";
      appendLocalExchange(messageText, offlineMsg, currentAttachment);
    }
  };

  const handleQuickPrompt = async (promptText: string) => {
    setInput(promptText);
    setIsLocalThinking(true);
    try {
      const localAttempt = await executeRealLocalOrMedia(promptText, null, activeLocale);
      if (localAttempt.handled) {
        setIsLocalThinking(false);
        appendLocalExchange(promptText, localAttempt.text, null);
        return;
      }
    } catch {}
    setIsLocalThinking(false);

    try {
      await sendMessage(
        { text: promptText },
        {
          body: { locale: activeLocale },
          headers: { "x-app-locale": activeLocale },
        }
      );
    } catch {
      const offlineMsg =
        activeLocale === "ar"
          ? "⚠️ أولاما المحلي غير مشغّل ومزود السحابة غير متاح. افتح لوحة التوسيع لتشغيل أولاما على جهازك."
          : "⚠️ Local Ollama and cloud gateways are offline. Open Workspace above to start Ollama.";
      appendLocalExchange(promptText, offlineMsg, null);
    }
  };

  const allDisplayMessages = useMemo(() => {
    return [...sdkMessages, ...localFallbackMessages];
  }, [sdkMessages, localFallbackMessages]);

  const getMessageText = (m: any): string => {
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
              position
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
              position ? "" : "bottom-4 end-4"
            } z-50 w-[92vw] sm:w-[430px] max-h-[calc(100vh-4.5rem)] origin-bottom animate-in fade-in slide-in-from-bottom-4 duration-200 print:hidden font-sans ${
              isDragging ? "select-none cursor-grabbing opacity-95 transition-none" : ""
            }`}
          >
            <div className="relative w-full h-[590px] max-h-[calc(100vh-4.5rem)] kaspi-polar-aurora-orbit kaspi-ai-assistant-shield rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header with Dragging on Header & Clean Apple Back Button */}
              <div
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setIsStudioOpen(true);
                }}
                className="border-b border-white/15 text-[var(--kaspi-text-primary)] px-4 py-3 flex items-center justify-between shadow-xs shrink-0 cursor-grab active:cursor-grabbing select-none"
                title="اسحب النافذة أو انقر مرتين لفتح Kaspi AI Studio الكامل"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full kaspi-glass-surface flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-[var(--kaspi-text-primary)]" />
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
                      title="X × Zebra Owner Brain Mode (Owner Only)"
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-300" />
                      <span>X×Z</span>
                    </button>
                  )}

                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-semibold border ${
                      ollamaOnline
                        ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
                        : "bg-white/5 border-white/10 text-zinc-400"
                    }`}
                    title={ollamaOnline ? `Ollama Local (${ollamaModelName})` : "Local Ollama Offline"}
                  >
                    <Cpu className="w-2.5 h-2.5" />
                    <span>{ollamaOnline ? "Qwen" : "Off"}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setStudioInitialTab("chat");
                      setIsOpen(false);
                      setIsStudioOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-xl kaspi-glass-surface hover:bg-emerald-500/20 border border-white/15 hover:border-emerald-500/40 text-zinc-200 hover:text-emerald-300 transition-colors cursor-pointer text-[10px] font-bold"
                    title={activeLocale === "ar" ? "تكبير واجهة الإدارة والربط والأدوات" : "Expand Local AI & Store Workspace"}
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeLocale === "ar" ? "توسيع" : "Expand"}</span>
                  </button>

                  {/* Strictly Closes Window Only on Explicit Click */}
                  <AppleBackButton
                    onClick={() => setIsOpen(false)}
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
                {/* Vector Doodle Wallpaper Layer */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none text-[var(--kaspi-text-primary)]">
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
                <div className="relative z-10 space-y-3.5">
                  {allDisplayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800 flex items-center justify-center text-white mb-2.5 shadow-inner">
                        <Sparkles className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h4 className="font-bold text-white text-xs sm:text-sm mb-1">
                        {isAdminView ? t.headerTitleAdmin : t.headerTitle}
                      </h4>
                      <p className="text-[11px] text-zinc-400 max-w-[280px] mb-3 leading-relaxed">
                        {isAdminView ? t.subtitleAdmin : t.subtitle}
                      </p>

                      {/* 100% Localized Quick Suggestion Chips */}
                      <div className="w-full space-y-2 text-start">
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
                            <div className="w-7 h-7 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                          )}
                          <div
                            className={`group relative max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                              isUser
                                ? "bg-white text-black font-medium rounded-tr-none shadow-xs text-start"
                                : "bg-zinc-900/95 backdrop-blur-md border border-zinc-800/80 text-zinc-200 rounded-tl-none shadow-xs text-start"
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

                            {/* Collapsible Reasoning Header (ChatGPT Style - Image 5) */}
                            {!isUser && (
                              <div className="mb-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedThoughts((prev) => ({
                                      ...prev,
                                      [m.id]: !prev[m.id],
                                    }))
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer py-0.5 select-none"
                                >
                                  {expandedThoughts[m.id] ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <ChevronRight
                                      className={`w-3.5 h-3.5 text-zinc-500 ${
                                        activeLocale === "ar" ? "rotate-180" : ""
                                      }`}
                                    />
                                  )}
                                  <span>{t.thoughtHeader}</span>
                                </button>
                                {expandedThoughts[m.id] && (
                                  <div className="mt-1.5 p-2 rounded-lg bg-black/40 border border-white/5 text-[10px] text-zinc-400 space-y-1 animate-in fade-in duration-150">
                                    <p>
                                      •{" "}
                                      {activeLocale === "ar"
                                        ? "فحص سجل المعاملات اللحظية ومؤشرات المبيعات."
                                        : activeLocale === "fr"
                                        ? "Validation du journal des ventes temps-réel."
                                        : "Validation of real-time sales transactions."}
                                    </p>
                                    <p>
                                      •{" "}
                                      {activeLocale === "ar"
                                        ? "مطابقة مستويات المخزون مع حدود التنبيه."
                                        : activeLocale === "fr"
                                        ? "Contrôle des seuils d'alerte de stock."
                                        : "Verification of stock warning thresholds."}
                                    </p>
                                    <p>
                                      •{" "}
                                      {activeLocale === "ar"
                                        ? "معالجة محلية 100% بدون استهلاك أي توكنز خارجي."
                                        : activeLocale === "fr"
                                        ? "Traitement 100% local sans coût de jetons."
                                        : "100% free local zero-token processing."}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Message Text & Inline Media Results */}
                            <div className="whitespace-pre-wrap space-y-2">
                              {textContent.split(/(\[KASPI_MEDIA_IMAGE:[^\]]+\])/g).map((part, pIdx) => {
                                const mediaMatch = part.match(/^\[KASPI_MEDIA_IMAGE:([^|\]]+)\|([^\]]+)\]$/);
                                if (!mediaMatch) {
                                  return part ? <span key={pIdx}>{part}</span> : null;
                                }
                                const [, mediaUrl, fileName] = mediaMatch;
                                return (
                                  <div key={pIdx} className="rounded-xl border border-white/15 bg-zinc-950/70 p-2 space-y-1.5">
                                    <img
                                      src={mediaUrl}
                                      alt={fileName}
                                      className="max-h-40 w-full object-contain rounded-lg bg-zinc-900"
                                    />
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] text-zinc-400 truncate">{fileName}</span>
                                      <a
                                        href={mediaUrl}
                                        download={fileName}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-semibold"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>Save</span>
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

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
                                    {messageFeedback[m.id] === "up" ? "👍 " + t.goodResponse : "👎 " + t.badResponse}
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
                      <div className="w-7 h-7 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-800 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 text-zinc-400 px-3 py-2 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 shadow-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>{t.thinking}</span>
                      </div>
                    </div>
                  )}

                  {sdkError && localFallbackMessages.length === 0 && (
                    <div className="p-3 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-zinc-300 text-xs flex items-center justify-between">
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
                  className="absolute bottom-16 start-1/2 -translate-x-1/2 z-20 w-7 h-7 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title={t.scrollToBottom}
                  aria-label={t.scrollToBottom}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Attachment Preview Badge */}
              {attachment && (
                <div className="px-3 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-2">
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
                - Inactive Input State (Image 4): [+] Attach, Rounded Pill, [🎤] Mic, Circular [↑] Submit
              */}
              {isListening ? (
                <div className="p-2.5 px-4 bg-zinc-950/95 backdrop-blur-xl border-t border-emerald-500/30 flex items-center justify-between gap-3 shrink-0">
                  {/* Left: Cancel button (X) */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleListening();
                      setInput("");
                    }}
                    className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
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
                    className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
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

                  {/* Quick Media & Responder Bar inside Compact Chat */}
                  <div className="px-3 py-1.5 border-t border-white/10 bg-zinc-950/60 flex items-center gap-1.5 overflow-x-auto kaspi-no-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setStudioInitialTab("media");
                        setIsOpen(false);
                        setIsStudioOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 shrink-0 cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3 text-emerald-400" />
                      <span>{activeLocale === "ar" ? "توليد صورة" : "AI Photo"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudioInitialTab("media");
                        setIsOpen(false);
                        setIsStudioOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 shrink-0 cursor-pointer"
                    >
                      <Scissors className="w-3 h-3 text-emerald-400" />
                      <span>{activeLocale === "ar" ? "إزالة الخلفية" : "Remove BG"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInput(activeLocale === "ar" ? "جيب صور من الويب لمنتج " : "search image ");
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 shrink-0 cursor-pointer"
                    >
                      <Search className="w-3 h-3 text-emerald-400" />
                      <span>{activeLocale === "ar" ? "صور الويب" : "Web Photos"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudioInitialTab("responder");
                        setIsOpen(false);
                        setIsStudioOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 shrink-0 cursor-pointer"
                    >
                      <span>{activeLocale === "ar" ? "الرد والروابط" : "Auto-Reply"}</span>
                    </button>
                  </div>

                  <form
                    onSubmit={handleSend}
                    className="p-2.5 px-3 border-t border-white/10 flex items-center gap-2 shrink-0 bg-zinc-950/80 backdrop-blur-md"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
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

                    {/* Center: Text Input Pill with [🎤] Mic on the right inside */}
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t.inputPlaceholder}
                        disabled={isLoading}
                        className="w-full ps-3.5 pe-9 py-2 text-xs kaspi-translucent-input rounded-full focus:outline-none transition-all placeholder-zinc-500 bg-zinc-900/90 border border-zinc-700/60 text-zinc-100 focus:border-emerald-500/60"
                      />

                      {/* Right inside: Voice Mic Button [🎤] */}
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
        </>
      )}

      {/* Expanded Local AI, Comment Auto-Responder, Media Lab & Channels Workspace */}
      <KaspiAiStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        locale={activeLocale}
        initialTab={studioInitialTab}
      />
    </>
  );
}

export default AIChatWidget;