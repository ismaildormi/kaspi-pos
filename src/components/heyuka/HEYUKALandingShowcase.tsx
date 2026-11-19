"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Film,
  KeyRound,
  Layers,
  Monitor,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
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
import { HEYUKAGmailAccessCard } from "./HEYUKAGmailAccessCard";

const HEYUKACreatureCanvas = dynamic(
  () => import("./HEYUKACreatureCanvas").then((mod) => mod.HEYUKACreatureCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[380px] sm:h-[440px] rounded-3xl kaspi-glass-surface flex flex-col items-center justify-center gap-3 text-xs text-[var(--kaspi-text-muted)]">
        <div className="w-10 h-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        <span>Initializing Real-Time WebGL2 Spatial Companion...</span>
      </div>
    ),
  }
);

interface KeyRow {
  id: string;
  label: string;
  keyPrefix: string;
  keySuffix: string;
  scopes: string[];
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

type LocaleCode = "ar" | "fr" | "en";

interface CinemaScene {
  id: string;
  image: string;
  tag: Record<LocaleCode, string>;
  title: Record<LocaleCode, string>;
  caption: Record<LocaleCode, string>;
  metric: string;
}

const CINEMA_SCENES: readonly CinemaScene[] = [
  {
    id: "swarm-stage",
    image: "/heyuka/showcase/hero-3d-swarm.png",
    tag: {
      ar: "المشهد 01 • الفضاء التفاعلي",
      fr: "SCÈNE 01 • INTERFACE SPATIALE",
      en: "SCENE 01 • SPATIAL COMPANION",
    },
    title: {
      ar: "بيئة سطح مكتب ثلاثية الأبعاد تستجيب لحركتك وصوتك",
      fr: "Un environnement 3D vivant synchronisé à votre flux de travail",
      en: "A Living 3D Workspace Companion Synchronized to Your Flow",
    },
    caption: {
      ar: "محرك رسومي مباشر بسرعة 60 إطاراً في الثانية يجمع بين الرفيق الذكي وتنفيذ المهام المتزامنة بسلاسة.",
      fr: "Moteur WebGL2 60 FPS combinant présence interactive et exécution multimodale instantanée.",
      en: "Real-time 60 FPS fur physics and interactive desktop intelligence built for continuous creative flow.",
    },
    metric: "60 FPS WebGL2 + Spatial Raycast",
  },
  {
    id: "companion-action",
    image: "/heyuka/showcase/companion-action.png",
    tag: {
      ar: "المشهد 02 • المساعدة المباشرة",
      fr: "SCÈNE 02 • ASSISTANCE DIRECTE",
      en: "SCENE 02 • CONTEXTUAL ACTION",
    },
    title: {
      ar: "قراءة الشاشة، فهم السياق، وتوليد الحلول فوراً",
      fr: "Compréhension contextuelle de l'écran et réponse immédiate",
      en: "Contextual Awareness Across Code, Design & Operations",
    },
    caption: {
      ar: "يتفاعل HEYUKA مع نوافذك وملفاتك وأوامرك الصوتية دون تشتيت الانتباه، محافظاً على عزل البيانات الكامل.",
      fr: "Interagit naturellement avec vos projets tout en gardant chaque locataire isolé et chiffré.",
      en: "Assisting directly across files, live voice dialogue, and studio pipelines inside isolated tenant vaults.",
    },
    metric: "Multimodal Voice + Vision Context",
  },
  {
    id: "serverless-fleet",
    image: "/heyuka/showcase/serverless-fleet.png",
    tag: {
      ar: "المشهد 03 • البنية السحابية",
      fr: "SCÈNE 03 • INFRASTRUCTURE",
      en: "SCENE 03 • CLOUD & EDGE FLEET",
    },
    title: {
      ar: "استدلال سحابي متوازي وزمن استجابة شبه معدوم",
      fr: "Inférence parallèle distribuée à latence quasi nulle",
      en: "Distributed Cloud Inference & Real-Time API Streaming",
    },
    caption: {
      ar: "معمارية API قياسية متوافقة مع منظومة OpenAI تدعم البث المباشر والتوسع التلقائي للمشاريع.",
      fr: "API standard compatible OpenAI conçue pour le streaming temps réel et la haute disponibilité.",
      en: "OpenAI-compatible unified API fabric engineered for sub-second streaming and enterprise scale.",
    },
    metric: "REST + SSE + X-API-Key-Id Auth",
  },
  {
    id: "unified-sources",
    image: "/heyuka/showcase/multiplied-sources.png",
    tag: {
      ar: "المشهد 04 • المعرفة الموحدة",
      fr: "SCÈNE 04 • SYNTHÈSE GLOBALE",
      en: "SCENE 04 • UNIFIED INTELLIGENCE",
    },
    title: {
      ar: "من التفكير العميق إلى الإنتاج الإبداعي في نواة واحدة",
      fr: "Du raisonnement profond à la création multimédia unifiée",
      en: "Deep Reasoning Meets Visual, 3D & Audio Synthesis",
    },
    caption: {
      ar: "دمج متناغم لقدرات الكود، النصوص، الصور بدقة عالية، والمجسمات ثلاثية الأبعاد تحت واجهة مطورين واحدة.",
      fr: "Code, texte, vision HD et génération 3D réunis sous une interface développeur cohérente.",
      en: "Reasoning, code generation, transparent vision cutouts, and 3D assets unified under one SDK.",
    },
    metric: "heyuka-omni • 128K Context",
  },
];

interface EditorialChapter {
  num: string;
  tag: Record<LocaleCode, string>;
  headline: Record<LocaleCode, string>;
  prose: Record<LocaleCode, string>;
  detail: Record<LocaleCode, string>;
}

const EDITORIAL_PROSE: readonly EditorialChapter[] = [
  {
    num: "01",
    tag: { ar: "الهوية والرؤية", fr: "IDENTITÉ & VISION", en: "IDENTITY & VISION" },
    headline: {
      ar: "ذكاء اصطناعي لا يكتفي بالرد… بل يشاركك مساحة العمل",
      fr: "Une intelligence qui ne se contente pas de répondre — elle vit dans votre espace",
      en: "Intelligence that moves beyond text boxes into your workspace",
    },
    prose: {
      ar: "لم يُصمم HEYUKA ليكون مجرد نافذة دردشة عادية؛ إنه نواة ذكية مطورة من طرف KASPI تجمع بين القوة التحليلية للنموذج السيادي وبين حضور بصري وصوتي تفاعلي يرافق المبدعين والمطورين لحظة بلحظة.",
      fr: "HEYUKA dépasse le modèle figé des chatbots classiques : c'est un noyau souverain conçu par KASPI alliant profondeur analytique et compagnon spatial 3D interactif.",
      en: "Rather than trapping intelligence inside static chat boxes, KASPI engineered HEYUKA as both a developer platform and an expressive spatial desktop companion.",
    },
    detail: {
      ar: "توليد الكود، الاستدلال المتعدد، قراءة المستندات، وتفاعل مباشر بالدارجة والعربية والفرنسية والإنجليزية.",
      fr: "Code propre, raisonnement structuré, synthèse documentaire et fluidité multilingue naturelle.",
      en: "Clean architecture, deep code generation, structured analysis, and effortless multilingual fluency.",
    },
  },
  {
    num: "02",
    tag: { ar: "المطورون والـ IPK", fr: "API & SÉCURITÉ", en: "DEVELOPER API" },
    headline: {
      ar: "مفاتيح API حقيقية ومستقلة في ثوانٍ عبر بريدك فقط",
      fr: "Clés API uniques & hachées en quelques secondes via simple Gmail",
      en: "Cryptographically unique API Keys & Key IDs with zero friction",
    },
    prose: {
      ar: "كل مستخدم يحصل على مفتاح سري فريد خاص بتطبيقه (`hk-live-...`) مع معرف مفتاح مستقل (`X-API-Key-Id`) وتجزئة أمنية معيارية، دون الحاجة لتسجيل متجر أو خطوات معقدة.",
      fr: "Chaque clé générée est unique (hk-live-...), hachée en SHA-256 et accompagnée de son identifiant X-API-Key-Id dédié pour vos applications.",
      en: "Every issued secret (`hk-live-...`) is unique, SHA-256 hashed at rest, paired with a dedicated `X-API-Key-Id`, and ready via Gmail without store onboarding.",
    },
    detail: {
      ar: "متوافق تماماً مع مكتبات OpenAI الرسمية في Node.js و Python و REST cURL بدون تغيير الكود الأساسي.",
      fr: "100% compatible avec les SDK officiels OpenAI en Node.js, Python et cURL.",
      en: "Drop-in OpenAI SDK compatibility across Node.js, Python, and standard REST clients.",
    },
  },
  {
    num: "03",
    tag: { ar: "التطبيق المكتبي", fr: "APPLICATION BUREAU", en: "NATIVE DESKTOP APP" },
    headline: {
      ar: "حزمة HEYUKA الحقيقية الكاملة جاهزة للتحميل والتشغيل",
      fr: "Téléchargez le véritable package complet HEYUKA Desktop Studio",
      en: "Authentic Electron + Python + 3D Studio desktop bundle ready now",
    },
    prose: {
      ar: "نوفر الحزمة المصدرية والتشغيلية الكاملة لتطبيق سطح المكتب المدمج مع محرك الفراء 3D ونواة التشغيل المحلية، مع مسارات بناء أصلية لـ Windows و macOS و Linux.",
      fr: "Accédez directement à l'archive complète de l'application desktop avec rendu 3D temps réel et passerelle API intégrée.",
      en: "Download the complete verified desktop package (`HEYUKA-Desktop-App.zip`) featuring the Electron shell, 3D companion renderer, and API runtime.",
    },
    detail: {
      ar: "شفافية تامة في الإصدارات: الحزمة الكاملة متاحة مباشرة الآن مع تتبع حي لحالة التشغيل في لوحة Debug.",
      fr: "Transparence totale des builds, connectivité vérifiée en temps réel dans le Live Debugger.",
      en: "Zero stubs or placeholders — real bundle delivery alongside automated multi-OS release builds.",
    },
  },
  {
    num: "04",
    tag: { ar: "عالم الشخصيات 3D", fr: "32 COMPAGNONS 3D", en: "32 INTERACTIVE FORMS" },
    headline: {
      ar: "32 شخصية تفاعلية بفيزياء WebGL2 والإضاءة المحيطية",
      fr: "32 personnalités sculpturales avec physique temps réel WebGL2",
      en: "32 expressively sculpted 3D companions driven by WebGL2 fur physics",
    },
    prose: {
      ar: "تبديل فوري بين شخصيات متنوعة من الأبطال والعناصر الطبيعية إلى الرفاق الكلاسيكيين، مع إمكانية التفاعل باللمس أو الماوس وتخصيص الإضاءة في أي وقت.",
      fr: "Changez instantanément d'avatar, ajustez les studios lumineux et interagissez directement au curseur à 60 images par seconde.",
      en: "Switch seamlessly between classic crowned companions, elemental titans, and futuristic avatars with dynamic softbox lighting.",
    },
    detail: {
      ar: "مصمم ليعمل بسلاسة داخل المتصفح وعلى سطح المكتب بتناغم كامل مع الوضعين النهاري والليلي.",
      fr: "Optimisé pour le navigateur comme pour le desktop, en mode clair ou sombre.",
      en: "Adapts cleanly across browser and native desktop viewports in light or dark glass themes.",
    },
  },
];

const KINETIC_RAIL_TOP = [
  "heyuka-omni • 128K Context",
  "60 FPS WebGL2 Fur Companion",
  "SHA-256 Unique IPK + Key ID",
  "OpenAI SDK Drop-In Protocol",
  "Instant Gmail Developer Access",
  "Electron + Python Desktop Bundle",
];

const KINETIC_RAIL_BOTTOM = [
  "Multilingual Darija / AR / FR / EN",
  "Transparent Studio Vision Tools",
  "Real-Time Streaming SSE Gateway",
  "Zero-Latency Tenant Isolation",
  "32 Interactive 3D Personas",
  "Owned & Engineered by KASPI",
];

export function HEYUKALandingShowcase() {
  const rawLocale = useLocale();
  const locale: LocaleCode =
    rawLocale === "ar" ? "ar" : rawLocale === "fr" ? "fr" : "en";
  const isAr = locale === "ar";

  const rootRef = useRef<HTMLDivElement | null>(null);
  const kineticBandRef = useRef<HTMLElement | null>(null);

  // Ambient spatial spotlight tracking cursor cleanly without fixed fullscreen overlay
  const cursorX = useMotionValue(-400);
  const cursorY = useMotionValue(-400);
  const smoothX = useSpring(cursorX, { stiffness: 180, damping: 28 });
  const smoothY = useSpring(cursorY, { stiffness: 180, damping: 28 });

  const { scrollYProgress } = useScroll({
    target: kineticBandRef,
    offset: ["start end", "end start"],
  });
  const railLeftRaw = useTransform(scrollYProgress, [0, 1], [-56, 56]);
  const railRightRaw = useTransform(scrollYProgress, [0, 1], [56, -56]);
  const railLeft = useSpring(railLeftRaw, { stiffness: 120, damping: 24 });
  const railRight = useSpring(railRightRaw, { stiffness: 120, damping: 24 });

  const [selectedCharId, setSelectedCharId] = useState("classic_heyuka");
  const [selectedLightingId, setSelectedLightingId] = useState("studio");
  const [activeCategory, setActiveCategory] = useState<
    HeyukaCharacterCategory | "all"
  >("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [boopCount, setBoopCount] = useState(0);

  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [cinemaPlaying, setCinemaPlaying] = useState(true);
  const [activeProseIdx, setActiveProseIdx] = useState(0);

  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  const [authenticated, setAuthenticated] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [issuedKeys, setIssuedKeys] = useState<KeyRow[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [generatedKeyOnce, setGeneratedKeyOnce] = useState<string | null>(null);
  const [generatedKeyId, setGeneratedKeyId] = useState<string | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    cursorX.set(e.clientX - rect.left);
    cursorY.set(e.clientY - rect.top);
  };

  const loadAccountKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/zebra-x/keys", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setAuthenticated(Boolean(json?.authenticated));
      setAccountEmail(json?.userEmail || null);
      setIssuedKeys(Array.isArray(json?.keys) ? json.keys : []);
    } catch {}
  }, []);

  useEffect(() => {
    loadAccountKeys();
  }, [loadAccountKeys]);

  useEffect(() => {
    if (!cinemaPlaying) return;
    const timer = setInterval(() => {
      setActiveSceneIdx((prev) => (prev + 1) % CINEMA_SCENES.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [cinemaPlaying]);

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
    return HEYUKA_CHARACTER_PROFILES.filter(
      (c) => c.category === activeCategory
    );
  }, [activeCategory]);

  const handleCopy = async (id: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedId(id);
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1800);
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
          label: newKeyLabel.trim() || `HEYUKA Key #${issuedKeys.length + 1}`,
          tokenPrefix: "hk-live",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setGeneratedKeyOnce(json.secretKeyOnce);
        setGeneratedKeyId(json.keyId || json.key?.id || null);
        setNewKeyLabel("");
        await loadAccountKeys();
      } else {
        setKeyError(json?.error || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      setKeyError(err?.message || "Network error");
    } finally {
      setKeyBusy(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const res = await fetch(
        `/api/v1/zebra-x/keys?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (res.ok) await loadAccountKeys();
    } catch {}
  };

  const activeScene = CINEMA_SCENES[activeSceneIdx];
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
    { role: "user", content: "Prepare a clear executive strategy brief." },
  ],
});
console.log(completion.choices[0].message.content);`;

  return (
    <div
      ref={rootRef}
      onPointerMove={handlePointerMove}
      dir={isAr ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-x-clip pb-24"
    >
      {/* Interactive Cursor Glow Spotlight */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full opacity-25 blur-3xl z-0"
        style={{
          x: smoothX,
          y: smoothY,
          background:
            "radial-gradient(circle, rgba(225,29,72,0.28) 0%, rgba(56,189,248,0.12) 45%, transparent 72%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-24">
        {/* HERO: Spatial Typographic Opening + Live 3D Companion */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
        >
          <div className="lg:col-span-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-bold text-rose-500">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HEYUKA 2026–2050 • BY KASPI</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full kaspi-frosted-surface text-[11px] font-mono text-[var(--kaspi-text-secondary)]">
                Desktop App • 32 3D Personas • Unique IPK
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-[var(--kaspi-text-primary)]">
              {isAr
                ? "الذكاء الحي. على مكتبك وفي تطبيقاتك."
                : locale === "fr"
                ? "L'Intelligence Spatiale. Bureau & API."
                : "Living Intelligence. Desktop & Developer API."}
            </h1>

            <p className="text-base sm:text-lg text-[var(--kaspi-text-secondary)] leading-relaxed max-w-xl">
              {isAr
                ? "منظومة ذكاء اصطناعي متعددة الوسائط تدمج الرفيق ثلاثي الأبعاد التفاعلي مع بوابة مفاتيح API فريدة ومستقلة للمطورين والشركات — مصممة بأسلوب مستقبلي متناغم باللغات العربية والدارجة والفرنسية والإنجليزية."
                : locale === "fr"
                ? "Une intelligence artificielle multimodale unifiée combinant compagnon 3D interactif 60 FPS, application bureau native et passerelle API cryptographique compatible OpenAI."
                : "Unified multimodal AI engineered by KASPI — uniting an interactive 60 FPS desktop companion, native workspace tools, and OpenAI-compatible cryptographic API Keys."}
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href={`/${locale}/chat`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-extrabold transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isAr
                    ? "ابدا المحادثة مجانا (HEYUKA Chat)"
                    : locale === "fr"
                    ? "Discuter gratuitement (HEYUKA)"
                    : "Start HEYUKA Chat (Free)"}
                </span>
              </Link>

              <a
                href="/api/v1/heyuka/installer?platform=desktop_zip"
                download="HEYUKA-Desktop-App.zip"
                className="kaspi-glass-btn inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold"
              >
                <Download className="w-4 h-4 text-rose-500" />
                <span>
                  {isAr
                    ? "تحميل تطبيق HEYUKA الكامل (.zip)"
                    : locale === "fr"
                    ? "Télécharger HEYUKA Desktop (.zip)"
                    : "Download HEYUKA Desktop (.zip)"}
                </span>
              </a>

              <a
                href="#heyuka-api-keys"
                className="kaspi-glass-btn inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold"
              >
                <KeyRound className="w-4 h-4 text-rose-500" />
                <span>
                  {isAr
                    ? "الحصول على مفتاح API عبر Gmail"
                    : locale === "fr"
                    ? "Obtenir Clé API (Gmail)"
                    : "Get Unique API Key (Gmail)"}
                </span>
              </a>

              <button
                type="button"
                onClick={() => setWalkthroughOpen(true)}
                className="kaspi-glass-btn inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer"
              >
                <Layers className="w-4 h-4 text-rose-500" />
                <span>
                  {isAr
                    ? "مراحل التثبيت الكاملة"
                    : locale === "fr"
                    ? "Étapes d'Installation"
                    : "All Setup Stages"}
                </span>
              </button>
            </div>
          </div>

          {/* Interactive 3D Companion Viewport */}
          <div className="lg:col-span-6">
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl kaspi-glass-card kaspi-polar-aurora-orbit p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[10px] font-bold uppercase text-rose-500">
                    {activeCharacter.badge}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--kaspi-text-muted)]">
                    WebGL2 • 60 FPS
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSoundEnabled((v) => !v)}
                    className="kaspi-glass-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-[var(--kaspi-text-muted)]" />
                    )}
                    <span>{soundEnabled ? "FX" : "Muted"}</span>
                  </button>
                  <span className="px-2.5 py-1 rounded-lg kaspi-frosted-surface text-[11px] font-mono text-[var(--kaspi-text-primary)]">
                    Boops: {boopCount}
                  </span>
                </div>
              </div>

              <HEYUKACreatureCanvas
                character={activeCharacter}
                lighting={activeLighting}
                soundEnabled={soundEnabled}
                onBoop={() => setBoopCount((c) => c + 1)}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="text-base font-extrabold text-[var(--kaspi-text-primary)]">
                    {activeCharacter.name}
                  </h2>
                  <p className="text-xs text-[var(--kaspi-text-muted)]">
                    {activeCharacter.tagline}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HEYUKA_LIGHTING_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedLightingId(preset.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors ${
                        selectedLightingId === preset.id
                          ? "kaspi-orbit-active text-rose-500 font-bold"
                          : "kaspi-glass-surface text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* SECTION 1: Scroll-Driven Left <-> Right Kinetic Showcase Rails */}
        <section
          ref={kineticBandRef}
          className="overflow-hidden py-8 border-y border-[var(--kaspi-border)] space-y-4"
        >
          <motion.div
            style={{ x: railLeft }}
            className="flex items-center gap-4 whitespace-nowrap will-change-transform"
          >
            {KINETIC_RAIL_TOP.concat(KINETIC_RAIL_TOP).map((item, i) => (
              <span
                key={`top-${i}`}
                className="px-4 py-2 rounded-full kaspi-frosted-surface text-xs sm:text-sm font-bold text-[var(--kaspi-text-primary)] shrink-0"
              >
                {item}
              </span>
            ))}
          </motion.div>

          <motion.div
            style={{ x: railRight }}
            className="flex items-center gap-4 whitespace-nowrap will-change-transform"
          >
            {KINETIC_RAIL_BOTTOM.concat(KINETIC_RAIL_BOTTOM).map((item, i) => (
              <span
                key={`bot-${i}`}
                className="px-4 py-2 rounded-full kaspi-glass-surface text-xs sm:text-sm font-semibold text-rose-500 shrink-0"
              >
                {item}
              </span>
            ))}
          </motion.div>
        </section>

        {/* SECTION 2: HEYUKA Animated Product Cinema Reel */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-rose-500 font-bold">
                <Film className="w-3.5 h-3.5" />
                <span>{isAr ? "عرض بصري حي" : "LIVE PRODUCT REEL"}</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[var(--kaspi-text-primary)]">
                {isAr
                  ? "شاهد منظومة HEYUKA أثناء العمل"
                  : locale === "fr"
                  ? "HEYUKA en Action — Séquences Réelles"
                  : "Inside HEYUKA — Interactive Launch Reel"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveSceneIdx(
                    (i) => (i - 1 + CINEMA_SCENES.length) % CINEMA_SCENES.length
                  )
                }
                aria-label="Previous scene"
                className="kaspi-glass-btn p-2.5 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCinemaPlaying((p) => !p)}
                className="kaspi-glass-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                {cinemaPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>{cinemaPlaying ? (isAr ? "إيقاف مؤقت" : "Auto Reel") : isAr ? "تشغيل" : "Paused"}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveSceneIdx((i) => (i + 1) % CINEMA_SCENES.length)
                }
                aria-label="Next scene"
                className="kaspi-glass-btn p-2.5 rounded-xl cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl kaspi-glass-card overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 relative aspect-[16/10] overflow-hidden kaspi-frosted-surface">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeScene.id}
                  src={activeScene.image}
                  alt={activeScene.title[locale]}
                  initial={{ opacity: 0, scale: 1.07 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 px-3 py-2 rounded-2xl kaspi-glass-surface">
                <span className="text-[11px] font-mono text-rose-500 font-bold">
                  {activeScene.metric}
                </span>
                <div className="flex items-center gap-1.5">
                  {CINEMA_SCENES.map((sc, idx) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setActiveSceneIdx(idx);
                        setCinemaPlaying(false);
                      }}
                      aria-label={sc.tag[locale]}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === activeSceneIdx
                          ? "w-8 bg-rose-500"
                          : "w-2.5 bg-[var(--kaspi-border)] hover:bg-rose-500/60"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScene.id}
                  initial={{ opacity: 0, x: isAr ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isAr ? 16 : -16 }}
                  transition={{ duration: 0.45 }}
                  className="space-y-4"
                >
                  <span className="text-[11px] font-mono font-bold text-rose-500">
                    {activeScene.tag[locale]}
                  </span>
                  <h3 className="text-2xl font-black text-[var(--kaspi-text-primary)] leading-snug">
                    {activeScene.title[locale]}
                  </h3>
                  <p className="text-sm text-[var(--kaspi-text-secondary)] leading-relaxed">
                    {activeScene.caption[locale]}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[var(--kaspi-border)]">
                {CINEMA_SCENES.map((sc, idx) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setActiveSceneIdx(idx);
                      setCinemaPlaying(false);
                    }}
                    className={`p-2.5 rounded-xl text-start text-[11px] font-semibold transition-all cursor-pointer ${
                      idx === activeSceneIdx
                        ? "kaspi-orbit-active text-rose-500"
                        : "kaspi-frosted-surface text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)]"
                    }`}
                  >
                    {sc.tag[locale]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Hover-Reveal Editorial Writing (Pure Prose Style — No Static Boxy Cards) */}
        <section className="space-y-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-rose-500 font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? "فلسفة التصميم والهندسة — مرر المؤشر للاستكشاف"
                  : locale === "fr"
                  ? "ARCHITECTURE NARRATIVE — SURVOLEZ POUR EXPLORER"
                  : "ARCHITECTURAL MANIFESTO — HOVER TO EXPLORE"}
              </span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[var(--kaspi-text-primary)]">
              {isAr
                ? "قراءة مفتوحة لما تقدمه منظومة HEYUKA"
                : locale === "fr"
                ? "Ce que HEYUKA change concrètement pour vos projets"
                : "Why HEYUKA Redefines Desktop & Developer AI"}
            </h2>
          </div>

          <div className="divide-y divide-[var(--kaspi-border)] border-y border-[var(--kaspi-border)]">
            {EDITORIAL_PROSE.map((chapter, idx) => {
              const isActive = activeProseIdx === idx;
              return (
                <motion.div
                  key={chapter.num}
                  onMouseEnter={() => setActiveProseIdx(idx)}
                  onClick={() => setActiveProseIdx(idx)}
                  className="group py-7 sm:py-9 px-2 sm:px-4 transition-colors cursor-pointer relative"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
                    <div className="lg:col-span-4 flex items-baseline gap-4">
                      <span
                        className={`text-sm font-mono font-black transition-colors ${
                          isActive
                            ? "text-rose-500"
                            : "text-[var(--kaspi-text-muted)]"
                        }`}
                      >
                        {chapter.num}
                      </span>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-500 font-bold block">
                          {chapter.tag[locale]}
                        </span>
                        <h3 className="text-lg sm:text-xl font-extrabold text-[var(--kaspi-text-primary)] leading-snug">
                          {chapter.headline[locale]}
                        </h3>
                      </div>
                    </div>

                    <div className="lg:col-span-8 space-y-2.5">
                      <p className="text-sm sm:text-base text-[var(--kaspi-text-secondary)] leading-relaxed">
                        {chapter.prose[locale]}
                      </p>
                      <motion.p
                        initial={false}
                        animate={{
                          opacity: isActive ? 1 : 0.45,
                          x: isActive ? 0 : isAr ? 6 : -6,
                        }}
                        transition={{ duration: 0.28 }}
                        className="text-xs sm:text-sm font-semibold text-rose-500 flex items-center gap-2"
                      >
                        <ArrowUpRight className="w-4 h-4 shrink-0" />
                        <span>{chapter.detail[locale]}</span>
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: 32 Authentic 3D Character Switcher */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--kaspi-text-primary)] flex items-center gap-2.5">
                <Wand2 className="w-6 h-6 text-rose-500" />
                <span>
                  {isAr
                    ? "مكتبة الرفاق التفاعليين (32 شخصية WebGL2)"
                    : locale === "fr"
                    ? "Les 32 Compagnons 3D Interactifs"
                    : "Choose From 32 Sculpted 3D Companions"}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--kaspi-text-muted)] mt-1">
                {isAr
                  ? "اختر أي شخصية لتحديث العرض ثلاثي الأبعاد في الأعلى مباشرة بنفس المحرك الأصلي."
                  : "Click any profile to morph the live WebGL2 companion in the Hero viewport immediately."}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
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
                      ? "kaspi-orbit-active text-rose-500"
                      : "kaspi-glass-surface text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredCharacters.map((char) => {
              const isSelected = char.id === selectedCharId;
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => setSelectedCharId(char.id)}
                  className={`p-3 rounded-2xl text-start transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "kaspi-orbit-active scale-[1.02]"
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
                  <p className="text-xs font-bold text-[var(--kaspi-text-primary)] truncate">
                    {char.name}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 5: Real Desktop App Download Center + Direct Gmail API Key Studio */}
        <section
          id="heyuka-download-center"
          className="rounded-3xl kaspi-glass-card kaspi-polar-aurora-orbit relative p-6 sm:p-10 space-y-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--kaspi-text-primary)] flex items-center gap-2.5">
                <Monitor className="w-6 h-6 text-rose-500" />
                <span>
                  {isAr
                    ? "تحميل تطبيق HEYUKA وتوليد مفاتيح الـ API عبر Gmail"
                    : locale === "fr"
                    ? "Télécharger HEYUKA Desktop & Générer Vos Clés API via Gmail"
                    : "Download Complete HEYUKA App & Mint Unique API Keys"}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--kaspi-text-muted)]">
                {isAr
                  ? "حمّل الحزمة الكاملة الأصلية لسطح المكتب (Electron + Python + محرك 3D)، أو ادخل بـ Gmail فقط للحصول على مفتاح API حقيقي دون الحاجة لحساب متجر POS."
                  : "Download the authentic HEYUKA Desktop Bundle directly, or verify your Gmail below to generate unique API Keys with no POS store signup."}
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
                  ? "عرض مراحل التحميل والربط"
                  : locale === "fr"
                  ? "Étapes d'Installation Complètes"
                  : "Open 4-Stage Setup Guide"}
              </span>
            </button>
          </div>

          {/* Real Bundle Download + Multi-OS Targets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Primary Real Bundle */}
            <div className="p-6 rounded-2xl kaspi-frosted-surface flex flex-col justify-between gap-4 border border-rose-500/25">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-rose-500 text-[10px] font-bold uppercase">
                  Complete Studio Bundle (.zip)
                </span>
                <h3 className="text-lg font-extrabold text-[var(--kaspi-text-primary)]">
                  HEYUKA Desktop App (Full)
                </h3>
                <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
                  {isAr
                    ? "الحزمة الأصلية الكاملة لتطبيق سطح المكتب (واجهة 3D + Electron + Python Core) جاهزة للتشغيل الفوري."
                    : "The complete authentic Electron + Python + WebGL2 3D Fur Desktop source & runtime archive."}
                </p>
              </div>
              <div className="space-y-2">
                <a
                  href="/api/v1/heyuka/installer?platform=desktop_zip"
                  download="HEYUKA-Desktop-App.zip"
                  className="kaspi-primary-cta-btn w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isAr
                      ? "تحميل التطبيق الكامل (727 KB .zip)"
                      : "Download Full Bundle (.zip)"}
                  </span>
                </a>
                <a
                  href="/api/v1/heyuka/installer?platform=windows"
                  className="kaspi-glass-btn w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Windows Quick Launcher (.bat)</span>
                </a>
              </div>
            </div>

            {/* Windows / macOS Native CI Builds */}
            <div className="p-6 rounded-2xl kaspi-frosted-surface flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[var(--kaspi-text-secondary)] text-[10px] font-bold uppercase">
                  Windows (.exe) &amp; macOS (.dmg)
                </span>
                <h3 className="text-lg font-extrabold text-[var(--kaspi-text-primary)]">
                  Compiled OS Releases
                </h3>
                <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
                  {isAr
                    ? "بناء ثنائي مؤتمت لنظامي Windows و macOS عبر GitHub Actions عند إطلاق كل نسخة جديدة."
                    : "Automated native installers (.exe NSIS & macOS Universal DMG) published via GitHub Actions matrix."}
                </p>
              </div>
              <div className="space-y-2">
                <a
                  href="/download/exe"
                  className="kaspi-glass-btn w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-rose-500" />
                  <span>Windows Release (.exe)</span>
                </a>
                <a
                  href="/api/v1/heyuka/installer?platform=macos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kaspi-glass-btn w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>macOS Manifest (DMG)</span>
                </a>
              </div>
            </div>

            {/* Linux */}
            <div className="p-6 rounded-2xl kaspi-frosted-surface flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[var(--kaspi-text-secondary)] text-[10px] font-bold uppercase">
                  Linux x64 / AppImage
                </span>
                <h3 className="text-lg font-extrabold text-[var(--kaspi-text-primary)]">
                  AppImage / Tarball
                </h3>
                <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
                  {isAr
                    ? "متوافق مع Ubuntu و Debian و Fedora و Arch مع تشغيل خفيف ومعزول."
                    : "Portable desktop packaging for Ubuntu, Fedora, Debian & Arch workstations."}
                </p>
              </div>
              <a
                href="/api/v1/heyuka/installer?platform=linux"
                target="_blank"
                rel="noopener noreferrer"
                className="kaspi-glass-btn w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
              >
                <Terminal className="w-4 h-4" />
                <span>Linux Package Spec (AppImage)</span>
              </a>
            </div>
          </div>

          {/* API Keys & Gmail Direct Access */}
          <div
            id="heyuka-api-keys"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-[var(--kaspi-border)]"
          >
            <div className="p-6 rounded-2xl kaspi-frosted-surface space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[var(--kaspi-text-primary)] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-rose-500" />
                  <span>
                    {isAr
                      ? "توليد مفتاح API فريد حقيقي (IPK)"
                      : "Create Unique API Key & Key ID"}
                  </span>
                </h3>
                <Link
                  href={`/${locale}/zebra-x/debug`}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  {isAr ? "فاحص Debug الحي" : "Live Debugger"}
                </Link>
              </div>

              {!authenticated ? (
                <HEYUKAGmailAccessCard
                  locale={locale}
                  onAuthenticated={loadAccountKeys}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl kaspi-glass-surface text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-rose-500">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{accountEmail || "Authenticated"}</span>
                    </span>
                    <span className="font-mono text-[11px] text-[var(--kaspi-text-muted)]">
                      {issuedKeys.length} active keys
                    </span>
                  </div>

                  <form
                    onSubmit={handleCreateQuickKey}
                    className="flex flex-col sm:flex-row gap-2.5"
                  >
                    <input
                      type="text"
                      value={newKeyLabel}
                      onChange={(e) => setNewKeyLabel(e.target.value)}
                      placeholder={
                        isAr
                          ? "اسم المشروع أو التطبيق..."
                          : "Application label (e.g. Production Bot)"
                      }
                      className="flex-1 px-3.5 py-2.5 rounded-xl kaspi-glass-surface text-xs text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={keyBusy}
                      className="kaspi-primary-cta-btn inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {keyBusy
                          ? "..."
                          : isAr
                          ? "توليد مفتاح جديد"
                          : "Create Unique Key"}
                      </span>
                    </button>
                  </form>
                </div>
              )}

              {keyError && (
                <p className="text-xs text-rose-500 kaspi-glass-surface rounded-xl p-2.5">
                  {keyError}
                </p>
              )}

              {generatedKeyOnce && (
                <div className="p-4 rounded-xl kaspi-glass-surface space-y-3 border border-rose-500/30">
                  {generatedKeyId && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[var(--kaspi-text-secondary)] font-semibold">
                        <span>Key ID (X-API-Key-Id):</span>
                        <button
                          type="button"
                          onClick={() =>
                            void handleCopy("heyuka-key-id", generatedKeyId)
                          }
                          className="kaspi-glass-btn inline-flex items-center gap-1 px-2.5 py-0.5 rounded cursor-pointer"
                        >
                          {copiedId === "heyuka-key-id" ? (
                            <Check className="w-3 h-3 text-rose-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>
                            {copiedId === "heyuka-key-id"
                              ? "Copied"
                              : "Copy ID"}
                          </span>
                        </button>
                      </div>
                      <code
                        dir="ltr"
                        className="block text-[11px] font-mono text-amber-500 break-all select-all"
                      >
                        {generatedKeyId}
                      </code>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[var(--kaspi-text-secondary)] font-semibold">
                      <span>Secret API Key (shown once):</span>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy("heyuka-secret", generatedKeyOnce)
                        }
                        className="kaspi-glass-btn inline-flex items-center gap-1 px-2.5 py-0.5 rounded cursor-pointer"
                      >
                        {copiedId === "heyuka-secret" ? (
                          <Check className="w-3 h-3 text-rose-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>
                          {copiedId === "heyuka-secret" ? "Copied" : "Copy Key"}
                        </span>
                      </button>
                    </div>
                    <code
                      dir="ltr"
                      className="block text-[11px] font-mono text-rose-500 break-all select-all"
                    >
                      {generatedKeyOnce}
                    </code>
                  </div>
                </div>
              )}

              {authenticated && issuedKeys.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold text-[var(--kaspi-text-secondary)]">
                    {isAr ? "مفاتيحك النشطة:" : "Your Issued Keys:"}
                  </p>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto kaspi-no-scrollbar">
                    {issuedKeys.map((k) => (
                      <div
                        key={k.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl kaspi-glass-surface text-[11px]"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[var(--kaspi-text-primary)] truncate">
                            {k.label}
                          </p>
                          <p
                            dir="ltr"
                            className="font-mono text-[10px] text-[var(--kaspi-text-muted)] truncate"
                          >
                            {k.keyPrefix}•••{k.keySuffix} · ID: {k.id}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRevokeKey(k.id)}
                          aria-label="Revoke key"
                          className="kaspi-glass-btn p-1.5 rounded-lg text-rose-500 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SDK Quickstart Block */}
            <div className="p-6 rounded-2xl kaspi-frosted-surface flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[var(--kaspi-text-primary)] flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-rose-500" />
                    <span>OpenAI-Compatible Quickstart SDK</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopy("heyuka-sdk", quickstartCode)}
                    className="kaspi-glass-btn inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    {copiedId === "heyuka-sdk" ? (
                      <Check className="w-3 h-3 text-rose-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === "heyuka-sdk" ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <pre
                  dir="ltr"
                  className="p-4 rounded-xl kaspi-glass-surface text-[11px] font-mono text-[var(--kaspi-text-primary)] overflow-x-auto leading-relaxed whitespace-pre-wrap"
                >
                  {quickstartCode}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--kaspi-border)] text-xs">
                <Link
                  href={`/${locale}/zebra-x`}
                  className="font-bold text-rose-500 hover:underline inline-flex items-center gap-1"
                >
                  <span>
                    {isAr ? "فتح لوحة المطورين الكاملة" : "Open Developer Console"}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <span className="font-mono text-[11px] text-[var(--kaspi-text-muted)]">
                  POST /api/v1/chat/completions
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <HEYUKAInstallWalkthrough
        isOpen={walkthroughOpen}
        onClose={() => setWalkthroughOpen(false)}
        locale={locale}
        activeSecretKey={generatedKeyOnce || undefined}
        activeKeyId={generatedKeyId || undefined}
      />
    </div>
  );
}
