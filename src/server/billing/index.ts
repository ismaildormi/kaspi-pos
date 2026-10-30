import { BillingProvider } from "./types";
import { MockPaddleProvider } from "./mock-paddle";

let billingProviderInstance: BillingProvider | null = null;

export function getBillingProvider(): BillingProvider {
  if (!billingProviderInstance) {
    // In production, when PADDLE_API_KEY is configured, the real Paddle Billing SDK provider will be instantiated.
    // In local and sandbox dev, we default to the clearly labelled MockPaddleProvider.
    billingProviderInstance = new MockPaddleProvider();
  }
  return billingProviderInstance;
}
