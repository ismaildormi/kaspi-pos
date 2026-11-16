"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

export interface AppleBackButtonProps {
  onClick: () => void;
  locale?: string;
  label?: string;
  className?: string;
  title?: string;
}

/**
 * Unified Apple visionOS Glass Back Navigation Pill for all modals & drawers.
 */
export const AppleBackButton: React.FC<AppleBackButtonProps> = ({
  onClick,
  locale = "fr",
  label,
  className = "",
  title,
}) => {
  const isRtl = locale === "ar";
  const text =
    label ??
    (locale === "ar" ? "رجوع" : locale === "en" ? "Back" : "Retour");

  return (
    <button
      type="button"
      onClick={onClick}
      title={title || text}
      aria-label={title || text}
      data-apple-back="true"
      className={`kaspi-glass-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[var(--kaspi-text-primary)] hover:-translate-y-0.5 active:scale-[0.97] transition-all cursor-pointer shrink-0 ${className}`}
    >
      <ArrowLeft className={`w-3.5 h-3.5 shrink-0 ${isRtl ? "rotate-180" : ""}`} />
      <span>{text}</span>
    </button>
  );
};

export default AppleBackButton;
