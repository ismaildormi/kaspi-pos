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
import { runMctsDeepReasoner } from "@/lib/zebra-x/cognition/secret2_mcts_reasoner";
import {
  simulate3dPhysicsStability,
  simulateKaspiMarketWorld,
} from "@/lib/zebra-x/simulation/secret3_world_sim";
import {
  discoverSymbolicLaw,
  solveArcFewShotGrid,
  synthesizeCrossDomainInvention,
} from "@/lib/zebra-x/cognition/secret4_fluid_invention";
import {
  executeForgedTool,
  forgeAndVerifyMicroTool,
  listForgedTools,
} from "@/lib/zebra-x/evolution/secret5_tool_forge";
import { recallAssociativeContext } from "@/lib/zebra-x/cognition/secret7_dual_brain_orchestrator";
import {
  fetchHyperLocalLiveSnapshot,
  resolveDarijaCommercialTerms,
  validateMoroccoDgiInvoice,
} from "@/lib/zebra-x/omega/secret10_hyper_local_grounding";
import { buildMorphWidgetMarker } from "@/lib/zebra-x/omega/secret12_generative_ui";
import { rankOptionsWithTopsis } from "@/lib/zebra-x/dominance/secret1_scenario_master";

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
    limit: 8,
    includeWebFirst: true,
  });

  // Supplement with exact cluster matches if studied query hits are light
  const vaultFallbackHits =
    studiedSearch.hits.length < 5
      ? searchSovereignVault({ clusterId: cognitiveRoute.primaryCluster.id, limit: 5 })
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
    const excerpt = hit.content.replace(/\s+/g, " ").trim().slice(0, 95);
    unifiedLines.push(`- ${hit.title} [${kindTag}]: ${excerpt}${hit.url ? ` (${hit.url})` : ""}`);
  }
  for (const v of vaultFallbackHits) {
    const key = v.name.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    recommendedNames.push(v.name);
    unifiedLines.push(`- ${v.name} [${v.clusterId}]: ${v.role.slice(0, 95)}${v.url ? ` (${v.url})` : ""}`);
  }

  const evolution = getSelfEvolutionContextForPrompt({
    prompt: params.prompt,
    clusterId: cognitiveRoute.primaryCluster.id,
  });

  const errorPreventionBlock =
    evolution.learnedErrorLessons.length > 0
      ? `[REFLEXION LESSONS (${evolution.learnedErrorLessons.length})]\n${evolution.learnedErrorLessons
          .slice(0, 4)
          .map((l) => `- [${l.errorType} x${l.occurrences}] ${l.preventionRule.slice(0, 110)}`)
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

  const episodicHits = recallAssociativeContext(params.prompt, 3);
  const episodicBlock =
    episodicHits.length > 0
      ? `[EPISODIC MEMORY GRAPH]: ${episodicHits
          .map((e) => `${e.concept}->[${e.relatedConcepts.slice(0, 3).join(",")}]${e.wisdomNotes[0] ? ` (${e.wisdomNotes[0]})` : ""}`)
          .join(" | ")}`
      : "";

  const activeMemoryPromptBlock = [
    `[ANTIGRAVITY CORTEX v2.5 | ${domainMode.toUpperCase()} | ${cognitiveRoute.primaryCluster.titleEn} | ${v60Totals.grandTotalSources}+ Vault + ${studiedSearch.totalCorpusUnits} Units (${studiedSearch.webCrawledUnits} Web)]`,
    personaDirective,
    errorPreventionBlock,
    episodicBlock,
    "[MATCHED CORPUS & VAULT (Full 2493+ searchable via queryVaultOrApi/studyAndCrawlSource)]",
    enginesCatalogSnippet,
    fileTreeSummary ? `[WORKSPACE FILES (${params.workspaceFiles?.length})]\n${fileTreeSummary}` : "",
    "[PROTOCOL]",
    "1. ACTION-FIRST ZERO-FLUFF (v89.0): Start building/computing immediately when asked to create an app, report, calculation, or UI—emit runnable files, calculators/charts (`[KASPI_MORPH_WIDGET:...]`), or verified results instead of theoretical essays.",
    "2. INSPECT FIRST & HUMAN WARMTH: Read workspace/web/corpus before guessing. Match user Darija/Arabic/FR/EN naturally without robotic AI clichés.",
    "3. ZERO RUNTIME ERRORS: Match all DOM IDs between HTML/CSS/JS and guard selectors (`el?.addEventListener`). Verify JS/Python via `runAndVerifyCode` and Morocco DGI/TVA math via tools.",
    "4. COMPLETE OUTPUT: Finish every requested file and section completely without placeholders or `TODO` stubs.",
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

export interface AgentActionStep {
  id: string;
  kind: "think" | "read" | "edit" | "create" | "search" | "run" | "crawl" | "verify";
  title: string;
  target?: string;
  delta?: string;
  status: "running" | "done" | "error";
  detail?: string;
  durationMs?: number;
}

export interface StudioMutatedFile {
  path: string;
  language: string;
  content: string;
  linesAdded: number;
  linesRemoved: number;
  operation: "create" | "edit";
}

function inferLangFromFilePath(filePath: string, explicitLang?: string): string {
  if (explicitLang && explicitLang.trim()) return explicitLang.trim().toLowerCase();
  const ext = filePath.split(".").pop()?.toLowerCase() || "text";
  if (ext === "py") return "python";
  if (ext === "js" || ext === "mjs" || ext === "cjs") return "javascript";
  if (ext === "ts") return "ts";
  if (ext === "tsx") return "tsx";
  if (ext === "jsx") return "jsx";
  if (ext === "sh") return "bash";
  if (ext === "md") return "markdown";
  return ext;
}

function computeLineDeltaCounts(prevText: string, nextText: string): { added: number; removed: number } {
  if (!prevText) return { added: nextText ? nextText.split(/\r?\n/).length : 0, removed: 0 };
  const prevLines = prevText.split(/\r?\n/);
  const nextLines = nextText.split(/\r?\n/);
  const prevSet = new Set(prevLines);
  const nextSet = new Set(nextLines);
  let added = 0;
  let removed = 0;
  for (const l of nextLines) {
    if (!prevSet.has(l)) added += 1;
  }
  for (const l of prevLines) {
    if (!nextSet.has(l)) removed += 1;
  }
  return { added: Math.max(added, prevLines.length < nextLines.length ? nextLines.length - prevLines.length : 0), removed };
}

/**
 * Real Executable AI SDK Toolset for Studio IDE & Chat-Web (`/api/v1/heyuka/chat-web`):
 * Enables genuine Antigravity-grade ReAct cycles: list/inspect/search workspace files -> surgically edit/write files -> crawl/search web -> verify in sandbox -> synthesize.
 */
export function createStudioAgentToolkit(params: {
  workspaceFiles?: WorkspaceFileSummaryInput[];
  locale: "ar" | "fr" | "en";
  executedLogs: string[];
  primaryClusterId?: CognitiveClusterId;
  onActionStep?: (step: AgentActionStep) => void;
  onFileMutated?: (file: StudioMutatedFile) => void;
}) {
  const shortLocale = params.locale;
  const clusterId = params.primaryClusterId || "code_ide_and_surgical_editing";

  const workingFiles = new Map<string, { path: string; language: string; content: string }>();
  for (const f of params.workspaceFiles || []) {
    const cleanPath = String(f.path || "").replace(/^\.?\//, "");
    if (!cleanPath) continue;
    workingFiles.set(cleanPath.toLowerCase(), {
      path: cleanPath,
      language: inferLangFromFilePath(cleanPath, f.language),
      content: String(f.content || ""),
    });
  }

  const resolveFileKey = (rawPath: string) => {
    const clean = rawPath.replace(/^\.?\//, "").toLowerCase();
    if (workingFiles.has(clean)) return clean;
    for (const [k, v] of workingFiles.entries()) {
      if (v.path.toLowerCase() === clean || v.path.toLowerCase().endsWith(`/${clean}`)) return k;
    }
    return null;
  };

  const emitStep = (step: Omit<AgentActionStep, "id">) => {
    params.onActionStep?.({
      id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...step,
    });
  };

  return {
    listWorkspaceFiles: tool({
      description:
        "Lists all files currently in the Antigravity Studio workspace with their language, line counts, and byte sizes.",
      inputSchema: z.object({}),
      execute: async () => {
        const list = Array.from(workingFiles.values()).map((f) => ({
          path: f.path,
          language: f.language,
          lines: f.content ? f.content.split(/\r?\n/).length : 0,
          bytes: f.content.length,
        }));
        emitStep({
          kind: "read",
          title: `Listed workspace (${list.length} files)`,
          status: "done",
        });
        return { count: list.length, files: list };
      },
    }),

    inspectWorkspaceFile: tool({
      description:
        "Reads an existing file (full text or specific line range) in the current Antigravity Studio workspace before editing or extending it.",
      inputSchema: z.object({
        path: z.string().min(1).describe("File path in workspace"),
        startLine: z.number().int().min(1).optional(),
        endLine: z.number().int().min(1).optional(),
      }),
      execute: async ({ path, startLine, endLine }) => {
        const key = resolveFileKey(path);
        const found = key ? workingFiles.get(key) : undefined;
        if (!found) {
          emitStep({
            kind: "read",
            title: `File not found: ${path}`,
            target: path,
            status: "error",
          });
          return {
            found: false,
            availableFiles: Array.from(workingFiles.values()).map((f) => f.path),
          };
        }
        const allLines = found.content.split(/\r?\n/);
        const sIdx = startLine ? Math.max(0, startLine - 1) : 0;
        const eIdx = endLine ? Math.min(allLines.length, endLine) : allLines.length;
        const sliceText = allLines.slice(sIdx, eIdx).join("\n").slice(0, 28000);
        const rangeLabel = startLine || endLine ? `L${sIdx + 1}-L${eIdx}` : `${allLines.length} lines`;
        emitStep({
          kind: "read",
          title: `Analyzed ${found.path}`,
          target: found.path,
          detail: rangeLabel,
          status: "done",
        });
        params.executedLogs.push(`[Read] ${found.path} (${rangeLabel})`);
        return {
          found: true,
          path: found.path,
          language: found.language,
          totalLines: allLines.length,
          startLine: sIdx + 1,
          endLine: eIdx,
          content: sliceText,
        };
      },
    }),

    searchWorkspaceFiles: tool({
      description:
        "Searches text or symbols across all files in the current workspace (grep) and returns matching file paths and line numbers.",
      inputSchema: z.object({
        query: z.string().min(1),
      }),
      execute: async ({ query }) => {
        const needle = query.toLowerCase();
        const matches: Array<{ path: string; line: number; text: string }> = [];
        for (const f of workingFiles.values()) {
          const lines = f.content.split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(needle)) {
              matches.push({ path: f.path, line: i + 1, text: lines[i].trim().slice(0, 140) });
              if (matches.length >= 40) break;
            }
          }
          if (matches.length >= 40) break;
        }
        emitStep({
          kind: "search",
          title: `Searched workspace for "${query.slice(0, 32)}"`,
          detail: `${matches.length} matches`,
          status: "done",
        });
        return { query, matchCount: matches.length, matches };
      },
    }),

    writeWorkspaceFile: tool({
      description:
        "Creates a new file or updates an entire file directly inside the Antigravity Studio workspace IDE immediately (users see it live in Files & Changes).",
      inputSchema: z.object({
        path: z.string().min(1).describe("Relative file path e.g. index.html, styles.css, store.js"),
        language: z.string().optional().describe("File language e.g. html, css, js, tsx, python"),
        content: z.string().min(1).describe("Complete runnable file contents with zero placeholders"),
      }),
      execute: async ({ path, language, content }) => {
        const cleanPath = path.replace(/^\.?\//, "");
        const key = cleanPath.toLowerCase();
        const prev = workingFiles.get(key);
        const resolvedLang = inferLangFromFilePath(cleanPath, language);
        const { added, removed } = computeLineDeltaCounts(prev?.content || "", content);
        workingFiles.set(key, { path: cleanPath, language: resolvedLang, content });
        const operation: "create" | "edit" = prev ? "edit" : "create";
        const deltaStr = `+${added}${removed > 0 ? ` -${removed}` : ""}`;
        params.onFileMutated?.({
          path: cleanPath,
          language: resolvedLang,
          content,
          linesAdded: added,
          linesRemoved: removed,
          operation,
        });
        emitStep({
          kind: operation,
          title: `${operation === "create" ? "Created" : "Updated"} ${cleanPath}`,
          target: cleanPath,
          delta: deltaStr,
          status: "done",
        });
        params.executedLogs.push(`[${operation === "create" ? "Create" : "Write"}] ${cleanPath} (${deltaStr})`);
        return {
          ok: true,
          operation,
          path: cleanPath,
          lines: content.split(/\r?\n/).length,
          delta: deltaStr,
        };
      },
    }),

    editWorkspaceFile: tool({
      description:
        "Surgically replaces an exact block of existing code inside a workspace file without rewriting the whole file. Always inspectWorkspaceFile first so target matches verbatim.",
      inputSchema: z.object({
        path: z.string().min(1),
        target: z.string().min(1).describe("Exact existing text block inside the file"),
        replacement: z.string().describe("New text to replace target with"),
      }),
      execute: async ({ path, target, replacement }) => {
        const key = resolveFileKey(path);
        const existing = key ? workingFiles.get(key) : undefined;
        if (!existing) {
          emitStep({ kind: "edit", title: `Edit failed (${path} not found)`, target: path, status: "error" });
          return { ok: false, error: `File "${path}" not found in workspace.` };
        }
        if (!existing.content.includes(target)) {
          emitStep({ kind: "edit", title: `Target block mismatch in ${existing.path}`, target: existing.path, status: "error" });
          return {
            ok: false,
            error: `Target snippet was not found verbatim in ${existing.path}. Inspect the file and retry with exact lines.`,
          };
        }
        const nextContent = existing.content.split(target).join(replacement);
        const { added, removed } = computeLineDeltaCounts(existing.content, nextContent);
        const deltaStr = `+${added} -${removed}`;
        workingFiles.set(key!, { ...existing, content: nextContent });
        params.onFileMutated?.({
          path: existing.path,
          language: existing.language,
          content: nextContent,
          linesAdded: added,
          linesRemoved: removed,
          operation: "edit",
        });
        emitStep({
          kind: "edit",
          title: `Edited ${existing.path}`,
          target: existing.path,
          delta: deltaStr,
          status: "done",
        });
        params.executedLogs.push(`[Edit] ${existing.path} (${deltaStr})`);
        return { ok: true, path: existing.path, delta: deltaStr, totalLines: nextContent.split(/\r?\n/).length };
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
        const t0 = Date.now();
        const res = await runUnrestrictedWebResearch({ query, url, lang: shortLocale });
        emitStep({
          kind: "search",
          title: url ? `Fetched ${url.slice(0, 44)}` : `Searched web: "${(query || "").slice(0, 36)}"`,
          detail: url ? `${(res.extractedText || "").length} chars` : `${res.results?.length || 0} hits`,
          status: res.ok ? "done" : "error",
          durationMs: Date.now() - t0,
        });
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
        "Executes JavaScript (1ms local VM), TypeScript, Python, or Bash — either inline `code` OR a workspace file (`workspaceFilePath`) — and returns stdout, stderr, and exitCode.",
      inputSchema: z.object({
        language: z.enum(["javascript", "typescript", "python", "bash"]),
        code: z.string().optional().describe("Inline code to execute"),
        workspaceFilePath: z.string().optional().describe("Optional workspace file path to execute/check"),
        stdin: z.string().optional(),
      }),
      execute: async ({ language, code, workspaceFilePath, stdin }) => {
        const t0 = Date.now();
        let codeToRun = code || "";
        if (!codeToRun && workspaceFilePath) {
          const key = resolveFileKey(workspaceFilePath);
          const f = key ? workingFiles.get(key) : undefined;
          if (!f) {
            return { exitCode: 1, stdout: "", stderr: `Workspace file ${workspaceFilePath} not found.` };
          }
          codeToRun = f.content;
        }
        if (!codeToRun.trim()) {
          return { exitCode: 1, stdout: "", stderr: "Provide inline code or workspaceFilePath." };
        }
        const out = await executePolyglotCodeSandbox({ language, code: codeToRun, stdin, preferFastVm: true });
        if (out.exitCode !== 0 || (out.stderr && out.stderr.trim().length > 0)) {
          recordErrorLessonFromFailure({
            clusterId,
            errorType: "sandbox_stderr",
            errorDetail: `[${language}] exit=${out.exitCode}: ${(out.stderr || out.stdout || "Execution failed").slice(0, 220)}`,
          });
        }
        emitStep({
          kind: "run",
          title: `Ran ${workspaceFilePath || language} in Sandbox`,
          detail: `exit=${out.exitCode}`,
          status: out.exitCode === 0 ? "done" : "error",
          durationMs: Date.now() - t0,
        });
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
        emitStep({
          kind: "verify",
          title:
            input.mode === "retail_finance"
              ? "Computed TVA/TTC retail arithmetic"
              : input.mode === "dag_plan"
                ? "Planned parallel DAG execution waves"
                : `Evaluated math: ${(input.expression || "").slice(0, 32)}`,
          status: "done",
        });
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
          const apiOut = await queryPublicApiHub({
            category: apiCategory as PublicApiCategory,
            query,
            lang: shortLocale,
            limit: 10,
          });
          emitStep({
            kind: "search",
            title: `Queried live API: ${apiCategory}`,
            detail: apiOut.ok ? "200 OK" : "fallback",
            status: apiOut.ok ? "done" : "error",
          });
          return apiOut;
        }
        ensureFullVaultDigested();
        const corpusHits = searchStudiedKnowledgeCorpus({
          query,
          limit: 20,
          includeWebFirst: true,
        });
        emitStep({
          kind: "search",
          title: `Searched Vault & Corpus (${corpusHits.totalCorpusUnits} units)`,
          detail: `${corpusHits.hits.length} matches`,
          status: "done",
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
          emitStep({
            kind: "crawl",
            title: `Crawled & studied ${crawlResult.crawledCount} web page(s)`,
            target: seedUrls[0],
            detail: `${crawlResult.totalCorpusUnits} corpus units`,
            status: crawlResult.ok ? "done" : "error",
          });
          params.executedLogs.push(
            `[Web Crawl & Study] ${seedUrls[0]} -> crawled=${crawlResult.crawledCount}, skipped=${crawlResult.skippedCount}, corpus=${crawlResult.totalCorpusUnits}`
          );
        }
        const searchRes = query
          ? searchStudiedKnowledgeCorpus({ query, limit: 16, includeWebFirst: true })
          : null;
        if (!crawlResult && searchRes) {
          emitStep({
            kind: "search",
            title: `Searched studied corpus (${searchRes.hits.length} hits)`,
            status: "done",
          });
        }
        return {
          ok: crawlResult ? crawlResult.ok : true,
          crawlResult,
          corpusSearch: searchRes,
        };
      },
    }),

    reasonWithMctsTree: tool({
      description:
        "Secret #2 MCTS Deep Reasoner: Explores parallel solution branches with PUCT, verifies math symbolically, prunes weak paths, and runs Chain-of-Verification.",
      inputSchema: z.object({
        prompt: z.string().min(3),
        thinkingBudget: z.number().int().min(512).max(32768).optional(),
      }),
      execute: async ({ prompt, thinkingBudget }) => {
        const res = await runMctsDeepReasoner({ prompt, thinkingBudget, locale: shortLocale });
        emitStep({
          kind: "verify",
          title: `MCTS Search (${res.exploredNodesCount} nodes • ${Math.round(res.confidence * 100)}%)`,
          status: "done",
          durationMs: Math.round(res.durationMs),
        });
        return res;
      },
    }),

    simulateWorldOrMarket: tool({
      description:
        "Secret #3 World Simulator: Simulates either 3D rigid-body stability/collisions OR multi-day KASPI POS retail queue, stockout & margin elasticity.",
      inputSchema: z.object({
        domain: z.enum(["kaspi_market", "physics_3d"]),
        days: z.number().int().min(7).max(90).optional(),
        dailyCustomers: z.number().int().min(10).max(2000).optional(),
        avgBasketMad: z.number().min(5).optional(),
        cashierLanes: z.number().int().min(1).max(12).optional(),
        bodies: z
          .array(
            z.object({
              id: z.string(),
              widthM: z.number(),
              heightM: z.number(),
              depthM: z.number(),
              massKg: z.number(),
            })
          )
          .optional(),
      }),
      execute: async (input) => {
        if (input.domain === "physics_3d") {
          const out = simulate3dPhysicsStability(input.bodies || []);
          emitStep({ kind: "run", title: `3D Physics Sim (${out.bodiesAudited} bodies)`, status: "done" });
          return out;
        }
        const marketOut = simulateKaspiMarketWorld(input);
        emitStep({
          kind: "run",
          title: `KASPI Market Sim (${marketOut.daysSimulated}d: ${marketOut.projectedRevenueMad} MAD)`,
          status: "done",
        });
        return marketOut;
      },
    }),

    inventWithArcAndTriz: tool({
      description:
        "Secret #4 Fluid Intelligence: Solves few-shot ARC-AGI grids, discovers mathematical formulas from (x,y) points (PySR-style R^2), or synthesizes TRIZ cross-domain blueprints.",
      inputSchema: z.object({
        mode: z.enum(["arc_grid", "symbolic_law", "triz_invent"]),
        challenge: z.string().optional(),
        trainPairs: z
          .array(
            z.object({
              input: z.array(z.array(z.number())),
              output: z.array(z.array(z.number())),
            })
          )
          .optional(),
        testInput: z.array(z.array(z.number())).optional(),
        points: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
      }),
      execute: async (input) => {
        if (input.mode === "arc_grid") {
          const res = solveArcFewShotGrid({
            trainPairs: input.trainPairs || [],
            testInput: input.testInput || [[]],
          });
          emitStep({ kind: "think", title: `ARC Solver: ${res.discoveredProgram}`, status: "done" });
          return res;
        }
        if (input.mode === "symbolic_law") {
          const res = discoverSymbolicLaw(input.points || []);
          emitStep({ kind: "think", title: `Symbolic Law (${res.equation})`, status: "done" });
          return res;
        }
        const inv = synthesizeCrossDomainInvention({ challenge: input.challenge || "Modular innovation" });
        emitStep({ kind: "think", title: `TRIZ Synthesis (${inv.crossDomainBridge.sourceScience})`, status: "done" });
        return inv;
      },
    }),

    forgeAndRunSkill: tool({
      description:
        "Secret #5 Voyager Tool Forge: Synthesizes, security-scans, fuzz-tests, and executes reusable custom JS micro-tools (`function runTool(input)`).",
      inputSchema: z.object({
        action: z.enum(["list", "forge", "run"]),
        toolId: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        implementationJs: z.string().optional(),
        testCases: z
          .array(z.object({ input: z.record(z.string(), z.unknown()), expected: z.unknown() }))
          .optional(),
        runInput: z.record(z.string(), z.unknown()).optional(),
      }),
      execute: async (input) => {
        if (input.action === "list") return { ok: true, tools: listForgedTools() };
        if (input.action === "forge") {
          const res = await forgeAndVerifyMicroTool({
            name: input.name || "forged_skill",
            description: input.description || "Custom forged skill",
            implementationJs: input.implementationJs || "function runTool(i){ return i; }",
            testCases: input.testCases || [],
          });
          emitStep({
            kind: res.ok ? "create" : "verify",
            title: res.ok ? `Forged Skill '${res.tool?.name}' verified` : "Tool forge blocked",
            status: res.ok ? "done" : "error",
          });
          return res;
        }
        const exec = executeForgedTool({ toolId: input.toolId || "", input: input.runInput || {} });
        emitStep({
          kind: "run",
          title: `Executed Skill '${exec.toolId}'`,
          status: exec.ok ? "done" : "error",
        });
        return exec;
      },
    }),

    validateMoroccoDgiAndFx: tool({
      description:
        "Secret #10 Hyper-Local Morocco & Global Grounding: Validates DGI CGI Article 145 invoices (15-digit ICE, 0/7/10/14/20% TVA, 0.25% cash timbre, NF525 seal), resolves Darija commerce terms (كريدي/بون/كمبيالة), OR fetches live city weather/FX/barcode data.",
      inputSchema: z.object({
        mode: z.enum(["dgi_invoice", "darija_terms", "hyper_local_live"]),
        invoiceNumber: z.string().optional(),
        sellerIce: z.string().optional(),
        subtotalHtMad: z.number().optional(),
        vatRatePct: z.number().optional(),
        declaredTtcMad: z.number().optional(),
        paymentMethod: z.enum(["cash", "card", "transfer", "cheque"]).optional(),
        text: z.string().optional(),
        cityQuery: z.string().optional(),
        barcode: z.string().optional(),
      }),
      execute: async (input) => {
        if (input.mode === "dgi_invoice") {
          const audit = validateMoroccoDgiInvoice({
            invoiceNumber: input.invoiceNumber || "INV-2026-001",
            sellerIce: input.sellerIce || "",
            subtotalHtMad: input.subtotalHtMad ?? 0,
            vatRatePct: input.vatRatePct ?? 20,
            declaredTtcMad: input.declaredTtcMad,
            paymentMethod: input.paymentMethod,
          });
          emitStep({
            kind: "verify",
            title: audit.compliantDgiArticle145 ? "DGI Art.145 & NF525 Verified" : "DGI Invoice Issue Found",
            status: audit.compliantDgiArticle145 ? "done" : "error",
          });
          return audit;
        }
        if (input.mode === "darija_terms") {
          return { ok: true, matches: resolveDarijaCommercialTerms(input.text || "") };
        }
        const live = await fetchHyperLocalLiveSnapshot({ cityQuery: input.cityQuery, barcode: input.barcode });
        emitStep({ kind: "search", title: `Hyper-Local Geo/FX/Weather (${input.cityQuery || "Morocco"})`, status: "done" });
        return live;
      },
    }),

    solveTopsisOrEmitInteractiveWidget: tool({
      description:
        "Secret #12 Generative Morphing UI + Dominance v90.1 TOPSIS Decision Ranker: Ranks competing strategies mathematically OR emits `[KASPI_MORPH_WIDGET:...]` to render interactive calculators, TOPSIS sliders, or live charts inside chat.",
      inputSchema: z.object({
        mode: z.enum(["profit_calculator_widget", "market_chart_widget", "topsis_decision_widget"]),
        title: z.string(),
        unitPrice: z.number().optional(),
        unitCost: z.number().optional(),
        monthlyUnits: z.number().optional(),
        vatPct: z.number().optional(),
        bars: z.array(z.object({ label: z.string(), value: z.number() })).optional(),
        options: z
          .array(
            z.object({
              name: z.string(),
              benefit: z.number(),
              speed: z.number(),
              lowRisk: z.number(),
            })
          )
          .optional(),
      }),
      execute: async (input) => {
        if (input.mode === "profit_calculator_widget") {
          const marker = buildMorphWidgetMarker({
            kind: "profit_calculator",
            title: input.title,
            currency: "MAD",
            unitPrice: input.unitPrice ?? 150,
            unitCost: input.unitCost ?? 90,
            monthlyUnits: input.monthlyUnits ?? 200,
            vatPct: input.vatPct ?? 20,
            discountPct: 0,
          });
          emitStep({ kind: "create", title: "Emitted Interactive Profit Calculator UI", status: "done" });
          return { ok: true, inlineMarkerToIncludeInReply: marker };
        }
        if (input.mode === "market_chart_widget") {
          const marker = buildMorphWidgetMarker({
            kind: "market_chart",
            title: input.title,
            unitLabel: "MAD",
            bars: input.bars && input.bars.length > 0 ? input.bars : [{ label: "Baseline", value: 12000 }],
          });
          emitStep({ kind: "create", title: "Emitted Live Market Chart UI", status: "done" });
          return { ok: true, inlineMarkerToIncludeInReply: marker };
        }
        const opts = input.options && input.options.length >= 2
          ? input.options
          : [
              { name: "Option A (Modular Cloud-Free)", benefit: 9, speed: 9, lowRisk: 9 },
              { name: "Option B (Legacy Heavyweight)", benefit: 6, speed: 4, lowRisk: 5 },
            ];
        const topsis = rankOptionsWithTopsis(
          opts.map((o, i) => ({ id: `opt_${i}`, name: o.name, scores: { benefit: o.benefit, speed: o.speed, lowRisk: o.lowRisk } })),
          [
            { key: "benefit", weight: 0.5, polarity: "benefit" },
            { key: "speed", weight: 0.3, polarity: "benefit" },
            { key: "lowRisk", weight: 0.2, polarity: "benefit" },
          ]
        );
        const marker = buildMorphWidgetMarker({
          kind: "decision_matrix",
          title: input.title,
          weights: { benefit: 0.5, speed: 0.3, lowRisk: 0.2 },
          options: opts,
        });
        emitStep({ kind: "verify", title: `TOPSIS Decision Matrix (#1: ${topsis[0]?.name})`, status: "done" });
        return { ok: true, topsisRanking: topsis, inlineMarkerToIncludeInReply: marker };
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
