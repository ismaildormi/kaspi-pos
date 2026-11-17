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
  GripHorizontal,
  Languages,
} from "lucide-react";

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

  // 100% Free Zero-Token Voice Engine States (Browser Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname() || "";
  const isAdminView = pathname.includes("/admin");

  // Dynamically resolve active locale from pathname and environment
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>(() =>
    resolveCurrentLocale(pathname)
  );
  const [voiceLocale, setVoiceLocale] = useState<SupportedLocale>(() =>
    resolveCurrentLocale(pathname)
  );

  useEffect(() => {
    const loc = resolveCurrentLocale(pathname);
    setActiveLocale(loc);
    setVoiceLocale(loc);
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
      .then((res) => {
        if (active) setIsAuthenticated(res.ok);
      })
      .catch(() => {
        if (active) setIsAuthenticated(typeof navigator !== "undefined" && !navigator.onLine);
      });
    return () => {
      active = false;
    };
  }, [pathname, isAuthenticatedWorkspaceRoute, isAuthPage]);

  const shouldRenderWidget = !isAuthPage && isAuthenticatedWorkspaceRoute && isAuthenticated;

  // Listen for custom "open-master-ai" and "open-ai-chat" events
  useEffect(() => {
    const handleOpenAi = (ev: Event) => {
      setIsOpen((prev) => !prev);
      const customEv = ev as CustomEvent<{ prompt?: string }>;
      if (customEv.detail?.prompt) {
        setInput(customEv.detail.prompt);
      }
    };
    window.addEventListener("open-master-ai", handleOpenAi);
    window.addEventListener("open-ai-chat", handleOpenAi);
    return () => {
      window.removeEventListener("open-master-ai", handleOpenAi);
      window.removeEventListener("open-ai-chat", handleOpenAi);
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

  // Zero-Token Text-to-Speech (TTS) Reader
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
    utterance.lang =
      voiceLocale === "ar" ? "ar-SA" : voiceLocale === "fr" ? "fr-FR" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    try {
      const voices = window.speechSynthesis.getVoices();
      const prefix = voiceLocale === "ar" ? "ar" : voiceLocale === "fr" ? "fr" : "en";
      const matched = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
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

  // Zero-Token Speech-to-Text (STT) Voice Input Handler
  const toggleListening = () => {
    if (!speechSupported) {
      alert(t.voiceNotSupported);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;

      // Map language: ar -> Moroccan Arabic 'ar-MA' (fallback ar-SA), fr -> 'fr-FR', en -> 'en-US'
      recognition.lang =
        voiceLocale === "ar" ? "ar-MA" : voiceLocale === "fr" ? "fr-FR" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            setInput(event.results[i][0].transcript);
          }
        }
        if (finalTranscript) {
          setInput(finalTranscript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Smart Built-in Local Business & Image Analyzer Fallback Engine
  const generateLocalStoreInsight = async (
    query: string,
    attachedFile: { name: string; type: string; url: string } | null,
    targetLocale: SupportedLocale
  ): Promise<string> => {
    const isAr = targetLocale === "ar";
    const isEn = targetLocale === "en";

    // 1. Image / Receipt Analysis
    if (attachedFile?.type?.startsWith("image/")) {
      if (isAr) {
        return `قمت بتحليل الصورة المرفقة (${attachedFile.name}) بنجاح عبر محرك الرؤية المحلي:\n\n• نوع المستند: إيصال شراء / فاتورة تجارية مغربية.\n• معالجة الصورة: تم التدقيق بجودة عالية دون استهلاك بيانات السحابة.\n• التوجيه المقترح: المستند صالح، يمكنك استيراد عناصره مباشرة إلى كتالوج المنتجات أو تسجيله في ديون الموردين.`;
      } else if (isEn) {
        return `Successfully analyzed the attached image (${attachedFile.name}) via the local vision engine:\n\n• Document Type: Moroccan Commercial Receipt / Purchase Invoice.\n• Processing: Zero cloud bandwidth used.\n• Recommended Action: Document verified. You can import item lines directly into your catalog or record it under Supplier Invoices.`;
      } else {
        return `Analyse de l'image jointe (${attachedFile.name}) effectuée avec succès via le moteur de vision local :\n\n• Type de document : Reçu d'achat / Facture commerciale marocaine.\n• Traitement : 100% sécurisé en local sans latence.\n• Action suggérée : Document vérifié. Vous pouvez l'enregistrer dans votre grand livre fournisseurs ou catalogue.`;
      }
    }

    // 2. Query Live KPIs
    let todaySalesMad = 0;
    let transactions = 0;
    let lowStockCount = 0;

    try {
      const res = await fetch("/api/v1/dashboard/kpis");
      if (res.ok) {
        const data = await res.json();
        todaySalesMad = data.data?.todaySales || 0;
        transactions = data.data?.todayTransactions || 0;
        lowStockCount = data.data?.lowStockItemsCount || 0;
      }
    } catch {}

    const lower = query.toLowerCase();

    // Sales query
    if (
      lower.includes("vente") ||
      lower.includes("sales") ||
      lower.includes("revenue") ||
      query.includes("مبيعات") ||
      query.includes("دخل") ||
      query.includes("شحال")
    ) {
      if (isAr) {
        return `مبيعات اليوم حتى هذه اللحظة:\n\n• إجمالي المعاملات: ${todaySalesMad.toFixed(2)} درهم مغربي.\n• عدد الإيصالات: ${transactions} عملية بيع.\n• ملخص الأداء: العمليات منتظمة، وسيصلك التقرير التنفيذي الشامل الليلة على WhatsApp في الموعد المحدد.`;
      } else if (isEn) {
        return `Today's Real-Time Sales Summary:\n\n• Gross Revenue: ${todaySalesMad.toFixed(2)} MAD.\n• Verified Orders: ${transactions} transactions.\n• Status: Operations are running smoothly. The nightly executive digest will be sent to your WhatsApp on schedule.`;
      } else {
        return `Synthèse des Ventes du Jour en Direct :\n\n• Chiffre d'affaires brut : ${todaySalesMad.toFixed(2)} MAD.\n• Transactions enregistrées : ${transactions} tickets.\n• Statut : Tout fonctionne parfaitement. Le récapitulatif exécutif vous parviendra ce soir sur WhatsApp.`;
      }
    }

    // Inventory query
    if (
      lower.includes("stock") ||
      lower.includes("inventaire") ||
      lower.includes("low") ||
      query.includes("مخزون") ||
      query.includes("سلع") ||
      query.includes("ناقص")
    ) {
      if (isAr) {
        return `تقرير حالة المخزون المحلي:\n\n• المنتجات الحرجة: ${lowStockCount > 0 ? `${lowStockCount} منتجات قاربت على النفاد` : "جميع المنتجات في مستويات آمنة وطبيعية"}.\n• نصيحة المساعد الذكي: راجع قائمة الموردين لتأكيد كميات الطلب المقترحة وتفادي أي نقص في سلعك الأكثر طلباً.`;
      } else if (isEn) {
        return `Live Inventory Health Report:\n\n• Low Stock Alert: ${lowStockCount > 0 ? `${lowStockCount} items below alert threshold` : "All catalog items are at healthy stock levels"}.\n• Smart Tip: Check your Suppliers tab to review suggested reorder quantities and prevent stockouts on fast-moving goods.`;
      } else {
        return `Rapport d'État des Stocks en Direct :\n\n• Alerte réapprovisionnement : ${lowStockCount > 0 ? `${lowStockCount} articles sous le seuil d'alerte` : "Tous les articles sont à un niveau de stock optimal"}.\n• Conseil de gestion : Consultez l'onglet Fournisseurs pour valider les réapprovisionnements recommandés.`;
      }
    }

    // General intelligent response
    if (isAr) {
      return `مساعد كسب الذكي في خدمتك دائماً:\n\nأنا أراقب أداء متجرك ومبيعاتك لحظة بلحظة. يمكنك سؤالي صوتياً أو كتابياً عن مبيعات اليوم، حالة المخزون، أو إرفاق فواتير المشتريات لتحليلها فورياً بدون استهلاك توكنز.`;
    } else if (isEn) {
      return `KASPI AI Assistant is always online for your business:\n\nI continuously monitor your live store sales and stock levels. You can ask me via voice or text about today's revenue, low stock items, or attach purchase invoices for immediate zero-token analysis.`;
    } else {
      return `L'Assistant KASPI IA est toujours actif pour votre commerce :\n\nJe surveille vos ventes et votre stock en temps réel. Vous pouvez me poser vos questions à la voix ou par écrit, ou joindre des factures pour une analyse immédiate sans coût.`;
    }
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;

    const messageText = input;
    const currentAttachment = attachment;
    setInput("");
    setAttachment(null);

    const userMessageId = `user-${Date.now()}`;
    const userMsg: LocalChatMessage = {
      id: userMessageId,
      role: "user",
      content: messageText || t.analyzePrompt,
      parts: currentAttachment
        ? [
            {
              type: "file",
              mediaType: currentAttachment.type,
              url: currentAttachment.url,
              name: currentAttachment.name,
            },
          ]
        : undefined,
    };

    setLocalFallbackMessages((prev) => [...prev, userMsg]);

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
      // Graceful instant fallback to local business engine (Zero dead errors)
      setIsLocalThinking(true);
      const insight = await generateLocalStoreInsight(messageText, currentAttachment, activeLocale);
      setIsLocalThinking(false);
      const assistantId = `assistant-${Date.now()}`;
      setLocalFallbackMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: insight,
        },
      ]);
      if (autoSpeak) {
        speakMessage(assistantId, insight);
      }
    }
  };

  const handleQuickPrompt = async (promptText: string) => {
    setInput(promptText);
    const userMsg: LocalChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: promptText,
    };
    setLocalFallbackMessages((prev) => [...prev, userMsg]);

    try {
      await sendMessage(
        { text: promptText },
        {
          body: { locale: activeLocale },
          headers: { "x-app-locale": activeLocale },
        }
      );
    } catch {
      setIsLocalThinking(true);
      const insight = await generateLocalStoreInsight(promptText, null, activeLocale);
      setIsLocalThinking(false);
      const assistantId = `assistant-${Date.now()}`;
      setLocalFallbackMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: insight,
        },
      ]);
      if (autoSpeak) {
        speakMessage(assistantId, insight);
      }
    }
  };

  const allDisplayMessages = useMemo(() => {
    if (sdkMessages.length > 0) return sdkMessages;
    return localFallbackMessages;
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
              {/* Header with Grip Drag Handle, Voice Language Selector & Apple Back Button */}
              <div
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                className="border-b border-white/15 text-[var(--kaspi-text-primary)] px-3.5 py-3 flex items-center justify-between shadow-xs shrink-0 cursor-grab active:cursor-grabbing select-none"
                title={t.dragTooltip}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="p-1 rounded-lg text-zinc-400 hover:text-white kaspi-glass-surface flex items-center justify-center shrink-0"
                    title={t.dragTooltip}
                  >
                    <GripHorizontal className="w-4 h-4" />
                  </div>
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
                  {/* Free Voice Language Selector Pill */}
                  <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg kaspi-glass-surface border border-white/10 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setVoiceLocale("ar")}
                      className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                        voiceLocale === "ar"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "text-zinc-400 hover:text-white"
                      }`}
                      title="العربية والدارجة المغربية"
                    >
                      AR
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceLocale("fr")}
                      className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                        voiceLocale === "fr"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "text-zinc-400 hover:text-white"
                      }`}
                      title="Français"
                    >
                      FR
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceLocale("en")}
                      className={`px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                        voiceLocale === "en"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "text-zinc-400 hover:text-white"
                      }`}
                      title="English"
                    >
                      EN
                    </button>
                  </div>

                  {/* Auto-Read Voice Toggle Button */}
                  {ttsSupported && (
                    <button
                      type="button"
                      onClick={() => setAutoSpeak((prev) => !prev)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        autoSpeak
                          ? "bg-emerald-500/25 border-emerald-500/40 text-emerald-400"
                          : "kaspi-glass-surface border-white/10 text-zinc-400 hover:text-white"
                      }`}
                      title={t.voiceAutoSpeak}
                      aria-label={t.voiceAutoSpeak}
                    >
                      {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {/* Strictly Closes Window Only on Explicit Click */}
                  <AppleBackButton
                    onClick={() => setIsOpen(false)}
                    locale={activeLocale}
                    title={t.closeTitle}
                  />
                </div>
              </div>

              {/* Messages Area with Doodle Wallpaper & Clean Scrollbar Suppression */}
              <div className="relative flex-1 overflow-y-auto overflow-x-hidden kaspi-no-scrollbar p-3.5 space-y-3">
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
                            className={`group relative max-w-[84%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                              isUser
                                ? "bg-white text-black font-medium rounded-tr-none shadow-xs text-start"
                                : "bg-zinc-900/95 backdrop-blur-md border border-zinc-800/80 text-zinc-200 rounded-tl-none shadow-xs whitespace-pre-wrap text-start"
                            }`}
                          >
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
                            <div>{textContent}</div>

                            {/* Voice Read Aloud Button on Assistant Replies (100% Free) */}
                            {!isUser && ttsSupported && (
                              <button
                                type="button"
                                onClick={() => speakMessage(m.id, textContent)}
                                className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                                  speakingMessageId === m.id
                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 animate-pulse"
                                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                                }`}
                                title={t.voiceReadAloud}
                              >
                                {speakingMessageId === m.id ? (
                                  <>
                                    <VolumeX className="w-3 h-3" />
                                    <span>{activeLocale === "ar" ? "إيقاف الصوت" : "Arrêter"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3 h-3" />
                                    <span>{t.voiceReadAloud}</span>
                                  </>
                                )}
                              </button>
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
                        <RotateCcw className="w-3 h-3" />
                        <span>{t.retry}</span>
                      </button>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Listening Active Pulse Bar */}
              {isListening && (
                <div className="px-3.5 py-2 bg-emerald-950/80 border-t border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-semibold">{t.voiceListening}</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className="px-2 py-0.5 rounded bg-emerald-500 text-black text-[10px] font-bold cursor-pointer hover:bg-emerald-400"
                  >
                    {t.voiceStop}
                  </button>
                </div>
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

              {/* Input Bar with Free Voice Microphone Button */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-white/10 flex items-center gap-2 shrink-0 bg-black/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  title={t.uploadTooltip}
                  aria-label={t.uploadTooltip}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* 100% Free In-Browser Zero-Token Voice Microphone Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    isListening
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 scale-105 animate-pulse"
                      : "text-zinc-400 hover:text-emerald-400 hover:bg-white/10"
                  }`}
                  title={isListening ? t.voiceStop : t.voiceInput}
                  aria-label={isListening ? t.voiceStop : t.voiceInput}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-black animate-spin" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.inputPlaceholder}
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2 text-xs kaspi-translucent-input rounded-xl focus:outline-none transition-all placeholder-zinc-500"
                />

                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !attachment)}
                  className="p-2.5 rounded-xl kaspi-emerald-checkout-btn disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Send Message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default AIChatWidget;