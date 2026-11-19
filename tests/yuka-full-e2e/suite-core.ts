import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, TextRun } from "docx";
import * as THREE from "three";

import {
  V15_1_LONG_CONTEXT_EMBEDDING_SOURCES,
  V15_2_PLANNING_REASONING_DATASETS,
  V15_2_CODE_CREATIVE_DATASETS,
  V15_2_AGENT_EXECUTION_FRAMEWORKS,
  V14_EVAL_CHAOS_EVOLUTION_STACK,
  ALL_REASONING_EVAL_CATALOG,
  REASONING_EVAL_CATALOG_COUNTS,
  chunkLongContextWithRopeWindow,
  generateDeterministicFuzzInputs,
  searchReasoningAndEvalCatalog,
} from "../../src/lib/zebra-x/core/reasoning-eval-catalog";
import { searchLocalCatalogPacks } from "../../src/lib/zebra-x/core/catalog-hunter";
import {
  recordOrReinforceMemory,
  recordReflexionExperience,
  searchEvolvingMemory,
  chunkLongContextForRetrieval,
} from "../../src/lib/zebra-x/core/memory-engine";
import {
  planXZebraToolRoute,
  buildMasterStrategicExecutionPlan,
} from "../../src/lib/zebra-x/core/router";
import {
  runPreReplyReflectionGate,
  stripHiddenReasoningAndArtifacts,
} from "../../src/lib/zebra-x/core/reflection-gate";
import {
  normalizeDarijaAndTarifit,
  refinePromptWithPhase3,
} from "../../src/lib/zebra-x/core/prompt-refiner";
import {
  getProgressiveSkillIndex,
  loadSkillInstructionsOnDemand,
  convertPatternOrRuleToYukaSkill,
} from "../../src/lib/zebra-x/core/skills-vault";
import {
  saveCoworkCheckpoint,
  resumeCoworkSession,
  compactConversationMessages,
  pruneOldToolOutputs,
  evaluateClarificationGate,
  spawnParallelSubAgents,
  loadHierarchicalYukaContext,
} from "../../src/lib/zebra-x/core/cowork-session";
import { discoverOpenApiSpec } from "../../src/lib/zebra-x/core/auto-connector";
import {
  assertPosCoreImmutable,
  isSafePublicHttpUrl,
  runUnrestrictedWebResearch,
} from "../../src/lib/zebra-x/arsenal-vault";
import {
  evaluateMathOrAlgebra,
  computeExactRetailFinance,
  planParallelDagWaves,
  validatePhoneNumberSafe,
  getHijriAndSolarAstronomy,
  inspectCronExpression,
} from "../../src/lib/zebra-x/tools/math-logic-engine";
import {
  analyzeCsvDataframe,
  shapeTextForPdf,
  parseExcelBufferToText,
} from "../../src/lib/zebra-x/tools/docs-export-engine";
import { executePolyglotCodeSandbox } from "../../src/lib/zebra-x/tools/code-sandbox";
import {
  queryPublicApiHub,
  PUBLIC_APIS_CATALOG_COUNT,
  type PublicApiCategory,
} from "../../src/lib/zebra-x/tools/public-apis-hub";
import { buildBinarySafeZipArchive } from "../../src/lib/heyuka/pkzip";
import { discoverDynamicCapabilities } from "../../src/lib/heyuka/compute/capability-registry";
import {
  evaluateZeroCostPolicy,
} from "../../src/lib/heyuka/compute/zero-cost-policy";
import {
  encryptVaultSecrets,
  decryptVaultSecrets,
} from "../../src/lib/security/integration-vault";
import { getRouterCandidates } from "../../src/lib/ai-router";
import { generateProductImageUrl } from "../../src/lib/pollinations";
import { executeAudioSeparateTask, executeThreeDGenerateTask } from "../../src/lib/zebra-x/sidecar-bridge";

interface CheckRecord {
  id: string;
  group: string;
  status: "passed" | "healed_passed" | "failed";
  firstPassOk: boolean;
  attempts: number;
  durationMs: number;
  artifactBytes: number;
  detail: string;
}

const results: CheckRecord[] = [];
const artifactsDir = path.join(process.cwd(), "tests", "yuka-full-e2e", "out");
fs.mkdirSync(artifactsDir, { recursive: true });

async function runCheck(
  id: string,
  group: string,
  fn: (attempt: number) => Promise<{ detail: string; artifactBytes?: number }>,
  options?: { maxRetries?: number; retryDelayMs?: number }
) {
  const maxRetries = options?.maxRetries ?? 1;
  const retryDelayMs = options?.retryDelayMs ?? 900;
  const start = Date.now();
  let lastErr: Error | null = null;
  let attempts = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    attempts = attempt;
    try {
      const res = await fn(attempt);
      const rec: CheckRecord = {
        id,
        group,
        status: attempt === 1 ? "passed" : "healed_passed",
        firstPassOk: attempt === 1,
        attempts,
        durationMs: Date.now() - start,
        artifactBytes: res.artifactBytes || 0,
        detail: res.detail,
      };
      results.push(rec);
      console.log(`[${rec.status === "passed" ? "PASS" : "HEALED"}] ${id} (${rec.durationMs}ms) -> ${rec.detail}`);
      return;
    } catch (err: any) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
      }
    }
  }

  results.push({
    id,
    group,
    status: "failed",
    firstPassOk: false,
    attempts,
    durationMs: Date.now() - start,
    artifactBytes: 0,
    detail: lastErr?.message || "Unknown failure",
  });
}

async function main() {
  // 1. CATALOG DEDUPLICATION & LONG-CONTEXT (v15.1 + v15.2 + v14.x)
  await runCheck("catalog_counts_dedup", "v15.1-v15.2 Catalog", async () => {
    assert.equal(V15_1_LONG_CONTEXT_EMBEDDING_SOURCES.length, 22, "Expected 22 v15.1 sources");
    assert.equal(V15_2_PLANNING_REASONING_DATASETS.length, 25, "Expected 25 planning datasets");
    assert.equal(V15_2_CODE_CREATIVE_DATASETS.length, 23, "Expected 23 code/creative datasets");
    assert.equal(V15_2_AGENT_EXECUTION_FRAMEWORKS.length, 8, "Expected 8 agent frameworks");
    assert.equal(REASONING_EVAL_CATALOG_COUNTS.v15_2_total, 56, "Expected 56 v15.2 sources");

    const idSet = new Set(ALL_REASONING_EVAL_CATALOG.map((e) => e.id));
    const nameSet = new Set(ALL_REASONING_EVAL_CATALOG.map((e) => e.name.toLowerCase()));
    assert.equal(idSet.size, ALL_REASONING_EVAL_CATALOG.length, "Duplicate IDs detected in catalog");
    assert.equal(nameSet.size, ALL_REASONING_EVAL_CATALOG.length, "Duplicate names detected in catalog");
    for (const item of ALL_REASONING_EVAL_CATALOG) {
      assert.ok(item.sourceUrl.startsWith("https://"), `Non-HTTPS URL: ${item.id}`);
    }

    const hit = searchLocalCatalogPacks("HotpotQA PRM800K");
    assert.ok(hit.reasoningAndEvalMatches.length >= 1, "Expected search match in local catalog packs");
    return { detail: `Verified ${ALL_REASONING_EVAL_CATALOG.length} deduplicated entries (22 v15.1 + 56 v15.2 + ${V14_EVAL_CHAOS_EVOLUTION_STACK.length} v14.x)` };
  });

  await runCheck("long_context_yarn_chunker", "v15.1 Long Context", async () => {
    const paragraph =
      "نظام HEYUKA السيادي من تطوير KASPI يعالج تحليل المبيعات في الناظور والجهة الشرقية بدقة عالية. " +
      "Long-context YaRN/RoPE scaling enables 128K window segmentation across multi-hop datasets like HotpotQA and MuSiQue. ";
    const bigDoc = paragraph.repeat(120);
    const chunked = chunkLongContextForRetrieval(bigDoc, { maxWindowTokens: 512, overlapTokens: 64, ropeScaleFactor: 8 });
    assert.ok(chunked.chunks.length >= 4, `Expected >=4 chunks, got ${chunked.chunks.length}`);
    assert.equal(chunked.effectiveContextBudget, 4096);
    assert.ok(searchReasoningAndEvalCatalog("Nomic Embed").length >= 1);
    return { detail: `Chunked ${bigDoc.length} chars into ${chunked.chunks.length} overlapping slices` };
  });

  // 2. MEMORY, REFLEXION, SKILLS & COWORK
  await runCheck("memory_expel_reflexion", "Memory & Reflexion", async () => {
    const mem1 = await recordOrReinforceMemory({
      title: "Nador B2B TVA 20% rule",
      content: "Standard retail Moroccan VAT is 20% while staple essentials stay exempt or reduced.",
      tags: ["morocco", "tva"],
      language: "mixed",
    });
    const mem2 = await recordReflexionExperience({
      taskSummary: "Fallback retry on rate-limited FX API",
      lessonLearned: "Route FX rate check to open.er-api when exchangerate.host throttles.",
      outcome: "healed",
      language: "en",
    });
    assert.ok(mem1.entry.semHash && mem2.entry.semHash);
    const hits = await searchEvolvingMemory("Moroccan TVA FX API healed", 5);
    assert.ok(hits.hits.length >= 1, "Expected Orama+Fuse hybrid memory hits");
    return { detail: `Stored & recalled ${hits.totalMemories} memories via ${hits.enginesLoaded.join("+")}` };
  });

  await runCheck("skills_vault_cowork_routing", "Skills & Cowork", async () => {
    const idx = await getProgressiveSkillIndex();
    assert.ok(idx.length >= 7, "Expected >=7 domain skills in Level-1 index");
    const loaded = await loadSkillInstructionsOnDemand("pos-retail-analytics");
    assert.ok(loaded && loaded.instructionsBody.length > 50, "Expected Level-2 SKILL.md body");
    const converted = convertPatternOrRuleToYukaSkill({
      title: "e2e-pattern-rule",
      domain: "engineering",
      rawContent: "Always validate inputs with strict TypeScript schemas and non-empty assertions.",
      sourceKind: "cursor_rule",
    });
    assert.equal(converted.format, "yuka-skill/v1");

    await saveCoworkCheckpoint({
      sessionId: "e2e_cowork_chk_1",
      goal: "Verify full workspace persistence",
      tasks: [{ id: "t1", label: "Check catalog", status: "completed" }],
      openedFiles: ["README.md"],
      scratchpadNotes: ["Checkpoint validated"],
    });
    const resumed = await resumeCoworkSession("e2e_cowork_chk_1");
    assert.equal(resumed?.sessionId, "e2e_cowork_chk_1");
    assert.ok(loadHierarchicalYukaContext("commerce").length > 20);
    assert.equal(evaluateClarificationGate("fix", "en").shouldClarify, true);
    const compacted = compactConversationMessages([
      { role: "user", content: "q1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "q2" },
    ]);
    assert.ok(compacted.compacted.length >= 1);
    const pruned = pruneOldToolOutputs([{ role: "tool", content: "x".repeat(4000) }, { role: "assistant", content: "ok" }]);
    assert.ok(pruned.length === 2);

    const wave = await spawnParallelSubAgents(
      [
        { id: "w1", role: "analysis", payload: "taskA" },
        { id: "w2", role: "verify", payload: "taskB" },
      ],
      async (t) => t.toUpperCase()
    );
    assert.deepEqual(
      wave.map((w) => w.result),
      ["TASKA", "TASKB"]
    );

    const route = planXZebraToolRoute("احسب PRM800K و HotpotQA مع التخطيط للناظور", false);
    assert.ok(route.intents.includes("reasoning_and_eval"));
    const strategic = await buildMasterStrategicExecutionPlan({
      prompt: "حلل مبيعات الناظور مع جدول Excel",
      isOwner: false,
      locale: "ar",
      activeMeshNodes: 4,
    });
    assert.equal(strategic.htnDag.acyclic, true);
    return { detail: `${idx.length} Level-1 skills, Cowork checkpoint resumed, HTN DAG acyclic` };
  });

  // 3. SECURITY, FUZZING (1050 CASES), SSRF, POS LOCK & ZERO-COST SHIELD
  await runCheck("fuzz_security_zero_cost_1050", "Security & Fuzz (fast-check pattern)", async () => {
    const fuzzInputs = generateDeterministicFuzzInputs(1050);
    let processed = 0;
    for (const input of fuzzInputs) {
      normalizeDarijaAndTarifit(input);
      chunkLongContextWithRopeWindow(input, { maxWindowTokens: 512 });
      stripHiddenReasoningAndArtifacts(input);
      processed++;
    }
    assert.equal(processed, 1050);

    // SSRF negative vectors
    const ssrfVectors = [
      "http://127.0.0.1:3000/api",
      "http://localhost/admin",
      "http://169.254.169.254/latest/meta-data/",
      "http://10.0.0.5/internal",
      "http://192.168.1.1/router",
      "http://[::1]/loopback",
      "file:///etc/passwd",
      "javascript:alert(1)",
    ];
    for (const bad of ssrfVectors) {
      assert.equal(isSafePublicHttpUrl(bad), false, `SSRF vector not blocked: ${bad}`);
      const conn = await discoverOpenApiSpec(bad);
      assert.equal(conn.ok, false);
    }
    assert.equal(isSafePublicHttpUrl("https://api.github.com/orgs/microsoft"), true);

    // Protected POS core immutability
    const posTargets = ["src/app/api/pos/sales/route.ts", "src/components/pos/CartPanel.tsx", "prisma/schema.prisma"];
    for (const target of posTargets) {
      assert.throws(() => assertPosCoreImmutable(target));
    }

    // Reflection leakage & secret scrubber
    const leakTest = runPreReplyReflectionGate({
      draftText: "<think>secret internal</think>User: test. qwen3 and ollama Bearer hk-live-deadbeef1234567890abcdef12345678 قال مرحبا",
      expectedLocale: "ar",
    });
    assert.equal(leakTest.hadLeakedReasoning, true);
    assert.ok(!/ollama|qwen|deadbeef/i.test(leakTest.cleanedText), "Leakage remained in output");

    // Zero-Cost Owner Shield + AES-256-GCM BYOK Tenant Isolation roundtrip
    const zcDevice = await evaluateZeroCostPolicy({ tenantId: "11111111-1111-4111-8111-111111111111", preferTier: "user_device" });
    assert.equal(zcDevice.allowed, true);
    assert.equal(zcDevice.estimatedOwnerCostUSD, 0);
    const zcInvalidTenant = await evaluateZeroCostPolicy({ tenantId: "t_demo", requiresPaidOwnerResource: false });
    assert.equal(zcInvalidTenant.estimatedOwnerCostUSD, 0);
    const zcBlocked = await evaluateZeroCostPolicy({ tenantId: "t_demo", requiresPaidOwnerResource: true });
    assert.equal(zcBlocked.allowed, false);
    const safeCandidates = await getRouterCandidates({ allowOwnerPaidProviders: false, tenantId: "11111111-1111-4111-8111-111111111111" });
    assert.ok(!safeCandidates.some((c) => c.provider === "custom" || c.provider === "together" || c.provider === "deepseek"));

    const secretSample = { apiKey: "sk-byok-demo-secret-key-987654321" };
    const cipher = encryptVaultSecrets("tenant_a", secretSample);
    assert.equal(decryptVaultSecrets("tenant_a", cipher).apiKey, secretSample.apiKey);
    assert.throws(() => decryptVaultSecrets("tenant_b", cipher), "Cross-tenant vault decryption MUST fail");

    return { detail: `1050 fuzz inputs + ${ssrfVectors.length} SSRF vectors + POS immutability + Zero-Cost $0.00 verified` };
  });

  // 4. REAL ARTIFACT GENERATION (XLSX, DOCX, PKZIP, THREE.JS, MATH, SANDBOX)
  await runCheck("real_artifacts_xlsx_docx_zip_3d", "Real Artifacts (>0B)", async () => {
    let totalBytes = 0;

    // 4a. Real ExcelJS Workbook -> Buffer + parseExcelBufferToText verification
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("HEYUKA_E2E");
    ws.addRow(["Metric", "Value", "Currency"]);
    ws.addRow(["Nador Daily Sales", 14500.5, "MAD"]);
    ws.addRow(["VAT 20%", 2900.1, "MAD"]);
    const xlsxBuf = Buffer.from(await wb.xlsx.writeBuffer());
    assert.ok(xlsxBuf.length > 1500 && xlsxBuf[0] === 0x50 && xlsxBuf[1] === 0x4b, "Invalid XLSX header");
    const parsedXlsx = await parseExcelBufferToText(xlsxBuf.buffer.slice(xlsxBuf.byteOffset, xlsxBuf.byteOffset + xlsxBuf.byteLength));
    assert.ok(parsedXlsx.previewCsv.includes("Nador Daily Sales"));
    totalBytes += xlsxBuf.length;

    // 4b. Real DOCX Document via `docx`
    const doc = new Document({
      sections: [{ children: [new Paragraph({ children: [new TextRun("HEYUKA E2E Report — KASPI POS (Nador)")] })] }],
    });
    const docxBuf = Buffer.from(await Packer.toBuffer(doc));
    assert.ok(docxBuf.length > 1500 && docxBuf[0] === 0x50 && docxBuf[1] === 0x4b, "Invalid DOCX header");
    totalBytes += docxBuf.length;

    // 4c. Real PKZIP Archive bundling xlsx + docx + shaped Arabic report + CSV DataFrame analysis
    const csvCheck = await analyzeCsvDataframe("product,price,qty\nCafe,15,4\nThe,10,6");
    assert.equal(csvCheck.rowCount, 2);
    assert.equal(csvCheck.numericStats.price.avg, 12.5);
    const shapedAr = shapeTextForPdf("تقرير المبيعات اليومي");
    assert.ok(shapedAr.length > 5);

    const zipBuf = buildBinarySafeZipArchive([
      { name: "report.xlsx", data: new Uint8Array(xlsxBuf) },
      { name: "summary.docx", data: new Uint8Array(docxBuf) },
      { name: "manifest.json", data: new TextEncoder().encode(JSON.stringify({ ok: true, totalBytes, csvCheck })) },
    ]);
    assert.ok(zipBuf.length > 3000 && zipBuf[0] === 0x50 && zipBuf[1] === 0x4b && zipBuf[2] === 0x03 && zipBuf[3] === 0x04);
    fs.writeFileSync(path.join(artifactsDir, "HEYUKA_E2E_BUNDLE.zip"), zipBuf);
    totalBytes += zipBuf.length;

    // 4d. Real PDF generation via pdfmake in Node + signature check
    const pdfMakeMod = await import("pdfmake/build/pdfmake");
    const pdfFontsMod = await import("pdfmake/build/vfs_fonts");
    const pdfMake: any = (pdfMakeMod as any).default ?? pdfMakeMod;
    const pdfFonts: any = (pdfFontsMod as any).default ?? pdfFontsMod;
    pdfMake.vfs = pdfFonts?.pdfMake?.vfs ?? pdfFonts?.vfs ?? pdfFonts;
    const docDef = {
      content: [
        { text: "HEYUKA E2E PDF Artifact - KASPI POS", bold: true, fontSize: 14 },
        { text: `CSV Mean Price: ${csvCheck.numericStats.price.avg} MAD | Shaped: ${shapedAr}` },
      ],
    };
    const rawPdf = await pdfMake.createPdf(docDef).getBuffer();
    const pdfBuf = Buffer.from(rawPdf);
    assert.ok(pdfBuf.length > 900 && pdfBuf.subarray(0, 5).toString("utf8") === "%PDF-", "Invalid PDF header");
    fs.writeFileSync(path.join(artifactsDir, "HEYUKA_E2E_REPORT.pdf"), pdfBuf);
    totalBytes += pdfBuf.length;

    // 4e. Real Three.js 3D Box Geometry JSON validation
    const box = new THREE.BoxGeometry(2, 2, 2);
    const geoJson = JSON.stringify(box.toJSON());
    assert.ok(geoJson.length > 200 && box.attributes.position.count >= 24);
    totalBytes += geoJson.length;

    return {
      artifactBytes: totalBytes,
      detail: `PDF=${pdfBuf.length}B, XLSX=${xlsxBuf.length}B, DOCX=${docxBuf.length}B, PKZIP=${zipBuf.length}B, ThreeJS=${geoJson.length}B`,
    };
  });

  await runCheck("math_finance_dag_astronomy", "Math & Logic Engine", async () => {
    const num = await evaluateMathOrAlgebra("2^10 + sqrt(144)");
    assert.equal(num.ok, true);
    assert.ok(num.result.includes("1036"));

    const alg = await evaluateMathOrAlgebra("solve(x^2 - 9 = 0, x)", true);
    assert.equal(alg.ok, true);
    assert.ok(alg.result.includes("3"));

    const fin = await computeExactRetailFinance({ unitPrice: 1000, vatPercent: 20, quantity: 1 });
    assert.equal(fin.subtotalHT, "1000.00");
    assert.equal(fin.vatAmount, "200.00");
    assert.equal(fin.totalTTC, "1200.00");

    const dag = await planParallelDagWaves([
      { id: "a", label: "Fetch" },
      { id: "b", label: "Compute", dependsOn: ["a"] },
    ]);
    assert.equal(dag.acyclic, true);
    assert.equal(dag.waves.length, 2);

    const phone = await validatePhoneNumberSafe("+212612345678", "MA");
    assert.equal(phone.country, "MA");

    const astro = await getHijriAndSolarAstronomy({ lat: 35.1688, lon: -2.9335 });
    assert.ok(astro.hijriArabic && astro.hijriNumeric && astro.sunriseIso);

    const cron = await inspectCronExpression("0 9 * * *", 3);
    assert.equal(cron.nextRunsIso.length, 3);

    const ref = refinePromptWithPhase3("chhal tva d 1200 MAD f Nador?", "ar");
    assert.equal(ref.normalization.nadorRegionalMatch, true);

    return { detail: `math=${num.result}, vat=${fin.vatAmount}MAD, dagWaves=${dag.waves.length}, hijri=${astro.hijriNumeric}` };
  });

  await runCheck("code_sandbox_js_python", "Polyglot Code Sandbox", async () => {
    const jsRes = await executePolyglotCodeSandbox({
      language: "javascript",
      code: "console.log(JSON.stringify({ answer: 6 * 7 }));",
    });
    assert.equal(jsRes.ok, true, `JS sandbox failed: ${jsRes.stderr}`);
    assert.ok(jsRes.stdout.includes("42"));

    const pyRes = await executePolyglotCodeSandbox({
      language: "python",
      code: "print(17 * 23)",
    });
    // Judge0/Godbolt remote OR verified error clarity
    assert.equal(pyRes.ok, true, `Python sandbox failed (${pyRes.engine}): ${pyRes.stderr}`);
    assert.ok(pyRes.stdout.includes("391"));

    return { detail: `JS (${jsRes.engine}) + Python (${pyRes.engine}) executed cleanly` };
  }, { maxRetries: 2, retryDelayMs: 1200 });

  // 5. HONEST CAPABILITY & SIDECAR GATES
  await runCheck("capability_registry_sidecar_honesty", "Worker & Capability Registry", async () => {
    const disc = await discoverDynamicCapabilities();
    assert.ok(disc.capabilities.length >= 6);
    const stem = await executeAudioSeparateTask({ audioBase64: "ZHVtbXk=" });
    assert.equal(stem.honestStatus, "worker_required");
    const mesh3d = await executeThreeDGenerateTask({ prompt: "chair" });
    assert.equal(mesh3d.honestStatus, "partial_catalog_and_script");
    assert.equal(mesh3d.executedServerSide, false);
    return { detail: `${disc.capabilities.length} dynamic capabilities discovered with zero fake worker fabrication` };
  });

  // 6. STUDIO DIFFUSION IMAGE + WEB RESEARCH
  await runCheck("studio_image_pollinations_live", "Image Studio Diffusion", async () => {
    const imgUrl = generateProductImageUrl("minimalist artisan Moroccan ceramic coffee cup studio lighting");
    const res = await fetch(imgUrl, { signal: AbortSignal.timeout(18000) });
    assert.equal(res.status, 200, `Pollinations HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    assert.ok(ct.startsWith("image/"), `Unexpected content-type: ${ct}`);
    const buf = Buffer.from(await res.arrayBuffer());
    assert.ok(buf.length > 2000, `Image too small: ${buf.length}B`);
    fs.writeFileSync(path.join(artifactsDir, "sample_studio.jpg"), buf);
    return { artifactBytes: buf.length, detail: `HTTP 200 ${ct}, ${buf.length} bytes, sha256=${crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12)}` };
  }, { maxRetries: 3, retryDelayMs: 1500 });

  await runCheck("unrestricted_web_research_live", "Unrestricted Web Research", async () => {
    const search = await runUnrestrictedWebResearch({ query: "Nador Morocco", lang: "en" });
    assert.equal(search.ok, true);
    assert.ok((search.results?.length || 0) >= 1, "No search results returned");
    const blocked = await runUnrestrictedWebResearch({ url: "http://169.254.169.254/latest/meta-data/" });
    assert.equal(blocked.ok, false);
    return { detail: `Source=${search.source}, hits=${search.results?.length || 0}, SSRF blocked` };
  }, { maxRetries: 2, retryDelayMs: 1000 });

  // 7. ALL 34 LIVE PUBLIC APIs IN `public-apis-hub.ts`
  const apiQueries: Array<[PublicApiCategory, string, string?]> = [
    ["openfoodfacts", "nutella"],
    ["openbeautyfacts", "shampoo"],
    ["openproductfacts", "keyboard"],
    ["fx_rates", "MAD", "USD"],
    ["crypto_market", "bitcoin"],
    ["weather", "Nador"],
    ["geocode", "Nador, Morocco"],
    ["b2b_overpass", "pharmacy"],
    ["gleif_company", "Maroc Telecom"],
    ["country_info", "Morocco"],
    ["wikipedia", "Nador"],
    ["wikidata_sparql", "Nador"],
    ["duckduckgo", "Morocco"],
    ["world_bank", "MA"],
    ["openalex_science", "large language models"],
    ["openfda_drug", "paracetamol"],
    ["pubmed_papers", "diabetes"],
    ["soilgrids_agri", "35.1688,-2.9335"],
    ["nasa_power_agri", "35.1688,-2.9335"],
    ["paleobiology_fossils", "Trilobita"],
    ["open_tree_of_life", "Homo sapiens"],
    ["patents_inventor", "solar"],
    ["nobel_prize", "physics"],
    ["hacker_news", "ai"],
    ["remote_jobs", "typescript"],
    ["iconify_logos", "stripe"],
    ["openverse_media", "morocco architecture"],
    ["met_museum", "islamic geometric"],
    ["polyhaven_3d", "wood"],
    ["transit_stops", "35.1688,-2.9335"],
    ["smart_city_poi", "35.1688,-2.9335"],
    ["air_quality", "35.1688,-2.9335"],
    ["nador_marine_weather", "Nador"],
    ["cyber_threat_intel", "openssl"],
  ];
  assert.equal(apiQueries.length, PUBLIC_APIS_CATALOG_COUNT, "Missing PublicApiCategory test case!");

  for (const [category, q, base] of apiQueries) {
    await runCheck(`public_api_${category}`, "34 Public APIs Live", async () => {
      const r = await queryPublicApiHub({ category, query: q, base, limit: 3, ttlMs: 1000 });
      assert.equal(r.ok, true, `${category} failed: ${r.error}`);
      assert.ok(r.data !== undefined && r.data !== null, `${category} empty payload`);
      const serialized = JSON.stringify(r.data);
      assert.ok(serialized.length > 10, `${category} payload too short: ${serialized}`);
      return { artifactBytes: serialized.length, detail: `source=${r.sourceUrl || category} (${serialized.length}B JSON)` };
    }, { maxRetries: 3, retryDelayMs: 1200 });
  }

  // SUMMARY & SELF-REPORTING
  const totalTested = results.length;
  const passed = results.filter((r) => r.status !== "failed");
  const firstPassCount = results.filter((r) => r.firstPassOk).length;
  const healedCount = results.filter((r) => r.status === "healed_passed").length;
  const failed = results.filter((r) => r.status === "failed");
  const totalArtifactBytes = results.reduce((sum, r) => sum + r.artifactBytes, 0);
  const avgLatencyMs = Math.round(results.reduce((s, r) => s + r.durationMs, 0) / Math.max(1, totalTested));

  console.log("\n================= YUKA E2E SUMMARY =================");
  console.log(`Total Tested:        ${totalTested}`);
  console.log(`First-Pass Success:  ${firstPassCount}`);
  console.log(`Self-Healed Retried: ${healedCount}`);
  console.log(`Total Passed:        ${passed.length}/${totalTested} (${((passed.length / totalTested) * 100).toFixed(1)}%)`);
  console.log(`Failed:              ${failed.length}`);
  console.log(`Avg Latency:         ${avgLatencyMs} ms`);
  console.log(`Total Valid Bytes:   ${totalArtifactBytes.toLocaleString()} bytes`);

  if (failed.length > 0) {
    console.log("\n--- FAILURES ---");
    for (const f of failed) {
      console.error(`[FAIL] ${f.id} (${f.group}): ${f.detail}`);
    }
  }

  // Write JSON raw log for audit
  fs.writeFileSync(
    path.join(artifactsDir, "last-run-metrics.json"),
    JSON.stringify({ timestamp: new Date().toISOString(), totalTested, firstPassCount, healedCount, passedCount: passed.length, failedCount: failed.length, avgLatencyMs, totalArtifactBytes, results }, null, 2)
  );

  // Only generate/update YUKA_FINAL_100_PERCENT_TEST_RESULTS.md when 100% of runnable checks pass!
  if (failed.length === 0) {
    const mdLines = [
      `# YUKA / HEYUKA — 100% Real End-to-End Test Results (\`v14.1\` – \`v15.2\` + \`v16.0\`)`,
      ``,
      `Generated automatically by [\`tests/yuka-full-e2e/run-all-sources-forever.mjs\`](./tests/yuka-full-e2e/run-all-sources-forever.mjs) at \`${new Date().toISOString()}\`.`,
      ``,
      `## Telemetry Summary`,
      ``,
      `| Metric | Measured Value |`,
      `| :--- | :--- |`,
      `| **Total Tested** | \`${totalTested}\` real checks (plus \`1,050\` property/fuzz inputs inside \`fuzz_security_zero_cost_1050\`) |`,
      `| **First-Pass Success** | \`${firstPassCount}\` (\`${((firstPassCount / totalTested) * 100).toFixed(1)}%\`) |`,
      `| **Self-Healed & Retried** | \`${healedCount}\` |`,
      `| **Final Pass Rate** | **\`${passed.length}/${totalTested} (100.0%)\`** |`,
      `| **Average Check Latency** | \`${avgLatencyMs} ms\` |`,
      `| **Total Valid Artifacts & Verified Payloads Generated** | \`${totalArtifactBytes.toLocaleString()}\` bytes (\`PDF\`, \`XLSX\`, \`DOCX\`, \`PKZIP\`, \`Three.js JSON\`, \`Studio JPEG\`, live API JSON payloads) |`,
      ``,
      `## Detailed Verification Matrix`,
      ``,
      `| Check ID | Group | Outcome | Attempts | Latency | Verified Detail |`,
      `| :--- | :--- | :--- | :---: | :---: | :--- |`,
      ...results.map(
        (r) =>
          `| \`${r.id}\` | ${r.group} | ${r.status === "passed" ? "PASS" : "HEALED_PASS"} | ${r.attempts} | ${r.durationMs} ms | ${r.detail.replace(/\|/g, "\\|")} |`
      ),
      ``,
      `## Environment & Host Binary Transparency`,
      ``,
      `All runnable in-repo modules, datasets (\`v15.1\` 22 + \`v15.2\` 56 + \`v14.x\` ${V14_EVAL_CHAOS_EVOLUTION_STACK.length}), security/zero-cost shields, real document/archive/3D artifacts, polyglot sandbox execution, studio image diffusion, and all \`34\` no-key public API categories ran live against zero-mock code.`,
      ``,
      `Optional native host binaries not installed in this Linux WSL build container were **never fabricated or simulated as passed**:`,
      `- \`playwright\` / \`chromium\` headless browser binary (not installed on host / not in \`package.json\`)`,
      `- \`ffmpeg\` media transcode binary (not installed on host — guarded via worker-required gate)`,
      `- \`cargo\` desktop Tauri GTK headers (\`pkg-config\`, \`gdk-3.0\`, \`libsoup-3.0\` absent on WSL — Linux/Windows native target builds run on desktop/CI runner)`,
      ``,
    ];
    fs.writeFileSync(path.join(process.cwd(), "YUKA_FINAL_100_PERCENT_TEST_RESULTS.md"), mdLines.join("\n"));
    console.log("\n[YUKA-E2E] Wrote YUKA_FINAL_100_PERCENT_TEST_RESULTS.md (100% PASS)");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[YUKA-E2E FATAL]", err);
  process.exit(1);
});
