/**
 * ============================================================================
 * KASPI POS — Arena Evaluation, Bradley-Terry & Independent Model Registry
 * Ported & Integrated from:
 *   - external_sources/arena-rank/arena_rank/models/bradley_terry.py (Arena-OSS)
 *   - external_sources/FastChat/fastchat/serve/monitor/elo_analysis.py (LMSYS)
 *   - external_sources/arena-hard-auto (LMArena)
 *
 * Stage 4 Compliance:
 * - Strictly separates:
 *   1. Human Preference Votes (merchant votes on side-by-side battles)
 *   2. Bradley-Terry / Online Elo Rating (computed ONLY from real recorded votes; baseline 1000 when battles = 0)
 *   3. Win Rate (wins / battles percentage, null when battles = 0)
 *   4. Automated Benchmark Score (deterministic schema, section & anti-hallucination rubric 0-100)
 *   5. LLM-as-a-Judge (explicitly marked as optional external judge; never mixed with human Elo)
 * - Zero fake pre-populated battles or fabricated Elo scores.
 * - Independent model descriptors with per-model timeout, context limits, status, and error logs.
 * ============================================================================
 */

import type { PuckData } from "./puck-engine";
import { ALL_PUCK_SECTION_TYPES } from "./puck-engine";
import type { AggregatedStoreContext } from "@/lib/ai/store-context-builder";
import { ARENA_REAL_MODELS } from "@/lib/ai/arena-models";

export type BattleOutcome = "model_a" | "model_b" | "tie" | "both_bad";

export interface ArenaModelDescriptor {
  id: string;
  displayName: string;
  provider: string;
  architectureRole: string;
  contextWindowTokens: number;
  timeoutMs: number;
  isFreeZeroToken: boolean;
  connectionStatus: "ready" | "degraded" | "offline";
  lastLatencyMs: number | null;
  errorLog: Array<{ timestamp: string; message: string }>;
}

export interface HumanPreferenceVoteRecord {
  voteId: string;
  tenantId: string;
  timestamp: string;
  promptSummary: string;
  modelAId: string;
  modelBId: string;
  outcome: BattleOutcome;
}

export interface AutomatedBenchmarkScore {
  modelId: string;
  totalScorePct: number; // 0 to 100
  jsonValid: boolean;
  sectionsPresentCount: number;
  requiredSectionsCount: number;
  priceIntegrityVerified: boolean;
  currencyMatchVerified: boolean;
  zeroHallucinatedProducts: boolean;
}

export interface ArenaModelEvaluationSummary {
  modelId: string;
  displayName: string;
  provider: string;
  // 1. Human Preference Counts
  humanBattles: number;
  humanWins: number;
  humanLosses: number;
  humanTies: number;
  humanBothBad: number;
  // 2. Win Rate (strictly from real human battles; null if 0 battles)
  winRatePct: number | null;
  // 3. Bradley-Terry / Online Elo Rating (baseline 1000.0, updated only from real votes)
  bradleyTerryElo: number;
  isProvisionalElo: boolean; // true until humanBattles >= 1
  // 4. Automated Benchmark Score (latest deterministic rubric score)
  lastBenchmarkScorePct: number | null;
  // 5. LLM-as-a-Judge info
  llmJudgeMode: "disabled_zero_token" | "optional_external_api";
}

export const ARENA_MODEL_REGISTRY: ArenaModelDescriptor[] = [
  {
    id: "arena-architect-alpha",
    displayName: "Kaspi Architect Alpha (Emerald Crystal Layout)",
    provider: "Multi-Gateway Router (Gemini / Groq / Pollinations)",
    architectureRole: "Luxury Brand & Category-First Storefront Architect",
    contextWindowTokens: 32768,
    timeoutMs: 12000,
    isFreeZeroToken: true,
    connectionStatus: "ready",
    lastLatencyMs: null,
    errorLog: [],
  },
  {
    id: "arena-commerce-beta",
    displayName: "Kaspi Commerce Beta (High-Velocity Direct Order)",
    provider: "Multi-Gateway Router (Llama-3.3 / DeepSeek / Pollinations)",
    architectureRole: "Conversion-Focused Direct Catalog & WhatsApp Checkout Specialist",
    contextWindowTokens: 32768,
    timeoutMs: 12000,
    isFreeZeroToken: true,
    connectionStatus: "ready",
    lastLatencyMs: null,
    errorLog: [],
  },
  {
    id: "arena-minimal-gamma",
    displayName: "Kaspi Minimal Gamma (Fast Mobile Catalog)",
    provider: "Local Deterministic + Free OpenAI Gateway",
    architectureRole: "Ultra-Fast Mobile-First Catalog & Price Table Specialist",
    contextWindowTokens: 16384,
    timeoutMs: 8000,
    isFreeZeroToken: true,
    connectionStatus: "ready",
    lastLatencyMs: null,
    errorLog: [],
  },
];

const ARENA_VOTES_STORAGE_KEY = "kaspi_arena_human_votes_v2";
const ARENA_BENCHMARKS_STORAGE_KEY = "kaspi_arena_benchmarks_v2";

/**
 * Computes deterministic Automated Benchmark Score (0-100%) for a generated PuckData
 * against the merchant's real AggregatedStoreContext.
 */
export function evaluateAutomatedPuckBenchmark(
  modelId: string,
  puckData: PuckData,
  ctx: AggregatedStoreContext
): AutomatedBenchmarkScore {
  const jsonValid = Boolean(
    puckData &&
      puckData.root &&
      puckData.root.props &&
      Array.isArray(puckData.content)
  );

  const presentTypes = new Set(
    Array.isArray(puckData?.content) ? puckData.content.map((c) => c.type) : []
  );
  const sectionsPresentCount = ALL_PUCK_SECTION_TYPES.filter((t) =>
    presentTypes.has(t)
  ).length;
  const requiredSectionsCount = ALL_PUCK_SECTION_TYPES.length;

  const currencyMatchVerified =
    puckData?.root?.props?.currency === ctx.currency;

  // Verify product prices and IDs match real store products
  const cardsBlock = Array.isArray(puckData?.content)
    ? puckData.content.find((c) => c.type === "ProductCards")
    : undefined;
  const cardProds = Array.isArray(cardsBlock?.props?.products)
    ? (cardsBlock.props.products as Array<{ id: string; price: number }>)
    : [];

  const realPriceMap = new Map<string, number>();
  for (const p of ctx.products) {
    realPriceMap.set(p.id, p.price);
  }

  let priceIntegrityVerified = true;
  let zeroHallucinatedProducts = true;

  for (const cp of cardProds) {
    if (!realPriceMap.has(cp.id)) {
      zeroHallucinatedProducts = false;
      break;
    }
    const expectedPrice = realPriceMap.get(cp.id)!;
    if (Math.abs(Number(cp.price) - expectedPrice) > 0.01) {
      priceIntegrityVerified = false;
      break;
    }
  }

  let score = 0;
  if (jsonValid) score += 25;
  score += Math.round((sectionsPresentCount / requiredSectionsCount) * 35);
  if (currencyMatchVerified) score += 10;
  if (priceIntegrityVerified) score += 15;
  if (zeroHallucinatedProducts) score += 15;

  return {
    modelId,
    totalScorePct: Math.min(100, score),
    jsonValid,
    sectionsPresentCount,
    requiredSectionsCount,
    priceIntegrityVerified,
    currencyMatchVerified,
    zeroHallucinatedProducts,
  };
}

/**
 * Ported from Arena-OSS/arena-rank/arena_rank/models/bradley_terry.py
 * Fits Bradley-Terry ratings from actual recorded pairwise human preference votes.
 * Scale = 400.0, Base = 10.0, Init Rating = 1000.0.
 * If 0 votes exist, all models remain at baseline 1000.0 with humanBattles = 0.
 */
export function computeBradleyTerryLeaderboard(
  votes: HumanPreferenceVoteRecord[],
  latestBenchmarks: Record<string, number> = {}
): ArenaModelEvaluationSummary[] {
  const catalogList = [
    ...ARENA_REAL_MODELS.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      provider: m.providerLabel,
    })),
    ...ARENA_MODEL_REGISTRY.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      provider: m.provider,
    })),
  ];

  // Include any voted model id not statically listed
  const seen = new Set(catalogList.map((m) => m.id));
  for (const v of votes) {
    for (const id of [v.modelAId, v.modelBId]) {
      if (id && !seen.has(id)) {
        seen.add(id);
        catalogList.push({ id, displayName: id, provider: "Arena Gateway" });
      }
    }
  }

  const modelIds = catalogList.map((m) => m.id);
  const n = modelIds.length;
  const idToIdx = new Map<string, number>();
  modelIds.forEach((id, i) => idToIdx.set(id, i));

  const wins = new Array<number>(n).fill(0);
  const losses = new Array<number>(n).fill(0);
  const ties = new Array<number>(n).fill(0);
  const bothBad = new Array<number>(n).fill(0);
  const battles = new Array<number>(n).fill(0);

  // Pairwise outcomes for Bradley-Terry MLE optimization
  const pairs: Array<[number, number, number]> = [];

  for (const v of votes) {
    const iA = idToIdx.get(v.modelAId);
    const iB = idToIdx.get(v.modelBId);
    if (iA === undefined || iB === undefined || iA === iB) continue;

    battles[iA] += 1;
    battles[iB] += 1;

    if (v.outcome === "model_a") {
      wins[iA] += 1;
      losses[iB] += 1;
      pairs.push([iA, iB, 1.0]);
    } else if (v.outcome === "model_b") {
      wins[iB] += 1;
      losses[iA] += 1;
      pairs.push([iA, iB, 0.0]);
    } else if (v.outcome === "tie") {
      ties[iA] += 1;
      ties[iB] += 1;
      pairs.push([iA, iB, 0.5]);
    } else {
      bothBad[iA] += 1;
      bothBad[iB] += 1;
      pairs.push([iA, iB, 0.5]);
    }
  }

  // Bradley-Terry iterative Newton/Gradient optimization (scale=400, base=10, init=1000)
  const logits = new Array<number>(n).fill(0.0);
  if (pairs.length > 0) {
    const reg = 1e-3;
    const lr = 0.15;
    for (let iter = 0; iter < 150; iter++) {
      const grad = logits.map((l) => -reg * l);
      for (const [i, j, y] of pairs) {
        const diff = logits[i] - logits[j];
        const prob = 1 / (1 + Math.exp(-diff));
        const err = y - prob;
        grad[i] += err;
        grad[j] -= err;
      }
      for (let k = 0; k < n; k++) {
        logits[k] += (lr / Math.max(1, pairs.length)) * grad[k];
      }
      // Zero-center logits
      const mean = logits.reduce((a, b) => a + b, 0) / n;
      for (let k = 0; k < n; k++) {
        logits[k] -= mean;
      }
    }
  }

  const alpha = 400.0 / Math.log(10.0);
  const summaries: ArenaModelEvaluationSummary[] = catalogList.map(
    (m, idx) => {
      const bCount = battles[idx];
      const wCount = wins[idx];
      const tCount = ties[idx];
      const elo =
        bCount > 0 ? Math.round(1000.0 + alpha * logits[idx]) : 1000;
      const winRatePct =
        bCount > 0
          ? Math.round(((wCount + 0.5 * tCount) / bCount) * 1000) / 10
          : null;

      return {
        modelId: m.id,
        displayName: m.displayName,
        provider: m.provider,
        humanBattles: bCount,
        humanWins: wCount,
        humanLosses: losses[idx],
        humanTies: tCount,
        humanBothBad: bothBad[idx],
        winRatePct,
        bradleyTerryElo: elo,
        isProvisionalElo: bCount === 0,
        lastBenchmarkScorePct: latestBenchmarks[m.id] ?? null,
        llmJudgeMode: "disabled_zero_token",
      };
    }
  );

  return summaries.sort((a, b) => b.bradleyTerryElo - a.bradleyTerryElo);
}

export function loadHumanPreferenceVotes(tenantId = "default"): HumanPreferenceVoteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${ARENA_VOTES_STORAGE_KEY}_${tenantId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHumanPreferenceVote(
  vote: Omit<HumanPreferenceVoteRecord, "voteId" | "timestamp">
): HumanPreferenceVoteRecord[] {
  const existing = loadHumanPreferenceVotes(vote.tenantId);
  const record: HumanPreferenceVoteRecord = {
    ...vote,
    voteId: `vote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [record, ...existing].slice(0, 200);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `${ARENA_VOTES_STORAGE_KEY}_${vote.tenantId}`,
        JSON.stringify(updated)
      );
    } catch {}
  }
  return updated;
}

export function saveBenchmarkScores(
  tenantId: string,
  scores: Record<string, number>
): Record<string, number> {
  if (typeof window === "undefined") return scores;
  try {
    const raw = localStorage.getItem(`${ARENA_BENCHMARKS_STORAGE_KEY}_${tenantId}`);
    const existing = raw ? JSON.parse(raw) : {};
    const merged = { ...existing, ...scores };
    localStorage.setItem(
      `${ARENA_BENCHMARKS_STORAGE_KEY}_${tenantId}`,
      JSON.stringify(merged)
    );
    return merged;
  } catch {
    return scores;
  }
}

export function loadBenchmarkScores(tenantId = "default"): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${ARENA_BENCHMARKS_STORAGE_KEY}_${tenantId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
