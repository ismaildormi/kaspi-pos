import { collectVerifiedHarvestStats } from "@/lib/heyuka/verified-harvest-counter";
import {
  recordAwakeningReceipt,
  syncCrawlBatchIntoNervousMesh,
} from "@/lib/heyuka/global-nervous-mesh";
import { getSwarmNodesSummary } from "@/lib/heyuka/swarm-node-registry";
import { architectFullStackSystem } from "@/lib/zebra-x/dominance/secret2_software_supremacy";
import {
  computeInventoryEoqAndSafetyStock,
  computeNegotiationBatnaZopa,
} from "@/lib/zebra-x/dominance/secret3_business_dominance";
import { designSolarPvSystem } from "@/lib/zebra-x/dominance/secret4_science_engineering";
import { validateMoroccoDgiInvoice } from "@/lib/zebra-x/omega/secret10_hyper_local_grounding";
import {
  exportPortableSovereignSeedCrystal,
  importAndVerifySovereignSeedCrystal,
} from "@/lib/zebra-x/superpowers/domain_brain_factory";
import { executePolyglotCodeSandbox } from "@/lib/zebra-x/tools/code-sandbox";
import { executeUniversalMcpTool } from "@/lib/zebra-x/tools/universal_mcp_bus";

export interface AwakeningProbeResult {
  id: string;
  capability: string;
  passed: boolean;
  latencyMs: number;
  verifiedDetail: string;
}

/**
 * HEYUKA v108.0 — Self-Capability Awakening & Live Execution Trial Session.
 * Models actively exercise & verify every integrated subsystem hands-on and store
 * the verified self-knowledge directly inside the live Nervous Mesh & Sovereign Corpus.
 */
export async function runSelfCapabilityAwakeningSession() {
  const t0 = performance.now();
  const probes: AwakeningProbeResult[] = [];

  const runProbe = async (id: string, capability: string, fn: () => Promise<string> | string) => {
    const pStart = performance.now();
    try {
      const detail = await fn();
      probes.push({
        id,
        capability,
        passed: true,
        latencyMs: Number((performance.now() - pStart).toFixed(2)),
        verifiedDetail: detail,
      });
    } catch (err: unknown) {
      probes.push({
        id,
        capability,
        passed: false,
        latencyMs: Number((performance.now() - pStart).toFixed(2)),
        verifiedDetail: err instanceof Error ? err.message : "Probe error",
      });
    }
  };

  await runProbe("probe_code_sandbox", "Isolated V8/Polyglot Code Execution", async () => {
    const res = await executePolyglotCodeSandbox({
      language: "javascript",
      code: "console.log(JSON.stringify({ sum: 100 * 1.2, ok: true }));",
    });
    if (!res.ok || !String(res.stdout || "").includes("120")) throw new Error("Sandbox assertion failed");
    return `stdout=${String(res.stdout).trim()}`;
  });

  await runProbe("probe_dgi_tax_art145", "Morocco CGI Art.145 VAT & Timbre Verification", () => {
    const dgi = validateMoroccoDgiInvoice({
      invoiceNumber: "AWAKEN-2026-01",
      sellerIce: "002345678000012",
      subtotalHtMad: 6000,
      vatRatePct: 20,
      declaredTtcMad: 7200,
      paymentMethod: "cash",
    });
    if (!dgi.compliantDgiArticle145 || dgi.timbreStampRequiredMad !== "18.00") {
      throw new Error("DGI tax verification mismatch");
    }
    return `TTC=${dgi.computedTtcMad}MAD, Timbre=${dgi.timbreStampRequiredMad}MAD`;
  });

  await runProbe("probe_dominance_ast_v90_2", "OS-Scale AST & Zero-Stub Architect (v90.2)", () => {
    const arch = architectFullStackSystem({ projectName: "awaken-erp", entities: ["products", "sales"], locale: "ar" });
    if (!arch.ok || !arch.impactAudit.zeroStubGate.passed || !arch.impactAudit.securityAudit.clean) {
      throw new Error("AST architect failed gate");
    }
    return `${arch.files.length} files, 0 stubs, SAST clean`;
  });

  await runProbe("probe_dominance_eoq_batna_v90_3", "Inventory EOQ & Nash BATNA Game Theory (v90.3)", () => {
    const eoq = computeInventoryEoqAndSafetyStock([
      { sku: "AWK-1", name: "POS Paper Roll", annualDemandUnits: 2400, orderingCostMad: 80, holdingCostPerUnitYearMad: 4, leadTimeDays: 3 },
    ]);
    const batna = computeNegotiationBatnaZopa({ sellerReservationPrice: 500, buyerMaxWillingness: 700, sellerAsk: 750, buyerInitialBid: 450 });
    if (eoq[0].optimalOrderQtyEoq <= 0 || !batna.hasZopa) throw new Error("EOQ/BATNA mismatch");
    return `EOQ=${eoq[0].optimalOrderQtyEoq}, NashTarget=${batna.nashBargainingTarget}`;
  });

  await runProbe("probe_science_solar_v90_4", "Precision Solar PV Engineering (v90.4)", () => {
    const pv = designSolarPvSystem({ dailyLoadKwh: 12, peakSunHoursPerDay: 5.5, panelWattPeak: 550 });
    if (pv.panelsCount < 4) throw new Error("PV sizing invalid");
    return `${pv.panelsCount} panels (${pv.installedArrayKwp} kWp)`;
  });

  await runProbe("probe_mcp_bus_guard_v94", "Universal MCP Bus & Zero-Trust Action Guard (v94.0)", async () => {
    const guard = await executeUniversalMcpTool({ toolId: "public_deploy_confirm", input: { provider: "vercel" }, confirmAction: false });
    if (!(guard as { requiresUserConfirmation?: boolean }).requiresUserConfirmation) {
      throw new Error("Zero-Trust confirmation guard did not block unconfirmed publish");
    }
    return "Zero-Trust confirmation guard verified active";
  });

  await runProbe("probe_sovereign_seed_v91", "Portable Sovereign Seed Crystal Round-Trip (v91.0)", () => {
    const seed = exportPortableSovereignSeedCrystal();
    const check = importAndVerifySovereignSeedCrystal(seed.base64Gzip);
    if (!seed.ok || !check.ok || seed.totalClassifiedEntries !== check.totalClassifiedEntries) {
      throw new Error("Seed crystal verification mismatch");
    }
    return `Entries=${seed.totalClassifiedEntries}, Gzip=${seed.compressedBytes}B, SHA=${seed.sha256.slice(0, 12)}`;
  });

  await runProbe("probe_radar_swarm_v96_v100", "Omniscience Radar & 120-Shard Swarm Mesh (v96-v100)", async () => {
    const stats = await collectVerifiedHarvestStats({ forceRefresh: false });
    const swarm = getSwarmNodesSummary();
    if (!stats.ok || swarm.multiCloudShardCapacity !== 120 || swarm.goldenPrioritySourcesCount !== 15) {
      throw new Error("Swarm/Radar check failed");
    }
    return `Vault=${stats.verifiedMetrics.vaultedSourcesCount}, Shards=${swarm.multiCloudShardCapacity}, Golden=${swarm.goldenPrioritySourcesCount}`;
  });

  const passedCount = probes.filter((p) => p.passed).length;
  recordAwakeningReceipt(passedCount, probes.length);

  // Store the self-awakening report directly into live Studied Corpus so models recall it accurately
  const awakeningSummaryText = probes
    .map((p) => `[${p.passed ? "VERIFIED" : "FAIL"}] ${p.capability}: ${p.verifiedDetail} (${p.latencyMs}ms)`)
    .join(" | ");
  const meshSync = syncCrawlBatchIntoNervousMesh({
    sourceLabel: "self_capability_awakening_v108",
    units: [
      {
        title: `HEYUKA Self-Capability Awakening Audit (${passedCount}/${probes.length} Verified Live)`,
        url: "https://kaspi-pos.vercel.app/api/v1/cognition/awaken-and-test",
        sourceKind: "user_dataset",
        content: awakeningSummaryText,
      },
    ],
  });

  return {
    ok: passedCount === probes.length,
    version: "v108.0",
    passedCount,
    totalProbes: probes.length,
    passRatePct: Number(((passedCount / probes.length) * 100).toFixed(1)),
    totalLatencyMs: Number((performance.now() - t0).toFixed(2)),
    probes,
    nervousMeshSync: meshSync,
  };
}
