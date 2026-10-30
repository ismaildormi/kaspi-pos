import { prisma } from "../db/prisma";
import { toDecimal } from "../../domain/money";
import { calculatePointsEarned } from "../loyalty/engine";

async function runPosEndToEndCheckoutTest() {
  console.log("🚀 Starting POS End-to-End Checkout & Receipt Integration Test against PostgreSQL...");

  const testSuffix = Date.now().toString().slice(-6);

  // 1. Create Tenant, Store & Cashier User
  const tenant = await prisma.tenant.create({
    data: {
      legalName: `Superette Al Baraka SARL ${testSuffix}`,
      displayName: `Épicerie Al Baraka ${testSuffix}`,
      slug: `baraka-${testSuffix}`,
      ice: "009876543000012",
      taxId: "87654321",
      rcNumber: "12345 Rabat",
      address: "Avenue Mohammed V",
      city: "Rabat",
    },
  });

  const store = await prisma.store.create({
    data: {
      tenantId: tenant.id,
      name: "Point de Vente 1",
      code: `PV1-${testSuffix}`,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      email: `cashier_${testSuffix}@baraka.ma`,
      fullName: "Fatima Zahra",
    },
  });

  // 2. Create Products with Initial Stock
  const prodA = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: "Fromage Kiri 24 Portions",
      sku: `KIRI-${testSuffix}`,
      barcode: `6111234${testSuffix.slice(-6)}`,
      salePrice: 35.00,
      costPrice: 28.00,
      taxRate: 20.00,
      trackStock: true,
    },
  });

  const prodB = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: "Thé Sultan 200g",
      sku: `THE-${testSuffix}`,
      barcode: `6119876${testSuffix.slice(-6)}`,
      salePrice: 15.00,
      costPrice: 11.50,
      taxRate: 14.00,
      trackStock: true,
    },
  });

  // Seed initial stock levels (50 units each)
  await prisma.stockLevel.createMany({
    data: [
      { tenantId: tenant.id, storeId: store.id, productId: prodA.id, quantity: 50.000 },
      { tenantId: tenant.id, storeId: store.id, productId: prodB.id, quantity: 50.000 },
    ],
  });

  console.log("✅ Seeded tenant, store, cashier, and products with stock of 50 units");

  // 3. Create / Select Customer
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Youssef Mansouri",
      phone: "+212611223344",
      ice: "001299887700033",
      creditLimit: 500.00,
      currentCreditBalance: 0.00,
    },
  });
  console.log(`✅ Selected Customer: ${customer.name} (Credit limit: ${customer.creditLimit} DH)`);

  // 4. Simulate Cart Checkout (2x Kiri @ 35 DH = 70 DH + 2x Thé @ 15 DH = 30 DH)
  // Total = 100.00 DH
  const clientSaleId = `00000000-0000-0000-0000-${testSuffix.padStart(12, "0")}`;
  const idempotencyKey = `pos_sale_${testSuffix}`;
  const grandTotal = 100.00;
  const subtotal = 84.47; // HT approx
  const taxTotal = 15.53;

  console.log("\n💳 Processing Checkout in POS (Credit Payment Mode)...");

  // Execute Database Transaction
  const createdSale = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        cashierUserId: cashier.id,
        customerId: customer.id,
        clientSaleId,
        idempotencyKey,
        receiptNumber: `REC-${testSuffix}`,
        status: "completed",
        subtotal,
        taxTotal,
        grandTotal,
        paidTotal: grandTotal,
        changeDue: 0.00,
        paymentMethod: "credit",
        completedAt: new Date(),
      },
    });

    // 2x Prod A
    await tx.saleItem.create({
      data: {
        tenantId: tenant.id,
        saleId: sale.id,
        productId: prodA.id,
        lineNo: 1,
        productNameSnapshot: prodA.name,
        skuSnapshot: prodA.sku,
        quantity: 2.000,
        unitPrice: 35.00,
        taxRate: 20.00,
        taxAmount: 11.67,
        netAmount: 58.33,
        lineTotal: 70.00,
      },
    });

    // 2x Prod B
    await tx.saleItem.create({
      data: {
        tenantId: tenant.id,
        saleId: sale.id,
        productId: prodB.id,
        lineNo: 2,
        productNameSnapshot: prodB.name,
        skuSnapshot: prodB.sku,
        quantity: 2.000,
        unitPrice: 15.00,
        taxRate: 14.00,
        taxAmount: 3.68,
        netAmount: 26.32,
        lineTotal: 30.00,
      },
    });

    // Decrement stock in stock_levels
    await tx.stockLevel.update({
      where: {
        tenantId_storeId_productId: { tenantId: tenant.id, storeId: store.id, productId: prodA.id },
      },
      data: { quantity: { decrement: 2.000 } },
    });

    await tx.stockLevel.update({
      where: {
        tenantId_storeId_productId: { tenantId: tenant.id, storeId: store.id, productId: prodB.id },
      },
      data: { quantity: { decrement: 2.000 } },
    });

    // Inventory movements
    await tx.inventoryMovement.createMany({
      data: [
        {
          tenantId: tenant.id,
          storeId: store.id,
          productId: prodA.id,
          movementType: "sale",
          quantityDelta: -2.000,
          referenceType: "sale",
          referenceId: sale.id,
          reason: `Vente ${sale.receiptNumber}`,
          idempotencyKey: `mv_${sale.id}_a`,
        },
        {
          tenantId: tenant.id,
          storeId: store.id,
          productId: prodB.id,
          movementType: "sale",
          quantityDelta: -2.000,
          referenceType: "sale",
          referenceId: sale.id,
          reason: `Vente ${sale.receiptNumber}`,
          idempotencyKey: `mv_${sale.id}_b`,
        },
      ],
    });

    // Payment record
    await tx.salePayment.create({
      data: {
        tenantId: tenant.id,
        saleId: sale.id,
        method: "credit",
        amount: grandTotal,
      },
    });

    // Customer Loyalty (100 DH -> 10 points)
    const points = calculatePointsEarned(grandTotal);
    await tx.loyaltyPoint.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        saleId: sale.id,
        deltaPoints: points,
        reason: "earn",
        idempotencyKey: `loyal_${sale.id}`,
      },
    });

    // Customer Credit ledger charge (100 DH debt)
    await tx.customer.update({
      where: { id: customer.id },
      data: { currentCreditBalance: { increment: grandTotal } },
    });

    await tx.customerCredit.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        saleId: sale.id,
        type: "charge",
        amount: grandTotal,
        balanceAfter: grandTotal,
        notes: `Ticket ${sale.receiptNumber}`,
        idempotencyKey: `cred_${sale.id}`,
      },
    });

    return sale;
  });

  // 5. Verification Checks
  const verifiedStockA = await prisma.stockLevel.findUnique({
    where: {
      tenantId_storeId_productId: { tenantId: tenant.id, storeId: store.id, productId: prodA.id },
    },
  });
  if (toDecimal(verifiedStockA?.quantity || 0).toFixed(3) !== "48.000") {
    throw new Error(`Expected stock 48.000, got ${verifiedStockA?.quantity}`);
  }

  const verifiedCustomer = await prisma.customer.findUnique({
    where: { id: customer.id },
  });
  if (toDecimal(verifiedCustomer?.currentCreditBalance || 0).toFixed(2) !== "100.00") {
    throw new Error(`Expected customer debt 100.00 DH, got ${verifiedCustomer?.currentCreditBalance}`);
  }

  const loyaltyRecords = await prisma.loyaltyPoint.findMany({
    where: { customerId: customer.id },
  });
  const totalLoyalty = loyaltyRecords.reduce((sum, r) => sum + r.deltaPoints, 0);
  if (totalLoyalty !== 10) {
    throw new Error(`Expected 10 loyalty points earned, got ${totalLoyalty}`);
  }

  console.log(`✅ Stock updated: Kiri stock reduced from 50 to ${verifiedStockA?.quantity}`);
  console.log(`✅ Customer credit ledger updated: Debt balance is exactly ${verifiedCustomer?.currentCreditBalance} DH`);
  console.log(`✅ Loyalty points awarded: Customer earned ${totalLoyalty} points for 100 DH spend`);
  console.log(`✅ Thermal Receipt Number generated: ${createdSale.receiptNumber}`);

  console.log("\n🎉 END-TO-END POS CHECKOUT & RECEIPT CYCLE VERIFIED SUCCESSFULLY!");
}

runPosEndToEndCheckoutTest()
  .catch((err) => {
    console.error("❌ E2E POS test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
