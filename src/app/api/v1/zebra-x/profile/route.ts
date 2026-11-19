import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { SESSION_COOKIE_NAME } from "@/server/auth/session";

export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 3) return `${local[0] || "*"}**@${domain}`;
  return `${local.slice(0, 3)}${"*".repeat(Math.min(8, Math.max(3, local.length - 5)))}${local.slice(-2)}@${domain}`;
}

export async function GET() {
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    if (!ctx.userId) {
      return NextResponse.json({ ok: true, authenticated: false });
    }
    const [user, sessions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: ctx.userId },
        select: {
          id: true,
          name: true,
          fullName: true,
          email: true,
          phone: true,
          createdAt: true,
          accounts: { select: { provider: true } },
        },
      }),
      prisma.session.findMany({
        where: { userId: ctx.userId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          userAgent: true,
          ip: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ ok: true, authenticated: false });
    }

    const safeEmail = user.email || "";

    return NextResponse.json({
      ok: true,
      authenticated: true,
      profile: {
        id: user.id,
        name: user.fullName || user.name || safeEmail.split("@")[0] || "Developer",
        maskedEmail: maskEmail(safeEmail),
        email: safeEmail,
        phone: user.phone || null,
        googleConnected:
          user.accounts.some((a) => a.provider === "google") ||
          safeEmail.endsWith("@gmail.com"),
        createdAt: user.createdAt.toISOString(),
        devices: sessions.map((s) => ({
          id: s.id,
          deviceLabel: (s.userAgent || "Web Browser").slice(0, 72),
          ipAddress: s.ip || "Unknown",
          createdAt: s.createdAt.toISOString(),
          expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
        })),
      },
    });
  } catch {
    return NextResponse.json({ ok: true, authenticated: false });
  }
}

const ProfileActionSchema = z.object({
  action: z.enum(["logout", "revoke_device", "update_name"]),
  sessionId: z.string().uuid().optional(),
  name: z.string().min(1).max(80).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    if (!ctx.userId) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const parsed = ProfileActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid profile action" }, { status: 400 });
    }

    if (parsed.data.action === "logout") {
      await prisma.session.deleteMany({ where: { userId: ctx.userId } });
      const res = NextResponse.json({ ok: true, loggedOut: true });
      res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
      return res;
    }

    if (parsed.data.action === "revoke_device" && parsed.data.sessionId) {
      await prisma.session.deleteMany({
        where: { id: parsed.data.sessionId, userId: ctx.userId },
      });
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.action === "update_name" && parsed.data.name) {
      await prisma.user.update({
        where: { id: ctx.userId },
        data: { fullName: parsed.data.name.trim(), name: parsed.data.name.trim() },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "No action executed" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Action failed" }, { status: 500 });
  }
}
