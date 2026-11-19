import { NextRequest, NextResponse } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  discoverOpenApiSpec,
  registerWebhookOrMcpConnector,
} from "@/lib/zebra-x/core/auto-connector";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await authenticateXZebraRequest(req, "connector:discover");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  if (body?.specUrl) {
    const res = await discoverOpenApiSpec(String(body.specUrl));
    return NextResponse.json(res, { status: res.ok ? 200 : 400 });
  }

  if (body?.endpointUrl && body?.name) {
    const kind = body?.kind === "mcp" ? "mcp" : "webhook";
    const res = await registerWebhookOrMcpConnector({
      kind,
      name: String(body.name),
      endpointUrl: String(body.endpointUrl),
    });
    return NextResponse.json(res, { status: res.ok ? 200 : 400 });
  }

  return NextResponse.json(
    { error: "Provide 'specUrl' (OpenAPI/Swagger JSON) or '{ kind, name, endpointUrl }'." },
    { status: 400 }
  );
}
