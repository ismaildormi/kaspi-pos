import React from "react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { ArrowLeft, Bug, Layers } from "lucide-react";
import { KaspiBrandMark } from "@/components/common/KaspiBrandMark";
import { KaspiThemeToggle } from "@/components/theme/KaspiThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HEYUKALandingShowcase } from "@/components/heyuka/HEYUKALandingShowcase";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "HEYUKA by KASPI • 3D Interactive Desktop App & Sovereign Intelligence",
  description:
    "Download HEYUKA Desktop App owned by KASPI: 32 interactive 3D characters, multimodal intelligence, and unique API Keys + Key IDs for developers.",
};

export default async function HeyukaShowcasePage() {
  const locale = await getLocale();
  const isRtl = locale === "ar";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] flex flex-col justify-between selection:bg-emerald-500 selection:text-white"
    >
      <header className="kaspi-glass-surface border-x-0 border-t-0 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 shrink-0">
            <KaspiBrandMark size="sm" alt="KASPI • HEYUKA" />
            <span className="text-sm font-extrabold tracking-tight text-[var(--kaspi-text-primary)]">
              HEYUKA <span className="text-emerald-500 font-mono text-xs">Desktop</span>
            </span>
          </Link>
          <Link
            href={`/${locale}`}
            className="kaspi-glass-btn hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--kaspi-text-primary)]"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? "rotate-180" : ""}`} />
            <span>{isRtl ? "الرئيسية" : "Home"}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/${locale}/zebra-x`}
            className="kaspi-glass-btn rounded-full px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isRtl ? "منصة المطورين" : "Developer Console"}</span>
          </Link>
          <Link
            href={`/${locale}/zebra-x/debug`}
            className="hidden sm:inline-flex kaspi-glass-btn rounded-full px-3.5 py-1.5 text-xs font-bold items-center gap-1.5"
          >
            <Bug className="w-3.5 h-3.5 text-emerald-500" />
            <span>Live Debugger</span>
          </Link>
          <KaspiThemeToggle locale={locale} />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1">
        <HEYUKALandingShowcase />
      </main>
      <Footer />
    </div>
  );
}
