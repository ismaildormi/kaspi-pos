import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/password";
import { createSession, SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http/response";

const LoginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", "Invalid login credentials", 400);
    }

    const { email, password } = parsed.data;

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

    if (!user || !user.passwordHash) {
      return jsonError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    if (!user.isActive) {
      return jsonError("USER_DISABLED", "Your account has been deactivated", 403);
    }

    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      return jsonError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    if (user.memberships.length === 0) {
      return jsonError("NO_MEMBERSHIP", "User has no active tenant memberships", 403);
    }

    const activeTenantId =
      user.defaultTenantId &&
      user.memberships.some((m) => m.tenantId === user.defaultTenantId)
        ? user.defaultTenantId
        : user.memberships[0].tenantId;

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
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
        fullName: user.fullName,
      },
      activeTenantId,
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
