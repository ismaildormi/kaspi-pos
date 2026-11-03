"use client";

import Link from "next/link";
import { Download, LogIn } from "lucide-react";
import { LanguageSwitcher } from "../LanguageSwitcher";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand with Transparent Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="KASPI POS Logo"
            className="w-9 h-9 object-contain bg-transparent transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                KASPI POS
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                v2.0 Enterprise
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              ERP &amp; Smart Retail Morocco
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <a href="/#how-it-works" className="transition hover:text-white">
            Comment ça marche
          </a>
          <a href="/#features" className="transition hover:text-white">
            Fonctionnalités
          </a>
          <a href="/#offline" className="transition hover:text-white">
            Mode Hors-Ligne
          </a>
          <a href="/#ai" className="transition hover:text-white">
            Conseiller IA
          </a>
          <a href="/#why-us" className="transition hover:text-white">
            Pourquoi KASPI
          </a>
          <a href="/#pricing" className="transition hover:text-white">
            Tarifs
          </a>
        </nav>

        {/* Public Actions (Showcase Only: Download & Login) */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <Link
            href="/download"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 hover:border-zinc-600"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger (.exe)
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 shadow-md"
          >
            <LogIn className="h-3.5 w-3.5" />
            Connexion
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
