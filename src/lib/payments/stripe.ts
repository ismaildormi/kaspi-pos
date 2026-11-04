/**
 * KASPI POS (كسب) — Stripe Modular Payment Adapter
 * 
 * Supports Stripe Checkout / PaymentIntents, Refund, and HMAC-SHA256 Webhook Verification.
 */

import crypto from "node:crypto";
import {
  PaymentAdapter,
  PaymentIntentOptions,
  PaymentInitiationResult,
  WebhookVerificationResult,
  RefundOptions,
  RefundResult,
} from "./types";

export class StripePaymentAdapter implements PaymentAdapter {
  readonly gatewayName = "stripe";
  private secretKey: string;
  private webhookSecret: string;

  constructor(secretKey?: string, webhookSecret?: string) {
    this.secretKey = secretKey || process.env.STRIPE_SECRET_KEY || "";
    this.webhookSecret = webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || "";
  }

  isConfigured(): boolean {
    return Boolean(this.secretKey && !this.secretKey.startsWith("sk_test_placeholder"));
  }

  async initiatePayment(options: PaymentIntentOptions): Promise<PaymentInitiationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        gateway: this.gatewayName,
        transactionId: "",
        error: "Stripe is not configured. Missing STRIPE_SECRET_KEY.",
      };
    }

    try {
      const amountInCents = Math.round(options.amount * 100);
      const currency = options.currency.toLowerCase();

      const params = new URLSearchParams();
      params.append("amount", amountInCents.toString());
      params.append("currency", currency);
      params.append("description", options.description || `Kaspi POS Order ${options.orderId}`);
      if (options.customerEmail) {
        params.append("receipt_email", options.customerEmail);
      }
      params.append("metadata[orderId]", options.orderId);
      if (options.metadata) {
        for (const [k, v] of Object.entries(options.metadata)) {
          params.append(`metadata[${k}]`, v);
        }
      }

      const res = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          gateway: this.gatewayName,
          transactionId: "",
          error: data.error?.message || "Stripe PaymentIntent creation failed",
        };
      }

      return {
        success: true,
        gateway: this.gatewayName,
        transactionId: data.id,
        clientSecret: data.client_secret,
        rawResponse: data,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Stripe network error";
      return {
        success: false,
        gateway: this.gatewayName,
        transactionId: "",
        error: msg,
      };
    }
  }

  async verifyWebhook(
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookVerificationResult> {
    const rawSignature = headers["stripe-signature"] || headers["Stripe-Signature"];
    const sigHeader = Array.isArray(rawSignature) ? rawSignature[0] : rawSignature;

    if (!sigHeader || !this.webhookSecret) {
      return {
        isValid: false,
        status: "failed",
        error: "Missing Stripe signature or STRIPE_WEBHOOK_SECRET",
      };
    }

    try {
      // Parse Stripe header: t=...,v1=...
      const parts = sigHeader.split(",");
      const timestamp = parts.find((p) => p.startsWith("t="))?.replace("t=", "");
      const signatures = parts.filter((p) => p.startsWith("v1=")).map((p) => p.replace("v1=", ""));

      if (!timestamp || signatures.length === 0) {
        return { isValid: false, status: "failed", error: "Malformed stripe-signature header" };
      }

      // Check replay attack tolerance (300 seconds)
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
        return { isValid: false, status: "failed", error: "Stripe webhook signature expired" };
      }

      const payloadString = Buffer.isBuffer(payload) ? payload.toString("utf8") : payload;
      const signedPayload = `${timestamp}.${payloadString}`;
      const expected = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(signedPayload, "utf8")
        .digest("hex");

      const isValid = signatures.some((s) => {
        try {
          return crypto.timingSafeEqual(Buffer.from(s, "hex"), Buffer.from(expected, "hex"));
        } catch {
          return false;
        }
      });

      if (!isValid) {
        return { isValid: false, status: "failed", error: "Invalid Stripe webhook HMAC signature" };
      }

      const event = JSON.parse(payloadString);
      const dataObj = event.data?.object || {};
      const status =
        event.type === "payment_intent.succeeded"
          ? "succeeded"
          : event.type === "payment_intent.payment_failed"
          ? "failed"
          : "pending";

      return {
        isValid: true,
        transactionId: dataObj.id,
        orderId: dataObj.metadata?.orderId,
        status,
        amount: dataObj.amount ? dataObj.amount / 100 : undefined,
        currency: dataObj.currency?.toUpperCase(),
        rawEvent: event,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error verifying Stripe webhook";
      return { isValid: false, status: "failed", error: msg };
    }
  }

  async refund(options: RefundOptions): Promise<RefundResult> {
    if (!this.isConfigured()) {
      return { success: false, refundId: "", amountRefunded: 0, error: "Stripe not configured" };
    }

    try {
      const params = new URLSearchParams();
      params.append("payment_intent", options.transactionId);
      if (options.amount) {
        params.append("amount", Math.round(options.amount * 100).toString());
      }
      if (options.reason) {
        params.append("reason", options.reason);
      }

      const res = await fetch("https://api.stripe.com/v1/refunds", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          refundId: "",
          amountRefunded: 0,
          error: data.error?.message || "Refund failed",
        };
      }

      return {
        success: true,
        refundId: data.id,
        amountRefunded: data.amount / 100,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Stripe refund failed";
      return { success: false, refundId: "", amountRefunded: 0, error: msg };
    }
  }
}
