import fs from "node:fs";
import path from "node:path";

export type SwarmNodeKind =
  | "github_matrix"
  | "hf_space_docker"
  | "cloudflare_edge"
  | "kaggle_colab_warc"
  | "gitlab_vercel_cron"
  | "browser_p2p";

export interface SwarmNodeHeartbeat {
  nodeId: string;
  kind: SwarmNodeKind;
  shardId: number;
  totalShards: number;
  pagesProcessedTotal: number;
  hllUniqueEstimate: number;
  lastDigest?: string;
  lastSeenAt: string;
  lastSeenMs: number;
}

export const MULTI_CLOUD_120_POOLS = [
  { id: "github_actions_matrix", label: "GitHub Actions 20x Matrix", shardRange: "0..19", shardCapacity: 20, kind: "github_matrix" as const },
  { id: "hf_spaces_docker", label: "Hugging Face Spaces Docker", shardRange: "20..44", shardCapacity: 25, kind: "hf_space_docker" as const },
  { id: "cloudflare_edge_workers", label: "Cloudflare Workers Edge (300+ Cities)", shardRange: "45..84", shardCapacity: 40, kind: "cloudflare_edge" as const },
  { id: "kaggle_colab_warc", label: "Kaggle / Colab / Lightning WARC", shardRange: "85..99", shardCapacity: 15, kind: "kaggle_colab_warc" as const },
  { id: "gitlab_vercel_cron", label: "GitLab CI / Vercel Edge Delta", shardRange: "100..109", shardCapacity: 10, kind: "gitlab_vercel_cron" as const },
  { id: "browser_p2p_mesh", label: "Browser P2P WebWorker Swarm", shardRange: "110..119+", shardCapacity: 10, kind: "browser_p2p" as const },
] as const;

const MAX_TRACKED_NODES = 240;
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;
const STALE_PRUNE_MS = 2 * 60 * 60 * 1000;
const swarmNodes = new Map<string, SwarmNodeHeartbeat>();
let hydrated = false;

function stateFilePath() {
  return path.join("/tmp/heyuka-vault", "swarm-nodes.json");
}

function hydrateNodes() {
  if (hydrated) return;
  hydrated = true;
  try {
    const fp = stateFilePath();
    if (fs.existsSync(fp)) {
      const raw = JSON.parse(fs.readFileSync(fp, "utf8")) as SwarmNodeHeartbeat[];
      if (Array.isArray(raw)) {
        for (const row of raw.slice(0, MAX_TRACKED_NODES)) {
          if (row?.nodeId) swarmNodes.set(row.nodeId, row);
        }
      }
    }
  } catch {}
}

function persistNodes() {
  try {
    const dir = "/tmp/heyuka-vault";
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(stateFilePath(), JSON.stringify(Array.from(swarmNodes.values())), "utf8");
  } catch {}
}

export function recordSwarmNodeHeartbeat(input: {
  nodeId: string;
  kind: SwarmNodeKind;
  shardId: number;
  totalShards?: number;
  pagesProcessedDelta?: number;
  hllUniqueEstimate?: number;
  lastDigest?: string;
}) {
  hydrateNodes();
  const nowMs = Date.now();
  const cleanId = String(input.nodeId || "anon-node").slice(0, 64);
  const prev = swarmNodes.get(cleanId);
  const delta = Math.max(0, Math.min(10_000, Math.floor(Number(input.pagesProcessedDelta || 0))));

  const entry: SwarmNodeHeartbeat = {
    nodeId: cleanId,
    kind: input.kind,
    shardId: Math.max(0, Math.min(999, Math.floor(Number(input.shardId || 0)))),
    totalShards: Math.max(1, Math.min(1000, Math.floor(Number(input.totalShards || 120)))),
    pagesProcessedTotal: (prev?.pagesProcessedTotal || 0) + delta,
    hllUniqueEstimate: Math.max(prev?.hllUniqueEstimate || 0, Math.floor(Number(input.hllUniqueEstimate || 0))),
    lastDigest: typeof input.lastDigest === "string" ? input.lastDigest.slice(0, 40) : prev?.lastDigest,
    lastSeenAt: new Date(nowMs).toISOString(),
    lastSeenMs: nowMs,
  };

  if (swarmNodes.size >= MAX_TRACKED_NODES && !swarmNodes.has(cleanId)) {
    const oldestKey = swarmNodes.keys().next().value;
    if (oldestKey) swarmNodes.delete(oldestKey);
  }
  swarmNodes.set(cleanId, entry);
  persistNodes();
  return entry;
}

export function getSwarmNodesSummary() {
  hydrateNodes();
  const now = Date.now();
  for (const [k, v] of swarmNodes.entries()) {
    if (now - v.lastSeenMs > STALE_PRUNE_MS) swarmNodes.delete(k);
  }

  const all = Array.from(swarmNodes.values());
  const active = all.filter((n) => now - n.lastSeenMs <= ACTIVE_WINDOW_MS);
  const totalPagesProcessed = all.reduce((s, n) => s + n.pagesProcessedTotal, 0);
  const maxHllUniqueEstimate = all.reduce((m, n) => Math.max(m, n.hllUniqueEstimate), 0);

  return {
    activeNodesCount: active.length,
    totalRegisteredNodes: all.length,
    configuredMatrixShards: 20,
    multiCloudShardCapacity: 120,
    goldenPrioritySourcesCount: 15,
    totalPagesProcessedAcrossSwarm: totalPagesProcessed,
    maxHllUniqueEstimate,
    pools: MULTI_CLOUD_120_POOLS,
    nodes: all.slice(-30),
  };
}
