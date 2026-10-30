"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Sparkles,
  Menu,
  X,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
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
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="Kasbi POS"
              width={26}
              height={26}
              style={{ width: 26, height: 26, objectFit: "contain" }}
              className="h-6 w-6 object-contain"
            />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">Kasbi POS</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 border-r border-zinc-800 bg-zinc-950 p-4 shrink-0 flex flex-col justify-between`}
      >
        <div className="space-y-6">
          {/* Logo brand */}
          <Link href="/" className="hidden md:flex items-center gap-3 px-2 py-1 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-1 transition group-hover:border-zinc-700">
              <Image src="/logo.png" alt="Kasbi POS" width={36} height={36} className="h-full w-full object-contain" priority />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white">Kasbi POS</span>
              <span className="text-[10px] text-zinc-500 font-mono">ERP & Smart Retail</span>
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
                  onClick={() => setMobileMenuOpen(false)}
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
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
