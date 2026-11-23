import { tool } from "ai";
import { z } from "zod";
import {
  classifyCognitiveIntentAndSources,
  getTotalIntegratedCapabilitiesCount,
  type CognitiveClusterId,
} from "@/lib/zebra-x/core/cognitive-brain-registry";
import {
  getSelfEvolutionContextForPrompt,
  recordProductSelfEvolution,
} from "@/lib/heyuka/learning/self-evolution-engine";
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
  matchedVaultCount: number;
  activeMemoryPromptBlock: string;
  recommendedSourcesForTrace: string[];
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
}): CortexWorkingMemory {
  const domainMode = classifyUniversalDomainMode(params.prompt, params.workspaceFiles);
  const cognitiveRoute = classifyCognitiveIntentAndSources(params.prompt, params.locale);
  const v60Totals = getTotalIntegratedCapabilitiesCount();

  // Retrieve top exact engines from ALL 2,492 Sovereign Vault entries for this specific prompt
  const queryHits = searchSovereignVault({ query: params.prompt, limit: 8 });
  const clusterHits =
    queryHits.length < 6
      ? searchSovereignVault({ clusterId: cognitiveRoute.primaryCluster.id, limit: 6 })
      : [];
  const mergedHitsMap = new Map<string, (typeof queryHits)[number]>();
  for (const item of [...queryHits, ...clusterHits]) {
    if (!mergedHitsMap.has(item.id)) mergedHitsMap.set(item.id, item);
  }
  const activeVaultEngines = Array.from(mergedHitsMap.values()).slice(0, 10);

  const evolution = getSelfEvolutionContextForPrompt({
    prompt: params.prompt,
    clusterId: cognitiveRoute.primaryCluster.id,
  });

  const fileTreeSummary =
    params.workspaceFiles && params.workspaceFiles.length > 0
      ? params.workspaceFiles
          .slice(0, 16)
          .map(
            (f) =>
              `- ${f.path} (${f.language || "text"}, ${f.content.split(/\r?\n/).length} lines, ${f.content.length}B)`
          )
          .join("\n")
      : "";

  const enginesCatalogSnippet = activeVaultEngines
    .map(
      (e) =>
        `- ${e.name} [${e.clusterId}]: ${e.role}${e.url ? ` — Docs/Repo: ${e.url}` : ""}`
    )
    .join("\n");

  const secondaryIds = cognitiveRoute.matchedClusters
    .slice(1, 4)
    .map((c) => c.id);

  const activeMemoryPromptBlock = [
    "[ANTIGRAVITY COGNITIVE CORTEX v2 — UNIFIED AUTONOMOUS BRAIN]",
    `• Identity & Surface Parity: HEYUKA (${params.brand === "kaspi_pos" ? "KASPI POS Architect" : "Universal Sovereign AI"}) operating at equal capability parity across POS Chat, Standalone Chat, Studio IDE, and API.`,
    `• Active Task Mode: ${domainMode.toUpperCase()} | Primary Cluster: ${cognitiveRoute.primaryCluster.titleEn} (${v60Totals.grandTotalSources}+ Total Integrated Sources)`,
    `• Distilled Evolution Memory: ${evolution.evolutionSummary}`,
    "",
    "[MATCHED OPEN-SOURCE ENGINES & CLICKABLE SOURCES FOR THIS REQUEST]",
    enginesCatalogSnippet,
    fileTreeSummary ? `\n[CURRENT WORKSPACE FILE TREE (${params.workspaceFiles?.length} files)]\n${fileTreeSummary}` : "",
    "",
    "[SIX-STEP COGNITIVE REASONING & EXECUTION METHOD]",
    "1. UNDERSTAND & INSPECT FIRST: Read workspace files, live store metrics, and web/API sources BEFORE making assumptions or inventing facts/paths.",
    '2. HIDDEN STRUCTURED DELIBERATION: Think through architecture, dependencies, edge cases, and calculations cleanly inside <think>...</think> (never leak internal monologue or English meta-instructions like "We need to call..." into user-facing prose).',
    "3. ITERATIVE TOOL USE & VERIFICATION: Run tools (webSearchAndFetch / unrestrictedWebSearch, computeExactFinance / evaluateMathAndFinance, runAndVerifyCode / executeCodeSandbox, queryVaultOrApi / queryPublicApi) iteratively to verify numbers and test generated code. If code errors, diagnose & repair it before concluding.",
    "4. INCREMENTAL MULTI-FILE BUILDING: When evolving a project, keep unrelated working files intact; emit complete, clean files (```lang path=relative/file.ext) with zero TODO stubs or truncation.",
    "5. MULTI-DOMAIN FLUENCY & LINKS: Adapt tone naturally to the user's sector and dialect (Darija/Arabic/Tarifit/French/English) across tech, commerce, finance, science, medicine, law analysis, creative writing, and everyday topics — always embedding real clickable Markdown links ([Name](https://...)) when citing tools/docs/sites outside code blocks.",
    "6. COMPLETE UNSTOPPED DELIVERY: Finish every section, comparison table, HTML preview/invoice, script, and CLI step cleanly down to the last character.",
    "",
    getDomainPlaybookGuidance(domainMode, Boolean(params.isStudio)),
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .trim();

  return {
    domainMode,
    primaryClusterId: cognitiveRoute.primaryCluster.id,
    secondaryClusterIds: secondaryIds,
    vaultTotalSources: v60Totals.grandTotalSources,
    matchedVaultCount: activeVaultEngines.length,
    activeMemoryPromptBlock,
    recommendedSourcesForTrace: activeVaultEngines.map((e) => e.name),
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
}) {
  const wsFiles = params.workspaceFiles || [];
  const shortLocale = params.locale;

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
        "Executes JavaScript, TypeScript, Python, or Bash code inside the real HEYUKA sandbox and returns stdout, stderr, and exitCode so you can test and fix code BEFORE delivering.",
      inputSchema: z.object({
        language: z.enum(["javascript", "typescript", "python", "bash"]),
        code: z.string().min(1).max(14000),
        stdin: z.string().optional(),
      }),
      execute: async ({ language, code, stdin }) => {
        const out = await executePolyglotCodeSandbox({ language, code, stdin });
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
        "Searches HEYUKA's 2,492+ integrated open-source engines OR queries 47 live no-key public APIs (FX currency, countries, weather, medicine OpenFDA/PubMed, OSV cyber CVE, OpenAlex, NASA, GitHub/Google Patents).",
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
            limit: 6,
          });
        }
        return {
          ok: true,
          matches: searchSovereignVault({ query, limit: 12 }),
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
  const repaired = repairTruncatedMarkdownAndCode(gated.cleanedText).repaired;
  const check = scoreSelfCheckConsistency({
    draftText: repaired,
    expectedLocale: params.expectedLocale,
  });

  try {
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
      sourcesUsed: params.sourcesUsed.slice(0, 12),
      outputFormats: [
        /```html/i.test(repaired) ? "HTML/PDF" : "Markdown",
        ...(params.artifactCount > 0 ? ["Files"] : []),
      ],
      artifactCount: Math.max(1, params.artifactCount),
      totalBytes: repaired.length,
      qualityScore: Math.max(0.5, check.selfCheckScore / 10),
      modelUsed: params.modelUsed || "heyuka-cortex-v2",
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
