import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { createSession, SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "@/server/auth/session";
import { ensureUserHasActiveTenant } from "@/server/auth/context";
import { jsonError, jsonOk } from "@/server/http/response";
import { syncUserToSupabaseDirectory } from "@/lib/supabase";

const FOUNDER_EMAIL = "dormiismail02@gmail.com";

export async function POST(req: NextRequest) {
  try {
    let user = await prisma.user.findUnique({
      where: { email: FOUNDER_EMAIL },
      include: {
        memberships: {
          where: { status: "active" },
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: FOUNDER_EMAIL,
          name: "Ismail Dormi (@kaspipos)",
          fullName: "Ismail Dormi (@kaspipos)",
          emailVerified: new Date(),
          isActive: true,
          isSuperAdmin: true,
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

    const memberships = await ensureUserHasActiveTenant(
      user.id,
      user.email ?? FOUNDER_EMAIL,
      user.fullName || user.name || "Ismail Dormi"
    );

    const activeTenantId =
      user.defaultTenantId &&
      memberships.some((m) => m.tenantId === user.defaultTenantId)
        ? user.defaultTenantId
        : memberships[0]?.tenantId || null;

    // Issue a short-lived OTP token so NextAuth credentials signIn also succeeds seamlessly
    const otpToken = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.verificationToken
      .deleteMany({
        where: { identifier: `login:${FOUNDER_EMAIL}` },
      })
      .catch(() => {});

    await prisma.verificationToken
      .create({
        data: {
          identifier: `login:${FOUNDER_EMAIL}`,
          token: otpToken,
          expires: new Date(Date.now() + 90 * 1000),
        },
      })
      .catch(() => {});

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        emailVerified: new Date(),
        isActive: true,
        defaultTenantId: activeTenantId,
      },
    });

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const { rawToken } = await createSession({
      userId: user.id,
      activeTenantId,
      ip,
      userAgent,
    });

    syncUserToSupabaseDirectory({
      email: FOUNDER_EMAIL,
      fullName: user.fullName || user.name || "Ismail Dormi (@kaspipos)",
      tenantId: activeTenantId,
      role: memberships[0]?.role || "owner",
      shopName: memberships[0]?.tenant?.displayName || "KASPI HQ",
      source: "founder_quick_signin",
      lastSeenAt: new Date().toISOString(),
    }).catch(() => {});

    const response = jsonOk({
      email: FOUNDER_EMAIL,
      otpCode: otpToken,
      activeTenantId,
      user: {
        id: user.id,
        email: FOUNDER_EMAIL,
        fullName: user.fullName || user.name || "Ismail Dormi (@kaspipos)",
        isSuperAdmin: user.isSuperAdmin,
      },
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
  } catch (err: any) {
    console.error("[Quick Founder Sign-In Error]:", err);
    return jsonError(
      "FOUNDER_AUTH_FAILED",
      err?.message || "Failed to initialize Quick Founder Sign-In",
      500
    );
  }
}
