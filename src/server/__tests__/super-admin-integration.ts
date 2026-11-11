import { prisma } from "../db/prisma";
import { getAdminDashboardStats } from "../admin/stats";
import { hashPassword } from "../auth/password";
import { createSession } from "../auth/session";

async function runSuperAdminTests() {
  console.log(" Testing Super Admin Infrastructure & MRR Aggregation against PostgreSQL...");

  const testSuffix = Date.now().toString().slice(-6);

  // 1. Create a regular user
  const passwordHash = await hashPassword("password123");
  const regularUser = await prisma.user.create({
    data: {
      email: `regular_${testSuffix}@kasbi.ma`,
      fullName: "Regular Shop Manager",
      passwordHash,
      isSuperAdmin: false,
    },
  });

  // 2. Create a Super Admin user
  const superAdminUser = await prisma.user.create({
    data: {
      email: `owner_${testSuffix}@kasbi.ma`,
      fullName: "Platform SaaS Owner",
      passwordHash,
      isSuperAdmin: true,
    },
  });

  console.log(`- Regular User created: ${regularUser.email} (isSuperAdmin: ${regularUser.isSuperAdmin})`);
  console.log(`- Super Admin created: ${superAdminUser.email} (isSuperAdmin: ${superAdminUser.isSuperAdmin})`);

  // Verify Super Admin boolean in DB
  const checkAdmin = await prisma.user.findUnique({
    where: { id: superAdminUser.id },
    select: { isSuperAdmin: true },
  });
  if (!checkAdmin?.isSuperAdmin) {
    throw new Error("Super Admin status failed to persist in PostgreSQL");
  }
  console.log("✅ Super Admin role verified in database");

  // 3. Seed Plan & Subscription to test MRR calculation
  const plan = await prisma.plan.upsert({
    where: { code: "all-in-one-standard" },
    update: { price: 10.00 },
    create: {
      code: "all-in-one-standard",
      name: "Kasbi All-in-One $10/mo",
      price: 10.00,
      currency: "USD",
      interval: "monthly",
      limits: { max_stores: 3, max_users: 5 },
    },
  });

  const tenant = await prisma.tenant.create({
    data: {
      legalName: `Cafe Atlas SARL ${testSuffix}`,
      displayName: `Café Atlas ${testSuffix}`,
      slug: `cafe-atlas-${testSuffix}`,
      city: "Marrakech",
      ice: "001234567000088",
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      planCode: plan.code,
      provider: "mock",
      providerSubscriptionId: `sub_paddle_${testSuffix}`,
      status: "active",
      billingInterval: "monthly",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  console.log(`- Subscribed Tenant ${tenant.displayName} to Plan ${plan.name}`);

  // 4. Test Stats Aggregation
  const stats = await getAdminDashboardStats();
  console.log("\n Live Admin Stats Aggregated:");
  console.log(`  • Total Tenants: ${stats.totalTenants}`);
  console.log(`  • Active Subscriptions: ${stats.activeSubscriptions}`);
  console.log(`  • Monthly Recurring Revenue (MRR): $${stats.mrrUsd} USD`);
  console.log(`  • Platform GMV: ${stats.totalGmvMad} MAD`);

  if (stats.totalTenants < 1) throw new Error("Expected at least 1 tenant in stats");
  if (stats.activeSubscriptions < 1) throw new Error("Expected at least 1 active subscription");
  if (parseFloat(stats.mrrUsd) < 10) throw new Error(`Expected MRR >= $10.00, got ${stats.mrrUsd}`);

  const foundTenant = stats.tenants.find((t) => t.id === tenant.id);
  if (!foundTenant) throw new Error("Newly created tenant not found in admin tenants list");
  if (foundTenant.subscription?.status !== "active") {
    throw new Error(`Expected active subscription, got ${foundTenant.subscription?.status}`);
  }

  console.log(`✅ Tenant ${foundTenant.displayName} correctly listed with Active status and $10/mo MRR contribution`);
  console.log("\n SUPER ADMIN INFRASTRUCTURE & METRICS VERIFIED!");
}

runSuperAdminTests()
  .catch((err) => {
    console.error("❌ Super admin test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
