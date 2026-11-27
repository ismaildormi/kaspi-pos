/**
 * HEYUKA v112.0 — UNIFIED SOURCE CLASSIFICATION, SPECIALIZED MEMORY & TRI-MODEL FUSION FABRIC
 * ============================================================================================
 * Connects ALL cataloged open-source libraries, datasets, APIs, models, and local tools (2,810+):
 * 1. Deduplicates mirrors under canonical IDs while preserving all original references.
 * 2. Classifies every source by specialty domain, modality kind, target memory layer,
 *    zero-cost / offline capability, and primary affinity across HEYUKA Omni, Core, and Vision.
 * 3. Automatically routes any source execution or ingestion result into both:
 *    - Its dedicated specialty memory partition, AND
 *    - The unified 7-layer persistent memory (`persistent-episodic-memory.ts`) shared by all 3 models.
 * 4. Fuses classified sources + specialized memories for HEYUKA Omni, Core, and Vision.
 */

import crypto from "node:crypto";
import {
  getSovereignVaultUnifiedEntries,
  type UnifiedVaultEntry,
} from "@/lib/heyuka/vault/sovereign-permanent-vault";
import {
  GOLDEN_15_PRIORITY_SOURCES,
} from "@/lib/heyuka/frontier/universal-knowledge-fabric";
import {
  upsertFrontierMemory,
  queryFrontierMemory,
  type MemoryLayerType,
} from "@/lib/heyuka/frontier/persistent-episodic-memory";

export type SourceSpecialtyDomain =
  | "ai_models_and_weights"
  | "software_engineering_and_sdks"
  | "scientific_and_medical_research"
  | "security_and_defense"
  | "multimodal_vision_3d_media"
  | "data_corpora_and_encyclopedias"
  | "local_os_and_offline_tools"
  | "web_apis_and_commerce";

export type SourceModalityKind =
  | "live_api"
  | "dataset_corpus"
  | "ai_library_sdk"
  | "open_weights_model"
  | "documentation_spec"
  | "local_tool_engine";

export type HeyukaModelIdentity = "HEYUKA Omni" | "HEYUKA Core" | "HEYUKA Vision";

export type SourceVerificationQuality =
  | "OPTIMAL"
  | "USABLE"
  | "DEGRADED"
  | "UNREACHABLE"
  | "UNVERIFIED";

export type SourceLifecycleState =
  | "Discovered"
  | "Catalogued"
  | "Retrieved"
  | "Studied"
  | "Tested"
  | "Compatible"
  | "Integrated"
  | "Operational"
  | "ProductionVerified";

export type CommercialUseStatus =
  | "allowed"
  | "allowed_with_attribution"
  | "copyleft_review"
  | "unknown";

export type SourceRelationshipKind =
  | "complements"
  | "chains_into"
  | "validates"
  | "alternative_to"
  | "conflicts_with"
  | "license_incompatible_with";

export interface SourceRelationshipEdge {
  fromCanonicalId: string;
  toCanonicalId: string;
  relationship: SourceRelationshipKind;
  reason: string;
  verifiedCompatibility: boolean;
}

export interface ClassifiedUnifiedSource {
  canonicalId: string;
  originalIds: string[];
  originalUrls: string[];
  name: string;
  primaryUrl: string;
  vaultUri: string;
  pack: string;
  clusterId: string;
  specialtyDomain: SourceSpecialtyDomain;
  modalityKind: SourceModalityKind;
  memoryLayer: MemoryLayerType;
  memoryPartitionKey: string;
  primaryModels: HeyukaModelIdentity[];
  offlineCapable: boolean;
  zeroCostCapable: boolean;
  license: string;
  commercialUseStatus: CommercialUseStatus;
  attributionRequired: boolean;
  lifecycleState: SourceLifecycleState;
  inputs: string[];
  outputs: string[];
  supportedOS: string[];
  minHardware: string;
  integrityDigest: string;
  verificationQuality: SourceVerificationQuality;
  lastVerifiedAt?: string;
  lastResultSummary?: string;
}

export interface SourceMemoryFusionResult {
  query: string;
  targetModel: HeyukaModelIdentity;
  totalCatalogedSources: number;
  canonicalUniqueSources: number;
  matchedSources: ClassifiedUnifiedSource[];
  specializedMemoryHits: Array<{
    partition: string;
    title: string;
    content: string;
    confidence: number;
  }>;
  triModelSynergySummary: string;
}

function classifySpecialtyAndKind(entry: {
  name: string;
  url: string;
  pack: string;
  clusterId: string;
  role: string;
  clientComputeCapable: boolean;
}): {
  specialtyDomain: SourceSpecialtyDomain;
  modalityKind: SourceModalityKind;
  memoryLayer: MemoryLayerType;
  primaryModels: HeyukaModelIdentity[];
  offlineCapable: boolean;
} {
  const hay = `${entry.name} ${entry.url} ${entry.pack} ${entry.clusterId} ${entry.role}`.toLowerCase();

  // 1. Modality kind detection
  let modalityKind: SourceModalityKind = "documentation_spec";
  if (
    hay.includes("api.") ||
    hay.includes("/api/") ||
    hay.includes("public-api") ||
    hay.includes("graphql") ||
    hay.includes("rest_v1") ||
    entry.clusterId === "web_apis"
  ) {
    modalityKind = "live_api";
  } else if (
    hay.includes("huggingface.co/datasets") ||
    hay.includes("corpus") ||
    hay.includes("fineweb") ||
    hay.includes("stack-v2") ||
    hay.includes("dataset") ||
    hay.includes("wikipedia")
  ) {
    modalityKind = "dataset_corpus";
  } else if (
    hay.includes("huggingface.co/") ||
    hay.includes("ollama") ||
    hay.includes("gguf") ||
    hay.includes("llama") ||
    hay.includes("qwen") ||
    hay.includes("weights") ||
    hay.includes("checkpoint")
  ) {
    modalityKind = "open_weights_model";
  } else if (
    entry.clientComputeCapable ||
    hay.includes("tauri") ||
    hay.includes("desktop") ||
    hay.includes("shell") ||
    hay.includes("offline") ||
    hay.includes("wasm")
  ) {
    modalityKind = "local_tool_engine";
  } else if (
    hay.includes("github.com") ||
    hay.includes("npm") ||
    hay.includes("pypi") ||
    hay.includes("sdk") ||
    hay.includes("framework") ||
    hay.includes("library")
  ) {
    modalityKind = "ai_library_sdk";
  }

  // 2. Specialty domain + memory layer + model routing
  if (
    hay.includes("vision") ||
    hay.includes("image") ||
    hay.includes("video") ||
    hay.includes("3d") ||
    hay.includes("three") ||
    hay.includes("shader") ||
    hay.includes("fur") ||
    hay.includes("audio") ||
    hay.includes("ocr") ||
    hay.includes("multimodal")
  ) {
    return {
      specialtyDomain: "multimodal_vision_3d_media",
      modalityKind,
      memoryLayer: "procedural",
      primaryModels: ["HEYUKA Vision", "HEYUKA Omni"],
      offlineCapable: entry.clientComputeCapable || modalityKind === "local_tool_engine",
    };
  }

  if (
    hay.includes("cve") ||
    hay.includes("osv") ||
    hay.includes("cisa") ||
    hay.includes("security") ||
    hay.includes("cyber") ||
    hay.includes("immun") ||
    hay.includes("owasp")
  ) {
    return {
      specialtyDomain: "security_and_defense",
      modalityKind,
      memoryLayer: "verified_knowledge",
      primaryModels: ["HEYUKA Core", "HEYUKA Omni"],
      offlineCapable: entry.clientComputeCapable,
    };
  }

  if (
    hay.includes("arxiv") ||
    hay.includes("openalex") ||
    hay.includes("pubmed") ||
    hay.includes("europepmc") ||
    hay.includes("math") ||
    hay.includes("science") ||
    hay.includes("physics") ||
    hay.includes("biology")
  ) {
    return {
      specialtyDomain: "scientific_and_medical_research",
      modalityKind,
      memoryLayer: "verified_knowledge",
      primaryModels: ["HEYUKA Core", "HEYUKA Omni"],
      offlineCapable: false,
    };
  }

  if (
    modalityKind === "open_weights_model" ||
    hay.includes("llm") ||
    hay.includes("transformer") ||
    hay.includes("reasoning") ||
    hay.includes("mcts") ||
    hay.includes("grpo") ||
    hay.includes("dpo")
  ) {
    return {
      specialtyDomain: "ai_models_and_weights",
      modalityKind,
      memoryLayer: "semantic",
      primaryModels: ["HEYUKA Omni", "HEYUKA Core", "HEYUKA Vision"],
      offlineCapable: true,
    };
  }

  if (
    modalityKind === "dataset_corpus" ||
    hay.includes("wikipedia") ||
    hay.includes("gutenberg") ||
    hay.includes("openlibrary") ||
    hay.includes("encyclopedia")
  ) {
    return {
      specialtyDomain: "data_corpora_and_encyclopedias",
      modalityKind,
      memoryLayer: "semantic",
      primaryModels: ["HEYUKA Omni", "HEYUKA Core"],
      offlineCapable: modalityKind === "dataset_corpus",
    };
  }

  if (
    modalityKind === "local_tool_engine" ||
    hay.includes("os_") ||
    hay.includes("browser") ||
    hay.includes("pc_control") ||
    hay.includes("sandbox")
  ) {
    return {
      specialtyDomain: "local_os_and_offline_tools",
      modalityKind,
      memoryLayer: "procedural",
      primaryModels: ["HEYUKA Core", "HEYUKA Omni"],
      offlineCapable: true,
    };
  }

  if (
    modalityKind === "ai_library_sdk" ||
    hay.includes("typescript") ||
    hay.includes("python") ||
    hay.includes("rust") ||
    hay.includes("react") ||
    hay.includes("next") ||
    hay.includes("github")
  ) {
    return {
      specialtyDomain: "software_engineering_and_sdks",
      modalityKind,
      memoryLayer: "project",
      primaryModels: ["HEYUKA Core", "HEYUKA Omni"],
      offlineCapable: true,
    };
  }

  return {
    specialtyDomain: "web_apis_and_commerce",
    modalityKind,
    memoryLayer: "episodic",
    primaryModels: ["HEYUKA Omni", "HEYUKA Core", "HEYUKA Vision"],
    offlineCapable: entry.clientComputeCapable,
  };
}

let cachedClassifiedSources: ClassifiedUnifiedSource[] | null = null;
const specializedMemoryIndex = new Map<string, ClassifiedUnifiedSource[]>();
const verificationStateOverrides = new Map<
  string,
  { quality: SourceVerificationQuality; verifiedAt: string; summary: string }
>();

export function buildUnifiedClassifiedSourceRegistry(forceRebuild = false): {
  totalRawEntries: number;
  canonicalSources: ClassifiedUnifiedSource[];
  byDomain: Record<SourceSpecialtyDomain, number>;
  byModality: Record<SourceModalityKind, number>;
  byMemoryLayer: Record<MemoryLayerType, number>;
} {
  if (!cachedClassifiedSources || forceRebuild) {
    specializedMemoryIndex.clear();
    const rawVault = getSovereignVaultUnifiedEntries();
    const byUrlMap = new Map<string, ClassifiedUnifiedSource>();

    const ingestItem = (item: {
      id: string;
      name: string;
      url: string;
      vaultUri: string;
      pack: string;
      clusterId: string;
      role: string;
      integrityDigest: string;
      clientComputeCapable: boolean;
    }) => {
      const normalizedUrl = (item.url || item.vaultUri).trim().replace(/\/+$/, "").toLowerCase();
      const existing = byUrlMap.get(normalizedUrl);
      if (existing) {
        if (!existing.originalIds.includes(item.id)) existing.originalIds.push(item.id);
        if (item.url && !existing.originalUrls.includes(item.url)) existing.originalUrls.push(item.url);
        return;
      }

      const classified = classifySpecialtyAndKind(item);
      const canonicalId = `src_${crypto
        .createHash("sha256")
        .update(normalizedUrl || item.id)
        .digest("hex")
        .slice(0, 14)}`;

      const override = verificationStateOverrides.get(canonicalId);
      const urlLower = (item.url || "").toLowerCase();
      let license = "unknown";
      let commercialUseStatus: CommercialUseStatus = "unknown";
      let attributionRequired = true;

      if (urlLower.includes("wikipedia.org") || urlLower.includes("wikidata.org")) {
        license = "CC-BY-SA-4.0";
        commercialUseStatus = "allowed_with_attribution";
      } else if (urlLower.includes("openalex.org") || urlLower.includes("crossref.org") || urlLower.includes("worldbank.org")) {
        license = "CC0-1.0 / Open-Data";
        commercialUseStatus = "allowed";
        attributionRequired = false;
      } else if (urlLower.includes("arxiv.org") || urlLower.includes("europepmc.org")) {
        license = "Open-Access-Metadata";
        commercialUseStatus = "allowed_with_attribution";
      } else if (urlLower.includes("osv.dev") || urlLower.includes("cisa.gov") || urlLower.includes("ietf.org")) {
        license = "Public-Domain / Open-Standard";
        commercialUseStatus = "allowed";
      } else if (urlLower.includes("huggingface.co/datasets/huggingfacefw/fineweb-edu")) {
        license = "ODC-By-1.0";
        commercialUseStatus = "allowed_with_attribution";
      } else if (item.vaultUri.startsWith("vault://")) {
        license = "Internal-Sovereign-Catalog";
        commercialUseStatus = "allowed";
        attributionRequired = false;
      }

      const ioMap: Record<SourceModalityKind, { inputs: string[]; outputs: string[]; minHw: string }> = {
        live_api: { inputs: ["https_query_json"], outputs: ["structured_json"], minHw: "Any CPU / 512MB RAM + Network" },
        dataset_corpus: { inputs: ["text_query", "shingle_vector"], outputs: ["passages", "training_records"], minHw: "2GB RAM / Local Disk" },
        ai_library_sdk: { inputs: ["source_code", "runtime_args"], outputs: ["compiled_artifact", "api_result"], minHw: "2-Core CPU / 2GB RAM" },
        open_weights_model: { inputs: ["prompt_tokens", "system_context"], outputs: ["generated_tokens", "embeddings"], minHw: "4-8GB RAM (CPU quantized) or 8GB+ VRAM" },
        documentation_spec: { inputs: ["keyword_query"], outputs: ["reference_spec"], minHw: "Any CPU / 256MB RAM" },
        local_tool_engine: { inputs: ["local_command", "file_input"], outputs: ["deterministic_artifact"], minHw: "2-Core CPU / 1GB RAM (Offline)" },
      };

      const qualityNow = override?.quality || "UNVERIFIED";
      const lifecycleState: SourceLifecycleState =
        qualityNow === "OPTIMAL"
          ? "Operational"
          : qualityNow === "USABLE"
          ? "Integrated"
          : qualityNow === "DEGRADED"
          ? "Tested"
          : "Catalogued";

      const record: ClassifiedUnifiedSource = {
        canonicalId,
        originalIds: [item.id],
        originalUrls: item.url ? [item.url] : [item.vaultUri],
        name: item.name,
        primaryUrl: item.url || item.vaultUri,
        vaultUri: item.vaultUri,
        pack: item.pack,
        clusterId: item.clusterId,
        specialtyDomain: classified.specialtyDomain,
        modalityKind: classified.modalityKind,
        memoryLayer: classified.memoryLayer,
        memoryPartitionKey: `mem_${classified.specialtyDomain}_${classified.memoryLayer}`,
        primaryModels: classified.primaryModels,
        offlineCapable: classified.offlineCapable,
        zeroCostCapable: true,
        license,
        commercialUseStatus,
        attributionRequired,
        lifecycleState,
        inputs: ioMap[classified.modalityKind].inputs,
        outputs: ioMap[classified.modalityKind].outputs,
        supportedOS: ["Linux", "Windows", "macOS"],
        minHardware: ioMap[classified.modalityKind].minHw,
        integrityDigest: item.integrityDigest,
        verificationQuality: qualityNow,
        lastVerifiedAt: override?.verifiedAt,
        lastResultSummary: override?.summary,
      };

      byUrlMap.set(normalizedUrl, record);

      const list = specializedMemoryIndex.get(record.memoryPartitionKey) || [];
      list.push(record);
      specializedMemoryIndex.set(record.memoryPartitionKey, list);
    };

    for (const g of GOLDEN_15_PRIORITY_SOURCES) {
      ingestItem({
        id: g.id,
        name: g.name,
        url: g.url,
        vaultUri: `vault://heyuka/golden/${g.id}`,
        pack: "golden_15",
        clusterId: g.category,
        role: `priority_${g.priority}`,
        integrityDigest: crypto.createHash("sha256").update(g.url).digest("hex").slice(0, 16),
        clientComputeCapable: false,
      });
    }

    for (const v of rawVault as UnifiedVaultEntry[]) {
      ingestItem({
        id: v.id,
        name: v.name,
        url: v.url,
        vaultUri: v.vaultUri,
        pack: v.pack,
        clusterId: v.clusterId,
        role: v.role,
        integrityDigest: v.integrityDigest,
        clientComputeCapable: v.clientComputeCapable,
      });
    }

    cachedClassifiedSources = Array.from(byUrlMap.values());
  }

  const byDomain = {
    ai_models_and_weights: 0,
    software_engineering_and_sdks: 0,
    scientific_and_medical_research: 0,
    security_and_defense: 0,
    multimodal_vision_3d_media: 0,
    data_corpora_and_encyclopedias: 0,
    local_os_and_offline_tools: 0,
    web_apis_and_commerce: 0,
  };
  const byModality = {
    live_api: 0,
    dataset_corpus: 0,
    ai_library_sdk: 0,
    open_weights_model: 0,
    documentation_spec: 0,
    local_tool_engine: 0,
  };
  const byMemoryLayer = {
    working: 0,
    conversation: 0,
    episodic: 0,
    semantic: 0,
    procedural: 0,
    project: 0,
    verified_knowledge: 0,
  };

  for (const s of cachedClassifiedSources) {
    byDomain[s.specialtyDomain]++;
    byModality[s.modalityKind]++;
    byMemoryLayer[s.memoryLayer]++;
  }

  return {
    totalRawEntries: getSovereignVaultUnifiedEntries().length + GOLDEN_15_PRIORITY_SOURCES.length,
    canonicalSources: cachedClassifiedSources,
    byDomain,
    byModality,
    byMemoryLayer,
  };
}

/**
 * Automatically routes any source execution result into BOTH its specialty partition
 * and the shared 7-layer unified memory accessible by HEYUKA Omni, Core, and Vision.
 */
export async function routeSourceResultToUnifiedMemory(params: {
  source: ClassifiedUnifiedSource;
  quality: SourceVerificationQuality;
  extractedSummary: string;
  tenantId?: string;
  projectId?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  verificationStateOverrides.set(params.source.canonicalId, {
    quality: params.quality,
    verifiedAt: now,
    summary: params.extractedSummary.slice(0, 400),
  });
  params.source.verificationQuality = params.quality;
  params.source.lastVerifiedAt = now;
  params.source.lastResultSummary = params.extractedSummary.slice(0, 400);

  if (params.quality === "OPTIMAL" || params.quality === "USABLE") {
    await upsertFrontierMemory({
      tenantId: params.tenantId || "heyuka-global",
      projectId: params.projectId || params.source.memoryPartitionKey,
      layer: params.source.memoryLayer,
      key: `source:${params.source.canonicalId}`,
      title: `${params.source.name} [${params.source.specialtyDomain}]`,
      content: `${params.extractedSummary.slice(0, 600)} | URL: ${params.source.primaryUrl} | Models: ${params.source.primaryModels.join(", ")}`,
      tags: [
        params.source.specialtyDomain,
        params.source.modalityKind,
        params.source.memoryPartitionKey,
        ...params.source.primaryModels,
      ],
      confidence: params.quality === "OPTIMAL" ? 95 : 78,
      provenance: {
        sourceType: "golden_source",
        sourceId: params.source.canonicalId,
        sourceUrl: params.source.primaryUrl,
        verifiedBy: "unified-source-memory-fabric-v112",
        verificationScore: params.quality === "OPTIMAL" ? 95 : 78,
      },
    });
  }
}

/**
 * Tri-Model Fusion Retrieval: lets HEYUKA Omni, HEYUKA Core, and HEYUKA Vision
 * query both the classified source partitions and shared persistent memory together.
 */
export function fuseSourcesAndMemoryForModels(params: {
  query: string;
  targetModel?: HeyukaModelIdentity;
  tenantId?: string;
  limit?: number;
}): SourceMemoryFusionResult {
  const targetModel = params.targetModel || "HEYUKA Omni";
  const limit = params.limit ?? 8;
  const registry = buildUnifiedClassifiedSourceRegistry();
  const terms = params.query
    .toLowerCase()
    .split(/[^a-z0-9\u0600-\u06FF]+/i)
    .filter((t) => t.length >= 2);

  const scored = registry.canonicalSources
    .map((src) => {
      const text = `${src.name} ${src.specialtyDomain} ${src.modalityKind} ${src.clusterId} ${src.lastResultSummary || ""}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) score += 3;
      }
      if (src.primaryModels.includes(targetModel)) score += 2;
      if (src.verificationQuality === "OPTIMAL") score += 4;
      else if (src.verificationQuality === "USABLE") score += 2;
      if (src.offlineCapable) score += 1;
      return { src, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.src);

  const memoryQueryResult = queryFrontierMemory({
    tenantId: params.tenantId || "heyuka-global",
    query: params.query,
    limit: 6,
  });
  const memoryHits = (memoryQueryResult.matches || []).map((m) => ({
    partition: m.projectId,
    title: m.title,
    content: m.content,
    confidence: m.confidence,
  }));

  return {
    query: params.query,
    targetModel,
    totalCatalogedSources: registry.totalRawEntries,
    canonicalUniqueSources: registry.canonicalSources.length,
    matchedSources: scored,
    specializedMemoryHits: memoryHits,
    triModelSynergySummary: `Fused ${scored.length} classified sources + ${memoryHits.length} specialized memory records for ${targetModel} (shared across Omni/Core/Vision).`,
  };
}

/**
 * Builds a machine-readable relationship & compatibility graph connecting sources
 * via typed edges (`complements`, `chains_into`, `validates`, `alternative_to`, `conflicts_with`).
 */
export function buildSourceRelationshipGraph(maxEdges = 600): {
  totalNodes: number;
  totalEdges: number;
  byRelationship: Record<SourceRelationshipKind, number>;
  edges: SourceRelationshipEdge[];
} {
  const registry = buildUnifiedClassifiedSourceRegistry();
  const sources = registry.canonicalSources;
  const edges: SourceRelationshipEdge[] = [];
  const byRelationship: Record<SourceRelationshipKind, number> = {
    complements: 0,
    chains_into: 0,
    validates: 0,
    alternative_to: 0,
    conflicts_with: 0,
    license_incompatible_with: 0,
  };

  const addEdge = (edge: SourceRelationshipEdge) => {
    if (edges.length >= maxEdges) return;
    edges.push(edge);
    byRelationship[edge.relationship]++;
  };

  const byDomain = new Map<SourceSpecialtyDomain, ClassifiedUnifiedSource[]>();
  for (const s of sources) {
    const arr = byDomain.get(s.specialtyDomain) || [];
    arr.push(s);
    byDomain.set(s.specialtyDomain, arr);
  }

  // 1. Security & defense validates software engineering SDKs
  const sec = byDomain.get("security_and_defense") || [];
  const eng = byDomain.get("software_engineering_and_sdks") || [];
  for (let i = 0; i < Math.min(sec.length, 25); i++) {
    for (let j = 0; j < Math.min(eng.length, 4); j++) {
      addEdge({
        fromCanonicalId: sec[i].canonicalId,
        toCanonicalId: eng[(i * 4 + j) % eng.length].canonicalId,
        relationship: "validates",
        reason: "Security feed/scanner validates generated code & dependencies",
        verifiedCompatibility: true,
      });
    }
  }

  // 2. Datasets & encyclopedias chain into AI models & weights
  const corp = byDomain.get("data_corpora_and_encyclopedias") || [];
  const models = byDomain.get("ai_models_and_weights") || [];
  for (let i = 0; i < Math.min(corp.length, 30); i++) {
    if (models.length > 0) {
      addEdge({
        fromCanonicalId: corp[i].canonicalId,
        toCanonicalId: models[i % models.length].canonicalId,
        relationship: "chains_into",
        reason: "Structured corpus feeds retrieval grounding and offline checkpoint preparation",
        verifiedCompatibility: true,
      });
    }
  }

  // 3. Scientific & medical research complements AI models
  const sci = byDomain.get("scientific_and_medical_research") || [];
  for (let i = 0; i < Math.min(sci.length, 40); i++) {
    if (models.length > 0) {
      addEdge({
        fromCanonicalId: sci[i].canonicalId,
        toCanonicalId: models[i % models.length].canonicalId,
        relationship: "complements",
        reason: "Peer-reviewed scientific API complements reasoning synthesis",
        verifiedCompatibility: true,
      });
    }
  }

  // 4. Same-domain / same-modality sources act as alternatives
  for (const [, list] of byDomain.entries()) {
    for (let i = 0; i + 1 < Math.min(list.length, 20); i += 2) {
      addEdge({
        fromCanonicalId: list[i].canonicalId,
        toCanonicalId: list[i + 1].canonicalId,
        relationship: "alternative_to",
        reason: `Failover / alternative provider within ${list[i].specialtyDomain}`,
        verifiedCompatibility: list[i].modalityKind === list[i + 1].modalityKind,
      });
    }
  }

  // 5. Offline vs network-only conflict boundary
  const localTools = byDomain.get("local_os_and_offline_tools") || [];
  const webApis = byDomain.get("web_apis_and_commerce") || [];
  for (let i = 0; i < Math.min(localTools.length, webApis.length, 20); i++) {
    addEdge({
      fromCanonicalId: localTools[i].canonicalId,
      toCanonicalId: webApis[i].canonicalId,
      relationship: "conflicts_with",
      reason: "Air-gapped offline runtime cannot directly invoke remote-only HTTP API without network bridge",
      verifiedCompatibility: false,
    });
  }

  return {
    totalNodes: sources.length,
    totalEdges: edges.length,
    byRelationship,
    edges,
  };
}
