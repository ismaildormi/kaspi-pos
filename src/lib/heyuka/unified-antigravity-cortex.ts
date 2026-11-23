import { tool } from "ai";
import { z } from "zod";
import {
  classifyCognitiveIntentAndSources,
  getTotalIntegratedCapabilitiesCount,
  type CognitiveClusterId,
} from "@/lib/zebra-x/core/cognitive-brain-registry";
import {
  getSelfEvolutionContextForPrompt,
  recordErrorLessonFromFailure,
  recordProductSelfEvolution,
} from "@/lib/heyuka/learning/self-evolution-engine";
import {
  crawlAndIngestPublicPages,
  ensureFullVaultDigested,
  searchStudiedKnowledgeCorpus,
} from "@/lib/heyuka/training/knowledge-corpus-engine";
import { searchSovereignVault } from "@/lib/heyuka/vault/sovereign-permanent-vault";
import { runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";
import { queryPublicApiHub, type PublicApiCategory } from "@/lib/zebra-x/tools/public-apis-hub";
import { executePolyglotCodeSandbox } from "@/lib/zebra-x/tools/code-sandbox";
import {
  computeExactRetailFinance,
  evaluateMathOrAlgebra,
  planParallelDagWaves,
} from "@/lib/zebra-x/tools/math-logic-engine";
import { runPreReplyReflectionGate } from "@/lib/zebra-x/core/reflection-gate";
import { scoreSelfCheckConsistency } from "@/lib/zebra-x/core/prompt-refiner";
import { repairTruncatedMarkdownAndCode } from "@/lib/heyuka/autonomous-builder-v24-v28";

export type CortexDomainMode =
  | "software_architecture"
  | "finance_erp_tax"
  | "research_analysis"
  | "document_design"
  | "general_dialogue";

export interface WorkspaceFileSummaryInput {
  path: string;
  language?: string;
  content: string;
}

export interface CortexWorkingMemory {
  domainMode: CortexDomainMode;
  primaryClusterId: CognitiveClusterId;
  secondaryClusterIds: CognitiveClusterId[];
  vaultTotalSources: number;
  studiedCorpusUnits: number;
  webCrawledUnits: number;
  matchedVaultCount: number;
  personaDirective: string;
  activeMemoryPromptBlock: string;
  recommendedSourcesForTrace: string[];
}

/**
 * Resolves free dynamic persona / role-play adoption (`تقمص الأدوار`) across Chat, Studio,
 * and external API callers while keeping full Sovereign Vault & tool execution active.
 */
export function resolveAdaptivePersonaDirective(
  prompt: string,
  callerSystemInstruction?: string
): string {
  const cleanCaller = typeof callerSystemInstruction === "string" ? callerSystemInstruction.trim() : "";
  const hasExplicitRoleCue =
    /(?:أنت\s+الآن|تصرف\s+ك|تقمص\s+دور|تحدث\s+بصفتك|بصفتك|كأنك|على\s+أنك|شخصية|أسلوب|you\s+are\s+now|act\s+as|roleplay|adopt\s+the\s+persona|behave\s+like|speak\s+as|agis\s+comme|tu\s+es\s+maintenant|joue\s+le\s+rôle)/i.test(
      prompt || ""
    );

  if (cleanCaller && hasExplicitRoleCue) {
    return `[DYNAMIC PERSONA & CALLER ROLEPLAY ACTIVE]: Fully adopt the requested persona, dialect, and expert framing from both the user prompt and caller instruction ("${cleanCaller.slice(0, 600)}"), without dropping tool accuracy, web citations, or complete multi-step execution.`;
  }
  if (cleanCaller) {
    return `[CUSTOM PERSONA / SYSTEM DIRECTIVE ACTIVE]: Follow this requested persona & operating framing seamlessly ("${cleanCaller.slice(0, 800)}"), while retaining full access to all vaulted sources, sandbox verification, and web tools.`;
  }
  if (hasExplicitRoleCue) {
    return `[FREE ROLEPLAY & ADAPTIVE PERSONA ENABLED]: Adapt freely into the exact expert, mentor, fictional character, architect, merchant advisor, or speaking style requested by the user — never refuse harmless role-play or lock into a rigid robotic voice.`;
  }
  return `[ADAPTIVE PERSONA]: Dynamically adapt tone, depth, and voice to fit the task — from sharp senior systems architect to friendly Darija/Arabic merchant partner — without artificial caps or robotic disclaimers.`;
}

export function classifyUniversalDomainMode(
  prompt: string,
  workspaceFiles?: WorkspaceFileSummaryInput[]
): CortexDomainMode {
  const p = String(prompt || "").toLowerCase();

  if (
    /(كود|برمجة|تطبيق|موقع|مشروع|ملف|مكون|واجهة|باك.?اند|api|nextjs|next\.js|react|typescript|javascript|python|sql|html|css|rust|bug|debug|refactor|fix|edit|file|app|build|component|endpoint|schema|database|terminal|playwright|script)/i.test(
      p
    ) ||
    Boolean(workspaceFiles && workspaceFiles.length > 0 && /(update|add|edit|change|عدل|زيد|طور|أضف|كمل|صلح)/i.test(p))
  ) {
    if (/(فاتورة|invoice|facture|pdf|word|docx|excel|xlsx|pptx|عرض|html.*تقرير|طباعة|reçu|receipt)/i.test(p) && !/(react|api|database|script|playwright|scraper)/i.test(p)) {
      return "document_design";
    }
    return "software_architecture";
  }

  if (
    /(فاتورة|invoice|facture|pdf|excel|xlsx|word|docx|pptx|تقرير|html|جدول|نموذج طباعة)/i.test(p)
  ) {
    return "document_design";
  }

  if (
    /(مبيعات|أرباح|مخزون|كاشير|نقطة التعادل|ضريبة|هامش|رأس مال|تكلفة|ميزانية|محاسبة|بضاعة|درهم|tva|ice|ttc|ht|mad|margin|roi|break.?even|revenue|pos|cashier|pricing|profit|forecast)/i.test(
      p
    )
  ) {
    return "finance_erp_tax";
  }

  if (
    /(بحث|ابحث|قارن|مقارنة|تحليل|دراسة|براءة اختراع|دواء|طب|فلاحة|طقس|خريطة|ثغرة|أمن|سوق|منافس|تاريخ|علم|فلسفة|patent|scholar|pubmed|fda|cve|cisa|research|market|compare|analyze|audit|http:\/\/|https:\/\/)/i.test(
      p
    )
  ) {
    return "research_analysis";
  }

  return "general_dialogue";
}

function getDomainPlaybookGuidance(mode: CortexDomainMode, isStudio: boolean): string {
  switch (mode) {
    case "software_architecture":
      return [
        "ACTIVE DOMAIN PROTOCOL (ANTIGRAVITY SOFTWARE & PROJECT ARCHITECT):",
        `1. LOCATE BEFORE WRITING: Inspect existing workspace files first (${
          isStudio ? "via inspectWorkspaceFile & active file context" : "via provided workspace context"
        }) so you extend and refine the codebase incrementally rather than discarding working files.`,
        "2. ARCHITECTURE & CLEAN MODULARITY: Organize changes cleanly with shared helpers, explicit TypeScript/Python/JS types, clear error handling (try/catch), zero duplicated logic, and zero TODO / ellipsis placeholders.",
        "3. EMIT RUNNABLE FILES CLEANLY: Format every created/updated file using fenced blocks with explicit path= headers (e.g. ```ts path=src/utils/auth.ts, ```html path=index.html) so the IDE automatically merges & saves them into the workspace.",
        "4. SELF-VERIFY IN SANDBOX: Whenever creating JS, Python, or shell scripts or critical logic, execute runAndVerifyCode (or executeCodeSandbox) BEFORE finishing; if stderr occurs, repair the bug and re-test first.",
        "5. INTERACTIVE LINKS & CLI: Include real clickable documentation links ([Docs](https://...)) outside code blocks and exact copy-ready run/test commands.",
      ].join("\n");

    case "finance_erp_tax":
      return [
        "ACTIVE DOMAIN PROTOCOL (KASPI POS ERP, FINANCE & TAX ANALYST):",
        "1. ZERO ARITHMETIC HALLUCINATION: Use computeExactFinance / evaluateMathAndFinance (or verified live DB tools getTodaySales, getLowStockProducts, getTopSellingProducts) for all MAD totals, VAT/TVA 20%, HT/TTC conversions, profit margins, and break-even projections.",
        "2. STRUCTURED BUSINESS DELIVERABLES: Present comparisons, P&L breakdowns, and inventory forecasts in clean Markdown tables (which auto-unlock 1-click .xlsx Excel & PDF export).",
        "3. ACTIONABLE RETAIL INSIGHT: Connect numbers directly to concrete merchant decisions (reorder quantities, margin optimization, payment method splits, 80mm thermal/ICE invoice readiness).",
      ].join("\n");

    case "document_design":
      return [
        "ACTIVE DOMAIN PROTOCOL (DOCUMENT, INVOICE & INTERACTIVE ARTIFACT STUDIO):",
        '1. INSTANT LIVE PREVIEW & DOWNLOAD: Whenever generating invoices (فاتورة), quotes, fiscal statements, receipts, resumes, or interactive dashboards, emit a complete standalone ```html block (using dir="rtl" & clean print CSS for Arabic) — the UI automatically captures it inside a live <iframe> with a 1-click RTL-safe PDF Download button — AND include clean Markdown summary tables for 1-click .xlsx Excel export.',
        "2. FISCAL & TYPOGRAPHIC POLISH: Format Moroccan company metadata cleanly (ICE, IF, RC, TVA 20% in MAD), align columns cleanly, and ensure 100% verified subtotals and totals.",
      ].join("\n");

    case "research_analysis":
      return [
        "ACTIVE DOMAIN PROTOCOL (DEEP RESEARCH, PATENT & LIVE KNOWLEDGE SYNTHESIS):",
        "1. GROUND FIRST VIA LIVE SOURCES: Retrieve real external facts using webSearchAndFetch, queryVaultOrApi (47 public no-key APIs incl. PubMed, OpenFDA, Google Patents, OpenAlex, WorldBank, Frankfurter, OSV/CISA), and cite what was actually retrieved.",
        "2. EXECUTIVE STRUCTURE: Open with a direct executive synthesis, compare trade-offs in a crisp Markdown comparison table, detail concrete implementation/strategy steps, and list clickable source links ([Source Title](https://...)).",
      ].join("\n");

    default:
      return [
        "ACTIVE DOMAIN PROTOCOL (VERSATILE UNRESTRICTED CONVERSATION & STRATEGY):",
        "1. NATURAL HUMAN POISE: Match the user's exact language, dialect, and register seamlessly (Moroccan Darija, Arabic, Tarifit, French, or English) — insightful, intelligent, practical, zero robotic filler or unsolicited preachy warnings.",
        "2. DEEP STRUCTURED THOUGHT: Even on open-ended brainstorming, life/career advice, marketing copy, or creative writing, give concrete frameworks, original angles, clear structure, and actionable next steps — completing every section thoroughly to the end.",
      ].join("\n");
  }
}

/**
 * Builds Active Working Memory uniting all 2,492 vaulted engines, learned self-evolution recipes,
 * workspace file map, and Antigravity 6-Step Cognitive Architecture across ALL HEYUKA surfaces.
 */
export function buildActiveVaultWorkingMemory(params: {
  prompt: string;
  locale: "ar" | "fr" | "en";
  brand?: "kaspi_pos" | "heyuka";
  workspaceFiles?: WorkspaceFileSummaryInput[];
  isStudio?: boolean;
  callerSystemInstruction?: string;
}): CortexWorkingMemory {
  const domainMode = classifyUniversalDomainMode(params.prompt, params.workspaceFiles);
  const cognitiveRoute = classifyCognitiveIntentAndSources(params.prompt, params.locale);
  const v60Totals = getTotalIntegratedCapabilitiesCount();

  // Digest all Sovereign Vault sources + search full studied corpus (web crawls + all indexed engines)
  ensureFullVaultDigested();
  const studiedSearch = searchStudiedKnowledgeCorpus({
    query: params.prompt,
    limit: 18,
    includeWebFirst: true,
  });

  // Supplement with exact cluster matches if studied query hits are light
  const vaultFallbackHits =
    studiedSearch.hits.length < 10
      ? searchSovereignVault({ clusterId: cognitiveRoute.primaryCluster.id, limit: 12 })
      : [];

  const seenNames = new Set<string>();
  const unifiedLines: string[] = [];
  const recommendedNames: string[] = [];

  for (const hit of studiedSearch.hits) {
    const key = hit.title.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    recommendedNames.push(hit.title);
    const kindTag = hit.sourceKind === "web_crawl" ? "WEB-STUDIED" : hit.clusterId || hit.sourceKind;
    const excerpt = hit.content.replace(/\s+/g, " ").trim().slice(0, 180);
    unifiedLines.push(`- ${hit.title} [${kindTag}]: ${excerpt}${hit.url ? ` — Source: ${hit.url}` : ""}`);
  }
  for (const v of vaultFallbackHits) {
    const key = v.name.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    recommendedNames.push(v.name);
    unifiedLines.push(`- ${v.name} [${v.clusterId}]: ${v.role}${v.url ? ` — Docs/Repo: ${v.url}` : ""}`);
  }

  const evolution = getSelfEvolutionContextForPrompt({
    prompt: params.prompt,
    clusterId: cognitiveRoute.primaryCluster.id,
  });

  const errorPreventionBlock =
    evolution.learnedErrorLessons.length > 0
      ? `[REFLEXION ERROR PREVENTION LESSONS (${evolution.learnedErrorLessons.length})]\n${evolution.learnedErrorLessons
          .map((l) => `- [${l.errorType} x${l.occurrences}] ${l.preventionRule}`)
          .join("\n")}`
      : "";

  const personaDirective = resolveAdaptivePersonaDirective(
    params.prompt,
    params.callerSystemInstruction
  );

  const fileTreeSummary =
    params.workspaceFiles && params.workspaceFiles.length > 0
      ? params.workspaceFiles
          .map(
            (f) =>
              `- ${f.path} (${f.language || "text"}, ${f.content.split(/\r?\n/).length} lines, ${f.content.length}B)`
          )
          .join("\n")
      : "";

  const enginesCatalogSnippet = unifiedLines.join("\n");

  const secondaryIds = cognitiveRoute.matchedClusters
    .slice(1, 4)
    .map((c) => c.id);

  const activeMemoryPromptBlock = [
    `[ANTIGRAVITY CORTEX v2.5 | Mode: ${domainMode.toUpperCase()} | Cluster: ${cognitiveRoute.primaryCluster.titleEn} | ${v60Totals.grandTotalSources}+ Vault + ${studiedSearch.totalCorpusUnits} Digested Units (${studiedSearch.webCrawledUnits} Web-Studied)]`,
    personaDirective,
    `• Evolving Memory: ${evolution.evolutionSummary}`,
    errorPreventionBlock,
    "[STUDIED CORPUS & MATCHED VAULT ENGINES]",
    enginesCatalogSnippet,
    fileTreeSummary ? `[WORKSPACE FILES (${params.workspaceFiles?.length})]\n${fileTreeSummary}` : "",
    "[COGNITIVE PROTOCOL]",
    "1. INSPECT & STUDY FIRST: Read workspace files, studied corpus, or live web URLs via studyAndCrawlSource / webSearchAndFetch before guessing.",
    "2. HIDDEN REASONING: Deliberate in <think>...</think> (zero meta-text leaks).",
    "3. SINGLE-SHOT TOOL VERIFICATION & REFLEXION: When verifying JS/math via runAndVerifyCode or computeExactFinance, write self-contained code and fix any stderr immediately.",
    "4. INCREMENTAL FILES: Emit clean runnable files (```lang path=relative/file.ext) without placeholders; untouched workspace files remain preserved.",
    "5. LINKS & UNTHROTTLED COMPLETION: Embed clickable Markdown links ([Name](https://...)) outside code blocks and take full space to complete every section without artificial truncation.",
    getDomainPlaybookGuidance(domainMode, Boolean(params.isStudio)),
  ]
    .filter((line) => line !== undefined && line !== "")
    .join("\n")
    .trim();

  return {
    domainMode,
    primaryClusterId: cognitiveRoute.primaryCluster.id,
    secondaryClusterIds: secondaryIds,
    vaultTotalSources: v60Totals.grandTotalSources,
    studiedCorpusUnits: studiedSearch.totalCorpusUnits,
    webCrawledUnits: studiedSearch.webCrawledUnits,
    matchedVaultCount: unifiedLines.length,
    personaDirective,
    activeMemoryPromptBlock,
    recommendedSourcesForTrace: recommendedNames,
  };
}

/**
 * Real Executable AI SDK Toolset for Studio IDE & Chat-Web (`/api/v1/heyuka/chat-web`):
 * Enables genuine Antigravity-grade ReAct cycles (inspect workspace -> search web -> compute math -> test code in sandbox -> synthesize).
 */
export function createStudioAgentToolkit(params: {
  workspaceFiles?: WorkspaceFileSummaryInput[];
  locale: "ar" | "fr" | "en";
  executedLogs: string[];
  primaryClusterId?: CognitiveClusterId;
}) {
  const wsFiles = params.workspaceFiles || [];
  const shortLocale = params.locale;
  const clusterId = params.primaryClusterId || "code_ide_and_surgical_editing";

  return {
    inspectWorkspaceFile: tool({
      description:
        "Reads the full source code of an existing file in the current Antigravity Studio workspace before editing or extending it.",
      inputSchema: z.object({
        path: z.string().min(1).describe("Exact file path from [CURRENT WORKSPACE FILE TREE]"),
      }),
      execute: async ({ path }) => {
        const clean = path.replace(/^\.?\//, "").toLowerCase();
        const found = wsFiles.find(
          (f) => f.path.toLowerCase() === clean || f.path.toLowerCase().endsWith(clean)
        );
        if (!found) {
          return {
            found: false,
            availableFiles: wsFiles.map((f) => f.path),
          };
        }
        return {
          found: true,
          path: found.path,
          language: found.language || "text",
          content: found.content.slice(0, 14000),
        };
      },
    }),

    webSearchAndFetch: tool({
      description:
        "Searches the live open web (or fetches readable Markdown from any public HTTP/HTTPS URL) with verified clickable links across all topics & latest documentation.",
      inputSchema: z.object({
        query: z.string().optional().describe("Web search query"),
        url: z.string().optional().describe("Direct public HTTP/HTTPS URL to fetch & read"),
      }),
      execute: async ({ query, url }) => {
        const res = await runUnrestrictedWebResearch({ query, url, lang: shortLocale });
        params.executedLogs.push(
          url
            ? `[Web Fetch] ${url} -> ${res.ok ? `${(res.extractedText || "").length} chars` : res.error}`
            : `[Web Search] "${query}" -> ${res.results?.length || 0} hits (${res.source})`
        );
        return res;
      },
    }),

    runAndVerifyCode: tool({
      description:
        "Executes self-contained JavaScript (1ms local VM), TypeScript, Python, or Bash scripts and returns stdout, stderr, and exitCode. Any non-zero exit or stderr is automatically distilled into HEYUKA's Reflexion error memory.",
      inputSchema: z.object({
        language: z.enum(["javascript", "typescript", "python", "bash"]),
        code: z.string().min(1).max(24000),
        stdin: z.string().optional(),
      }),
      execute: async ({ language, code, stdin }) => {
        const out = await executePolyglotCodeSandbox({ language, code, stdin, preferFastVm: true });
        if (out.exitCode !== 0 || (out.stderr && out.stderr.trim().length > 0)) {
          recordErrorLessonFromFailure({
            clusterId,
            errorType: "sandbox_stderr",
            errorDetail: `[${language}] exit=${out.exitCode}: ${(out.stderr || out.stdout || "Execution failed").slice(0, 220)}`,
          });
        }
        params.executedLogs.push(
          `[Sandbox:${language}] exit=${out.exitCode} ${out.stdout ? `stdout=${out.stdout.slice(0, 140)}` : `stderr=${(out.stderr || "").slice(0, 140)}`}`
        );
        return out;
      },
    }),

    computeExactFinance: tool({
      description:
        "Runs deterministic financial, TVA/TTC retail pricing, algebra/math expressions, or parallel DAG wave planning with zero arithmetic hallucinations.",
      inputSchema: z.object({
        mode: z.enum(["retail_finance", "math_algebra", "dag_plan"]),
        expression: z.string().optional(),
        unitPrice: z.number().optional(),
        quantity: z.number().optional(),
        vatPercent: z.number().optional(),
        discountPercent: z.number().optional(),
        currencyCode: z.enum(["MAD", "USD", "EUR", "GBP", "SAR", "AED"]).optional(),
        dagTasks: z
          .array(
            z.object({
              id: z.string(),
              label: z.string().optional(),
              dependsOn: z.array(z.string()).optional(),
            })
          )
          .optional(),
      }),
      execute: async (input) => {
        if (input.mode === "retail_finance") {
          return computeExactRetailFinance({
            unitPrice: input.unitPrice ?? 0,
            quantity: input.quantity,
            vatPercent: input.vatPercent,
            discountPercent: input.discountPercent,
            currencyCode: input.currencyCode,
          });
        }
        if (input.mode === "dag_plan") {
          return await planParallelDagWaves(input.dagTasks || []);
        }
        return evaluateMathOrAlgebra(input.expression || "0", true);
      },
    }),

    queryVaultOrApi: tool({
      description:
        "Searches HEYUKA's 2,492+ integrated open-source engines & studied web corpus OR queries 47 live no-key public APIs (FX currency, countries, weather, medicine OpenFDA/PubMed, OSV cyber CVE, OpenAlex, NASA, GitHub/Google Patents).",
      inputSchema: z.object({
        mode: z.enum(["vault_search", "public_api"]),
        query: z.string().min(1),
        apiCategory: z.string().optional().describe("Required if mode=public_api, e.g. frankfurter_fx, weather, pubmed_papers, openalex_science, cyber_threat_intel, wikipedia, google_patents"),
      }),
      execute: async ({ mode, query, apiCategory }) => {
        if (mode === "public_api" && apiCategory) {
          return await queryPublicApiHub({
            category: apiCategory as PublicApiCategory,
            query,
            lang: shortLocale,
            limit: 10,
          });
        }
        ensureFullVaultDigested();
        const corpusHits = searchStudiedKnowledgeCorpus({
          query,
          limit: 20,
          includeWebFirst: true,
        });
        return {
          ok: true,
          totalCorpusUnits: corpusHits.totalCorpusUnits,
          webCrawledUnits: corpusHits.webCrawledUnits,
          studiedMatches: corpusHits.hits,
          matches: searchSovereignVault({ query, limit: 20 }),
        };
      },
    }),

    studyAndCrawlSource: tool({
      description:
        "Recursively crawls public HTTP/HTTPS websites/docs (robots.txt-compliant & SSRF-protected) into persistent studied memory AND searches across all 2,492+ digested Vault sources + crawled web documents.",
      inputSchema: z.object({
        mode: z.enum(["crawl_and_study", "search_studied_corpus"]),
        seedUrls: z.array(z.string()).optional().describe("Public HTTP/HTTPS seed URLs to crawl & digest"),
        query: z.string().optional().describe("Topic query to search digested Vault + crawled pages"),
        maxPages: z.number().int().min(1).max(30).optional(),
      }),
      execute: async ({ mode, seedUrls, query, maxPages }) => {
        ensureFullVaultDigested();
        let crawlResult: Awaited<ReturnType<typeof crawlAndIngestPublicPages>> | null = null;
        if (mode === "crawl_and_study" && seedUrls && seedUrls.length > 0) {
          crawlResult = await crawlAndIngestPublicPages({
            seedUrls,
            maxPages,
            lang: shortLocale,
          });
          params.executedLogs.push(
            `[Web Crawl & Study] ${seedUrls[0]} -> crawled=${crawlResult.crawledCount}, skipped=${crawlResult.skippedCount}, corpus=${crawlResult.totalCorpusUnits}`
          );
        }
        const searchRes = query
          ? searchStudiedKnowledgeCorpus({ query, limit: 16, includeWebFirst: true })
          : null;
        return {
          ok: crawlResult ? crawlResult.ok : true,
          crawlResult,
          corpusSearch: searchRes,
        };
      },
    }),
  };
}

/**
 * Merges newly generated/updated files incrementally into existing Studio workspace files
 * by normalized path instead of erasing previous working project files.
 */
export function mergeStudioWorkspaceFiles(
  existingFiles: WorkspaceFileSummaryInput[],
  incomingFiles: Array<{ path: string; language: string; content: string }>
): Array<{ path: string; language: string; content: string }> {
  if (!incomingFiles || incomingFiles.length === 0) {
    return existingFiles.map((f) => ({
      path: f.path,
      language: f.language || "text",
      content: f.content,
    }));
  }

  const byPath = new Map<string, { path: string; language: string; content: string }>();
  for (const prev of existingFiles) {
    byPath.set(prev.path.toLowerCase(), {
      path: prev.path,
      language: prev.language || "text",
      content: prev.content,
    });
  }
  for (const next of incomingFiles) {
    byPath.set(next.path.toLowerCase(), {
      path: next.path,
      language: next.language || "text",
      content: next.content,
    });
  }
  return Array.from(byPath.values());
}

/**
 * Actively audits, strips leaked chain-of-thought, repairs incomplete markdown/code blocks,
 * and logs Self-Evolution learning traces after generation finishes.
 */
export function auditAndRecordCompletedOutput(params: {
  prompt: string;
  draftText: string;
  expectedLocale: "ar" | "fr" | "en";
  domainMode: CortexDomainMode;
  primaryClusterId: CognitiveClusterId;
  sourcesUsed: string[];
  artifactCount: number;
  modelUsed?: string;
}): {
  cleanedText: string;
  qualityScore: number;
  warnings: string[];
} {
  const gated = runPreReplyReflectionGate({
    draftText: params.draftText,
    expectedLocale: params.expectedLocale,
  });
  const repairInfo = repairTruncatedMarkdownAndCode(gated.cleanedText);
  const repaired = repairInfo.repaired;
  const check = scoreSelfCheckConsistency({
    draftText: repaired,
    expectedLocale: params.expectedLocale,
  });

  try {
    if (repairInfo.wasRepaired) {
      recordErrorLessonFromFailure({
        clusterId: params.primaryClusterId,
        errorType: "truncation",
        errorDetail: `Response truncated mid-fence/tag on "${params.prompt.slice(0, 90)}"; auto-repaired output.`,
      });
    }
    if (check.warnings.length > 0) {
      recordErrorLessonFromFailure({
        clusterId: params.primaryClusterId,
        errorType: "selfcheck_warning",
        errorDetail: check.warnings.join(" | "),
      });
    }

    const productKind =
      params.domainMode === "software_architecture"
        ? params.artifactCount >= 2
          ? "project"
          : "code"
        : params.domainMode === "document_design"
        ? "document"
        : params.domainMode === "research_analysis"
        ? "research"
        : "project";

    recordProductSelfEvolution({
      prompt: params.prompt,
      clusterId: params.primaryClusterId,
      productKind,
      sourcesUsed: Array.from(new Set(params.sourcesUsed.filter(Boolean))),
      outputFormats: [
        /```html/i.test(repaired) ? "HTML/PDF" : "Markdown",
        ...(params.artifactCount > 0 ? ["Files"] : []),
      ],
      artifactCount: Math.max(1, params.artifactCount),
      totalBytes: repaired.length,
      qualityScore: Math.max(0.5, check.selfCheckScore / 10),
      modelUsed: params.modelUsed || "heyuka-cortex-v2.5",
    });
  } catch {
    // Non-fatal learning telemetry
  }

  return {
    cleanedText: repaired,
    qualityScore: check.selfCheckScore,
    warnings: check.warnings,
  };
}
