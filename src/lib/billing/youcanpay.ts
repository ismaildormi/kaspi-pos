import crypto from "node:crypto";
import { BillingProvider, SubscriptionStatus } from "@prisma/client";
import {
  IPaymentProvider,
  CheckoutSessionOptions,
  CheckoutSessionResponse,
  WebhookEventPayload,
} from "./types";

export class YouCanPayBillingProvider implements IPaymentProvider {
  public readonly provider: BillingProvider = "youcanpay";

  private privateKey: string;
  private publicKey: string;
  private webhookSecret: string;
  private isSandbox: boolean;

  constructor() {
    this.privateKey = process.env.YOUCANPAY_PRIVATE_KEY || "";
    this.publicKey = process.env.YOUCANPAY_PUBLIC_KEY || "";
    this.webhookSecret = process.env.YOUCANPAY_WEBHOOK_SECRET || "";
    this.isSandbox = process.env.YOUCANPAY_SANDBOX !== "false";
  }

  /**
   * Generates a YouCan Pay token and returns the hosted payment gateway URL.
   */
  async createCheckoutSession(
    options: CheckoutSessionOptions
  ): Promise<CheckoutSessionResponse> {
    const orderId = `ycp_ord_${crypto.randomUUID()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 100 MAD per month (~ $10 USD) or 1000 MAD per year
    const amountMAD = options.billingInterval === "yearly" ? 100000 : 10000; // in centimes (100.00 MAD)

    console.info(
      `[YouCan Pay] Creating payment token for Tenant=${options.tenantId}, Plan=${options.planId}, Amount=${amountMAD / 100} MAD`
    );

    if (
      this.privateKey &&
      !this.privateKey.includes("mock") &&
      this.privateKey.length > 15
    ) {
      try {
        const apiUrl = this.isSandbox
          ? "https://youcanpay.com/sandbox/api/tokenize"
          : "https://youcanpay.com/api/tokenize";

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pri_key: this.privateKey,
            amount: amountMAD,
            currency: "MAD",
            order_id: orderId,
            customer: {
              name: options.userName || "Commerçant Marocain",
              email: options.userEmail,
            },
            metadata: {
              tenant_id: options.tenantId,
              plan_id: options.planId,
              billing_interval: options.billingInterval || "monthly",
            },
            return_url: options.successUrl,
            cancel_url: options.cancelUrl,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const tokenId = data.token?.id || data.id;
          if (tokenId) {
            const checkoutUrl = this.isSandbox
              ? `https://pay.youcanpay.com/sandbox/de/${tokenId}`
              : `https://pay.youcanpay.com/de/${tokenId}`;

            return {
              checkoutUrl,
              sessionId: tokenId,
              provider: this.provider,
            };
          }
        }
      } catch (err) {
        console.warn("[YouCan Pay] Live tokenize call failed, falling back to mock link:", err);
      }
    }

    // Default Sandbox / Mock Checkout URL
    const checkoutUrl = `${baseUrl}/mock-youcanpay-checkout?token=${orderId}&tenant=${encodeURIComponent(
      options.tenantId
    )}&amount=100.00&currency=MAD&return=${encodeURIComponent(options.successUrl)}`;

    return {
      checkoutUrl,
      sessionId: orderId,
      provider: this.provider,
    };
  }

  /**
   * Verifies YouCan Pay signature or secret header.
   */
  verifySignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;

    if (
      process.env.NODE_ENV !== "production" &&
      (signature === "valid_test_signature" || signature.startsWith("mock_"))
    ) {
      return true;
    }

    if (!this.webhookSecret) {
      console.warn(
        "[YouCan Pay] Warning: YOUCANPAY_WEBHOOK_SECRET is not set. Webhook accepted in dev mode."
      );
      return process.env.NODE_ENV !== "production";
    }

    try {
      const payload = JSON.parse(rawBody);
      const orderId = payload.order_id || payload.orderId || "";
      const amount = payload.amount || "";
      const currency = payload.currency || "MAD";

      const dataToSign = `${orderId}${amount}${currency}${this.webhookSecret}`;
      const expectedSig = crypto
        .createHash("sha256")
        .update(dataToSign)
        .digest("hex");

      return signature === expectedSig;
    } catch {
      return false;
    }
  }

  /**
   * Parses incoming YouCan Pay Webhook payloads.
   */
  async handleWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookEventPayload> {
    const rawSig =
      headers["x-youcanpay-signature"] ||
      headers["youcan-pay-signature"] ||
      headers["signature"];
    const signature = Array.isArray(rawSig) ? rawSig[0] : rawSig || "";

    const isValid = this.verifySignature(rawBody, signature);
    if (!isValid) {
      throw new Error("[YouCan Pay] Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.id || `ycp_evt_${crypto.randomUUID()}`;
    const statusNumber = Number(payload.status);

    // YouCan Pay status 1 = Paid / Success
    const isSuccess =
      statusNumber === 1 ||
      payload.status === "paid" ||
      payload.status === "success" ||
      payload.event === "payment.success";

    const tenantId =
      payload.metadata?.tenant_id ||
      payload.metadata?.tenantId ||
      payload.custom_data?.tenant_id;

    const subscriptionStatus: SubscriptionStatus = isSuccess ? "active" : "past_due";

    // 30 days period extension
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    return {
      eventId,
      eventType: isSuccess ? "payment.succeeded" : "payment.failed",
      subscriptionId: payload.order_id || payload.orderId,
      customerId: payload.customer?.id,
      tenantId,
      status: subscriptionStatus,
      currentPeriodEnd,
      amount: payload.amount ? Number(payload.amount) / 100 : 100.0,
      currency: payload.currency || "MAD",
      rawPayload: payload,
    };
  }
}
