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
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
  Crown,
} from "lucide-react";

export const BASE_NAV_ITEMS = [
  { name: "Caisse / POS", href: "/pos", icon: ShoppingBag, badge: "Caisse" },
  { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
  { name: "Produits", href: "/dashboard/products", icon: Package },
  { name: "Stocks & Mouvements", href: "/dashboard/inventory", icon: Layers },
  { name: "Clients / Krediat", href: "/dashboard/customers", icon: Users },
  { name: "Fournisseurs & Achats", href: "/dashboard/suppliers", icon: Building2 },
  { name: "Rapports", href: "/dashboard/reports", icon: FileText },
  { name: "Abonnement", href: "/dashboard/billing", icon: CreditCard },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
  { name: "Aide & Support", href: "/dashboard/support", icon: HelpCircle },
];

interface SidebarProps {
  mobileMenuOpen?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobileMenuOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [shopName, setShopName] = useState<string>("Magasin");

  // Determine current locale from pathname (e.g., /ar, /fr, /en)
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
        if (data?.data?.currentTenant?.displayName) {
          setShopName(data.data.currentTenant.displayName);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside
      className={`${
        mobileMenuOpen ? "block" : "hidden"
      } md:block w-full md:w-64 border-r border-zinc-800 bg-zinc-950 p-4 shrink-0 flex flex-col justify-between`}
    >
      <div className="space-y-6">
        {/* Brand with Transparent Logo */}
        <Link
          href={localizeHref("/dashboard")}
          className="hidden md:flex items-center gap-3 px-2 py-1 group"
        >
          <img
            src="/logo.png"
            alt="KASPI POS"
            className="w-8 h-8 object-contain bg-transparent"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              KASPI POS
              <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono px-1.5 py-0.2 rounded">
                v2.0
              </span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[140px]">
              {shopName}
            </span>
          </div>
        </Link>

        {/* Nav Items */}
        <nav className="space-y-1">
          {/* Super Admin Exclusive Button */}
          {isSuperAdmin && (
            <Link
              href={localizeHref("/admin")}
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition mb-3 border ${
                pathname.includes("/admin")
                  ? "bg-white text-black border-white shadow-lg"
                  : "bg-zinc-900/80 text-white border-zinc-700/80 hover:bg-zinc-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Crown className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Owner Studio</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-black/40 text-zinc-300">
                Super Admin
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
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && item.href === "/pos" && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isActive
                        ? "bg-black text-white"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="mt-8 space-y-3 pt-4 border-t border-zinc-900">
        {isSuperAdmin && !pathname.includes("/admin") && (
          <Link
            href={localizeHref("/admin")}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-white" />
              Console Super Admin
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
          </Link>
        )}

        <div className="px-2 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
          <span>KASPI Offline Sync</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
