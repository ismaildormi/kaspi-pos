"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import {
  buildSdkQuickstart,
  HEYUKA_MODEL_SPECS,
  loadActiveConsoleKey,
  OFFICIAL_API_BASE_URL,
  OFFICIAL_ROOT_V1_URL,
  type PortalLocale,
} from "./platform-data";

type DocSectionId = "quickstart" | "pricing" | "guides" | "faq";

const FAQ_ITEMS = [
  {
    q: "How do I get a unique HEYUKA API Key without creating a POS shop?",
    a: "Click Sign in (Gmail) in the sidebar or go to API keys, enter your Gmail email, verify once, and create an `hk-live-...` secret key paired with a `hk_...` Tracking Key ID.",
  },
  {
    q: "Are HEYUKA models and API requests really $0.00 / free for developers?",
    a: "Yes. KASPI absorbs inference, web search, sandbox execution, and token costs for HEYUKA Platform developers and desktop companions. You will see estimated token value saved on the Usage page, while your billed total remains $0.00.",
  },
  {
    q: "Is HEYUKA compatible with OpenAI and Anthropic SDKs?",
    a: "Yes. Set `baseURL` to `https://kaspi-pos.vercel.app/v1` (or `/api/v1`), pass your `hk-live-...` API key in `Authorization: Bearer ...`, `X-API-Key`, or `api-key`, and use `heyuka-omni`, `heyuka-core`, or `heyuka-vision`.",
  },
  {
    q: "Why does the Share link let friends enter directly into the conversation?",
    a: "Clicking Share lets you pick specific conversation turns and mint a public `/share/sh_...` link. Anyone opening the link can sign in cleanly via Gmail and continue that exact thread in HEYUKA Chat.",
  },
  {
    q: "How does `X-API-Key-Id` verification work in the 7-Point Debugger?",
    a: "Every key is stored strictly as a SHA-256 hash. Including `X-API-Key-Id` allows strict dual-factor key verification alongside your Bearer secret without exposing secrets in logs.",
  },
];

export function PlatformDocsView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const isRtl = locale === "ar";
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<DocSectionId>("quickstart");
  const [sdkLang, setSdkLang] = useState<"curl" | "node" | "python" | "azure-fetch">("python");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState("hk-live-YOUR_API_KEY");
  const [activeKeyId, setActiveKeyId] = useState("hk_YOUR_KEY_ID");

  useEffect(() => {
    const requested = searchParams?.get("tab");
    if (requested === "pricing" || requested === "faq" || requested === "guides") {
      setTab(requested);
    }
  }, [searchParams]);

  useEffect(() => {
    const saved = loadActiveConsoleKey();
    if (saved.secretKey) setActiveKey(saved.secretKey);
    if (saved.keyId) setActiveKeyId(saved.keyId);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeSnippet = useMemo(
    () =>
      buildSdkQuickstart({
        lang: sdkLang,
        endpointMode: "root_v1",
        secretKey: activeKey,
        keyId: activeKeyId,
      }),
    [sdkLang, activeKey, activeKeyId]
  );

  const pythonSnippet = useMemo(
    () =>
      buildSdkQuickstart({
        lang: "python",
        endpointMode: "root_v1",
        secretKey: activeKey,
        keyId: activeKeyId,
      }),
    [activeKey, activeKeyId]
  );

  const markdownDoc = `# HEYUKA API Quickstart\n\n- base_url (OpenAI): ${OFFICIAL_ROOT_V1_URL}\n- base_url (Full API): ${OFFICIAL_API_BASE_URL}\n- models: heyuka-omni, heyuka-core, heyuka-vision\n\n\`\`\`python\n${pythonSnippet}\n\`\`\``;

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1800);
    } catch {}
  };

  const filteredFaq = FAQ_ITEMS.filter(
    (item) =>
      !searchQuery.trim() ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Docs Bar matching api-docs.deepseek.com */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--kaspi-border)]">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "quickstart" as const, label: "Quick Start" },
            { id: "guides" as const, label: "API Guides" },
            { id: "pricing" as const, label: "Models & Pricing ($0.00)" },
            { id: "faq" as const, label: "FAQ" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                tab === item.id
                  ? "text-rose-400 border-b-2 border-rose-500 rounded-b-none"
                  : "text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="inline-flex items-center justify-between gap-6 px-3 py-1.5 rounded-lg kaspi-glass-surface text-xs text-[var(--kaspi-text-muted)] hover:border-rose-500/40 cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span>Search Docs...</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">ctrl K</kbd>
        </button>
      </div>

      {/* Main Layout: Left Sidebar Index + Center Article + Right TOC (matching Screenshot 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 space-y-1">
          {[
            { id: "quickstart" as const, label: "Your First API Call" },
            { id: "pricing" as const, label: "Models & Pricing ($0.00)" },
            { id: "guides" as const, label: "Token & Error Reference" },
            { id: "faq" as const, label: "Frequently Asked (FAQ)" },
          ].map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => setTab(nav.id)}
              className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                tab === nav.id
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  : "text-[var(--kaspi-text-secondary)] hover:bg-white/[0.05]"
              }`}
            >
              {nav.label}
            </button>
          ))}
          <Link
            href={`/${locale}/zebra-x/debug`}
            className="block px-3 py-2 rounded-xl text-xs font-medium text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)]"
          >
            Live 7-Point Debugger →
          </Link>
        </aside>

        {/* Center Documentation Body */}
        <div className="lg:col-span-7 space-y-6">
          {tab === "quickstart" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--kaspi-text-primary)]">
                    Your First API Call
                  </h2>
                  <p className="text-xs text-[var(--kaspi-text-secondary)] mt-1 leading-relaxed">
                    The HEYUKA API uses an interface fully compatible with OpenAI and HTTP REST clients.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy("copy-md", markdownDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg kaspi-glass-surface text-xs font-medium text-[var(--kaspi-text-primary)] cursor-pointer"
                >
                  {copiedId === "copy-md" ? <Check className="w-3.5 h-3.5 text-rose-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === "copy-md" ? "Copied" : "Copy Markdown"}</span>
                </button>
              </div>

              {/* Exact DeepSeek Quickstart Parameter Table */}
              <div className="rounded-xl kaspi-glass-surface overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--kaspi-border)] text-[var(--kaspi-text-muted)] font-semibold">
                      <th className="py-2.5 px-4 text-start w-44">PARAM</th>
                      <th className="py-2.5 px-4 text-start">VALUE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--kaspi-border)]">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--kaspi-text-primary)]">
                        base_url (OpenAI)
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-400">
                        {OFFICIAL_ROOT_V1_URL}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--kaspi-text-primary)]">
                        base_url (Full v1)
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--kaspi-text-secondary)]">
                        {OFFICIAL_API_BASE_URL}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--kaspi-text-primary)]">
                        api_key
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/${locale}/zebra-x/api-keys`}
                          className="text-rose-400 underline font-semibold"
                        >
                          apply for a free API key
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-[var(--kaspi-text-primary)]">
                        model
                      </td>
                      <td className="py-3 px-4 space-x-1.5 space-y-1">
                        {["heyuka-omni", "heyuka-core", "heyuka-vision"].map((m) => (
                          <code
                            key={m}
                            className="inline-block px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-[var(--kaspi-text-primary)]"
                          >
                            {m}
                          </code>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SDK Code Tabs */}
              <div className="rounded-xl kaspi-glass-surface overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[var(--kaspi-border)] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    {(["python", "node", "curl", "azure-fetch"] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSdkLang(lang)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase cursor-pointer ${
                          sdkLang === lang
                            ? "bg-white text-zinc-900"
                            : "text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)]"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopy("sdk-code", activeSnippet)}
                    className="inline-flex items-center gap-1 text-xs text-rose-400 font-semibold cursor-pointer"
                  >
                    {copiedId === "sdk-code" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === "sdk-code" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-4 text-[11px] font-mono overflow-x-auto text-[var(--kaspi-text-primary)] leading-relaxed">
                  {activeSnippet}
                </pre>
              </div>
            </div>
          )}

          {tab === "pricing" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--kaspi-text-primary)]">
                    Models & Pricing ($0.00 Free Coverage)
                  </h2>
                  <p className="text-xs text-[var(--kaspi-text-secondary)] mt-1">
                    KASPI subsidizes 100% of HEYUKA inference tokens — developer rate is $0.00 across all models.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-xs font-bold text-rose-400">
                  $0.00 / 1M Tokens
                </span>
              </div>

              <div className="rounded-xl kaspi-glass-surface overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--kaspi-border)] text-[var(--kaspi-text-muted)]">
                      <th className="py-3 px-4 text-start">Model ID</th>
                      <th className="py-3 px-4 text-start">Context</th>
                      <th className="py-3 px-4 text-start">Capabilities</th>
                      <th className="py-3 px-4 text-end">Developer Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--kaspi-border)]">
                    {HEYUKA_MODEL_SPECS.map((m) => (
                      <tr key={m.id}>
                        <td className="py-3 px-4 font-mono font-bold text-rose-400">{m.id}</td>
                        <td className="py-3 px-4 text-[var(--kaspi-text-primary)]">
                          {m.contextWindow}
                        </td>
                        <td className="py-3 px-4 text-[var(--kaspi-text-secondary)]">
                          {m.modalities.slice(0, 3).join(", ")}
                        </td>
                        <td className="py-3 px-4 text-end font-mono font-bold text-[var(--kaspi-text-primary)]">
                          $0.00 (Free)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "guides" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[var(--kaspi-text-primary)]">
                Authentication & Error Codes
              </h2>
              <div className="space-y-2.5">
                {[
                  {
                    code: "401 unauthorized",
                    detail: "Missing key — pass `Authorization: Bearer hk-live-...` or `X-API-Key` header.",
                  },
                  {
                    code: "401 key_id_mismatch",
                    detail: "`X-API-Key-Id` does not match the hashed API key.",
                  },
                  {
                    code: "403 permission_error",
                    detail: "Create an All Capabilities key or add the missing endpoint scope.",
                  },
                  {
                    code: "204 OPTIONS CORS",
                    detail: "Browser preflight supported cleanly with Access-Control-Allow-Origin: *.",
                  },
                ].map((err) => (
                  <div key={err.code} className="p-3.5 rounded-xl kaspi-glass-surface text-xs space-y-1">
                    <span className="font-mono font-bold text-rose-400">{err.code}</span>
                    <p className="text-[var(--kaspi-text-secondary)]">{err.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "faq" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[var(--kaspi-text-primary)]">
                Help & Frequently Asked Questions
              </h2>
              <div className="space-y-2.5">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={item.q} className="rounded-xl kaspi-glass-surface overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        className="w-full px-4 py-3.5 flex items-center justify-between gap-2 text-start text-xs font-bold text-[var(--kaspi-text-primary)] cursor-pointer"
                      >
                        <span>{item.q}</span>
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[var(--kaspi-text-muted)] shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs text-[var(--kaspi-text-secondary)] leading-relaxed border-t border-[var(--kaspi-border)] pt-2.5">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right TOC Column matching api-docs.deepseek.com */}
        <aside className="lg:col-span-2 hidden lg:block space-y-2 text-[11px] sticky top-4">
          <p className="font-bold uppercase tracking-wider text-[var(--kaspi-text-muted)]">
            On this page
          </p>
          <ul className="space-y-1.5 text-[var(--kaspi-text-secondary)] border-l border-[var(--kaspi-border)] pl-3">
            <li className="text-rose-400 font-semibold">Endpoints & Headers</li>
            <li>OpenAI `/v1` Drop-in</li>
            <li>Live Search & DeepThink</li>
            <li>Zero-Cost Coverage ($0.00)</li>
          </ul>
        </aside>
      </div>

      {/* Ctrl+K Search Modal */}
      <KaspiGlassModalPortal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-lg rounded-2xl kaspi-opaque-glass-modal p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--kaspi-border)] pb-2.5">
            <Search className="w-4 h-4 text-rose-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search HEYUKA API Docs, endpoints, or FAQ..."
              className="flex-1 bg-transparent text-xs text-[var(--kaspi-text-primary)] placeholder:text-[var(--kaspi-text-muted)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-1 rounded hover:bg-white/10 text-[var(--kaspi-text-muted)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {filteredFaq.map((f) => (
              <button
                key={f.q}
                type="button"
                onClick={() => {
                  setTab("faq");
                  setSearchOpen(false);
                }}
                className="w-full text-start p-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer space-y-1"
              >
                <p className="text-xs font-bold text-[var(--kaspi-text-primary)]">{f.q}</p>
                <p className="text-[11px] text-[var(--kaspi-text-muted)] line-clamp-2">{f.a}</p>
              </button>
            ))}
          </div>
        </div>
      </KaspiGlassModalPortal>
    </div>
  );
}
