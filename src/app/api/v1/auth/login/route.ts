import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { verifyPassword, hashPassword } from "@/server/auth/password";
import { createSession, SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http/response";
import { syncUserToSupabaseDirectory } from "@/lib/supabase";
import { sendLoginAlertEmail } from "@/lib/email/mailer";

import { getLocalizedAuthError, AuthLocale } from "@/lib/auth-errors";

const LoginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().optional(),
  otpCode: z.string().optional(),
  locale: z.enum(["ar", "fr", "en"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    const locale: AuthLocale = (body?.locale as AuthLocale) || "ar";

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", getLocalizedAuthError("VALIDATION_ERROR", locale), 400);
    }

    const { email, password, otpCode } = parsed.data;

    if (!password && !otpCode) {
      return jsonError("VALIDATION_ERROR", getLocalizedAuthError("VALIDATION_ERROR", locale), 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
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
      return jsonError("INVALID_CREDENTIALS", getLocalizedAuthError("INVALID_CREDENTIALS", locale), 401);
    }

    if (!user.isActive) {
      return jsonError("USER_DISABLED", getLocalizedAuthError("USER_DISABLED", locale), 403);
    }

    if (otpCode) {
      const identifier = `login:${email}`;
      const tokenRecord = await prisma.verificationToken.findFirst({
        where: {
          identifier: { in: [identifier, email] },
          token: otpCode.trim(),
        },
      });

      if (!tokenRecord || new Date() > tokenRecord.expires) {
        return jsonError("INVALID_CREDENTIALS", getLocalizedAuthError("INVALID_CREDENTIALS", locale), 401);
      }

      await prisma.verificationToken.deleteMany({
        where: {
          identifier: { in: [identifier, email] },
        },
      });
    } else if (password) {
      if (!user.passwordHash) {
        // If user registered via OAuth without a password, set initial password
        const newHash = await hashPassword(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
        user.passwordHash = newHash;
      } else {
        const isValid = await verifyPassword(user.passwordHash, password);
        if (!isValid) {
          return jsonError("INVALID_CREDENTIALS", getLocalizedAuthError("INVALID_CREDENTIALS", locale), 401);
        }
      }
    }

    if (user.memberships.length === 0) {
      return jsonError("NO_MEMBERSHIP", getLocalizedAuthError("NO_MEMBERSHIP", locale), 403);
    }

    const activeTenantId =
      user.defaultTenantId &&
      user.memberships.some((m) => m.tenantId === user.defaultTenantId)
        ? user.defaultTenantId
        : user.memberships[0].tenantId;

    // Check Tenant Device Limit (Phase 3)
    const tenant = await prisma.tenant.findUnique({
      where: { id: activeTenantId },
      select: { maxDevices: true, displayName: true },
    });
    const maxDevices = tenant?.maxDevices ?? 1;

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const activeSessions = await prisma.session.findMany({
      where: {
        activeTenantId,
        revokedAt: null,
        expires: { gt: new Date() },
      },
      select: {
        id: true,
        ip: true,
        userAgent: true,
      },
    });

    const isExistingDeviceSession = activeSessions.some(
      (s) => s.ip === ip && s.userAgent === userAgent
    );

    let deviceLimitHandover = false;
    // Smart Session Rotation / Handover (Shopify POS / Square pattern):
    // NEVER block valid user logins on device limits! If active sessions reach or exceed maxDevices,
    // automatically rotate/revoke the oldest session so this login proceeds smoothly.
    if (!isExistingDeviceSession && activeSessions.length >= maxDevices) {
      const excessCount = activeSessions.length - maxDevices + 1;
      const oldestSessions = await prisma.session.findMany({
        where: {
          activeTenantId,
          revokedAt: null,
          expires: { gt: new Date() },
        },
        orderBy: { createdAt: "asc" },
        take: excessCount,
        select: { id: true },
      });

      if (oldestSessions.length > 0) {
        await prisma.session.updateMany({
          where: { id: { in: oldestSessions.map((s) => s.id) } },
          data: { revokedAt: new Date() },
        });
        deviceLimitHandover = true;
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    const { rawToken } = await createSession({
      userId: user.id,
      activeTenantId,
      ip,
      userAgent,
    });

    // Mirror user activity to Supabase User Directory
    syncUserToSupabaseDirectory({
      email: user.email ?? email,
      fullName: user.fullName || user.name,
      tenantId: activeTenantId,
      role: user.memberships[0]?.role || "owner",
      shopName: user.memberships[0]?.tenant?.displayName,
      source: "login",
      lastSeenAt: new Date().toISOString(),
    }).catch(() => {});

    // Dispatch security login alert email asynchronously
    if (user.email) {
      sendLoginAlertEmail({
        to: user.email,
        ip,
        userAgent,
      }).catch(() => {});
    }

    const response = jsonOk({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isSuperAdmin: user.isSuperAdmin,
      },
      activeTenantId,
      deviceLimitHandover,
      memberships: user.memberships.map((m) => ({
        tenantId: m.tenantId,
        shopName: m.tenant.displayName,
        slug: m.tenant.slug,
        role: m.role,
        currency: m.tenant.currency,
      })),
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
    console.error("Login Error:", err);
    return jsonError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
