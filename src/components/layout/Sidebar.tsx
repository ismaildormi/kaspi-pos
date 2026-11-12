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
  const { storeType, tenantInfo } = usePosStore();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [ownerAvatarUrl, setOwnerAvatarUrl] = useState<string>("");

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

    fetch("/api/v1/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings?.logoUrl) setOwnerAvatarUrl(data.settings.logoUrl);
      })
      .catch(() => {});

    const handleProfileUpdate = (e: any) => {
      if (e.detail?.logoUrl !== undefined) setOwnerAvatarUrl(e.detail.logoUrl);
    };
    window.addEventListener("kaspi_store_profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("kaspi_store_profile_updated", handleProfileUpdate);
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
          label: "Supermarket Mode (495nm)",
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
      style={{
        background:
          "linear-gradient(165deg, rgba(255, 255, 255, 0.07) 0%, rgba(20, 26, 33, 0.78) 45%, rgba(10, 14, 18, 0.92) 100%)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
      }}
      className={`${
        mobileMenuOpen ? "block" : "hidden"
      } md:flex w-full md:w-60 border-r border-white/[0.08] p-3 shrink-0 flex-col justify-between select-none shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]`}
    >
      <nav className="space-y-1">
        {/* Supermarket Mode (495nm) Frosted Teal Pill - Interactive */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-industry-modal"));
          }}
          className="w-full text-left mb-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#14B8A6]/25 to-[#2DD4BF]/15 border border-[#2DD4BF]/40 flex items-center justify-between shadow-[0_0_20px_rgba(20,184,166,0.2)] group hover:border-[#2DD4BF]/70 hover:from-[#14B8A6]/35 transition-all duration-300 cursor-pointer"
          title={
            locale === "ar"
              ? "تغيير قطاع ونشاط المتجر"
              : locale === "en"
              ? "Change store sector / industry"
              : "Modifier le secteur du magasin"
          }
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs font-semibold text-[#5EEAD4] truncate tracking-tight">
              {sectorBadgeInfo.label}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#2DD4BF] shrink-0 shadow-[0_0_8px_rgba(45,212,191,0.85)] animate-pulse" />
        </button>
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
              className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs transition duration-200 ${
                isActive
                  ? "bg-white/[0.08] text-[#2DD4BF] font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-[#2DD4BF] before:shadow-[0_0_10px_#2DD4BF]"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform ${iconAnimationClass} ${
                    isActive ? "text-[#2DD4BF]" : "text-zinc-400 group-hover:text-white"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isActive
                      ? "bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/40"
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
            <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-zinc-800 shrink-0 flex items-center justify-center">
              {ownerAvatarUrl ? (
                <img src={ownerAvatarUrl} alt="Vault" className="w-full h-full object-cover rounded-full" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-all" />
              )}
            </div>
            <span className="truncate max-w-[140px] font-bold">
              {tenantInfo?.shopName || (locale === "ar" ? "خزنة المالك" : locale === "en" ? "Owner Vault" : "Coffre Propriétaire")}
            </span>
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
