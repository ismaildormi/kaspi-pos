import type {
  ElasticScaleMode,
  StudioBrand,
  SwarmCouncilNode,
  WorkerBotExecution,
} from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";

export type { ElasticScaleMode, StudioBrand, SwarmCouncilNode, WorkerBotExecution };

export type StudioMode =
  | "create_chat"
  | "create_freeform"
  | "stream_realtime"
  | "build"
  | "compare"
  | "starter_apps"
  | "team_collab"
  | "offline_vault"
  | "api_keys";

export type StudioModelId =
  | "heyuka-omni"
  | "heyuka-core"
  | "heyuka-vision"
  | "multi-agent-3"
  | "kaspi-pos-analyst";

export type SafetyBlockLevel = "BLOCK_NONE" | "BLOCK_ONLY_HIGH" | "BLOCK_MEDIUM_AND_ABOVE" | "BLOCK_LOW_AND_ABOVE";

export interface StructuredPropertyDef {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  description: string;
}

export interface FunctionToolDef {
  id: string;
  name: string;
  description: string;
  parametersJson: string;
  enabled: boolean;
}

export interface ContextCacheItem {
  id: string;
  label: string;
  content: string;
  ttlHours: number;
  tokensEstimate: number;
  createdAt: string;
}

export interface RightRunSettings {
  model: StudioModelId;
  elasticScale: ElasticScaleMode;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  thinkingEnabled: boolean;
  thinkingBudget: number;
  mediaResolution: "low" | "medium" | "high" | "ultra";
  videoFps: number;
  videoClipStartSec: number;
  videoClipEndSec: number;
  seed: string;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
  responseMimeType: "text/plain" | "application/json" | "text/x.enum";
  safetySettings: {
    harassment: SafetyBlockLevel;
    hateSpeech: SafetyBlockLevel;
    sexuallyExplicit: SafetyBlockLevel;
    dangerousContent: SafetyBlockLevel;
  };
  structuredOutputsEnabled: boolean;
  structuredProperties: StructuredPropertyDef[];
  functionCallingEnabled: boolean;
  functionTools: FunctionToolDef[];
  codeExecutionEnabled: boolean;
  groundingSearchEnabled: boolean;
  groundingThreshold: number;
  groundingMapsEnabled: boolean;
  urlContextEnabled: boolean;
  runtimeTarget: "cloud" | "local_ollama";
  localOllamaUrl: string;
  localOllamaModel: string;
}

export interface AttachedMediaItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string;
  textPreview?: string;
  clipStartSec?: number;
  clipEndSec?: number;
  fps?: number;
}

export interface StudioFileNode {
  path: string;
  language: string;
  content: string;
}

export interface StudioMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  thoughts?: string;
  thinkingSeconds?: number;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  tokPerSec?: number;
  viewMode?: "markdown" | "raw" | "json";
  attachments?: AttachedMediaItem[];
  searchQueries?: string[];
  citations?: Array<{ title: string; url: string }>;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
    responseText?: string;
  };
  codeFiles?: StudioFileNode[];
  swarmResult?: {
    tier: string;
    modelCount: number;
    nodes: SwarmCouncilNode[];
    spawnedBots: WorkerBotExecution[];
  };
  branchLabel?: string;
  createdAt: string;
}

export interface FewShotPair {
  id: string;
  input: string;
  output: string;
}

export interface KanbanTaskItem {
  id: string;
  title: string;
  assignee: string;
  status: "backlog" | "in_progress" | "review" | "done";
  xpReward: number;
}

export const DEFAULT_RUN_SETTINGS: RightRunSettings = {
  model: "heyuka-omni",
  elasticScale: "auto",
  temperature: 0.7,
  topP: 0.95,
  maxOutputTokens: 8192,
  thinkingEnabled: true,
  thinkingBudget: 8192,
  mediaResolution: "high",
  videoFps: 2,
  videoClipStartSec: 0,
  videoClipEndSec: 30,
  seed: "",
  frequencyPenalty: 0,
  presencePenalty: 0,
  stopSequences: [],
  responseMimeType: "text/plain",
  safetySettings: {
    harassment: "BLOCK_MEDIUM_AND_ABOVE",
    hateSpeech: "BLOCK_MEDIUM_AND_ABOVE",
    sexuallyExplicit: "BLOCK_MEDIUM_AND_ABOVE",
    dangerousContent: "BLOCK_MEDIUM_AND_ABOVE",
  },
  structuredOutputsEnabled: false,
  structuredProperties: [
    { id: "p1", name: "summary", type: "string", required: true, description: "Executive summary" },
    { id: "p2", name: "actionItems", type: "array", required: true, description: "Concrete next steps" },
    { id: "p3", name: "confidence", type: "number", required: false, description: "Score 0-100" },
  ],
  functionCallingEnabled: true,
  functionTools: [
    {
      id: "fn_pos_sales",
      name: "get_pos_sales",
      description: "Query retail daily sales & TTC revenue inside KASPI POS.",
      parametersJson: JSON.stringify(
        { type: "object", properties: { store: { type: "string" }, range: { type: "string" } }, required: ["range"] },
        null,
        2
      ),
      enabled: true,
    },
    {
      id: "fn_search_vault",
      name: "search_sovereign_vault",
      description: "Search across 2,496+ pre-classified open-source engines and live APIs.",
      parametersJson: JSON.stringify(
        { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
        null,
        2
      ),
      enabled: true,
    },
  ],
  codeExecutionEnabled: true,
  groundingSearchEnabled: true,
  groundingThreshold: 0.35,
  groundingMapsEnabled: false,
  urlContextEnabled: true,
  runtimeTarget: "cloud",
  localOllamaUrl: "http://127.0.0.1:11434/v1",
  localOllamaModel: "llama3",
};

export function estimateTokenCount(text: string): number {
  const s = String(text || "");
  if (!s) return 0;
  return Math.max(1, Math.ceil(s.length / 3.6));
}

export function buildSchemaJsonFromProperties(props: StructuredPropertyDef[]): string {
  const properties: Record<string, { type: string; description?: string }> = {};
  const required: string[] = [];
  for (const p of props) {
    if (!p.name.trim()) continue;
    properties[p.name.trim()] = {
      type: p.type,
      ...(p.description ? { description: p.description } : {}),
    };
    if (p.required) required.push(p.name.trim());
  }
  return JSON.stringify({ type: "object", properties, required }, null, 2);
}
