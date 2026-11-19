"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Box,
  Check,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  Eye,
  FileAudio,
  KeyRound,
  Lock,
  Mic,
  Play,
  Plus,
  RefreshCw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Workflow,
} from "lucide-react";

interface ApiKeyMeta {
  id: string;
  label: string;
  prefix: string;
  last4: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
}

type RecipeAppId = "remove-bg" | "3d-blender" | "transcribe" | "separate";
type CodeLang = "javascript" | "python" | "curl";

const PORTAL_I18N = {
  ar: {
    badge: "منصة HEYUKA المستقلة المملوكة لشركة KASPI",
    title: "HEYUKA AI Platform Portal (KASPI)",
    subtitle:
      "بوابة المطورين الرسمية لمنظومة HEYUKA التابعة لشركة KASPI: توليد مفاتيح zx-live الحقيقية وتشغيل مصانع إزالة الخلفية، 3D لـ Blender، تفريغ الفيديو والصوت، وفصل الموسيقى.",
    openApiBtn: "تصفح مواصفة OpenAPI 3.1",
    modelsHeading: "النموذجان السياديان المستقلان لـ HEYUKA",
    xCoreTitle: "HEYUKA-Core — العقل الاستراتيجي والتنفيذي",
    xCoreDesc:
      "تفكير متدرج، هندسة برمجية، رياضيات وجبر ومالية دقيقة، تخطيط DAG متوازٍ، ربط 34 واجهة عامة بدون مفاتيح، واكتشاف تلقائي لملفات OpenAPI / MCP.",
    zebraVisionTitle: "HEYUKA-Vision — الرؤية، 3D، والصوت",
    zebraVisionDesc:
      "تفريغ الخلفيات (@imgly + RMBG-1.4 / BiRefNet)، توليد ومكتبة Blender 3D (TripoSR / PolyHaven)، تفريغ الدارجة والفيديو (Faster-Whisper / WhisperX)، وفصل الأصوات (Demucs / UVR5)، مع جسر Adobe UXP/JSX وحذف الأشخاص من الفيديو.",
    keysHeading: "استوديو مفاتيح الـ API الحقيقية (zx-live-...)",
    keysSub: "تُحفظ المفاتيح بتجزئة SHA-256 معزولة لكل متجر ولا تظهر القيمة الكاملة إلا لحظة الإنشاء.",
    createKeyLabelPlaceholder: "اسم التطبيق (مثلاً: BG Remover App)",
    createKeyBtn: "توليد مفتاح جديد",
    signInPrompt: "سجّل الدخول لتوليد مفاتيح zx-live حقيقية وإدارتها على حساب متجرك:",
    signInBtn: "تسجيل الدخول للمنصة",
    playgroundHeading: "ملعب الاختبار الحي (Live API Playground)",
    runRequest: "تشغيل الطلب الآن",
    docsHeading: "دليل الربط التفاعلي للمشاريع الأربعة (Quickstart)",
    openapiHeading: "مرجع المسارات التفاعلي (OpenAPI / Scalar Compatible)",
    lockNote:
      "قفل حماية نواة الكاشير مفعل (Immutable POS Core Lock): هذه البوابة ومصانع الـ API معزولة كلياً ولا تمس عمليات الكاشير أو قاعدة بيانات المبيعات اليومية.",
  },
  fr: {
    badge: "Portail Développeurs HEYUKA par KASPI",
    title: "HEYUKA AI Platform Portal (KASPI)",
    subtitle:
      "Plateforme API officielle de HEYUKA par KASPI : Suppression de fond, Hub 3D Blender & PNG, Transcription Vidéo/Audio et Séparation Vocale via clés zx-live.",
    openApiBtn: "Spécification OpenAPI 3.1",
    modelsHeading: "Nos Deux Modèles Souverains HEYUKA",
    xCoreTitle: "HEYUKA-Core — Raisonnement & Orchestration",
    xCoreDesc:
      "Planification DAG, génération de code externe, finance TVA/Dinero, 34 APIs publiques sans clé et découverte dynamique OpenAPI/MCP.",
    zebraVisionTitle: "HEYUKA-Vision — Vision, 3D & Audio",
    zebraVisionDesc:
      "Détourage PNG haute précision (@imgly / BiRefNet), actifs 3D Blender (TripoSR / PolyHaven), transcription Darija/Multilingue (Faster-Whisper), séparation Demucs et ponts Adobe/Blender.",
    keysHeading: "Studio des Clés API Live (zx-live-...)",
    keysSub: "Clés stockées strictement hachées en SHA-256 par espace client ; affichées une seule fois à la création.",
    createKeyLabelPlaceholder: "Nom de votre application (ex: Studio 3D App)",
    createKeyBtn: "Générer une clé API",
    signInPrompt: "Connectez-vous pour générer et gérer vos clés API zx-live :",
    signInBtn: "Se connecter",
    playgroundHeading: "Playground Interactif en Direct",
    runRequest: "Exécuter la requête",
    docsHeading: "Démarrage Rapide des 4 Projets (Quickstart)",
    openapiHeading: "Référence des Endpoints OpenAPI 3.1",
    lockNote:
      "Verrou Immutable POS Core actif : l'écosystème développeur est strictement isolé de la caisse KASPI POS.",
  },
  en: {
    badge: "Independent HEYUKA Portal by KASPI",
    title: "HEYUKA AI Platform Portal (KASPI)",
    subtitle:
      "Official HEYUKA by KASPI developer platform powering Background Removal, Blender 3D & PNG Hub, Video/Audio Transcription, and Stem Separation via zx-live keys.",
    openApiBtn: "Inspect OpenAPI 3.1 Spec",
    modelsHeading: "Unified Sovereign HEYUKA Models",
    xCoreTitle: "HEYUKA-Core — Reasoning, Code & Planning",
    xCoreDesc:
      "Structured DAG planning, external coding sandbox, Dinero retail/TVA math, 34 zero-key live public APIs, and dynamic OpenAPI/MCP auto-discovery.",
    zebraVisionTitle: "HEYUKA-Vision — Pixels, 3D & Speech",
    zebraVisionDesc:
      "Transparent PNG cutout (@imgly / BiRefNet), Blender 3D models & PBR textures (TripoSR / PolyHaven), multilingual & Darija transcription (Faster-Whisper), and Demucs stem splitting.",
    keysHeading: "Live API Key Studio (zx-live-...)",
    keysSub: "Keys are stored strictly as SHA-256 hashes per tenant vault and shown once upon generation.",
    createKeyLabelPlaceholder: "App name (e.g. BG Remover App)",
    createKeyBtn: "Generate Live Key",
    signInPrompt: "Sign in to create and manage real zx-live API keys for your tenant:",
    signInBtn: "Sign in to Generate Keys",
    playgroundHeading: "Live Browser API Playground",
    runRequest: "Run Live Request",
    docsHeading: "4-App Quickstart & Integration Recipes",
    openapiHeading: "Interactive OpenAPI 3.1 Endpoints",
    lockNote:
      "Immutable POS Core Lock enabled: developer APIs and external factories remain strictly isolated from cashier POS flows.",
  },
} as const;

function buildQuickstartCode(app: RecipeAppId, lang: CodeLang, sampleKey: string): string {
  const key = sampleKey || "zx-live-YOUR_API_KEY";
  const base = "https://kaspi-pos.vercel.app";

  const specs: Record<RecipeAppId, { endpoint: string; body: string }> = {
    "remove-bg": {
      endpoint: "/api/v1/vision/remove-bg",
      body: JSON.stringify(
        {
          imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png",
          model: "birefnet",
        },
        null,
        2
      ),
    },
    "3d-blender": {
      endpoint: "/api/v1/3d/generate",
      body: JSON.stringify(
        {
          prompt: "modern wooden armchair for Blender",
          format: "glb",
        },
        null,
        2
      ),
    },
    transcribe: {
      endpoint: "/api/v1/audio/transcribe",
      body: JSON.stringify(
        {
          mediaUrl: "https://example.com/podcast-darija.mp3",
          language: "ar",
        },
        null,
        2
      ),
    },
    separate: {
      endpoint: "/api/v1/audio/separate",
      body: JSON.stringify(
        {
          mediaUrl: "https://example.com/track.mp3",
          stems: "2stems",
        },
        null,
        2
      ),
    },
  };

  const target = specs[app];

  if (lang === "curl") {
    return `curl -X POST "${base}${target.endpoint}" \\\n  -H "Authorization: Bearer ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '${target.body}'`;
  }

  if (lang === "python") {
    return `import requests\n\nres = requests.post(\n    "${base}${target.endpoint}",\n    headers={\n        "Authorization": "Bearer ${key}",\n        "Content-Type": "application/json",\n    },\n    json=${target.body},\n    timeout=30,\n)\nprint(res.json())`;
  }

  return `const response = await fetch("${base}${target.endpoint}", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer ${key}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify(${target.body}),\n});\nconst data = await response.json();\nconsole.log(data);`;
}

export function XZebraPlatformPortal() {
  const localeRaw = useLocale();
  const locale: "ar" | "fr" | "en" =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const t = PORTAL_I18N[locale];
  const isAr = locale === "ar";

  const [authenticated, setAuthenticated] = useState(false);
  const [keys, setKeys] = useState<ApiKeyMeta[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [createdSecretOnce, setCreatedSecretOnce] = useState<string | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const [activeModel, setActiveModel] = useState<"x-core" | "zebra-vision">("x-core");
  const [recipeApp, setRecipeApp] = useState<RecipeAppId>("remove-bg");
  const [codeLang, setCodeLang] = useState<CodeLang>("javascript");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [playgroundEndpoint, setPlaygroundEndpoint] = useState<
    | "/api/v1/3d/assets"
    | "/api/v1/vision/remove-bg"
    | "/api/v1/3d/generate"
    | "/api/v1/audio/transcribe"
    | "/api/v1/audio/separate"
    | "/api/v1/zebra-x/auto-connect"
  >("/api/v1/3d/assets");
  const [playgroundBearerKey, setPlaygroundBearerKey] = useState("");
  const [playgroundBody, setPlaygroundBody] = useState(
    JSON.stringify({ q: "chair", type: "models", limit: 6 }, null, 2)
  );
  const [playgroundOutput, setPlaygroundOutput] = useState<string>("");
  const [playgroundLatencyMs, setPlaygroundLatencyMs] = useState<number | null>(null);
  const [playgroundBusy, setPlaygroundBusy] = useState(false);

  const [openApiSpec, setOpenApiSpec] = useState<any>(null);

  const loadKeys = async () => {
    try {
      const r = await fetch("/api/v1/zebra-x/keys", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setAuthenticated(Boolean(data.authenticated));
      setKeys(Array.isArray(data.keys) ? data.keys : []);
    } catch {}
  };

  useEffect(() => {
    void loadKeys();
    fetch("/api/v1/zebra-x/openapi")
      .then((r) => (r.ok ? r.json() : null))
      .then((spec) => {
        if (spec) setOpenApiSpec(spec);
      })
      .catch(() => {});
  }, []);

  const handleCopy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {}
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setKeyBusy(true);
    try {
      const res = await fetch("/api/v1/zebra-x/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newKeyLabel.trim() || "Production App Key",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setKeyError(json?.error || "Failed to create API key");
        return;
      }
      setCreatedSecretOnce(json.secretKeyOnce);
      setPlaygroundBearerKey(json.secretKeyOnce);
      setNewKeyLabel("");
      await loadKeys();
    } catch (err: any) {
      setKeyError(err?.message || "Network error");
    } finally {
      setKeyBusy(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await fetch(`/api/v1/zebra-x/keys?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await loadKeys();
    } catch {}
  };

  const selectPlaygroundEndpoint = (ep: typeof playgroundEndpoint) => {
    setPlaygroundEndpoint(ep);
    setPlaygroundOutput("");
    if (ep === "/api/v1/3d/assets") {
      setPlaygroundBody(JSON.stringify({ q: "chair", type: "models", limit: 6 }, null, 2));
    } else if (ep === "/api/v1/vision/remove-bg") {
      setPlaygroundBody(
        JSON.stringify(
          {
            imageUrl:
              "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png",
            model: "birefnet",
          },
          null,
          2
        )
      );
    } else if (ep === "/api/v1/3d/generate") {
      setPlaygroundBody(
        JSON.stringify({ prompt: "ceramic espresso cup", format: "glb" }, null, 2)
      );
    } else if (ep === "/api/v1/audio/transcribe") {
      setPlaygroundBody(
        JSON.stringify({ mediaUrl: "https://example.com/audio.mp3", language: "ar" }, null, 2)
      );
    } else if (ep === "/api/v1/audio/separate") {
      setPlaygroundBody(
        JSON.stringify({ mediaUrl: "https://example.com/song.mp3", stems: "2stems" }, null, 2)
      );
    } else {
      setPlaygroundBody(
        JSON.stringify({ specUrl: "https://petstore3.swagger.io/api/v3/openapi.json" }, null, 2)
      );
    }
  };

  const runPlayground = async () => {
    setPlaygroundBusy(true);
    setPlaygroundOutput("");
    const startedAt = Date.now();
    try {
      const headers: Record<string, string> = {};
      if (playgroundBearerKey.trim()) {
        headers.Authorization = `Bearer ${playgroundBearerKey.trim()}`;
      }

      let res: Response;
      if (playgroundEndpoint === "/api/v1/3d/assets") {
        const parsed = JSON.parse(playgroundBody || "{}");
        const qs = new URLSearchParams();
        if (parsed.q) qs.set("q", String(parsed.q));
        if (parsed.type) qs.set("type", String(parsed.type));
        if (parsed.limit) qs.set("limit", String(parsed.limit));
        res = await fetch(`/api/v1/3d/assets?${qs.toString()}`, { headers });
      } else {
        headers["Content-Type"] = "application/json";
        res = await fetch(playgroundEndpoint, {
          method: "POST",
          headers,
          body: playgroundBody,
        });
      }

      const json = await res.json().catch(() => ({}));
      setPlaygroundLatencyMs(Date.now() - startedAt);
      setPlaygroundOutput(JSON.stringify({ httpStatus: res.status, ...json }, null, 2));
    } catch (err: any) {
      setPlaygroundLatencyMs(Date.now() - startedAt);
      setPlaygroundOutput(JSON.stringify({ error: err?.message || "Invalid request" }, null, 2));
    } finally {
      setPlaygroundBusy(false);
    }
  };

  const quickstartSnippet = useMemo(
    () => buildQuickstartCode(recipeApp, codeLang, createdSecretOnce || ""),
    [recipeApp, codeLang, createdSecretOnce]
  );

  const openApiEndpoints = useMemo(() => {
    if (!openApiSpec?.paths) return [];
    const list: Array<{ path: string; method: string; summary: string }> = [];
    for (const [p, methods] of Object.entries(openApiSpec.paths as Record<string, any>)) {
      for (const [m, meta] of Object.entries(methods as Record<string, any>)) {
        list.push({
          path: p,
          method: m.toUpperCase(),
          summary: String(meta?.summary || ""),
        });
      }
    }
    return list;
  }, [openApiSpec]);

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-950/75 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-1 text-xs font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.badge}</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center shrink-0">
                <img src="/logo-mark.png" alt="HEYUKA" className="w-8 h-8 object-contain" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {t.title}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">{t.subtitle}</p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href="/api/v1/zebra-x/openapi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors"
              >
                <Code2 className="w-4 h-4" />
                <span>{t.openApiBtn}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Link
                href={`/${locale}/heyuka`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>HEYUKA Desktop OS (3D)</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-zinc-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Immutable POS Core Lock</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-zinc-200">
                <Workflow className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {openApiSpec?.["x-zebra-platform"]?.noKeyPublicApisCount || 34} No-Key Public APIs
                </span>
              </span>
            </div>
          </div>

          {/* 4 Dedicated App Capabilities Summary */}
          <div className="grid grid-cols-2 gap-3 lg:w-[380px] shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1">
              <Scissors className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-white">BG Remover</p>
              <p className="text-[11px] text-zinc-400">BiRefNet • RMBG-1.4</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1">
              <Box className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-white">3D & PNG Hub</p>
              <p className="text-[11px] text-zinc-400">TripoSR • PolyHaven</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1">
              <FileAudio className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-white">Video/Audio STT</p>
              <p className="text-[11px] text-zinc-400">Faster-Whisper • yt-dlp</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1">
              <Mic className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-white">Stem Separator</p>
              <p className="text-[11px] text-zinc-400">Demucs • UVR5 • FFmpeg</p>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Models Showcase */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <span>{t.modelsHeading}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <button
            type="button"
            onClick={() => setActiveModel("x-core")}
            className={`text-start p-6 rounded-3xl border backdrop-blur-xl transition-all cursor-pointer ${
              activeModel === "x-core"
                ? "bg-emerald-500/15 border-emerald-400/50 shadow-lg shadow-emerald-500/10"
                : "bg-slate-950/70 border-white/10 hover:border-white/25"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                heyuka-core
              </span>
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">{t.xCoreTitle}</h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{t.xCoreDesc}</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveModel("zebra-vision")}
            className={`text-start p-6 rounded-3xl border backdrop-blur-xl transition-all cursor-pointer ${
              activeModel === "zebra-vision"
                ? "bg-emerald-500/15 border-emerald-400/50 shadow-lg shadow-emerald-500/10"
                : "bg-slate-950/70 border-white/10 hover:border-white/25"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                heyuka-vision
              </span>
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">{t.zebraVisionTitle}</h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{t.zebraVisionDesc}</p>
          </button>
        </div>
      </section>

      {/* 2. Live API Key Studio */}
      <section className="rounded-3xl border border-white/15 bg-slate-950/75 backdrop-blur-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <span>{t.keysHeading}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">{t.keysSub}</p>
          </div>
          {authenticated && (
            <button
              type="button"
              onClick={() => void loadKeys()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-zinc-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {!authenticated ? (
          <div className="p-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-amber-100">
              <Lock className="w-5 h-5 text-amber-300 shrink-0" />
              <span>{t.signInPrompt}</span>
            </div>
            <Link
              href={`/${locale}/login?from=/${locale}/zebra-x`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors shrink-0"
            >
              <span>{t.signInBtn}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                placeholder={t.createKeyLabelPlaceholder}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/60"
              />
              <button
                type="submit"
                disabled={keyBusy}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs sm:text-sm font-bold cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{t.createKeyBtn}</span>
              </button>
            </form>

            {keyError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                {keyError}
              </p>
            )}

            {createdSecretOnce && (
              <div className="p-4 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-200">
                    New API Key (shown once — copy securely):
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopy("secret-key", createdSecretOnce)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-black text-xs font-bold cursor-pointer"
                  >
                    {copiedId === "secret-key" ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === "secret-key" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <code className="block w-full p-2.5 rounded-xl bg-black/50 text-emerald-300 font-mono text-xs break-all">
                  {createdSecretOnce}
                </code>
              </div>
            )}

            {keys.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-start text-xs">
                  <thead className="bg-white/[0.04] text-zinc-400">
                    <tr>
                      <th className="py-2.5 px-4 text-start font-semibold">Label</th>
                      <th className="py-2.5 px-4 text-start font-semibold">Key</th>
                      <th className="py-2.5 px-4 text-start font-semibold">Created</th>
                      <th className="py-2.5 px-4 text-end font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-zinc-200">
                    {keys.map((k) => (
                      <tr key={k.id} className="hover:bg-white/[0.03]">
                        <td className="py-2.5 px-4 font-semibold">{k.label}</td>
                        <td className="py-2.5 px-4 font-mono text-emerald-300">
                          {k.prefix}••••{k.last4}
                        </td>
                        <td className="py-2.5 px-4 text-zinc-400">
                          {new Date(k.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-4 text-end">
                          <button
                            type="button"
                            onClick={() => void handleRevokeKey(k.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Revoke</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Live API Playground */}
      <section className="rounded-3xl border border-white/15 bg-slate-950/75 backdrop-blur-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span>{t.playgroundHeading}</span>
          </h2>
          {playgroundLatencyMs !== null && (
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
              {playgroundLatencyMs} ms
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              "/api/v1/3d/assets",
              "/api/v1/vision/remove-bg",
              "/api/v1/3d/generate",
              "/api/v1/audio/transcribe",
              "/api/v1/audio/separate",
              "/api/v1/zebra-x/auto-connect",
            ] as const
          ).map((ep) => (
            <button
              key={ep}
              type="button"
              onClick={() => selectPlaygroundEndpoint(ep)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-colors cursor-pointer ${
                playgroundEndpoint === ep
                  ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200 font-bold"
                  : "bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]"
              }`}
            >
              {ep}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <input
              type="text"
              value={playgroundBearerKey}
              onChange={(e) => setPlaygroundBearerKey(e.target.value)}
              placeholder="Optional Bearer Key: zx-live-... (or use signed-in session)"
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/15 font-mono text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/60"
            />
            <textarea
              rows={8}
              value={playgroundBody}
              onChange={(e) => setPlaygroundBody(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-white/15 font-mono text-xs text-emerald-200 focus:outline-none focus:border-emerald-400/60"
            />
            <button
              type="button"
              onClick={() => void runPlayground()}
              disabled={playgroundBusy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-bold cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{playgroundBusy ? "Running..." : t.runRequest}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 font-mono text-[11px] text-zinc-200 overflow-auto max-h-[300px] whitespace-pre-wrap">
            {playgroundOutput || "// Response JSON will appear here..."}
          </pre>
        </div>
      </section>

      {/* 4. Interactive 4-App Quickstart & OpenAPI Reference */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-white/15 bg-slate-950/75 backdrop-blur-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span>{t.docsHeading}</span>
          </h2>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "remove-bg", label: "1. BG Remover" },
                { id: "3d-blender", label: "2. 3D & Blender" },
                { id: "transcribe", label: "3. Transcribe" },
                { id: "separate", label: "4. Stem Separator" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRecipeApp(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  recipeApp === tab.id
                    ? "bg-emerald-500 text-black border-emerald-400"
                    : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {(["javascript", "python", "curl"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setCodeLang(lang)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer ${
                    codeLang === lang
                      ? "bg-white text-black font-bold"
                      : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void handleCopy("quickstart", quickstartSnippet)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 text-xs text-zinc-200 cursor-pointer"
            >
              {copiedId === "quickstart" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedId === "quickstart" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-900/95 border border-white/10 font-mono text-xs text-emerald-200 overflow-x-auto">
            {quickstartSnippet}
          </pre>
        </div>

        {/* OpenAPI Schema Explorer */}
        <div className="rounded-3xl border border-white/15 bg-slate-950/75 backdrop-blur-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Workflow className="w-5 h-5 text-emerald-400" />
              <span>{t.openapiHeading}</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">OpenAPI 3.1.0</span>
          </div>

          <div className="space-y-2.5 max-h-[310px] overflow-y-auto kaspi-no-scrollbar">
            {openApiEndpoints.map((ep) => (
              <div
                key={`${ep.method}:${ep.path}`}
                className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    {ep.method}
                  </span>
                  <code className="text-xs font-mono text-white">{ep.path}</code>
                </div>
                <p className="text-[11px] text-zinc-400">{ep.summary}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 text-[11px] text-emerald-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{t.lockNote}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default XZebraPlatformPortal;
