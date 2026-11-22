import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import { buildBrowserFactoryPlan } from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      unlimited: true,
      endpoint: "/api/v1/studio/browser-factory",
      samplePlan: buildBrowserFactoryPlan({ projectName: "kaspi-ai-starter" }),
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const plan = buildBrowserFactoryPlan({
    projectName: String(body?.projectName || "heyuka-sovereign-app"),
    targetStack: typeof body?.targetStack === "string" ? body.targetStack : undefined,
    cloudTargets: Array.isArray(body?.cloudTargets) ? body.cloudTargets.map(String) : undefined,
    oauthProviders: Array.isArray(body?.oauthProviders) ? body.oauthProviders.map(String) : undefined,
    gmailSignedIn: Boolean(body?.gmailSignedIn),
  });
  return NextResponse.json(plan, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
}
