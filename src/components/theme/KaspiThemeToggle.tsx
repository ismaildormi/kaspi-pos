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

const THEME_LABELS = {
  ar: {
    pearl: "أبيض لؤلؤي",
    fjord: "كحلي مغموغ",
    switchToFjord: "التبديل إلى الوضع الكحلي المغموغ",
    switchToPearl: "التبديل إلى الوضع الأبيض اللؤلؤي",
  },
  fr: {
    pearl: "Blanc Perle",
    fjord: "Ardoise Fjord",
    switchToFjord: "Passer au thème Ardoise Fjord",
    switchToPearl: "Passer au thème Blanc Perle",
  },
  en: {
    pearl: "Pearl White",
    fjord: "Fjord Slate",
    switchToFjord: "Switch to Fjord Slate theme",
    switchToPearl: "Switch to Pearl White theme",
  },
} as const;

export function KaspiThemeToggle({
  locale,
  compact = false,
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

  const t = THEME_LABELS[resolvedLocale];
  const isPearl = theme === "pearl-light";

  return (
    <button
      type="button"
      onClick={() => {
        playTapSound();
        toggleTheme();
      }}
      title={isPearl ? t.switchToFjord : t.switchToPearl}
      aria-label={isPearl ? t.switchToFjord : t.switchToPearl}
      data-kaspi-theme-toggle="true"
      className={`kaspi-theme-toggle-btn kaspi-polar-aurora-orbit kaspi-glass-btn inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-all cursor-pointer select-none ${className}`}
    >
      {isPearl ? (
        <Sun className="w-3.5 h-3.5 text-[var(--kaspi-text-primary)] shrink-0" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-[var(--kaspi-text-primary)] shrink-0" />
      )}
      {!compact && (
        <span className="whitespace-nowrap">
          {isPearl ? t.pearl : t.fjord}
        </span>
      )}
    </button>
  );
}
