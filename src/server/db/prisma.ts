import { PrismaClient } from "@prisma/client";
import { extendPrismaWithRls } from "./rls";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Ensures serverless PostgreSQL connection strings (e.g. Neon Pooler)
 * always enforce pgbouncer=true and connection_limit=1 to prevent
 * "Too many connections" exhaustion across concurrent serverless invocations.
 */
function buildPooledDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  if (rawUrl.includes("-pooler") && !rawUrl.includes("pgbouncer=true")) {
    const separator = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${separator}pgbouncer=true&connection_limit=1`;
  }

  return rawUrl;
}

function createRlsPrismaClient(): PrismaClient {
  const datasourceUrl = buildPooledDatabaseUrl();
  const baseClient = new PrismaClient({
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  return extendPrismaWithRls(baseClient);
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createRlsPrismaClient();

globalForPrisma.prisma = prisma;
