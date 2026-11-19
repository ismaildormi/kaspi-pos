"use client";

import React, { useEffect, useState } from "react";
import {
  Cpu,
  Download,
  Lock,
  Loader2,
  Send,
  Database,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { getApiUrl } from "@/client/sync-engine";
import {
  X_ZEBRA_CORE_CONTRACT,
  buildMerchantOllamaPowershellSetup,
  probeAndChatLocalOllama,
} from "@/lib/zebra-x/sovereign-brain";

interface TraceStats {
  totalTraces: number;
  connectedDevices: number;
  contributingStores: number;
  successRatePct: number;
  byLanguage: Record<string, number>;
  byModel: Record<string, number>;
  byKind: Record<string, number>;
}

interface TraceRow {
  traceId: string;
  kind: string;
  language: string;
  modelUsed: string;
  deviceId: string;
  userPrompt: string;
  assistantResponse: string;
  recordedAt: string;
}

export const KaspiZebraOwnerConsole: React.FC<{
  locale: string;
  isSuperAdmin: boolean;
}> = ({ locale, isSuperAdmin }) => {
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TraceStats | null>(null);
  const [traces, setTraces] = useState<TraceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [ownerPrompt, setOwnerPrompt] = useState("");
  const [ownerReply, setOwnerReply] = useState("");
  const [asking, setAsking] = useState(false);
  const [copiedPs, setCopiedPs] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(getApiUrl("/api/ai/zebra-trace"));
        const data = await res.json();
        if (res.ok && data?.success) {
          setStats(data.stats);
          setTraces(Array.isArray(data.recentTraces) ? data.recentTraces : []);
        } else {
          setError(data?.message || "Access restricted to verified Owner.");
        }
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-2">
        <Lock className="w-6 h-6 text-amber-400 mx-auto" />
        <h3 className="text-sm font-bold text-white">
          {isAr ? "وحدة HEYUKA مخصصة للمالك فقط" : "Owner-Exclusive HEYUKA Core"}
        </h3>
        <p className="text-xs text-zinc-300">
          {isAr
            ? "هذا القسم محمي بصلاحية المالك (PACK041 Sovereign Owner Root). أجهزة التجار تشتغل محلياً بأولاما بشكل مستقل."
            : "Restricted by PACK041 Sovereign Owner Root. Merchant stores run local Ollama independently."}
        </p>
      </div>
    );
  }

  const handleAskOwnerBrain = async () => {
    if (!ownerPrompt.trim() || asking) return;
    setAsking(true);
    setOwnerReply("");
    try {
      const summaryContext = stats
        ? `HEYUKA Unified Stats: ${stats.totalTraces} learning traces across ${stats.connectedDevices} devices and ${stats.contributingStores} stores. Languages: ${JSON.stringify(
            stats.byLanguage
          )}. Models: ${JSON.stringify(stats.byModel)}.`
        : "No aggregated traces loaded yet.";

      const local = await probeAndChatLocalOllama({
        messages: [
          {
            role: "system",
            content: `You are HEYUKA Unified Sovereign Owner Brain (Owner-Exclusive Console for KASPI POS). You orchestrate behavioral memory, Voyager skills, and multi-device learning traces. Ground answers honestly on real telemetry:\n${summaryContext}`,
          },
          { role: "user", content: ownerPrompt },
        ],
      });

      if (local.ok) {
        setOwnerReply(`[${local.model} • ${local.backend}]\n\n${local.text}`);
        void fetch(getApiUrl("/api/ai/zebra-trace"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "OWNER_CORRECTION",
            outcomeStatus: "SUCCESS",
            modelUsed: local.model,
            routeSource: "zebra_x_owner",
            userPrompt: ownerPrompt,
            assistantResponse: local.text,
            ownerCorrectionText: local.text,
          }),
        }).catch(() => {});
      } else {
        setOwnerReply(
          `[Ollama Local Offline on this PC] ${local.error || "Please start Ollama (127.0.0.1:11434)"}`
        );
      }
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span>HEYUKA UNIFIED OWNER BRAIN • PACK026 + PACK041 + PACK052</span>
          </div>
          <p className="text-[11px] text-zinc-300">
            {X_ZEBRA_CORE_CONTRACT.modelsMerged.join(" + ")}
          </p>
        </div>

        <a
          href={getApiUrl("/api/ai/zebra-trace?format=jsonl")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isAr ? "تصدير ملف التدريب (.jsonl)" : "Export Fine-Tuning JSONL"}</span>
        </a>
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading cross-device traces...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: isAr ? "إجمالي آثار التعلم" : "Total Learning Traces", val: stats?.totalTraces ?? 0 },
              { label: isAr ? "الأجهزة المربوطة" : "Connected Devices", val: stats?.connectedDevices ?? 0 },
              { label: isAr ? "المتاجر المساهمة" : "Contributing Stores", val: stats?.contributingStores ?? 0 },
              { label: isAr ? "نسبة نجاح الأدوات" : "Success Rate", val: `${stats?.successRatePct ?? 100}%` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-zinc-900/50 p-3">
                <div className="text-[11px] text-zinc-400">{stat.label}</div>
                <div className="text-lg font-bold text-white mt-0.5">{stat.val}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Direct Owner-Only Brain Prompt */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? "محادثة خاصة مع عقل HEYUKA (لك وحدك)" : "Direct Owner Chat with HEYUKA"}</span>
              </div>
              <textarea
                rows={3}
                value={ownerPrompt}
                onChange={(e) => setOwnerPrompt(e.target.value)}
                placeholder={isAr ? "اسأل HEYUKA على الإحصائيات أو التطوير..." : "Query HEYUKA evolution traces & local brain..."}
                className="w-full rounded-xl bg-zinc-950/60 border border-white/10 p-3 text-xs text-white outline-none resize-none"
              />
              <button
                type="button"
                disabled={asking}
                onClick={() => void handleAskOwnerBrain()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isAr ? "إرسال لعقلك المحلي" : "Query HEYUKA"}</span>
              </button>
              {ownerReply && (
                <pre className="rounded-xl bg-zinc-950/80 border border-white/10 p-3 text-[11px] text-zinc-200 whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {ownerReply}
                </pre>
              )}
            </div>

            {/* Merchant PowerShell Auto-Deployer Preview */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? "كود تهيئة أولاما التلقائي على أجهزة التجار" : "Merchant Device Ollama Auto-Installer (PowerShell)"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(buildMerchantOllamaPowershellSetup("auto"));
                    setCopiedPs(true);
                    setTimeout(() => setCopiedPs(false), 1800);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-zinc-200 cursor-pointer"
                >
                  {copiedPs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPs ? "Copied" : "Copy PS1"}</span>
                </button>
              </div>
              <pre className="rounded-xl bg-zinc-950/80 border border-white/10 p-3 text-[10px] text-emerald-300/90 overflow-x-auto max-h-48">
                {buildMerchantOllamaPowershellSetup("auto")}
              </pre>
            </div>
          </div>

          {/* Accumulated Anonymized Traces */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? "آخر آثار التعلم المسحوبة من الأجهزة (بدون أسرار)" : "Latest Secret-Scrubbed Learning Traces"}</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {traces.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  No traces collected yet. Merchant chats & auto-responder actions record automatically here.
                </p>
              ) : (
                traces.map((t) => (
                  <div key={t.traceId} className="rounded-xl border border-white/10 bg-zinc-950/60 p-2.5 text-[11px]">
                    <div className="flex items-center justify-between text-zinc-400 text-[10px] mb-1">
                      <span>
                        <strong className="text-emerald-400">{t.kind}</strong> • {t.language} • {t.modelUsed} • {t.deviceId}
                      </span>
                      <span>{new Date(t.recordedAt).toLocaleString()}</span>
                    </div>
                    <div className="text-zinc-200">Q: {t.userPrompt}</div>
                    <div className="text-zinc-400 line-clamp-2">A: {t.assistantResponse}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
