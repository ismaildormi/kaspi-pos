import { PrismaClient } from "@prisma/client";
import { prismaRlsExtension } from "@/server/db/rls";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const baseClient = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  return baseClient.$extends(prismaRlsExtension()) as unknown as PrismaClient;
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
export {
  prismaRlsExtension,
  tenantStorage,
  setActiveTenantContext,
  runWithTenantContext,
  getActiveTenantContext,
} from "@/server/db/rls";
