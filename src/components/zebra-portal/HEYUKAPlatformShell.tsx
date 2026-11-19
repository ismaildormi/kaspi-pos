"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Activity,
  Archive,
  BookOpen,
  Boxes,
  Bug,
  Command,
  Cpu,
  Download,
  FlaskConical,
  KeyRound,
  LogIn,
  Menu,
  Palette,
  PackagePlus,
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
  | "studios"
  | "lab"
  | "vault"
  | "workers"
  | "products"
  | "models"
  | "apps"
  | "api-keys"
  | "playground"
  | "debug"
  | "docs";

type AccentKey = "emerald" | "teal" | "violet" | "amber" | "titanium";

const ACCENT_HEX: Record<AccentKey, string> = {
  emerald: "#10b981",
  teal: "#14b8a6",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  titanium: "#94a3b8",
};

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
    backToKaspi: string;
    signIn: string;
    installGuide: string;
    secCore: string;
    secInfra: string;
    secDev: string;
    gatewayLive: string;
    navItems: Record<PlatformNavId, { label: string; desc: string }>;
  }
> = {
  ar: {
    platformName: "منظومة HEYUKA AI 2050",
    backToKaspi: "العودة لـ KASPI",
    signIn: "تسجيل الدخول",
    installGuide: "دليل التثبيت",
    secCore: "القيادة والمنتجات",
    secInfra: "المختبر والنتائج والحوسبة",
    secDev: "المطورون والتطبيقات",
    gatewayLive: "حماية $0.00 فعالة",
    navItems: {
      overview: { label: "مركز القيادة الذكي", desc: "نظرة عامة ومحادثة موجهة" },
      studios: { label: "الاستوديوهات المتخصصة", desc: "12 منتج AI مجالي مستقل" },
      lab: { label: "مختبر الاختبار والقياس", desc: "اختبارات حقيقية وتصدير ZIP" },
      vault: { label: "خزنة النتائج الحقيقية", desc: "Real Output Vault + SHA-256" },
      workers: { label: "الحوسبة الموزعة و BYOK", desc: "أجهزة المستخدم و Worker nodes" },
      products: { label: "مصنع المنتجات المصغرة", desc: "إنشاء منتجات + Widget خارجي" },
      models: { label: "النماذج والقدرات", desc: "Capability Registry مفحوص" },
      apps: { label: "التطبيقات والتحميلات", desc: "إصدارات حقيقية بدون ملفات وهمية" },
      "api-keys": { label: "مفاتيح الـ API", desc: "مفاتيح SHA-256 + Key ID" },
      playground: { label: "ملعب الاختبار", desc: "Chat SSE & 13 Endpoints" },
      debug: { label: "فاحص Debug الحي", desc: "اختبار 7 نقاط وحل الأخطاء" },
      docs: { label: "التوثيق و OpenAPI", desc: "SDKs + الأمان + الميزانية" },
    },
  },
  fr: {
    platformName: "HEYUKA AI Ecosystem 2050",
    backToKaspi: "Retour KASPI",
    signIn: "Connexion",
    installGuide: "Guide Install",
    secCore: "Command Center & Studios",
    secInfra: "Labo, Résultats & Compute",
    secDev: "Développeurs & Apps",
    gatewayLive: "Bouclier $0.00 Actif",
    navItems: {
      overview: { label: "Command Center", desc: "Vue globale & routeur IA" },
      studios: { label: "Studios Spécialisés", desc: "12 produits IA métiers" },
      lab: { label: "Labo Benchmarks", desc: "Tests réels & Export ZIP/XLSX" },
      vault: { label: "Coffre Résultats Réels", desc: "Output Vault vérifié SHA-256" },
      workers: { label: "Compute & Workers", desc: "WebGPU, Workers & BYOK chiffré" },
      products: { label: "Mini-Produits & Embed", desc: "Widgets externes & Clés dédiées" },
      models: { label: "Modèles & Capacités", desc: "Registre dynamique vérifié" },
      apps: { label: "Apps & Téléchargements", desc: "Releases réelles séparées" },
      "api-keys": { label: "Clés API (IPK)", desc: "Coffre SHA-256 & Key ID" },
      playground: { label: "Playground API", desc: "Chat SSE & REST interactif" },
      debug: { label: "Debugger en Direct", desc: "Suite Diagnostic 7 Points" },
      docs: { label: "Docs & Sécurité", desc: "SDKs, OpenAPI 3.1 & Règles" },
    },
  },
  en: {
    platformName: "HEYUKA AI Ecosystem 2050",
    backToKaspi: "Back to KASPI",
    signIn: "Sign in",
    installGuide: "Setup Guide",
    secCore: "Command & Studios",
    secInfra: "Testing Lab, Vault & Compute",
    secDev: "Developers & Apps",
    gatewayLive: "$0.00 Cost Shield Active",
    navItems: {
      overview: { label: "Command Center", desc: "Overview & Intent Router" },
      studios: { label: "Specialized Studios", desc: "12 Focused AI Workspaces" },
      lab: { label: "Autonomous Test Lab", desc: "Real Benchmarks & ZIP Export" },
      vault: { label: "Real Output Vault", desc: "SHA-256 Verified Artifacts" },
      workers: { label: "Workers & Zero-Cost", desc: "Device GPU, Workers & BYOK" },
      products: { label: "Mini-Product Factory", desc: "Tenant Widgets & Scoped Keys" },
      models: { label: "Models & Capabilities", desc: "Dynamic Capability Registry" },
      apps: { label: "Apps & Downloads", desc: "Honest Releases (Zero Fakes)" },
      "api-keys": { label: "API Keys (IPK)", desc: "SHA-256 Keys & Key IDs" },
      playground: { label: "API Playground", desc: "Live Chat SSE & REST" },
      debug: { label: "Live API Debugger", desc: "7-Point Key & CORS Check" },
      docs: { label: "Docs & Security", desc: "SDKs, OpenAPI 3.1 & Guardrails" },
    },
  },
};

const NAV_ICONS: Record<PlatformNavId, React.ComponentType<{ className?: string }>> = {
  overview: Command,
  studios: Sparkles,
  lab: FlaskConical,
  vault: Archive,
  workers: Cpu,
  products: PackagePlus,
  models: Boxes,
  apps: Download,
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
  const [accent, setAccent] = useState<AccentKey>("emerald");
  const [accentMenuOpen, setAccentMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const savedAccent = window.localStorage.getItem("heyuka_future_glass_accent") as AccentKey | null;
      if (savedAccent && ACCENT_HEX[savedAccent]) setAccent(savedAccent);
    } catch {}
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

  const chooseAccent = (next: AccentKey) => {
    setAccent(next);
    setAccentMenuOpen(false);
    try {
      window.localStorage.setItem("heyuka_future_glass_accent", next);
    } catch {}
  };

  const navGroups: {
    title: string;
    items: { id: PlatformNavId; href: string }[];
  }[] = [
    {
      title: t.secCore,
      items: [
        { id: "overview", href: `/${locale}/zebra-x` },
        { id: "studios", href: `/${locale}/zebra-x/studios` },
        { id: "products", href: `/${locale}/zebra-x/products` },
      ],
    },
    {
      title: t.secInfra,
      items: [
        { id: "lab", href: `/${locale}/zebra-x/lab` },
        { id: "vault", href: `/${locale}/zebra-x/vault` },
        { id: "workers", href: `/${locale}/zebra-x/workers` },
      ],
    },
    {
      title: t.secDev,
      items: [
        { id: "models", href: `/${locale}/zebra-x/models` },
        { id: "apps", href: `/${locale}/zebra-x/apps` },
        { id: "api-keys", href: `/${locale}/zebra-x/api-keys` },
        { id: "playground", href: `/${locale}/zebra-x/playground` },
        { id: "debug", href: `/${locale}/zebra-x/debug` },
        { id: "docs", href: `/${locale}/zebra-x/docs` },
      ],
    },
  ];

  const loginHref = `/${locale}/login?from=${encodeURIComponent(pathname || `/${locale}/zebra-x`)}`;
  const backHref = authenticated ? `/${locale}/dashboard` : `/${locale}`;

  const renderNavLinks = (onSelect?: () => void) => (
    <div className="space-y-4">
      {navGroups.map((group) => (
        <div key={group.title}>
          <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--kaspi-text-muted)]">
            {group.title}
          </div>
          <div className="space-y-1">
            {group.items.map((route) => {
              const Icon = NAV_ICONS[route.id];
              const isActive = activeNav === route.id;
              const copy = t.navItems[route.id];
              return (
                <Link
                  key={route.id}
                  href={route.href}
                  onClick={onSelect}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl transition-all group ${
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
                    <div className="text-xs truncate text-[var(--kaspi-text-primary)]">
                      {copy.label}
                    </div>
                    <div className="text-[10px] truncate text-[var(--kaspi-text-muted)]">
                      {copy.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      style={{ ["--heyuka-accent" as any]: ACCENT_HEX[accent] }}
      className="min-h-screen md:h-screen md:overflow-hidden bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] flex flex-col md:flex-row relative selection:bg-emerald-500 selection:text-white"
    >
      {/* Subtle 2050 Corner Atmospheric Accent Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 right-0 bottom-0 left-0 opacity-[0.14] z-0"
        style={{
          background: `radial-gradient(ellipse 46% 36% at 18% 14%, ${ACCENT_HEX[accent]} 0%, transparent 64%), radial-gradient(ellipse 42% 34% at 86% 84%, ${ACCENT_HEX[accent]} 0%, transparent 66%)`,
        }}
      />

      {/* Desktop Future Glass 2050 Sidebar */}
      <aside className="hidden md:flex md:w-[276px] md:shrink-0 md:flex-col kaspi-sidebar-glass md:h-screen overflow-y-auto kaspi-no-scrollbar p-4 gap-4 z-20">
        <div className="flex items-center gap-3 px-2 pt-1">
          <Link href={`/${locale}/zebra-x`} className="flex items-center gap-3 group min-w-0">
            <KaspiBrandMark size="md" alt="KASPI • HEYUKA 2050" />
            <div className="min-w-0">
              <div className="text-sm font-extrabold tracking-tight text-[var(--kaspi-text-primary)] flex items-center gap-1.5 truncate">
                <span>HEYUKA</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full kaspi-glass-surface text-emerald-500 font-bold">
                  OS 2050
                </span>
              </div>
              <div className="text-[11px] text-[var(--kaspi-text-muted)] truncate">
                Multi-Product Ecosystem
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1">{renderNavLinks()}</nav>

        {/* Bottom Zero-Cost & Setup Controls */}
        <div className="space-y-2 pt-3 border-t border-[var(--kaspi-border)]">
          <Link
            href={`/${locale}/zebra-x/workers`}
            className="kaspi-frosted-surface rounded-2xl p-2.5 flex items-center justify-between gap-2 hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-semibold text-[var(--kaspi-text-secondary)] truncate">
                {t.gatewayLive}
              </span>
            </div>
            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={() => setWalkthroughOpen(true)}
            className="w-full kaspi-primary-cta-btn rounded-2xl px-3.5 py-2 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.installGuide}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto relative z-10">
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
              <KaspiBrandMark size="sm" alt="KASPI" />
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
                <span className="hidden lg:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full kaspi-glass-surface text-emerald-500 font-bold">
                  Future Glass 2050
                </span>
              </div>
              {pageSubtitle && (
                <p className="hidden sm:block text-[11px] text-[var(--kaspi-text-muted)] truncate max-w-xl">
                  {pageSubtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap relative">
            {/* Accent Color Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccentMenuOpen((v) => !v)}
                title="Adaptive Glass Accent"
                className="kaspi-glass-btn w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              >
                <Palette className="w-4 h-4" style={{ color: ACCENT_HEX[accent] }} />
              </button>
              {accentMenuOpen && (
                <div className="absolute right-0 mt-2 kaspi-glass-card rounded-2xl p-2 flex items-center gap-1.5 z-50">
                  {(Object.keys(ACCENT_HEX) as AccentKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => chooseAccent(key)}
                      title={key}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                        accent === key ? "scale-110 border-white" : "border-transparent opacity-80"
                      }`}
                      style={{ backgroundColor: ACCENT_HEX[key] }}
                    />
                  ))}
                </div>
              )}
            </div>

            {authenticated && userEmail ? (
              <Link
                href={`/${locale}/zebra-x/api-keys`}
                className="kaspi-glass-btn rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold"
                title={userEmail}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="max-w-[130px] sm:max-w-[190px] truncate font-mono text-[11px]">
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
                HEYUKA
              </div>
            )}

            <KaspiThemeToggle locale={locale} />
            <LanguageSwitcher />
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile Drawer inside KaspiGlassModalPortal */}
      <KaspiGlassModalPortal
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="kaspi-opaque-glass-modal kaspi-polar-aurora-orbit relative w-full max-w-sm rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto text-[var(--kaspi-text-primary)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--kaspi-border)] pb-3">
            <div className="flex items-center gap-2.5">
              <KaspiBrandMark size="sm" alt="KASPI" />
              <div>
                <div className="text-sm font-extrabold">HEYUKA OS 2050</div>
                <div className="text-[11px] text-[var(--kaspi-text-muted)]">Multi-Product Platform</div>
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
