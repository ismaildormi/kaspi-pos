/**
 * HEYUKA Multi-Token Hugging Face Pool & 3-Model Load Rotator ($0.00 Zero-Hardcoded-Secrets)
 *
 * Reads all keys purely from environment variables (`HF_TOKEN`, `HF_TOKEN_2`, `HF_TOKEN_3`,
 * `HF_TOKEN_4`, `HUGGINGFACE_API_KEYS`, `HUGGINGFACE_API_KEY`) and rotates traffic cleanly
 * across the 3 cooperating model lanes while tracking rate-limit cooldowns.
 */

export type HfLaneRole = "model_1_omni" | "model_2_core" | "model_3_vision" | "ingest" | "read_fast";

export type HeyukaHierarchyRole = "heyuka-omni" | "heyuka-core" | "heyuka-vision";
export type HeyukaBrainId = HeyukaHierarchyRole;

export interface ModelHierarchyDirective {
  role: HeyukaHierarchyRole;
  title: string;
  hfLane: HfLaneRole;
  preferredHfModels: string[];
  mission: string;
}

/**
 * Classifies and routes every request through the unified 3-model command hierarchy:
 * - `heyuka-omni`: Strategic supreme commander & multi-domain synthesizer
 * - `heyuka-core`: Deterministic software architecture, math & Moroccan DGI verifier
 * - `heyuka-vision`: Multimodal image, screen UI, 3D WebGL & media specialist
 */
export function resolveModelCommandHierarchy(params: {
  requestedModel?: string;
  prompt?: string;
  hasImage?: boolean;
  mode?: string;
}): ModelHierarchyDirective {
  const m = String(params.requestedModel || "").toLowerCase();
  const mode = String(params.mode || "").toLowerCase();
  const p = String(params.prompt || "");
  const sovereignEnv = process.env.HEYUKA_SOVEREIGN_HF_MODEL?.trim();

  const explicitVision = m === "heyuka-vision" || m === "vision";
  const explicitCore = m === "heyuka-core" || m === "core" || m === "kaspi-pos-analyst";
  const explicitOmni = m === "heyuka-omni" || m === "omni";
  const allowAutoDetect = !explicitVision && !explicitCore && !explicitOmni;

  const hasVisionCue =
    params.hasImage ||
    mode === "image" ||
    mode === "video" ||
    mode === "3d" ||
    /(?:\b(?:image|vision|screenshot|ui|ux|3d|canvas|shader)\b|صورة|فيديو|واجهة|تصميم)/i.test(p);

  const hasCoreCue =
    mode === "coding" ||
    mode === "security" ||
    /(?:\b(?:code|bug|typescript|python|sql|math|proof|tva|dgi|calculate)\b|برمجة|كود|ضريبة|حساب|برهان)/i.test(p);

  // Explicit user model selection always wins; only auto-detect when model is unset/auto/swarm
  if (explicitVision || params.hasImage || (allowAutoDetect && hasVisionCue)) {
    return {
      role: "heyuka-vision",
      title: "HEYUKA Vision — Multimodal, UI & 3D Media Expert",
      hfLane: "model_3_vision",
      preferredHfModels: [
        ...(sovereignEnv ? [sovereignEnv] : []),
        "Qwen/Qwen2.5-72B-Instruct",
        "meta-llama/Llama-3.3-70B-Instruct",
        "deepseek-ai/DeepSeek-R1",
      ],
      mission: "Analyze visual inputs, DOM/Set-of-Mark UI, and 3D shaders with multimodal verification.",
    };
  }

  if (explicitCore || (allowAutoDetect && hasCoreCue)) {
    return {
      role: "heyuka-core",
      title: "HEYUKA Core — Engineering, Logic & Proof Architect",
      hfLane: "model_2_core",
      preferredHfModels: [
        ...(sovereignEnv ? [sovereignEnv] : []),
        "deepseek-ai/DeepSeek-R1",
        "Qwen/Qwen2.5-Coder-32B-Instruct",
        "Qwen/Qwen2.5-72B-Instruct",
      ],
      mission: "Synthesize clean zero-stub code, AST checks, and formally verified Moroccan DGI math.",
    };
  }

  return {
    role: "heyuka-omni",
    title: "HEYUKA Omni — Supreme Strategic Orchestrator",
    hfLane: "model_1_omni",
    preferredHfModels: [
      ...(sovereignEnv ? [sovereignEnv] : []),
      "Qwen/Qwen2.5-72B-Instruct",
      "deepseek-ai/DeepSeek-R1",
      "meta-llama/Llama-3.3-70B-Instruct",
      "Qwen/Qwen2.5-Coder-32B-Instruct",
    ],
    mission: "Coordinate deep multi-source synthesis, council strategy, and end-to-end execution.",
  };
}

export interface HfPooledKey {
  index: number;
  envName: string;
  token: string;
  masked: string;
}

const hfCooldownUntil = new Map<number, number>();
let hfRoundRobinCursor = 0;

function maskKey(token: string): string {
  const clean = token.trim();
  return clean.length <= 8 ? "***" : `hf_...${clean.slice(-6)}`;
}

export function resolveHfDatasetRepo(): string {
  return (
    process.env.HF_DATASET_REPO?.trim() ||
    process.env.HF_REPO_ID?.trim() ||
    "zuvyrismail/heyuka-omni-vault"
  );
}

export function getHfTokenPoolTokens(): HfPooledKey[] {
  const rawList: Array<[string, string | undefined]> = [
    ["HF_TOKEN", process.env.HF_TOKEN],
    ["HF_TOKEN_2", process.env.HF_TOKEN_2],
    ["HF_TOKEN_3", process.env.HF_TOKEN_3],
    ["HF_TOKEN_4", process.env.HF_TOKEN_4],
    ["HUGGINGFACE_API_KEY", process.env.HUGGINGFACE_API_KEY],
  ];

  const csvKeys = process.env.HUGGINGFACE_API_KEYS || "";
  if (csvKeys) {
    csvKeys.split(",").forEach((k, idx) => {
      rawList.push([`HUGGINGFACE_API_KEYS[${idx}]`, k]);
    });
  }

  const seen = new Set<string>();
  const pool: HfPooledKey[] = [];
  for (const [envName, val] of rawList) {
    const clean = (val || "").trim();
    if (!clean || clean.toLowerCase().includes("mock") || seen.has(clean)) continue;
    seen.add(clean);
    pool.push({
      index: pool.length,
      envName,
      token: clean,
      masked: maskKey(clean),
    });
  }
  return pool;
}

export function markHfTokenRateLimited(index: number, ttlMs = 60_000): void {
  hfCooldownUntil.set(index, Date.now() + ttlMs);
}

/**
 * Selects a healthy token with role affinity so the 3 models spread load across keys automatically.
 */
export function selectHfTokenForRole(role: HfLaneRole): HfPooledKey | null {
  const pool = getHfTokenPoolTokens();
  if (pool.length === 0) return null;
  const now = Date.now();
  const roleOffset =
    role === "model_1_omni"
      ? 0
      : role === "model_2_core"
      ? 1
      : role === "model_3_vision"
      ? 3 % pool.length
      : role === "read_fast"
      ? 2 % pool.length
      : hfRoundRobinCursor++ % pool.length;

  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(roleOffset + i) % pool.length];
    if ((hfCooldownUntil.get(candidate.index) || 0) <= now) {
      return candidate;
    }
  }
  return pool[roleOffset % pool.length];
}

export function getHfTokenPoolSummary() {
  const pool = getHfTokenPoolTokens();
  const now = Date.now();
  return {
    configuredCount: pool.length,
    datasetRepo: resolveHfDatasetRepo(),
    lanes: pool.map((k) => ({
      envName: k.envName,
      masked: k.masked,
      coolingDown: (hfCooldownUntil.get(k.index) || 0) > now,
    })),
  };
}

export function getPoolTelemetry() {
  const summary = getHfTokenPoolSummary();
  const healthyCount = summary.lanes.filter((l) => !l.coolingDown).length;
  return {
    activeTokens: summary.configuredCount,
    healthyTokens: healthyCount,
    datasetRepo: summary.datasetRepo,
    lanes: summary.lanes,
  };
}
