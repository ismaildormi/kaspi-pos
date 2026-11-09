import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { createSession, SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "@/server/auth/session";
import { ensureUserHasActiveTenant } from "@/server/auth/context";
import { jsonError, jsonOk } from "@/server/http/response";
import { syncUserToSupabaseDirectory } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email/mailer";

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

    // For login: keep a short 90-second grace window on the token so the immediate
    // NextAuth signIn("credentials", { email, otpCode }) call from the client succeeds
    await prisma.verificationToken
      .updateMany({
        where: { identifier, token: code },
        data: { expires: new Date(Date.now() + 90 * 1000) },
      })
      .catch(() => {});

    // Find or auto-provision user
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
      const displayName = email.split("@")[0] || "Tajer Kaspi";
      user = await prisma.user.create({
        data: {
          email,
          name: displayName,
          fullName: displayName,
          emailVerified: new Date(),
          isActive: true,
          lastLoginAt: new Date(),
        },
        include: {
          memberships: {
            where: { status: "active" },
            include: { tenant: true },
          },
        },
      });
    }

    if (!user.isActive) {
      return jsonError("USER_DISABLED", "هذا الحساب معطل حالياً. يرجى التواصل مع إدارة النظام.", 403);
    }

    // Ensure user always has an active tenant & store membership so /dashboard never crashes
    let memberships = user.memberships;
    if (memberships.length === 0) {
      memberships = await ensureUserHasActiveTenant(
        user.id,
        user.email ?? email,
        user.fullName || user.name
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        emailVerified: new Date(),
        defaultTenantId: user.defaultTenantId || memberships[0]?.tenantId || null,
      },
    });

    const activeTenantId =
      user.defaultTenantId &&
      memberships.some((m) => m.tenantId === user.defaultTenantId)
        ? user.defaultTenantId
        : memberships[0]?.tenantId || null;

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const { rawToken } = await createSession({
      userId: user.id,
      activeTenantId,
      ip,
      userAgent,
    });

    // Mirror to Supabase User Directory
    syncUserToSupabaseDirectory({
      email: user.email ?? email,
      fullName: user.fullName || user.name,
      tenantId: activeTenantId,
      role: memberships[0]?.role || "owner",
      shopName: memberships[0]?.tenant?.displayName,
      source: "gmail_otp_login",
      lastSeenAt: new Date().toISOString(),
    }).catch(() => {});

    // Automatically send Welcome & Successful Sign-In Email asynchronously (non-blocking)
    sendWelcomeEmail({
      to: user.email ?? email,
      userName: user.fullName || user.name || (email.split("@")[0] ?? "Merchant"),
      storeName: memberships[0]?.tenant?.displayName || "متجري",
      storeCategory: "grocery",
      loginDate: new Date().toISOString(),
      lang: "ar",
    }).catch((err) => {
      console.warn("[OTP Verify Welcome Email Notice]:", err?.message || err);
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
