import { NextRequest, NextResponse } from "next/server";
import {
  deleteFrontierMemoryRecord,
  getFrontierMemoryDiagnostics,
  hydrateFrontierMemoryFromDurableStore,
  queryFrontierMemory,
  upsertFrontierMemory,
  type MemoryLayerType,
} from "@/lib/heyuka/frontier/persistent-episodic-memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_LAYERS: Set<MemoryLayerType> = new Set([
  "working",
  "conversation",
  "episodic",
  "semantic",
  "procedural",
  "project",
  "verified_knowledge",
]);

export async function GET(req: NextRequest) {
  await hydrateFrontierMemoryFromDurableStore().catch(() => {});
  const { searchParams } = new URL(req.url);
  const tenantId = (searchParams.get("tenantId") || "default-workspace").trim();
  const projectId = searchParams.get("projectId")?.trim() || undefined;
  const query = (searchParams.get("q") || "project context summary").trim();
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit") || 12)));

  const results = queryFrontierMemory({
    tenantId,
    projectId,
    query,
    limit,
  });
  const diagnostics = getFrontierMemoryDiagnostics(tenantId);

  return NextResponse.json({
    ok: true,
    tenantId,
    projectId: projectId || null,
    diagnostics,
    matches: results.matches.map((m) => ({
      id: m.id,
      layer: m.layer,
      projectId: m.projectId,
      key: m.key,
      title: m.title,
      content: m.content,
      tags: m.tags,
      confidence: m.confidence,
      version: m.version,
      updatedAt: m.updatedAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  await hydrateFrontierMemoryFromDurableStore().catch(() => {});
  const body = await req.json().catch(() => null);
  if (!body || !body.title || !body.content) {
    return NextResponse.json({ ok: false, error: "title and content are required" }, { status: 400 });
  }

  const layer: MemoryLayerType = ALLOWED_LAYERS.has(body.layer) ? body.layer : "project";
  const tenantId = String(body.tenantId || "default-workspace").trim();
  const projectId = String(body.projectId || "default-project").trim();
  const key = String(body.key || `mem_${Date.now()}`).trim();

  const res = await upsertFrontierMemory({
    tenantId,
    projectId,
    layer,
    key,
    title: String(body.title).slice(0, 200),
    content: String(body.content).slice(0, 4000),
    tags: Array.isArray(body.tags) ? body.tags.map(String).slice(0, 12) : [layer, projectId],
    confidence: Math.min(100, Math.max(10, Number(body.confidence || 90))),
    provenance: {
      sourceType: "user_statement",
      sourceId: key,
      verifiedBy: "heyuka-memory-api",
      verificationScore: 90,
    },
  });

  return NextResponse.json({
    ok: true,
    action: res.action,
    record: {
      id: res.record.id,
      layer: res.record.layer,
      projectId: res.record.projectId,
      title: res.record.title,
      version: res.record.version,
    },
  });
}

export async function DELETE(req: NextRequest) {
  await hydrateFrontierMemoryFromDurableStore().catch(() => {});
  const { searchParams } = new URL(req.url);
  const tenantId = (searchParams.get("tenantId") || "default-workspace").trim();
  const id = searchParams.get("id")?.trim();
  const key = searchParams.get("key")?.trim();
  if (!id && !key) {
    return NextResponse.json({ ok: false, error: "id or key is required" }, { status: 400 });
  }

  const deleted = await deleteFrontierMemoryRecord({
    tenantId,
    id,
    key,
  });

  return NextResponse.json({ ok: true, deleted });
}
