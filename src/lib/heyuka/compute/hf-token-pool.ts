/**
 * HEYUKA Multi-Token Hugging Face Pool & 3-Model Load Rotator ($0.00 Zero-Hardcoded-Secrets)
 *
 * Reads all keys purely from environment variables (`HF_TOKEN`, `HF_TOKEN_2`, `HF_TOKEN_3`,
 * `HF_TOKEN_4`, `HUGGINGFACE_API_KEYS`, `HUGGINGFACE_API_KEY`) and rotates traffic cleanly
 * across the 3 cooperating model lanes while tracking rate-limit cooldowns.
 */

export type HfLaneRole = "model_1_omni" | "model_2_core" | "model_3_vision" | "ingest" | "read_fast";

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
