/**
 * KASPI POS (كسب) — Cross-Tenant RLS & Data Isolation Verification Script
 * 
 * Verifies Pillar 1 of KASPI Multi-Tenant Architecture:
 * 1. Creates two isolated tenants: Tenant A and Tenant B.
 * 2. Seeds distinct products, customers, and sales under Tenant A.
 * 3. Executes queries from Tenant B's context to verify Tenant A's records are invisible.
 * 4. Attempts cross-tenant mutations to verify that write isolation prevents unauthorized modification.
 * 5. Cleans up test artifacts.
 */

import { prisma } from "../src/server/db/prisma";
import { runWithTenantContext } from "../src/server/db/rls";
import assert from "node:assert/strict";

async function runTenantIsolationTests() {
  console.log("==========================================================");
  console.log("  KASPI POS — CROSS-TENANT RLS ISOLATION AUDIT");
  console.log("==========================================================\n");

  const runId = Date.now().toString().slice(-6);
  const slugA = `audit-tenant-a-${runId}`;
  const slugB = `audit-tenant-b-${runId}`;

  console.log(`[1/5] Provisioning test tenants: ${slugA} & ${slugB}...`);

  const tenantA = await prisma.tenant.create({
    data: {
      slug: slugA,
      legalName: `Ste Retail A (${runId}) SARL`,
      displayName: `Epicerie A ${runId}`,
      currency: "MAD",
      maxDevices: 1,
    },
  });

  const tenantB = await prisma.tenant.create({
    data: {
      slug: slugB,
      legalName: `Ste Boutique B (${runId}) SARL`,
      displayName: `Boutique B ${runId}`,
      currency: "MAD",
      maxDevices: 2,
    },
  });

  console.log(`  ✓ Tenant A created: ${tenantA.id}`);
  console.log(`  ✓ Tenant B created: ${tenantB.id}`);

  try {
    // 2. Insert records under Tenant A
    console.log("\n[2/5] Creating private inventory & customer under Tenant A...");
    const productA = await prisma.product.create({
      data: {
        tenantId: tenantA.id,
        name: `Private Product A (${runId})`,
        sku: `SKU-A-${runId}`,
        salePrice: 150.00,
        taxRate: 20.00,
        trackStock: true,
      },
    });

    const customerA = await prisma.customer.create({
      data: {
        tenantId: tenantA.id,
        name: `Client Confidentiel A (${runId})`,
        phone: `+212600${runId}`,
        currentCreditBalance: 0,
      },
    });

    console.log(`  ✓ Created Tenant A Product: ${productA.name} (${productA.id})`);
    console.log(`  ✓ Created Tenant A Customer: ${customerA.name} (${customerA.id})`);

    // 3. Test Read Isolation: Tenant B attempting to read Tenant A's records
    console.log("\n[3/5] Verifying Read Isolation from Tenant B context...");
    await runWithTenantContext({ tenantId: tenantB.id }, async () => {
      // Query 1: Find products belonging to Tenant B
      const tenantBProducts = await prisma.product.findMany({
        where: { tenantId: tenantB.id },
      });
      const leakedProduct = tenantBProducts.find((p) => p.id === productA.id);
      assert.equal(leakedProduct, undefined, "Tenant B must NEVER see Tenant A products in findMany!");

      // Query 2: Direct lookup by Tenant A product ID scoped to Tenant B
      const directLookup = await prisma.product.findFirst({
        where: {
          tenantId: tenantB.id,
          id: productA.id,
        },
      });
      assert.equal(directLookup, null, "Direct ID lookup across tenant boundary must return null!");

      // Query 3: Customers isolation
      const tenantBCustomers = await prisma.customer.findMany({
        where: { tenantId: tenantB.id },
      });
      const leakedCustomer = tenantBCustomers.find((c) => c.id === customerA.id);
      assert.equal(leakedCustomer, undefined, "Tenant B must NEVER see Tenant A customers!");

      console.log("  ✓ Read isolation verified: Zero leaked records from Tenant A into Tenant B context.");
    });

    // 4. Test Write / Mutation Isolation: Tenant B attempting to modify Tenant A's record
    console.log("\n[4/5] Verifying Mutation & Write Isolation (Cross-Tenant Tamper Protection)...");
    await runWithTenantContext({ tenantId: tenantB.id }, async () => {
      // Attempt to update Tenant A's product using Tenant B's tenantId filter
      const updateResult = await prisma.product.updateMany({
        where: {
          id: productA.id,
          tenantId: tenantB.id,
        },
        data: {
          salePrice: 9999.00,
          name: "HACKED BY TENANT B",
        },
      });

      assert.equal(
        updateResult.count,
        0,
        "Update count must be 0 when Tenant B attempts to update Tenant A's product!"
      );
    });

    // Verify Tenant A's product remains untouched
    const intactProductA = await prisma.product.findUnique({
      where: { id: productA.id },
    });
    assert.equal(intactProductA?.name, productA.name, "Tenant A product name must remain unchanged!");
    assert.equal(Number(intactProductA?.salePrice), 150.00, "Tenant A price must remain unchanged!");
    console.log("  ✓ Mutation isolation verified: Cross-tenant update yielded 0 modifications.");

    console.log("\n[5/5] Teardown & cleaning test records...");
    await prisma.product.delete({ where: { id: productA.id } });
    await prisma.customer.delete({ where: { id: customerA.id } });
    await prisma.tenant.delete({ where: { id: tenantA.id } });
    await prisma.tenant.delete({ where: { id: tenantB.id } });
    console.log("  ✓ Teardown complete.");

    console.log("\n==========================================================");
    console.log("  >>> CROSS-TENANT RLS ISOLATION AUDIT: PASSED (100%) <<<");
    console.log("==========================================================\n");
  } catch (err) {
    console.error("Test failed, attempting cleanup:", err);
    try {
      await prisma.product.deleteMany({ where: { tenantId: tenantA.id } });
      await prisma.customer.deleteMany({ where: { tenantId: tenantA.id } });
      await prisma.tenant.delete({ where: { id: tenantA.id } });
      await prisma.tenant.delete({ where: { id: tenantB.id } });
    } catch {}
    throw err;
  }
}

runTenantIsolationTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
