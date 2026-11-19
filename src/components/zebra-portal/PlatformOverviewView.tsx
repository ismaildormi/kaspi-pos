"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Activity,
  Archive,
  ArrowUpRight,
  Boxes,
  Bug,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  FlaskConical,
  KeyRound,
  Layers,
  PackagePlus,
  ShieldCheck,
  Sparkles,
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
import { StudioDomainChat } from "./StudioDomainChat";
import { SPECIALIZED_PRODUCTS } from "@/lib/heyuka/ecosystem/products-catalog";

const HEYUKACreatureCanvas = dynamic(
  () => import("@/components/heyuka/HEYUKACreatureCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[240px] rounded-2xl kaspi-frosted-surface flex items-center justify-center text-xs font-mono text-[var(--kaspi-text-muted)]">
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

export function PlatformOverviewView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [charId, setCharId] = useState("classic_heyuka");
  const [capStats, setCapStats] = useState<{
    verifiedLiveCount: number;
    browserLocalCount: number;
    workerRequiredCount: number;
    connectedWorkersCount: number;
  } | null>(null);
  const [recentOutputs, setRecentOutputs] = useState<any[]>([]);
  const [dailyBudget, setDailyBudget] = useState<{ count: number; limit: number } | null>(null);

  const activeProfile = useMemo(
    () => HEYUKA_CHARACTER_PROFILES.find((c) => c.id === charId) || HEYUKA_CHARACTER_PROFILES[0],
    [charId]
  );

  useEffect(() => {
    fetch("/api/v1/heyuka/capabilities?products=0", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setCapStats({
            verifiedLiveCount: d.verifiedLiveCount || 0,
            browserLocalCount: d.browserLocalCount || 0,
            workerRequiredCount: d.workerRequiredCount || 0,
            connectedWorkersCount: d.connectedWorkersCount || 0,
          });
        }
      })
      .catch(() => {});

    fetch("/api/v1/heyuka/outputs", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.outputs) setRecentOutputs(d.outputs.slice(0, 4));
      })
      .catch(() => {});

    fetch("/api/v1/heyuka/byok", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.dailyBudget) setDailyBudget(d.dailyBudget);
      })
      .catch(() => {});
  }, []);

  const copyText = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((p) => (p === id ? null : p)), 1800);
    } catch {}
  };

  const quickNavCards = [
    {
      href: `/${locale}/zebra-x/studios`,
      title: locale === "ar" ? "الاستوديوهات المتخصصة (12 منتج)" : "Specialized Studios (12 Products)",
      desc: "3D, Background PNG, Image, Shorts 9:16, Coding IDE, Audio, Data & Web.",
      icon: Sparkles,
      badge: "Workspaces",
    },
    {
      href: `/${locale}/zebra-x/lab`,
      title: locale === "ar" ? "مختبر الاختبار والقياس (Benchmark Lab)" : "Autonomous Testing Lab",
      desc: "Run live endpoint probes, review outputs honestly & export HEYUKA_FULL_BENCHMARK.zip.",
      icon: FlaskConical,
      badge: "ZIP + XLSX",
    },
    {
      href: `/${locale}/zebra-x/vault`,
      title: locale === "ar" ? "خزنة النتائج الحقيقية (Output Vault)" : "Real Output Vault",
      desc: "SHA-256 verified outputs separated strictly from previews & failed tasks.",
      icon: Archive,
      badge: `${recentOutputs.length} Logged`,
    },
    {
      href: `/${locale}/zebra-x/workers`,
      title: locale === "ar" ? "الحوسبة الموزعة وحماية $0.00" : "Distributed Workers & BYOK",
      desc: "Inspect device WebGPU/CPU, connect or revoke Worker nodes & save encrypted BYOK keys.",
      icon: Cpu,
      badge: "$0.00 Owner Shield",
    },
    {
      href: `/${locale}/zebra-x/products`,
      title: locale === "ar" ? "مصنع المنتجات والـ Widget الخارجي" : "Mini-Product Factory & Embeds",
      desc: "Build scoped external widgets with dedicated API keys and enable/disable controls.",
      icon: PackagePlus,
      badge: "Embed Ready",
    },
    {
      href: `/${locale}/zebra-x/debug`,
      title: locale === "ar" ? "فاحص Debug الحي (7 نقاط)" : "Live 7-Point API Debugger",
      desc: "Verify any Secret Key, X-API-Key-Id, CORS preflight & SSE streams cleanly.",
      icon: Bug,
      badge: "Live Probe",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Command Center Hero + Status Grid */}
      <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-5 sm:p-7 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full kaspi-glass-surface text-xs font-semibold text-emerald-500">
              <Layers className="w-3.5 h-3.5" />
              <span>HEYUKA INTELLIGENCE COMMAND CENTER • Future Glass 2050</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--kaspi-text-primary)] leading-tight">
              {locale === "ar"
                ? "منظومة HEYUKA AI: منتجات متخصصة، مختبر قياس حي، وحماية صفر تكلفة"
                : locale === "fr"
                ? "HEYUKA Intelligence Command Center : Studios Spécialisés & Bouclier $0.00"
                : "HEYUKA Intelligence Command Center: Specialized AI Studios & Zero-Cost Lab"}
            </h1>

            <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] leading-relaxed">
              {locale === "ar"
                ? "بيئة تشغيل معيارية تقسّم قدرات الذكاء إلى 12 منتجاً متخصصاً بمساحة عمل ومحادثة مستقلة، مع سجل نتائج حقيقي (Output Vault)، ربط عمّال الحوسبة الموزعة (Workers)، ومختبر اختبارات يصدّر نتائج حقيقية بدون أي تكاليف مخفية."
                : "Modular AI platform organizing real verified capabilities into 12 domain studios, a verifiable Real Output Vault, an Autonomous Benchmark ZIP exporter, tenant-isolated mini-products, and distributed user Compute Workers with $0.00 owner risk."}
            </p>

            {/* Live Capability Telemetry Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="kaspi-frosted-surface rounded-2xl p-3">
                <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Verified APIs</div>
                <div className="text-lg font-black text-emerald-500 font-mono">
                  {capStats?.verifiedLiveCount ?? 7}
                </div>
              </div>
              <div className="kaspi-frosted-surface rounded-2xl p-3">
                <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">On-Device GPU/WASM</div>
                <div className="text-lg font-black text-[var(--kaspi-text-primary)] font-mono">
                  {capStats?.browserLocalCount ?? 3}
                </div>
              </div>
              <div className="kaspi-frosted-surface rounded-2xl p-3">
                <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Worker-Required</div>
                <div className="text-lg font-black text-amber-500 font-mono">
                  {capStats?.workerRequiredCount ?? 3}
                </div>
              </div>
              <div className="kaspi-frosted-surface rounded-2xl p-3">
                <div className="text-[10px] font-bold text-[var(--kaspi-text-muted)]">Free Tier Quota</div>
                <div className="text-lg font-black text-[var(--kaspi-text-primary)] font-mono">
                  {dailyBudget ? `${dailyBudget.count}/${dailyBudget.limit}` : "0/120"}
                </div>
              </div>
            </div>

            {/* Dual Base URL Quick Copy Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "base", label: "Primary Base URL", url: OFFICIAL_API_BASE_URL },
                { id: "alias", label: "OpenAI Root Alias", url: OFFICIAL_ROOT_V1_URL },
              ].map((item) => (
                <div
                  key={item.id}
                  className="kaspi-frosted-surface rounded-2xl p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[var(--kaspi-text-muted)]">
                      {item.label}
                    </div>
                    <div dir="ltr" className="text-xs font-mono text-[var(--kaspi-text-primary)] truncate">
                      {item.url}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyText(item.id, item.url)}
                    className="kaspi-glass-btn rounded-xl px-2.5 py-1.5 text-[11px] font-bold cursor-pointer"
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

            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link
                href={`/${locale}/zebra-x/studios`}
                className="kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore 12 Studios</span>
              </Link>
              <Link
                href={`/${locale}/zebra-x/lab`}
                className="kaspi-glass-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <FlaskConical className="w-4 h-4 text-emerald-500" />
                <span>Autonomous Lab</span>
              </Link>
              <Link
                href={`/${locale}/zebra-x/apps`}
                className="kaspi-glass-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Apps Center</span>
              </Link>
              <Link
                href={`/${locale}/zebra-x/models`}
                className="kaspi-glass-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Boxes className="w-4 h-4 text-emerald-500" />
                <span>Models &amp; Registry</span>
              </Link>
            </div>
          </div>

          {/* Interactive 3D Identity Showcase */}
          <div className="lg:col-span-5 kaspi-frosted-surface rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs font-bold">
              <span>Live HEYUKA 3D Core</span>
              <span className="text-[11px] font-mono text-emerald-500">{activeProfile.name}</span>
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
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCharId(id)}
                    className={`px-2 py-1 rounded-full text-[10px] font-semibold cursor-pointer ${
                      charId === id ? "kaspi-orbit-active text-emerald-500" : "kaspi-glass-surface"
                    }`}
                  >
                    {prof.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Command Center Intent-Routing AI Chat + Quick Studios Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7">
          <StudioDomainChat productId="command-center" />
        </div>
        <div className="lg:col-span-5 kaspi-glass-card rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-black flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Quick Studio Launch ({SPECIALIZED_PRODUCTS.length})</span>
            </div>
            <Link href={`/${locale}/zebra-x/studios`} className="text-xs font-bold text-emerald-500 hover:underline">
              All Studios →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto">
            {SPECIALIZED_PRODUCTS.map((p) => (
              <Link
                key={p.id}
                href={`/${locale}/zebra-x/studios/${p.id}`}
                className="kaspi-frosted-surface rounded-2xl p-2.5 hover:scale-[1.01] transition-transform space-y-0.5"
              >
                <div className="text-[11px] font-extrabold truncate text-[var(--kaspi-text-primary)]">
                  {p.name.replace("HEYUKA ", "")}
                </div>
                <div className="text-[10px] font-mono text-emerald-500">{p.shortTag}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Pillars Directory */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickNavCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="kaspi-glass-card rounded-3xl p-5 flex flex-col justify-between gap-3 hover:scale-[1.01] transition-all group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-2xl kaspi-glass-surface flex items-center justify-center">
                  <Icon className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full kaspi-glass-surface text-[var(--kaspi-text-muted)]">
                  {c.badge}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-extrabold flex items-center justify-between gap-2">
                  <span>{c.title}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 shrink-0" />
                </h3>
                <p className="text-xs text-[var(--kaspi-text-secondary)] mt-1">{c.desc}</p>
              </div>
            </Link>
          );
        })}
      </section>

      {/* OpenAI / Microsoft / Google Benchmark Comparison Matrix */}
      <section className="kaspi-glass-card rounded-3xl p-5 sm:p-7 space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-[11px] font-bold text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>OpenAI • Microsoft Azure • Google / DeepSeek Comparison</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black">
            Platform Architecture &amp; Zero-Cost Capability Benchmark
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl kaspi-frosted-surface">
          <table className="w-full text-xs border-collapse min-w-[740px]">
            <thead>
              <tr className="border-b border-[var(--kaspi-border)]">
                <th className="p-3 text-start font-extrabold">Capability</th>
                <th className="p-3 text-start font-black text-emerald-500">HEYUKA (KASPI)</th>
                <th className="p-3 text-start font-bold text-[var(--kaspi-text-secondary)]">OpenAI Platform</th>
                <th className="p-3 text-start font-bold text-[var(--kaspi-text-secondary)]">Microsoft Azure AI</th>
                <th className="p-3 text-start font-bold text-[var(--kaspi-text-secondary)]">Google / DeepSeek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--kaspi-border)]">
              {PLATFORM_COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--kaspi-surface-hover)]">
                  <td className="p-3 font-bold align-top">{row.dimension[locale]}</td>
                  <td className="p-3 align-top font-semibold">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{row.heyuka[locale]}</span>
                    </div>
                  </td>
                  <td className="p-3 align-top text-[var(--kaspi-text-secondary)]">{row.openai[locale]}</td>
                  <td className="p-3 align-top text-[var(--kaspi-text-secondary)]">{row.microsoft[locale]}</td>
                  <td className="p-3 align-top text-[var(--kaspi-text-secondary)]">{row.googleDeepseek[locale]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
