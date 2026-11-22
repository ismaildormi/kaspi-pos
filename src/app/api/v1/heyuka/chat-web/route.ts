import { NextRequest, NextResponse } from "next/server";
import {
  getTotalIntegratedCapabilitiesCount,
  resolveStrictCategoryDisambiguation,
} from "@/lib/zebra-x/core/cognitive-brain-registry";
import {
  buildAirGappedOfflineManifest,
  buildBrowserFactoryPlan,
  planAndRunElasticCouncilSwarm,
  type ElasticScaleMode,
  type StudioBrand,
} from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";
import {
  buildSovereignOsAndFileSurgeonPlan,
  buildUnstoppableAiComputerAction,
  spawnVirtualDesktopBot,
} from "@/lib/heyuka/os/sovereign-pc-commander";
import { z } from "zod";
import { getRequestContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";
import { generateTextWithRouter } from "@/lib/ai-router";
import { runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";
import { executePolyglotCodeSandbox, type SandboxLanguage } from "@/lib/zebra-x/tools/code-sandbox";
import { planXZebraToolRoute } from "@/lib/zebra-x/core/router";
import { buildPhotorealisticCinemaVideoBundle } from "@/lib/heyuka/tools/photorealistic-video-builder";
import { recordProductSelfEvolution } from "@/lib/heyuka/learning/self-evolution-engine";
import { searchSovereignVault } from "@/lib/heyuka/vault/sovereign-permanent-vault";
import { buildLevel1SkillPromptIndex } from "@/lib/zebra-x/core/skills-vault";
import {
  PUBLIC_APIS_CATALOG_COUNT,
  queryPublicApiHub,
  type PublicApiCategory,
} from "@/lib/zebra-x/tools/public-apis-hub";
import { scanSourceCodeForVulnerabilities } from "@/lib/zebra-x/tools/security-sast-auditor";
import { renderStyledBrandQrSvg } from "@/lib/zebra-x/tools/qr-architect-engine";
import { ALL_SOVEREIGN_MASTER_CATALOG } from "@/lib/zebra-x/core/v20-v22-master-catalog";
import { runPreReplyReflectionGate } from "@/lib/zebra-x/core/reflection-gate";
import {
  buildFullCapabilitiesAndSourcesMarkdown,
  buildPatentBlueprintAndPdfMarker,
  classifyCognitiveIntentAndSources,
  isCapabilitiesOrSourcesTableRequest,
  isPatentOrInventionRequest,
} from "@/lib/zebra-x/core/cognitive-brain-registry";
import {
  buildStructuredDiscourseDirective,
  detectUniversalWorldLanguage,
  isLocalApiOrSdkRequest,
  runLocalOnDeviceHeyukaBrain,
} from "@/lib/heyuka/local-sovereign-brain";
import {
  buildCodeToMediaArtifactSvg,
  buildPackaged3DGameBlueprint,
  buildRoboticsActionBlueprint,
  buildSelfContainedWebSiteBlueprint,
  detectTruncationState,
  extractStudioFilesSafe,
  mergeContinuationChunk,
  repairTruncatedMarkdownAndCode,
  type BuilderStudioFile,
} from "@/lib/heyuka/autonomous-builder-v24-v28";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export type HeyukaRequestedMode =
  | "auto"
  | "chat"
  | "deepthink"
  | "search"
  | "coding"
  | "image"
  | "video"
  | "audio"
  | "3d"
  | "security"
  | "qr"
  | "mobile"
  | "studio"
  | "council"
  | "pc_bot"
  | "os_exec"
  | "ai_pc"
  | "browser_factory"
  | "team"
  | "offline";

const WebChatRequestSchema = z.object({
  action: z.enum(["chat", "web_research", "sandbox_execute", "pos_snapshot"]).default("chat"),
  url: z.string().max(2000).optional(),
  query: z.string().max(1000).optional(),
  language: z.string().max(32).optional(),
  code: z.string().max(16000).optional(),
  stdin: z.string().max(4000).optional(),
  systemInstruction: z.string().max(12000).optional(),
  model: z.string().max(64).default("heyuka-omni"),
  elasticScale: z
    .enum(["auto", "3x_fast", "6x_pro", "12x_titan"])
    .default("auto"),
  brand: z.enum(["heyuka", "kaspi_pos"]).default("heyuka"),
  executionPolicy: z.enum(["turbo", "auto", "review"]).default("auto"),
  mode: z.string().max(48).default("auto"),
  deepThink: z.boolean().default(false),
  webSearch: z.boolean().default(false),
  locale: z.enum(["ar", "fr", "en"]).default("en"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(32000),
      })
    )
    .max(30)
    .default([]),
  imageBase64: z.string().max(8_000_000).optional(),
  audioTranscriptNote: z.string().max(4000).optional(),
  workspaceFiles: z
    .array(
      z.object({
        path: z.string().max(180),
        language: z.string().max(32).optional(),
        content: z.string().max(18000),
      })
    )
    .max(12)
    .optional(),
});

interface ExtractedStudioFile {
  path: string;
  language: string;
  content: string;
}

interface ThinkingPhaseStep {
  phase: string;
  agentModel: string;
  summary: string;
  durationMs: number;
  timestamp: string;
}

function detectSmartMode(
  requestedMode: HeyukaRequestedMode,
  prompt: string,
  hasCodeContext: boolean,
  hasImageUpload: boolean
): { effectiveMode: Exclude<HeyukaRequestedMode, "auto">; autoSwitched: boolean } {
  if (requestedMode !== "auto" && requestedMode !== "studio") {
    return { effectiveMode: requestedMode, autoSwitched: false };
  }

  const p = prompt.toLowerCase();
  if (
    hasImageUpload &&
    /(ازالة|إزالة|امسح|مسح|حيد|خلي الخلفية|باغراوند|background|remove person|remove people|inpaint|erase|cutout|edit image)/i.test(
      p
    )
  ) {
    return { effectiveMode: "image", autoSwitched: true };
  }
  const looksLikeCodeOrEngineering =
    hasCodeContext ||
    /(```|كود|برمج|تطبيق|موقع|واجهة|ستوديو|سكربت|بوت|playwright|selenium|puppeteer|httpx|beautifulsoup|build|create app|website|dashboard|react|html|css|python|typescript|javascript|script|api|component|game|calculator|scrape|crawler|csv|sql)/i.test(
      p
    );
  const explicitVideoStart =
    /^\s*(?:please\s+|can\s+you\s+)?(?:اصنع\s*فيديو|فيديو|مونتاج|أنيميشن|generate\s+(?:a\s+)?video|create\s+(?:a\s+)?(?:video|clip|reel|animation))\b/i.test(
      prompt
    );
  const explicitAudioStart =
    /^\s*(?:please\s+|can\s+you\s+)?(?:اصنع\s*صوت|موسيقى|نغمة|أغنية|generate\s+(?:an?\s+)?(?:audio|music|beat|soundtrack)|compose\s+)/i.test(
      prompt
    );
  const explicitImageStart =
    /^\s*(?:please\s+|can\s+you\s+)?(?:رسم|ارسم|صاوب\s*صورة|صمم\s*صورة|توليد\s*صورة|draw\s+(?:a|an)?|generate\s+(?:an?\s+)?(?:image|logo|poster|illustration|photo)|create\s+(?:an?\s+)?(?:image|logo|poster|illustration))\b/i.test(
      prompt
    );

  if (looksLikeCodeOrEngineering) {
    return { effectiveMode: "coding", autoSwitched: true };
  }
  if (explicitVideoStart) {
    return { effectiveMode: "video", autoSwitched: true };
  }
  if (explicitAudioStart) {
    return { effectiveMode: "audio", autoSwitched: true };
  }
  if (explicitImageStart) {
    return { effectiveMode: "image", autoSwitched: true };
  }
  if (/(3d|glb|gltf|cad|stl|مجسم|ثلاثي الأبعاد|three\.?js|mesh)/i.test(p)) {
    return { effectiveMode: "3d", autoSwitched: true };
  }
  if (/(\bqr\b|باركود|wifi qr|tlv|vcard)/i.test(p)) {
    return { effectiveMode: "qr", autoSwitched: true };
  }
  if (/(ثغرة|اختبار الاختراق|sast|audit|xss|sqli|csrf|ssrf|cwe|cve|security scan)/i.test(p)) {
    return { effectiveMode: "security", autoSwitched: true };
  }
  if (/(\badb\b|iphone|android|battery health|imei|repair ticket|إصلاح الهاتف|بطارية)/i.test(p)) {
    return { effectiveMode: "mobile", autoSwitched: true };
  }
  if (
    /(بحث|قلب|أخبار|ثمن|سعر|الطقس|الناظور|طريق|مسافة|زلزال|ناسا|طيران|مطار|دواء|وصفة|طبخ|كتاب|سيارة|محرك|workout|recipe|flight|airport|earthquake|route|distance|distance between|obd|recall|drug|book|species|crypto|bitcoin|usd|mad|fx|search|news|weather|price|btc|today|latest|wikipedia)/i.test(
      p
    )
  ) {
    return { effectiveMode: "search", autoSwitched: true };
  }

  return { effectiveMode: requestedMode === "studio" ? "studio" : "chat", autoSwitched: false };
}

function matchPublicApiCategories(prompt: string): PublicApiCategory[] {
  const p = prompt.toLowerCase();
  const picked: PublicApiCategory[] = [];
  if (isPatentOrInventionRequest(p)) picked.push("google_patents");
  if (/(\broute\b|\bdistance\b|\bdirections\b|الطريق|المسافة|\btravel time\b|\bitineraire\b|\bosrm\b)/i.test(p)) picked.push("osrm_routing");
  if (/(\bearthquakes?\b|\bseismic\b|زلزال|زلازل|هزة أرضية)/i.test(p)) picked.push("usgs_earthquakes");
  if (/(\bnasa\b|\bwildfire\b|\beonet\b|قمر صناعي|وكالة ناسا)/i.test(p)) picked.push("nasa_eonet_events");
  if (/(\bobd\b|check engine|\b[pbcu]\d{4}\b|car recall|محرك السيارة|عطل سيارة|\bacura\b|\btoyota\b|\bdacia\b|\brenault\b)/i.test(p)) picked.push("nhtsa_recalls_vehicles");
  if (/(\bdrug\b|\bmedicine\b|\bpharma\b|\brxnav\b|دواء|مضاد حيوي)/i.test(p)) picked.push("rxnav_drugs");
  if (/(\bcovid\b|\bepidemic\b|وباء)/i.test(p)) picked.push("disease_health_stats");
  if (/(\bworkout\b|\bexercise\b|\bgym\b|تمارين رياضية)/i.test(p)) picked.push("wger_workouts");
  if (/(\bopenlibrary\b|\bisbn\b|رواية|مكتبة الكتب)/i.test(p)) picked.push("openlibrary_books");
  if (/(\bspecies\b|\bbiodiversity\b|\bargania\b|\bgbif\b|التنوع البيولوجي)/i.test(p)) picked.push("gbif_biodiversity");
  if (/(\brecipe\b|\bmeal\b|وصفة طبخ|طاجين)/i.test(p)) picked.push("themealdb_recipes");
  if (/(\bflight\b|\bairplane\b|\baircraft\b|\bairport\b|رحلة طيران|مطار)/i.test(p)) picked.push("opensky_flights");
  if (/(\bbtc\b|\bbitcoin\b|\beth\b|\bcrypto\b|عملة رقمية|بيتكوين)/i.test(p)) picked.push("crypto_market");
  if (/(\busd\b|\beur\b|\bmad\b|\bexchange rate\b|\bfx\b|سعر الصرف)/i.test(p)) picked.push("frankfurter_fx");
  if (/(\bweather\b|طقس|درجة الحرارة|\bnador\b|الناظور)/i.test(p)) picked.push("weather");
  if (/(\bcve-\d+|\bexploit\b|ثغرة أمنية)/i.test(p)) picked.push("cyber_threat_intel");
  if (/(\bopenalex\b|\barxiv\b|ورقة بحثية)/i.test(p)) picked.push("openalex_science");
  if (/(\bwikipedia\b|من هو|تاريخ مدينة)/i.test(p)) picked.push("wikipedia");
  return picked.slice(0, 3);
}

/** Picks the richest domain-specific self-contained blueprint if code generation yielded empty/partial output. */
function buildDomainBlueprintFiles(prompt: string, title: string): BuilderStudioFile[] {
  const p = prompt.toLowerCase();
  if (/(game|3d|arena|shooter|racing|platformer|phaser|three|yuka|لعبة|ألعاب|مجسم|مغامرة)/i.test(p)) {
    return buildPackaged3DGameBlueprint(title, prompt);
  }
  if (/(robot|ros|ros2|esp32|arduino|micropython|behavior tree|actuator|روبوت|ذراع|درون)/i.test(p)) {
    return buildRoboticsActionBlueprint(title, prompt);
  }
  return buildSelfContainedWebSiteBlueprint(title, prompt);
}

/** Builds deterministic Markdown summary from live zero-key APIs & web search hits. */
function buildLiveGroundingFallback(
  validApis: Array<{ category: string; sourceUrl?: string; data?: unknown }>,
  sources: Array<{ title: string; url: string; snippet?: string }>,
  locale: "ar" | "fr" | "en",
  effectiveMode: string
): string {
  const sections: string[] = [];
  if (validApis.length > 0) {
    sections.push(
      locale === "ar"
        ? `## نتائج البيانات الحية (${validApis.map((a) => a.category).join(" • ")})`
        : `## Live Real-World Telemetry (${validApis.map((a) => a.category).join(" • ")})`
    );
    for (const api of validApis) {
      sections.push(
        `### ${api.category}${api.sourceUrl ? ` — [Source](${api.sourceUrl})` : ""}\n\n\`\`\`json\n${JSON.stringify(
          api.data,
          null,
          2
        ).slice(0, 1400)}\n\`\`\``
      );
    }
  }
  if (sources.length > 0) {
    sections.push(
      locale === "ar" ? "### المصادر المفتوحة المتحققة" : "### Verified Web & Knowledge Sources"
    );
    sections.push(
      sources
        .slice(0, 6)
        .map((s) => `- **${s.title}**${s.url ? ` — ${s.url}` : ""}${s.snippet ? `: ${s.snippet}` : ""}`)
        .join("\n")
    );
  }
  if (sections.length === 0) {
    return locale === "ar"
      ? `تم تجهيز بيئة التنفيذ محلياً على جهازك (**$0.00**) في وضع **${effectiveMode.toUpperCase()}**.`
      : `Studio workspace initialized locally on your CPU (**$0.00**) in **${effectiveMode.toUpperCase()}** mode.`;
  }
  return sections.join("\n\n");
}

export async function POST(req: NextRequest) {
  // Unlimited zero-owner-cost client-compute execution (no artificial 30/min or 120/day blocker)
  const body = await req.json().catch(() => null);
  const parsed = WebChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid chat request payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  let tenantId: string | undefined;
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    tenantId = ctx.tenantId || undefined;
  } catch {}

  const {
    action,
    url: actionUrl,
    query: actionQuery,
    language: actionLang,
    code: actionCode,
    stdin: actionStdin,
    systemInstruction: callerSystemInstruction,
    model,
    elasticScale,
    brand,
    executionPolicy,
    mode: rawMode,
    deepThink,
    webSearch,
    locale,
    messages: rawMessages,
    imageBase64,
    audioTranscriptNote,
    workspaceFiles,
  } = parsed.data;

  // Integrated Browser Search / URL Reader action (zero-key access for Antigravity Studio IDE)
  if (action === "web_research") {
    const res = await runUnrestrictedWebResearch({
      query: actionQuery,
      url: actionUrl,
      lang: locale,
    });
    return NextResponse.json(res, { status: res.ok ? 200 : 400 });
  }

  // Integrated Terminal Sandbox action (zero-key access for Antigravity Studio IDE)
  if (action === "sandbox_execute") {
    const allowed = new Set<SandboxLanguage>(["python", "javascript", "typescript", "bash", "php", "go", "c++"]);
    const rawLang = String(actionLang || "javascript").toLowerCase();
    const mappedLang: SandboxLanguage = rawLang === "sh" ? "bash" : rawLang === "js" ? "javascript" : rawLang === "py" ? "python" : (rawLang as SandboxLanguage);
    if (!actionCode || !allowed.has(mappedLang)) {
      return NextResponse.json({ ok: false, stderr: "Provide valid language and code.", exitCode: 1 }, { status: 400 });
    }
    const result = await executePolyglotCodeSandbox({
      language: mappedLang,
      code: actionCode,
      stdin: actionStdin,
    });
    return NextResponse.json(result, { status: 200 });
  }

  // Fold any caller-supplied system messages into unified system instruction (never reject with 400!)
  const extraSystemFromMessages = rawMessages
    .filter((m) => m.role === "system")
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join("\n\n");
  const messages = rawMessages.filter((m): m is { role: "user" | "assistant"; content: string } => m.role !== "system");
  if (messages.length === 0) {
    return NextResponse.json({ ok: false, error: "At least one user message is required." }, { status: 400 });
  }
  const mode = (rawMode || "auto") as HeyukaRequestedMode;

  const startedAt = Date.now();
  const thinkingSteps: ThinkingPhaseStep[] = [];
  const lastUser = messages[messages.length - 1].content;
  const effectiveUserText = audioTranscriptNote
    ? `${lastUser}\n\n[Voice / Audio Input]: ${audioTranscriptNote}`
    : lastUser;

  // Detect inline http(s) URLs inside prompt so Agent automatically browses pasted links
  const detectedPromptUrlMatch = lastUser.match(/https?:\/\/[^\s<>"')\]]+/i);
  const autoDetectedUrl = detectedPromptUrlMatch ? detectedPromptUrlMatch[0] : undefined;

  const phase1Start = Date.now();
  const { effectiveMode, autoSwitched } = detectSmartMode(
    mode,
    lastUser,
    Boolean(workspaceFiles && workspaceFiles.length > 0),
    Boolean(imageBase64)
  );
  const resolvedElasticScale: ElasticScaleMode =
    model === "elastic-swarm-12x"
      ? "12x_titan"
      : model === "elastic-swarm-6x"
      ? "6x_pro"
      : model === "multi-agent-3"
      ? "3x_fast"
      : elasticScale;
  const isCollaborative =
    model === "multi-agent-3" ||
    model === "elastic-swarm-6x" ||
    model === "elastic-swarm-12x" ||
    resolvedElasticScale !== "auto" ||
    effectiveMode === "council";
  const suppressThinkTokens = effectiveMode === "coding" || effectiveMode === "3d";
  const effectiveDeepThink =
    deepThink ||
    effectiveMode === "deepthink" ||
    (!suppressThinkTokens && (isCollaborative || effectiveMode === "security"));
  const effectiveSearch = webSearch || effectiveMode === "search";

  const routePlan = planXZebraToolRoute(lastUser, false);
  const skillIndexPrompt = await buildLevel1SkillPromptIndex(lastUser).catch(() => "");
  const integratedTotals = getTotalIntegratedCapabilitiesCount();
  const matchedCatalogCount = Math.max(ALL_SOVEREIGN_MASTER_CATALOG.length, integratedTotals.grandTotalSources);
  const cognitiveRoute = classifyCognitiveIntentAndSources(lastUser, locale);
  const strictCategory = resolveStrictCategoryDisambiguation(lastUser);
  const isPatentQuery = isPatentOrInventionRequest(lastUser);
  const elasticSwarmPlan =
    isCollaborative ||
    strictCategory.categoryCode === "V56_ELASTIC_SWARM" ||
    effectiveMode === "studio"
      ? planAndRunElasticCouncilSwarm({
          prompt: lastUser,
          scale: resolvedElasticScale,
          brand,
          locale,
        })
      : null;

  thinkingSteps.push({
    phase: "Cognitive Brain Pre-Classification & Auto-Router (18 Clusters)",
    agentModel: elasticSwarmPlan
      ? `${elasticSwarmPlan.tier} (${elasticSwarmPlan.nodes.length}x Swarm)`
      : isCollaborative
      ? "heyuka-core (Architect)"
      : model,
    summary: `Route: ${strictCategory.categoryCode} • Clusters: [${cognitiveRoute.stageBadges
      .map((b) => `${b.icon} ${b.label}`)
      .join(" | ")}] • Brand: ${brand.toUpperCase()} • ${PUBLIC_APIS_CATALOG_COUNT} Live APIs + ${matchedCatalogCount}+ Tools`,
    durationMs: Math.max(1, Date.now() - phase1Start),
    timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
  });

  if (elasticSwarmPlan) {
    thinkingSteps.push({
      phase: `Elastic Model Council (${elasticSwarmPlan.nodes.length} Cooperating Agents + ${elasticSwarmPlan.spawnedBots.length} Worker Bots)`,
      agentModel: elasticSwarmPlan.nodes.map((n) => n.id).slice(0, 4).join(", "),
      summary: `Brand=${brand.toUpperCase()} | Tier=${elasticSwarmPlan.tier} | Vault=${elasticSwarmPlan.matchedVaultSources
        .slice(0, 3)
        .map((v) => v.name)
        .join(", ")}`,
      durationMs: 2,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    });
  }

  if (isCapabilitiesOrSourcesTableRequest(lastUser) || isLocalApiOrSdkRequest(lastUser)) {
    const localBrainRes = runLocalOnDeviceHeyukaBrain({
      prompt: lastUser,
      mode: effectiveMode,
      locale,
    });
    return NextResponse.json({
      ok: true,
      answer: localBrainRes.answer,
      reasoning: thinkingSteps
        .map((s) => `• [${s.timestamp}] ${s.phase} (${s.agentModel}, ${s.durationMs}ms): ${s.summary}`)
        .join("\n"),
      thinkingSteps,
      sources: localBrainRes.sources,
      modelUsed: model,
      effectiveMode,
      autoSwitched,
      provider: localBrainRes.provider,
      detectedLanguage: localBrainRes.detectedLanguage,
      executionTimeMs: Math.max(1, Date.now() - phase1Start),
      shouldOpenStudio: true,
      studioFiles: localBrainRes.studioFiles,
    });
  }

  // 2) Parallel Real-World Knowledge, Auto URL Reading & Live Public/POS Grounding
  const phase2Start = Date.now();
  let sources: Array<{ title: string; url: string; snippet?: string }> = [];
  let webContextBlock = "";
  let apiContextBlock = "";
  let posContextBlock = "";

  const shouldProbeLiveApis =
    effectiveSearch || Boolean(autoDetectedUrl) || isPatentQuery || (effectiveMode === "chat" && lastUser.length < 400);
  const apiCats = shouldProbeLiveApis ? matchPublicApiCategories(lastUser) : [];
  const shouldFetchPosSnapshot =
    Boolean(tenantId) &&
    (brand === "kaspi_pos" || /(kaspi|pos|vente|stock|produit|caisse|facture|مبيعات|متجر|مخزون|سلعة|فاتورة)/i.test(lastUser));

  const [searchRes, urlRes, apiResults, posSnapshotRes] = await Promise.all([
    effectiveSearch || Boolean(autoDetectedUrl)
      ? runUnrestrictedWebResearch({ query: lastUser.slice(0, 320), lang: locale }).catch(() => null)
      : Promise.resolve(null),
    autoDetectedUrl
      ? runUnrestrictedWebResearch({ url: autoDetectedUrl, lang: locale }).catch(() => null)
      : Promise.resolve(null),
    apiCats.length > 0
      ? Promise.all(
          apiCats.map((category) =>
            queryPublicApiHub({ category, query: lastUser.slice(0, 120), lang: locale }).catch(
              () => null
            )
          )
        )
      : Promise.resolve([]),
    shouldFetchPosSnapshot && tenantId
      ? (async () => {
          try {
            const [productCount, recentSalesCount, lowStockCount] = await Promise.all([
              prisma.product.count({ where: { tenantId, isActive: true } }),
              prisma.sale.count({ where: { tenantId } }),
              prisma.stockLevel.count({ where: { tenantId, quantity: { lte: 5 } } }),
            ]);
            return { productCount, recentSalesCount, lowStockCount };
          } catch {
            return null;
          }
        })()
      : Promise.resolve(null),
  ]);

  if (posSnapshotRes) {
    posContextBlock = `\n\n[LIVE KASPI POS TENANT STORE CONTEXT]\nActive Products: ${posSnapshotRes.productCount} | Recorded Sales: ${posSnapshotRes.recentSalesCount} | Low Stock Items (<=5): ${posSnapshotRes.lowStockCount}\nStrict Rule: Morocco TTC tax-inclusive pricing & immutable POS Core.`;
  }

  if (urlRes?.ok) {
    const pageMarkdown =
      typeof (urlRes as any).extractedText === "string"
        ? (urlRes as any).extractedText
        : typeof (urlRes as any).markdown === "string"
        ? (urlRes as any).markdown
        : "";
    if (pageMarkdown) {
      webContextBlock += `\n\n[FETCHED URL CONTENT: ${autoDetectedUrl}]\n${pageMarkdown.slice(0, 2600)}`;
    }
    if (autoDetectedUrl) {
      sources.push({ title: String((urlRes as any).title || autoDetectedUrl).slice(0, 160), url: autoDetectedUrl });
    }
  }

  if (searchRes?.ok && Array.isArray(searchRes.results) && searchRes.results.length > 0) {
    sources = [
      ...sources,
      ...searchRes.results.slice(0, 6).map((r) => ({
        title: String(r.title || r.url || "Source").slice(0, 180),
        url: String(r.url || ""),
        snippet: r.snippet ? String(r.snippet).slice(0, 260) : undefined,
      })),
    ];
    webContextBlock +=
      "\n\n[LIVE WEB RESEARCH SOURCES]\n" +
      sources.map((s, idx) => `[${idx + 1}] ${s.title} (${s.url}): ${s.snippet || ""}`).join("\n");
  }

  const validApis = apiResults.filter((r): r is NonNullable<typeof r> => Boolean(r?.ok && r.data));
  if (validApis.length > 0) {
    apiContextBlock =
      "\n\n[LIVE ZERO-KEY REAL-WORLD PUBLIC API TELEMETRY]\n" +
      validApis
        .map((a) => `• ${a.category} (${a.sourceUrl}): ${JSON.stringify(a.data).slice(0, 600)}`)
        .join("\n");
    for (const a of validApis) {
      if (a.sourceUrl) sources.push({ title: `Live API: ${a.category}`, url: a.sourceUrl });
    }
  }

  if (sources.length > 0 || validApis.length > 0) {
    thinkingSteps.push({
      phase: "Real-World Grounding & Zero-Key Feeds",
      agentModel: "heyuka-search",
      summary: `Fetched ${sources.length} verified sources${validApis.length > 0 ? ` (${validApis.map((v) => v.category).join(", ")})` : ""}`,
      durationMs: Math.max(1, Date.now() - phase2Start),
      timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    });
  }

  // 3) Security SAST, QR & v52-v60 Sovereign OS/Swarm/Factory Modules
  let toolSupplementBlock = "";
  let qrSvgMarkup: string | undefined;
  const v52v60StudioFiles: Array<{ path: string; language: string; content: string }> = [];

  if (strictCategory.categoryCode === "V52_PC_BOT_FARM" || effectiveMode === "pc_bot") {
    const botBundle = spawnVirtualDesktopBot({ task: lastUser });
    v52v60StudioFiles.push(
      { path: "virtual-desktop-bot-compose.yml", language: "yaml", content: botBundle.dockerComposeYaml },
      { path: "bot-session.json", language: "json", content: JSON.stringify(botBundle.bot, null, 2) }
    );
    toolSupplementBlock += `\n\n[v52.0 VIRTUAL DESKTOP BOT FARM DISPATCH]\nEndpoint: /api/v1/desktops/spawn | Bot ID: ${botBundle.bot.botId} | Resolution: ${botBundle.bot.resolution} | Tools: ${botBundle.matchedVaultTools.map((t) => t.name).join(", ")}`;
  } else if (strictCategory.categoryCode === "V53_OS_SHELL_SURGEON" || effectiveMode === "os_exec") {
    const osPlan = buildSovereignOsAndFileSurgeonPlan({ action: "shell", command: lastUser.slice(0, 180) });
    if (osPlan.generatedScripts.powershell) {
      v52v60StudioFiles.push({ path: "sovereign-os-surgeon.ps1", language: "powershell", content: osPlan.generatedScripts.powershell });
    }
    if (osPlan.generatedScripts.python) {
      v52v60StudioFiles.push({ path: "file-surgeon-safe.py", language: "python", content: osPlan.generatedScripts.python });
    }
    toolSupplementBlock += `\n\n[v53.0 SOVEREIGN OS SHELL & FILE SURGEON]\nEndpoint: /api/v1/os/exec | POSCoreProtected=${osPlan.safetyChecks.posCoreProtected} | ReversibleBackup=${osPlan.safetyChecks.reversibleBackup || "send2trash"} | PanicStopReady=${osPlan.safetyChecks.panicStopReady}`;
  } else if (strictCategory.categoryCode === "V54_AI_COMPUTER_OS" || effectiveMode === "ai_pc") {
    const aiPc = buildUnstoppableAiComputerAction({ action: "scroll", prompt: lastUser });
    if (aiPc.generatedScripts.python) {
      v52v60StudioFiles.push({ path: "ai-computer-controller.py", language: "python", content: aiPc.generatedScripts.python });
    }
    toolSupplementBlock += `\n\n[v54.0 UNSTOPPABLE AI COMPUTER OS]\nEndpoint: /api/v1/ai-pc/control | Engines: ${aiPc.matchedVaultTools.map((t) => t.name).join(", ")}`;
  } else if (strictCategory.categoryCode === "V57_BROWSER_FACTORY" || effectiveMode === "browser_factory") {
    const bf = buildBrowserFactoryPlan({ projectName: lastUser.slice(0, 32) || "heyuka-cloud-app" });
    v52v60StudioFiles.push({ path: "deploy-factory.sh", language: "bash", content: bf.cliProvisionScript });
    toolSupplementBlock += `\n\n[v57.0-v58.0 BROWSER AUTOPILOT & CLOUD FACTORY]\nEndpoint: /api/v1/studio/browser-factory | Tabs: ${bf.tabsToOrchestrate.map((t) => t.label).join(", ")}`;
  } else if (
    strictCategory.categoryCode === "V60_OFFLINE_AIRGAPPED" ||
    effectiveMode === "offline" ||
    effectiveMode === "team"
  ) {
    const offline = buildAirGappedOfflineManifest();
    v52v60StudioFiles.push({ path: "air-gapped-manifest.json", language: "json", content: JSON.stringify(offline, null, 2) });
    toolSupplementBlock += `\n\n[v59.0-v60.0 MULTIPLAYER & AIR-GAPPED OFFLINE BUNDLE]\nEndpoint: /api/v1/studio/team | Tiers: ${offline.tiers.map((t) => t.title).join(", ")}`;
  }

  if (elasticSwarmPlan) {
    v52v60StudioFiles.push({
      path: "elastic-swarm-council.json",
      language: "json",
      content: JSON.stringify(elasticSwarmPlan, null, 2),
    });
    toolSupplementBlock += `\n\n[ELASTIC MODEL COUNCIL SWARM (${elasticSwarmPlan.nodes.length} AGENTS • ${brand.toUpperCase()})]\nCooperating Specialist Nodes:\n${elasticSwarmPlan.nodes
      .map((n) => `- ${n.role} (${n.focus}): ${n.contributionSummary}`)
      .join("\n")}\nSpawned Worker Bots: ${elasticSwarmPlan.spawnedBots.length}`;
  }

  if (effectiveMode === "security" && lastUser.length > 40) {
    const audit = scanSourceCodeForVulnerabilities(lastUser);
    toolSupplementBlock += `\n\n[SAST SECURITY AUDIT RESULT]\nRiskScore: ${audit.riskScore}/100 | Clean: ${audit.clean} | Findings: ${audit.findings.length}\n${audit.findings
      .map((f) => `- ${f.cwe} (${f.severity}, line ${f.line}): ${f.title} -> Fix: ${f.remediationPatch}`)
      .join("\n")}`;
  }

  if (effectiveMode === "qr") {
    const urlMatch = lastUser.match(/https?:\/\/[^\s]+/i);
    const qrPayload = urlMatch ? urlMatch[0] : "https://kaspi-pos.vercel.app";
    qrSvgMarkup = renderStyledBrandQrSvg({
      payload: qrPayload,
      sizePx: 220,
      foregroundHex: "#0B0D10",
      backgroundHex: "#FFFFFF",
      centerLabel: "HYK",
    });
    toolSupplementBlock += `\n\n[QR ARCHITECT READY]\nGenerated styled SVG QR for "${qrPayload}".`;
  }

  const worldLang = detectUniversalWorldLanguage(lastUser, locale);
  const detectedLang = `${worldLang.name} (${worldLang.nativeName})`;
  const discourseDirective = buildStructuredDiscourseDirective(worldLang);

  const isImageEditRequest =
    Boolean(imageBase64) &&
    /(ازالة|إزالة|امسح|مسح|حيد|خلي الخلفية|باغراوند|background|remove person|remove people|inpaint|erase|cutout|edit)/i.test(
      lastUser
    );

  const modeDirective =
    effectiveMode === "coding"
      ? `\nMODE: CODING STUDIO v27.0 (ANTIGRAVITY SPLIT IDE — MULTI-FILE OUTPUT).
Suppress <think> commentary to save tokens. Output complete runnable separated files with \`path=\` headers (\`\`\`html path=index.html\`, \`\`\`css path=styles.css\`, \`\`\`js path=engine.js\`, \`\`\`js path=yuka-ai.js\`). If creating a website, include real multi-page links & search; if creating a game, include Start Menu, HUD Score/HP, physics, enemy AI & WebAudio SFX.`
      : isImageEditRequest
      ? `\nMODE: VISION IMAGE EDITING & BACKGROUND ISOLATION.
Analyze the uploaded image directly using Vision, describe the detected subjects vs background zones precisely, AND guide the user that HEYUKA Studio has opened the Client-GPU Image Mask / Clean-Background Editor right alongside this chat so they can erase subjects or isolate/download the clean background PNG with $0 server cost.`
      : effectiveMode === "image"
      ? `\nMODE: CODE-TO-IMAGE STUDIO (SVG / P5 / CLIENT GPU CANVAS).
Describe the composition clearly and emit a clean vector graphic inside \`\`\`svg path=artwork.svg\`\`\`. Client Canvas GPU Studio opens automatically.`
      : effectiveMode === "video"
      ? `\nMODE: VIDEO STUDIO (CLIENT 30FPS WEBM RENDERER).
Provide 3 crisp scene titles/lines so Client CPU Video Studio renders a real downloadable .webm video immediately.`
      : effectiveMode === "audio"
      ? `\nMODE: AUDIO & VOICE STUDIO.
Provide clean audio synthesis / track direction; visitor's CPU WebAudio synthesizes playable .wav immediately.`
      : effectiveMode === "3d"
      ? `\nMODE: 3D, GAME & ROBOTICS STUDIO (v26.0–v27.0 SELF-CONTAINED MULTI-FILE).
Suppress <think> commentary. Split complex scenes/games cleanly across \`\`\`html path=index.html\`\`\`, \`\`\`css path=styles.css\`\`\`, \`\`\`js path=yuka-ai.js\`\`\`, and \`\`\`js path=game-engine.js\`\`\` so nothing ever truncates.`
      : "";

  const workspaceSnippet =
    workspaceFiles && workspaceFiles.length > 0
      ? `\n\n[ACTIVE WORKSPACE FILES]\n${workspaceFiles
          .slice(0, 6)
          .map((f) => `--- ${f.path} ---\n${f.content.slice(0, 1500)}`)
          .join("\n")}`
      : "";

  const customRulesBlock = [callerSystemInstruction, extraSystemFromMessages]
    .filter((x) => typeof x === "string" && x.trim().length > 0)
    .join("\n")
    .slice(0, 4000);

  const organizedAgentPlaybook = `[UNIFIED ANTIGRAVITY AGENT ARCHITECTURE — ALL MODELS SHARE EQUAL FULL CAPABILITY]
1. Files & App Builder: Always emit complete, runnable multi-file output with \`path=\` headers (e.g. \`\`\`html path=index.html\`, \`\`\`css path=styles.css\`, \`\`\`js path=app.js\`, \`\`\`ts path=server.ts\`) whenever building apps, components, configs, or fixing code.
2. Research & Live Links: Use [LIVE WEB RESEARCH SOURCES] & [FETCHED URL CONTENT] directly in your synthesis with clean source links.
3. Terminal & Verification: Include concise executable shell/verification commands when appropriate so the user can test directly in the IDE Terminal tab.
4. Autonomous Completion: Never stall with "rephrase / clarify / try again". Complete the full task autonomously on the first pass in the user's exact language (${detectedLang}), using clear headings, concise bullet points, helpful emojis, and Markdown tables.`;

  const collabSection = isCollaborative
    ? `\n\nMULTI-AGENT SWARM ACTIVE (${model}):
Synthesize deeply across Architect + Builder + Reviewer passes and deliver ONE cohesive, production-ready result.`
    : "";

  const personaSection = `DIRECT ENGINEERING & ANTI-FALSE-REFUSAL RULES:
1. Deliver direct, practical engineering solutions, runnable apps, KASPI POS analytics, and cited research immediately.
2. Never falsely refuse legitimate engineering, retail POS, code, debugging, mechanical, medical research, or automation queries.
3. Uphold core safety limits cleanly only for actual dangerous/illegal harm.`;

  const systemInstruction = `You are ${brand === "kaspi_pos" ? "KASPI POS AI Architect" : "HEYUKA AI Engineer"} running inside the unified Antigravity Studio IDE (${model}). You have full equal access to ${matchedCatalogCount}+ vaulted engines, ${PUBLIC_APIS_CATALOG_COUNT} live no-key APIs, workspace file editing, live web search, and code sandbox execution.
Matched Capabilities: ${routePlan.selectedToolNames.join(", ")}${
    skillIndexPrompt ? `\n${skillIndexPrompt.slice(0, 650)}` : ""
  }
Execution Policy: ${executionPolicy.toUpperCase()} | Language: ${detectedLang}
${organizedAgentPlaybook}
${discourseDirective}
${personaSection}${collabSection}${modeDirective}${customRulesBlock ? `\n\n[USER CUSTOMIZATIONS]\n${customRulesBlock}` : ""}${
    effectiveDeepThink
      ? `\n\nDEEPTHINK PROTOCOL ENABLED:
Wrap concise step-by-step analysis inside <think>...</think> tags first, then present the complete Markdown answer + \`\`\`lang path=... files outside </think>.`
      : ""
  }${posContextBlock}${webContextBlock}${apiContextBlock}${toolSupplementBlock}${workspaceSnippet}`;

  const formattedMessages = messages.slice(-14).map((m, idx) => {
    const isLast = idx === messages.length - 1;
    if (isLast && m.role === "user" && imageBase64) {
      const cleanImg = imageBase64.startsWith("data:")
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;
      return {
        role: "user" as const,
        content: [
          { type: "text" as const, text: effectiveUserText },
          { type: "image" as const, image: cleanImg },
        ],
      };
    }
    return {
      role: m.role,
      content: isLast ? effectiveUserText : m.content,
    };
  });

  const phase3Start = Date.now();
  let rawText = "";
  const resolvedModel = imageBase64 ? "heyuka-vision" : isCollaborative ? "multi-agent-3" : model;

  try {
    const gen = await generateTextWithRouter({
      system: systemInstruction,
      messages: formattedMessages as any,
      temperature: executionPolicy === "turbo" ? 0.45 : effectiveDeepThink ? 0.35 : 0.65,
      governance: {
        tenantId,
        allowOwnerPaidProviders: false,
      },
    });
    rawText = String(gen.text || "").trim();

    let currentFinishReason = (gen as any).finishReason;
    // v24.0 Infinite Auto-Continuation Loop: silently resumes MAX_TOKENS (`length`) & mid-code cuts (up to 2 hops)
    let continuationHops = 0;
    while (continuationHops < 2 && Date.now() - startedAt < 46_000 && !imageBase64) {
      const truncCheck = detectTruncationState(rawText);
      if (!truncCheck.truncated && currentFinishReason !== "length") break;
      continuationHops += 1;
      const hopStart = Date.now();
      try {
        const cont = await generateTextWithRouter({
          system: `Continue generating ONLY the remaining code/tags cleanly from the exact cutoff point. Zero explanations, zero repetition, zero <think> tags.`,
          messages: [
            {
              role: "user",
              content: `Original task: ${effectiveUserText.slice(0, 260)}\n\nContinue seamlessly from the exact end below:\n${truncCheck.tailSnippet || rawText.slice(-420)}`,
            },
          ],
          temperature: 0.25,
          governance: { tenantId, allowOwnerPaidProviders: false },
        });
        const nextChunk = String(cont.text || "").trim();
        if (!nextChunk) break;
        rawText = mergeContinuationChunk(rawText, nextChunk);
        currentFinishReason = (cont as any).finishReason;
        thinkingSteps.push({
          phase: `Auto-Continuation Hop #${continuationHops} (v24.0)`,
          agentModel: resolvedModel,
          summary: `Stitched +${nextChunk.length} chars (${currentFinishReason === "length" ? "MAX_TOKENS" : truncCheck.reasons.join(", ")})`,
          durationMs: Math.max(1, Date.now() - hopStart),
          timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        });
      } catch {
        break;
      }
    }
  } catch {
    if (validApis.length > 0 || sources.length > 0) {
      rawText = buildLiveGroundingFallback(validApis, sources, locale, effectiveMode);
    } else {
      rawText = runLocalOnDeviceHeyukaBrain({
        prompt: lastUser,
        mode: effectiveMode,
        locale: worldLang.shortLocale,
      }).answer;
    }
  }

  thinkingSteps.push({
    phase: isCollaborative ? "Multi-Agent Synthesis & Review Pass" : "Neural Synthesis & Formatting",
    agentModel: resolvedModel,
    summary: `Synthesized response (${rawText.length} chars) under ${executionPolicy} policy`,
    durationMs: Math.max(1, Date.now() - phase3Start),
    timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
  });

  let reasoning = "";
  let answerRaw = rawText;
  const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/i);
  const unclosedThinkMatch = !thinkMatch ? rawText.match(/<think>([\s\S]*)$/i) : null;
  if (thinkMatch) {
    reasoning = thinkMatch[1].trim();
    answerRaw = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  } else if (unclosedThinkMatch) {
    reasoning = unclosedThinkMatch[1].trim();
    answerRaw = rawText.replace(/<think>[\s\S]*$/gi, "").trim();
  } else if (effectiveDeepThink) {
    reasoning = thinkingSteps
      .map((s) => `• [${s.timestamp}] ${s.phase} (${s.agentModel}, ${s.durationMs}ms): ${s.summary}`)
      .join("\n");
  }

  // Retry once concisely without <think> if upstream reasoning exhausted tokens leaving empty answer
  if (!answerRaw && reasoning && validApis.length === 0 && sources.length === 0) {
    try {
      const rescue = await generateTextWithRouter({
        system: `Respond directly in clean Markdown (${detectedLang}). Zero <think> tags.`,
        messages: [{ role: "user", content: effectiveUserText }],
        temperature: 0.4,
        governance: { tenantId, allowOwnerPaidProviders: false },
      });
      const rescueText = String(rescue.text || "").replace(/<\/?think>/gi, "").trim();
      if (rescueText) answerRaw = rescueText;
    } catch {}
  }

  const { repaired: repairedDraft, wasRepaired } = repairTruncatedMarkdownAndCode(answerRaw);
  if (wasRepaired) {
    thinkingSteps.push({
      phase: "Structural Bracket & Tag Auto-Repair (v24.0)",
      agentModel: "heyuka-repair",
      summary: "Closed interrupted fences, brackets, or HTML tags cleanly.",
      durationMs: 1,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    });
  }

  const reflected = runPreReplyReflectionGate({
    draftText: repairedDraft,
    expectedLocale: locale,
  });
  const isClarifyFallback =
    /^(Please clarify your request slightly|مرحباً، أعد صياغة طلبك قليلاً|Bonjour, veuillez préciser votre demande)/i.test(
      reflected.cleanedText
    );
  let answer =
    (!repairedDraft || isClarifyFallback) && (validApis.length > 0 || sources.length > 0)
      ? buildLiveGroundingFallback(validApis, sources, locale, effectiveMode)
      : !repairedDraft || isClarifyFallback
      ? runLocalOnDeviceHeyukaBrain({
          prompt: lastUser,
          mode: effectiveMode,
          locale: worldLang.shortLocale,
        }).answer
      : reflected.cleanedText || repairedDraft || rawText;

  if (isPatentQuery) {
    const patentApi = validApis.find((a) => a.category === "google_patents");
    const patentHits = Array.isArray((patentApi?.data as Record<string, unknown> | undefined)?.patents)
      ? ((patentApi?.data as Record<string, unknown>).patents as Array<{
          patentNumber?: string;
          title?: string;
          inventors?: string[];
          year?: number;
          citationCount?: number;
          googlePatentsUrl?: string;
          pdfOrLandingUrl?: string;
        }>)
      : [];
    const patentBlock = buildPatentBlueprintAndPdfMarker({
      query: lastUser.slice(0, 120),
      patents: patentHits,
      locale: worldLang.shortLocale,
    });
    if (!answer.includes("[KASPI_PDF_REPORT:")) {
      answer = `${answer}\n\n${patentBlock.markdownSupplement}`;
    }
  }

  for (const badge of cognitiveRoute.stageBadges) {
    const badgeTitle = `${badge.icon} ${badge.label}`;
    if (!sources.some((s) => s.title === badgeTitle)) {
      sources.unshift({
        title: badgeTitle,
        url: isPatentQuery ? `https://patents.google.com/?q=${encodeURIComponent(lastUser.slice(0, 80))}&scholar` : "",
      });
    }
  }

  let studioFiles = extractStudioFilesSafe(answer);
  if (v52v60StudioFiles.length > 0) {
    for (const vf of v52v60StudioFiles) {
      if (!studioFiles.some((f) => f.path === vf.path)) {
        studioFiles = [vf, ...studioFiles];
      }
    }
  }
  if (isPatentQuery && !studioFiles.some((f) => f.path.endsWith(".md"))) {
    studioFiles = [
      {
        path: "patent-specification-blueprint.md",
        language: "markdown",
        content: answer,
      },
      ...studioFiles,
    ];
  }
  const hasRunnableAsset = studioFiles.some(
    (f) => f.path.endsWith(".html") || f.path.endsWith(".js") || f.path.endsWith(".py")
  );
  if ((effectiveMode === "coding" || effectiveMode === "3d") && !hasRunnableAsset) {
    studioFiles = buildDomainBlueprintFiles(lastUser, lastUser.slice(0, 44));
  }
  if (effectiveMode === "image" && !isImageEditRequest && !studioFiles.some((f) => f.path.endsWith(".svg"))) {
    studioFiles = [
      { path: "artwork.svg", language: "svg", content: buildCodeToMediaArtifactSvg(lastUser.slice(0, 40), lastUser) },
      ...studioFiles,
    ];
  }
  if (effectiveMode === "qr" && qrSvgMarkup) {
    studioFiles = [{ path: "heyuka-qr.svg", language: "svg", content: qrSvgMarkup }, ...studioFiles];
  }

  let clientMediaJob: Record<string, unknown> | undefined;
  const shouldOpenStudio =
    effectiveMode === "coding" ||
    effectiveMode === "image" ||
    effectiveMode === "video" ||
    effectiveMode === "audio" ||
    effectiveMode === "3d" ||
    effectiveMode === "qr" ||
    isImageEditRequest ||
    studioFiles.length > 0;

  if (isImageEditRequest && imageBase64) {
    clientMediaJob = {
      kind: "image_edit",
      title: "Vision Image Studio (Inpaint / Background Editor)",
      subtitle: "Client GPU Interactive Eraser & Export ($0.00)",
      prompt: lastUser,
      sourceImageUrl: imageBase64,
      openStudio: true,
    };
  } else if (effectiveMode === "image") {
    clientMediaJob = {
      kind: "image",
      title: lastUser.slice(0, 48),
      subtitle: "HEYUKA Client GPU & Diffusion Studio",
      prompt: lastUser,
      accentHex: "#E11D48",
      pollinationsUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(
        lastUser.slice(0, 260)
      )}?width=1024&height=640&nologo=true`,
      openStudio: true,
    };
  } else if (effectiveMode === "video") {
    const cinemaBundle = buildPhotorealisticCinemaVideoBundle(lastUser);
    studioFiles = [...studioFiles, ...cinemaBundle.files];
    const cleanLines = answer
      .split("\n")
      .map((l) => l.replace(/^[-*#\d.\s]+/, "").trim())
      .filter((l) => l.length > 8 && l.length < 72)
      .slice(0, 3);
    clientMediaJob = {
      kind: "video",
      title: lastUser.slice(0, 48),
      subtitle: "HEYUKA v34.0 Cinema Motion + WebAudio Foley (Client GPU)",
      prompt: lastUser,
      accentHex: "#10B981",
      durationSec: 4.5,
      scenes:
        cleanLines.length > 0
          ? cleanLines
          : [lastUser.slice(0, 45), "OpenColorIO ACES Grade", "100% Client GPU • $0.00"],
      openStudio: true,
    };
  } else if (effectiveMode === "audio") {
    clientMediaJob = {
      kind: "audio",
      title: lastUser.slice(0, 48),
      prompt: lastUser,
      bpm: 112,
      durationSec: 4.2,
      openStudio: true,
    };
  } else if (effectiveMode === "3d") {
    clientMediaJob = {
      kind: "3d",
      title: lastUser.slice(0, 48),
      prompt: lastUser,
      glbPreset: /torus|ring/i.test(lastUser)
        ? "torus"
        : /sphere|ball|globe/i.test(lastUser)
        ? "sphere"
        : /stand|vase|cup/i.test(lastUser)
        ? "product_stand"
        : /crystal|gem|prism/i.test(lastUser)
        ? "emerald_prism"
        : "cube",
      openStudio: true,
    };
  } else if (effectiveMode === "qr" && qrSvgMarkup) {
    clientMediaJob = {
      kind: "qr",
      title: "HEYUKA Branded QR SVG",
      prompt: lastUser,
      svgMarkup: qrSvgMarkup,
      openStudio: true,
    };
  }

  const thinkingSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  const vaultedMatched = searchSovereignVault({
    query: lastUser,
    clusterId: cognitiveRoute.primaryCluster.id,
    limit: 6,
  });
  recordProductSelfEvolution({
    prompt: lastUser,
    clusterId: cognitiveRoute.primaryCluster.id,
    productKind: effectiveMode === "video" ? "video" : effectiveMode === "3d" ? "3d" : effectiveMode === "image" ? "image" : "project",
    sourcesUsed: vaultedMatched.map((v) => v.name),
    outputFormats: cognitiveRoute.primaryCluster.outputFormats,
    artifactCount: studioFiles.length || 1,
    totalBytes: answer.length,
    executionMode: executionPolicy === "auto" ? "client_cpu" : "free_gateway",
  });

  return NextResponse.json({
    ok: true,
    unlimited: true,
    dailyRequestLimit: null,
    clientComputeFirst: true,
    model: resolvedModel,
    executionPolicy,
    effectiveMode,
    autoSwitched,
    deepThinkUsed: effectiveDeepThink,
    searchUsed: effectiveSearch,
    answer,
    reasoning: reasoning || undefined,
    thinkingSec: effectiveDeepThink ? thinkingSec : undefined,
    thinkingSteps,
    thoughtCompletedAt: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    sources: sources.length > 0 ? sources : undefined,
    studioFiles: studioFiles.length > 0 ? studioFiles : undefined,
    clientMediaJob,
    openStudio: shouldOpenStudio,
    zeroCostGuarantee: "$0.00 Server Compute — Client Device & Free Edge",
    latencyMs: Date.now() - startedAt,
  });
}
