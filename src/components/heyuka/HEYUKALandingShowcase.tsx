"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  ShieldAlert,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react";
import {
  HEYUKA_ARCHITECTURAL_STACK,
  HEYUKA_CHARACTER_PROFILES,
  HEYUKA_CLOUD_FLEET_GATEWAYS,
  HEYUKA_COSMIC_DOMAINS,
  HEYUKA_CYBER_DEFENSE_FEEDS,
  HEYUKA_LIGHTING_PRESETS,
  type HeyukaCharacterCategory,
} from "@/lib/heyuka/heyuka-universe";
import { HEYUKACreatureCanvas } from "./HEYUKACreatureCanvas";

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
    id: "os-ghost-cursor",
    badge: "Story 01 • OS Control",
    titleAr: "المؤشر الشبحي والتحكم الصامت في الحاسوب",
    titleFr: "Ghost Cursor & Contrôle OS Silencieux",
    titleEn: "Ghost Cursor & Silent OS Control",
    descAr:
      "ينساب HEYUKA Desktop OS فوق تطبيقات ويندوز وماك ولينكس عبر Electron وPyAutoGUI وUIAutomation، ينفذ أوامرك مع حماية 24 أداة حساسة ببوابة موافقة فورية.",
    descFr:
      "HEYUKA Desktop OS pilote vos logiciels via Electron, PyAutoGUI et UIAutomation sans monopoliser votre souris, avec validation explicite pour les 24 outils critiques.",
    descEn:
      "HEYUKA Desktop OS operates Windows, macOS, and Linux windows cleanly via Electron, PyAutoGUI, and UIAutomation behind a 24-tool Destructive Gate.",
    highlights: ["Ghost Cursor IPC", "24 Destructive Tools Gate", "Core Sandbox Bypass", "Alt+X Frameless HUD"],
    accentClass: "from-emerald-500/20 via-teal-500/10 to-transparent",
  },
  {
    id: "fur-webgl2-studio",
    badge: "Story 02 • 60 FPS WebGL2",
    titleAr: "محرك الفراء ثلاثي الأبعاد والـ 32 شخصية الحية",
    titleFr: "Moteur Fourrure WebGL2 60 FPS & 32 Personnages",
    titleEn: "60 FPS WebGL2 Fur Physics & 32 Characters",
    descAr:
      "64 طبقة حجمية و60,000 شعيرة بمظلل Marschner وفيزياء Verlet متوازية 128×128، مع رؤية بصرية كل 3 ثوانٍ عبر بصمة dHash 256-bit ومعزول كلياً عن صفحات الكاشير.",
    descFr:
      "64 couches et 60 000 brins Marschner avec physique Verlet 128×128 et boucle visuelle dHash 3s, 100% isolé des caisses KASPI POS.",
    descEn:
      "64-shell, 60,000-strand Marschner fur with 128×128 Verlet GPGPU and 3s dHash visual awareness — kept strictly isolated from KASPI POS checkout.",
    highlights: ["60,000 Strands • 60 FPS", "32 Characters (Mochi-Puff+)", "dHash 3s Vision Loop", "TripoSR :8188 + Blender"],
    accentClass: "from-amber-500/20 via-orange-500/10 to-transparent",
  },
  {
    id: "creative-adobe-blender",
    badge: "Story 03 • Creative & Audio",
    titleAr: "أستاذ Photoshop وPremiere وBlender والصوت الحي",
    titleFr: "Maître Adobe Creative Suite, Blender & Audio",
    titleEn: "Adobe Creative Suite, Blender 3D & Live Audio",
    descAr:
      "يتصل مباشرةً عبر Adobe UXP/JSX وBlender-MCP (223 أداة) وAuto-Editor، مع التقطيع والفصل الصوتي (Demucs) وتحويل الدارجة والريفية والفيديو إلى نصوص منسقة.",
    descFr:
      "Pilotage direct Adobe UXP/JSX, Blender-MCP (223 outils), montage Auto-Editor, séparation vocale Demucs et transcription Darija/Tarifit.",
    descEn:
      "Direct Adobe UXP/JSX, Blender-MCP (223 tools), ProPainter object removal, Demucs stem splitting, and 16kHz PCM system audio capture.",
    highlights: ["Adobe UXP / ExtendScript", "Blender-MCP 223 Tools", "Demucs + Faster-Whisper", "16kHz PCM Audio Loopback"],
    accentClass: "from-purple-500/20 via-fuchsia-500/10 to-transparent",
  },
  {
    id: "cosmic-cyber-120",
    badge: "Story 04 • 120 Zero-Key Sources",
    titleAr: "100 مصدر كوني + 20 رادار دفاع سيبراني + 12 بوابة",
    titleFr: "100 Sources Cosmiques + 20 Flux Cyber + 12 Passerelles",
    titleEn: "100 Cosmic Sources + 20 Cyber Feeds + 12 Gateways",
    descAr:
      "يعمل الحين بدون أي مفتاح إجباري عبر 12 بوابة سحابية ومحلية و20 مصدر دفاع سيبراني (CISA KEV, NIST NVD 2.0, OSV.dev, Cloudflare 1.1.1.2 DoH) وتقارير PDF مدمجة.",
    descFr:
      "Opérationnel immédiatement avec 0 clé obligatoire : 12 passerelles cloud/locales, 20 flux DEFCON-1 (CISA, NVD, OSV.dev) et génération PDF native.",
    descEn:
      "Zero mandatory external keys: 12 serverless & local gateways, Piston sandbox, Jina Reader, Pollinations Flux, and 20 live DEFCON-1 cyber feeds.",
    highlights: ["0 Mandatory API Keys", "20 Cyber Feeds (CISA/NVD)", "12 Fleet Gateways", "100 Cosmic APIs"],
    accentClass: "from-sky-500/20 via-cyan-500/10 to-transparent",
  },
  {
    id: "hybrid-memory-kaspi",
    badge: "Story 05 • 5-Tier Memory • KASPI",
    titleAr: "ذاكرة هجينة من 5 مستويات تحت ملكية شركة KASPI",
    titleFr: "Mémoire Hybride 5 Niveaux sous Souveraineté KASPI",
    titleEn: "5-Tier Sovereign Hybrid Memory Owned by KASPI",
    descAr:
      "تتحد ذاكرة المتصفح السريعة، بحث @orama/orama + Fuse.js، متجهات 128-dim وChromaDB المحلي، والمزامنة السحابية وخزنة AES-256-GCM تحت مظلة HEYUKA by KASPI.",
    descFr:
      "Fusion de IndexedDB, @orama/orama + Fuse.js, vecteurs 128-dim, ChromaDB Python et coffre AES-256-GCM sous gouvernance KASPI.",
    descEn:
      "Unifies browser Dexie cache, Orama + Fuse + SemHash/FSRS memory, local Python ChromaDB RAG, and tenant-isolated AES-256-GCM Vaults owned by KASPI.",
    highlights: ["5-Tier Hybrid Memory", "AES-256-GCM + scrypt Vault", "100x Opt-In Node Mesh", "Owned by KASPI"],
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
  const [showArsenalDrawer, setShowArsenalDrawer] = useState(false);

  // Instant HEYUKA API Key State
  const [authenticated, setAuthenticated] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [generatedKeyOnce, setGeneratedKeyOnce] = useState<string | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    fetch("/api/v1/zebra-x/keys", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setAuthenticated(Boolean(d.authenticated));
      })
      .catch(() => {});
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
    setKeyBusy(true);
    try {
      const res = await fetch("/api/v1/zebra-x/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newKeyLabel.trim() || "HEYUKA Desktop OS Key",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setGeneratedKeyOnce(json.secretKeyOnce);
        setNewKeyLabel("");
      }
    } finally {
      setKeyBusy(false);
    }
  };

  const currentStory = ANIMATED_STORY_CHAPTERS[activeStoryIndex];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-14">
      {/* Cinematic Top Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-950/75 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-xs font-bold text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HEYUKA Desktop OS • Owned by KASPI</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono text-zinc-300">
                60 FPS Fur Physics • 32 Characters • 120 Zero-Key Sources
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.07] border border-white/15 flex items-center justify-center shrink-0">
                <img src="/logo-mark.png" alt="KASPI HEYUKA" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-white">
                  {isAr
                    ? "HEYUKA — مساعد الحاسوب ثلاثي الأبعاد من KASPI"
                    : locale === "fr"
                    ? "HEYUKA — Compagnon Desktop 3D par KASPI"
                    : "HEYUKA — Standalone 3D Desktop OS by KASPI"}
                </h1>
              </div>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {isAr
                ? "استكشف جميع الشخصيات التفاعلية بـ 60 إطار/ثانية والقصص المتحركة، وحمّل تطبيق سطح المكتب المعزول للتحكم الكامل بالحاسوب، Adobe، Blender، و120 مصدراً مفتوحاً بدون أي عبء على كاشير KASPI POS."
                : locale === "fr"
                ? "Découvrez les 32 personnages interactifs à 60 FPS, parcourez les histoires animées et téléchargez HEYUKA Desktop OS par KASPI (isolation totale de la caisse KASPI POS)."
                : "Explore all 32 interactive 60 FPS fur characters, experience animated feature stories, and download standalone HEYUKA Desktop OS owned by KASPI — 100% isolated from KASPI POS checkout."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <a
              href="#heyuka-download-center"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? "تحميل لحاسوبك" : locale === "fr" ? "Télécharger OS" : "Download Desktop OS"}</span>
            </a>
            <Link
              href={`/${locale}/zebra-x`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white text-xs sm:text-sm font-bold transition-colors"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? "بوابة API" : "API Portal"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 1: Interactive Multi-Character 3D Fur Showcase (Desktop + Mobile + Tablet Responsive) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-emerald-400" />
              <span>
                {isAr
                  ? "1. الاستعراض التفاعلي لـ 32 شخصية (Mochi-Puff والأبطال الخمسة)"
                  : locale === "fr"
                  ? "1. Galerie 3D Interactive (32 Personnages HEYUKA)"
                  : "1. Interactive Multi-Character 3D Showcase (32 Companions)"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {isAr
                ? "حرّك المؤشر أو المس الشاشة لتمشيط الفراء وتتبع العينين، واضغط على الكائن لإطلاق موجة Boop!"
                : "Move cursor or touch to part volumetric fur strands & tap creature for Boop shockwave."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                soundEnabled
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                  : "bg-white/5 border-white/10 text-zinc-300"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? "Sound On" : "Mute FX"}</span>
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-zinc-300">
              Boops: {boopCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Live Interactive 60 FPS Canvas Viewport */}
          <div className="lg:col-span-5 rounded-3xl border border-white/15 bg-slate-950/90 overflow-hidden flex flex-col shadow-2xl">
            <div className="relative h-[340px] sm:h-[420px] w-full">
              <HEYUKACreatureCanvas
                character={activeCharacter}
                lighting={activeLighting}
                soundEnabled={soundEnabled}
                onBoop={() => setBoopCount((c) => c + 1)}
              />

              {/* Overlay HUD Badge */}
              <div className="pointer-events-none absolute top-3 start-3 end-3 flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white">
                  {activeCharacter.badge}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 font-mono text-[10px] text-emerald-300">
                  60 FPS WebGL2 Fur
                </span>
              </div>
            </div>

            {/* Character Metadata & Lighting Studio Presets */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">{activeCharacter.name}</h3>
                  <p className="text-xs text-zinc-400">{activeCharacter.tagline}</p>
                </div>
                <span
                  className="w-6 h-6 rounded-full border border-white/25 shrink-0"
                  style={{ background: `linear-gradient(135deg, ${activeCharacter.tipColor}, ${activeCharacter.furColor})` }}
                />
              </div>

              {/* Studio Lighting Switcher */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {HEYUKA_LIGHTING_PRESETS.map((lp) => (
                  <button
                    key={lp.id}
                    type="button"
                    onClick={() => setSelectedLightingId(lp.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                      selectedLightingId === lp.id
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.05] border-white/10 text-zinc-300 hover:bg-white/[0.1]"
                    }`}
                  >
                    {lp.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 32 Character Selector Grid & Category Filter */}
          <div className="lg:col-span-7 rounded-3xl border border-white/15 bg-slate-950/75 backdrop-blur-2xl p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "all", label: `All (${HEYUKA_CHARACTER_PROFILES.length})` },
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    activeCategory === cat.id
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[390px] overflow-y-auto kaspi-no-scrollbar pr-1">
              {filteredCharacters.map((char) => {
                const isSelected = char.id === activeCharacter.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setSelectedCharId(char.id)}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-400/70 shadow-md shadow-emerald-500/15"
                        : "bg-white/[0.04] border-white/10 hover:border-white/25 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="w-7 h-7 rounded-full border border-white/25 shrink-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${char.tipColor}, ${char.furColor})`,
                        }}
                      />
                      <span className="text-[10px] font-mono text-zinc-400 truncate">
                        {char.badge}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">{char.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Animated Interactive Stories + 120 Absorbed Zero-Key Sources Drawer */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>
              {isAr
                ? "2. القصص التفاعلية المتحركة وقدرات المنظومة (120 مصدراً)"
                : locale === "fr"
                ? "2. Histoires Animées Interactives & Arsenal (120 Sources)"
                : "2. Animated Interactive Stories & Full KASPI × HEYUKA Stack"}
            </span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStoriesAutoPlay((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-zinc-200 cursor-pointer"
            >
              {storiesAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{storiesAutoPlay ? "Auto" : "Paused"}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveStoryIndex(
                  (i) => (i - 1 + ANIMATED_STORY_CHAPTERS.length) % ANIMATED_STORY_CHAPTERS.length
                )
              }
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-200 cursor-pointer"
              aria-label="Previous story"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveStoryIndex((i) => (i + 1) % ANIMATED_STORY_CHAPTERS.length)
              }
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-200 cursor-pointer"
              aria-label="Next story"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Story Progress Bars */}
        <div className="grid grid-cols-5 gap-2">
          {ANIMATED_STORY_CHAPTERS.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveStoryIndex(idx)}
              className="group py-1.5 text-start cursor-pointer"
              aria-label={st.titleEn}
            >
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === activeStoryIndex
                      ? "w-full bg-emerald-400"
                      : idx < activeStoryIndex
                      ? "w-full bg-emerald-600/60"
                      : "w-0 bg-white/30"
                  }`}
                />
              </div>
              <p className="hidden md:block text-[10px] font-mono text-zinc-400 mt-1.5 truncate group-hover:text-white">
                {st.badge}
              </p>
            </button>
          ))}
        </div>

        {/* Active Animated Story Card */}
        <div
          key={currentStory.id}
          className={`relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br ${currentStory.accentClass} bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-10 animate-in fade-in duration-300 shadow-2xl`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <span className="inline-flex px-3 py-1 rounded-full bg-white/10 border border-white/15 font-mono text-xs text-emerald-300">
                {currentStory.badge}
              </span>
              <h3 className="text-xl sm:text-3xl font-extrabold text-white">
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

              <div className="flex flex-wrap gap-2 pt-2">
                {currentStory.highlights.map((h) => (
                  <span
                    key={h}
                    className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs font-semibold text-white"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:w-[360px] rounded-2xl border border-white/15 bg-black/45 p-4 space-y-3 shrink-0">
              <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                <span>KASPI × HEYUKA Telemetry Matrix</span>
              </p>
              <div className="text-[11px] text-zinc-300 space-y-1.5">
                <p>• Graphics: {HEYUKA_ARCHITECTURAL_STACK.graphicsEngine.gpuPipeline}</p>
                <p>• Cyber Defense: {HEYUKA_CYBER_DEFENSE_FEEDS.length} Zero-Key DEFCON-1 Feeds</p>
                <p>• Cloud Fleet: {HEYUKA_CLOUD_FLEET_GATEWAYS.length} Gateways (0 Mandatory Keys)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowArsenalDrawer((v) => !v)}
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer transition-colors"
              >
                {showArsenalDrawer
                  ? isAr
                    ? "إخفاء المصفوفة الكاملة (120)"
                    : "Hide 120-Source Registry"
                  : isAr
                  ? "استعراض المصفوفة الكاملة (120 مصدراً)"
                  : "Inspect Full 120-Source Matrix"}
              </button>
            </div>
          </div>

          {showArsenalDrawer && (
            <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
                <h4 className="text-xs font-bold text-emerald-300">
                  100 Cosmic Zero-Key Sources (7 Domains)
                </h4>
                <ul className="space-y-1.5 text-[11px] text-zinc-300">
                  {HEYUKA_COSMIC_DOMAINS.map((d) => (
                    <li key={d.domain}>
                      <span className="font-semibold text-white">{d.domain} ({d.count}):</span>{" "}
                      {d.highlights.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>20 DEFCON-1 Cyber-Defense Feeds</span>
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] text-zinc-300 kaspi-no-scrollbar">
                  {HEYUKA_CYBER_DEFENSE_FEEDS.map((f) => (
                    <div key={f.id} className="truncate">
                      • <span className="text-white">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/45 border border-white/10 space-y-2">
                <h4 className="text-xs font-bold text-sky-300">
                  12 Zero-Key Gateways &amp; 5-Tier Memory
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] text-zinc-300 kaspi-no-scrollbar">
                  {HEYUKA_CLOUD_FLEET_GATEWAYS.map((g) => (
                    <div key={g.id} className="truncate">
                      • <span className="text-white">{g.name}</span> ({g.mode})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: Download & Instant API Key Center (Owned by KASPI) */}
      <section
        id="heyuka-download-center"
        className="rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-10 space-y-8 shadow-2xl"
      >
        <div className="space-y-2">
          <h2 className="text-xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Monitor className="w-6 h-6 text-emerald-400" />
            <span>
              {isAr
                ? "3. مركز تحميل HEYUKA Desktop OS وتوليد مفاتيح KASPI"
                : locale === "fr"
                ? "3. Centre de Téléchargement & Clés API (Propriété KASPI)"
                : "3. HEYUKA Desktop OS Download & API Activation Center (KASPI)"}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            {isAr
              ? "حزمة سطح المكتب المعزولة apps/heyuka-desktop تعمل باستقلالية كاملة عن كاشير KASPI POS وتربط جهازك عبر مفاتيح zx-live الحقيقية."
              : "Standalone Electron + Python desktop package (apps/heyuka-desktop) owned by KASPI — completely decoupled from POS sales registers."}
          </p>
        </div>

        {/* Platform Download Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Windows */}
          <div className="p-6 rounded-2xl border border-emerald-400/35 bg-emerald-500/10 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500 text-black text-[10px] font-bold uppercase">
                Windows 10 / 11 (x64)
              </span>
              <h3 className="text-lg font-extrabold text-white">Auto-Installer + NSIS .exe</h3>
              <p className="text-xs text-zinc-300">
                Electron + PyAutoGUI + UIAutomation + Ghost Cursor + TripoSR (:8188) + Adobe/Blender HUD.
              </p>
            </div>
            <div className="space-y-2">
              <a
                href="/api/v1/heyuka/installer?platform=windows"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Windows Installer (.bat)</span>
              </a>
              <a
                href="/download/exe"
                className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>KASPI Desktop Binary (.exe)</span>
              </a>
            </div>
          </div>

          {/* macOS */}
          <div className="p-6 rounded-2xl border border-white/15 bg-white/[0.04] flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-zinc-200 text-[10px] font-bold uppercase">
                macOS Apple Silicon &amp; Intel
              </span>
              <h3 className="text-lg font-extrabold text-white">Universal DMG / ZIP / MAS</h3>
              <p className="text-xs text-zinc-400">
                Includes macOS Accessibility &amp; Screen Recording Core Sandbox Escape outside Store sandbox.
              </p>
            </div>
            <a
              href="/api/v1/heyuka/installer?platform=macos"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span>macOS Package Spec (DMG)</span>
            </a>
          </div>

          {/* Linux */}
          <div className="p-6 rounded-2xl border border-white/15 bg-white/[0.04] flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-zinc-200 text-[10px] font-bold uppercase">
                Linux Desktop
              </span>
              <h3 className="text-lg font-extrabold text-white">AppImage / Flatpak / Snap</h3>
              <p className="text-xs text-zinc-400">
                Full Python ChromaDB vector store, X11/Wayland automation hooks &amp; Opt-In 100x Node Worker.
              </p>
            </div>
            <a
              href="/api/v1/heyuka/installer?platform=linux"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span>Linux Package Spec (AppImage)</span>
            </a>
          </div>
        </div>

        {/* Instant API Key Generator & KASPI Quickstart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-white/10">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Instant HEYUKA API Key Generator (zx-live-...)</span>
            </h3>

            {!authenticated ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-400/30">
                <div className="flex items-center gap-2 text-xs text-amber-100">
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Sign in to your KASPI tenant account to issue live zx-live keys.</span>
                </div>
                <Link
                  href={`/${locale}/login?from=/${locale}/heyuka`}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold shrink-0 text-center"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateQuickKey} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  placeholder="Key label (e.g. My HEYUKA PC Node)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={keyBusy}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer shrink-0"
                >
                  {keyBusy ? "Creating..." : "Generate zx-live Key"}
                </button>
              </form>
            )}

            {generatedKeyOnce && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-emerald-200 font-bold">
                  <span>Key Created (copied once):</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy("heyuka-key", generatedKeyOnce)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500 text-black cursor-pointer"
                  >
                    {copiedId === "heyuka-key" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === "heyuka-key" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <code className="block text-[11px] font-mono text-white break-all">{generatedKeyOnce}</code>
              </div>
            )}

            <p className="text-[11px] text-zinc-400">
              Owned &amp; operated by <strong>KASPI</strong>. Manage scopes or test 4-App factories inside the{" "}
              <Link href={`/${locale}/zebra-x`} className="text-emerald-400 underline">
                HEYUKA AI Developer Console
              </Link>
              .
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
            <p className="text-xs font-bold text-zinc-300">
              Quickstart: Connect HEYUKA Desktop OS to KASPI Unified API
            </p>
            <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`import { XZebraClient } from "./packages/x-zebra-sdk";
import { getHeyukaDesktopManifest } from "./packages/heyuka-os";

const desktop = getHeyukaDesktopManifest("https://kaspi-pos.vercel.app");
const heyuka = new XZebraClient({ apiKey: "${generatedKeyOnce || "zx-live-YOUR_KEY"}" });
const models = await heyuka.threeD.listAssets({ q: "armchair" });`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HEYUKALandingShowcase;
