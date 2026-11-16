/**
 * KASPI POS (كسب) — Regional & Acquirer Compatibility Registry (`RegionalCompatibilityRegistry.ts`)
 *
 * Maps payment providers, acquirers, protocols, and country compliance boundaries
 * across Morocco (`MA`) and Global regions (`EU`, `US`, `GB`, `AE`).
 */

import type { TpeAutomationLevel, TpeCompatibilityStatus, TpeProtocolType } from "./types";

export interface RegionalTpeRule {
  countryCode: string;
  countryName: string;
  localAcquirers: string[];
  preferredProtocols: TpeProtocolType[];
  defaultAutomationLevel: TpeAutomationLevel;
  defaultStatus: TpeCompatibilityStatus;
  complianceNote: string;
}

export const REGIONAL_TPE_MATRIX: Record<string, RegionalTpeRule> = {
  MA: {
    countryCode: "MA",
    countryName: "Morocco (Maroc / المغرب)",
    localAcquirers: [
      "CMI (Centre Monétique Interbancaire)",
      "NAPS M2M",
      "Attijariwafa Bank TPE",
      "Banque Populaire (BCP)",
      "BMCE / Bank of Africa",
      "CIH Bank",
    ],
    preferredProtocols: ["OPI", "CONCERT_V3", "NEXO_RETAILER", "OFFICIAL_MANUFACTURER_SDK"],
    defaultAutomationLevel: "LEVEL_2_ASSISTED_AUTO",
    defaultStatus: "Requires Merchant Credentials",
    complianceNote:
      "Bank Al-Maghrib Law 103-12: TPE settlements flow directly to the merchant's Moroccan bank RIB.",
  },
  EU: {
    countryCode: "EU",
    countryName: "European Union (SEPA / EEA)",
    localAcquirers: ["Worldline", "Nexi", "Adyen", "Stripe Terminal"],
    preferredProtocols: ["NEXO_RETAILER", "OPI", "ADYEN_TERMINAL_API", "STRIPE_TERMINAL"],
    defaultAutomationLevel: "LEVEL_1_FULL_AUTO",
    defaultStatus: "Sandbox Tested",
    complianceNote: "PSD2 Strong Customer Authentication (EMV Chip & PIN / NFC Contactless).",
  },
  US: {
    countryCode: "US",
    countryName: "United States",
    localAcquirers: ["Stripe Terminal", "Adyen North America", "Verifone Point"],
    preferredProtocols: ["STRIPE_TERMINAL", "ADYEN_TERMINAL_API", "OPI"],
    defaultAutomationLevel: "LEVEL_1_FULL_AUTO",
    defaultStatus: "Sandbox Tested",
    complianceNote: "EMV Quick Chip + NFC Apple/Google/Samsung Wallet P2PE tokenization.",
  },
};

export class RegionalCompatibilityRegistry {
  static getRegionalRule(countryCode: string = "MA"): RegionalTpeRule {
    const code = countryCode.toUpperCase();
    return REGIONAL_TPE_MATRIX[code] || REGIONAL_TPE_MATRIX.MA;
  }

  static listSupportedRegions(): RegionalTpeRule[] {
    return Object.values(REGIONAL_TPE_MATRIX);
  }
}
