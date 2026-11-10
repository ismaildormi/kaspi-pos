"use client";

import React, { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { processSyncQueue, getSyncQueueCounts } from "@/client/sync-engine";
import { usePosStore } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";

export const SyncStatusBadge: React.FC = () => {
  const { isOnline, setIsOnline, pendingOfflineCount, refreshOfflineQueueCount } =
    usePosStore();
  const { locale } = useAppDictionary();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(pendingOfflineCount);

  useEffect(() => {
    setPendingCount(pendingOfflineCount);
  }, [pendingOfflineCount]);

  useEffect(() => {
    const syncStateFromDb = async () => {
      const counts = await getSyncQueueCounts();
      setPendingCount(counts.pending);
      refreshOfflineQueueCount();
    };

    const handleOnline = () => {
      setIsOnline(true);
      syncStateFromDb();
      processSyncQueue().catch(() => {});
    };

    const handleOffline = () => {
      setIsOnline(false);
      syncStateFromDb();
    };

    const handleCustomSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        isSyncing: boolean;
        pendingCount: number;
        failedCount: number;
      }>;
      if (customEvent.detail) {
        setIsSyncing(Boolean(customEvent.detail.isSyncing));
        setPendingCount(customEvent.detail.pendingCount ?? 0);
      }
      refreshOfflineQueueCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("kaspi-sync-status", handleCustomSyncEvent);

    syncStateFromDb();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("kaspi-sync-status", handleCustomSyncEvent);
    };
  }, [setIsOnline, refreshOfflineQueueCount]);

  const labels = {
    ar: {
      syncing: "جاري المزامنة...",
      offline: `غير متصل (${pendingCount} قيد الانتظار)`,
      onlinePending: `متصل (${pendingCount} قيد المزامنة)`,
      synced: "متصل ومزامن",
    },
    fr: {
      syncing: "Synchronisation...",
      offline: `Hors ligne (${pendingCount} en attente)`,
      onlinePending: `En ligne (${pendingCount} en attente)`,
      synced: "En ligne (Synchronisé)",
    },
    en: {
      syncing: "Syncing...",
      offline: `Offline (${pendingCount} pending)`,
      onlinePending: `Online (${pendingCount} pending)`,
      synced: "Online (Synced)",
    },
  }[locale] || {
    syncing: "Syncing...",
    offline: `Offline (${pendingCount} pending)`,
    onlinePending: `Online (${pendingCount} pending)`,
    synced: "Online (Synced)",
  };

  if (isSyncing) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
        <span className="hidden sm:inline font-mono">{labels.syncing}</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-red-500/30 text-red-300 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="hidden sm:inline font-mono">{labels.offline}</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        type="button"
        onClick={() => processSyncQueue()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 text-xs font-medium transition cursor-pointer"
        title="Click to sync pending items now"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="hidden sm:inline font-mono">{labels.onlinePending}</span>
        <RefreshCw className="w-3 h-3 text-amber-400" />
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-medium">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="hidden sm:inline font-mono">{labels.synced}</span>
    </div>
  );
};

export default SyncStatusBadge;
