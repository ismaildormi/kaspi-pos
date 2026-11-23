/**
 * HEYUKA v104 / v105 / v108 — Zero-Noise Astra-Grade Cognitive Frontier Blueprint
 * Combines structured intent analysis (Fabric), silent self-verification ('Wait' check per s1),
 * Execute-Before-Answer verification, and task-adaptive hyperparameters without prompt clutter.
 */

export interface InferenceHyperparams {
  temperature: number;
  topP: number;
  profile: "strict_deterministic" | "balanced_engineering" | "strategic_creative";
}

export function resolveOptimalInferenceHyperparams(params: {
  prompt: string;
  mode?: string;
  domainMode?: string;
}): InferenceHyperparams {
  const m = String(params.mode || "").toLowerCase();
  const d = String(params.domainMode || "").toLowerCase();
  const p = String(params.prompt || "");

  if (
    m === "coding" ||
    m === "security" ||
    d === "finance_erp_tax" ||
    /(code|bug|typescript|python|sql|tva|dgi|invoice|prove|math|calcul|برمجة|كود|فاتورة|ضريبة|حساب)/i.test(p)
  ) {
    return { temperature: 0.1, topP: 0.9, profile: "strict_deterministic" };
  }

  if (
    m === "creative" ||
    m === "video" ||
    m === "design" ||
    m === "council" ||
    /(strategy|pitch|story|design|brand|darija|فكرة|استراتيجية|تصميم|تفاوض|مناقشة)/i.test(p)
  ) {
    return { temperature: 0.65, topP: 0.92, profile: "strategic_creative" };
  }

  return { temperature: 0.35, topP: 0.9, profile: "balanced_engineering" };
}

export function buildCognitiveFrontierBlueprint(params: {
  brand: "heyuka" | "kaspi_pos";
  locale: string;
  thinkingEnabled?: boolean;
  compact?: boolean;
}): string {
  const identity =
    params.brand === "kaspi_pos"
      ? "HEYUKA Cognitive Core (KASPI POS Sovereign AI Advisor & ERP Architect)"
      : "HEYUKA Omni Cognitive Core (Astra-Grade Sovereign AI Architect)";

  const depthLine = params.thinkingEnabled
    ? "Silent Reasoning: Briefly test assumptions inside `<think>...</think>` ('Wait—verify math, IDs, and edge cases'), then emit ONLY crisp final output outside `</think>`."
    : "Zero-Fluff Execution: Think silently first, verify every equation, API path, and DOM ID, then deliver the exact runnable solution.";

  if (params.compact) {
    return `[COGNITIVE BLUEPRINT | ${identity}]
1. Intent First: Grasp the caller's exact goal, constraints, and locale (${params.locale}) before generating.
2. Execute-Before-Answer: Call tools/sandbox for calculations, DGI tax, web search, or file edits whenever accuracy is testable.
3. ${depthLine}
4. Complete Output: Zero TODO stubs, zero robotic disclaimers, exact clickable Markdown links for citations.`;
  }

  return `[ASTRA-GRADE COGNITIVE BLUEPRINT (v108.0) | ${identity}]
1. Deep Intent Deconstruction: Identify the user's true underlying goal, technical constraints, and target language (${params.locale}).
2. Execution Plan First: Break complex problems into ordered verified steps (Schema -> Logic -> UI -> Edge Cases).
3. Silent Critique ("Wait" Gate): Before finalizing, internally check for arithmetic errors, missing HTML/JS selectors, SQL/XSS flaws, or shallow generalities.
4. Mandatory Execute-Before-Answer: Use your attached verification tools (` + "`runAndVerifyCode`" + `, ` + "`verifyMoroccanTaxOrTrade`" + `, ` + "`queryVaultOrApi`" + `, ` + "`getOmniscienceLiveStats`" + `) to ground numbers, code, and live data instead of guessing.
5. Complete Action-First Delivery: Output full, cohesive, human-clear solutions (clean multi-file code, RTL invoices, interactive widgets, real Markdown links) with zero ` + "`...`" + ` placeholders.`;
}
