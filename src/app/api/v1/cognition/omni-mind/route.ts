import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import { runZeroDataSelfPlayGym } from "@/lib/zebra-x/evolution/secret1_self_play_bridge";
import { runMctsDeepReasoner } from "@/lib/zebra-x/cognition/secret2_mcts_reasoner";
import {
  runEmbodiedCodeVerification,
  simulate3dPhysicsStability,
  simulateKaspiMarketWorld,
} from "@/lib/zebra-x/simulation/secret3_world_sim";
import {
  discoverSymbolicLaw,
  solveArcFewShotGrid,
  synthesizeCrossDomainInvention,
} from "@/lib/zebra-x/cognition/secret4_fluid_invention";
import {
  executeForgedTool,
  forgeAndVerifyMicroTool,
  listForgedTools,
} from "@/lib/zebra-x/evolution/secret5_tool_forge";
import { runAdversarialSwarmCouncil } from "@/lib/zebra-x/cognition/secret6_adversarial_council";
import {
  getSevenSecretsSystemStatus,
  runOmniMindSevenSecrets,
} from "@/lib/zebra-x/cognition/secret7_dual_brain_orchestrator";
import type { ElasticScaleMode, StudioBrand } from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      ...getSevenSecretsSystemStatus(),
      endpoint: "/api/v1/cognition/omni-mind",
      supportedActions: [
        "omni_mind",
        "self_play",
        "mcts_solve",
        "simulate_physics",
        "simulate_market",
        "verify_sandbox",
        "arc_solve",
        "discover_law",
        "invent",
        "forge_tool",
        "run_tool",
        "council_debate",
      ],
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "omni_mind").trim();
  const locale: "ar" | "fr" | "en" = body?.locale === "en" ? "en" : body?.locale === "fr" ? "fr" : "ar";
  const brand: StudioBrand = body?.brand === "kaspi_pos" ? "kaspi_pos" : "heyuka";

  try {
    switch (action) {
      case "self_play": {
        const res = await runZeroDataSelfPlayGym({
          rounds: Number(body?.rounds || 8),
          focusDomain: body?.domain || "all",
          seed: typeof body?.seed === "number" ? body.seed : undefined,
        });
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "mcts_solve": {
        const res = await runMctsDeepReasoner({
          prompt: String(body?.prompt || ""),
          thinkingBudget: Number(body?.thinkingBudget || 4096),
          locale,
          brand,
        });
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "simulate_physics": {
        const res = simulate3dPhysicsStability(Array.isArray(body?.bodies) ? body.bodies : []);
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "simulate_market": {
        const res = simulateKaspiMarketWorld(body?.marketInput || body);
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "verify_sandbox": {
        const res = await runEmbodiedCodeVerification({
          mode: body?.mode === "html" ? "html" : "javascript",
          code: String(body?.code || ""),
        });
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "arc_solve": {
        const res = solveArcFewShotGrid({
          trainPairs: Array.isArray(body?.trainPairs) ? body.trainPairs : [],
          testInput: Array.isArray(body?.testInput) ? body.testInput : [],
        });
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "discover_law": {
        const res = discoverSymbolicLaw(
          Array.isArray(body?.points) ? body.points : [],
          typeof body?.nextX === "number" ? body.nextX : undefined
        );
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "invent": {
        const res = synthesizeCrossDomainInvention({
          challenge: String(body?.challenge || body?.prompt || ""),
          targetDomain: body?.targetDomain ? String(body.targetDomain) : undefined,
        });
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "forge_tool": {
        const res = await forgeAndVerifyMicroTool({
          name: String(body?.name || "custom_skill"),
          description: String(body?.description || "Synthesized skill"),
          domain: body?.domain || "utility",
          implementationJs: String(body?.implementationJs || ""),
          testCases: Array.isArray(body?.testCases) ? body.testCases : [],
        });
        return NextResponse.json(res, { status: res.ok ? 200 : 400, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "run_tool": {
        const res = executeForgedTool({
          toolId: String(body?.toolId || ""),
          input: body?.input && typeof body.input === "object" ? body.input : {},
        });
        return NextResponse.json({ ...res, availableTools: listForgedTools().length }, {
          status: res.ok ? 200 : 404,
          headers: HEYUKA_API_CORS_HEADERS,
        });
      }

      case "council_debate": {
        const rawScale = String(body?.scale || "auto");
        const scale: ElasticScaleMode =
          rawScale === "3x_fast" || rawScale === "6x_pro" || rawScale === "12x_titan" ? rawScale : "auto";
        const res = runAdversarialSwarmCouncil({
          prompt: String(body?.prompt || ""),
          draftArtifact: body?.draftArtifact ? String(body.draftArtifact) : undefined,
          scale,
          brand,
          locale,
          proposals: Array.isArray(body?.proposals) ? body.proposals : undefined,
        });
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "omni_mind":
      default: {
        const res = await runOmniMindSevenSecrets({
          prompt: String(body?.prompt || ""),
          brand,
          locale,
          scale: body?.scale || "auto",
          thinkingBudget: typeof body?.thinkingBudget === "number" ? body.thinkingBudget : undefined,
          forceSystem2: Boolean(body?.forceSystem2),
          includeSimulation: Boolean(body?.includeSimulation),
          includeInvention: Boolean(body?.includeInvention),
          draftArtifact: body?.draftArtifact ? String(body.draftArtifact) : undefined,
        });
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Cognitive execution failed" },
      { status: 500, headers: HEYUKA_API_CORS_HEADERS }
    );
  }
}
