import { cookies, headers } from "next/headers";
import { getSessionByToken, SESSION_COOKIE_NAME } from "./session";
import { AppError } from "../http/response";
import { UserRole } from "@prisma/client";

export interface RequestContext {
  userId: string;
  userEmail: string;
  userFullName: string;
  sessionId: string;
  tenantId: string;
  role: UserRole;
  storeIds: string[]; // empty means all stores
  activeTenant: {
    id: string;
    legalName: string;
    displayName: string;
    slug: string;
    currency: string;
    timezone: string;
    locale: string;
    pricesIncludeTax: boolean;
    allowNegativeStock: boolean;
  };
}

export async function getRequestContext(
  options: { requireTenant?: boolean } = { requireTenant: true }
): Promise<RequestContext> {
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const session = await getSessionByToken(token);
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Session expired or invalid", 401);
  }

  const user = session.user;
  const memberships = user.memberships;

  if (memberships.length === 0) {
    throw new AppError("NO_MEMBERSHIP", "User has no active shop memberships", 403);
  }

  // Resolve active membership:
  // 1. If session has activeTenantId, find that membership
  // 2. Otherwise default to user's defaultTenantId or first active membership
  let activeMembership = session.activeTenantId
    ? memberships.find((m) => m.tenantId === session.activeTenantId)
    : undefined;

  if (!activeMembership) {
    activeMembership =
      memberships.find((m) => m.tenantId === user.defaultTenantId) ??
      memberships[0];
  }

  if (options.requireTenant && !activeMembership) {
    throw new AppError(
      "TENANT_NOT_FOUND",
      "No valid active tenant membership found",
      403
    );
  }

  return {
    userId: user.id,
    userEmail: user.email ?? "",
    userFullName: user.fullName ?? user.name ?? "",
    sessionId: session.id,
    tenantId: activeMembership.tenantId,
    role: activeMembership.role,
    storeIds: activeMembership.storeIds,
    activeTenant: {
      id: activeMembership.tenant.id,
      legalName: activeMembership.tenant.legalName,
      displayName: activeMembership.tenant.displayName,
      slug: activeMembership.tenant.slug,
      currency: activeMembership.tenant.currency,
      timezone: activeMembership.tenant.timezone,
      locale: activeMembership.tenant.locale,
      pricesIncludeTax: activeMembership.tenant.pricesIncludeTax,
      allowNegativeStock: activeMembership.tenant.allowNegativeStock,
    },
  };
}
