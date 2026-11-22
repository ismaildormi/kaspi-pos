"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  Sparkles,
  Terminal,
} from "lucide-react";
import { HEYUKA_MODEL_SPECS, type PortalLocale } from "./platform-data";
import type { RegisteredCapability } from "@/lib/heyuka/compute/capability-registry";

export function PlatformModelsView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const [caps, setCaps] = useState<RegisteredCapability[]>([]);

  useEffect(() => {
    fetch("/api/v1/heyuka/capabilities?products=0", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.capabilities)) setCaps(d.capabilities);
      })
      .catch(() => {});
  }, []);

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedModel(id);
      setTimeout(() => setCopiedModel((p) => (p === id ? null : p)), 1800);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-[#161618] border border-white/[0.08] p-6 sm:p-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-[#007ACC]">
            <Boxes className="w-3.5 h-3.5" />
            <span>Models &amp; Capabilities Registry</span>
          </div>
          <Link
            href={`/${locale}/zebra-x/apps`}
            className="rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#007ACC]" />
            <span>Apps &amp; Download Center</span>
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Models Directory &amp; Capability Registry
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
          All specialized HEYUKA Studios share this unified core model engine with isolated domain system prompts, tool permissions, and project workspaces.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {HEYUKA_MODEL_SPECS.map((model, idx) => (
          <div
            key={model.id}
            className={`rounded-2xl bg-[#161618] border ${
              idx === 0 ? "border-[#007ACC]/40" : "border-white/[0.08]"
            } p-6 flex flex-col justify-between gap-5`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[#007ACC]">
                  {model.badge}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {model.contextWindow}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">{model.name}</h2>
                <div dir="ltr" className="text-xs font-mono text-[#007ACC] font-semibold mt-0.5">
                  {model.id}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] leading-relaxed">
                {model.desc[locale]}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {model.modalities.map((mod) => (
                  <span
                    key={mod}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold kaspi-frosted-surface"
                  >
                    {mod}
                  </span>
                ))}
              </div>

              <ul className="space-y-1.5 text-xs text-[var(--kaspi-text-secondary)]">
                {model.strengths[locale].map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[var(--kaspi-border)]">
              <button
                type="button"
                onClick={() => void handleCopy(model.id)}
                className="flex-1 kaspi-glass-btn rounded-2xl px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedModel === model.id ? (
                  <Check className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedModel === model.id ? "Copied OK" : "Copy ID"}</span>
              </button>

              <Link
                href={`/${locale}/zebra-x/playground`}
                className="flex-1 kaspi-primary-cta-btn rounded-2xl px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Playground</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Capability Registry Matrix */}
      <section className="kaspi-glass-card rounded-3xl p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-base font-black">
            <Cpu className="w-4 h-4 text-rose-500" />
            <span>Dynamic Runtime Capability Registry ({caps.length})</span>
          </div>
          <Link href={`/${locale}/zebra-x/lab`} className="text-xs font-bold text-rose-500 hover:underline">
            Verify Live in Benchmark Lab →
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl kaspi-frosted-surface">
          <table className="w-full text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[var(--kaspi-border)] text-[var(--kaspi-text-muted)]">
                <th className="p-3 text-start font-bold">Capability</th>
                <th className="p-3 text-start font-bold">Status</th>
                <th className="p-3 text-start font-bold">Engine</th>
                <th className="p-3 text-start font-bold">Endpoint / Tier</th>
                <th className="p-3 text-start font-bold">Constraints &amp; Limitations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--kaspi-border)]">
              {caps.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--kaspi-surface-hover)]">
                  <td className="p-3 align-top">
                    <div className="font-bold">{c.name}</div>
                    <div className="text-[11px] font-mono text-[var(--kaspi-text-muted)]">{c.id}</div>
                  </td>
                  <td className="p-3 align-top">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full kaspi-glass-surface text-[10px] font-mono font-bold ${
                        c.status === "verified_live" || c.status === "browser_local_ready"
                          ? "text-rose-500"
                          : "text-amber-500"
                      }`}
                    >
                      {c.status === "worker_required" ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 align-top text-[var(--kaspi-text-secondary)]">{c.responsibleEngine}</td>
                  <td dir="ltr" className="p-3 align-top font-mono text-[11px]">
                    <div>{c.endpoint || "In-Browser Local"}</div>
                    <div className="text-rose-500">{c.zeroCostTier}</div>
                  </td>
                  <td className="p-3 align-top text-[var(--kaspi-text-secondary)]">{c.limitations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
