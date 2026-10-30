"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Wifi, WifiOff, Clock, User as UserIcon, RefreshCw } from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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
  const { isOnline, pendingOfflineCount, setIsOnline, refreshOfflineQueueCount, heldCarts } =
    usePosStore();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshOfflineQueueCount();
    };
    const handleOffline = () => {
      setIsOnline(false);
      refreshOfflineQueueCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    refreshOfflineQueueCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOnline, refreshOfflineQueueCount]);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950 px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Brand & Store Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-extrabold text-emerald-400 text-xl shadow-inner">
          ك
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-base tracking-tight">Kasbi POS</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-700">
              {storeName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{cashierName}</span>
          </div>
        </div>
      </div>

      {/* Center / Right Actions: Offline Status, Parked Carts, Lang Switcher */}
      <div className="flex items-center gap-3">
        {/* Offline / Online Status Badge */}
        {isOnline ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("onlineMode")}</span>
            {pendingOfflineCount > 0 && (
              <span className="bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingOfflineCount} {t("syncPending")}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
            <WifiOff className="w-3.5 h-3.5" />
            <span>{t("offlineMode")}</span>
            {pendingOfflineCount > 0 && (
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingOfflineCount}
              </span>
            )}
          </div>
        )}

        {/* Parked / Held Carts Button */}
        {heldCarts.length > 0 && (
          <button
            onClick={onOpenHeldCarts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium transition"
            title={t("heldOrders")}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t("heldOrders")}</span>
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[11px]">
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
