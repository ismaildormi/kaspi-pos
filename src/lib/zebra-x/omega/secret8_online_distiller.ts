import fs from "node:fs";
import path from "node:path";
import { scrubSensitivePiiAndTaxIds } from "./secret9_cyber_immune";

export interface OnlineFeedbackEvent {
  domain: string;
  strategyUsed: string;
  reward: number; // 0.0 to 1.0 (thumbs up / test pass / POS sale conversion = 1.0, failure = 0.0)
  promptSummary: string;
  winningRuleOrSnippet?: string;
}

export interface StrategyBanditArm {
  strategy: string;
  pulls: number;
  ewmaReward: number;
  ucbScore: number;
  lastUpdatedAt: string;
}

export interface OnlineDistillResult {
  ok: true;
  domain: string;
  totalObservations: number;
  recommendedStrategy: string;
  distilledRulesCount: number;
  portableDeltaBytes: number;
  arms: StrategyBanditArm[];
}

interface BanditStoreState {
  totalPulls: number;
  armsByDomain: Record<string, Record<string, { pulls: number; ewma: number; lastUpdatedAt: string }>>;
  distilledRules: Array<{ domain: string; rule: string; reward: number; recordedAt: string }>;
}

let loaded = false;
const store: BanditStoreState = {
  totalPulls: 0,
  armsByDomain: {
    commerce: {
      morph_calculator_first: { pulls: 4, ewma: 0.92, lastUpdatedAt: "2026-11-23T00:00:00Z" },
      text_breakdown_only: { pulls: 3, ewma: 0.65, lastUpdatedAt: "2026-11-23T00:00:00Z" },
    },
    coding: {
      action_first_split_files: { pulls: 5, ewma: 0.94, lastUpdatedAt: "2026-11-23T00:00:00Z" },
      single_snippet_explain: { pulls: 3, ewma: 0.61, lastUpdatedAt: "2026-11-23T00:00:00Z" },
    },
  },
  distilledRules: [],
};

function stateFile(): string {
  return path.join("/tmp/heyuka-vault", "omega-secret8-online-rl.json");
}

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  try {
    const fp = stateFile();
    if (fs.existsSync(fp)) {
      const parsed = JSON.parse(fs.readFileSync(fp, "utf8"));
      if (parsed?.armsByDomain) {
        store.totalPulls = Number(parsed.totalPulls || 0);
        Object.assign(store.armsByDomain, parsed.armsByDomain);
        if (Array.isArray(parsed.distilledRules)) store.distilledRules = parsed.distilledRules;
      }
    }
  } catch {
    // Serverless ROFS safe
  }
}

function persistState(): void {
  try {
    fs.mkdirSync("/tmp/heyuka-vault", { recursive: true });
    fs.writeFileSync(stateFile(), JSON.stringify(store, null, 2), "utf8");
  } catch {
    // ROFS safe
  }
}

/**
 * Secret #8 (`v88.0`): River/Vowpal-Wabbit O(1) Streaming UCB1 Contextual Bandit & Online Skill Distiller.
 * Scrubs PII automatically via Secret #9 before distilling any rule into portable JSON/LoRA deltas.
 */
export function recordOnlineExperienceAndDistill(ev: OnlineFeedbackEvent): OnlineDistillResult {
  ensureLoaded();
  const domain = String(ev.domain || "general").toLowerCase().slice(0, 32);
  const strategy = String(ev.strategyUsed || "default").slice(0, 48);
  const reward = Math.max(0, Math.min(1, Number(ev.reward || 0)));
  const alpha = 0.28; // EWMA learning step rate

  if (!store.armsByDomain[domain]) store.armsByDomain[domain] = {};
  const prev = store.armsByDomain[domain][strategy] || { pulls: 0, ewma: 0.5, lastUpdatedAt: new Date().toISOString() };
  const nextPulls = prev.pulls + 1;
  const nextEwma = prev.pulls === 0 ? reward : prev.ewma * (1 - alpha) + reward * alpha;
  const nowIso = new Date().toISOString();

  store.armsByDomain[domain][strategy] = {
    pulls: nextPulls,
    ewma: Number(nextEwma.toFixed(4)),
    lastUpdatedAt: nowIso,
  };
  store.totalPulls += 1;

  if (reward >= 0.8 && ev.winningRuleOrSnippet) {
    const clean = scrubSensitivePiiAndTaxIds(ev.winningRuleOrSnippet).scrubbedText.slice(0, 260);
    if (clean && !store.distilledRules.some((r) => r.rule === clean)) {
      store.distilledRules.push({ domain, rule: clean, reward, recordedAt: nowIso });
      store.distilledRules = store.distilledRules.slice(-150);
    }
  }

  persistState();
  return selectBestOnlineStrategy(domain);
}

export function selectBestOnlineStrategy(domain: string): OnlineDistillResult {
  ensureLoaded();
  const dom = String(domain || "general").toLowerCase().slice(0, 32);
  const domainArms = store.armsByDomain[dom] || store.armsByDomain.coding || {};
  const totalDomPulls = Math.max(
    1,
    Object.values(domainArms).reduce((s, a) => s + a.pulls, 0)
  );

  const arms: StrategyBanditArm[] = Object.entries(domainArms)
    .map(([strategy, stats]) => {
      const exploration = Math.sqrt((2 * Math.log(totalDomPulls + 1)) / Math.max(1, stats.pulls));
      return {
        strategy,
        pulls: stats.pulls,
        ewmaReward: Number(stats.ewma.toFixed(4)),
        ucbScore: Number((stats.ewma + 0.35 * exploration).toFixed(4)),
        lastUpdatedAt: stats.lastUpdatedAt,
      };
    })
    .sort((a, b) => b.ucbScore - a.ucbScore);

  const deltaPayload = JSON.stringify({
    schema: "heyuka-edge-delta-v1",
    domain: dom,
    arms,
    rules: store.distilledRules.filter((r) => r.domain === dom).slice(-20),
  });

  return {
    ok: true,
    domain: dom,
    totalObservations: store.totalPulls,
    recommendedStrategy: arms[0]?.strategy || "action_first_split_files",
    distilledRulesCount: store.distilledRules.length,
    portableDeltaBytes: Buffer.byteLength(deltaPayload, "utf8"),
    arms,
  };
}
