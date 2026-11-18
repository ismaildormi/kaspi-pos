"use client";

import React, { useState, useEffect } from "react";
import { Layers, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { offlineDb } from "@/client/db";
import { runRealDocEtlPipeline, type DocEtlPipelineResult } from "@/lib/open-source-engines";

export const KaspiDocEtlAnalyzer: React.FC<{
  locale?: string;
  onLog?: (msg: string) => void;
}> = ({ locale = "ar", onLog }) => {
  const [customText, setCustomText] = useState("");
  const [result, setResult] = useState<DocEtlPipelineResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const executePipeline = async (rawInput = customText) => {
    setIsRunning(true);
    try {
      const products = offlineDb ? await offlineDb.offlineProducts.toArray().catch(() => []) : [];
      const sales = offlineDb ? await offlineDb.offlineSales.toArray().catch(() => []) : [];
      const customers = offlineDb ? await offlineDb.offlineCustomers.toArray().catch(() => []) : [];

      const res = runRealDocEtlPipeline({
        products,
        sales,
        customers,
        customRawText: rawInput,
      });
      setResult(res);
      onLog?.(
        `[DocETL Pipeline] ✔ تمت معالجة ${res.documentsProcessed} سجل في ${res.executionTimeMs}ms وتوليد ${res.clusters.length} مجموعات تحليلية`
      );
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    executePipeline("");
  }, []);

  return (
    <div className="space-y-4 text-start">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl kaspi-glass-btn flex items-center justify-center">
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
              DocETL — استخراج وتصنيف وتلخيص البيانات الضخمة وهوامش الربح
            </h4>
            <p className="text-[11px] text-[var(--kaspi-text-muted)]">
              github.com/ucbepic/docetl • Map-Resolve-Reduce على بيانات المتجر والنصوص بدون استهلاك توكنات
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            executePipeline(customText);
            toast.success("تم تشغيل خط أنابيب DocETL على بيانات متجرك الفعلية!");
          }}
          disabled={isRunning}
          className="px-3.5 py-1.5 rounded-xl kaspi-glass-btn text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isRunning ? "جاري التحليل..." : "تشغيل خط أنابيب DocETL"}</span>
        </button>
      </div>

      {/* Optional Custom Text / Reviews Input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-zinc-400">
          إدخال نصوص أو ملاحظات زبناء أو أسطر CSV إضافية للتحليل والتلخيص:
        </label>
        <textarea
          rows={2}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="الصق هنا أي ملاحظات، رسائل واتساب من الزبناء، أو قوائم نصوص ليقوم DocETL بتصنيفها..."
          className="w-full p-2.5 rounded-xl kaspi-glass-surface border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {result && (
        <>
          <div className="p-3 rounded-2xl kaspi-glass-surface border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-zinc-400 font-mono">السجلات المفحوصة</span>
              <p className="text-xs font-bold text-white font-mono">{result.documentsProcessed}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-zinc-400 font-mono">الفئات المستخرجة</span>
              <p className="text-xs font-bold text-emerald-400 font-mono">{result.clusters.length}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-zinc-400 font-mono">زمن التنفيذ المحلي</span>
              <p className="text-xs font-bold text-white font-mono">{result.executionTimeMs} ms</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] text-zinc-400 font-mono">استهلاك التوكنات</span>
              <p className="text-xs font-bold text-emerald-400 font-mono">0 Tokens (Free)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.clusters.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl kaspi-frosted-card border border-white/10 space-y-2 text-start"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{c.category}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {c.count} عنصر
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  {c.summary}
                </p>
                {c.extractedEntities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.extractedEntities.map((ent, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-300 font-mono"
                      >
                        {ent}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium pt-1 border-t border-white/5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{c.marginAction}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
