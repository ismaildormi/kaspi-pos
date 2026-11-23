import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import {
  analyzeRepoAstAndDependencies,
  architectFullStackSystem,
} from "@/lib/zebra-x/dominance/secret2_software_supremacy";
import {
  computeFinancialForecastAndVar,
  computeInventoryEoqAndSafetyStock,
  computeNegotiationBatnaZopa,
  runMarketBasketApriori,
} from "@/lib/zebra-x/dominance/secret3_business_dominance";
import {
  checkMedicalDrugInteractionSafety,
  computeToleranceStackup,
  designSolarPvSystem,
} from "@/lib/zebra-x/dominance/secret4_science_engineering";
import { buildCinemaStoryboardAnd3dScene } from "@/lib/zebra-x/dominance/secret5_cinema_3d_aesthetic";
import {
  generateMergeKitRecipeYaml,
  routeTaskToOptimalModel,
} from "@/lib/zebra-x/dominance/secret6_omni_router";
import { planHardwareSovereignProfile } from "@/lib/zebra-x/dominance/secret7_immortal_sovereignty";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/v1/dominance/architect-system",
      secretsCovered: ["v90.2", "v90.3", "v90.4", "v90.5", "v90.6", "v90.7"],
      supportedActions: [
        "architect_system",
        "ast_impact",
        "eoq_inventory",
        "market_basket",
        "quant_var_kelly",
        "negotiate_batna",
        "solar_pv_design",
        "cad_tolerance",
        "medical_safety",
        "cinema_3d_storyboard",
        "route_model",
        "mergekit_yaml",
        "hardware_sovereign",
      ],
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "architect_system").trim();

  try {
    switch (action) {
      case "architect_system":
        return NextResponse.json(
          architectFullStackSystem({
            projectName: String(body?.projectName || "kaspi-enterprise-app"),
            entities: Array.isArray(body?.entities) ? body.entities : undefined,
            targets: Array.isArray(body?.targets) ? body.targets : undefined,
            locale: body?.locale === "fr" ? "fr" : body?.locale === "en" ? "en" : "ar",
          }),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "ast_impact":
        return NextResponse.json(
          analyzeRepoAstAndDependencies(Array.isArray(body?.files) ? body.files : []),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "eoq_inventory":
        return NextResponse.json(
          {
            ok: true,
            items: computeInventoryEoqAndSafetyStock(
              Array.isArray(body?.items) ? body.items : [],
              typeof body?.serviceLevelZ === "number" ? body.serviceLevelZ : 1.645
            ),
          },
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "market_basket":
        return NextResponse.json(
          {
            ok: true,
            rules: runMarketBasketApriori(
              Array.isArray(body?.baskets) ? body.baskets : [],
              Number(body?.minSupport ?? 0.2),
              Number(body?.minConfidence ?? 0.5)
            ),
          },
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "quant_var_kelly":
        return NextResponse.json(
          computeFinancialForecastAndVar({
            dailyRevenuesMad: Array.isArray(body?.dailyRevenuesMad) ? body.dailyRevenuesMad : [],
            winProb: typeof body?.winProb === "number" ? body.winProb : undefined,
            payoffRatioB: typeof body?.payoffRatioB === "number" ? body.payoffRatioB : undefined,
          }),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "negotiate_batna":
        return NextResponse.json(
          computeNegotiationBatnaZopa({
            sellerReservationPrice: Number(body?.sellerReservationPrice ?? 1000),
            buyerMaxWillingness: Number(body?.buyerMaxWillingness ?? 1400),
            sellerAsk: Number(body?.sellerAsk ?? 1500),
            buyerInitialBid: Number(body?.buyerInitialBid ?? 950),
            contractText: typeof body?.contractText === "string" ? body.contractText : undefined,
          }),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "solar_pv_design":
        return NextResponse.json(
          designSolarPvSystem({
            dailyLoadKwh: Number(body?.dailyLoadKwh ?? 12),
            peakSunHoursPerDay: typeof body?.peakSunHoursPerDay === "number" ? body.peakSunHoursPerDay : undefined,
            autonomyDays: typeof body?.autonomyDays === "number" ? body.autonomyDays : undefined,
            panelWattPeak: typeof body?.panelWattPeak === "number" ? body.panelWattPeak : undefined,
          }),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "cad_tolerance":
        return NextResponse.json(
          computeToleranceStackup(Array.isArray(body?.dimensions) ? body.dimensions : []),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "medical_safety":
        return NextResponse.json(
          checkMedicalDrugInteractionSafety(
            Array.isArray(body?.compounds) ? body.compounds : [],
            body?.locale === "fr" ? "fr" : body?.locale === "en" ? "en" : "ar"
          ),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "cinema_3d_storyboard":
        return NextResponse.json(
          buildCinemaStoryboardAnd3dScene({
            title: String(body?.title || "HEYUKA 3D Reveal"),
            conceptPrompt: String(body?.conceptPrompt || body?.prompt || "Showcase product 3D"),
            durationSec: Number(body?.durationSec ?? 10),
            fps: body?.fps === 60 ? 60 : 30,
            brand: body?.brand === "kaspi_pos" ? "kaspi_pos" : "heyuka",
          }),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "route_model":
        return NextResponse.json(
          routeTaskToOptimalModel(String(body?.prompt || "")),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "mergekit_yaml":
        return NextResponse.json(
          generateMergeKitRecipeYaml({
            method: body?.method === "slerp" || body?.method === "ties" ? body.method : "dare_ties",
            baseModel: typeof body?.baseModel === "string" ? body.baseModel : undefined,
            expertModels: Array.isArray(body?.expertModels) ? body.expertModels : undefined,
          }),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      case "hardware_sovereign":
        return NextResponse.json(
          planHardwareSovereignProfile({
            ramGb: Number(body?.ramGb ?? 8),
            vramGb: Number(body?.vramGb ?? 0),
            hasWebGpu: Boolean(body?.hasWebGpu),
            offline: Boolean(body?.offline),
            peerDevicesCount: Number(body?.peerDevicesCount ?? 1),
          }),
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );

      default:
        return NextResponse.json(
          { ok: false, error: `Unsupported dominance action '${action}'.` },
          { status: 400, headers: HEYUKA_API_CORS_HEADERS }
        );
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Dominance engine error" },
      { status: 500, headers: HEYUKA_API_CORS_HEADERS }
    );
  }
}
