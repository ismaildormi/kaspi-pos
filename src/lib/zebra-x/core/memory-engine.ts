import Dexie, { type Table } from "dexie";
import { scrubTraceText } from "@/lib/zebra-x/learning-trace";
import { assertPosCoreImmutable } from "@/lib/zebra-x/arsenal-vault";
import { touchWasmResource } from "./wasm-watchdog";

/**
 * X × Zebra — Phase 3 Evolving Memory & Voyager Skill Library
 * Implements:
 * - Lazy dynamic import() of `@orama/orama` + `fuse.js` (0 baseline bundle impact)
 * - Isolated IndexedDB Dexie storage (`kaspi_zebra_x_memory_v1`) + bounded memory fallback
 * - `SemHash` shingle fingerprinting & near-duplicate consolidation
 * - `MemoryBank / FSRS` stability & retrievability decay curve
 * - `Voyager Skill Library` procedural skill persistence for 100x Federated Mesh Sync
 * - Auto-cleanup hook registered with `wasm-watchdog.ts`
 */

export interface EvolvingMemoryEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  language: "ar" | "darija" | "tarifit" | "fr" | "en" | "mixed";
  semHash: string;
  stabilityDays: number; // FSRS S
  difficulty: number; // FSRS D (1..10)
  recallCount: number;
  createdAt: number;
  lastReviewedAt: number;
}

export interface VoyagerSkillEntry {
  id: string;
  name: string;
  domain: string;
  summary: string;
  steps: string[];
  toolNames: string[];
  tags: string[];
  semHash: string;
  successCount: number;
  verifiedByNode: string;
  posMutationBlocked: true;
  updatedAt: number;
}

class ZebraMemoryDexie extends Dexie {
  memories!: Table<EvolvingMemoryEntry, string>;
  skills!: Table<VoyagerSkillEntry, string>;

  constructor() {
    super("kaspi_zebra_x_memory_v1");
    this.version(1).stores({
      memories: "id, semHash, lastReviewedAt, stabilityDays",
      skills: "id, domain, semHash, updatedAt, successCount",
    });
  }
}

let memoryDb: ZebraMemoryDexie | null = null;
const serverMemories = new Map<string, EvolvingMemoryEntry>();
const serverSkills = new Map<string, VoyagerSkillEntry>();
const MAX_MEMORIES = 400;
const MAX_SKILLS = 150;

let cachedOramaDb: any = null;
let cachedFuseInstance: any = null;

function releaseMemoryIndexes() {
  cachedOramaDb = null;
  cachedFuseInstance = null;
}

function getDb(): ZebraMemoryDexie | null {
  if (typeof window === "undefined") return null;
  if (!memoryDb) memoryDb = new ZebraMemoryDexie();
  return memoryDb;
}

function normalizeForHash(input: string): string {
  return String(input || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractShingles(text: string): Set<string> {
  const tokens = normalizeForHash(text).split(" ").filter(Boolean);
  const shingles = new Set<string>();
  if (tokens.length === 0) return shingles;
  if (tokens.length < 3) {
    tokens.forEach((t) => shingles.add(t));
    return shingles;
  }
  for (let i = 0; i <= tokens.length - 3; i++) {
    shingles.add(`${tokens[i]}_${tokens[i + 1]}_${tokens[i + 2]}`);
  }
  return shingles;
}

/**
 * Computes a deterministic SemHash shingle-based 64-bit FNV-1a SimHash hex signature.
 */
export function computeSemHash(text: string): string {
  const shingles = extractShingles(text);
  if (shingles.size === 0) return "0000000000000000";

  const bits = new Array<number>(64).fill(0);
  for (const s of shingles) {
    let h = BigInt("0xcbf29ce484222325");
    const prime = BigInt("0x100000001b3");
    for (let i = 0; i < s.length; i++) {
      h ^= BigInt(s.charCodeAt(i));
      h = (h * prime) & BigInt("0xffffffffffffffff");
    }
    for (let b = 0; b < 64; b++) {
      const isOne = ((h >> BigInt(b)) & BigInt(1)) === BigInt(1);
      bits[b] += isOne ? 1 : -1;
    }
  }

  let fp = BigInt(0);
  for (let b = 0; b < 64; b++) {
    if (bits[b] >= 0) fp |= BigInt(1) << BigInt(b);
  }
  return fp.toString(16).padStart(16, "0");
}

export function computeShingleSimilarity(a: string, b: string): number {
  const sa = extractShingles(a);
  const sb = extractShingles(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const item of sa) {
    if (sb.has(item)) inter++;
  }
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * FSRS power-law forgetting curve retrievability: R(t, S) = (1 + t / (9 * S))^-1
 */
export function computeFsrsRetrievability(
  lastReviewedAt: number,
  stabilityDays: number,
  now = Date.now()
): number {
  const elapsedDays = Math.max(0, (now - lastReviewedAt) / (1000 * 60 * 60 * 24));
  const safeS = Math.max(0.25, stabilityDays);
  return 1 / (1 + elapsedDays / (9 * safeS));
}

export function scheduleNextFsrsStability(params: {
  currentStabilityDays: number;
  difficulty: number;
  recalledSuccessfully: boolean;
}): { nextStabilityDays: number; nextDifficulty: number } {
  const s = Math.max(0.5, params.currentStabilityDays);
  const d = Math.min(10, Math.max(1, params.difficulty));
  if (!params.recalledSuccessfully) {
    return {
      nextStabilityDays: Math.max(0.5, Math.round(s * 0.6 * 100) / 100),
      nextDifficulty: Math.min(10, d + 0.5),
    };
  }
  const boostFactor = 1.45 + (11 - d) * 0.08;
  return {
    nextStabilityDays: Math.min(365, Math.round(s * boostFactor * 100) / 100),
    nextDifficulty: Math.max(1, d - 0.15),
  };
}

async function getAllMemoriesRaw(): Promise<EvolvingMemoryEntry[]> {
  const db = getDb();
  if (db) {
    try {
      return await db.memories.orderBy("lastReviewedAt").reverse().toArray();
    } catch {}
  }
  return Array.from(serverMemories.values()).sort(
    (a, b) => b.lastReviewedAt - a.lastReviewedAt
  );
}

async function putMemoryRaw(entry: EvolvingMemoryEntry): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      await db.memories.put(entry);
      const count = await db.memories.count();
      if (count > MAX_MEMORIES) {
        const oldest = await db.memories
          .orderBy("lastReviewedAt")
          .limit(count - MAX_MEMORIES)
          .primaryKeys();
        await db.memories.bulkDelete(oldest as string[]);
      }
      return;
    } catch {}
  }

  if (serverMemories.size >= MAX_MEMORIES) {
    const firstKey = serverMemories.keys().next().value;
    if (firstKey) serverMemories.delete(firstKey);
  }
  serverMemories.set(entry.id, entry);
}

/**
 * Records a distilled knowledge item with SemHash deduplication & FSRS strengthening.
 */
export async function recordOrReinforceMemory(params: {
  title: string;
  content: string;
  tags?: string[];
  language?: EvolvingMemoryEntry["language"];
}): Promise<{ action: "reinforced" | "created"; entry: EvolvingMemoryEntry }> {
  const cleanTitle = scrubTraceText(params.title, 120);
  const cleanContent = scrubTraceText(params.content, 2400);
  const combined = `${cleanTitle} ${cleanContent}`;
  const semHash = computeSemHash(combined);
  const existing = await getAllMemoriesRaw();

  const duplicate = existing.find(
    (m) =>
      m.semHash === semHash ||
      computeShingleSimilarity(`${m.title} ${m.content}`, combined) >= 0.84
  );

  const now = Date.now();
  if (duplicate) {
    const next = scheduleNextFsrsStability({
      currentStabilityDays: duplicate.stabilityDays,
      difficulty: duplicate.difficulty,
      recalledSuccessfully: true,
    });
    const updated: EvolvingMemoryEntry = {
      ...duplicate,
      tags: Array.from(new Set([...(duplicate.tags || []), ...(params.tags || [])])).slice(0, 12),
      stabilityDays: next.nextStabilityDays,
      difficulty: next.nextDifficulty,
      recallCount: duplicate.recallCount + 1,
      lastReviewedAt: now,
    };
    await putMemoryRaw(updated);
    releaseMemoryIndexes();
    return { action: "reinforced", entry: updated };
  }

  const entry: EvolvingMemoryEntry = {
    id: `mem_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    title: cleanTitle || "Memory Note",
    content: cleanContent,
    tags: (params.tags || []).slice(0, 12).map((t) => scrubTraceText(t, 32)),
    language: params.language || "mixed",
    semHash,
    stabilityDays: 2.0,
    difficulty: 4.5,
    recallCount: 1,
    createdAt: now,
    lastReviewedAt: now,
  };
  await putMemoryRaw(entry);
  releaseMemoryIndexes();
  return { action: "created", entry };
}

/**
 * Registers a reusable procedure inside the Voyager Skill Library (validated via Immutable Lock).
 */
export async function registerVoyagerSkill(params: {
  name: string;
  domain: string;
  summary: string;
  steps: string[];
  toolNames?: string[];
  tags?: string[];
  nodeId?: string;
  targetPath?: string;
}): Promise<VoyagerSkillEntry> {
  if (params.targetPath) {
    assertPosCoreImmutable(params.targetPath);
  }

  const cleanName = scrubTraceText(params.name, 90);
  const cleanSummary = scrubTraceText(params.summary, 400);
  const cleanSteps = (params.steps || []).slice(0, 15).map((s) => scrubTraceText(s, 220));
  const combined = `${cleanName} ${cleanSummary} ${cleanSteps.join(" ")}`;
  const semHash = computeSemHash(combined);

  const existingList = await listVoyagerSkills();
  const match = existingList.find(
    (s) => s.semHash === semHash || computeShingleSimilarity(s.summary, cleanSummary) >= 0.86
  );

  const skill: VoyagerSkillEntry = {
    id: match?.id || `skill_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    domain: scrubTraceText(params.domain, 48),
    summary: cleanSummary,
    steps: cleanSteps,
    toolNames: (params.toolNames || []).slice(0, 10),
    tags: (params.tags || []).slice(0, 12),
    semHash,
    successCount: (match?.successCount || 0) + 1,
    verifiedByNode: scrubTraceText(params.nodeId || "local-primary-node", 48),
    posMutationBlocked: true,
    updatedAt: Date.now(),
  };

  const db = getDb();
  if (db) {
    try {
      await db.skills.put(skill);
      releaseMemoryIndexes();
      return skill;
    } catch {}
  }

  if (serverSkills.size >= MAX_SKILLS) {
    const firstKey = serverSkills.keys().next().value;
    if (firstKey) serverSkills.delete(firstKey);
  }
  serverSkills.set(skill.id, skill);
  releaseMemoryIndexes();
  return skill;
}

export async function listVoyagerSkills(): Promise<VoyagerSkillEntry[]> {
  const db = getDb();
  if (db) {
    try {
      return await db.skills.orderBy("updatedAt").reverse().toArray();
    } catch {}
  }
  return Array.from(serverSkills.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Exports clean anonymized Voyager skills for 100x Federated Mesh & Owner Root Vault synchronization.
 */
export async function exportSkillsForMeshSync() {
  const skills = await listVoyagerSkills();
  return {
    schemaVersion: "v9.4-voyager-mesh",
    posCoreLockEnforced: true,
    count: skills.length,
    skills: skills.map((s) => ({
      id: s.id,
      name: s.name,
      domain: s.domain,
      summary: s.summary,
      steps: s.steps,
      toolNames: s.toolNames,
      successCount: s.successCount,
      semHash: s.semHash,
    })),
  };
}

export interface HybridMemoryHit {
  kind: "memory" | "skill";
  id: string;
  title: string;
  snippet: string;
  score: number;
  retrievability: number;
  tags: string[];
}

/**
 * Executes hybrid semantic + fuzzy search via lazily loaded `@orama/orama` + `fuse.js` + FSRS weighting.
 */
export async function searchEvolvingMemory(
  query: string,
  limit = 8
): Promise<{
  hits: HybridMemoryHit[];
  enginesLoaded: string[];
  totalMemories: number;
  totalSkills: number;
}> {
  const q = normalizeForHash(query);
  const [memories, skills] = await Promise.all([getAllMemoriesRaw(), listVoyagerSkills()]);

  if (!q || (memories.length === 0 && skills.length === 0)) {
    return {
      hits: [],
      enginesLoaded: [],
      totalMemories: memories.length,
      totalSkills: skills.length,
    };
  }

  const corpus = [
    ...memories.map((m) => ({
      kind: "memory" as const,
      id: m.id,
      title: m.title,
      body: m.content,
      tagsJoined: m.tags.join(" "),
      tags: m.tags,
      retrievability: computeFsrsRetrievability(m.lastReviewedAt, m.stabilityDays),
    })),
    ...skills.map((s) => ({
      kind: "skill" as const,
      id: s.id,
      title: s.name,
      body: `${s.summary} ${s.steps.join(" ")}`,
      tagsJoined: `${s.domain} ${s.tags.join(" ")}`,
      tags: s.tags,
      retrievability: Math.min(1, 0.75 + Math.min(0.25, s.successCount * 0.04)),
    })),
  ];

  touchWasmResource("zebra_x_memory_index", "Orama + Fuse Memory Index", () => {
    releaseMemoryIndexes();
  });

  const scoreMap = new Map<string, { item: (typeof corpus)[number]; rankScore: number }>();

  const [{ create, insertMultiple, search }, fuseMod] = await Promise.all([
    import("@orama/orama"),
    import("fuse.js"),
  ]);

  const oramaDb = create({
    schema: {
      id: "string",
      title: "string",
      body: "string",
      tagsJoined: "string",
    } as const,
  });

  await insertMultiple(
    oramaDb,
    corpus.map((c) => ({
      id: c.id,
      title: c.title,
      body: c.body,
      tagsJoined: c.tagsJoined,
    }))
  );
  cachedOramaDb = oramaDb;

  const oramaRes = await search(oramaDb, {
    term: query.trim(),
    limit: limit * 2,
  });

  for (const h of oramaRes.hits || []) {
    const found = corpus.find((c) => c.id === h.id);
    if (!found) continue;
    const prev = scoreMap.get(found.id)?.rankScore || 0;
    scoreMap.set(found.id, {
      item: found,
      rankScore: prev + Number(h.score || 1) * 0.65,
    });
  }

  const FuseCtor = (fuseMod as any).default ?? fuseMod;
  const fuse = new FuseCtor(corpus, {
    keys: [
      { name: "title", weight: 0.45 },
      { name: "body", weight: 0.35 },
      { name: "tagsJoined", weight: 0.2 },
    ],
    threshold: 0.45,
    includeScore: true,
  });
  cachedFuseInstance = fuse;

  const fuseRes = fuse.search(query.trim(), { limit: limit * 2 });
  for (const f of fuseRes) {
    const item = f.item as (typeof corpus)[number];
    const fuseSim = Math.max(0, 1 - Number(f.score ?? 0.5));
    const prev = scoreMap.get(item.id)?.rankScore || 0;
    scoreMap.set(item.id, {
      item,
      rankScore: prev + fuseSim * 0.55,
    });
  }

  const ranked: HybridMemoryHit[] = Array.from(scoreMap.values())
    .map(({ item, rankScore }) => ({
      kind: item.kind,
      id: item.id,
      title: item.title,
      snippet: item.body.slice(0, 220),
      score: Math.round((rankScore * (0.7 + 0.3 * item.retrievability)) * 1000) / 1000,
      retrievability: Math.round(item.retrievability * 100) / 100,
      tags: item.tags,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  void cachedOramaDb;
  void cachedFuseInstance;

  return {
    hits: ranked,
    enginesLoaded: ["@orama/orama", "fuse.js"],
    totalMemories: memories.length,
    totalSkills: skills.length,
  };
}
