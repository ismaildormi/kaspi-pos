"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  Bug,
  Coins,
  Cpu,
  ExternalLink,
  HelpCircle,
  KeyRound,
  Layers,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Tag,
  Terminal,
  User,
  Wallet,
  X,
} from "lucide-react";
import { KaspiThemeToggle } from "@/components/theme/KaspiThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AutonomousSelfHealingBoundary } from "@/components/security/AutonomousSelfHealingBoundary";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { HeyukaLoopMark } from "@/components/heyuka/HeyukaLoopMark";
import { HEYUKAGmailAccessCard } from "@/components/heyuka/HEYUKAGmailAccessCard";
import type { PortalLocale } from "./platform-data";

export type PlatformNavId =
  | "overview"
  | "usage"
  | "api-keys"
  | "quota"
  | "pricing"
  | "models"
  | "playground"
  | "debug"
  | "docs"
  | "profile"
  | "studios"
  | "lab"
  | "vault"
  | "products"
  | "workers"
  | "apps";

interface HEYUKAPlatformShellProps {
  activeNav: PlatformNavId;
  pageTitle?: string;
  pageSubtitle?: string;
  children: React.ReactNode;
}

const SHELL_COPY: Record<
  PortalLocale,
  {
    bannerText: string;
    bannerLink: string;
    usage: string;
    apiKeys: string;
    quota: string;
    stats: string;
    docs: string;
    faq: string;
    pricing: string;
    chatFree: string;
    debugger: string;
    playground: string;
    models: string;
    apps: string;
    homeLink: string;
    signIn: string;
    guestLabel: string;
    authModalTitle: string;
    authModalDesc: string;
  }
> = {
  ar: {
    bannerText:
      "تم تحديث منظومة HEYUKA Omni و HEYUKA Core: دعم كامل للبحث الحي على الويب، الوكلاء، واستخراج مفاتيح API مجاناً عبر KASPI.",
    bannerLink: "عرض التوثيق",
    usage: "الاستهلاك والإحصائيات (Usage)",
    apiKeys: "مفاتيح الـ API (IPK)",
    quota: "التغطية المجانية ($0.00)",
    stats: "إحصائيات التجار والتوكن",
    docs: "التوثيق البرمجي (Docs)",
    faq: "الأسئلة الشائعة (FAQ)",
    pricing: "النماذج والتكلفة ($0.00)",
    chatFree: "محادثة HEYUKA مجاناً",
    debugger: "فاحص Debug الحي",
    playground: "ملعب التجربة (Playground)",
    models: "سجل النماذج",
    apps: "تطبيقات سطح المكتب",
    homeLink: "صفحة HEYUKA",
    signIn: "الدخول بـ Gmail",
    guestLabel: "الدخول عبر Gmail",
    authModalTitle: "الدخول إلى منصة HEYUKA عبر Gmail",
    authModalDesc:
      "ادخل ببريدك الإلكتروني للحصول على مفاتيح API فريدة ومزامنة محادثاتك — مجاناً 100% بدون حساب متجر POS.",
  },
  fr: {
    bannerText:
      "HEYUKA Omni & Vision mis à jour : recherche web en direct, Think structuré et clés API souveraines 100% gratuites.",
    bannerLink: "Voir les détails",
    usage: "Usage & Statistiques",
    apiKeys: "Clés API (IPK)",
    quota: "Quota Gratuit ($0.00)",
    stats: "Statistiques Marchands",
    docs: "Documentation (Docs)",
    faq: "Aide & FAQ",
    pricing: "Modèles & Tarifs ($0.00)",
    chatFree: "Chat HEYUKA Gratuit",
    debugger: "Live Debugger (Debug)",
    playground: "Playground API",
    models: "Catalogue Modèles",
    apps: "Applications Bureau",
    homeLink: "Accueil HEYUKA",
    signIn: "Connexion Gmail",
    guestLabel: "Accès Gmail",
    authModalTitle: "Accéder à HEYUKA avec Gmail",
    authModalDesc:
      "Connectez votre Gmail pour générer des clés API uniques et sauvegarder vos discussions — 100% gratuit sans compte POS.",
  },
  en: {
    bannerText:
      "HEYUKA Omni & Vision v15 live — OpenAI/Anthropic compatible `/v1` gateway, free Web Search & sovereign API keys covered 100% by KASPI.",
    bannerLink: "Click for details",
    usage: "Usage",
    apiKeys: "API keys",
    quota: "Free Coverage",
    stats: "Live Network Stats",
    docs: "Docs",
    faq: "Help & FAQ",
    pricing: "Pricing ($0.00)",
    chatFree: "Chat for free",
    debugger: "Live Debugger",
    playground: "API Playground",
    models: "Models",
    apps: "Desktop App",
    homeLink: "HEYUKA Home",
    signIn: "Sign in (Gmail)",
    guestLabel: "Sign in via Gmail",
    authModalTitle: "Sign in to HEYUKA Platform",
    authModalDesc:
      "Sign in with Gmail to mint unique SHA-256 API keys and sync your conversations — $0.00 free without a POS store account.",
  },
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
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const loadAuthState = () => {
    fetch("/api/v1/zebra-x/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.authenticated && d?.profile) {
          setAuthenticated(true);
          setUserEmail(d.profile.email || null);
          setDisplayName(d.profile.name || null);
        } else {
          setAuthenticated(false);
          setUserEmail(null);
          setDisplayName(null);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAuthState();
  }, [pathname]);

  const primaryNav = [
    {
      id: "usage" as const,
      aliases: ["overview", "usage", "products", "stats"] as PlatformNavId[],
      href: `/${locale}/zebra-x`,
      label: t.usage,
      icon: BarChart3,
    },
    {
      id: "api-keys" as const,
      aliases: ["api-keys", "vault"] as PlatformNavId[],
      href: `/${locale}/zebra-x/api-keys`,
      label: t.apiKeys,
      icon: KeyRound,
    },
    {
      id: "models" as const,
      aliases: ["models", "studios", "lab"] as PlatformNavId[],
      href: `/${locale}/zebra-x/models`,
      label: t.models,
      icon: Cpu,
    },
    {
      id: "playground" as const,
      aliases: ["playground", "workers"] as PlatformNavId[],
      href: `/${locale}/zebra-x/playground`,
      label: t.playground,
      icon: Terminal,
    },
    {
      id: "debug" as const,
      aliases: ["debug"] as PlatformNavId[],
      href: `/${locale}/zebra-x/debug`,
      label: t.debugger,
      icon: Bug,
    },
  ];

  const secondaryNav = [
    {
      id: "docs" as const,
      href: `/${locale}/zebra-x/docs`,
      label: t.docs,
      icon: BookOpen,
      external: true,
    },
    {
      id: "faq" as const,
      href: `/${locale}/zebra-x/docs?tab=faq`,
      label: t.faq,
      icon: HelpCircle,
      external: false,
    },
    {
      id: "pricing" as const,
      href: `/${locale}/zebra-x/docs?tab=pricing`,
      label: t.pricing,
      icon: Tag,
      external: false,
    },
    {
      id: "apps" as const,
      href: `/${locale}/zebra-x/apps`,
      label: t.apps,
      icon: Layers,
      external: false,
    },
    {
      id: "chat" as const,
      href: `/${locale}/chat`,
      label: t.chatFree,
      icon: MessageSquare,
      external: false,
    },
  ];

  const isNavItemActive = (aliases: PlatformNavId[]) => aliases.includes(activeNav);

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between py-4 px-3 select-none">
      <div className="space-y-6">
        {/* DeepSeek-style minimalist Brand Header: KASPI Loop + heyuka [Platform] */}
        <div className="flex items-center justify-between px-2">
          <Link
            href={`/${locale}/zebra-x`}
            className="flex items-center gap-2.5 group"
            onClick={() => setMobileOpen(false)}
          >
            <HeyukaLoopMark size="md" variant="crimson" />
            <div className="flex items-center gap-1.5">
              <span className="text-[19px] font-black tracking-tight text-[var(--kaspi-text-primary)]">
                heyuka
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--kaspi-text-primary)] text-[var(--kaspi-bg)] leading-none">
                Platform
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)] cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Developer Nav (exact DeepSeek hierarchy) */}
        <nav className="space-y-1">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.aliases);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all ${
                  active
                    ? "bg-white/[0.11] text-[var(--kaspi-text-primary)] font-semibold border border-rose-500/35 shadow-xs"
                    : "text-[var(--kaspi-text-secondary)] hover:bg-white/[0.06] hover:text-[var(--kaspi-text-primary)] font-medium"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? "text-rose-500" : "text-[var(--kaspi-text-muted)]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--kaspi-border)] pt-3 space-y-1">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13px] transition-all ${
                  active
                    ? "bg-white/[0.10] text-[var(--kaspi-text-primary)] font-semibold"
                    : "text-[var(--kaspi-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--kaspi-text-primary)] font-medium"
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 text-[var(--kaspi-text-muted)]" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === "chat" && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[9px] font-bold">
                    FREE
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile Slot matching DeepSeek Platform bottom-left user bar */}
      <div className="pt-3 border-t border-[var(--kaspi-border)] space-y-2">
        {authenticated ? (
          <Link
            href={`/${locale}/zebra-x/profile`}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors ${
              activeNav === "profile"
                ? "bg-white/[0.11] border border-rose-500/40"
                : "hover:bg-white/[0.06]"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-xs font-bold text-rose-400 shrink-0 uppercase">
              {(displayName || userEmail || "H").slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--kaspi-text-primary)] truncate">
                {displayName || userEmail?.split("@")[0] || "Developer"}
              </p>
              <p className="text-[10px] text-[var(--kaspi-text-muted)] truncate">
                {userEmail || "Gmail verified"}
              </p>
            </div>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl kaspi-glass-surface hover:border-rose-500/40 text-xs font-semibold text-[var(--kaspi-text-primary)] cursor-pointer transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">{t.guestLabel}</span>
          </button>
        )}

        <Link
          href={`/${locale}/heyuka`}
          className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] text-[var(--kaspi-text-muted)] hover:text-[var(--kaspi-text-primary)] transition-colors"
        >
          <span>{t.homeLink}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col bg-[var(--kaspi-bg)] text-[var(--kaspi-text-primary)] selection:bg-rose-600 selection:text-white"
    >
      {/* Top Crimson Accent Announcement Banner (replaces DeepSeek's blue top strip cleanly) */}
      {bannerVisible && (
        <div className="relative bg-rose-600 text-white px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2 z-30">
          <Sparkles className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
          <span className="truncate max-w-4xl">{t.bannerText}</span>
          <Link
            href={`/${locale}/zebra-x/docs`}
            className="underline underline-offset-2 font-bold hover:text-rose-100 shrink-0"
          >
            {t.bannerLink}
          </Link>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            className={`p-1 rounded hover:bg-white/15 cursor-pointer ${
              isRtl ? "mr-auto sm:absolute sm:left-3" : "ml-auto sm:absolute sm:right-3"
            }`}
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Desktop Fixed Sidebar (240px clean dark/adaptive panel matching DeepSeek Platform) */}
        <aside
          className={`hidden lg:flex w-[240px] shrink-0 flex-col border-[var(--kaspi-border)] bg-[var(--kaspi-surface,rgba(24,25,30,0.72))] backdrop-blur-xl ${
            isRtl ? "border-l" : "border-r"
          }`}
        >
          {sidebarContent}
        </aside>

        {/* Mobile Drawer via KaspiGlassModalPortal */}
        <KaspiGlassModalPortal
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="w-full max-w-sm max-h-[82vh] overflow-y-auto rounded-2xl kaspi-opaque-glass-modal p-2">
            {sidebarContent}
          </div>
        </KaspiGlassModalPortal>

        {/* Gmail Sign-In Modal via KaspiGlassModalPortal */}
        <KaspiGlassModalPortal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="w-full max-w-md rounded-3xl kaspi-opaque-glass-modal p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <HeyukaLoopMark size="sm" variant="crimson" />
                <div>
                  <h2 className="text-base font-extrabold text-[var(--kaspi-text-primary)]">
                    {t.authModalTitle}
                  </h2>
                  <p className="text-xs text-[var(--kaspi-text-muted)] mt-0.5">
                    {t.authModalDesc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--kaspi-text-muted)] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <HEYUKAGmailAccessCard
              locale={locale}
              compact
              onAuthenticated={async () => {
                setAuthModalOpen(false);
                loadAuthState();
                router.refresh();
              }}
            />
          </div>
        </KaspiGlassModalPortal>

        {/* Main Workspace Canvas */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Compact Utility Bar */}
          <header className="px-4 sm:px-8 py-3 border-b border-[var(--kaspi-border)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl kaspi-glass-surface text-[var(--kaspi-text-primary)] cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-[var(--kaspi-text-primary)] truncate">
                  {pageTitle || "HEYUKA Platform"}
                </h1>
                {pageSubtitle && (
                  <p className="text-[11px] text-[var(--kaspi-text-muted)] truncate hidden sm:block">
                    {pageSubtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/${locale}/chat`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-600/15 border border-rose-500/35 text-rose-400 hover:bg-rose-600/25 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t.chatFree}</span>
              </Link>
              <KaspiThemeToggle locale={locale} />
              <LanguageSwitcher />
              {!authenticated && (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  {t.signIn}
                </button>
              )}
            </div>
          </header>

          <main className="flex-1 px-4 sm:px-8 py-6 max-w-6xl w-full mx-auto">
            <AutonomousSelfHealingBoundary scope="HEYUKA_PLATFORM">
              {children}
            </AutonomousSelfHealingBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
