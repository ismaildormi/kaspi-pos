import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import {
  generateText,
  streamText,
  type LanguageModel,
} from "ai";

/**
 * Splits a comma-separated string of API keys into a clean, trimmed array.
 */
export function parseKeyPool(envVarValue?: string): string[] {
  if (!envVarValue) return [];
  return envVarValue
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export interface RouterCandidate {
  provider: "openrouter" | "google" | "groq";
  providerName: string;
  keyIndex: number;
  keyMasked: string;
  apiKey: string;
  modelId: string;
  model: LanguageModel;
}

/**
 * Builds the prioritized Multi-Gateway Candidate Pool:
 * 1. OpenRouter (openrouter/auto)
 * 2. Google Gemini Key 1 -> Key 2 (gemini-3.5-flash-lite / gemini-2.5-flash)
 * 3. Groq Key 1 -> Key 2 (openai/gpt-oss-20b / llama-3.3-70b-versatile)
 */
export function getRouterCandidates(): RouterCandidate[] {
  const candidates: RouterCandidate[] = [];

  // Priority 1: OpenRouter (Single Key)
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey && !openRouterKey.includes("mock")) {
    const orProvider = createOpenRouter({ apiKey: openRouterKey });
    candidates.push({
      provider: "openrouter",
      providerName: "OpenRouter",
      keyIndex: 0,
      keyMasked: `...${openRouterKey.slice(-6)}`,
      apiKey: openRouterKey,
      modelId: "openrouter/auto",
      model: orProvider("openrouter/auto") as unknown as LanguageModel,
    });
  }

  // Priority 2: Google Gemini (Key Pool)
  const geminiKeys = parseKeyPool(process.env.GOOGLE_API_KEYS);
  geminiKeys.forEach((key, idx) => {
    if (!key.includes("mock")) {
      const googleProvider = createGoogleGenerativeAI({ apiKey: key });
      // Uses gemini-3.5-flash-lite (high speed, 100% free tier capacity)
      const modelId = "gemini-3.5-flash-lite";
      candidates.push({
        provider: "google",
        providerName: "Google Gemini",
        keyIndex: idx,
        keyMasked: `...${key.slice(-6)}`,
        apiKey: key,
        modelId,
        model: googleProvider(modelId) as unknown as LanguageModel,
      });
    }
  });

  // Priority 3: Groq (Key Pool)
  const groqKeys = parseKeyPool(process.env.GROQ_API_KEYS);
  groqKeys.forEach((key, idx) => {
    if (!key.includes("mock")) {
      const groqProvider = createGroq({ apiKey: key });
      // Uses openai/gpt-oss-20b (active free tier model with sub-second latency)
      const modelId = "openai/gpt-oss-20b";
      candidates.push({
        provider: "groq",
        providerName: "Groq",
        keyIndex: idx,
        keyMasked: `...${key.slice(-6)}`,
        apiKey: key,
        modelId,
        model: groqProvider(modelId) as unknown as LanguageModel,
      });
    }
  });

  return candidates;
}

export type GenerateTextOptions = Omit<Parameters<typeof generateText>[0], "model">;
export type StreamTextOptions = Omit<Parameters<typeof streamText>[0], "model">;

/**
 * Execute text generation with Multi-Gateway Key Rotation & Failover
 */
export async function generateTextWithRouter(options: GenerateTextOptions) {
  const candidates = getRouterCandidates();

  if (candidates.length === 0) {
    throw new Error(
      "[AI Router] No valid API keys found in OPENROUTER_API_KEY, GOOGLE_API_KEYS, or GROQ_API_KEYS."
    );
  }

  const errors: { provider: string; keyIndex: number; error: string }[] = [];

  for (const candidate of candidates) {
    try {
      console.log(
        `[AI Router] Attempting Priority Gateway: ${candidate.providerName} (Key #${
          candidate.keyIndex + 1
        }: ${candidate.keyMasked}) with model [${candidate.modelId}]...`
      );

      const result = await generateText({
        model: candidate.model as any,
        ...(options as any),
      });

      console.log(
        `[AI Router] ✔ SUCCESS via ${candidate.providerName} (Key #${
          candidate.keyIndex + 1
        })`
      );

      const outputText =
        result.steps?.[result.steps.length - 1]?.text ||
        (result as any).text ||
        "";

      return {
        ...result,
        text: outputText,
        activeProvider: candidate.providerName,
        activeKeyIndex: candidate.keyIndex,
        activeModel: candidate.modelId,
      };
    } catch (err: any) {
      console.warn(
        `[AI Router] ✖ ${candidate.providerName} (Key #${
          candidate.keyIndex + 1
        }) error: ${err?.message || err}. Initiating failover rotation...`
      );
      errors.push({
        provider: candidate.providerName,
        keyIndex: candidate.keyIndex,
        error: err?.message || String(err),
      });
    }
  }

  throw new Error(
    `[AI Router] All ${candidates.length} keys across all providers exhausted.\nErrors:\n` +
      errors
        .map((e) => `• ${e.provider} (Key #${e.keyIndex + 1}): ${e.error}`)
        .join("\n")
  );
}

/**
 * Execute streaming text with Multi-Gateway Key Rotation & Failover
 */
export function streamTextWithRouter(options: StreamTextOptions) {
  const candidates = getRouterCandidates();

  if (candidates.length === 0) {
    throw new Error(
      "[AI Router] No valid API keys configured in Key Pool."
    );
  }

  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      console.log(
        `[AI Router] Initializing stream with ${candidate.providerName} (Key #${
          candidate.keyIndex + 1
        }: ${candidate.keyMasked}) [${candidate.modelId}]...`
      );

      const streamResult = streamText({
        model: candidate.model as any,
        ...(options as any),
      });

      return {
        streamResult,
        candidate,
      };
    } catch (err: any) {
      console.warn(
        `[AI Router] Failed to initialize stream on ${candidate.providerName} (Key #${
          candidate.keyIndex + 1
        }):`,
        err?.message || err
      );
      lastError = err;
    }
  }

  throw (
    lastError ||
    new Error("[AI Router] Failed to initialize stream on all providers.")
  );
}
