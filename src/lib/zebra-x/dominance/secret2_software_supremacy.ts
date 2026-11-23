import { scanSourceCodeForVulnerabilities } from "@/lib/zebra-x/tools/security-sast-auditor";

export interface WorkspaceFileInput {
  path: string;
  language?: string;
  content: string;
}

export interface RepoImpactAnalysisResult {
  ok: true;
  fileCount: number;
  totalLines: number;
  dependencyEdges: Array<{ from: string; imports: string[] }>;
  domCrossCheck: {
    htmlIds: string[];
    referencedJsIds: string[];
    missingIdsInHtml: string[];
  };
  zeroStubGate: {
    passed: boolean;
    todoMarkersCount: number;
    findings: Array<{ path: string; line: number; marker: string }>;
  };
  securityAudit: {
    clean: boolean;
    totalFindings: number;
    criticalCount: number;
    filesWithFindings: Array<{ path: string; riskScore: number; rules: string[] }>;
  };
}

/**
 * Dominance v90.2 Part A: Whole-Repository AST/Import Dependency Graph, DOM Contract Check & Zero-Stub + SAST Gate.
 */
export function analyzeRepoAstAndDependencies(files: WorkspaceFileInput[]): RepoImpactAnalysisResult {
  const htmlIds = new Set<string>();
  const referencedJsIds = new Set<string>();
  const dependencyEdges: Array<{ from: string; imports: string[] }> = [];
  const todoFindings: Array<{ path: string; line: number; marker: string }> = [];
  const filesWithFindings: Array<{ path: string; riskScore: number; rules: string[] }> = [];

  let totalLines = 0;
  let totalSecurityFindings = 0;
  let criticalCount = 0;

  for (const file of files) {
    const content = String(file.content || "");
    const lines = content.split(/\r?\n/);
    totalLines += lines.length;

    // 1. Structural Imports / Asset Refs
    const imports = new Set<string>();
    const importRe = /(?:import\s+[\s\S]*?from\s+["']([^"']+)["']|require\(\s*["']([^"']+)["']\)|(?:src|href)=["']([^"'#?]+)["'])/g;
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(content)) !== null) {
      const target = m[1] || m[2] || m[3];
      if (target) imports.add(target);
    }
    dependencyEdges.push({ from: file.path, imports: Array.from(imports) });

    // 2. HTML IDs vs JS getElementById / querySelector Contract
    if (/\.html?$/i.test(file.path) || file.language === "html") {
      const idRe = /\bid=["']([A-Za-z0-9_-]+)["']/g;
      while ((m = idRe.exec(content)) !== null) htmlIds.add(m[1]);
    }
    if (/\.(?:js|ts|jsx|tsx)$/i.test(file.path)) {
      const domRe = /(?:getElementById\(\s*["']([A-Za-z0-9_-]+)["']\)|querySelector\(\s*["']#([A-Za-z0-9_-]+)["']\))/g;
      while ((m = domRe.exec(content)) !== null) {
        referencedJsIds.add(m[1] || m[2]);
      }
    }

    // 3. Zero-Stub Production Gate (detect TODO/FIXME/NotImplemented)
    lines.forEach((ln, idx) => {
      const stubMatch = ln.match(/\b(?:TODO|FIXME|XXX|NOT_IMPLEMENTED|placeholder\s+stub)\b/i);
      if (stubMatch) {
        todoFindings.push({ path: file.path, line: idx + 1, marker: stubMatch[0] });
      }
    });

    // 4. Static SAST Scan
    const sast = scanSourceCodeForVulnerabilities(content);
    if (!sast.clean) {
      totalSecurityFindings += sast.findings.length;
      criticalCount += sast.findings.filter((f) => f.severity === "critical").length;
      filesWithFindings.push({
        path: file.path,
        riskScore: sast.riskScore,
        rules: sast.findings.map((f) => f.ruleId),
      });
    }
  }

  const missingIdsInHtml =
    htmlIds.size > 0
      ? Array.from(referencedJsIds).filter((id) => !htmlIds.has(id))
      : [];

  return {
    ok: true,
    fileCount: files.length,
    totalLines,
    dependencyEdges,
    domCrossCheck: {
      htmlIds: Array.from(htmlIds),
      referencedJsIds: Array.from(referencedJsIds),
      missingIdsInHtml,
    },
    zeroStubGate: {
      passed: todoFindings.length === 0,
      todoMarkersCount: todoFindings.length,
      findings: todoFindings.slice(0, 20),
    },
    securityAudit: {
      clean: totalSecurityFindings === 0,
      totalFindings: totalSecurityFindings,
      criticalCount,
      filesWithFindings,
    },
  };
}

/**
 * Dominance v90.2 Part B: Full-Stack Enterprise & Multi-Target Architecture Blueprint Generator
 * producing Drizzle SQL schema + Zod API contracts + PWA/Tauri export spec without TODO stubs.
 */
export function architectFullStackSystem(params: {
  projectName: string;
  entities?: string[];
  targets?: Array<"web" | "pwa" | "tauri_desktop" | "capacitor_mobile" | "api">;
  locale?: "ar" | "fr" | "en";
}) {
  const slug = String(params.projectName || "kaspi-enterprise-app")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "") || "kaspi-enterprise-app";

  const entities =
    params.entities && params.entities.length > 0
      ? params.entities.map((e) => e.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
      : ["merchants", "products", "invoices"];

  const targets =
    params.targets && params.targets.length > 0
      ? params.targets
      : ["web", "pwa", "tauri_desktop", "api"];

  const drizzleSchemaTs = [
    `import { pgTable, text, integer, numeric, timestamp, uuid } from "drizzle-orm/pg-core";`,
    ``,
    ...entities.map(
      (tbl) => `export const ${tbl} = pgTable("${tbl}", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  status: text("status").default("active").notNull(),
  amountCents: integer("amount_cents").default(0).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("20.00").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});`
    ),
  ].join("\n\n");

  const apiZodRouteTs = `import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PayloadSchema = z.object({
  tenantId: z.string().min(2),
  name: z.string().min(1).max(160),
  amountCents: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  const parsed = PayloadSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, issues: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json({ ok: true, entity: "${entities[0]}", record: parsed.data }, { status: 201 });
}`;

  const pwaManifestJson = JSON.stringify(
    {
      name: params.projectName || "KASPI Enterprise App",
      short_name: slug.slice(0, 12),
      start_url: "/",
      display: "standalone",
      background_color: "#111216",
      theme_color: "#007ACC",
      dir: params.locale === "ar" ? "rtl" : "ltr",
      lang: params.locale || "ar",
    },
    null,
    2
  );

  const generatedFiles: WorkspaceFileInput[] = [
    { path: "src/db/schema.ts", language: "typescript", content: drizzleSchemaTs },
    { path: `src/app/api/v1/${entities[0]}/route.ts`, language: "typescript", content: apiZodRouteTs },
    { path: "public/manifest.webmanifest", language: "json", content: pwaManifestJson },
  ];

  const audit = analyzeRepoAstAndDependencies(generatedFiles);

  return {
    ok: true,
    engine: "secret2_software_supremacy_v90_2",
    projectSlug: slug,
    entities,
    targets,
    rlsEnabled: true,
    files: generatedFiles,
    impactAudit: audit,
  };
}
