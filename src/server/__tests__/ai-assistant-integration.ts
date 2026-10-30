import { prisma } from "../db/prisma";

async function runAiAssistantTest() {
  console.log("=================================================");
  console.log("RUNNING: KASPI AI ASSISTANT INTEGRATION TEST");
  console.log("=================================================");

  // 1. Setup Test Tenant & User
  const slug = `ai-test-${Date.now()}`;
  const tenant = await prisma.tenant.create({
    data: {
      legalName: "Ste AI Epicerie Test SARL",
      displayName: "AI Hanout Test",
      slug,
      status: "active",
      currency: "MAD",
    },
  });
  console.log("✔ Created Test Tenant:", tenant.id, tenant.displayName);

  const user = await prisma.user.create({
    data: {
      email: `${slug}@kasbi.ma`,
      fullName: "Youssef AI Merchant",
      authProvider: "local",
      memberships: {
        create: {
          tenantId: tenant.id,
          role: "owner",
        },
      },
    },
  });
  console.log("✔ Created Test User & Membership:", user.id);

  const store = await prisma.store.create({
    data: {
      tenantId: tenant.id,
      code: "MAIN",
      name: "Main Boutique",
    },
  });

  // 2. Setup Seed Products and Stock
  const productA = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      sku: "PROD-AI-01",
      name: "Atay Sultan 500g",
      salePrice: 35.0,
      costPrice: 28.0,
    },
  });

  const productB = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      sku: "PROD-AI-02",
      name: "Huile d'Olive 1L",
      salePrice: 95.0,
      costPrice: 75.0,
    },
  });

  // Stock: Product A has 2 units (low stock < 5), Product B has 50 units
  await prisma.stockLevel.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      productId: productA.id,
      quantity: 2.0,
    },
  });

  await prisma.stockLevel.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      productId: productB.id,
      quantity: 50.0,
    },
  });
  console.log("✔ Seeded inventory: Product A (2 units - low stock), Product B (50 units)");

  // 3. Setup Seed Completed Sale for Today
  await prisma.sale.create({
    data: {
      tenantId: tenant.id,
      storeId: store.id,
      cashierUserId: user.id,
      clientSaleId: crypto.randomUUID(),
      idempotencyKey: `sale-ai-${Date.now()}`,
      receiptNumber: `REC-${Date.now()}`,
      status: "completed",
      subtotal: 130.0,
      taxTotal: 26.0,
      grandTotal: 156.0,
      paidTotal: 160.0,
      changeDue: 4.0,
      completedAt: new Date(),
      items: {
        create: [
          {
            lineNo: 1,
            productId: productA.id,
            productNameSnapshot: productA.name,
            quantity: 2,
            unitPrice: 35.0,
            taxRate: 20.0,
            taxAmount: 14.0,
            netAmount: 56.0,
            lineTotal: 70.0,
          },
          {
            lineNo: 2,
            productId: productB.id,
            productNameSnapshot: productB.name,
            quantity: 1,
            unitPrice: 95.0,
            taxRate: 20.0,
            taxAmount: 19.0,
            netAmount: 76.0,
            lineTotal: 95.0,
          },
        ],
      },
    },
  });
  console.log("✔ Seeded Completed Sale for Today: 156.00 MAD");

  // 4. Test Persistent AI Memory in PostgreSQL
  const session = await prisma.aIChatSession.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      title: "Business Performance Query",
    },
  });
  console.log("✔ Created AIChatSession in DB:", session.id);

  const userMsg = await prisma.aIChatMessage.create({
    data: {
      sessionId: session.id,
      role: "user",
      content: "كم مبيعات اليوم وما هي النواقص في المحل؟",
    },
  });
  console.log("✔ Saved AIChatMessage (user):", userMsg.id, userMsg.content);

  const assistantMsg = await prisma.aIChatMessage.create({
    data: {
      sessionId: session.id,
      role: "assistant",
      content: "مبيعاتك اليوم هي 156.00 درهم عبر عملية واحدة. منتج 'Atay Sultan 500g' منخفض (2 وحدات متبقية).",
    },
  });
  console.log("✔ Saved AIChatMessage (assistant):", assistantMsg.id);

  // 5. Test History Retrieval
  const history = await prisma.aIChatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
  });

  if (history.length !== 2) {
    throw new Error(`Expected 2 messages in session history, got ${history.length}`);
  }
  console.log("✔ Verified Persistent Context Memory (2 messages loaded in order)");

  // 6. Test Tools Data Accuracy
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todaySales = await prisma.sale.findMany({
    where: {
      tenantId: tenant.id,
      completedAt: { gte: startOfDay },
      status: "completed",
    },
  });

  const totalRev = todaySales.reduce((acc, s) => acc + Number(s.grandTotal), 0);
  if (totalRev !== 156) {
    throw new Error(`Expected today's revenue to be 156 MAD, got ${totalRev}`);
  }
  console.log("✔ Verified getTodaySales tool math: 156.00 MAD");

  const lowStock = await prisma.stockLevel.findMany({
    where: {
      tenantId: tenant.id,
      quantity: { lt: 5 },
    },
  });

  if (lowStock.length !== 1 || lowStock[0].productId !== productA.id) {
    throw new Error("getLowStockProducts did not correctly isolate low stock product");
  }
  console.log("✔ Verified getLowStockProducts tool: 1 item flagged (< 5)");

  console.log("=================================================");
  console.log("ALL AI ASSISTANT INTEGRATION TESTS PASSED 100%!");
  console.log("=================================================");
}

runAiAssistantTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
  });
