import { scrubTraceText } from "@/lib/zebra-x/learning-trace";

/**
 * HEYUKA (KASPI Sovereign AI) — Pre-Reply Reflection, Poise & Security Gate
 * 1. Eliminates leaked chain-of-thought (<think>, "User: ...", "We need to call...", "Let's proceed.").
 * 2. Prevents third-party/legacy model branding leakage (enforces unified HEYUKA identity).
 * 3. Masks secrets/credentials using Presidio-grade trace scrubbing.
 * 4. Scores structure & language alignment before final output renders in chat.
 */

export interface ReflectionAuditResult {
  cleanedText: string;
  qualityScore: number; // 0..10
  hadLeakedReasoning: boolean;
  hadSecretRedacted: boolean;
}

const THINK_BLOCK_RE = /<think>[\s\S]*?<\/think>/gi;
const UNCLOSED_THINK_RE = /<think>[\s\S]*$/gi;

// Detects the exact leaked English reasoning monologue pattern seen in reasoning checkpoints
const ENGLISH_META_MONOLOGUE_RE =
  /^(?:User:\s*["“].*?["”][\s\S]*?)?(?:According to rules:|We need to call\s+\w+|We can call\s+\w+|Let's proceed\.?|Let's call the tools\.?|The user is in Arabic, but system requires English output\.?)[^\n]*$/gim;

const INLINE_CHAIN_PREAMBLE_RE =
  /^\s*(?:Thought|Reasoning|Chain of Thought|Internal Plan|Let's trace):\s*[\s\S]*?(?=\n{2,}|$)/gim;

const EXTERNAL_MODEL_BRANDING_RE =
  /(?<!\/)\b(?:ollama|qwen[\w.-]*|gpt-oss[\w.-]*|llama[\w.-]*|deepseek[\w.-]*|litserve|nevea[\w.-]*|nova[\w.-]*|x\s*[×x]\s*zebra|x-zebra|xzebra)\b/gi;

/**
 * Strips raw internal reasoning, meta-monologue, and third-party/legacy engine names while
 * keeping special KASPI inline card tags intact.
 */
export function stripHiddenReasoningAndArtifacts(rawText: string): {
  text: string;
  hadLeakedReasoning: boolean;
} {
  if (!rawText) return { text: "", hadLeakedReasoning: false };

  let text = String(rawText);
  const initialLen = text.length;

  text = text.replace(THINK_BLOCK_RE, "").replace(UNCLOSED_THINK_RE, "");
  text = text.replace(ENGLISH_META_MONOLOGUE_RE, "");
  text = text.replace(INLINE_CHAIN_PREAMBLE_RE, "");

  // If stripping <think> emptied the entire response, salvage non-meta answer content from inside <think>
  if (!text.trim() && /<think>/i.test(rawText)) {
    const inner = String(rawText)
      .replace(/<\/?think>/gi, "")
      .replace(ENGLISH_META_MONOLOGUE_RE, "")
      .replace(INLINE_CHAIN_PREAMBLE_RE, "")
      .trim();
    if (/(\|.*\|)|```|#{1,3}\s+|[\u0600-\u06FF]{12,}/.test(inner)) {
      text = inner;
    }
  }

  // Do not replace branding inside JSON payloads/URLs/code blocks unless standalone prose
  const parts = text.split(/(```[\s\S]*?```|\[KASPI_[A-Z_]+:[^\]]+\])/g);
  const cleanedParts = parts.map((segment, idx) => {
    if (idx % 2 === 1) return segment; // Preserve code blocks & card markers verbatim
    return segment.replace(EXTERNAL_MODEL_BRANDING_RE, "HEYUKA");
  });

  text = cleanedParts.join("").replace(/\n{3,}/g, "\n\n").trim();
  const hadLeakedReasoning = text.length < initialLen - 8;

  return { text, hadLeakedReasoning };
}

/**
 * Runs deterministic Pre-Reply Self-Critique Gate on assistant draft before returning to user.
 */
export function runPreReplyReflectionGate(params: {
  draftText: string;
  expectedLocale: "ar" | "fr" | "en";
}): ReflectionAuditResult {
  const { text: withoutReasoning, hadLeakedReasoning } = stripHiddenReasoningAndArtifacts(
    params.draftText
  );

  // Scrub accidental inline API keys or tokens while keeping full length for tables/reports
  const scrubbed = scrubTraceText(withoutReasoning, 24_000);
  const hadSecretRedacted = scrubbed.includes("[REDACTED_TOKEN]");

  let finalText = scrubbed;

  // Fallback friendly response if reasoning leak consumed the entire output (broken stream)
  if (!finalText) {
    finalText =
      params.expectedLocale === "ar"
        ? "مرحباً، أعد صياغة طلبك قليلاً وسأجهز لك النتيجة مباشرة بشكل منسق ودقيق."
        : params.expectedLocale === "fr"
        ? "Bonjour, veuillez préciser votre demande afin que je prépare un résultat clair et structuré."
        : "Please clarify your request slightly so I can prepare a clean, structured result.";
  }

  // Quality rubric (0..10)
  let score = 10;
  if (hadLeakedReasoning) score -= 2;
  if (hadSecretRedacted) score -= 1;
  if (finalText.length < 15) score -= 2;
  if (/\|\s*---/.test(finalText)) score = Math.min(10, score + 0.5);

  return {
    cleanedText: finalText,
    qualityScore: Math.max(1, Math.min(10, Math.round(score * 10) / 10)),
    hadLeakedReasoning,
    hadSecretRedacted,
  };
}
