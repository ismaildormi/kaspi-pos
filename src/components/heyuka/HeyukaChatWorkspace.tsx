"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUp,
  Atom,
  AudioLines,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Download,
  Edit3,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Link2,
  Loader2,
  Mic,
  MicOff,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  SquareCheck,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { HeyukaLoopMark } from "./HeyukaLoopMark";
import { HEYUKAGmailAccessCard } from "./HEYUKAGmailAccessCard";
import { AntigravityStudioPane } from "./AntigravityStudioPane";
import {
  renderImageOnClientCpu,
  renderVideoOnClientCpu,
  speakTextReliably,
  synthesizeAudioWavOnClientCpu,
  type ClientMediaArtifact,
  type ClientMediaJobSpec,
  type ClientStudioFile,
} from "@/lib/heyuka/client-cpu-engine";

type ChatLocale = "ar" | "fr" | "en";

export type HeyukaComposerMode =
  | "auto"
  | "chat"
  | "deepthink"
  | "search"
  | "coding"
  | "image"
  | "video"
  | "audio"
  | "3d"
  | "security"
  | "qr"
  | "mobile";

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
  detectedMode?: string;
  autoSwitched?: boolean;
  studioFilesCount?: number;
  pollinationsUrl?: string;
  mediaArtifact?: ClientMediaArtifact;
  qrSvgDataUrl?: string;
}

interface ThreadItem {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
  messages: ChatMessageItem[];
}

const LOCAL_THREADS_KEY = "heyuka_guest_threads_v1";

const MODE_OPTIONS: Array<{
  id: HeyukaComposerMode;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "auto", label: "Auto (AI Smart Router)", hint: "AI switches mode automatically", icon: Sparkles },
  { id: "coding", label: "Coding Studio (Antigravity IDE)", hint: "Split files, preview & CPU runner", icon: Code2 },
  { id: "image", label: "Image Studio", hint: "Client GPU render + AI art", icon: ImageIcon },
  { id: "video", label: "Video Studio", hint: "30fps WebM on your CPU", icon: Video },
  { id: "audio", label: "Audio & Music", hint: "WebAudio WAV synthesizer", icon: AudioLines },
  { id: "3d", label: "3D & CAD Studio", hint: "Interactive WebGL viewport", icon: Box },
  { id: "security", label: "Security SAST & Mobile Lab", hint: "CWE scan & device diagnostics", icon: ShieldCheck },
  { id: "qr", label: "QR Architect", hint: "Styled SVG & dynamic QR", icon: QrCode },
  { id: "chat", label: "Standard Chat", hint: "Fast conversational reply", icon: Sparkles },
];

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
    messagingLink: string;
    desktopDownload: string;
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
    greeting: "مرحباً! بشنو نقدر نعاونك اليوم؟",
    placeholder: "اكتب لـ HEYUKA... (كود، فيديو، صورة، أوديو، بحث أو استشارة)",
    deepThink: "DeepThink",
    search: "Search",
    thinking: "جاري التحليل والتنفيذ...",
    thoughtFor: "Thought for",
    searching: "جاري البحث المباشر على الويب...",
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
    copiedLink: "تم نسخ الرابط العام! أي شخص يفتحه يختار Gmail ويكمل داخل نفس المحادثة.",
    searchChatsPlaceholder: "ابحث داخل المحادثات...",
    signInGmail: "Sign in (Gmail)",
    apiPlatform: "API Platform",
    messagingLink: "المراسلات والدعم (Feedback)",
    desktopDownload: "Desktop App (.zip)",
    disclaimer: "AI-generated, for reference only • 100% Client CPU & Zero-Cost $0.00",
    audioStart: "تسجيل صوتي / Audio Mic",
    audioStop: "إيقاف التسجيل",
  },
  fr: {
    newChat: "New chat",
    selectChats: "Select Chats",
    pinned: "Pinned",
    today: "Today",
    last30: "30 Days",
    greeting: "Bonjour ! Que voulez-vous créer aujourd'hui ?",
    placeholder: "Message HEYUKA (code, vidéo, image, audio, recherche...)",
    deepThink: "DeepThink",
    search: "Search",
    thinking: "Réflexion & exécution...",
    thoughtFor: "Thought for",
    searching: "Recherche web en direct...",
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
    messagingLink: "Messagerie & Support",
    desktopDownload: "Desktop (.zip)",
    disclaimer: "AI-generated, for reference only • CPU Client 100% ($0.00)",
    audioStart: "Entrée Audio",
    audioStop: "Arrêter Audio",
  },
  en: {
    newChat: "New chat",
    selectChats: "Select Chats",
    pinned: "Pinned",
    today: "Today",
    last30: "30 Days",
    greeting: "Hi! What's on your mind today?",
    placeholder: "Message HEYUKA — code apps, images, videos, audio, search...",
    deepThink: "DeepThink",
    search: "Search",
    thinking: "Thinking & routing tools...",
    thoughtFor: "Thought for",
    searching: "Searching live web & APIs...",
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
    messagingLink: "Help & Messaging",
    desktopDownload: "Desktop App",
    disclaimer: "AI-generated, for reference only • Runs on Your Hardware ($0.00)",
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

  // Unified Composer Mode Box State
  const [input, setInput] = useState("");
  const [selectedMode, setSelectedMode] = useState<HeyukaComposerMode>("auto");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [deepThink, setDeepThink] = useState(true);
  const [webSearch, setWebSearch] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [audioNote, setAudioNote] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioStatusHint, setAudioStatusHint] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [sending, setSending] = useState(false);

  // Antigravity Split Studio State
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioFiles, setStudioFiles] = useState<ClientStudioFile[]>([]);
  const [mediaArtifacts, setMediaArtifacts] = useState<ClientMediaArtifact[]>([]);
  const [activePollinationsUrl, setActivePollinationsUrl] = useState<string | null>(null);
  const [videoProgressPct, setVideoProgressPct] = useState<number | null>(null);
  const [isRenderingMedia, setIsRenderingMedia] = useState(false);

  // Inline Edit
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // Reactions & Audio Read-Aloud
  const [collapsedThoughts, setCollapsedThoughts] = useState<Record<string, boolean>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down">>({});
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Share Turn Selection
  const [shareSelectMode, setShareSelectMode] = useState(false);
  const [shareSelectedMsgIds, setShareSelectedMsgIds] = useState<string[]>([]);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareNoticeUrl, setShareNoticeUrl] = useState<string | null>(null);

  // Search Modal & Gmail Sign-in Modal
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const stopSpeechRef = useRef<(() => void) | null>(null);

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

  const activeModeMeta = useMemo(
    () => MODE_OPTIONS.find((m) => m.id === selectedMode) || MODE_OPTIONS[0],
    [selectedMode]
  );

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

  const runClientCpuJob = async (
    job: ClientMediaJobSpec,
    assistantId: string
  ): Promise<void> => {
    setIsRenderingMedia(true);
    setVideoProgressPct(job.kind === "video" ? 0 : null);
    if (job.pollinationsUrl) setActivePollinationsUrl(job.pollinationsUrl);

    try {
      let artifact: ClientMediaArtifact | null = null;
      if (job.kind === "video") {
        artifact = await renderVideoOnClientCpu(job, (pct) => setVideoProgressPct(pct));
      } else if (job.kind === "image") {
        artifact = await renderImageOnClientCpu(job);
      } else if (job.kind === "audio") {
        artifact = synthesizeAudioWavOnClientCpu({
          title: job.title,
          prompt: job.prompt,
          bpm: job.bpm,
          durationSec: job.durationSec,
        });
      } else if (job.kind === "3d") {
        artifact = {
          kind: "3d",
          title: job.title,
          objectUrl: "",
          mimeType: "model/gltf-binary",
          filename: "heyuka-scene.glb",
          durationMs: 12,
          cpuCoresUsed: navigator.hardwareConcurrency || 4,
          bytes: 2048,
        };
      }

      if (artifact) {
        setMediaArtifacts((prev) => [...prev, artifact!]);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, mediaArtifact: artifact! } : m))
        );
      }
    } catch (err: any) {
      setAudioStatusHint(err?.message || "Local CPU media render notice.");
    } finally {
      setIsRenderingMedia(false);
      setVideoProgressPct(null);
    }
  };

  const handleSend = async (overrideText?: string, baseHistory?: ChatMessageItem[]) => {
    const textToSend = (overrideText ?? input).trim();
    if ((!textToSend && !attachedImage && !audioNote) || sending) return;

    const historyToUse = baseHistory ?? messages;
    const userMsg: ChatMessageItem = {
      id: `u_${Date.now()}`,
      role: "user",
      content: textToSend || (audioNote ? `[Voice Note] ${audioNote}` : "Analyze the attached image."),
      imagePreview: attachedImage || undefined,
    };

    const optimisticMsgs = [...historyToUse, userMsg];
    setMessages(optimisticMsgs);
    if (!overrideText) {
      setInput("");
      setAttachedImage(null);
      setAudioNote(null);
      setRecordedAudioUrl(null);
    }
    setModeMenuOpen(false);
    setSending(true);
    setShareNoticeUrl(null);
    setAudioStatusHint(null);

    try {
      const res = await fetch("/api/v1/heyuka/chat-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: attachedImage ? "heyuka-vision" : deepThink ? "heyuka-omni" : "heyuka-core",
          mode: selectedMode,
          deepThink,
          webSearch,
          locale,
          imageBase64: attachedImage || undefined,
          audioTranscriptNote: audioNote || undefined,
          workspaceFiles:
            studioFiles.length > 0
              ? studioFiles.slice(0, 6).map((f) => ({ path: f.path, content: f.content }))
              : undefined,
          messages: optimisticMsgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();

      if (Array.isArray(json?.studioFiles) && json.studioFiles.length > 0) {
        setStudioFiles(json.studioFiles);
      }
      if (json?.openStudio) {
        setStudioOpen(true);
        if (typeof window !== "undefined" && window.innerWidth < 1280) {
          setSidebarOpen(false);
        }
      }

      const job: ClientMediaJobSpec | undefined = json?.clientMediaJob;
      const qrDataUrl =
        job?.svgMarkup && typeof job.svgMarkup === "string"
          ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(job.svgMarkup)}`
          : undefined;

      const assistantId = `a_${Date.now()}`;
      const assistantMsg: ChatMessageItem = {
        id: assistantId,
        role: "assistant",
        content: json?.answer || json?.error || "Unable to complete response cleanly.",
        reasoning: json?.reasoning,
        thinkingSec: json?.thinkingSec,
        sources: Array.isArray(json?.sources) ? json.sources : undefined,
        detectedMode: json?.effectiveMode,
        autoSwitched: Boolean(json?.autoSwitched),
        studioFilesCount: Array.isArray(json?.studioFiles) ? json.studioFiles.length : undefined,
        pollinationsUrl: job?.pollinationsUrl,
        qrSvgDataUrl: qrDataUrl,
      };

      const finalMsgs = [...optimisticMsgs, assistantMsg];
      setMessages(finalMsgs);

      if (job && job.kind !== "code" && job.kind !== "qr") {
        void runClientCpuJob(job, assistantId);
      }

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

  const stopAllMicCapture = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {}
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((tr) => tr.stop());
      micStreamRef.current = null;
    }
    setListening(false);
  };

  const handleToggleAudioMic = async () => {
    setAudioStatusHint(null);
    if (listening) {
      stopAllMicCapture();
      return;
    }

    const w = window as any;
    const SpeechRec =
      typeof window !== "undefined" ? w.SpeechRecognition || w.webkitSpeechRecognition : null;

    let startedAnything = false;

    // 1) Real Microphone Capture (MediaRecorder) so voice clip always records even without STT
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const rec = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        rec.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunks.push(ev.data);
        };
        rec.onstop = () => {
          if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
            setRecordedAudioUrl(URL.createObjectURL(blob));
            setAudioNote((prev) => prev || `Voice clip (${Math.max(1, Math.round(blob.size / 1024))} KB)`);
          }
          stream.getTracks().forEach((tr) => tr.stop());
          micStreamRef.current = null;
        };
        mediaRecorderRef.current = rec;
        rec.start();
        startedAnything = true;
      } catch {
        setAudioStatusHint(
          locale === "ar"
            ? "يرجى السماح بالمايكروفون في المتصفح أو إرفاق ملف صوتي."
            : "Microphone permission blocked by browser. Allow mic access to record voice."
        );
      }
    }

    // 2) Live Speech-to-Text Transcript alongside recording
    if (SpeechRec) {
      try {
        const speech = new SpeechRec();
        speech.lang = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-US";
        speech.interimResults = true;
        speech.continuous = false;
        speech.onresult = (ev: any) => {
          const txt = Array.from(ev.results)
            .map((r: any) => r[0]?.transcript || "")
            .join(" ")
            .trim();
          if (txt) {
            setInput(txt);
            setAudioNote(`Voice transcript: ${txt.slice(0, 120)}`);
          }
        };
        speech.onend = () => {
          setListening(false);
        };
        speech.onerror = () => {
          // Keep MediaRecorder active if mic stream succeeded
        };
        recognitionRef.current = speech;
        speech.start();
        startedAnything = true;
      } catch {}
    }

    if (startedAnything) {
      setListening(true);
    }
  };

  const handleSpeakMessage = (msgId: string, text: string) => {
    setAudioStatusHint(null);
    if (speakingMsgId === msgId) {
      stopSpeechRef.current?.();
      stopSpeechRef.current = null;
      setSpeakingMsgId(null);
      return;
    }
    stopSpeechRef.current?.();
    stopSpeechRef.current = speakTextReliably({
      text,
      locale,
      onStart: () => setSpeakingMsgId(msgId),
      onEnd: () => setSpeakingMsgId(null),
      onError: (reason) => {
        setSpeakingMsgId(null);
        setAudioStatusHint(`Audio notice: ${reason}`);
      },
    });
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
        setShareNoticeUrl(json.path || json.shareUrl);
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
    setStudioOpen(false);
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
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              isSelectedBulk ? "bg-rose-600 border-rose-600 text-white" : "border-zinc-500"
            }`}
          >
            {isSelectedBulk && <Check className="w-2.5 h-2.5" />}
          </span>
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

      {/* Left Sidebar (`w-[250px]`, DeepSeek dark obsidian `#111215`) */}
      {sidebarOpen && (
        <aside
          className={`w-[250px] shrink-0 hidden md:flex flex-col justify-between bg-[#111215] border-white/[0.06] p-3 ${
            isRtl ? "border-l" : "border-r"
          }`}
        >
          {selectMode ? (
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

                <button
                  type="button"
                  onClick={startNewChat}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#24262B] hover:bg-[#2E3037] text-[13px] font-medium text-white cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4 text-zinc-300" />
                  <span>{t.newChat}</span>
                </button>

                <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 kaspi-no-scrollbar">
                  {pinnedThreads.length > 0 && (
                    <div className="space-y-1 pb-2 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between px-2.5">
                        <p className="text-[11px] font-medium text-zinc-500">{t.pinned}</p>
                        <button
                          type="button"
                          onClick={() => setSelectMode(true)}
                          className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          title={t.selectChats}
                        >
                          <SquareCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                      href={`/${locale}/zebra-x/contact`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-200"
                    >
                      <span>{t.messagingLink}</span>
                      <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
                    </Link>
                    <Link
                      href={`/${locale}/zebra-x/profile`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-200"
                    >
                      <span>Profile &amp; Settings</span>
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

      {/* Middle Chat Rail + Smooth Antigravity Split Stage */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0 min-h-0">
        {/* Chat Column (Automatically glides smoothly to left when Antigravity Studio opens!) */}
        <div
          className={`flex flex-col min-w-0 min-h-0 relative transition-all duration-200 ${
            studioOpen
              ? "w-full h-[46%] lg:h-full lg:w-[44%] border-b lg:border-b-0 lg:border-r border-white/[0.07]"
              : "flex-1 h-full"
          }`}
        >
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

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const next = !studioOpen;
                  setStudioOpen(next);
                  if (next) setSelectedMode((m) => (m === "auto" ? "coding" : m));
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                  studioOpen
                    ? "bg-rose-500/15 border-rose-500/60 text-rose-400"
                    : "bg-[#24262B] border-white/[0.08] text-zinc-300 hover:text-white"
                }`}
                title="Toggle Antigravity Coding & Media Studio"
              >
                <PanelRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Studio</span>
              </button>

              <Link
                href={`/${locale}/zebra-x/contact`}
                className="p-2 rounded-lg hover:bg-white/10 text-zinc-300"
                title={t.messagingLink}
              >
                <HelpCircle className="w-4 h-4" />
              </Link>

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

          {audioStatusHint && (
            <div className="mx-auto max-w-3xl px-4 w-full mb-2">
              <div className="rounded-xl bg-[#22242A] border border-rose-500/35 px-3.5 py-2 flex items-center justify-between gap-2 text-xs text-rose-300">
                <span>{audioStatusHint}</span>
                <button type="button" onClick={() => setAudioStatusHint(null)} className="cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center max-w-[720px] mx-auto pb-12 space-y-6">
                <div className="flex items-center gap-3">
                  <HeyukaLoopMark animated size="lg" variant="crimson" />
                  <h1 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-white">
                    {t.greeting}
                  </h1>
                </div>

                {renderComposer()}
              </div>
            ) : (
              <div className="max-w-[740px] mx-auto space-y-7 py-4">
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
                            <div className="group max-w-[82%] space-y-1.5 flex flex-col items-end">
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
                            {msg.detectedMode && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/12 border border-rose-500/30 text-[11px] font-medium text-rose-300">
                                <Cpu className="w-3 h-3" />
                                <span>
                                  {msg.autoSwitched ? "Auto AI -> " : ""}
                                  {msg.detectedMode.toUpperCase()}
                                  {msg.studioFilesCount ? ` (${msg.studioFilesCount} studio files)` : ""}
                                </span>
                              </div>
                            )}

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

                            {/* Inline Rendered Client-CPU Media Outputs */}
                            {msg.qrSvgDataUrl && (
                              <div className="rounded-xl bg-white p-3 inline-block">
                                <img src={msg.qrSvgDataUrl} alt="HEYUKA QR Code" className="w-40 h-40" />
                              </div>
                            )}

                            {msg.mediaArtifact && (
                              <div className="rounded-2xl bg-[#1D1E24] border border-white/[0.08] p-3.5 space-y-2 max-w-md">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="font-semibold text-white truncate">
                                    {msg.mediaArtifact.title}
                                  </span>
                                  {msg.mediaArtifact.objectUrl && (
                                    <a
                                      href={msg.mediaArtifact.objectUrl}
                                      download={msg.mediaArtifact.filename}
                                      className="text-rose-400 font-semibold hover:underline shrink-0"
                                    >
                                      Download
                                    </a>
                                  )}
                                </div>
                                {msg.mediaArtifact.kind === "video" && (
                                  <video
                                    controls
                                    loop
                                    muted
                                    playsInline
                                    src={msg.mediaArtifact.objectUrl}
                                    className="w-full rounded-lg bg-black"
                                  />
                                )}
                                {msg.mediaArtifact.kind === "image" && (
                                  <img
                                    src={msg.mediaArtifact.objectUrl}
                                    alt={msg.mediaArtifact.title}
                                    className="w-full rounded-lg"
                                  />
                                )}
                                {msg.mediaArtifact.kind === "audio" && (
                                  <audio controls src={msg.mediaArtifact.objectUrl} className="w-full" />
                                )}
                                <p className="text-[10px] font-mono text-zinc-400">
                                  Executed on Your CPU ({msg.mediaArtifact.cpuCoresUsed} cores • {msg.mediaArtifact.durationMs}ms • $0 Server)
                                </p>
                              </div>
                            )}

                            {(msg.studioFilesCount || msg.mediaArtifact) && !studioOpen && (
                              <button
                                type="button"
                                onClick={() => setStudioOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600/20 border border-rose-500/40 text-xs font-semibold text-rose-300 hover:bg-rose-600/30 cursor-pointer"
                              >
                                <PanelRight className="w-3.5 h-3.5" />
                                <span>Open in Antigravity Studio →</span>
                              </button>
                            )}

                            {/* Action Icons Row */}
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
                                  speakingMsgId === msg.id ? "text-rose-400 animate-pulse" : "hover:text-white"
                                }`}
                                title="Read aloud (TTS Audio)"
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

          {messages.length > 0 && (
            <div className="px-4 sm:px-6 pb-3 pt-1 shrink-0">
              <div className="max-w-[720px] mx-auto space-y-2">
                {shareSelectMode ? (
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

        {/* Right Antigravity Split-Pane IDE Stage */}
        {studioOpen && (
          <div className="w-full h-[54%] lg:h-full lg:w-[56%] flex-1 min-w-0 min-h-0 bg-[#111215]">
            <AntigravityStudioPane
              files={studioFiles}
              onChangeFiles={setStudioFiles}
              mediaArtifacts={mediaArtifacts}
              activePollinationsUrl={activePollinationsUrl}
              videoProgressPct={videoProgressPct}
              isRenderingMedia={isRenderingMedia}
              onClose={() => setStudioOpen(false)}
              locale={locale}
            />
          </div>
        )}
      </div>

      {/* Search Modal */}
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
    const ActiveModeIcon = activeModeMeta.icon;

    return (
      <div className="relative w-full rounded-[24px] bg-[#22242A] border border-white/[0.08] px-4 py-3.5 space-y-3">
        {(attachedImage || audioNote || recordedAudioUrl) && (
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
            {recordedAudioUrl && (
              <audio controls src={recordedAudioUrl} className="h-8 max-w-[220px]" />
            )}
            {audioNote && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 text-xs">
                <Mic className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{audioNote}</span>
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
          {/* Left: Single Unified Mode & DeepThink/Search Selector Pill */}
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModeMenuOpen((p) => !p)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                selectedMode !== "auto" || deepThink || webSearch
                  ? "bg-rose-500/15 border-rose-500/60 text-rose-300"
                  : "bg-white/[0.04] border-white/[0.12] text-zinc-200 hover:bg-white/[0.08]"
              }`}
            >
              <ActiveModeIcon className="w-3.5 h-3.5 text-rose-400" />
              <span>{activeModeMeta.label}</span>
              {deepThink && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-[10px] font-bold">
                  +DeepThink
                </span>
              )}
              {webSearch && (
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold">
                  +Search
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {modeMenuOpen && (
              <div
                className={`absolute bottom-11 ${
                  isRtl ? "right-0" : "left-0"
                } z-50 w-72 sm:w-80 rounded-2xl bg-[#1D1F25] border border-white/10 p-2.5 shadow-2xl space-y-2`}
              >
                {/* Toggles inside unified dropdown: DeepThink + Search */}
                <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setDeepThink((p) => !p)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      deepThink
                        ? "bg-rose-500/20 border-rose-500 text-rose-300"
                        : "bg-white/[0.04] border-white/10 text-zinc-400"
                    }`}
                  >
                    <Atom className="w-3.5 h-3.5" />
                    <span>{t.deepThink}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebSearch((p) => !p)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      webSearch
                        ? "bg-rose-500/20 border-rose-500 text-rose-300"
                        : "bg-white/[0.04] border-white/10 text-zinc-400"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{t.search}</span>
                  </button>
                </div>

                {/* Creation / Studio Mode List */}
                <div className="max-h-64 overflow-y-auto space-y-0.5 kaspi-no-scrollbar">
                  {MODE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = selectedMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedMode(opt.id);
                          setModeMenuOpen(false);
                          if (
                            opt.id === "coding" ||
                            opt.id === "image" ||
                            opt.id === "video" ||
                            opt.id === "audio" ||
                            opt.id === "3d" ||
                            opt.id === "qr"
                          ) {
                            setStudioOpen(true);
                          }
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-start text-xs cursor-pointer transition-colors ${
                          active
                            ? "bg-rose-500/20 text-white font-semibold"
                            : "text-zinc-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? "text-rose-400" : "text-zinc-400"}`} />
                          <div className="min-w-0">
                            <p className="truncate">{opt.label}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{opt.hint}</p>
                          </div>
                        </div>
                        {active && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Dual-Engine Mic + Attach + Crimson Send Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleToggleAudioMic()}
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
              title="Attach image"
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
