"use client";

import Image from "next/image";
import Link from "next/link";
import { Monitor, ShoppingBag, Shield, Terminal, ArrowUpRight } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand with Official Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 transition-all group-hover:border-zinc-600">
            <Image
              src="/logo.png"
              alt="Kasbi POS Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">Kasbi POS</span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                v2.0 Enterprise
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">ERP & Smart Retail Maroc</span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <a href="#features" className="transition hover:text-white">
            Fonctionnalités
          </a>
          <a href="#offline" className="transition hover:text-white">
            Mode Hors-Ligne
          </a>
          <a href="#ai" className="transition hover:text-white">
            Super-Pouvoirs IA
          </a>
          <a href="#whatsapp" className="transition hover:text-white">
            WhatsApp Z-Report
          </a>
          <a href="#pricing" className="transition hover:text-white">
            Tarifs
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <Link
            href="/pos"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 hover:border-zinc-600"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Ouvrir Caisse
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
          >
            Dashboard
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
