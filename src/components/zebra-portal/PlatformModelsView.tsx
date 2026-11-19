"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowUpRight, Boxes, Check, CheckCircle2, Copy, Cpu, Sparkles, Terminal } from "lucide-react";
import { HEYUKA_MODEL_SPECS, type PortalLocale } from "./platform-data";

const COPY: Record<
  PortalLocale,
  {
    badge: string;
    title: string;
    subtitle: string;
    copyId: string;
    copied: string;
    testPlayground: string;
    aliasesTitle: string;
    aliasesDesc: string;
    benchmarkNote: string;
  }
> = {
  ar: {
    badge: "كتالوج النماذج الرسمي • /api/v1/models",
    title: "نماذج HEYUKA السيادية من KASPI",
    subtitle:
      "ثلاث عائلات متخصصة تغطي الاستدلال العميق، البرمجة بزمن استجابة منخفض، والوسائط المتعددة مع توافق خلفي كامل لـ x-core و zebra-vision.",
    copyId: "نسخ المعرف",
    copied: "تم النسخ ✓",
    testPlayground: "اختبار في الملعب",
    aliasesTitle: "معرفات التوافق الخلفي (Aliases)",
    aliasesDesc: "التطبيقات القديمة التي ترسل x-core أو zebra-vision تتحول تلقائياً دون أي كسر.",
    benchmarkNote: "فئة المكافئ المرجعي",
  },
  fr: {
    badge: "Catalogue Officiel • /api/v1/models",
    title: "Modèles Souverains HEYUKA par KASPI",
    subtitle:
      "Trois moteurs spécialisés couvrant le raisonnement multimodal, l'ingénierie rapide et le studio visuel/3D/audio avec compatibilité OpenAI complète.",
    copyId: "Copier ID",
    copied: "Copié ✓",
    testPlayground: "Tester au Playground",
    aliasesTitle: "Alias Rétrocompatibles",
    aliasesDesc: "Les requêtes ciblant `x-core` ou `zebra-vision` restent routées sans interruption.",
    benchmarkNote: "Équivalent Référence",
  },
  en: {
    badge: "Official Model Directory • /api/v1/models",
    title: "Sovereign HEYUKA Model Lineup",
    subtitle:
      "Three specialized model tiers covering flagship tool reasoning, ultra-fast code/math execution, and vision/3D/audio intelligence.",
    copyId: "Copy Model ID",
    copied: "Copied ✓",
    testPlayground: "Test in Playground",
    aliasesTitle: "Backward-Compatible Model Aliases",
    aliasesDesc: "Legacy clients targeting `x-core` or `zebra-vision` route transparently to `heyuka-core` and `heyuka-vision`.",
    benchmarkNote: "Competitor Tier Benchmark",
  },
};

export function PlatformModelsView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const t = COPY[locale];
  const [copiedModel, setCopiedModel] = useState<string | null>(null);

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedModel(id);
      setTimeout(() => setCopiedModel((p) => (p === id ? null : p)), 1800);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <section className="kaspi-glass-card rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-emerald-500">
          <Boxes className="w-3.5 h-3.5" />
          <span>{t.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--kaspi-text-primary)]">
          {t.title}
        </h1>
        <p className="text-sm text-[var(--kaspi-text-secondary)] max-w-3xl leading-relaxed">
          {t.subtitle}
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {HEYUKA_MODEL_SPECS.map((model, idx) => (
          <div
            key={model.id}
            className={`kaspi-glass-card ${
              idx === 0 ? "kaspi-polar-aurora-orbit relative" : ""
            } rounded-3xl p-6 flex flex-col justify-between gap-5`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full kaspi-glass-surface text-emerald-500">
                  {model.badge}
                </span>
                <span className="text-[11px] font-mono text-[var(--kaspi-text-muted)]">
                  {model.contextWindow}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-[var(--kaspi-text-primary)]">
                  {model.name}
                </h2>
                <div dir="ltr" className="text-xs font-mono text-emerald-500 font-bold mt-0.5">
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
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold kaspi-frosted-surface text-[var(--kaspi-text-primary)]"
                  >
                    {mod}
                  </span>
                ))}
              </div>

              <div className="kaspi-frosted-surface rounded-2xl p-3 space-y-1">
                <div className="text-[11px] font-bold text-[var(--kaspi-text-muted)]">
                  {t.benchmarkNote}
                </div>
                <div className="text-xs font-semibold text-[var(--kaspi-text-primary)]">
                  {model.competitorBenchmark}
                </div>
              </div>

              <ul className="space-y-2 text-xs text-[var(--kaspi-text-secondary)]">
                {model.strengths[locale].map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[var(--kaspi-border)]">
              <button
                type="button"
                onClick={() => handleCopy(model.id)}
                className="flex-1 kaspi-glass-btn rounded-2xl px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedModel === model.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedModel === model.id ? t.copied : t.copyId}</span>
              </button>

              <Link
                href={`/${locale}/zebra-x/playground`}
                className="flex-1 kaspi-primary-cta-btn rounded-2xl px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{t.testPlayground}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Backward-Compatible Aliases */}
      <section className="kaspi-glass-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--kaspi-text-primary)]">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <span>{t.aliasesTitle}</span>
          </div>
          <p className="text-xs text-[var(--kaspi-text-muted)]">{t.aliasesDesc}</p>
        </div>

        <div dir="ltr" className="flex flex-wrap items-center gap-2">
          {[
            { alias: "x-core", target: "heyuka-core" },
            { alias: "zebra-vision", target: "heyuka-vision" },
          ].map((item) => (
            <button
              key={item.alias}
              type="button"
              onClick={() => handleCopy(item.alias)}
              className="kaspi-glass-btn rounded-full px-3.5 py-1.5 text-xs font-mono flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>{item.alias}</span>
              <span className="opacity-60">→</span>
              <span className="text-emerald-500 font-bold">{item.target}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
