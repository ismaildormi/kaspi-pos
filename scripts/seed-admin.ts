import { prisma } from "../src/server/db/prisma";
import { hashPassword } from "../src/server/auth/password";

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "dormiismail02@gmail.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "Admin@123456";

  console.log(`[Seed Admin] Preparing Super Admin account for: ${email}`);

  const passwordHash = await hashPassword(password);

  // 1. Ensure Tenant exists
  let tenant = await prisma.tenant.findFirst({
    where: { status: "active" },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        legalName: "KASPI HQ Morocco",
        displayName: "KASPI HQ",
        slug: "kaspi-hq",
        city: "Casablanca",
        countryCode: "MA",
        currency: "MAD",
        timezone: "Africa/Casablanca",
        locale: "ar",
        status: "active",
        maxDevices: 10,
      },
    });
    console.log(`[Seed Admin] Created default tenant: ${tenant.id}`);
  }

  // 2. Ensure Store exists
  let store = await prisma.store.findFirst({
    where: { tenantId: tenant.id },
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        tenantId: tenant.id,
        code: "HQ-01",
        name: "Magasin Principal HQ",
        isActive: true,
      },
    });
    console.log(`[Seed Admin] Created default store: ${store.id}`);
  }

  // 3. Upsert Super Admin User
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isSuperAdmin: true,
      isActive: true,
      fullName: "Ismail Dormi (Super Admin)",
      defaultTenantId: tenant.id,
    },
    create: {
      authProvider: "local",
      providerSubject: email,
      email,
      passwordHash,
      fullName: "Ismail Dormi (Super Admin)",
      defaultTenantId: tenant.id,
      isActive: true,
      isSuperAdmin: true,
    },
  });

  // 4. Ensure Tenant Membership
  const membership = await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id,
      },
    },
    update: {
      role: "owner",
      status: "active",
      storeIds: [store.id],
    },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: "owner",
      status: "active",
      storeIds: [store.id],
    },
  });

  console.log(`================================================================`);
  console.log(`✔ SUPER ADMIN READY:`);
  console.log(`  Email:       ${user.email}`);
  console.log(`  Password:    ${password}`);
  console.log(`  Super Admin: ${user.isSuperAdmin}`);
  console.log(`  Active:      ${user.isActive}`);
  console.log(`  Tenant:      ${tenant.displayName} (${tenant.id})`);
  console.log(`  Membership:  ${membership.role} (${membership.status})`);
  console.log(`================================================================`);
}

seedAdmin()
  .catch((err) => {
    console.error("[Seed Admin] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
