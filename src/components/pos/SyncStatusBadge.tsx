"use client";

import React, { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { processSyncQueue, getSyncQueueCounts } from "@/client/sync-engine";
import { usePosStore } from "@/client/store/usePosStore";

export const SyncStatusBadge: React.FC = () => {
  const { isOnline, setIsOnline, pendingOfflineCount, refreshOfflineQueueCount } =
    usePosStore();
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

  if (isSyncing) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span>Offline ({pendingCount} pending)</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        type="button"
        onClick={() => processSyncQueue()}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold transition cursor-pointer"
        title="Click to sync pending items now"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>Online ({pendingCount} pending)</span>
        <RefreshCw className="w-3 h-3 text-zinc-400" />
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      <span>Online (Synced)</span>
    </div>
  );
};

export default SyncStatusBadge;
