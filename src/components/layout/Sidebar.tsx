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

  const isPlaceholderName = (n?: string | null) =>
    !n ||
    n.trim() === "" ||
    n.trim().toUpperCase() === "KASPI POS" ||
    n.trim() === "كسب POS" ||
    n.trim() === "Magasin Principal";

  const [shopName, setShopName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kaspi_store_name");
      if (saved && !isPlaceholderName(saved)) return saved.trim();
    }
    return tenantInfo?.shopName && !isPlaceholderName(tenantInfo.shopName)
      ? tenantInfo.shopName.trim()
      : "ASIMA";
  });

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
        if (data?.settings?.shopName && !isPlaceholderName(data.settings.shopName)) {
          setShopName(data.settings.shopName.trim());
        }
      })
      .catch(() => {});

    const handleProfileUpdate = (e: any) => {
      if (e.detail?.logoUrl !== undefined) setOwnerAvatarUrl(e.detail.logoUrl);
      if (e.detail?.shopName && !isPlaceholderName(e.detail.shopName)) {
        setShopName(e.detail.shopName.trim());
      }
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

  return (
    <aside
      dir="ltr"
      style={{
        background: "linear-gradient(165deg, #232A31 0%, #171C22 40%, #101419 100%)",
        borderRight: "1px solid rgba(255, 255, 255, 0.18)",
        boxShadow:
          "inset -1px 0 0 0 rgba(255, 255, 255, 0.12), 14px 0 40px -10px rgba(0, 0, 0, 0.8)",
      }}
      className={`${
        mobileMenuOpen ? "block" : "hidden"
      } md:flex w-full md:w-60 p-3 shrink-0 flex-col justify-between select-none relative overflow-hidden`}
    >
      {/* 2 Translucent Curved Silver-White Light Layers (Layer A & Layer B) */}
      <div className="pointer-events-none absolute -right-12 top-16 w-48 h-[420px] rounded-full bg-gradient-to-b from-white/[0.14] via-white/[0.06] to-transparent blur-2xl rotate-[-12deg] z-0" />
      <div className="pointer-events-none absolute -right-8 bottom-10 w-40 h-64 rounded-full bg-gradient-to-t from-white/[0.12] via-[#2DD4BF]/[0.05] to-transparent blur-xl rotate-[15deg] z-0" />

      <nav className="space-y-1 relative z-10">
        {/* Supermarket Mode (495nm) Luminous Frosted Mint-Teal Glass Pill */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-industry-modal"));
          }}
          className="w-full rounded-xl px-3.5 py-2.5 bg-gradient-to-r from-[#5EEAD4]/90 via-[#2DD4BF]/85 to-[#14B8A6]/90 text-[#042F2E] font-extrabold text-xs border border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_0_24px_rgba(45,212,191,0.35)] flex items-center justify-between cursor-pointer transition-all hover:brightness-105 mb-3"
          title={
            locale === "ar"
              ? "تغيير قطاع ونشاط المتجر"
              : locale === "en"
              ? "Change store sector / industry"
              : "Modifier le secteur du magasin"
          }
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs font-black text-[#042F2E] truncate tracking-tight">
              {sectorBadgeInfo.label}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#042F2E] shrink-0 shadow-[0_0_6px_rgba(4,47,46,0.6)] animate-pulse" />
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
              className={`group transition-all duration-200 ${
                isActive
                  ? "relative rounded-xl px-3.5 py-2.5 bg-gradient-to-r from-[#2DD4BF]/25 via-white/[0.12] to-white/[0.03] border border-white/[0.16] text-[#2DD4BF] font-bold text-xs flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r-full before:bg-[#2DD4BF] before:shadow-[0_0_12px_#2DD4BF]"
                  : "flex items-center justify-between rounded-xl px-3.5 py-2 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-white font-medium"
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

      <div className="mt-auto pt-3 border-t border-white/10 px-1 space-y-2 relative z-10">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-owner-vault"));
          }}
          className="group w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 hover:border-white/25 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
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
              {shopName}
            </span>
          </div>
          <Lock className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
        </button>

        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-ai-chat"));
          }}
          className="group w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 hover:border-white/25 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
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
