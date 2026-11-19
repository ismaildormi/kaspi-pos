/**
 * X × Zebra — Phase 3 Linguistic Refinement, Darija/Tarifit Normalizer & s1 SelfCheck Protocol
 * Combines:
 * - Moroccan Darija + Riffian Tarifit Amazigh + Arabizi normalization (`Darija Normalizer`)
 * - Graceful prose calibration (`Atlas / Aya` poise)
 * - 7 Logo Archetypes structured guidance when brand/logo generation is requested
 * - `s1` deliberation budget tiers + deterministic `SelfCheckGPT` consistency audit
 */

export type RefinementLanguage = "ar" | "darija" | "tarifit" | "fr" | "en" | "mixed";
export type DeliberationTier = "fast" | "deliberate" | "deep_s1";

export interface DarijaNormalizationResult {
  original: string;
  normalizedQuery: string;
  detectedLanguage: RefinementLanguage;
  matchedTerms: string[];
  nadorRegionalMatch: boolean;
}

const DARIJA_GLOSSARY: Array<[RegExp, string]> = [
  [/\bbghit\b|بغيت/gi, "أريد / want"],
  [/\bchno\b|\bshno\b|شنو|اشنو/gi, "ماذا / what"],
  [/\bkifach\b|\bkifash\b|كيفاش/gi, "كيف / how"],
  [/\bchhal\b|\bshhal\b|شحال/gi, "كم / how much"],
  [/\blflous\b|\bflous\b|الفلوس|فلوس/gi, "المال والأرباح / money"],
  [/\bklian\b|\bclient\b|كليان/gi, "زبون / customer"],
  [/\btiki\b|\bticket\b|تيكي/gi, "تذكرة أو فاتورة / receipt"],
  [/\bsl3a\b|\bsel3a\b|سلعة|السلعة/gi, "مخزون ومنتجات / inventory"],
  [/\bwach\b|\bwash\b|واش/gi, "هل / is"],
  [/\bfin\b|فين/gi, "أين / where"],
  [/\bdaba\b|دابا/gi, "الآن / now"],
  [/\bmachi\b|\bmashi\b|ماشي/gi, "ليس / not"],
];

const TARIFIT_AND_NADOR_GLOSSARY: Array<[RegExp, string]> = [
  [/\bazul\b|أزول/gi, "مرحباً / welcome (Amazigh Riffian)"],
  [/\bmamesh\s+tedjid\b|\bmanich\b|مامش تدجيد/gi, "كيف حالك / how are you (Tarifit)"],
  [/\btanmirt\b|تانميرت/gi, "شكراً / thank you (Amazigh)"],
  [/\bnador\b|\bnadour\b|الناظور|ناظور/gi, "Nador (35.1688,-2.9335 Morocco Oriental)"],
  [/\bbeni\s+ansar\b|\bbni\s+ansar\b|بني أنصار|بني نصار/gi, "Beni Ansar Port Nador (35.2586,-2.9347)"],
  [/\bnador\s+west\s+med\b|الناظور غرب المتوسط/gi, "Nador West Med Port (35.2470,-3.1850)"],
  [/\bmarchica\b|مارشيكا/gi, "Marchica Lagoon Nador"],
  [/\bselouane\b|سلوان/gi, "Selouane Nador (35.0728,-2.9422)"],
  [/\bal\s+aroui\b|العروي/gi, "Al Aroui Nador Airport (35.0114,-3.0089)"],
  [/\bzaio\b|زايو/gi, "Zaio Nador (34.9389,-2.7328)"],
];

export const SEVEN_LOGO_ARCHETYPES = [
  "1. Wordmark (Typography-driven clean brand lettering)",
  "2. Lettermark / Monogram (1–3 crisp geometric initials)",
  "3. Pictorial / Brandmark (Recognizable standalone symbol with negative space)",
  "4. Abstract Geometric Mark (Mathematical / symmetry-based mark)",
  "5. Mascot (Expressive character emblem)",
  "6. Combination Mark (Balanced icon + wordmark lockup)",
  "7. Emblem / Seal (Framed badge / crest for artisanal & luxury shops)",
] as const;

export function normalizeDarijaAndTarifit(prompt: string): DarijaNormalizationResult {
  const original = String(prompt || "").trim();
  let arabicFolded = original
    .replace(/3/g, "ع")
    .replace(/7/g, "ح")
    .replace(/9/g, "ق")
    .replace(/5/g, "خ");

  const matchedTerms: string[] = [];
  let hasDarija = false;
  let hasTarifit = false;
  let nadorRegionalMatch = false;

  for (const [regex, gloss] of DARIJA_GLOSSARY) {
    regex.lastIndex = 0;
    if (regex.test(original)) {
      hasDarija = true;
      matchedTerms.push(gloss);
    }
  }

  for (const [regex, gloss] of TARIFIT_AND_NADOR_GLOSSARY) {
    regex.lastIndex = 0;
    if (regex.test(original)) {
      hasTarifit = true;
      nadorRegionalMatch = true;
      matchedTerms.push(gloss);
    }
  }

  if (/(الناظور|بني أنصار|مارشيكا|الجهة الشرقية|rif|oriental|oujda|berkane)/i.test(original)) {
    nadorRegionalMatch = true;
  }

  const hasArabicScript = /[\u0600-\u06FF]/.test(original);
  const hasFrench = /\b(bonjour|merci|combien|stock|ventes|facture|aujourd'hui)\b/i.test(original);
  const hasEnglish = /\b(hello|how|sales|revenue|build|explain|search)\b/i.test(original);

  let detectedLanguage: RefinementLanguage = "mixed";
  if (hasTarifit) detectedLanguage = "tarifit";
  else if (hasDarija) detectedLanguage = "darija";
  else if (hasArabicScript && !hasFrench && !hasEnglish) detectedLanguage = "ar";
  else if (hasFrench && !hasArabicScript) detectedLanguage = "fr";
  else if (hasEnglish && !hasArabicScript && !hasFrench) detectedLanguage = "en";

  const glossSuffix =
    matchedTerms.length > 0 ? ` [${matchedTerms.slice(0, 6).join(" | ")}]` : "";

  return {
    original,
    normalizedQuery: `${arabicFolded}${glossSuffix}`.trim(),
    detectedLanguage,
    matchedTerms: Array.from(new Set(matchedTerms)),
    nadorRegionalMatch,
  };
}

export function detectLogoDesignDirectives(prompt: string): string | null {
  if (!/(لوغو|شعار|هوية بصرية|logo|brandmark|monogram|emblem|brand identity)/i.test(prompt)) {
    return null;
  }
  return [
    "LOGO ENGINEERING RULES (7 Logo Archetypes):",
    ...SEVEN_LOGO_ARCHETYPES,
    "Enforce scalable crisp geometry (clean viewBox SVG, high-contrast negative space, max 2-3 cohesive palette colors).",
  ].join("\n");
}

export function planS1DeliberationBudget(prompt: string): {
  tier: DeliberationTier;
  tokenBudgetHint: string;
} {
  const p = (prompt || "").trim();
  const isDeep =
    p.length > 180 ||
    /(معادلة|برهن|قارن|خطة|معماري|تشخيص|تحليل شامل|verify|audit|architecture|compare|forecast|derive)/i.test(
      p
    );
  if (isDeep) {
    return {
      tier: "deep_s1",
      tokenBudgetHint:
        "s1 Deep Verification: cross-check every numeric figure, unit (MAD/wave height/date), and tool output before composing final answer.",
    };
  }
  const isMedium =
    /(pdf|excel|word|mermaid|katex|nador|الناظور|إحصائيات|تقرير|مبيعات|بحث|search)/i.test(p);
  if (isMedium) {
    return {
      tier: "deliberate",
      tokenBudgetHint:
        "s1 Deliberate Mode: call required tools cleanly first, validate retrieved facts, then present structured output.",
    };
  }
  return {
    tier: "fast",
    tokenBudgetHint: "Fast conversational poise: concise, warm, accurate, zero filler.",
  };
}

export interface SelfCheckConsistencyReport {
  consistent: boolean;
  selfCheckScore: number; // 0..10
  warnings: string[];
}

/**
 * SelfCheckGPT-inspired deterministic consistency & anti-placeholder audit before streaming completion saves.
 */
export function scoreSelfCheckConsistency(params: {
  draftText: string;
  expectedLocale: "ar" | "fr" | "en";
}): SelfCheckConsistencyReport {
  const text = String(params.draftText || "").trim();
  const warnings: string[] = [];
  let score = 10;

  if (!text || text.length < 8) {
    warnings.push("EMPTY_OR_TOO_SHORT");
    score -= 5;
  }

  if (/\b(?:TODO|TBD|FIXME|lorem ipsum|\[insert[^\]]*\])\b/i.test(text)) {
    warnings.push("UNFINISHED_PLACEHOLDER");
    score -= 3;
  }

  if (/(?:as an ai language model|i cannot access real-time)/i.test(text)) {
    warnings.push("GENERIC_REFUSAL_TONE");
    score -= 2;
  }

  // Detect mixed broken raw English error leak on Arabic answers
  if (params.expectedLocale === "ar" && /According to rules:|We need to call/i.test(text)) {
    warnings.push("ENGLISH_META_LEAK");
    score -= 3;
  }

  return {
    consistent: warnings.length === 0 && score >= 7,
    selfCheckScore: Math.max(0, Math.round(score * 10) / 10),
    warnings,
  };
}

export interface Phase3PromptRefinement {
  normalization: DarijaNormalizationResult;
  deliberation: ReturnType<typeof planS1DeliberationBudget>;
  logoGuidelines: string | null;
  systemDirectiveSnippet: string;
}

export function refinePromptWithPhase3(
  prompt: string,
  locale: "ar" | "fr" | "en"
): Phase3PromptRefinement {
  const normalization = normalizeDarijaAndTarifit(prompt);
  const deliberation = planS1DeliberationBudget(prompt);
  const logoGuidelines = detectLogoDesignDirectives(prompt);

  const lines = [
    `PHASE 3 LINGUISTIC & DELIBERATION PROFILE (${normalization.detectedLanguage.toUpperCase()} | ${deliberation.tier}):`,
    `- Atlas/Aya Poise: Respond in refined, natural ${
      locale === "ar" ? "Arabic/Moroccan Darija/Tarifit" : locale === "fr" ? "French" : "English"
    } matching user register smoothly with clean Markdown structure.`,
    `- ${deliberation.tokenBudgetHint}`,
  ];

  if (normalization.nadorRegionalMatch) {
    lines.push(
      "- Nador & Oriental Localization Active: Prioritize real metrics/maps around Nador (35.1688, -2.9335), Beni Ansar Port, Nador West Med, Marchica, Selouane & Al Aroui using `queryPublicApi` (`nador_marine_weather`, `smart_city_poi`, `transit_stops`, `weather`, `b2b_overpass`)."
    );
  }
  if (logoGuidelines) {
    lines.push(logoGuidelines);
  }

  return {
    normalization,
    deliberation,
    logoGuidelines,
    systemDirectiveSnippet: lines.join("\n"),
  };
}
