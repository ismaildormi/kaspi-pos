import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import {
  getTotalIntegratedCapabilitiesCount,
  resolveStrictCategoryDisambiguation,
} from "@/lib/zebra-x/core/cognitive-brain-registry";
import {
  detectUniversalWorldLanguage,
  runLocalOnDeviceHeyukaBrain,
} from "@/lib/heyuka/local-sovereign-brain";
import {
  planAndRunElasticCouncilSwarm,
  STUDIO_STARTER_TEMPLATES,
  type ElasticScaleMode,
  type StudioBrand,
} from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";
import {
  buildSovereignVaultLockManifest,
  searchSovereignVault,
} from "@/lib/heyuka/vault/sovereign-permanent-vault";
import { recordProductSelfEvolution } from "@/lib/heyuka/learning/self-evolution-engine";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  const totals = getTotalIntegratedCapabilitiesCount();
  const vault = buildSovereignVaultLockManifest();
  return NextResponse.json(
    {
      ok: true,
      unlimited: true,
      dailyRequestLimit: null,
      clientComputeFirst: true,
      endpoint: "/api/v1/magic",
      capabilities: [
        "Magic Prompt Refinement & Strict Category Disambiguation (v52-v60)",
        "Elastic 3 -> 6 -> 12 Cooperative Swarm Planning",
        "Dual-Brand HEYUKA Studio & KASPI POS Studio Synthesis",
        "100% Zero-Key On-Device Local Brain Synthesis + Studio Files",
      ],
      totals,
      vaultTotalEntries: vault.totalClassifiedEntries,
      starterTemplatesCount: STUDIO_STARTER_TEMPLATES.length,
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPrompt = String(body?.prompt || "").trim();
    if (!rawPrompt) {
      return NextResponse.json(
        { ok: false, error: "Missing 'prompt' field." },
        { status: 400, headers: HEYUKA_API_CORS_HEADERS }
      );
    }

    const brand: StudioBrand = body?.brand === "kaspi_pos" ? "kaspi_pos" : "heyuka";
    const rawScale = String(body?.scale || "auto");
    const scale: ElasticScaleMode =
      rawScale === "3x_fast" || rawScale === "6x_pro" || rawScale === "12x_titan"
        ? rawScale
        : "auto";
    const localeHint: "ar" | "fr" | "en" =
      body?.locale === "en" ? "en" : body?.locale === "fr" ? "fr" : "ar";
    const enhanceOnly = Boolean(body?.enhanceOnly);

    const detectedLanguage = detectUniversalWorldLanguage(rawPrompt, localeHint);
    const shortLocale = detectedLanguage.shortLocale;
    const strictDisambiguation = resolveStrictCategoryDisambiguation(rawPrompt);
    const totals = getTotalIntegratedCapabilitiesCount();

    const swarmPlan = planAndRunElasticCouncilSwarm({
      prompt: rawPrompt,
      scale,
      brand,
      locale: shortLocale,
    });

    const vaultMatches = searchSovereignVault({
      query: rawPrompt,
      limit: 12,
    });

    const enhancedPrompt = [
      rawPrompt,
      "",
      `[${brand === "kaspi_pos" ? "KASPI POS STUDIO" : "HEYUKA STUDIO"} MAGIC SPEC]:`,
      `• Target Route: ${strictDisambiguation.categoryCode} -> ${strictDisambiguation.targetEndpoint}`,
      `• Elastic Swarm Tier: ${swarmPlan.tier} (${swarmPlan.nodes.length} cooperating models + ${swarmPlan.spawnedBots.length} isolated worker bots)`,
      `• Bound Vault Engines: ${vaultMatches
        .slice(0, 6)
        .map((v) => v.name)
        .join(", ")}`,
      brand === "kaspi_pos"
        ? "• Commerce Context: KASPI POS 80mm thermal / TVA / MAD retail accuracy, zero POS_CORE_LOCK breakage."
        : "• Output Context: Produce complete production files, glassmorphic dark UI (#131314), responsive RTL/LTR support, and verified runnable artifacts.",
    ].join("\n");

    const mode = String(body?.mode || "studio").trim();

    if (enhanceOnly) {
      return NextResponse.json(
        {
          ok: true,
          unlimited: true,
          brand,
          enhancedPrompt,
          strictDisambiguation,
          swarmPlan,
          detectedLanguage,
          totals,
          vaultMatches: vaultMatches.slice(0, 8),
          openInStudioUrl: `/${shortLocale}/studio?brand=${brand}&mode=${encodeURIComponent(
            mode
          )}&q=${encodeURIComponent(rawPrompt.slice(0, 180))}`,
        },
        { status: 200, headers: HEYUKA_API_CORS_HEADERS }
      );
    }

    const localSynthesis = runLocalOnDeviceHeyukaBrain({
      prompt: rawPrompt,
      mode,
      locale: shortLocale,
    });

    recordProductSelfEvolution({
      prompt: rawPrompt,
      clusterId: strictDisambiguation.clusterId,
      productKind: "project",
      sourcesUsed: vaultMatches.slice(0, 6).map((v) => v.name),
      outputFormats: localSynthesis.studioFiles.map((f) => f.language.toUpperCase()),
      artifactCount: localSynthesis.studioFiles.length + swarmPlan.nodes.length,
      totalBytes: JSON.stringify(localSynthesis.studioFiles).length,
      executionMode: "client_cpu",
    });

    return NextResponse.json(
      {
        ok: true,
        unlimited: true,
        dailyRequestLimit: null,
        clientComputeFirst: true,
        brand,
        mode,
        enhancedPrompt,
        strictDisambiguation,
        swarmPlan,
        answer: localSynthesis.answer,
        studioFiles: localSynthesis.studioFiles,
        sources: localSynthesis.sources,
        detectedLanguage,
        totals,
        vaultMatches: vaultMatches.slice(0, 8),
        openInStudioUrl: `/${shortLocale}/studio?brand=${brand}&mode=${encodeURIComponent(
          mode
        )}&q=${encodeURIComponent(rawPrompt.slice(0, 180))}`,
      },
      { status: 200, headers: HEYUKA_API_CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || "Magic synthesis error") },
      { status: 500, headers: HEYUKA_API_CORS_HEADERS }
    );
  }
}
