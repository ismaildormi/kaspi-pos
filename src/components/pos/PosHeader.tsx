"use client";

import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Clock, User as UserIcon, LayoutDashboard, ArrowLeft, Wallet } from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SyncStatusBadge } from "./SyncStatusBadge";

interface PosHeaderProps {
  storeName?: string;
  cashierName?: string;
  onOpenHeldCarts?: () => void;
  onOpenCashShift?: () => void;
  isShiftOpen?: boolean;
  expectedCash?: number;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  storeName = "Magasin Principal",
  cashierName = "Caissier",
  onOpenHeldCarts,
  onOpenCashShift,
  isShiftOpen = false,
  expectedCash = 0,
}) => {
  const t = useTranslations("Pos");
  const locale = useLocale();
  const { heldCarts } = usePosStore();

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Brand & Store Info + Back to Dashboard Button */}
      <div className="flex items-center gap-3">
        {/* Persistent Back to Dashboard Button */}
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800 hover:border-zinc-500 transition shadow-sm group"
          title="Retour au Tableau de Bord"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

        <img
          src="/logo.png"
          alt="KASPI POS"
          className="w-8 h-8 object-contain bg-transparent"
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base tracking-tight">
              KASPI POS
            </span>
            <span className="text-xs bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded font-mono border border-zinc-800">
              {storeName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
            <span>{cashierName}</span>
          </div>
        </div>
      </div>

      {/* Center / Right Actions: Sync Status Indicator, Cash Shift (X/Z), Parked Carts, Lang Switcher */}
      <div className="flex items-center gap-3">
        {/* Cash Drawer Shift Management Button (Fond de Caisse / X-Report / Z-Report) */}
        {onOpenCashShift && (
          <button
            onClick={onOpenCashShift}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isShiftOpen
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                : "bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-900/50"
            }`}
            title="Gestion de Caisse (Fond de Caisse / Rapport X & Z)"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {isShiftOpen
                ? `Caisse • ${expectedCash.toFixed(2)} DH`
                : "Ouvrir Caisse (Fond)"}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isShiftOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
          </button>
        )}

        {/* Live Offline/Online & Outbox Queue Status Badge */}
        <SyncStatusBadge />

        {/* Parked / Held Carts Button */}
        {heldCarts.length > 0 && (
          <button
            onClick={onOpenHeldCarts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-medium transition cursor-pointer"
            title={t("heldOrders")}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t("heldOrders")}</span>
            <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-[11px]">
              {heldCarts.length}
            </span>
          </button>
        )}

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  );
};
