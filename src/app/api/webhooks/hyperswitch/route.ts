import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { verifyHyperswitchWebhook } from "@/lib/hyperswitch";
import {
  checkReplayWindow,
  logWebhookForensicEvidence,
} from "@/lib/security/webhook-verifier";

/**
 * POST /api/webhooks/hyperswitch
 * Normalized payment lifecycle events from the Hyperswitch orchestrator
 * (covers both YouCanPay and Paddle connectors). Idempotent via WebhookEvent.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature-512");

  if (!verifyHyperswitchWebhook(rawBody, signature)) {
    await logWebhookForensicEvidence({
      provider: "hyperswitch",
      valid: false,
      reason: "Invalid x-webhook-signature-512",
      rawBody,
      headers: req.headers,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId: string = event?.event_id || event?.content?.object?.payment_id;
  const eventType: string = event?.event_type || "unknown";
  const payment = event?.content?.object || {};
  const tenantId: string | null = payment?.metadata?.tenantId || null;

  if (!eventId) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const replayCheck = checkReplayWindow(eventId);
  if (!replayCheck.ok) {
    return NextResponse.json({ received: true, duplicate: true, reason: replayCheck.reason });
  }

  await logWebhookForensicEvidence({
    provider: "hyperswitch",
    valid: true,
    eventId,
    eventType,
    tenantId,
    rawBody,
    headers: req.headers,
  });

  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "hyperswitch", eventId } },
  });
  if (existing?.status === "processed") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const record = await prisma.webhookEvent.upsert({
    where: { provider_eventId: { provider: "hyperswitch", eventId } },
    create: {
      provider: "hyperswitch",
      eventId,
      eventType,
      signatureValid: true,
      status: "received",
      payloadRedacted: {
        payment_id: payment.payment_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        connector: payment.connector,
      },
      tenantId,
    },
    update: { attempts: { increment: 1 } },
  });

  try {
    if (tenantId && eventType === "payment_succeeded" && payment.payment_id) {
      await prisma.payment.upsert({
        where: {
          provider_providerTransactionId: {
            provider: "hyperswitch",
            providerTransactionId: payment.payment_id,
          },
        },
        create: {
          tenantId,
          provider: "hyperswitch",
          providerTransactionId: payment.payment_id,
          amount: Number(payment.amount || 0) / 100,
          currency: String(payment.currency || "MAD").slice(0, 3),
          status: "paid",
          paidAt: new Date(),
          providerPayload: { connector: payment.connector ?? null },
        },
        update: { status: "paid", paidAt: new Date() },
      });

      // Activate latest subscription for the tenant
      const sub = await prisma.subscription.findFirst({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      });
      if (sub) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
        });
      }
    }

    await prisma.webhookEvent.update({
      where: { id: record.id },
      data: { status: "processed", processedAt: new Date() },
    });
    return NextResponse.json({ received: true });
  } catch (err: any) {
    await prisma.webhookEvent.update({
      where: { id: record.id },
      data: { status: "failed", error: err?.message?.slice(0, 500) },
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
