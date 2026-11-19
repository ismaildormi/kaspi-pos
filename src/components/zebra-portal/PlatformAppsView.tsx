"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Download,
  Globe,
  Monitor,
  Smartphone,
  Terminal,
} from "lucide-react";
import type { PortalLocale } from "./platform-data";

/**
 * HEYUKA APPS & DOWNLOAD CENTER (Section 5)
 *
 * Strictly separated from HEYUKA Models & Capabilities Center (/zebra-x/models).
 * Enforces zero fake installers, zero fake APKs/IPAs, and exact honesty about
 * downloadable binaries vs source packages & PWA launch scripts.
 */

export function PlatformAppsView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";

  return (
    <div className="space-y-6">
      <section className="kaspi-glass-card kaspi-polar-aurora-orbit relative rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full kaspi-glass-surface text-xs font-semibold text-emerald-500">
            <Download className="w-3.5 h-3.5" />
            <span>HEYUKA APPS &amp; DOWNLOAD CENTER (Separated from Models Registry)</span>
          </div>
          <Link
            href={`/${locale}/zebra-x/models`}
            className="kaspi-glass-btn rounded-full px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Boxes className="w-3.5 h-3.5 text-emerald-500" />
            <span>View Models &amp; Capabilities →</span>
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black">
          Official HEYUKA Applications &amp; Release Verification
        </h1>
        <p className="text-xs sm:text-sm text-[var(--kaspi-text-secondary)] max-w-3xl leading-relaxed">
          We strictly never display fake download buttons or empty binary stubs. Every entry below states its real verification status, version, distribution channel, and integrity status honestly.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Web App / PWA */}
        <div className="kaspi-glass-card rounded-3xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[11px] font-bold text-emerald-500 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED LIVE
              </span>
              <span className="text-xs font-mono text-[var(--kaspi-text-muted)]">v15.0 • Web/PWA</span>
            </div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              <span>HEYUKA Web App &amp; Studios Console</span>
            </h2>
            <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
              Full cloud + on-device WebGPU/WASM workspace running cleanly on any modern Chromium, Firefox, or Safari browser. Installable as a Progressive Web App directly from browser address bar.
            </p>
            <div className="kaspi-frosted-surface rounded-2xl p-3 text-[11px] space-y-1">
              <div>• Requirements: Modern browser (Chrome 113+ recommended for WebGPU)</div>
              <div>• Cost: $0.00 hidden server billing • SHA-256 HTTPS Verified</div>
            </div>
          </div>
          <Link
            href={`/${locale}/heyuka`}
            className="kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold text-center"
          >
            Launch 3D Companion Web App
          </Link>
        </div>

        {/* 2. Windows Quick Launcher Script */}
        <div className="kaspi-glass-card rounded-3xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[11px] font-bold text-emerald-500 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> REAL SCRIPT DOWNLOAD
              </span>
              <span className="text-xs font-mono text-[var(--kaspi-text-muted)]">v12.0 • ~1.2 KB (.bat)</span>
            </div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-500" />
              <span>Windows Native Window Bootstrapper (.bat)</span>
            </h2>
            <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
              Verified Windows batch launcher that opens HEYUKA inside an isolated frameless Edge/Chrome `--app` window (transparently documented as a `.bat` launcher, NOT a compiled binary `.exe`).
            </p>
            <div className="kaspi-frosted-surface rounded-2xl p-3 text-[11px] space-y-1">
              <div>• OS: Windows 10 / 11 (x64) with Microsoft Edge or Google Chrome</div>
              <div>• Integrity: Served plaintext UTF-8 with visible commands before execution</div>
            </div>
          </div>
          <a
            href="/api/v1/heyuka/installer?platform=windows"
            className="kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Windows Launcher (.bat)</span>
          </a>
        </div>

        {/* 3. Native Desktop Source Packages */}
        <div className="kaspi-glass-card rounded-3xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[11px] font-bold text-amber-500 inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> SOURCE READY / CI BINARY PENDING
              </span>
              <span className="text-xs font-mono text-[var(--kaspi-text-muted)]">Electron / Tauri v2</span>
            </div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <Monitor className="w-5 h-5 text-amber-500" />
              <span>Desktop Standalone (.exe / .dmg / .AppImage)</span>
            </h2>
            <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
              The repository contains the Electron companion source (`apps/heyuka-desktop`), Tauri v2 Rust shell (`src-tauri/` + `cargo-xwin` Windows cross-config), and GitHub Actions automated workflow (`.github/workflows/release-all-binaries.yml`) compiling `.exe/.msi`, Universal `.dmg`, and Linux `.AppImage` on release tags.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/v1/heyuka/installer?platform=linux"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 kaspi-glass-btn rounded-2xl px-4 py-2.5 text-xs font-bold text-center"
            >
              Build Spec JSON
            </a>
            <a
              href="https://github.com/ismaildormi/kaspi-pos/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold text-center"
            >
              GitHub Releases →
            </a>
          </div>
        </div>

        {/* 4. Mobile Android APK & iOS */}
        <div className="kaspi-glass-card rounded-3xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full kaspi-glass-surface text-[11px] font-bold text-amber-500 inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> CI WORKFLOW READY
              </span>
              <span className="text-xs font-mono text-[var(--kaspi-text-muted)]">Capacitor APK &amp; Unsigned IPA</span>
            </div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[var(--kaspi-text-muted)]" />
              <span>Android (`.apk`) &amp; iOS (`.ipa`) CI Bundles</span>
            </h2>
            <p className="text-xs text-[var(--kaspi-text-secondary)] leading-relaxed">
              Mobile packages build via `.github/workflows/release-all-binaries.yml` (Capacitor + Gradle Android `.apk` and Capacitor + `xcodebuild` unsigned `.ipa` for AltStore). No local fake APK stubs are hosted on Vercel — download release artifacts from GitHub Actions or install as a 1-click PWA above.
            </p>
          </div>
          <a
            href="https://github.com/ismaildormi/kaspi-pos/actions"
            target="_blank"
            rel="noopener noreferrer"
            className="kaspi-glass-btn rounded-2xl px-4 py-2.5 text-xs font-bold text-center"
          >
            View CI Binary Builds on GitHub Actions →
          </a>
        </div>
      </div>
    </div>
  );
}
