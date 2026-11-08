import { cookies, headers } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { getSessionByToken, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { auth } from "@/auth";
import { AppError } from "@/server/http/response";

export async function checkSuperAdminUser() {
  try {
    // 1. Check custom pos_session cookie or Bearer token
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : undefined;

    const token = tokenFromCookie || tokenFromHeader;
    if (token) {
      const session = await getSessionByToken(token);
      if (session && session.user) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            email: true,
            name: true,
            fullName: true,
            isSuperAdmin: true,
            isActive: true,
          },
        });

        if (user && user.isActive && user.isSuperAdmin) {
          return user;
        }
      }
    }

    // 2. Fallback check: NextAuth session (JWT session-token)
    const nextAuthSession = await auth().catch(() => null);
    if (nextAuthSession?.user?.id || nextAuthSession?.user?.email) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(nextAuthSession.user.id ? [{ id: nextAuthSession.user.id }] : []),
            ...(nextAuthSession.user.email ? [{ email: nextAuthSession.user.email }] : []),
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          fullName: true,
          isSuperAdmin: true,
          isActive: true,
        },
      });

      if (user && user.isActive && user.isSuperAdmin) {
        return user;
      }
    }

    return null;
  } catch (err) {
    console.error("[checkSuperAdminUser Error]:", err);
    return null;
  }
}

export async function getSuperAdminUser() {
  const user = await checkSuperAdminUser();
  if (!user) {
    throw new AppError("UNAUTHORIZED", "Super Admin authentication required", 401);
  }
  return user;
}
