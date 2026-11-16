/**
 * KASPI POS (كسب) — Unified Global & Morocco Payment & Recurring Billing Architecture
 *
 * Exports all 16 payment, orchestration, fee-splitting, recurring mandate, TPE,
 * reconciliation, refund, dispute, fraud, currency, and PCI-DSS audit modules.
 */

export * from "./types";
export * from "./stripe";
export * from "./youcanpay";
export * from "./cmi-web";
export * from "./NapsAdapter";
export * from "./PayzoneAdapter";
export * from "./TpeBridge";
export * from "./WalletAdapter";
export * from "./PaymentGatewayManager";
export * from "./PaymentOrchestrator";
export * from "./FeeEngine";
export * from "./SubscriptionEngine";
export * from "./SettlementManager";
export * from "./WebhookProcessor";
export * from "./ReconciliationEngine";
export * from "./RefundEngine";
export * from "./DisputeManager";
export * from "./FraudRiskEngine";
export * from "./CurrencyEngine";
export * from "./AuditLogger";

import type { PaymentAdapter } from "./types";
import { PaymentGatewayManager } from "./PaymentGatewayManager";

export function getPaymentAdapter(gateway: string): PaymentAdapter {
  return PaymentGatewayManager.getAdapter(gateway);
}
