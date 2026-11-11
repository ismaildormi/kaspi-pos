"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { copyTextToClipboard, tryCopyWithoutGesture } from "@/lib/clipboard";
import {
  VERIFICATION_COPY,
  VERIFICATION_LANGS,
  VerificationLang,
  VerificationPurpose,
  normalizeVerificationCode,
} from "@/lib/email/verification-copy";

export type VerificationCardLocale = VerificationLang;

export interface EmailVerificationCardProps {
  /** 6-digit verification code to display and copy. */
  code: string;
  /** Initial language. Defaults to "ar". */
  initialLocale?: VerificationLang;
  /** "login" (default) or "reset" — only changes heading/description copy. */
  purpose?: VerificationPurpose;
  /** Try to copy the code as soon as the card mounts (used by `?copy=1`). */
  autoCopy?: boolean;
  /** Called whenever the user switches language. */
  onLocaleChange?: (locale: VerificationLang) => void;
  className?: string;
}

type CopyStatus = "idle" | "copied" | "failed";

/* ----------------------------- Inline SVG icons ----------------------------- */

function CopyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Fallback monogram shown if /logo.png fails to load. */
function KaspiMonogram() {
  return (
    <svg viewBox="0 0 40 40" className="w-9 h-9 text-white" aria-hidden="true">
      <path
        d="M12 8v24M12 20l13-12M15.5 17l10.5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* --------------------------------- Component -------------------------------- */

export const EmailVerificationCard: React.FC<EmailVerificationCardProps> = ({
  code,
  initialLocale = "ar",
  purpose = "login",
  autoCopy = false,
  onLocaleChange,
  className = "",
}) => {
  const [locale, setLocale] = useState<VerificationLang>(initialLocale);
  const [status, setStatus] = useState<CopyStatus>("idle");
  const [awaitingGesture, setAwaitingGesture] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanCode = normalizeVerificationCode(code);
  const hasCode = cleanCode.length === 6;
  const t = VERIFICATION_COPY[locale];

  useEffect(() => setLocale(initialLocale), [initialLocale]);

  const flashStatus = useCallback((next: CopyStatus) => {
    setStatus(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2000);
  }, []);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    []
  );

  const handleCopy = useCallback(async () => {
    if (!hasCode) return;
    const ok = await copyTextToClipboard(cleanCode);
    setAwaitingGesture(false);
    flashStatus(ok ? "copied" : "failed");
  }, [cleanCode, hasCode, flashStatus]);

  // `?copy=1`: copy on load where the browser allows it; otherwise copy on the first click/keypress.
  useEffect(() => {
    if (!autoCopy || !hasCode) return;
    let cancelled = false;
    let armed = false;

    const onFirstGesture = () => {
      document.removeEventListener("click", onFirstGesture, true);
      document.removeEventListener("keydown", onFirstGesture, true);
      if (!cancelled) void handleCopy();
    };

    tryCopyWithoutGesture(cleanCode).then((ok) => {
      if (cancelled) return;
      if (ok) {
        flashStatus("copied");
      } else {
        armed = true;
        setAwaitingGesture(true);
        document.addEventListener("click", onFirstGesture, true);
        document.addEventListener("keydown", onFirstGesture, true);
      }
    });

    return () => {
      cancelled = true;
      if (armed) {
        document.removeEventListener("click", onFirstGesture, true);
        document.removeEventListener("keydown", onFirstGesture, true);
      }
    };
    // Run once per code; handleCopy is stable for a given code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCopy, cleanCode]);

  const selectLanguage = (next: VerificationLang) => {
    setLocale(next);
    onLocaleChange?.(next);
  };

  const copied = status === "copied";

  return (
    <div
      dir="ltr"
      lang={locale}
      className={`relative w-full max-w-md mx-auto overflow-hidden rounded-3xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-[#e5e7eb] dark:border-zinc-800 px-6 py-8 sm:px-9 sm:py-10 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-8px_rgba(16,24,40,0.12),0_40px_80px_-32px_rgba(16,24,40,0.22)] transition-colors ${className}`}
    >
      {/* Subtle corner accents */}
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

      {/* 1. Wordmark */}
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

      {/* 2. Brand mark */}
      <div className="relative z-10 my-7 flex items-center justify-center gap-4">
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-zinc-300 dark:to-zinc-700" />
        <div className="flex h-16 w-16 items-center justify-center p-0 bg-transparent border-0 shadow-none">
          {logoFailed ? (
            <KaspiMonogram />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo.png"
              alt="KASPI POS"
              className="w-16 h-16 object-contain drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-zinc-300 dark:to-zinc-700" />
      </div>

      {/* 3. Heading + description */}
      <div className="relative z-10 text-center">
        <h1 className="text-[24px] sm:text-[27px] font-extrabold tracking-[-0.02em] text-zinc-950 dark:text-white leading-tight">
          {t.heading[purpose]}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[340px] text-[13px] sm:text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {t.description[purpose]}
        </p>
      </div>

      {/* 4. Six digit boxes — always LTR; clicking anywhere on them copies */}
      <button
        type="button"
        dir="ltr"
        onClick={handleCopy}
        disabled={!hasCode}
        aria-label={`${t.copyBtn}: ${cleanCode.split("").join(" ")}`}
        className="group relative z-10 mt-7 grid w-full grid-cols-6 gap-2 sm:gap-2.5 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-white focus-visible:ring-offset-4 cursor-pointer disabled:cursor-default"
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <span
            key={idx}
            className={`flex h-14 sm:h-16 items-center justify-center rounded-xl border font-mono text-[26px] sm:text-[30px] font-bold tabular-nums text-zinc-950 dark:text-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] transition-all duration-150 ${
              copied
                ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                : "border-[#e2e8f0] dark:border-zinc-800 bg-[#f8fafc] dark:bg-zinc-900 group-hover:border-zinc-400 dark:group-hover:border-zinc-600 group-hover:bg-white dark:group-hover:bg-zinc-800"
            }`}
          >
            {cleanCode[idx] ?? "–"}
          </span>
        ))}
      </button>

      {/* 5. Primary copy CTA */}
      <div className="relative z-10 mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!hasCode}
          aria-live="polite"
          className={`inline-flex h-12 min-w-[220px] items-center justify-center gap-2.5 rounded-full px-8 text-[15px] font-semibold text-white dark:text-zinc-950 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
            copied
              ? "bg-[#09090b] dark:bg-white ring-4 ring-emerald-500/25"
              : "bg-[#09090b] dark:bg-white shadow-[0_10px_24px_-10px_rgba(9,9,11,0.7)] dark:shadow-[0_10px_24px_-10px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgba(9,9,11,0.75)] active:translate-y-0"
          }`}
        >
          {copied ? (
            <>
              <CheckIcon className="h-[18px] w-[18px] text-emerald-400 dark:text-emerald-600" />
              <span>{t.copiedBtn}</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-[18px] w-[18px]" />
              <span>{t.copyBtn}</span>
            </>
          )}
        </button>

        <p
          className={`mt-2.5 min-h-[18px] text-center text-[12px] ${
            status === "failed" ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {status === "failed" ? t.copyFailed : awaitingGesture ? t.tapToCopy : ""}
        </p>
      </div>

      {/* 6. Language switcher */}
      <div
        dir="ltr"
        role="radiogroup"
        aria-label="Language"
        className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-2"
      >
        {VERIFICATION_LANGS.map((lang) => {
          const copy = VERIFICATION_COPY[lang];
          const active = lang === locale;
          return (
            <button
              key={lang}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => selectLanguage(lang)}
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

export default EmailVerificationCard;
