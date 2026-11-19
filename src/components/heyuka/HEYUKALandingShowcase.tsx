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
    <div className="w-full h-[360px] sm:h-[440px] rounded-2xl kaspi-frosted-surface flex items-center justify-center text-xs font-mono text-[var(--kaspi-text-muted)]">
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
      className="min-h-screen pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12"
    >
      {/* VisionOS Crystal Glass Flagship Hero */}
      <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-bold text-emerald-500">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HEYUKA • Owned &amp; Engineered by KASPI</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full kaspi-frosted-surface text-[11px] font-mono text-[var(--kaspi-text-secondary)]">
                Desktop App • 32 Interactive Characters • Sovereign API
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl kaspi-glass-surface flex items-center justify-center shrink-0">
                <img src="/logo-mark.png" alt="KASPI HEYUKA" className="w-8 h-8 object-contain" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--kaspi-text-primary)]">
                {isAr
                  ? "تعرّف على HEYUKA — رفيقك الذكي من KASPI"
                  : locale === "fr"
                  ? "Découvrez HEYUKA — Intelligence Souveraine par KASPI"
                  : "Meet HEYUKA — Flagship Desktop & API Intelligence by KASPI"}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-[var(--kaspi-text-secondary)] leading-relaxed">
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
              className="kaspi-primary-cta-btn inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? "تحميل تطبيق HEYUKA" : locale === "fr" ? "Télécharger HEYUKA" : "Download HEYUKA App"}</span>
            </a>

            <button
              type="button"
              onClick={() => setWalkthroughOpen(true)}
              className="kaspi-glass-btn inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-500" />
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
              className="kaspi-glass-btn inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold"
            >
              <KeyRound className="w-4 h-4 text-emerald-500" />
              <span>{isAr ? "منصة المطورين والـ API" : "Developer Console"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 1: Authentic Multi-Character 3D Showcase (Original Engine & 32 Profiles) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--kaspi-text-primary)] flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-emerald-500" />
              <span>
                {isAr
                  ? "1. الشخصيات التفاعلية الأصلية لـ HEYUKA (32 شخصية ثلاثية الأبعاد)"
                  : locale === "fr"
                  ? "1. Personnages 3D Officiels HEYUKA (32 Compagnons)"
                  : "1. Authentic 3D Character Lineup (32 Companions)"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--kaspi-text-muted)] mt-1">
              {isAr
                ? "حرّك الفأرة أو المس الشاشة لتمشيط الفراء، اسحب للدوران 360°، واضغط على الشخصية للتفاعل المباشر."
                : "Drag to orbit 360°, hover to part fur strands in real time, and tap the character for interactive Boop reactions."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="kaspi-glass-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-[var(--kaspi-text-muted)]" />
              )}
              <span>{soundEnabled ? "Audio On" : "Mute FX"}</span>
            </button>
            <span className="px-2.5 py-1.5 rounded-xl kaspi-glass-surface text-[11px] font-mono text-emerald-500 font-semibold">
              Interactions: {boopCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Authentic 3D Canvas Stage */}
          <div className="lg:col-span-5 rounded-3xl kaspi-glass-card p-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[10px] font-bold uppercase text-[var(--kaspi-text-primary)]">
                {activeCharacter.badge}
              </span>
              <span className="text-[11px] font-mono text-emerald-500 font-semibold">
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
                  <h3 className="text-lg font-extrabold text-[var(--kaspi-text-primary)]">{activeCharacter.name}</h3>
                  <p className="text-xs text-[var(--kaspi-text-muted)]">{activeCharacter.tagline}</p>
                </div>
                <span
                  className="w-6 h-6 rounded-full border border-[var(--kaspi-border)] shrink-0"
                  style={{ backgroundColor: activeCharacter.furColor }}
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {HEYUKA_LIGHTING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedLightingId(preset.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
                      selectedLightingId === preset.id
                        ? "kaspi-orbit-active text-emerald-500 font-bold"
                        : "kaspi-glass-surface text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 32 Character Selector Grid */}
          <div className="lg:col-span-7 rounded-3xl kaspi-glass-card p-5 space-y-4">
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeCategory === cat.id
                      ? "kaspi-orbit-active text-emerald-500"
                      : "kaspi-glass-surface text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
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
                    className={`p-3 rounded-2xl text-start transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? "kaspi-orbit-active"
                        : "kaspi-frosted-surface hover:scale-[1.01]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="w-6 h-6 rounded-full border border-[var(--kaspi-border)] shrink-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${char.tipColor}, ${char.furColor})`,
                        }}
                      />
                      <span className="text-[9px] font-mono text-[var(--kaspi-text-muted)] truncate">
                        {char.badge}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[var(--kaspi-text-primary)] truncate">{char.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Capabilities & Features Showcase */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--kaspi-text-primary)] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-500" />
              <span>
                {isAr
                  ? "2. لماذا يختار المطورون والشركات منظومة HEYUKA؟"
                  : locale === "fr"
                  ? "2. L'Écosystème & Fonctionnalités Clés de HEYUKA"
                  : "2. Why Developers & Teams Build on HEYUKA"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--kaspi-text-muted)] mt-1">
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
              className="kaspi-glass-btn p-2 rounded-xl cursor-pointer"
              aria-label="Previous chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setStoriesAutoPlay((p) => !p)}
              className="kaspi-glass-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              {storiesAutoPlay ? <Pause className="w-3.5 h-3.5 text-emerald-500" /> : <Play className="w-3.5 h-3.5" />}
              <span>{storiesAutoPlay ? "Auto" : "Paused"}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveStoryIndex((i) => (i + 1) % ANIMATED_STORY_CHAPTERS.length)
              }
              className="kaspi-glass-btn p-2 rounded-xl cursor-pointer"
              aria-label="Next chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className="rounded-3xl kaspi-glass-card kaspi-polar-aurora-orbit relative p-6 sm:p-8 space-y-6 transition-all duration-500"
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
                <div className="h-1.5 rounded-full kaspi-glass-surface overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      idx <= activeStoryIndex ? "w-full bg-emerald-500" : "w-0 bg-transparent"
                    }`}
                  />
                </div>
                <span
                  className={`block text-[10px] font-mono truncate ${
                    idx === activeStoryIndex ? "text-emerald-500 font-bold" : "text-[var(--kaspi-text-muted)]"
                  }`}
                >
                  {chap.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-block px-3 py-1 rounded-full kaspi-glass-surface text-xs font-bold text-emerald-500">
                {currentStory.badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[var(--kaspi-text-primary)]">
                {isAr
                  ? currentStory.titleAr
                  : locale === "fr"
                  ? currentStory.titleFr
                  : currentStory.titleEn}
              </h3>
              <p className="text-sm sm:text-base text-[var(--kaspi-text-secondary)] leading-relaxed">
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
                    className="px-3 py-1.5 rounded-xl kaspi-frosted-surface text-xs font-semibold text-[var(--kaspi-text-primary)]"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl kaspi-frosted-surface p-5 space-y-3">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                HEYUKA Platform Architecture
              </p>
              <ul className="space-y-2 text-xs text-[var(--kaspi-text-secondary)]">
                <li>
                  • <strong className="text-[var(--kaspi-text-primary)]">Brand Owner:</strong> KASPI Ecosystem
                </li>
                <li>
                  • <strong className="text-[var(--kaspi-text-primary)]">Models:</strong> heyuka-omni / heyuka-core / heyuka-vision
                </li>
                <li>
                  • <strong className="text-[var(--kaspi-text-primary)]">API Standard:</strong> OpenAI &amp; Azure Header Compatible
                </li>
                <li>
                  • <strong className="text-[var(--kaspi-text-primary)]">Security:</strong> Unique SHA-256 Keys &amp; Key IDs
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setWalkthroughOpen(true)}
                className="w-full kaspi-primary-cta-btn py-2.5 px-3 rounded-xl text-xs font-extrabold cursor-pointer flex items-center justify-center gap-2"
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
        className="rounded-3xl kaspi-glass-card kaspi-polar-aurora-orbit relative p-6 sm:p-10 space-y-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold text-[var(--kaspi-text-primary)] flex items-center gap-2.5">
              <Monitor className="w-6 h-6 text-emerald-500" />
              <span>
                {isAr
                  ? "3. مركز تحميل تطبيق HEYUKA وتوليد المفاتيح الحقيقية"
                  : locale === "fr"
                  ? "3. Télécharger HEYUKA Desktop & Générer Vos Clés API"
                  : "3. Download HEYUKA Desktop App & Activate Your API Key"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--kaspi-text-muted)]">
              {isAr
                ? "حمّل النسخة الرسمية المتوافقة مع نظام تشغيلك وافتح دليل المراحل الكامل لربط تطبيقاتك في دقائق."
                : "Download HEYUKA natively for your operating system or open the visual 4-stage interactive onboarding walkthrough."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setWalkthroughOpen(true)}
            className="kaspi-primary-cta-btn inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold cursor-pointer shrink-0"
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
          <div className="p-6 rounded-2xl kaspi-frosted-surface flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-emerald-500 text-[10px] font-bold uppercase">
                Windows 10 / 11 (x64)
              </span>
              <h3 className="text-lg font-extrabold text-[var(--kaspi-text-primary)]">HEYUKA Desktop Installer</h3>
              <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
                {isAr
                  ? "تطبيق ويندوز المتكامل بالواجهة ثلاثية الأبعاد والربط السريع مع APIs الخاصة بك."
                  : "Native Windows desktop app with 3D companion mode, voice assistance, and instant cloud API connectivity."}
              </p>
            </div>
            <div className="space-y-2">
              <a
                href="/api/v1/heyuka/installer?platform=windows"
                className="kaspi-primary-cta-btn w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? "تحميل المثبّت السريع (.bat)" : "Download Windows Installer (.bat)"}</span>
              </a>
              <a
                href="/download/exe"
                className="kaspi-glass-btn w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Desktop Package (.exe)</span>
              </a>
            </div>
          </div>

          {/* macOS */}
          <div className="p-6 rounded-2xl kaspi-frosted-surface flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[var(--kaspi-text-secondary)] text-[10px] font-bold uppercase">
                macOS Apple Silicon &amp; Intel
              </span>
              <h3 className="text-lg font-extrabold text-[var(--kaspi-text-primary)]">Universal DMG Bundle</h3>
              <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
                {isAr
                  ? "مخصص لأجهزة Mac بمعالجات M1-M4 و Intel مع دعم التسريع الرسومي والتكامل الفوري."
                  : "Engineered for Apple Silicon M-series & Intel Macs with native Metal/WebGL2 rendering and API sync."}
              </p>
            </div>
            <a
              href="/api/v1/heyuka/installer?platform=macos"
              target="_blank"
              rel="noopener noreferrer"
              className="kaspi-glass-btn w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              <span>macOS Release Spec (DMG)</span>
            </a>
          </div>

          {/* Linux */}
          <div className="p-6 rounded-2xl kaspi-frosted-surface flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[var(--kaspi-text-secondary)] text-[10px] font-bold uppercase">
                Linux Desktop (x64)
              </span>
              <h3 className="text-lg font-extrabold text-[var(--kaspi-text-primary)]">AppImage / Flatpak</h3>
              <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
                {isAr
                  ? "تشغيل مباشر على Ubuntu و Debian و Fedora و Arch بأداء عالٍ وعزل أمني متكامل."
                  : "Portable Linux packaging compatible with Ubuntu, Fedora, Debian & Arch desktops."}
              </p>
            </div>
            <a
              href="/api/v1/heyuka/installer?platform=linux"
              target="_blank"
              rel="noopener noreferrer"
              className="kaspi-glass-btn w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              <span>Linux Release Spec (AppImage)</span>
            </a>
          </div>
        </div>

        {/* Unique Real API Key & Quickstart Row */}
        <div id="heyuka-api-keys" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-[var(--kaspi-border)]">
          <div className="p-6 rounded-2xl kaspi-frosted-surface space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[var(--kaspi-text-primary)] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                <span>
                  {isAr
                    ? "توليد مفتاح API حقيقي وفريد لك (IPK)"
                    : "Create Unique API Key & Key ID"}
                </span>
              </h3>
              <Link
                href={`/${locale}/zebra-x/debug`}
                className="text-xs font-bold text-emerald-500 hover:underline"
              >
                {isAr ? "فاحص Debug الحي ←" : "Live Debugger →"}
              </Link>
            </div>

            {!authenticated ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl kaspi-glass-surface">
                <div className="flex items-center gap-2 text-xs text-[var(--kaspi-text-secondary)]">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {isAr
                      ? "سجّل الدخول لتوليد مفتاح API فريد باسمك ونسخه مباشرة."
                      : "Sign in to issue cryptographically unique API Keys & Key IDs."}
                  </span>
                </div>
                <Link
                  href={`/${locale}/login?from=/${locale}/heyuka`}
                  className="kaspi-primary-cta-btn px-4 py-2 rounded-xl text-xs font-extrabold shrink-0 text-center"
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
                  className="flex-1 px-3.5 py-2.5 rounded-xl kaspi-glass-surface text-xs text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={keyBusy}
                  className="kaspi-primary-cta-btn inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{keyBusy ? "..." : isAr ? "إنشاء مفتاح فريد" : "Create Unique Key"}</span>
                </button>
              </form>
            )}

            {keyError && (
              <p className="text-xs text-rose-500 kaspi-glass-surface rounded-xl p-2.5">
                {keyError}
              </p>
            )}

            {generatedKeyOnce && (
              <div className="p-4 rounded-xl kaspi-glass-surface space-y-3">
                {generatedKeyId && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[var(--kaspi-text-secondary)] font-semibold">
                      <span>Key ID (X-API-Key-Id):</span>
                      <button
                        type="button"
                        onClick={() => void handleCopy("heyuka-key-id", generatedKeyId)}
                        className="kaspi-glass-btn inline-flex items-center gap-1 px-2.5 py-0.5 rounded cursor-pointer"
                      >
                        {copiedId === "heyuka-key-id" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === "heyuka-key-id" ? "Copied ✓" : "Copy ID"}</span>
                      </button>
                    </div>
                    <code dir="ltr" className="block text-[11px] font-mono text-amber-500 break-all select-all">
                      {generatedKeyId}
                    </code>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-emerald-500 font-bold">
                    <span>Secret API Key (shown once):</span>
                    <button
                      type="button"
                      onClick={() => void handleCopy("heyuka-key", generatedKeyOnce)}
                      className="kaspi-primary-cta-btn inline-flex items-center gap-1 px-2.5 py-0.5 rounded cursor-pointer"
                    >
                      {copiedId === "heyuka-key" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === "heyuka-key" ? "Copied ✓" : "Copy Key"}</span>
                    </button>
                  </div>
                  <code dir="ltr" className="block text-[11px] font-mono text-[var(--kaspi-text-primary)] break-all select-all">
                    {generatedKeyOnce}
                  </code>
                </div>
              </div>
            )}

            {issuedKeys.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold text-[var(--kaspi-text-muted)]">
                  {isAr ? `المفاتيح النشطة (${issuedKeys.length}):` : `Active Keys (${issuedKeys.length}):`}
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 kaspi-no-scrollbar">
                  {issuedKeys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg kaspi-glass-surface text-[11px]"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-[var(--kaspi-text-primary)]">{k.label}</span>
                        <div dir="ltr" className="font-mono text-[10px] text-amber-500 truncate">
                          {k.id}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span dir="ltr" className="font-mono text-[10px] text-emerald-500">
                          {k.prefix}••{k.last4}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(`kid-${k.id}`, k.id)}
                          className="kaspi-glass-btn px-2 py-0.5 rounded text-[10px] cursor-pointer"
                        >
                          {copiedId === `kid-${k.id}` ? "✓" : "Copy ID"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[11px] text-[var(--kaspi-text-muted)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                {isAr
                  ? "كل مفتاح يُنشأ بمحتوى عشوائي فريد ولا يمكن تكراره أو استرجاعه بصيغته النصية لاحقاً."
                  : "Every issued key is cryptographically unique and stored strictly as an irreversible hash."}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl kaspi-frosted-surface space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[var(--kaspi-text-primary)]">
                Quickstart: Standard OpenAI-Compatible Client
              </p>
              <button
                type="button"
                onClick={() => void handleCopy("heyuka-quickstart", quickstartCode)}
                className="kaspi-glass-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
              >
                {copiedId === "heyuka-quickstart" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === "heyuka-quickstart" ? "Copied ✓" : "Copy Code"}</span>
              </button>
            </div>
            <pre
              dir="ltr"
              className="text-[11px] font-mono text-emerald-500 overflow-x-auto leading-relaxed p-3 rounded-xl kaspi-glass-surface"
            >
              {quickstartCode}
            </pre>
            <button
              type="button"
              onClick={() => setWalkthroughOpen(true)}
              className="w-full kaspi-glass-btn py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-emerald-500" />
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
