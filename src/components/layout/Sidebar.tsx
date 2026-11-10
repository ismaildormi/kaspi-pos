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
} from "lucide-react";
import { useAppDictionary } from "@/i18n/schema";

interface SidebarProps {
  mobileMenuOpen?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobileMenuOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t, locale } = useAppDictionary();
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

  const navItems = [
    { name: t.nav.posRegister, href: "/pos", icon: ShoppingBag, badge: t.nav.liveBadge },
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
      className={`${
        mobileMenuOpen ? "block" : "hidden"
      } md:flex w-full md:w-60 border-r border-white/10 bg-zinc-950/60 p-3 shrink-0 flex-col justify-between select-none`}
    >
      <nav className="space-y-1">
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

      <div className="mt-auto pt-4 border-t border-white/10 px-1">
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
