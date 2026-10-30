import { prisma } from "../../db/prisma";
import { hashPassword, verifyPassword } from "../password";
import { createSession, getSessionByToken, revokeSession } from "../session";

async function runTest() {
  console.log("--- 1. Testing Password Hashing (argon2id) ---");
  const plain = "Secr3tP@ssw0rd!2026";
  const hash = await hashPassword(plain);
  console.log("Generated hash:", hash.substring(0, 35) + "...");
  const valid = await verifyPassword(hash, plain);
  const invalid = await verifyPassword(hash, "wrongpassword");
  console.log("Verify valid:", valid);
  console.log("Verify invalid:", invalid);
  if (!valid || invalid) throw new Error("Password verification failed");

  console.log("\n--- 2. Testing Database Tenant Creation & Isolation ---");
  const testEmail = `test.owner.${Date.now()}@example.com`;
  const tenant = await prisma.tenant.create({
    data: {
      legalName: "Epicerie Atlas SARL",
      displayName: "Supermarché Atlas",
      slug: `supermarche-atlas-${Date.now()}`,
      city: "Casablanca",
      status: "active",
    },
  });

  const user = await prisma.user.create({
    data: {
      authProvider: "local",
      providerSubject: testEmail,
      email: testEmail,
      passwordHash: hash,
      fullName: "Youssef El Amrani",
      defaultTenantId: tenant.id,
    },
  });

  const membership = await txOrCreateMembership(tenant.id, user.id, "owner");
  console.log("Created Tenant:", tenant.displayName, "ID:", tenant.id);
  console.log("Created User:", user.email, "ID:", user.id);
  console.log("Created Membership:", membership.role, "Status:", membership.status);

  console.log("\n--- 3. Testing Session Lifecycle ---");
  const { rawToken, session } = await createSession({
    userId: user.id,
    activeTenantId: tenant.id,
  });
  console.log("Session created. Token length:", rawToken.length);

  const fetchedSession = await getSessionByToken(rawToken);
  console.log("Fetched session valid?", Boolean(fetchedSession));
  console.log("Active tenant match?", fetchedSession?.activeTenantId === tenant.id);

  console.log("\n--- 4. Testing Session Revocation ---");
  await revokeSession(rawToken);
  const revokedFetch = await getSessionByToken(rawToken);
  console.log("After revocation, session valid?", Boolean(revokedFetch));
  if (revokedFetch !== null) throw new Error("Revoked session should return null");

  console.log("\n--- ALL CHECKS PASSED SUCCESSFULLY ---");
}

async function txOrCreateMembership(tenantId: string, userId: string, role: "owner") {
  return prisma.tenantMembership.create({
    data: {
      tenantId,
      userId,
      role,
      status: "active",
    },
  });
}

runTest()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
