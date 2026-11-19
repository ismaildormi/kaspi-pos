import { NextRequest, NextResponse } from "next/server";
import { fetchThreeDAssetsCatalog } from "@/lib/zebra-x/sidecar-bridge";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const rawType = req.nextUrl.searchParams.get("type") || "models";
  const type = rawType === "textures" || rawType === "hdris" ? rawType : "models";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 12) || 12, 30);

  const result = await fetchThreeDAssetsCatalog({
    query: q,
    type,
    limit,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
