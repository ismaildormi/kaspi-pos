import { SubscriptionStatus } from "@prisma/client";

export interface CheckoutSessionParams {
  tenantId: string;
  userEmail: string;
  planCode: "pro";
  billingInterval: "monthly" | "yearly";
  returnUrl: string;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
  providerSessionId: string;
}

export interface SubscriptionDetails {
  providerSubscriptionId: string;
  providerCustomerId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  eventId?: string;
  eventType?: string;
  payload?: any;
}

export interface BillingProvider {
  name: string;
  createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<boolean>;
  verifyWebhook(
    rawBody: string,
    signatureHeader: string
  ): Promise<WebhookVerificationResult>;
}
