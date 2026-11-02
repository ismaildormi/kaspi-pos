export { prisma } from "@/server/db/prisma";
export {
  prismaRlsExtension,
  tenantStorage,
  setActiveTenantContext,
  runWithTenantContext,
  getActiveTenantContext,
} from "@/server/db/rls";
