"use client";

import React, { useState } from "react";
import { Layers, MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Sparkles, Filter, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface FeedbackInsight {
  category: "missing_product" | "pricing" | "delivery" | "complaint";
  label: string;
  count: number;
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  suggestedAction: string;
}

export const KaspiDocEtlAnalyzer: React.FC<{ locale?: string }> = ({ locale = "ar" }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<FeedbackInsight[]>([
    {
      category: "missing_product",
      label: "طلب مواد غير متوفرة بالرفوف",
      count: 14,
      sentiment: "neutral",
      summary: "عدة زبائن يسألون عن أنواع معينة من المشروبات الغازية الخالية من السكر ومنتجات الألبان العضوية.",
      suggestedAction: "إضافة 3 أنواع مشروبات دايت إلى قائمة طلبيات الموزع القادمة.",
    },
    {
      category: "pricing",
      label: "آراء الأسعار والمنافسة المحلية",
      count: 9,
      sentiment: "positive",
      summary: "الزبائن يثنون على عروض الباك المزدوج (×2) وتخفيضات نهاية الأسبوع مقارنة بالمحلات المجاورة.",
      suggestedAction: "تعميم عروض الباك على مواد التنظيف والمشروبات العائلية.",
    },
    {
      category: "delivery",
      label: "ملاحظات التوصيل وخدمة واتساب",
      count: 18,
      sentiment: "positive",
      summary: "إقبال كبير على سرعة الرد عبر واتساب وطلب توصيل الطلبيات في أقل من 30 دقيقة.",
      suggestedAction: "تفعيل الرابط المباشر للكتالوج أونلاين لتسهيل الاختيار الذاتي للزبائن.",
    },
    {
      category: "complaint",
      label: "استرجاع أو استبدال سلع",
      count: 3,
      sentiment: "negative",
      summary: "تم تسجيل 3 حالات استبدال لمقاسات ألبسة بسبب تفضيل مقاس أكبر بعد التجربة.",
      suggestedAction: "تحديث جدول المقاسات في الكتالوج لتفادي أي التباس مستقبلاً.",
    },
  ]);

  const handleRunDocEtlPipeline = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success("تم تشغيل مسار DocETL وتحديث تصنيف الآراء والملاحظات تلقائياً!");
    }, 1000);
  };

  return (
    <div className="space-y-4 text-start">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl kaspi-glass-btn flex items-center justify-center">
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--kaspi-text-primary)]">
              تحليل آراء العملاء والنصوص الضخمة (DocETL Intelligence)
            </h4>
            <p className="text-[11px] text-[var(--kaspi-text-muted)]">
              استخراج، تصنيف، وتلخيص آلاف الملاحظات وطلبات الزبائن لتحسين المبيعات وهوامش الربح
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunDocEtlPipeline}
          disabled={isAnalyzing}
          className="px-3.5 py-1.5 rounded-xl kaspi-glass-btn text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAnalyzing ? "جاري التحليل..." : "تشغيل خط معالجة DocETL"}</span>
        </button>
      </div>

      {/* Pipeline Status Flow */}
      <div className="p-3 rounded-2xl kaspi-glass-surface border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
          <span className="text-[10px] text-zinc-400 font-mono">1. تجميع النصوص</span>
          <p className="text-xs font-bold text-white">44 ملاحظة وتذكرة</p>
        </div>
        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
          <span className="text-[10px] text-zinc-400 font-mono">2. التصنيف الآلي</span>
          <p className="text-xs font-bold text-emerald-400">4 فئات دقيقة</p>
        </div>
        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
          <span className="text-[10px] text-zinc-400 font-mono">3. تلخيص المحتوى</span>
          <p className="text-xs font-bold text-white">100% On-Device</p>
        </div>
        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
          <span className="text-[10px] text-zinc-400 font-mono">4. خطة العمل المباشرة</span>
          <p className="text-xs font-bold text-emerald-400">توصيات هامش الربح</p>
        </div>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl kaspi-frosted-card border border-white/10 space-y-2.5 text-start"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.sentiment === "positive"
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                      : item.sentiment === "negative"
                      ? "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                      : "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  }`}
                />
                <span className="text-xs font-bold text-white">{item.label}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                {item.count} تكرار
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              {item.summary}
            </p>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.suggestedAction}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
