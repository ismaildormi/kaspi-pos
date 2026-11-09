"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEnvelope<any>>();

export function getCachedData<T>(
  key: string,
  fallback: T
): { data: T; isCached: boolean; ageMs: number } {
  if (typeof window === "undefined") {
    return { data: fallback, isCached: false, ageMs: 0 };
  }

  try {
    // 1. Try memory cache first (instant)
    const mem = memoryCache.get(key);
    if (mem) {
      const ageMs = Date.now() - mem.timestamp;
      return { data: mem.data, isCached: true, ageMs };
    }

    // 2. Try localStorage
    const raw = window.localStorage.getItem(`kaspi_cache_${key}`);
    if (raw) {
      const parsed: CacheEnvelope<T> = JSON.parse(raw);
      memoryCache.set(key, parsed);
      const ageMs = Date.now() - parsed.timestamp;
      return { data: parsed.data, isCached: true, ageMs };
    }
  } catch (err) {
    console.warn(`[Client Cache] Error reading cache key "${key}":`, err);
  }

  return { data: fallback, isCached: false, ageMs: 0 };
}

export function setCachedData<T>(
  key: string,
  data: T,
  ttlMs: number = 5 * 60 * 1000
): void {
  if (typeof window === "undefined") return;

  const envelope: CacheEnvelope<T> = {
    data,
    timestamp: Date.now(),
    ttlMs,
  };

  memoryCache.set(key, envelope);

  try {
    window.localStorage.setItem(`kaspi_cache_${key}`, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`[Client Cache] Error saving cache key "${key}":`, err);
  }
}

export function removeCachedData(key: string): void {
  memoryCache.delete(key);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(`kaspi_cache_${key}`);
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
