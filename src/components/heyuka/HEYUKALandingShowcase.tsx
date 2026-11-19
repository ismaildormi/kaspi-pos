"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  KeyRound,
  Layers,
  Lock,
  Monitor,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react";
import {
  HEYUKA_CHARACTER_PROFILES,
  HEYUKA_LIGHTING_PRESETS,
  type HeyukaCharacterCategory,
} from "@/lib/heyuka/heyuka-universe";
import { HEYUKAInstallWalkthrough } from "./HEYUKAInstallWalkthrough";

const HEYUKACreatureCanvas = dynamic(() => import("./HEYUKACreatureCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] sm:h-[440px] rounded-2xl border border-white/10 bg-slate-950/60 flex items-center justify-center text-xs font-mono text-zinc-400">
      Loading Authentic 3D Character Engine...
    </div>
  ),
});

interface StoryChapter {
  id: string;
  badge: string;
  titleAr: string;
  titleFr: string;
  titleEn: string;
  descAr: string;
  descFr: string;
  descEn: string;
  highlights: string[];
  accentClass: string;
}

const ANIMATED_STORY_CHAPTERS: readonly StoryChapter[] = [
  {
    id: "companion-presence",
    badge: "01 • Desktop Companion",
    titleAr: "رفيق ذكي ثلاثي الأبعاد حي على سطح المكتب",
    titleFr: "Compagnon 3D Interactif sur Bureau",
    titleEn: "Interactive 3D Desktop Companion",
    descAr:
      "تجربة بصرية حية بتفاعل فوري في 60 إطاراً في الثانية ترافقك في عملك اليومي على ويندوز وماك ولينكس وتساعدك بأوامر واضحة وتأكيد فوري لأي إجراء مهم.",
    descFr:
      "Un compagnon 3D temps réel à 60 FPS sur Windows, macOS et Linux qui vous accompagne au quotidien avec une validation explicite sur chaque action critique.",
    descEn:
      "A fluid 60 FPS 3D visual presence built for Windows, macOS, and Linux that collaborates beside you with user-confirmed assistive actions.",
    highlights: ["60 FPS Volumetric Characters", "User-Confirmed Workflows", "32 Unique Styles"],
    accentClass: "from-emerald-500/20 via-teal-500/10 to-transparent",
  },
  {
    id: "sovereign-reasoning",
    badge: "02 • Flagship Intelligence",
    titleAr: "عقل استراتيجي متعدد اللغات للبرمجة والتحليل",
    titleFr: "Intelligence Stratégique & Multilingue",
    titleEn: "Multilingual Reasoning & Code Intelligence",
    descAr:
      "يفهم العربية والدارجة المغربية والريفية والفرنسية والإنجليزية بطلاقة تامة، مع قدرات عميقة في هندسة البرمجيات والرياضيات والتخطيط التجاري.",
    descFr:
      "Maîtrise native de l'arabe, du darija, du tarifit, du français et de l'anglais, conçue pour le génie logiciel, l'analyse financière et la stratégie.",
    descEn:
      "Deep native fluency across Arabic, Moroccan Darija, Tarifit, French, and English — engineered for complex software engineering, math, and strategy.",
    highlights: ["128K Context Ready", "Native Darija / AR / FR / EN", "Tool Orchestration"],
    accentClass: "from-amber-500/20 via-orange-500/10 to-transparent",
  },
  {
    id: "creative-multimodal",
    badge: "03 • Vision, 3D & Audio",
    titleAr: "استوديو إبداعي متكامل للصور و3D والصوتيات",
    titleFr: "Studio Multimodal Vision, 3D & Audio",
    titleEn: "Unified Vision, 3D & Audio Studio",
    descAr:
      "توليد الصور الاحترافية، تفريغ الخلفيات بدقة عالية، تجهيز المشاهد ثلاثية الأبعاد، وتحويل الصوت والفيديو إلى نصوص منسقة من واجهة واحدة.",
    descFr:
      "Génération d'images studio, détourage transparent haute précision, scènes 3D et transcription audio/vidéo multilingue depuis une interface unifiée.",
    descEn:
      "Create studio artwork, crisp transparent cutouts, interactive 3D scenes, and clean multilingual audio transcripts through a single unified API.",
    highlights: ["Studio Images & Cutouts", "3D Scene Pipelines", "Multilingual Speech"],
    accentClass: "from-purple-500/20 via-fuchsia-500/10 to-transparent",
  },
  {
    id: "live-knowledge",
    badge: "04 • Real-Time Knowledge",
    titleAr: "معلومات عالمية حية وبيانات موثوقة لحظة بلحظة",
    titleFr: "Connaissances Temps Réel & Sécurité",
    titleEn: "Real-Time Verified Knowledge & Feeds",
    descAr:
      "اتصال مباشر ومجاني ببيانات الأسعار العالمية، الطقس، الأبحاث العلمية، ونشرات اليقظة السيبرانية دون أي تعقيد أو إعدادات إضافية من المستخدم.",
    descFr:
      "Accès direct aux taux financiers, données météo, publications scientifiques et veilles cybersécurité en direct, prêt à l'emploi sans configuration.",
    descEn:
      "Direct access to live market rates, weather telemetry, scientific papers, and security advisories out of the box with zero extra third-party setup.",
    highlights: ["Live Economic & FX Data", "Academic Research", "Cyber Advisories"],
    accentClass: "from-sky-500/20 via-cyan-500/10 to-transparent",
  },
  {
    id: "enterprise-privacy",
    badge: "05 • Privacy & Sovereign Trust",
    titleAr: "أمان وعزل تام للمفاتيح والبيانات بإدارة KASPI",
    titleFr: "Sécurité Souveraine & Confidentialité KASPI",
    titleEn: "Enterprise Privacy & Key Isolation",
    descAr:
      "بنية معزولة تحفظ خصوصية كل مستخدم ومطور، بمفاتيح API فريدة ومشفرة وإمكانية تدوير الصلاحيات أو إلغائها في أي لحظة.",
    descFr:
      "Architecture isolée par espace client : clés API cryptographiques uniques, contrôle de portée et révocation instantanée sous gouvernance KASPI.",
    descEn:
      "Strict workspace isolation backed by cryptographically unique hashed API keys, granular scopes, and instant rotation governed by KASPI.",
    highlights: ["Unique Per-App Keys", "SHA-256 Secret Hashing", "OpenAI SDK Standard"],
    accentClass: "from-emerald-400/20 via-lime-500/10 to-transparent",
  },
];

export function HEYUKALandingShowcase() {
  const localeRaw = useLocale();
  const locale: "ar" | "fr" | "en" =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const isAr = locale === "ar";

  const [selectedCharId, setSelectedCharId] = useState<string>("classic_heyuka");
  const [activeCategory, setActiveCategory] = useState<"all" | HeyukaCharacterCategory>("all");
  const [selectedLightingId, setSelectedLightingId] = useState<string>("studio");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [boopCount, setBoopCount] = useState(0);

  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storiesAutoPlay, setStoriesAutoPlay] = useState(true);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  // Instant Real HEYUKA API Key & Key ID Studio
  const [authenticated, setAuthenticated] = useState(false);
  const [issuedKeys, setIssuedKeys] = useState<
    Array<{ id: string; label: string; prefix: string; last4: string; usageCount?: number; createdAt: string }>
  >([]);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [generatedKeyOnce, setGeneratedKeyOnce] = useState<string | null>(null);
  const [generatedKeyId, setGeneratedKeyId] = useState<string | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadAccountKeys = () => {
    fetch("/api/v1/zebra-x/keys", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setAuthenticated(Boolean(d.authenticated));
        if (Array.isArray(d.keys)) setIssuedKeys(d.keys);
      })
      .catch(() => {});
  };

  const activeCharacter = useMemo(
    () =>
      HEYUKA_CHARACTER_PROFILES.find((c) => c.id === selectedCharId) ||
      HEYUKA_CHARACTER_PROFILES[0],
    [selectedCharId]
  );

  const activeLighting = useMemo(
    () =>
      HEYUKA_LIGHTING_PRESETS.find((l) => l.id === selectedLightingId) ||
      HEYUKA_LIGHTING_PRESETS[0],
    [selectedLightingId]
  );

  const filteredCharacters = useMemo(() => {
    if (activeCategory === "all") return HEYUKA_CHARACTER_PROFILES;
    return HEYUKA_CHARACTER_PROFILES.filter((c) => c.category === activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    loadAccountKeys();
  }, []);

  useEffect(() => {
    if (!storiesAutoPlay) return;
    const timer = setInterval(() => {
      setActiveStoryIndex((prev) => (prev + 1) % ANIMATED_STORY_CHAPTERS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [storiesAutoPlay]);

  const handleCopy = async (id: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {}
  };

  const handleCreateQuickKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setKeyBusy(true);
    try {
      const res = await fetch("/api/v1/zebra-x/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newKeyLabel.trim() || `HEYUKA App Key #${issuedKeys.length + 1}`,
          tokenPrefix: "hk-live",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setGeneratedKeyOnce(json.secretKeyOnce);
        setGeneratedKeyId(json.keyId || json.key?.id || null);
        setNewKeyLabel("");
        loadAccountKeys();
      } else {
        setKeyError(json?.error || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      setKeyError(err?.message || "Network error");
    } finally {
      setKeyBusy(false);
    }
  };

  const currentStory = ANIMATED_STORY_CHAPTERS[activeStoryIndex];
  const quickstartCode = `import OpenAI from "openai";

const heyuka = new OpenAI({
  apiKey: "${generatedKeyOnce || "hk-live-YOUR_UNIQUE_API_KEY"}",
  baseURL: "https://kaspi-pos.vercel.app/api/v1",
  defaultHeaders: {
    "X-API-Key-Id": "${generatedKeyId || "hk_YOUR_UNIQUE_KEY_ID"}",
  },
});

const completion = await heyuka.chat.completions.create({
  model: "heyuka-omni",
  messages: [
    { role: "user", content: "Prepare an executive launch plan for our new store." },
  ],
});
console.log(completion.choices[0].message.content);`;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-14"
    >
      {/* Cinematic Official Flagship Hero (OpenAI / DeepSeek Product Launch Style) */}
      <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-xs font-bold text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HEYUKA • Owned &amp; Engineered by KASPI</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono text-zinc-300">
                Desktop App • 32 Interactive Characters • Sovereign API
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.07] border border-white/15 flex items-center justify-center shrink-0">
                <img src="/logo-mark.png" alt="KASPI HEYUKA" className="w-8 h-8 object-contain" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                {isAr
                  ? "تعرّف على HEYUKA — رفيقك الذكي من KASPI"
                  : locale === "fr"
                  ? "Découvrez HEYUKA — Intelligence Souveraine par KASPI"
                  : "Meet HEYUKA — Flagship Desktop & API Intelligence by KASPI"}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isAr
                ? "نموذج ذكاء اصطناعي متكامل وتطبيق تفاعلي ثلاثي الأبعاد يجمع بين التفكير العميق، البرمجة، الصور، 3D، والصوتيات بطلاقة عربية ودارجة وعالمية، مع مفاتيح API حقيقية ومستقلة للمطورين والشركات."
                : locale === "fr"
                ? "Une intelligence artificielle multimodale unifiée et son compagnon 3D sur bureau : raisonnement avancé, code, création visuelle et API compatible OpenAI."
                : "A unified multimodal AI model paired with an expressive 60 FPS interactive desktop companion — built for reasoning, software creation, visual studio work, and enterprise developer APIs."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <a
              href="#heyuka-download-center"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? "تحميل تطبيق HEYUKA" : locale === "fr" ? "Télécharger HEYUKA" : "Download HEYUKA App"}</span>
            </a>

            <button
              type="button"
              onClick={() => setWalkthroughOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-extrabold cursor-pointer transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>
                {isAr
                  ? "مراحل التحميل والربط الكاملة"
                  : locale === "fr"
                  ? "Étapes d'Installation"
                  : "All Download & Setup Stages"}
              </span>
            </button>

            <Link
              href={`/${locale}/zebra-x`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white text-xs sm:text-sm font-bold transition-colors"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? "استوديو API و Key ID" : "API Key Studio"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 1: Authentic Multi-Character 3D Showcase (Original Engine & 32 Profiles) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-emerald-400" />
              <span>
                {isAr
                  ? "1. الشخصيات التفاعلية الأصلية لـ HEYUKA (32 شخصية ثلاثية الأبعاد)"
                  : locale === "fr"
                  ? "1. Personnages 3D Officiels HEYUKA (32 Compagnons)"
                  : "1. Authentic 3D Character Lineup (32 Companions)"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {isAr
                ? "حرّك الفأرة أو المس الشاشة لتمشيط الفراء، اسحب للدوران 360°، واضغط على الشخصية للتفاعل المباشر."
                : "Drag to orbit 360°, hover to part fur strands in real time, and tap the character for interactive Boop reactions."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-semibold text-zinc-200 cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span>{soundEnabled ? "Audio On" : "Mute FX"}</span>
            </button>
            <span className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] font-mono text-emerald-300">
              Interactions: {boopCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Authentic 3D Canvas Stage */}
          <div className="lg:col-span-5 rounded-3xl border border-white/15 bg-slate-950/75 p-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/10 text-[10px] font-bold uppercase text-zinc-200">
                {activeCharacter.badge}
              </span>
              <span className="text-[11px] font-mono text-emerald-300">
                Real-Time 3D WebGL2
              </span>
            </div>

            <HEYUKACreatureCanvas
              character={activeCharacter}
              lighting={activeLighting}
              soundEnabled={soundEnabled}
              onBoop={() => setBoopCount((c) => c + 1)}
            />

            <div className="space-y-2.5 px-1">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-extrabold text-white">{activeCharacter.name}</h3>
                  <p className="text-xs text-zinc-400">{activeCharacter.tagline}</p>
                </div>
                <span
                  className="w-6 h-6 rounded-full border border-white/30 shrink-0"
                  style={{ backgroundColor: activeCharacter.furColor }}
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {HEYUKA_LIGHTING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedLightingId(preset.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                      selectedLightingId === preset.id
                        ? "bg-white text-black border-white font-bold"
                        : "bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.1]"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 32 Character Selector Grid */}
          <div className="lg:col-span-7 rounded-3xl border border-white/15 bg-slate-950/75 p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "all", label: "All (32)" },
                  { id: "elemental", label: "Elemental Titans" },
                  { id: "royalty_magic", label: "Royalty & Magic" },
                  { id: "tech_gamer", label: "Tech & Esports" },
                  { id: "pro_adventure", label: "Pro & Adventure" },
                  { id: "street_cute", label: "Street & Cozy" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : "bg-white/[0.05] border-white/10 text-zinc-300 hover:bg-white/[0.1]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[430px] overflow-y-auto kaspi-no-scrollbar pr-1">
              {filteredCharacters.map((char) => {
                const isSelected = char.id === selectedCharId;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setSelectedCharId(char.id)}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-400/70 shadow-md shadow-emerald-500/10"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="w-6 h-6 rounded-full border border-white/30 shrink-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${char.tipColor}, ${char.furColor})`,
                        }}
                      />
                      <span className="text-[9px] font-mono text-zinc-400 truncate">
                        {char.badge}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">{char.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Capabilities & Features Showcase (OpenAI / DeepSeek Confidential Style) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span>
                {isAr
                  ? "2. لماذا يختار المطورون والشركات منظومة HEYUKA؟"
                  : locale === "fr"
                  ? "2. L'Écosystème & Fonctionnalités Clés de HEYUKA"
                  : "2. Why Developers & Teams Build on HEYUKA"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {isAr
                ? "قدرات متكاملة في الاستدلال والوسائط المتعددة وتطبيقات سطح المكتب مع خصوصية وأمان كاملين."
                : "Unified multimodal reasoning, creative media tools, and desktop intelligence with clean privacy isolation."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveStoryIndex(
                  (i) => (i - 1 + ANIMATED_STORY_CHAPTERS.length) % ANIMATED_STORY_CHAPTERS.length
                )
              }
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white cursor-pointer"
              aria-label="Previous chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setStoriesAutoPlay((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-semibold text-zinc-200 cursor-pointer"
            >
              {storiesAutoPlay ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5" />}
              <span>{storiesAutoPlay ? "Auto" : "Paused"}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveStoryIndex((i) => (i + 1) % ANIMATED_STORY_CHAPTERS.length)
              }
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white cursor-pointer"
              aria-label="Next chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className={`rounded-3xl border border-white/15 bg-gradient-to-br ${currentStory.accentClass} bg-slate-950/85 p-6 sm:p-8 space-y-6 transition-all duration-500`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ANIMATED_STORY_CHAPTERS.map((chap, idx) => (
              <button
                key={chap.id}
                type="button"
                onClick={() => {
                  setActiveStoryIndex(idx);
                  setStoriesAutoPlay(false);
                }}
                className="text-start space-y-1.5 cursor-pointer group"
              >
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      idx <= activeStoryIndex ? "w-full bg-emerald-400" : "w-0 bg-transparent"
                    }`}
                  />
                </div>
                <span
                  className={`block text-[10px] font-mono truncate ${
                    idx === activeStoryIndex ? "text-emerald-300 font-bold" : "text-zinc-400"
                  }`}
                >
                  {chap.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-emerald-300">
                {currentStory.badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {isAr
                  ? currentStory.titleAr
                  : locale === "fr"
                  ? currentStory.titleFr
                  : currentStory.titleEn}
              </h3>
              <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                {isAr
                  ? currentStory.descAr
                  : locale === "fr"
                  ? currentStory.descFr
                  : currentStory.descEn}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {currentStory.highlights.map((h) => (
                  <span
                    key={h}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-white"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-white/15 bg-black/40 p-5 space-y-3">
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                HEYUKA Platform Architecture
              </p>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li>
                  • <strong className="text-white">Brand Owner:</strong> KASPI Ecosystem
                </li>
                <li>
                  • <strong className="text-white">Models:</strong> heyuka-omni / heyuka-core / heyuka-vision
                </li>
                <li>
                  • <strong className="text-white">API Standard:</strong> OpenAI SDK Drop-In Compatible
                </li>
                <li>
                  • <strong className="text-white">Security:</strong> Unique SHA-256 Keys &amp; Key IDs
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setWalkthroughOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-extrabold text-black cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? "عرض جميع مراحل التحميل والربط"
                    : "Explore All Download & Setup Stages"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Download HEYUKA Desktop App + Step-by-Step Setup Drawer Button */}
      <section
        id="heyuka-download-center"
        className="rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-10 space-y-8 shadow-2xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Monitor className="w-6 h-6 text-emerald-400" />
              <span>
                {isAr
                  ? "3. مركز تحميل تطبيق HEYUKA وتوليد المفاتيح الحقيقية"
                  : locale === "fr"
                  ? "3. Télécharger HEYUKA Desktop & Générer Vos Clés API"
                  : "3. Download HEYUKA Desktop App & Activate Your API Key"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              {isAr
                ? "حمّل النسخة الرسمية المتوافقة مع نظام تشغيلك وافتح دليل المراحل الكامل لربط تطبيقاتك في دقائق."
                : "Download HEYUKA natively for your operating system or open the visual 4-stage interactive onboarding walkthrough."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setWalkthroughOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-extrabold cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20"
          >
            <Layers className="w-4 h-4" />
            <span>
              {isAr
                ? "عرض جميع مراحل التحميل والتثبيت"
                : locale === "fr"
                ? "Voir Toutes les Étapes de Téléchargement"
                : "Open All Download & Setup Stages"}
            </span>
          </button>
        </div>

        {/* Clean 3-Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Windows */}
          <div className="p-6 rounded-2xl border border-emerald-400/35 bg-emerald-500/10 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500 text-black text-[10px] font-bold uppercase">
                Windows 10 / 11 (x64)
              </span>
              <h3 className="text-lg font-extrabold text-white">HEYUKA Desktop Installer</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {isAr
                  ? "تطبيق ويندوز المتكامل بالواجهة ثلاثية الأبعاد والربط السريع مع APIs الخاصة بك."
                  : "Native Windows desktop app with 3D companion mode, voice assistance, and instant cloud API connectivity."}
              </p>
            </div>
            <div className="space-y-2">
              <a
                href="/api/v1/heyuka/installer?platform=windows"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? "تحميل المثبّت السريع (.bat)" : "Download Windows Installer (.bat)"}</span>
              </a>
              <a
                href="/download/exe"
                className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Desktop Package (.exe)</span>
              </a>
            </div>
          </div>

          {/* macOS */}
          <div className="p-6 rounded-2xl border border-white/15 bg-white/[0.04] flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-zinc-200 text-[10px] font-bold uppercase">
                macOS Apple Silicon &amp; Intel
              </span>
              <h3 className="text-lg font-extrabold text-white">Universal DMG Bundle</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isAr
                  ? "مخصص لأجهزة Mac بمعالجات M1-M4 و Intel مع دعم التسريع الرسومي والتكامل الفوري."
                  : "Engineered for Apple Silicon M-series & Intel Macs with native Metal/WebGL2 rendering and API sync."}
              </p>
            </div>
            <a
              href="/api/v1/heyuka/installer?platform=macos"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span>macOS Release Spec (DMG)</span>
            </a>
          </div>

          {/* Linux */}
          <div className="p-6 rounded-2xl border border-white/15 bg-white/[0.04] flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-zinc-200 text-[10px] font-bold uppercase">
                Linux Desktop (x64)
              </span>
              <h3 className="text-lg font-extrabold text-white">AppImage / Flatpak</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isAr
                  ? "تشغيل مباشر على Ubuntu و Debian و Fedora و Arch بأداء عالٍ وعزل أمني متكامل."
                  : "Portable Linux packaging compatible with Ubuntu, Fedora, Debian & Arch desktops."}
              </p>
            </div>
            <a
              href="/api/v1/heyuka/installer?platform=linux"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span>Linux Release Spec (AppImage)</span>
            </a>
          </div>
        </div>

        {/* Unique Real API Key & Quickstart Row */}
        <div id="heyuka-api-keys" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-white/10">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>
                  {isAr
                    ? "توليد مفتاح API حقيقي وفريد لك (IPK)"
                    : "Create Unique API Key & Key ID"}
                </span>
              </h3>
              <Link
                href={`/${locale}/zebra-x`}
                className="text-xs font-bold text-emerald-400 hover:underline"
              >
                {isAr ? "استوديو المفاتيح الكامل →" : "Full Console →"}
              </Link>
            </div>

            {!authenticated ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-400/30">
                <div className="flex items-center gap-2 text-xs text-amber-100">
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    {isAr
                      ? "سجّل الدخول لتوليد مفتاح API فريد باسمك ونسخه مباشرة."
                      : "Sign in to issue cryptographically unique API Keys & Key IDs."}
                  </span>
                </div>
                <Link
                  href={`/${locale}/login?from=/${locale}/heyuka`}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-extrabold shrink-0 text-center"
                >
                  {isAr ? "تسجيل الدخول" : "Sign In"}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateQuickKey} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder={isAr ? "اسم التطبيق أو الجهاز..." : "Key label (e.g. My Desktop App)"}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={keyBusy}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{keyBusy ? "..." : isAr ? "إنشاء مفتاح فريد" : "Create Unique Key"}</span>
                </button>
              </form>
            )}

            {keyError && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-400/30 rounded-xl p-2.5">
                {keyError}
              </p>
            )}

            {generatedKeyOnce && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-400/40 space-y-3">
                {generatedKeyId && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-200 font-semibold">
                      <span>Key ID (X-API-Key-Id):</span>
                      <button
                        type="button"
                        onClick={() => void handleCopy("heyuka-key-id", generatedKeyId)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                      >
                        {copiedId === "heyuka-key-id" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === "heyuka-key-id" ? "Copied ✓" : "Copy ID"}</span>
                      </button>
                    </div>
                    <code dir="ltr" className="block text-[11px] font-mono text-amber-200 break-all select-all">
                      {generatedKeyId}
                    </code>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-emerald-200 font-bold">
                    <span>Secret API Key (shown once):</span>
                    <button
                      type="button"
                      onClick={() => void handleCopy("heyuka-key", generatedKeyOnce)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500 text-black cursor-pointer"
                    >
                      {copiedId === "heyuka-key" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === "heyuka-key" ? "Copied ✓" : "Copy Key"}</span>
                    </button>
                  </div>
                  <code dir="ltr" className="block text-[11px] font-mono text-white break-all select-all">
                    {generatedKeyOnce}
                  </code>
                </div>
              </div>
            )}

            {issuedKeys.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold text-zinc-400">
                  {isAr ? `المفاتيح النشطة (${issuedKeys.length}):` : `Active Keys (${issuedKeys.length}):`}
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 kaspi-no-scrollbar">
                  {issuedKeys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-[11px]"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-white">{k.label}</span>
                        <div dir="ltr" className="font-mono text-[10px] text-amber-200 truncate">
                          {k.id}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span dir="ltr" className="font-mono text-[10px] text-emerald-300">
                          {k.prefix}••{k.last4}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(`kid-${k.id}`, k.id)}
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white cursor-pointer"
                        >
                          {copiedId === `kid-${k.id}` ? "✓" : "Copy ID"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {isAr
                  ? "كل مفتاح يُنشأ بمحتوى عشوائي فريد ولا يمكن تكراره أو استرجاعه بصيغته النصية لاحقاً."
                  : "Every issued key is cryptographically unique and stored strictly as an irreversible hash."}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/95 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-zinc-200">
                Quickstart: Standard OpenAI-Compatible Client
              </p>
              <button
                type="button"
                onClick={() => void handleCopy("heyuka-quickstart", quickstartCode)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white cursor-pointer"
              >
                {copiedId === "heyuka-quickstart" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === "heyuka-quickstart" ? "Copied ✓" : "Copy Code"}</span>
              </button>
            </div>
            <pre
              dir="ltr"
              className="text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed p-3 rounded-xl bg-black/40 border border-white/10"
            >
              {quickstartCode}
            </pre>
            <button
              type="button"
              onClick={() => setWalkthroughOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-bold text-white cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>
                {isAr
                  ? "استعراض مراحل التحميل والربط الكاملة (Python / Node / cURL / OS)"
                  : "Open Interactive Setup & Code Guide (Python / Node / cURL / OS)"}
              </span>
            </button>
          </div>
        </div>
      </section>

      <HEYUKAInstallWalkthrough
        isOpen={walkthroughOpen}
        onClose={() => setWalkthroughOpen(false)}
        locale={locale}
        activeSecretKey={generatedKeyOnce}
        activeKeyId={generatedKeyId}
      />
    </div>
  );
}

export default HEYUKALandingShowcase;
