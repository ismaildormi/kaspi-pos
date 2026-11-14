"use client";

import React from "react";

/**
 * 1. 3D VIP Customer Card & Credit Ledger (for /dashboard/customers)
 * Elevates, fans out into 2 perspective card layers, and sweeps a laser highlight on group-hover.
 */
export function KineticVipCustomerCardEmpty({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="group inline-flex flex-col items-center justify-center py-6 px-4 cursor-pointer select-none">
      <div className="relative w-36 h-28 flex items-center justify-center mb-4 perspective-1000">
        {/* Ambient radial monochrome glow */}
        <div className="absolute inset-0 bg-white/[0.04] rounded-full blur-2xl group-hover:bg-white/[0.09] transition-all duration-500 pointer-events-none" />

        {/* Back Card (Credit Ledger) */}
        <div className="absolute w-28 h-18 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg transform -rotate-6 -translate-y-2 -translate-x-2 group-hover:-rotate-12 group-hover:-translate-y-4 group-hover:-translate-x-4 transition-transform duration-500 ease-out flex flex-col justify-between p-2.5 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="w-4 h-1.5 rounded-full bg-white/20" />
            <span className="text-[8px] font-mono text-zinc-500 font-bold">LEDGER</span>
          </div>
          <div className="space-y-1">
            <div className="w-full h-1 bg-white/10 rounded-full" />
            <div className="w-3/4 h-1 bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Front Card (3D VIP Card with Magnetic Chip & Swiping Laser) */}
        <div className="relative w-30 h-20 rounded-2xl bg-gradient-to-tr from-zinc-900 via-zinc-950 to-zinc-900 border border-white/20 shadow-2xl p-3 flex flex-col justify-between transform group-hover:scale-105 group-hover:rotate-2 group-hover:-translate-y-1 transition-all duration-500 ease-out overflow-hidden">
          {/* Sweeping Laser Highlight */}
          <div className="absolute inset-x-0 -top-full h-full bg-gradient-to-b from-transparent via-white/25 to-transparent group-hover:top-full transition-all duration-700 ease-in-out pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="w-5 h-3.5 rounded-sm bg-zinc-800 border border-white/20 flex items-center justify-center">
              <div className="w-3 h-2 border border-white/30 rounded-xs" />
            </div>
            <span className="text-[8px] font-mono font-bold tracking-widest text-zinc-400">
              VIP CLIENT
            </span>
          </div>

          <div className="relative z-10">
            <div className="text-[9px] font-mono font-black text-white tracking-wider">
              •••• •••• ••••
            </div>
            <div className="flex items-center justify-between text-[7px] font-mono text-zinc-400 mt-0.5">
              <span>KARNÉ</span>
              <span className="text-white font-bold">0.00 MAD</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * High-Contrast Pure White Canvas with Ultra-Realistic 3D Obsidian Metal VIP Card
 * Designed specifically for /dashboard/customers empty state to break up dark screens
 */
export function ObsidianMetalVipCardWhiteCanvas({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="kaspi-smoky-glass group relative rounded-3xl border border-white/10 shadow-2xl p-8 sm:p-10 my-4 flex flex-col items-center justify-center text-center select-none overflow-hidden text-white transition-all duration-300">
      {/* Subtle Micro-Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* 3D Realistic Obsidian Metal VIP Card with Real Perspective Tilt */}
      <div className="relative w-56 h-36 flex items-center justify-center mb-6 perspective-1000">
        {/* Deep drop shadow */}
        <div className="absolute w-48 h-28 rounded-2xl bg-black/60 blur-xl transform translate-y-6 group-hover:translate-y-8 group-hover:scale-105 transition-all duration-500" />

        {/* Realistic Obsidian Metallic Card with Living Polar Aurora Orbit */}
        <div className="kaspi-preserve-metal-card relative w-52 h-32 rounded-2xl bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-slate-600/60 shadow-[0_15px_35px_rgba(15,23,42,0.35),0_1px_0_rgba(255,255,255,0.25)_inset] p-4 flex flex-col justify-between transform -rotate-3 group-hover:rotate-0 group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-500 ease-out overflow-hidden cursor-pointer">
          {/* Real Metallic Sheen Angle Sweep */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/15 to-transparent rotate-45 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          {/* Top Row: Chip & Brand */}
          <div className="flex items-center justify-between relative z-10">
            {/* Embossed Metallic Chip */}
            <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/60 shadow-xs flex items-center justify-center p-0.5">
              <div className="w-full h-full border border-black/30 rounded-xs flex flex-col justify-between p-0.5">
                <div className="h-0.5 w-full bg-black/25" />
                <div className="h-0.5 w-full bg-black/25" />
              </div>
            </div>

            <div className="text-end">
              <span className="text-[9px] font-mono font-black text-white/90 tracking-widest block">
                KASPI VIP
              </span>
              <span className="text-[7px] font-mono text-zinc-400 uppercase tracking-wider block">
                FIDÉLITÉ & CRÉDIT
              </span>
            </div>
          </div>

          {/* Middle Row: Card Number */}
          <div className="relative z-10 my-1">
            <span className="text-xs font-mono font-black text-zinc-200 tracking-[0.22em] drop-shadow-md">
              •••• •••• •••• 8890
            </span>
          </div>

          {/* Bottom Row: Name & Balance */}
          <div className="flex items-center justify-between relative z-10 pt-1 border-t border-white/10 text-[8px] font-mono">
            <div className="text-start">
              <span className="text-zinc-500 block uppercase">TITULAIRE</span>
              <span className="text-white font-bold tracking-wider">CLIENT PRIVILÈGE</span>
            </div>
            <div className="text-end">
              <span className="text-zinc-500 block uppercase">SOLDE KARNÉ</span>
              <span className="text-emerald-400 font-bold">0.00 MAD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Crisp White Text on Frosted Canvas */}
      <h3 className="text-base font-extrabold text-white tracking-tight relative z-10 mb-1">
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs text-zinc-400 max-w-sm text-center leading-relaxed relative z-10">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * 2. Supply Chain Invoice & Laser Scanner (for /dashboard/suppliers)
 * The B2B invoice levitates and a monochrome scan beam sweeps across on group-hover.
 */
export function KineticSupplierInvoiceScanEmpty({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="group inline-flex flex-col items-center justify-center py-6 px-4 cursor-pointer select-none">
      <div className="relative w-36 h-28 flex items-center justify-center mb-4">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-white/[0.04] rounded-full blur-2xl group-hover:bg-white/[0.08] transition-all duration-500" />

        {/* Levitation Stage */}
        <div className="relative w-24 h-24 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-2xl p-3 flex flex-col justify-between transform group-hover:-translate-y-2 group-hover:scale-105 group-hover:border-white/30 transition-all duration-500 ease-out overflow-hidden">
          {/* Sweeping Laser Scan Beam */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent top-0 group-hover:top-full transition-all duration-700 ease-in-out pointer-events-none opacity-80" />

          {/* Invoice Document Lines */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-[8px] font-mono font-black text-white">INVOICE</span>
            <span className="text-[7px] font-mono text-zinc-500">B2B</span>
          </div>

          <div className="space-y-1.5 py-1">
            <div className="flex items-center justify-between">
              <span className="w-10 h-1 bg-white/20 rounded-full" />
              <span className="w-4 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <span className="w-8 h-1 bg-white/10 rounded-full" />
              <span className="w-5 h-1 bg-white/10 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <span className="w-11 h-1 bg-white/10 rounded-full" />
              <span className="w-3 h-1 bg-white/10 rounded-full" />
            </div>
          </div>

          <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[7px] font-mono font-bold text-white">
            <span>TOTAL</span>
            <span>0.00 MAD</span>
          </div>
        </div>

        {/* Scanner Head Corner Pins */}
        <div className="absolute -inset-1 border border-dashed border-white/10 rounded-3xl pointer-events-none group-hover:border-white/30 group-hover:scale-105 transition-all duration-500" />
      </div>

      <p className="text-sm font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * 3. 3D Isometric Warehouse Cube Stack with Pulsing Radar Ring (for /dashboard/inventory)
 */
export function KineticWarehouseRadarEmpty({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="group inline-flex flex-col items-center justify-center py-6 px-4 cursor-pointer select-none">
      <div className="relative w-36 h-28 flex items-center justify-center mb-4">
        {/* Radar Ring */}
        <div className="absolute w-24 h-24 rounded-full border border-white/10 group-hover:border-white/30 group-hover:scale-125 transition-all duration-700 ease-out" />
        <div className="absolute w-16 h-16 rounded-full border border-white/15 group-hover:border-white/40 group-hover:scale-115 transition-all duration-500 ease-out" />

        {/* 3D Isometric Warehouse Stack SVG */}
        <div className="relative transform group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-500 ease-out">
          <svg width="68" height="68" viewBox="0 0 68 68" fill="none" className="text-white">
            {/* Base Shadow */}
            <ellipse cx="34" cy="58" rx="24" ry="7" fill="black" fillOpacity="0.4" />
            {/* Bottom Left Cube */}
            <path d="M14 42L28 34V46L14 54V42Z" fill="#18181b" stroke="white" strokeWidth="1.2" />
            <path d="M28 34L42 42V54L28 46V34Z" fill="#27272a" stroke="white" strokeWidth="1.2" />
            <path d="M14 42L28 34L42 42L28 50L14 42Z" fill="#3f3f46" stroke="white" strokeWidth="1.2" />
            {/* Top Cube (Levitates higher on hover) */}
            <g className="transform group-hover:-translate-y-2 transition-transform duration-500">
              <path d="M24 22L38 14V26L24 34V22Z" fill="#27272a" stroke="white" strokeWidth="1.2" />
              <path d="M38 14L52 22V34L38 26V14Z" fill="#3f3f46" stroke="white" strokeWidth="1.2" />
              <path d="M24 22L38 14L52 22L38 30L24 22Z" fill="#52525b" stroke="white" strokeWidth="1.2" />
            </g>
          </svg>
        </div>
      </div>

      <p className="text-sm font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * 4. Multi-Ring 3D Product Cube with Floating Barcode Lines (for /dashboard/products)
 */
export function KineticProductCubeBarcodeEmpty({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="group inline-flex flex-col items-center justify-center py-6 px-4 cursor-pointer select-none">
      <div className="relative w-36 h-28 flex items-center justify-center mb-4">
        {/* Orbital Ring */}
        <div className="absolute w-28 h-28 rounded-full border border-dashed border-white/10 group-hover:rotate-45 group-hover:border-white/25 transition-all duration-700 pointer-events-none" />

        {/* Floating Barcode Lines in background */}
        <div className="absolute -top-1 w-16 h-4 flex items-center justify-between opacity-30 group-hover:opacity-80 group-hover:-translate-y-2 transition-all duration-500 font-mono text-[9px] text-white">
          <span className="w-0.5 h-3 bg-white" />
          <span className="w-1 h-3 bg-white" />
          <span className="w-0.5 h-3 bg-white" />
          <span className="w-1.5 h-3 bg-white" />
          <span className="w-0.5 h-3 bg-white" />
          <span className="w-1 h-3 bg-white" />
        </div>

        {/* 3D Isometric Product Cube */}
        <div className="relative transform group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-500 ease-out">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path d="M12 24L30 14V34L12 44V24Z" fill="#18181b" stroke="white" strokeWidth="1.2" />
            <path d="M30 14L48 24V44L30 34V14Z" fill="#27272a" stroke="white" strokeWidth="1.2" />
            <path d="M12 24L30 14L48 24L30 34L12 24Z" fill="#3f3f46" stroke="white" strokeWidth="1.2" />
            {/* Floating Star / Sparkle in Top Center */}
            <circle cx="30" cy="14" r="2" fill="white" className="animate-ping" />
          </svg>
        </div>
      </div>

      <p className="text-sm font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * 5. Shield & Live Pulse Signal SVG (for /dashboard/support)
 */
export function KineticSupportShieldPulseEmpty({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="group inline-flex flex-col items-center justify-center py-6 px-4 cursor-pointer select-none">
      <div className="relative w-36 h-28 flex items-center justify-center mb-4">
        {/* Pulsing Concentric Radar Wave */}
        <div className="absolute w-20 h-20 rounded-full border border-white/10 group-hover:scale-130 group-hover:opacity-0 transition-all duration-1000 ease-out" />
        <div className="absolute w-14 h-14 rounded-full border border-white/20 group-hover:scale-120 transition-all duration-500 ease-out" />

        {/* Shield Icon Container */}
        <div className="relative w-14 h-14 rounded-2xl bg-zinc-900 border border-white/20 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:-translate-y-1 group-hover:border-white/40 transition-all duration-500">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
      </div>

      <p className="text-sm font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
