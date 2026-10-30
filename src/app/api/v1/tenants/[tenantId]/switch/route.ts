import { NextRequest } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { jsonError, jsonOk, AppError } from "@/server/http/response";
import { prisma } from "@/server/db/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    const { tenantId } = await params;

    // Verify user is an active member of target tenant
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: ctx.userId,
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!membership || membership.status !== "active") {
      return jsonError(
        "FORBIDDEN",
        "You do not have access to this tenant",
        403
      );
    }

    // Update activeTenantId on session
    await prisma.session.update({
      where: { id: ctx.sessionId },
      data: { activeTenantId: tenantId },
    });

    return jsonOk({
      success: true,
      message: `Switched to ${membership.tenant.displayName}`,
      activeTenantId: tenantId,
      role: membership.role,
    });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return jsonError(err.code, err.message, err.status);
    }
    console.error("Tenant switch error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to switch tenant", 500);
  }
}
