"use client";

import React from "react";
import { KaspiBrandMark } from "@/components/common/KaspiBrandMark";

interface BrandPlaceholderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandPlaceholder({ className = "", size = "md" }: BrandPlaceholderProps) {
  return (
    <div
      className={`w-full h-full bg-transparent flex flex-col items-center justify-center p-3 select-none relative overflow-hidden group ${className}`}
    >
      {/* Frameless 3D Infinity Logo */}
      <div className="relative mb-2 transition-transform duration-300 group-hover:scale-105 shrink-0 select-none">
        <KaspiBrandMark size={size} />
      </div>

      {/* Brand Text */}
      <span className="font-mono font-bold tracking-widest text-[var(--kaspi-text-secondary)] uppercase text-[10px] group-hover:text-[var(--kaspi-text-primary)] transition-colors">
        KASPI POS
      </span>
      <span className="text-[9px] font-mono text-[var(--kaspi-text-muted)]">Article Certifié</span>
    </div>
  );
}

export default BrandPlaceholder;
