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
  onOpenHeldCarts?: () => void;
  onOpenCashShift?: () => void;
  onOpenIndustryTools?: () => void;
  isShiftOpen?: boolean;
  expectedCash?: number;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  storeName = "Magasin Principal",
  cashierName = "Caissier",
  onOpenHeldCarts,
  onOpenCashShift,
  onOpenIndustryTools,
  isShiftOpen = false,
  expectedCash = 0,
}) => {
  const { t, locale } = useAppDictionary();
  const { heldCarts } = usePosStore();
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

  return (
    <header
      dir="ltr"
      className="h-14 bg-zinc-950 border-b border-zinc-800 px-3 sm:px-4 flex items-center justify-between gap-2 select-none shrink-0"
    >
      {/* LEFT: Branding & Workspace Link */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-300 hover:text-white transition group border border-transparent hover:border-white/10"
          title={t.nav.dashboard}
        >
          <LayoutDashboard className="w-4 h-4 text-zinc-400 group-hover:text-white" />
          <span className="hidden sm:inline text-xs font-semibold">{t.nav.dashboard}</span>
        </Link>

        <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/logo.png"
            alt="KASPI POS"
            className="w-5 h-5 object-contain rounded shrink-0"
          />
          <span className="font-bold text-xs tracking-tight text-white hidden md:inline truncate max-w-[140px]">
            {storeName}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 hidden lg:inline">
            ({cashierName})
          </span>
        </div>
      </div>

      {/* CENTER: Minimal Industry Tools Action if Available */}
      <div className="flex items-center gap-2">
        {onOpenIndustryTools && (
          <button
            type="button"
            onClick={onOpenIndustryTools}
            className="h-8 px-3 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-zinc-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="KDS / Tables / Tailles / Balance / IMEI"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
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
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              isShiftOpen
                ? "bg-zinc-900 border-white/15 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                : "bg-zinc-900 border-white/10 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
            title="Fond de Caisse / Rapport X & Z"
          >
            <Wallet className="w-3.5 h-3.5 text-zinc-400" />
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
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 text-xs font-semibold transition cursor-pointer"
            title={t.pos.heldOrders}
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
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
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition cursor-pointer"
          title="KASPI AI Assistant"
        >
          <Bot className="w-3.5 h-3.5 text-zinc-300" />
        </button>

        {/* Desktop App Link */}
        <Link
          href={`/${locale}/download`}
          className="hidden xl:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition"
          title="Application Desktop"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t.topbar.desktopApp}</span>
        </Link>

        {/* Store Settings Link */}
        <Link
          href={`/${locale}/dashboard/settings`}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
          title={t.topbar.settings}
        >
          <Settings className="w-3.5 h-3.5" />
        </Link>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Fullscreen Kiosk Toggle */}
        <button
          type="button"
          onClick={toggleKioskFullscreen}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs transition cursor-pointer ${
            isFullscreen
              ? "bg-white text-black border-white"
              : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700"
          }`}
          title="Kiosk Mode"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
