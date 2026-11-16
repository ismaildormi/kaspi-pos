/**
 * KASPI POS (كسب) — Multi-Currency Minor-Unit & VAT Engine (`CurrencyEngine.ts`)
 *
 * Performs exact integer minor-unit (centimes / cents) calculations for MAD, EUR, and USD,
 * Moroccan TVA (20%, 14%, 10%, 7%, 0%) breakdowns, and display conversions.
 */

import type { SupportedCurrency } from "./types";

export interface TaxBreakdownResult {
  amountTtc: number;
  amountHt: number;
  taxAmount: number;
  taxRatePct: number;
  currency: SupportedCurrency;
}

const DEFAULT_FX_RATES_FROM_MAD: Record<SupportedCurrency, number> = {
  MAD: 1.0,
  USD: 0.10, // 10 MAD ≈ 1 USD
  EUR: 0.092, // ~10.87 MAD ≈ 1 EUR
};

export class CurrencyEngine {
  static toMinorUnits(amountMajor: number): number {
    return Math.round(Math.max(0, amountMajor) * 100);
  }

  static toMajorUnits(amountMinor: number): number {
    return Math.round(amountMinor) / 100;
  }

  static convertFromMad(amountMad: number, targetCurrency: SupportedCurrency): number {
    const rate = DEFAULT_FX_RATES_FROM_MAD[targetCurrency] ?? 1.0;
    const minor = Math.round(amountMad * rate * 100);
    return minor / 100;
  }

  static extractVatFromTtc(
    amountTtc: number,
    taxRatePct: number = 20,
    currency: SupportedCurrency = "MAD"
  ): TaxBreakdownResult {
    const ttcMinor = CurrencyEngine.toMinorUnits(amountTtc);
    const htMinor = Math.round(ttcMinor / (1 + taxRatePct / 100));
    const taxMinor = ttcMinor - htMinor;

    return {
      amountTtc: CurrencyEngine.toMajorUnits(ttcMinor),
      amountHt: CurrencyEngine.toMajorUnits(htMinor),
      taxAmount: CurrencyEngine.toMajorUnits(taxMinor),
      taxRatePct,
      currency,
    };
  }

  static formatMoney(amount: number, currency: SupportedCurrency = "MAD"): string {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
