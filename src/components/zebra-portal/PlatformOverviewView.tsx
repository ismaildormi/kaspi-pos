"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { HelpCircle, MoreVertical } from "lucide-react";
import type { PortalLocale } from "./platform-data";

interface TelemetryPayload {
  ok: boolean;
  authenticated: boolean;
  userEmail: string | null;
  costUsd: number;
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
  }>;
}

export function PlatformOverviewView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";

  const [days, setDays] = useState<number>(30);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("all");
  const [chartTab, setChartTab] = useState<"type" | "key">("type");
  const [data, setData] = useState<TelemetryPayload | null>(null);

  const loadTelemetry = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ days: String(days), keyId: selectedKeyId });
      const res = await fetch(`/api/v1/zebra-x/telemetry?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json?.ok) setData(json);
    } catch {}
  }, [days, selectedKeyId]);

  useEffect(() => {
    void loadTelemetry();
  }, [loadTelemetry]);

  const maxDaily = useMemo(() => {
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
      {/* Header matching Screenshot 2 */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {locale === "ar" ? "الاستهلاك والإحصائيات (Usage)" : "Usage"}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {locale === "ar"
            ? "جميع التواريخ والأوقات بتوقيت GMT. التكلفة عليك 0.00$ لأن KASPI يتحمل كل شيء."
            : "All dates and times are GMT, and real database stats update live. Developer billing is $0.00 (Free)."}
        </p>
      </div>

      {/* Top 2 Summary Cards (Screenshot 2 exact match: Balance Card + Total Cost Card) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-5 flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-zinc-200 inline-flex items-center gap-1">
                <span>{locale === "ar" ? "التغطية المجانية" : "KASPI Coverage Plan"}</span>
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              </span>
              <span className="px-2 py-0.5 rounded bg-[#007ACC]/15 border border-[#007ACC]/30 text-sky-300 text-[11px] font-medium">
                100% Free — KASPI Absorbs Cost{" "}
                <Link href={`/${locale}/zebra-x/docs?tab=pricing`} className="underline ml-1">
                  Details
                </Link>
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-white tracking-tight">$0.00</span>
              <span className="text-xs font-medium text-zinc-400">USD (Free)</span>
            </div>
          </div>

          <Link
            href={`/${locale}/zebra-x/api-keys`}
            className="px-4 py-1.5 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 text-xs font-semibold shrink-0 transition-colors"
          >
            {locale === "ar" ? "المفاتيح" : "API keys"}
          </Link>
        </div>

        <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-5 space-y-3">
          <span className="text-xs font-medium text-zinc-200 block">
            {locale === "ar" ? "التكلفة الفعلية" : "Total cost"}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-white tracking-tight">$0.00</span>
            <span className="text-xs font-medium text-zinc-400">USD</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Estimated market value saved:{" "}
            <span className="text-sky-400 font-mono font-semibold">
              ${(data?.global.estimatedMarketValueSavedUsd ?? 0).toFixed(2)} USD
            </span>
          </p>
        </div>
      </div>

      {/* Horizontal Divider + Filter Bar */}
      <div className="border-t border-white/[0.07] pt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center rounded-lg bg-[#1D1E23] border border-white/[0.07] px-3 py-1.5 text-xs gap-2">
            <span className="text-zinc-400">Time</span>
            <span className="text-white/20">|</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent text-zinc-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          <div className="inline-flex items-center rounded-lg bg-[#1D1E23] border border-white/[0.07] px-3 py-1.5 text-xs gap-2">
            <span className="text-zinc-400">API Key</span>
            <span className="text-white/20">|</span>
            <select
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="bg-transparent text-zinc-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              {(data?.byKeyBreakdown || []).map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label} ({k.requests})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-1.5 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => void loadTelemetry()}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
            title="Refresh live telemetry"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards Row (Real Keys, Merchants, API Requests, Estimated Tokens — exact Screenshot 2 card style!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-5 space-y-2">
          <p className="text-xs font-medium text-zinc-300">
            {locale === "ar" ? "عدد مفاتيح الـ IPK الحية" : "Active API Keys (DB)"}
          </p>
          <p className="text-3xl font-bold text-white font-mono">
            {(data?.global.activeKeysCount ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-5 space-y-2">
          <p className="text-xs font-medium text-zinc-300">
            {locale === "ar" ? "التجار والفرق المستفيدة" : "Merchants Served (DB)"}
          </p>
          <p className="text-3xl font-bold text-white font-mono">
            {(data?.global.merchantsCount ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-5 space-y-2">
          <p className="text-xs font-medium text-zinc-300">API requests</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-white font-mono">
              {(data?.global.totalApiRequests ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-400">requests</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#161618] border border-white/[0.08] p-5 space-y-2">
          <p className="text-xs font-medium text-zinc-300">
            Tokens <span className="text-[10px] text-sky-400">(Est. / $0 Cost)</span>
          </p>
          <p className="text-3xl font-bold text-white font-mono">
            {(data?.global.estimatedTokensProcessed ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart Container */}
      <div className="rounded-xl bg-[#161618] border border-white/[0.08] p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-200">
            {chartTab === "type" ? "Cost & Traffic ($0.00 / Covered)" : "Breakdown by API Key"}
          </span>

          <div className="inline-flex rounded-lg bg-[#121317] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setChartTab("type")}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                chartTab === "type" ? "bg-[#262830] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Usage Type
            </button>
            <button
              type="button"
              onClick={() => setChartTab("key")}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                chartTab === "key" ? "bg-[#262830] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              API Key
            </button>
          </div>
        </div>

        {chartTab === "type" ? (
          <div className="space-y-2">
            <div className="flex items-stretch gap-2 h-44">
              <div className="flex flex-col justify-between text-[10px] font-mono text-zinc-500 py-1 select-none w-8 text-end shrink-0">
                <span>{maxDaily}</span>
                <span>{Math.max(1, Math.round(maxDaily / 2))}</span>
                <span>0</span>
              </div>
              <div className="flex-1 flex items-end gap-1 border-b border-l border-white/[0.08] pl-2 pb-0.5">
                {(data?.dailySeries || []).map((pt) => {
                  const metric = pt.requests > 0 ? pt.requests : pt.newKeys;
                  const h = Math.max(metric > 0 ? 10 : 2, Math.round((metric / maxDaily) * 100));
                  return (
                    <div
                      key={pt.date}
                      title={`${pt.date}: ${pt.requests} requests, ${pt.newKeys} keys ($0.00)`}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      <div
                        className={`w-full max-w-[12px] rounded-t-sm transition-colors ${
                          metric > 0 ? "bg-[#007ACC] group-hover:bg-[#38BDF8]" : "bg-white/[0.07]"
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between text-[11px] font-mono text-zinc-500">
              <span>{data?.dailySeries?.[0]?.date || ""}</span>
              <span>
                {(data?.global.totalApiRequests ?? 0).toLocaleString()} total requests • Cost $0.00
              </span>
              <span>{data?.dailySeries?.[data.dailySeries.length - 1]?.date || ""}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {(data?.byKeyBreakdown || []).length === 0 ? (
              <p className="text-xs text-zinc-400 py-8 text-center">
                No API keys issued yet.
              </p>
            ) : (
              data!.byKeyBreakdown.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs"
                >
                  <span className="font-medium text-zinc-100 truncate">
                    {k.label} <span className="font-mono text-zinc-500 ml-1">{k.prefix}...</span>
                  </span>
                  <span className="font-mono text-zinc-300">
                    {k.requests} reqs (~{k.estimatedTokens.toLocaleString()} tokens) • $0.00
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
