"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DownloadPwaButton } from "@/components/DownloadPwaButton";
import {
  Download,
  Monitor,
  Globe,
  Smartphone,
  QrCode,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const WINDOWS_EXE_URL = "/download/exe";

const MOBILE_APP_URL = "https://kaspi-pos.vercel.app/pos";

export default function DownloadCenterPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between selection:bg-white selection:text-black font-sans">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <img
              src="/logo.png"
              alt="KASPI POS"
              className="w-16 h-16 object-contain bg-transparent mx-auto mb-6"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />

            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs font-mono text-zinc-300 mb-6">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>KASPI POS v2.0 • Multi-Platform Download Center</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4">
              Download KASPI POS
            </h1>

            <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
              Run KASPI POS natively on Windows with 100% offline SQLite/Dexie
              sync and ESC/POS thermal printing, install as an instant Web App
              (PWA), or scan on iOS &amp; Android.
            </p>
          </div>

          {/* 3 Download Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Card 1: Windows Desktop (.exe) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col justify-between hover:border-zinc-700 transition shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider">
                    Recommended
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  Windows Desktop (.exe)
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Native Windows 10 &amp; 11 installer powered by Tauri (Rust).
                  Runs on your local processor with direct USB/LAN thermal
                  printer and RJ11 cash drawer triggers.
                </p>

                <ul className="space-y-2.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>Direct 58mm &amp; 80mm ESC/POS thermal printing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>100% Offline-First engine + Auto-Updater</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>Sub-20ms USB/Bluetooth barcode scanner speed</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <a
                  href={WINDOWS_EXE_URL}
                  onClick={() => {
                    fetch("/api/download/track", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ platform: "windows" }),
                    }).catch(() => {});
                  }}
                  className="w-full py-3.5 px-6 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition flex items-center justify-center gap-2.5 text-sm shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Download for Windows (.exe)</span>
                </a>
                <p className="text-[11px] text-zinc-500 font-mono text-center">
                  v2.0.0 • 64-bit Windows 10/11 • kaspi-pos-setup.exe
                </p>
              </div>
            </div>

            {/* Card 2: Web App (PWA) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col justify-between hover:border-zinc-700 transition shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white">
                    <Globe className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono">
                    Zero Install Wait
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  Web App (PWA)
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Install KASPI POS directly from Chrome, Edge, or Safari onto
                  your desktop or POS touch terminal with one click. Works
                  offline via IndexedDB (Dexie.js).
                </p>

                <ul className="space-y-2.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>Pins to Windows Taskbar, Desktop &amp; Start Menu</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>Offline sales queue with automatic cloud sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>Compatible with Windows, macOS, and Linux</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-800 flex flex-col items-center">
                <div className="w-full flex justify-center">
                  <DownloadPwaButton
                    label="Install Web App (PWA)"
                    size="md"
                    githubReleasesUrl={WINDOWS_EXE_URL}
                  />
                </div>
                <Link
                  href="/pos"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition pt-1"
                >
                  <span>Or launch directly in browser</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: iOS & Android (QR Code) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col justify-between hover:border-zinc-700 transition shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono">
                    Mobile &amp; Tablet
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  iOS &amp; Android
                </h2>
                 <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                   Scan the QR code with your iPhone, iPad, or Android tablet to
                   open{" "}
                   <span className="text-white font-mono">
                     https://kaspi-pos.vercel.app/pos
                   </span>{" "}
                   for mobile cashiering, AI product scanning, and live owner
                   reports.
                 </p>

                {/* Monochrome SVG QR Code Placeholder */}
                <div className="mx-auto w-44 h-44 rounded-2xl bg-white p-3 flex flex-col items-center justify-center shadow-inner mb-6">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-black"
                    fill="currentColor"
                    aria-label="QR Code for https://kaspi.ma/app"
                  >
                    {/* Top-left finder pattern */}
                    <path d="M5,5 h28 v28 h-28 z M10,10 v18 h18 v-18 z M14,14 h10 v10 h-10 z" />
                    {/* Top-right finder pattern */}
                    <path d="M67,5 h28 v28 h-28 z M72,10 v18 h18 v-18 z M76,14 h10 v10 h-10 z" />
                    {/* Bottom-left finder pattern */}
                    <path d="M5,67 h28 v28 h-28 z M10,72 v18 h18 v-18 z M14,76 h10 v10 h-10 z" />
                    {/* Data matrix modules */}
                    <rect x="38" y="8" width="6" height="6" />
                    <rect x="50" y="8" width="6" height="6" />
                    <rect x="44" y="14" width="6" height="6" />
                    <rect x="56" y="20" width="6" height="6" />
                    <rect x="38" y="26" width="12" height="6" />
                    <rect x="8" y="38" width="6" height="12" />
                    <rect x="20" y="44" width="12" height="6" />
                    <rect x="38" y="38" width="24" height="24" rx="3" />
                    <rect
                      x="44"
                      y="44"
                      width="12"
                      height="12"
                      fill="#ffffff"
                    />
                    <rect x="47" y="47" width="6" height="6" />
                    <rect x="68" y="38" width="6" height="6" />
                    <rect x="80" y="44" width="12" height="6" />
                    <rect x="74" y="56" width="6" height="12" />
                    <rect x="38" y="68" width="6" height="12" />
                    <rect x="50" y="74" width="12" height="6" />
                    <rect x="68" y="74" width="12" height="12" />
                    <rect x="86" y="68" width="6" height="18" />
                    <rect x="44" y="86" width="18" height="6" />
                    <rect x="74" y="88" width="18" height="6" />
                  </svg>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <a
                  href={MOBILE_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 bg-zinc-950 border border-zinc-700 text-white font-bold rounded-xl hover:bg-white hover:text-black transition flex items-center justify-center gap-2 text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Open kaspi-pos.vercel.app</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-[11px] text-zinc-500 font-mono text-center">
                  Point camera at QR code • iOS Safari &amp; Android Chrome
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
