import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";
import {
  ForensicEventType,
  getRecentForensicBuffer,
  recordForensicAudit,
  verifyForensicAuditChain,
} from "@/lib/security/forensic-audit";

const ALLOWED_CLIENT_EVENTS = new Set<ForensicEventType>([
  "CASH_DRAWER_OPENED_NO_SALE",
  "DISCOUNT_OVERRIDE",
  "PRODUCT_PRICE_CHANGED",
  "INVOICE_VOIDED_OR_DELETED",
  "OWNER_VAULT_UNLOCKED",
  "OWNER_VAULT_FAILED_PIN",
]);

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const limitParam = Number(req.nextUrl.searchParams.get("limit") || "50");
    const limit = Math.min(Math.max(limitParam, 1), 200);

    const dbLogs = await prisma.auditLog
      .findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          reason: true,
          ip: true,
          requestId: true,
          createdAt: true,
          afterState: true,
        },
      })
      .catch(() => []);

    const memoryEntries = getRecentForensicBuffer(ctx.tenantId);
    const chainVerification = verifyForensicAuditChain(memoryEntries);

    return NextResponse.json({
      success: true,
      tenantId: ctx.tenantId,
      chainVerification,
      recentMemoryEntriesCount: memoryEntries.length,
      logs: dbLogs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unauthorized" },
      { status: err?.status || 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const eventType = body?.eventType as ForensicEventType;

    if (!eventType || !ALLOWED_CLIENT_EVENTS.has(eventType)) {
      return NextResponse.json(
        { error: "Unsupported or restricted forensic eventType" },
        { status: 400 }
      );
    }

    const signed = await recordForensicAudit({
      eventType,
      tenantId: ctx.tenantId,
      storeId: ctx.storeIds?.[0] || null,
      actorId: ctx.userId,
      actorRole: ctx.role,
      entityType: typeof body?.entityType === "string" ? body.entityType : "pos_client_action",
      entityId: typeof body?.entityId === "string" ? body.entityId : null,
      reason: typeof body?.reason === "string" ? body.reason.slice(0, 300) : null,
      beforeState: body?.beforeState,
      afterState: body?.afterState,
      headers: req.headers,
    });

    return NextResponse.json({
      success: true,
      eventId: signed.eventId,
      currentHash: signed.currentHash,
      timestampIso: signed.timestampIso,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to record forensic audit" },
      { status: err?.status || 401 }
    );
  }
}
