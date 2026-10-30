import { BillingProvider } from "@prisma/client";
import { IPaymentProvider } from "./types";
import { PaddleBillingProvider } from "./paddle";
import { YouCanPayBillingProvider } from "./youcanpay";
import { MockBillingProvider } from "./mock";

export * from "./types";
export * from "./paddle";
export * from "./youcanpay";
export * from "./mock";

const instances: Partial<Record<BillingProvider, IPaymentProvider>> = {};

export function getPaymentProvider(provider: BillingProvider = "paddle"): IPaymentProvider {
  if (!instances[provider]) {
    switch (provider) {
      case "paddle":
        instances[provider] = new PaddleBillingProvider();
        break;
      case "youcanpay":
        instances[provider] = new YouCanPayBillingProvider();
        break;
      case "mock":
      case "manual":
      default:
        instances[provider] = new MockBillingProvider();
        break;
    }
  }

  return instances[provider]!;
}
