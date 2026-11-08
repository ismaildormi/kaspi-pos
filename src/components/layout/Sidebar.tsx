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
} from "lucide-react";

export const BASE_NAV_ITEMS = [
  { name: "Caisse POS", href: "/pos", icon: ShoppingBag, badge: "Live" },
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Catalogue Produits", href: "/dashboard/products", icon: Package },
  { name: "Stocks & Audit", href: "/dashboard/inventory", icon: Layers },
  { name: "Clients & Krediat", href: "/dashboard/customers", icon: Users },
  { name: "Fournisseurs", href: "/dashboard/suppliers", icon: Building2 },
  { name: "Rapports & Clôtures", href: "/dashboard/reports", icon: FileText },
  { name: "Facturation", href: "/dashboard/billing", icon: CreditCard },
  { name: "Paramètres & Clés API", href: "/dashboard/settings", icon: Settings },
  { name: "Support", href: "/dashboard/support", icon: HelpCircle },
];

interface SidebarProps {
  mobileMenuOpen?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobileMenuOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const currentLocale =
    segments[0] === "ar" || segments[0] === "fr" || segments[0] === "en"
      ? segments[0]
      : "";

  const localizeHref = (path: string) => {
    if (!currentLocale) return path;
    return `/${currentLocale}${path}`;
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

  return (
    <aside
      className={`${
        mobileMenuOpen ? "block" : "hidden"
      } md:flex w-full md:w-60 border-e border-white/10 bg-zinc-950/60 p-3 shrink-0 flex-col justify-between select-none`}
    >
      <nav className="space-y-1">
        {isSuperAdmin && (
          <Link
            href={localizeHref("/admin")}
            onClick={onNavigate}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition mb-2 border ${
              pathname.includes("/admin")
                ? "bg-white text-black border-white"
                : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Owner Studio</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-black/40 text-amber-200">
              Admin
            </span>
          </Link>
        )}

        {BASE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const targetHref = localizeHref(item.href);
          const isActive =
            item.href === "/dashboard"
              ? pathname.endsWith("/dashboard") ||
                pathname.endsWith(`/${currentLocale}/dashboard`)
              : pathname.includes(item.href);

          return (
            <Link
              key={item.href}
              href={targetHref}
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                isActive
                  ? "bg-white text-zinc-950 font-semibold shadow-xs"
                  : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-3.5 w-3.5 shrink-0" />
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

      <div className="mt-6 pt-3 border-t border-white/10 px-2 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <span>Dexie Offline Engine</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Ready
        </span>
      </div>
    </aside>
  );
}

export default Sidebar;
