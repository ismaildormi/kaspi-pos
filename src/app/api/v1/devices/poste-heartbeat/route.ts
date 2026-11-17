import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { verifyPosteSession, handleCleanSessionClose } from "@/server/devices/poste-binding-engine";
import { z } from "zod";

const HeartbeatSchema = z
  .object({
    fingerprint: z.string().min(4),
    deviceName: z.string().optional(),
    os: z.string().optional(),
    platform: z.string().optional(),
    action: z.enum(["heartbeat", "session_close"]).default("heartbeat"),
    tenantId: z.string().uuid().optional(),
    storeId: z.string().uuid().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    let tenantId: string | null = null;
    let storeId: string | null = null;

    try {
      const ctx = await getRequestContext({ requireTenant: false });
      if (ctx?.tenantId) {
        tenantId = ctx.tenantId;
        storeId = ctx.storeIds?.[0] || null;
      }
    } catch {
      // Allow tenantId in body or header for background beacon sync
    }

    const body = await req.json().catch(() => ({}));
    const parsed = HeartbeatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid heartbeat payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const effectiveTenantId = tenantId || parsed.data.tenantId;
    if (!effectiveTenantId) {
      return NextResponse.json(
        { error: "Tenant context required for hardware seat verification" },
        { status: 401 }
      );
    }

    const effectiveStoreId = storeId || parsed.data.storeId;

    if (parsed.data.action === "session_close") {
      await handleCleanSessionClose(effectiveTenantId, parsed.data.fingerprint);
      return NextResponse.json({
        success: true,
        action: "session_close",
        timestamp: new Date().toISOString(),
      });
    }

    const result = await verifyPosteSession({
      tenantId: effectiveTenantId,
      storeId: effectiveStoreId || undefined,
      fingerprint: parsed.data.fingerprint,
      deviceName: parsed.data.deviceName,
      os: parsed.data.os,
      platform: parsed.data.platform,
    });

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Poste Heartbeat Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
