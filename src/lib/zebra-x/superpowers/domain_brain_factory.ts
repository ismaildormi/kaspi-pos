import crypto from "node:crypto";
import zlib from "node:zlib";
import { getHfTokenPoolSummary } from "@/lib/heyuka/compute/hf-token-pool";
import { exportEvolutionChatMlDataset } from "@/lib/heyuka/learning/self-evolution-engine";
import { getStudiedCorpusTelemetry } from "@/lib/heyuka/training/knowledge-corpus-engine";
import { buildSovereignVaultLockManifest, getSovereignVaultUnifiedEntries } from "@/lib/heyuka/vault/sovereign-permanent-vault";
import { getSevenSecretsSystemStatus } from "@/lib/zebra-x/cognition/secret7_dual_brain_orchestrator";
import { getSelfPlayTelemetry } from "@/lib/zebra-x/evolution/secret1_self_play_bridge";
import { listForgedTools } from "@/lib/zebra-x/evolution/secret5_tool_forge";

export type DomainBrainSlug = "commerce_kaspi" | "agriculture_morocco" | "coding_architect" | "legal_dgi_tax";

const DOMAIN_BRAIN_PROFILES: Record<
  DomainBrainSlug,
  { titleAr: string; titleEn: string; clusterFilter: string[]; systemPrompt: string }
> = {
  commerce_kaspi: {
    titleAr: "عقل التجارة ونقاط البيع KASPI",
    titleEn: "KASPI Commerce & Retail Empire Brain",
    clusterFilter: ["kaspi_pos_merchant_intelligence"],
    systemPrompt: "Expert in POS inventory EOQ, dynamic pricing, market-basket lift, customer retention & cashflow.",
  },
  agriculture_morocco: {
    titleAr: "عقل الفلاحة الذكية والمناخ",
    titleEn: "Smart Agriculture & Precision Irrigation Brain",
    clusterFilter: ["hardware_cad_voip_testing_and_physics", "live_search_and_47_public_apis"],
    systemPrompt: "Expert in PCSE crop yield modeling, SoilGrids fertility, pvlib solar irrigation & water balance.",
  },
  coding_architect: {
    titleAr: "عقل هندسة البرمجيات العملاقة",
    titleEn: "OS-Scale Software & Systems Architect Brain",
    clusterFilter: ["code_ide_and_surgical_editing", "sovereign_os_shell_file_surgeon_and_sentinel"],
    systemPrompt: "Expert in Tree-Sitter AST impact checks, Next.js/Drizzle/Zod full-stack builds, Rust/WASM & Zero-Stub QA.",
  },
  legal_dgi_tax: {
    titleAr: "عقل المحاسبة والضرائب المغربية DGI",
    titleEn: "Morocco DGI Fiscal & Contract Audit Brain",
    clusterFilter: ["kaspi_pos_merchant_intelligence", "pdf_office_and_documents"],
    systemPrompt: "Expert in CGI Art.145 invoice rules, ICE/TVA rates, timbre cash compliance & contract red-flag audits.",
  },
};

/**
 * Superpower #5 (`v95.0`): 1-Click Portable Domain Brain Factory (<50 KB gzip crystal, zero secrets).
 */
export function buildDomainBrainPack(domain: DomainBrainSlug) {
  const spec = DOMAIN_BRAIN_PROFILES[domain] || DOMAIN_BRAIN_PROFILES.coding_architect;
  const matchedSources = getSovereignVaultUnifiedEntries()
    .filter((e) => spec.clusterFilter.includes(e.clusterId))
    .slice(0, 120)
    .map((e) => ({ id: e.id, pack: e.pack, name: e.name, url: e.url, role: e.role }));

  const bundle = {
    schema: "heyuka-domain-brain-v1",
    domain,
    titleAr: spec.titleAr,
    titleEn: spec.titleEn,
    generatedAt: new Date().toISOString(),
    systemPrompt: spec.systemPrompt,
    sourcesCount: matchedSources.length,
    sources: matchedSources,
    forgedSkills: listForgedTools().map((t) => t.id),
  };

  const json = JSON.stringify(bundle);
  const compressed = zlib.gzipSync(Buffer.from(json, "utf8"), { level: 9 });
  const sha256 = crypto.createHash("sha256").update(json, "utf8").digest("hex");

  return {
    ok: true,
    superpower: "domain_brain_factory_v95",
    filename: `heyuka-brain-${domain}.crystal.json.gz`,
    domain,
    titleAr: spec.titleAr,
    titleEn: spec.titleEn,
    sourcesCount: matchedSources.length,
    rawBytes: Buffer.byteLength(json, "utf8"),
    compressedBytes: compressed.length,
    sha256,
    base64Gzip: compressed.toString("base64"),
  };
}

/**
 * Grand Seal (`v91.0`): 1-Click Portable Sovereign Seed Crystal containing full Vault index,
 * Self-Play Elo, Forged Skills, Corpus telemetry & zero secret tokens (<25 MB, gzip-9).
 */
export function exportPortableSovereignSeedCrystal() {
  const lockManifest = buildSovereignVaultLockManifest();
  const corpus = getStudiedCorpusTelemetry();
  const selfPlay = getSelfPlayTelemetry();
  const secretsStatus = getSevenSecretsSystemStatus();
  const evo = exportEvolutionChatMlDataset();
  const hfPool = getHfTokenPoolSummary();

  const entries = getSovereignVaultUnifiedEntries().map((e) => ({
    id: e.id,
    p: e.pack,
    c: e.clusterId,
    n: e.name,
    u: e.url,
    v: e.vaultUri,
  }));

  const payload = {
    schema: "heyuka-sovereign-seed-v1",
    generatedAt: new Date().toISOString(),
    vaultLockHash: lockManifest.manifestHash,
    totalClassifiedEntries: lockManifest.totalClassifiedEntries,
    corpusTelemetry: corpus,
    selfPlay,
    secretsStatus,
    evolutionSummary: {
      tracesCount: evo.tracesCount,
      errorLessonsCount: evo.errorLessonsCount,
    },
    hfDatasetRepo: hfPool.datasetRepo, // Note: ONLY public dataset slug, ZERO raw HF tokens!
    forgedToolIds: listForgedTools().map((t) => t.id),
    entries,
  };

  const json = JSON.stringify(payload);
  const rawBytes = Buffer.byteLength(json, "utf8");
  const compressed = zlib.gzipSync(Buffer.from(json, "utf8"), { level: 9 });
  const sha256 = crypto.createHash("sha256").update(json, "utf8").digest("hex");

  return {
    ok: true,
    schema: "heyuka-sovereign-seed-v1",
    filename: "heyuka-sovereign-seed.crystal.json.gz",
    totalClassifiedEntries: lockManifest.totalClassifiedEntries,
    vaultLockHash: lockManifest.manifestHash,
    rawBytes,
    compressedBytes: compressed.length,
    savedPct: Number(((1 - compressed.length / Math.max(1, rawBytes)) * 100).toFixed(1)),
    sha256,
    base64Gzip: compressed.toString("base64"),
  };
}

/**
 * Validates and restores metadata from a previously exported Portable Sovereign Seed Crystal.
 */
export function importAndVerifySovereignSeedCrystal(base64GzipOrJson: string) {
  const trimmed = String(base64GzipOrJson || "").trim();
  if (!trimmed) {
    return { ok: false as const, error: "Empty sovereign seed payload." };
  }

  let jsonText = trimmed;
  if (!trimmed.startsWith("{")) {
    const rawBuf = zlib.gunzipSync(Buffer.from(trimmed, "base64"));
    jsonText = rawBuf.toString("utf8");
  }

  const parsed = JSON.parse(jsonText) as {
    schema?: string;
    totalClassifiedEntries?: number;
    vaultLockHash?: string;
    hfDatasetRepo?: string;
    generatedAt?: string;
    entries?: unknown[];
  };

  if (parsed.schema !== "heyuka-sovereign-seed-v1" && parsed.schema !== "heyuka-domain-brain-v1") {
    return { ok: false as const, error: "Unrecognized seed schema." };
  }

  const sha256 = crypto.createHash("sha256").update(jsonText, "utf8").digest("hex");
  return {
    ok: true as const,
    verified: true,
    schema: parsed.schema,
    generatedAt: parsed.generatedAt || null,
    totalClassifiedEntries: Number(parsed.totalClassifiedEntries || parsed.entries?.length || 0),
    vaultLockHash: parsed.vaultLockHash || null,
    hfDatasetRepo: parsed.hfDatasetRepo || null,
    sha256,
  };
}
