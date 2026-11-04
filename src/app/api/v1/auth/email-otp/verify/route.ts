import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { createSession, SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http/response";

const VerifyOtpSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح").transform((v) => v.toLowerCase().trim()),
  code: z.string().min(4, "رمز التحقق غير مكتمل").transform((v) => v.trim()),
  purpose: z.enum(["login", "reset"]).default("login"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.issues[0]?.message || "بيانات غير صالحة", 400);
    }

    const { email, code, purpose } = parsed.data;
    const identifier = `${purpose}:${email}`;

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

    // For password reset verification step
    if (purpose === "reset") {
      return jsonOk({
        valid: true,
        message: "رمز التحقق صحيح. يمكنك الآن تعيين كلمة المرور الجديدة.",
      });
    }

    // For login: consume the token immediately
    await prisma.verificationToken.deleteMany({ where: { identifier } });

    // Find or locate user
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { status: "active" },
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      return jsonError("USER_NOT_FOUND", "لا يوجد حساب مسجل بهذا البريد. يرجى إنشاء حساب أولاً.", 404);
    }

    if (!user.isActive) {
      return jsonError("USER_DISABLED", "هذا الحساب معطل حالياً. يرجى التواصل مع إدارة النظام.", 403);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), emailVerified: new Date() },
    });

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
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName || user.name,
        isSuperAdmin: user.isSuperAdmin,
      },
      activeTenantId,
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
    console.error("[Email OTP Verify Error]:", err);
    return jsonError("INTERNAL_ERROR", "حدث خطأ غير متوقع أثناء التحقق. يرجى المحاولة مجدداً.", 500);
  }
}
