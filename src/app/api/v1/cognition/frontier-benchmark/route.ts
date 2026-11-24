import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import { runFrontierCognitiveBenchmarkSuite } from "@/lib/heyuka/frontier/cognitive-evaluation-engine";
import { runFrontierIntelligenceOrchestrator } from "@/lib/heyuka/frontier/frontier-intelligence-orchestrator";
import { getFrontierMemoryDiagnostics } from "@/lib/heyuka/frontier/persistent-episodic-memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  const report = await runFrontierCognitiveBenchmarkSuite();
  const memoryDiagnostics = getFrontierMemoryDiagnostics();
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/v1/cognition/frontier-benchmark",
      report,
      memoryDiagnostics,
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body?.prompt || "").trim();

  if (prompt) {
    const orchestration = await runFrontierIntelligenceOrchestrator({
      prompt,
      requestedModel: typeof body?.model === "string" ? body.model : undefined,
      requestedExecutionMode: body?.executionMode,
      hasImageAttachment: Boolean(body?.hasImage),
      tenantId: typeof body?.tenantId === "string" ? body.tenantId : "global",
      projectId: typeof body?.projectId === "string" ? body.projectId : "heyuka-frontier",
    });
    return NextResponse.json(
      {
        ok: true,
        mode: "single_prompt_frontier_orchestration",
        orchestration,
      },
      { status: 200, headers: HEYUKA_API_CORS_HEADERS }
    );
  }

  const report = await runFrontierCognitiveBenchmarkSuite();
  return NextResponse.json(
    {
      ok: true,
      mode: "full_20_category_benchmark_and_7_ablations",
      report,
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}
