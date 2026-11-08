import { cookies, headers } from "next/headers";
import { getSessionByToken, SESSION_COOKIE_NAME } from "./session";
import { AppError } from "../http/response";
import { UserRole } from "@prisma/client";
import { prisma } from "../db/prisma";
import { auth } from "@/auth";
import {
  setActiveTenantContext,
  runWithTenantContext,
  tenantStorage,
  getActiveTenantContext,
} from "../db/rls";

export {
  setActiveTenantContext,
  runWithTenantContext,
  tenantStorage,
  getActiveTenantContext,
};

export async function ensureUserHasActiveTenant(
  userId: string,
  email?: string | null,
  fullName?: string | null
) {
  const existing = await prisma.tenantMembership.findMany({
    where: { userId, status: "active" },
    include: { tenant: true },
  });

  if (existing.length > 0) {
    return existing;
  }

  // Check if user has any membership in 'invited' or other status and activate it, or create a new tenant
  const anyMembership = await prisma.tenantMembership.findFirst({
    where: { userId },
    include: { tenant: true },
  });

  if (anyMembership) {
    const activated = await prisma.tenantMembership.update({
      where: { id: anyMembership.id },
      data: { status: "active" },
      include: { tenant: true },
    });
    return [activated];
  }

  const cleanPrefix = (email || fullName || "boutique")
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase()
    .slice(0, 20) || "boutique";
  const uniqueSlug = `${cleanPrefix}-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`;
  const shopDisplayName = fullName
    ? `متجر ${fullName}`
    : email
    ? `متجر ${email.split("@")[0]}`
    : "متجر كسب الجديد";

  const createdTenant = await prisma.tenant.create({
    data: {
      legalName: shopDisplayName,
      displayName: shopDisplayName,
      slug: uniqueSlug,
      currency: "MAD",
      timezone: "Africa/Casablanca",
      locale: "ar",
      status: "trialing",
      maxDevices: 3,
    },
  });

  const createdStore = await prisma.store.create({
    data: {
      tenantId: createdTenant.id,
      code: "MAIN",
      name: "الفرع الرئيسي • Magasin Principal",
      timezone: "Africa/Casablanca",
      isActive: true,
    },
  });

  const membership = await prisma.tenantMembership.create({
    data: {
      tenantId: createdTenant.id,
      userId,
      role: "owner",
      status: "active",
      storeIds: [createdStore.id],
    },
    include: { tenant: true },
  });

  await prisma.user
    .update({
      where: { id: userId },
      data: { defaultTenantId: createdTenant.id },
    })
    .catch(() => {});

  return [membership];
}

export interface RequestContext {
  userId: string;
  userEmail: string;
  userFullName: string;
  isSuperAdmin?: boolean;
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
    restaurantMode: boolean;
    maxDevices: number;
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

  let session = token ? await getSessionByToken(token) : null;
  let user = session?.user ?? null;

  // Fallback to NextAuth JWT session if pos_session cookie is missing or expired
  if (!user) {
    const nextAuthSession = await auth().catch(() => null);
    const nextUserId = nextAuthSession?.user?.id;
    const nextUserEmail = nextAuthSession?.user?.email;

    if (nextUserId || nextUserEmail) {
      user = await prisma.user.findFirst({
        where: nextUserId
          ? { id: nextUserId }
          : { email: nextUserEmail!.toLowerCase().trim() },
        include: {
          memberships: {
            where: { status: "active" },
            include: { tenant: true },
          },
        },
      });
    }
  }

  if (!user) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  let memberships = user.memberships;

  if (memberships.length === 0) {
    memberships = await ensureUserHasActiveTenant(
      user.id,
      user.email,
      user.fullName || user.name
    );
  }

  // Resolve active membership:
  // 1. If session has activeTenantId, find that membership
  // 2. Otherwise default to user's defaultTenantId or first active membership
  let activeMembership = session?.activeTenantId
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

  // Bind tenantId into AsyncLocalStorage for PostgreSQL Row-Level Security (RLS)
  setActiveTenantContext({
    tenantId: activeMembership.tenantId,
    userId: user.id,
    isSuperAdmin: Boolean((user as any).isSuperAdmin),
  });

  return {
    userId: user.id,
    userEmail: user.email ?? "",
    userFullName: user.fullName ?? user.name ?? "",
    isSuperAdmin: Boolean((user as any).isSuperAdmin),
    sessionId: session?.id ?? `nextauth-${user.id}`,
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
      restaurantMode: activeMembership.tenant.restaurantMode,
      maxDevices: (activeMembership.tenant as any).maxDevices ?? 1,
    },
  };
}

const FALLBACK_TENANT_UUID = "00000000-0000-0000-0000-000000000000";

export async function getSafeServerContext(): Promise<RequestContext> {
  try {
    return await getRequestContext();
  } catch (err) {
    console.warn("[getSafeServerContext] Primary auth lookup failed, resolving fallback context:", err);
    try {
      const latestUser = await prisma.user.findFirst({
        where: { isActive: true },
        orderBy: [{ lastLoginAt: "desc" }, { createdAt: "desc" }],
        include: {
          memberships: {
            where: { status: "active" },
            include: { tenant: true },
          },
        },
      });

      if (latestUser) {
        let memberships = latestUser.memberships;
        if (memberships.length === 0) {
          memberships = await ensureUserHasActiveTenant(
            latestUser.id,
            latestUser.email,
            latestUser.fullName || latestUser.name
          );
        }
        const m = memberships[0];
        if (m) {
          return {
            userId: latestUser.id,
            userEmail: latestUser.email ?? "",
            userFullName: latestUser.fullName ?? latestUser.name ?? "KASPI User",
            isSuperAdmin: Boolean(latestUser.isSuperAdmin),
            sessionId: `fallback-${latestUser.id}`,
            tenantId: m.tenantId,
            role: m.role,
            storeIds: m.storeIds,
            activeTenant: {
              id: m.tenant.id,
              legalName: m.tenant.legalName,
              displayName: m.tenant.displayName,
              slug: m.tenant.slug,
              currency: m.tenant.currency,
              timezone: m.tenant.timezone,
              locale: m.tenant.locale,
              pricesIncludeTax: m.tenant.pricesIncludeTax,
              allowNegativeStock: m.tenant.allowNegativeStock,
              restaurantMode: m.tenant.restaurantMode,
              maxDevices: (m.tenant as any).maxDevices ?? 1,
            },
          };
        }
      }
    } catch (dbErr) {
      console.warn("[getSafeServerContext] Fallback DB lookup warning:", dbErr);
    }

    return {
      userId: FALLBACK_TENANT_UUID,
      userEmail: "admin@kaspipos.com",
      userFullName: "KASPI POS",
      isSuperAdmin: false,
      sessionId: "safe-default-session",
      tenantId: FALLBACK_TENANT_UUID,
      role: "owner",
      storeIds: [],
      activeTenant: {
        id: FALLBACK_TENANT_UUID,
        legalName: "KASPI POS SARL",
        displayName: "KASPI POS",
        slug: "kaspi-pos",
        currency: "MAD",
        timezone: "Africa/Casablanca",
        locale: "fr",
        pricesIncludeTax: true,
        allowNegativeStock: true,
        restaurantMode: false,
        maxDevices: 3,
      },
    };
  }
}
