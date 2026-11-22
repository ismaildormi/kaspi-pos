import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/server/db/prisma";
import {
  getDecryptedTenantByokCredentials,
  PAID_OWNER_ENV_PROVIDERS,
} from "@/lib/heyuka/compute/zero-cost-policy";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  streamText,
  type LanguageModel,
} from "ai";

import { runLocalOnDeviceHeyukaBrain } from "@/lib/heyuka/local-sovereign-brain";
import { detectTruncationState, mergeContinuationChunk } from "@/lib/heyuka/autonomous-builder-v24-v28";

export interface RouterGovernanceScope {
  tenantId?: string;
  allowOwnerPaidProviders?: boolean;
  callerComputeUrl?: string;
  callerComputeKey?: string;
  callerModelId?: string;
  strictCloudOnly?: boolean;
}

function isSafeCallerComputeUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    // Block cloud metadata & link-local SSRF targets cleanly
    if (host === "169.254.169.254" || host.startsWith("169.254.") || host.endsWith(".internal")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

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
  provider:
    | "custom"
    | "openrouter"
    | "google"
    | "groq"
    | "mistral"
    | "together"
    | "deepseek"
    | "huggingface"
    | "local";
  providerName: string;
  keyIndex: number;
  keyMasked: string;
  apiKey: string;
  modelId: string;
  model: LanguageModel;
  supportsVision: boolean;
}

/**
 * Builds the prioritized Multi-Gateway Candidate Pool using verified live models:
 * 1. Custom BYOK (Super Admin configured in SystemSetting)
 * 2. Fast Groq Pool (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`) balanced across keys
 * 3. OpenRouter Free Vision & Tool Pool (`openrouter/free`, `nvidia/nemotron-3.5-super-vl:free`, `google/gemma-4-31b-it:free`)
 * 4. Google Gemini 3.x Multimodal Pool (`gemini-3.8-flash`, `gemini-flash-latest`, `gemini-3.7-flash`)
 * 5. Mistral / Together / DeepSeek / HuggingFace / Local Endpoint
 */
export async function getRouterCandidates(
  scope?: RouterGovernanceScope
): Promise<RouterCandidate[]> {
  const candidates: RouterCandidate[] = [];
  const allowPaidOwner = scope?.allowOwnerPaidProviders === true;

  // Priority -1: Caller's Own Server / Ollama / vLLM / Llamafile Endpoint ($0.00 Owner Cost, Unlimited)
  if (scope?.callerComputeUrl && isSafeCallerComputeUrl(scope.callerComputeUrl)) {
    try {
      const callerModelId = scope.callerModelId?.trim() || "qwen2.5:7b";
      const callerProvider = createOpenAI({
        apiKey: scope.callerComputeKey?.trim() || "none",
        baseURL: scope.callerComputeUrl.trim(),
      });
      candidates.push({
        provider: "local",
        providerName: "Caller Sovereign Server (0 Owner Cost)",
        keyIndex: 0,
        keyMasked: "caller-server",
        apiKey: "none",
        modelId: callerModelId,
        model: callerProvider(callerModelId) as unknown as LanguageModel,
        supportsVision: true,
      });
    } catch {
      // Ignore malformed caller endpoint safely
    }
  }

  // Priority 0: Tenant's Own Encrypted BYOK Provider (Zero Owner Financial Exposure)
  if (scope?.tenantId && scope.tenantId !== "00000000-0000-0000-0000-000000000000") {
    try {
      const tenantByoks = await getDecryptedTenantByokCredentials(scope.tenantId);
      for (let idx = 0; idx < tenantByoks.length; idx++) {
        const b = tenantByoks[idx];
        const byokModel =
          b.providerKind === "groq"
            ? createGroq({ apiKey: b.apiKey })(b.modelId || "openai/gpt-oss-120b")
            : b.providerKind === "google"
            ? createGoogleGenerativeAI({ apiKey: b.apiKey })(b.modelId || "gemini-flash-latest")
            : b.providerKind === "openrouter"
            ? createOpenRouter({ apiKey: b.apiKey })(b.modelId || "openrouter/free")
            : createOpenAI({
                apiKey: b.apiKey || "none",
                baseURL:
                  b.baseUrl ||
                  (b.providerKind === "mistral" ? "https://api.mistral.ai/v1" : undefined),
              })(b.modelId || "gpt-4o-mini");

        candidates.push({
          provider: "custom",
          providerName: `Tenant BYOK (${b.label})`,
          keyIndex: idx,
          keyMasked: b.maskedKey,
          apiKey: b.apiKey,
          modelId: b.modelId,
          model: byokModel as unknown as LanguageModel,
          supportsVision: true,
        });
      }
    } catch {
      // Continue safely to authorized free-tier pools if BYOK lookup is unavailable
    }
  }

  // Priority 1: Global Owner BYOK Providers (STRICTLY gated by explicit owner authorization)
  if (allowPaidOwner) {
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
            providerName: "HEYUKA Priority Core",
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
      console.warn("[HEYUKA Router] Notice: Could not read SystemSetting from DB, skipping BYOK:", dbErr);
    }
  }

  // Priority 2: Groq Ultra-Fast Live 2026 Models (balanced key rotation across model tiers)
  const groqKeys = parseKeyPool(
    process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY
  ).filter((k) => !k.includes("mock"));

  for (const modelId of ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]) {
    groqKeys.forEach((key, idx) => {
      const groqProvider = createGroq({ apiKey: key });
      candidates.push({
        provider: "groq",
        providerName: "HEYUKA Cloud Core",
        keyIndex: idx,
        keyMasked: `...${key.slice(-6)}`,
        apiKey: key,
        modelId,
        model: groqProvider(modelId) as unknown as LanguageModel,
        supportsVision: false,
      });
    });
  }

  // Priority 3: OpenRouter Verified Free Tool & Vision Routers
  const openRouterPoolKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterPoolKey && !openRouterPoolKey.includes("mock")) {
    const orProvider = createOpenRouter({ apiKey: openRouterPoolKey });
    for (const orModel of [
      "openrouter/free",
      "nvidia/nemotron-3.5-super-vl:free",
      "google/gemma-4-31b-it:free",
      "google/gemma-4-26b-a4b-it:free",
      "inclusionai/ling-3.2-flash:free",
    ]) {
      candidates.push({
        provider: "openrouter",
        providerName: "HEYUKA Neural Mesh",
        keyIndex: 0,
        keyMasked: `...${openRouterPoolKey.slice(-6)}`,
        apiKey: openRouterPoolKey,
        modelId: orModel,
        model: orProvider(orModel) as unknown as LanguageModel,
        supportsVision: true,
      });
    }
  }

  // Priority 4: Google Gemini Live Multimodal Pool
  const geminiKeys = parseKeyPool(
    process.env.GOOGLE_API_KEYS || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ).filter((k) => !k.includes("mock"));

  for (const modelId of ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.7-flash"]) {
    geminiKeys.forEach((key, idx) => {
      const googleProvider = createGoogleGenerativeAI({ apiKey: key });
      candidates.push({
        provider: "google",
        providerName: "HEYUKA Multimodal Core",
        keyIndex: idx,
        keyMasked: `...${key.slice(-6)}`,
        apiKey: key,
        modelId,
        model: googleProvider(modelId) as unknown as LanguageModel,
        supportsVision: true,
      });
    });
  }

  // Priority 5: Mistral AI Free Tier
  const mistralKeys = parseKeyPool(
    process.env.MISTRAL_API_KEYS || process.env.MISTRAL_API_KEY
  ).filter((k) => !k.includes("mock"));
  mistralKeys.forEach((key, idx) => {
    const mistralProvider = createOpenAI({
      apiKey: key,
      baseURL: "https://api.mistral.ai/v1",
    });
    candidates.push({
      provider: "mistral",
      providerName: "HEYUKA Studio Mesh",
      keyIndex: idx,
      keyMasked: `...${key.slice(-6)}`,
      apiKey: key,
      modelId: "mistral-small-latest",
      model: mistralProvider("mistral-small-latest") as unknown as LanguageModel,
      supportsVision: true,
    });
  });

  // Priority 6: Together AI (Restricted unless owner paid mode or explicit authorization)
  if (allowPaidOwner) {
    const togetherKeys = parseKeyPool(
      process.env.TOGETHER_API_KEYS || process.env.TOGETHER_API_KEY
    ).filter((k) => !k.includes("mock"));
    togetherKeys.forEach((key, idx) => {
      const togetherProvider = createOpenAI({
        apiKey: key,
        baseURL: "https://api.together.xyz/v1",
      });
      candidates.push({
        provider: "together",
        providerName: "HEYUKA Compute Node",
        keyIndex: idx,
        keyMasked: `...${key.slice(-6)}`,
        apiKey: key,
        modelId: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        model: togetherProvider("meta-llama/Llama-3.3-70B-Instruct-Turbo") as unknown as LanguageModel,
        supportsVision: false,
      });
    });

    // Priority 7: DeepSeek API (Owner-only unless tenant configures BYOK)
    const deepseekKeys = parseKeyPool(
      process.env.DEEPSEEK_API_KEYS || process.env.DEEPSEEK_API_KEY
    ).filter((k) => !k.includes("mock"));
    deepseekKeys.forEach((key, idx) => {
      const deepseekProvider = createOpenAI({
        apiKey: key,
        baseURL: "https://api.deepseek.com/v1",
      });
      candidates.push({
        provider: "deepseek",
        providerName: "HEYUKA Code Node",
        keyIndex: idx,
        keyMasked: `...${key.slice(-6)}`,
        apiKey: key,
        modelId: "deepseek-chat",
        model: deepseekProvider("deepseek-chat") as unknown as LanguageModel,
        supportsVision: false,
      });
    });
  }

  // Priority 8: Hugging Face Inference
  const hfKeys = parseKeyPool(
    process.env.HUGGINGFACE_API_KEYS || process.env.HUGGINGFACE_API_KEY
  ).filter((k) => !k.includes("mock"));
  hfKeys.forEach((key, idx) => {
    const hfProvider = createOpenAI({
      apiKey: key,
      baseURL: "https://api-inference.huggingface.co/v1",
    });
    candidates.push({
      provider: "huggingface",
      providerName: "HEYUKA Open Mesh",
      keyIndex: idx,
      keyMasked: `...${key.slice(-6)}`,
      apiKey: key,
      modelId: "Qwen/Qwen2.5-72B-Instruct",
      model: hfProvider("Qwen/Qwen2.5-72B-Instruct") as unknown as LanguageModel,
      supportsVision: false,
    });
  });

  // Priority 9: Self-Hosted Local Engine
  const localBaseUrl = process.env.LOCAL_AI_BASE_URL?.trim();
  if (localBaseUrl) {
    const localModelId = process.env.LOCAL_AI_MODEL?.trim() || "heyuka-local";
    const localProvider = createOpenAI({
      apiKey: "none",
      baseURL: localBaseUrl,
    });
    candidates.push({
      provider: "local",
      providerName: "HEYUKA Local Core",
      keyIndex: 0,
      keyMasked: "local-endpoint",
      apiKey: "none",
      modelId: localModelId,
      model: localProvider(localModelId) as unknown as LanguageModel,
      supportsVision: true,
    });
  }

  return candidates;
}

/**
 * Direct Zero-Key Pollinations HTTP fallback (POST https://text.pollinations.ai/openai)
 * invoked only when all configured cloud/local SDK gateways fail or rate-limit.
 */
async function callPollinationsZeroKeyHttp(params: {
  system?: string;
  messages?: any[];
}): Promise<string> {
  const flatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (params.system) {
    flatMessages.push({ role: "system", content: params.system.slice(0, 6000) });
  }
  for (const m of (params.messages || []).slice(-10)) {
    const role = m?.role === "assistant" ? "assistant" : "user";
    let txt = "";
    if (typeof m?.content === "string") txt = m.content;
    else if (Array.isArray(m?.content)) {
      txt = m.content
        .filter((p: any) => p?.type === "text")
        .map((p: any) => p.text || "")
        .join("\n");
    } else if (Array.isArray(m?.parts)) {
      txt = m.parts
        .filter((p: any) => p?.type === "text")
        .map((p: any) => p.text || "")
        .join("\n");
    }
    if (txt.trim()) flatMessages.push({ role, content: txt.trim().slice(0, 4000) });
  }

  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: flatMessages,
    }),
    signal: AbortSignal.timeout(28_000),
  });
  if (!res.ok) throw new Error(`Zero-Key HTTP ${res.status}`);
  const data = (await res.json()) as any;
  const reply = String(data?.choices?.[0]?.message?.content || "").trim();
  if (!reply) throw new Error("Empty Zero-Key response");
  return reply;
}

/**
 * Checks whether the active/recent messages actually require vision capabilities.
 * Inspects only the latest 2 messages so historical images/PDFs don't lock out fast text models.
 */
function hasMultimodalContent(options: any): boolean {
  if (options.messages && Array.isArray(options.messages)) {
    const recent = options.messages.slice(-2);
    for (const msg of recent) {
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

export type GenerateTextOptions = Omit<Parameters<typeof generateText>[0], "model"> & {
  governance?: RouterGovernanceScope;
};
export type StreamTextOptions = Omit<Parameters<typeof streamText>[0], "model"> & {
  governance?: RouterGovernanceScope;
};

/**
 * Execute non-streaming text/multimodal generation with Multi-Gateway Failover + Zero-Key fallback.
 */
export async function generateTextWithRouter(options: GenerateTextOptions) {
  const { governance, ...restGenOptions } = options;
  const allCandidates = await getRouterCandidates(governance);
  const filteredByCost =
    governance?.allowOwnerPaidProviders === true
      ? allCandidates
      : allCandidates.filter(
          (c) =>
            !PAID_OWNER_ENV_PROVIDERS.has(c.provider) ||
            c.providerName.startsWith("Tenant BYOK")
        );
  const isMultimodal = hasMultimodalContent(options);
  const candidates = isMultimodal
    ? filteredByCost.filter((c) => c.supportsVision)
    : filteredByCost;

  const errors: { provider: string; keyIndex: number; error: string }[] = [];

  for (const candidate of candidates) {
    try {
      const result = await generateText({
        model: candidate.model as any,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(
          isMultimodal ? 32_000 : candidate.provider === "groq" ? 24_000 : 28_000
        ),
        ...(restGenOptions as any),
      });

      const outputText =
        result.steps?.[result.steps.length - 1]?.text ||
        (result as any).text ||
        "";

      if (!outputText || !outputText.trim()) {
        throw new Error("Model returned empty output");
      }

      return {
        ...result,
        text: outputText,
        activeProvider: candidate.providerName,
        activeKeyIndex: candidate.keyIndex,
        activeModel: candidate.modelId,
      };
    } catch (err: any) {
      console.warn(
        `[HEYUKA Router] Failover from ${candidate.provider}:${candidate.modelId} (Key #${
          candidate.keyIndex + 1
        }): ${String(err?.message || err).slice(0, 140)}`
      );
      errors.push({
        provider: candidate.providerName,
        keyIndex: candidate.keyIndex,
        error: err?.message || String(err),
      });
    }
  }

  // Final Zero-Key text synthesis rescue for non-image requests
  if (!isMultimodal) {
    try {
      const openText = await callPollinationsZeroKeyHttp({
        system: typeof (options as any).system === "string" ? (options as any).system : undefined,
        messages: (options as any).messages,
      });
      return {
        text: openText,
        steps: [],
        activeProvider: "HEYUKA Open Core",
        activeKeyIndex: 0,
        activeModel: "heyuka-open",
      };
    } catch (openErr: any) {
      errors.push({
        provider: "HEYUKA Open Core",
        keyIndex: 0,
        error: openErr?.message || String(openErr),
      });
    }
  }

  // Unlimited Sovereign Client/Local Cascade: Never leave callers stuck at HTTP 429/503 when shared keys are busy
  if (governance?.strictCloudOnly !== true) {
    const msgs = Array.isArray((options as any).messages) ? (options as any).messages : [];
    const lastMsg = [...msgs].reverse().find((m: any) => m?.role === "user");
    const lastText =
      typeof lastMsg?.content === "string"
        ? lastMsg.content
        : Array.isArray(lastMsg?.content)
        ? lastMsg.content.map((p: any) => p?.text || "").join(" ").trim()
        : String((options as any).system || "HEYUKA request").slice(0, 400);
    const detectedAr = /[\u0600-\u06FF]/.test(lastText);
    const localBrain = runLocalOnDeviceHeyukaBrain({
      prompt: lastText || "Hello HEYUKA",
      mode: "auto",
      locale: detectedAr ? "ar" : "en",
    });
    return {
      text: localBrain.answer,
      steps: [],
      activeProvider: "HEYUKA Unlimited Client-Compute Engine",
      activeKeyIndex: 0,
      activeModel: "heyuka-sovereign-local",
      studioFiles: localBrain.studioFiles,
    } as any;
  }

  throw new Error(
    `[HEYUKA Router] All ${candidates.length} candidates exhausted.\nErrors:\n` +
      errors.map((e) => `• ${e.provider}: ${e.error}`).join("\n")
  );
}

/**
 * Legacy helper retained for backward compatibility where raw streamText return shape is expected.
 */
export async function streamTextWithRouter(options: StreamTextOptions) {
  const allCandidates = await getRouterCandidates();
  const isMultimodal = hasMultimodalContent(options);
  const candidates = isMultimodal
    ? allCandidates.filter((c) => c.supportsVision)
    : allCandidates;

  if (candidates.length === 0) {
    throw new Error("[HEYUKA Router] No gateway candidates available.");
  }

  const candidate = candidates[0];
  const streamResult = streamText({
    model: candidate.model as any,
    maxRetries: 0,
    ...(options as any),
  });
  return { streamResult, candidate };
}

/**
 * Production UIMessage Stream Response with TRUE async stream-level failover:
 * Buffers control chunks until a candidate produces real payload tokens or tool calls,
 * rotates instantly on HTTP 404/429/401/tool_use errors, and falls back to tools-free or Open Core.
 */
export async function streamUiResponseWithRouter(
  options: StreamTextOptions & {
    onCompletedText?: (text: string, candidate: Pick<RouterCandidate, "providerName" | "modelId" | "keyIndex">) => Promise<void> | void;
  },
  headers: Record<string, string> = {}
): Promise<Response> {
  const { onFinish: userOnFinish, onCompletedText, governance, ...restOptions } = options as any;
  const allCandidates = await getRouterCandidates(governance);
  const isMultimodal = hasMultimodalContent(options);
  const baseCandidates = isMultimodal
    ? allCandidates.filter((c) => c.supportsVision)
    : allCandidates;

  // Build ordered attempts: tool-enabled pass across all candidates, then clean text-only fallback if tools caused rejection
  const attempts: Array<{ candidate: RouterCandidate; stripTools: boolean }> = [
    ...baseCandidates.map((candidate) => ({ candidate, stripTools: false })),
  ];
  if (restOptions.tools) {
    for (const candidate of baseCandidates.slice(0, 4)) {
      attempts.push({ candidate, stripTools: true });
    }
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const streamStartedAt = Date.now();
      let succeeded = false;
      let streamStartedOnWriter = false;
      let lastErrMsg = "All HEYUKA cloud gateways unavailable";

      for (let attemptIdx = 0; attemptIdx < attempts.length; attemptIdx++) {
        // Leave clean safety margin before 60s serverless cutoff so fallback ALWAYS finishes in time
        if (attemptIdx > 0 && Date.now() - streamStartedAt > 44_000) break;

        const { candidate, stripTools } = attempts[attemptIdx];
        let emittedToClient = false;
        const bufferedHeaderChunks: any[] = [];
        let collectedText = "";
        let openTextPartId: string | null = null;
        let heldFinishChunks: any[] = [];

        try {
          const callConfig = { ...restOptions };
          if (stripTools) delete callConfig.tools;
          const remainingMs = Math.max(8_000, 48_000 - (Date.now() - streamStartedAt));
          const attemptTimeoutMs = Math.min(remainingMs, attemptIdx === 0 ? 22_000 : 15_000);

          const res = streamText({
            model: candidate.model as any,
            maxRetries: 0,
            abortSignal: AbortSignal.timeout(attemptTimeoutMs),
            ...callConfig,
          });

          for await (const chunk of res.toUIMessageStream()) {
            const c = chunk as any;
            if (c.type === "error") {
              throw new Error(String(c.errorText || c.error?.message || "Upstream stream error"));
            }
            if (c.type === "abort" && !emittedToClient) {
              throw new Error("Upstream stream aborted before content");
            }

            if (c.type === "text-start" && c.id) {
              openTextPartId = String(c.id);
            } else if (c.type === "text-delta") {
              const piece = typeof c.delta === "string" ? c.delta : typeof c.textDelta === "string" ? c.textDelta : "";
              collectedText += piece;
            } else if (c.type === "text-end") {
              openTextPartId = null;
            }

            // Hold terminal step/stream finish chunks briefly so we can seamlessly stream MAX_TOKENS continuations if cut off
            if (c.type === "finish-step" || c.type === "finish") {
              heldFinishChunks.push(chunk);
              continue;
            }

            const isContentChunk =
              (c.type === "text-delta" && Boolean(c.delta || c.textDelta)) ||
              c.type === "tool-output-available";

            if (!emittedToClient) {
              if (isContentChunk) {
                emittedToClient = true;
                streamStartedOnWriter = true;
                for (const h of bufferedHeaderChunks) writer.write(h);
                bufferedHeaderChunks.length = 0;
                writer.write(chunk);
              } else {
                bufferedHeaderChunks.push(chunk);
              }
            } else {
              writer.write(chunk);
            }
          }

          let visibleClean = collectedText
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .replace(/<think>[\s\S]*$/gi, "")
            .trim();

          if (!emittedToClient || !visibleClean) {
            throw new Error("Upstream produced zero visible text after reasoning strip");
          }

          // Auto-Continuation Loop inside live stream when upstream hit MAX_TOKENS (`length`) or stopped mid-code
          let finishReason: string | undefined;
          try {
            finishReason = await (res as any).finishReason;
          } catch {}

          let hopCount = 0;
          while (
            hopCount < 2 &&
            Date.now() - streamStartedAt < 48_000 &&
            (finishReason === "length" || detectTruncationState(visibleClean).truncated)
          ) {
            hopCount += 1;
            const trunc = detectTruncationState(visibleClean);
            try {
              const contGen = await generateText({
                model: candidate.model as any,
                maxRetries: 0,
                abortSignal: AbortSignal.timeout(Math.max(6_000, 52_000 - (Date.now() - streamStartedAt))),
                system:
                  "Continue seamlessly from the exact cutoff point without repeating earlier text or adding commentary. Close all unfinished Markdown tables, headings, lists, and code fences cleanly.",
                messages: [
                  {
                    role: "user",
                    content: `Continue directly from the exact tail below:\n${trunc.tailSnippet || visibleClean.slice(-420)}`,
                  },
                ],
                temperature: 0.25,
              });
              const contChunk = String(contGen.text || "").trim();
              if (!contChunk) break;

              const merged = mergeContinuationChunk(visibleClean, contChunk);
              const deltaToAppend = merged.startsWith(visibleClean)
                ? merged.slice(visibleClean.length)
                : `\n${contChunk}`;
              if (!deltaToAppend.trim()) break;

              const contId = openTextPartId || `cont-${Date.now()}-${hopCount}`;
              if (!openTextPartId) writer.write({ type: "text-start", id: contId } as any);
              writer.write({ type: "text-delta", id: contId, delta: deltaToAppend } as any);
              if (!openTextPartId) writer.write({ type: "text-end", id: contId } as any);

              collectedText = `${collectedText}${deltaToAppend}`;
              visibleClean = merged;
              finishReason = (contGen as any).finishReason;
            } catch {
              break;
            }
          }

          // Flush held terminal markers once auto-continuation completes
          for (const fin of heldFinishChunks) {
            writer.write(fin);
          }

          succeeded = true;
          if (collectedText && onCompletedText) {
            await Promise.resolve(onCompletedText(collectedText, candidate)).catch(() => {});
          }
          if (collectedText && userOnFinish) {
            await Promise.resolve(userOnFinish({ text: collectedText })).catch(() => {});
          }
          break;
        } catch (err: any) {
          lastErrMsg = String(err?.message || err);
          console.warn(
            `[HEYUKA Stream Failover] ${candidate.provider}:${candidate.modelId}${
              stripTools ? " (text-only)" : ""
            } failed -> ${lastErrMsg.slice(0, 140)}`
          );
          const visibleClean = collectedText
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .replace(/<think>[\s\S]*$/gi, "")
            .trim();
          if (emittedToClient && visibleClean.length > 24) {
            for (const fin of heldFinishChunks) {
              writer.write(fin);
            }
            succeeded = true;
            if (onCompletedText) {
              await Promise.resolve(onCompletedText(collectedText, candidate)).catch(() => {});
            }
            break;
          }
        }
      }

      // Final Zero-Key Open Core -> Local On-Device Brain rescue so user stream NEVER throws an abrupt dead-end error
      if (!succeeded && !isMultimodal) {
        let rescueReply = "";
        try {
          rescueReply = await callPollinationsZeroKeyHttp({
            system: typeof restOptions.system === "string" ? restOptions.system : undefined,
            messages: restOptions.messages,
          });
        } catch {
          const lastUserTxt = Array.isArray(restOptions.messages)
            ? String(restOptions.messages[restOptions.messages.length - 1]?.content || "")
            : "";
          rescueReply = runLocalOnDeviceHeyukaBrain({
            prompt: lastUserTxt || "Assist cleanly with complete solution",
            locale: "ar",
          }).answer;
        }
        const msgId = `txt-${Date.now()}`;
        if (!streamStartedOnWriter) {
          writer.write({ type: "start" } as any);
        }
        writer.write({ type: "start-step" } as any);
        writer.write({ type: "text-start", id: msgId } as any);
        writer.write({ type: "text-delta", id: msgId, delta: rescueReply } as any);
        writer.write({ type: "text-end", id: msgId } as any);
        writer.write({ type: "finish-step" } as any);
        writer.write({ type: "finish" } as any);
        succeeded = true;
        const openCand = { providerName: "HEYUKA Open Core", modelId: "heyuka-open", keyIndex: 0 };
        if (onCompletedText) await Promise.resolve(onCompletedText(rescueReply, openCand)).catch(() => {});
        if (userOnFinish) await Promise.resolve(userOnFinish({ text: rescueReply })).catch(() => {});
      }

      if (!succeeded) {
        throw new Error(lastErrMsg);
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err || "Gateway busy");
      console.error("[HEYUKA Stream Error]", msg);
      return "HEYUKA gateway is currently busy; switching cleanly to device core.";
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers,
  });
}
