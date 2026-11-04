/**
 * KASPI POS (كسب) — Unified Payment Adapters Registry
 */

export * from "./types";
export * from "./stripe";
export * from "./youcanpay";
export * from "./cmi-web";
export * from "./tpe-bridge";

import { PaymentAdapter } from "./types";
import { StripePaymentAdapter } from "./stripe";
import { YouCanPayPaymentAdapter } from "./youcanpay";
import { CmiWebPaymentAdapter } from "./cmi-web";
import { TpeBridgePaymentAdapter } from "./tpe-bridge";

export function getPaymentAdapter(gateway: string): PaymentAdapter {
  switch (gateway.toLowerCase()) {
    case "stripe":
      return new StripePaymentAdapter();
    case "youcanpay":
    case "youcanpay_local":
    case "youcanpay_intl":
      return new YouCanPayPaymentAdapter();
    case "cmi_web":
    case "cmi":
      return new CmiWebPaymentAdapter();
    case "cmi_tpe":
    case "tpe":
    case "card":
      return new TpeBridgePaymentAdapter();
    default:
      return new TpeBridgePaymentAdapter();
  }
}
