import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { WebhookProcessor } from "@/lib/payments";

/**
 * KASPI POS (كسب) — Unified Verified Payment Webhook Endpoint (`/api/v1/webhooks/payments/[provider]`)
 *
 * Delegates cryptographic signature verification (verifyWebhook), Idempotency-Key deduplication,
 * and PCI-DSS 4.0.1 redaction to `WebhookProcessor.processWebhook`.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const rawBody = await req.text();

    const headersMap: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersMap[key.toLowerCase()] = value;
    });

    const processed = await WebhookProcessor.processWebhook({
      provider,
      rawBody,
      headers: headersMap,
    });

    if (!processed.accepted || !processed.auditEntry) {
      return NextResponse.json(
        {
          ok: false,
          provider,
          error: processed.verification.error || "Invalid webhook signature",
        },
        { status: 400 }
      );
    }

    const validEnumProviders = new Set(["paddle", "youcanpay", "hyperswitch", "manual", "mock"]);
    const mappedProvider = validEnumProviders.has(provider.toLowerCase())
      ? (provider.toLowerCase() as any)
      : "mock";

    await prisma.webhookEvent
      .upsert({
        where: {
          provider_eventId: {
            provider: mappedProvider,
            eventId: processed.eventId,
          },
        },
        create: {
          provider: mappedProvider,
          eventId: processed.eventId,
          eventType:
            processed.verification.eventType || `${provider}.${processed.verification.status}`,
          signatureValid: true,
          status: "processed",
          attempts: 1,
          payloadRedacted: processed.auditEntry.sanitizedMetadata as any,
          processedAt: new Date(),
        },
        update: {
          attempts: { increment: 1 },
          status: "processed",
          processedAt: new Date(),
        },
      })
      .catch(() => {});

    return NextResponse.json({
      ok: true,
      provider,
      eventId: processed.eventId,
      duplicate: processed.duplicate,
      status: processed.verification.status,
      auditHash: processed.auditEntry.entryHash,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
