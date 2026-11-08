import "dotenv/config";
import crypto from "crypto";
import { prisma } from "../src/server/db/prisma";
import {
  calculateShiftMath,
  openCashShift,
  recordCashMovement,
  buildShiftSummary,
  closeCashShift,
} from "../src/server/cash-shift/engine";
import { toPrismaDecimal, toDecimal } from "../src/domain/money";

async function main() {
  console.log("==================================================================");
  console.log("  MODULE 1 LIVE VERIFICATION: CASH SHIFT & X/Z REPORT ENGINE");
  console.log("==================================================================\n");

  // 1. Deterministic Decimal.js Unit Test (Zero Floating-Point Error Check)
  console.log("1. Testing Pure Decimal.js Financial Math Engine...");
  const pureMath = calculateShiftMath({
    openingCash: "500.00",
    cashSalesTotal: "145.50",
    cardSalesTotal: "220.00",
    creditSalesTotal: "80.00",
    transferSalesTotal: "0.00",
    movements: [
      { type: "cash_in", amount: "50.00" },
      { type: "petty_cash", amount: "25.25" },
      { type: "supplier_payout", amount: "120.25" },
    ],
    countedCash: "545.00",
  });

  console.log("   -> Opening Float:      ", pureMath.openingCash.toFixed(2), "MAD");
  console.log("   -> Cash Sales:         ", pureMath.cashSalesTotal.toFixed(2), "MAD");
  console.log("   -> Card Sales:         ", pureMath.cardSalesTotal.toFixed(2), "MAD");
  console.log("   -> Credit Sales:       ", pureMath.creditSalesTotal.toFixed(2), "MAD");
  console.log("   -> Total Sales Revenue:", pureMath.totalSalesRevenue.toFixed(2), "MAD");
  console.log("   -> Cash In (+):        ", pureMath.cashInTotal.toFixed(2), "MAD");
  console.log("   -> Cash Out (-):       ", pureMath.cashOutTotal.toFixed(2), "MAD");
  console.log("   -> Expected Cash:      ", pureMath.expectedCash.toFixed(2), "MAD");
  console.log("   -> Counted Cash:       ", pureMath.countedCash?.toFixed(2), "MAD");
  console.log("   -> Discrepancy:        ", pureMath.discrepancy?.toFixed(2), "MAD", `(${pureMath.varianceStatus})`);

  if (
    pureMath.expectedCash !== 550.0 ||
    pureMath.discrepancy !== -5.0 ||
    pureMath.varianceStatus !== "shortage" ||
    pureMath.totalSalesRevenue !== 445.5
  ) {
    throw new Error(`Pure math verification failed: ${JSON.stringify(pureMath)}`);
  }
  console.log("   [PASS] Pure Decimal.js math verified with 0.00 rounding error.\n");

  // 2. Live Neon PostgreSQL Integration Verification
  console.log("2. Connecting to Neon PostgreSQL to verify live CashSession lifecycle...");
  const membership = await prisma.tenantMembership.findFirst({
    where: { status: "active" },
    include: {
      tenant: { include: { stores: { take: 1 } } },
      user: true,
    },
  });

  if (!membership || !membership.tenant.stores[0]) {
    throw new Error("No active tenant/store found in Neon PostgreSQL for live test.");
  }

  const tenantId = membership.tenantId;
  const userId = membership.userId;
  const userName = membership.user.fullName || membership.user.email || "Caissier Test";

  // Create an isolated temporary store for the test shift so we don't collide with any open production store session
  const tempStore = await prisma.store.create({
    data: {
      tenantId,
      name: `Caisse Test Shift ${Date.now()}`,
      code: `TST-${Date.now().toString().slice(-5)}`,
      isActive: true,
    },
  });

  let createdSessionId: string | null = null;
  const createdSaleIds: string[] = [];

  try {
    console.log(`   -> Using Tenant: ${membership.tenant.displayName} (${tenantId})`);
    console.log(`   -> Created Isolated Test Store: ${tempStore.name} (${tempStore.id})`);

    // Step 2A: Open Cash Shift with 500.00 MAD Float
    const openedSummary = await openCashShift({
      tenantId,
      storeId: tempStore.id,
      userId,
      openingCash: 500.0,
      openingNotes: "Fond de caisse matinal (Test Automatisé)",
    });
    createdSessionId = openedSummary.sessionId;
    console.log(`   -> Opened Shift ID: ${createdSessionId} | Status: ${openedSummary.status} | Float: ${openedSummary.openingCash.toFixed(2)} MAD`);

    // Step 2B: Simulate 2 Completed POS Sales (1 Cash Sale = 145.50 MAD, 1 Card Sale = 220.00 MAD) linked to the open shift
    const cashSale = await prisma.sale.create({
      data: {
        tenantId,
        storeId: tempStore.id,
        cashierUserId: userId,
        cashSessionId: createdSessionId,
        clientSaleId: crypto.randomUUID(),
        idempotencyKey: `idem-csh-${Date.now()}`,
        receiptNumber: `TEST-CSH-${Date.now()}`,
        status: "completed",
        subtotal: toPrismaDecimal(toDecimal("145.50")),
        discountTotal: toPrismaDecimal(toDecimal("0.00")),
        taxTotal: toPrismaDecimal(toDecimal("0.00")),
        grandTotal: toPrismaDecimal(toDecimal("145.50")),
        paidTotal: toPrismaDecimal(toDecimal("150.00")),
        changeDue: toPrismaDecimal(toDecimal("4.50")),
        paymentMethod: "cash",
        completedAt: new Date(),
      },
    });
    createdSaleIds.push(cashSale.id);

    const cardSale = await prisma.sale.create({
      data: {
        tenantId,
        storeId: tempStore.id,
        cashierUserId: userId,
        cashSessionId: createdSessionId,
        clientSaleId: crypto.randomUUID(),
        idempotencyKey: `idem-crd-${Date.now()}`,
        receiptNumber: `TEST-CRD-${Date.now()}`,
        status: "completed",
        subtotal: toPrismaDecimal(toDecimal("220.00")),
        discountTotal: toPrismaDecimal(toDecimal("0.00")),
        taxTotal: toPrismaDecimal(toDecimal("0.00")),
        grandTotal: toPrismaDecimal(toDecimal("220.00")),
        paidTotal: toPrismaDecimal(toDecimal("220.00")),
        changeDue: toPrismaDecimal(toDecimal("0.00")),
        paymentMethod: "card",
        completedAt: new Date(),
      },
    });
    createdSaleIds.push(cardSale.id);
    console.log("   -> Linked 2 POS Sales to Shift: Cash Sale (145.50 MAD) + Card Sale (220.00 MAD)");

    // Step 2C: Record 3 Mid-Day Cash Movements (Cash In +50.00, Petty Cash -25.25, Supplier Payout -120.25)
    await recordCashMovement({
      tenantId,
      sessionId: createdSessionId,
      userId,
      userName,
      type: "cash_in",
      amount: "50.00",
      reason: "Ajout de monnaie divisionnaire",
    });

    await recordCashMovement({
      tenantId,
      sessionId: createdSessionId,
      userId,
      userName,
      type: "petty_cash",
      amount: "25.25",
      reason: "Achat fournitures & eau (Dépense caisse)",
    });

    const xReportSummary = await recordCashMovement({
      tenantId,
      sessionId: createdSessionId,
      userId,
      userName,
      type: "supplier_payout",
      amount: "120.25",
      reason: "Paiement livreur pain/lait en espèces",
    });

    console.log("   -> Live X-Report Summary Computed from Neon PostgreSQL:");
    console.log(`      * Opening Cash:     ${xReportSummary.openingCash.toFixed(2)} MAD`);
    console.log(`      * Cash Sales:       ${xReportSummary.cashSalesTotal.toFixed(2)} MAD`);
    console.log(`      * Card Sales:       ${xReportSummary.cardSalesTotal.toFixed(2)} MAD`);
    console.log(`      * Cash In (+):      ${xReportSummary.cashInTotal.toFixed(2)} MAD`);
    console.log(`      * Cash Out (-):     ${xReportSummary.cashOutTotal.toFixed(2)} MAD`);
    console.log(`      * Expected Cash:    ${xReportSummary.expectedCash.toFixed(2)} MAD`);
    console.log(`      * Movements Logged: ${xReportSummary.movements.length}`);

    if (xReportSummary.expectedCash !== 550.0 || xReportSummary.movements.length !== 3) {
      throw new Error(`Live X-Report mismatch: ${JSON.stringify(xReportSummary)}`);
    }
    console.log("   [PASS] Live X-Report matches expected 550.00 MAD with 3 recorded movements.\n");

    // Step 2D: Close Cash Shift & Generate Z-Report with Counted Cash = 545.00 MAD (-5.00 MAD shortage)
    console.log("3. Closing Shift & Generating Final Immutable Z-Report...");
    const zReportSummary = await closeCashShift({
      tenantId,
      sessionId: createdSessionId,
      userId,
      countedCash: "545.00",
      closingNotes: "Écart de -5.00 DH constaté au comptage final",
    });

    console.log(`   -> Shift Status:       ${zReportSummary.status.toUpperCase()}`);
    console.log(`   -> Closed At:          ${zReportSummary.closedAt}`);
    console.log(`   -> Expected Cash:      ${zReportSummary.expectedCash.toFixed(2)} MAD`);
    console.log(`   -> Counted Cash:       ${zReportSummary.countedCash?.toFixed(2)} MAD`);
    console.log(`   -> Final Discrepancy:  ${zReportSummary.discrepancy?.toFixed(2)} MAD (${zReportSummary.varianceStatus})`);

    if (
      zReportSummary.status !== "closed" ||
      zReportSummary.countedCash !== 545.0 ||
      zReportSummary.discrepancy !== -5.0 ||
      zReportSummary.varianceStatus !== "shortage"
    ) {
      throw new Error(`Z-Report verification failed: ${JSON.stringify(zReportSummary)}`);
    }
    console.log("   [PASS] Z-Report persisted and verified in Neon PostgreSQL.\n");
  } finally {
    // Cleanup temporary test records
    console.log("4. Cleaning up temporary test records from Neon PostgreSQL...");
    if (createdSaleIds.length > 0) {
      await prisma.sale.deleteMany({ where: { id: { in: createdSaleIds } } });
    }
    if (createdSessionId) {
      await prisma.auditLog.deleteMany({ where: { entityId: createdSessionId } });
      await prisma.cashSession.delete({ where: { id: createdSessionId } });
    }
    await prisma.store.delete({ where: { id: tempStore.id } });
    console.log("   [PASS] Test store, sales, audit logs, and cash session cleaned up.");
  }

  console.log("\n==================================================================");
  console.log("  MODULE 1 VERIFICATION RESULT: 100% PASS (0 ERRORS)");
  console.log("==================================================================");
}

main()
  .catch((err) => {
    console.error("MODULE 1 VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
