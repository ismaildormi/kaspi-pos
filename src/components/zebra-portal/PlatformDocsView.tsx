"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { BookOpen, Check, Code2, Copy, Download, ExternalLink, ShieldAlert } from "lucide-react";
import { HEYUKAInstallWalkthrough } from "@/components/heyuka/HEYUKAInstallWalkthrough";
import {
  buildSdkQuickstart,
  loadActiveConsoleKey,
  OFFICIAL_API_BASE_URL,
  OFFICIAL_ROOT_V1_URL,
  type PortalLocale,
} from "./platform-data";

const COPY: Record<
  PortalLocale,
  {
    badge: string;
    title: string;
    subtitle: string;
    installCta: string;
    sdkTitle: string;
    copyCode: string;
    copied: string;
    errorsTitle: string;
    openapiTitle: string;
  }
> = {
  ar: {
    badge: "التوثيق البرمجي الرسمي • OpenAPI 3.1 & SDKs",
    title: "دليل التكامل، أكواد الربط، ومرجع الأخطاء",
    subtitle:
      "ادمج HEYUKA داخل Node.js أو Python عبر مكتبة OpenAI الرسمية أو باستخدام طلبات HTTPS المباشرة على /api/v1 أو /v1.",
    installCta: "عرض جميع مراحل تحميل وتثبيت تطبيق HEYUKA",
    sdkTitle: "أمثلة ربط جاهزة للإنتاج",
    copyCode: "نسخ الكود",
    copied: "تم النسخ ✓",
    errorsTitle: "دليل رموز الأخطاء وتشخيص Debug",
    openapiTitle: "مرجع المسارات الحي (OpenAPI 3.1)",
  },
  fr: {
    badge: "Documentation Développeur • OpenAPI 3.1 & SDKs",
    title: "Guide d'Intégration SDK, Base URLs & Codes d'Erreur",
    subtitle:
      "Connectez HEYUKA en moins de 2 minutes avec le SDK OpenAI officiel (Node / Python) ou tout client HTTP sur `/api/v1` et `/v1`.",
    installCta: "Voir toutes les étapes d'installation Desktop",
    sdkTitle: "Exemples Prêts à Copier",
    copyCode: "Copier",
    copied: "Copié ✓",
    errorsTitle: "Codes HTTP & Dépannage Debug",
    openapiTitle: "Endpoints Live OpenAPI 3.1",
  },
  en: {
    badge: "Official Developer Documentation • OpenAPI 3.1",
    title: "SDK Quickstart, Auth Headers & Error Reference",
    subtitle:
      "Drop HEYUKA into any OpenAI, Azure-style `api-key`, or standard REST workflow using `/api/v1` or the OpenAI root `/v1` alias.",
    installCta: "Open Complete Desktop Install Walkthrough",
    sdkTitle: "Production Quickstart Code",
    copyCode: "Copy Snippet",
    copied: "Copied ✓",
    errorsTitle: "HTTP Status & Debug Troubleshooting",
    openapiTitle: "Live OpenAPI 3.1 Path Reference",
  },
};

const ERROR_REFERENCE = [
  {
    code: "401 unauthorized",
    cause: "Missing or unrecognized API key header",
    fix: "Send `Authorization: Bearer hk-live-...`, `X-API-Key: hk-live-...`, or Azure `api-key: hk-live-...` cleanly.",
  },
  {
    code: "401 key_id_mismatch",
    cause: "`X-API-Key-Id` does not match the hashed secret key",
    fix: "Verify both Key ID (`hk_...`) and Secret Key (`hk-live-...`) belong to the same row in API Keys.",
  },
  {
    code: "403 permission_error",
    cause: "Key scope does not include the requested endpoint",
    fix: "Create a Full Access key or select a tier containing `sandbox:execute`, `vision:remove-bg`, etc.",
  },
  {
    code: "400 invalid_request_error",
    cause: "Missing `messages[]`, invalid JSON payload, or bad query params",
    fix: "Ensure `Content-Type: application/json` and valid non-empty `messages` array.",
  },
  {
    code: "204 OPTIONS CORS",
    cause: "Browser/sandbox preflight check",
    fix: "Handled automatically across all `/api/v1/*` & `/v1/*` routes with `Access-Control-Allow-Origin: *`.",
  },
];

export function PlatformDocsView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const t = COPY[locale];

  const [lang, setLang] = useState<"node" | "python" | "azure-fetch" | "curl">("node");
  const [endpointMode, setEndpointMode] = useState<"api_v1" | "root_v1">("api_v1");
  const [savedKey, setSavedKey] = useState("");
  const [savedKeyId, setSavedKeyId] = useState("");
  const [copied, setCopied] = useState(false);
  const [openApiSpec, setOpenApiSpec] = useState<any>(null);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  useEffect(() => {
    const active = loadActiveConsoleKey();
    setSavedKey(active.secretKey);
    setSavedKeyId(active.keyId);
    fetch("/api/v1/zebra-x/openapi")
      .then((r) => (r.ok ? r.json() : null))
      .then((spec) => {
        if (spec) setOpenApiSpec(spec);
      })
      .catch(() => {});
  }, []);

  const code = buildSdkQuickstart({
    lang,
    endpointMode,
    secretKey: savedKey,
    keyId: savedKeyId,
  });

  return (
    <div className="space-y-6">
      <section className="kaspi-glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-emerald-500">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--kaspi-text-primary)]">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-2xl">
            {t.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setWalkthroughOpen(true)}
          className="kaspi-primary-cta-btn rounded-2xl px-5 py-3 text-xs font-bold inline-flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{t.installCta}</span>
        </button>
      </section>

      {/* SDK Quickstart Builder */}
      <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm sm:text-base font-black text-[var(--kaspi-text-primary)]">
            <Code2 className="w-4 h-4 text-emerald-500" />
            <span>{t.sdkTitle}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div dir="ltr" className="flex items-center gap-1 kaspi-frosted-surface rounded-full p-1">
              {(["api_v1", "root_v1"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEndpointMode(mode)}
                  className={`px-3 py-1 rounded-full font-mono text-[11px] font-bold cursor-pointer ${
                    endpointMode === mode
                      ? "kaspi-orbit-active text-emerald-500"
                      : "text-[var(--kaspi-text-muted)]"
                  }`}
                >
                  {mode === "api_v1" ? "/api/v1" : "/v1"}
                </button>
              ))}
            </div>

            <div dir="ltr" className="flex items-center gap-1 kaspi-frosted-surface rounded-full p-1">
              {(["node", "python", "azure-fetch", "curl"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                    lang === l
                      ? "kaspi-orbit-active text-emerald-500"
                      : "text-[var(--kaspi-text-muted)]"
                  }`}
                >
                  {l === "node"
                    ? "Node.js SDK"
                    : l === "python"
                    ? "Python SDK"
                    : l === "azure-fetch"
                    ? "Azure `api-key`"
                    : "cURL"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                } catch {}
              }}
              className="kaspi-glass-btn rounded-xl px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? t.copied : t.copyCode}</span>
            </button>
          </div>
        </div>

        <div dir="ltr" className="flex flex-wrap gap-2 text-[11px] font-mono text-[var(--kaspi-text-muted)]">
          <span className="px-2.5 py-1 rounded-full kaspi-frosted-surface">{OFFICIAL_API_BASE_URL}</span>
          <span className="px-2.5 py-1 rounded-full kaspi-frosted-surface">{OFFICIAL_ROOT_V1_URL}</span>
        </div>

        <pre
          dir="ltr"
          className="rounded-2xl kaspi-frosted-surface p-4 font-mono text-xs text-[var(--kaspi-text-primary)] overflow-x-auto leading-relaxed"
        >
          {code}
        </pre>
      </section>

      {/* Error Codes Reference */}
      <section className="kaspi-glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm sm:text-base font-black text-[var(--kaspi-text-primary)]">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>{t.errorsTitle}</span>
        </div>

        <div className="overflow-x-auto rounded-2xl kaspi-frosted-surface">
          <table className="w-full text-xs border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-[var(--kaspi-border)] text-[var(--kaspi-text-muted)]">
                <th className="p-3 text-start font-bold">Status / Code</th>
                <th className="p-3 text-start font-bold">Cause</th>
                <th className="p-3 text-start font-bold">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--kaspi-border)]">
              {ERROR_REFERENCE.map((row) => (
                <tr key={row.code}>
                  <td dir="ltr" className="p-3 font-mono font-bold text-emerald-500">
                    {row.code}
                  </td>
                  <td className="p-3 text-[var(--kaspi-text-secondary)]">{row.cause}</td>
                  <td className="p-3 text-[var(--kaspi-text-primary)]">{row.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* OpenAPI 3.1 Paths */}
      <section className="kaspi-glass-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm sm:text-base font-black text-[var(--kaspi-text-primary)]">
            {t.openapiTitle}
          </div>
          <a
            href="/api/v1/zebra-x/openapi"
            target="_blank"
            rel="noopener noreferrer"
            className="kaspi-glass-btn rounded-xl px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <span>OpenAPI JSON</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {openApiSpec?.paths &&
            Object.entries(openApiSpec.paths).map(([pathKey, def]: [string, any]) => {
              const method = Object.keys(def || {})[0] || "post";
              const summary = def?.[method]?.summary || "";
              return (
                <div key={pathKey} className="kaspi-frosted-surface rounded-2xl p-3.5 space-y-1">
                  <div dir="ltr" className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded-lg kaspi-glass-surface text-emerald-500 font-bold uppercase">
                      {method}
                    </span>
                    <span className="font-bold text-[var(--kaspi-text-primary)]">{pathKey}</span>
                  </div>
                  <p className="text-xs text-[var(--kaspi-text-secondary)]">{summary}</p>
                </div>
              );
            })}
        </div>
      </section>

      <HEYUKAInstallWalkthrough
        isOpen={walkthroughOpen}
        onClose={() => setWalkthroughOpen(false)}
        locale={locale}
        activeSecretKey={savedKey}
        activeKeyId={savedKeyId}
      />
    </div>
  );
}
