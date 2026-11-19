"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Activity,
  BarChart3,
  Coins,
  Download,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import type { PortalLocale } from "./platform-data";

interface TelemetryPayload {
  ok: boolean;
  authenticated: boolean;
  userEmail: string | null;
  costUsd: number;
  billingModel: string;
  windowDays: number;
  global: {
    activeKeysCount: number;
    merchantsCount: number;
    usersCount: number;
    totalChatSessions: number;
    totalChatMessages: number;
    totalApiRequests: number;
    estimatedTokensProcessed: number;
    estimatedMarketValueSavedUsd: number;
  };
  account: {
    activeKeysCount: number;
    totalApiRequests: number;
    estimatedTokensProcessed: number;
  };
  dailySeries: Array<{
    date: string;
    requests: number;
    estimatedTokens: number;
    newKeys: number;
  }>;
  byKeyBreakdown: Array<{
    id: string;
    label: string;
    prefix: string;
    requests: number;
    estimatedTokens: number;
    lastUsedAt: string | null;
  }>;
}

const COPY: Record<
  PortalLocale,
  {
    title: string;
    gmtNote: string;
    balanceTitle: string;
    balanceHint: string;
    freeBadge: string;
    manageKeysBtn: string;
    totalCostTitle: string;
    totalCostNote: string;
    last7: string;
    last30: string;
    last90: string;
    allKeys: string;
    exportBtn: string;
    keysIssuedTitle: string;
    merchantsServedTitle: string;
    requestsTitle: string;
    estTokensTitle: string;
    estTokensHint: string;
    chartTitle: string;
    tabType: string;
    tabApiKey: string;
    noTraffic: string;
  }
> = {
  ar: {
    title: "الاستهلاك والإحصائيات الحية (Usage)",
    gmtNote: "جميع التواريخ والأرقام تُحدَّث مباشرة من قاعدة البيانات بتوقيت GMT.",
    balanceTitle: "التكلفة على المستخدم / الرصيد",
    balanceHint: "جميع تكاليف الـ API والنماذج تتحملها شركة KASPI بالكامل مجاناً",
    freeBadge: "مجاني 100% — KASPI يتكلف بكل شيء",
    manageKeysBtn: "إدارة المفاتيح",
    totalCostTitle: "التكلفة الإجمالية عليك",
    totalCostNote: "تقدير السوق الموفر: ",
    last7: "آخر 7 أيام",
    last30: "آخر 30 يوم",
    last90: "آخر 90 يوم",
    allKeys: "كل مفاتيح API",
    exportBtn: "تصدير CSV",
    keysIssuedTitle: "مفاتيح API الحية (Active IPKs)",
    merchantsServedTitle: "التجار والفرق المسجلة",
    requestsTitle: "طلبات الـ API الحقيقية",
    estTokensTitle: "تقدير التوكن (Estimated Tokens)",
    estTokensHint: "تقدير حسابي للمعالجة (التكلفة عليك: $0.00)",
    chartTitle: "النشاط والاستهلاك الزمني",
    tabType: "نوع الاستخدام",
    tabApiKey: "حسب المفتاح",
    noTraffic: "لا توجد طلبات مسجلة في هذه الفترة بعد — أنشئ مفتاحك من صفحة API keys وابدأ فوراً.",
  },
  fr: {
    title: "Usage & Statistiques Réseau",
    gmtNote: "Toutes les données sont calculées en temps réel depuis la base PostgreSQL (GMT).",
    balanceTitle: "Plan & Facturation Développeur",
    balanceHint: "KASPI absorbe 100% du coût d'inférence — aucun paiement requis",
    freeBadge: "100% Gratuit — Pris en charge par KASPI",
    manageKeysBtn: "Gérer les Clés",
    totalCostTitle: "Coût total facturé",
    totalCostNote: "Valeur estimée économisée : ",
    last7: "7 derniers jours",
    last30: "30 derniers jours",
    last90: "90 derniers jours",
    allKeys: "Toutes les clés",
    exportBtn: "Exporter CSV",
    keysIssuedTitle: "Clés API Actives (Total)",
    merchantsServedTitle: "Marchands & Espaces Actifs",
    requestsTitle: "Requêtes API Réelles",
    estTokensTitle: "Tokens Estimés Traités",
    estTokensHint: "Estimation sans dépense personnelle ($0.00)",
    chartTitle: "Activité & Volume de Requêtes",
    tabType: "Par Type",
    tabApiKey: "Par Clé API",
    noTraffic: "Aucune requête API enregistrée sur cette période — générez une clé pour démarrer.",
  },
  en: {
    title: "Usage",
    gmtNote: "All metrics are queried live from PostgreSQL in GMT, with $0.00 cost billed to you.",
    balanceTitle: "Coverage balance & plan",
    balanceHint: "Free Tier Enabled — KASPI covers all model & server tokens cleanly",
    freeBadge: "Zero-Fee Coverage • KASPI Absorbs Costs",
    manageKeysBtn: "API keys",
    totalCostTitle: "Total cost to you",
    totalCostNote: "Estimated market savings: ",
    last7: "Last 7 days",
    last30: "Last 30 days",
    last90: "Last 90 days",
    allKeys: "All Keys",
    exportBtn: "Export",
    keysIssuedTitle: "Active API Keys Issued",
    merchantsServedTitle: "Merchants & Teams Served",
    requestsTitle: "API requests",
    estTokensTitle: "Estimated Tokens Covered",
    estTokensHint: "Token equivalent estimate (your cost: $0.00)",
    chartTitle: "Usage & Request Volume",
    tabType: "Usage Type",
    tabApiKey: "API Key",
    noTraffic: "No API requests recorded in this window yet — create a key in API keys to start.",
  },
};

export function PlatformOverviewView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const t = COPY[locale];

  const [days, setDays] = useState<number>(30);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("all");
  const [chartTab, setChartTab] = useState<"type" | "key">("type");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TelemetryPayload | null>(null);

  const loadTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        days: String(days),
        keyId: selectedKeyId,
      });
      const res = await fetch(`/api/v1/zebra-x/telemetry?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json?.ok) setData(json);
    } catch {
      // Keep UI clean on network interruption
    } finally {
      setLoading(false);
    }
  }, [days, selectedKeyId]);

  useEffect(() => {
    void loadTelemetry();
  }, [loadTelemetry]);

  const maxDailyRequests = useMemo(() => {
    if (!data?.dailySeries?.length) return 1;
    return Math.max(1, ...data.dailySeries.map((d) => Math.max(d.requests, d.newKeys)));
  }, [data]);

  const handleExportCsv = () => {
    if (!data?.dailySeries) return;
    const rows = [
      "date,requests,estimated_tokens,new_keys_issued,cost_usd",
      ...data.dailySeries.map(
        (r) => `${r.date},${r.requests},${r.estimatedTokens},${r.newKeys},0.00`
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heyuka-usage-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header matching DeepSeek Usage */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--kaspi-text-primary)] tracking-tight">
            {t.title}
          </h2>
          <p className="text-xs text-[var(--kaspi-text-muted)] mt-1">{t.gmtNote}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadTelemetry()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl kaspi-glass-surface text-xs font-medium text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-500" : ""}`} />
          <span>{loading ? "..." : "Live Sync"}</span>
        </button>
      </div>

      {/* Top 2 Summary Cards (Exact DeepSeek Usage Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Free Balance / Covered by KASPI */}
        <div className="rounded-2xl kaspi-glass-surface p-5 flex items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[var(--kaspi-text-secondary)]">
                {t.balanceTitle}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/35 text-[10px] font-semibold text-rose-400">
                <ShieldCheck className="w-3 h-3" />
                <span>{t.freeBadge}</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--kaspi-text-primary)] tracking-tight">
                $0.00
              </span>
              <span className="text-xs font-semibold text-[var(--kaspi-text-muted)]">
                USD / FREE TIER
              </span>
            </div>
            <p className="text-[11px] text-[var(--kaspi-text-muted)] truncate">
              {t.balanceHint}
            </p>
          </div>

          <Link
            href={`/${locale}/zebra-x/api-keys`}
            className="px-4 py-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 text-xs font-bold shrink-0 transition-colors"
          >
            {t.manageKeysBtn}
          </Link>
        </div>

        {/* Card 2: Total Cost ($0.00 + Estimated Market Value Covered) */}
        <div className="rounded-2xl kaspi-glass-surface p-5 flex items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-medium text-[var(--kaspi-text-secondary)]">
              {t.totalCostTitle}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--kaspi-text-primary)] tracking-tight">
                $0.00
              </span>
              <span className="text-xs font-semibold text-[var(--kaspi-text-muted)]">USD</span>
            </div>
            <p className="text-[11px] text-rose-400 font-medium">
              {t.totalCostNote}
              <span className="font-mono font-bold">
                ${(data?.global.estimatedMarketValueSavedUsd ?? 0).toFixed(2)} USD
              </span>{" "}
              (KASPI absorbed)
            </p>
          </div>

          <Link
            href={`/${locale}/zebra-x/docs?tab=pricing`}
            className="px-3.5 py-2 rounded-xl border border-[var(--kaspi-border)] text-xs font-semibold text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)] shrink-0"
          >
            Models & Rates
          </Link>
        </div>
      </div>

      {/* Filters Row matching DeepSeek Usage */}
      <div className="border-t border-[var(--kaspi-border)] pt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center rounded-xl kaspi-glass-surface px-3 py-1.5 text-xs gap-2">
            <span className="text-[var(--kaspi-text-muted)]">Time</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent text-[var(--kaspi-text-primary)] font-semibold focus:outline-none cursor-pointer"
            >
              <option value={7}>{t.last7}</option>
              <option value={30}>{t.last30}</option>
              <option value={90}>{t.last90}</option>
            </select>
          </div>

          <div className="inline-flex items-center rounded-xl kaspi-glass-surface px-3 py-1.5 text-xs gap-2">
            <span className="text-[var(--kaspi-text-muted)]">API Key</span>
            <select
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="bg-transparent text-[var(--kaspi-text-primary)] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">{t.allKeys}</option>
              {(data?.byKeyBreakdown || []).map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label} ({k.requests})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 text-xs font-bold cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.exportBtn}</span>
        </button>
      </div>

      {/* 4 Live Real PostgreSQL Stat Cards (Keys, Merchants, API Requests, Estimated Tokens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl kaspi-glass-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--kaspi-text-secondary)]">
            <span>{t.keysIssuedTitle}</span>
            <KeyRound className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-[var(--kaspi-text-primary)] font-mono">
            {(data?.global.activeKeysCount ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-[var(--kaspi-text-muted)]">
            {data?.authenticated
              ? `Your workspace: ${data.account.activeKeysCount} active key(s)`
              : "Live SHA-256 key vault total"}
          </p>
        </div>

        <div className="rounded-2xl kaspi-glass-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--kaspi-text-secondary)]">
            <span>{t.merchantsServedTitle}</span>
            <Store className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-[var(--kaspi-text-primary)] font-mono">
            {(data?.global.merchantsCount ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-[var(--kaspi-text-muted)] flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{(data?.global.usersCount ?? 0).toLocaleString()} verified accounts</span>
          </p>
        </div>

        <div className="rounded-2xl kaspi-glass-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--kaspi-text-secondary)]">
            <span>{t.requestsTitle}</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-[var(--kaspi-text-primary)] font-mono">
              {(data?.authenticated && selectedKeyId !== "all"
                ? data.account.totalApiRequests
                : data?.global.totalApiRequests ?? 0
              ).toLocaleString()}
            </p>
            <span className="text-xs text-[var(--kaspi-text-muted)]">requests</span>
          </div>
          <p className="text-[11px] text-[var(--kaspi-text-muted)]">
            {(data?.global.totalChatMessages ?? 0).toLocaleString()} chat turns processed
          </p>
        </div>

        <div className="rounded-2xl kaspi-glass-surface p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--kaspi-text-secondary)]">
            <span>{t.estTokensTitle}</span>
            <Coins className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-[var(--kaspi-text-primary)] font-mono">
            {(data?.global.estimatedTokensProcessed ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-rose-400 font-medium">{t.estTokensHint}</p>
        </div>
      </div>

      {/* Interactive Chart Card with Usage Type | API Key toggle (matching Screenshot 2) */}
      <div className="rounded-2xl kaspi-glass-surface p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
              {t.chartTitle}
            </h3>
          </div>

          <div className="inline-flex rounded-lg kaspi-frosted-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setChartTab("type")}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                chartTab === "type"
                  ? "bg-white/[0.14] text-[var(--kaspi-text-primary)]"
                  : "text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)]"
              }`}
            >
              {t.tabType}
            </button>
            <button
              type="button"
              onClick={() => setChartTab("key")}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                chartTab === "key"
                  ? "bg-white/[0.14] text-[var(--kaspi-text-primary)]"
                  : "text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)]"
              }`}
            >
              {t.tabApiKey}
            </button>
          </div>
        </div>

        {chartTab === "type" ? (
          <div className="space-y-3">
            <div className="h-48 flex items-end gap-1 pt-4 border-b border-[var(--kaspi-border)]">
              {(data?.dailySeries || []).map((pt) => {
                const metric = pt.requests > 0 ? pt.requests : pt.newKeys;
                const heightPct = Math.max(metric > 0 ? 8 : 2, Math.round((metric / maxDailyRequests) * 100));
                return (
                  <div
                    key={pt.date}
                    title={`${pt.date}: ${pt.requests} requests, ~${pt.estimatedTokens.toLocaleString()} est. tokens, ${pt.newKeys} keys`}
                    className="flex-1 flex flex-col items-center justify-end h-full group"
                  >
                    <div
                      className={`w-full max-w-[14px] rounded-t-sm transition-all ${
                        metric > 0
                          ? "bg-rose-500 group-hover:bg-rose-400"
                          : "bg-white/[0.08] group-hover:bg-white/[0.18]"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--kaspi-text-muted)] font-mono">
              <span>{data?.dailySeries?.[0]?.date || ""}</span>
              <span>
                {(data?.dailySeries?.reduce((s, d) => s + d.requests, 0) || 0) === 0
                  ? t.noTraffic
                  : `${data?.dailySeries?.reduce((s, d) => s + d.requests, 0)} tracked requests • Cost $0.00`}
              </span>
              <span>{data?.dailySeries?.[data.dailySeries.length - 1]?.date || ""}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {(data?.byKeyBreakdown || []).length === 0 ? (
              <p className="text-xs text-[var(--kaspi-text-muted)] py-8 text-center">
                {t.noTraffic}
              </p>
            ) : (
              data!.byKeyBreakdown.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-[var(--kaspi-border)] text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-semibold text-[var(--kaspi-text-primary)] truncate">
                      {k.label}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--kaspi-text-muted)]">
                      {k.prefix}...
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                    <span className="text-[var(--kaspi-text-primary)]">
                      {k.requests.toLocaleString()} reqs
                    </span>
                    <span className="text-[var(--kaspi-text-muted)]">
                      ~{k.estimatedTokens.toLocaleString()} tokens
                    </span>
                    <span className="text-rose-400 font-bold">$0.00</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
