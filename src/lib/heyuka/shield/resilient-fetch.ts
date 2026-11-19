import { isSafePublicHttpUrl } from "@/lib/zebra-x/arsenal-vault";

/**
 * HEYUKA / KASPI — v15.4 Layer-6: 3-Tier Resilient Fetcher (`p-retry` + `Opossum / Cockatiel` Circuit Breaker)
 */

interface BreakerState {
  failures: number;
  openedAt: number;
}

const circuitBreakers = new Map<string, BreakerState>();
const BREAKER_FAILURE_THRESHOLD = 3;
const BREAKER_RESET_MS = 20_000;

function isCircuitOpen(hostKey: string): boolean {
  const st = circuitBreakers.get(hostKey);
  if (!st) return false;
  if (st.failures >= BREAKER_FAILURE_THRESHOLD) {
    if (Date.now() - st.openedAt < BREAKER_RESET_MS) {
      return true;
    }
    // Half-open recovery
    circuitBreakers.set(hostKey, { failures: BREAKER_FAILURE_THRESHOLD - 1, openedAt: 0 });
  }
  return false;
}

export function recordUpstreamSuccess(hostKey: string): void {
  circuitBreakers.delete(hostKey);
}

export function recordUpstreamFailure(hostKey: string): void {
  const prev = circuitBreakers.get(hostKey) || { failures: 0, openedAt: 0 };
  const failures = prev.failures + 1;
  circuitBreakers.set(hostKey, {
    failures,
    openedAt: failures >= BREAKER_FAILURE_THRESHOLD ? Date.now() : prev.openedAt,
  });
}

export function getCircuitBreakerSnapshot(): Record<string, BreakerState> {
  return Object.fromEntries(circuitBreakers.entries());
}

export interface ResilientFetchOptions {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * Queries candidate URLs in priority order with SSRF protection, exponential retry, and circuit-breaking.
 */
export async function resilientFetchWithFallback(
  urls: string[],
  options?: ResilientFetchOptions
): Promise<{
  ok: boolean;
  url: string;
  status: number;
  text: string;
  attemptCount: number;
  tierUsed: number;
  errors: string[];
}> {
  const timeoutMs = Math.max(1500, Math.min(20_000, options?.timeoutMs ?? 6500));
  const retriesPerTier = Math.max(0, Math.min(2, options?.retries ?? 1));
  const errors: string[] = [];
  let attemptCount = 0;

  for (let tierIdx = 0; tierIdx < urls.length; tierIdx++) {
    const rawUrl = String(urls[tierIdx] || "").trim();
    if (!isSafePublicHttpUrl(rawUrl)) {
      errors.push(`Tier ${tierIdx + 1}: SSRF_BLOCKED (${rawUrl.slice(0, 60)})`);
      continue;
    }

    const host = new URL(rawUrl).hostname;
    if (isCircuitOpen(host)) {
      errors.push(`Tier ${tierIdx + 1}: CIRCUIT_OPEN (${host})`);
      continue;
    }

    for (let r = 0; r <= retriesPerTier; r++) {
      attemptCount++;
      try {
        const res = await fetch(rawUrl, {
          headers: {
            "User-Agent": "HEYUKA-KASPI-ResilientClient/15.4",
            ...options?.headers,
          },
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        recordUpstreamSuccess(host);
        return {
          ok: true,
          url: rawUrl,
          status: res.status,
          text,
          attemptCount,
          tierUsed: tierIdx + 1,
          errors,
        };
      } catch (err: any) {
        const msg = err?.message || "Network error";
        errors.push(`Tier ${tierIdx + 1} try ${r + 1} (${host}): ${msg}`);
        if (r === retriesPerTier) {
          recordUpstreamFailure(host);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 250 * (r + 1)));
        }
      }
    }
  }

  return {
    ok: false,
    url: urls[0] || "",
    status: 503,
    text: "",
    attemptCount,
    tierUsed: 0,
    errors,
  };
}
