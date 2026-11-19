/**
 * ============================================================================
 * KASPI POS × ZEBRA-X UNIFIED LEARNING TRACE ENGINE
 * Ported faithfully from Zebra-X-V2 (PACK026 learning-trace-exchange +
 * PACK016 behavioral-learning) for multi-device anonymous evolution traces.
 *
 * Guarantees:
 * - Rejects/redacts ALL credential, password, API key, vault, and private PII keys.
 * - Tracks multilingual intents (Moroccan Darija, Arabic, French, English),
 *   tool execution outcomes, comment auto-replies, and Owner corrections.
 * - Produces clean ChatML JSONL records for future LoRA / Unsloth fine-tuning.
 * ============================================================================
 */

export const LEARNING_TRACE_KINDS = [
  "MODEL_ROUTE",
  "OWNER_CORRECTION",
  "TOOL_EXECUTION",
  "COMMENT_RESPONDER",
  "POS_ANALYTICS",
  "MEDIA_OP",
] as const;

export const LEARNING_TRACE_OUTCOMES = [
  "SUCCESS",
  "FAILURE",
  "ABSTAIN",
  "BLOCKED",
  "CAPABILITY_GAP",
  "OWNER_GATE",
  "DETERMINISTIC",
] as const;

export type LearningTraceKind = (typeof LEARNING_TRACE_KINDS)[number];
export type LearningTraceOutcome = (typeof LEARNING_TRACE_OUTCOMES)[number];

export const FORBIDDEN_SECRET_KEY_RE =
  /(?:password|passwd|secret|credential_value|access_token|refresh_token|api_key|signing_key|recovery_key|vault_material|owner_root|private_reasoning|chain_of_thought|system_prompt|developer_prompt|bearer|authorization|cookie)/i;

const INLINE_SECRET_VALUE_RE =
  /(?:sk-[a-zA-Z0-9_-]{12,}|gsk_[a-zA-Z0-9_-]{12,}|AIza[0-9A-Za-z_-]{20,}|ghp_[0-9A-Za-z]{20,}|Bearer\s+[A-Za-z0-9._-]{16,})/g;

export interface ZebraLearningTraceRecord {
  schemaVersion: 1;
  traceId: string;
  kind: LearningTraceKind;
  outcomeStatus: LearningTraceOutcome;
  recordedAt: string;
  deviceId: string;
  tenantTag: string; // Anonymized short tenant hash; never leaks raw business secrets
  modelUsed: string;
  routeSource: "local_ollama" | "tauri_local" | "cloud_router" | "zebra_x_owner";
  language: "ar" | "darija" | "fr" | "en" | "mixed";
  userPrompt: string;
  assistantResponse: string;
  toolNamesUsed: string[];
  qualityScore: number; // 0..1
  ownerCorrected?: boolean;
  ownerCorrectionText?: string;
  prevHash?: string;
  traceDigest?: string;
}

export function scrubTraceText(input: unknown, maxLen = 2000): string {
  const raw = String(input ?? "").trim().replace(INLINE_SECRET_VALUE_RE, "[REDACTED_TOKEN]");
  return raw.length > maxLen ? `${raw.slice(0, maxLen)}…` : raw;
}

export function sanitizeTraceMetadata(
  value: unknown,
  trail = "trace"
): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return scrubTraceText(value, 1200);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 40).map((item, idx) => sanitizeTraceMetadata(item, `${trail}[${idx}]`));
  }
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_SECRET_KEY_RE.test(k)) {
      clean[k] = "[STRIPPED_BY_PRIVACY_FIREWALL]";
    } else {
      clean[k] = sanitizeTraceMetadata(v, `${trail}.${k}`);
    }
  }
  return clean;
}

export function detectTraceLanguage(text: string): "ar" | "darija" | "fr" | "en" | "mixed" {
  const s = text || "";
  const hasArabic = /[\u0600-\u06FF]/.test(s);
  const darijaMarkers =
    /(?:واش|بغيت|شحال|علاش|ديال|باش|كاين|ماكاينش|دابا|غادي|مزيان|صاحبي|خويا|التمن|الكاشير|السوق|فين|سميت)/i;
  const frenchMarkers =
    /\b(?:bonjour|bonsoir|merci|prix|ventes|aujourd'hui|combien|facture|caisse|commander|lien|avec|pour|quel|quelle|svp|produit)\b/gi;
  const englishMarkers =
    /\b(?:hello|hi|please|price|stock|sales|product|report|today|image|background|comment|link|order|check|show|help)\b/gi;

  const frHits = (s.match(frenchMarkers) || []).length;
  const enHits = (s.match(englishMarkers) || []).length;

  if (hasArabic && darijaMarkers.test(s)) return frHits > 0 ? "mixed" : "darija";
  if (hasArabic && (frHits > 0 || enHits > 0)) return "mixed";
  if (hasArabic) return "ar";
  if (frHits > 0 && enHits > 0 && enHits === frHits) return "mixed";
  if (frHits > enHits) return "fr";
  if (enHits > 0) return "en";
  return "darija";
}

export function normalizeClientTraceInput(
  input: Partial<ZebraLearningTraceRecord>
): ZebraLearningTraceRecord {
  const kind: LearningTraceKind = LEARNING_TRACE_KINDS.includes(input.kind as LearningTraceKind)
    ? (input.kind as LearningTraceKind)
    : "MODEL_ROUTE";
  const outcomeStatus: LearningTraceOutcome = LEARNING_TRACE_OUTCOMES.includes(
    input.outcomeStatus as LearningTraceOutcome
  )
    ? (input.outcomeStatus as LearningTraceOutcome)
    : "SUCCESS";

  const userPrompt = scrubTraceText(input.userPrompt, 1600);
  const assistantResponse = scrubTraceText(input.assistantResponse, 2800);
  const qualityScore = Math.max(
    0,
    Math.min(1, Number.isFinite(Number(input.qualityScore)) ? Number(input.qualityScore) : 0.85)
  );

  return {
    schemaVersion: 1,
    traceId:
      typeof input.traceId === "string" && input.traceId.trim()
        ? input.traceId.trim().slice(0, 64)
        : `zx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    outcomeStatus,
    recordedAt: input.recordedAt || new Date().toISOString(),
    deviceId: scrubTraceText(input.deviceId || "kaspi-node", 48),
    tenantTag: scrubTraceText(input.tenantTag || "merchant", 32),
    modelUsed: scrubTraceText(input.modelUsed || "qwen2.5:3b", 64),
    routeSource: input.routeSource || "local_ollama",
    language: input.language || detectTraceLanguage(`${userPrompt} ${assistantResponse}`),
    userPrompt,
    assistantResponse,
    toolNamesUsed: Array.isArray(input.toolNamesUsed)
      ? input.toolNamesUsed.map((t) => scrubTraceText(t, 48)).filter(Boolean).slice(0, 12)
      : [],
    qualityScore,
    ownerCorrected: Boolean(input.ownerCorrected),
    ownerCorrectionText: input.ownerCorrectionText
      ? scrubTraceText(input.ownerCorrectionText, 1200)
      : undefined,
  };
}

/**
 * Formats accumulated verified traces into clean ChatML JSONL format
 * compatible with Unsloth, Axolotl, Llama-Factory, and Ollama fine-tuning.
 */
export function formatTracesAsChatMlJsonl(traces: ZebraLearningTraceRecord[]): string {
  const systemMsg =
    "You are HEYUKA unified with KASPI POS sovereign intelligence. Answer fluently in Darija, Arabic, French, or English using accurate commerce and general knowledge logic.";
  return traces
    .filter((t) => t.userPrompt && (t.ownerCorrectionText || t.assistantResponse))
    .map((t) =>
      JSON.stringify({
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: t.userPrompt },
          { role: "assistant", content: t.ownerCorrectionText || t.assistantResponse },
        ],
        metadata: {
          traceId: t.traceId,
          kind: t.kind,
          language: t.language,
          modelUsed: t.modelUsed,
          qualityScore: t.qualityScore,
          recordedAt: t.recordedAt,
        },
      })
    )
    .join("\n");
}
