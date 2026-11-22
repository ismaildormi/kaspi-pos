"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Coins,
  HelpCircle,
  KeyRound,
  Menu,
  MessageSquare,
  ReceiptText,
  Tag,
  User,
  Wallet,
  X,
} from "lucide-react";
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
  | "faq"
  | "contact"
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
  | "apps"
  | "studio";

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
    freeTier: string;
    billingStats: string;
    docs: string;
    faq: string;
    pricing: string;
    chatFree: string;
    guestLabel: string;
    authTitle: string;
    authDesc: string;
  }
> = {
  ar: {
    bannerText:
      "تم تحديث HEYUKA Omni و HEYUKA Core لدعم البحث الحي على الويب والتفكير العميق ومفاتيح API المجانية 100%.",
    bannerLink: "التفاصيل",
    usage: "Usage",
    apiKeys: "API keys",
    freeTier: "Free Tier ($0)",
    billingStats: "Stats & Billing",
    docs: "Docs",
    faq: "Help & Feedback",
    pricing: "Pricing",
    chatFree: "Chat for free",
    guestLabel: "Sign in (Gmail)",
    authTitle: "الدخول إلى منصة HEYUKA عبر Gmail",
    authDesc: "ادخل ببريد Gmail للحصول على مفاتيح API خاصة ومجانية.",
  },
  fr: {
    bannerText:
      "HEYUKA Omni mis à jour avec DeepThink, recherche web en direct et clés API souveraines couvertes à 100%.",
    bannerLink: "Voir détails",
    usage: "Usage",
    apiKeys: "API keys",
    freeTier: "Free Tier ($0)",
    billingStats: "Stats & Billing",
    docs: "Docs",
    faq: "Help & Feedback",
    pricing: "Pricing",
    chatFree: "Chat for free",
    guestLabel: "Connexion Gmail",
    authTitle: "Accéder à HEYUKA Platform",
    authDesc: "Connectez votre Gmail pour créer vos clés API uniques ($0.00).",
  },
  en: {
    bannerText:
      "HEYUKA V4.1 Omni is live with enhanced coding, live web search, and $0.00 Sovereign API keys covered 100% by KASPI.",
    bannerLink: "Click for details.",
    usage: "Usage",
    apiKeys: "API keys",
    freeTier: "Free Quota",
    billingStats: "Billing & Stats",
    docs: "Docs",
    faq: "Help & Feedback",
    pricing: "Pricing",
    chatFree: "Chat for free",
    guestLabel: "Sign in (Gmail)",
    authTitle: "Sign in to HEYUKA Platform",
    authDesc: "Continue with Gmail to generate cryptographic API keys at $0.00.",
  },
};

export function HEYUKAPlatformShell({
  activeNav,
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
  const [bannerVisible, setBannerVisible] = useState(false);
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
      aliases: ["overview", "usage", "stats"] as PlatformNavId[],
      href: `/${locale}/zebra-x`,
      label: t.usage,
      icon: BarChart3,
    },
    {
      id: "api-keys" as const,
      aliases: ["api-keys", "vault", "debug"] as PlatformNavId[],
      href: `/${locale}/zebra-x/api-keys`,
      label: t.apiKeys,
      icon: KeyRound,
    },
    {
      id: "quota" as const,
      aliases: ["quota", "models", "playground"] as PlatformNavId[],
      href: `/${locale}/zebra-x/quota`,
      label: t.freeTier,
      icon: Wallet,
    },
    {
      id: "billing" as const,
      aliases: ["products", "workers", "apps", "studios", "lab"] as PlatformNavId[],
      href: `/${locale}/zebra-x/billing`,
      label: t.billingStats,
      icon: ReceiptText,
    },
  ];

  const secondaryNav = [
    {
      id: "studio" as const,
      href: `/${locale}/studio`,
      label: "HEYUKA AI Studio",
      icon: MessageSquare,
      external: false,
    },
    {
      id: "docs" as const,
      href: `/${locale}/zebra-x/docs`,
      label: t.docs,
      icon: BookOpen,
      external: true,
    },
    {
      id: "faq" as const,
      href: `/${locale}/zebra-x/contact`,
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
      id: "chat" as const,
      href: `/${locale}/chat`,
      label: t.chatFree,
      icon: MessageSquare,
      external: false,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between py-4 px-3 select-none">
      <div className="space-y-6">
        {/* Exact DeepSeek Platform Header: heyuka [Platform] */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link
            href={`/${locale}/zebra-x`}
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <HeyukaLoopMark size="md" variant="crimson" />
            <div className="flex items-center gap-1.5">
              <span className="text-[20px] font-extrabold tracking-tight text-[var(--kaspi-text-primary)] lowercase">
                heyuka
              </span>
              <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[var(--kaspi-text-primary)] text-[var(--kaspi-bg)] leading-none">
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

        {/* Exact Top Group */}
        <nav className="space-y-0.5">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = item.aliases.includes(activeNav);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                  active
                    ? "bg-white/[0.11] text-[var(--kaspi-text-primary)] font-semibold"
                    : "text-[var(--kaspi-text-secondary)] hover:bg-white/[0.06] hover:text-[var(--kaspi-text-primary)] font-medium"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? "text-[#007ACC]" : "text-[var(--kaspi-text-muted)]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Secondary Group */}
        <nav className="space-y-0.5 pt-2">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                  active
                    ? "bg-white/[0.11] text-[var(--kaspi-text-primary)] font-semibold"
                    : "text-[var(--kaspi-text-secondary)] hover:bg-white/[0.06] hover:text-[var(--kaspi-text-primary)] font-medium"
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 text-[var(--kaspi-text-muted)]" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.external && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--kaspi-text-muted)] shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Slot matching Screenshot 1 & 4 */}
      <div className="pt-3">
        {authenticated ? (
          <Link
            href={`/${locale}/zebra-x/profile`}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
              activeNav === "profile"
                ? "border border-white/40 bg-white/[0.07]"
                : "hover:bg-white/[0.06]"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-xs font-bold text-[#007ACC] shrink-0 uppercase">
              {(displayName || userEmail || "H").slice(0, 1)}
            </div>
            <span className="text-[13px] font-medium text-[var(--kaspi-text-primary)] truncate">
              {displayName || userEmail?.split("@")[0] || "Account"}
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-[13px] font-medium text-[var(--kaspi-text-primary)] cursor-pointer transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#007ACC] shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">{t.guestLabel}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col bg-[#101010] text-[#F7EAEA] selection:bg-[#007ACC] selection:text-white"
    >
      {/* Top Announcement Strip (Disabled by default for calm Antigravity minimalism) */}
      {bannerVisible && (
        <div className="relative bg-[#161618] border-b border-white/[0.08] text-zinc-200 px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2 z-30">
          <span className="truncate max-w-4xl">
            {t.bannerText}{" "}
            <Link
              href={`/${locale}/zebra-x/docs`}
              className="underline underline-offset-2 font-semibold text-[#007ACC] hover:text-zinc-100"
            >
              {t.bannerLink}
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            className={`p-1 rounded hover:bg-white/15 cursor-pointer ${
              isRtl ? "mr-auto sm:absolute sm:left-3" : "ml-auto sm:absolute sm:right-3"
            }`}
            aria-label="Close banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Clean Left Sidebar (220px matte obsidian matching Screenshot 1/2/4) */}
        <aside
          className={`hidden lg:flex w-[220px] shrink-0 flex-col bg-[#111215] border-white/[0.07] ${
            isRtl ? "border-l" : "border-r"
          }`}
        >
          {sidebarContent}
        </aside>

        {/* Mobile Nav Toggle */}
        <div className="lg:hidden fixed top-12 left-3 z-30">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-[#1C1D22] border border-white/10 text-zinc-100 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Drawer Modal */}
        <KaspiGlassModalPortal
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="w-full max-w-sm max-h-[82vh] overflow-y-auto rounded-2xl kaspi-opaque-glass-modal p-2">
            {sidebarContent}
          </div>
        </KaspiGlassModalPortal>

        {/* Gmail Auth Modal */}
        <KaspiGlassModalPortal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="w-full max-w-md rounded-2xl kaspi-opaque-glass-modal p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <HeyukaLoopMark size="sm" variant="crimson" />
                <div>
                  <h2 className="text-base font-bold text-zinc-100">{t.authTitle}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.authDesc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 cursor-pointer"
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

        {/* Main Clean Content Area (NO top header clutter — exact DeepSeek Platform!) */}
        <main className="flex-1 min-w-0 px-6 sm:px-12 py-8 max-w-5xl">
          <AutonomousSelfHealingBoundary scope="HEYUKA_PLATFORM">
            {children}
          </AutonomousSelfHealingBoundary>
        </main>
      </div>
    </div>
  );
}
