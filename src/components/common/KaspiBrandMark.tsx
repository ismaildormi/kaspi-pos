"use client";

import React, { useId } from "react";

export interface KaspiBrandMarkProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "auth";
  alt?: string;
}

const SIZE_CLASSES: Record<NonNullable<KaspiBrandMarkProps["size"]>, string> = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  auth: "w-16 h-16",
};

/**
 * Official KASPI POS Sculpted Frameless 3D Metallic Infinity Mark.
 * Renders directly over dark or light frosted glass with ZERO square container,
 * ZERO backing tile, and ZERO theme color distortion or tinting.
 */
export const KaspiBrandMark: React.FC<KaspiBrandMarkProps> = ({
  className = "",
  size = "sm",
  alt = "KASPI POS",
}) => {
  const uid = useId().replace(/:/g, "");
  const dimClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  return (
    <span
      data-kaspi-brand-mark="sculpted-3d"
      role="img"
      aria-label={alt}
      className={`inline-flex items-center justify-center shrink-0 select-none bg-transparent border-0 p-0 shadow-none ${dimClass} ${className}`}
    >
      <svg
        viewBox="0 0 120 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible drop-shadow-[0_6px_14px_rgba(0,0,0,0.34)]"
        aria-hidden="true"
      >
        <defs>
          {/* Main Liquid Chrome Upper Metallic Gradient */}
          <linearGradient id={`${uid}-chrome-top`} x1="10" y1="8" x2="110" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="28%" stopColor="#E2E8F0" />
            <stop offset="52%" stopColor="#94A3B8" />
            <stop offset="76%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Sculpted Obsidian Depth Gradient on Crossing Under-Loop */}
          <linearGradient id={`${uid}-obsidian-fold`} x1="20" y1="60" x2="100" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="35%" stopColor="#334155" />
            <stop offset="68%" stopColor="#020617" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Brushed Platinum Specular Edge Highlight */}
          <linearGradient id={`${uid}-specular`} x1="16" y1="14" x2="104" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
            <stop offset="50%" stopColor="rgba(226,232,240,0.65)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.95)" />
          </linearGradient>
        </defs>

        {/* Under-ribbon Dark Obsidian Bevel (Creates Interlocked 3D Knot Depth) */}
        <path
          d="M 87 13 C 74 13 65 25 59.5 36 C 54 47 45 59 33 59 C 19.5 59 10 49 10 36 C 10 23 19.5 13 33 13 C 42 13 49.5 19.5 55 27.5"
          stroke={`url(#${uid}-obsidian-fold)`}
          strokeWidth="12.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Metallic Chrome Under-ribbon Highlight Edge */}
        <path
          d="M 87 13 C 74 13 65 25 59.5 36 C 54 47 45 59 33 59 C 19.5 59 10 49 10 36 C 10 23 19.5 13 33 13 C 42 13 49.5 19.5 55 27.5"
          stroke={`url(#${uid}-chrome-top)`}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.92"
        />

        {/* Over-ribbon Sculpted Bevel Dark Shadow Rim */}
        <path
          d="M 33 13 C 46 13 55 25 60.5 36 C 66 47 75 59 87 59 C 100.5 59 110 49 110 36 C 110 23 100.5 13 87 13"
          stroke={`url(#${uid}-obsidian-fold)`}
          strokeWidth="13.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Main Liquid Chrome Crossing Over-Ribbon */}
        <path
          d="M 33 13 C 46 13 55 25 60.5 36 C 66 47 75 59 87 59 C 100.5 59 110 49 110 36 C 110 23 100.5 13 87 13"
          stroke={`url(#${uid}-chrome-top)`}
          strokeWidth="9.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Crisp Specular Light Ridge */}
        <path
          d="M 31 11.2 C 44 11.2 53.5 23 59.5 34.5 C 65.5 46 75 57.2 87 57.2 C 98.5 57.2 108 48 108 35.5"
          stroke={`url(#${uid}-specular)`}
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};

export default KaspiBrandMark;
