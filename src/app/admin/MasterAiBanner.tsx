"use client";

import React from "react";
import { Bot, Sparkles, Database, TrendingUp, Users, Cpu } from "lucide-react";

export function MasterAiBanner() {
  const triggerMasterAi = (prompt?: string) => {
    window.dispatchEvent(
      new CustomEvent("open-master-ai", { detail: { prompt } })
    );
  };

  return (
    <div className="rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="space-y-2 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white text-black px-3 py-1 text-[11px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Master AI • Chief Data Officer</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-white shrink-0" />
          <span>All-Knowing Platform Intelligence (Full Database Access)</span>
        </h2>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Query live Neon PostgreSQL telemetry across every shop, subscription,
          payment, and AI session using natural language in Arabic, Darija,
          French, or English.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() =>
              triggerMasterAi(
                "What is our total platform MRR, GMV, and active subscriptions?"
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-white hover:text-white transition cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>getPlatformRevenue</span>
          </button>

          <button
            type="button"
            onClick={() =>
              triggerMasterAi(
                "Show me platform stats: total tenants, users, and active subscriptions."
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-white hover:text-white transition cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>getPlatformStats</span>
          </button>

          <button
            type="button"
            onClick={() =>
              triggerMasterAi(
                "List all registered shops on the platform with their status and creation date."
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-white hover:text-white transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>getAllTenantsList</span>
          </button>

          <button
            type="button"
            onClick={() =>
              triggerMasterAi(
                "How many AI messages have been consumed platform-wide?"
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-white hover:text-white transition cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>getAIUsageStats</span>
          </button>
        </div>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          onClick={() => triggerMasterAi()}
          className="w-full lg:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white px-6 py-4 text-sm font-extrabold text-black hover:bg-zinc-200 transition shadow-xl cursor-pointer"
        >
          <Bot className="w-5 h-5" />
          <span>Launch Master AI Console</span>
        </button>
      </div>
    </div>
  );
}
