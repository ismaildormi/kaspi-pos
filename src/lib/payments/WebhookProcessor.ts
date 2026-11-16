/**
 * KASPI POS (كسب) — Cryptographic Webhook Processor & Idempotency Engine (`WebhookProcessor.ts`)
 *
 * Centralizes provider webhook verification, replay-window checks, Idempotency-Key
 * deduplication, and PCI-DSS 4.0.1 payload redaction before persistence.
 */

import { PaymentGatewayManager } from "./PaymentGatewayManager";
import { PaymentAuditLogger, type PaymentAuditEntry } from "./AuditLogger";
import type { WebhookVerificationResult } from "./types";

const processedIdempotencyKeys = new Set<string>();

export interface WebhookProcessResult {
  accepted: boolean;
  duplicate: boolean;
  provider: string;
  eventId: string;
  verification: WebhookVerificationResult;
  auditEntry: PaymentAuditEntry | null;
}

export class WebhookProcessor {
  static async processWebhook(params: {
    provider: string;
    rawBody: string | Buffer;
    headers: Record<string, string | string[] | undefined>;
    tenantId?: string;
  }): Promise<WebhookProcessResult> {
    const adapter = PaymentGatewayManager.getAdapter(params.provider);
    const verification = await adapter.verifyWebhook(params.rawBody, params.headers);

    const headerIdem =
      params.headers["idempotency-key"] ||
      params.headers["Idempotency-Key"] ||
      params.headers["x-idempotency-key"];
    const idemHeaderValue = Array.isArray(headerIdem) ? headerIdem[0] : headerIdem;

    const eventId =
      verification.eventId ||
      verification.transactionId ||
      idemHeaderValue ||
      `evt_${params.provider}_${Date.now()}`;

    if (!verification.isValid) {
      return {
        accepted: false,
        duplicate: false,
        provider: params.provider,
        eventId,
        verification,
        auditEntry: null,
      };
    }

    const dedupeKey = `${params.provider.toLowerCase()}:${eventId}`;
    const isDuplicate = processedIdempotencyKeys.has(dedupeKey);
    processedIdempotencyKeys.add(dedupeKey);

    const auditEntry = PaymentAuditLogger.createAuditRecord({
      tenantId: params.tenantId || "webhook-system",
      flow: "SUBSCRIPTION",
      action: "PAYMENT_WEBHOOK_VERIFIED",
      provider: params.provider,
      idempotencyKey: eventId,
      metadata: {
        transactionId: verification.transactionId,
        orderId: verification.orderId,
        status: verification.status,
        amount: verification.amount,
        currency: verification.currency,
        duplicate: isDuplicate,
      },
    });

    return {
      accepted: true,
      duplicate: isDuplicate,
      provider: params.provider,
      eventId,
      verification,
      auditEntry,
    };
  }
}
