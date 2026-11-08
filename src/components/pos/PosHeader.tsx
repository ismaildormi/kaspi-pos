"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Clock,
  User as UserIcon,
  LayoutDashboard,
  Wallet,
  Sparkles,
  Maximize2,
  Minimize2,
  Settings,
  Download,
  ShoppingBasket,
  UtensilsCrossed,
  Shirt,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { usePosStore, type StoreBusinessType } from "@/client/store/usePosStore";
import { getApiUrl } from "@/client/sync-engine";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SyncStatusBadge } from "./SyncStatusBadge";

interface PosHeaderProps {
  storeName?: string;
  cashierName?: string;
  onOpenHeldCarts?: () => void;
  onOpenCashShift?: () => void;
  onOpenIndustryTools?: () => void;
  isShiftOpen?: boolean;
  expectedCash?: number;
}

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

export const PosHeader: React.FC<PosHeaderProps> = ({
  storeName = "Magasin Principal",
  cashierName = "Caissier",
  onOpenHeldCarts,
  onOpenCashShift,
  onOpenIndustryTools,
  isShiftOpen = false,
  expectedCash = 0,
}) => {
  const t = useTranslations("Pos");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { heldCarts, storeType, setStoreProfile } = usePosStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const handleSwitchVertical = async (nextType: StoreBusinessType) => {
    if (nextType === storeType) {
      if (onOpenIndustryTools) onOpenIndustryTools();
      return;
    }
    setStoreProfile(nextType, true);
    const modeObj = VERTICAL_MODES.find((m) => m.id === nextType);
    toast.success(
      isRtl
        ? `تم التبديل إلى وضع: ${modeObj?.labelAr}`
        : `Mode métier activé : ${modeObj?.labelFr}`
    );
    try {
      await fetch(getApiUrl("/api/v1/onboarding/setup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeType: nextType,
          shopName: storeName,
          seedStarterCatalog: false,
        }),
      });
    } catch {
      // Offline-safe state already updated in Zustand
    }
  };

  return (
    <header className="h-14 border-b border-white/10 bg-zinc-950/85 backdrop-blur-xl px-4 flex items-center justify-between gap-3 select-none shrink-0 z-30">
      {/* LEFT: Brand Identity & Dashboard Switch */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] text-xs font-semibold text-zinc-200 hover:text-white transition shrink-0"
          title={isRtl ? "لوحة التحكم" : "Tableau de bord"}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">{isRtl ? "لوحة التحكم" : "Dashboard"}</span>
        </Link>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/logo.png"
            alt="KASPI"
            className="w-6 h-6 object-contain rounded-md shrink-0"
          />
          <span className="font-extrabold text-sm tracking-tight text-white shrink-0">
            KASPI
          </span>
          <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[130px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/10 hidden md:inline-block">
            {storeName}
          </span>
        </div>
      </div>

      {/* CENTER: Core Workspace Vertical Switcher + Specialized Tools Trigger */}
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

        {onOpenIndustryTools && (
          <button
            type="button"
            onClick={onOpenIndustryTools}
            className="h-7 px-2.5 ms-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="KDS / Tables / Tailles / Balance / IMEI"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{isRtl ? "أدوات القطاع" : "Outils"}</span>
          </button>
        )}
      </div>

      {/* RIGHT: Clean Action Pills */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile Industry Tools Trigger */}
        {onOpenIndustryTools && (
          <button
            type="button"
            onClick={onOpenIndustryTools}
            className="lg:hidden inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Cash Drawer Shift Pill */}
        {onOpenCashShift && (
          <button
            type="button"
            onClick={onOpenCashShift}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              isShiftOpen
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            }`}
            title="Fond de Caisse / Rapport X & Z"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono">
              {isShiftOpen ? `${expectedCash.toFixed(0)} DH` : isRtl ? "فتح الصندوق" : "Caisse"}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isShiftOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
          </button>
        )}

        {/* Held Carts Pill */}
        {heldCarts.length > 0 && (
          <button
            type="button"
            onClick={onOpenHeldCarts}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 text-xs font-semibold transition cursor-pointer"
            title={t("heldOrders")}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">{heldCarts.length}</span>
          </button>
        )}

        {/* Sync Status */}
        <SyncStatusBadge />

        {/* Desktop App Link */}
        <Link
          href={`/${locale}/download`}
          className="hidden xl:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition"
          title="Application Windows Desktop (.exe)"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Desktop</span>
        </Link>

        {/* Store Settings Link */}
        <Link
          href={`/${locale}/dashboard/settings`}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
          title={isRtl ? "إعدادات المتجر" : "Paramètres"}
        >
          <Settings className="w-3.5 h-3.5" />
        </Link>

        {/* Fullscreen Kiosk Toggle */}
        <button
          type="button"
          onClick={toggleKioskFullscreen}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs transition cursor-pointer ${
            isFullscreen
              ? "bg-white text-black border-white"
              : "bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/10"
          }`}
          title="Plein Écran (F11)"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Active Session Profile Pill */}
        <Link
          href={`/${locale}/dashboard/settings`}
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-200 transition"
        >
          <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate max-w-[90px]">{cashierName}</span>
        </Link>
      </div>
    </header>
  );
};
