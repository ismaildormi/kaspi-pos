import "dotenv/config";
import { prisma } from "../src/server/db/prisma";
import {
  ensureUserHasActiveTenant,
  getSafeServerContext,
  setActiveTenantContext,
} from "../src/server/auth/context";

async function main() {
  console.log("=== [1/3] TESTING getSafeServerContext() FALLBACK OUTSIDE REQUEST SCOPE ===");
  const safeCtx = await getSafeServerContext();
  console.log(
    `✅ getSafeServerContext() returned valid context without throwing: tenant=${safeCtx.activeTenant.displayName} (${safeCtx.tenantId})`
  );

  console.log("\n=== [2/3] TESTING NON-SUPERADMIN RLS CONTEXT + DASHBOARD PRISMA QUERIES ===");
  // Simulate a non-SuperAdmin OTP user (isSuperAdmin: false) which previously triggered prismaRlsExtension
  setActiveTenantContext({
    tenantId: safeCtx.tenantId,
    userId: safeCtx.userId,
    isSuperAdmin: false,
  });

  const tenantId = safeCtx.tenantId;
  const [productsCount, salesCount, customersCount, salesAgg, recentMovements] =
    await Promise.all([
      prisma.product.count({ where: { tenantId } }),
      prisma.sale.count({ where: { tenantId, status: "completed" } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.sale.aggregate({
        where: { tenantId, status: "completed" },
        _sum: { grandTotal: true },
      }),
      prisma.inventoryMovement.findMany({
        where: { tenantId },
        take: 5,
      }),
    ]);

  console.log("✅ Non-SuperAdmin Dashboard & Inventory Queries Succeeded (0 Exceptions):", {
    productsCount,
    salesCount,
    customersCount,
    totalSalesMad: Number(salesAgg._sum.grandTotal || 0).toFixed(2),
    movementsLoaded: recentMovements.length,
  });

  console.log("\n=== [3/3] TESTING AUTO-PROVISIONING FOR OTP USER ===");
  const memberships = await ensureUserHasActiveTenant(
    safeCtx.userId,
    safeCtx.userEmail,
    safeCtx.userFullName
  );
  console.log(
    `✅ Active memberships verified: ${memberships.length} (Tenant: ${memberships[0]?.tenant.displayName})`
  );
}

main()
  .catch((err) => {
    console.error("❌ VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
