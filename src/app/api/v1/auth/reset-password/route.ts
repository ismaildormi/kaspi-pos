import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { createSession, SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http/response";

const ResetPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح").transform((v) => v.toLowerCase().trim()),
  code: z.string().min(4, "رمز التحقق غير مكتمل").transform((v) => v.trim()),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تتكون من 6 أحرف على الأقل"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.issues[0]?.message || "بيانات غير صالحة", 400);
    }

    const { email, code, newPassword } = parsed.data;
    const identifier = `reset:${email}`;

    // Verify token
    const verification = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: code,
      },
    });

    if (!verification) {
      return jsonError("INVALID_CODE", "رمز التحقق غير صحيح. يرجى التأكد من الرمز والمحاولة مجدداً.", 400);
    }

    if (new Date() > verification.expires) {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      return jsonError("EXPIRED_CODE", "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.", 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { status: "active" },
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      return jsonError("USER_NOT_FOUND", "لا يوجد مستخدم مسجل بهذا البريد الإلكتروني.", 404);
    }

    // Hash new password and update user
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        lastLoginAt: new Date(),
        emailVerified: new Date(),
      },
    });

    // Clean up verification token
    await prisma.verificationToken.deleteMany({ where: { identifier } });

    // Establish persistent session automatically
    const activeTenantId =
      user.defaultTenantId &&
      user.memberships.some((m) => m.tenantId === user.defaultTenantId)
        ? user.defaultTenantId
        : user.memberships[0]?.tenantId || null;

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const { rawToken } = await createSession({
      userId: user.id,
      activeTenantId,
      ip,
      userAgent,
    });

    const response = jsonOk({
      message: "تم تحديث كلمة المرور بنجاح وتسجيل دخولك إلى حسابك.",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName || user.name,
        isSuperAdmin: user.isSuperAdmin,
      },
      redirectUrl: user.isSuperAdmin ? "/admin" : "/dashboard",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: rawToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    console.error("[Reset Password Error]:", err);
    return jsonError("INTERNAL_ERROR", "حدث خطأ غير متوقع أثناء إعادة تعيين كلمة المرور.", 500);
  }
}
