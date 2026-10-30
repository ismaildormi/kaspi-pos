import { cookies, headers } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { getSessionByToken, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { AppError } from "@/server/http/response";

export async function getSuperAdminUser() {
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    throw new AppError("UNAUTHORIZED", "Super Admin authentication required", 401);
  }

  const session = await getSessionByToken(token);
  if (!session || !session.user) {
    throw new AppError("UNAUTHORIZED", "Session expired or invalid", 401);
  }

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

  if (!user || !user.isActive) {
    throw new AppError("UNAUTHORIZED", "User account disabled or deleted", 401);
  }

  if (!user.isSuperAdmin) {
    throw new AppError(
      "FORBIDDEN",
      "Access Denied: Platform Owner (Super Admin) privilege required",
      403
    );
  }

  return user;
}
