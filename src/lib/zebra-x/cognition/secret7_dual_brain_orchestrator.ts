import fs from "node:fs";
import path from "node:path";
import { getSelfPlayTelemetry } from "@/lib/zebra-x/evolution/secret1_self_play_bridge";
import { listForgedTools } from "@/lib/zebra-x/evolution/secret5_tool_forge";
import { runMctsDeepReasoner, type MctsSolveResult } from "./secret2_mcts_reasoner";
import { synthesizeCrossDomainInvention, type CrossDomainInventionResult } from "./secret4_fluid_invention";
import { runAdversarialSwarmCouncil, type CouncilDebateResult } from "./secret6_adversarial_council";
import { simulateKaspiMarketWorld, type KaspiMarketSimResult } from "@/lib/zebra-x/simulation/secret3_world_sim";
import { getSevenSecretsCatalogSummary } from "./v87-secrets-catalog";
import type { ElasticScaleMode, StudioBrand } from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";

export interface System1CacheEntry {
  key: string;
  answerMarkdown: string;
  pathway: "system1_intuition" | "system2_deep_pipeline";
  confidence: number;
  createdAt: number;
  hits: number;
}

export interface EpisodicAssociation {
  concept: string;
  relatedConcepts: string[];
  wisdomNotes: string[];
  score: number;
}

export interface ProactiveForesightResult {
  warnings: string[];
  followUpChips: string[];
  domainSignal: string;
}

export interface OmniMindResult {
  ok: true;
  pathway: "system1_intuition" | "system2_deep_pipeline";
  cacheHit: boolean;
  latencyMs: number;
  sub15msIntuition: boolean;
  episodicRecalls: EpisodicAssociation[];
  proactiveForesight: ProactiveForesightResult;
  selfPlayElo: number;
  forgedToolsAvailable: number;
  mcts?: MctsSolveResult;
  marketSimulation?: KaspiMarketSimResult;
  crossDomainSynthesis?: CrossDomainInventionResult;
  adversarialCouncil?: CouncilDebateResult;
  unifiedPromptDirective: string;
  summaryMarkdown: string;
}

const MAX_SYSTEM1_CACHE = 256;
const SYSTEM1_TTL_MS = 2 * 60 * 60 * 1000;
const system1Cache = new Map<string, System1CacheEntry>();

interface EpisodicGraphData {
  edges: Record<string, Record<string, number>>;
  notes: Record<string, string[]>;
}

let graphLoaded = false;
const episodicGraph: EpisodicGraphData = {
  edges: {
    tva: { decimal: 5, dgi: 4, kaspi: 4, invoice: 3 },
    stock: { eoq: 4, restock: 4, margin: 3, kaspi: 4 },
    security: { ssrf: 4, sql: 4, eval: 4, sandbox: 3 },
    arabic: { rtl: 5, bdi: 4, pdf: 3 },
  },
  notes: {
    tva: ["Compute Morocco MAD centimes & TVA (20%/14%/10%/7%/0%) via Decimal, never raw floats."],
    stock: ["Monitor restock threshold >= daily demand * leadDays + safety buffer to avoid stockout days."],
    security: ["Pass all scripts through Secret #5 AST/V8 VM sandbox & Secret #6 Red-Team Security Veto."],
    arabic: ["Always enforce dir=\"rtl\" or <bdi> isolation when mixing Arabic prose with English/code."],
  },
};

function graphFilePath(): string {
  return path.join("/tmp/heyuka-vault", "episodic-graph.json");
}

function ensureGraphLoaded(): void {
  if (graphLoaded) return;
  graphLoaded = true;
  try {
    const fp = graphFilePath();
    if (fs.existsSync(fp)) {
      const parsed = JSON.parse(fs.readFileSync(fp, "utf8"));
      if (parsed?.edges && parsed?.notes) {
        Object.assign(episodicGraph.edges, parsed.edges);
        Object.assign(episodicGraph.notes, parsed.notes);
      }
    }
  } catch {
    // ROFS safe
  }
}

function extractConcepts(text: string): string[] {
  const words = String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  return Array.from(new Set(words)).slice(0, 10);
}

/**
 * Secret #7 Associative Memory (Titans / HippoRAG): records co-occurring concept edges & durable notes.
 */
export function recordEpisodeConcept(text: string, wisdomNote?: string): void {
  ensureGraphLoaded();
  const concepts = extractConcepts(text);
  for (let i = 0; i < concepts.length; i++) {
    const a = concepts[i];
    if (!episodicGraph.edges[a]) episodicGraph.edges[a] = {};
    for (let j = i + 1; j < concepts.length; j++) {
      const b = concepts[j];
      if (!episodicGraph.edges[b]) episodicGraph.edges[b] = {};
      episodicGraph.edges[a][b] = (episodicGraph.edges[a][b] || 0) + 1;
      episodicGraph.edges[b][a] = (episodicGraph.edges[b][a] || 0) + 1;
    }
    if (wisdomNote && concepts.length > 0 && i === 0) {
      const prev = episodicGraph.notes[a] || [];
      if (!prev.includes(wisdomNote)) {
        episodicGraph.notes[a] = [...prev.slice(-3), wisdomNote];
      }
    }
  }
  try {
    fs.mkdirSync("/tmp/heyuka-vault", { recursive: true });
    fs.writeFileSync(graphFilePath(), JSON.stringify(episodicGraph, null, 2), "utf8");
  } catch {
    // ROFS safe
  }
}

/**
 * 2-Hop HippoRAG Associative Recall across episodic concept graph.
 */
export function recallAssociativeContext(query: string, limit = 4): EpisodicAssociation[] {
  ensureGraphLoaded();
  const seeds = extractConcepts(query);
  // Also bridge Arabic keywords to core anchors cleanly
  if (/(ضريبة|فاتورة|درهم|مبيعات|متجر|مخزون|كاشير)/i.test(query)) seeds.push("tva", "stock");
  if (/(ثغرة|أمان|كود|برمجة)/i.test(query)) seeds.push("security");
  if (/[\u0600-\u06FF]/.test(query)) seeds.push("arabic");

  const scored = new Map<string, number>();
  for (const seed of seeds) {
    if (episodicGraph.edges[seed] || episodicGraph.notes[seed]) {
      scored.set(seed, (scored.get(seed) || 0) + 3);
    }
    const hop1 = episodicGraph.edges[seed] || {};
    for (const [nb1, w1] of Object.entries(hop1)) {
      scored.set(nb1, (scored.get(nb1) || 0) + w1 * 1.5);
      const hop2 = episodicGraph.edges[nb1] || {};
      for (const [nb2, w2] of Object.entries(hop2)) {
        scored.set(nb2, (scored.get(nb2) || 0) + w2 * 0.5);
      }
    }
  }

  return Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([concept, score]) => ({
      concept,
      relatedConcepts: Object.keys(episodicGraph.edges[concept] || {}).slice(0, 5),
      wisdomNotes: episodicGraph.notes[concept] || [],
      score: Number(score.toFixed(2)),
    }));
}

/**
 * Proactive Foresight & Anticipatory Follow-Up Chips (Secret #7 Part C).
 */
export function generateProactiveForesight(params: {
  prompt: string;
  brand: StudioBrand;
  locale: "ar" | "fr" | "en";
}): ProactiveForesightResult {
  const p = params.prompt || "";
  const isAr = params.locale === "ar";
  const warnings: string[] = [];

  if (/(tva|ttc|invoice|margin|stock|pos|كاشير|مخزون|ضريبة|فاتورة)/i.test(p) || params.brand === "kaspi_pos") {
    warnings.push(
      isAr
        ? "تنبيه استباقي (KASPI): تحقق من هامش التوريد ومهلة التوصيل قبل تعديل الأسعار أو التخفيضات."
        : "Proactive KASPI Alert: Verify restock lead-time buffer & Decimal centime TVA rounding before committing price edits."
    );
  }
  if (/(code|script|api|sql|react|html|كود|برمجة|تطبيق|موقع)/i.test(p)) {
    warnings.push(
      isAr
        ? "تنبيه هندسي: يفضّل تمرير الكود عبر الصندوق المعزول (Sandbox) وفحص Red-Team قبل الاعتماد."
        : "Proactive Eng Alert: Verify generated modules in isolated VM sandbox & Red-Team audit before delivery."
    );
  }

  const chips = isAr
    ? params.brand === "kaspi_pos"
      ? [
          "شغّل محاكاة السوق 30 يوماً (KASPI Market Sim)",
          "احسب نقطة إعادة الطلب (EOQ) والهامش بعد TVA",
          "افحص التقرير بمجلس النقد المالي (12-Mind Audit)",
        ]
      : [
          "اختبر الكود والفكرة عبر شجرة MCTS العميقة",
          "اصنع أداة مخصصة قابلة لإعادة الاستخدام (Voyager Tool Forge)",
          "اعرض تحليل المبادئ الأولى والابتكار TRIZ",
        ]
    : params.brand === "kaspi_pos"
    ? [
        "Run 30-day KASPI Market & Queue Simulation",
        "Audit MAD TVA & EOQ Restock Margin",
        "Run 12-Mind Financial Red-Team Review",
      ]
    : [
        "Deepen with MCTS Tree Search + s1 Checks",
        "Forge reusable verified Voyager micro-tool",
        "Synthesize TRIZ Cross-Domain Blueprint",
      ];

  return {
    warnings,
    followUpChips: chips,
    domainSignal: params.brand === "kaspi_pos" ? "kaspi_retail_foresight" : "engineering_foresight",
  };
}

function buildSystem1CacheKey(prompt: string, brand: StudioBrand, locale: string): string {
  return `${brand}::${locale}::${String(prompt || "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 220)}`;
}

function isSimpleSystem1Reflex(prompt: string): boolean {
  const clean = (prompt || "").trim();
  if (clean.length <= 40 && /^(hi|hello|hey|salam|bonjour|salut|مرحبا|السلام|اهلا|أهلا|كيف حالك|شكرا|merci|thanks)[!?.،\s]*$/i.test(clean)) {
    return true;
  }
  return false;
}

export function clearSystem1CacheForTesting(): void {
  system1Cache.clear();
}

export function getSevenSecretsSystemStatus() {
  ensureGraphLoaded();
  return {
    ok: true,
    architecture: "v87.0-v87.7 Seven Super-Intelligence Secrets",
    system1CacheSize: system1Cache.size,
    episodicConceptsCount: Object.keys(episodicGraph.edges).length,
    forgedTools: listForgedTools(),
    selfPlayTelemetry: getSelfPlayTelemetry(),
    catalog: getSevenSecretsCatalogSummary(),
  };
}

/**
 * Master Unified Cognitive Pipeline orchestrating Secrets #1 through #7:
 * - System-1 Sub-15ms Intuition Fast Path (cached patterns & reflex greetings)
 * - Automatic Escalation -> System-2 Deep Logic (MCTS + Simulation + Cross-Domain TRIZ + Forged Skills + 12-Mind Adversarial Council + Episodic Memory + Proactive Foresight)
 */
export async function runOmniMindSevenSecrets(params: {
  prompt: string;
  brand?: StudioBrand;
  locale?: "ar" | "fr" | "en";
  scale?: ElasticScaleMode;
  thinkingBudget?: number;
  forceSystem2?: boolean;
  includeSimulation?: boolean;
  includeInvention?: boolean;
  draftArtifact?: string;
}): Promise<OmniMindResult> {
  const t0 = performance.now();
  const brand: StudioBrand = params.brand ?? "heyuka";
  const locale: "ar" | "fr" | "en" = params.locale ?? "ar";
  const isAr = locale === "ar";
  const cacheKey = buildSystem1CacheKey(params.prompt, brand, locale);

  const cached = !params.forceSystem2 ? system1Cache.get(cacheKey) : undefined;
  const episodicRecalls = recallAssociativeContext(params.prompt, 4);
  const proactiveForesight = generateProactiveForesight({ prompt: params.prompt, brand, locale });
  const selfPlayState = getSelfPlayTelemetry();
  const forgedToolsCount = listForgedTools().length;

  // 1. System-1 Fast Path (< 15ms)
  if ((cached && Date.now() - cached.createdAt < SYSTEM1_TTL_MS) || (!params.forceSystem2 && isSimpleSystem1Reflex(params.prompt))) {
    if (cached) cached.hits += 1;
    const reflexMarkdown =
      cached?.answerMarkdown ||
      (isAr
        ? `⚡ **الحدس الفوري (System-1 Intuition):** مرحباً بك في ${brand === "kaspi_pos" ? "KASPI POS" : "HEYUKA"}! الذاكرة السريعة وجاهزية الأسرار الـ 7 مفعّلة بالكامل.`
        : `⚡ **System-1 Intuition:** Ready in ${brand === "kaspi_pos" ? "KASPI POS" : "HEYUKA"} with all 7 Cognitive Secrets active.`);

    const latencyMs = Number((performance.now() - t0).toFixed(3));
    return {
      ok: true,
      pathway: "system1_intuition",
      cacheHit: Boolean(cached),
      latencyMs,
      sub15msIntuition: latencyMs < 15,
      episodicRecalls,
      proactiveForesight,
      selfPlayElo: selfPlayState.elo,
      forgedToolsAvailable: forgedToolsCount,
      unifiedPromptDirective: `[SYSTEM-1 SUB-15ms PATHWAY | Latency=${latencyMs}ms | ForgedTools=${forgedToolsCount}] Respond cleanly and crisply.`,
      summaryMarkdown: reflexMarkdown,
    };
  }

  // 2. System-2 Deep Multi-Secret Pipeline (MCTS + Simulation + Cross-Domain TRIZ + 12-Mind Adversarial Council)
  const shouldSimMarket =
    params.includeSimulation ||
    brand === "kaspi_pos" ||
    /(pos|kaspi|stock|queue|margin|inventory|cashier|pricing|متجر|مخزون|كاشير|مبيعات|أرباح)/i.test(params.prompt);
  const shouldInvent =
    params.includeInvention ||
    /(invent|design|architecture|novel|patent|optimize|triz|law|صمم|ابتكر|فكرة|هندسة|اختراع|قانون)/i.test(params.prompt);

  const mcts = await runMctsDeepReasoner({
    prompt: params.prompt,
    thinkingBudget: params.thinkingBudget ?? 8192,
    locale,
    brand,
  });

  const marketSimulation = shouldSimMarket ? simulateKaspiMarketWorld({ days: 30 }) : undefined;
  const crossDomainSynthesis = shouldInvent ? synthesizeCrossDomainInvention({ challenge: params.prompt }) : undefined;

  const adversarialCouncil = runAdversarialSwarmCouncil({
    prompt: params.prompt,
    draftArtifact: params.draftArtifact,
    scale: params.scale ?? "auto",
    brand,
    locale,
  });

  recordEpisodeConcept(
    params.prompt,
    mcts.verifiedMath?.ok ? `Verified computation ${mcts.verifiedMath.expression}=${mcts.verifiedMath.result}` : undefined
  );

  const sections = [
    mcts.summaryMarkdown,
    marketSimulation
      ? isAr
        ? `\n### 🏬 محاكاة السوق والمتجر (30 يوماً — KASPI POS Sim)\n- المبيعات المتوقعة: \`${marketSimulation.projectedRevenueMad.toLocaleString()} MAD\` • صافي الربح: \`${marketSimulation.projectedNetProfitMad.toLocaleString()} MAD\`\n- متوسط الانتظار: \`${marketSimulation.avgWaitMinutes} د\` • أيام النفاد: \`${marketSimulation.stockoutDays}\` • الموصى به: \`${marketSimulation.recommendedCashierLanes}\` صناديق`
        : `\n### 🏬 Market & Store Queue Simulation (30d)\n- Revenue: \`${marketSimulation.projectedRevenueMad.toLocaleString()} MAD\`, Net Profit: \`${marketSimulation.projectedNetProfitMad.toLocaleString()} MAD\`, Avg Wait: \`${marketSimulation.avgWaitMinutes}m\`, Stockout Days: \`${marketSimulation.stockoutDays}\`, Optimal Cashiers: \`${marketSimulation.recommendedCashierLanes}\``
      : "",
    crossDomainSynthesis
      ? isAr
        ? `\n### 💡 التوليف العابر للعلوم (TRIZ + First Principles)\n- الجسر العلمي: **${crossDomainSynthesis.crossDomainBridge.sourceScience}** (${crossDomainSynthesis.crossDomainBridge.transferredLaw})\n- المبدأ التطبيقي: ${crossDomainSynthesis.crossDomainBridge.concreteDesign}`
        : `\n### 💡 Cross-Domain TRIZ Synthesis\n- Science Bridge: **${crossDomainSynthesis.crossDomainBridge.sourceScience}** (${crossDomainSynthesis.crossDomainBridge.transferredLaw})\n- Blueprint: ${crossDomainSynthesis.crossDomainBridge.concreteDesign}`
      : "",
    isAr
      ? `\n### 🛡️ مجلس العقول والهجوم الأحمر (${adversarialCouncil.activeMindsCount} عقول)\n- النتيجة: \`${adversarialCouncil.summaryBadge}\` • الإجماع: \`${adversarialCouncil.consensusPct}%\``
      : `\n### 🛡️ ${adversarialCouncil.activeMindsCount}-Mind Adversarial Council\n- Result: \`${adversarialCouncil.summaryBadge}\` • Consensus: \`${adversarialCouncil.consensusPct}%\``,
  ].filter(Boolean);

  const summaryMarkdown = sections.join("\n");

  // Store into System-1 Cache so repeat queries become instant <15ms hits
  if (system1Cache.size >= MAX_SYSTEM1_CACHE) {
    const oldest = system1Cache.keys().next().value;
    if (oldest) system1Cache.delete(oldest);
  }
  system1Cache.set(cacheKey, {
    key: cacheKey,
    answerMarkdown: summaryMarkdown,
    pathway: "system2_deep_pipeline",
    confidence: mcts.confidence,
    createdAt: Date.now(),
    hits: 1,
  });

  const latencyMs = Number((performance.now() - t0).toFixed(2));
  const unifiedPromptDirective = [
    `[7-SECRETS OMNI-MIND ACTIVE | Elo=${selfPlayState.elo} | MCTSNodes=${mcts.exploredNodesCount} (${Math.round(mcts.confidence * 100)}%) | Council=${adversarialCouncil.activeMindsCount} minds (${adversarialCouncil.consensusPct}%)]`,
    mcts.verifiedMath?.ok ? `Verified Exact Math: ${mcts.verifiedMath.expression} = ${mcts.verifiedMath.result}` : "",
    marketSimulation ? `Store Simulation(30d): Revenue=${marketSimulation.projectedRevenueMad} MAD, Profit=${marketSimulation.projectedNetProfitMad} MAD, Wait=${marketSimulation.avgWaitMinutes}m` : "",
    adversarialCouncil.securityVetoTriggered
      ? `RED-TEAM SECURITY VETO: Fix critical findings (${adversarialCouncil.redTeamFindings.map((f) => f.constructivePatch).join("; ")})`
      : "",
    proactiveForesight.warnings.length > 0 ? `Foresight: ${proactiveForesight.warnings[0]}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    ok: true,
    pathway: "system2_deep_pipeline",
    cacheHit: false,
    latencyMs,
    sub15msIntuition: latencyMs < 15,
    episodicRecalls,
    proactiveForesight,
    selfPlayElo: selfPlayState.elo,
    forgedToolsAvailable: forgedToolsCount,
    mcts,
    marketSimulation,
    crossDomainSynthesis,
    adversarialCouncil,
    unifiedPromptDirective,
    summaryMarkdown,
  };
}
