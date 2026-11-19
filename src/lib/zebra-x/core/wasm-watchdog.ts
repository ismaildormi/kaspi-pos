/**
 * X x Zebra — WASM Memory Watchdog (Critical Safeguard #1)
 * Tracks lazy-loaded heavy client engines (background removal, OCR, PDF fonts,
 * browser DBs) and automatically releases idle buffers after 60s or on chat close
 * so low-RAM POS devices never freeze.
 */

export interface RegisteredWasmEngine {
  id: string;
  label: string;
  lastUsedAt: number;
  release: () => void | Promise<void>;
}

const IDLE_TTL_MS = 60_000;
const registry = new Map<string, RegisteredWasmEngine>();
let sweepTimer: ReturnType<typeof setInterval> | null = null;

function ensureWatchdogLoop() {
  if (typeof window === "undefined" || sweepTimer !== null) return;
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of registry.entries()) {
      if (now - entry.lastUsedAt >= IDLE_TTL_MS) {
        registry.delete(id);
        Promise.resolve(entry.release()).catch(() => {});
      }
    }
    if (registry.size === 0 && sweepTimer !== null) {
      clearInterval(sweepTimer);
      sweepTimer = null;
    }
  }, 15_000);
}

/**
 * Registers or refreshes an active WASM/Media resource under the 60s idle watchdog.
 */
export function touchWasmResource(
  id: string,
  label: string,
  release: () => void | Promise<void>
): void {
  registry.set(id, {
    id,
    label,
    lastUsedAt: Date.now(),
    release,
  });
  ensureWatchdogLoop();
}

/**
 * Immediately releases a specific or all active heavy WASM resources (e.g. on chat close).
 */
export async function releaseWasmResources(targetId?: string): Promise<number> {
  if (targetId) {
    const entry = registry.get(targetId);
    if (!entry) return 0;
    registry.delete(targetId);
    await Promise.resolve(entry.release()).catch(() => {});
    return 1;
  }

  const entries = Array.from(registry.values());
  registry.clear();
  if (sweepTimer !== null) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
  await Promise.allSettled(entries.map((e) => Promise.resolve(e.release())));
  return entries.length;
}

export function getActiveWasmCount(): number {
  return registry.size;
}
