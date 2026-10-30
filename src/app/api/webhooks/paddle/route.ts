import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getPaymentProvider } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const paddleProvider = getPaymentProvider("paddle");

    // 1. Parse and verify signature
    let eventPayload;
    try {
      eventPayload = await paddleProvider.handleWebhook(rawBody, headers);
    } catch (sigErr: any) {
      console.error("[Paddle Webhook] Signature verification failed:", sigErr.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { eventId, eventType, tenantId, status, subscriptionId, currentPeriodEnd, amount, currency } =
      eventPayload;

    // 2. Enforce Idempotency via WebhookEvent
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: "paddle",
          eventId,
        },
      },
    });

    if (existing && existing.status === "processed") {
      console.info(`[Paddle Webhook] Event ${eventId} already processed. Skipping duplicate.`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    // Record incoming webhook
    const webhookRecord = await prisma.webhookEvent.upsert({
      where: {
        provider_eventId: {
          provider: "paddle",
          eventId,
        },
      },
      create: {
        provider: "paddle",
        eventId,
        eventType,
        signatureValid: true,
        status: "received",
        payloadRedacted: eventPayload.rawPayload || {},
        tenantId: tenantId || null,
      },
      update: {
        status: "received",
        attempts: { increment: 1 },
      },
    });

    // 3. Atomically Update Subscription & Record Payment
    await prisma.$transaction(async (tx) => {
      // Find subscription either by providerSubscriptionId or by tenantId
      let sub = null;
      if (subscriptionId) {
        sub = await tx.subscription.findFirst({
          where: { provider: "paddle", providerSubscriptionId: subscriptionId },
        });
      }

      if (!sub && tenantId) {
        sub = await tx.subscription.findFirst({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
        });
      }

      if (sub) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            status: status || sub.status,
            provider: "paddle",
            providerSubscriptionId: subscriptionId || sub.providerSubscriptionId,
            currentPeriodEnd: currentPeriodEnd || sub.currentPeriodEnd,
            updatedAt: new Date(),
          },
        });
      } else if (tenantId) {
        // Ensure plan exists
        const plan = await tx.plan.findFirst();
        const planCode = plan?.code || "pro";

        sub = await tx.subscription.create({
          data: {
            tenantId,
            planCode,
            provider: "paddle",
            providerSubscriptionId: subscriptionId || `sub_${eventId}`,
            status: status || "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: currentPeriodEnd || new Date(Date.now() + 30 * 86400000),
          },
        });
      }

      // Record Payment if transaction was completed
      if (sub && amount && amount > 0) {
        await tx.payment.create({
          data: {
            tenantId: sub.tenantId,
            subscriptionId: sub.id,
            provider: "paddle",
            providerTransactionId: eventId,
            amount,
            currency: currency || "USD",
            status: "paid",
          },
        });
      }

      // Mark webhook processed
      await tx.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          status: "processed",
          processedAt: new Date(),
        },
      });
    });

    console.info(`[Paddle Webhook] Successfully processed event ${eventId} (${eventType})`);
    return NextResponse.json({ received: true, success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[Paddle Webhook Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal webhook error" },
      { status: 500 }
    );
  }
}
