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
      <svg
        className={`w-full h-full text-white ${opacity}`}
        viewBox="0 0 1000 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            @keyframes driftA {
              0% { transform: translate(0, 0) rotate(0deg); }
              50% { transform: translate(15px, -18px) rotate(4deg); }
              100% { transform: translate(0, 0) rotate(0deg); }
            }
            @keyframes driftB {
              0% { transform: translate(0, 0) rotate(0deg); }
              50% { transform: translate(-18px, 15px) rotate(-5deg); }
              100% { transform: translate(0, 0) rotate(0deg); }
            }
            @keyframes driftC {
              0% { transform: translate(0, 0) rotate(0deg); }
              50% { transform: translate(12px, 14px) rotate(3deg); }
              100% { transform: translate(0, 0) rotate(0deg); }
            }
            .animate-drift-a { animation: driftA 14s ease-in-out infinite; }
            .animate-drift-b { animation: driftB 18s ease-in-out infinite; }
            .animate-drift-c { animation: driftC 16s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* 1. Floating Shopping Cart (Top Left) */}
        <g className="animate-drift-a" transform="translate(60, 40)">
          <path
            d="M10 20 H30 L45 85 H120 L135 35 H35"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M40 50 H125 M45 65 H115" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="50" cy="100" r="8" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="110" cy="100" r="8" stroke="currentColor" strokeWidth="1.75" />
        </g>

        {/* 2. Floating Barcode & Scanner Beam (Top Right) */}
        <g className="animate-drift-b" transform="translate(780, 50)">
          <rect x="0" y="0" width="120" height="60" rx="8" stroke="currentColor" strokeWidth="1.5" />
          <line x1="15" y1="12" x2="15" y2="48" stroke="currentColor" strokeWidth="3" />
          <line x1="26" y1="12" x2="26" y2="48" stroke="currentColor" strokeWidth="1.5" />
          <line x1="34" y1="12" x2="34" y2="48" stroke="currentColor" strokeWidth="4" />
          <line x1="46" y1="12" x2="46" y2="48" stroke="currentColor" strokeWidth="2" />
          <line x1="56" y1="12" x2="56" y2="48" stroke="currentColor" strokeWidth="3" />
          <line x1="68" y1="12" x2="68" y2="48" stroke="currentColor" strokeWidth="1" />
          <line x1="76" y1="12" x2="76" y2="48" stroke="currentColor" strokeWidth="4" />
          <line x1="88" y1="12" x2="88" y2="48" stroke="currentColor" strokeWidth="2" />
          <line x1="98" y1="12" x2="98" y2="48" stroke="currentColor" strokeWidth="3" />
          <line x1="106" y1="12" x2="106" y2="48" stroke="currentColor" strokeWidth="1.5" />
          {/* Laser Line */}
          <line x1="-10" y1="30" x2="130" y2="30" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
        </g>

        {/* 3. 3D Isometric Shipping Box (Center Left) */}
        <g className="animate-drift-c" transform="translate(120, 320)">
          <path d="M40 20 L80 40 L80 90 L40 70 Z" stroke="currentColor" strokeWidth="1.75" />
          <path d="M80 40 L120 20 L120 70 L80 90 Z" stroke="currentColor" strokeWidth="1.75" />
          <path d="M40 20 L80 0 L120 20 L80 40 Z" stroke="currentColor" strokeWidth="1.75" />
          <line x1="80" y1="40" x2="80" y2="90" stroke="currentColor" strokeWidth="1.75" />
          <path d="M70 15 L90 25" stroke="currentColor" strokeWidth="2" />
        </g>

        {/* 4. POS Receipt Tape Roll (Center Right) */}
        <g className="animate-drift-a" transform="translate(820, 340)">
          <path d="M20 20 L80 20 L75 110 L65 105 L55 110 L45 105 L35 110 L25 105 L20 110 Z" stroke="currentColor" strokeWidth="1.75" />
          <line x1="30" y1="35" x2="70" y2="35" stroke="currentColor" strokeWidth="1.5" />
          <line x1="30" y1="48" x2="60" y2="48" stroke="currentColor" strokeWidth="1.5" />
          <line x1="30" y1="61" x2="65" y2="61" stroke="currentColor" strokeWidth="1.5" />
          <line x1="30" y1="74" x2="55" y2="74" stroke="currentColor" strokeWidth="1.5" />
          <line x1="30" y1="87" x2="70" y2="87" stroke="currentColor" strokeWidth="2" />
        </g>

        {/* 5. TPE Card Terminal (Bottom Center) */}
        <g className="animate-drift-b" transform="translate(450, 420)">
          <rect x="0" y="0" width="75" height="110" rx="10" stroke="currentColor" strokeWidth="1.75" />
          <rect x="10" y="12" width="55" height="35" rx="4" stroke="currentColor" strokeWidth="1.5" />
          {/* Keypad dots */}
          <circle cx="22" cy="62" r="3" fill="currentColor" />
          <circle cx="37" cy="62" r="3" fill="currentColor" />
          <circle cx="52" cy="62" r="3" fill="currentColor" />
          <circle cx="22" cy="76" r="3" fill="currentColor" />
          <circle cx="37" cy="76" r="3" fill="currentColor" />
          <circle cx="52" cy="76" r="3" fill="currentColor" />
          <circle cx="22" cy="90" r="3" fill="currentColor" />
          <circle cx="37" cy="90" r="3" fill="currentColor" />
          <circle cx="52" cy="90" r="3" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}
