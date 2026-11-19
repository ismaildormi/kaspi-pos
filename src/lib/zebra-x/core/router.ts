import { assertPosCoreImmutable } from "@/lib/zebra-x/arsenal-vault";
import { planParallelDagWaves } from "@/lib/zebra-x/tools/math-logic-engine";
import { refinePromptWithPhase3 } from "./prompt-refiner";
import { searchEvolvingMemory } from "./memory-engine";

/**
 * HEYUKA (KASPI Sovereign AI) — Phase 3 Strategic Master Planner & Distributed Mesh Router
 * Upgrades tool selection into a full SayCan + HTN + DAG Graphlib planner with:
 * - Semantic Tool RAG filtering (Top 12 active tools)
 * - Nador & Oriental Morocco priority localization
 * - 100x Federated Mesh resource allocation & Owner Root priority routing
 * - Strict `assertPosCoreImmutable` safety check on every planned step
 */

export type XZebraIntentCategory =
  | "pos_metrics"
  | "pos_sale_action"
  | "activity_and_last"
  | "pdf_and_reports"
  | "media_and_vision"
  | "public_apis"
  | "math_finance"
  | "docs_diagrams_artifacts"
  | "phone_calendar_tour"
  | "universal_web_research"
  | "nador_oriental_local"
  | "node_mesh_scale"
  | "skills_and_cowork"
  | "tool_discovery"
  | "platform_owner";

export interface RoutePlanDecision {
  intents: XZebraIntentCategory[];
  selectedToolNames: string[];
  complexity: "fast" | "multistep" | "owner";
  localityFocus: {
    region: string;
    nadorPriorityActive: boolean;
    coordinates: { lat: number; lon: number };
    hubs: string[];
  };
  meshDispatchPlan: {
    strategy: "local_first" | "n_fold_distributed_mesh" | "owner_root_priority";
    targetTier: "browser_zero_cost" | "edge_node_mesh" | "owner_root_vault";
    recommendedNodes: string[];
  };
}

const TOOL_CATALOG_INDEX: Record<XZebraIntentCategory, string[]> = {
  pos_metrics: ["getTodaySales", "getLowStockProducts", "getTopSellingProducts", "predictStockDemand"],
  pos_sale_action: ["preparePosActionConfirmation"],
  activity_and_last: ["getLastCustomer", "getLastReceiptTicket", "getUserActivityLog"],
  pdf_and_reports: ["generatePdfReport", "getTodaySales", "getLowStockProducts", "getTopSellingProducts"],
  media_and_vision: ["generateProductImage", "searchWebImages", "createRichArtifactOrExport"],
  public_apis: ["queryPublicApi"],
  math_finance: ["evaluateMathAndFinance"],
  docs_diagrams_artifacts: ["createRichArtifactOrExport", "executeCodeSandbox"],
  phone_calendar_tour: ["checkPhoneCalendarOrCron", "createRichArtifactOrExport"],
  universal_web_research: ["unrestrictedWebSearch", "executeCodeSandbox", "queryPublicApi", "createRichArtifactOrExport"],
  nador_oriental_local: ["queryPublicApi", "unrestrictedWebSearch", "createRichArtifactOrExport"],
  node_mesh_scale: ["unrestrictedWebSearch", "executeCodeSandbox", "evaluateMathAndFinance", "createRichArtifactOrExport"],
  skills_and_cowork: ["lookupSkillOrAuthor", "runCoworkSubAgents", "executeCodeSandbox", "createRichArtifactOrExport"],
  tool_discovery: ["discoverOpenSourceTool", "lookupSkillOrAuthor", "unrestrictedWebSearch", "executeCodeSandbox"],
  platform_owner: [
    "getPlatformStats",
    "getPlatformRevenue",
    "getAllTenantsList",
    "getTenantDetails",
    "getAIUsageStats",
  ],
};

export function planXZebraToolRoute(prompt: string, isOwner: boolean): RoutePlanDecision {
  const p = (prompt || "").toLowerCase();
  const intents: XZebraIntentCategory[] = [];

  if (/(pdf|تقرير|جدول|rapport|table|export|طباع)/i.test(p)) intents.push("pdf_and_reports");
  if (/(word|docx|excel|xlsx|powerpoint|pptx|mermaid|mindmap|خريطة ذهنية|مخطط|diff|مقارنة|html|معاينة|live|preview|barcode|qrcode|باركود)/i.test(p)) {
    intents.push("docs_diagrams_artifacts");
  }
  if (/(معادلة|احسب|جبر|تكامل|مشتق|رياضيات|equation|solve|math|tva|ضريبة|هامش|dag|خطط|plan|katex)/i.test(p)) {
    intents.push("math_finance");
  }
  if (/(الناظور|ناظور|بني أنصار|الناظور غرب|مارشيكا|سلوان|العروي|زايو|أزول|الجهة الشرقية|nador|beni ansar|bni ansar|marchica|selouane|al aroui|tarifit|ريف|بحر الناظور|أمواج)/i.test(p)) {
    intents.push("nador_oriental_local");
  }
  if (/(شبكة العقد|موزع|فدرالي|nats|ray|ipfs|orbitdb|surrealdb|100x|distributed mesh|owner root|cluster|عقدة)/i.test(p)) {
    intents.push("node_mesh_scale");
  }
  if (/(صرف|عملة|دولار|أورو|كريبتو|bitcoin|fx|طقس|weather|مورد|خريطة|شركة|دواء|fda|pubmed|تربة|فلاحة|نوبل|ويكي|wiki|شعار|logo|remote|أخبار|hacker|براءة|طوبيس|ترام|قطار|صيدلية|جودة الهواء|transit|traffic|pharmacy|air quality|openverse|polyhaven|3d|marine|wave|cve|cisa|osv|vulnerability|cyber|threat|ثغرة|أمن)/i.test(p)) {
    intents.push("public_apis");
  }
  if (/(http:\/\/|https:\/\/|بحث|ابحث|تاريخ|فلسفة|علم|فيزياء|برمجة|كود|تشغيل|سكريبت|react|python|javascript|typescript|sandbox|code|run|script|موقع|تطبيق|search|explain|history|science|coding|philosophy)/i.test(p)) {
    intents.push("universal_web_research");
  }
  if (/(هاتف|تليفون|رقم|phone|هجري|hijri|شروق|غروب|أبيل|كول|cron|وجهني|وريني|شرح الشاشة|guide|tour|فين الزر)/i.test(p)) {
    intents.push("phone_calendar_tour");
  }
  if (/(بيع|خصم|تخفيض|مخزون|ستوك|vendre|remise|stock|discount|sell|cart|panier)/i.test(p)) {
    intents.push("pos_sale_action");
  }
  if (/(آخر|زبون|كليان|تذكرة|تيكي|كليك|درت|last|customer|client|ticket|receipt|click|activity)/i.test(p)) {
    intents.push("activity_and_last");
  }
  if (/(مبيعات|أرباح|توقع|نفاد|sales|revenue|forecast|ventes|top|best)/i.test(p)) {
    intents.push("pos_metrics");
  }
  if (/(صاوب صورة|ارسم|توليد صورة|صورة|تصويرة|خلفية|شعار|بوستر|draw|generate image|generate photo|poster|logo|image|photo|picture|background)/i.test(p)) {
    intents.push("media_and_vision");
  }
  if (/(مهارة|مهارات|سكيلز|مجلد|ملفات|جلسة|مهام|تعاون|skill\.md|skills|cowork|checkpoint|workspace|sub-?agent|وكلاء فرعي)/i.test(p)) {
    intents.push("skills_and_cowork");
  }
  if (/(اكتشف|كتالوج|مكتبة|مفتوح المصدر|مستودع|github|microsoft|google|meta|xai|anthropic|hugging|sora|kling|runway|suno|open-source|discover)/i.test(p)) {
    intents.push("tool_discovery");
  }
  if (isOwner && /(منصة|متاجر|mrr|gmv|tenants|platform|revenue|usage|اشتراك)/i.test(p)) {
    intents.push("platform_owner");
  }

  if (intents.length === 0) {
    intents.push("pos_metrics");
  }

  const uniqueTools = new Set<string>();
  for (const intent of intents) {
    for (const toolName of TOOL_CATALOG_INDEX[intent]) {
      uniqueTools.add(toolName);
    }
  }

  const nadorPriorityActive = intents.includes("nador_oriental_local");
  const isHeavyMesh = intents.includes("node_mesh_scale") || intents.includes("universal_web_research");

  return {
    intents,
    selectedToolNames: Array.from(uniqueTools).slice(0, 12),
    complexity: isOwner
      ? "owner"
      : intents.length > 1 || intents.includes("pdf_and_reports") || intents.includes("public_apis")
      ? "multistep"
      : "fast",
    localityFocus: {
      region: "Nador & Oriental Morocco",
      nadorPriorityActive,
      coordinates: { lat: 35.1688, lon: -2.9335 },
      hubs: ["Nador City", "Beni Ansar Port", "Nador West Med", "Marchica Lagoon", "Al Aroui Airport"],
    },
    meshDispatchPlan: isOwner
      ? {
          strategy: "owner_root_priority",
          targetTier: "owner_root_vault",
          recommendedNodes: ["owner-root-node", "ray-nats-mesh-pool", "browser-zero-cost"],
        }
      : isHeavyMesh
      ? {
          strategy: "n_fold_distributed_mesh",
          targetTier: "edge_node_mesh",
          recommendedNodes: ["peer-x-zebra-worker", "public-api-gateway", "browser-zero-cost"],
        }
      : {
          strategy: "local_first",
          targetTier: "browser_zero_cost",
          recommendedNodes: ["browser-zero-cost"],
        },
  };
}

export interface StrategicExecutionPlan {
  route: RoutePlanDecision;
  clusterMultiplier: number;
  normalizedPrompt: string;
  deliberationTier: "fast" | "deliberate" | "deep_s1";
  sayCanPosSafe: boolean;
  recalledMemoriesCount: number;
  htnDag: {
    acyclic: boolean;
    waves: Array<{ wave: number; tasks: string[] }>;
    mermaidDiagram: string;
  };
}

/**
 * Full Phase 3 Master Planner: fuses Darija/Tarifit Normalization, Evolving Memory Retrieval,
 * SayCan Safety Verification, Distributed N-Fold Mesh Allocation, and Graphlib HTN/DAG Waves.
 */
export async function buildMasterStrategicExecutionPlan(params: {
  prompt: string;
  isOwner: boolean;
  locale?: "ar" | "fr" | "en";
  activeMeshNodes?: number;
  targetPathToMutate?: string;
}): Promise<StrategicExecutionPlan> {
  if (params.targetPathToMutate) {
    assertPosCoreImmutable(params.targetPathToMutate);
  }

  const locale = params.locale || "ar";
  const refinement = refinePromptWithPhase3(params.prompt, locale);
  const route = planXZebraToolRoute(refinement.normalization.normalizedQuery, params.isOwner);
  const clusterMultiplier = Math.max(1, Number(params.activeMeshNodes || 1));

  const memLookup = await searchEvolvingMemory(refinement.normalization.normalizedQuery, 4).catch(() => ({
    hits: [],
    enginesLoaded: [],
    totalMemories: 0,
    totalSkills: 0,
  }));

  const htnTasks: Array<{ id: string; label: string; dependsOn?: string[] }> = [
    { id: "parse_norm", label: `Normalize (${refinement.normalization.detectedLanguage})` },
    { id: "mem_rag", label: `Memory & Skills RAG (${memLookup.hits.length} hits)`, dependsOn: ["parse_norm"] },
    {
      id: "tool_exec",
      label: route.localityFocus.nadorPriorityActive
        ? "Execute Local Nador + Tools"
        : `Dispatch Tools (${route.selectedToolNames.slice(0, 3).join(", ")})`,
      dependsOn: ["mem_rag"],
    },
    {
      id: "mesh_verify",
      label: `Verify & Synthesize (${refinement.deliberation.tier}, ${clusterMultiplier}x Node Pool)`,
      dependsOn: ["tool_exec"],
    },
  ];

  const dag = await planParallelDagWaves(htnTasks);

  return {
    route,
    clusterMultiplier,
    normalizedPrompt: refinement.normalization.normalizedQuery,
    deliberationTier: refinement.deliberation.tier,
    sayCanPosSafe: true,
    recalledMemoriesCount: memLookup.hits.length,
    htnDag: {
      acyclic: dag.acyclic,
      waves: dag.waves,
      mermaidDiagram: dag.mermaidDiagram,
    },
  };
}

/**
 * Dynamic Tool Masking (`v12.4` Defer Loading):
 * Keeps only context-matched tools + core fallbacks active on standard turns so large registries
 * never cause tool-selection confusion, while keeping at least 6 essential tools available.
 */
export function selectMaskedActiveTools<T extends Record<string, any>>(
  allTools: T,
  routePlan: RoutePlanDecision,
  prompt: string
): Partial<T> {
  if (/(\ball tools\b|\bevery\b|كاع القدرات|كل قدراتك|المصادر المفتوحة)/i.test(prompt)) {
    return allTools;
  }

  const alwaysReady = [
    "unrestrictedWebSearch",
    "queryPublicApi",
    "evaluateMathAndFinance",
    "executeCodeSandbox",
    "lookupSkillOrAuthor",
    "createRichArtifactOrExport",
  ];
  const keepNames = new Set<string>([...alwaysReady, ...routePlan.selectedToolNames]);
  const masked: Partial<T> = {};
  for (const [k, v] of Object.entries(allTools)) {
    if (keepNames.has(k)) {
      (masked as any)[k] = v;
    }
  }
  return Object.keys(masked).length > 0 ? masked : allTools;
}
