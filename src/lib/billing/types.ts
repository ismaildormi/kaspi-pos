import { BillingProvider, SubscriptionStatus } from "@prisma/client";

export interface CheckoutSessionOptions {
  tenantId: string;
  userEmail: string;
  userName?: string;
  planId: string; // e.g. "pro"
  billingInterval?: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
  provider: BillingProvider;
}

export interface WebhookEventPayload {
  eventId: string;
  eventType:
    | "subscription.created"
    | "subscription.activated"
    | "subscription.updated"
    | "subscription.canceled"
    | "subscription.past_due"
    | "payment.succeeded"
    | "payment.failed"
    | string;
  subscriptionId?: string;
  customerId?: string;
  tenantId?: string;
  status?: SubscriptionStatus;
  currentPeriodEnd?: Date;
  amount?: number;
  currency?: string;
  rawPayload: any;
}

export interface IPaymentProvider {
  readonly provider: BillingProvider;
  createCheckoutSession(options: CheckoutSessionOptions): Promise<CheckoutSessionResponse>;
  handleWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<WebhookEventPayload>;
  verifySignature(rawBody: string, signature: string): boolean;
}
