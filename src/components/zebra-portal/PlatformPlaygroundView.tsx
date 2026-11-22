"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Check, Copy, Eye, EyeOff, Play, Sparkles, Terminal } from "lucide-react";
import {
  loadActiveConsoleKey,
  OFFICIAL_API_BASE_URL,
  saveActiveConsoleKey,
  type PortalLocale,
} from "./platform-data";

type EndpointId =
  | "/api/v1/chat/completions"
  | "/api/v1/magic"
  | "/api/v1/studio/council"
  | "/api/v1/studio/browser-factory"
  | "/api/v1/studio/team"
  | "/api/v1/desktops/spawn"
  | "/api/v1/os/exec"
  | "/api/v1/ai-pc/control"
  | "/api/v1/heyuka/local-sdk"
  | "/api/v1/debug"
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
  | "/api/v1/zebra-x/auto-connect";

const ENDPOINT_LIST: EndpointId[] = [
  "/api/v1/chat/completions",
  "/api/v1/magic",
  "/api/v1/studio/council",
  "/api/v1/studio/browser-factory",
  "/api/v1/studio/team",
  "/api/v1/desktops/spawn",
  "/api/v1/os/exec",
  "/api/v1/ai-pc/control",
  "/api/v1/heyuka/local-sdk",
  "/api/v1/debug",
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
];

const COPY: Record<
  PortalLocale,
  {
    badge: string;
    title: string;
    subtitle: string;
    authTitle: string;
    keyPlaceholder: string;
    keyIdPlaceholder: string;
    endpointLabel: string;
    modelLabel: string;
    toolsToggle: string;
    streamToggle: string;
    payloadLabel: string;
    sendBtn: string;
    sendingBtn: string;
    copyCurl: string;
    copied: string;
    responseLabel: string;
    headersLabel: string;
  }
> = {
  ar: {
    badge: "ملعب الاختبار الحي • Chat SSE & 13 Endpoints",
    title: "ملعب الاختبار التفاعلي للواجهة البرمجية",
    subtitle:
      "اختبر النماذج مباشرة أو أرسل طلبات REST حية مع فحص الترويسات (Headers)، زمن الاستجابة، والبث المباشر Streaming SSE.",
    authTitle: "بيانات المصادقة للاختبار (يُستخدم مفتاح جلستك إن وُجد)",
    keyPlaceholder: "الصق hk-live-... (أو اتركه لاستخدام الجلسة)",
    keyIdPlaceholder: "اختياري: Key ID (hk_...)",
    endpointLabel: "اختر نقطة النهاية (Endpoint)",
    modelLabel: "النموذج",
    toolsToggle: "تفعيل الأدوات الحية (enableTools)",
    streamToggle: "بث مباشر (SSE Stream)",
    payloadLabel: "جسم الطلب (JSON Request Body)",
    sendBtn: "إرسال الطلب الحي الآن",
    sendingBtn: "جاري التنفيذ...",
    copyCurl: "نسخ كود cURL",
    copied: "تم النسخ OK",
    responseLabel: "نتيجة الاستجابة المباشرة",
    headersLabel: "ترويسات التشخيص المستلمة",
  },
  fr: {
    badge: "Playground Live • Chat SSE & 13 Endpoints",
    title: "Playground API Interactif en Direct",
    subtitle:
      "Testez les modèles HEYUKA ou lancez des requêtes REST en inspectant latence, X-Request-Id et streaming SSE en direct.",
    authTitle: "Authentification de test (session active ou clé API)",
    keyPlaceholder: "Collez hk-live-... (optionnel si connecté)",
    keyIdPlaceholder: "Optionnel : Key ID (hk_...)",
    endpointLabel: "Choisir l'endpoint REST",
    modelLabel: "Modèle",
    toolsToggle: "Outils autonomes (enableTools)",
    streamToggle: "Streaming temps réel (SSE)",
    payloadLabel: "Corps de requête (JSON)",
    sendBtn: "Exécuter la requête maintenant",
    sendingBtn: "Exécution...",
    copyCurl: "Copier cURL",
    copied: "Copié OK",
    responseLabel: "Réponse brute / Flux reçu",
    headersLabel: "En-têtes de diagnostic reçus",
  },
  en: {
    badge: "Live API Workbench • Chat SSE & 13 REST Endpoints",
    title: "Interactive Full-Stack API Playground",
    subtitle:
      "Test HEYUKA models interactively or execute raw REST requests while inspecting live status codes, SSE streams, latency, and X-Request-Id headers.",
    authTitle: "Test Credentials (uses your active browser session if left blank)",
    keyPlaceholder: "Paste hk-live-... (or leave blank for signed-in session)",
    keyIdPlaceholder: "Optional: Key ID (hk_...)",
    endpointLabel: "Select REST Endpoint",
    modelLabel: "Model",
    toolsToggle: "Autonomous Tools (enableTools)",
    streamToggle: "Real-Time Streaming (SSE)",
    payloadLabel: "Request Payload (JSON)",
    sendBtn: "Send Live Request",
    sendingBtn: "Executing...",
    copyCurl: "Copy cURL",
    copied: "Copied OK",
    responseLabel: "Live Response Output",
    headersLabel: "Diagnostic Response Headers",
  },
};

function defaultPayloadFor(
  ep: EndpointId,
  model: "heyuka-omni" | "heyuka-core" | "heyuka-vision",
  enableTools: boolean,
  stream: boolean
): string {
  switch (ep) {
    case "/api/v1/chat/completions":
      return JSON.stringify(
        {
          model,
          enableTools,
          stream,
          messages: [
            { role: "user", content: "Calculate 1500 + 20% VAT and summarize cleanly." },
          ],
        },
        null,
        2
      );
    case "/api/v1/models":
    case "/api/v1/debug":
    case "/api/v1/3d/assets":
      return "{}";
    case "/api/v1/public-apis":
      return JSON.stringify({ category: "fx_rates", query: "MAD", limit: 5 }, null, 2);
    case "/api/v1/images/generate":
      return JSON.stringify(
        { prompt: "sleek frosted glass retail showcase studio lighting", action: "generate" },
        null,
        2
      );
    case "/api/v1/sandbox/execute":
      return JSON.stringify(
        { language: "python", code: "print('HEYUKA Live Compute:', 21 * 2)" },
        null,
        2
      );
    case "/api/v1/web/research":
      return JSON.stringify({ query: "Morocco renewable energy solar projects" }, null, 2);
    case "/api/v1/vision/remove-bg":
      return JSON.stringify(
        {
          imageUrl:
            "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png",
        },
        null,
        2
      );
    case "/api/v1/3d/generate":
      return JSON.stringify({ prompt: "modern minimalist armchair", format: "glb" }, null, 2);
    case "/api/v1/audio/transcribe":
      return JSON.stringify(
        { mediaUrl: "https://example.com/voice-note.mp3", language: "ar" },
        null,
        2
      );
    case "/api/v1/audio/separate":
      return JSON.stringify({ mediaUrl: "https://example.com/song.mp3", stems: "2stems" }, null, 2);
    case "/api/v1/magic":
      return JSON.stringify(
        {
          prompt: "Build KASPI POS live profit & stock AI dashboard",
          brand: "kaspi_pos",
          scale: "auto",
          locale: "ar",
        },
        null,
        2
      );
    case "/api/v1/studio/council":
      return JSON.stringify(
        { prompt: "Architect multi-agent POS & Cloud deployment pipeline", scale: "12x_titan", brand: "heyuka" },
        null,
        2
      );
    case "/api/v1/studio/browser-factory":
      return JSON.stringify(
        { projectName: "heyuka-sovereign-app", cloudTargets: ["github", "vercel", "supabase"] },
        null,
        2
      );
    case "/api/v1/studio/team":
      return JSON.stringify({ action: "offline_manifest" }, null, 2);
    case "/api/v1/desktops/spawn":
      return JSON.stringify({ task: "Inspect supplier prices on isolated KasmVNC desktop" }, null, 2);
    case "/api/v1/os/exec":
      return JSON.stringify({ action: "shell", command: "Get-ComputerInfo | Select OSName" }, null, 2);
    case "/api/v1/ai-pc/control":
      return JSON.stringify({ action: "scroll", direction: "down", amount: 300 }, null, 2);
    case "/api/v1/heyuka/local-sdk":
      return JSON.stringify({ prompt: "Generate local zero-key Node SDK server test", mode: "studio", locale: "en" }, null, 2);
    default:
      return JSON.stringify(
        { specUrl: "https://petstore3.swagger.io/api/v3/openapi.json" },
        null,
        2
      );
  }
}

export function PlatformPlaygroundView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const t = COPY[locale];

  const [bearerKey, setBearerKey] = useState("");
  const [keyId, setKeyId] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [endpoint, setEndpoint] = useState<EndpointId>("/api/v1/chat/completions");
  const [model, setModel] = useState<"heyuka-omni" | "heyuka-core" | "heyuka-vision">("heyuka-omni");
  const [enableTools, setEnableTools] = useState(true);
  const [stream, setStream] = useState(false);
  const [bodyText, setBodyText] = useState(() =>
    defaultPayloadFor("/api/v1/chat/completions", "heyuka-omni", true, false)
  );
  const [busy, setBusy] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [respHeaders, setRespHeaders] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [copiedCurl, setCopiedCurl] = useState(false);

  useEffect(() => {
    const saved = loadActiveConsoleKey();
    if (saved.secretKey) setBearerKey(saved.secretKey);
    if (saved.keyId) setKeyId(saved.keyId);
  }, []);

  const selectEndpoint = (ep: EndpointId) => {
    setEndpoint(ep);
    setBodyText(defaultPayloadFor(ep, model, enableTools, stream));
  };

  const syncChatOptions = (
    nextModel: "heyuka-omni" | "heyuka-core" | "heyuka-vision",
    nextTools: boolean,
    nextStream: boolean
  ) => {
    setModel(nextModel);
    setEnableTools(nextTools);
    setStream(nextStream);
    if (endpoint === "/api/v1/chat/completions") {
      setBodyText(defaultPayloadFor(endpoint, nextModel, nextTools, nextStream));
    }
  };

  const isGetEndpoint =
    endpoint === "/api/v1/models" ||
    endpoint === "/api/v1/debug" ||
    endpoint === "/api/v1/3d/assets";

  const generatedCurl = useMemo(() => {
    const k = bearerKey.trim() || "hk-live-YOUR_SECRET_KEY";
    const idLine = keyId.trim() ? ` \\\n  -H "X-API-Key-Id: ${keyId.trim()}"` : "";
    const fullUrl = `${OFFICIAL_API_BASE_URL.replace(/\/api\/v1$/, "")}${endpoint}`;
    if (isGetEndpoint) {
      return `curl "${fullUrl}" \\\n  -H "Authorization: Bearer ${k}"${idLine}`;
    }
    return `curl -X POST "${fullUrl}" \\\n  -H "Authorization: Bearer ${k}"${idLine} \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyText}'`;
  }, [bearerKey, keyId, endpoint, isGetEndpoint, bodyText]);

  const runRequest = async () => {
    setBusy(true);
    setOutput("");
    setStatusCode(null);
    setRespHeaders({});
    if (bearerKey.trim()) saveActiveConsoleKey(bearerKey, keyId);
    const t0 = performance.now();
    try {
      const headers: Record<string, string> = {};
      if (!isGetEndpoint) headers["Content-Type"] = "application/json";
      if (bearerKey.trim()) headers.Authorization = `Bearer ${bearerKey.trim()}`;
      if (keyId.trim()) headers["X-API-Key-Id"] = keyId.trim();

      const res = await fetch(endpoint, {
        method: isGetEndpoint ? "GET" : "POST",
        headers,
        body: isGetEndpoint ? undefined : bodyText,
      });

      setStatusCode(res.status);
      setLatencyMs(Math.round(performance.now() - t0));
      setRespHeaders({
        "X-Request-Id": res.headers.get("X-Request-Id") || "-",
        "Content-Type": res.headers.get("Content-Type") || "-",
        "Access-Control-Allow-Origin": res.headers.get("Access-Control-Allow-Origin") || "-",
        "X-HEYUKA-Latency-Ms": res.headers.get("X-HEYUKA-Latency-Ms") || "-",
      });

      const ct = res.headers.get("Content-Type") || "";
      if (ct.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          setOutput(buffer);
        }
      } else {
        const text = await res.text();
        try {
          setOutput(JSON.stringify(JSON.parse(text), null, 2));
        } catch {
          setOutput(text);
        }
      }
    } catch (err: any) {
      setOutput(JSON.stringify({ error: err?.message || "Network request failed" }, null, 2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="kaspi-glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-rose-500">
            <Terminal className="w-3.5 h-3.5" />
            <span>{t.badge.replace("13 ", "21 ")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--kaspi-text-primary)]">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-3xl">
            {t.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={`/${locale}/studio?brand=heyuka`}
            className="kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{locale === "ar" ? "فتح HEYUKA Studio" : "Open HEYUKA AI Studio"}</span>
          </Link>
          <Link
            href={`/${locale}/studio?brand=kaspi_pos`}
            className="rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2 border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{locale === "ar" ? "فتح KASPI POS Studio" : "KASPI POS Studio"}</span>
          </Link>
        </div>
      </section>

      {/* Credentials Bar */}
      <section className="kaspi-glass-card rounded-3xl p-5 space-y-3">
        <div className="text-xs font-bold text-[var(--kaspi-text-secondary)]">{t.authTitle}</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7 relative">
            <input
              dir="ltr"
              type={showKey ? "text" : "password"}
              value={bearerKey}
              onChange={(e) => setBearerKey(e.target.value)}
              placeholder={t.keyPlaceholder}
              className="w-full rounded-2xl kaspi-glass-surface px-4 py-2.5 pe-11 text-xs font-mono text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute inset-y-0 right-3 flex items-center text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)] cursor-pointer"
              aria-label="Toggle Key Visibility"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="md:col-span-5">
            <input
              dir="ltr"
              type="text"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder={t.keyIdPlaceholder}
              className="w-full rounded-2xl kaspi-glass-surface px-4 py-2.5 text-xs font-mono text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Controls & Payload */}
        <section className="lg:col-span-6 kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-5 space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-bold text-[var(--kaspi-text-secondary)]">
              {t.endpointLabel}
            </div>
            <div dir="ltr" className="flex flex-wrap gap-1.5">
              {ENDPOINT_LIST.map((ep) => {
                const active = endpoint === ep;
                return (
                  <button
                    key={ep}
                    type="button"
                    onClick={() => selectEndpoint(ep)}
                    className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      active
                        ? "kaspi-orbit-active text-rose-500"
                        : "kaspi-glass-surface text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
                    }`}
                  >
                    {ep.replace("/api/v1", "")}
                  </button>
                );
              })}
            </div>
          </div>

          {endpoint === "/api/v1/chat/completions" && (
            <div className="kaspi-frosted-surface rounded-2xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[var(--kaspi-text-muted)]">
                  {t.modelLabel}:
                </span>
                {(["heyuka-omni", "heyuka-core", "heyuka-vision"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => syncChatOptions(m, enableTools, stream)}
                    className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold cursor-pointer ${
                      model === m
                        ? "kaspi-orbit-active text-rose-500"
                        : "kaspi-glass-surface text-[var(--kaspi-text-muted)]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => syncChatOptions(model, !enableTools, stream)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer ${
                    enableTools
                      ? "kaspi-orbit-active text-rose-500"
                      : "kaspi-glass-surface text-[var(--kaspi-text-muted)]"
                  }`}
                >
                  <Sparkles className="w-3 h-3 inline me-1" />
                  {t.toolsToggle}: {enableTools ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => syncChatOptions(model, enableTools, !stream)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer ${
                    stream
                      ? "kaspi-orbit-active text-rose-500"
                      : "kaspi-glass-surface text-[var(--kaspi-text-muted)]"
                  }`}
                >
                  {t.streamToggle}: {stream ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-xs font-bold text-[var(--kaspi-text-secondary)]">
              {t.payloadLabel}
            </div>
            <textarea
              dir="ltr"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={9}
              className="w-full rounded-2xl kaspi-frosted-surface p-3.5 font-mono text-xs text-[var(--kaspi-text-primary)] focus:outline-none resize-y"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={runRequest}
              className="flex-1 kaspi-primary-cta-btn rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Play className="w-4 h-4" />
              <span>{busy ? t.sendingBtn : t.sendBtn}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(generatedCurl);
                  setCopiedCurl(true);
                  setTimeout(() => setCopiedCurl(false), 1800);
                } catch {}
              }}
              className="kaspi-glass-btn rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCurl ? (
                <Check className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedCurl ? t.copied : t.copyCurl}</span>
            </button>
          </div>
        </section>

        {/* Right: Output & Headers */}
        <section className="lg:col-span-6 kaspi-glass-card rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-[var(--kaspi-text-secondary)]">
              {t.responseLabel}
            </span>
            <div dir="ltr" className="flex items-center gap-2 text-[11px] font-mono">
              {statusCode !== null && (
                <span
                  className={`px-2.5 py-0.5 rounded-full kaspi-glass-surface font-bold ${
                    statusCode < 400 ? "text-rose-500" : "text-rose-500"
                  }`}
                >
                  HTTP {statusCode}
                </span>
              )}
              {latencyMs !== null && (
                <span className="px-2.5 py-0.5 rounded-full kaspi-glass-surface text-[var(--kaspi-text-muted)]">
                  {latencyMs} ms
                </span>
              )}
            </div>
          </div>

          {Object.keys(respHeaders).length > 0 && (
            <div className="kaspi-frosted-surface rounded-2xl p-3 space-y-1.5">
              <div className="text-[11px] font-bold text-[var(--kaspi-text-muted)]">
                {t.headersLabel}
              </div>
              <div dir="ltr" className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono">
                {Object.entries(respHeaders).map(([k, v]) => (
                  <div key={k} className="truncate">
                    <span className="text-[var(--kaspi-text-muted)]">{k}: </span>
                    <span className="text-[var(--kaspi-text-primary)] font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <pre
            dir="ltr"
            className="w-full min-h-[290px] max-h-[430px] overflow-auto rounded-2xl kaspi-frosted-surface p-4 font-mono text-xs text-[var(--kaspi-text-primary)] whitespace-pre-wrap break-words"
          >
            {output || "// Response JSON or SSE stream will appear here..."}
          </pre>
        </section>
      </div>
    </div>
  );
}
