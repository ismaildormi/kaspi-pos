"use client";

import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, Lock } from "lucide-react";
import { playTapSound, playSuccessSound } from "@/lib/audio";

export type VerificationCardLocale = "ar" | "fr" | "en";

export interface EmailVerificationCardProps {
  /**
   * 6-digit verification code to display and copy. Defaults to "673410" (matching the design spec).
   */
  code?: string;
  /**
   * Optional callback if the user edits or pastes digits inside the 6 boxes.
   */
  onCodeChange?: (nextCode: string) => void;
  /**
   * Whether the 6 digit boxes are read-only display inputs or editable. Defaults to false (interactive input/display).
   */
  readOnly?: boolean;
  /**
   * Initial language ("ar" | "fr" | "en"). Defaults to "ar".
   */
  initialLocale?: VerificationCardLocale;
  /**
   * Optional callback when language pill is clicked.
   */
  onLocaleChange?: (locale: VerificationCardLocale) => void;
  /**
   * Optional additional className for the outer container card.
   */
  className?: string;
}

const CARD_COPY: Record<
  VerificationCardLocale,
  {
    systemBadge: string;
    heading: string;
    subtitle: string;
    copyBtn: string;
    copiedToast: string;
    langLabel: string;
  }
> = {
  ar: {
    systemBadge: "نظام إدارة نقاط البيع والمتاجر",
    heading: "تسجيل الدخول إلى حسابك",
    subtitle: "استخدم رمز التحقق السري أثناء تسجيل الدخول بأمان إلى النظام.",
    copyBtn: "نسخ الرمز",
    copiedToast: "تم النسخ بنجاح!",
    langLabel: "العربية",
  },
  fr: {
    systemBadge: "Système de gestion des points de vente",
    heading: "Connectez-vous à votre compte",
    subtitle:
      "Utilisez le code de vérification secret pour vous connecter en toute sécurité au système.",
    copyBtn: "Copier le code",
    copiedToast: "Copié avec succès !",
    langLabel: "Français",
  },
  en: {
    systemBadge: "POS & Store Management System",
    heading: "Sign in to your account",
    subtitle: "Use the secure verification code to safely sign in to the system.",
    copyBtn: "Copy Code",
    copiedToast: "Copied successfully!",
    langLabel: "English",
  },
};

function normalizeSixDigits(raw: string): string {
  return raw
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "")
    .slice(0, 6);
}

/**
 * KASPI POS Vector Speeding Shopping Cart Logo SVG (matching reference artwork)
 */
function KaspiSpeedCartSvg() {
  return (
    <svg
      viewBox="0 0 88 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-14 h-10 sm:w-16 sm:h-11 text-zinc-950 dark:text-white shrink-0"
      aria-hidden="true"
    >
      {/* Speed Motion Lines */}
      <path
        d="M18 14 H36"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M8 21 H38"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M2 28 H40"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M14 35 H42"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Cart Handle & Basket */}
      <path
        d="M32 6 H43 L50 38 H77 L83 14 H46"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cart Wheels */}
      <circle
        cx="53"
        cy="49"
        r="5.5"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <circle
        cx="73"
        cy="49"
        r="5.5"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
    </svg>
  );
}

/**
 * Circular French Flag Icon for Language Switcher Pill
 */
function FrenchFlagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 rounded-full shrink-0 overflow-hidden shadow-xs"
      aria-hidden="true"
    >
      <clipPath id="frFlagClip">
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath="url(#frFlagClip)">
        <rect x="0" y="0" width="8" height="24" fill="#002395" />
        <rect x="8" y="0" width="8" height="24" fill="#FFFFFF" />
        <rect x="16" y="0" width="8" height="24" fill="#ED2939" />
      </g>
    </svg>
  );
}

/**
 * Circular UK Union Jack Flag Icon for Language Switcher Pill
 */
function UkFlagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 rounded-full shrink-0 overflow-hidden shadow-xs"
      aria-hidden="true"
    >
      <clipPath id="ukFlagClip">
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath="url(#ukFlagClip)">
        <rect width="24" height="24" fill="#012169" />
        <path d="M0 0 L24 24 M24 0 L0 24" stroke="#FFFFFF" strokeWidth="4" />
        <path d="M0 0 L24 24 M24 0 L0 24" stroke="#C8102E" strokeWidth="2" />
        <path d="M12 0 V24 M0 12 H24" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M12 0 V24 M0 12 H24" stroke="#C8102E" strokeWidth="3.5" />
      </g>
    </svg>
  );
}

export const EmailVerificationCard: React.FC<EmailVerificationCardProps> = ({
  code = "673410",
  onCodeChange,
  readOnly = false,
  initialLocale = "ar",
  onLocaleChange,
  className = "",
}) => {
  const [locale, setLocale] = useState<VerificationCardLocale>(initialLocale);
  const [internalCode, setInternalCode] = useState<string>(
    normalizeSixDigits(code) || "673410"
  );
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Re-sync when the parent supplies a new code (e.g. from ?code= query param)
  useEffect(() => {
    setInternalCode(normalizeSixDigits(code));
  }, [code]);

  const activeCode = internalCode;

  const t = CARD_COPY[locale];
  const isRtl = locale === "ar";

  const handleLanguageSelect = (nextLocale: VerificationCardLocale) => {
    playTapSound();
    setLocale(nextLocale);
    onLocaleChange?.(nextLocale);
  };

  const updateCodeValue = (nextRaw: string) => {
    const cleaned = normalizeSixDigits(nextRaw);
    setInternalCode(cleaned);
    onCodeChange?.(cleaned);
  };

  const handleDigitChange = (index: number, value: string) => {
    if (readOnly) return;
    const digits = normalizeSixDigits(value);
    const currentChars = Array.from({ length: 6 }, (_, i) => activeCode[i]?.trim() || "");

    if (!digits) {
      currentChars[index] = "";
      updateCodeValue(currentChars.join(""));
      return;
    }

    if (digits.length > 1) {
      const start = digits.length >= 4 ? 0 : index;
      for (let i = 0; i < digits.length && start + i < 6; i++) {
        currentChars[start + i] = digits[i];
      }
      updateCodeValue(currentChars.join(""));
      const nextFocus = Math.min(5, start + digits.length);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    playTapSound();
    currentChars[index] = digits[0];
    updateCodeValue(currentChars.join(""));
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const currentChars = Array.from({ length: 6 }, (_, i) => activeCode[i]?.trim() || "");
    if (e.key === "Backspace") {
      playTapSound();
      if (currentChars[index]) {
        currentChars[index] = "";
        updateCodeValue(currentChars.join(""));
      } else if (index > 0) {
        currentChars[index - 1] = "";
        updateCodeValue(currentChars.join(""));
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    if (readOnly) return;
    e.preventDefault();
    const pasted =
      e.clipboardData?.getData("text/plain") || e.clipboardData?.getData("text") || "";
    const digits = normalizeSixDigits(pasted);
    if (digits) {
      handleDigitChange(index, digits);
    }
  };

  const handleCopyCode = async () => {
    const cleanToCopy = normalizeSixDigits(activeCode) || "673410";
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cleanToCopy);
      } else if (typeof document !== "undefined") {
        const tempArea = document.createElement("textarea");
        tempArea.value = cleanToCopy;
        tempArea.style.position = "fixed";
        tempArea.style.opacity = "0";
        document.body.appendChild(tempArea);
        tempArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempArea);
      }
      playSuccessSound();
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      playTapSound();
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={`bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-3xl p-7 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full mx-auto relative overflow-hidden select-none transition-colors ${className}`}
    >
      {/* Top-Left & Bottom-Right Decorative Monochrome Corner Accents */}
      <svg
        viewBox="0 0 180 180"
        fill="none"
        className="pointer-events-none absolute -top-2 -left-2 w-32 h-32 text-zinc-950 dark:text-zinc-800"
        aria-hidden="true"
      >
        <path d="M0 0 H145 C82 14 26 68 0 140 Z" fill="currentColor" />
        <path
          d="M0 140 C26 68 82 14 145 0 H175 C102 22 38 78 0 170 Z"
          fill="currentColor"
          fillOpacity="0.18"
        />
      </svg>

      <svg
        viewBox="0 0 180 180"
        fill="none"
        className="pointer-events-none absolute -bottom-2 -right-2 w-32 h-32 text-zinc-950 dark:text-zinc-800"
        aria-hidden="true"
      >
        <path d="M180 180 H35 C98 166 154 112 180 40 Z" fill="currentColor" />
        <path
          d="M180 40 C154 112 98 166 35 180 H5 C78 158 142 102 180 10 Z"
          fill="currentColor"
          fillOpacity="0.14"
        />
      </svg>

      {/* 1. Brand Header */}
      <div className="relative z-10 text-center">
        <div
          dir="ltr"
          className="inline-flex items-center justify-center gap-3 sm:gap-3.5 mx-auto"
        >
          <KaspiSpeedCartSvg />
          <div className="h-9 w-[2px] bg-zinc-900 dark:bg-zinc-200 rounded-full" />
          <div className="flex items-center gap-1.5 tracking-tight">
            <span className="text-2xl sm:text-[28px] font-black text-zinc-950 dark:text-white">
              KASPI
            </span>
            <span className="px-2.5 py-0.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-2xl sm:text-[27px] font-black leading-tight">
              POS
            </span>
          </div>
        </div>

        {/* Subtitle Badge with Flanking Tapered Lines */}
        <div className="flex items-center justify-center gap-3 mt-2.5 mb-5">
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-zinc-500 dark:to-zinc-400" />
          <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 shrink-0">
            {t.systemBadge}
          </span>
          <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-zinc-300 dark:via-zinc-700 to-zinc-500 dark:to-zinc-400" />
        </div>
      </div>

      {/* 2. Centered Security Padlock Badge Inside Dashed Circular Ring + Shield */}
      <div className="relative z-10 flex items-center justify-center gap-4 mb-6">
        <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-transparent to-zinc-400 dark:to-zinc-600 max-w-[88px]" />
        <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-full p-4 bg-zinc-50/80 dark:bg-zinc-900/70 shadow-sm flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-md">
            <Lock className="w-6 h-6 stroke-[2.4]" />
          </div>
        </div>
        <div className="h-1 flex-1 rounded-full bg-gradient-to-l from-transparent to-zinc-400 dark:to-zinc-600 max-w-[88px]" />
      </div>

      {/* 3. Heading & Subtitle Copy */}
      <div className="relative z-10 text-center mb-6">
        <h2 className="text-2xl sm:text-[28px] font-black text-zinc-950 dark:text-white tracking-tight leading-snug">
          {t.heading}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* 4. 6 Distinct Digit Boxes (LTR) */}
      <div
        dir="ltr"
        className="relative z-10 grid grid-cols-6 gap-2 sm:gap-2.5 mb-6"
      >
        {Array.from({ length: 6 }).map((_, idx) => {
          const digit = activeCode[idx]?.trim() || "";
          return (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              readOnly={readOnly}
              maxLength={6}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={(e) => handlePaste(idx, e)}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={`Verification digit ${idx + 1}`}
              className="w-full h-14 sm:h-16 rounded-2xl bg-white dark:bg-zinc-900 border-[1.5px] border-zinc-300 dark:border-zinc-700 text-center font-mono text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white focus:border-zinc-950 dark:focus:border-white selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-950"
            />
          );
        })}
      </div>

      {/* 5. Prominent One-Click Copy Button (Strict Exclusion: No Direct Login/Redirect Button) */}
      <div className="relative z-10 flex flex-col items-center mb-7">
        <button
          type="button"
          onClick={handleCopyCode}
          className="min-w-[210px] sm:min-w-[230px] h-12 sm:h-13 px-8 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-extrabold text-sm sm:text-base shadow-[0_10px_25px_rgba(0,0,0,0.22)] dark:shadow-[0_10px_25px_rgba(255,255,255,0.14)] hover:opacity-95 active:scale-[0.98] transition-all inline-flex items-center justify-center cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 shrink-0 stroke-[2.8]" />
              <span>{t.copiedToast}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2 shrink-0" />
              <span>{t.copyBtn}</span>
            </>
          )}
        </button>

        {/* Subtle ARIA Live Toast Confirmation */}
        <div
          aria-live="polite"
          className={`mt-2 text-xs font-bold transition-all duration-200 ${
            copied
              ? "opacity-100 translate-y-0 text-emerald-600 dark:text-emerald-400"
              : "opacity-0 -translate-y-1 pointer-events-none h-0"
          }`}
        >
          {t.copiedToast}
        </div>
      </div>

      {/* 6. Dynamic Language Switcher Pills at Bottom (العربية ✓ | Français | English) */}
      <div
        dir="rtl"
        className="relative z-10 flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap"
      >
        {/* Arabic Pill */}
        <button
          type="button"
          onClick={() => handleLanguageSelect("ar")}
          className={`h-9 px-4 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border ${
            locale === "ar"
              ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-sm"
              : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500"
          }`}
        >
          {locale === "ar" && <Check className="w-3.5 h-3.5 stroke-[2.8] shrink-0" />}
          <span>العربية</span>
        </button>

        {/* French Pill */}
        <button
          type="button"
          dir="ltr"
          onClick={() => handleLanguageSelect("fr")}
          className={`h-9 px-3.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer border ${
            locale === "fr"
              ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-sm"
              : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500"
          }`}
        >
          <FrenchFlagIcon />
          <span>Français</span>
          {locale === "fr" && <Check className="w-3.5 h-3.5 stroke-[2.8] shrink-0" />}
        </button>

        {/* English Pill */}
        <button
          type="button"
          dir="ltr"
          onClick={() => handleLanguageSelect("en")}
          className={`h-9 px-3.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer border ${
            locale === "en"
              ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-sm"
              : "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-zinc-500"
          }`}
        >
          <UkFlagIcon />
          <span>English</span>
          {locale === "en" && <Check className="w-3.5 h-3.5 stroke-[2.8] shrink-0" />}
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationCard;
