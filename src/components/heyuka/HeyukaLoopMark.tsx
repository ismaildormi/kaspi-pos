"use client";

import React from "react";

interface HeyukaLoopMarkProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  variant?: "crimson" | "monochrome";
  className?: string;
}

const SIZE_MAP: Record<NonNullable<HeyukaLoopMarkProps["size"]>, { w: number; h: number }> = {
  xs: { w: 18, h: 11 },
  sm: { w: 24, h: 14 },
  md: { w: 30, h: 18 },
  lg: { w: 40, h: 24 },
  xl: { w: 54, h: 32 },
};

/**
 * KASPI / HEYUKA Beginning-to-End Infinity Loop Emblem.
 * Geometric continuous lemniscate trace in Crimson Red (#E11D48) + White/Obsidian.
 * Replaces generic external logos across HEYUKA Chat, Platform Sidebar, and DeepThink states.
 */
export function HeyukaLoopMark({
  size = "sm",
  animated = false,
  variant = "crimson",
  className = "",
}: HeyukaLoopMarkProps) {
  const { w, h } = SIZE_MAP[size];
  const uid = React.useId().replace(/:/g, "");
  const gradId = `heyuka_loop_grad_${uid}`;

  // Symmetric infinity curve with deliberate start-to-end crossing node
  const loopPath =
    "M 18 18 C 12 8, 4 8, 4 18 C 4 28, 12 28, 18 18 C 24 8, 32 8, 40 8 C 48 8, 52 13, 52 18 C 52 23, 48 28, 40 28 C 32 28, 24 28, 18 18 Z";

  const isMonochrome = variant === "monochrome";

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 56 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HEYUKA"
      className={`shrink-0 ${animated ? "heyuka-loop-animated" : ""} ${className}`}
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="8" x2="52" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isMonochrome ? "currentColor" : "#FB7185"} />
          <stop offset="50%" stopColor={isMonochrome ? "currentColor" : "#E11D48"} />
          <stop offset="100%" stopColor={isMonochrome ? "currentColor" : "#F43F5E"} />
        </linearGradient>
      </defs>

      {/* Base subtle loop body (Beginning -> End) */}
      <path
        d={loopPath}
        stroke={`url(#${gradId})`}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={animated ? 0.28 : 0.96}
      />

      {/* Active flowing highlight trace during Thinking / Greeting hero */}
      {animated && (
        <path
          d={loopPath}
          stroke={isMonochrome ? "currentColor" : "#FF2E54"}
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="46 110"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="156"
            to="0"
            dur="1.55s"
            repeatCount="indefinite"
          />
        </path>
      )}

      {/* Beginning & End Origin Node + Center Junction Dot */}
      <circle
        cx="11.5"
        cy="18"
        r={animated ? 2.3 : 2}
        fill={isMonochrome ? "currentColor" : "#FFF1F2"}
        opacity={0.95}
      />
      <circle
        cx="41.5"
        cy="18"
        r={animated ? 2.3 : 2}
        fill={isMonochrome ? "currentColor" : "#E11D48"}
        opacity={0.95}
      />
    </svg>
  );
}
