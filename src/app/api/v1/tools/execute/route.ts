import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import {
  executeUniversalMcpTool,
  UNIVERSAL_MCP_TOOLS,
} from "@/lib/zebra-x/tools/universal_mcp_bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/v1/tools/execute",
      version: "v94.0-v95.0",
      toolsCount: UNIVERSAL_MCP_TOOLS.length,
      tools: UNIVERSAL_MCP_TOOLS,
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const toolId = String(body?.toolId || body?.tool || "").trim();
  const input = body?.input && typeof body.input === "object" ? (body.input as Record<string, unknown>) : {};
  const confirmAction = body?.confirmAction === true;

  if (!toolId) {
    return NextResponse.json(
      { ok: false, error: "Provide toolId from GET /api/v1/tools/execute." },
      { status: 400, headers: HEYUKA_API_CORS_HEADERS }
    );
  }

  try {
    const out = await executeUniversalMcpTool({ toolId, input, confirmAction });
    if ("data" in out) {
      return NextResponse.json(out.data, { status: out.statusCode, headers: HEYUKA_API_CORS_HEADERS });
    }
    return NextResponse.json(out, { status: out.statusCode || 400, headers: HEYUKA_API_CORS_HEADERS });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "MCP Tool execution error" },
      { status: 500, headers: HEYUKA_API_CORS_HEADERS }
    );
  }
}
