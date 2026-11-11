"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Building2,
  FileText,
  CreditCard,
  Settings,
  HelpCircle,
  Crown,
  Bot,
  Sparkles,
  ChefHat,
  ShoppingBasket,
  UtensilsCrossed,
  Shirt,
  Smartphone,
  Beef,
  Croissant,
  Boxes,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useAppDictionary } from "@/i18n/schema";
import { usePosStore } from "@/client/store/usePosStore";

interface SidebarProps {
  mobileMenuOpen?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobileMenuOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t, locale } = useAppDictionary();
  const { storeType } = usePosStore();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const localizeHref = (path: string) => {
    return `/${locale}${path}`;
  };

  useEffect(() => {
    fetch("/api/v1/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.user?.isSuperAdmin) {
          setIsSuperAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  const sectorBadgeInfo = React.useMemo(() => {
    switch (storeType) {
      case "restaurant":
        return {
          label: locale === "ar" ? "وضع المطعم والمقهى" : locale === "en" ? "Restaurant & Café Mode" : "Mode Restaurant & Café",
          icon: UtensilsCrossed,
        };
      case "butchery":
        return {
          label: locale === "ar" ? "وضع المجزرة واللحوم" : locale === "en" ? "Butchery & Meats Mode" : "Mode Boucherie & Viandes",
          icon: Beef,
        };
      case "bakery":
        return {
          label: locale === "ar" ? "وضع المخبزة والحلويات" : locale === "en" ? "Bakery & Pastry Mode" : "Mode Boulangerie & Pâtisserie",
          icon: Croissant,
        };
      case "fashion":
        return {
          label: locale === "ar" ? "وضع الملابس والأزياء" : locale === "en" ? "Fashion & Apparel Mode" : "Mode Prêt-à-Porter",
          icon: Shirt,
        };
      case "electronics":
      case "tech":
        return {
          label: locale === "ar" ? "وضع الإلكترونيات والتقنية" : locale === "en" ? "Tech & Electronics Mode" : "Mode Électronique & Tech",
          icon: Smartphone,
        };
      case "wholesale":
        return {
          label: locale === "ar" ? "وضع الجملة والتوزيع" : locale === "en" ? "Wholesale & Distribution Mode" : "Mode Grossiste & Distribution",
          icon: Boxes,
        };
      case "grocery":
      default:
        return {
          label: locale === "ar" ? "وضع البقالة والسوبرماركت" : locale === "en" ? "Grocery & Supermarket Mode" : "Mode Épicerie & Supermarché",
          icon: ShoppingBasket,
        };
    }
  }, [storeType, locale]);

  const navItems = [
    { name: t.nav.posRegister, href: "/pos", icon: ShoppingBag, badge: t.nav.liveBadge },
    ...(storeType === "restaurant"
      ? [
          {
            name: locale === "ar" ? "شاشة المطبخ (KDS)" : locale === "en" ? "Kitchen Display (KDS)" : "Écran Cuisine (KDS)",
            href: "/dashboard/restaurant/kds",
            icon: ChefHat,
            badge: "KDS",
          },
        ]
      : []),
    { name: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: t.nav.products, href: "/dashboard/products", icon: Package },
    { name: t.nav.inventory, href: "/dashboard/inventory", icon: Layers },
    { name: t.nav.customers, href: "/dashboard/customers", icon: Users },
    { name: t.nav.suppliers, href: "/dashboard/suppliers", icon: Building2 },
    { name: t.nav.reports, href: "/dashboard/reports", icon: FileText },
    { name: t.nav.billing, href: "/dashboard/billing", icon: CreditCard },
    { name: t.nav.settings, href: "/dashboard/settings", icon: Settings },
    { name: t.nav.support, href: "/dashboard/support", icon: HelpCircle },
  ];

  const SectorIcon = sectorBadgeInfo.icon;

  return (
    <aside
      dir="ltr"
      className={`${
        mobileMenuOpen ? "block" : "hidden"
      } md:flex w-full md:w-60 border-r border-white/10 bg-zinc-950/60 p-3 shrink-0 flex-col justify-between select-none`}
    >
      <nav className="space-y-1">
        {/* Active Sector Mode Indicator Badge */}
        <div className="mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-white/15 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_15px_rgba(255,255,255,0.04)] group hover:border-white/30 transition-all duration-300">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative w-7 h-7 rounded-xl bg-zinc-800 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 group-hover:border-white/40 transition-all duration-300">
              <SectorIcon className="w-4 h-4 text-white" />
              <div className="absolute -inset-0.5 rounded-xl bg-white/10 blur-xs -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-white truncate tracking-tight">
                {sectorBadgeInfo.label}
              </span>
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                {locale === "ar" ? "نشط ومهيأ" : locale === "en" ? "Active Mode" : "Mode Actif"}
              </span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
        </div>
        {isSuperAdmin && (
          <Link
            href={localizeHref("/admin")}
            prefetch={true}
            onClick={onNavigate}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition mb-2 border ${
              pathname.includes("/admin")
                ? "bg-white text-black border-white"
                : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{t.nav.ownerStudio}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-black/40 text-amber-200">
              Admin
            </span>
          </Link>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const targetHref = localizeHref(item.href);
          const isActive =
            item.href === "/dashboard"
              ? pathname.endsWith("/dashboard") ||
                pathname.endsWith(`/${locale}/dashboard`)
              : pathname.includes(item.href);

          const iconAnimationClass =
            item.href === "/dashboard/settings"
              ? "group-hover:rotate-90 transition-transform duration-500 ease-out"
              : item.href === "/pos"
              ? "group-hover:-translate-y-0.5 group-hover:scale-105 transition-transform duration-200"
              : "group-hover:scale-110 transition-transform duration-200";

          return (
            <Link
              key={item.href}
              href={targetHref}
              prefetch={true}
              onClick={onNavigate}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                isActive
                  ? "bg-white text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${iconAnimationClass}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isActive
                      ? "bg-zinc-950 text-white"
                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-3 border-t border-white/10 px-1 space-y-2">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-owner-vault"));
          }}
          className="group w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-white/10 hover:border-white/25 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
          title={locale === "ar" ? "خزنة المالك المحمية" : locale === "en" ? "Protected Owner Vault" : "Coffre-Fort Propriétaire"}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
            <span>{locale === "ar" ? "خزنة المالك" : locale === "en" ? "Owner Vault" : "Coffre Propriétaire"}</span>
          </div>
          <Lock className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-ai-chat"));
          }}
          className="group w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-white/10 hover:border-white/25 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="KASPI AI Assistant"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
            <span>KASPI AI</span>
          </div>
          <Sparkles className="w-3 h-3 text-zinc-500 group-hover:text-white group-hover:rotate-12 transition-transform duration-300" />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
