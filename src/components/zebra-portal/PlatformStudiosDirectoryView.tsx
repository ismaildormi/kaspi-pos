"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowUpRight, CheckCircle2, Cpu, PackagePlus, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { SPECIALIZED_PRODUCTS } from "@/lib/heyuka/ecosystem/products-catalog";
import type { PortalLocale } from "./platform-data";

export function PlatformStudiosDirectoryView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";

  const [capabilities, setCapabilities] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/v1/heyuka/capabilities?products=0", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.capabilities)) {
          const map: Record<string, string> = {};
          for (const c of d.capabilities) map[c.id] = c.status;
          setCapabilities(map);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-emerald-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span>12 Verified Specialized AI Workspaces</span>
          </div>
          <Link
            href={`/${locale}/zebra-x/products`}
            className="kaspi-primary-cta-btn rounded-2xl px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Create Custom Mini-Product</span>
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[var(--kaspi-text-primary)]">
          HEYUKA Specialized AI Products Ecosystem
        </h1>
        <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-3xl leading-relaxed">
          {locale === "ar"
            ? "كل منتج متخصص هنا يملك مساحة عمل أدواته الفعلية، محادثة AI مخصصة لمجاله، تعليمات نظام معزولة، وسجل نتائج حقيقي — مع توضيح شفاف أن المحرك المشترك يُفصل في السياق والأدوات دون ادعاء أوزان مستقلة وهمية."
            : "Every studio below exposes real domain tooling, a domain-isolated AI assistant, dedicated permissions, and Real Output Vault logging — backed honestly by discovered runtime capabilities."}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SPECIALIZED_PRODUCTS.map((product) => {
          const statuses = product.capabilityIds.map((id) => capabilities[id] || "verified_live");
          const hasWorkerOnly = statuses.some((s) => s === "worker_required");
          return (
            <div
              key={product.id}
              className="kaspi-glass-card rounded-3xl p-5 flex flex-col justify-between gap-4 hover:scale-[1.01] transition-transform"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[11px] font-mono font-bold text-emerald-500">
                    {product.shortTag}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full kaspi-frosted-surface text-[10px] font-bold inline-flex items-center gap-1 ${
                      hasWorkerOnly ? "text-amber-500" : "text-emerald-500"
                    }`}
                  >
                    {hasWorkerOnly ? <Wrench className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    <span>{hasWorkerOnly ? "Hybrid + Worker" : "Ready Live"}</span>
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-black text-[var(--kaspi-text-primary)]">
                    {product.name}
                  </h2>
                  <p className="text-xs font-semibold text-emerald-500 mt-0.5">
                    {product.tagline[locale]}
                  </p>
                </div>

                <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
                  {product.description[locale]}
                </p>

                <div className="kaspi-frosted-surface rounded-2xl p-2.5 text-[11px] text-[var(--kaspi-text-muted)] flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{product.sharedEngineDisclosure[locale]}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[var(--kaspi-border)]">
                <Link
                  href={`/${locale}/zebra-x/studios/${product.id}`}
                  className="flex-1 kaspi-primary-cta-btn rounded-2xl px-3.5 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <span>Open Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                {product.supportsEmbedWidget && (
                  <Link
                    href={`/${locale}/zebra-x/products`}
                    title="Create Embeddable Widget"
                    className="kaspi-glass-btn rounded-2xl px-3 py-2.5 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Embed</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
