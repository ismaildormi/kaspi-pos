"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  WELCOME_COPY,
  WELCOME_LANGS,
  WelcomeEmailData,
  WelcomeLang,
  formatWelcomeDate,
  normalizeWelcomeLang,
  resolveStoreCategory,
} from "@/lib/email/welcome-copy";

export interface WelcomeEmailCardProps {
  data?: WelcomeEmailData;
  initialLocale?: WelcomeLang;
  onLocaleChange?: (locale: WelcomeLang) => void;
  className?: string;
}

export const WelcomeEmailCard: React.FC<WelcomeEmailCardProps> = ({
  data = {},
  initialLocale = "ar",
  onLocaleChange,
  className = "",
}) => {
  const [locale, setLocale] = useState<WelcomeLang>(normalizeWelcomeLang(initialLocale));
  const [logoFailed, setLogoFailed] = useState(false);

  const t = WELCOME_COPY[locale];
  const isRtl = t.dir === "rtl";

  const resolvedOwner =
    data.userName?.trim() ||
    (data.userEmail ? data.userEmail.split("@")[0] : null) ||
    (locale === "ar" ? "التاجر" : locale === "fr" ? "Commerçant" : "Merchant");

  const resolvedStore = data.storeName?.trim() || t.defaultStoreName;
  const resolvedCategory = resolveStoreCategory(data.storeCategory, locale);
  const formattedDate = formatWelcomeDate(data.loginDate, locale);

  const handleLanguageSelect = (lang: WelcomeLang) => {
    setLocale(lang);
    onLocaleChange?.(lang);
  };

  return (
    <div
      dir="ltr"
      lang={locale}
      className={`relative w-full max-w-[460px] mx-auto overflow-hidden rounded-[24px] bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-[#e5e7eb] dark:border-zinc-800 px-6 py-8 sm:px-9 sm:py-10 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-8px_rgba(16,24,40,0.12),0_40px_80px_-32px_rgba(16,24,40,0.22)] transition-colors ${className}`}
    >
      {/* Subtle Monochrome Corner Accents */}
      <svg
        viewBox="0 0 160 160"
        className="pointer-events-none absolute -top-px -left-px w-28 h-28 text-zinc-950 dark:text-zinc-800"
        aria-hidden="true"
      >
        <path d="M0 0H120C66 12 22 56 0 112Z" fill="currentColor" />
      </svg>
      <svg
        viewBox="0 0 160 160"
        className="pointer-events-none absolute -bottom-px -right-px w-28 h-28 text-zinc-950 dark:text-zinc-800"
        aria-hidden="true"
      >
        <path d="M160 160H40C94 148 138 104 160 48Z" fill="currentColor" />
      </svg>

      {/* 1. Wordmark Header */}
      <div className="relative z-10 flex flex-col items-center">
        <div dir="ltr" className="flex items-center gap-2">
          <span className="text-[28px] sm:text-[30px] font-black tracking-[-0.03em] text-zinc-950 dark:text-white leading-none">
            KASPI
          </span>
          <span className="rounded-lg bg-[#09090b] dark:bg-white px-2.5 py-1 text-[22px] sm:text-[24px] font-black tracking-[-0.02em] text-white dark:text-zinc-950 leading-none">
            POS
          </span>
        </div>

        <div className="mt-3 flex w-full items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-300 dark:to-zinc-700" />
          <span className="shrink-0 text-[12px] sm:text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">
            {t.subtitle}
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-300 dark:to-zinc-700" />
        </div>
      </div>

      {/* 2. Center Hero Logo with Verified Status Ring */}
      <div className="relative z-10 my-6 flex items-center justify-center">
        <div className="relative inline-block">
          <div className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 p-2 shadow-[inset_0_1px_2px_rgba(16,24,40,0.06)]">
            <div className="rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-1.5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#09090b] dark:bg-zinc-900 shadow-[0_8px_20px_-6px_rgba(9,9,11,0.55),inset_0_1px_0_rgba(255,255,255,0.18)]">
                {logoFailed ? (
                  <span className="text-white font-mono font-black text-xl">K</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/logo.png"
                    alt="KASPI POS"
                    className="h-10 w-10 object-contain"
                    onError={() => setLogoFailed(true)}
                  />
                )}
              </div>
            </div>
          </div>
          {/* Emerald-green verified checkmark badge anchored at bottom-right */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#10b981] border-2 border-white dark:border-zinc-950 text-white flex items-center justify-center text-xs font-black shadow-[0_2px_8px_rgba(16,185,129,0.5)]"
            aria-label="Verified Store"
          >
            &#10003;
          </div>
        </div>
      </div>

      {/* 3. Hero Heading & Description */}
      <div className="relative z-10 text-center mb-6">
        <h1 className="text-[22px] sm:text-[25px] font-extrabold tracking-[-0.02em] text-zinc-950 dark:text-white leading-tight">
          {t.heroHeading(resolvedOwner)}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[380px] text-[13px] sm:text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {t.heroDescription}
        </p>
      </div>

      {/* 4. Signature Feature — The "Digital Store Pass" Mini-Card */}
      <div className="relative z-10 mb-6 rounded-2xl bg-[#09090b] text-white border border-[#27272a] p-5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]">
        {/* Top Row: Store Name + Live Status Pill */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="text-[17px] sm:text-[18px] font-black tracking-tight text-white truncate">
            {resolvedStore}
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold tracking-wide shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.storePass.statusBadge}</span>
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#27272a] mb-4" />

        {/* Bottom Row: 3-Column Metadata Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Category */}
          <div className="text-start">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              {t.storePass.categoryLabel}
            </div>
            <div className="text-[12px] sm:text-[13px] font-bold text-zinc-100 truncate">
              {resolvedCategory}
            </div>
          </div>

          {/* Owner */}
          <div className="text-center">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              {t.storePass.ownerLabel}
            </div>
            <div className="text-[12px] sm:text-[13px] font-bold text-zinc-100 truncate">
              {resolvedOwner}
            </div>
          </div>

          {/* Date */}
          <div className="text-end">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              {t.storePass.dateLabel}
            </div>
            <div className="text-[11px] sm:text-[12px] font-mono font-bold text-zinc-300">
              {formattedDate}
            </div>
          </div>
        </div>
      </div>

      {/* 5. 3-Step Quick Onboarding Strip */}
      <div className="relative z-10 mb-6 rounded-2xl bg-[#f8fafc] dark:bg-zinc-900 border border-[#e2e8f0] dark:border-zinc-800 p-4 sm:p-5">
        <div className="text-[13px] font-extrabold text-zinc-950 dark:text-white mb-3">
          {t.onboarding.sectionTitle}
        </div>
        <div className="space-y-3">
          {t.onboarding.steps.map((stepText, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#09090b] dark:bg-white font-mono text-[11px] font-black text-white dark:text-zinc-950 shadow-xs">
                {`0${idx + 1}`}
              </span>
              <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">
                {stepText}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Primary CTA Button */}
      <div className="relative z-10 mb-5 flex flex-col items-center">
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-full bg-[#09090b] dark:bg-white px-8 text-[15px] font-extrabold text-white dark:text-zinc-950 shadow-[0_10px_24px_-10px_rgba(9,9,11,0.7)] dark:shadow-[0_10px_24px_-10px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgba(9,9,11,0.75)] active:translate-y-0 transition-all"
        >
          {t.primaryButton}
        </Link>
        <p className="mt-3 text-center text-[12px] text-zinc-500 dark:text-zinc-400">
          {t.footerNote}
        </p>
      </div>

      {/* 7. Interactive Language Switcher */}
      <div
        dir="ltr"
        role="radiogroup"
        aria-label="Language"
        className="relative z-10 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-center gap-2"
      >
        {WELCOME_LANGS.map((lang) => {
          const copy = WELCOME_COPY[lang];
          const active = lang === locale;
          return (
            <button
              key={lang}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleLanguageSelect(lang)}
              className={`inline-flex h-9 items-center gap-2 rounded-full border ps-1.5 pe-3.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                active
                  ? "border-[#09090b] dark:border-white bg-[#09090b] dark:bg-white text-white dark:text-zinc-950 shadow-[0_6px_14px_-8px_rgba(9,9,11,0.8)]"
                  : "border-[#e5e7eb] dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <span
                className={`inline-flex h-6 min-w-[28px] items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold tracking-wider ${
                  active
                    ? "bg-white dark:bg-zinc-950 text-[#09090b] dark:text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {copy.badge}
              </span>
              <span dir={copy.dir}>{copy.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WelcomeEmailCard;
