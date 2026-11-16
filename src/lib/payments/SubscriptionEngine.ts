/**
 * KASPI POS (كسب) — Executive SaaS Subscription & Auto-Renewal Mandate Engine (`SubscriptionEngine.ts`)
 *
 * Implements the invariant KASPI pricing & recurring billing rules:
 * - 1st Poste (100% Features Included): 200 MAD / month
 * - Extra Simultaneous Postes: +150 MAD / month per additional Poste
 * - Annual Cycle Option: 15% savings (2,040 MAD/year for 1st Poste; +1,530 MAD/year per extra Poste)
 * - Auto-Renew Recurring Mandate (`autoRenew: true`):
 *   Saved tokenized payment method (`Stripe SetupIntent` / `NAPS Card-on-File` / `YouCanPay Token`)
 *   auto-charges every billing cycle until the merchant cancels in Customer Billing Portal or via their bank
 *   (`تبقى تقطع ليه ديما حتى يقطعها هو`).
 * - Smart Failed Payment Dunning & Retry Schedule (+1d, +3d, +7d).
 */

import type {
  BillingCycleInterval,
  MandateStatus,
  PaymentGatewayId,
  RecurringSubscriptionMandate,
  SupportedCurrency,
  TokenizedPaymentMethod,
} from "./types";
import { CurrencyEngine } from "./CurrencyEngine";

export interface KaspiSeatPricingBreakdown {
  posteCount: number;
  billingInterval: BillingCycleInterval;
  firstPosteMonthlyMad: number; // Always 200 MAD
  extraPosteMonthlyMad: number; // Always 150 MAD
  extraPostesCount: number;
  monthlySubtotalMad: number;
  annualDiscountPct: number;
  totalCycleMad: number;
  totalCycleUsd: number;
  totalCycleEur: number;
}

export class SubscriptionEngine {
  static readonly FIRST_POSTE_PRICE_MAD = 200;
  static readonly EXTRA_POSTE_PRICE_MAD = 150;
  static readonly ANNUAL_DISCOUNT_PCT = 15;
  static readonly RETRY_DAYS_SCHEDULE = [1, 3, 7];

  /**
   * Computes exact KASPI seat pricing:
   * 1st Poste = 200 MAD/month + (posteCount - 1) * 150 MAD/month.
   */
  static computeSeatPricing(
    posteCount: number = 1,
    billingInterval: BillingCycleInterval = "MONTHLY"
  ): KaspiSeatPricingBreakdown {
    const safePostes = Math.max(1, Math.floor(posteCount));
    const extraPostesCount = Math.max(0, safePostes - 1);
    const monthlySubtotalMad =
      SubscriptionEngine.FIRST_POSTE_PRICE_MAD +
      extraPostesCount * SubscriptionEngine.EXTRA_POSTE_PRICE_MAD;

    const isAnnual = billingInterval === "ANNUAL";
    const rawAnnualMad = monthlySubtotalMad * 12;
    const totalCycleMad = isAnnual
      ? Math.round(rawAnnualMad * (1 - SubscriptionEngine.ANNUAL_DISCOUNT_PCT / 100))
      : monthlySubtotalMad;

    return {
      posteCount: safePostes,
      billingInterval,
      firstPosteMonthlyMad: SubscriptionEngine.FIRST_POSTE_PRICE_MAD,
      extraPosteMonthlyMad: SubscriptionEngine.EXTRA_POSTE_PRICE_MAD,
      extraPostesCount,
      monthlySubtotalMad,
      annualDiscountPct: isAnnual ? SubscriptionEngine.ANNUAL_DISCOUNT_PCT : 0,
      totalCycleMad,
      totalCycleUsd: CurrencyEngine.convertFromMad(totalCycleMad, "USD"),
      totalCycleEur: CurrencyEngine.convertFromMad(totalCycleMad, "EUR"),
    };
  }

  /**
   * Builds a PCI-DSS 4.0.1 compliant Auto-Renew Recurring Mandate object.
   * Never stores raw PAN or CVV — only tokenized references and last4/brand/expiry.
   */
  static createRecurringMandate(params: {
    tenantId: string;
    provider: PaymentGatewayId;
    billingInterval: BillingCycleInterval;
    posteCount: number;
    autoRenew?: boolean;
    tokenizedMethod: TokenizedPaymentMethod;
    currency?: SupportedCurrency;
    freeTrialDays?: number;
  }): RecurringSubscriptionMandate {
    const pricing = SubscriptionEngine.computeSeatPricing(
      params.posteCount,
      params.billingInterval
    );
    const now = new Date();
    const nextBilling = new Date(now);
    if (params.billingInterval === "ANNUAL") {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    } else {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    }

    const freeTrialEndsAt =
      params.freeTrialDays && params.freeTrialDays > 0
        ? new Date(now.getTime() + params.freeTrialDays * 86_400_000).toISOString()
        : null;

    const autoRenew = params.autoRenew ?? true;
    const mandateStatus: MandateStatus = autoRenew ? "ACTIVE" : "CANCELED_AT_PERIOD_END";

    return {
      mandateId: `mnd_${params.provider}_${Date.now()}`,
      tenantId: params.tenantId,
      provider: params.provider,
      providerSubscriptionId: `sub_${params.provider}_${Date.now()}`,
      billingInterval: params.billingInterval,
      autoRenew,
      mandateStatus,
      cancelAtPeriodEnd: !autoRenew,
      retryCount: 0,
      maxRetries: SubscriptionEngine.RETRY_DAYS_SCHEDULE.length,
      nextBillingAt: nextBilling.toISOString(),
      freeTrialEndsAt,
      posteCount: pricing.posteCount,
      firstPostePriceMad: SubscriptionEngine.FIRST_POSTE_PRICE_MAD,
      extraPostePriceMad: SubscriptionEngine.EXTRA_POSTE_PRICE_MAD,
      totalCycleAmountMad: pricing.totalCycleMad,
      currency: params.currency || "MAD",
      tokenizedMethod: params.tokenizedMethod,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  /**
   * Computes next retry date when a recurring auto-debit attempt fails.
   */
  static computeNextRetryDate(retryCount: number, fromDate: Date = new Date()): string | null {
    if (retryCount >= SubscriptionEngine.RETRY_DAYS_SCHEDULE.length) {
      return null;
    }
    const days = SubscriptionEngine.RETRY_DAYS_SCHEDULE[retryCount];
    return new Date(fromDate.getTime() + days * 86_400_000).toISOString();
  }
}
