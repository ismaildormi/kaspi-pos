/**
 * ============================================================================
 * KASPI AI — REAL ARENA MULTI-MODEL REGISTRY & CAPABILITY CATALOG
 * Uses live zero-key open-weight endpoints (api.llm7.io, text.pollinations.ai,
 * aihorde.net, DuckDuckGo/Wikipedia) PLUS any configured Google Gemini, Groq,
 * OpenRouter, Mistral, DeepSeek, or Local Ollama/WebGPU providers.
 * Zero fake/canned model outputs.
 * ============================================================================
 */

export type ArenaUpstreamProvider =
  | "llm7"
  | "pollinations"
  | "router"
  | "aihorde";

export interface ArenaRealModelSpec {
  id: string;
  displayName: string;
  providerLabel: string;
  upstream: ArenaUpstreamProvider;
  apiModelId: string;
  specialty: "general" | "coding" | "reasoning" | "fast";
  supportsAnonymousBattle: boolean;
  isFreeZeroKey: boolean;
}

export const ARENA_REAL_MODELS: ArenaRealModelSpec[] = [
  {
    id: "deepseek-v4-flash",
    displayName: "DeepSeek-V4-Flash",
    providerLabel: "DeepSeek (LLM7 Open Gateway)",
    upstream: "llm7",
    apiModelId: "DeepSeek-V4-Flash-0731",
    specialty: "reasoning",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
  },
  {
    id: "gpt-oss-20b-fast",
    displayName: "GPT-OSS-20B-Reasoning",
    providerLabel: "Open-Weight OVH (Pollinations)",
    upstream: "pollinations",
    apiModelId: "openai",
    specialty: "reasoning",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
  },
  {
    id: "gemma4-31b",
    displayName: "Gemma-4-31B",
    providerLabel: "Google Open Weights (LLM7)",
    upstream: "llm7",
    apiModelId: "gemma4:31b",
    specialty: "general",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
  },
  {
    id: "codestral-latest",
    displayName: "Codestral-Latest",
    providerLabel: "Mistral Coding (LLM7)",
    upstream: "llm7",
    apiModelId: "codestral-latest",
    specialty: "coding",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
  },
  {
    id: "gpt-oss-120b",
    displayName: "GPT-OSS-120B",
    providerLabel: "Open-Weight 120B (LLM7)",
    upstream: "llm7",
    apiModelId: "gpt-oss:120b",
    specialty: "general",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
  },
  {
    id: "glm-5.3-flash",
    displayName: "GLM-5.3-Flash",
    providerLabel: "Zhipu Open Weights (LLM7)",
    upstream: "llm7",
    apiModelId: "glm-5.3-flash",
    specialty: "fast",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
  },
  {
    id: "mistral-nemo-2407",
    displayName: "Mistral-Nemo-2407",
    providerLabel: "Mistral Open Weights (LLM7)",
    upstream: "llm7",
    apiModelId: "mistral-Nemo-Instruct-2407",
    specialty: "fast",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
  },
  {
    id: "mimo-v2.6-flash",
    displayName: "MiMo-v2.6-Flash",
    providerLabel: "Xiaomi Open Weights (LLM7)",
    upstream: "llm7",
    apiModelId: "mimo-v2.6-flash",
    specialty: "fast",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
  },
  {
    id: "kaspi-env-router",
    displayName: "Configured Cloud/Local Router (Gemini/Groq/Ollama)",
    providerLabel: "Multi-Gateway Router",
    upstream: "router",
    apiModelId: "auto",
    specialty: "general",
    supportsAnonymousBattle: false,
    isFreeZeroKey: true,
  },
];

export type ArenaExecutionMode = "battle" | "agent" | "side_by_side" | "direct";
export type ArenaModality = "auto" | "code" | "text" | "search" | "image";

export interface ArenaProjectFileItem {
  path: string;
  name: string;
  language: string;
  content: string;
}

export interface ArenaWebCitation {
  title: string;
  url: string;
  snippet: string;
}

export interface ArenaModelOutput {
  modelId: string;
  modelName: string;
  providerLabel: string;
  status: "completed" | "failed";
  latencyMs: number;
  errorMessage?: string;
  replyMarkdown: string;
  stepsLog: string[];
  modalityExecuted: "code" | "text" | "search" | "image";
  files: ArenaProjectFileItem[];
  previewHtml: string | null;
  imageUrl?: string | null;
  imageJobId?: string | null;
  citations?: ArenaWebCitation[];
}

/**
 * Picks 2 distinct anonymous models for Battle Mode, preferring two DIFFERENT upstream
 * hosts (1 llm7 model + 1 pollinations or configured router model, or staggered llm7)
 * so parallel calls succeed reliably without rate-limit collisions.
 */
export function selectBattleModelPair(prompt: string): [ArenaRealModelSpec, ArenaRealModelSpec] {
  const isCode =
    /(build|create|make|website|site|app|game|dashboard|store|html|css|react|3d|three\.?js|calculator|landing|صفحة|موقع|متجر|تطبيق|لعبة|صمم|أنشئ|برمج|واجهة|نظام)/i.test(
      prompt
    );

  // Pair two distinct upstream providers so Battle Mode avoids burst limits on a single host
  const llm7Pool = isCode
    ? ["gemma4-31b", "deepseek-v4-flash", "gpt-oss-120b"]
    : ["deepseek-v4-flash", "gemma4-31b", "gpt-oss-120b"];

  const pickAId = llm7Pool[Math.floor(Math.random() * llm7Pool.length)];
  const modelA = ARENA_REAL_MODELS.find((m) => m.id === pickAId) || ARENA_REAL_MODELS[0];
  const modelB =
    ARENA_REAL_MODELS.find((m) => m.id === "gpt-oss-20b-fast") || ARENA_REAL_MODELS[1];

  return Math.random() < 0.5 ? [modelA, modelB] : [modelB, modelA];
}
