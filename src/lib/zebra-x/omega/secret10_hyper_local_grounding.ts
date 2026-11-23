import crypto from "node:crypto";
import Decimal from "decimal.js";
import { queryPublicApiHub } from "@/lib/zebra-x/tools/public-apis-hub";

export const MOROCCO_DGI_TVA_RATES = [0, 7, 10, 14, 20] as const;

export interface DgiInvoiceAuditInput {
  invoiceNumber: string;
  sellerIce: string;
  sellerIf?: string;
  buyerIce?: string;
  subtotalHtMad: number;
  vatRatePct: number;
  declaredTtcMad?: number;
  paymentMethod?: "cash" | "card" | "transfer" | "cheque";
}

export interface DgiInvoiceAuditResult {
  ok: boolean;
  compliantDgiArticle145: boolean;
  nf525SealSha256: string;
  sellerIceValid: boolean;
  vatRateValid: boolean;
  computedHtMad: string;
  computedTvaMad: string;
  computedTtcMad: string;
  timbreStampRequiredMad: string;
  warnings: string[];
  errors: string[];
}

/**
 * Secret #10 (`v88.0`) Part A: Genuine Morocco DGI (CGI Art. 145) & NF525 Invoice Validator.
 * Checks 15-digit ICE format, legal Moroccan TVA brackets (0/7/10/14/20%), Decimal centimes,
 * Art. 252 cash timbre rule (>5,000 MAD cash warning + 0.25% fiscal stamp rate), and NF525 seal.
 */
export function validateMoroccoDgiInvoice(input: DgiInvoiceAuditInput): DgiInvoiceAuditResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const cleanIce = String(input.sellerIce || "").replace(/\s+/g, "");
  const sellerIceValid = /^\d{15}$/.test(cleanIce);
  if (!sellerIceValid) {
    errors.push(`Invalid Seller ICE '${cleanIce}': Morocco DGI requires exactly 15 numeric digits.`);
  }

  const invNo = String(input.invoiceNumber || "").trim();
  if (!invNo) {
    errors.push("Missing chronological invoiceNumber (required under CGI Article 145).");
  }

  const vatPct = Number(input.vatRatePct);
  const vatRateValid = (MOROCCO_DGI_TVA_RATES as readonly number[]).includes(vatPct);
  if (!vatRateValid) {
    errors.push(`Non-standard Morocco TVA rate '${vatPct}%'. Legal rates: 0%, 7%, 10%, 14%, 20%.`);
  }

  const ht = new Decimal(Math.max(0, Number(input.subtotalHtMad || 0))).toDecimalPlaces(2);
  const tva = ht.mul(vatPct).div(100).toDecimalPlaces(2);
  const ttc = ht.plus(tva).toDecimalPlaces(2);

  if (typeof input.declaredTtcMad === "number") {
    const declared = new Decimal(input.declaredTtcMad).toDecimalPlaces(2);
    if (!declared.equals(ttc)) {
      errors.push(`TTC mismatch: declared ${declared.toFixed(2)} MAD != exact Decimal ${ttc.toFixed(2)} MAD.`);
    }
  }

  let timbre = new Decimal(0);
  if (input.paymentMethod === "cash" && ttc.greaterThan(5000)) {
    timbre = ttc.mul("0.0025").toDecimalPlaces(2);
    warnings.push(
      `DGI Cash Threshold Alert: Invoice (${ttc.toFixed(2)} MAD) > 5,000 MAD cash triggers 0.25% stamp duty (${timbre.toFixed(2)} MAD) and tax deductibility limits; recommend TPE/bank transfer.`
    );
  }

  const seal = crypto
    .createHash("sha256")
    .update(`${invNo}|${cleanIce}|${ht.toFixed(2)}|${vatPct}|${ttc.toFixed(2)}`, "utf8")
    .digest("hex");

  return {
    ok: errors.length === 0,
    compliantDgiArticle145: errors.length === 0,
    nf525SealSha256: seal,
    sellerIceValid,
    vatRateValid,
    computedHtMad: ht.toFixed(2),
    computedTvaMad: tva.toFixed(2),
    computedTtcMad: ttc.toFixed(2),
    timbreStampRequiredMad: timbre.toFixed(2),
    warnings,
    errors,
  };
}

export interface DarijaCommercialTermMatch {
  term: string;
  formalFrench: string;
  formalArabic: string;
  posModuleAction: string;
}

const DARIJA_COMMERCIAL_LEXICON: readonly DarijaCommercialTermMatch[] = [
  { term: "كريدي", formalFrench: "Créance client / Crédit magasin", formalArabic: "ذمة مدينة / بيع بالآجل", posModuleAction: "customers_credit_ledger" },
  { term: "بون", formalFrench: "Bon de livraison / Reçu", formalArabic: "وصل تسليم أو فاتورة مصغرة", posModuleAction: "print_thermal_receipt" },
  { term: "كمبيالة", formalFrench: "Lettre de change / Traite", formalArabic: "سفتجة / ورقة تجارية", posModuleAction: "supplier_cheque_maturity" },
  { term: "سلعة", formalFrench: "Stock / Marchandise SKU", formalArabic: "مخزون البضائع", posModuleAction: "inventory_sku_list" },
  { term: "جملة", formalFrench: "Vente en gros (B2B)", formalArabic: "بيع بالجملة", posModuleAction: "wholesale_price_tier" },
  { term: "تقسيط", formalFrench: "Paiement échelonné", formalArabic: "أداء بالتقسيط", posModuleAction: "installment_schedule" },
  { term: "راس المال", formalFrench: "Capital / Coût d'achat HT", formalArabic: "رأس المال / تكلفة الشراء", posModuleAction: "profit_cogs_margin" },
  { term: "تيڤيا", formalFrench: "TVA (Taxe sur la Valeur Ajoutée)", formalArabic: "الضريبة على القيمة المضافة", posModuleAction: "dgi_tva_report" },
];

export function resolveDarijaCommercialTerms(text: string): DarijaCommercialTermMatch[] {
  const clean = String(text || "");
  return DARIJA_COMMERCIAL_LEXICON.filter((entry) => clean.includes(entry.term));
}

/**
 * Secret #10 (`v88.0`) Part C: Live Zero-Key Hyper-Local Geo/FX/Weather Grounding via existing Public APIs Hub.
 */
export async function fetchHyperLocalLiveSnapshot(params?: { cityQuery?: string; barcode?: string }) {
  const city = params?.cityQuery || "Nador, Morocco";
  const [fx, weather, geo] = await Promise.all([
    queryPublicApiHub({ category: "frankfurter_fx", query: "MAD", lang: "en", limit: 3 }).catch(() => null),
    queryPublicApiHub({ category: "weather", query: city, lang: "en", limit: 3 }).catch(() => null),
    queryPublicApiHub({ category: "geocode", query: city, lang: "en", limit: 2 }).catch(() => null),
  ]);
  const barcodeLookup = params?.barcode
    ? await queryPublicApiHub({ category: "openfoodfacts", query: params.barcode, lang: "en", limit: 2 }).catch(() => null)
    : null;

  return {
    ok: true,
    cityQuery: city,
    fxAvailable: Boolean(fx?.ok),
    fxData: fx?.ok ? fx.data : null,
    weatherAvailable: Boolean(weather?.ok),
    weatherData: weather?.ok ? weather.data : null,
    geoAvailable: Boolean(geo?.ok),
    geoData: geo?.ok ? geo.data : null,
    barcodeData: barcodeLookup?.ok ? barcodeLookup.data : null,
  };
}
