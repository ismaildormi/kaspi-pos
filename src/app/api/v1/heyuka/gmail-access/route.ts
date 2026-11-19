import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { sendKaspiEmail } from "@/lib/email/mailer";
import { ensureUserHasActiveTenant } from "@/server/auth/context";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_DAYS,
} from "@/server/auth/session";
import { checkPlanetaryRateLimit } from "@/lib/heyuka/planetary/polyglot-cas-router";

export const dynamic = "force-dynamic";

const GmailAccessSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid Gmail or email address.")
    .transform((v) => v.toLowerCase()),
  fullName: z.string().trim().max(80).optional(),
  otpCode: z.string().trim().max(12).optional(),
});

export async function GET() {
  return NextResponse.json({
    ok: true,
    googleOAuthReady: Boolean(
      process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim()
    ),
  });
}

/**
 * 1-Step Standalone Gmail Access for HEYUKA Studio & API Keys:
 * Allows external users & developers to use HEYUKA AI and mint real API Keys
 * with just their Gmail — without needing to register a full KASPI POS shop.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rl = checkPlanetaryRateLimit(`heyuka_gmail:${ip}`, 8, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many access requests. Please retry in a minute." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = GmailAccessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Invalid email address." },
      { status: 400 }
    );
  }

  const { email, fullName, otpCode } = parsed.data;
  const userAgent = req.headers.get("user-agent") || "HEYUKA-Web";

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { status: "active" },
          include: { tenant: true },
        },
      },
    });

    // Returning accounts or full POS accounts MUST verify ownership via 6-digit email OTP
    if (existingUser) {
      if (!existingUser.isActive) {
        return NextResponse.json(
          { ok: false, error: "This account is currently disabled." },
          { status: 403 }
        );
      }

      const tokenIdentifier = `heyuka-gmail:${email}`;

      if (!otpCode) {
        const code = String(crypto.randomInt(100000, 999999));
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.verificationToken.deleteMany({
          where: { identifier: tokenIdentifier },
        });
        await prisma.verificationToken.create({
          data: {
            identifier: tokenIdentifier,
            token: code,
            expires,
          },
        });

        await sendKaspiEmail({
          to: email,
          type: "login_otp",
          code,
          title: "HEYUKA Access Verification Code",
          subject: "HEYUKA Access Verification Code",
          message:
            "Enter this 6-digit code in HEYUKA Studio to unlock your API keys and workspace.",
        }).catch(() => {});

        return NextResponse.json({
          ok: true,
          otpRequired: true,
          email,
          message: "Verification code dispatched to your email inbox.",
        });
      }

      const tokenRecord = await prisma.verificationToken.findFirst({
        where: {
          identifier: tokenIdentifier,
          token: otpCode,
        },
      });
      if (!tokenRecord || new Date() > tokenRecord.expires) {
        return NextResponse.json(
          { ok: false, error: "Invalid or expired verification code." },
          { status: 401 }
        );
      }

      await prisma.verificationToken.deleteMany({
        where: { identifier: tokenIdentifier },
      });

      const memberships =
        existingUser.memberships.length > 0
          ? existingUser.memberships
          : await ensureUserHasActiveTenant(
              existingUser.id,
              email,
              existingUser.fullName || existingUser.name
            );
      const activeTenantId = memberships[0]?.tenantId ?? existingUser.defaultTenantId;

      const { rawToken } = await createSession({
        userId: existingUser.id,
        activeTenantId,
        ip,
        userAgent,
      });

      const res = NextResponse.json({
        ok: true,
        authenticated: true,
        email,
        tenantId: activeTenantId,
        mode: "verified_existing",
      });
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: rawToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
      });
      return res;
    }

    // Brand-new standalone HEYUKA Gmail user: create isolated developer workspace without POS signup forms
    const localPart = email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 24) || "developer";
    const displayName = fullName || localPart;
    const uniqueSlug = `heyuka-${localPart.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

    const createdTenant = await prisma.tenant.create({
      data: {
        legalName: `HEYUKA Workspace (${displayName})`,
        displayName: `HEYUKA • ${displayName}`,
        slug: uniqueSlug,
        currency: "MAD",
        timezone: "Africa/Casablanca",
        locale: "en",
        status: "trialing",
        maxDevices: 2,
      },
    });

    const createdUser = await prisma.user.create({
      data: {
        email,
        name: displayName,
        fullName: displayName,
        authProvider: "heyuka_gmail",
        defaultTenantId: createdTenant.id,
        isActive: true,
        memberships: {
          create: {
            tenantId: createdTenant.id,
            role: "owner",
            status: "active",
            storeIds: [],
          },
        },
      },
    });

    const { rawToken } = await createSession({
      userId: createdUser.id,
      activeTenantId: createdTenant.id,
      ip,
      userAgent,
    });

    const res = NextResponse.json({
      ok: true,
      authenticated: true,
      email,
      tenantId: createdTenant.id,
      mode: "created_standalone_gmail",
    });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: rawToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unable to complete Gmail access." },
      { status: 500 }
    );
  }
}
