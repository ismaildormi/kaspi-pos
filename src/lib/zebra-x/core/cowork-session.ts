import Dexie, { type Table } from "dexie";
import { assertPosCoreImmutable } from "@/lib/zebra-x/arsenal-vault";
import { scrubTraceText } from "@/lib/zebra-x/learning-trace";
import type { SkillDomainBucket } from "./skills-vault";

/**
 * HEYUKA / YUKA — Persistent Cowork Sessions & Claude-Grade Context Hygiene (`v12.1`–`v12.5`)
 * Implements:
 * 1. Persistent Cowork Checkpoints & Live Task Checklist (`Dexie` IndexedDB + SSR map fallback)
 * 2. Browser Workspace Directory Cowork (`File System Access API` read/normalize, POS-locked)
 * 3. Smart Auto-Compaction & Tool Output Pruning (`Zero Context Confusion`)
 * 4. Hierarchical Domain Context (`YUKA.md` / scoped domain guidance)
 * 5. Clarification Gate (`Ask-Before-Guessing` heuristic) + Parallel Sub-Agent Coordinator
 */

export interface LiveTaskItem {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  detail?: string;
}

export interface CoworkFileSummary {
  name: string;
  relativePath: string;
  sizeBytes: number;
  previewMarkdown: string;
}

export interface CoworkSessionState {
  sessionId: string;
  goal: string;
  workspaceName?: string;
  tasks: LiveTaskItem[];
  openedFiles: string[];
  scratchpadNotes: string[];
  updatedAt: number;
}

class CoworkSessionDexie extends Dexie {
  sessions!: Table<CoworkSessionState, string>;

  constructor() {
    super("kaspi_heyuka_cowork_v1");
    this.version(1).stores({
      sessions: "sessionId, updatedAt",
    });
  }
}

let coworkDb: CoworkSessionDexie | null = null;
const serverCoworkSessions = new Map<string, CoworkSessionState>();

function getCoworkDb(): CoworkSessionDexie | null {
  if (typeof window === "undefined") return null;
  if (!coworkDb) coworkDb = new CoworkSessionDexie();
  return coworkDb;
}

export async function saveCoworkCheckpoint(
  state: Omit<CoworkSessionState, "updatedAt">
): Promise<CoworkSessionState> {
  const clean: CoworkSessionState = {
    ...state,
    goal: scrubTraceText(state.goal).slice(0, 600),
    tasks: state.tasks.slice(0, 24).map((t) => ({
      ...t,
      label: scrubTraceText(t.label).slice(0, 160),
      detail: t.detail ? scrubTraceText(t.detail).slice(0, 200) : undefined,
    })),
    openedFiles: state.openedFiles.slice(0, 40),
    scratchpadNotes: state.scratchpadNotes.slice(-20).map((n) => scrubTraceText(n).slice(0, 240)),
    updatedAt: Date.now(),
  };

  serverCoworkSessions.set(clean.sessionId, clean);
  const db = getCoworkDb();
  if (db) {
    try {
      await db.sessions.put(clean);
    } catch {}
  }
  return clean;
}

export async function resumeCoworkSession(
  sessionId: string
): Promise<CoworkSessionState | null> {
  const db = getCoworkDb();
  if (db) {
    try {
      const found = await db.sessions.get(sessionId);
      if (found) return found;
    } catch {}
  }
  return serverCoworkSessions.get(sessionId) || null;
}

export async function listCoworkSessions(limit = 12): Promise<CoworkSessionState[]> {
  const db = getCoworkDb();
  if (db) {
    try {
      return await db.sessions.orderBy("updatedAt").reverse().limit(limit).toArray();
    } catch {}
  }
  return Array.from(serverCoworkSessions.values())
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}

/**
 * MarkItDown-style lightweight normalizer: converts HTML/CSV/JSON/text into clean Markdown.
 */
export function markItDownNormalizeText(filename: string, rawContent: string): string {
  const clean = scrubTraceText(rawContent || "");
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext === "html" || ext === "htm") {
    return clean
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, "\n## $1\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3500);
  }
  if (ext === "json") {
    try {
      const obj = JSON.parse(clean);
      return `\`\`\`json\n${JSON.stringify(obj, null, 2).slice(0, 2500)}\n\`\`\``;
    } catch {
      return clean.slice(0, 2500);
    }
  }
  return clean.slice(0, 3500);
}

/**
 * Browser File System Access API Workspace Reader (`Cowork Mode`):
 * Lets users grant read access to an external project folder without uploading secrets or mutating KASPI POS files.
 */
export async function scanBrowserWorkspaceDirectory(maxFiles = 20): Promise<{
  workspaceName: string;
  files: CoworkFileSummary[];
}> {
  if (typeof window === "undefined" || typeof (window as any).showDirectoryPicker !== "function") {
    throw new Error("FILE_SYSTEM_ACCESS_UNSUPPORTED");
  }

  const dirHandle = await (window as any).showDirectoryPicker({ mode: "read" });
  const workspaceName = String(dirHandle?.name || "Workspace");
  const blockedDirs = new Set(["node_modules", ".git", ".next", "dist", "build", "src-tauri"]);
  const textExts = new Set(["md", "txt", "json", "csv", "ts", "tsx", "js", "py", "html", "css", "sql"]);
  const files: CoworkFileSummary[] = [];

  async function walk(handle: any, prefix: string, depth: number) {
    if (files.length >= maxFiles || depth > 2) return;
    for await (const [name, entry] of handle.entries()) {
      if (files.length >= maxFiles) break;
      if (name.startsWith(".env") || blockedDirs.has(name)) continue;
      const rel = prefix ? `${prefix}/${name}` : name;
      // Never auto-ingest protected KASPI POS internal trees
      try {
        assertPosCoreImmutable(rel);
      } catch {
        continue;
      }
      if (entry.kind === "directory") {
        await walk(entry, rel, depth + 1);
      } else if (entry.kind === "file") {
        const ext = name.split(".").pop()?.toLowerCase() || "";
        if (!textExts.has(ext)) continue;
        const file: File = await entry.getFile();
        if (file.size > 250_000) continue;
        const text = await file.text();
        files.push({
          name,
          relativePath: rel,
          sizeBytes: file.size,
          previewMarkdown: markItDownNormalizeText(name, text).slice(0, 900),
        });
      }
    }
  }

  await walk(dirHandle, "", 0);
  return { workspaceName, files };
}

/**
 * Hierarchical Context Selector (`v12.5`): Returns targeted domain guidelines rather than monolithic rules.
 */
export function loadHierarchicalYukaContext(domain: SkillDomainBucket): string {
  switch (domain) {
    case "commerce":
      return "[ContextScope: commerce] Read-only DB tools; cite MAD totals cleanly; require explicit confirmation cards for POS mutations.";
    case "3d":
      return "[ContextScope: 3d] Isolate Three.js & GLB workflows strictly away from POS routes; dispose render targets on unmount.";
    case "creative-suite":
      return "[ContextScope: creative-suite] Preserve inline media markers verbatim; release client WASM buffers immediately.";
    case "science":
      return "[ContextScope: science] Use Decimal/Dinero/MathJS for quantitative accuracy; cite real public API dates/sources.";
    case "document-factory":
      return "[ContextScope: document-factory] Format bilingual Arabic RTL / French / English tables & PDF exports cleanly.";
    case "web":
      return "[ContextScope: web] Prefer SSRF-safe public APIs and prune verbose intermediate HTML extracts.";
    default:
      return "[ContextScope: engineering] Enforce Immutable POS Core Lock; validate generated snippets inside isolated sandbox.";
  }
}

/**
 * Tool Output Pruning (`v12.5`): Compresses bulky raw JSON/text inside historical turns while keeping the latest 3 turns intact.
 */
export function pruneOldToolOutputs<T extends { role: string; content: any }>(
  messages: T[],
  keepRecentCount = 3
): T[] {
  if (messages.length <= keepRecentCount) return messages;
  const splitAt = messages.length - keepRecentCount;
  return messages.map((m, idx) => {
    if (idx >= splitAt || typeof m.content !== "string") return m;
    if (m.content.length <= 1200) return m;
    return {
      ...m,
      content: `${m.content.slice(0, 650)}\n\n[Pruned historical verbose output — ${m.content.length} chars]`,
    };
  });
}

/**
 * Smart Auto-Compaction (`v12.4`): Preserves recent turns and summarizes older turns when conversation exceeds char budget.
 */
export function compactConversationMessages<T extends { role: string; content: any }>(
  messages: T[],
  maxTotalChars = 24000
): { compacted: T[]; didCompact: boolean } {
  const cleaned = pruneOldToolOutputs(messages, 4);
  const totalLen = cleaned.reduce(
    (sum, m) => sum + (typeof m.content === "string" ? m.content.length : 300),
    0
  );
  if (totalLen <= maxTotalChars || cleaned.length <= 6) {
    return { compacted: cleaned, didCompact: false };
  }

  const older = cleaned.slice(0, cleaned.length - 5);
  const recent = cleaned.slice(cleaned.length - 5);
  const summaryLines = older
    .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
    .slice(-8)
    .map(
      (m) =>
        `- ${m.role === "user" ? "User" : "Assistant"}: ${String(m.content)
          .replace(/\s+/g, " ")
          .slice(0, 140)}`
    )
    .join("\n");

  const compactedSummary: T = {
    role: "assistant",
    content: `[Auto-Compacted Earlier Session Context]:\n${summaryLines}`,
  } as T;

  return {
    compacted: [compactedSummary, ...recent],
    didCompact: true,
  };
}

/**
 * Ask-Before-Guessing Clarification Gate (`v12.5`): Detects high-ambiguity underspecified requests.
 */
export function evaluateClarificationGate(
  prompt: string,
  locale: "ar" | "fr" | "en" = "ar"
): { shouldClarify: boolean; confidence: number; clarifyingQuestion?: string } {
  const text = String(prompt || "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  const isVagueDeictic =
    words.length <= 4 &&
    /^(fix|do|make|change|update|هذا|صاوب|عدل|دير|modifier|fais|corrige)\b/i.test(text) &&
    !/[?\d.]/.test(text);

  if (!isVagueDeictic) {
    return { shouldClarify: false, confidence: 0.92 };
  }

  const question =
    locale === "ar"
      ? "لضمان تنفيذ الطلب بدقة من المرة الأولى: أي ملف أو منتج أو مهمة تقصدين بالتحديد؟"
      : locale === "fr"
      ? "Pour agir avec précision dès la première étape : quel fichier, produit ou objectif souhaitez-vous cibler exactement ?"
      : "To execute accurately on the first pass, which specific file, dataset, or outcome would you like to target?";

  return {
    shouldClarify: true,
    confidence: 0.55,
    clarifyingQuestion: question,
  };
}

/**
 * Parallel Sub-Agent Spawner (`v12.2` / `v12.4`): Runs isolated sub-tasks concurrently and returns crisp summaries only.
 */
export async function spawnParallelSubAgents<TInput, TOutput>(
  tasks: Array<{ id: string; role: "research" | "code" | "verify" | "analysis"; payload: TInput }>,
  executor: (payload: TInput, task: { id: string; role: string }) => Promise<TOutput>,
  concurrency = 3
): Promise<
  Array<{ id: string; role: string; ok: boolean; result?: TOutput; error?: string; latencyMs: number }>
> {
  const results: Array<{
    id: string;
    role: string;
    ok: boolean;
    result?: TOutput;
    error?: string;
    latencyMs: number;
  }> = new Array(tasks.length);

  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const idx = cursor++;
      const t = tasks[idx];
      const t0 = Date.now();
      try {
        const res = await executor(t.payload, t);
        results[idx] = {
          id: t.id,
          role: t.role,
          ok: true,
          result: res,
          latencyMs: Date.now() - t0,
        };
      } catch (err: any) {
        results[idx] = {
          id: t.id,
          role: t.role,
          ok: false,
          error: String(err?.message || err),
          latencyMs: Date.now() - t0,
        };
      }
    }
  }

  const poolSize = Math.min(Math.max(1, concurrency), tasks.length || 1);
  await Promise.all(Array.from({ length: poolSize }, () => worker()));
  return results;
}
