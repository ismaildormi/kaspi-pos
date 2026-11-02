"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Wifi, WifiOff, Clock, User as UserIcon } from "lucide-react";
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
    <header className="h-16 border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Brand & Store Info */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="KASPI POS"
          className="w-8 h-8 object-contain rounded-lg"
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base tracking-tight">KASPI POS</span>
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

      {/* Center / Right Actions: Offline Status, Parked Carts, Lang Switcher */}
      <div className="flex items-center gap-3">
        {/* Offline / Online Status Badge */}
        {isOnline ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("onlineMode")}</span>
            {pendingOfflineCount > 0 && (
              <span className="bg-white text-black px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingOfflineCount} {t("syncPending")}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            <WifiOff className="w-3.5 h-3.5" />
            <span>{t("offlineMode")}</span>
            {pendingOfflineCount > 0 && (
              <span className="bg-zinc-700 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingOfflineCount}
              </span>
            )}
          </div>
        )}

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
