import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import {
  X_ZEBRA_KEY_SCOPE,
  type StoredApiKeyMeta,
} from "@/lib/zebra-x/api-auth";

export const dynamic = "force-dynamic";

const TOKENS_PER_REQUEST_ESTIMATE = 1480;

/**
 * Real PostgreSQL Platform Telemetry for HEYUKA Platform (`/usage` & Billing Coverage):
 * Computes genuine key counts, merchant/developer workspaces served, request volumes,
 * daily timeseries buckets, and estimated token equivalent at $0.00 user cost.
 */
export async function GET(req: NextRequest) {
  const daysRaw = Number(req.nextUrl.searchParams.get("days") || "30");
  const days = Number.isFinite(daysRaw) && daysRaw > 0 && daysRaw <= 90 ? Math.floor(daysRaw) : 30;
  const filterKeyId = String(req.nextUrl.searchParams.get("keyId") || "all").trim();

  let authTenantId: string | null = null;
  let userEmail: string | null = null;
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    authTenantId = ctx.tenantId || null;
    userEmail = ctx.userEmail || null;
  } catch {
    // Public telemetry mode returns aggregate platform figures only without PII
  }

  try {
    const [allKeyRows, merchantsCount, usersCount, totalChatMessages, totalChatSessions] =
      await Promise.all([
        prisma.idempotencyRecord.findMany({
          where: { scope: X_ZEBRA_KEY_SCOPE },
          select: {
            tenantId: true,
            createdAt: true,
            responseBody: true,
          },
        }),
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.aIChatMessage.count(),
        prisma.aIChatSession.count(),
      ]);

    const activeGlobalKeys: Array<StoredApiKeyMeta & { tenantId: string; rowCreatedAt: Date }> = [];
    for (const row of allKeyRows) {
      const meta = row.responseBody as unknown as StoredApiKeyMeta | null;
      if (!meta || typeof meta.id !== "string" || meta.revoked) continue;
      activeGlobalKeys.push({
        ...meta,
        tenantId: row.tenantId,
        rowCreatedAt: row.createdAt,
      });
    }

    const totalKeysGlobal = activeGlobalKeys.length;
    const totalRequestsGlobal = activeGlobalKeys.reduce(
      (sum, k) => sum + Math.max(0, Number(k.usageCount || 0)),
      0
    );

    const tenantKeys = authTenantId
      ? activeGlobalKeys.filter((k) => k.tenantId === authTenantId)
      : [];

    const selectedTenantKeys =
      filterKeyId !== "all"
        ? tenantKeys.filter((k) => k.id === filterKeyId)
        : tenantKeys;

    const tenantRequests = selectedTenantKeys.reduce(
      (sum, k) => sum + Math.max(0, Number(k.usageCount || 0)),
      0
    );

    // Build daily buckets across requested window from real timestamps
    const today = new Date();
    const bucketMap = new Map<
      string,
      { date: string; requests: number; estimatedTokens: number; newKeys: number }
    >();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86_400_000);
      const isoDay = d.toISOString().slice(0, 10);
      bucketMap.set(isoDay, {
        date: isoDay,
        requests: 0,
        estimatedTokens: 0,
        newKeys: 0,
      });
    }

    const sourceKeys = authTenantId && tenantKeys.length > 0 ? selectedTenantKeys : activeGlobalKeys;
    for (const k of sourceKeys) {
      const createdDay = (k.createdAt || k.rowCreatedAt.toISOString()).slice(0, 10);
      if (bucketMap.has(createdDay)) {
        const b = bucketMap.get(createdDay)!;
        b.newKeys += 1;
      }
      const reqCount = Math.max(0, Number(k.usageCount || 0));
      if (reqCount > 0) {
        const activityDay = (k.lastUsedAt || k.createdAt || today.toISOString()).slice(0, 10);
        const targetBucket = bucketMap.get(activityDay) || bucketMap.get(today.toISOString().slice(0, 10));
        if (targetBucket) {
          targetBucket.requests += reqCount;
          targetBucket.estimatedTokens += reqCount * TOKENS_PER_REQUEST_ESTIMATE;
        }
      }
    }

    const byKeyBreakdown = (authTenantId ? tenantKeys : activeGlobalKeys.slice(0, 8)).map((k) => {
      const reqs = Math.max(0, Number(k.usageCount || 0));
      return {
        id: k.id,
        label: authTenantId ? k.label : `Workspace Key (${k.prefix}...)`,
        prefix: k.prefix,
        requests: reqs,
        estimatedTokens: reqs * TOKENS_PER_REQUEST_ESTIMATE,
        lastUsedAt: k.lastUsedAt || null,
      };
    });

    const totalEstimatedTokensGlobal =
      totalRequestsGlobal * TOKENS_PER_REQUEST_ESTIMATE + totalChatMessages * 620;
    const tenantEstimatedTokens = tenantRequests * TOKENS_PER_REQUEST_ESTIMATE;

    // Market equivalent savings estimate at typical $1.50 / 1M blended rate (purely informational; billed cost is always $0.00)
    const estimatedMarketSavingsUsd = Number(
      ((totalEstimatedTokensGlobal / 1_000_000) * 1.5).toFixed(2)
    );

    return NextResponse.json({
      ok: true,
      authenticated: Boolean(authTenantId),
      userEmail,
      costUsd: 0,
      billingModel: "FREE_KASPI_COVERED",
      windowDays: days,
      global: {
        activeKeysCount: totalKeysGlobal,
        merchantsCount,
        usersCount,
        totalChatSessions,
        totalChatMessages,
        totalApiRequests: totalRequestsGlobal,
        estimatedTokensProcessed: totalEstimatedTokensGlobal,
        estimatedMarketValueSavedUsd: estimatedMarketSavingsUsd,
      },
      account: {
        activeKeysCount: tenantKeys.length,
        totalApiRequests: tenantRequests,
        estimatedTokensProcessed: tenantEstimatedTokens,
      },
      dailySeries: Array.from(bucketMap.values()),
      byKeyBreakdown,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load platform telemetry" },
      { status: 500 }
    );
  }
}
