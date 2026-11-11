import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext({ requireTenant: true });

    // Revoke other active sessions for this tenant to make room for this device
    const now = new Date();
    await prisma.session.updateMany({
      where: {
        activeTenantId: ctx.tenantId,
        revokedAt: null,
        expires: { gt: now },
        ...(ctx.sessionId ? { id: { not: ctx.sessionId } } : {}),
      },
      data: {
        revokedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Register switched successfully to this device",
      tenantId: ctx.tenantId,
      activeSessionId: ctx.sessionId,
    });
  } catch (err: any) {
    console.error("[Switch Register Error]:", err);
    return NextResponse.json(
      {
        error: err?.message || "Failed to switch register",
      },
      { status: err?.statusCode || 500 }
    );
  }
}
