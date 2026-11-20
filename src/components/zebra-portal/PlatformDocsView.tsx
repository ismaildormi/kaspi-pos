"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { KaspiThemeToggle } from "@/components/theme/KaspiThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeyukaLoopMark } from "@/components/heyuka/HeyukaLoopMark";
import {
  buildSdkQuickstart,
  HEYUKA_MODEL_SPECS,
  loadActiveConsoleKey,
  OFFICIAL_API_BASE_URL,
  OFFICIAL_ROOT_V1_URL,
  type PortalLocale,
} from "./platform-data";

type DocTabId = "quickstart" | "pricing" | "guides" | "faq";

const FAQ_ITEMS = [
  {
    q: "How do I apply for a HEYUKA API Key without creating a POS account?",
    a: "Click HEYUKA Platform -> API keys, sign in with your Gmail address, and click Create new API key. Your unique Secret Key and Tracking ID work immediately.",
  },
  {
    q: "What does API usage cost for HEYUKA developers?",
    a: "Developer billing is $0.00. KASPI subsidizes 100% of HEYUKA inference, web search, sandbox execution, and token volume.",
  },
  {
    q: "Which base_url should I use in the OpenAI or Anthropic SDK?",
    a: "Set base_url to https://kaspi-pos.vercel.app/v1 for OpenAI SDKs or https://kaspi-pos.vercel.app/api/v1 for full endpoint compatibility with Bearer, X-API-Key, or api-key headers.",
  },
  {
    q: "How does public chat link sharing work in HEYUKA Chat?",
    a: "Click Share inside any chat, select messages, and click Create public link. Recipients opening the link choose Gmail and immediately enter into the same conversation.",
  },
];

export function PlatformDocsView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const isRtl = locale === "ar";
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<DocTabId>("quickstart");
  const [sdkLang, setSdkLang] = useState<"curl" | "node" | "python" | "azure-fetch">("python");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [activeKey, setActiveKey] = useState("hk-live-YOUR_API_KEY");
  const [activeKeyId, setActiveKeyId] = useState("hk_YOUR_KEY_ID");

  useEffect(() => {
    const req = searchParams?.get("tab");
    if (req === "pricing" || req === "faq" || req === "guides") setTab(req);
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

  const handleCopy = async (id: string, txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopiedId(id);
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1500);
    } catch {}
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] selection:bg-rose-600 selection:text-white"
    >
      {/* Top Crimson Announcement Strip (Screenshot 3 photocopy in Red instead of Blue) */}
      {bannerOpen && (
        <div className="relative bg-[#DC2626] text-white text-xs text-center py-2 px-4 font-medium">
          <span>
            The full suite of HEYUKA APIs is live: web search, DeepThink, TTS audio, and $0.00 sovereign keys.{" "}
            <Link href={`/${locale}/zebra-x/api-keys`} className="underline font-bold">
              Generate your key
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setBannerOpen(false)}
            className="absolute right-3 top-1.5 p-1 rounded hover:bg-white/15 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Exact api-docs.deepseek.com Top Navbar */}
      <header className="h-14 border-b border-[var(--kaspi-border)] px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link href={`/${locale}/zebra-x/docs`} className="flex items-center gap-2 shrink-0">
            <HeyukaLoopMark size="sm" variant="crimson" />
            <span className="font-bold text-sm tracking-tight">HEYUKA API Docs</span>
          </Link>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:inline-flex items-center justify-between gap-8 px-3 py-1.5 rounded-lg border border-[var(--kaspi-border)] bg-white/[0.04] text-xs text-[var(--kaspi-text-muted)] cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded border border-[var(--kaspi-border)] text-[10px] font-mono">
              ctrl K
            </kbd>
          </button>

          <nav className="hidden md:flex items-center gap-5 text-xs font-medium">
            {[
              { id: "quickstart" as const, label: "Quick Start" },
              { id: "guides" as const, label: "API Guides" },
              { id: "pricing" as const, label: "Pricing ($0.00)" },
              { id: "faq" as const, label: "FAQ" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`py-4 border-b-2 transition-colors cursor-pointer ${
                  tab === item.id
                    ? "border-rose-500 text-rose-500 font-semibold"
                    : "border-transparent text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs">
          <LanguageSwitcher />
          <Link
            href={`/${locale}/zebra-x`}
            className="inline-flex items-center gap-1 font-medium text-[var(--kaspi-text-secondary)] hover:text-rose-500"
          >
            <span>HEYUKA Platform</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <KaspiThemeToggle locale={locale} />
        </div>
      </header>

      {/* 3-Column Documentation Grid matching api-docs.deepseek.com */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 space-y-1 text-xs">
          {[
            { id: "quickstart" as const, label: "Your First API Call" },
            { id: "pricing" as const, label: "Models & Pricing" },
            { id: "guides" as const, label: "Error Codes & Headers" },
            { id: "faq" as const, label: "Frequently Asked Questions" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`w-full text-start px-3 py-2 rounded-lg font-medium cursor-pointer transition-colors ${
                tab === item.id
                  ? "bg-rose-500/15 text-rose-500 font-semibold"
                  : "text-[var(--kaspi-text-secondary)] hover:bg-white/[0.05]"
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-4 border-t border-[var(--kaspi-border)] space-y-1">
            <p className="px-3 text-[11px] font-semibold text-[var(--kaspi-text-muted)]">
              Tools & Integrations
            </p>
            <Link
              href={`/${locale}/zebra-x/debug`}
              className="block px-3 py-1.5 rounded-lg text-[var(--kaspi-text-secondary)] hover:text-rose-500"
            >
              7-Point Live API Debugger
            </Link>
            <Link
              href={`/${locale}/chat`}
              className="block px-3 py-1.5 rounded-lg text-[var(--kaspi-text-secondary)] hover:text-rose-500"
            >
              HEYUKA Free Web Chat
            </Link>
            <Link
              href={`/${locale}/zebra-x/contact`}
              className="block px-3 py-1.5 rounded-lg text-[var(--kaspi-text-secondary)] hover:text-rose-500"
            >
              Help, Messaging &amp; Feedback
            </Link>
          </div>
        </aside>

        <main className="lg:col-span-7 space-y-6">
          {tab === "quickstart" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Your First API Call</h1>
                <button
                  type="button"
                  onClick={() =>
                    void handleCopy(
                      "md",
                      `# Your First API Call\n\n- base_url: ${OFFICIAL_ROOT_V1_URL}\n\`\`\`python\n${pythonSnippet}\n\`\`\``
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--kaspi-border)] text-xs font-medium cursor-pointer"
                >
                  {copiedId === "md" ? <Check className="w-3.5 h-3.5 text-rose-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === "md" ? "Copied" : "Copy Markdown"}</span>
                </button>
              </div>

              <p className="text-sm text-[var(--kaspi-text-secondary)] leading-relaxed">
                The HEYUKA API uses an interface format compatible with OpenAI. Configure any existing OpenAI SDK using our base URL and your free HEYUKA API key.
              </p>

              {/* Exact Screenshot 3 PARAM | VALUE Table */}
              <div className="rounded-xl border border-[var(--kaspi-border)] overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--kaspi-border)] bg-white/[0.03] text-[var(--kaspi-text-muted)] font-semibold">
                      <th className="py-2.5 px-4 text-start w-48">PARAM</th>
                      <th className="py-2.5 px-4 text-start">VALUE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--kaspi-border)]">
                    <tr>
                      <td className="py-3 px-4 font-semibold">base_url (OpenAI)</td>
                      <td className="py-3 px-4 font-mono text-rose-500">{OFFICIAL_ROOT_V1_URL}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">base_url (Full API)</td>
                      <td className="py-3 px-4 font-mono">{OFFICIAL_API_BASE_URL}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">api_key</td>
                      <td className="py-3 px-4">
                        apply for a{" "}
                        <Link href={`/${locale}/zebra-x/api-keys`} className="text-rose-500 underline font-semibold">
                          free API key
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">model</td>
                      <td className="py-3 px-4 space-y-1">
                        {["heyuka-omni", "heyuka-core", "heyuka-vision"].map((m) => (
                          <div key={m}>
                            <code className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px]">
                              {m}
                            </code>
                          </div>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Code Snippets */}
              <div className="rounded-xl border border-[var(--kaspi-border)] overflow-hidden">
                <div className="px-4 py-2 border-b border-[var(--kaspi-border)] flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {(["python", "node", "curl", "azure-fetch"] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSdkLang(lang)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold uppercase cursor-pointer ${
                          sdkLang === lang
                            ? "bg-rose-600 text-white"
                            : "text-[var(--kaspi-text-muted)]"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopy("code", activeSnippet)}
                    className="text-xs text-rose-500 font-semibold cursor-pointer"
                  >
                    {copiedId === "code" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="p-4 text-[11px] font-mono overflow-x-auto leading-relaxed">
                  {activeSnippet}
                </pre>
              </div>
            </div>
          )}

          {tab === "pricing" && (
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">Models & Pricing ($0.00)</h1>
              <p className="text-sm text-[var(--kaspi-text-secondary)]">
                All HEYUKA models run at $0.00 cost to API key owners; KASPI Infrastructure covers all token throughput.
              </p>
              <div className="rounded-xl border border-[var(--kaspi-border)] overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--kaspi-border)] bg-white/[0.03]">
                      <th className="py-3 px-4 text-start">Model</th>
                      <th className="py-3 px-4 text-start">Context</th>
                      <th className="py-3 px-4 text-end">Developer Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--kaspi-border)]">
                    {HEYUKA_MODEL_SPECS.map((m) => (
                      <tr key={m.id}>
                        <td className="py-3 px-4 font-mono font-bold text-rose-500">{m.id}</td>
                        <td className="py-3 px-4">{m.contextWindow}</td>
                        <td className="py-3 px-4 text-end font-mono font-bold">$0.00 (Free)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "guides" && (
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">Error Codes & Auth Formats</h1>
              <p className="text-sm text-[var(--kaspi-text-secondary)]">
                Send Authorization: Bearer, X-API-Key, or Azure api-key headers cleanly.
              </p>
              <Link
                href={`/${locale}/zebra-x/debug`}
                className="inline-block px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold"
              >
                Open 7-Point Live API Debugger →
              </Link>
            </div>
          )}

          {tab === "faq" && (
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
              <div className="space-y-2">
                {FAQ_ITEMS.map((item, idx) => {
                  const open = openFaqIdx === idx;
                  return (
                    <div key={item.q} className="rounded-xl border border-[var(--kaspi-border)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(open ? null : idx)}
                        className="w-full px-4 py-3 flex items-center justify-between text-start text-xs font-bold cursor-pointer"
                      >
                        <span>{item.q}</span>
                        {open ? <ChevronDown className="w-4 h-4 text-rose-500" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {open && (
                        <div className="px-4 pb-3 text-xs text-[var(--kaspi-text-secondary)] border-t border-[var(--kaspi-border)] pt-2">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Right TOC */}
        <aside className="lg:col-span-2 hidden lg:block text-xs space-y-2">
          <p className="font-bold uppercase text-[10px] tracking-wider text-[var(--kaspi-text-muted)]">
            ON THIS PAGE
          </p>
          <ul className="space-y-1.5 border-l border-[var(--kaspi-border)] pl-3 text-[var(--kaspi-text-secondary)]">
            <li className="text-rose-500 font-semibold">Invoke The Chat API</li>
            <li>Base URL & SDKs</li>
            <li>Zero-Cost Coverage ($0.00)</li>
          </ul>
        </aside>
      </div>

      <KaspiGlassModalPortal isOpen={searchOpen} onClose={() => setSearchOpen(false)} dir={isRtl ? "rtl" : "ltr"}>
        <div className="w-full max-w-lg rounded-2xl kaspi-opaque-glass-modal p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--kaspi-border)] pb-2">
            <Search className="w-4 h-4 text-rose-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search HEYUKA API Docs..."
              className="flex-1 bg-transparent text-xs focus:outline-none"
            />
            <button type="button" onClick={() => setSearchOpen(false)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {FAQ_ITEMS.filter(
              (f) =>
                !searchQuery.trim() ||
                f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.a.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((f) => (
              <button
                key={f.q}
                type="button"
                onClick={() => {
                  setTab("faq");
                  setSearchOpen(false);
                }}
                className="w-full text-start p-2 rounded-lg hover:bg-white/10 text-xs cursor-pointer"
              >
                <p className="font-semibold">{f.q}</p>
              </button>
            ))}
          </div>
        </div>
      </KaspiGlassModalPortal>
    </div>
  );
}
