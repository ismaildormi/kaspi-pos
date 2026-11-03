"use client";

import Link from "next/link";
import { Download, LogIn } from "lucide-react";
import { LanguageSwitcher } from "../LanguageSwitcher";

export function Navbar() {
  return (
    <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl transition-all">
      <div className="flex h-14 items-center justify-between rounded-full border border-white/10 bg-zinc-950/80 px-4 sm:px-6 shadow-2xl backdrop-blur-xl">
        {/* Brand with Transparent Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="KASPI POS"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain bg-transparent transition-transform group-hover:scale-105"
          />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
              KASPI POS
            </span>
            <span className="hidden sm:inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
              v2.0
            </span>
          </div>
        </Link>

        {/* Minimal Navigation links: Features, AI, Pricing */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#simulator" className="transition hover:text-white">
            Simulateur POS
          </a>
          <a href="#ai" className="transition hover:text-white">
            AI
          </a>
          <a href="#enterprise" className="transition hover:text-white">
            Multi-Boutiques
          </a>
          <a href="#pricing" className="transition hover:text-white">
            Pricing
          </a>
        </nav>

        {/* Public Actions: Download & Login */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <Link
            href="/download"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-white hover:border-zinc-500"
          >
            <Download className="h-3 w-3 text-zinc-400" />
            <span>Download</span>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 sm:px-4 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 shadow-md"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Login</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
