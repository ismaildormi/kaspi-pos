import crypto from "node:crypto";
import { BillingProvider, SubscriptionStatus } from "@prisma/client";
import {
  IPaymentProvider,
  CheckoutSessionOptions,
  CheckoutSessionResponse,
  WebhookEventPayload,
} from "./types";

export class MockBillingProvider implements IPaymentProvider {
  public readonly provider: BillingProvider = "mock";

  async createCheckoutSession(
    options: CheckoutSessionOptions
  ): Promise<CheckoutSessionResponse> {
    const sessionId = `mock_sess_${crypto.randomUUID()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutUrl = `${baseUrl}/mock-checkout?session=${sessionId}&tenant=${encodeURIComponent(
      options.tenantId
    )}&plan=${encodeURIComponent(options.planId)}&return=${encodeURIComponent(
      options.successUrl
    )}`;

    return {
      checkoutUrl,
      sessionId,
      provider: this.provider,
    };
  }

  verifySignature(rawBody: string, signature: string): boolean {
    return true; // Mock accepts all test signatures
  }

  async handleWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookEventPayload> {
    const payload = JSON.parse(rawBody);
    const eventId = payload.eventId || `mock_evt_${crypto.randomUUID()}`;
    const eventType = payload.eventType || "subscription.activated";

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    return {
      eventId,
      eventType,
      subscriptionId: payload.subscriptionId || `sub_${crypto.randomUUID()}`,
      customerId: payload.customerId || `cus_${crypto.randomUUID()}`,
      tenantId: payload.tenantId,
      status: (payload.status as SubscriptionStatus) || "active",
      currentPeriodEnd,
      amount: payload.amount || 10.0,
      currency: payload.currency || "USD",
      rawPayload: payload,
    };
  }
}
