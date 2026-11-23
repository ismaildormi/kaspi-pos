import { NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import { runSelfCapabilityAwakeningSession } from "@/lib/heyuka/self-capability-awakening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_HEADERS = {
  ...HEYUKA_API_CORS_HEADERS,
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: LIVE_HEADERS });
}

export async function GET() {
  const report = await runSelfCapabilityAwakeningSession();
  return NextResponse.json(
    {
      endpoint: "/api/v1/cognition/awaken-and-test",
      ...report,
    },
    { status: report.ok ? 200 : 500, headers: LIVE_HEADERS }
  );
}

export async function POST() {
  const report = await runSelfCapabilityAwakeningSession();
  return NextResponse.json(
    {
      endpoint: "/api/v1/cognition/awaken-and-test",
      ...report,
    },
    { status: report.ok ? 200 : 500, headers: LIVE_HEADERS }
  );
}
