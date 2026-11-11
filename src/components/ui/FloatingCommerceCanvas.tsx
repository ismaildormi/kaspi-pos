"use client";

import React from "react";

export function FloatingCommerceCanvas({
  className = "",
  opacity = "opacity-15",
}: {
  className?: string;
  opacity?: string;
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <div className={`relative w-full h-full text-white ${opacity}`}>
        {/* 1. Shopping Cart (Top Left) */}
        <div className="absolute top-6 left-8 sm:left-12 transform -rotate-6 animate-pulse">
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none" className="text-current">
            <path
              d="M8 18H14L20 40H46L52 24H18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="22" cy="48" r="4" stroke="currentColor" strokeWidth="2" />
            <circle cx="44" cy="48" r="4" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* 2. Barcode & Scanner Beam (Top Right) */}
        <div className="absolute top-6 right-8 sm:right-14 transform rotate-3">
          <svg width="60" height="36" viewBox="0 0 100 50" fill="none" className="text-current">
            <rect x="2" y="2" width="96" height="46" rx="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14" y1="10" x2="14" y2="40" stroke="currentColor" strokeWidth="2.5" />
            <line x1="24" y1="10" x2="24" y2="40" stroke="currentColor" strokeWidth="1.5" />
            <line x1="32" y1="10" x2="32" y2="40" stroke="currentColor" strokeWidth="3" />
            <line x1="44" y1="10" x2="44" y2="40" stroke="currentColor" strokeWidth="1.5" />
            <line x1="54" y1="10" x2="54" y2="40" stroke="currentColor" strokeWidth="2.5" />
            <line x1="66" y1="10" x2="66" y2="40" stroke="currentColor" strokeWidth="3.5" />
            <line x1="78" y1="10" x2="78" y2="40" stroke="currentColor" strokeWidth="1.5" />
            <line x1="86" y1="10" x2="86" y2="40" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* 3. 3D Isometric Shipping Box (Bottom Left) */}
        <div className="absolute bottom-6 left-8 sm:left-14 transform rotate-6">
          <svg width="44" height="44" viewBox="0 0 60 60" fill="none" className="text-current">
            <path d="M15 15 L30 25 L30 50 L15 40 Z" stroke="currentColor" strokeWidth="1.75" />
            <path d="M30 25 L45 15 L45 40 L30 50 Z" stroke="currentColor" strokeWidth="1.75" />
            <path d="M15 15 L30 5 L45 15 L30 25 Z" stroke="currentColor" strokeWidth="1.75" />
            <line x1="30" y1="25" x2="30" y2="50" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        </div>

        {/* 4. POS Receipt Tape Roll (Bottom Right) */}
        <div className="absolute bottom-6 right-8 sm:right-16 transform -rotate-3">
          <svg width="40" height="48" viewBox="0 0 50 65" fill="none" className="text-current">
            <path
              d="M10 10 L40 10 L38 55 L32 52 L26 55 L20 52 L14 55 L10 52 Z"
              stroke="currentColor"
              strokeWidth="1.75"
            />
            <line x1="16" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="1.5" />
            <line x1="16" y1="28" x2="30" y2="28" stroke="currentColor" strokeWidth="1.5" />
            <line x1="16" y1="36" x2="34" y2="36" stroke="currentColor" strokeWidth="1.5" />
            <line x1="16" y1="44" x2="26" y2="44" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}
