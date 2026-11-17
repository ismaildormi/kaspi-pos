// scripts/test-poste-seat-lifecycle.mjs
// Automated verification script simulating the exact 1-Poste Hardware Binding,
// Dual-Device Conflict Lockdown, Clean Shutdown Grace Recovery, and SuperAdmin Ticket Lifecycle.

import { prisma } from "../src/server/db/prisma.ts";
import {
  verifyPosteSession,
  handleCleanSessionClose,
  resolveConflictTicket,
} from "../src/server/devices/poste-binding-engine.ts";

async function runSimulation() {
  console.log("=== KASPI 1-POSTE HARDWARE BINDING & CONFLICT LIFECYCLE SIMULATION ===\n");

  // 1. Get or create a test tenant
  let tenant = await prisma.tenant.findFirst({
    where: { maxDevices: 1 },
    select: { id: true, displayName: true, maxDevices: true },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        legalName: "Test Hardware Store SARL",
        displayName: "Boutique Test Hardware",
        slug: `test-hw-${Date.now()}`,
        maxDevices: 1,
      },
    });
  }

  console.log(`[TEST TENANT]: ${tenant.displayName} (ID: ${tenant.id}, Max Devices: ${tenant.maxDevices})`);

  // Clean previous test bindings
  await prisma.supportConflictTicket.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.posteBinding.deleteMany({ where: { tenantId: tenant.id } });

  const PC1_FP = "tauri_pc1_hardware_hash_778899aabbcc";
  const PC2_FP = "hw_pc2_browser_unauthorized_11223344";

  // STEP 1: PC #1 Activates Slot #1 Cleanly
  console.log("\n--- STEP 1: PC #1 activates Slot #1 ---");
  const step1 = await verifyPosteSession({
    tenantId: tenant.id,
    fingerprint: PC1_FP,
    deviceName: "Windows 11 POS (Station 1)",
    os: "windows",
  });
  console.log("PC #1 Status:", step1.status, "| isPrimary:", step1.isPrimary, "| Strikes:", step1.strikes);
  if (step1.status !== "ACTIVE" || !step1.isPrimary) {
    throw new Error("Step 1 failed: PC #1 should be ACTIVE and isPrimary");
  }

  // STEP 2: PC #2 attempts login on 1-Poste Quota -> INSTANT DUAL_LOCKDOWN
  console.log("\n--- STEP 2: PC #2 attempts login on 1-Poste quota ---");
  const step2 = await verifyPosteSession({
    tenantId: tenant.id,
    fingerprint: PC2_FP,
    deviceName: "Laptop Cashier Attempt (PC #2)",
    os: "macos",
  });
  console.log("PC #2 Status:", step2.status, "| isPrimary:", step2.isPrimary, "| Strikes:", step2.strikes);
  if (step2.status !== "DUAL_LOCKDOWN" || step2.strikes !== 1) {
    throw new Error("Step 2 failed: PC #2 should trigger DUAL_LOCKDOWN with strike count 1");
  }

  // Check PC #1 status now: should also report DUAL_LOCKDOWN
  const step2CheckPC1 = await verifyPosteSession({
    tenantId: tenant.id,
    fingerprint: PC1_FP,
    deviceName: "Windows 11 POS (Station 1)",
    os: "windows",
  });
  console.log("PC #1 Status during conflict:", step2CheckPC1.status);
  if (step2CheckPC1.status !== "DUAL_LOCKDOWN") {
    throw new Error("Step 2 failed: PC #1 must also be in DUAL_LOCKDOWN during active conflict");
  }

  // STEP 3: Clean Shutdown Beacon from PC #2
  console.log("\n--- STEP 3: Both devices shut down; PC #2 sends clean close beacon ---");
  await handleCleanSessionClose(tenant.id, PC2_FP);
  console.log("PC #2 session_close beacon processed.");

  // STEP 4: PC #1 Powers back on CLEANLY ALONE -> Grace Recovery!
  console.log("\n--- STEP 4: PC #1 powers on alone -> Automatic Grace Recovery ---");
  const step4 = await verifyPosteSession({
    tenantId: tenant.id,
    fingerprint: PC1_FP,
    deviceName: "Windows 11 POS (Station 1)",
    os: "windows",
  });
  console.log("PC #1 Grace Recovery Status:", step4.status, "| graceRecovered:", step4.graceRecovered, "| Strikes:", step4.strikes);
  if (step4.status !== "ACTIVE" || !step4.graceRecovered) {
    throw new Error("Step 4 failed: PC #1 must recover cleanly to ACTIVE via customer grace");
  }

  // STEP 5: PC #2 Attempts Reconnect Again -> Immediate Re-Lock!
  console.log("\n--- STEP 5: PC #2 attempts reconnect again -> Immediate Re-Lock ---");
  const step5 = await verifyPosteSession({
    tenantId: tenant.id,
    fingerprint: PC2_FP,
    deviceName: "Laptop Cashier Attempt (PC #2)",
    os: "macos",
  });
  console.log("PC #2 Status:", step5.status, "| Strikes:", step5.strikes);
  if (step5.status !== "DUAL_LOCKDOWN" || step5.strikes !== 2) {
    throw new Error("Step 5 failed: Repeated PC #2 connection must immediately re-lock with strike 2");
  }

  // STEP 6: 3rd Strike -> Escalation to HARD_ADMIN_LOCK!
  console.log("\n--- STEP 6: 3rd strike attempt -> Escalates to HARD_ADMIN_LOCK ---");
  const step6 = await verifyPosteSession({
    tenantId: tenant.id,
    fingerprint: PC2_FP,
    deviceName: "Laptop Cashier Attempt (PC #2)",
    os: "macos",
  });
  console.log("PC #2 Status after strike 3:", step6.status, "| Strikes:", step6.strikes);
  if (step6.status !== "HARD_ADMIN_LOCK" || step6.strikes !== 3) {
    throw new Error("Step 6 failed: 3rd strike must trigger HARD_ADMIN_LOCK");
  }

  // Even if PC #2 cleanly shuts down, HARD_ADMIN_LOCK disables reboot grace!
  await handleCleanSessionClose(tenant.id, PC2_FP);
  const step6CheckGraceBlocked = await verifyPosteSession({
    tenantId: tenant.id,
    fingerprint: PC1_FP,
    deviceName: "Windows 11 POS (Station 1)",
    os: "windows",
  });
  console.log("PC #1 Status under HARD_ADMIN_LOCK (Grace should be BLOCKED):", step6CheckGraceBlocked.status);
  if (step6CheckGraceBlocked.status !== "HARD_ADMIN_LOCK") {
    throw new Error("Step 6 failed: Reboot grace must be completely disabled under HARD_ADMIN_LOCK");
  }

  // STEP 7: Merchant files Support Conflict Ticket with Screenshot
  console.log("\n--- STEP 7: Filing SupportConflictTicket with screenshot ---");
  const ticket = await prisma.supportConflictTicket.create({
    data: {
      tenantId: tenant.id,
      posteBindingId: step1.bindingId,
      conflictReason: "HARD_ADMIN_LOCK_EXCEEDED",
      screenshotData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      merchantNote: "Bonjour support, notre caissier a ouvert par erreur sur son ordi personnel. Nous voulons débloquer la caisse principale.",
      strikeCount: 3,
      status: "OPEN",
    },
  });
  console.log("Ticket Created ID:", ticket.id, "| Status:", ticket.status);

  // STEP 8: SuperAdmin Resolves Ticket via UNLOCK_PRIMARY
  console.log("\n--- STEP 8: SuperAdmin resolves ticket (UNLOCK_PRIMARY) ---");
  const res = await resolveConflictTicket(ticket.id, "UNLOCK_PRIMARY", "Vérification effectuée avec le commerçant par téléphone.");
  console.log("Admin Resolution Result:", res);

  const finalCheckPC1 = await verifyPosteSession({
    tenantId: tenant.id,
    fingerprint: PC1_FP,
    deviceName: "Windows 11 POS (Station 1)",
    os: "windows",
  });
  console.log("PC #1 Final Status after Admin Resolution:", finalCheckPC1.status, "| Strikes:", finalCheckPC1.strikes);
  if (finalCheckPC1.status !== "ACTIVE" || finalCheckPC1.strikes !== 0) {
    throw new Error("Step 8 failed: PC #1 must be ACTIVE with strikes reset to 0");
  }

  console.log("\n========================================================");
  console.log("🎉 [LIFECYCLE TEST PASSED] All 8 seat-integrity phases verified with 100% mathematical fidelity!");
}

runSimulation()
  .catch((err) => {
    console.error("❌ Simulation Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
