import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { auth } from "@/auth";
import {
  formatTracesAsChatMlJsonl,
  normalizeClientTraceInput,
  sanitizeTraceMetadata,
  type ZebraLearningTraceRecord,
} from "@/lib/zebra-x/learning-trace";
import { X_ZEBRA_CORE_CONTRACT } from "@/lib/zebra-x/sovereign-brain";

export const dynamic = "force-dynamic";

const ZEBRA_TRACE_SCOPE = "kaspi_zebra_learning_traces_v1";

async function resolveVerifiedUser() {
  try {
    const ctx = await getRequestContext();
    const dbUser = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, isSuperAdmin: true, defaultTenantId: true, email: true },
    });
    return {
      userId: ctx.userId,
      tenantId: ctx.tenantId || dbUser?.defaultTenantId || null,
      isSuperAdmin: Boolean(dbUser?.isSuperAdmin),
      email: dbUser?.email || null,
    };
  } catch {
    try {
      const session = await auth();
      if (session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { memberships: { where: { status: "active" }, take: 1 } },
        });
        return {
          userId: session.user.id,
          tenantId: dbUser?.defaultTenantId || dbUser?.memberships[0]?.tenantId || null,
          isSuperAdmin: Boolean(dbUser?.isSuperAdmin || (session.user as any)?.isSuperAdmin),
          email: dbUser?.email || session.user.email || null,
        };
      }
    } catch {
      // Unauthenticated
    }
  }
  return { userId: null, tenantId: null, isSuperAdmin: false, email: null };
}

function sha256Hex(payload: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * POST /api/ai/zebra-trace
 * Appends an anonymized, secret-scrubbed learning trace from any merchant device
 * (Ollama local runs, chat queries, media ops, auto-responder outcomes, or owner corrections)
 * into the hash-chained central Zebra-X learning corpus.
 */
export async function POST(req: NextRequest) {
  try {
    const identity = await resolveVerifiedUser();
    if (!identity.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let targetTenantId = identity.tenantId;

    if (!targetTenantId || targetTenantId === "00000000-0000-0000-0000-000000000000") {
      const firstTenant = await prisma.tenant
        .findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } })
        .catch(() => null);
      targetTenantId = firstTenant?.id || null;
    }

    if (!targetTenantId) {
      return NextResponse.json({ success: true, stored: false, reason: "no_tenant_bucket" });
    }

    const anonymizedTag = crypto
      .createHash("sha256")
      .update(`tenant:${targetTenantId}`)
      .digest("hex")
      .slice(0, 12);

    const normalized = normalizeClientTraceInput({
      ...body,
      tenantTag: anonymizedTag,
      ownerCorrected: Boolean(identity.isSuperAdmin && body?.ownerCorrectionText),
      ownerCorrectionText: identity.isSuperAdmin ? body?.ownerCorrectionText : undefined,
    });

    const sanitized = sanitizeTraceMetadata(normalized) as ZebraLearningTraceRecord;
    const monthBucket = new Date().toISOString().slice(0, 7); // YYYY-MM
    const bucketKey = `traces_${monthBucket}`;

    const existing = await prisma.idempotencyRecord
      .findUnique({
        where: {
          tenantId_scope_key: {
            tenantId: targetTenantId,
            scope: ZEBRA_TRACE_SCOPE,
            key: bucketKey,
          },
        },
      })
      .catch(() => null);

    const prevList: ZebraLearningTraceRecord[] = Array.isArray(
      (existing?.responseBody as any)?.traces
    )
      ? (existing?.responseBody as any).traces
      : [];

    const prevHash = prevList.length > 0 ? prevList[prevList.length - 1]?.traceDigest || "GENESIS" : "GENESIS";
    const chainedRecord: ZebraLearningTraceRecord = {
      ...sanitized,
      prevHash,
      traceDigest: sha256Hex({ ...sanitized, prevHash }),
    };

    // Keep latest 300 entries per tenant per month bucket to keep JSONB snappy
    const nextList = [...prevList, chainedRecord].slice(-300);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5);

    await prisma.idempotencyRecord.upsert({
      where: {
        tenantId_scope_key: {
          tenantId: targetTenantId,
          scope: ZEBRA_TRACE_SCOPE,
          key: bucketKey,
        },
      },
      create: {
        tenantId: targetTenantId,
        scope: ZEBRA_TRACE_SCOPE,
        key: bucketKey,
        requestHash: `zebra-${targetTenantId}-${monthBucket}`,
        responseStatus: 200,
        responseBody: { traces: nextList } as any,
        expiresAt,
      },
      update: {
        responseBody: { traces: nextList } as any,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      traceId: chainedRecord.traceId,
      traceDigest: chainedRecord.traceDigest,
      bucketKey,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to log learning trace" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/zebra-trace
 * STRICTLY OWNER ONLY (PACK041 sovereign-owner-root: verified SUPER_ADMIN).
 * Aggregates cross-device learning traces from all merchant PCs & chats,
 * computes language/model/tool stats, and supports ?format=jsonl export.
 */
export async function GET(req: NextRequest) {
  try {
    const identity = await resolveVerifiedUser();
    if (!identity.userId || !identity.isSuperAdmin) {
      return NextResponse.json(
        {
          error: "OWNER_ONLY_X_ZEBRA_ACCESS",
          message: "X × Zebra unified telemetry and dataset export are restricted to the Owner account.",
        },
        { status: 403 }
      );
    }

    const buckets = await prisma.idempotencyRecord.findMany({
      where: { scope: ZEBRA_TRACE_SCOPE },
      orderBy: { createdAt: "desc" },
      take: 120,
    });

    const allTraces: ZebraLearningTraceRecord[] = [];
    for (const row of buckets) {
      const list = (row.responseBody as any)?.traces;
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && typeof item === "object") {
            allTraces.push(item as ZebraLearningTraceRecord);
          }
        }
      }
    }

    allTraces.sort((a, b) => Date.parse(b.recordedAt || "0") - Date.parse(a.recordedAt || "0"));

    const format = req.nextUrl.searchParams.get("format");
    if (format === "jsonl") {
      const jsonl = formatTracesAsChatMlJsonl(allTraces);
      return new NextResponse(jsonl, {
        status: 200,
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Content-Disposition": `attachment; filename="kaspi-zebra-x-training-${new Date()
            .toISOString()
            .slice(0, 10)}.jsonl"`,
        },
      });
    }

    const byLanguage: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    const byKind: Record<string, number> = {};
    const devices = new Set<string>();
    const tenants = new Set<string>();
    let successCount = 0;

    for (const t of allTraces) {
      byLanguage[t.language || "unknown"] = (byLanguage[t.language || "unknown"] || 0) + 1;
      byModel[t.modelUsed || "unknown"] = (byModel[t.modelUsed || "unknown"] || 0) + 1;
      byKind[t.kind || "MODEL_ROUTE"] = (byKind[t.kind || "MODEL_ROUTE"] || 0) + 1;
      if (t.deviceId) devices.add(t.deviceId);
      if (t.tenantTag) tenants.add(t.tenantTag);
      if (t.outcomeStatus === "SUCCESS") successCount++;
    }

    return NextResponse.json({
      success: true,
      contract: X_ZEBRA_CORE_CONTRACT,
      stats: {
        totalTraces: allTraces.length,
        connectedDevices: devices.size,
        contributingStores: tenants.size,
        successRatePct: allTraces.length > 0 ? Math.round((successCount / allTraces.length) * 100) : 100,
        byLanguage,
        byModel,
        byKind,
      },
      recentTraces: allTraces.slice(0, 50),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to read X × Zebra traces" },
      { status: 500 }
    );
  }
}
