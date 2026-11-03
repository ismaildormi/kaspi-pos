"use client";

import React from "react";
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
} from "lucide-react";

export const NAV_ITEMS = [
  { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
  { name: "Caisse Tactile (POS)", href: "/pos", icon: ShoppingBag },
  { name: "Catalogue Produits", href: "/dashboard/products", icon: Package },
  { name: "Stocks & Mouvements", href: "/dashboard/inventory", icon: Layers },
  { name: "Crédits Clients (Krediat)", href: "/dashboard/customers", icon: Users },
  { name: "Fournisseurs & Achats", href: "/dashboard/suppliers", icon: Building2 },
  { name: "Rapports & Z-Report", href: "/dashboard/reports", icon: FileText },
  { name: "Équipe & Caissiers", href: "/dashboard/staff", icon: Users },
  { name: "Abonnement & Facturation", href: "/dashboard/billing", icon: CreditCard },
  { name: "Paramètres du Magasin", href: "/dashboard/settings", icon: Settings },
  { name: "Aide & Support Direct", href: "/dashboard/support", icon: HelpCircle },
];

interface SidebarProps {
  mobileMenuOpen?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobileMenuOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`${
        mobileMenuOpen ? "block" : "hidden"
      } md:block w-full md:w-64 border-r border-zinc-800 bg-zinc-950 p-4 shrink-0 flex flex-col justify-between`}
    >
      <div className="space-y-6">
        {/* Brand with Transparent Logo */}
        <Link href="/" className="hidden md:flex items-center gap-3 px-2 py-1 group">
          <img
            src="/logo.png"
            alt="KASPI POS"
            className="w-8 h-8 object-contain bg-transparent"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white">
              KASPI POS
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              ERP &amp; Smart Retail
            </span>
          </div>
        </Link>

        {/* Nav Items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname.endsWith("/dashboard")
                : pathname.includes(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="mt-8 space-y-3 pt-4 border-t border-zinc-900">
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-700 transition"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Console Super Admin
          </span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

        <div className="px-2 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
          <span>Offline-First Sync</span>
          <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
