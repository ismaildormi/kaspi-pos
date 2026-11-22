"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  Bug,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Play,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  loadActiveConsoleKey,
  saveActiveConsoleKey,
  type PortalLocale,
} from "./platform-data";

type HeaderMode = "bearer" | "x-api-key" | "api-key";

interface DiagnosticResult {
  id: string;
  label: string;
  endpoint: string;
  method: "OPTIONS" | "GET" | "POST";
  status: "idle" | "running" | "pass" | "fail";
  httpCode?: number;
  latencyMs?: number;
  requestId?: string;
  corsOrigin?: string;
  summary?: string;
  hint?: string;
  rawSnippet?: string;
}

const INITIAL_CHECKS: Omit<DiagnosticResult, "status">[] = [
  {
    id: "cors-options",
    label: "1. CORS Preflight Check",
    endpoint: "/api/v1/debug",
    method: "OPTIONS",
  },
  {
    id: "debug-auth",
    label: "2. API Key & Scope Verification",
    endpoint: "/api/v1/debug",
    method: "GET",
  },
  {
    id: "models-list",
    label: "3. Model Catalog & Auth Echo",
    endpoint: "/api/v1/models",
    method: "GET",
  },
  {
    id: "root-v1-alias",
    label: "4. OpenAI Root `/v1` BaseURL Alias",
    endpoint: "/v1/models",
    method: "GET",
  },
  {
    id: "chat-json",
    label: "5. Chat Completions (JSON)",
    endpoint: "/api/v1/chat/completions",
    method: "POST",
  },
  {
    id: "chat-sse",
    label: "6. Chat Completions (SSE Stream)",
    endpoint: "/api/v1/chat/completions",
    method: "POST",
  },
  {
    id: "sandbox-exec",
    label: "7. Built-In Sandbox Execution Tool",
    endpoint: "/api/v1/sandbox/execute",
    method: "POST",
  },
];

const COPY: Record<
  PortalLocale,
  {
    badge: string;
    title: string;
    subtitle: string;
    secretLabel: string;
    secretPlaceholder: string;
    keyIdLabel: string;
    keyIdPlaceholder: string;
    headerModeLabel: string;
    runAllBtn: string;
    runningBtn: string;
    copyReportBtn: string;
    copied: string;
    noKeyLink: string;
    passedLabel: string;
    failedLabel: string;
    pendingLabel: string;
    fixChecklistTitle: string;
    fixChecklistItems: string[];
  }
> = {
  ar: {
    badge: "مركز التشخيص وحل مشاكل الـ Debug • /api/v1/debug",
    title: "فاحص الـ API المباشر (7-Point Live Debugger)",
    subtitle:
      "أدخل مفتاح الـ API الخاص بك للتحقق الفوري من المصادقة، تطابق Key ID، رؤوس CORS، توافق `/v1` مع OpenAI، استجابة المحادثة والبث SSE.",
    secretLabel: "Secret API Key",
    secretPlaceholder: "الصق hk-live-... أو yk-live-... أو zx-live-...",
    keyIdLabel: "اختياري: Key ID للتحقق المزدوج",
    keyIdPlaceholder: "مثال: hk_dd50d1aff152dfee",
    headerModeLabel: "صيغة رأس المصادقة (Header Format)",
    runAllBtn: "تشغيل جميع فحوصات الـ 7 نقاط الآن",
    runningBtn: "جاري الفحص والتشخيص...",
    copyReportBtn: "نسخ تقرير Debug آمن (بدون كشف المفتاح)",
    copied: "تم النسخ OK",
    noKeyLink: "إنشاء مفتاح جديد من خزنة API Keys ←",
    passedLabel: "ناجح",
    failedLabel: "يحتاج مراجعة",
    pendingLabel: "جاهز للفحص",
    fixChecklistTitle: "أسباب مشاكل الـ Debug الشائعة التي تم حلها في النظام:",
    fixChecklistItems: [
      "دعم كامل لطلبات المتصفح/الوكلاء (CORS `Access-Control-Allow-Origin: *` و `OPTIONS 204`).",
      "دعم مسار `/v1/*` مباشرة بجانب `/api/v1/*` لمنع أخطاء 404 عند استخدام OpenAI SDK.",
      "قبول ترويسات `Authorization: Bearer` و `X-API-Key` و `api-key` (صيغة Azure) في نفس الوقت.",
      "رجوع رسالة خطأ موحدة مع `request_id` و `debug_hint` واضحة عند انتهاء الصلاحية أو نقص Scope.",
    ],
  },
  fr: {
    badge: "Diagnostic & Résolution Debug • /api/v1/debug",
    title: "Live API Debugger en Direct (7 Points)",
    subtitle:
      "Collez votre clé API pour vérifier instantanément l'authentification, le Key ID, les en-têtes CORS, l'alias `/v1`, le chat JSON et le streaming SSE.",
    secretLabel: "Secret API Key",
    secretPlaceholder: "Collez hk-live-..., yk-live-... ou zx-live-...",
    keyIdLabel: "Optionnel : Key ID (`X-API-Key-Id`)",
    keyIdPlaceholder: "Ex: hk_dd50d1aff152dfee",
    headerModeLabel: "Format d'en-tête HTTP",
    runAllBtn: "Lancer la Suite Diagnostic 7 Points",
    runningBtn: "Diagnostic en cours...",
    copyReportBtn: "Copier le rapport Debug (clé masquée)",
    copied: "Copié OK",
    noKeyLink: "Créer une clé dans le coffre API Keys →",
    passedLabel: "SUCCÈS",
    failedLabel: "ÉCHEC",
    pendingLabel: "PRÊT",
    fixChecklistTitle: "Correctifs Debug intégrés à la passerelle :",
    fixChecklistItems: [
      "CORS universel + `OPTIONS 204` pour navigateurs, sandboxes IA et applications frontales.",
      "Réécriture transparente `/v1/*` vers `/api/v1/*` pour tous les SDKs OpenAI.",
      "Support simultané des en-têtes `Authorization: Bearer`, `X-API-Key` et Azure `api-key`.",
      "Réponses d'erreur JSON enrichies avec `request_id` et `debug_hint` exploitable.",
    ],
  },
  en: {
    badge: "Live API Diagnostics • /api/v1/debug",
    title: "7-Point Live API Debugger",
    subtitle:
      "Paste any HEYUKA Secret API Key to verify CORS preflight, token hash validation, Key ID matching, OpenAI `/v1` routing, Chat JSON/SSE, and Sandbox execution.",
    secretLabel: "Secret API Key",
    secretPlaceholder: "Paste hk-live-..., yk-live-..., or zx-live-...",
    keyIdLabel: "Optional: Key ID (`X-API-Key-Id`)",
    keyIdPlaceholder: "e.g. hk_dd50d1aff152dfee",
    headerModeLabel: "Auth Header Mode",
    runAllBtn: "Run All 7 Diagnostic Checks",
    runningBtn: "Running Diagnostics...",
    copyReportBtn: "Copy Masked Debug Report",
    copied: "Copied OK",
    noKeyLink: "Need a key? Issue one in API Keys →",
    passedLabel: "PASS",
    failedLabel: "FAIL",
    pendingLabel: "READY",
    fixChecklistTitle: "Gateway Compatibility Upgrades Applied:",
    fixChecklistItems: [
      "Cross-origin preflight (`OPTIONS 204`) and `Access-Control-Allow-Origin: *` across all `/api/v1/*` & `/v1/*` routes.",
      "Automatic edge rewrite from OpenAI `/v1/*` root baseURL to `/api/v1/*`.",
      "Accepts OpenAI `Bearer`, standard `X-API-Key`, and Azure `api-key` headers simultaneously.",
      "OpenAI-formatted error envelopes with unique `X-Request-Id` and actionable `debug_hint` messages.",
    ],
  },
};

export function PlatformDebugView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const t = COPY[locale];

  const [secretKey, setSecretKey] = useState("");
  const [keyId, setKeyId] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [headerMode, setHeaderMode] = useState<HeaderMode>("bearer");
  const [runningAll, setRunningAll] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  const [results, setResults] = useState<DiagnosticResult[]>(() =>
    INITIAL_CHECKS.map((c) => ({ ...c, status: "idle" }))
  );

  useEffect(() => {
    const saved = loadActiveConsoleKey();
    if (saved.secretKey) setSecretKey(saved.secretKey);
    if (saved.keyId) setKeyId(saved.keyId);
  }, []);

  const buildHeaders = (withJsonBody = false): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (withJsonBody) headers["Content-Type"] = "application/json";
    const k = secretKey.trim();
    if (k) {
      if (headerMode === "bearer") headers.Authorization = `Bearer ${k}`;
      else if (headerMode === "x-api-key") headers["X-API-Key"] = k;
      else headers["api-key"] = k;
    }
    if (keyId.trim()) headers["X-API-Key-Id"] = keyId.trim();
    return headers;
  };

  const runSingleCheck = async (id: string) => {
    const checkDef = INITIAL_CHECKS.find((c) => c.id === id);
    if (!checkDef) return;
    if (secretKey.trim()) saveActiveConsoleKey(secretKey, keyId);

    setResults((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "running" } : r))
    );

    const t0 = performance.now();
    try {
      let res: Response;
      if (id === "cors-options") {
        res = await fetch("/api/v1/debug", { method: "OPTIONS" });
      } else if (id === "debug-auth" || id === "models-list" || id === "root-v1-alias") {
        res = await fetch(checkDef.endpoint, {
          method: "GET",
          headers: buildHeaders(false),
        });
      } else if (id === "chat-json") {
        res = await fetch("/api/v1/chat/completions", {
          method: "POST",
          headers: buildHeaders(true),
          body: JSON.stringify({
            model: "heyuka-core",
            enableTools: false,
            stream: false,
            messages: [{ role: "user", content: "Reply only: HEYUKA_DEBUG_OK" }],
          }),
        });
      } else if (id === "chat-sse") {
        res = await fetch("/api/v1/chat/completions", {
          method: "POST",
          headers: buildHeaders(true),
          body: JSON.stringify({
            model: "heyuka-core",
            enableTools: false,
            stream: true,
            messages: [{ role: "user", content: "Say OK in 2 words." }],
          }),
        });
      } else {
        res = await fetch("/api/v1/sandbox/execute", {
          method: "POST",
          headers: buildHeaders(true),
          body: JSON.stringify({
            language: "python",
            code: "print(21 + 21)",
          }),
        });
      }

      const latencyMs = Math.round(performance.now() - t0);
      const requestId = res.headers.get("X-Request-Id") || "-";
      const corsOrigin = res.headers.get("Access-Control-Allow-Origin") || "-";

      if (id === "cors-options") {
        const passed = res.status === 204 || res.status === 200;
        setResults((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: passed ? "pass" : "fail",
                  httpCode: res.status,
                  latencyMs,
                  requestId,
                  corsOrigin,
                  summary: passed
                    ? `Preflight OK (ACAO: ${corsOrigin})`
                    : `Preflight returned ${res.status}`,
                }
              : r
          )
        );
        return;
      }

      if (id === "chat-sse" && res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let preview = "";
        for (let i = 0; i < 6; i++) {
          const { done, value } = await reader.read();
          if (done) break;
          preview += decoder.decode(value, { stream: true });
          if (preview.includes("data:")) break;
        }
        try {
          await reader.cancel();
        } catch {}
        const hasSseData = preview.includes("data:");
        setResults((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: hasSseData ? "pass" : "fail",
                  httpCode: res.status,
                  latencyMs,
                  requestId,
                  corsOrigin,
                  summary: hasSseData
                    ? "SSE `data:` chunks verified cleanly"
                    : "Stream returned without SSE `data:` prefix",
                  rawSnippet: preview.slice(0, 420),
                }
              : r
          )
        );
        return;
      }

      const text = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {}

      let passed = res.ok;
      if (id === "models-list" && secretKey.trim() && parsed?.authCheck) {
        passed = res.ok && Boolean(parsed.authCheck.valid);
      }

      const hint =
        parsed?.error?.debug_hint ||
        (!passed && !secretKey.trim()
          ? "Paste your hk-live-... key above or sign in cleanly."
          : undefined);

      const summary = passed
        ? id === "debug-auth"
          ? `Authenticated via ${parsed?.auth?.mode} (Key ID: ${parsed?.auth?.keyId || "session"}, Scopes: ${parsed?.auth?.scopes?.length || 0})`
          : id === "chat-json"
          ? String(parsed?.choices?.[0]?.message?.content || "Chat reply OK").slice(0, 90)
          : id === "sandbox-exec"
          ? `Stdout: ${String(parsed?.stdout || "").trim() || "OK"}`
          : `OK • ${parsed?.data?.length || 0} models`
        : parsed?.error?.message || `HTTP ${res.status}`;

      setResults((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: passed ? "pass" : "fail",
                httpCode: res.status,
                latencyMs,
                requestId,
                corsOrigin,
                summary,
                hint,
                rawSnippet: (parsed ? JSON.stringify(parsed, null, 2) : text).slice(0, 600),
              }
            : r
        )
      );
    } catch (err: any) {
      setResults((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "fail",
                latencyMs: Math.round(performance.now() - t0),
                summary: err?.message || "Network fetch error",
              }
            : r
        )
      );
    }
  };

  const runAllChecks = async () => {
    setRunningAll(true);
    for (const chk of INITIAL_CHECKS) {
      await runSingleCheck(chk.id);
    }
    setRunningAll(false);
  };

  const copySafeReport = async () => {
    const maskedKey = secretKey.trim()
      ? `${secretKey.trim().slice(0, 12)}...${secretKey.trim().slice(-4)}`
      : "(session auth)";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://kaspi-pos.vercel.app";
    const lines = [
      "# HEYUKA AI Platform — Live Debug Report",
      `- Base URL (API): ${origin}/api/v1`,
      `- OpenAI Root URL: ${origin}/v1`,
      `- Auth Header Mode: ${headerMode}`,
      `- Key Preview: ${maskedKey}`,
      `- X-API-Key-Id: ${keyId.trim() || "(not supplied)"}`,
      "",
      "## Diagnostic Results:",
      ...results.map(
        (r) =>
          `- [${r.status.toUpperCase()}] ${r.method} ${r.endpoint} -> HTTP ${r.httpCode ?? "-"} (${r.latencyMs ?? "-"}ms, X-Request-Id: ${r.requestId ?? "-"}) — ${r.summary || ""}`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 1800);
    } catch {}
  };

  const passCount = results.filter((r) => r.status === "pass").length;

  return (
    <div className="space-y-6">
      <section className="kaspi-glass-card rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-rose-500">
            <Bug className="w-3.5 h-3.5" />
            <span>{t.badge}</span>
          </div>
          <Link
            href={`/${locale}/zebra-x/api-keys`}
            className="text-xs font-bold text-rose-500 hover:underline inline-flex items-center gap-1"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{t.noKeyLink}</span>
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[var(--kaspi-text-primary)]">
          {t.title}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-3xl leading-relaxed">
          {t.subtitle}
        </p>
      </section>

      {/* Diagnostic Input Form */}
      <section className="rounded-2xl bg-[#161618] border border-white/[0.08] p-5 sm:p-7 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 space-y-1.5">
            <label className="text-xs font-bold text-[var(--kaspi-text-secondary)]">
              {t.secretLabel}
            </label>
            <div className="relative">
              <input
                dir="ltr"
                type={showKey ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={t.secretPlaceholder}
                className="w-full rounded-2xl kaspi-glass-surface px-4 py-3 pe-11 text-xs font-mono text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute inset-y-0 right-3 flex items-center text-[var(--kaspi-text-muted)] cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-[var(--kaspi-text-secondary)]">
              {t.keyIdLabel}
            </label>
            <input
              dir="ltr"
              type="text"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder={t.keyIdPlaceholder}
              className="w-full rounded-2xl kaspi-glass-surface px-4 py-3 text-xs font-mono text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none"
            />
          </div>

          <div className="lg:col-span-3 space-y-1.5">
            <div className="text-xs font-bold text-[var(--kaspi-text-secondary)]">
              {t.headerModeLabel}
            </div>
            <div dir="ltr" className="flex flex-wrap gap-1.5">
              {(["bearer", "x-api-key", "api-key"] as HeaderMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setHeaderMode(m)}
                  className={`px-2.5 py-2.5 rounded-xl font-mono text-[11px] font-bold cursor-pointer ${
                    headerMode === m
                      ? "kaspi-orbit-active text-rose-500"
                      : "kaspi-glass-surface text-[var(--kaspi-text-muted)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--kaspi-border)]">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={runningAll}
              onClick={runAllChecks}
              className="kaspi-primary-cta-btn rounded-2xl px-6 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Play className="w-4 h-4" />
              <span>{runningAll ? t.runningBtn : t.runAllBtn}</span>
            </button>

            <button
              type="button"
              onClick={copySafeReport}
              className="kaspi-glass-btn rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              {copiedReport ? (
                <Check className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedReport ? t.copied : t.copyReportBtn}</span>
            </button>
          </div>

          <div className="text-xs font-mono px-3 py-1.5 rounded-full kaspi-frosted-surface">
            <span className="text-rose-500 font-bold">{passCount}</span> / {results.length} Passed
          </div>
        </div>
      </section>

      {/* Diagnostic Matrix */}
      <div className="space-y-3">
        {results.map((item) => (
          <div key={item.id} className="kaspi-glass-card rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {item.status === "pass" ? (
                  <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
                ) : item.status === "fail" ? (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                ) : item.status === "running" ? (
                  <RefreshCw className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-[var(--kaspi-text-muted)] shrink-0" />
                )}

                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-extrabold text-[var(--kaspi-text-primary)] truncate">
                    {item.label}
                  </div>
                  <div dir="ltr" className="text-[11px] font-mono text-[var(--kaspi-text-muted)] truncate">
                    {item.method} {item.endpoint}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {item.httpCode !== undefined && (
                  <span
                    dir="ltr"
                    className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold kaspi-frosted-surface ${
                      item.status === "pass" ? "text-rose-500" : "text-rose-500"
                    }`}
                  >
                    HTTP {item.httpCode}
                  </span>
                )}
                {item.latencyMs !== undefined && (
                  <span dir="ltr" className="px-2.5 py-1 rounded-full font-mono text-[11px] kaspi-frosted-surface text-[var(--kaspi-text-muted)]">
                    {item.latencyMs} ms
                  </span>
                )}
                {item.requestId && item.requestId !== "-" && (
                  <span dir="ltr" className="px-2.5 py-1 rounded-full font-mono text-[11px] kaspi-frosted-surface text-[var(--kaspi-text-secondary)]">
                    {item.requestId}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => runSingleCheck(item.id)}
                  className="kaspi-glass-btn rounded-xl px-3 py-1.5 text-[11px] font-bold cursor-pointer"
                >
                  Run
                </button>
              </div>
            </div>

            {item.summary && (
              <div className="text-xs text-[var(--kaspi-text-primary)] kaspi-frosted-surface rounded-2xl p-3 font-medium">
                {item.summary}
              </div>
            )}

            {item.hint && (
              <div className="text-xs text-amber-500 kaspi-frosted-surface rounded-2xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{item.hint}</span>
              </div>
            )}

            {item.rawSnippet && (
              <pre
                dir="ltr"
                className="rounded-2xl kaspi-frosted-surface p-3 font-mono text-[11px] text-[var(--kaspi-text-secondary)] overflow-x-auto max-h-48 whitespace-pre-wrap"
              >
                {item.rawSnippet}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Built-in Fix Checklist */}
      <section className="kaspi-glass-card rounded-3xl p-5 sm:p-6 space-y-3">
        <h2 className="text-sm sm:text-base font-black text-[var(--kaspi-text-primary)]">
          {t.fixChecklistTitle}
        </h2>
        <ul className="space-y-2 text-xs text-[var(--kaspi-text-secondary)]">
          {t.fixChecklistItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
