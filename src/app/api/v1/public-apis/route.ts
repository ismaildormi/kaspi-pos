import { NextRequest, NextResponse } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
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
  const mode = req.nextUrl.searchParams.get("catalog");
  if (mode === "universe") {
    return NextResponse.json({
      ok: true,
      owner: "KASPI",
      platform: "HEYUKA Unified Zero-Key Arsenal",
      noKeyCategoriesCount: PUBLIC_APIS_CATALOG_COUNT,
      categories: Array.from(VALID_CATEGORIES),
      cosmicDomains: HEYUKA_COSMIC_DOMAINS,
      cyberDefenseFeeds: HEYUKA_CYBER_DEFENSE_FEEDS,
      cloudFleetGateways: HEYUKA_CLOUD_FLEET_GATEWAYS,
      memoryTiers: HEYUKA_ARCHITECTURAL_STACK.fiveTierHybridMemory,
    });
  }

  const auth = await authenticateXZebraRequest(req, "public-apis:query");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const category = (req.nextUrl.searchParams.get("category") || "fx_rates") as PublicApiCategory;
  const query = req.nextUrl.searchParams.get("q") || req.nextUrl.searchParams.get("query") || "MAD";
  const base = req.nextUrl.searchParams.get("base") || undefined;
  const lang = req.nextUrl.searchParams.get("lang") || "en";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 8) || 8, 25);

  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: "Unsupported category", availableCategories: Array.from(VALID_CATEGORIES) },
      { status: 400 }
    );
  }

  const result = await queryPublicApiHub({ category, query, base, lang, limit });
  return NextResponse.json({
    ...result,
    auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateXZebraRequest(req, "public-apis:query");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const category = String(body?.category || "").trim() as PublicApiCategory;
  const query = String(body?.query || body?.q || "").trim();

  if (!VALID_CATEGORIES.has(category) || !query) {
    return NextResponse.json(
      {
        error: "Provide valid 'category' and non-empty 'query'.",
        availableCategories: Array.from(VALID_CATEGORIES),
      },
      { status: 400 }
    );
  }

  const result = await queryPublicApiHub({
    category,
    query,
    base: typeof body?.base === "string" ? body.base : undefined,
    lang: typeof body?.lang === "string" ? body.lang : "en",
    limit: typeof body?.limit === "number" ? Math.min(body.limit, 25) : 8,
  });

  return NextResponse.json({
    ...result,
    auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
  });
}
