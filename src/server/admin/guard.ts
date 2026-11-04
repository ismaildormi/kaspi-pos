import { cookies, headers } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { getSessionByToken, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { AppError } from "@/server/http/response";

export async function checkSuperAdminUser() {
  try {
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : undefined;

    const token = tokenFromCookie || tokenFromHeader;
    if (!token) return null;

    const session = await getSessionByToken(token);
    if (!session || !session.user) return null;

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

    if (!user || !user.isActive || !user.isSuperAdmin) return null;
    return user;
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
