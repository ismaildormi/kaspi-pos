import { NextRequest } from "next/server";
import {
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { fetchThreeDAssetsCatalog } from "@/lib/zebra-x/sidecar-bridge";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function GET(req: NextRequest) {
  const requestId = createRequestId();
  const q = req.nextUrl.searchParams.get("q") || "";
  const rawType = req.nextUrl.searchParams.get("type") || "models";
  const type = rawType === "textures" || rawType === "hdris" ? rawType : "models";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 12) || 12, 30);

  const result = await fetchThreeDAssetsCatalog({
    query: q,
    type,
    limit,
  });
  return apiJsonResponse(
    { ...result, requestId },
    result.ok ? 200 : 502,
    { "X-Request-Id": requestId }
  );
}
