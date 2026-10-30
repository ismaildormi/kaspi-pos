import crypto from "node:crypto";
import { BillingProvider, SubscriptionStatus } from "@prisma/client";
import {
  IPaymentProvider,
  CheckoutSessionOptions,
  CheckoutSessionResponse,
  WebhookEventPayload,
} from "./types";

export class PaddleBillingProvider implements IPaymentProvider {
  public readonly provider: BillingProvider = "paddle";

  private apiKey: string;
  private webhookSecret: string;
  private environment: "sandbox" | "production";

  constructor() {
    this.apiKey = process.env.PADDLE_API_KEY || "";
    this.webhookSecret = process.env.PADDLE_WEBHOOK_SECRET || "";
    this.environment =
      (process.env.PADDLE_ENV as "sandbox" | "production") || "sandbox";
  }

  /**
   * Generates a Paddle Checkout Session.
   * If real keys exist, calls Paddle REST API; otherwise yields a sandbox mock link.
   */
  async createCheckoutSession(
    options: CheckoutSessionOptions
  ): Promise<CheckoutSessionResponse> {
    const txnId = `txn_${crypto.randomUUID()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.info(
      `[Paddle Provider] Creating checkout session for Tenant=${options.tenantId}, Plan=${options.planId}, Interval=${options.billingInterval || "monthly"}`
    );

    // If real Paddle API Key is provided, execute real transaction creation
    if (this.apiKey && !this.apiKey.includes("mock") && this.apiKey.length > 20) {
      try {
        const apiUrl =
          this.environment === "production"
            ? "https://api.paddle.com/transactions"
            : "https://sandbox-api.paddle.com/transactions";

        const priceId =
          options.billingInterval === "yearly"
            ? process.env.PADDLE_PRICE_ID_YEARLY || "pri_yearly_pro"
            : process.env.PADDLE_PRICE_ID_MONTHLY || "pri_monthly_pro";

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [{ price_id: priceId, quantity: 1 }],
            customer: { email: options.userEmail },
            custom_data: {
              tenant_id: options.tenantId,
              plan_id: options.planId,
            },
            checkout: {
              success_url: options.successUrl,
              cancel_url: options.cancelUrl,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const checkoutUrl = data.data?.checkout?.url;
          if (checkoutUrl) {
            return {
              checkoutUrl,
              sessionId: data.data.id || txnId,
              provider: this.provider,
            };
          }
        }
      } catch (err) {
        console.warn("[Paddle Provider] Live API call failed, falling back to sandbox link:", err);
      }
    }

    // Default Sandbox / Mock Checkout fallback
    const checkoutUrl = `${baseUrl}/mock-paddle-checkout?txn=${txnId}&tenant=${encodeURIComponent(
      options.tenantId
    )}&plan=${encodeURIComponent(options.planId)}&return=${encodeURIComponent(
      options.successUrl
    )}`;

    return {
      checkoutUrl,
      sessionId: txnId,
      provider: this.provider,
    };
  }

  /**
   * Verifies Paddle Webhook HMAC-SHA256 signature.
   * Header format: `ts=1671234567;h1=abc...`
   */
  verifySignature(rawBody: string, signatureHeader: string): boolean {
    if (!signatureHeader) return false;

    // Allow mock/sandbox signatures in non-production
    if (
      process.env.NODE_ENV !== "production" &&
      (signatureHeader === "valid_test_signature" || signatureHeader.startsWith("mock_"))
    ) {
      return true;
    }

    if (!this.webhookSecret) {
      console.warn(
        "[Paddle Provider] Warning: PADDLE_WEBHOOK_SECRET is not set. Webhook accepted in dev mode."
      );
      return process.env.NODE_ENV !== "production";
    }

    try {
      const parts = signatureHeader.split(";").reduce((acc, part) => {
        const [k, v] = part.split("=");
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {} as Record<string, string>);

      const ts = parts["ts"];
      const h1 = parts["h1"];
      if (!ts || !h1) return false;

      const signedPayload = `${ts}:${rawBody}`;
      const expectedHash = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(signedPayload)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(h1, "hex"),
        Buffer.from(expectedHash, "hex")
      );
    } catch (err) {
      console.error("[Paddle Provider] Signature verification error:", err);
      return false;
    }
  }

  /**
   * Parses and normalizes incoming Paddle Webhook payloads.
   */
  async handleWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookEventPayload> {
    const rawSig = headers["paddle-signature"] || headers["Paddle-Signature"];
    const signature = Array.isArray(rawSig) ? rawSig[0] : rawSig || "";

    const isValid = this.verifySignature(rawBody, signature);
    if (!isValid) {
      throw new Error("[Paddle Provider] Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event_type || payload.eventType || "unknown";
    const data = payload.data || payload;

    const eventId = payload.event_id || `evt_${crypto.randomUUID()}`;
    const tenantId =
      data.custom_data?.tenant_id ||
      data.custom_data?.tenantId ||
      data.metadata?.tenantId;
    const subscriptionId = data.subscription_id || data.id;
    const customerId = data.customer_id || data.customer?.id;

    let status: SubscriptionStatus | undefined;
    if (eventType === "subscription.created" || eventType === "subscription.activated") {
      status = "active";
    } else if (eventType === "subscription.updated") {
      status = data.status === "past_due" ? "past_due" : "active";
    } else if (eventType === "subscription.canceled") {
      status = "canceled";
    } else if (eventType === "subscription.past_due") {
      status = "past_due";
    }

    const currentPeriodEnd = data.current_billing_period?.ends_at
      ? new Date(data.current_billing_period.ends_at)
      : undefined;

    const amount = data.details?.totals?.total
      ? parseFloat(data.details.totals.total) / 100
      : undefined;
    const currency = data.currency_code || "USD";

    return {
      eventId,
      eventType,
      subscriptionId,
      customerId,
      tenantId,
      status,
      currentPeriodEnd,
      amount,
      currency,
      rawPayload: payload,
    };
  }
}
