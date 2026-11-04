"use client";

import React from "react";

interface BrandPlaceholderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandPlaceholder({ className = "", size = "md" }: BrandPlaceholderProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-[9px]",
    md: "w-14 h-14 text-[10px]",
    lg: "w-20 h-20 text-xs",
  }[size];

  return (
    <div
      className={`w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-3 select-none relative overflow-hidden group ${className}`}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* 3D Infinity Logo */}
      <div className="relative mb-2 transition-transform duration-300 group-hover:scale-105">
        <img
          src="/logo.png"
          alt="KASPI POS"
          className={`${sizeClasses.split(" ")[0]} ${sizeClasses.split(" ")[1]} object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]`}
          onError={(e) => {
            // Fallback to text icon if file is inaccessible
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Brand Text */}
      <span className="font-mono font-bold tracking-widest text-zinc-400 uppercase text-[10px] group-hover:text-white transition-colors">
        KASPI POS
      </span>
      <span className="text-[9px] font-mono text-zinc-600">Article Certifié</span>
    </div>
  );
}

export default BrandPlaceholder;
