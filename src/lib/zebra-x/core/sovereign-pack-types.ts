import type { CognitiveClusterId } from "./cognitive-brain-registry";

export type SovereignPackVersion =
  | "v34.0"
  | "v35.0"
  | "v35.1"
  | "v36.0"
  | "v37.0"
  | "v38.0"
  | "v39.0"
  | "v52.0"
  | "v53.0"
  | "v54.0"
  | "v55.0"
  | "v56.0"
  | "v57.0"
  | "v58.0"
  | "v59.0"
  | "v60.0"
  | "v87.1"
  | "v87.2"
  | "v87.3"
  | "v87.4"
  | "v87.5"
  | "v87.6"
  | "v87.7"
  | "v88.0"
  | "v89.0"
  | "v90.1"
  | "v90.2"
  | "v90.3"
  | "v90.4"
  | "v90.5"
  | "v90.6"
  | "v90.7"
  | "v97.0"
  | "v99.0"
  | "v100.0";

export type SovereignMirrorStrategy =
  | "git_bundle_mirror"
  | "huggingface_xet_weights"
  | "archivebox_warc_zimit"
  | "browser_webgpu_wasm"
  | "ipfs_kubo_cid"
  | "api_vcr_polly_replay";

export interface SovereignPackSourceEntry {
  id: string;
  pack: SovereignPackVersion;
  index: number;
  groupId: string;
  groupTitleAr: string;
  clusterId: CognitiveClusterId;
  name: string;
  url: string;
  canonicalUrlVerified: boolean;
  vaultUri: string;
  mirrorStrategy: SovereignMirrorStrategy;
  clientComputeCapable: boolean;
  zeroKeyApiFree: true;
  roleAr: string;
}

/**
 * Shared zero-cost matcher used by all sovereign v34..v39 packs and the public API router.
 */
export function filterSovereignPackEntries(
  entries: readonly SovereignPackSourceEntry[],
  params: {
    query?: string;
    clusterId?: CognitiveClusterId;
    groupId?: string;
    pack?: SovereignPackVersion;
    limit?: number;
  }
): SovereignPackSourceEntry[] {
  let out = entries;
  if (params.pack) {
    out = out.filter((e) => e.pack === params.pack);
  }
  if (params.clusterId) {
    out = out.filter((e) => e.clusterId === params.clusterId);
  }
  if (params.groupId) {
    out = out.filter((e) => e.groupId === params.groupId);
  }
  if (params.query) {
    const tokens = params.query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 2);
    if (tokens.length > 0) {
      out = out.filter((e) => {
        const hay = `${e.name} ${e.roleAr} ${e.groupTitleAr} ${e.groupId}`.toLowerCase();
        return tokens.some((t) => hay.includes(t));
      });
    }
  }
  const lim = typeof params.limit === "number" && params.limit > 0 ? params.limit : out.length;
  return out.slice(0, lim);
}
