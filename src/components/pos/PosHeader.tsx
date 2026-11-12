"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  LayoutDashboard,
  Wallet,
  Sparkles,
  Maximize2,
  Minimize2,
  Settings,
  Download,
  Bot,
} from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { useAppDictionary } from "@/i18n/schema";

interface PosHeaderProps {
  storeName?: string;
  cashierName?: string;
  ownerAvatarUrl?: string;
  onOpenHeldCarts?: () => void;
  onOpenCashShift?: () => void;
  onOpenIndustryTools?: () => void;
  isShiftOpen?: boolean;
  expectedCash?: number;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  storeName = "Magasin Principal",
  cashierName = "Caissier",
  ownerAvatarUrl,
  onOpenHeldCarts,
  onOpenCashShift,
  onOpenIndustryTools,
  isShiftOpen = false,
  expectedCash = 0,
}) => {
  const { t, locale } = useAppDictionary();
  const { heldCarts } = usePosStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isPlaceholderName = (n?: string | null) =>
    !n ||
    n.trim() === "" ||
    n.trim().toUpperCase() === "KASPI POS" ||
    n.trim() === "كسب POS" ||
    n.trim() === "Magasin Principal";

  const resolveCleanStoreName = (candidate?: string | null): string => {
    if (!isPlaceholderName(candidate)) return candidate!.trim();
    if (!isPlaceholderName(storeName)) return storeName.trim();
    if (!isPlaceholderName(cashierName)) return cashierName.trim();
    return "ASIMA";
  };

  // Store identity resolution matching dashboard/layout.tsx
  const [displayShopName, setDisplayShopName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kaspi_store_name");
      if (!isPlaceholderName(saved)) return saved!.trim();
    }
    return resolveCleanStoreName(storeName);
  });

  const [displayLogo, setDisplayLogo] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kaspi_store_logo");
      if (saved) return saved;
    }
    return ownerAvatarUrl || "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncStoreIdentity = () => {
      const savedName = localStorage.getItem("kaspi_store_name");
      const savedLogo = localStorage.getItem("kaspi_store_logo");
      if (!isPlaceholderName(savedName)) {
        setDisplayShopName(savedName!.trim());
      } else {
        setDisplayShopName(resolveCleanStoreName());
      }
      if (savedLogo) setDisplayLogo(savedLogo);
    };
    syncStoreIdentity();

    fetch("/api/v1/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isPlaceholderName(data?.settings?.shopName)) {
          setDisplayShopName(data.settings.shopName.trim());
          localStorage.setItem("kaspi_store_name", data.settings.shopName.trim());
        } else {
          setDisplayShopName(resolveCleanStoreName());
        }
        if (data?.settings?.logoUrl) {
          setDisplayLogo(data.settings.logoUrl);
          localStorage.setItem("kaspi_store_logo", data.settings.logoUrl);
        }
      })
      .catch(() => {});

    const handleProfileUpdate = (e: any) => {
      if (!isPlaceholderName(e.detail?.shopName)) {
        setDisplayShopName(e.detail.shopName.trim());
      }
      if (e.detail?.logoUrl !== undefined) setDisplayLogo(e.detail.logoUrl);
    };

    window.addEventListener("kaspi_store_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("kaspi_store_profile_updated", handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleKioskFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header
      dir="ltr"
      className="h-14 bg-[#09090B] border-b border-white/[0.08] px-3 sm:px-4 flex items-center justify-between gap-2 select-none shrink-0"
    >
      {/* LEFT: Branding & Workspace Link */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg kaspi-frosted-glass hover:bg-white/[0.08] text-zinc-300 hover:text-white transition group border border-white/10 hover:border-white/20"
          title={t.nav.dashboard}
        >
          <LayoutDashboard className="w-4 h-4 text-zinc-400 group-hover:text-white" />
          <span className="hidden sm:inline text-xs font-semibold">{t.nav.dashboard}</span>
        </Link>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/logo.png"
            alt="KASPI POS"
            className="w-8 h-8 rounded-xl object-cover shrink-0 transition-transform hover:scale-105"
          />
          <span className="font-extrabold text-xs tracking-tight text-white hidden md:inline shrink-0">
            KASPI POS
          </span>
        </div>
      </div>

      {/* CENTER: Minimal Industry Tools Action if Available */}
      <div className="flex items-center gap-2">
        {onOpenIndustryTools && (
          <button
            type="button"
            onClick={onOpenIndustryTools}
            className="group h-8 px-3 rounded-lg kaspi-frosted-glass border border-white/10 hover:border-white/20 text-zinc-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            title="KDS / Tables / Tailles / Balance / IMEI"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
            <span>{t.topbar.tools}</span>
          </button>
        )}
      </div>

      {/* RIGHT: Clean Action Pills */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Cash Drawer Shift Pill */}
        {onOpenCashShift && (
          <button
            type="button"
            onClick={onOpenCashShift}
            className={`group inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isShiftOpen
                ? "kaspi-frosted-glass border-white/20 hover:border-white/30 text-zinc-100 hover:text-white"
                : "kaspi-frosted-glass border-white/10 hover:border-white/20 text-zinc-400 hover:text-white"
            }`}
            title="Fond de Caisse / Rapport X & Z"
          >
            <Wallet className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:-translate-y-0.5 transition-all duration-200" />
            <span className="hidden md:inline font-mono">
              {isShiftOpen ? `${expectedCash.toFixed(0)} ${t.common.currency}` : t.topbar.openRegister}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isShiftOpen ? "bg-emerald-400" : "bg-zinc-500"
              }`}
            />
          </button>
        )}

        {/* Held Carts Pill */}
        {heldCarts.length > 0 && (
          <button
            type="button"
            onClick={onOpenHeldCarts}
            className="group inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg kaspi-frosted-glass hover:bg-white/[0.1] text-white border border-white/15 hover:border-white/25 text-xs font-semibold transition-all cursor-pointer"
            title={t.pos.heldOrders}
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-mono">{heldCarts.length}</span>
          </button>
        )}

        {/* Sync Status */}
        <SyncStatusBadge />

        {/* AI Assistant Docked Trigger */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-ai-chat"));
          }}
          className="group inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 hover:border-white/25 kaspi-frosted-glass hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="KASPI AI Assistant"
        >
          <Bot className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
        </button>

        {/* Desktop App Link */}
        <Link
          href={`/${locale}/download`}
          className="group hidden xl:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/10 hover:border-white/25 kaspi-frosted-glass hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition-all"
          title="Application Desktop"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-y-0.5 transition-all duration-200" />
          <span>{t.topbar.desktopApp}</span>
        </Link>

        {/* Store Settings Link */}
        <Link
          href={`/${locale}/dashboard/settings`}
          className="group inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 hover:border-white/25 kaspi-frosted-glass hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all"
          title={t.topbar.settings}
        >
          <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500 ease-out" />
        </Link>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Store Profile Button with Crisp Circular Avatar & Store Name */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-owner-vault"));
          }}
          className="inline-flex items-center gap-2 h-8 px-2.5 rounded-lg border border-white/10 hover:border-white/25 kaspi-frosted-glass hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
          title={locale === "ar" ? "خزنة المالك والملف الشخصي" : "Profil Propriétaire & Coffre-Fort"}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/25 bg-zinc-800 shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt={displayShopName}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span>{displayShopName.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <span className="hidden sm:inline truncate max-w-[120px] font-bold text-white">
            {displayShopName}
          </span>
        </button>

        {/* Fullscreen Kiosk Toggle */}
        <button
          type="button"
          onClick={toggleKioskFullscreen}
          className={`group inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs transition-all cursor-pointer ${
            isFullscreen
              ? "bg-white text-black border-white"
              : "border-white/10 kaspi-frosted-glass text-zinc-400 hover:text-white hover:border-white/25"
          }`}
          title="Kiosk Mode"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
          )}
        </button>
      </div>
    </header>
  );
};
