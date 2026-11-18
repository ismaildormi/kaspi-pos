/**
 * ============================================================================
 * KASPI AI — REAL ARENA MULTI-MODEL REGISTRY & CAPABILITY CATALOG
 * Uses live zero-key open-weight endpoints (api.llm7.io, text.pollinations.ai,
 * aihorde.net, DuckDuckGo/Wikipedia) PLUS configured Google Gemini 3.8 Flash,
 * Groq, OpenRouter (:free pool), Mistral, DeepSeek, or Local Ollama/WebGPU.
 * Zero fake/canned model outputs.
 * ============================================================================
 */

export type ArenaUpstreamProvider =
  | "llm7"
  | "router_google"
  | "router_openrouter"
  | "router_groq"
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
  supportsClientDirect: boolean;
}

export const ARENA_REAL_MODELS: ArenaRealModelSpec[] = [
  {
    id: "kimi-k2.7-code",
    displayName: "Kimi-K2.7-Code",
    providerLabel: "Moonshot Open Weights (Client Edge)",
    upstream: "llm7",
    apiModelId: "kimi-k2.7-code",
    specialty: "coding",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
    supportsClientDirect: true,
  },
  {
    id: "gemma4-31b",
    displayName: "Gemma-4-31B",
    providerLabel: "Google Open Weights (Client Edge)",
    upstream: "llm7",
    apiModelId: "gemma4:31b",
    specialty: "general",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
    supportsClientDirect: true,
  },
  {
    id: "deepseek-v4-flash",
    displayName: "DeepSeek-V4-Flash",
    providerLabel: "DeepSeek Open Weights (Client Edge)",
    upstream: "llm7",
    apiModelId: "DeepSeek-V4-Flash-0731",
    specialty: "reasoning",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
    supportsClientDirect: true,
  },
  {
    id: "gpt-oss-120b",
    displayName: "GPT-OSS-120B",
    providerLabel: "Open-Weight 120B (Client Edge)",
    upstream: "llm7",
    apiModelId: "gpt-oss:120b",
    specialty: "general",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
    supportsClientDirect: true,
  },
  {
    id: "codestral-latest",
    displayName: "Codestral-Latest",
    providerLabel: "Mistral Coding (Client Edge)",
    upstream: "llm7",
    apiModelId: "codestral-latest",
    specialty: "coding",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
    supportsClientDirect: true,
  },
  {
    id: "glm-5.3-flash",
    displayName: "GLM-5.3-Flash",
    providerLabel: "Zhipu Open Weights (Client Edge)",
    upstream: "llm7",
    apiModelId: "glm-5.3-flash",
    specialty: "fast",
    supportsAnonymousBattle: false,
    isFreeZeroKey: true,
    supportsClientDirect: true,
  },
  {
    id: "gemma-3-27b",
    displayName: "Gemma-3-27B",
    providerLabel: "Google Open Weights 27B (Client Edge)",
    upstream: "llm7",
    apiModelId: "gemma-3-27b",
    specialty: "general",
    supportsAnonymousBattle: false,
    isFreeZeroKey: true,
    supportsClientDirect: true,
  },
  {
    id: "mimo-v2.6-flash",
    displayName: "MiMo-V2.6-Flash",
    providerLabel: "Xiaomi Open Weights (Client Edge)",
    upstream: "llm7",
    apiModelId: "mimo-v2.6-flash",
    specialty: "fast",
    supportsAnonymousBattle: false,
    isFreeZeroKey: true,
    supportsClientDirect: true,
  },
  {
    id: "groq-gpt-oss",
    displayName: "Groq-GPT-OSS-20B",
    providerLabel: "Groq LPU Inference (Cloud Fallback)",
    upstream: "router_groq",
    apiModelId: "openai/gpt-oss-20b",
    specialty: "fast",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
    supportsClientDirect: false,
  },
  {
    id: "groq-llama-instant",
    displayName: "Groq-Llama-3.1-8B-Instant",
    providerLabel: "Meta Llama 3.1 Fast via Groq LPU (Cloud Fallback)",
    upstream: "router_groq",
    apiModelId: "llama-3.1-8b-instant",
    specialty: "fast",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
    supportsClientDirect: false,
  },
  {
    id: "groq-llama33",
    displayName: "Groq-Llama-3.3-70B",
    providerLabel: "Meta Llama 3.3 via Groq LPU (Cloud Fallback)",
    upstream: "router_groq",
    apiModelId: "llama-3.3-70b-versatile",
    specialty: "coding",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
    supportsClientDirect: false,
  },
  {
    id: "openrouter-free",
    displayName: "OpenRouter-Free-Pool",
    providerLabel: "OpenRouter Free Tier (Cloud Fallback)",
    upstream: "router_openrouter",
    apiModelId: "openrouter/free",
    specialty: "coding",
    supportsAnonymousBattle: true,
    isFreeZeroKey: true,
    supportsClientDirect: false,
  },
];

export type ArenaExecutionMode = "battle" | "agent" | "side_by_side" | "direct";
export type ArenaModality = "auto" | "code" | "text" | "search" | "image" | "video";

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
  modalityExecuted: "code" | "text" | "search" | "image" | "video";
  files: ArenaProjectFileItem[];
  previewHtml: string | null;
  imageUrl?: string | null;
  imageJobId?: string | null;
  citations?: ArenaWebCitation[];
  executedOn?: "client-device" | "cloud-relay";
}

/**
 * Picks 2 distinct models reliably suited for the prompt.
 * When `preferClientDirect` is true, prefers open-weight client-edge models
 * so user prompts run on the user's machine/IP first (zero Vercel server load).
 */
export function selectBattleModelPair(
  prompt: string,
  preferClientDirect = true
): [ArenaRealModelSpec, ArenaRealModelSpec] {
  const isCode =
    /(build|create|make|design|develop|website|site|app|game|dashboard|store|shop|html|css|react|3d|three\.?js|calculator|landing|صفحة|موقع|سيت|متجر|تطبيق|لعبة|صوب|قاد|دير\s+لي|ابني|أبني|كريي|صمم|أنشئ|برمج|واجهة|نظام)/i.test(
      prompt
    );

  if (preferClientDirect) {
    const clientPoolA = isCode
      ? ["kimi-k2.7-code", "codestral-latest", "gemma4-31b"]
      : ["gemma4-31b", "deepseek-v4-flash", "gpt-oss-120b"];
    const clientPoolB = isCode
      ? ["gemma4-31b", "gpt-oss-120b", "deepseek-v4-flash"]
      : ["gpt-oss-120b", "kimi-k2.7-code", "codestral-latest"];

    const idA = clientPoolA[Math.floor(Math.random() * clientPoolA.length)];
    const filteredB = clientPoolB.filter((id) => id !== idA);
    const idB = filteredB[Math.floor(Math.random() * filteredB.length)] || "gpt-oss-120b";

    const mA = ARENA_REAL_MODELS.find((m) => m.id === idA) || ARENA_REAL_MODELS[0];
    const mB = ARENA_REAL_MODELS.find((m) => m.id === idB) || ARENA_REAL_MODELS[1];
    return [mA, mB];
  }

  // Server pool pairing: fast Groq LPU models (<=4s parallel response, never hits 504)
  const modelA = ARENA_REAL_MODELS.find((m) => m.id === "groq-gpt-oss") || ARENA_REAL_MODELS[0];
  const modelB =
    ARENA_REAL_MODELS.find((m) => m.id === "groq-llama-instant") ||
    ARENA_REAL_MODELS.find((m) => m.id === "groq-llama33") ||
    ARENA_REAL_MODELS[1];
  return Math.random() < 0.5 ? [modelA, modelB] : [modelB, modelA];
}
