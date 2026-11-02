import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/server/db/prisma";
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
  provider: "custom" | "openrouter" | "google" | "groq";
  providerName: string;
  keyIndex: number;
  keyMasked: string;
  apiKey: string;
  modelId: string;
  model: LanguageModel;
  supportsVision: boolean;
}

/**
 * Builds the prioritized Multi-Gateway Candidate Pool:
 * 1. Custom BYOK (Super Admin configured in SystemSetting)
 * 2. Google Gemini Key Pool (gemini-3.5-flash-lite / gemini-2.5-flash) - Native Vision & Free Tier
 * 3. OpenRouter (openrouter/auto)
 * 4. Groq Key Pool (openai/gpt-oss-20b / llama-3.3-70b-versatile)
 */
export async function getRouterCandidates(): Promise<RouterCandidate[]> {
  const candidates: RouterCandidate[] = [];

  // Priority 1: Custom BYOK Providers (Configured by Super Admin in SystemSetting)
  try {
    const customSettings = await prisma.systemSetting.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    for (let idx = 0; idx < customSettings.length; idx++) {
      const setting = customSettings[idx];
      if (setting.apiKey && !setting.apiKey.includes("mock")) {
        const customOpenAI = createOpenAI({
          apiKey: setting.apiKey,
          baseURL: setting.baseUrl?.trim() || undefined,
        });

        const modelId = setting.providerName.toLowerCase().includes("gpt")
          ? setting.providerName
          : "gpt-4o-mini";

        candidates.push({
          provider: "custom",
          providerName: `BYOK (${setting.providerName})`,
          keyIndex: idx,
          keyMasked: `...${setting.apiKey.slice(-6)}`,
          apiKey: setting.apiKey,
          modelId,
          model: customOpenAI(modelId) as unknown as LanguageModel,
          supportsVision: true,
        });
      }
    }
  } catch (dbErr) {
    console.warn("[AI Router] Notice: Could not read SystemSetting from DB, skipping BYOK:", dbErr);
  }

  // Priority 2: Google Gemini (Native Multimodal & High Free Tier Limits)
  const geminiKeys = parseKeyPool(
    process.env.GOOGLE_API_KEYS || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
  geminiKeys.forEach((key, idx) => {
    if (!key.includes("mock")) {
      const googleProvider = createGoogleGenerativeAI({ apiKey: key });
      const modelId = "gemini-3.5-flash-lite";
      candidates.push({
        provider: "google",
        providerName: "Google Gemini",
        keyIndex: idx,
        keyMasked: `...${key.slice(-6)}`,
        apiKey: key,
        modelId,
        model: googleProvider(modelId) as unknown as LanguageModel,
        supportsVision: true,
      });
    }
  });

  // Priority 3: OpenRouter (Single Key fallback)
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
      supportsVision: true,
    });
  }

  // Priority 4: Groq (Ultra-Fast Text Inference Pool)
  const groqKeys = parseKeyPool(
    process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY
  );
  groqKeys.forEach((key, idx) => {
    if (!key.includes("mock")) {
      const groqProvider = createGroq({ apiKey: key });
      const modelId = "openai/gpt-oss-20b";
      candidates.push({
        provider: "groq",
        providerName: "Groq",
        keyIndex: idx,
        keyMasked: `...${key.slice(-6)}`,
        apiKey: key,
        modelId,
        model: groqProvider(modelId) as unknown as LanguageModel,
        supportsVision: false,
      });
    }
  });

  return candidates;
}

/**
 * Checks whether any message or prompt contains multimodal content (images / files).
 */
function hasMultimodalContent(options: any): boolean {
  if (options.messages && Array.isArray(options.messages)) {
    for (const msg of options.messages) {
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === "image" || part.type === "file") return true;
        }
      }
      if (Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          if (part.type === "image" || part.type === "file") return true;
        }
      }
      if (msg.imageUrl || msg.documentUrl || msg.experimental_attachments?.length) {
        return true;
      }
    }
  }
  return false;
}

export type GenerateTextOptions = Omit<Parameters<typeof generateText>[0], "model">;
export type StreamTextOptions = Omit<Parameters<typeof streamText>[0], "model">;

/**
 * Execute text/multimodal generation with Multi-Gateway Key Rotation & Failover
 */
export async function generateTextWithRouter(options: GenerateTextOptions) {
  const allCandidates = await getRouterCandidates();

  if (allCandidates.length === 0) {
    throw new Error(
      "[AI Router] No valid API keys found in SystemSetting, GOOGLE_API_KEYS, OPENROUTER_API_KEY, or GROQ_API_KEYS."
    );
  }

  const isMultimodal = hasMultimodalContent(options);
  const candidates = isMultimodal
    ? allCandidates.filter((c) => c.supportsVision)
    : allCandidates;

  if (candidates.length === 0) {
    throw new Error(
      "[AI Router] Multimodal request received but no vision-capable providers are available."
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
    `[AI Router] All ${candidates.length} candidates exhausted.\nErrors:\n` +
      errors
        .map((e) => `• ${e.provider} (Key #${e.keyIndex + 1}): ${e.error}`)
        .join("\n")
  );
}

/**
 * Execute streaming text/multimodal with Multi-Gateway Key Rotation & Failover
 */
export async function streamTextWithRouter(options: StreamTextOptions) {
  const allCandidates = await getRouterCandidates();

  if (allCandidates.length === 0) {
    throw new Error(
      "[AI Router] No valid API keys configured in Key Pool or SystemSetting."
    );
  }

  const isMultimodal = hasMultimodalContent(options);
  const candidates = isMultimodal
    ? allCandidates.filter((c) => c.supportsVision)
    : allCandidates;

  if (candidates.length === 0) {
    throw new Error(
      "[AI Router] Multimodal request received but no vision-capable providers are available."
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
