"use client";

import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Clock, User as UserIcon, LayoutDashboard, ArrowLeft } from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SyncStatusBadge } from "./SyncStatusBadge";

interface PosHeaderProps {
  storeName?: string;
  cashierName?: string;
  onOpenHeldCarts?: () => void;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  storeName = "Magasin Principal",
  cashierName = "Caissier",
  onOpenHeldCarts,
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

      {/* Center / Right Actions: Sync Status Indicator, Parked Carts, Lang Switcher */}
      <div className="flex items-center gap-3">
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
