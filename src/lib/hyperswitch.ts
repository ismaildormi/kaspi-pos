/**
 * Hyperswitch Payment Orchestrator client (self-hosted on Oracle Cloud VPS).
 *
 * Hyperswitch routes payments to the right processor:
 *   - MAD (Morocco: CMI / CashPlus)  -> YouCanPay connector
 *   - USD / EUR (international)      -> Paddle connector
 *
 * TODO(keys): Set HYPERSWITCH_API_URL, HYPERSWITCH_API_KEY, HYPERSWITCH_PROFILE_ID
 * and HYPERSWITCH_WEBHOOK_SECRET once the VPS stack in `deploy/` is running and
 * the YouCanPay / Paddle connectors are configured in the Hyperswitch Control Center.
 */
import crypto from "node:crypto";

export type HyperswitchCurrency = "MAD" | "USD" | "EUR";

export interface CreateHyperswitchPaymentInput {
  tenantId: string;
  amount: number; // major units (e.g. 199.00 MAD)
  currency: HyperswitchCurrency;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

export interface HyperswitchPaymentResponse {
  payment_id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
  connector?: string | null;
  [key: string]: unknown;
}

export function isHyperswitchConfigured(): boolean {
  return Boolean(
    process.env.HYPERSWITCH_API_URL &&
      process.env.HYPERSWITCH_API_KEY &&
      !process.env.HYPERSWITCH_API_KEY.startsWith("snd_your_")
  );
}

/** Preferred connector per currency — Hyperswitch smart routing can override. */
export function preferredConnector(currency: HyperswitchCurrency): string {
  return currency === "MAD" ? "youcanpay" : "paddle";
}

async function hyperswitchFetch<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown }
): Promise<T> {
  if (!isHyperswitchConfigured()) {
    throw new Error(
      "Hyperswitch is not configured (HYPERSWITCH_API_URL / HYPERSWITCH_API_KEY missing)."
    );
  }

  const baseUrl = process.env.HYPERSWITCH_API_URL!.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}${path}`, {
    method: init.method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": process.env.HYPERSWITCH_API_KEY!,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json as any)?.error?.message || `Hyperswitch request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

export async function createHyperswitchPayment(
  input: CreateHyperswitchPaymentInput
): Promise<HyperswitchPaymentResponse> {
  return hyperswitchFetch<HyperswitchPaymentResponse>("/payments", {
    method: "POST",
    body: {
      amount: Math.round(input.amount * 100), // minor units
      currency: input.currency,
      confirm: false,
      capture_method: "automatic",
      customer_id: `tenant_${input.tenantId}`,
      email: input.customerEmail,
      name: input.customerName,
      description: input.description || "KASPI POS Subscription",
      return_url: input.returnUrl,
      profile_id: process.env.HYPERSWITCH_PROFILE_ID || undefined,
      metadata: {
        tenantId: input.tenantId,
        preferredConnector: preferredConnector(input.currency),
        ...(input.metadata || {}),
      },
    },
  });
}

export async function retrieveHyperswitchPayment(
  paymentId: string
): Promise<HyperswitchPaymentResponse> {
  return hyperswitchFetch<HyperswitchPaymentResponse>(
    `/payments/${encodeURIComponent(paymentId)}`,
    { method: "GET" }
  );
}

/**
 * Verifies the `x-webhook-signature-512` header (HMAC-SHA512 of the raw body
 * using the profile's payment_response_hash_key).
 */
export function verifyHyperswitchWebhook(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.HYPERSWITCH_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha512", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim(), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
