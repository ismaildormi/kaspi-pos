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
import {
  getHfTokenPoolTokens,
  resolveModelCommandHierarchy,
  type HeyukaHierarchyRole,
} from "@/lib/heyuka/compute/hf-token-pool";

/**
 * Resolves deep thinking and execution horizons (`v109.1`).
 * Never uses sub-25s Vercel cutoffs: supports full 300s fluid compute and unbounded mode via `HEYUKA_UNBOUNDED_TIMEOUT=1`.
 */
export function resolveRouterBudgets() {
  const unbounded =
    process.env.HEYUKA_UNBOUNDED_TIMEOUT === "1" ||
    (process.env.VERCEL !== "1" && process.env.VERCEL !== "true");
  return {
    failoverHorizonMs: unbounded ? 1_800_000 : 180_000,
    totalBudgetMs: unbounded ? 3_600_000 : 285_000,
    perAttemptPrimaryMs: unbounded ? 900_000 : 180_000,
    perAttemptFallbackMs: unbounded ? 300_000 : 90_000,
    maxContinuationHops: unbounded ? 32 : 16,
  };
}

const modelCooldownUntil = new Map<string, number>();

function extractRouterErrorText(err: any): string {
  return [
    err?.statusCode,
    err?.message,
    err?.responseBody,
    err?.data?.error?.message,
    err?.cause?.message,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Cools down exhausted / rate-limited model gateways temporarily so failover jumps
 * straight to healthy OpenRouter / Gemini / alternative models in 0ms instead of repeating 429s.
 */
function markCandidateCoolingDown(candidate: RouterCandidate, errText: string): void {
  const msg = String(errText || "");
  const now = Date.now();
  const isModelQuotaExhausted =
    /tokens per day|TPD|daily limit|quota exceeded|insufficient_quota|decommissioned|does not exist|model_not_found/i.test(
      msg
    );
  const isRateOrTokenCap =
    /\b429\b|\b413\b|rate.?limit|too many requests|request too large|tokens per minute|OTPM|ITPM|\bTPM\b|service unavailable|overloaded|\b503\b/i.test(
      msg
    );

  if (isModelQuotaExhausted) {
    modelCooldownUntil.set(`${candidate.provider}:${candidate.modelId}`, now + 15 * 60_000);
  } else if (isRateOrTokenCap) {
    // Groq enforces TPM limits per organization across keys; cool down model tier cleanly on org-wide caps
    if (/organization\s+`org_/i.test(msg)) {
      modelCooldownUntil.set(`${candidate.provider}:${candidate.modelId}`, now + 45_000);
    } else {
      modelCooldownUntil.set(`${candidate.provider}:${candidate.modelId}:${candidate.keyIndex}`, now + 65_000);
    }
  }
}

function isCandidateCoolingDown(candidate: RouterCandidate): boolean {
  const now = Date.now();
  const modelExp = modelCooldownUntil.get(`${candidate.provider}:${candidate.modelId}`) || 0;
  const keyExp = modelCooldownUntil.get(`${candidate.provider}:${candidate.modelId}:${candidate.keyIndex}`) || 0;
  return modelExp > now || keyExp > now;
}

function filterAndOrderActiveCandidates(candidates: RouterCandidate[]): RouterCandidate[] {
  const healthy: RouterCandidate[] = [];
  const cooling: RouterCandidate[] = [];
  for (const c of candidates) {
    if (isCandidateCoolingDown(c)) cooling.push(c);
    else healthy.push(c);
  }
  return [...healthy, ...cooling];
}

export interface ByokSessionKeys {
  gemini?: string;
  groq?: string;
  openrouter?: string;
  github?: string;
}

export interface RouterGovernanceScope {
  tenantId?: string;
  allowOwnerPaidProviders?: boolean;
  callerComputeUrl?: string;
  callerComputeKey?: string;
  callerModelId?: string;
  strictCloudOnly?: boolean;
  byokKeys?: ByokSessionKeys;
  modelRole?: HeyukaHierarchyRole | string;
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
    | "github"
    | "cerebras"
    | "sambanova"
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

  // Priority -0.5: Caller Browser-Session Ephemeral BYOK Free Keys (in-memory only, zero disk persistence)
  if (scope?.byokKeys) {
    const cleanKey = (val?: string) => {
      const t = (val || "").trim();
      return t && !t.includes("mock") ? t : "";
    };
    const pushByok = (
      provider: RouterCandidate["provider"],
      providerName: string,
      apiKey: string,
      modelId: string,
      model: LanguageModel,
      supportsVision: boolean
    ) => {
      candidates.push({
        provider,
        providerName,
        keyIndex: 0,
        keyMasked: `byok...${apiKey.slice(-6)}`,
        apiKey,
        modelId,
        model,
        supportsVision,
      });
    };

    const gKey = cleanKey(scope.byokKeys.groq);
    if (gKey) {
      pushByok(
        "groq",
        "Caller Session BYOK (Groq)",
        gKey,
        "openai/gpt-oss-120b",
        createGroq({ apiKey: gKey })("openai/gpt-oss-120b") as unknown as LanguageModel,
        false
      );
    }
    const gemKey = cleanKey(scope.byokKeys.gemini);
    if (gemKey) {
      pushByok(
        "google",
        "Caller Session BYOK (Gemini)",
        gemKey,
        "gemini-flash-latest",
        createGoogleGenerativeAI({ apiKey: gemKey })("gemini-flash-latest") as unknown as LanguageModel,
        true
      );
    }
    const orKey = cleanKey(scope.byokKeys.openrouter);
    if (orKey) {
      pushByok(
        "openrouter",
        "Caller Session BYOK (OpenRouter)",
        orKey,
        "openrouter/free",
        createOpenRouter({ apiKey: orKey })("openrouter/free") as unknown as LanguageModel,
        true
      );
    }
    const ghByokKey = cleanKey(scope.byokKeys.github);
    if (ghByokKey) {
      const ghProvider = createOpenAI({
        apiKey: ghByokKey,
        baseURL: "https://models.inference.ai.azure.com",
      });
      pushByok(
        "github",
        "Caller Session BYOK (GitHub Models)",
        ghByokKey,
        "DeepSeek-R1",
        ghProvider("DeepSeek-R1") as unknown as LanguageModel,
        false
      );
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

  // Priority 2: Groq Ultra-Fast Live 2026 Models (place higher-quota 120b + 20b ahead of narrow OTPM 1000 models)
  const groqKeys = parseKeyPool(
    process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY
  ).filter((k) => !k.includes("mock"));

  for (const modelId of ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]) {
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
      "google/gemma-4-31b-it:free",
      "google/gemma-4-26b-a4b-it:free",
      "openrouter/free",
      "nvidia/nemotron-3.5-super-vl:free",
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

  // Priority 7.5: Ultra-Fast Free OpenAI-Compatible Frontier Pools (GitHub Models / Cerebras / SambaNova)
  const freeOpenAiPools: Array<{
    provider: RouterCandidate["provider"];
    providerName: string;
    envRaw: string | undefined;
    baseURL: string;
    models: string[];
  }> = [
    {
      provider: "github",
      providerName: "GitHub Models Frontier",
      envRaw: process.env.GITHUB_MODELS_KEYS || process.env.GITHUB_MODELS_TOKEN,
      baseURL: "https://models.inference.ai.azure.com",
      models: ["DeepSeek-R1", "gpt-4o", "Llama-3.3-70B-Instruct"],
    },
    {
      provider: "cerebras",
      providerName: "Cerebras Wafer-Scale Free",
      envRaw: process.env.CEREBRAS_API_KEYS || process.env.CEREBRAS_API_KEY,
      baseURL: "https://api.cerebras.ai/v1",
      models: ["llama-3.3-70b", "qwen-3-32b"],
    },
    {
      provider: "sambanova",
      providerName: "SambaNova RDU Free",
      envRaw: process.env.SAMBANOVA_API_KEYS || process.env.SAMBANOVA_API_KEY,
      baseURL: "https://api.sambanova.ai/v1",
      models: ["Meta-Llama-3.3-70B-Instruct", "DeepSeek-R1"],
    },
  ];
  for (const poolDef of freeOpenAiPools) {
    const poolKeys = parseKeyPool(poolDef.envRaw).filter((k) => !k.includes("mock"));
    poolKeys.forEach((key, idx) => {
      const compatProvider = createOpenAI({
        apiKey: key,
        baseURL: poolDef.baseURL,
      });
      for (const mId of poolDef.models) {
        candidates.push({
          provider: poolDef.provider,
          providerName: poolDef.providerName,
          keyIndex: idx,
          keyMasked: `...${key.slice(-6)}`,
          apiKey: key,
          modelId: mId,
          model: compatProvider(mId) as unknown as LanguageModel,
          supportsVision: mId === "gpt-4o",
        });
      }
    });
  }

  // Priority 8: Hugging Face Multi-Token Inference Pool aligned to 3-Model Command Hierarchy
  const hfPoolEntries = getHfTokenPoolTokens();
  const hierarchy = resolveModelCommandHierarchy({
    requestedModel: typeof scope?.modelRole === "string" ? scope.modelRole : undefined,
  });
  const roleStartOffset =
    hierarchy.role === "heyuka-core" ? 1 : hierarchy.role === "heyuka-vision" ? 2 : 0;
  const hfModels = Array.from(
    new Set([
      ...hierarchy.preferredHfModels,
      "deepseek-ai/DeepSeek-R1",
      "Qwen/Qwen2.5-72B-Instruct",
      "Qwen/Qwen2.5-Coder-32B-Instruct",
      "meta-llama/Llama-3.3-70B-Instruct",
    ])
  );
  hfModels.forEach((hfModelId, modelIdx) => {
    if (hfPoolEntries.length === 0) return;
    // Rotate starting token per hierarchy role & model so Omni/Core/Vision spread load across 4 HF tokens
    for (let offset = 0; offset < hfPoolEntries.length; offset++) {
      const keyEntry = hfPoolEntries[(roleStartOffset + modelIdx + offset) % hfPoolEntries.length];
      const hfProvider = createOpenAI({
        apiKey: keyEntry.token,
        baseURL: "https://router.huggingface.co/v1",
      });
      candidates.push({
        provider: "huggingface",
        providerName: `HEYUKA Open Mesh (${keyEntry.envName})`,
        keyIndex: keyEntry.index,
        keyMasked: keyEntry.masked,
        apiKey: keyEntry.token,
        modelId: hfModelId,
        model: hfProvider(hfModelId) as unknown as LanguageModel,
        supportsVision: false,
      });
    }
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

  return filterAndOrderActiveCandidates(candidates);
}

function extractLastUserTextFromMessages(messages: any): string {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== "user") continue;
    if (typeof m.content === "string") return m.content;
    if (Array.isArray(m.content)) {
      return m.content.filter((p: any) => p?.type === "text").map((p: any) => p.text || "").join("\n");
    }
    if (Array.isArray(m.parts)) {
      return m.parts.filter((p: any) => p?.type === "text").map((p: any) => p.text || "").join("\n");
    }
  }
  return "";
}

function buildProviderGenerationConfig(
  candidate: RouterCandidate,
  requestedMaxTokens?: number
): Record<string, any> {
  // Keep Groq requests strictly within per-minute TPM/OTPM limits so initial generation never fails 413/429
  const defaultCap =
    candidate.provider === "google"
      ? 65_536
      : candidate.provider === "groq"
      ? candidate.modelId.includes("120b")
        ? 5_500
        : candidate.modelId.includes("20b")
        ? 2_600
        : 850
      : 16_384;
  const rawReq =
    typeof requestedMaxTokens === "number" && requestedMaxTokens > 0
      ? requestedMaxTokens
      : defaultCap;
  const maxOutputTokens =
    candidate.provider === "groq" ? Math.min(rawReq, defaultCap) : rawReq;

  const extra: Record<string, any> = { maxOutputTokens };
  if (candidate.provider === "google") {
    extra.providerOptions = {
      google: {
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        ],
      },
    };
  }
  return extra;
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
    flatMessages.push({ role: "system", content: params.system.slice(0, 16000) });
  }
  for (const m of (params.messages || []).slice(-20)) {
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
    if (txt.trim()) flatMessages.push({ role, content: txt.trim().slice(0, 12000) });
  }

  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: flatMessages,
    }),
    signal: AbortSignal.timeout(45_000),
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
  const genStartedAt = Date.now();
  const budgets = resolveRouterBudgets();
  const failoverHorizonMs = budgets.failoverHorizonMs;
  const maxTotalHorizonMs = budgets.totalBudgetMs;
  const hasTools = Boolean((restGenOptions as any)?.tools);
  const genAttempts: Array<{ candidate: RouterCandidate; stripTools: boolean }> = [
    ...candidates.map((candidate) => ({ candidate, stripTools: false })),
    ...(hasTools ? candidates.slice(0, 3).map((candidate) => ({ candidate, stripTools: true })) : []),
  ];

  for (let idx = 0; idx < genAttempts.length; idx++) {
    if (idx > 0 && Date.now() - genStartedAt > failoverHorizonMs) break;
    const { candidate, stripTools } = genAttempts[idx];
    if (idx > 0 && isCandidateCoolingDown(candidate)) continue;
    try {
      const providerCfg = buildProviderGenerationConfig(candidate, (restGenOptions as any)?.maxOutputTokens);
      const callOpts = { ...(restGenOptions as any) };
      if (stripTools) {
        delete callOpts.tools;
        delete callOpts.stopWhen;
      }
      const remainingMs = Math.max(20_000, maxTotalHorizonMs - (Date.now() - genStartedAt));
      const attemptCapMs = idx === 0 ? budgets.perAttemptPrimaryMs : budgets.perAttemptFallbackMs;
      const perAttemptMs = Math.min(remainingMs, attemptCapMs);
      const result = await generateText({
        model: candidate.model as any,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(perAttemptMs),
        ...providerCfg,
        ...callOpts,
      });

      const stepTexts = (result.steps || []).map((s: any) => String(s?.text || "").trim()).filter(Boolean);
      const outputText =
        String((result as any).text || "").trim() ||
        stepTexts[stepTexts.length - 1] ||
        "";

      if (!outputText) {
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
      const errMsg = extractRouterErrorText(err);
      markCandidateCoolingDown(candidate, errMsg);
      console.warn(
        `[HEYUKA Router] Failover from ${candidate.provider}:${candidate.modelId}${
          stripTools ? " (text-only)" : ""
        } (Key #${candidate.keyIndex + 1}): ${errMsg.slice(0, 160)}`
      );
      errors.push({
        provider: candidate.providerName,
        keyIndex: candidate.keyIndex,
        error: errMsg || String(err),
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
      const budgets = resolveRouterBudgets();
      const failoverHorizonMs = budgets.failoverHorizonMs;
      const attemptHorizonMs = budgets.totalBudgetMs;
      const totalStreamBudgetMs = budgets.totalBudgetMs;
      const maxContinuationHops = budgets.maxContinuationHops;
      let succeeded = false;
      let streamStartedOnWriter = false;
      let lastErrMsg = "All HEYUKA cloud gateways unavailable";
      const originalUserPrompt = extractLastUserTextFromMessages(restOptions.messages).slice(0, 1200);

      for (let attemptIdx = 0; attemptIdx < attempts.length; attemptIdx++) {
        if (attemptIdx > 0 && Date.now() - streamStartedAt > failoverHorizonMs) break;

        const { candidate, stripTools } = attempts[attemptIdx];
        if (attemptIdx > 0 && isCandidateCoolingDown(candidate)) continue;
        let emittedToClient = false;
        const bufferedHeaderChunks: any[] = [];
        let collectedText = "";
        let openTextPartId: string | null = null;
        let heldFinishChunks: any[] = [];
        let streamFinishReason: string | undefined;
        const capturedToolMarkers: string[] = [];

        try {
          const providerCfg = buildProviderGenerationConfig(candidate, restOptions.maxOutputTokens);
          const callConfig = { ...providerCfg, ...restOptions };
          if (stripTools) delete callConfig.tools;
          const remainingMs = Math.max(20_000, attemptHorizonMs - (Date.now() - streamStartedAt));
          const perAttemptCap =
            attemptIdx === 0
              ? budgets.perAttemptPrimaryMs
              : budgets.perAttemptFallbackMs;
          const attemptTimeoutMs = Math.min(remainingMs, perAttemptCap);

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
            } else if (c.type === "tool-output-available" && c.output?.inlineMarker) {
              const marker = String(c.output.inlineMarker).trim();
              if (marker && !capturedToolMarkers.includes(marker)) {
                capturedToolMarkers.push(marker);
              }
            }

            // Capture explicit finishReason from stream chunks AND hold terminal finish chunks for seamless auto-continuation
            if (c.type === "finish-step" || c.type === "finish") {
              if (typeof c.finishReason === "string" && c.finishReason) {
                streamFinishReason = c.finishReason;
              }
              heldFinishChunks.push(chunk);
              continue;
            }

            const isContentChunk =
              c.type === "text-delta" && Boolean(String(c.delta ?? c.textDelta ?? "").trim());

            if (!emittedToClient) {
              if (isContentChunk) {
                emittedToClient = true;
                for (const h of bufferedHeaderChunks) {
                  if (streamStartedOnWriter && (h as any)?.type === "start") continue;
                  writer.write(h);
                }
                streamStartedOnWriter = true;
                bufferedHeaderChunks.length = 0;
                writer.write(chunk);
              } else {
                bufferedHeaderChunks.push(chunk);
              }
            } else {
              writer.write(chunk);
            }
          }

          // Emit any captured artifact markers (e.g. [KASPI_PDF_REPORT:...]) if model executed tool without printing marker
          const missingMarkers = capturedToolMarkers.filter((mk) => !collectedText.includes(mk));
          if (missingMarkers.length > 0) {
            const hasProse = Boolean(
              collectedText.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*$/gi, "").trim()
            );
            const isArabicPrompt = /[\u0600-\u06FF]/.test(originalUserPrompt);
            const lead = hasProse
              ? "\n\n"
              : isArabicPrompt
              ? "تم تجهيز المستند بنجاح وهو جاهز للتحميل الفوري أدناه:\n\n"
              : "Document generated cleanly and ready for instant download below:\n\n";
            const markerBlock = `${lead}${missingMarkers.join("\n\n")}\n`;
            const mkId = openTextPartId || `mk-${Date.now()}`;
            if (!emittedToClient) {
              if (!streamStartedOnWriter) {
                writer.write({ type: "start" } as any);
                streamStartedOnWriter = true;
              }
              writer.write({ type: "start-step" } as any);
              bufferedHeaderChunks.length = 0;
            }
            if (!openTextPartId) writer.write({ type: "text-start", id: mkId } as any);
            writer.write({ type: "text-delta", id: mkId, delta: markerBlock } as any);
            if (!openTextPartId) writer.write({ type: "text-end", id: mkId } as any);
            collectedText += markerBlock;
            emittedToClient = true;
          }

          let visibleClean = collectedText
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .replace(/<think>[\s\S]*$/gi, "")
            .trimEnd();

          if (!emittedToClient || !visibleClean.trim()) {
            throw new Error("Upstream produced zero visible text after reasoning strip");
          }

          let finishReason: string | undefined = streamFinishReason;
          if (!finishReason) {
            try {
              finishReason = await (res as any).finishReason;
            } catch {}
          }

          // Seamless Auto-Continuation Loop (MAX_TOKENS `length`, mid-code cuts, or mid-word Arabic/prose stops)
          const hasInterruptedTail = (txt: string) =>
            /(?:[,،:؛\-]|(?:\s+(?:ب|ل|و|ف|من|في|على|عن|إلى|مع|أو|the|and|to|with|for)))\s*$/iu.test(txt.trimEnd());

          let hopCount = 0;
          while (
            hopCount < maxContinuationHops &&
            Date.now() - streamStartedAt < totalStreamBudgetMs &&
            (finishReason === "length" ||
              detectTruncationState(visibleClean).truncated ||
              (finishReason !== "stop" && hasInterruptedTail(visibleClean)))
          ) {
            hopCount += 1;
            const trunc = detectTruncationState(visibleClean);
            const tailWindow = visibleClean.slice(-600);
            try {
              const contGen = await generateText({
                model: candidate.model as any,
                maxRetries: 0,
                ...buildProviderGenerationConfig(candidate, restOptions.maxOutputTokens),
                abortSignal: AbortSignal.timeout(Math.max(8_000, totalStreamBudgetMs - (Date.now() - streamStartedAt))),
                system:
                  "Continue seamlessly from the exact cutoff character without repeating any prior text, without adding opening ``` fences if already inside a block, and finish all remaining sections completely.",
                messages: [
                  {
                    role: "user",
                    content: `Original request:\n${originalUserPrompt}\n\nPrevious response stopped right here:\n${trunc.tailSnippet || tailWindow}\n\nContinue immediately from the exact next character cleanly:`,
                  },
                ],
                temperature: 0.2,
              });
              const contChunk = String(contGen.text || "");
              if (!contChunk.trim()) break;

              const merged = mergeContinuationChunk(visibleClean, contChunk);
              const deltaToAppend = merged.startsWith(visibleClean)
                ? merged.slice(visibleClean.length)
                : contChunk;
              if (!deltaToAppend) break;

              const contId = openTextPartId || `cont-${Date.now()}-${hopCount}`;
              if (!openTextPartId) writer.write({ type: "text-start", id: contId } as any);
              writer.write({ type: "text-delta", id: contId, delta: deltaToAppend } as any);
              if (!openTextPartId) writer.write({ type: "text-end", id: contId } as any);

              collectedText = `${collectedText}${deltaToAppend}`;
              visibleClean = merged;
              finishReason = (contGen as any).finishReason || "stop";
            } catch {
              break;
            }
          }

          // Flush terminal finish markers cleanly (promote length -> stop when auto-continuation succeeded)
          for (const fin of heldFinishChunks) {
            if (hopCount > 0 && fin && typeof fin === "object" && (fin as any).finishReason === "length") {
              writer.write({ ...(fin as any), finishReason: "stop" });
            } else {
              writer.write(fin);
            }
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
          lastErrMsg = extractRouterErrorText(err);
          markCandidateCoolingDown(candidate, lastErrMsg);
          console.warn(
            `[HEYUKA Stream Failover] ${candidate.provider}:${candidate.modelId}${
              stripTools ? " (text-only)" : ""
            } failed -> ${lastErrMsg.slice(0, 160)}`
          );
          const visibleClean = collectedText
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .replace(/<think>[\s\S]*$/gi, "")
            .trim();
          const missingOnErr = capturedToolMarkers.filter((mk) => !collectedText.includes(mk));
          if ((emittedToClient && visibleClean.length > 24) || missingOnErr.length > 0) {
            if (missingOnErr.length > 0) {
              const isArabicPrompt = /[\u0600-\u06FF]/.test(originalUserPrompt);
              const prefix = visibleClean
                ? "\n\n"
                : isArabicPrompt
                ? "تم تجهيز المستند بنجاح وهو جاهز للتحميل الفوري أدناه:\n\n"
                : "Document generated cleanly and ready for instant download below:\n\n";
              const block = `${prefix}${missingOnErr.join("\n\n")}\n`;
              const mkId = openTextPartId || `mk-${Date.now()}`;
              if (!streamStartedOnWriter) {
                writer.write({ type: "start" } as any);
                streamStartedOnWriter = true;
              }
              writer.write({ type: "start-step" } as any);
              writer.write({ type: "text-start", id: mkId } as any);
              writer.write({ type: "text-delta", id: mkId, delta: block } as any);
              writer.write({ type: "text-end", id: mkId } as any);
              collectedText += block;
            }
            if (heldFinishChunks.length > 0) {
              for (const fin of heldFinishChunks) {
                writer.write(fin);
              }
            } else {
              writer.write({ type: "finish-step" } as any);
              writer.write({ type: "finish" } as any);
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

function createStreamingThinkSplitter(
  onReasoning: (chunk: string) => void,
  onVisible: (chunk: string) => void
) {
  let inThink = false;
  let carry = "";

  const drain = (flushAll = false) => {
    while (carry.length > 0) {
      if (!inThink) {
        const openIdx = carry.indexOf("<think>");
        if (openIdx !== -1) {
          if (openIdx > 0) onVisible(carry.slice(0, openIdx));
          carry = carry.slice(openIdx + 7);
          inThink = true;
          continue;
        }
        if (!flushAll && carry.includes("<") && carry.length - carry.lastIndexOf("<") < 7) {
          const splitAt = carry.lastIndexOf("<");
          if (splitAt > 0) onVisible(carry.slice(0, splitAt));
          carry = carry.slice(splitAt);
          break;
        }
        onVisible(carry);
        carry = "";
      } else {
        const closeIdx = carry.indexOf("</think>");
        if (closeIdx !== -1) {
          if (closeIdx > 0) onReasoning(carry.slice(0, closeIdx));
          carry = carry.slice(closeIdx + 8);
          inThink = false;
          continue;
        }
        if (!flushAll && carry.includes("<") && carry.length - carry.lastIndexOf("<") < 8) {
          const splitAt = carry.lastIndexOf("<");
          if (splitAt > 0) onReasoning(carry.slice(0, splitAt));
          carry = carry.slice(splitAt);
          break;
        }
        onReasoning(carry);
        carry = "";
      }
    }
  };

  return {
    push(delta: string) {
      if (!delta) return;
      carry += delta;
      drain(false);
    },
    flush() {
      drain(true);
    },
  };
}

/**
 * Streams real-time tokens, reasoning traces, tool lifecycle events, and seamless MAX_TOKENS continuations
 * cleanly to Antigravity Studio (`/api/v1/heyuka/chat-web?stream=true`).
 */
export async function streamStudioNdjsonWithRouter(
  options: StreamTextOptions & {
    onPhase?: (phase: string) => void;
    onTextDelta?: (delta: string) => void;
    onReasoningDelta?: (delta: string) => void;
    onToolStart?: (toolName: string) => void;
    onKeepAlive?: (elapsedMs: number) => void;
  }
): Promise<{
  text: string;
  reasoning: string;
  finishReason: string;
  activeProvider: string;
  activeModel: string;
  activeKeyIndex: number;
  continuationHops: number;
}> {
  const { governance, onPhase, onTextDelta, onReasoningDelta, onToolStart, onKeepAlive, ...restOptions } = options as any;
  const allCandidates = await getRouterCandidates(governance);
  const filteredByCost =
    governance?.allowOwnerPaidProviders === true
      ? allCandidates
      : allCandidates.filter(
          (c) => !PAID_OWNER_ENV_PROVIDERS.has(c.provider) || c.providerName.startsWith("Tenant BYOK")
        );
  const isMultimodal = hasMultimodalContent(options);
  const pool = isMultimodal ? filteredByCost.filter((c) => c.supportsVision) : filteredByCost;
  const hasTools = Boolean(restOptions.tools);
  const sysLen = typeof restOptions.system === "string" ? restOptions.system.length : 0;
  // Skip ultra-narrow ITPM=7000 / OTPM=1000 Groq qwen3.8-27b when Studio passes heavy tool schemas
  const sizedPool =
    hasTools || sysLen > 6000
      ? pool.filter((c) => !(c.provider === "groq" && c.modelId.includes("qwen3.8")))
      : pool;
  const baseCandidates = filterAndOrderActiveCandidates(sizedPool.length > 0 ? sizedPool : pool);
  const attempts: Array<{ candidate: RouterCandidate; stripTools: boolean }> = [
    ...baseCandidates.map((candidate) => ({ candidate, stripTools: false })),
    ...(hasTools ? baseCandidates.slice(0, 3).map((candidate) => ({ candidate, stripTools: true })) : []),
  ];

  const startedAt = Date.now();
  const budgets = resolveRouterBudgets();
  const failoverHorizonMs = budgets.failoverHorizonMs;
  const totalBudgetMs = budgets.totalBudgetMs;
  const maxContinuationHops = budgets.maxContinuationHops;
  const originalUserPrompt = extractLastUserTextFromMessages(restOptions.messages).slice(0, 1400);

  const keepAliveTimer = setInterval(() => {
    onKeepAlive?.(Date.now() - startedAt);
  }, 8_000);

  try {
  for (let idx = 0; idx < attempts.length; idx++) {
    if (idx > 0 && Date.now() - startedAt > failoverHorizonMs) break;
    const { candidate, stripTools } = attempts[idx];
    if (idx > 0 && isCandidateCoolingDown(candidate)) continue;
    let visibleText = "";
    let reasoningText = "";
    let streamFinishReason = "";
    let emittedAnyVisible = false;
    let capturedStreamErr = "";

    const remainingMs = Math.max(20_000, totalBudgetMs - (Date.now() - startedAt));
    const perAttemptMs = Math.min(remainingMs, idx === 0 ? budgets.perAttemptPrimaryMs : budgets.perAttemptFallbackMs);
    const attemptAbort = new AbortController();
    const overallTimer = setTimeout(() => attemptAbort.abort(), perAttemptMs);

    try {
      const providerCfg = buildProviderGenerationConfig(candidate, restOptions.maxOutputTokens);
      const callOpts = { ...providerCfg, ...restOptions };
      if (stripTools) {
        delete callOpts.tools;
        delete callOpts.stopWhen;
      }

      const splitter = createStreamingThinkSplitter(
        (rDelta) => {
          reasoningText += rDelta;
          onReasoningDelta?.(rDelta);
        },
        (vDelta) => {
          if (!vDelta) return;
          visibleText += vDelta;
          if (visibleText.trim().length > 0) emittedAnyVisible = true;
          onTextDelta?.(vDelta);
        }
      );

      const res = streamText({
        model: candidate.model as any,
        maxRetries: 0,
        abortSignal: attemptAbort.signal,
        onError: ({ error }) => {
          const raw = extractRouterErrorText(error);
          if (raw) capturedStreamErr = raw;
        },
        ...callOpts,
      });
      Promise.resolve((res as any).text).catch(() => {});
      Promise.resolve((res as any).finishReason).catch(() => {});
      Promise.resolve((res as any).usage).catch(() => {});
      Promise.resolve((res as any).response).catch(() => {});

      for await (const rawChunk of res.toUIMessageStream({
        onError: (err) => {
          const raw = extractRouterErrorText(err);
          if (raw) capturedStreamErr = raw;
          return raw || "Upstream stream error";
        },
      })) {
        const c = rawChunk as any;
        if (c.type === "error") {
          throw new Error(String(capturedStreamErr || c.errorText || c.error?.message || "Upstream stream error"));
        }
        if (c.type === "reasoning-delta" && typeof c.delta === "string") {
          reasoningText += c.delta;
          onReasoningDelta?.(c.delta);
        } else if (c.type === "text-delta") {
          const piece = typeof c.delta === "string" ? c.delta : typeof c.textDelta === "string" ? c.textDelta : "";
          if (piece) splitter.push(piece);
        } else if (c.type === "tool-input-start" && c.toolName) {
          onToolStart?.(String(c.toolName));
        } else if ((c.type === "finish-step" || c.type === "finish") && typeof c.finishReason === "string" && c.finishReason) {
          streamFinishReason = c.finishReason;
        }
      }
      clearTimeout(overallTimer);
      splitter.flush();

      if (!emittedAnyVisible || !visibleText.trim()) {
        throw new Error("Empty visible stream output");
      }

      let finishReason = streamFinishReason || "stop";
      if (!streamFinishReason) {
        try {
          finishReason = String((await (res as any).finishReason) || "stop");
        } catch {}
      }

      let continuationHops = 0;
      while (
        continuationHops < maxContinuationHops &&
        Date.now() - startedAt < totalBudgetMs &&
        (finishReason === "length" || detectTruncationState(visibleText).truncated)
      ) {
        continuationHops += 1;
        onPhase?.(`Auto-continuing complete generation (Hop #${continuationHops})...`);
        const trunc = detectTruncationState(visibleText);
        const fenceNotice = trunc.openFenceLang
          ? `You are CURRENTLY INSIDE an open \`\`\`${trunc.openFenceLang} code fence. Output ONLY the remaining raw code lines seamlessly from the exact cutoff character WITHOUT opening a new \`\`\`${trunc.openFenceLang} fence first, then close with \`\`\` and complete any remaining files or brief summary.`
          : "Continue seamlessly from the exact cutoff character without repeating any prior text, without emitting <think> tags, and complete all remaining files and sections cleanly.";
        const baseSnap = visibleText;
        let hopChunk = "";
        let hopSucceeded = false;

        const hopCandidates = filterAndOrderActiveCandidates([
          candidate,
          ...baseCandidates.filter((c) => c.modelId !== candidate.modelId).slice(0, 2),
        ]);

        for (const hopCand of hopCandidates) {
          try {
            const contRes = streamText({
              model: hopCand.model as any,
              maxRetries: 0,
              ...buildProviderGenerationConfig(hopCand, restOptions.maxOutputTokens),
              abortSignal: AbortSignal.timeout(Math.max(8_000, totalBudgetMs - (Date.now() - startedAt))),
              system: fenceNotice,
              messages: [
                {
                  role: "user",
                  content: `Original request:\n${originalUserPrompt}\n\nExact ending tail:\n${trunc.tailSnippet || baseSnap.slice(-600)}\n\nContinue immediately from the next character:`,
                },
              ],
              temperature: 0.2,
            });
            Promise.resolve((contRes as any).text).catch(() => {});
            Promise.resolve((contRes as any).finishReason).catch(() => {});
            Promise.resolve((contRes as any).usage).catch(() => {});
            Promise.resolve((contRes as any).response).catch(() => {});
            for await (const rawC of contRes.toUIMessageStream()) {
              const c = rawC as any;
              if (c.type === "error") throw new Error("Continuation upstream error");
              if (c.type === "text-delta") {
                const piece = typeof c.delta === "string" ? c.delta : typeof c.textDelta === "string" ? c.textDelta : "";
                if (piece) {
                  hopChunk += piece;
                  const nextMerged = mergeContinuationChunk(baseSnap, hopChunk);
                  const added = nextMerged.slice(visibleText.length);
                  visibleText = nextMerged;
                  if (added) onTextDelta?.(added);
                }
              } else if ((c.type === "finish-step" || c.type === "finish") && typeof c.finishReason === "string") {
                finishReason = c.finishReason || "stop";
              }
            }
            if (hopChunk.trim()) {
              hopSucceeded = true;
              break;
            }
          } catch {
            // Try next healthy hop candidate seamlessly
          }
        }
        if (!hopSucceeded || !hopChunk.trim()) break;
      }

      return {
        text: visibleText.trim(),
        reasoning: reasoningText.trim(),
        finishReason,
        activeProvider: candidate.providerName,
        activeModel: candidate.modelId,
        activeKeyIndex: candidate.keyIndex,
        continuationHops,
      };
    } catch (err: any) {
      clearTimeout(overallTimer);
      const errMsg = [capturedStreamErr, extractRouterErrorText(err)].filter(Boolean).join(" ");
      markCandidateCoolingDown(candidate, errMsg);
      if (emittedAnyVisible && visibleText.trim().length > 80) {
        return {
          text: visibleText.trim(),
          reasoning: reasoningText.trim(),
          finishReason: "partial_stream",
          activeProvider: candidate.providerName,
          activeModel: candidate.modelId,
          activeKeyIndex: candidate.keyIndex,
          continuationHops: 0,
        };
      }
      console.warn(`[HEYUKA Studio Stream Failover] ${candidate.provider}:${candidate.modelId}: ${errMsg.slice(0, 160)}`);
    }
  }
  } finally {
    clearInterval(keepAliveTimer);
  }

  let fallbackText = "";
  if (!isMultimodal) {
    try {
      fallbackText = await callPollinationsZeroKeyHttp({
        system: typeof restOptions.system === "string" ? restOptions.system : undefined,
        messages: restOptions.messages,
      });
    } catch {}
  }
  if (!fallbackText) {
    fallbackText = runLocalOnDeviceHeyukaBrain({
      prompt: originalUserPrompt || "Assist cleanly with complete solution",
      locale: /[\u0600-\u06FF]/.test(originalUserPrompt) ? "ar" : "en",
    }).answer;
  }
  onTextDelta?.(fallbackText);
  return {
    text: fallbackText,
    reasoning: "",
    finishReason: "stop",
    activeProvider: "HEYUKA Open Core",
    activeModel: "heyuka-open",
    activeKeyIndex: 0,
    continuationHops: 0,
  };
}
