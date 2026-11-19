import fs from "node:fs";
import path from "node:path";
import { assertPosCoreImmutable } from "@/lib/zebra-x/arsenal-vault";
import { scrubTraceText } from "@/lib/zebra-x/learning-trace";
import {
  computeSemHash,
  listVoyagerSkills,
  registerVoyagerSkill,
} from "./memory-engine";

/**
 * HEYUKA / YUKA — 3-Tier Progressive Agent Skills Vault (`v12.1`–`v12.7`)
 * Implements the `agentskills.io` / `SKILL.md` Progressive Disclosure architecture:
 * - Level 1: Compact metadata-only index (~50 tokens per skill: name + description + domain)
 * - Level 2: On-demand `SKILL.md` body instructions loaded strictly when matched
 * - Level 3: Execution & cleanup via Voyager / Sandbox without bloating context window
 * - Universal Importer: `anthropics/skills`, `awesome-agent-skills`, `openai/codex`,
 *   `awesome-cursorrules`, and `danielmiessler/Fabric` patterns -> `.yuka-skill` bundle
 */

export type SkillDomainBucket =
  | "commerce"
  | "creative-suite"
  | "3d"
  | "web"
  | "science"
  | "document-factory"
  | "engineering"
  | "bot-factory"
  | "qr-studio"
  | "mobile-repair"
  | "security-audit";

export interface SkillMetadataIndexEntry {
  id: string;
  name: string;
  description: string;
  domain: SkillDomainBucket;
  tags: string[];
  version: string;
  source: "bundled" | "authored" | "imported";
  filePath?: string;
}

export interface LoadedSkillPackage extends SkillMetadataIndexEntry {
  instructionsBody: string;
  steps: string[];
  rawMarkdown: string;
}

export interface YukaSkillBundle {
  format: "yuka-skill/v1";
  id: string;
  name: string;
  domain: SkillDomainBucket;
  description: string;
  version: string;
  tags: string[];
  skillMarkdown: string;
  semHash: string;
  exportedAt: string;
}

const BUNDLED_FALLBACK_METADATA: readonly SkillMetadataIndexEntry[] = [
  {
    id: "pos-retail-analytics",
    name: "pos-retail-analytics",
    description: "Read-only retail metrics, VAT/TVA calculations in MAD, stock forecasting, and receipt reports.",
    domain: "commerce",
    tags: ["commerce", "retail", "analytics", "tva", "mad"],
    version: "1.0.0",
    source: "bundled",
    filePath: "skills/commerce/pos-retail-analytics/SKILL.md",
  },
  {
    id: "studio-media-blender",
    name: "studio-media-blender",
    description: "Studio image diffusion, transparent PNG cutouts, creative workflows, transcription, and stem separation.",
    domain: "creative-suite",
    tags: ["images", "cutout", "audio", "transcribe", "stems"],
    version: "1.0.0",
    source: "bundled",
    filePath: "skills/creative-suite/studio-media-blender/SKILL.md",
  },
  {
    id: "three-gpu-companions",
    name: "three-gpu-companions",
    description: "Interactive 3D WebGL2 companions, accessories, shaders, and GLB/PBR scene workflows.",
    domain: "3d",
    tags: ["3d", "webgl2", "glb", "textures", "characters"],
    version: "1.0.0",
    source: "bundled",
    filePath: "skills/3d/three-gpu-companions/SKILL.md",
  },
  {
    id: "unrestricted-research-apis",
    name: "unrestricted-research-apis",
    description: "Live zero-key public API hub (FX, weather, cyber feeds, science/maps) and SSRF-safe web research.",
    domain: "web",
    tags: ["web-research", "fx", "weather", "cyber-intel", "wikipedia"],
    version: "1.0.0",
    source: "bundled",
    filePath: "skills/web/unrestricted-research-apis/SKILL.md",
  },
  {
    id: "math-physics-agro-health",
    name: "math-physics-agro-health",
    description: "Exact symbolic math, decimal finance, Hijri/solar astronomy, and biomedical/agricultural datasets.",
    domain: "science",
    tags: ["math", "algebra", "astronomy", "medical", "agriculture"],
    version: "1.0.0",
    source: "bundled",
    filePath: "skills/science/math-physics-agro-health/SKILL.md",
  },
  {
    id: "pdf-docx-xlsx-pptx",
    name: "pdf-docx-xlsx-pptx",
    description: "Arabic/FR/EN PDFs, Word DOCX, Excel XLSX, PowerPoint PPTX, CSV analysis, and Mermaid diagrams.",
    domain: "document-factory",
    tags: ["pdf", "docx", "xlsx", "pptx", "mermaid", "reports"],
    version: "1.0.0",
    source: "bundled",
    filePath: "skills/document-factory/pdf-docx-xlsx-pptx/SKILL.md",
  },
  {
    id: "code-sandbox-audit",
    name: "code-sandbox-audit",
    description: "Isolated polyglot execution (Python/JS/TS/Go/C++), autonomous tool hunting, and AST audits.",
    domain: "engineering",
    tags: ["code", "sandbox", "python", "typescript", "discovery"],
    version: "1.0.0",
    source: "bundled",
    filePath: "skills/engineering/code-sandbox-audit/SKILL.md",
  },
  {
    id: "bot-factory",
    name: "bot-factory",
    description: "Bot-First construction, Telegram/WhatsApp/SEO worker bots, Zod specs, Parlant guidelines, ROS 2 / ESPHome / CadQuery.",
    domain: "bot-factory",
    tags: ["bots", "telegram", "whatsapp", "seo", "robotics", "ros2", "esphome", "cadquery"],
    version: "21.5.0",
    source: "bundled",
    filePath: "skills/bot-factory/SKILL.md",
  },
  {
    id: "qr-studio",
    name: "qr-studio",
    description: "QR Architect: dynamic /q/[slug], Wi-Fi, vCard 4.0, ZATCA TLV Base64, signed offline QR tokens & branded SVGs.",
    domain: "qr-studio",
    tags: ["qr", "tlv", "wifi", "vcard", "dynamic-qr", "svg"],
    version: "21.7.0",
    source: "bundled",
    filePath: "skills/qr-studio/SKILL.md",
  },
  {
    id: "mobile-repair",
    name: "mobile-repair",
    description: "100-tool Android ADB & iOS libimobiledevice diagnostics, malware IOC triage & thermal repair shop tickets.",
    domain: "mobile-repair",
    tags: ["android", "adb", "ios", "libimobiledevice", "mobile-repair", "diagnostics"],
    version: "22.1.0",
    source: "bundled",
    filePath: "skills/mobile-repair/SKILL.md",
  },
  {
    id: "security-audit",
    name: "security-audit",
    description: "Defensive cybersecurity intelligence (OSV/NVD/CWE/FormAI) & static SAST vulnerability scanner with OWASP patches.",
    domain: "security-audit",
    tags: ["security", "sast", "owasp", "cve", "osv", "gitleaks"],
    version: "20.2.0",
    source: "bundled",
    filePath: "skills/security-audit/SKILL.md",
  },
];

const authoredSkillStore = new Map<string, LoadedSkillPackage>();

function normalizeDomain(raw?: string): SkillDomainBucket {
  const d = String(raw || "engineering").toLowerCase().trim();
  const valid: SkillDomainBucket[] = [
    "commerce",
    "creative-suite",
    "3d",
    "web",
    "science",
    "document-factory",
    "engineering",
    "bot-factory",
    "qr-studio",
    "mobile-repair",
    "security-audit",
  ];
  return (valid.find((v) => v === d) || "engineering") as SkillDomainBucket;
}

/**
 * Parses YAML Frontmatter + Markdown body from a standard `SKILL.md` file.
 */
export function parseSkillMarkdown(rawMd: string, fallbackId = "custom-skill"): LoadedSkillPackage {
  const clean = scrubTraceText(String(rawMd || "")).trim();
  const fmMatch = clean.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);

  let name = fallbackId;
  let description = "Procedural skill package.";
  let domain: SkillDomainBucket = "engineering";
  let version = "1.0.0";
  let tags: string[] = [];
  let body = clean;

  if (fmMatch) {
    const header = fmMatch[1];
    body = fmMatch[2].trim();
    for (const line of header.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.+)$/);
      if (!m) continue;
      const key = m[1].toLowerCase();
      const val = m[2].replace(/^['"]|['"]$/g, "").trim();
      if (key === "name") name = val.slice(0, 64);
      else if (key === "description") description = val.slice(0, 220);
      else if (key === "domain") domain = normalizeDomain(val);
      else if (key === "version") version = val.slice(0, 24);
      else if (key === "tags") {
        tags = val
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10);
      }
    }
  }

  const steps = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^(\d+\.|-|\*)\s+/.test(l))
    .map((l) => l.replace(/^(\d+\.|-|\*)\s+/, "").trim())
    .slice(0, 12);

  const safeId = name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallbackId;

  return {
    id: safeId,
    name: safeId,
    description,
    domain,
    tags,
    version,
    source: "imported",
    instructionsBody: body.slice(0, 4000),
    steps,
    rawMarkdown: clean.slice(0, 5000),
  };
}

function readBundledSkillsFromDisk(): SkillMetadataIndexEntry[] {
  if (typeof process === "undefined" || typeof fs.existsSync !== "function") {
    return [...BUNDLED_FALLBACK_METADATA];
  }
  const root = path.join(process.cwd(), "skills");
  if (!fs.existsSync(root)) return [...BUNDLED_FALLBACK_METADATA];

  const collected: SkillMetadataIndexEntry[] = [];
  try {
    for (const domainDir of fs.readdirSync(root)) {
      const domainPath = path.join(root, domainDir);
      if (!fs.statSync(domainPath).isDirectory()) continue;
      for (const skillDir of fs.readdirSync(domainPath)) {
        const mdPath = path.join(domainPath, skillDir, "SKILL.md");
        if (!fs.existsSync(mdPath)) continue;
        const parsed = parseSkillMarkdown(fs.readFileSync(mdPath, "utf8"), skillDir);
        collected.push({
          id: parsed.id,
          name: parsed.name,
          description: parsed.description,
          domain: normalizeDomain(domainDir),
          tags: parsed.tags,
          version: parsed.version,
          source: "bundled",
          filePath: `skills/${domainDir}/${skillDir}/SKILL.md`,
        });
      }
    }
  } catch {
    return [...BUNDLED_FALLBACK_METADATA];
  }

  return collected.length > 0 ? collected : [...BUNDLED_FALLBACK_METADATA];
}

/**
 * Level 1 (`Metadata-Only Index` ~50 tokens/skill):
 * Returns compact names, domains & 1-line descriptions without loading full skill bodies.
 */
export async function getProgressiveSkillIndex(): Promise<SkillMetadataIndexEntry[]> {
  const bundled = readBundledSkillsFromDisk();
  const authored = Array.from(authoredSkillStore.values()).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    domain: s.domain,
    tags: s.tags,
    version: s.version,
    source: s.source,
    filePath: s.filePath,
  }));

  const voyager = await listVoyagerSkills().catch(() => []);
  const voyagerMapped: SkillMetadataIndexEntry[] = voyager.slice(0, 40).map((v) => ({
    id: v.id,
    name: v.name,
    description: v.summary.slice(0, 160),
    domain: normalizeDomain(v.domain),
    tags: v.tags,
    version: "1.0.0",
    source: "authored",
  }));

  const dedup = new Map<string, SkillMetadataIndexEntry>();
  for (const item of [...bundled, ...authored, ...voyagerMapped]) {
    if (!dedup.has(item.id)) dedup.set(item.id, item);
  }
  return Array.from(dedup.values());
}

/**
 * Formats Level 1 metadata into a compact <=450-token prompt index snippet so 1,000+ skills
 * never crowd the active context window.
 */
export async function buildLevel1SkillPromptIndex(promptQuery: string): Promise<string> {
  const all = await getProgressiveSkillIndex();
  const q = promptQuery.toLowerCase();
  const scored = all
    .map((s) => {
      let score = 0;
      if (q.includes(s.domain) || q.includes(s.name)) score += 4;
      for (const tag of s.tags) {
        if (q.includes(tag.toLowerCase())) score += 2;
      }
      if (s.source === "bundled") score += 1;
      return { s, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => `- ${x.s.name} [${x.s.domain}]: ${x.s.description}`);

  return scored.join("\n");
}

/**
 * Level 2 (`On-Demand Body Load`): Reads full `SKILL.md` body strictly for the requested skill ID.
 */
export async function loadSkillInstructionsOnDemand(
  skillId: string
): Promise<LoadedSkillPackage | null> {
  const cleanId = skillId.trim().toLowerCase();
  if (authoredSkillStore.has(cleanId)) {
    return authoredSkillStore.get(cleanId)!;
  }

  const index = readBundledSkillsFromDisk();
  const entry = index.find((s) => s.id === cleanId || s.name === cleanId);
  if (entry?.filePath && typeof process !== "undefined") {
    const abs = path.join(process.cwd(), entry.filePath);
    if (fs.existsSync(abs)) {
      const parsed = parseSkillMarkdown(fs.readFileSync(abs, "utf8"), entry.id);
      return { ...parsed, source: "bundled", filePath: entry.filePath };
    }
  }

  const voyager = await listVoyagerSkills().catch(() => []);
  const vMatch = voyager.find((v) => v.id === cleanId || v.name.toLowerCase() === cleanId);
  if (vMatch) {
    const md = buildSkillMarkdownFromParts({
      name: vMatch.name,
      domain: normalizeDomain(vMatch.domain),
      description: vMatch.summary,
      steps: vMatch.steps,
      tags: vMatch.tags,
      version: "1.0.0",
    });
    return parseSkillMarkdown(md, vMatch.id);
  }

  return null;
}

export function buildSkillMarkdownFromParts(params: {
  name: string;
  domain: SkillDomainBucket;
  description: string;
  steps: string[];
  tags: string[];
  version?: string;
}): string {
  const cleanName = params.name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || "yuka-skill";
  const stepsList = params.steps
    .filter(Boolean)
    .slice(0, 10)
    .map((s, idx) => `${idx + 1}. ${scrubTraceText(s)}`)
    .join("\n");

  return `---
name: ${cleanName}
description: ${scrubTraceText(params.description).slice(0, 180)}
domain: ${params.domain}
version: ${params.version || "1.0.0"}
tags: [${params.tags.slice(0, 8).join(", ")}]
---

# ${cleanName}

## Execution Steps
${stepsList || "1. Execute workflow cleanly inside isolated scope."}
`;
}

/**
 * Self-Authoring & Self-Healing Skills (`v12.6`):
 * Persists a newly solved complex workflow as a `SKILL.md` entry + Voyager skill + `.yuka-skill` bundle.
 */
export async function authorSkillFromSuccess(params: {
  name: string;
  domain: SkillDomainBucket;
  description: string;
  steps: string[];
  toolNames: string[];
  tags: string[];
  targetPathToCheck?: string;
  version?: string;
}): Promise<YukaSkillBundle> {
  if (params.targetPathToCheck) {
    assertPosCoreImmutable(params.targetPathToCheck);
  }

  const version = params.version || "1.0.0";
  const md = buildSkillMarkdownFromParts({
    name: params.name,
    domain: params.domain,
    description: params.description,
    steps: params.steps,
    tags: params.tags,
    version,
  });
  const parsed = parseSkillMarkdown(md, params.name);
  parsed.source = "authored";
  authoredSkillStore.set(parsed.id, parsed);

  await registerVoyagerSkill({
    name: parsed.name,
    domain: parsed.domain,
    summary: parsed.description,
    steps: parsed.steps,
    toolNames: params.toolNames,
    tags: parsed.tags,
  }).catch(() => {});

  return {
    format: "yuka-skill/v1",
    id: parsed.id,
    name: parsed.name,
    domain: parsed.domain,
    description: parsed.description,
    version,
    tags: parsed.tags,
    skillMarkdown: md,
    semHash: computeSemHash(`${parsed.name} ${parsed.description} ${parsed.steps.join(" ")}`),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Converts external Fabric patterns (`system.md`) or Cursor rules (`.mdc`) into `.yuka-skill` packages.
 */
export function convertPatternOrRuleToYukaSkill(params: {
  title?: string;
  rawContent?: string;
  domain?: SkillDomainBucket;
  sourceKind?: "fabric" | "cursor_rule" | "skill_md";
}): YukaSkillBundle {
  const safeTitle = String(params?.title || "custom-skill").trim() || "custom-skill";
  const safeRawContent = String(params?.rawContent || "").trim();
  const safeKind = params?.sourceKind || "cursor_rule";

  if (safeKind === "skill_md") {
    const parsed = parseSkillMarkdown(safeRawContent, safeTitle);
    return {
      format: "yuka-skill/v1",
      id: parsed.id,
      name: parsed.name,
      domain: parsed.domain,
      description: parsed.description,
      version: parsed.version,
      tags: parsed.tags,
      skillMarkdown: parsed.rawMarkdown,
      semHash: computeSemHash(parsed.rawMarkdown),
      exportedAt: new Date().toISOString(),
    };
  }

  const lines = scrubTraceText(safeRawContent)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const summary =
    lines.find((l) => !l.startsWith("#") && l.length > 18)?.slice(0, 170) ||
    `Imported ${safeKind} workflow for ${safeTitle}`;
  const steps = lines
    .filter((l) => /^(\d+\.|-|\*|#+)\s*/.test(l))
    .slice(0, 8)
    .map((l) => l.replace(/^(\d+\.|-|\*|#+)\s*/, "").trim())
    .filter(Boolean);

  const md = buildSkillMarkdownFromParts({
    name: safeTitle,
    domain: params.domain || "engineering",
    description: summary,
    steps: steps.length > 0 ? steps : [summary],
    tags: [safeKind, "imported"],
    version: "1.0.0",
  });
  const parsed = parseSkillMarkdown(md, safeTitle);
  authoredSkillStore.set(parsed.id, { ...parsed, source: "imported" });

  return {
    format: "yuka-skill/v1",
    id: parsed.id,
    name: parsed.name,
    domain: parsed.domain,
    description: parsed.description,
    version: parsed.version,
    tags: parsed.tags,
    skillMarkdown: md,
    semHash: computeSemHash(md),
    exportedAt: new Date().toISOString(),
  };
}

export const OFFICIAL_SKILL_REPOS_ALLOWLIST = [
  { id: "anthropics-skills", repo: "anthropics/skills", path: "skills", focus: "Official Agent Skills (PDF/DOCX/XLSX/PPTX/UI)" },
  { id: "voltagent-skills", repo: "VoltAgent/awesome-agent-skills", path: "", focus: "Curated Multi-Domain Agent Skills" },
  { id: "openai-codex-skills", repo: "openai/codex", path: ".codex/skills", focus: "Engineering & Verification Codex Skills" },
  { id: "cursor-rules", repo: "PatrickJS/awesome-cursorrules", path: "rules", focus: "Framework & Language Architecture Rules" },
  { id: "fabric-patterns", repo: "danielmiessler/Fabric", path: "patterns", focus: "200+ Structured Extraction & Security Patterns" },
] as const;

/**
 * Zero-Key Universal GitHub Skill Repository Indexer (SSRF-Restricted to `api.github.com`):
 * Fetches ONLY repository directory names & lightweight metadata without downloading repos.
 */
export async function importExternalSkillRepoCatalog(repoSlug: string): Promise<{
  ok: boolean;
  repo: string;
  entries: Array<{ name: string; path: string; htmlUrl: string }>;
  error?: string;
}> {
  const match = OFFICIAL_SKILL_REPOS_ALLOWLIST.find(
    (r) => r.repo.toLowerCase() === repoSlug.toLowerCase() || r.id === repoSlug
  );
  if (!match) {
    return {
      ok: false,
      repo: repoSlug,
      entries: [],
      error: "Repository not in curated SSRF skill catalog allowlist.",
    };
  }

  const endpoint = `https://api.github.com/repos/${match.repo}/contents/${match.path}`.replace(
    /\/+$/,
    ""
  );
  try {
    const res = await fetch(endpoint, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "HEYUKA-SkillVault/1.0",
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) {
      return { ok: false, repo: match.repo, entries: [], error: `GitHub HTTP ${res.status}` };
    }
    const items = (await res.json().catch(() => [])) as any[];
    const entries = Array.isArray(items)
      ? items
          .filter((x) => x && x.name && !String(x.name).startsWith("."))
          .slice(0, 35)
          .map((x) => ({
            name: String(x.name),
            path: String(x.path || x.name),
            htmlUrl: String(x.html_url || `https://github.com/${match.repo}`),
          }))
      : [];
    return { ok: true, repo: match.repo, entries };
  } catch (err: any) {
    return { ok: false, repo: match.repo, entries: [], error: err?.message || "Network timeout" };
  }
}
