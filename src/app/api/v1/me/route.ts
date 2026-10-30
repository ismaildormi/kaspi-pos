import { NextRequest } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { jsonError, jsonOk, AppError } from "@/server/http/response";
import { prisma } from "@/server/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();

    // Fetch user with all memberships for switching
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      include: {
        memberships: {
          where: { status: "active" },
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return jsonError("USER_NOT_FOUND", "User not found", 404);
    }

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
      },
      currentTenant: ctx.activeTenant,
      role: ctx.role,
      storeIds: ctx.storeIds,
      memberships: user.memberships.map((m) => ({
        tenantId: m.tenantId,
        shopName: m.tenant.displayName,
        slug: m.tenant.slug,
        role: m.role,
        isCurrent: m.tenantId === ctx.tenantId,
      })),
    });
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return jsonError(err.code, err.message, err.status);
    }
    console.error("GET /me Error:", err);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve user profile", 500);
  }
}
