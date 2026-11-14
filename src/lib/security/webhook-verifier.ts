import crypto from "crypto";
import { recordForensicAudit } from "@/lib/security/forensic-audit";
import { dispatchP0CriticalAlert } from "@/lib/automation/smart-critical-alerter";

/**
 * KASPI POS — Timing-Safe Payment Webhook Verifier & PCI-DSS Redactor (Layer 4)
 *
 * Covers YouCan Pay, Paddle, Stripe, and Hyperswitch webhooks:
 *  - Uses `crypto.timingSafeEqual` against raw request bodies
 *  - Enforces replay-attack window (5 minutes / 300 seconds)
 *  - Enforces PCI-DSS Zero Card Data Storage (strips PAN, CVV, expiry)
 *  - Emits P0 critical alert + immutable forensic log on forged signatures
 */

export type WebhookProviderName = "youcanpay" | "paddle" | "stripe" | "hyperswitch" | "cmi";

export interface WebhookVerificationResult {
  valid: boolean;
  reason?: string;
  timestampAgeSeconds?: number;
}

const MAX_REPLAY_WINDOW_SECONDS = 300; // 5 minutes
const seenWebhookIds = new Map<string, number>();

export function timingSafeHexEquals(expectedHex: string, actualHex: string): boolean {
  const cleanExpected = expectedHex.trim().toLowerCase();
  const cleanActual = actualHex.trim().toLowerCase();
  if (!cleanExpected || !cleanActual || cleanExpected.length !== cleanActual.length) {
    return false;
  }
  try {
    const bufA = Buffer.from(cleanExpected, "hex");
    const bufB = Buffer.from(cleanActual, "hex");
    if (bufA.length === 0 || bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function sanitizePciDssPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const forbidden = /^(cardnumber|pan|cvv|cvc|securitycode|expiry|expmonth|expyear|card_number)$/i;
  const clone: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    const norm = k.replace(/[-_]/g, "");
    if (forbidden.test(norm)) {
      clone[k] = "[PCI_DSS_REDACTED]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      clone[k] = sanitizePciDssPayload(v);
    } else {
      clone[k] = v;
    }
  }
  return clone;
}

export function checkReplayWindow(
  eventId: string | undefined,
  timestampSeconds?: number
): { ok: boolean; reason?: string } {
  const nowSec = Math.floor(Date.now() / 1000);

  if (timestampSeconds !== undefined && Number.isFinite(timestampSeconds)) {
    const age = Math.abs(nowSec - timestampSeconds);
    if (age > MAX_REPLAY_WINDOW_SECONDS) {
      return { ok: false, reason: `REPLAY_WINDOW_EXCEEDED (${age}s > 300s)` };
    }
  }

  if (eventId) {
    const seenAt = seenWebhookIds.get(eventId);
    if (seenAt && Date.now() - seenAt < MAX_REPLAY_WINDOW_SECONDS * 1000) {
      return { ok: false, reason: "DUPLICATE_WEBHOOK_EVENT_ID" };
    }
    seenWebhookIds.set(eventId, Date.now());
    if (seenWebhookIds.size > 5000) {
      const oldestKey = seenWebhookIds.keys().next().value;
      if (oldestKey) seenWebhookIds.delete(oldestKey);
    }
  }

  return { ok: true };
}

export function verifyHmacSha256Signature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string | undefined
): WebhookVerificationResult {
  if (!secret || !secret.trim()) {
    // Allow sandbox/dev bypass only if explicitly not configured and not in production
    if (process.env.NODE_ENV === "production") {
      return { valid: false, reason: "MISSING_WEBHOOK_SECRET_IN_PRODUCTION" };
    }
    return { valid: true };
  }

  if (!signatureHeader || !signatureHeader.trim()) {
    return { valid: false, reason: "MISSING_SIGNATURE_HEADER" };
  }

  // Support `sha256=<hex>` or `t=...,v1=<hex>` or raw `<hex>`
  let candidateHex = signatureHeader.trim();
  let timestampSec: number | undefined;

  if (candidateHex.includes("v1=") && candidateHex.includes("t=")) {
    const parts = Object.fromEntries(
      candidateHex.split(",").map((kv) => {
        const [k, v] = kv.trim().split("=");
        return [k, v];
      })
    );
    timestampSec = parts.t ? Number(parts.t) : undefined;
    candidateHex = parts.v1 || "";
    const signedPayload = timestampSec ? `${timestampSec}.${rawBody}` : rawBody;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    if (!timingSafeHexEquals(expected, candidateHex)) {
      return { valid: false, reason: "TIMING_SAFE_HMAC_MISMATCH" };
    }
    const replay = checkReplayWindow(undefined, timestampSec);
    if (!replay.ok) {
      return { valid: false, reason: replay.reason };
    }
    return { valid: true };
  }

  if (candidateHex.startsWith("sha256=")) {
    candidateHex = candidateHex.slice("sha256=".length);
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const valid = timingSafeHexEquals(expected, candidateHex);
  return valid
    ? { valid: true }
    : { valid: false, reason: "TIMING_SAFE_HMAC_MISMATCH" };
}

export async function logWebhookForensicEvidence(params: {
  provider: WebhookProviderName;
  valid: boolean;
  eventId?: string;
  eventType?: string;
  tenantId?: string | null;
  reason?: string;
  rawBody: string;
  headers: Headers | Record<string, string>;
}) {
  let parsedBody: unknown = {};
  try {
    parsedBody = JSON.parse(params.rawBody);
  } catch {
    parsedBody = { rawPreview: params.rawBody.slice(0, 200) };
  }

  const sanitized = sanitizePciDssPayload(parsedBody);

  await recordForensicAudit({
    eventType: params.valid
      ? "WEBHOOK_SIGNATURE_VALIDATED"
      : "WEBHOOK_SIGNATURE_FORGED_REJECTED",
    tenantId: params.tenantId || "PLATFORM_BILLING",
    entityType: `webhook_${params.provider}`,
    reason: params.reason || (params.valid ? "HMAC_VERIFIED" : "FORGED_SIGNATURE"),
    afterState: {
      provider: params.provider,
      eventId: params.eventId || null,
      eventType: params.eventType || null,
      signatureValid: params.valid,
      payloadRedacted: sanitized,
    },
    headers: params.headers,
  });

  if (!params.valid) {
    await dispatchP0CriticalAlert({
      type: "FORGED_PAYMENT_WEBHOOK_SIGNATURE",
      tenantId: params.tenantId || "PLATFORM_BILLING",
      summary: `Forged ${params.provider} webhook signature rejected (${params.reason || "invalid HMAC"})`,
      details: {
        provider: params.provider,
        eventId: params.eventId,
      },
    });
  }
}
