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

  // If stripping <think> emptied the entire response, salvage non-meta answer content from inside <think> in any world language
  if (!text.trim() && /<think>/i.test(rawText)) {
    const inner = String(rawText)
      .replace(/<\/?think>/gi, "")
      .replace(ENGLISH_META_MONOLOGUE_RE, "")
      .replace(INLINE_CHAIN_PREAMBLE_RE, "")
      .trim();
    if (inner.length >= 24 || /(\|.*\|)|```|#{1,3}\s+|[\u0600-\u06FF]{8,}/.test(inner)) {
      text = inner;
    }
  }

  // Do not replace branding inside JSON payloads/URLs/code blocks unless standalone prose
  const parts = text.split(/(```[\s\S]*?```|\[KASPI_[A-Z_]+:[^\]]+\])/g);
  const cleanedParts = parts.map((segment, idx) => {
    if (idx % 2 === 1) return segment; // Preserve code blocks & card markers verbatim
    return segment.replace(EXTERNAL_MODEL_BRANDING_RE, "HEYUKA");
  });

  text = cleanedParts.join("").replace(/\n{3,}/g, "\n\n");
  // Strip sporadic 1-3 char Cyrillic token noise occasionally emitted in Arabic/Latin streams
  if (/[\u0600-\u06FF]|[a-zA-Z]{6,}/.test(text)) {
    text = text.replace(/(^|\s)[\u0400-\u04FF]{1,3}(?=\s|$|[.،,!?؛:])/gu, "$1");
  }
  text = text.replace(/ {2,}/g, " ").trim();
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

  // Fallback salvage if reasoning stripped left an empty draft (avoid vague "please rephrase" loops)
  if (!finalText) {
    finalText = stripHiddenReasoningAndArtifacts(
      params.draftText.replace(/<\/?think>/gi, "")
    ).text.trim();
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

export interface MultiFileQualityReport {
  score: number; // 0..100
  issues: string[];
  missingDomIds: string[];
}

/**
 * Verifies generated multi-file Studio outputs cleanly (0 external cost):
 * checks for unresolved TODO stubs, JS syntax parse validity, and HTML<->JS DOM ID alignment.
 */
export function auditMultiFileWebQuality(
  files: Array<{ path: string; language?: string; content: string }>
): MultiFileQualityReport {
  if (!Array.isArray(files) || files.length === 0) {
    return { score: 100, issues: [], missingDomIds: [] };
  }

  const issues: string[] = [];
  const missingDomIds: string[] = [];
  let score = 100;

  const htmlIds = new Set<string>();
  const htmlCombined = files
    .filter((f) => f.path.endsWith(".html") || f.language === "html")
    .map((f) => f.content)
    .join("\n");
  for (const m of htmlCombined.matchAll(/\bid\s*=\s*["']([a-zA-Z0-9_-]+)["']/g)) {
    htmlIds.add(m[1]);
  }

  for (const f of files) {
    const body = String(f.content || "");
    if (/\/\/\s*TODO:|\[Insert\s+[^\]]+\]|placeholder implementation/i.test(body)) {
      issues.push(`${f.path}: contains unresolved TODO or placeholder marker`);
      score -= 12;
    }

    if (
      (f.path.endsWith(".js") || f.language === "js" || f.language === "javascript") &&
      !/\b(?:import|export)\b/.test(body)
    ) {
      try {
        // Parse syntax safely without executing code
        new Function(body);
      } catch (syntaxErr: any) {
        issues.push(`${f.path}: JS SyntaxError (${syntaxErr?.message || "parse error"})`);
        score -= 22;
      }

      if (htmlIds.size > 0) {
        for (const idMatch of body.matchAll(/getElementById\(\s*["']([a-zA-Z0-9_-]+)["']\s*\)/g)) {
          const domId = idMatch[1];
          if (!htmlIds.has(domId) && !body.includes(`id="${domId}"`) && !body.includes(`id='${domId}'`)) {
            if (!missingDomIds.includes(domId)) missingDomIds.push(domId);
          }
        }
      }
    }
  }

  if (missingDomIds.length > 0) {
    issues.push(`HTML/JS ID mismatch: missing #${missingDomIds.slice(0, 5).join(", #")} in HTML`);
    score -= Math.min(20, missingDomIds.length * 5);
  }

  return {
    score: Math.max(20, score),
    issues,
    missingDomIds: missingDomIds.slice(0, 12),
  };
}
