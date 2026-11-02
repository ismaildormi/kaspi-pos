"use client";

import { useEffect } from "react";
import {
  offlineDb,
  type SyncQueueItem,
  type SyncQueueEntityType,
} from "@/client/db";

export interface SyncQueueProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  remainingPending: number;
}

let isCurrentlySyncing = false;

export function getApiUrl(path: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}

export async function getSyncQueueCounts(): Promise<{
  pending: number;
  syncing: number;
  failed: number;
}> {
  if (typeof window === "undefined" || !offlineDb) {
    return { pending: 0, syncing: 0, failed: 0 };
  }

  try {
    const [pending, syncing, failed, legacyPending] = await Promise.all([
      offlineDb.sync_queue.where("status").equals("pending").count(),
      offlineDb.sync_queue.where("status").equals("syncing").count(),
      offlineDb.sync_queue.where("status").equals("failed").count(),
      offlineDb.offlineSales.where("status").equals("PENDING").count(),
    ]);

    return {
      pending: Math.max(pending, legacyPending),
      syncing: isCurrentlySyncing ? Math.max(1, syncing) : syncing,
      failed,
    };
  } catch {
    return { pending: 0, syncing: 0, failed: 0 };
  }
}

function broadcastSyncStatus(isSyncing: boolean) {
  if (typeof window === "undefined") return;
  getSyncQueueCounts()
    .then((counts) => {
      window.dispatchEvent(
        new CustomEvent("kaspi-sync-status", {
          detail: {
            isSyncing,
            pendingCount: counts.pending,
            failedCount: counts.failed,
          },
        })
      );
    })
    .catch(() => {});
}

export async function enqueueSyncItem(
  type: SyncQueueEntityType,
  payload: Record<string, any>,
  customId?: string
): Promise<SyncQueueItem | null> {
  if (typeof window === "undefined" || !offlineDb) return null;

  const item: SyncQueueItem = {
    id: customId || crypto.randomUUID(),
    type,
    payload,
    status: "pending",
    createdAt: Date.now(),
    retryCount: 0,
  };

  await offlineDb.sync_queue.put(item);
  broadcastSyncStatus(isCurrentlySyncing);
  return item;
}

function resolveEndpointForType(type: SyncQueueEntityType): string {
  switch (type) {
    case "SALE":
      return getApiUrl("/api/v1/sales");
    case "CUSTOMER":
      return getApiUrl("/api/v1/customers");
    case "PRODUCT":
      return getApiUrl("/api/v1/products");
    default:
      return getApiUrl("/api/v1/sales");
  }
}

/**
 * Background Outbox Processor (`processSyncQueue`)
 * 1. Checks navigator.onLine.
 * 2. Fetches pending items from `sync_queue`.
 * 3. Sends them one by one to the respective API endpoints with `Idempotency-Key` set to item.id.
 * 4. If 200/201, deletes the item from `sync_queue`.
 * 5. If it fails, increments `retryCount` and leaves as 'pending' (or 'failed' if retryCount > 5).
 */
export async function processSyncQueue(): Promise<SyncQueueProcessResult> {
  if (typeof window === "undefined" || !offlineDb) {
    return { processed: 0, succeeded: 0, failed: 0, remainingPending: 0 };
  }

  if (!navigator.onLine || isCurrentlySyncing) {
    const counts = await getSyncQueueCounts();
    return {
      processed: 0,
      succeeded: 0,
      failed: counts.failed,
      remainingPending: counts.pending,
    };
  }

  isCurrentlySyncing = true;
  broadcastSyncStatus(true);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    const pendingItems = await offlineDb.sync_queue
      .where("status")
      .equals("pending")
      .sortBy("createdAt");

    for (const item of pendingItems) {
      if (!navigator.onLine) break;
      processed++;

      try {
        await offlineDb.sync_queue.update(item.id, { status: "syncing" });

        const endpoint = resolveEndpointForType(item.type);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": item.id,
          },
          body: JSON.stringify({
            ...item.payload,
            idempotencyKey: item.id,
          }),
        });

        if (res.status === 200 || res.status === 201 || res.ok) {
          // Delete item from sync_queue upon 200/201 confirmation
          await offlineDb.sync_queue.delete(item.id);
          succeeded++;

          // Also mark corresponding local sale record as SYNCED if applicable
          if (item.type === "SALE" && item.payload?.clientSaleId) {
            await offlineDb.offlineSales
              .where("clientSaleId")
              .equals(item.payload.clientSaleId)
              .modify({ status: "SYNCED", syncedAt: Date.now() });
          }
        } else {
          const nextRetryCount = (item.retryCount || 0) + 1;
          const nextStatus = nextRetryCount > 5 ? "failed" : "pending";
          if (nextStatus === "failed") failed++;

          await offlineDb.sync_queue.update(item.id, {
            status: nextStatus,
            retryCount: nextRetryCount,
            lastError: `HTTP ${res.status}`,
          });
        }
      } catch (err: any) {
        const nextRetryCount = (item.retryCount || 0) + 1;
        const nextStatus = nextRetryCount > 5 ? "failed" : "pending";
        if (nextStatus === "failed") failed++;

        await offlineDb.sync_queue.update(item.id, {
          status: nextStatus,
          retryCount: nextRetryCount,
          lastError: err?.message || "Network error",
        });
      }
    }
  } catch (err) {
    console.warn("[KASPI Sync Engine] Queue processing error:", err);
  } finally {
    isCurrentlySyncing = false;
    broadcastSyncStatus(false);
  }

  const remaining = await getSyncQueueCounts();
  return {
    processed,
    succeeded,
    failed,
    remainingPending: remaining.pending,
  };
}

/**
 * Global Bootstrap Component mounted in RootLayout:
 * - Registers the Offline App Shell Service Worker (`/sw.js`).
 * - Listens to `online` events and triggers `processSyncQueue()`.
 * - Runs `processSyncQueue()` every 60 seconds when online.
 */
export function OfflineSyncBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Offline-First Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("[KASPI SW] Registration notice:", err);
        });
    }

    // 2. Run initial sync if online
    if (navigator.onLine) {
      processSyncQueue().catch(() => {});
    }

    // 3. Listen to browser 'online' event
    const handleOnline = () => {
      processSyncQueue().catch(() => {});
    };

    window.addEventListener("online", handleOnline);

    // 4. Periodic sync every 60 seconds when online
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        processSyncQueue().catch(() => {});
      }
    }, 60_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(intervalId);
    };
  }, []);

  return null;
}
