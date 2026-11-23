import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import { collectVerifiedHarvestStats } from "@/lib/heyuka/verified-harvest-counter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_HEADERS = {
  ...HEYUKA_API_CORS_HEADERS,
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: LIVE_HEADERS });
}

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";
  const stats = await collectVerifiedHarvestStats({ forceRefresh });
  return NextResponse.json(
    {
      endpoint: "/api/v1/cognition/self-status",
      zeroLocalBloat: true,
      ...stats,
    },
    { status: 200, headers: LIVE_HEADERS }
  );
}
