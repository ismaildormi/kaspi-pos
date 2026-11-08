import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma, PrismaClient } from "@prisma/client";

export interface TenantRlsContext {
  tenantId?: string;
  userId?: string;
  isSuperAdmin?: boolean;
}

export const tenantStorage = new AsyncLocalStorage<TenantRlsContext>();

export function setActiveTenantContext(context: TenantRlsContext): void {
  try {
    tenantStorage.enterWith(context);
  } catch {
    // Ignore AsyncLocalStorage context warnings in edge/serverless runtimes
  }
}

export function runWithTenantContext<T>(
  context: TenantRlsContext,
  callback: () => T
): T {
  return tenantStorage.run(context, callback);
}

export function getActiveTenantContext(): TenantRlsContext | undefined {
  return tenantStorage.getStore();
}

/**
 * Prisma Client Extension for multi-tenant context tracking.
 * Avoids wrapping `query(args)` inside an array `$transaction([...])` because
 * `$allOperations` `query(args)` returns a standard Promise rather than a PrismaPromise,
 * which previously caused runtime exceptions for non-SuperAdmin users on Neon Pooler.
 */
export function prismaRlsExtension() {
  return Prisma.defineExtension((client) =>
    client.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            return query(args);
          },
        },
      },
    })
  );
}

export function extendPrismaWithRls(baseClient: PrismaClient): PrismaClient {
  return baseClient.$extends(prismaRlsExtension()) as unknown as PrismaClient;
}
