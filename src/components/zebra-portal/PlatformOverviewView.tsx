"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Boxes,
  Bug,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Layers,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import {
  HEYUKA_CHARACTER_PROFILES,
  HEYUKA_LIGHTING_PRESETS,
} from "@/lib/heyuka/heyuka-universe";
import {
  OFFICIAL_API_BASE_URL,
  OFFICIAL_ROOT_V1_URL,
  PLATFORM_COMPARISON_ROWS,
  type PortalLocale,
} from "./platform-data";

const HEYUKACreatureCanvas = dynamic(
  () => import("@/components/heyuka/HEYUKACreatureCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[270px] rounded-2xl kaspi-frosted-surface flex items-center justify-center text-xs font-mono text-[var(--kaspi-text-muted)]">
        Initializing 3D Viewport...
      </div>
    ),
  }
);

const FEATURED_SHOWCASE_IDS = [
  "classic_heyuka",
  "fire_elemental",
  "ice_elemental",
  "royal_king",
  "cyber_gamer",
  "sakura_princess",
];

const COPY: Record<
  PortalLocale,
  {
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    createKeyCta: string;
    debugCta: string;
    baseUrlTitle: string;
    aliasUrlTitle: string;
    gatewayStatusOnline: string;
    directoryTitle: string;
    directorySub: string;
    compareTitle: string;
    compareSub: string;
    colFeature: string;
    colHeyuka: string;
    colOpenai: string;
    colMicrosoft: string;
    colGoogle: string;
    mascotTitle: string;
    mascotExplore: string;
    directoryCards: {
      href: string;
      title: string;
      desc: string;
      tag: string;
      icon: "models" | "keys" | "playground" | "debug" | "docs" | "app";
    }[];
  }
> = {
  ar: {
    heroBadge: "منظومة KASPI POS الذكية • متوافق مع OpenAI & Azure",
    heroTitle: "منصة HEYUKA السيادية للمطورين",
    heroSubtitle:
      "بوابة برمجية احترافية متعددة الصفحات بهوية KASPI الزجاجية الكريستالية: استخرج مفاتيح API حقيقية، افحصها بمصحح Debug الحي، وادمج قدرات التفكير والكود والرؤية والصوتيات في مشروعك فوراً.",
    createKeyCta: "إنشاء مفتاح API حقيقي",
    debugCta: "فحص المفتاح في Live Debugger",
    baseUrlTitle: "رابط البوابة الرئيسي (Base URL)",
    aliasUrlTitle: "رابط التوافق المباشر (OpenAI Root Alias)",
    gatewayStatusOnline: "البوابة جاهزة • CORS مفعل",
    directoryTitle: "أقسام المنصة المرتبة",
    directorySub:
      "هيكلة معيارية مقسّمة بوضوح على غرار منصات OpenAI و Microsoft Azure AI لتجد كل أداة في صفحتها الخاصة.",
    compareTitle: "مقارنة تقنية شفافة: HEYUKA من KASPI مقابل OpenAI و Microsoft و Google / DeepSeek",
    compareSub:
      "مقارنة موضوعية بين تجربة المطور، توافق الرؤوس والبروتوكولات، تشخيص الأخطاء (Debug)، والقدرات المدمجة لكل منصة.",
    colFeature: "معيار التقييم والمعمارية",
    colHeyuka: "HEYUKA (KASPI)",
    colOpenai: "OpenAI Platform",
    colMicrosoft: "Microsoft Azure AI",
    colGoogle: "Google / DeepSeek",
    mascotTitle: "استعراض حي لهوية HEYUKA الثلاثية الأبعاد",
    mascotExplore: "تصفح 32 شخصية وتحميل التطبيق",
    directoryCards: [
      {
        href: "/zebra-x/models",
        title: "دليل النماذج السيادية",
        desc: "مواصفات heyuka-omni و heyuka-core و heyuka-vision مقارنة بالمنافسين.",
        tag: "Models",
        icon: "models",
      },
      {
        href: "/zebra-x/api-keys",
        title: "خزنة مفاتيح API (IPK)",
        desc: "إنشاء مفاتيح فريدة بتجزئة SHA-256 مع معرف Key ID مستقل وتتبع الاستهلاك.",
        tag: "Security",
        icon: "keys",
      },
      {
        href: "/zebra-x/debug",
        title: "مصحح Debug الحي (7 نقاط)",
        desc: "تحقق من أي مفتاح API، رؤوس CORS، البث المباشر SSE، وحل أخطاء الاتصال فوراً.",
        tag: "Fix Debug",
        icon: "debug",
      },
      {
        href: "/zebra-x/playground",
        title: "ملعب الاختبار التفاعلي",
        desc: "جرّب المحادثة الحية و 12 مسار REST مباشرة داخل المتصفح.",
        tag: "Playground",
        icon: "playground",
      },
      {
        href: "/zebra-x/docs",
        title: "التوثيق و OpenAPI 3.1",
        desc: "أمثلة Node.js و Python و cURL و Azure `api-key` + جدول رموز الأخطاء.",
        tag: "SDKs",
        icon: "docs",
      },
      {
        href: "/heyuka",
        title: "تطبيق HEYUKA لسطح المكتب",
        desc: "استعراض الشخصيات التفاعلية وخطوات التحميل لأنظمة Windows و macOS و Linux.",
        tag: "Desktop",
        icon: "app",
      },
    ],
  },
  fr: {
    heroBadge: "Identité Verre VisionOS KASPI • Protocole OpenAI & Azure",
    heroTitle: "Plateforme Développeurs Souveraine HEYUKA",
    heroSubtitle:
      "Console multi-pages structurée comme OpenAI Platform et Azure AI Foundry : générez des clés API cryptographiques réelles, validez-les via le Debugger Live 7 points et intégrez le raisonnement, le code et la vision.",
    createKeyCta: "Créer une Clé API Réelle",
    debugCta: "Ouvrir Live API Debugger",
    baseUrlTitle: "Base URL Principale",
    aliasUrlTitle: "Alias Racine OpenAI (`/v1`)",
    gatewayStatusOnline: "Passerelle En Ligne • CORS Actif",
    directoryTitle: "Architecture Multi-Pages Structurée",
    directorySub:
      "Chaque domaine dispose de sa propre vue dédiée pour une navigation claire sans surcharge visuelle.",
    compareTitle: "Comparatif Technique : HEYUKA par KASPI vs OpenAI, Microsoft Azure & Google / DeepSeek",
    compareSub:
      "Analyse directe de l'organisation console, du débogage API, de la compatibilité SDK et des outils intégrés.",
    colFeature: "Critère d'Architecture",
    colHeyuka: "HEYUKA (KASPI)",
    colOpenai: "OpenAI Platform",
    colMicrosoft: "Microsoft Azure AI",
    colGoogle: "Google / DeepSeek",
    mascotTitle: "Aperçu 3D Temps Réel HEYUKA",
    mascotExplore: "Explorer les 32 profils & Télécharger",
    directoryCards: [
      {
        href: "/zebra-x/models",
        title: "Catalogue des Modèles",
        desc: "heyuka-omni, heyuka-core et heyuka-vision avec benchmarks détaillés.",
        tag: "Models",
        icon: "models",
      },
      {
        href: "/zebra-x/api-keys",
        title: "Coffre Clés API (IPK)",
        desc: "Émission de clés SHA-256 uniques associées à un Key ID vérifiable.",
        tag: "Security",
        icon: "keys",
      },
      {
        href: "/zebra-x/debug",
        title: "Live Debugger (7 Points)",
        desc: "Vérifiez toute clé, CORS, streaming SSE et recevez des indices `debug_hint`.",
        tag: "Fix Debug",
        icon: "debug",
      },
      {
        href: "/zebra-x/playground",
        title: "Playground API Interactif",
        desc: "Testez le Chat SSE et les 12 endpoints REST directement en direct.",
        tag: "Playground",
        icon: "playground",
      },
      {
        href: "/zebra-x/docs",
        title: "Docs & Référence OpenAPI 3.1",
        desc: "Snippets Node, Python, cURL, Azure `api-key` et guide des codes HTTP.",
        tag: "SDKs",
        icon: "docs",
      },
      {
        href: "/heyuka",
        title: "App Desktop HEYUKA",
        desc: "Compagnon 3D interactif et étapes d'installation Windows, macOS & Linux.",
        tag: "Desktop",
        icon: "app",
      },
    ],
  },
  en: {
    heroBadge: "KASPI VisionOS Crystal Glass • OpenAI & Azure Header Compatible",
    heroTitle: "HEYUKA Sovereign AI Developer Platform",
    heroSubtitle:
      "A clean multi-page developer console modeled after OpenAI Platform and Microsoft Azure AI Foundry: issue unique SHA-256 Secret API Keys, validate integrations inside the 7-point Live Debugger, and ship multimodal apps fast.",
    createKeyCta: "Create Secret API Key",
    debugCta: "Test in Live Debugger",
    baseUrlTitle: "Primary API Base URL",
    aliasUrlTitle: "OpenAI Root Alias (`/v1`)",
    gatewayStatusOnline: "Gateway Online • CORS Enabled",
    directoryTitle: "Structured Multi-Page Workspace",
    directorySub:
      "Every capability lives in a focused, uncluttered page — matching enterprise AI developer consoles.",
    compareTitle: "Platform Comparison: HEYUKA by KASPI vs OpenAI, Microsoft Azure & Google / DeepSeek",
    compareSub:
      "Side-by-side comparison across console structure, API debugging UX, header compatibility, built-in tools, and multilingual fluency.",
    colFeature: "Capability & Architecture",
    colHeyuka: "HEYUKA (KASPI)",
    colOpenai: "OpenAI Platform",
    colMicrosoft: "Microsoft Azure AI",
    colGoogle: "Google / DeepSeek",
    mascotTitle: "Live 3D HEYUKA Identity Preview",
    mascotExplore: "Explore 32 Characters & Download App",
    directoryCards: [
      {
        href: "/zebra-x/models",
        title: "Models Directory",
        desc: "Specs and benchmarks for heyuka-omni, heyuka-core, and heyuka-vision.",
        tag: "Models",
        icon: "models",
      },
      {
        href: "/zebra-x/api-keys",
        title: "API Keys (IPK) Vault",
        desc: "Generate unique hk-live/yk-live keys with verifiable X-API-Key-Id tracking.",
        tag: "Security",
        icon: "keys",
      },
      {
        href: "/zebra-x/debug",
        title: "Live API Debugger",
        desc: "Run the 7-point diagnostic check for Auth, CORS, SSE streaming, and Sandbox.",
        tag: "Diagnostics",
        icon: "debug",
      },
      {
        href: "/zebra-x/playground",
        title: "Interactive Playground",
        desc: "Test Chat Completions and all 12 REST capabilities with live headers.",
        tag: "Playground",
        icon: "playground",
      },
      {
        href: "/zebra-x/docs",
        title: "SDK Docs & OpenAPI 3.1",
        desc: "Drop-in Node, Python, cURL, Azure api-key snippets & HTTP error guides.",
        tag: "SDKs",
        icon: "docs",
      },
      {
        href: "/heyuka",
        title: "HEYUKA Desktop App",
        desc: "32 interactive 3D companions and cross-platform installer guide.",
        tag: "Desktop",
        icon: "app",
      },
    ],
  },
};

const DIR_ICONS = {
  models: Boxes,
  keys: KeyRound,
  playground: Terminal,
  debug: Bug,
  docs: BookOpen,
  app: Sparkles,
};

export function PlatformOverviewView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const t = COPY[locale];

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [gatewayOk, setGatewayOk] = useState<boolean | null>(null);
  const [charId, setCharId] = useState("classic_heyuka");

  const activeProfile = useMemo(
    () => HEYUKA_CHARACTER_PROFILES.find((c) => c.id === charId) || HEYUKA_CHARACTER_PROFILES[0],
    [charId]
  );

  useEffect(() => {
    fetch("/api/v1/models", { cache: "no-store" })
      .then((r) => setGatewayOk(r.ok))
      .catch(() => setGatewayOk(false));
  }, []);

  const copyText = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1800);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* VisionOS Crystal Glass Hero + 3D Character Viewport */}
      <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-5 sm:p-8 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full kaspi-glass-surface text-xs font-semibold text-emerald-500">
              <Layers className="w-3.5 h-3.5" />
              <span>{t.heroBadge}</span>
            </div>

            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--kaspi-text-primary)] leading-tight">
                {t.heroTitle}
              </h1>
              <p className="text-sm sm:text-base text-[var(--kaspi-text-secondary)] leading-relaxed max-w-2xl">
                {t.heroSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/zebra-x/api-keys`}
                className="kaspi-primary-cta-btn rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold inline-flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{t.createKeyCta}</span>
              </Link>
              <Link
                href={`/${locale}/zebra-x/debug`}
                className="kaspi-glass-btn rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold inline-flex items-center gap-2"
              >
                <Bug className="w-4 h-4 text-emerald-500" />
                <span>{t.debugCta}</span>
              </Link>
            </div>

            {/* Dual Base URL Quick Copy Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                { id: "base", label: t.baseUrlTitle, url: OFFICIAL_API_BASE_URL },
                { id: "alias", label: t.aliasUrlTitle, url: OFFICIAL_ROOT_V1_URL },
              ].map((item) => (
                <div
                  key={item.id}
                  className="kaspi-frosted-surface rounded-2xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[var(--kaspi-text-muted)]">
                      {item.label}
                    </div>
                    <div dir="ltr" className="text-xs font-mono text-[var(--kaspi-text-primary)] truncate">
                      {item.url}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(item.id, item.url)}
                    className="kaspi-glass-btn rounded-xl px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--kaspi-text-muted)] pt-1">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-500">
                <Activity className="w-3.5 h-3.5" />
                {gatewayOk === false ? "Checking gateway..." : t.gatewayStatusOnline}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                SHA-256 Vault + X-API-Key-Id + Bearer / X-API-Key / api-key
              </span>
            </div>
          </div>

          {/* 3D Interactive Crystal Card */}
          <div className="lg:col-span-5 space-y-3">
            <div className="kaspi-frosted-surface rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--kaspi-text-primary)] truncate">
                  {t.mascotTitle}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full kaspi-glass-surface text-emerald-500 font-semibold">
                  {activeProfile.name}
                </span>
              </div>

              <HEYUKACreatureCanvas
                character={activeProfile}
                lighting={HEYUKA_LIGHTING_PRESETS[0]}
                compact
              />

              <div className="flex flex-wrap gap-1.5 justify-center">
                {FEATURED_SHOWCASE_IDS.map((id) => {
                  const prof = HEYUKA_CHARACTER_PROFILES.find((c) => c.id === id);
                  if (!prof) return null;
                  const active = charId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCharId(id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                        active
                          ? "kaspi-orbit-active text-[var(--kaspi-text-primary)]"
                          : "kaspi-glass-surface text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)]"
                      }`}
                    >
                      {prof.name}
                    </button>
                  );
                })}
              </div>

              <Link
                href={`/${locale}/heyuka`}
                className="w-full kaspi-glass-btn rounded-2xl px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>{t.mascotExplore}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Page Architecture Directory */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[var(--kaspi-text-primary)]">
              {t.directoryTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--kaspi-text-muted)]">
              {t.directorySub}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {t.directoryCards.map((card) => {
            const Icon = DIR_ICONS[card.icon];
            return (
              <Link
                key={card.href}
                href={`/${locale}${card.href}`}
                className="kaspi-glass-card rounded-3xl p-5 flex flex-col justify-between gap-4 hover:scale-[1.01] transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-10 h-10 rounded-2xl kaspi-glass-surface flex items-center justify-center">
                      <Icon className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-full kaspi-glass-surface text-[var(--kaspi-text-muted)]">
                      {card.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[var(--kaspi-text-primary)] flex items-center justify-between gap-2">
                      <span>{card.title}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                    </h3>
                    <p className="text-xs text-[var(--kaspi-text-secondary)] mt-1 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Side-by-Side Comparison Matrix: HEYUKA (KASPI) vs OpenAI vs Microsoft Azure vs Google/DeepSeek */}
      <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-5 sm:p-7 space-y-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-[11px] font-bold text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Benchmark &amp; Ecosystem Matrix</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-[var(--kaspi-text-primary)]">
            {t.compareTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)]">
            {t.compareSub}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl kaspi-frosted-surface">
          <table className="w-full text-xs sm:text-[13px] border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[var(--kaspi-border)]">
                <th className="p-3.5 text-start font-extrabold text-[var(--kaspi-text-primary)]">
                  {t.colFeature}
                </th>
                <th className="p-3.5 text-start font-black text-emerald-500">
                  {t.colHeyuka}
                </th>
                <th className="p-3.5 text-start font-bold text-[var(--kaspi-text-secondary)]">
                  {t.colOpenai}
                </th>
                <th className="p-3.5 text-start font-bold text-[var(--kaspi-text-secondary)]">
                  {t.colMicrosoft}
                </th>
                <th className="p-3.5 text-start font-bold text-[var(--kaspi-text-secondary)]">
                  {t.colGoogle}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--kaspi-border)]">
              {PLATFORM_COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--kaspi-surface-hover)] transition-colors">
                  <td className="p-3.5 font-bold text-[var(--kaspi-text-primary)] align-top">
                    {row.dimension[locale]}
                  </td>
                  <td className="p-3.5 align-top font-semibold text-[var(--kaspi-text-primary)]">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{row.heyuka[locale]}</span>
                    </div>
                  </td>
                  <td className="p-3.5 align-top text-[var(--kaspi-text-secondary)]">
                    {row.openai[locale]}
                  </td>
                  <td className="p-3.5 align-top text-[var(--kaspi-text-secondary)]">
                    {row.microsoft[locale]}
                  </td>
                  <td className="p-3.5 align-top text-[var(--kaspi-text-secondary)]">
                    {row.googleDeepseek[locale]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
