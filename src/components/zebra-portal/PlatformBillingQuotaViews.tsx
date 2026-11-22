"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { HEYUKA_MODEL_SPECS, type PortalLocale } from "./platform-data";

interface TelemetrySnapshot {
  global: {
    activeKeysCount: number;
    merchantsCount: number;
    usersCount: number;
    totalApiRequests: number;
    estimatedTokensProcessed: number;
    estimatedMarketValueSavedUsd: number;
  };
}

export function PlatformFreeQuotaView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {locale === "ar" ? "التغطية المجانية (Free Quota)" : "Free Quota & Models"}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {locale === "ar"
            ? "لا يلزم شحن رصيد. تتحمل KASPI تكلفة النماذج والبحث والتوكن بالكامل ($0.00)."
            : "No top-up or credit card required. KASPI absorbs 100% of token & API inference costs."}
        </p>
      </div>

      <div className="rounded-xl bg-[#161618] border border-white/[0.08] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[#007ACC] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KASPI Sovereign Coverage • $0.00 Developer Rate</span>
          </div>
          <p className="text-3xl font-bold text-white">$0.00 USD</p>
          <p className="text-xs text-zinc-400">
            Access heyuka-omni, heyuka-core, heyuka-vision, Web Search & Audio tools with unlimited fair quota.
          </p>
        </div>

        <Link
          href={`/${locale}/zebra-x/api-keys`}
          className="px-5 py-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 text-xs font-semibold"
        >
          Create new API key
        </Link>
      </div>

      <div className="rounded-xl bg-[#161618] border border-white/[0.08] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-zinc-400 font-medium">
              <th className="py-3.5 px-5 text-start">Model ID</th>
              <th className="py-3.5 px-5 text-start">Context</th>
              <th className="py-3.5 px-5 text-start">Role</th>
              <th className="py-3.5 px-5 text-end">Cost to Owner / User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {HEYUKA_MODEL_SPECS.map((m) => (
              <tr key={m.id}>
                <td className="py-3.5 px-5 font-mono font-semibold text-[#007ACC]">{m.id}</td>
                <td className="py-3.5 px-5 text-zinc-200">{m.contextWindow}</td>
                <td className="py-3.5 px-5 text-zinc-400">{m.desc[locale]}</td>
                <td className="py-3.5 px-5 text-end font-mono font-bold text-white">$0.00 (Free)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PlatformBillingStatsView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const [snap, setSnap] = useState<TelemetrySnapshot | null>(null);

  useEffect(() => {
    fetch("/api/v1/zebra-x/telemetry?days=30", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) setSnap(d);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {locale === "ar" ? "إحصائيات التجار والتوكن (Billing & Stats)" : "Billing & Live Stats"}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {locale === "ar"
            ? "أرقام حية من قاعدة البيانات لعدد الـ IPKs، التجار، وتقدير التوكن المغطى مجاناً بالكامل من طرف KASPI."
            : "Live PostgreSQL totals for issued API keys, active merchants, requests, and estimated token equivalent covered at $0.00."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#161618] border border-white/[0.08] p-5 space-y-1.5">
          <p className="text-xs text-zinc-400">Active API Keys (IPKs)</p>
          <p className="text-3xl font-bold font-mono text-white">
            {(snap?.global.activeKeysCount ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-[#161618] border border-white/[0.08] p-5 space-y-1.5">
          <p className="text-xs text-zinc-400">Merchants Served</p>
          <p className="text-3xl font-bold font-mono text-white">
            {(snap?.global.merchantsCount ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-[#161618] border border-white/[0.08] p-5 space-y-1.5">
          <p className="text-xs text-zinc-400">Verified Requests</p>
          <p className="text-3xl font-bold font-mono text-white">
            {(snap?.global.totalApiRequests ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-[#161618] border border-white/[0.08] p-5 space-y-1.5">
          <p className="text-xs text-zinc-400">Est. Tokens Covered ($0 Cost)</p>
          <p className="text-3xl font-bold font-mono text-[#007ACC]">
            {(snap?.global.estimatedTokensProcessed ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-[#161618] border border-white/[0.08] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-zinc-400 font-medium">
              <th className="py-3.5 px-5 text-start">Item</th>
              <th className="py-3.5 px-5 text-start">Coverage</th>
              <th className="py-3.5 px-5 text-start">Estimated Market Value Saved</th>
              <th className="py-3.5 px-5 text-end">Billed to You</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-white/[0.05]">
              <td className="py-4 px-5 font-medium text-white">
                HEYUKA Sovereign Cloud &amp; Chat
              </td>
              <td className="py-4 px-5 text-[#007ACC]">100% Subsidized by KASPI</td>
              <td className="py-4 px-5 font-mono text-zinc-300">
                ${(snap?.global.estimatedMarketValueSavedUsd ?? 0).toFixed(2)} USD
              </td>
              <td className="py-4 px-5 text-end font-mono font-bold text-white">$0.00 USD</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
