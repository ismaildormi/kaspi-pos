import React from "react";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { ArrowLeft, Bug, Layers, MessageSquare } from "lucide-react";
import { KaspiThemeToggle } from "@/components/theme/KaspiThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HEYUKALandingShowcase } from "@/components/heyuka/HEYUKALandingShowcase";
import { HeyukaLoopMark } from "@/components/heyuka/HeyukaLoopMark";
import { AutonomousSelfHealingBoundary } from "@/components/security/AutonomousSelfHealingBoundary";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "HEYUKA • Sovereign AI Chat, Desktop App & Free Developer API",
  description:
    "Chat with HEYUKA for free, download the 3D Desktop Companion, and issue unique SHA-256 API Keys + Key IDs covered 100% by KASPI.",
};

export default async function HeyukaShowcasePage() {
  const locale = await getLocale();
  const isRtl = locale === "ar";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] flex flex-col justify-between selection:bg-rose-600 selection:text-white"
    >
      <header className="kaspi-glass-surface border-x-0 border-t-0 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/${locale}/heyuka`} className="flex items-center gap-2 shrink-0">
            <HeyukaLoopMark size="md" variant="crimson" />
            <span className="text-lg font-black tracking-tight text-[var(--kaspi-text-primary)]">
              heyuka
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
            href={`/${locale}/chat`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isRtl ? "محادثة مجانية" : "Chat for free"}</span>
          </Link>
          <Link
            href={`/${locale}/zebra-x`}
            className="kaspi-glass-btn rounded-full px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span>{isRtl ? "منصة الـ API" : "API Platform"}</span>
          </Link>
          <Link
            href={`/${locale}/zebra-x/debug`}
            className="hidden sm:inline-flex kaspi-glass-btn rounded-full px-3.5 py-1.5 text-xs font-bold items-center gap-1.5"
          >
            <Bug className="w-3.5 h-3.5 text-rose-500" />
            <span>Live Debugger</span>
          </Link>
          <KaspiThemeToggle locale={locale} />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1">
        <AutonomousSelfHealingBoundary scope="HEYUKA_LANDING">
          <HEYUKALandingShowcase />
        </AutonomousSelfHealingBoundary>
      </main>
      <Footer />
    </div>
  );
}
