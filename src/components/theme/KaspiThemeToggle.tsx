"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useKaspiTheme } from "./KaspiThemeProvider";
import { playTapSound } from "@/lib/audio";

interface KaspiThemeToggleProps {
  locale?: string;
  compact?: boolean;
  className?: string;
}

const THEME_TOOLTIPS = {
  ar: {
    switchToFjord: "التبديل إلى الوضع الداكن",
    switchToPearl: "التبديل إلى الوضع الفاتح",
  },
  fr: {
    switchToFjord: "Passer au mode sombre",
    switchToPearl: "Passer au mode clair",
  },
  en: {
    switchToFjord: "Switch to dark mode",
    switchToPearl: "Switch to light mode",
  },
} as const;

export function KaspiThemeToggle({
  locale,
  className = "",
}: KaspiThemeToggleProps) {
  const { theme, toggleTheme } = useKaspiTheme();

  const resolvedLocale: "ar" | "fr" | "en" =
    locale === "ar" || locale === "fr" || locale === "en"
      ? locale
      : typeof document !== "undefined" && document.documentElement.lang === "ar"
        ? "ar"
        : typeof document !== "undefined" && document.documentElement.lang === "en"
          ? "en"
          : "fr";

  const t = THEME_TOOLTIPS[resolvedLocale];
  const isPearl = theme === "pearl-light";
  const label = isPearl ? t.switchToFjord : t.switchToPearl;

  return (
    <button
      type="button"
      onClick={() => {
        playTapSound();
        toggleTheme();
      }}
      title={label}
      aria-label={label}
      data-kaspi-theme-toggle="true"
      className={`kaspi-theme-toggle-btn kaspi-glass-btn rounded-full w-9 h-9 p-0 flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer select-none hover:scale-105 active:scale-95 ${className}`}
    >
      {isPearl ? (
        <Sun className="w-4 h-4 text-[var(--kaspi-text-primary)] shrink-0 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="w-4 h-4 text-[var(--kaspi-text-primary)] shrink-0 transition-transform duration-300 rotate-0 scale-100" />
      )}
    </button>
  );
}
