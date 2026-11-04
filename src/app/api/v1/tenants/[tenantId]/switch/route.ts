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

    // Verify tenant exists
    const targetTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!targetTenant) {
      return jsonError("NOT_FOUND", "Tenant does not exist", 404);
    }

    let role = "owner";

    // If not super admin, verify active membership
    if (!ctx.isSuperAdmin) {
      const membership = await prisma.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: ctx.userId,
          },
        },
      });

      if (!membership || membership.status !== "active") {
        return jsonError(
          "FORBIDDEN",
          "You do not have access to this tenant",
          403
        );
      }
      role = membership.role;
    }

    // Update activeTenantId on session
    await prisma.session.update({
      where: { id: ctx.sessionId },
      data: { activeTenantId: tenantId },
    });

    return jsonOk({
      success: true,
      message: `Switched to ${targetTenant.displayName}`,
      activeTenantId: tenantId,
      role,
    });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return jsonError(err.code, err.message, err.status);
    }
    console.error("Tenant switch error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to switch tenant", 500);
  }
}
