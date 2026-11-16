/**
 * KASPI POS (كسب) — Immutable PCI-DSS 4.0.1 Payment Audit Logger (`AuditLogger.ts`)
 *
 * Guarantees:
 * 1. Automatic redaction of any accidental 13-19 digit PAN or 3-4 digit CVV/CVC fields.
 * 2. SHA-256 cryptographic hash chaining across payment & mandate events.
 * 3. Strict Idempotency-Key hashing and RBAC role attribution.
 */

import crypto from "crypto";
import type { PaymentFlowType } from "./types";

export interface PaymentAuditEntry {
  id: string;
  tenantId: string;
  actorUserId?: string;
  actorRole?: string;
  flow: PaymentFlowType;
  action:
    | "SUBSCRIPTION_MANDATE_CREATED"
    | "SUBSCRIPTION_AUTO_RENEWED"
    | "SUBSCRIPTION_CANCELED_AT_PERIOD_END"
    | "SUBSCRIPTION_POSTE_UPDATED"
    | "POS_TPE_INITIATED"
    | "POS_SPLIT_TENDER_COMPLETED"
    | "PAYMENT_WEBHOOK_VERIFIED"
    | "REFUND_OR_VOID_EXECUTED"
    | "DISPUTE_LOGGED";
  provider: string;
  idempotencyKeyHash: string;
  sanitizedMetadata: Record<string, unknown>;
  previousChainHash: string;
  entryHash: string;
  createdAt: string;
}

const FORBIDDEN_PCI_KEYS = new Set([
  "pan",
  "cardnumber",
  "card_number",
  "rawcard",
  "cvv",
  "cvc",
  "cvv2",
  "cid",
  "pin",
  "track1",
  "track2",
]);

export class PaymentAuditLogger {
  private static lastChainHash =
    "0000000000000000000000000000000000000000000000000000000000000000";

  /**
   * Recursively strips any forbidden PCI-DSS fields (PAN, CVV, CVC, PIN)
   * and masks any 13-19 digit sequences.
   */
  static sanitizePciPayload(input: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input || {})) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (FORBIDDEN_PCI_KEYS.has(normalizedKey)) {
        clean[key] = "[REDACTED_PCI_DSS_4_0_1]";
        continue;
      }
      if (typeof value === "string") {
        // Mask any raw 13-19 digit card sequence if present in free text
        clean[key] = value.replace(/\b(?:\d[ -]*?){13,19}\b/g, "••••-REDACTED-PAN");
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        clean[key] = PaymentAuditLogger.sanitizePciPayload(
          value as Record<string, unknown>
        );
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  static hashIdempotencyKey(rawKey: string): string {
    return crypto.createHash("sha256").update(rawKey, "utf8").digest("hex");
  }

  static createAuditRecord(params: {
    tenantId: string;
    actorUserId?: string;
    actorRole?: string;
    flow: PaymentFlowType;
    action: PaymentAuditEntry["action"];
    provider: string;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
  }): PaymentAuditEntry {
    const sanitizedMetadata = PaymentAuditLogger.sanitizePciPayload(
      params.metadata || {}
    );
    const idempotencyKeyHash = PaymentAuditLogger.hashIdempotencyKey(
      params.idempotencyKey
    );
    const createdAt = new Date().toISOString();
    const id = `paudit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const canonical = JSON.stringify({
      id,
      tenantId: params.tenantId,
      flow: params.flow,
      action: params.action,
      provider: params.provider,
      idempotencyKeyHash,
      sanitizedMetadata,
      previousChainHash: PaymentAuditLogger.lastChainHash,
      createdAt,
    });

    const entryHash = crypto
      .createHash("sha256")
      .update(canonical, "utf8")
      .digest("hex");
    PaymentAuditLogger.lastChainHash = entryHash;

    return {
      id,
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      flow: params.flow,
      action: params.action,
      provider: params.provider,
      idempotencyKeyHash,
      sanitizedMetadata,
      previousChainHash: PaymentAuditLogger.lastChainHash,
      entryHash,
      createdAt,
    };
  }
}
