"use client";

import Dexie, { type Table } from "dexie";
import { scrubTraceText } from "@/lib/zebra-x/learning-trace";
import type { ActivityBreadcrumb } from "./bridge-schema";

/**
 * X x Zebra — Local Activity Sensor & Offline Sync Queue (Safeguards #3 & #5)
 * - Stores UI clicks, route visits, last customer, last sale/receipt ONLY locally in
 *   IndexedDB (max 150 events ring buffer) -> ZERO database spam to central servers.
 * - Isolates store vault records cleanly and queues offline AI-confirmed POS sales
 *   for automatic flush when connectivity returns.
 */

export interface OfflinePendingAction {
  id: string;
  endpoint: string;
  method: "POST" | "PATCH";
  bodyJson: string;
  createdAt: string;
  retries: number;
  summary: string;
}

class ZebraActivityDexie extends Dexie {
  breadcrumbs!: Table<ActivityBreadcrumb, string>;
  offlineQueue!: Table<OfflinePendingAction, string>;

  constructor() {
    super("kaspi_zebra_x_vault_v1");
    this.version(1).stores({
      breadcrumbs: "id, timestamp, kind, route",
      offlineQueue: "id, createdAt",
    });
  }
}

let dbInstance: ZebraActivityDexie | null = null;
const MAX_BREADCRUMBS = 150;
let sensorInstalled = false;
let lastClickStamp = 0;

function getDb(): ZebraActivityDexie | null {
  if (typeof window === "undefined") return null;
  if (!dbInstance) {
    dbInstance = new ZebraActivityDexie();
  }
  return dbInstance;
}

export async function recordActivityBreadcrumb(
  input: Omit<ActivityBreadcrumb, "id" | "timestamp">
): Promise<void> {
  const db = getDb();
  if (!db) return;

  const entry: ActivityBreadcrumb = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    kind: input.kind,
    route: scrubTraceText(input.route || "/", 160),
    label: scrubTraceText(input.label || "action", 140),
    detail: input.detail ? scrubTraceText(input.detail, 220) : undefined,
  };

  try {
    await db.breadcrumbs.put(entry);
    const total = await db.breadcrumbs.count();
    if (total > MAX_BREADCRUMBS) {
      const oldest = await db.breadcrumbs
        .orderBy("timestamp")
        .limit(total - MAX_BREADCRUMBS)
        .primaryKeys();
      await db.breadcrumbs.bulkDelete(oldest as string[]);
    }
  } catch {
    // Non-blocking in restricted private browser modes
  }
}

export async function getRecentBreadcrumbs(limit = 20): Promise<ActivityBreadcrumb[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const all = await db.breadcrumbs.orderBy("timestamp").reverse().limit(limit).toArray();
    return all;
  } catch {
    return [];
  }
}

export async function buildActivityContextSnapshot(): Promise<string> {
  const recent = await getRecentBreadcrumbs(12);
  if (recent.length === 0) return "";
  return recent
    .map((b) => `[${b.timestamp.slice(11, 19)}] (${b.kind}) ${b.route} -> ${b.label}${b.detail ? ` (${b.detail})` : ""}`)
    .join("\n");
}

/**
 * Offline-First Queue for confirmed financial / catalog actions (Safeguard #3).
 */
export async function enqueueOfflineConfirmedAction(
  action: Omit<OfflinePendingAction, "id" | "createdAt" | "retries">
): Promise<OfflinePendingAction> {
  const item: OfflinePendingAction = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    retries: 0,
    ...action,
  };
  const db = getDb();
  if (db) {
    await db.offlineQueue.put(item).catch(() => {});
  }
  return item;
}

export async function flushOfflineConfirmedActions(): Promise<{ synced: number; remaining: number }> {
  const db = getDb();
  if (!db || typeof navigator === "undefined" || !navigator.onLine) {
    return { synced: 0, remaining: db ? await db.offlineQueue.count().catch(() => 0) : 0 };
  }

  let synced = 0;
  try {
    const queued = await db.offlineQueue.orderBy("createdAt").toArray();
    for (const item of queued) {
      try {
        const res = await fetch(item.endpoint, {
          method: item.method,
          headers: { "Content-Type": "application/json" },
          body: item.bodyJson,
        });
        if (res.ok || (res.status >= 400 && res.status < 500)) {
          // 4xx = duplicate idempotency or validation settled; dequeue cleanly
          await db.offlineQueue.delete(item.id);
          if (res.ok) synced++;
        }
      } catch {
        await db.offlineQueue.update(item.id, { retries: item.retries + 1 });
      }
    }
    const remaining = await db.offlineQueue.count();
    return { synced, remaining };
  } catch {
    return { synced, remaining: 0 };
  }
}

/**
 * Installs passive global route + click listener once (Zero CPU overhead, scrubs passwords/inputs).
 */
export function installGlobalActivitySensor(): void {
  if (typeof window === "undefined" || sensorInstalled) return;
  sensorInstalled = true;

  const currentPath = window.location.pathname || "/";
  void recordActivityBreadcrumb({
    kind: "route",
    route: currentPath,
    label: `Visited ${currentPath}`,
  });

  const handleClick = (ev: MouseEvent) => {
    const now = Date.now();
    if (now - lastClickStamp < 450) return; // Throttle high-frequency clicks
    lastClickStamp = now;

    const target = ev.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("input[type='password']") || target.closest("[data-private-vault]")) return;

    const actionable = target.closest("button, a, [role='button'], [role='menuitem']") as HTMLElement | null;
    if (!actionable) return;

    const text =
      actionable.getAttribute("aria-label") ||
      actionable.getAttribute("title") ||
      actionable.textContent?.trim() ||
      actionable.tagName;

    if (!text) return;
    void recordActivityBreadcrumb({
      kind: "click",
      route: window.location.pathname || "/",
      label: text.slice(0, 100),
    });
  };

  const handleOnline = () => {
    void flushOfflineConfirmedActions();
  };

  window.addEventListener("click", handleClick, { capture: true, passive: true });
  window.addEventListener("online", handleOnline);
}
