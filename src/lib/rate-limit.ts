import { NextResponse } from "next/server";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-Memory sliding window fallback store
interface MemoryRecord {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, MemoryRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (record.resetAt <= now) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Universal Rate Limiter:
 * 1. Primary: Upstash Redis REST API (100% Free Tier, zero npm package overhead)
 * 2. Secondary Fallback: In-Memory sliding window (instant local/dev protection)
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  // 1. Try Upstash Redis if configured
  if (upstashUrl && upstashToken && !upstashUrl.includes("mock")) {
    try {
      const key = `rate:${identifier}`;
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, windowSeconds, "NX"],
          ["TTL", key],
        ]),
        signal: AbortSignal.timeout(1500),
      });

      if (res.ok) {
        const data = await res.json();
        // data will be [{ result: count }, { result: 1 }, { result: ttl }]
        const currentCount = Number(data[0]?.result) || 1;
        const ttl = Number(data[2]?.result) || windowSeconds;
        const remaining = Math.max(0, limit - currentCount);
        const reset = Math.floor(Date.now() / 1000) + Math.max(1, ttl);

        return {
          success: currentCount <= limit,
          limit,
          remaining,
          reset,
        };
      }
    } catch (err) {
      console.warn("[Rate Limit] Upstash Redis request failed, falling back to memory:", err);
    }
  }

  // 2. In-Memory Token Bucket / Sliding Window Fallback
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || record.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    memoryStore.set(identifier, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor(resetAt / 1000),
    };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const reset = Math.floor(record.resetAt / 1000);

  return {
    success: record.count <= limit,
    limit,
    remaining,
    reset,
  };
}

/**
 * Returns a standardized 429 Too Many Requests response with standard headers
 */
export function createRateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.max(1, result.reset - Math.floor(Date.now() / 1000));
  return NextResponse.json(
    {
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please slow down.",
        retry_after_seconds: retryAfter,
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    }
  );
}
