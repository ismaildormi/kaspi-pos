import {
  BillingProvider,
  CheckoutSessionParams,
  CheckoutSessionResult,
  WebhookVerificationResult,
} from "./types";
import { randomUUID } from "node:crypto";

/**
 * MOCK PADDLE BILLING PROVIDER
 * Clearly labelled as a mock for development and sandbox testing without live credentials.
 */
export class MockPaddleProvider implements BillingProvider {
  public readonly name = "mock_paddle";

  async createCheckoutSession(
    params: CheckoutSessionParams
  ): Promise<CheckoutSessionResult> {
    const providerSessionId = `mock_paddle_txn_${randomUUID()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.info(
      `[MOCK PADDLE] Creating checkout session for tenant: ${params.tenantId}, plan: ${params.planCode}, interval: ${params.billingInterval}`
    );

    // In a mock environment, returns a sandbox redirect URL
    const checkoutUrl = `${baseUrl}/mock-paddle-checkout?txn=${providerSessionId}&tenant=${params.tenantId}&return=${encodeURIComponent(
      params.returnUrl
    )}`;

    return {
      checkoutUrl,
      providerSessionId,
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<boolean> {
    console.info(
      `[MOCK PADDLE] Canceling mock subscription: ${providerSubscriptionId}`
    );
    return true;
  }

  async verifyWebhook(
    rawBody: string,
    signatureHeader: string
  ): Promise<WebhookVerificationResult> {
    console.info(
      `[MOCK PADDLE] Verifying webhook signature: ${signatureHeader ? "PRESENT" : "MISSING"}`
    );

    try {
      const payload = JSON.parse(rawBody);
      // In mock mode, if signature is "valid_test_signature" or starts with "mock_", consider valid
      const isValid =
        !signatureHeader ||
        signatureHeader === "valid_test_signature" ||
        signatureHeader.startsWith("mock_");

      return {
        isValid,
        eventId: payload.event_id || payload.eventId || `mock_evt_${randomUUID()}`,
        eventType: payload.event_type || payload.eventType || "subscription.activated",
        payload,
      };
    } catch {
      return { isValid: false };
    }
  }
}
