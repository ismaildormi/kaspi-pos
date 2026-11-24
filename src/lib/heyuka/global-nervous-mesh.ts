import { buildCognitiveFrontierBlueprint, resolveOptimalInferenceHyperparams } from "@/lib/heyuka/cognitive-frontier-blueprint";
import { classifyCognitiveIntentAndSources } from "@/lib/zebra-x/core/cognitive-brain-registry";
import {
  ensureFullVaultDigested,
  ingestHotSyncUnits,
  searchStudiedKnowledgeCorpus,
} from "@/lib/heyuka/training/knowledge-corpus-engine";
import { searchSovereignVault } from "@/lib/heyuka/vault/sovereign-permanent-vault";
import {
  collectVerifiedHarvestStats,
  getCachedVerifiedHarvestSnapshot,
  readVaultLockSummary,
} from "@/lib/heyuka/verified-harvest-counter";
import {
  resolveModelCommandHierarchy,
  type HeyukaHierarchyRole,
} from "@/lib/heyuka/compute/hf-token-pool";
import { indexInteractiveElementsSetOfMark } from "@/lib/zebra-x/superpowers/vision_gui_som_operator";
import { parseLayoutAwareDocAndGraph } from "@/lib/zebra-x/superpowers/deep_doc_graph_rag";
import { compileCustomBotBlueprint } from "@/lib/zebra-x/tools/bot-factory-engine";
import { classifyExtremeScenario } from "@/lib/zebra-x/dominance/secret1_scenario_master";
import { analyzeRepoAstAndDependencies, type WorkspaceFileInput } from "@/lib/zebra-x/dominance/secret2_software_supremacy";
import { inspectInputWithCyberImmuneShield } from "@/lib/zebra-x/omega/secret9_cyber_immune";
import { resolveDarijaCommercialTerms } from "@/lib/zebra-x/omega/secret10_hyper_local_grounding";
import { routeTaskToOptimalModel } from "@/lib/zebra-x/dominance/secret6_omni_router";
import { buildZeroCostConnectorScaffold } from "@/lib/zebra-x/tools/universal_mcp_bus";
import {
  runFrontierIntelligenceOrchestrator,
  type FrontierExecutionMode,
} from "@/lib/heyuka/frontier/frontier-intelligence-orchestrator";
import type { SevenDistinctSourceStates } from "@/lib/heyuka/frontier/universal-knowledge-fabric";

export interface PowerExecutionTrace {
  version: string;
  pipelineLatencyMs: number;
  securityVerdict: "allow" | "quarantine_untrusted" | "block";
  scenarioMode: string;
  cognitiveCluster: string;
  recommendedOpenModel: string;
  modelHierarchyRole: HeyukaHierarchyRole;
  selectedHfLane: string | null;
  hfPoolActiveTokens: number;
  enginesExecuted: string[];
  liveSourcesConsulted: Array<{ name: string; url: string }>;
  lastCloudSyncAt: string;
  hotSyncedUnitsCount: number;
  vaultedSourcesCount: number;
  vaultLockEntries: number;
  doubleReadUnitsCount: number;
  awakeningVerifiedCount: number;
  hyperparams: { temperature: number; topP: number; profile: string };
  frontier?: {
    executionMode: FrontierExecutionMode;
    taskCategory: string;
    activatedSpecialistsCount: number;
    distinctPhysicalModelsCount: number;
    specialistRoles: string[];
    winningBasis: string;
    mathVerified: boolean;
    mctsGainDelta: number;
    sourceStates: SevenDistinctSourceStates;
    epistemicCounts: {
      established_facts: number;
      strongly_supported_findings: number;
      reasonable_inference: number;
      unverified_claims: number;
      conflicting_evidence: number;
    };
  };
}

interface NervousMeshState {
  lastCloudSyncAt: string;
  lastSyncSource: string;
  hotSyncedUnitsCount: number;
  awakeningVerifiedCount: number;
  lastAwakeningAt: string | null;
  lastAwakeningScore: string | null;
}

const meshState: NervousMeshState = {
  lastCloudSyncAt: new Date().toISOString(),
  lastSyncSource: "sovereign_vault_boot",
  hotSyncedUnitsCount: 0,
  awakeningVerifiedCount: 0,
  lastAwakeningAt: null,
  lastAwakeningScore: null,
};

export function getNervousMeshState(): NervousMeshState {
  return { ...meshState };
}

export function recordAwakeningReceipt(passed: number, total: number) {
  const now = new Date().toISOString();
  meshState.awakeningVerifiedCount = passed;
  meshState.lastAwakeningAt = now;
  meshState.lastAwakeningScore = `${passed}/${total}`;
  meshState.lastCloudSyncAt = now;
  meshState.lastSyncSource = "self_capability_awakening";
}

export function syncCrawlBatchIntoNervousMesh(params: {
  units: Array<{ title: string; url: string; content: string; sourceKind?: "web_crawl" | "user_dataset" }>;
  sourceLabel?: string;
}) {
  const sourceLabel = params.sourceLabel || "distributed_cloud_swarm";
  const ingested = ingestHotSyncUnits(params.units || [], sourceLabel);
  meshState.lastCloudSyncAt = new Date().toISOString();
  meshState.lastSyncSource = sourceLabel;
  meshState.hotSyncedUnitsCount += ingested.ingestedCount;
  return {
    ok: true,
    ...ingested,
    meshState: getNervousMeshState(),
  };
}

/**
 * Unified Full-Power Brain Wiring Pipeline (`v101.0` - `v108.0`):
 * Runs across chat-web, studio council, and KASPI POS AI Advisor so every real turn uses live telemetry,
 * cyber shield, scenario routing, vault/corpus knowledge, AST/Darija/DGI checks & tuned hyperparameters.
 */
export async function runUnifiedFullPowerPipeline(params: {
  prompt: string;
  locale: "ar" | "fr" | "en";
  brand: "heyuka" | "kaspi_pos";
  mode?: string;
  requestedModel?: string;
  hasImage?: boolean;
  workspaceFiles?: WorkspaceFileInput[];
  thinkingEnabled?: boolean;
  compact?: boolean;
}) {
  const t0 = performance.now();
  ensureFullVaultDigested();
  const prompt = String(params.prompt || "");
  const enginesExecuted: string[] = [];

  // 1. Cyber-Immune Firewall (<3ms) + Extreme Scenario Classifier + 3-Model Command Hierarchy
  const shield = inspectInputWithCyberImmuneShield(prompt, { sourceTrust: "user" });
  const scenario = classifyExtremeScenario(prompt);
  const hierarchy = resolveModelCommandHierarchy({
    requestedModel: params.requestedModel,
    prompt,
    hasImage: params.hasImage || (params.workspaceFiles || []).some((f) => /\.(png|jpg|webp|svg)$/i.test(f.path)),
    mode: params.mode,
  });
  enginesExecuted.push(
    "CyberImmune-v88",
    `Scenario:${scenario.mode}`,
    `Hierarchy:${hierarchy.role}`
  );

  // 2. Full-Depth Remote Omniscience Radar & Vault Lock Metadata (Zero short-timeout cutoff)
  const vaultLock = readVaultLockSummary();
  const radar =
    getCachedVerifiedHarvestSnapshot() ||
    (await collectVerifiedHarvestStats().catch(() => null));
  if (radar) enginesExecuted.push("OmniscienceRadar-v90.5");
  if (vaultLock.totalClassifiedEntries > 0) enginesExecuted.push("VaultLock-2795");

  // 3. Deep Semantic Corpus + Sovereign Vault + Cluster Classification + Omni-Router Selection
  const cognitiveRoute = classifyCognitiveIntentAndSources(prompt, params.locale);
  const studied = searchStudiedKnowledgeCorpus({ query: prompt, limit: 12, includeWebFirst: true });
  const vaulted = searchSovereignVault({ query: prompt, clusterId: cognitiveRoute.primaryCluster.id, limit: 8 });
  const modelRoute = routeTaskToOptimalModel(prompt);
  enginesExecuted.push(
    `Cluster:${cognitiveRoute.primaryCluster.id}`,
    `OmniRouter:${modelRoute.specialty}`
  );

  // 4. Contextual Domain Micro-Engines & Superpowers (AST, SoM-GUI, DeepDoc GraphRAG, Bot Factory, Darija/DGI, ZeroCost)
  const enrichmentNotes: string[] = [];
  if (params.workspaceFiles && params.workspaceFiles.length > 0) {
    const ast = analyzeRepoAstAndDependencies(params.workspaceFiles);
    enginesExecuted.push("AST-Supremacy-v90.2");
    if (ast.domCrossCheck.missingIdsInHtml.length > 0) {
      enrichmentNotes.push(
        `[Workspace AST Check]: JS references IDs missing in HTML: ${ast.domCrossCheck.missingIdsInHtml.join(", ")}.`
      );
    }
    if (!ast.securityAudit.clean) {
      enrichmentNotes.push(
        `[Workspace SAST]: Found ${ast.securityAudit.totalFindings} security issue(s) to remediate.`
      );
    }
    const htmlFile = params.workspaceFiles.find((f) => /\.html?$/i.test(f.path));
    if (htmlFile?.content) {
      const som = indexInteractiveElementsSetOfMark(htmlFile.content, 24);
      enginesExecuted.push("SoM-GUI-v91");
      if (som.elements.length > 0) {
        enrichmentNotes.push(`[SoM DOM Map]: Indexed ${som.elements.length} interactive elements in ${htmlFile.path}.`);
      }
    }
  }

  if (prompt.includes("|") || prompt.length > 260) {
    const docGraph = parseLayoutAwareDocAndGraph(prompt);
    if (docGraph.tables.length > 0 || docGraph.graphEdges.length > 0) {
      enginesExecuted.push("DeepDocGraphRAG-v91");
      enrichmentNotes.push(
        `[DeepDoc GraphRAG]: Parsed ${docGraph.tables.length} structured table(s) & ${docGraph.graphEdges.length} semantic graph edge(s).`
      );
    }
  }

  if (/(whatsapp|telegram|chatbot|bot factory|بوت|تيليجرام|واتساب)/i.test(prompt)) {
    const botPkg = compileCustomBotBlueprint({
      botId: "heyuka_custom_bot",
      displayName: "HEYUKA Sovereign Bot",
      platform: /telegram/i.test(prompt) ? "telegram" : "whatsapp",
      guidelines: [{ condition: "Incoming user message", action: prompt.slice(0, 140) || "Process cleanly" }],
    });
    enginesExecuted.push("BotFactory-v21");
    enrichmentNotes.push(`[Bot Factory Blueprint Ready]: ${botPkg.entryFilename} (${botPkg.readmeNotes})`);
  }

  const darijaMatches = resolveDarijaCommercialTerms(prompt);
  if (darijaMatches.length > 0) {
    enginesExecuted.push("Darija-DGI-v88");
    enrichmentNotes.push(
      `[Darija / POS Context]: ${darijaMatches.map((m) => `${m.term} => ${m.formalArabic} / ${m.formalFrench} (${m.posModuleAction})`).join(" | ")}`
    );
  }

  if (/(deploy|vercel|cloudflare|supabase|turso|pwa|نشر|سحابة)/i.test(prompt)) {
    const connector = buildZeroCostConnectorScaffold("vercel", params.brand);
    enginesExecuted.push("ZeroCost-Deploy-v93");
    enrichmentNotes.push(`[Zero-Cost Infra Tip]: ${connector.title} (${connector.freeTierLimit}).`);
  }

  // 5. Frontier Intelligence v110.0 Orchestrator (12-Stage Knowledge Fabric + 10 Specialists + 7-Layer Memory + Math Proof)
  const hasImageFlag =
    params.hasImage || (params.workspaceFiles || []).some((f) => /\.(png|jpg|webp|svg)$/i.test(f.path));
  const frontierRes = await runFrontierIntelligenceOrchestrator({
    prompt,
    requestedModel: params.requestedModel,
    hasImageAttachment: hasImageFlag,
  });
  enginesExecuted.push(
    `FrontierMode:${frontierRes.executionMode}`,
    `Specialists:${frontierRes.activatedSpecialistsCount}/10`,
    `Adjudication:${frontierRes.adjudicationSummary.winningBasis}`
  );

  const liveSourcesConsulted = Array.from(
    new Map(
      [
        ...frontierRes.knowledgeFabric.topEvidenceNodes.map((n) => [n.url, { name: n.title, url: n.url }] as const),
        ...studied.hits.map((h) => [h.url, { name: h.title, url: h.url }] as const),
        ...vaulted.map((v) => [v.url, { name: v.name, url: v.url }] as const),
      ]
    ).values()
  ).slice(0, 14);

  const hyperparams = resolveOptimalInferenceHyperparams({
    prompt,
    mode: params.mode,
    domainMode: scenario.mode,
  });

  const blueprintBlock = buildCognitiveFrontierBlueprint({
    brand: params.brand,
    locale: params.locale,
    thinkingEnabled: params.thinkingEnabled,
    compact: params.compact,
  });

  const liveFactsBlock = [
    `[NERVOUS MESH v110.0 | Role=${hierarchy.role} (${hierarchy.hfLane}) | Mode=${frontierRes.executionMode} | Specialists=${frontierRes.activatedSpecialistsCount}/10 | VaultLock=${vaultLock.totalClassifiedEntries || studied.totalCorpusUnits} (${vaultLock.packCount} packs) | Web=${studied.webCrawledUnits} | HF=${radar?.huggingFaceVault.datasetRepo ?? "zuvyrismail/heyuka-omni-vault"} (${radar?.huggingFaceVault.crystalCount ?? 0} crystals, ${radar?.huggingFaceVault.poolActiveTokens ?? modelRoute.hfPoolActiveTokens} keys) | LastSync=${meshState.lastCloudSyncAt}${meshState.lastAwakeningScore ? ` | Awakened=${meshState.lastAwakeningScore}` : ""}]`,
    `[COMMAND MISSION (${hierarchy.title})]: ${hierarchy.mission}`,
    frontierRes.synthesizedDirectiveBlock,
    liveSourcesConsulted.length > 0
      ? `[DEEP-READ SOURCES (${liveSourcesConsulted.length})]: ${liveSourcesConsulted.map((s) => `${s.name} (${s.url})`).join(" ; ")}`
      : "",
    ...enrichmentNotes,
  ]
    .filter(Boolean)
    .join("\n");

  const trace: PowerExecutionTrace = {
    version: "v110.0",
    pipelineLatencyMs: Number((performance.now() - t0).toFixed(2)),
    securityVerdict: shield.verdict,
    scenarioMode: scenario.mode,
    cognitiveCluster: cognitiveRoute.primaryCluster.id,
    recommendedOpenModel: hierarchy.preferredHfModels[0] || modelRoute.recommendedOpenModel,
    modelHierarchyRole: hierarchy.role,
    selectedHfLane: hierarchy.hfLane || modelRoute.selectedHfLaneEnv,
    hfPoolActiveTokens: modelRoute.hfPoolActiveTokens,
    enginesExecuted,
    liveSourcesConsulted,
    lastCloudSyncAt: meshState.lastCloudSyncAt,
    hotSyncedUnitsCount: meshState.hotSyncedUnitsCount,
    vaultedSourcesCount: radar?.verifiedMetrics.vaultedSourcesCount ?? studied.totalCorpusUnits,
    vaultLockEntries: vaultLock.totalClassifiedEntries,
    doubleReadUnitsCount: radar?.verifiedMetrics.doubleReadVerifiedUnits ?? studied.totalCorpusUnits,
    awakeningVerifiedCount: meshState.awakeningVerifiedCount,
    hyperparams,
    frontier: {
      executionMode: frontierRes.executionMode,
      taskCategory: frontierRes.taskCategory,
      activatedSpecialistsCount: frontierRes.activatedSpecialistsCount,
      distinctPhysicalModelsCount: frontierRes.distinctPhysicalModelsCount,
      specialistRoles: frontierRes.specialists.map((s) => s.role),
      winningBasis: frontierRes.adjudicationSummary.winningBasis,
      mathVerified: frontierRes.mathVerification.verified,
      mctsGainDelta: frontierRes.mctsBenchmark.mctsAccuracyGainDelta,
      sourceStates: frontierRes.knowledgeFabric.sourceStates,
      epistemicCounts: {
        established_facts: frontierRes.knowledgeFabric.epistemicBreakdown.established_facts.length,
        strongly_supported_findings:
          frontierRes.knowledgeFabric.epistemicBreakdown.strongly_supported_findings.length,
        reasonable_inference: frontierRes.knowledgeFabric.epistemicBreakdown.reasonable_inference.length,
        unverified_claims: frontierRes.knowledgeFabric.epistemicBreakdown.unverified_claims.length,
        conflicting_evidence: frontierRes.knowledgeFabric.epistemicBreakdown.conflicting_evidence.length,
      },
    },
  };

  return {
    trace,
    blueprintBlock,
    liveFactsBlock,
  };
}
