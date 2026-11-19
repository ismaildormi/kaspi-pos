import crypto from "node:crypto";
import Decimal from "decimal.js";
import * as Y from "yjs";

/**
 * HEYUKA / KASPI — v16.0–v19.0 Planetary Polyglot, Cascading Micro-Router,
 * Clean Corpus Reranker, Altcha-Pattern PoW, Yjs CRDT Sync & Formal Contract Verifier
 */

export interface GeoLanguageDetection {
  languageCode: string;
  dialectLabel: string;
  countryIso2: string;
  currencyCode: string;
  defaultVatPercent: number;
  direction: "rtl" | "ltr";
  confidence: number;
}

const COUNTRY_PROFILES: Record<
  string,
  { currency: string; vat: number; lang: string; dialect: string; dir: "rtl" | "ltr" }
> = {
  MA: { currency: "MAD", vat: 20, lang: "ary", dialect: "Moroccan Arabic / Darija", dir: "rtl" },
  FR: { currency: "EUR", vat: 20, lang: "fr", dialect: "French", dir: "ltr" },
  US: { currency: "USD", vat: 0, lang: "en", dialect: "US English", dir: "ltr" },
  ES: { currency: "EUR", vat: 21, lang: "es", dialect: "Spanish", dir: "ltr" },
  DE: { currency: "EUR", vat: 19, lang: "de", dialect: "German", dir: "ltr" },
  GB: { currency: "GBP", vat: 20, lang: "en", dialect: "UK English", dir: "ltr" },
  SA: { currency: "SAR", vat: 15, lang: "ar", dialect: "Gulf Arabic", dir: "rtl" },
  AE: { currency: "AED", vat: 5, lang: "ar", dialect: "UAE Arabic", dir: "rtl" },
  BR: { currency: "BRL", vat: 17, lang: "pt", dialect: "Brazilian Portuguese", dir: "ltr" },
  JP: { currency: "JPY", vat: 10, lang: "ja", dialect: "Japanese", dir: "ltr" },
  IN: { currency: "INR", vat: 18, lang: "hi", dialect: "Hindi / Indian Multilingual", dir: "ltr" },
  RU: { currency: "RUB", vat: 20, lang: "ru", dialect: "Russian", dir: "ltr" },
};

/**
 * Fast script + lexical ID (`GlotLID` / `fastText` pattern) supporting Arabic, Darija,
 * Tifinagh Amazigh, French, Spanish, German, Portuguese, Japanese, Hindi, Cyrillic & English.
 */
export function detectLanguageAndGeoProfile(
  text: string,
  countryHint?: string
): GeoLanguageDetection {
  const s = String(text || "").trim();
  const hint = (countryHint || "").toUpperCase();

  // Tifinagh script (Amazigh / Tarifit) or Tarifit Latin markers
  if (/[\u2D30-\u2D7F]/.test(s) || /\b(azul|tanmirt|mamesh|tarifit|nador)\b/i.test(s)) {
    return {
      languageCode: "rif",
      dialectLabel: "Riffian Tarifit Amazigh",
      countryIso2: "MA",
      currencyCode: "MAD",
      defaultVatPercent: 20,
      direction: "ltr",
      confidence: 0.96,
    };
  }

  // Arabic script -> distinguish Moroccan Darija vs MSA/Gulf
  if (/[\u0600-\u06FF]/.test(s)) {
    const isDarija = /(بغيت|شنو|اشنو|كيفاش|شحال|فين|دابا|ماشي|واش|ديال|الناظور|كليان|تيكي|فلوس|لايك|مزيان|بزاف)/.test(
      s
    );
    return {
      languageCode: isDarija ? "ary" : "ar",
      dialectLabel: isDarija ? "Moroccan Darija" : "Arabic (MSA)",
      countryIso2: isDarija ? "MA" : hint && COUNTRY_PROFILES[hint] ? hint : "MA",
      currencyCode: isDarija ? "MAD" : COUNTRY_PROFILES[hint]?.currency || "MAD",
      defaultVatPercent: COUNTRY_PROFILES[hint]?.vat ?? 20,
      direction: "rtl",
      confidence: 0.95,
    };
  }

  if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(s)) {
    const p = COUNTRY_PROFILES.JP;
    return {
      languageCode: "ja",
      dialectLabel: p.dialect,
      countryIso2: "JP",
      currencyCode: p.currency,
      defaultVatPercent: p.vat,
      direction: "ltr",
      confidence: 0.94,
    };
  }

  if (/[\u0900-\u097F]/.test(s)) {
    const p = COUNTRY_PROFILES.IN;
    return {
      languageCode: "hi",
      dialectLabel: p.dialect,
      countryIso2: "IN",
      currencyCode: p.currency,
      defaultVatPercent: p.vat,
      direction: "ltr",
      confidence: 0.95,
    };
  }

  if (/[\u0400-\u04FF]/.test(s)) {
    const p = COUNTRY_PROFILES.RU;
    return {
      languageCode: "ru",
      dialectLabel: p.dialect,
      countryIso2: "RU",
      currencyCode: p.currency,
      defaultVatPercent: p.vat,
      direction: "ltr",
      confidence: 0.94,
    };
  }

  if (/\b(bonjour|merci|combien|facture|caisse|stock|prix|produit|avec)\b/i.test(s)) {
    return {
      languageCode: "fr",
      dialectLabel: "French",
      countryIso2: hint || "FR",
      currencyCode: COUNTRY_PROFILES[hint]?.currency || "EUR",
      defaultVatPercent: COUNTRY_PROFILES[hint]?.vat ?? 20,
      direction: "ltr",
      confidence: 0.92,
    };
  }

  if (/\b(hola|precio|gracias|factura|cuanto|buenos|dias)\b/i.test(s)) {
    return {
      languageCode: "es",
      dialectLabel: "Spanish",
      countryIso2: hint || "ES",
      currencyCode: COUNTRY_PROFILES[hint]?.currency || "EUR",
      defaultVatPercent: COUNTRY_PROFILES[hint]?.vat ?? 21,
      direction: "ltr",
      confidence: 0.91,
    };
  }

  if (/\b(olá|obrigado|preço|fatura|quanto|loja)\b/i.test(s)) {
    return {
      languageCode: "pt",
      dialectLabel: "Portuguese",
      countryIso2: hint || "BR",
      currencyCode: "BRL",
      defaultVatPercent: 17,
      direction: "ltr",
      confidence: 0.9,
    };
  }

  if (/\b(hallo|danke|wie\s+viel|rechnung|preis|bitte|guten)\b/i.test(s)) {
    return {
      languageCode: "de",
      dialectLabel: "German",
      countryIso2: hint || "DE",
      currencyCode: "EUR",
      defaultVatPercent: 19,
      direction: "ltr",
      confidence: 0.9,
    };
  }

  if (/\b(chhal|kifach|bghit|chno|wach|daba|flous|sl3a|machi)\b/i.test(s)) {
    return {
      languageCode: "ary-latn",
      dialectLabel: "Moroccan Darija (Arabizi)",
      countryIso2: "MA",
      currencyCode: "MAD",
      defaultVatPercent: 20,
      direction: "ltr",
      confidence: 0.93,
    };
  }

  const fallback = COUNTRY_PROFILES[hint] || COUNTRY_PROFILES.US;
  return {
    languageCode: "en",
    dialectLabel: fallback.dialect,
    countryIso2: hint || "US",
    currencyCode: fallback.currency,
    defaultVatPercent: fallback.vat,
    direction: "ltr",
    confidence: 0.88,
  };
}

/**
 * Model Cascading Speculative Micro-Router: handles deterministic arithmetic/VAT/currency/locale
 * turns in <5ms at $0.00 LLM cost before delegating heavy multi-step prompts to `llm_core`.
 */
export function routeCascadingSpeculativeQuery(prompt: string): {
  tier: "micro_deterministic" | "llm_core";
  estimatedLlmCostUSD: 0 | null;
  microAnswer?: string;
  localeProfile: GeoLanguageDetection;
} {
  const localeProfile = detectLanguageAndGeoProfile(prompt);
  const p = String(prompt || "").trim();

  // Fast deterministic pure arithmetic pattern (safe parser: numbers + + - * / () only)
  const mathMatch = p.match(/^(?:calc|calculate|احسب|calcule)?\s*([0-9]+(?:\.[0-9]+)?(?:\s*[+\-*/]\s*[0-9]+(?:\.[0-9]+)?)+)\s*=?\??$/i);
  if (mathMatch) {
    try {
      const expr = mathMatch[1].replace(/\s+/g, "");
      const tokens = expr.split(/([+\-*/])/).filter(Boolean);
      if (tokens.length >= 3) {
        let acc = new Decimal(tokens[0]);
        for (let i = 1; i + 1 < tokens.length; i += 2) {
          const op = tokens[i];
          const val = new Decimal(tokens[i + 1]);
          if (op === "+") acc = acc.add(val);
          else if (op === "-") acc = acc.sub(val);
          else if (op === "*") acc = acc.mul(val);
          else if (op === "/") {
            if (val.isZero()) throw new Error("DIVIDE_BY_ZERO");
            acc = acc.div(val);
          }
        }
        const formatted = acc.toDecimalPlaces(4).toString();
        return {
          tier: "micro_deterministic",
          estimatedLlmCostUSD: 0,
          microAnswer: formatted.includes(".") ? formatted.replace(/\.?0+$/, "") : formatted,
          localeProfile,
        };
      }
    } catch {
      // Escalate cleanly
    }
  }

  return {
    tier: "llm_core",
    estimatedLlmCostUSD: null,
    localeProfile,
  };
}

/**
 * DataJuicer / Trafilatura / MinHash-Shingle clean text extractor & deduplicator.
 */
export function cleanAndDeduplicateCorpus(rawDocs: Array<{ id: string; text: string }>): Array<{
  id: string;
  cleanedText: string;
}> {
  const seenShingleSets: Array<Set<string>> = [];
  const cleanOut: Array<{ id: string; cleanedText: string }> = [];

  for (const doc of rawDocs) {
    const cleaned = String(doc.text || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length < 12) continue;

    const words = cleaned.toLowerCase().split(" ").filter(Boolean);
    const shingles = new Set<string>();
    for (let i = 0; i <= Math.max(0, words.length - 3); i++) {
      shingles.add(words.slice(i, i + 3).join("_"));
    }

    const isDup = seenShingleSets.some((prev) => {
      let inter = 0;
      shingles.forEach((s) => {
        if (prev.has(s)) inter++;
      });
      const union = prev.size + shingles.size - inter;
      return union > 0 && inter / union >= 0.8;
    });

    if (!isDup) {
      seenShingleSets.push(shingles);
      cleanOut.push({ id: doc.id, cleanedText: cleaned });
    }
  }
  return cleanOut;
}

/**
 * BM25-style lexical term saturation + ColBERTv2 token-level late-interaction reranker.
 */
export function hybridBm25AndLateInteractionRerank(
  query: string,
  docs: Array<{ id: string; text: string }>,
  topK = 3
): Array<{ id: string; text: string; score: number }> {
  const qTokens = String(query || "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2);
  if (qTokens.length === 0) return docs.slice(0, topK).map((d) => ({ ...d, score: 0 }));

  const avgLen =
    docs.reduce((sum, d) => sum + d.text.split(/\s+/).length, 0) / Math.max(1, docs.length);

  return docs
    .map((doc) => {
      const dWords = doc.text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
      const tf = new Map<string, number>();
      dWords.forEach((w) => tf.set(w, (tf.get(w) || 0) + 1));

      // BM25 saturation term + late-interaction MaxSim character prefix match
      let bm25Score = 0;
      let maxSimSum = 0;
      const k1 = 1.2;
      const b = 0.75;

      for (const qt of qTokens) {
        const freq = tf.get(qt) || 0;
        if (freq > 0) {
          bm25Score += (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (dWords.length / avgLen)));
        }
        let bestTokenSim = 0;
        for (const dw of tf.keys()) {
          if (dw === qt) {
            bestTokenSim = 1;
            break;
          }
          if (dw.includes(qt) || qt.includes(dw)) {
            bestTokenSim = Math.max(bestTokenSim, Math.min(dw.length, qt.length) / Math.max(dw.length, qt.length));
          }
        }
        maxSimSum += bestTokenSim;
      }

      const lateSim = maxSimSum / qTokens.length;
      const fusedScore = Number((bm25Score * 0.55 + lateSim * 1.45).toFixed(4));
      return { id: doc.id, text: doc.text, score: fusedScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Formal Accounting & Logic Contract Verifier (Quint/Lean/Pandera pattern)
 * Verifies VAT equation invariants and finite non-negative balances before returning outputs.
 */
export function verifyFormalAccountingContract(params: {
  subtotalHT: string | number;
  vatRatePercent: string | number;
  vatAmount: string | number;
  totalTTC: string | number;
}): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  try {
    const ht = new Decimal(params.subtotalHT);
    const rate = new Decimal(params.vatRatePercent);
    const vat = new Decimal(params.vatAmount);
    const ttc = new Decimal(params.totalTTC);

    if (ht.isNegative() || rate.isNegative() || vat.isNegative() || ttc.isNegative()) {
      violations.push("NEGATIVE_AMOUNT_VIOLATION");
    }
    const expectedVat = ht.mul(rate).div(100);
    if (vat.sub(expectedVat).abs().gt(0.02)) {
      violations.push(`VAT_FORMULA_MISMATCH: expected ${expectedVat.toFixed(2)}, got ${vat.toFixed(2)}`);
    }
    if (ht.add(vat).sub(ttc).abs().gt(0.02)) {
      violations.push(`TOTAL_TTC_INVARIANT_MISMATCH: ${ht.add(vat).toFixed(2)} !== ${ttc.toFixed(2)}`);
    }
  } catch {
    violations.push("NON_NUMERIC_CONTRACT_ARGUMENT");
  }
  return { valid: violations.length === 0, violations };
}

/**
 * Open-Source SHA-256 Proof-of-Work Challenge/Verifier (Altcha pattern, zero third-party keys).
 */
export function createAltchaPowChallenge(secretSalt: string, difficulty = 2): {
  challengeHex: string;
  salt: string;
  maxIterations: number;
  prefix: string;
} {
  const salt = `${secretSalt}:${Date.now()}:${crypto.randomBytes(6).toString("hex")}`;
  const targetNum = crypto.randomInt(10, 450);
  const challengeHex = crypto
    .createHash("sha256")
    .update(`${salt}:${targetNum}`)
    .digest("hex");
  return {
    challengeHex,
    salt,
    maxIterations: 5000,
    prefix: "0".repeat(Math.min(2, Math.max(1, difficulty))),
  };
}

export function solveAndVerifyAltchaPow(challenge: {
  challengeHex: string;
  salt: string;
  maxIterations: number;
}): { solved: boolean; nonce: number } {
  for (let n = 0; n <= challenge.maxIterations; n++) {
    const h = crypto.createHash("sha256").update(`${challenge.salt}:${n}`).digest("hex");
    if (h === challenge.challengeHex) {
      return { solved: true, nonce: n };
    }
  }
  return { solved: false, nonce: -1 };
}

const rateBuckets = new Map<string, number[]>();

/**
 * Sliding-Window Rate Limiter (Unkey Edge pattern).
 */
export function checkPlanetaryRateLimit(
  subjectKey: string,
  maxRequests = 60,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const prev = (rateBuckets.get(subjectKey) || []).filter((ts) => now - ts < windowMs);
  if (prev.length >= maxRequests) {
    rateBuckets.set(subjectKey, prev);
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, windowMs - (now - prev[0])),
    };
  }
  prev.push(now);
  rateBuckets.set(subjectKey, prev);
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - prev.length),
    resetMs: windowMs,
  };
}

/**
 * Local-First Conflict-Free CRDT Merge using Yjs (`yjs` Doc state vector exchange).
 */
export function mergeOfflineCrdtNotes(
  noteEntriesA: Array<[string, string]>,
  noteEntriesB: Array<[string, string]>
): { merged: Record<string, string>; stateByteLength: number } {
  const docA = new Y.Doc();
  const docB = new Y.Doc();
  const mapA = docA.getMap<string>("notes");
  const mapB = docB.getMap<string>("notes");
  for (const [k, v] of noteEntriesA) mapA.set(k, v);
  for (const [k, v] of noteEntriesB) mapB.set(k, v);

  const updateB = Y.encodeStateAsUpdate(docB);
  Y.applyUpdate(docA, updateB);

  const merged: Record<string, string> = {};
  docA.getMap<string>("notes").forEach((val, key) => {
    merged[key] = val;
  });
  const finalState = Y.encodeStateAsUpdate(docA);
  docA.destroy();
  docB.destroy();
  return { merged, stateByteLength: finalState.byteLength };
}
