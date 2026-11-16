/**
 * KASPI POS (كسب) — Configurable Admin Commission & POS Terminal Fee-Split Engine (`FeeEngine.ts`)
 *
 * Implements:
 * 1. Configurable PSP commission rates (editable in Admin/SuperAdmin panel):
 *    - Stripe: 2.9% + $0.30 USD (or 3.00 MAD)
 *    - YouCanPay Local (Morocco): 3.9% + 2.00 MAD (with 30% rolling reserve liquidity tracking)
 *    - YouCanPay International: 4.9% + 2.00 MAD (with 30% rolling reserve liquidity tracking)
 *    - CMI TPE / E-Commerce: 2.0% configurable
 *    - NAPS ePay: 1.98% / 1.68% national & 3.0% international
 * 2. Independent POS Terminal Fee-Split Calculator (`100/0`, `70/30`, `60/40`, `50/50`, `0/100`) separating:
 *    - Actual PSP fee
 *    - Customer transparent surcharge (shown on checkout & receipt only when contractually enabled)
 *    - Net Merchant Settlement
 */

import type { PaymentGatewayId, PosFeeSplitRatio, SupportedCurrency } from "./types";

export interface AdminGatewayFeeSchedule {
  stripePct: number;
  stripeFixedUsd: number;
  youcanpayLocalPct: number;
  youcanpayLocalFixedMad: number;
  youcanpayIntlPct: number;
  youcanpayIntlFixedMad: number;
  youcanpayReservePct: number; // 30% reserve liquidity tracking
  cmiTpePct: number;
  napsNationalStandardPct: number;
  napsNationalPrivilegedPct: number;
  napsInternationalPct: number;
}

export const DEFAULT_GATEWAY_FEE_SCHEDULE: AdminGatewayFeeSchedule = {
  stripePct: 2.9,
  stripeFixedUsd: 0.3,
  youcanpayLocalPct: 3.9,
  youcanpayLocalFixedMad: 2.0,
  youcanpayIntlPct: 4.9,
  youcanpayIntlFixedMad: 2.0,
  youcanpayReservePct: 30.0,
  cmiTpePct: 2.0,
  napsNationalStandardPct: 1.98,
  napsNationalPrivilegedPct: 1.68,
  napsInternationalPct: 3.0,
};

export interface FeeSplitComputation {
  gateway: PaymentGatewayId;
  orderSubtotal: number;
  actualPspFee: number;
  customerTransparentSurcharge: number;
  merchantAbsorbedFee: number;
  customerPayableTotal: number;
  netMerchantSettlement: number;
  rollingReserveHeldMad: number;
  immediatePayoutMad: number;
  splitRatio: PosFeeSplitRatio;
  customerSharePct: number;
  merchantSharePct: number;
  currency: SupportedCurrency;
  transparentReceiptDisclosure: string;
}

export class FeeEngine {
  private schedule: AdminGatewayFeeSchedule;

  constructor(customSchedule?: Partial<AdminGatewayFeeSchedule>) {
    this.schedule = {
      ...DEFAULT_GATEWAY_FEE_SCHEDULE,
      ...(customSchedule || {}),
    };
  }

  getSchedule(): AdminGatewayFeeSchedule {
    return { ...this.schedule };
  }

  updateSchedule(patch: Partial<AdminGatewayFeeSchedule>): AdminGatewayFeeSchedule {
    this.schedule = { ...this.schedule, ...patch };
    return this.getSchedule();
  }

  static resolveSplitPercentages(
    splitRatio: PosFeeSplitRatio,
    surchargeEnabled: boolean = true
  ): { customerPct: number; merchantPct: number } {
    if (!surchargeEnabled || splitRatio === "0/100") {
      return { customerPct: 0, merchantPct: 100 };
    }
    switch (splitRatio) {
      case "100/0":
        return { customerPct: 100, merchantPct: 0 };
      case "70/30":
        return { customerPct: 70, merchantPct: 30 };
      case "60/40":
        return { customerPct: 60, merchantPct: 40 };
      case "50/50":
        return { customerPct: 50, merchantPct: 50 };
      default:
        return { customerPct: 0, merchantPct: 100 };
    }
  }

  calculate(params: {
    amount: number;
    gateway: PaymentGatewayId;
    currency?: SupportedCurrency;
    splitRatio?: PosFeeSplitRatio;
    surchargeEnabled?: boolean;
    napsPrivilegedTier?: boolean;
    isInternationalCard?: boolean;
  }): FeeSplitComputation {
    const currency = params.currency || "MAD";
    const subtotalCents = Math.round(Math.max(0, params.amount) * 100);
    const splitRatio = params.splitRatio || "0/100";
    const surchargeEnabled = params.surchargeEnabled ?? (splitRatio !== "0/100");

    let actualFeeCents = 0;
    let reservePct = 0;

    switch (params.gateway) {
      case "stripe":
      case "apple_pay":
      case "google_pay":
      case "samsung_wallet": {
        const fixedCents = currency === "USD" ? Math.round(this.schedule.stripeFixedUsd * 100) : 300;
        actualFeeCents = Math.round((subtotalCents * this.schedule.stripePct) / 100) + fixedCents;
        break;
      }
      case "youcanpay":
      case "youcanpay_local": {
        const pct = params.isInternationalCard
          ? this.schedule.youcanpayIntlPct
          : this.schedule.youcanpayLocalPct;
        const fixed = params.isInternationalCard
          ? this.schedule.youcanpayIntlFixedMad
          : this.schedule.youcanpayLocalFixedMad;
        actualFeeCents = Math.round((subtotalCents * pct) / 100) + Math.round(fixed * 100);
        reservePct = this.schedule.youcanpayReservePct;
        break;
      }
      case "youcanpay_intl": {
        actualFeeCents =
          Math.round((subtotalCents * this.schedule.youcanpayIntlPct) / 100) +
          Math.round(this.schedule.youcanpayIntlFixedMad * 100);
        reservePct = this.schedule.youcanpayReservePct;
        break;
      }
      case "naps": {
        const napsPct = params.isInternationalCard
          ? this.schedule.napsInternationalPct
          : params.napsPrivilegedTier
          ? this.schedule.napsNationalPrivilegedPct
          : this.schedule.napsNationalStandardPct;
        actualFeeCents = Math.round((subtotalCents * napsPct) / 100);
        break;
      }
      case "cmi":
      case "cmi_web":
      case "cmi_tpe":
      case "payzone": {
        actualFeeCents = Math.round((subtotalCents * this.schedule.cmiTpePct) / 100);
        break;
      }
      case "bank_transfer":
      default: {
        actualFeeCents = 0;
        break;
      }
    }

    const { customerPct, merchantPct } = FeeEngine.resolveSplitPercentages(
      splitRatio,
      surchargeEnabled
    );

    const customerFeeCents = Math.round((actualFeeCents * customerPct) / 100);
    const merchantFeeCents = actualFeeCents - customerFeeCents;
    const customerPayableCents = subtotalCents + customerFeeCents;
    const netMerchantSettlementCents = subtotalCents - merchantFeeCents;

    const reserveHeldCents =
      reservePct > 0 ? Math.round((netMerchantSettlementCents * reservePct) / 100) : 0;
    const immediatePayoutCents = netMerchantSettlementCents - reserveHeldCents;

    const orderSubtotal = subtotalCents / 100;
    const actualPspFee = actualFeeCents / 100;
    const customerTransparentSurcharge = customerFeeCents / 100;
    const merchantAbsorbedFee = merchantFeeCents / 100;
    const customerPayableTotal = customerPayableCents / 100;
    const netMerchantSettlement = netMerchantSettlementCents / 100;

    const transparentReceiptDisclosure =
      customerTransparentSurcharge > 0
        ? `Montant HT/TTC: ${orderSubtotal.toFixed(2)} ${currency} | Frais TPE/PSP (${customerPct}%): +${customerTransparentSurcharge.toFixed(2)} ${currency} | Total Client: ${customerPayableTotal.toFixed(2)} ${currency} | Net Commerçant: ${netMerchantSettlement.toFixed(2)} ${currency}`
        : `Total Client: ${customerPayableTotal.toFixed(2)} ${currency} (0.00 ${currency} frais client) | Frais PSP (${actualPspFee.toFixed(2)} ${currency}) | Net Commerçant: ${netMerchantSettlement.toFixed(2)} ${currency}`;

    return {
      gateway: params.gateway,
      orderSubtotal,
      actualPspFee,
      customerTransparentSurcharge,
      merchantAbsorbedFee,
      customerPayableTotal,
      netMerchantSettlement,
      rollingReserveHeldMad: reserveHeldCents / 100,
      immediatePayoutMad: immediatePayoutCents / 100,
      splitRatio,
      customerSharePct: customerPct,
      merchantSharePct: merchantPct,
      currency,
      transparentReceiptDisclosure,
    };
  }
}
