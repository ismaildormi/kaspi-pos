"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Activity,
  BookOpen,
  Boxes,
  Bug,
  Download,
  KeyRound,
  Layers,
  LogIn,
  Menu,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserCheck,
  X,
} from "lucide-react";
import { KaspiBrandMark } from "@/components/common/KaspiBrandMark";
import { AppleBackButton } from "@/components/common/AppleBackButton";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { KaspiThemeToggle } from "@/components/theme/KaspiThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HEYUKAInstallWalkthrough } from "@/components/heyuka/HEYUKAInstallWalkthrough";
import type { PortalLocale } from "./platform-data";

export type PlatformNavId =
  | "overview"
  | "models"
  | "api-keys"
  | "playground"
  | "debug"
  | "docs";

interface HEYUKAPlatformShellProps {
  activeNav: PlatformNavId;
  pageTitle?: string;
  pageSubtitle?: string;
  children: React.ReactNode;
}

const SHELL_COPY: Record<
  PortalLocale,
  {
    platformName: string;
    platformTag: string;
    backToKaspi: string;
    signIn: string;
    desktopApp: string;
    installGuide: string;
    navSectionMain: string;
    navSectionTools: string;
    gatewayLive: string;
    navItems: Record<PlatformNavId, { label: string; desc: string }>;
  }
> = {
  ar: {
    platformName: "منصة مطوري HEYUKA",
    platformTag: "بنية KASPI POS الزجاجية • بروتوكول OpenAI",
    backToKaspi: "العودة لـ KASPI POS",
    signIn: "تسجيل الدخول",
    desktopApp: "تطبيق HEYUKA",
    installGuide: "مراحل التثبيت",
    navSectionMain: "المنصة والنماذج",
    navSectionTools: "الاستوديو والتشخيص",
    gatewayLive: "البوابة متصلة 200 OK",
    navItems: {
      overview: { label: "نظرة عامة والمقارنة", desc: "مقارنة مع OpenAI & Microsoft" },
      models: { label: "دليل النماذج", desc: "Omni • Core • Vision" },
      "api-keys": { label: "مفاتيح الـ API", desc: "إنشاء مفاتيح حقيقية + Key ID" },
      playground: { label: "ملعب التجربة الحي", desc: "محادثة و 12 مسار API" },
      debug: { label: "فاحص Debug الحي", desc: "اختبار 7 نقاط وحل الأخطاء" },
      docs: { label: "التوثيق والـ SDK", desc: "OpenAPI 3.1 • Node • Python" },
    },
  },
  fr: {
    platformName: "Plateforme HEYUKA AI",
    platformTag: "Design Crystal KASPI • Protocole OpenAI",
    backToKaspi: "Retour KASPI POS",
    signIn: "Connexion",
    desktopApp: "App HEYUKA",
    installGuide: "Étapes Install",
    navSectionMain: "Console & Modèles",
    navSectionTools: "Studio & Diagnostic",
    gatewayLive: "Passerelle En Ligne",
    navItems: {
      overview: { label: "Aperçu & Comparatif", desc: "vs OpenAI & Microsoft Azure" },
      models: { label: "Catalogue Modèles", desc: "Omni • Core • Vision" },
      "api-keys": { label: "Clés API (IPK)", desc: "Clés SHA-256 & Key ID" },
      playground: { label: "Playground API", desc: "Chat SSE & 12 Endpoints" },
      debug: { label: "Debugger en Direct", desc: "Suite Diagnostic 7 Points" },
      docs: { label: "Documentation SDK", desc: "OpenAPI 3.1 • Node • Python" },
    },
  },
  en: {
    platformName: "HEYUKA AI Platform",
    platformTag: "KASPI VisionOS Glass • OpenAI Compatible",
    backToKaspi: "Back to KASPI POS",
    signIn: "Sign in",
    desktopApp: "HEYUKA App",
    installGuide: "Setup Guide",
    navSectionMain: "Platform & Models",
    navSectionTools: "Workbench & Debug",
    gatewayLive: "Gateway Online",
    navItems: {
      overview: { label: "Overview & Compare", desc: "vs OpenAI, Microsoft & Google" },
      models: { label: "Models Directory", desc: "Omni • Core • Vision" },
      "api-keys": { label: "API Keys (IPK)", desc: "Issue Unique Keys & Key IDs" },
      playground: { label: "API Playground", desc: "Live Chat & 12 Endpoints" },
      debug: { label: "Live API Debugger", desc: "7-Point Key & CORS Check" },
      docs: { label: "Docs & SDKs", desc: "OpenAPI 3.1 • Node • Python" },
    },
  },
};

const NAV_ICONS: Record<PlatformNavId, React.ComponentType<{ className?: string }>> = {
  overview: Layers,
  models: Boxes,
  "api-keys": KeyRound,
  playground: Terminal,
  debug: Bug,
  docs: BookOpen,
};

export function HEYUKAPlatformShell({
  activeNav,
  pageTitle,
  pageSubtitle,
  children,
}: HEYUKAPlatformShellProps) {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const isRtl = locale === "ar";
  const t = SHELL_COPY[locale];
  const pathname = usePathname();
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  useEffect(() => {
    fetch("/api/v1/zebra-x/keys", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          setAuthenticated(false);
          return;
        }
        setAuthenticated(Boolean(data.authenticated));
        setUserEmail(data.userEmail || null);
      })
      .catch(() => setAuthenticated(false));
  }, []);

  const navRoutes: { id: PlatformNavId; href: string; group: "main" | "tools" }[] = [
    { id: "overview", href: `/${locale}/zebra-x`, group: "main" },
    { id: "models", href: `/${locale}/zebra-x/models`, group: "main" },
    { id: "api-keys", href: `/${locale}/zebra-x/api-keys`, group: "main" },
    { id: "playground", href: `/${locale}/zebra-x/playground`, group: "tools" },
    { id: "debug", href: `/${locale}/zebra-x/debug`, group: "tools" },
    { id: "docs", href: `/${locale}/zebra-x/docs`, group: "tools" },
  ];

  const loginHref = `/${locale}/login?from=${encodeURIComponent(pathname || `/${locale}/zebra-x`)}`;
  const backHref = authenticated ? `/${locale}/dashboard` : `/${locale}`;

  const renderNavLinks = (onSelect?: () => void) => (
    <div className="space-y-5">
      <div>
        <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--kaspi-text-muted)]">
          {t.navSectionMain}
        </div>
        <div className="space-y-1.5">
          {navRoutes
            .filter((r) => r.group === "main")
            .map((route) => {
              const Icon = NAV_ICONS[route.id];
              const isActive = activeNav === route.id;
              const copy = t.navItems[route.id];
              return (
                <Link
                  key={route.id}
                  href={route.href}
                  onClick={onSelect}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all group ${
                    isActive
                      ? "kaspi-orbit-active font-semibold"
                      : "hover:bg-[var(--kaspi-surface-hover)] text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? "text-emerald-500"
                        : "text-[var(--kaspi-text-muted)] group-hover:text-[var(--kaspi-text-primary)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-[13px] truncate text-[var(--kaspi-text-primary)]">
                      {copy.label}
                    </div>
                    <div className="text-[11px] truncate text-[var(--kaspi-text-muted)]">
                      {copy.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>

      <div>
        <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--kaspi-text-muted)]">
          {t.navSectionTools}
        </div>
        <div className="space-y-1.5">
          {navRoutes
            .filter((r) => r.group === "tools")
            .map((route) => {
              const Icon = NAV_ICONS[route.id];
              const isActive = activeNav === route.id;
              const copy = t.navItems[route.id];
              return (
                <Link
                  key={route.id}
                  href={route.href}
                  onClick={onSelect}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all group ${
                    isActive
                      ? "kaspi-orbit-active font-semibold"
                      : "hover:bg-[var(--kaspi-surface-hover)] text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? "text-emerald-500"
                        : "text-[var(--kaspi-text-muted)] group-hover:text-[var(--kaspi-text-primary)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-[13px] truncate text-[var(--kaspi-text-primary)]">
                      {copy.label}
                    </div>
                    <div className="text-[11px] truncate text-[var(--kaspi-text-muted)]">
                      {copy.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen md:h-screen md:overflow-hidden bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] flex flex-col md:flex-row relative selection:bg-emerald-500 selection:text-white"
    >
      {/* Desktop Crystal Glass Sidebar */}
      <aside className="hidden md:flex md:w-[272px] md:shrink-0 md:flex-col kaspi-sidebar-glass md:h-screen overflow-y-auto p-4 gap-5 z-20">
        <div className="flex items-center gap-3 px-2 pt-1">
          <Link href={`/${locale}/zebra-x`} className="flex items-center gap-3 group min-w-0">
            <KaspiBrandMark size="md" alt="KASPI POS • HEYUKA" />
            <div className="min-w-0">
              <div className="text-sm font-extrabold tracking-tight text-[var(--kaspi-text-primary)] flex items-center gap-1.5 truncate">
                <span>HEYUKA</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full kaspi-glass-surface text-emerald-500 font-bold">
                  AI API
                </span>
              </div>
              <div className="text-[11px] text-[var(--kaspi-text-muted)] truncate">
                KASPI Developer Console
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1">{renderNavLinks()}</nav>

        {/* Bottom Status & Desktop App Card */}
        <div className="space-y-2.5 pt-3 border-t border-[var(--kaspi-border)]">
          <div className="kaspi-frosted-surface rounded-2xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-semibold text-[var(--kaspi-text-secondary)] truncate">
                {t.gatewayLive}
              </span>
            </div>
            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </div>

          <Link
            href={`/${locale}/heyuka`}
            className="kaspi-glass-btn rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold transition-all hover:scale-[1.01]"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.desktopApp}</span>
            </span>
            <Download className="w-3.5 h-3.5 opacity-70" />
          </Link>

          <button
            type="button"
            onClick={() => setWalkthroughOpen(true)}
            className="w-full kaspi-primary-cta-btn rounded-2xl px-3.5 py-2.5 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.installGuide}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto relative z-10">
        {/* VisionOS Frosted Top Bar */}
        <header className="kaspi-glass-surface border-x-0 border-t-0 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation"
              className="md:hidden kaspi-glass-btn w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="md:hidden flex items-center gap-2">
              <KaspiBrandMark size="sm" alt="KASPI POS" />
            </div>

            <div className="hidden sm:inline-flex">
              <AppleBackButton
                onClick={() => router.push(backHref)}
                locale={locale}
                label={t.backToKaspi}
                className="text-xs px-3 py-1.5"
              />
            </div>

            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[var(--kaspi-text-primary)] truncate flex items-center gap-2">
                <span>{pageTitle || t.platformName}</span>
                <span className="hidden lg:inline-flex text-[11px] font-mono px-2 py-0.5 rounded-full kaspi-glass-surface text-[var(--kaspi-text-muted)]">
                  /api/v1 &amp; /v1
                </span>
              </div>
              {pageSubtitle && (
                <p className="hidden sm:block text-[11px] text-[var(--kaspi-text-muted)] truncate max-w-xl">
                  {pageSubtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {authenticated && userEmail ? (
              <Link
                href={`/${locale}/zebra-x/api-keys`}
                className="kaspi-glass-btn rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold"
                title={userEmail}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate font-mono text-[11px]">
                  {userEmail}
                </span>
              </Link>
            ) : authenticated === false ? (
              <Link
                href={loginHref}
                className="kaspi-primary-cta-btn rounded-full px-3.5 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.signIn}</span>
              </Link>
            ) : (
              <div className="kaspi-glass-surface rounded-full px-3 py-1.5 text-[11px] text-[var(--kaspi-text-muted)] font-mono">
                <ShieldCheck className="w-3.5 h-3.5 inline me-1 text-emerald-500" />
                KASPI Auth
              </div>
            )}

            <KaspiThemeToggle locale={locale} />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile Navigation Drawer inside KaspiGlassModalPortal */}
      <KaspiGlassModalPortal
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="kaspi-opaque-glass-modal kaspi-polar-aurora-orbit relative w-full max-w-sm rounded-3xl p-5 space-y-5 text-[var(--kaspi-text-primary)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--kaspi-border)] pb-3">
            <div className="flex items-center gap-2.5">
              <KaspiBrandMark size="sm" alt="KASPI" />
              <div>
                <div className="text-sm font-extrabold">HEYUKA AI Platform</div>
                <div className="text-[11px] text-[var(--kaspi-text-muted)]">KASPI Developer Console</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="kaspi-glass-btn w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {renderNavLinks(() => setMobileMenuOpen(false))}

          <div className="pt-3 border-t border-[var(--kaspi-border)] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setWalkthroughOpen(true);
              }}
              className="w-full kaspi-primary-cta-btn rounded-2xl px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.installGuide}</span>
            </button>
            <Link
              href={backHref}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full kaspi-glass-btn rounded-2xl px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <span>{t.backToKaspi}</span>
            </Link>
          </div>
        </div>
      </KaspiGlassModalPortal>

      <HEYUKAInstallWalkthrough
        isOpen={walkthroughOpen}
        onClose={() => setWalkthroughOpen(false)}
        locale={locale}
      />
    </div>
  );
}
