import { randomBytes } from "node:crypto";
import { prisma } from "../db/prisma";
import { createSession, getSessionByToken } from "./session";

const HANDOFF_PREFIX = "desktop_handoff:";

export async function createHandoffToken(params: {
  userId: string;
  email?: string;
  activeTenantId?: string | null;
  expiresInHours?: number;
}): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const identifier = `${HANDOFF_PREFIX}${params.userId}`;
  const hours = params.expiresInHours ?? 24 * 7; // 7 days validity
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000);

  // Clean up any stale handoff tokens for this user
  await prisma.verificationToken
    .deleteMany({
      where: { identifier },
    })
    .catch(() => {});

  // Store new handoff token
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return token;
}

export async function consumeHandoffToken(token: string): Promise<{
  success: boolean;
  sessionToken?: string;
  userId?: string;
  userEmail?: string | null;
  activeTenantId?: string | null;
  error?: string;
}> {
  if (!token || typeof token !== "string") {
    return { success: false, error: "Missing token" };
  }

  const cleanToken = token.trim();

  // 1. Look for desktop handoff verification token
  const record = await prisma.verificationToken.findFirst({
    where: {
      token: cleanToken,
      identifier: { startsWith: HANDOFF_PREFIX },
    },
  });

  if (record) {
    if (new Date() > record.expires) {
      await prisma.verificationToken
        .deleteMany({
          where: { token: cleanToken },
        })
        .catch(() => {});
      return { success: false, error: "Handoff token expired" };
    }

    const userId = record.identifier.slice(HANDOFF_PREFIX.length);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: "active" },
        },
      },
    });

    if (!user || !user.isActive) {
      return { success: false, error: "User account inactive or not found" };
    }

    const activeTenantId = user.defaultTenantId || user.memberships[0]?.tenantId || null;

    // Create a new permanent session for this desktop login
    const { rawToken } = await createSession({
      userId: user.id,
      activeTenantId,
      userAgent: "KASPI POS Desktop Shell",
    });

    // Clean up used token
    await prisma.verificationToken
      .deleteMany({
        where: { token: cleanToken },
      })
      .catch(() => {});

    return {
      success: true,
      sessionToken: rawToken,
      userId: user.id,
      userEmail: user.email,
      activeTenantId,
    };
  }

  // 2. Fallback: check if the token is already a valid sessionToken
  const existingSession = await getSessionByToken(cleanToken);
  if (existingSession && existingSession.user?.isActive) {
    return {
      success: true,
      sessionToken: cleanToken,
      userId: existingSession.userId,
      userEmail: existingSession.user.email,
      activeTenantId: existingSession.activeTenantId,
    };
  }

  return { success: false, error: "Invalid or consumed handoff token" };
}
