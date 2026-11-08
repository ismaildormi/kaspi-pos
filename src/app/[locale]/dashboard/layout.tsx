"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ShoppingBag,
  Download,
  Settings,
  User as UserIcon,
  ShoppingBasket,
  UtensilsCrossed,
  Shirt,
  Smartphone,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { usePosStore, type StoreBusinessType } from "@/client/store/usePosStore";
import { getApiUrl } from "@/client/sync-engine";

const VERTICAL_MODES: Array<{
  id: StoreBusinessType;
  labelFr: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "grocery", labelFr: "Épicerie", labelAr: "بقالة", icon: ShoppingBasket },
  { id: "restaurant", labelFr: "Restaurant", labelAr: "مطعم", icon: UtensilsCrossed },
  { id: "fashion", labelFr: "Mode", labelAr: "أزياء", icon: Shirt },
  { id: "electronics", labelFr: "Tech", labelAr: "إلكترونيات", icon: Smartphone },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>("Compte Actif");
  const [shopName, setShopName] = useState<string>("KASPI POS");
  const { storeType, setStoreProfile } = usePosStore();

  const segments = pathname.split("/").filter(Boolean);
  const currentLocale =
    segments[0] === "ar" || segments[0] === "fr" || segments[0] === "en"
      ? segments[0]
      : "fr";
  const isRtl = currentLocale === "ar";

  const localizeHref = (path: string) => `/${currentLocale}${path}`;

  useEffect(() => {
    Promise.all([
      fetch(getApiUrl("/api/v1/me")).then((r) => (r.ok ? r.json() : null)),
      fetch(getApiUrl("/api/v1/settings")).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([meData, settingsData]) => {
        if (meData?.data?.user?.fullName || meData?.data?.user?.email) {
          setUserName(
            meData.data.user.fullName ||
              meData.data.user.email.split("@")[0]
          );
        }
        if (
          settingsData?.settings?.shopName ||
          meData?.data?.currentTenant?.displayName
        ) {
          setShopName(
            settingsData?.settings?.shopName ||
              meData?.data?.currentTenant?.displayName
          );
        }
        if (settingsData?.settings?.storeType) {
          setStoreProfile(
            settingsData.settings.storeType,
            Boolean(settingsData.settings.onboardingCompleted)
          );
        }
      })
      .catch(() => {});
  }, [setStoreProfile]);

  const handleSwitchVertical = async (nextType: StoreBusinessType) => {
    setStoreProfile(nextType, true);
    try {
      await fetch(getApiUrl("/api/v1/onboarding/setup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeType: nextType,
          shopName,
          seedStarterCatalog: false,
        }),
      });
    } catch {}
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Unified Glassmorphic Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-14 backdrop-blur-xl bg-zinc-950/85 border-b border-white/10 px-4 flex items-center justify-between gap-4 select-none">
        {/* Left: Brand Identity & Mobile Menu Button */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link
            href={localizeHref("/dashboard")}
            className="flex items-center gap-2.5 min-w-0"
          >
            <img
              src="/logo.png"
              alt="KASPI POS"
              className="w-6 h-6 object-contain rounded-md shrink-0"
            />
            <span className="font-extrabold text-sm tracking-tight text-white shrink-0">
              KASPI POS
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/10 truncate max-w-[160px]">
              {shopName}
            </span>
          </Link>
        </div>

        {/* Center: Core Workspace Vertical Modes */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-zinc-900/90 border border-white/10">
          {VERTICAL_MODES.map((mode) => {
            const Icon = mode.icon;
            const active = storeType === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSwitchVertical(mode.id)}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  active
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isRtl ? mode.labelAr : mode.labelFr}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Action Pills (POS Launch, Language, Desktop App, Settings, Session Profile) */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={localizeHref("/pos")}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold transition shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isRtl ? "نقطة البيع POS" : "Caisse POS"}</span>
          </Link>

          <Link
            href={localizeHref("/download")}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden xl:inline">Desktop</span>
          </Link>

          <LanguageSwitcher />

          <Link
            href={localizeHref("/dashboard/settings")}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
            title={isRtl ? "الإعدادات" : "Paramètres"}
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>

          <Link
            href={localizeHref("/dashboard/settings")}
            className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-200 transition"
          >
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[110px]">{userName}</span>
          </Link>
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          onNavigate={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
