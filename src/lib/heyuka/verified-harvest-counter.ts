import { getHfTokenPoolSummary, resolveHfDatasetRepo, selectHfTokenForRole } from "@/lib/heyuka/compute/hf-token-pool";
import { getStudiedCorpusTelemetry } from "@/lib/heyuka/training/knowledge-corpus-engine";
import { getSovereignVaultUnifiedEntries } from "@/lib/heyuka/vault/sovereign-permanent-vault";
import { exportEvolutionChatMlDataset } from "@/lib/heyuka/learning/self-evolution-engine";
import { getSelfPlayTelemetry } from "@/lib/zebra-x/evolution/secret1_self_play_bridge";
import { listForgedTools } from "@/lib/zebra-x/evolution/secret5_tool_forge";
import { getSevenSecretsSystemStatus } from "@/lib/zebra-x/cognition/secret7_dual_brain_orchestrator";
import { PUBLIC_APIS_CATALOG_COUNT } from "@/lib/zebra-x/tools/public-apis-hub";

export interface VerifiedHarvestTelemetry {
  ok: true;
  metadataOnlyZeroMbStorage: true;
  collectedAt: string;
  remoteProbeMs: number;
  verifiedMetrics: {
    vaultedSourcesCount: number;
    totalDigestedUnits: number;
    webCrawledUnits: number;
    doubleReadVerifiedUnits: number;
    extractedTokensEstimate: number;
    extractedBytes: number;
    tablesExtracted: number;
    codeBlocksExtracted: number;
    errorLessonsCount: number;
    publicNoKeyApisCount: number;
    selfPlayElo: number;
    curriculumLevel: number;
    forgedToolsCount: number;
    system1CacheSize: number;
    episodicConceptsCount: number;
  };
  huggingFaceVault: {
    datasetRepo: string;
    connected: boolean;
    poolActiveTokens: number;
    crystalCount: number;
    crystalTotalBytes: number;
    manifestCount: number;
    crystals: Array<{ path: string; size: number }>;
  };
  commonCrawlFrontier: {
    connected: boolean;
    latestCrawlId: string | null;
    availableCrawlsCount: number;
    openWebFrontierScale: string;
  };
  githubActionsCloud: {
    studyLoopRuns: number;
    studyLoopLatestStatus: string;
    watchdogRuns: number;
    watchdogLatestStatus: string;
  };
  connectedSources: Array<{
    id: string;
    label: string;
    status: "connected_live" | "standby_unconfigured";
    detail: string;
  }>;
  selfAwarenessSummary: {
    ar: string;
    en: string;
    fr: string;
  };
}

let cachedTelemetry: VerifiedHarvestTelemetry | null = null;
let cachedAtMs = 0;
const TELEMETRY_CACHE_TTL_MS = 20_000;

async function fetchJsonBounded<T>(
  url: string,
  headers?: Record<string, string>,
  timeoutMs = 3500
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "HEYUKA-OmniscienceRadar/1.0 (+https://kaspi-pos.vercel.app)",
        Accept: "application/json",
        ...(headers || {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Synchronous accessor returning the latest verified snapshot without blocking streaming latency.
 */
export function getCachedVerifiedHarvestSnapshot(): VerifiedHarvestTelemetry | null {
  return cachedTelemetry;
}

/**
 * Queries real metadata across Hugging Face (`zuvyrismail/heyuka-omni-vault`), Common Crawl,
 * GitHub Actions, and local Vault/Corpus/Self-Play registries without downloading raw shards.
 */
export async function collectVerifiedHarvestStats(opts?: {
  forceRefresh?: boolean;
}): Promise<VerifiedHarvestTelemetry> {
  const now = Date.now();
  if (!opts?.forceRefresh && cachedTelemetry && now - cachedAtMs < TELEMETRY_CACHE_TTL_MS) {
    return cachedTelemetry;
  }

  const t0 = performance.now();
  const corpus = getStudiedCorpusTelemetry();
  const vaultEntries = getSovereignVaultUnifiedEntries();
  const evo = exportEvolutionChatMlDataset();
  const selfPlay = getSelfPlayTelemetry();
  const forged = listForgedTools();
  const secretsStatus = getSevenSecretsSystemStatus();
  const hfPool = getHfTokenPoolSummary();
  const repoId = resolveHfDatasetRepo();

  const readKey = selectHfTokenForRole("read_fast");
  const hfHeaders = readKey ? { Authorization: `Bearer ${readKey.token}` } : undefined;

  const [hfMeta, hfCrystals, hfManifests, ccCatalog, studyRuns, watchdogRuns] = await Promise.all([
    fetchJsonBounded<{ id?: string }>(
      `https://huggingface.co/api/datasets/${repoId}`,
      hfHeaders
    ),
    fetchJsonBounded<Array<{ type?: string; path?: string; size?: number }>>(
      `https://huggingface.co/api/datasets/${repoId}/tree/main/crystals`,
      hfHeaders
    ),
    fetchJsonBounded<Array<{ type?: string; path?: string }>>(
      `https://huggingface.co/api/datasets/${repoId}/tree/main/manifests`,
      hfHeaders
    ),
    fetchJsonBounded<Array<{ id?: string; name?: string }>>(
      "https://index.commoncrawl.org/collinfo.json"
    ),
    fetchJsonBounded<{ total_count?: number; workflow_runs?: Array<{ status?: string; conclusion?: string | null }> }>(
      "https://api.github.com/repos/ismaildormi/kaspi-pos/actions/workflows/eternal-public-study-loop.yml/runs?per_page=3"
    ),
    fetchJsonBounded<{ total_count?: number; workflow_runs?: Array<{ status?: string; conclusion?: string | null }> }>(
      "https://api.github.com/repos/ismaildormi/kaspi-pos/actions/workflows/sovereign-24-7-watchdog.yml/runs?per_page=3"
    ),
  ]);

  const crystalList: Array<{ path: string; size: number }> = [];
  let crystalTotalBytes = 0;
  if (Array.isArray(hfCrystals)) {
    for (const item of hfCrystals) {
      if (item?.type === "file" && typeof item.path === "string") {
        const sz = Math.max(0, Number(item.size || 0));
        crystalTotalBytes += sz;
        crystalList.push({ path: item.path, size: sz });
      }
    }
  }

  const manifestCount = Array.isArray(hfManifests)
    ? hfManifests.filter((m) => m?.type === "file" || typeof m?.path === "string").length
    : 0;

  const ccList = Array.isArray(ccCatalog) ? ccCatalog : [];
  const latestCrawlId = ccList[0]?.id || ccList[0]?.name || null;

  const studyLatest = studyRuns?.workflow_runs?.[0];
  const watchdogLatest = watchdogRuns?.workflow_runs?.[0];

  const hfConnected = Boolean(hfMeta?.id);
  const ccConnected = ccList.length > 0;
  const ghStudyRuns = Number(studyRuns?.total_count || 0);
  const ghWatchRuns = Number(watchdogRuns?.total_count || 0);

  const remoteProbeMs = Number((performance.now() - t0).toFixed(1));

  const snapshot: VerifiedHarvestTelemetry = {
    ok: true,
    metadataOnlyZeroMbStorage: true,
    collectedAt: new Date().toISOString(),
    remoteProbeMs,
    verifiedMetrics: {
      vaultedSourcesCount: vaultEntries.length,
      totalDigestedUnits: corpus.totalCorpusUnits,
      webCrawledUnits: corpus.webCrawledUnits,
      doubleReadVerifiedUnits: corpus.doubleReadVerifiedUnits,
      extractedTokensEstimate: corpus.totalTokensEstimate,
      extractedBytes: corpus.totalExtractedBytes,
      tablesExtracted: corpus.tablesExtracted,
      codeBlocksExtracted: corpus.codeBlocksExtracted,
      errorLessonsCount: evo.errorLessonsCount,
      publicNoKeyApisCount: PUBLIC_APIS_CATALOG_COUNT,
      selfPlayElo: selfPlay.elo,
      curriculumLevel: selfPlay.curriculumLevel,
      forgedToolsCount: forged.length,
      system1CacheSize: secretsStatus.system1CacheSize,
      episodicConceptsCount: secretsStatus.episodicConceptsCount,
    },
    huggingFaceVault: {
      datasetRepo: repoId,
      connected: hfConnected,
      poolActiveTokens: hfPool.configuredCount,
      crystalCount: crystalList.length,
      crystalTotalBytes,
      manifestCount,
      crystals: crystalList,
    },
    commonCrawlFrontier: {
      connected: ccConnected,
      latestCrawlId,
      availableCrawlsCount: ccList.length,
      openWebFrontierScale: "110+ Billion Public Open-Web Pages Frontier (Common Crawl Multi-Crawl Catalog)",
    },
    githubActionsCloud: {
      studyLoopRuns: ghStudyRuns,
      studyLoopLatestStatus: String(studyLatest?.conclusion || studyLatest?.status || "awaiting_trigger"),
      watchdogRuns: ghWatchRuns,
      watchdogLatestStatus: String(watchdogLatest?.conclusion || watchdogLatest?.status || "awaiting_trigger"),
    },
    connectedSources: [
      {
        id: "huggingface_vault",
        label: `Hugging Face Dataset (${repoId})`,
        status: hfConnected ? "connected_live" : "standby_unconfigured",
        detail: `${crystalList.length} crystal(s), ${crystalTotalBytes.toLocaleString()}B remote, ${hfPool.configuredCount} HF key(s)`,
      },
      {
        id: "common_crawl_cdx",
        label: "Common Crawl CDX Index",
        status: ccConnected ? "connected_live" : "standby_unconfigured",
        detail: `${ccList.length} crawl indices (latest: ${latestCrawlId || "N/A"})`,
      },
      {
        id: "sovereign_vault_corpus",
        label: "Sovereign Vault + Double-Read Corpus",
        status: "connected_live",
        detail: `${vaultEntries.length} engines, ${corpus.totalCorpusUnits} units, ${corpus.webCrawledUnits} web docs`,
      },
      {
        id: "github_actions_cloud",
        label: "GitHub Actions Study & Watchdog",
        status: ghStudyRuns + ghWatchRuns > 0 ? "connected_live" : "standby_unconfigured",
        detail: `Study runs: ${ghStudyRuns}, Watchdog runs: ${ghWatchRuns}`,
      },
    ],
    selfAwarenessSummary: {
      ar: `المخزون الموثق فعلياً: ${vaultEntries.length} محركاً ومصدراً سيادياً، ${corpus.totalCorpusUnits} وحدة معرفية مدروسة (${corpus.doubleReadVerifiedUnits} محققة بالقراءة المزدوجة)، ${crystalList.length} بلورة Nano-Crystal على Hugging Face (${crystalTotalBytes.toLocaleString()} بايت في ${repoId})، مرتبطة بفهرس Common Crawl (${latestCrawlId || "110B+ Frontier"})، وتقييم لعب ذاتي Elo ${selfPlay.elo} مع ${forged.length} مهارة مصنّعة.`,
      en: `Verified live telemetry: ${vaultEntries.length} sovereign engines, ${corpus.totalCorpusUnits} digested corpus units (${corpus.doubleReadVerifiedUnits} double-read verified), ${crystalList.length} Hugging Face Nano-Crystal(s) (${crystalTotalBytes.toLocaleString()}B in ${repoId}), Common Crawl index ${latestCrawlId || "N/A"} across 110B+ frontier, Self-Play Elo ${selfPlay.elo}, ${forged.length} forged skills.`,
      fr: `Télémétrie vérifiée en direct : ${vaultEntries.length} moteurs souverains, ${corpus.totalCorpusUnits} unités étudiées (${corpus.doubleReadVerifiedUnits} vérifiées en double lecture), ${crystalList.length} cristal(aux) Hugging Face (${crystalTotalBytes.toLocaleString()} o sur ${repoId}), index Common Crawl ${latestCrawlId || "N/A"}, Elo ${selfPlay.elo}, ${forged.length} compétences forgées.`,
    },
  };

  cachedTelemetry = snapshot;
  cachedAtMs = now;
  return snapshot;
}
