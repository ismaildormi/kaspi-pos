import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";

export const SESSION_COOKIE_NAME = "pos_session";
export const SESSION_EXPIRY_DAYS = 30;

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(params: {
  userId: string;
  activeTenantId?: string | null;
  ip?: string;
  userAgent?: string;
}) {
  const rawToken = generateSessionToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      sessionToken: rawToken,
      expires: expiresAt,
      tokenHash,
      activeTenantId: params.activeTenantId ?? null,
      expiresAt,
      ip: params.ip,
      userAgent: params.userAgent,
    },
  });

  return { rawToken, session };
}

export async function getSessionByToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          memberships: {
            where: { status: "active" },
            include: {
              tenant: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Check expiration or revocation
  const isExpired = session.expires < new Date() || (session.expiresAt && session.expiresAt < new Date());
  if (session.revokedAt || isExpired) {
    return null;
  }

  // Check if user is active
  if (!session.user.isActive) {
    return null;
  }

  return session;
}

export async function revokeSession(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  try {
    await prisma.session.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Session might already be gone
  }
}
