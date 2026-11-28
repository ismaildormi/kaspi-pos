import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { revokeSession, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http/response";
import { recordForensicAudit } from "@/lib/security/forensic-audit";

const DeleteAccountSchema = z.object({
  confirmPhrase: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json().catch(() => ({}));
    const parsed = DeleteAccountSchema.safeParse(body);

    if (!parsed.success || parsed.data.confirmPhrase.toUpperCase() !== "DELETE") {
      return jsonError(
        "CONFIRMATION_REQUIRED",
        "يرجى كتابة DELETE لتأكيد حذف الحساب نهائياً.",
        400
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      return jsonError("USER_NOT_FOUND", "الحساب غير موجود.", 404);
    }

    await recordForensicAudit({
      eventType: "SUBSCRIPTION_STATUS_CHANGED",
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      actorEmail: user.email,
      entityType: "user",
      entityId: ctx.userId,
      reason: "OWNER_REQUESTED_ACCOUNT_DELETION",
      afterState: { deletedAt: new Date().toISOString() },
    }).catch(() => {});

    // Revoke all sessions and deactivate user account cleanly
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await revokeSession(token).catch(() => {});
    }

    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: ctx.userId } });
      await tx.tenantMembership.updateMany({
        where: { userId: ctx.userId },
        data: { status: "revoked" },
      });
      await tx.user.update({
        where: { id: ctx.userId },
        data: {
          isActive: false,
          email: `deleted_${ctx.userId}_${Date.now()}@deleted.kaspi.local`,
          defaultTenantId: null,
        },
      });
    });

    const response = jsonOk({
      deleted: true,
      message: "تم حذف الحساب وإلغاء جميع الجلسات بنجاح.",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("[Delete Account] Error:", error);
    return jsonError("DELETE_FAILED", "تعذر حذف الحساب، يرجى المحاولة لاحقاً.", 500);
  }
}
