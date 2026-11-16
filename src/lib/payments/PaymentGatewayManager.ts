/**
 * KASPI POS (كسب) — Payment Gateway Manager (`PaymentGatewayManager.ts`)
 *
 * Central registry for all Global & Moroccan licensed PSP adapters:
 * - Global: Stripe Billing / SetupIntents / PaymentIntents + Wallet Tokenization (`Apple Pay`, `Google Pay`, `Samsung Wallet` via card PSP)
 * - Morocco Local: `NAPS ePay` (Card-on-File Recurring), `YouCan Pay` (30% reserve tracking), `CMI` (3DS2), `Payzone`, `TPE Bridge`
 */

import type { PaymentAdapter, PaymentGatewayId } from "./types";
import { StripePaymentAdapter } from "./stripe";
import { YouCanPayPaymentAdapter } from "./youcanpay";
import { CmiWebPaymentAdapter } from "./cmi-web";
import { NapsPaymentAdapter } from "./NapsAdapter";
import { PayzonePaymentAdapter } from "./PayzoneAdapter";
import { TpeBridgePaymentAdapter } from "./TpeBridge";
import { WalletPaymentAdapter } from "./WalletAdapter";

export interface GatewayCapabilityDescriptor {
  id: PaymentGatewayId;
  displayName: string;
  region: "GLOBAL" | "MOROCCO" | "BOTH";
  supportsRecurringMandate: boolean;
  supportsThreeDSecure2: boolean;
  supportsWalletTokenization: boolean;
  supportedCurrencies: string[];
  settlementDestination: "KASPI_SAAS_OR_MERCHANT_DIRECT";
}

export const GATEWAY_CAPABILITIES: Record<string, GatewayCapabilityDescriptor> = {
  stripe: {
    id: "stripe",
    displayName: "Stripe Global (Cards, Apple Pay, Google Pay)",
    region: "GLOBAL",
    supportsRecurringMandate: true,
    supportsThreeDSecure2: true,
    supportsWalletTokenization: true,
    supportedCurrencies: ["USD", "EUR", "MAD"],
    settlementDestination: "KASPI_SAAS_OR_MERCHANT_DIRECT",
  },
  naps: {
    id: "naps",
    displayName: "NAPS ePay Maroc (Card-on-File Recurring & e-Premium)",
    region: "MOROCCO",
    supportsRecurringMandate: true,
    supportsThreeDSecure2: true,
    supportsWalletTokenization: true,
    supportedCurrencies: ["MAD"],
    settlementDestination: "KASPI_SAAS_OR_MERCHANT_DIRECT",
  },
  youcanpay: {
    id: "youcanpay",
    displayName: "YouCan Pay Maroc (Cartes Nationales & Internationales)",
    region: "BOTH",
    supportsRecurringMandate: true,
    supportsThreeDSecure2: true,
    supportsWalletTokenization: false,
    supportedCurrencies: ["MAD", "USD", "EUR"],
    settlementDestination: "KASPI_SAAS_OR_MERCHANT_DIRECT",
  },
  cmi_web: {
    id: "cmi_web",
    displayName: "CMI E-Commerce Maroc (3D Secure 2)",
    region: "MOROCCO",
    supportsRecurringMandate: true,
    supportsThreeDSecure2: true,
    supportsWalletTokenization: false,
    supportedCurrencies: ["MAD"],
    settlementDestination: "KASPI_SAAS_OR_MERCHANT_DIRECT",
  },
  payzone: {
    id: "payzone",
    displayName: "Payzone Maroc (3DS2 & Tokenization)",
    region: "MOROCCO",
    supportsRecurringMandate: true,
    supportsThreeDSecure2: true,
    supportsWalletTokenization: true,
    supportedCurrencies: ["MAD"],
    settlementDestination: "KASPI_SAAS_OR_MERCHANT_DIRECT",
  },
  cmi_tpe: {
    id: "cmi_tpe",
    displayName: "Terminal TPE Bancaire Direct (Chip & PIN / NFC)",
    region: "MOROCCO",
    supportsRecurringMandate: false,
    supportsThreeDSecure2: false,
    supportsWalletTokenization: true,
    supportedCurrencies: ["MAD"],
    settlementDestination: "KASPI_SAAS_OR_MERCHANT_DIRECT",
  },
};

export class PaymentGatewayManager {
  static getAdapter(gateway: string): PaymentAdapter {
    switch (gateway.toLowerCase()) {
      case "stripe":
        return new StripePaymentAdapter();
      case "apple_pay":
        return new WalletPaymentAdapter("apple_pay");
      case "google_pay":
        return new WalletPaymentAdapter("google_pay");
      case "samsung_wallet":
        return new WalletPaymentAdapter("samsung_wallet");
      case "naps":
        return new NapsPaymentAdapter();
      case "youcanpay":
      case "youcanpay_local":
      case "youcanpay_intl":
        return new YouCanPayPaymentAdapter();
      case "cmi":
      case "cmi_web":
        return new CmiWebPaymentAdapter();
      case "payzone":
        return new PayzonePaymentAdapter();
      case "cmi_tpe":
      case "tpe":
      case "card":
      default:
        return new TpeBridgePaymentAdapter();
    }
  }

  static listCapabilities(): GatewayCapabilityDescriptor[] {
    return Object.values(GATEWAY_CAPABILITIES);
  }
}
