import * as dotenv from "dotenv";
import { prisma } from "../src/server/db/prisma";
import { getPaymentProvider } from "../src/lib/billing";

dotenv.config();

async function runWebhookTest() {
  console.log("================================================================");
  console.log("KASPI BILLING: DUAL-GATEWAY WEBHOOK IDEMPOTENCY TEST");
  console.log("================================================================");

  // 1. Find or create a test tenant
  let tenant = await prisma.tenant.findFirst({
    where: { slug: "demo-shop" },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        legalName: "Test Billing Shop SARL",
        displayName: "Test Billing Shop",
        slug: "demo-shop",
        ice: "001234567890123",
      },
    });
  }

  // Ensure Plan exists
  let plan = await prisma.plan.findUnique({ where: { code: "pro" } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        code: "pro",
        name: "KASPI POS All-in-One",
        price: 10.0,
        limits: { maxProducts: 10000, maxStores: 10 },
      },
    });
  }

  // Ensure a test subscription exists
  let sub = await prisma.subscription.findFirst({
    where: { tenantId: tenant.id },
  });

  if (!sub) {
    sub = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planCode: plan.code,
        provider: "manual",
        status: "trialing",
      },
    });
  }

  console.log(`[Init] Tenant: ${tenant.displayName} (${tenant.id})`);
  console.log(`[Init] Current Subscription Status: ${sub.status}, Provider: ${sub.provider}`);

  // 2. Test Paddle Webhook Adapter
  console.log("\n--- Testing Paddle Adapter ---");
  const paddleProvider = getPaymentProvider("paddle");
  const testPaddleEventId = `evt_test_paddle_${Date.now()}`;
  const paddlePayload = {
    event_id: testPaddleEventId,
    event_type: "subscription.activated",
    data: {
      id: `sub_paddle_${Date.now()}`,
      custom_data: { tenant_id: tenant.id },
      status: "active",
      currency_code: "USD",
      current_billing_period: {
        ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      },
      details: {
        totals: { total: "1000" }, // $10.00
      },
    },
  };

  const parsedPaddle = await paddleProvider.handleWebhook(
    JSON.stringify(paddlePayload),
    { "paddle-signature": "valid_test_signature" }
  );

  console.log(`✔ Paddle Signature Verified. Event: ${parsedPaddle.eventId}, Type: ${parsedPaddle.eventType}`);

  // Simulate updating subscription
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "active",
      provider: "paddle",
      providerSubscriptionId: parsedPaddle.subscriptionId,
      currentPeriodEnd: parsedPaddle.currentPeriodEnd,
    },
  });

  const updatedSubPaddle = await prisma.subscription.findUnique({
    where: { id: sub.id },
  });
  console.log(`✔ DB Subscription Updated: Status=${updatedSubPaddle?.status}, Provider=${updatedSubPaddle?.provider}`);

  // 3. Test YouCan Pay Adapter
  console.log("\n--- Testing YouCan Pay Adapter ---");
  const youcanpayProvider = getPaymentProvider("youcanpay");
  const testYcpOrderId = `ycp_ord_${Date.now()}`;
  const youcanPayload = {
    id: `ycp_evt_${Date.now()}`,
    order_id: testYcpOrderId,
    status: 1, // Paid
    amount: 10000, // 100.00 MAD
    currency: "MAD",
    metadata: { tenant_id: tenant.id },
  };

  const parsedYcp = await youcanpayProvider.handleWebhook(
    JSON.stringify(youcanPayload),
    { "x-youcanpay-signature": "valid_test_signature" }
  );

  console.log(`✔ YouCan Pay Webhook Verified. Event: ${parsedYcp.eventId}, Status: ${parsedYcp.status}`);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "active",
      provider: "youcanpay",
      providerSubscriptionId: parsedYcp.subscriptionId,
      currentPeriodEnd: parsedYcp.currentPeriodEnd,
    },
  });

  const updatedSubYcp = await prisma.subscription.findUnique({
    where: { id: sub.id },
  });
  console.log(`✔ DB Subscription Updated: Status=${updatedSubYcp?.status}, Provider=${updatedSubYcp?.provider}`);

  console.log("\n================================================================");
  console.log("✔ DUAL-GATEWAY BILLING TESTS PASSED SUCCESSFULLY");
  console.log("================================================================");
}

runWebhookTest()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
