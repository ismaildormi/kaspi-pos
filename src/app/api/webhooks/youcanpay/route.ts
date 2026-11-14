import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getPaymentProvider } from "@/lib/billing";
import {
  checkReplayWindow,
  logWebhookForensicEvidence,
  sanitizePciDssPayload,
} from "@/lib/security/webhook-verifier";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const youcanpayProvider = getPaymentProvider("youcanpay");

    // 1. Parse and verify signature
    let eventPayload;
    try {
      eventPayload = await youcanpayProvider.handleWebhook(rawBody, headers);
    } catch (sigErr: any) {
      console.error("[YouCan Pay Webhook] Signature verification failed:", sigErr.message);
      await logWebhookForensicEvidence({
        provider: "youcanpay",
        valid: false,
        reason: sigErr?.message || "Invalid signature",
        rawBody,
        headers,
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { eventId, eventType, tenantId, status, subscriptionId, currentPeriodEnd, amount, currency } =
      eventPayload;

    const replayCheck = checkReplayWindow(eventId);
    if (!replayCheck.ok) {
      return NextResponse.json({ received: true, duplicate: true, reason: replayCheck.reason }, { status: 200 });
    }

    await logWebhookForensicEvidence({
      provider: "youcanpay",
      valid: true,
      eventId,
      eventType,
      tenantId,
      rawBody,
      headers,
    });

    // 2. Enforce Idempotency via WebhookEvent
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: "youcanpay",
          eventId,
        },
      },
    });

    if (existing && existing.status === "processed") {
      console.info(`[YouCan Pay Webhook] Event ${eventId} already processed. Skipping duplicate.`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    // Record incoming webhook
    const webhookRecord = await prisma.webhookEvent.upsert({
      where: {
        provider_eventId: {
          provider: "youcanpay",
          eventId,
        },
      },
      create: {
        provider: "youcanpay",
        eventId,
        eventType,
        signatureValid: true,
        status: "received",
        payloadRedacted: sanitizePciDssPayload(eventPayload.rawPayload || {}) as any,
        tenantId: tenantId || null,
      },
      update: {
        status: "received",
        attempts: { increment: 1 },
      },
    });

    // 3. Atomically Update Subscription & Record Payment
    await prisma.$transaction(async (tx) => {
      let sub = null;
      if (subscriptionId) {
        sub = await tx.subscription.findFirst({
          where: { provider: "youcanpay", providerSubscriptionId: subscriptionId },
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
            status: status || "active",
            provider: "youcanpay",
            providerSubscriptionId: subscriptionId || sub.providerSubscriptionId,
            currentPeriodEnd: currentPeriodEnd || sub.currentPeriodEnd,
            updatedAt: new Date(),
          },
        });
      } else if (tenantId) {
        const plan = await tx.plan.findFirst();
        const planCode = plan?.code || "pro";

        sub = await tx.subscription.create({
          data: {
            tenantId,
            planCode,
            provider: "youcanpay",
            providerSubscriptionId: subscriptionId || `sub_${eventId}`,
            status: status || "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: currentPeriodEnd || new Date(Date.now() + 30 * 86400000),
          },
        });
      }

      if (sub && amount && amount > 0) {
        await tx.payment.create({
          data: {
            tenantId: sub.tenantId,
            subscriptionId: sub.id,
            provider: "youcanpay",
            providerTransactionId: eventId,
            amount,
            currency: currency || "MAD",
            status: "paid",
          },
        });
      }

      await tx.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          status: "processed",
          processedAt: new Date(),
        },
      });
    });

    console.info(`[YouCan Pay Webhook] Successfully processed event ${eventId} (${eventType})`);
    return NextResponse.json({ received: true, success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[YouCan Pay Webhook Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal webhook error" },
      { status: 500 }
    );
  }
}
