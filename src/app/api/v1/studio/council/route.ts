import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import {
  planAndRunElasticCouncilSwarm,
  STUDIO_STARTER_TEMPLATES,
  type ElasticScaleMode,
  type StudioBrand,
} from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";
import { recordProductSelfEvolution } from "@/lib/heyuka/learning/self-evolution-engine";
import { collectVerifiedHarvestStats } from "@/lib/heyuka/verified-harvest-counter";
import { runUnifiedFullPowerPipeline } from "@/lib/heyuka/global-nervous-mesh";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      unlimited: true,
      dailyRequestLimit: null,
      endpoint: "/api/v1/studio/council",
      scaleModes: ["auto", "3x_fast", "6x_pro", "12x_titan"],
      starterTemplatesCount: STUDIO_STARTER_TEMPLATES.length,
      starterTemplates: STUDIO_STARTER_TEMPLATES,
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body?.prompt || "Design full-stack studio app").trim();
  const rawScale = String(body?.scale || "auto");
  const scale: ElasticScaleMode =
    rawScale === "3x_fast" || rawScale === "6x_pro" || rawScale === "12x_titan" ? rawScale : "auto";
  const brand: StudioBrand = body?.brand === "kaspi_pos" ? "kaspi_pos" : "heyuka";
  const locale: "ar" | "fr" | "en" =
    body?.locale === "en" ? "en" : body?.locale === "fr" ? "fr" : "ar";

  const swarm = planAndRunElasticCouncilSwarm({ prompt, scale, brand, locale });
  const powerResult = await runUnifiedFullPowerPipeline({
    prompt,
    locale: locale === "fr" || locale === "en" ? locale : "ar",
    brand: brand === "kaspi_pos" ? "kaspi_pos" : "heyuka",
    mode: "council",
    thinkingEnabled: true,
    compact: false,
  });

  recordProductSelfEvolution({
    prompt,
    clusterId: "elastic_swarm_3_6_12_and_worker_bots",
    productKind: "project",
    sourcesUsed: swarm.matchedVaultSources.map((s) => s.name),
    outputFormats: ["Elastic Swarm JSON", "Worker Bots"],
    artifactCount: swarm.nodes.length + swarm.spawnedBots.length,
    totalBytes: JSON.stringify(swarm).length,
    executionMode: "client_cpu",
  });

  const liveTelemetry = await collectVerifiedHarvestStats().catch(() => null);

  return NextResponse.json(
    {
      ...swarm,
      liveOmniscienceTelemetry: liveTelemetry?.verifiedMetrics || null,
      powerTelemetry: powerResult.trace,
      huggingFaceVault: liveTelemetry?.huggingFaceVault || null,
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}
