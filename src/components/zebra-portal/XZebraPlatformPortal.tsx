"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Box,
  Check,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  FileAudio,
  KeyRound,
  Layers,
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
  Zap,
} from "lucide-react";
import {
  HEYUKA_CHARACTER_PROFILES,
  HEYUKA_LIGHTING_PRESETS,
} from "@/lib/heyuka/heyuka-universe";
import { HEYUKAInstallWalkthrough } from "@/components/heyuka/HEYUKAInstallWalkthrough";

const HEYUKACreatureCanvas = dynamic(
  () => import("@/components/heyuka/HEYUKACreatureCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] sm:h-[320px] rounded-2xl border border-white/10 bg-slate-950/60 flex items-center justify-center text-xs font-mono text-zinc-400">
        Initializing 3D Viewport...
      </div>
    ),
  }
);

interface ApiKeyMeta {
  id: string;
  label: string;
  prefix: string;
  last4: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  usageCount?: number;
}

type PermissionTierId = "all" | "chat_research" | "vision_media";
type RecipeAppId = "chat" | "public-apis" | "sandbox" | "remove-bg" | "3d-blender" | "transcribe";
type CodeLang = "javascript" | "python" | "curl";

const PERMISSION_TIERS: Record<
  PermissionTierId,
  { labelAr: string; labelFr: string; labelEn: string; scopes?: string[] }
> = {
  all: {
    labelAr: "صلاحية كاملة (جميع النماذج والأدوات)",
    labelFr: "Accès Complet (Tous Modèles & Outils)",
    labelEn: "Full Access (All Models & APIs)",
    scopes: undefined,
  },
  chat_research: {
    labelAr: "المحادثة، الكود، والبيانات الحية فقط",
    labelFr: "Chat, Code & Données Live uniquement",
    labelEn: "Chat, Code & Live Research Only",
    scopes: ["chat:universal", "web:research", "public-apis:query", "sandbox:execute"],
  },
  vision_media: {
    labelAr: "الرؤية، الصور، 3D، والصوتيات",
    labelFr: "Vision, Images, 3D & Audio Studio",
    labelEn: "Vision, Images, 3D & Audio Studio",
    scopes: [
      "vision:remove-bg",
      "images:generate",
      "3d:generate",
      "3d:assets",
      "audio:transcribe",
      "audio:separate",
    ],
  },
};

const PORTAL_I18N = {
  ar: {
    badge: "منصة HEYUKA الرسمية للمطورين • KASPI",
    title: "HEYUKA AI Platform & API Studio",
    subtitle:
      "اصنع مفاتيح API حقيقية وفريدة لتطبيقاتك في ثوانٍ، واستفد من قدرات HEYUKA في المحادثة الذكية، البرمجة، التحليل البصري، 3D، والصوتيات ببروتوكول متوافق مع OpenAI.",
    installGuideBtn: "مراحل التحميل والتثبيت والربط",
    desktopAppBtn: "تطبيق HEYUKA لسطح المكتب",
    openApiBtn: "مواصفة OpenAPI 3.1",
    baseUrlLabel: "عنوان البوابة الرسمي (Base URL)",
    modelsHeading: "نماذج HEYUKA السيادية",
    keysHeading: "إدارة مفاتيح الـ API (IPK) والمعرّفات الحقيقية",
    keysSub:
      "كل مفتاح يتم توليده يكون فريداً تماماً ومشفراً بتجزئة SHA-256 مع معرف Key ID مستقل للتحقق وتتبّع الاستهلاك الحقيقي.",
    createToggleBtn: "+ إنشاء مفتاح API جديد",
    createKeyLabelPlaceholder: "اسم التطبيق (مثلاً: متجري أو تطبيق الهاتف)",
    createKeyBtn: "توليد مفتاح فريد الآن",
    signInPrompt:
      "سجّل الدخول بحسابك أو أنشئ حساباً مجانياً لإصدار مفاتيح API حقيقية ومختلفة لكل مشروع:",
    signInBtn: "تسجيل الدخول للمنصة",
    registerBtn: "إنشاء حساب جديد",
    playgroundHeading: "ملعب الاختبار الحي للواجهة البرمجية",
    runRequest: "تشغيل الطلب الحي الآن",
    docsHeading: "أكواد الربط الجاهزة للنسخ (SDK & REST)",
    openapiHeading: "مرجع المسارات الرسمي (OpenAPI 3.1)",
    privacyNote:
      "جميع المفاتيح معزولة على مستوى كل حساب، ومشفرة بنظام عدم الاحتفاظ بالنص الصريح بعد الإنشاء.",
  },
  fr: {
    badge: "Plateforme Développeurs HEYUKA par KASPI",
    title: "HEYUKA AI Platform & API Studio",
    subtitle:
      "Créez des clés API cryptographiquement uniques en quelques secondes et intégrez la puissance multimodale de HEYUKA (raisonnement, code, vision, 3D et audio) compatible OpenAI.",
    installGuideBtn: "Toutes les Étapes d'Installation",
    desktopAppBtn: "App Desktop HEYUKA",
    openApiBtn: "Spécification OpenAPI 3.1",
    baseUrlLabel: "Endpoint Officiel (Base URL)",
    modelsHeading: "Modèles Souverains HEYUKA",
    keysHeading: "Studio Clés API (IPK) & Key IDs Réels",
    keysSub:
      "Chaque clé générée est unique, hachée en SHA-256 et associée à un Key ID vérifiable avec suivi réel de la consommation.",
    createToggleBtn: "+ Créer une nouvelle clé API",
    createKeyLabelPlaceholder: "Nom du projet (ex: App E-Commerce)",
    createKeyBtn: "Générer Clé Unique + Key ID",
    signInPrompt:
      "Connectez-vous ou créez un compte gratuit pour générer vos clés API uniques :",
    signInBtn: "Se connecter",
    registerBtn: "Créer un compte",
    playgroundHeading: "Playground API Interactif en Direct",
    runRequest: "Exécuter la requête",
    docsHeading: "Exemples Prêts à Copier (SDK & REST)",
    openapiHeading: "Référence des Endpoints OpenAPI 3.1",
    privacyNote:
      "Isolation stricte par locataire : les clés secrètes ne sont jamais stockées en clair et sont vérifiables à chaque requête.",
  },
  en: {
    badge: "Official HEYUKA Developer Platform • KASPI",
    title: "HEYUKA AI Platform & API Studio",
    subtitle:
      "Issue cryptographically unique API Keys and verifiable Key IDs in seconds, powered by HEYUKA's flagship multimodal reasoning, coding, vision, 3D, and speech APIs.",
    installGuideBtn: "View All Setup & Install Stages",
    desktopAppBtn: "Download HEYUKA App",
    openApiBtn: "OpenAPI 3.1 Spec",
    baseUrlLabel: "Official API Base URL",
    modelsHeading: "Sovereign HEYUKA Model Lineup",
    keysHeading: "API Keys (IPK) & Verifiable Key IDs",
    keysSub:
      "Every generated key is cryptographically unique, SHA-256 hashed at rest, and paired with an independent Key ID and live usage counter.",
    createToggleBtn: "+ Create new secret key",
    createKeyLabelPlaceholder: "Project name (e.g. Production Assistant)",
    createKeyBtn: "Create Secret Key",
    signInPrompt:
      "Sign in or create a free account to issue unique Secret API Keys & Key IDs for your apps:",
    signInBtn: "Sign in",
    registerBtn: "Create account",
    playgroundHeading: "Live Full-Stack API Playground",
    runRequest: "Send Live Request",
    docsHeading: "Production Quickstart Snippets",
    openapiHeading: "Official OpenAPI 3.1 Endpoints",
    privacyNote:
      "Tenant-isolated zero-plaintext key vault: copy your key once cleanly and rotate or revoke anytime.",
  },
} as const;

const FEATURED_SHOWCASE_IDS = [
  "classic_heyuka",
  "fire_elemental",
  "ice_elemental",
  "rock_elemental",
  "royal_king",
  "cyber_gamer",
  "sakura_princess",
];

function buildQuickstartCode(
  app: RecipeAppId,
  lang: CodeLang,
  sampleKey: string,
  sampleKeyId: string
): string {
  const key = sampleKey || "hk-live-YOUR_UNIQUE_SECRET_KEY";
  const keyId = sampleKeyId || "hk_YOUR_KEY_ID";
  const base = "https://kaspi-pos.vercel.app";

  const specs: Record<RecipeAppId, { endpoint: string; body: string }> = {
    chat: {
      endpoint: "/api/v1/chat/completions",
      body: JSON.stringify(
        {
          model: "heyuka-omni",
          enableTools: true,
          messages: [
            { role: "user", content: "Summarize EUR to MAD market rate and key market catalysts." },
          ],
        },
        null,
        2
      ),
    },
    "public-apis": {
      endpoint: "/api/v1/public-apis",
      body: JSON.stringify({ category: "fx_rates", query: "MAD", limit: 5 }, null, 2),
    },
    sandbox: {
      endpoint: "/api/v1/sandbox/execute",
      body: JSON.stringify(
        { language: "python", code: "print(sum([12, 24, 36]))" },
        null,
        2
      ),
    },
    "remove-bg": {
      endpoint: "/api/v1/vision/remove-bg",
      body: JSON.stringify(
        {
          imageUrl:
            "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png",
        },
        null,
        2
      ),
    },
    "3d-blender": {
      endpoint: "/api/v1/3d/generate",
      body: JSON.stringify(
        { prompt: "modern ergonomic studio chair", format: "glb" },
        null,
        2
      ),
    },
    transcribe: {
      endpoint: "/api/v1/audio/transcribe",
      body: JSON.stringify(
        { mediaUrl: "https://example.com/audio-sample.mp3", language: "ar" },
        null,
        2
      ),
    },
  };

  const target = specs[app];

  if (lang === "curl") {
    return `curl -X POST "${base}${target.endpoint}" \\\n  -H "Authorization: Bearer ${key}" \\\n  -H "X-API-Key-Id: ${keyId}" \\\n  -H "Content-Type: application/json" \\\n  -d '${target.body}'`;
  }

  if (lang === "python") {
    if (app === "chat") {
      return `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="${key}",\n    base_url="${base}/api/v1",\n    default_headers={"X-API-Key-Id": "${keyId}"},\n)\n\nreply = client.chat.completions.create(\n    model="heyuka-omni",\n    messages=[{"role": "user", "content": "Hello HEYUKA!"}],\n)\nprint(reply.choices[0].message.content)`;
    }
    return `import requests\n\nres = requests.post(\n    "${base}${target.endpoint}",\n    headers={\n        "Authorization": "Bearer ${key}",\n        "X-API-Key-Id": "${keyId}",\n        "Content-Type": "application/json",\n    },\n    json=${target.body},\n    timeout=45,\n)\nprint(res.json())`;
  }

  if (app === "chat") {
    return `import OpenAI from "openai";\n\nconst heyuka = new OpenAI({\n  apiKey: "${key}",\n  baseURL: "${base}/api/v1",\n  defaultHeaders: { "X-API-Key-Id": "${keyId}" },\n});\n\nconst completion = await heyuka.chat.completions.create({\n  model: "heyuka-omni",\n  messages: [{ role: "user", content: "Hello HEYUKA!" }],\n});\nconsole.log(completion.choices[0].message.content);`;
  }

  return `const response = await fetch("${base}${target.endpoint}", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer ${key}",\n    "X-API-Key-Id": "${keyId}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify(${target.body}),\n});\nconst data = await response.json();\nconsole.log(data);`;
}

export function XZebraPlatformPortal() {
  const localeRaw = useLocale();
  const locale: "ar" | "fr" | "en" =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const t = PORTAL_I18N[locale];
  const isAr = locale === "ar";

  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyMeta[]>([]);
  const [showKeyForm, setShowKeyForm] = useState(true);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [permissionTier, setPermissionTier] = useState<PermissionTierId>("all");
  const [tokenPrefix, setTokenPrefix] = useState<"hk-live" | "zx-live">("hk-live");
  const [createdSecretOnce, setCreatedSecretOnce] = useState<string | null>(null);
  const [createdKeyId, setCreatedKeyId] = useState<string | null>(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const [activeModel, setActiveModel] = useState<"heyuka-omni" | "heyuka-core" | "heyuka-vision">(
    "heyuka-omni"
  );
  const [recipeApp, setRecipeApp] = useState<RecipeAppId>("chat");
  const [codeLang, setCodeLang] = useState<CodeLang>("javascript");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  // Authentic 3D Companion preview selector
  const [showcaseCharId, setShowcaseCharId] = useState("classic_heyuka");
  const previewChar = useMemo(
    () =>
      HEYUKA_CHARACTER_PROFILES.find((c) => c.id === showcaseCharId) ||
      HEYUKA_CHARACTER_PROFILES[0],
    [showcaseCharId]
  );
  const previewLighting = HEYUKA_LIGHTING_PRESETS[0];

  const [playgroundEndpoint, setPlaygroundEndpoint] = useState<
    | "/api/v1/chat/completions"
    | "/api/v1/models"
    | "/api/v1/public-apis"
    | "/api/v1/images/generate"
    | "/api/v1/sandbox/execute"
    | "/api/v1/web/research"
    | "/api/v1/3d/assets"
    | "/api/v1/vision/remove-bg"
    | "/api/v1/3d/generate"
    | "/api/v1/audio/transcribe"
    | "/api/v1/audio/separate"
    | "/api/v1/zebra-x/auto-connect"
  >("/api/v1/chat/completions");
  const [playgroundBearerKey, setPlaygroundBearerKey] = useState("");
  const [playgroundKeyId, setPlaygroundKeyId] = useState("");
  const [playgroundBody, setPlaygroundBody] = useState(
    JSON.stringify(
      {
        model: "heyuka-omni",
        enableTools: true,
        messages: [{ role: "user", content: "What is 1500 + 20% VAT, and explain cleanly?" }],
      },
      null,
      2
    )
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
      setUserEmail(data.userEmail || null);
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
      const tier = PERMISSION_TIERS[permissionTier];
      const res = await fetch("/api/v1/zebra-x/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label:
            newKeyLabel.trim() ||
            `HEYUKA Key #${keys.length + 1}`,
          scopes: tier.scopes,
          tokenPrefix,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setKeyError(json?.error || "Failed to create API key");
        return;
      }
      const nextKeyId = json.keyId || json.key?.id || null;
      setCreatedSecretOnce(json.secretKeyOnce);
      setCreatedKeyId(nextKeyId);
      setPlaygroundBearerKey(json.secretKeyOnce);
      if (nextKeyId) setPlaygroundKeyId(nextKeyId);
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
    if (ep === "/api/v1/chat/completions") {
      setPlaygroundBody(
        JSON.stringify(
          {
            model: activeModel,
            enableTools: true,
            messages: [
              { role: "user", content: "Compare EUR to MAD exchange rate and give key insights." },
            ],
          },
          null,
          2
        )
      );
    } else if (ep === "/api/v1/models" || ep === "/api/v1/3d/assets") {
      setPlaygroundBody("{}");
    } else if (ep === "/api/v1/public-apis") {
      setPlaygroundBody(
        JSON.stringify({ category: "fx_rates", query: "MAD", limit: 5 }, null, 2)
      );
    } else if (ep === "/api/v1/images/generate") {
      setPlaygroundBody(
        JSON.stringify({ prompt: "sleek obsidian titanium tech workspace studio", action: "generate" }, null, 2)
      );
    } else if (ep === "/api/v1/sandbox/execute") {
      setPlaygroundBody(
        JSON.stringify(
          { language: "python", code: "print('HEYUKA Live Compute:', 21 * 2)" },
          null,
          2
        )
      );
    } else if (ep === "/api/v1/web/research") {
      setPlaygroundBody(JSON.stringify({ query: "renewable energy Morocco news" }, null, 2));
    } else if (ep === "/api/v1/vision/remove-bg") {
      setPlaygroundBody(
        JSON.stringify(
          {
            imageUrl:
              "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png",
          },
          null,
          2
        )
      );
    } else if (ep === "/api/v1/3d/generate") {
      setPlaygroundBody(
        JSON.stringify({ prompt: "modern minimalist lounge chair", format: "glb" }, null, 2)
      );
    } else if (ep === "/api/v1/audio/transcribe") {
      setPlaygroundBody(
        JSON.stringify({ mediaUrl: "https://example.com/voice-note.mp3", language: "ar" }, null, 2)
      );
    } else if (ep === "/api/v1/audio/separate") {
      setPlaygroundBody(
        JSON.stringify({ mediaUrl: "https://example.com/song.mp3", stems: "2stems" }, null, 2)
      );
    } else {
      setPlaygroundBody(
        JSON.stringify(
          { action: "discover_openapi", openApiUrl: "https://petstore3.swagger.io/api/v3/openapi.json" },
          null,
          2
        )
      );
    }
  };

  const runPlayground = async () => {
    setPlaygroundBusy(true);
    setPlaygroundOutput("");
    const t0 = performance.now();
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (playgroundBearerKey.trim()) {
        headers.Authorization = `Bearer ${playgroundBearerKey.trim()}`;
      }
      if (playgroundKeyId.trim()) {
        headers["X-API-Key-Id"] = playgroundKeyId.trim();
      }
      const isGet = playgroundEndpoint === "/api/v1/3d/assets" || playgroundEndpoint === "/api/v1/models";
      const targetUrl =
        playgroundEndpoint === "/api/v1/3d/assets"
          ? "/api/v1/3d/assets?type=models&q=chair&limit=4"
          : playgroundEndpoint;

      const res = await fetch(targetUrl, {
        method: isGet ? "GET" : "POST",
        headers,
        body: isGet ? undefined : playgroundBody,
      });
      const json = await res.json().catch(() => ({ status: res.status }));
      setPlaygroundLatencyMs(Math.round(performance.now() - t0));
      setPlaygroundOutput(JSON.stringify(json, null, 2));
      await loadKeys();
    } catch (err: any) {
      setPlaygroundLatencyMs(Math.round(performance.now() - t0));
      setPlaygroundOutput(JSON.stringify({ error: err?.message || "Request failed" }, null, 2));
    } finally {
      setPlaygroundBusy(false);
    }
  };

  const quickstartSnippet = useMemo(
    () =>
      buildQuickstartCode(
        recipeApp,
        codeLang,
        createdSecretOnce || playgroundBearerKey,
        createdKeyId || playgroundKeyId
      ),
    [recipeApp, codeLang, createdSecretOnce, playgroundBearerKey, createdKeyId, playgroundKeyId]
  );

  const openApiEndpoints = useMemo(() => {
    const paths = openApiSpec?.paths || {};
    const list: Array<{ method: string; path: string; summary: string }> = [];
    for (const [p, ops] of Object.entries<any>(paths)) {
      for (const [m, def] of Object.entries<any>(ops || {})) {
        list.push({ method: m.toUpperCase(), path: p, summary: def?.summary || "" });
      }
    }
    return list;
  }, [openApiSpec]);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10"
    >
      {/* 1. Flagship OpenAI / DeepSeek Platform Hero with Live 3D HEYUKA Companion */}
      <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-xs font-bold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t.badge}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono text-zinc-300">
                OpenAI-Compatible API • v1
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.07] border border-white/15 flex items-center justify-center shrink-0">
                <img src="/logo-mark.png" alt="HEYUKA KASPI" className="w-8 h-8 object-contain" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                {t.title}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>

            {/* Official Base URL Copy Bar */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 max-w-xl">
              <span className="text-[11px] font-semibold text-zinc-400 px-2">{t.baseUrlLabel}:</span>
              <code dir="ltr" className="text-xs font-mono text-emerald-300 flex-1 truncate">
                https://kaspi-pos.vercel.app/api/v1
              </code>
              <button
                type="button"
                onClick={() => void handleCopy("base-url", "https://kaspi-pos.vercel.app/api/v1")}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white cursor-pointer"
              >
                {copiedId === "base-url" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === "base-url" ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="#api-keys-studio"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-emerald-500/20"
              >
                <KeyRound className="w-4 h-4" />
                <span>{t.createToggleBtn}</span>
              </a>

              <button
                type="button"
                onClick={() => setWalkthroughOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-extrabold cursor-pointer transition-all"
              >
                <Layers className="w-4 h-4" />
                <span>{t.installGuideBtn}</span>
              </button>

              <Link
                href={`/${locale}/heyuka`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 text-white text-xs sm:text-sm font-bold transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{t.desktopAppBtn}</span>
              </Link>
            </div>
          </div>

          {/* Authentic 3D HEYUKA Character Visual Identity */}
          <div className="lg:col-span-5 space-y-3">
            <HEYUKACreatureCanvas
              character={previewChar}
              lighting={previewLighting}
              compact
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-zinc-200">
                {previewChar.name} <span className="text-emerald-400 font-mono text-[10px]">({previewChar.badge})</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {FEATURED_SHOWCASE_IDS.map((cid) => {
                  const prof = HEYUKA_CHARACTER_PROFILES.find((x) => x.id === cid);
                  if (!prof) return null;
                  return (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => setShowcaseCharId(cid)}
                      title={prof.name}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        showcaseCharId === cid
                          ? "border-emerald-400 scale-110"
                          : "border-white/25 opacity-75 hover:opacity-100"
                      }`}
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${prof.tipColor}, ${prof.furColor})`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Official Sovereign Model Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>{t.modelsHeading}</span>
          </h2>
          <a
            href="/api/v1/zebra-x/openapi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-emerald-300 transition-colors"
          >
            <span>{t.openApiBtn}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              id: "heyuka-omni" as const,
              icon: Sparkles,
              badge: "Flagship • 128K Context",
              title: "HEYUKA Omni",
              desc:
                isAr
                  ? "النموذج الشامل الرائد: استدلال عميق، برمجة كاملة، بحث مباشر، تنفيذ أكواد، وتحليل متعدد الوسائط."
                  : locale === "fr"
                  ? "Modèle amiral unifié : raisonnement avancé, code, recherche en direct et orchestration multi-outils."
                  : "Flagship unified model for multi-step reasoning, full-stack coding, live web analysis, and tool execution.",
            },
            {
              id: "heyuka-core" as const,
              icon: Zap,
              badge: "Ultra-Fast Reasoning",
              title: "HEYUKA Core",
              desc:
                isAr
                  ? "نواة سريعة فائقة الدقة للحسابات، المنطق البرمجي، المعاملات متعددة اللغات (عربي/دارجة/فرنسي/إنجليزي) والبيانات الحية."
                  : locale === "fr"
                  ? "Moteur basse latence pour logique métier, mathématiques, multilingue Darija/FR/EN et flux temps réel."
                  : "Low-latency engine specialized for logical reasoning, multilingual fluency, code, and structured live data.",
            },
            {
              id: "heyuka-vision" as const,
              icon: Eye,
              badge: "Multimodal & 3D Studio",
              title: "HEYUKA Vision",
              desc:
                isAr
                  ? "توليد الصور الإبداعية، تفريغ الخلفيات بدقة PNG، مشاهد ومجسمات 3D، وتفريغ الصوتيات والفصل الصوتي."
                  : locale === "fr"
                  ? "Synthèse visuelle studio, détourage PNG transparent, actifs 3D et traitement audio/parole."
                  : "Studio image generation, transparent foreground cutouts, 3D mesh pipelines, and multilingual speech.",
            },
          ].map((m) => {
            const Icon = m.icon;
            const active = activeModel === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setActiveModel(m.id)}
                className={`p-6 rounded-3xl border backdrop-blur-xl transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  active
                    ? "bg-emerald-500/15 border-emerald-400/60 shadow-lg shadow-emerald-500/10"
                    : "bg-slate-950/75 border-white/10 hover:border-white/25"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.08] border border-white/10 font-mono text-xs font-bold text-emerald-300">
                      {m.id}
                    </span>
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white">{m.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{m.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                  <span className="font-mono text-zinc-400">{m.badge}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleCopy(`mod-${m.id}`, m.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer"
                  >
                    {copiedId === `mod-${m.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === `mod-${m.id}` ? "Copied" : "Copy ID"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Real Cryptographically Unique API Keys & Key IDs Studio */}
      <section
        id="api-keys-studio"
        className="rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 space-y-6 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <span>{t.keysHeading}</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">{t.keysSub}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {userEmail && (
              <span className="hidden md:inline-flex px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono text-zinc-300">
                {userEmail}
              </span>
            )}
            {authenticated && (
              <>
                <button
                  type="button"
                  onClick={() => void loadKeys()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-zinc-200 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowKeyForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.createToggleBtn.replace(/^\+\s*/, "")}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {!authenticated ? (
          <div className="p-6 rounded-2xl border border-amber-400/35 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-amber-100">
              <Lock className="w-5 h-5 text-amber-300 shrink-0" />
              <span>{t.signInPrompt}</span>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link
                href={`/${locale}/login?from=/${locale}/zebra-x`}
                className="px-5 py-2.5 rounded-xl bg-white text-black text-xs font-extrabold hover:bg-zinc-200 transition-colors"
              >
                {t.signInBtn}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-colors"
              >
                {t.registerBtn}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {showKeyForm && (
              <form
                onSubmit={handleCreateKey}
                className="p-5 rounded-2xl bg-white/[0.04] border border-white/15 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-300">
                      {isAr ? "اسم المفتاح (مثال: مشروع المتجر، سيرفر الإنتاج)" : "Key Name"}
                    </label>
                    <input
                      type="text"
                      value={newKeyLabel}
                      onChange={(e) => setNewKeyLabel(e.target.value)}
                      placeholder={t.createKeyLabelPlaceholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/60"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-300">
                      {isAr ? "نطاق الصلاحيات (Scopes)" : "Permission Scope"}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(PERMISSION_TIERS) as PermissionTierId[]).map((pid) => {
                        const tier = PERMISSION_TIERS[pid];
                        const label = isAr ? tier.labelAr : locale === "fr" ? tier.labelFr : tier.labelEn;
                        return (
                          <button
                            key={pid}
                            type="button"
                            onClick={() => setPermissionTier(pid)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                              permissionTier === pid
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                                : "bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span>{isAr ? "صيغة المفتاح:" : "Format:"}</span>
                    {(["hk-live", "zx-live"] as const).map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setTokenPrefix(pref)}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border cursor-pointer ${
                          tokenPrefix === pref
                            ? "bg-white text-black border-white font-bold"
                            : "bg-white/5 border-white/10 text-zinc-300"
                        }`}
                      >
                        {pref}-...
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={keyBusy}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs sm:text-sm font-extrabold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{keyBusy ? "..." : t.createKeyBtn}</span>
                  </button>
                </div>
              </form>
            )}

            {keyError && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                {keyError}
              </p>
            )}

            {/* OpenAI / DeepSeek One-Time Key Reveal Card */}
            {createdSecretOnce && (
              <div className="p-5 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-200">
                      {isAr
                        ? "احفظ مفتاحك السري الفريد الآن (يُعرض مرة واحدة فقط)"
                        : locale === "fr"
                        ? "Enregistrez votre clé secrète unique maintenant (affichée une seule fois)"
                        : "Save your unique secret key now (shown once)"}
                    </h3>
                    <p className="text-[11px] text-zinc-300">
                      {isAr
                        ? "لأسباب أمنية، لا يمكن عرض هذا المفتاح مجدداً بعد إغلاق التنبيه. إذا فقدته قم بإنشاء مفتاح جديد."
                        : "For security, this secret value cannot be displayed again once cleared."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWalkthroughOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black text-xs font-extrabold cursor-pointer shrink-0"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{t.installGuideBtn}</span>
                  </button>
                </div>

                {createdKeyId && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-200">
                        Key ID (X-API-Key-Id):
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopy("secret-key-id", createdKeyId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
                      >
                        {copiedId === "secret-key-id" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === "secret-key-id" ? "Copied ✓" : "Copy Key ID"}</span>
                      </button>
                    </div>
                    <code dir="ltr" className="block w-full p-2.5 rounded-xl bg-black/50 text-amber-200 font-mono text-xs break-all select-all">
                      {createdKeyId}
                    </code>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-200">
                      Secret API Key (Authorization: Bearer ...):
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopy("secret-key", createdSecretOnce)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-black text-xs font-extrabold cursor-pointer"
                    >
                      {copiedId === "secret-key" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === "secret-key" ? "Copied ✓" : "Copy Secret Key"}</span>
                    </button>
                  </div>
                  <code dir="ltr" className="block w-full p-3 rounded-xl bg-black/50 text-emerald-300 font-mono text-xs break-all select-all">
                    {createdSecretOnce}
                  </code>
                </div>
              </div>
            )}

            {/* Issued Distinct Keys Table */}
            {keys.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-start text-xs">
                  <thead className="bg-white/[0.04] text-zinc-400">
                    <tr>
                      <th className="py-3 px-4 text-start font-semibold">Name</th>
                      <th className="py-3 px-4 text-start font-semibold">Key ID</th>
                      <th className="py-3 px-4 text-start font-semibold">Secret Key</th>
                      <th className="py-3 px-4 text-start font-semibold">Scopes</th>
                      <th className="py-3 px-4 text-start font-semibold">Usage</th>
                      <th className="py-3 px-4 text-start font-semibold">Created</th>
                      <th className="py-3 px-4 text-end font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-zinc-200">
                    {keys.map((k) => (
                      <tr key={k.id} className="hover:bg-white/[0.03]">
                        <td className="py-3 px-4 font-bold">{k.label}</td>
                        <td className="py-3 px-4 font-mono text-amber-200">
                          <div className="inline-flex items-center gap-1.5">
                            <span>{k.id}</span>
                            <button
                              type="button"
                              onClick={() => void handleCopy(`tbl-kid-${k.id}`, k.id)}
                              className="p-1 rounded bg-white/10 hover:bg-white/20 text-zinc-200 cursor-pointer"
                              title="Copy Key ID"
                            >
                              {copiedId === `tbl-kid-${k.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td dir="ltr" className="py-3 px-4 font-mono text-emerald-300">
                          {k.prefix}••••{k.last4}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-300">
                          {Array.isArray(k.scopes) ? `${k.scopes.length} scopes` : "Full"}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-300">
                          {k.usageCount || 0} reqs
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {new Date(k.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-end">
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

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-zinc-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t.privacyNote}</span>
            </div>
          </div>
        )}
      </section>

      {/* 4. Interactive Live API Playground */}
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
              "/api/v1/chat/completions",
              "/api/v1/models",
              "/api/v1/public-apis",
              "/api/v1/images/generate",
              "/api/v1/sandbox/execute",
              "/api/v1/web/research",
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                dir="ltr"
                value={playgroundBearerKey}
                onChange={(e) => setPlaygroundBearerKey(e.target.value)}
                placeholder="Secret Key: hk-live-..."
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/15 font-mono text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/60"
              />
              <input
                type="text"
                dir="ltr"
                value={playgroundKeyId}
                onChange={(e) => setPlaygroundKeyId(e.target.value)}
                placeholder="Optional Key ID: hk_..."
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/15 font-mono text-xs text-amber-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-400/60"
              />
            </div>
            <textarea
              rows={8}
              dir="ltr"
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

          <pre
            dir="ltr"
            className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 font-mono text-[11px] text-zinc-200 overflow-auto max-h-[300px] whitespace-pre-wrap"
          >
            {playgroundOutput || "// Response JSON will appear here..."}
          </pre>
        </div>
      </section>

      {/* 5. Quickstart Snippets & OpenAPI Reference */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-white/15 bg-slate-950/75 backdrop-blur-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              <span>{t.docsHeading}</span>
            </h2>
            <button
              type="button"
              onClick={() => setWalkthroughOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-xs font-bold text-emerald-300 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t.installGuideBtn}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "chat", label: "1. Chat Completions", icon: Sparkles },
                { id: "public-apis", label: "2. Live Data", icon: Workflow },
                { id: "sandbox", label: "3. Code Sandbox", icon: Terminal },
                { id: "remove-bg", label: "4. BG Cutout", icon: Scissors },
                { id: "3d-blender", label: "5. 3D Studio", icon: Box },
                { id: "transcribe", label: "6. Audio AI", icon: FileAudio },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRecipeApp(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    recipeApp === tab.id
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
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
              <span>{copiedId === "quickstart" ? "Copied ✓" : "Copy Code"}</span>
            </button>
          </div>

          <pre
            dir="ltr"
            className="p-4 rounded-2xl bg-slate-900/95 border border-white/10 font-mono text-xs text-emerald-200 overflow-x-auto"
          >
            {quickstartSnippet}
          </pre>
        </div>

        {/* OpenAPI Schema Explorer */}
        <div className="rounded-3xl border border-white/15 bg-slate-950/75 backdrop-blur-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-emerald-400" />
              <span>{t.openapiHeading}</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">OpenAPI 3.1.0</span>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto kaspi-no-scrollbar">
            {openApiEndpoints.map((ep) => (
              <div
                key={`${ep.method}:${ep.path}`}
                className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-1"
              >
                <div dir="ltr" className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    {ep.method}
                  </span>
                  <code className="text-xs font-mono text-white">{ep.path}</code>
                </div>
                <p className="text-[11px] text-zinc-400">{ep.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Setup & Download Walkthrough Modal */}
      <HEYUKAInstallWalkthrough
        isOpen={walkthroughOpen}
        onClose={() => setWalkthroughOpen(false)}
        locale={locale}
        activeSecretKey={createdSecretOnce || playgroundBearerKey || null}
        activeKeyId={createdKeyId || playgroundKeyId || null}
      />
    </div>
  );
}

export default XZebraPlatformPortal;
