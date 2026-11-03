import { offlineDb, OfflineSale } from "@/client/db";
import { pullLatestServerData } from "@/client/sync-engine";

export { pullLatestServerData };

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

/**
 * Iterates through all PENDING offline sales in Dexie.js and synchronizes
 * them with PostgreSQL via the /api/v1/sales endpoint using clientSaleId / idempotencyKey.
 */
export async function syncOfflineSales(): Promise<SyncResult> {
  if (typeof window === "undefined" || !offlineDb) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  if (!navigator.onLine) {
    const pendingCount = await offlineDb.offlineSales
      .where("status")
      .equals("PENDING")
      .count();
    return { synced: 0, failed: 0, remaining: pendingCount };
  }

  let synced = 0;
  let failed = 0;

  try {
    const pendingSales = await offlineDb.offlineSales
      .where("status")
      .equals("PENDING")
      .toArray();

    if (pendingSales.length === 0) {
      return { synced: 0, failed: 0, remaining: 0 };
    }

    console.info(`[Offline Sync] Found ${pendingSales.length} pending offline sales to sync.`);

    for (const sale of pendingSales) {
      try {
        // Mark as SYNCING in Dexie
        await offlineDb.offlineSales.update(sale.id!, {
          status: "SYNCING",
        });

        const payload = {
          clientSaleId: sale.clientSaleId,
          idempotencyKey: sale.idempotencyKey,
          storeId: sale.storeId,
          customerId: sale.customerId || undefined,
          subtotal: sale.subtotal,
          taxTotal: sale.taxTotal,
          discountTotal: sale.discountTotal,
          grandTotal: sale.grandTotal,
          paidTotal: sale.paidTotal,
          changeDue: sale.changeDue,
          paymentMethod: sale.payments?.[0]?.method || "cash",
          items: sale.items.map((item: any, index: number) => ({
            productId: item.productId,
            lineNo: index + 1,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            discountAmount: item.discountAmount,
          })),
        };

        const res = await fetch("/api/v1/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": sale.idempotencyKey,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await offlineDb.offlineSales.update(sale.id!, {
            status: "SYNCED",
            syncedAt: Date.now(),
            errorMessage: undefined,
          });
          synced++;
          console.info(`[Offline Sync] ✔ Sale ${sale.clientSaleId} synced successfully.`);
        } else {
          const errData = await res.json().catch(() => ({}));
          // If 4xx client validation error, mark FAILED so it doesn't block the queue
          if (res.status >= 400 && res.status < 500) {
            await offlineDb.offlineSales.update(sale.id!, {
              status: "FAILED",
              errorMessage: errData.error?.message || `HTTP ${res.status}`,
            });
            failed++;
          } else {
            // Server error / network drop: reset to PENDING for retry
            await offlineDb.offlineSales.update(sale.id!, {
              status: "PENDING",
            });
          }
        }
      } catch (err: any) {
        console.warn(`[Offline Sync] Network drop while syncing sale ${sale.clientSaleId}:`, err);
        // Reset to PENDING
        if (sale.id) {
          await offlineDb.offlineSales.update(sale.id, {
            status: "PENDING",
          });
        }
      }
    }
  } catch (dbErr) {
    console.error("[Offline Sync] Database error reading Dexie queue:", dbErr);
  }

  const remaining = await offlineDb.offlineSales
    .where("status")
    .equals("PENDING")
    .count();

  return { synced, failed, remaining };
}

/**
 * Initializes listeners for online/offline events and periodic background sync.
 */
export function initBackgroundSync(
  onSyncComplete?: (result: SyncResult) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = async () => {
    console.info("[Offline Sync] Network restored! Initiating auto-sync...");
    const result = await syncOfflineSales();
    await pullLatestServerData().catch(() => {});
    if (result.synced > 0 || result.failed > 0) {
      onSyncComplete?.(result);
    }
  };

  window.addEventListener("online", handleOnline);

  // Periodic heartbeat sync every 20 seconds
  const intervalId = setInterval(async () => {
    if (navigator.onLine) {
      const result = await syncOfflineSales();
      if (result.synced > 0) {
        onSyncComplete?.(result);
      }
    }
  }, 20000);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    clearInterval(intervalId);
  };
}
