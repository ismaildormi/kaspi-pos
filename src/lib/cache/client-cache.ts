"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEnvelope<any>>();

export function getScopedKey(key: string): string {
  if (typeof window === "undefined") return key;
  try {
    const tenantId = window.localStorage.getItem("kaspi_active_tenant_id") || "default";
    return `${tenantId}_${key}`;
  } catch {
    return key;
  }
}

export function getCachedData<T>(
  key: string,
  fallback: T
): { data: T; isCached: boolean; ageMs: number } {
  if (typeof window === "undefined") {
    return { data: fallback, isCached: false, ageMs: 0 };
  }

  const scopedKey = getScopedKey(key);

  try {
    // 1. Try memory cache first (instant)
    const mem = memoryCache.get(scopedKey);
    if (mem) {
      const ageMs = Date.now() - mem.timestamp;
      return { data: mem.data, isCached: true, ageMs };
    }

    // 2. Try localStorage
    const raw = window.localStorage.getItem(`kaspi_cache_${scopedKey}`);
    if (raw) {
      const parsed: CacheEnvelope<T> = JSON.parse(raw);
      memoryCache.set(scopedKey, parsed);
      const ageMs = Date.now() - parsed.timestamp;
      return { data: parsed.data, isCached: true, ageMs };
    }
  } catch (err) {
    console.warn(`[Client Cache] Error reading cache key "${scopedKey}":`, err);
  }

  return { data: fallback, isCached: false, ageMs: 0 };
}

export function setCachedData<T>(
  key: string,
  data: T,
  ttlMs: number = 5 * 60 * 1000
): void {
  if (typeof window === "undefined") return;

  const scopedKey = getScopedKey(key);

  const envelope: CacheEnvelope<T> = {
    data,
    timestamp: Date.now(),
    ttlMs,
  };

  memoryCache.set(scopedKey, envelope);

  try {
    window.localStorage.setItem(`kaspi_cache_${scopedKey}`, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`[Client Cache] Error saving cache key "${scopedKey}":`, err);
  }
}

export function removeCachedData(key: string): void {
  const scopedKey = getScopedKey(key);
  memoryCache.delete(scopedKey);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(`kaspi_cache_${scopedKey}`);
    } catch {}
  }
}

export interface UseClientSWROptions<T> {
  initialFallback: T;
  ttlMs?: number;
  onSuccess?: (data: T) => void;
  revalidateOnFocus?: boolean;
}

export function useClientSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseClientSWROptions<T>
) {
  const { initialFallback, ttlMs = 5 * 60 * 1000, onSuccess, revalidateOnFocus = true } = options;

  // 1. Initialize immediately with cached value (0ms render)
  const cached = getCachedData<T>(key, initialFallback);

  const [data, setData] = useState<T>(cached.data);
  const [isLoading, setIsLoading] = useState<boolean>(!cached.isCached);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const executeFetch = useCallback(
    async (isBackgroundRevalidation = false) => {
      if (isBackgroundRevalidation) {
        setIsRevalidating(true);
      } else {
        setIsLoading(true);
      }

      try {
        const freshData = await fetcherRef.current();
        setData(freshData);
        setCachedData(key, freshData, ttlMs);
        setError(null);
        if (onSuccessRef.current) {
          onSuccessRef.current(freshData);
        }
        return freshData;
      } catch (err: any) {
        console.warn(`[Client SWR] Fetch failed for "${key}":`, err);
        setError(err);
        return null;
      } finally {
        setIsLoading(false);
        setIsRevalidating(false);
      }
    },
    [key, ttlMs]
  );

  useEffect(() => {
    // If we have cached data, trigger silent background revalidation; otherwise load immediately
    executeFetch(cached.isCached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Optimistic mutation helper: update local cache immediately in 0ms, then sync
  const mutate = useCallback(
    async (
      optimisticUpdate: T | ((prev: T) => T),
      shouldRevalidate: boolean = true
    ) => {
      setData((prev) => {
        const nextValue =
          typeof optimisticUpdate === "function"
            ? (optimisticUpdate as (p: T) => T)(prev)
            : optimisticUpdate;
        setCachedData(key, nextValue, ttlMs);
        return nextValue;
      });

      if (shouldRevalidate) {
        await executeFetch(true);
      }
    },
    [key, ttlMs, executeFetch]
  );

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    mutate,
    refetch: () => executeFetch(false),
  };
}
