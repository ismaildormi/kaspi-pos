/**
 * KASPI POS (كسب) — Settlement & Bank Al-Maghrib Law 103-12 Separation Manager (`SettlementManager.ts`)
 *
 * Guarantees strict legal & accounting isolation between:
 * 1. Merchant POS Sales (`MERCHANT_DIRECT_ACCOUNT`): proceeds belong 100% to the merchant via
 *    their own Bank / Acquirer / TPE / PSP. KASPI never holds merchant funds or runs a wallet balance.
 * 2. KASPI SaaS Subscription Billing (`KASPI_SAAS_ACCOUNT`): independent software billing ledger
 *    (`200 MAD/month` 1st Poste + `150 MAD/month` extra Postes).
 */

import type { PaymentFlowType, PaymentGatewayId, SupportedCurrency } from "./types";

export interface SettlementScheduleEntry {
  batchId: string;
  storeId: string;
  tenantId: string;
  flow: PaymentFlowType;
  settlementTarget: "MERCHANT_DIRECT_ACCOUNT" | "KASPI_SAAS_ACCOUNT";
  provider: PaymentGatewayId;
  currency: SupportedCurrency;
  grossAmount: number;
  pspFeeAmount: number;
  reserveHeldAmount: number;
  netSettlementAmount: number;
  reserveReleaseAt: string | null;
  status: "SCHEDULED" | "IN_TRANSIT" | "SETTLED_TO_MERCHANT_BANK" | "SETTLED_TO_KASPI_SAAS";
}

export class SettlementManager {
  /**
   * Enforces Law 103-12 separation before scheduling or recording any settlement batch.
   */
  static assertLaw10312Separation(
    flow: PaymentFlowType,
    settlementTarget: "MERCHANT_DIRECT_ACCOUNT" | "KASPI_SAAS_ACCOUNT"
  ): void {
    if (flow === "MERCHANT_POS" && settlementTarget !== "MERCHANT_DIRECT_ACCOUNT") {
      throw new Error(
        "LAW_103_12_VIOLATION: Merchant POS proceeds must settle directly to MERCHANT_DIRECT_ACCOUNT (zero KASPI commingling)"
      );
    }
    if (flow === "SUBSCRIPTION" && settlementTarget !== "KASPI_SAAS_ACCOUNT") {
      throw new Error(
        "ACCOUNTING_SEPARATION_ERROR: KASPI SaaS billing must target KASPI_SAAS_ACCOUNT"
      );
    }
  }

  /**
   * Builds a separated settlement schedule entry, including YouCanPay's configurable
   * 30% rolling risk-reserve awareness when applicable.
   */
  static buildSettlementBatch(params: {
    storeId: string;
    tenantId: string;
    flow: PaymentFlowType;
    provider: PaymentGatewayId;
    currency?: SupportedCurrency;
    grossAmount: number;
    pspFeeAmount: number;
    rollingReservePct?: number;
  }): SettlementScheduleEntry {
    const settlementTarget =
      params.flow === "SUBSCRIPTION" ? "KASPI_SAAS_ACCOUNT" : "MERCHANT_DIRECT_ACCOUNT";
    SettlementManager.assertLaw10312Separation(params.flow, settlementTarget);

    const gross = Math.max(0, Math.round(params.grossAmount * 100) / 100);
    const fee = Math.max(0, Math.round(params.pspFeeAmount * 100) / 100);
    const afterFee = Math.max(0, Math.round((gross - fee) * 100) / 100);

    const reservePct =
      params.rollingReservePct ??
      (params.provider.startsWith("youcanpay") ? 30 : 0);
    const reserveHeldAmount = Math.round(afterFee * reservePct) / 100;
    const netSettlementAmount = Math.round((afterFee - reserveHeldAmount) * 100) / 100;

    const releaseDate =
      reserveHeldAmount > 0
        ? new Date(Date.now() + 90 * 86_400_000).toISOString()
        : null;

    return {
      batchId: `stl_${params.flow.toLowerCase()}_${Date.now()}`,
      storeId: params.storeId,
      tenantId: params.tenantId,
      flow: params.flow,
      settlementTarget,
      provider: params.provider,
      currency: params.currency || "MAD",
      grossAmount: gross,
      pspFeeAmount: fee,
      reserveHeldAmount,
      netSettlementAmount,
      reserveReleaseAt: releaseDate,
      status:
        settlementTarget === "MERCHANT_DIRECT_ACCOUNT"
          ? "SETTLED_TO_MERCHANT_BANK"
          : "SETTLED_TO_KASPI_SAAS",
    };
  }
}
