"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUp,
  Atom,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  Globe,
  Link2,
  Loader2,
  Mic,
  MicOff,
  MoreHorizontal,
  PanelLeft,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Share2,
  SquareCheck,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { KaspiThemeToggle } from "@/components/theme/KaspiThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeyukaLoopMark } from "./HeyukaLoopMark";
import { HEYUKAGmailAccessCard } from "./HEYUKAGmailAccessCard";

type ChatLocale = "ar" | "fr" | "en";

interface ChatSource {
  title: string;
  url: string;
  snippet?: string;
}

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  thinkingSec?: number;
  sources?: ChatSource[];
  imagePreview?: string;
}

interface ThreadItem {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
  messages: ChatMessageItem[];
}

const COPY: Record<
  ChatLocale,
  {
    newChat: string;
    selectChats: string;
    pinned: string;
    today: string;
    last30: string;
    greeting: string;
    placeholder: string;
    deepThink: string;
    search: string;
    thinking: string;
    thoughtFor: string;
    searching: string;
    share: string;
    rename: string;
    pin: string;
    unpin: string;
    multiSelect: string;
    del: string;
    selectAll: string;
    selectedTurns: string;
    cancel: string;
    createPublicLink: string;
    copiedLink: string;
    searchChatsPlaceholder: string;
    signInGmail: string;
    platformConsole: string;
    disclaimer: string;
    audioStart: string;
    audioStop: string;
  }
> = {
  ar: {
    newChat: "محادثة جديدة",
    selectChats: "تحديد المحادثات",
    pinned: "مثبتة",
    today: "اليوم",
    last30: "آخر 30 يوم",
    greeting: "مرحباً! كيف أساعدك اليوم؟",
    placeholder: "راسل HEYUKA...",
    deepThink: "تفكير عميق (DeepThink)",
    search: "بحث الويب",
    thinking: "جاري التفكير العميق...",
    thoughtFor: "فكّر لمدة",
    searching: "جاري البحث المباشر على الإنترنت...",
    share: "مشاركة",
    rename: "إعادة تسمية",
    pin: "تثبيت",
    unpin: "إلغاء التثبيت",
    multiSelect: "تحديد متعدد",
    del: "حذف",
    selectAll: "تحديد الكل",
    selectedTurns: "رسائل محددة",
    cancel: "إلغاء",
    createPublicLink: "إنشاء رابط مشاركة عام",
    copiedLink: "تم نسخ الرابط بنجاح! أي شخص يفتحه ويسجل بـ Gmail يدخل للمحادثة مباشرة.",
    searchChatsPlaceholder: "ابحث في محتوى المحادثات...",
    signInGmail: "الدخول عبر Gmail",
    platformConsole: "منصة الـ API",
    disclaimer: "مخرجات HEYUKA للاسترشاد والمساعدة الفورية — مدعومة 100% مجاناً من KASPI.",
    audioStart: "إدخال صوتي (Audio)",
    audioStop: "إيقاف التسجيل",
  },
  fr: {
    newChat: "Nouvelle discussion",
    selectChats: "Sélectionner",
    pinned: "Épinglées",
    today: "Aujourd'hui",
    last30: "30 derniers jours",
    greeting: "Bonjour ! Comment puis-je vous aider ?",
    placeholder: "Message à HEYUKA...",
    deepThink: "DeepThink",
    search: "Recherche Web",
    thinking: "Réflexion structurée en cours...",
    thoughtFor: "Réfléchi pendant",
    searching: "Recherche sur le web en direct...",
    share: "Partager",
    rename: "Renommer",
    pin: "Épingler",
    unpin: "Désépingler",
    multiSelect: "Sélection multiple",
    del: "Supprimer",
    selectAll: "Tout sélectionner",
    selectedTurns: "échange(s) sélectionné(s)",
    cancel: "Annuler",
    createPublicLink: "Créer un lien public",
    copiedLink: "Lien copié ! Vos contacts peuvent se connecter via Gmail et poursuivre cette discussion.",
    searchChatsPlaceholder: "Rechercher dans les discussions...",
    signInGmail: "Connexion Gmail",
    platformConsole: "Console API",
    disclaimer: "Généré par HEYUKA IA — Propulsé gratuitement par KASPI.",
    audioStart: "Entrée Audio / Voix",
    audioStop: "Arrêter l'audio",
  },
  en: {
    newChat: "New chat",
    selectChats: "Select Chats",
    pinned: "Pinned",
    today: "Today",
    last30: "30 Days",
    greeting: "Hi! What's on your mind today?",
    placeholder: "Message HEYUKA",
    deepThink: "DeepThink",
    search: "Search",
    thinking: "Thinking...",
    thoughtFor: "Thought for",
    searching: "Searching web sources...",
    share: "Share",
    rename: "Rename",
    pin: "Pin",
    unpin: "Unpin",
    multiSelect: "Multi-select",
    del: "Delete",
    selectAll: "Select all",
    selectedTurns: "conversation turn(s) selected",
    cancel: "Cancel",
    createPublicLink: "Create public link",
    copiedLink: "Public link copied! Anyone opening it can select Gmail and continue this conversation.",
    searchChatsPlaceholder: "Search chat content...",
    signInGmail: "Sign in (Gmail)",
    platformConsole: "API Platform",
    disclaimer: "HEYUKA by KASPI — Sovereign AI ($0.00 free web access).",
    audioStart: "Audio / Voice Input",
    audioStop: "Stop Audio",
  },
};

export function HeyukaChatWorkspace() {
  const localeRaw = useLocale();
  const locale: ChatLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const isRtl = locale === "ar";
  const t = COPY[locale];
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [openMenuThreadId, setOpenMenuThreadId] = useState<string | null>(null);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Composer State
  const [input, setInput] = useState("");
  const [deepThink, setDeepThink] = useState(true);
  const [webSearch, setWebSearch] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [audioNote, setAudioNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [sending, setSending] = useState(false);

  // Inline Message Edit State (Screenshot 8)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // Expanded thinking blocks + reactions + audio speak
  const [collapsedThoughts, setCollapsedThoughts] = useState<Record<string, boolean>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down">>({});
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Share selection mode (Screenshots 11 & 12)
  const [shareSelectMode, setShareSelectMode] = useState(false);
  const [shareSelectedMsgIds, setShareSelectedMsgIds] = useState<string[]>([]);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareNoticeUrl, setShareNoticeUrl] = useState<string | null>(null);

  // Modals rendered exclusively via KaspiGlassModalPortal
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/heyuka/chat-threads", { cache: "no-store" });
      const json = await res.json();
      setAuthenticated(Boolean(json?.authenticated));
      setUserEmail(json?.userEmail || null);
      if (Array.isArray(json?.threads)) {
        setThreads(json.threads);
      }
    } catch {}
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  // Preload shared conversation if visitor clicked a public `/share/sh_...` link & entered Chat!
  useEffect(() => {
    const fromShare = searchParams?.get("fromShare");
    if (!fromShare) return;
    fetch(`/api/v1/heyuka/share?id=${encodeURIComponent(fromShare)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok && Array.isArray(d.share?.turns)) {
          const loaded: ChatMessageItem[] = d.share.turns.map((turn: any, idx: number) => ({
            id: turn.id || `shared_${idx}`,
            role: turn.role === "assistant" ? "assistant" : "user",
            content: String(turn.content || ""),
            reasoning: turn.reasoning,
            thinkingSec: turn.thinkingSec,
            sources: Array.isArray(turn.sources) ? turn.sources : undefined,
          }));
          setActiveThreadId(null);
          setMessages(loaded);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    bottomScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  const activeThreadTitle = useMemo(() => {
    if (activeThreadId) {
      const found = threads.find((th) => th.id === activeThreadId);
      if (found) return found.title;
    }
    const firstUser = messages.find((m) => m.role === "user");
    return firstUser ? firstUser.content.slice(0, 42) : t.newChat;
  }, [activeThreadId, threads, messages, t.newChat]);

  const persistCurrentThread = async (nextMsgs: ChatMessageItem[], currentId: string | null) => {
    if (!authenticated || nextMsgs.length === 0) return currentId;
    const title = nextMsgs.find((m) => m.role === "user")?.content.slice(0, 64) || "New conversation";
    try {
      const res = await fetch("/api/v1/heyuka/chat-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(currentId ? { id: currentId } : {}),
          title,
          messages: nextMsgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();
      if (json?.ok && json.thread?.id) {
        await loadThreads();
        return String(json.thread.id);
      }
    } catch {}
    return currentId;
  };

  const handleSend = async (overrideText?: string, baseHistory?: ChatMessageItem[]) => {
    const textToSend = (overrideText ?? input).trim();
    if ((!textToSend && !attachedImage && !audioNote) || sending) return;

    const historyToUse = baseHistory ?? messages;
    const userMsg: ChatMessageItem = {
      id: `u_${Date.now()}`,
      role: "user",
      content: textToSend || (audioNote ? `[Audio] ${audioNote}` : "Analyze the attached image."),
      imagePreview: attachedImage || undefined,
    };

    const optimisticMsgs = [...historyToUse, userMsg];
    setMessages(optimisticMsgs);
    if (!overrideText) {
      setInput("");
      setAttachedImage(null);
      setAudioNote(null);
    }
    setSending(true);
    setShareNoticeUrl(null);

    try {
      const res = await fetch("/api/v1/heyuka/chat-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: attachedImage ? "heyuka-vision" : deepThink ? "heyuka-omni" : "heyuka-core",
          deepThink,
          webSearch,
          locale,
          imageBase64: attachedImage || undefined,
          audioTranscriptNote: audioNote || undefined,
          messages: optimisticMsgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();
      const assistantMsg: ChatMessageItem = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content:
          json?.answer ||
          json?.error ||
          "Unable to reach inference right now — please retry cleanly.",
        reasoning: json?.reasoning,
        thinkingSec: json?.thinkingSec,
        sources: Array.isArray(json?.sources) ? json.sources : undefined,
      };
      const finalMsgs = [...optimisticMsgs, assistantMsg];
      setMessages(finalMsgs);
      const savedId = await persistCurrentThread(finalMsgs, activeThreadId);
      if (savedId && !activeThreadId) setActiveThreadId(savedId);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Network connection interrupted. Please resend your message.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = async (assistantIndex: number) => {
    const priorHistory = messages.slice(0, assistantIndex);
    const lastUser = [...priorHistory].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const baseWithoutLastUser = priorHistory.slice(0, priorHistory.lastIndexOf(lastUser));
    await handleSend(lastUser.content, baseWithoutLastUser);
  };

  const handleSaveInlineEdit = async (msgId: string) => {
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    const idx = messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;
    const truncatedHistory = messages.slice(0, idx);
    setEditingMsgId(null);
    setEditDraft("");
    await handleSend(trimmed, truncatedHistory);
  };

  const handleToggleAudioMic = () => {
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setListening(false);
      return;
    }

    const SpeechRec =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      // Fallback gracefully to file picker for audio upload if browser lacks WebSpeech API
      audioFileRef.current?.click();
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (ev: any) => {
        const transcript = Array.from(ev.results)
          .map((r: any) => r[0]?.transcript || "")
          .join(" ")
          .trim();
        if (transcript) setInput(transcript);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      audioFileRef.current?.click();
    }
  };

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = /[\u0600-\u06FF]/.test(text)
      ? "ar-MA"
      : locale === "fr"
      ? "fr-FR"
      : "en-US";
    utter.onend = () => setSpeakingMsgId(null);
    utter.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utter);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1600);
    } catch {}
  };

  const enterShareSelection = (preselectMsgId?: string) => {
    if (messages.length === 0) return;
    setShareSelectMode(true);
    setShareSelectedMsgIds(
      preselectMsgId ? [preselectMsgId] : messages.map((m) => m.id)
    );
    setShareNoticeUrl(null);
  };

  const handleCreatePublicLink = async () => {
    if (shareSelectedMsgIds.length === 0 || shareBusy) return;
    setShareBusy(true);
    try {
      const selectedTurns = messages.filter((m) => shareSelectedMsgIds.includes(m.id));
      const res = await fetch("/api/v1/heyuka/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeThreadTitle,
          locale,
          model: deepThink ? "heyuka-omni" : "heyuka-core",
          turns: selectedTurns.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            reasoning: m.reasoning,
            thinkingSec: m.thinkingSec,
            sources: m.sources,
          })),
        }),
      });
      const json = await res.json();
      if (json?.ok && json.shareUrl) {
        try {
          await navigator.clipboard.writeText(json.shareUrl);
        } catch {}
        setShareNoticeUrl(json.shareUrl);
        setShareSelectMode(false);
      }
    } finally {
      setShareBusy(false);
    }
  };

  const startNewChat = () => {
    setActiveThreadId(null);
    setMessages([]);
    setShareSelectMode(false);
    setShareNoticeUrl(null);
    setEditingMsgId(null);
  };

  const selectThread = (th: ThreadItem) => {
    setActiveThreadId(th.id);
    setMessages(th.messages || []);
    setShareSelectMode(false);
    setShareNoticeUrl(null);
    setOpenMenuThreadId(null);
  };

  const handleThreadAction = async (
    action: "pin" | "unpin" | "delete" | "share" | "rename",
    th: ThreadItem
  ) => {
    setOpenMenuThreadId(null);
    if (action === "share") {
      selectThread(th);
      setShareSelectMode(true);
      setShareSelectedMsgIds((th.messages || []).map((m) => m.id));
      return;
    }
    if (action === "rename") {
      setRenamingThreadId(th.id);
      setRenameDraft(th.title);
      return;
    }
    if (action === "delete") {
      await fetch(`/api/v1/heyuka/chat-threads?id=${encodeURIComponent(th.id)}`, {
        method: "DELETE",
      });
      if (activeThreadId === th.id) startNewChat();
      await loadThreads();
      return;
    }
    await fetch("/api/v1/heyuka/chat-threads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id: th.id }),
    });
    await loadThreads();
  };

  const commitRename = async (id: string) => {
    const trimmed = renameDraft.trim();
    setRenamingThreadId(null);
    if (!trimmed) return;
    await fetch("/api/v1/heyuka/chat-threads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", id, title: trimmed }),
    });
    await loadThreads();
  };

  const handleBulkAction = async (action: "bulk_pin" | "bulk_delete") => {
    if (selectedThreadIds.length === 0) return;
    await fetch("/api/v1/heyuka/chat-threads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: selectedThreadIds }),
    });
    if (action === "bulk_delete" && activeThreadId && selectedThreadIds.includes(activeThreadId)) {
      startNewChat();
    }
    setSelectedThreadIds([]);
    setSelectMode(false);
    await loadThreads();
  };

  const pinnedThreads = threads.filter((th) => th.pinned);
  const now = Date.now();
  const todayThreads = threads.filter(
    (th) => !th.pinned && now - new Date(th.updatedAt).getTime() < 86_400_000
  );
  const olderThreads = threads.filter(
    (th) => !th.pinned && now - new Date(th.updatedAt).getTime() >= 86_400_000
  );

  const searchedThreads = threads.filter((th) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      th.title.toLowerCase().includes(q) ||
      th.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const renderThreadRow = (th: ThreadItem) => {
    const isSelectedBulk = selectedThreadIds.includes(th.id);
    const isActive = activeThreadId === th.id;
    const isMenuOpen = openMenuThreadId === th.id;

    return (
      <div
        key={th.id}
        className={`relative group flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
          isActive
            ? "bg-white/[0.11] text-[var(--kaspi-text-primary)] font-semibold"
            : "text-[var(--kaspi-text-secondary)] hover:bg-white/[0.06]"
        }`}
        onClick={() => {
          if (selectMode) {
            setSelectedThreadIds((prev) =>
              prev.includes(th.id) ? prev.filter((x) => x !== th.id) : [...prev, th.id]
            );
          } else {
            selectThread(th);
          }
        }}
      >
        {selectMode && (
          <input
            type="checkbox"
            checked={isSelectedBulk}
            onChange={() => {}}
            className="accent-rose-600 w-3.5 h-3.5 shrink-0 cursor-pointer"
          />
        )}

        {renamingThreadId === th.id ? (
          <input
            type="text"
            autoFocus
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onBlur={() => void commitRename(th.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commitRename(th.id);
              if (e.key === "Escape") setRenamingThreadId(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-white/10 rounded px-1.5 py-0.5 text-xs focus:outline-none"
          />
        ) : (
          <span className="truncate flex-1">{th.title}</span>
        )}

        {!selectMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuThreadId((p) => (p === th.id ? null : th.id));
            }}
            className={`p-1 rounded-lg hover:bg-white/15 cursor-pointer ${
              isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } transition-opacity`}
            aria-label="Thread menu"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Screenshot 6 Context Dropdown: Rename / Pin / Share / Multi-select / Delete */}
        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute top-9 ${
              isRtl ? "left-1" : "right-1"
            } z-40 w-40 rounded-xl kaspi-opaque-glass-modal p-1.5 shadow-xl border border-[var(--kaspi-border)] space-y-0.5 text-xs`}
          >
            <button
              type="button"
              onClick={() => void handleThreadAction("rename", th)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-start cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t.rename}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleThreadAction(th.pinned ? "unpin" : "pin", th)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-start cursor-pointer"
            >
              {th.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              <span>{th.pinned ? t.unpin : t.pin}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleThreadAction("share", th)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-start cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.share}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenMenuThreadId(null);
                setSelectMode(true);
                setSelectedThreadIds([th.id]);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-start cursor-pointer"
            >
              <SquareCheck className="w-3.5 h-3.5" />
              <span>{t.multiSelect}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleThreadAction("delete", th)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 text-start cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.del}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="h-screen flex overflow-hidden bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] selection:bg-rose-600 selection:text-white"
    >
      {/* Hidden File Pickers for Image & Audio fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => {
            if (typeof r.result === "string") setAttachedImage(r.result);
          };
          r.readAsDataURL(f);
        }}
      />
      <input
        ref={audioFileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setAudioNote(`Uploaded audio file: ${f.name} (${Math.round(f.size / 1024)} KB)`);
          }
        }}
      />

      {/* Left DeepSeek-Style Collapsible Sidebar */}
      {sidebarOpen && (
        <aside
          className={`w-[260px] shrink-0 hidden md:flex flex-col justify-between bg-[var(--kaspi-surface,rgba(22,24,29,0.92))] border-[var(--kaspi-border)] p-3 ${
            isRtl ? "border-l" : "border-r"
          }`}
        >
          {selectMode ? (
            /* Screenshot 15: Select Chats Bulk Mode */
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-bold text-[var(--kaspi-text-primary)]">
                    {t.selectChats}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectMode(false);
                      setSelectedThreadIds([]);
                    }}
                    className="p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[72vh] overflow-y-auto">
                  {threads.map(renderThreadRow)}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--kaspi-border)] grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => void handleBulkAction("bulk_pin")}
                  disabled={selectedThreadIds.length === 0}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl kaspi-glass-surface hover:border-rose-500/40 cursor-pointer disabled:opacity-40"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{t.pin}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulkAction("bulk_delete")}
                  disabled={selectedThreadIds.length === 0}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl kaspi-glass-surface text-rose-400 hover:bg-rose-500/15 cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.del}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Normal Sidebar (Screenshot 5) */
            <>
              <div className="space-y-4 min-h-0 flex-1 flex flex-col">
                <div className="flex items-center justify-between px-1">
                  <Link href={`/${locale}/heyuka`} className="flex items-center gap-2">
                    <HeyukaLoopMark size="sm" variant="crimson" />
                    <span className="text-lg font-black tracking-tight text-[var(--kaspi-text-primary)]">
                      heyuka
                    </span>
                  </Link>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSearchModalOpen(true)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--kaspi-text-secondary)] cursor-pointer"
                      title="Search chats"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--kaspi-text-secondary)] cursor-pointer"
                      title="Collapse sidebar"
                    >
                      <PanelLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Full-width Pill New Chat Button */}
                <button
                  type="button"
                  onClick={startNewChat}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full kaspi-glass-surface hover:border-rose-500/40 text-xs font-bold text-[var(--kaspi-text-primary)] cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4 text-rose-500" />
                  <span>{t.newChat}</span>
                </button>

                {/* Scrollable Threads List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 kaspi-no-scrollbar">
                  {pinnedThreads.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--kaspi-text-muted)]">
                        {t.pinned}
                      </p>
                      {pinnedThreads.map(renderThreadRow)}
                    </div>
                  )}

                  {todayThreads.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--kaspi-text-muted)]">
                        {t.today}
                      </p>
                      {todayThreads.map(renderThreadRow)}
                    </div>
                  )}

                  {olderThreads.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--kaspi-text-muted)]">
                        {t.last30}
                      </p>
                      {olderThreads.map(renderThreadRow)}
                    </div>
                  )}

                  {authenticated && threads.length === 0 && (
                    <p className="px-2 text-[11px] text-[var(--kaspi-text-muted)]">
                      No saved chats yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom User Profile & API Platform Link */}
              <div className="pt-3 border-t border-[var(--kaspi-border)] space-y-1.5">
                {authenticated ? (
                  <Link
                    href={`/${locale}/zebra-x/profile`}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.06] text-xs"
                  >
                    <div className="w-7 h-7 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center font-bold text-rose-400 uppercase shrink-0">
                      {(userEmail || "H").slice(0, 1)}
                    </div>
                    <span className="truncate font-semibold flex-1">
                      {userEmail?.split("@")[0] || "Account"}
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl kaspi-glass-surface hover:border-rose-500/40 text-xs font-semibold cursor-pointer"
                  >
                    <User className="w-4 h-4 text-rose-500" />
                    <span className="truncate">{t.signInGmail}</span>
                  </button>
                )}

                <Link
                  href={`/${locale}/zebra-x/api-keys`}
                  className="block px-2.5 py-1.5 text-[11px] text-[var(--kaspi-text-muted)] hover:text-rose-400 font-semibold"
                >
                  {t.platformConsole} →
                </Link>
              </div>
            </>
          )}
        </aside>
      )}

      {/* Main Chat Canvas */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Bar (Screenshot 13 collapsed capsule + Title + Share Button) */}
        <header className="px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {(!sidebarOpen || typeof window !== "undefined") && (
              <div
                className={`${
                  sidebarOpen ? "md:hidden" : "flex"
                } inline-flex items-center gap-1 px-2 py-1 rounded-full kaspi-glass-surface`}
              >
                <Link href={`/${locale}/heyuka`} className="px-1">
                  <HeyukaLoopMark size="xs" variant="crimson" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSidebarOpen((p) => !p)}
                  className="p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
                  title="Toggle Sidebar"
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(true)}
                  className="p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
                  title="Search"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={startNewChat}
                  className="p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
                  title={t.newChat}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {messages.length > 0 && (
              <span className="text-xs sm:text-sm font-bold text-[var(--kaspi-text-primary)] truncate">
                {activeThreadTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => enterShareSelection()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full kaspi-glass-surface hover:border-rose-500/40 text-xs font-semibold cursor-pointer"
                title={t.share}
              >
                <Share2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">{t.share}</span>
              </button>
            )}
            <KaspiThemeToggle locale={locale} />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Share URL Copied Toast */}
        {shareNoticeUrl && (
          <div className="mx-auto max-w-2xl px-4 w-full mb-2">
            <div className="rounded-2xl kaspi-glass-surface border border-rose-500/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Link2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-[var(--kaspi-text-primary)] font-medium truncate">
                  {t.copiedLink}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={shareNoticeUrl}
                  className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-[11px]"
                >
                  Open Shared Link
                </Link>
                <button
                  type="button"
                  onClick={() => setShareNoticeUrl(null)}
                  className="p-1 rounded hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Scroll Area OR Centered Empty Greeting (Screenshot 5 & 7) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto pb-16 space-y-6">
              <div className="flex items-center gap-3">
                <HeyukaLoopMark animated size="lg" variant="crimson" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--kaspi-text-primary)]">
                  {t.greeting}
                </h1>
              </div>

              {/* Centered Composer Card in Empty State (exact Screenshot 5 positioning!) */}
              {renderComposer()}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 py-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const checkedForShare = shareSelectedMsgIds.includes(msg.id);
                const thoughtCollapsed = Boolean(collapsedThoughts[msg.id]);

                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    {shareSelectMode && (
                      <input
                        type="checkbox"
                        checked={checkedForShare}
                        onChange={() =>
                          setShareSelectedMsgIds((prev) =>
                            prev.includes(msg.id)
                              ? prev.filter((x) => x !== msg.id)
                              : [...prev, msg.id]
                          )
                        }
                        className="mt-2.5 w-4 h-4 accent-rose-600 cursor-pointer shrink-0"
                      />
                    )}

                    <div className={`flex-1 min-w-0 ${isUser ? "flex flex-col items-end" : ""}`}>
                      {isUser ? (
                        editingMsgId === msg.id ? (
                          /* Screenshot 8 Inline Message Editor */
                          <div className="w-full rounded-2xl kaspi-glass-surface border border-rose-500/50 p-3.5 space-y-3">
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              rows={2}
                              className="w-full bg-transparent text-sm text-[var(--kaspi-text-primary)] focus:outline-none resize-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingMsgId(null)}
                                className="px-3.5 py-1.5 rounded-full kaspi-glass-surface text-xs font-semibold cursor-pointer"
                              >
                                {t.cancel}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleSaveInlineEdit(msg.id)}
                                className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group max-w-[85%] space-y-1.5 flex flex-col items-end">
                            <div className="px-4 py-2.5 rounded-2xl kaspi-glass-surface text-sm text-[var(--kaspi-text-primary)] whitespace-pre-wrap">
                              {msg.imagePreview && (
                                <img
                                  src={msg.imagePreview}
                                  alt="Attachment"
                                  className="max-h-40 rounded-lg mb-2 object-contain"
                                />
                              )}
                              {msg.content}
                            </div>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--kaspi-text-muted)]">
                              <button
                                type="button"
                                onClick={() => void handleCopy(msg.id, msg.content)}
                                className="p-1 rounded hover:bg-white/10 cursor-pointer"
                                title="Copy"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="w-3.5 h-3.5 text-rose-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMsgId(msg.id);
                                  setEditDraft(msg.content);
                                }}
                                className="p-1 rounded hover:bg-white/10 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        /* Screenshot 7 & 9 Assistant Response with Collapsible Thinking & Sources */
                        <div className="space-y-3">
                          {msg.reasoning && (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setCollapsedThoughts((p) => ({
                                    ...p,
                                    [msg.id]: !p[msg.id],
                                  }))
                                }
                                className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)] cursor-pointer"
                              >
                                <HeyukaLoopMark size="xs" variant="crimson" />
                                <span>
                                  {t.thoughtFor} {msg.thinkingSec || 2}s
                                </span>
                                {thoughtCollapsed ? (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {!thoughtCollapsed && (
                                <div className="border-l-2 border-rose-500/40 pl-3.5 text-xs text-[var(--kaspi-text-muted)] leading-relaxed whitespace-pre-wrap">
                                  {msg.reasoning}
                                </div>
                              )}
                            </div>
                          )}

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((src, sIdx) => (
                                <a
                                  key={`${src.url}-${sIdx}`}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full kaspi-glass-surface text-[11px] text-rose-400 hover:border-rose-500/40"
                                >
                                  <Globe className="w-3 h-3" />
                                  <span className="truncate max-w-[180px]">{src.title}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="text-sm text-[var(--kaspi-text-primary)] leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>

                          {/* Response Action Toolbar (Screenshot 9 + Audio Read-Aloud) */}
                          <div className="flex items-center gap-2 text-[var(--kaspi-text-muted)] pt-1">
                            <button
                              type="button"
                              onClick={() => void handleCopy(msg.id, msg.content)}
                              className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                              title="Copy"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRegenerate(idx)}
                              disabled={sending}
                              className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                              title="Regenerate"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setFeedbackMap((p) => ({ ...p, [msg.id]: "up" }))
                              }
                              className={`p-1.5 rounded-lg hover:bg-white/10 cursor-pointer ${
                                feedbackMap[msg.id] === "up" ? "text-rose-400" : ""
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setFeedbackMap((p) => ({ ...p, [msg.id]: "down" }))
                              }
                              className={`p-1.5 rounded-lg hover:bg-white/10 cursor-pointer ${
                                feedbackMap[msg.id] === "down" ? "text-rose-500" : ""
                              }`}
                              title="Needs improvement"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSpeakMessage(msg.id, msg.content)}
                              className={`p-1.5 rounded-lg hover:bg-white/10 cursor-pointer ${
                                speakingMsgId === msg.id ? "text-rose-500" : ""
                              }`}
                              title="Read Aloud (Audio)"
                            >
                              {speakingMsgId === msg.id ? (
                                <VolumeX className="w-3.5 h-3.5" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => enterShareSelection(msg.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                              title={t.share}
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Live Animated Thinking Status (Screenshot 10 animated KASPI ∞ Loop) */}
              {sending && (
                <div className="flex items-center gap-3 text-xs text-rose-400 font-semibold py-2">
                  <HeyukaLoopMark animated size="sm" variant="crimson" />
                  <span>{webSearch ? t.searching : t.thinking}</span>
                </div>
              )}

              <div ref={bottomScrollRef} />
            </div>
          )}
        </div>

        {/* Bottom Dock: EITHER Share Selection Footer (Screenshots 11 & 12) OR Composer */}
        {messages.length > 0 && (
          <div className="px-4 sm:px-6 pb-4 pt-2 shrink-0">
            <div className="max-w-3xl mx-auto space-y-2">
              {shareSelectMode ? (
                <div className="rounded-2xl kaspi-glass-surface px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSelectedMsgIds.length === messages.length && messages.length > 0}
                        onChange={(e) =>
                          setShareSelectedMsgIds(
                            e.target.checked ? messages.map((m) => m.id) : []
                          )
                        }
                        className="accent-rose-600 w-4 h-4 cursor-pointer"
                      />
                      <span>{t.selectAll}</span>
                    </label>
                    <span className="text-[var(--kaspi-text-muted)]">
                      {shareSelectedMsgIds.length} {t.selectedTurns}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShareSelectMode(false)}
                      className="px-4 py-2 rounded-full kaspi-glass-surface font-semibold cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      disabled={shareSelectedMsgIds.length === 0 || shareBusy}
                      onClick={() => void handleCreatePublicLink()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer disabled:opacity-40"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>{shareBusy ? "..." : t.createPublicLink}</span>
                    </button>
                  </div>
                </div>
              ) : (
                renderComposer()
              )}

              <p className="text-center text-[10px] text-[var(--kaspi-text-muted)]">
                {t.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Screenshot 14: Search Chat Content Modal via KaspiGlassModalPortal */}
      <KaspiGlassModalPortal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-lg rounded-2xl kaspi-opaque-glass-modal p-4 space-y-3">
          <div className="flex items-center gap-2.5 border-b border-[var(--kaspi-border)] pb-3">
            <Search className="w-4 h-4 text-rose-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchChatsPlaceholder}
              className="flex-1 bg-transparent text-xs text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSearchModalOpen(false)}
              className="p-1 rounded hover:bg-white/10 text-[var(--kaspi-text-muted)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {searchedThreads.length === 0 ? (
              <p className="text-xs text-[var(--kaspi-text-muted)] py-6 text-center">
                No matching conversations.
              </p>
            ) : (
              searchedThreads.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    selectThread(th);
                    setSearchModalOpen(false);
                  }}
                  className="w-full text-start px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-xs space-y-0.5 cursor-pointer"
                >
                  <p className="font-bold text-[var(--kaspi-text-primary)] truncate">{th.title}</p>
                  <p className="text-[11px] text-[var(--kaspi-text-muted)] truncate">
                    {th.messages[th.messages.length - 1]?.content || ""}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </KaspiGlassModalPortal>

      {/* Gmail Sign-In Modal via KaspiGlassModalPortal */}
      <KaspiGlassModalPortal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-md rounded-3xl kaspi-opaque-glass-modal p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeyukaLoopMark size="sm" variant="crimson" />
              <h3 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
                {t.signInGmail}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="p-1 rounded hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <HEYUKAGmailAccessCard
            locale={locale}
            compact
            onAuthenticated={async () => {
              setAuthModalOpen(false);
              await loadThreads();
              router.refresh();
            }}
          />
        </div>
      </KaspiGlassModalPortal>
    </div>
  );

  function renderComposer() {
    return (
      <div className="w-full rounded-3xl kaspi-glass-surface border border-[var(--kaspi-border)] p-3.5 space-y-3 focus-within:border-rose-500/50 transition-colors">
        {(attachedImage || audioNote) && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            {attachedImage && (
              <div className="relative inline-block">
                <img
                  src={attachedImage}
                  alt="Preview"
                  className="h-14 rounded-lg border border-rose-500/40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}
            {audioNote && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/35 text-[11px] text-rose-300">
                <Mic className="w-3 h-3" />
                <span>{audioNote}</span>
                <button
                  type="button"
                  onClick={() => setAudioNote(null)}
                  className="hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          rows={messages.length === 0 ? 2 : 1}
          placeholder={t.placeholder}
          className="w-full bg-transparent text-sm text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none resize-none max-h-40 px-1"
        />

        {/* Composer Bottom Controls (DeepThink, Search | Audio Mic, Attach, Send) */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDeepThink((p) => !p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                deepThink
                  ? "bg-rose-600/20 border-rose-500 text-rose-400"
                  : "kaspi-glass-surface border-[var(--kaspi-border)] text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>{t.deepThink}</span>
            </button>

            <button
              type="button"
              onClick={() => setWebSearch((p) => !p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                webSearch
                  ? "bg-rose-600/20 border-rose-500 text-rose-400"
                  : "kaspi-glass-surface border-[var(--kaspi-border)] text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.search}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Added Audio Voice/Recording Button requested by User */}
            <button
              type="button"
              onClick={handleToggleAudioMic}
              className={`p-2 rounded-full cursor-pointer transition-colors ${
                listening
                  ? "bg-rose-600 text-white animate-pulse"
                  : "hover:bg-white/10 text-[var(--kaspi-text-secondary)] hover:text-rose-400"
              }`}
              title={listening ? t.audioStop : t.audioStart}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-white/10 text-[var(--kaspi-text-secondary)] cursor-pointer"
              title="Attach image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={(!input.trim() && !attachedImage && !audioNote) || sending}
              onClick={() => void handleSend()}
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                input.trim() || attachedImage || audioNote
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-white/15 text-[var(--kaspi-text-muted)] cursor-not-allowed"
              }`}
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
