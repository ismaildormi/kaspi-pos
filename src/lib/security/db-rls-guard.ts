import { Prisma, PrismaClient } from "@prisma/client";

/**
 * KASPI POS — Database Multi-Tenant RLS Guard (Layer 2)
 *
 * Sets `app.current_tenant_id` inside a transaction before executing any
 * tenant-scoped database queries, ensuring mathematical Row-Level Security
 * isolation at the PostgreSQL engine level.
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertValidTenantUuid(tenantId: string): string {
  const trimmed = tenantId?.trim();
  if (!trimmed || !UUID_REGEX.test(trimmed)) {
    throw new Error("SECURITY_RLS_VIOLATION: Invalid or missing tenant UUID");
  }
  return trimmed;
}

export async function withTenantRlsContext<T>(
  prismaClient: PrismaClient,
  tenantId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const safeTenantId = assertValidTenantUuid(tenantId);

  return prismaClient.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${safeTenantId}, true)`;
    return callback(tx);
  });
}
