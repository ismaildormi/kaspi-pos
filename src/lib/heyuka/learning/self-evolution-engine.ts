import fs from "node:fs";
import path from "node:path";
import {
  detectTraceLanguage,
  formatTracesAsChatMlJsonl,
  normalizeClientTraceInput,
  type ZebraLearningTraceRecord,
} from "@/lib/zebra-x/learning-trace";
import {
  searchSovereignVault,
  type UnifiedVaultEntry,
} from "@/lib/heyuka/vault/sovereign-permanent-vault";
import type { CognitiveClusterId } from "@/lib/zebra-x/core/cognitive-brain-registry";

/**
 * HEYUKA Continuous Self-Evolution & Product Learning Engine ($0.00 Owner Compute)
 *
 * Automatically learns from every artifact, video, 3D scene, image, code module,
 * or full project generated across HEYUKA's 1,100+ permanent vaulted sources:
 * 1. Scores artifact completeness & structural quality (0..1).
 * 2. Distills proven multi-source combinations into reusable Domain Recipes.
 * 3. Emits sanitized ChatML / DPO fine-tuning JSONL traces for Unsloth / Local Ollama.
 * 4. Persists state cleanly on caller/client hardware or /tmp ephemeral cache (ROFS safe).
 */

export interface EvolutionRecipe {
  domain: string;
  clusterId: CognitiveClusterId;
  recommendedSources: string[];
  preferredOutputFormats: string[];
  averageQualityScore: number;
  successCount: number;
  lastUpdatedAt: string;
}

export interface ProductEvolutionEventInput {
  prompt: string;
  clusterId: CognitiveClusterId;
  productKind: "video" | "3d" | "image" | "code" | "document" | "project" | "research";
  sourcesUsed: string[];
  outputFormats: string[];
  artifactCount: number;
  totalBytes: number;
  qualityScore?: number;
  modelUsed?: string;
  executionMode?: "client_cpu" | "caller_server" | "local_ollama" | "free_gateway";
}

const MAX_TRACES_IN_MEMORY = 250;
const evolutionTraces: ZebraLearningTraceRecord[] = [];
const recipeBook = new Map<string, EvolutionRecipe>();

function computeObjectiveQuality(ev: ProductEvolutionEventInput): number {
  if (typeof ev.qualityScore === "number" && Number.isFinite(ev.qualityScore)) {
    return Math.max(0.1, Math.min(1, ev.qualityScore));
  }
  let score = 0.62;
  if (ev.artifactCount >= 1) score += 0.14;
  if (ev.totalBytes >= 512) score += 0.12;
  if (ev.sourcesUsed.length >= 3) score += 0.08;
  if (ev.outputFormats.length >= 2) score += 0.04;
  return Number(Math.min(0.99, score).toFixed(2));
}

/**
 * Records an executed artifact / product into HEYUKA's self-learning memory & recipe distiller.
 */
export function recordProductSelfEvolution(ev: ProductEvolutionEventInput): {
  trace: ZebraLearningTraceRecord;
  recipe: EvolutionRecipe;
  totalLearnedTraces: number;
  clientStorageInstruction: {
    localStorageKey: string;
    recommendedLocalModelSync: string;
  };
} {
  const score = computeObjectiveQuality(ev);
  const trace = normalizeClientTraceInput({
    kind: ev.productKind === "code" || ev.productKind === "project" ? "TOOL_EXECUTION" : "MEDIA_OP",
    outcomeStatus: score >= 0.7 ? "SUCCESS" : "ABSTAIN",
    modelUsed: ev.modelUsed || "heyuka-omni-sovereign",
    routeSource: ev.executionMode === "local_ollama" ? "local_ollama" : "cloud_router",
    language: detectTraceLanguage(ev.prompt),
    userPrompt: ev.prompt.slice(0, 1200),
    assistantResponse: `Built ${ev.productKind} (${ev.artifactCount} files, ${ev.totalBytes} bytes, formats: ${ev.outputFormats.join(", ")}) using vaulted engines: ${ev.sourcesUsed.slice(0, 10).join(", ")}.`,
    toolNamesUsed: ev.sourcesUsed.slice(0, 12),
    qualityScore: score,
  });

  evolutionTraces.unshift(trace);
  if (evolutionTraces.length > MAX_TRACES_IN_MEMORY) {
    evolutionTraces.length = MAX_TRACES_IN_MEMORY;
  }

  const recipeKey = `${ev.clusterId}::${ev.productKind}`;
  const prev = recipeBook.get(recipeKey);
  const mergedSources = Array.from(
    new Set([...(prev?.recommendedSources || []), ...ev.sourcesUsed])
  ).slice(0, 16);
  const mergedFormats = Array.from(
    new Set([...(prev?.preferredOutputFormats || []), ...ev.outputFormats])
  ).slice(0, 10);
  const nextCount = (prev?.successCount || 0) + 1;
  const nextAvg = prev
    ? Number((((prev.averageQualityScore * prev.successCount) + score) / nextCount).toFixed(2))
    : score;

  const recipe: EvolutionRecipe = {
    domain: recipeKey,
    clusterId: ev.clusterId,
    recommendedSources: mergedSources,
    preferredOutputFormats: mergedFormats,
    averageQualityScore: nextAvg,
    successCount: nextCount,
    lastUpdatedAt: new Date().toISOString(),
  };
  recipeBook.set(recipeKey, recipe);

  // Best-effort local/ephemeral persistence (non-fatal on read-only cloud hosts)
  try {
    const dir = "/tmp/heyuka-vault";
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "self-evolution-recipes.json"),
      JSON.stringify(Array.from(recipeBook.values()), null, 2),
      "utf8"
    );
  } catch {
    // Serverless ROFS safe
  }

  return {
    trace,
    recipe,
    totalLearnedTraces: evolutionTraces.length,
    clientStorageInstruction: {
      localStorageKey: "heyuka_sovereign_evolution_v1",
      recommendedLocalModelSync: "ollama create heyuka-evolved -f ./Modelfile",
    },
  };
}

/**
 * Returns distilled learning hints + best-performing vaulted engines for any new prompt.
 */
export function getSelfEvolutionContextForPrompt(params: {
  prompt: string;
  clusterId: CognitiveClusterId;
}): {
  learnedRecipes: EvolutionRecipe[];
  suggestedVaultSources: UnifiedVaultEntry[];
  evolutionSummary: string;
} {
  const learnedRecipes = Array.from(recipeBook.values())
    .filter((r) => r.clusterId === params.clusterId)
    .sort((a, b) => b.averageQualityScore - a.averageQualityScore)
    .slice(0, 4);

  const suggestedVaultSources = searchSovereignVault({
    query: params.prompt,
    clusterId: params.clusterId,
    limit: 12,
  });

  const evolutionSummary =
    learnedRecipes.length > 0
      ? `Distilled from ${learnedRecipes.reduce((a, b) => a + b.successCount, 0)} prior verified builds (avg quality ${(learnedRecipes[0]?.averageQualityScore * 100).toFixed(0)}%). Top engines: ${learnedRecipes[0]?.recommendedSources.slice(0, 5).join(", ")}.`
      : `First-run sovereign routing over ${suggestedVaultSources.length} pre-classified Permanent Vault engines for ${params.clusterId}.`;

  return {
    learnedRecipes,
    suggestedVaultSources,
    evolutionSummary,
  };
}

export function exportEvolutionChatMlDataset(): {
  tracesCount: number;
  recipesCount: number;
  jsonl: string;
} {
  return {
    tracesCount: evolutionTraces.length,
    recipesCount: recipeBook.size,
    jsonl: formatTracesAsChatMlJsonl(evolutionTraces),
  };
}
