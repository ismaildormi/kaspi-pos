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
  Download,
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

const LOCAL_THREADS_KEY = "heyuka_guest_threads_v1";

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
    apiPlatform: string;
    desktopDownload: string;
    disclaimer: string;
    audioStart: string;
    audioStop: string;
  }
> = {
  ar: {
    newChat: "New chat",
    selectChats: "تحديد المحادثات",
    pinned: "مثبتة",
    today: "اليوم",
    last30: "آخر 30 يوم",
    greeting: "مرحباً! كيف أساعدك اليوم؟",
    placeholder: "Message HEYUKA",
    deepThink: "DeepThink",
    search: "Search",
    thinking: "جاري التفكير...",
    thoughtFor: "Thought for",
    searching: "جاري البحث على الويب...",
    share: "مشاركة",
    rename: "Rename",
    pin: "Pin",
    unpin: "Unpin",
    multiSelect: "Multi-select",
    del: "Delete",
    selectAll: "Select all",
    selectedTurns: "conversation turn(s) selected",
    cancel: "Cancel",
    createPublicLink: "Create public link",
    copiedLink: "تم نسخ الرابط العام بنجاح! من يفتحه يختار Gmail ويدخل لهذه المحادثة.",
    searchChatsPlaceholder: "Search chat content...",
    signInGmail: "Sign in (Gmail)",
    apiPlatform: "API Platform",
    desktopDownload: "Desktop (.zip)",
    disclaimer: "AI-generated, for reference only • HEYUKA by KASPI",
    audioStart: "Audio / Voice Input",
    audioStop: "Stop Audio",
  },
  fr: {
    newChat: "New chat",
    selectChats: "Select Chats",
    pinned: "Pinned",
    today: "Today",
    last30: "30 Days",
    greeting: "Bonjour ! Comment puis-je vous aider ?",
    placeholder: "Message HEYUKA",
    deepThink: "DeepThink",
    search: "Search",
    thinking: "Réflexion...",
    thoughtFor: "Thought for",
    searching: "Recherche sur le web...",
    share: "Partager",
    rename: "Rename",
    pin: "Pin",
    unpin: "Unpin",
    multiSelect: "Multi-select",
    del: "Delete",
    selectAll: "Select all",
    selectedTurns: "conversation turn(s) selected",
    cancel: "Cancel",
    createPublicLink: "Create public link",
    copiedLink: "Lien public copié ! Connexion Gmail directe dans cette discussion.",
    searchChatsPlaceholder: "Search chat content...",
    signInGmail: "Connexion Gmail",
    apiPlatform: "API Platform",
    desktopDownload: "Desktop (.zip)",
    disclaimer: "AI-generated, for reference only • HEYUKA by KASPI",
    audioStart: "Entrée Audio",
    audioStop: "Arrêter",
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
    searching: "Searching web...",
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
    copiedLink: "Public link copied! Anyone opening it selects Gmail and enters right into this chat.",
    searchChatsPlaceholder: "Search chat content...",
    signInGmail: "Sign in (Gmail)",
    apiPlatform: "API Platform",
    desktopDownload: "Desktop App",
    disclaimer: "AI-generated, for reference only",
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Composer State
  const [input, setInput] = useState("");
  const [deepThink, setDeepThink] = useState(true);
  const [webSearch, setWebSearch] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [audioNote, setAudioNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [sending, setSending] = useState(false);

  // Inline Edit (Screenshot 8)
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // Reactions & Audio Read-Aloud (Screenshot 9)
  const [collapsedThoughts, setCollapsedThoughts] = useState<Record<string, boolean>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down">>({});
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Share Turn Selection (Screenshots 11 & 12)
  const [shareSelectMode, setShareSelectMode] = useState(false);
  const [shareSelectedMsgIds, setShareSelectedMsgIds] = useState<string[]>([]);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareNoticeUrl, setShareNoticeUrl] = useState<string | null>(null);

  // Search Modal (Screenshot 14) & Gmail Sign-in Modal
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const saveGuestThreads = (next: ThreadItem[]) => {
    try {
      window.sessionStorage.setItem(LOCAL_THREADS_KEY, JSON.stringify(next.slice(0, 30)));
    } catch {}
  };

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/heyuka/chat-threads", { cache: "no-store" });
      const json = await res.json();
      setAuthenticated(Boolean(json?.authenticated));
      setUserEmail(json?.userEmail || null);
      if (json?.authenticated && Array.isArray(json?.threads)) {
        setThreads(json.threads);
        return;
      }
    } catch {}
    try {
      const raw = window.sessionStorage.getItem(LOCAL_THREADS_KEY);
      if (raw) setThreads(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  // Load shared conversation seamlessly via ?fromShare=sh_...
  useEffect(() => {
    const fromShare = searchParams?.get("fromShare");
    if (!fromShare) return;
    fetch(`/api/v1/heyuka/share?id=${encodeURIComponent(fromShare)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok && Array.isArray(d.share?.turns)) {
          setActiveThreadId(null);
          setMessages(
            d.share.turns.map((turn: any, idx: number) => ({
              id: turn.id || `shared_${idx}`,
              role: turn.role === "assistant" ? "assistant" : "user",
              content: String(turn.content || ""),
              reasoning: turn.reasoning,
              thinkingSec: turn.thinkingSec,
              sources: Array.isArray(turn.sources) ? turn.sources : undefined,
            }))
          );
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
    if (nextMsgs.length === 0) return currentId;
    const title = nextMsgs.find((m) => m.role === "user")?.content.slice(0, 64) || "New conversation";
    if (!authenticated) {
      const id = currentId || `local_${Date.now()}`;
      setThreads((prev) => {
        const idx = prev.findIndex((x) => x.id === id);
        const item: ThreadItem = {
          id,
          title,
          pinned: idx >= 0 ? prev[idx].pinned : false,
          updatedAt: new Date().toISOString(),
          messages: nextMsgs,
        };
        const updated = idx >= 0 ? prev.map((x) => (x.id === id ? item : x)) : [item, ...prev];
        saveGuestThreads(updated);
        return updated;
      });
      return id;
    }

    try {
      const res = await fetch("/api/v1/heyuka/chat-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(currentId && !currentId.startsWith("local_") ? { id: currentId } : {}),
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
        content: json?.answer || json?.error || "Unable to complete response cleanly.",
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
        { id: `err_${Date.now()}`, role: "assistant", content: "Connection interrupted. Please retry." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = async (assistantIndex: number) => {
    const priorHistory = messages.slice(0, assistantIndex);
    const lastUser = [...priorHistory].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    await handleSend(lastUser.content, priorHistory.slice(0, priorHistory.lastIndexOf(lastUser)));
  };

  const handleSaveInlineEdit = async (msgId: string) => {
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    const idx = messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;
    setEditingMsgId(null);
    setEditDraft("");
    await handleSend(trimmed, messages.slice(0, idx));
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
      audioFileRef.current?.click();
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (ev: any) => {
        const txt = Array.from(ev.results)
          .map((r: any) => r[0]?.transcript || "")
          .join(" ")
          .trim();
        if (txt) setInput(txt);
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
    utter.lang = /[\u0600-\u06FF]/.test(text) ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-US";
    utter.onend = () => setSpeakingMsgId(null);
    utter.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utter);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1500);
    } catch {}
  };

  const enterShareSelection = (preselectMsgId?: string) => {
    if (messages.length === 0) return;
    setShareSelectMode(true);
    setShareSelectedMsgIds(preselectMsgId ? [preselectMsgId] : messages.map((m) => m.id));
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
    if (!authenticated || th.id.startsWith("local_")) {
      setThreads((prev) => {
        const next =
          action === "delete"
            ? prev.filter((x) => x.id !== th.id)
            : prev.map((x) => (x.id === th.id ? { ...x, pinned: action === "pin" } : x));
        saveGuestThreads(next);
        return next;
      });
      if (action === "delete" && activeThreadId === th.id) startNewChat();
      return;
    }
    if (action === "delete") {
      await fetch(`/api/v1/heyuka/chat-threads?id=${encodeURIComponent(th.id)}`, { method: "DELETE" });
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
    if (!authenticated || id.startsWith("local_")) {
      setThreads((prev) => {
        const next = prev.map((x) => (x.id === id ? { ...x, title: trimmed } : x));
        saveGuestThreads(next);
        return next;
      });
      return;
    }
    await fetch("/api/v1/heyuka/chat-threads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", id, title: trimmed }),
    });
    await loadThreads();
  };

  const handleBulkAction = async (action: "bulk_pin" | "bulk_delete") => {
    if (selectedThreadIds.length === 0) return;
    if (!authenticated) {
      setThreads((prev) => {
        const next =
          action === "bulk_delete"
            ? prev.filter((x) => !selectedThreadIds.includes(x.id))
            : prev.map((x) => (selectedThreadIds.includes(x.id) ? { ...x, pinned: true } : x));
        saveGuestThreads(next);
        return next;
      });
    } else {
      await fetch("/api/v1/heyuka/chat-threads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: selectedThreadIds }),
      });
      await loadThreads();
    }
    if (action === "bulk_delete" && activeThreadId && selectedThreadIds.includes(activeThreadId)) {
      startNewChat();
    }
    setSelectedThreadIds([]);
    setSelectMode(false);
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
    return th.title.toLowerCase().includes(q) || th.messages.some((m) => m.content.toLowerCase().includes(q));
  });

  const renderThreadRow = (th: ThreadItem) => {
    const isSelectedBulk = selectedThreadIds.includes(th.id);
    const isActive = activeThreadId === th.id;
    const isMenuOpen = openMenuThreadId === th.id;

    return (
      <div
        key={th.id}
        className={`relative group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13px] cursor-pointer transition-colors ${
          isActive
            ? "bg-white/[0.10] text-white font-medium"
            : "text-zinc-300 hover:bg-white/[0.06]"
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
            className="flex-1 bg-white/10 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
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
            }`}
            aria-label="Thread menu"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        )}

        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute top-9 ${
              isRtl ? "left-1" : "right-1"
            } z-40 w-40 rounded-xl bg-[#25272D] border border-white/10 p-1.5 shadow-2xl space-y-0.5 text-xs text-zinc-200`}
          >
            <button
              type="button"
              onClick={() => void handleThreadAction("rename", th)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-start cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t.rename}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleThreadAction(th.pinned ? "unpin" : "pin", th)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-start cursor-pointer"
            >
              {th.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              <span>{th.pinned ? t.unpin : t.pin}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleThreadAction("share", th)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-start cursor-pointer"
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
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-start cursor-pointer"
            >
              <SquareCheck className="w-3.5 h-3.5" />
              <span>{t.multiSelect}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleThreadAction("delete", th)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 text-start cursor-pointer"
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
      className="h-screen flex overflow-hidden bg-[#15161A] text-zinc-100 selection:bg-rose-600 selection:text-white"
    >
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
          if (f) setAudioNote(`Audio: ${f.name}`);
        }}
      />

      {/* Exact Screenshot 5 & 15 Left Sidebar (`w-[260px]`, `#111215`) */}
      {sidebarOpen && (
        <aside
          className={`w-[260px] shrink-0 hidden md:flex flex-col justify-between bg-[#111215] border-white/[0.06] p-3 ${
            isRtl ? "border-l" : "border-r"
          }`}
        >
          {selectMode ? (
            /* Screenshot 15: Select Chats Mode */
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1 py-1">
                  <span className="text-base font-bold text-white">{t.selectChats}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectMode(false);
                      setSelectedThreadIds([]);
                    }}
                    className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[75vh] overflow-y-auto kaspi-no-scrollbar">
                  {threads.map(renderThreadRow)}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.07] grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => void handleBulkAction("bulk_pin")}
                  disabled={selectedThreadIds.length === 0}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] cursor-pointer disabled:opacity-40"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{t.pin}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulkAction("bulk_delete")}
                  disabled={selectedThreadIds.length === 0}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.06] text-rose-400 hover:bg-rose-500/20 cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.del}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 min-h-0 flex-1 flex flex-col">
                {/* Brand + Search + Collapse (exact Screenshot 5) */}
                <div className="flex items-center justify-between px-1 py-1">
                  <div className="flex items-center gap-2">
                    <HeyukaLoopMark size="sm" variant="crimson" />
                    <span className="text-[20px] font-bold tracking-tight text-white lowercase">
                      heyuka
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setSearchModalOpen(true)}
                      className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer"
                      title="Search chats"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer"
                      title="Collapse sidebar"
                    >
                      <PanelLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* New chat Pill Button (Screenshot 5) */}
                <button
                  type="button"
                  onClick={startNewChat}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#24262B] hover:bg-[#2E3037] text-[13px] font-medium text-white cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4 text-zinc-300" />
                  <span>{t.newChat}</span>
                </button>

                {/* Threads Groups */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 kaspi-no-scrollbar">
                  {pinnedThreads.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2.5 text-[11px] font-medium text-zinc-500">{t.pinned}</p>
                      {pinnedThreads.map(renderThreadRow)}
                    </div>
                  )}
                  {todayThreads.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2.5 text-[11px] font-medium text-zinc-500">{t.today}</p>
                      {todayThreads.map(renderThreadRow)}
                    </div>
                  )}
                  {olderThreads.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2.5 text-[11px] font-medium text-zinc-500">{t.last30}</p>
                      {olderThreads.map(renderThreadRow)}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom User Menu Bar matching Screenshot 5 (`ismail dormi  ...`) */}
              <div className="relative pt-2">
                {profileMenuOpen && (
                  <div className="absolute bottom-14 left-0 right-0 z-40 rounded-xl bg-[#25272D] border border-white/10 p-1.5 shadow-2xl space-y-0.5 text-xs">
                    <Link
                      href={`/${locale}/zebra-x`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-200"
                    >
                      <span>{t.apiPlatform}</span>
                    </Link>
                    <Link
                      href={`/${locale}/zebra-x/profile`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-200"
                    >
                      <span>Profile & Settings</span>
                    </Link>
                    <a
                      href="/api/v1/heyuka/installer?platform=desktop_zip"
                      download="HEYUKA-Desktop-App.zip"
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-200"
                    >
                      <span>{t.desktopDownload}</span>
                      <Download className="w-3.5 h-3.5 text-rose-400" />
                    </a>
                  </div>
                )}

                {authenticated ? (
                  <div className="flex items-center justify-between gap-2 px-2 py-2 rounded-xl hover:bg-white/[0.05]">
                    <Link
                      href={`/${locale}/zebra-x/profile`}
                      className="flex items-center gap-2.5 min-w-0 flex-1"
                    >
                      <div className="w-7 h-7 rounded-full bg-rose-600/25 border border-rose-500/40 flex items-center justify-center text-xs font-bold text-rose-400 uppercase shrink-0">
                        {(userEmail || "H").slice(0, 1)}
                      </div>
                      <span className="truncate text-[13px] font-medium text-zinc-200">
                        {userEmail?.split("@")[0] || "Developer"}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((p) => !p)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-xs font-medium text-zinc-200 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-rose-500" />
                      <span className="truncate">{t.signInGmail}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((p) => !p)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      )}

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Clean Minimal Top Header (Screenshot 7 / Screenshot 13 capsule when collapsed — NO theme/lang clutter!) */}
        <header className="px-4 py-3 flex items-center justify-between gap-3 shrink-0 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`${
                sidebarOpen ? "md:hidden flex" : "flex"
              } items-center gap-1.5`}
            >
              <HeyukaLoopMark size="sm" variant="crimson" className="mr-1" />
              <div className="inline-flex items-center rounded-full bg-[#24262B] border border-white/[0.08] px-1.5 py-1 gap-1">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((p) => !p)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 cursor-pointer"
                  title="Sidebar"
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(true)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 cursor-pointer"
                  title="Search"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={startNewChat}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 cursor-pointer"
                  title="New chat"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {messages.length > 0 && (
              <span className="text-sm font-medium text-zinc-200 truncate">
                {activeThreadTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => enterShareSelection()}
                className="p-2 rounded-lg hover:bg-white/10 text-zinc-300 cursor-pointer"
                title={t.share}
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Copied Public Link Banner */}
        {shareNoticeUrl && (
          <div className="mx-auto max-w-3xl px-4 w-full mb-2">
            <div className="rounded-xl bg-[#22242A] border border-rose-500/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 text-zinc-100 truncate">
                <Link2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{t.copiedLink}</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={shareNoticeUrl}
                  className="px-3 py-1 rounded-full bg-rose-600 text-white font-semibold text-[11px]"
                >
                  Open Link
                </Link>
                <button type="button" onClick={() => setShareNoticeUrl(null)} className="cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area OR Centered DeepSeek Greeting (Screenshot 5 & 13) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-[740px] mx-auto pb-14 space-y-6">
              <div className="flex items-center gap-3">
                <HeyukaLoopMark animated size="lg" variant="crimson" />
                <h1 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-white">
                  {t.greeting}
                </h1>
              </div>

              {renderComposer()}
            </div>
          ) : (
            <div className="max-w-[760px] mx-auto space-y-7 py-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const checked = shareSelectedMsgIds.includes(msg.id);
                const collapsed = Boolean(collapsedThoughts[msg.id]);

                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    {shareSelectMode && (
                      <input
                        type="checkbox"
                        checked={checked}
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
                          /* Exact Screenshot 8 Crimson/Focus Inline Edit Box */
                          <div className="w-full rounded-2xl bg-[#1E1F24] border-2 border-rose-500 p-3.5 space-y-3">
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              rows={2}
                              className="w-full bg-transparent text-sm text-zinc-100 focus:outline-none resize-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingMsgId(null)}
                                className="px-4 py-1.5 rounded-full bg-white/10 text-xs font-medium cursor-pointer"
                              >
                                {t.cancel}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleSaveInlineEdit(msg.id)}
                                className="px-4 py-1.5 rounded-full bg-[#DC2626] hover:bg-[#EF4444] text-white text-xs font-semibold cursor-pointer"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group max-w-[80%] space-y-1.5 flex flex-col items-end">
                            <div className="px-4 py-2.5 rounded-2xl bg-[#272930] text-sm text-zinc-100 whitespace-pre-wrap">
                              {msg.imagePreview && (
                                <img
                                  src={msg.imagePreview}
                                  alt="Attachment"
                                  className="max-h-40 rounded-lg mb-2 object-contain"
                                />
                              )}
                              {msg.content}
                            </div>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400">
                              <button
                                type="button"
                                onClick={() => void handleCopy(msg.id, msg.content)}
                                className="p-1 rounded hover:bg-white/10 cursor-pointer"
                              >
                                {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-rose-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMsgId(msg.id);
                                  setEditDraft(msg.content);
                                }}
                                className="p-1 rounded hover:bg-white/10 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="space-y-3">
                          {msg.reasoning && (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setCollapsedThoughts((p) => ({ ...p, [msg.id]: !p[msg.id] }))
                                }
                                className="inline-flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer"
                              >
                                <HeyukaLoopMark size="xs" variant="crimson" />
                                <span>
                                  {t.thoughtFor} {msg.thinkingSec || 2} seconds
                                </span>
                                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              {!collapsed && (
                                <div className="border-l-2 border-white/15 pl-3.5 text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] text-[11px] text-rose-400 hover:bg-white/10"
                                >
                                  <Globe className="w-3 h-3" />
                                  <span className="truncate max-w-[180px]">{src.title}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="text-[14px] text-zinc-100 leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>

                          {/* Exact Screenshot 9 Action Row */}
                          <div className="flex items-center gap-2 text-zinc-400 pt-1">
                            <button
                              type="button"
                              onClick={() => void handleCopy(msg.id, msg.content)}
                              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer"
                            >
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-rose-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRegenerate(idx)}
                              disabled={sending}
                              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFeedbackMap((p) => ({ ...p, [msg.id]: "up" }))}
                              className={`p-1.5 rounded-lg hover:bg-white/10 cursor-pointer ${
                                feedbackMap[msg.id] === "up" ? "text-rose-400" : "hover:text-white"
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFeedbackMap((p) => ({ ...p, [msg.id]: "down" }))}
                              className={`p-1.5 rounded-lg hover:bg-white/10 cursor-pointer ${
                                feedbackMap[msg.id] === "down" ? "text-rose-500" : "hover:text-white"
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSpeakMessage(msg.id, msg.content)}
                              className={`p-1.5 rounded-lg hover:bg-white/10 cursor-pointer ${
                                speakingMsgId === msg.id ? "text-rose-400" : "hover:text-white"
                              }`}
                              title="Speak aloud"
                            >
                              {speakingMsgId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => enterShareSelection(msg.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white cursor-pointer"
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

              {sending && (
                <div className="flex items-center gap-3 text-xs text-rose-400 font-medium py-2">
                  <HeyukaLoopMark animated size="sm" variant="crimson" />
                  <span>{webSearch ? t.searching : t.thinking}</span>
                </div>
              )}

              <div ref={bottomScrollRef} />
            </div>
          )}
        </div>

        {/* Bottom Dock (Share Select Bar OR Composer) */}
        {messages.length > 0 && (
          <div className="px-4 sm:px-6 pb-3 pt-1 shrink-0">
            <div className="max-w-[740px] mx-auto space-y-2">
              {shareSelectMode ? (
                /* Screenshots 11 & 12 Bottom Share Footer in Crimson Red */
                <div className="rounded-2xl bg-[#1F2025] border border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 font-medium text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSelectedMsgIds.length === messages.length && messages.length > 0}
                        onChange={(e) =>
                          setShareSelectedMsgIds(e.target.checked ? messages.map((m) => m.id) : [])
                        }
                        className="accent-rose-600 w-4 h-4 cursor-pointer"
                      />
                      <span>{t.selectAll}</span>
                    </label>
                    <span className="text-zinc-400">
                      {shareSelectedMsgIds.length} {t.selectedTurns}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShareSelectMode(false)}
                      className="px-4 py-2 rounded-full bg-white/10 text-zinc-200 font-medium cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      disabled={shareSelectedMsgIds.length === 0 || shareBusy}
                      onClick={() => void handleCreatePublicLink()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#DC2626] hover:bg-[#EF4444] text-white font-semibold cursor-pointer disabled:opacity-40"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>{shareBusy ? "..." : t.createPublicLink}</span>
                    </button>
                  </div>
                </div>
              ) : (
                renderComposer()
              )}

              <p className="text-center text-[11px] text-zinc-500">{t.disclaimer}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search Modal (Screenshot 14) */}
      <KaspiGlassModalPortal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} dir={isRtl ? "rtl" : "ltr"}>
        <div className="w-full max-w-xl rounded-2xl bg-[#25272D] border border-white/10 p-4 space-y-3 shadow-2xl">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchChatsPlaceholder}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <button type="button" onClick={() => setSearchModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {searchedThreads.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No matching chats.</p>
            ) : (
              searchedThreads.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    selectThread(th);
                    setSearchModalOpen(false);
                  }}
                  className="w-full text-start px-3 py-2.5 rounded-xl hover:bg-white/10 text-xs cursor-pointer"
                >
                  <p className="font-semibold text-zinc-100 truncate">{th.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {th.messages[th.messages.length - 1]?.content || ""}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </KaspiGlassModalPortal>

      {/* Gmail Sign-In Modal */}
      <KaspiGlassModalPortal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} dir={isRtl ? "rtl" : "ltr"}>
        <div className="w-full max-w-md rounded-2xl kaspi-opaque-glass-modal p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeyukaLoopMark size="sm" variant="crimson" />
              <h3 className="text-sm font-bold text-white">{t.signInGmail}</h3>
            </div>
            <button type="button" onClick={() => setAuthModalOpen(false)} className="cursor-pointer">
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
      <div className="w-full rounded-[24px] bg-[#22242A] border border-white/[0.08] px-4 py-3.5 space-y-3">
        {(attachedImage || audioNote) && (
          <div className="flex flex-wrap items-center gap-2">
            {attachedImage && (
              <div className="relative inline-block">
                <img src={attachedImage} alt="Preview" className="h-14 rounded-lg border border-rose-500/40 object-cover" />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}
            {audioNote && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 text-xs">
                <Mic className="w-3 h-3" />
                <span>{audioNote}</span>
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
          className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none max-h-40"
        />

        <div className="flex items-center justify-between gap-2">
          {/* Left: Exact DeepThink + Search Pills in Crimson Red (replacing Blue) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDeepThink((p) => !p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                deepThink
                  ? "bg-rose-500/15 border-rose-500/70 text-rose-400"
                  : "bg-white/[0.04] border-white/[0.12] text-zinc-300 hover:bg-white/[0.08]"
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>{t.deepThink}</span>
            </button>

            <button
              type="button"
              onClick={() => setWebSearch((p) => !p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                webSearch
                  ? "bg-rose-500/15 border-rose-500/70 text-rose-400"
                  : "bg-white/[0.04] border-white/[0.12] text-zinc-300 hover:bg-white/[0.08]"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.search}</span>
            </button>
          </div>

          {/* Right: Audio Mic + Attach + Crimson Send Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleAudioMic}
              className={`p-2 rounded-full cursor-pointer transition-colors ${
                listening ? "bg-rose-600 text-white animate-pulse" : "text-zinc-400 hover:text-rose-400 hover:bg-white/10"
              }`}
              title={listening ? t.audioStop : t.audioStart}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Attach"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={(!input.trim() && !attachedImage && !audioNote) || sending}
              onClick={() => void handleSend()}
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                input.trim() || attachedImage || audioNote
                  ? "bg-[#DC2626] hover:bg-[#EF4444] text-white"
                  : "bg-[#3A3D46] text-zinc-500 cursor-not-allowed"
              }`}
              aria-label="Send"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
