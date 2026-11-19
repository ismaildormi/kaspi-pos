import { NextRequest } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import {
  PUBLIC_APIS_CATALOG_COUNT,
  queryPublicApiHub,
  type PublicApiCategory,
} from "@/lib/zebra-x/tools/public-apis-hub";
import {
  HEYUKA_ARCHITECTURAL_STACK,
  HEYUKA_CLOUD_FLEET_GATEWAYS,
  HEYUKA_COSMIC_DOMAINS,
  HEYUKA_CYBER_DEFENSE_FEEDS,
} from "@/lib/heyuka/heyuka-universe";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function OPTIONS() {
  return createApiOptionsResponse();
}

const VALID_CATEGORIES = new Set<PublicApiCategory>([
  "openfoodfacts",
  "openbeautyfacts",
  "openproductfacts",
  "fx_rates",
  "crypto_market",
  "weather",
  "geocode",
  "b2b_overpass",
  "gleif_company",
  "country_info",
  "wikipedia",
  "wikidata_sparql",
  "duckduckgo",
  "world_bank",
  "openalex_science",
  "openfda_drug",
  "pubmed_papers",
  "soilgrids_agri",
  "nasa_power_agri",
  "paleobiology_fossils",
  "open_tree_of_life",
  "patents_inventor",
  "nobel_prize",
  "hacker_news",
  "remote_jobs",
  "iconify_logos",
  "openverse_media",
  "met_museum",
  "polyhaven_3d",
  "transit_stops",
  "smart_city_poi",
  "air_quality",
  "nador_marine_weather",
  "cyber_threat_intel",
]);

export async function GET(req: NextRequest) {
  const requestId = createRequestId();
  const mode = req.nextUrl.searchParams.get("catalog");
  if (mode === "universe") {
    return apiJsonResponse(
      {
        ok: true,
        requestId,
        owner: "KASPI",
        platform: "HEYUKA Unified Zero-Key Arsenal",
        noKeyCategoriesCount: PUBLIC_APIS_CATALOG_COUNT,
        categories: Array.from(VALID_CATEGORIES),
        cosmicDomains: HEYUKA_COSMIC_DOMAINS,
        cyberDefenseFeeds: HEYUKA_CYBER_DEFENSE_FEEDS,
        cloudFleetGateways: HEYUKA_CLOUD_FLEET_GATEWAYS,
        memoryTiers: HEYUKA_ARCHITECTURAL_STACK.fiveTierHybridMemory,
      },
      200,
      { "X-Request-Id": requestId }
    );
  }

  const auth = await authenticateXZebraRequest(req, "public-apis:query");
  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: auth.status === 403 ? "permission_error" : "authentication_error",
      requestId,
    });
  }

  const category = (req.nextUrl.searchParams.get("category") || "fx_rates") as PublicApiCategory;
  const query = req.nextUrl.searchParams.get("q") || req.nextUrl.searchParams.get("query") || "MAD";
  const base = req.nextUrl.searchParams.get("base") || undefined;
  const lang = req.nextUrl.searchParams.get("lang") || "en";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 8) || 8, 25);

  if (!VALID_CATEGORIES.has(category)) {
    return apiErrorResponse({
      status: 400,
      message: `Unsupported category '${category}'. Available: ${Array.from(VALID_CATEGORIES).slice(0, 8).join(", ")}...`,
      type: "invalid_request_error",
      requestId,
    });
  }

  const result = await queryPublicApiHub({ category, query, base, lang, limit });
  return apiJsonResponse(
    {
      ...result,
      requestId,
      auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
    },
    200,
    { "X-Request-Id": requestId }
  );
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const auth = await authenticateXZebraRequest(req, "public-apis:query");
  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: auth.status === 403 ? "permission_error" : "authentication_error",
      requestId,
    });
  }

  const body = await req.json().catch(() => ({}));
  const category = String(body?.category || "").trim() as PublicApiCategory;
  const query = String(body?.query || body?.q || "").trim();

  if (!VALID_CATEGORIES.has(category) || !query) {
    return apiErrorResponse({
      status: 400,
      message: "Provide valid 'category' and non-empty 'query'.",
      type: "invalid_request_error",
      requestId,
    });
  }

  const result = await queryPublicApiHub({
    category,
    query,
    base: typeof body?.base === "string" ? body.base : undefined,
    lang: typeof body?.lang === "string" ? body.lang : "en",
    limit: typeof body?.limit === "number" ? Math.min(body.limit, 25) : 8,
  });

  return apiJsonResponse(
    {
      ...result,
      requestId,
      auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
    },
    200,
    { "X-Request-Id": requestId }
  );
}
