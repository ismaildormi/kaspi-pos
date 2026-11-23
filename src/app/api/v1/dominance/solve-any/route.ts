import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import {
  classifyExtremeScenario,
  detectConceptDrift,
  generateCrisisRecoveryPlan,
  rankOptionsWithTopsis,
  solveAnyScenarioUnified,
} from "@/lib/zebra-x/dominance/secret1_scenario_master";
import {
  appendTamperProofAuditEntry,
  inspectInputWithCyberImmuneShield,
  scrubSensitivePiiAndTaxIds,
  verifyAuditChainIntegrity,
} from "@/lib/zebra-x/omega/secret9_cyber_immune";
import {
  fetchHyperLocalLiveSnapshot,
  resolveDarijaCommercialTerms,
  validateMoroccoDgiInvoice,
} from "@/lib/zebra-x/omega/secret10_hyper_local_grounding";
import { evaluateVadBargeInFrame } from "@/lib/zebra-x/omega/secret11_full_duplex_voice";
import { buildMorphWidgetMarker } from "@/lib/zebra-x/omega/secret12_generative_ui";
import {
  recordOnlineExperienceAndDistill,
  selectBestOnlineStrategy,
} from "@/lib/zebra-x/omega/secret8_online_distiller";
import type { StudioBrand } from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";
import { runUnifiedFullPowerPipeline } from "@/lib/heyuka/global-nervous-mesh";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  const banditCoding = selectBestOnlineStrategy("coding");
  const banditCommerce = selectBestOnlineStrategy("commerce");
  const ledger = verifyAuditChainIntegrity();
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/v1/dominance/solve-any",
      version: "v88.0-v90.1",
      auditLedger: ledger,
      banditCodingRecommended: banditCoding.recommendedStrategy,
      banditCommerceRecommended: banditCommerce.recommendedStrategy,
      supportedActions: [
        "solve_any",
        "topsis",
        "drift_check",
        "crisis_triage",
        "cyber_shield",
        "dgi_validate",
        "darija_lexicon",
        "hyper_local_live",
        "vad_barge_in",
        "online_distill",
        "morph_widget",
      ],
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "solve_any").trim();
  const brand: StudioBrand = body?.brand === "kaspi_pos" ? "kaspi_pos" : "heyuka";
  const locale: "ar" | "fr" | "en" = body?.locale === "en" ? "en" : body?.locale === "fr" ? "fr" : "ar";

  try {
    switch (action) {
      case "topsis": {
        const ranked = rankOptionsWithTopsis(body?.alternatives || [], body?.criteria || []);
        return NextResponse.json({ ok: true, ranked }, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "drift_check": {
        const res = detectConceptDrift(body?.series || [], typeof body?.sensitivitySigma === "number" ? body.sensitivitySigma : 2.0);
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "crisis_triage": {
        const playbook = generateCrisisRecoveryPlan(String(body?.prompt || "outage"));
        const dispatch = classifyExtremeScenario(String(body?.prompt || "outage"));
        return NextResponse.json({ ok: true, dispatch, playbook }, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "cyber_shield": {
        const inspection = inspectInputWithCyberImmuneShield(String(body?.text || ""), {
          sourceTrust: body?.sourceTrust === "untrusted_web" ? "untrusted_web" : "user",
        });
        const scrubbed = scrubSensitivePiiAndTaxIds(String(body?.text || ""));
        const block = appendTamperProofAuditEntry("cyber_shield_scan", brand, {
          verdict: inspection.verdict,
          riskScore: inspection.riskScore,
          redactedCount: scrubbed.redactedCount,
        });
        const chainIntegrity = verifyAuditChainIntegrity();
        return NextResponse.json(
          { ok: true, inspection, scrubbed, auditBlock: block, chainIntegrity },
          { status: 200, headers: HEYUKA_API_CORS_HEADERS }
        );
      }

      case "dgi_validate": {
        const audit = validateMoroccoDgiInvoice({
          invoiceNumber: String(body?.invoiceNumber || "INV-2026-001"),
          sellerIce: String(body?.sellerIce || ""),
          subtotalHtMad: Number(body?.subtotalHtMad || 0),
          vatRatePct: Number(body?.vatRatePct ?? 20),
          declaredTtcMad: typeof body?.declaredTtcMad === "number" ? body.declaredTtcMad : undefined,
          paymentMethod: body?.paymentMethod,
        });
        return NextResponse.json(audit, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "darija_lexicon": {
        const matches = resolveDarijaCommercialTerms(String(body?.text || body?.prompt || ""));
        return NextResponse.json({ ok: true, matches }, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "hyper_local_live": {
        const snap = await fetchHyperLocalLiveSnapshot({
          cityQuery: body?.cityQuery ? String(body.cityQuery) : "Nador, Morocco",
          barcode: body?.barcode ? String(body.barcode) : undefined,
        });
        return NextResponse.json(snap, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "vad_barge_in": {
        const res = evaluateVadBargeInFrame({
          samples: Array.isArray(body?.samples) ? body.samples : [0, 0.1, -0.1],
          currentState: body?.currentState || "speaking",
          locale,
        });
        return NextResponse.json({ ok: true, ...res }, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "online_distill": {
        const res = body?.strategyUsed
          ? recordOnlineExperienceAndDistill({
              domain: String(body?.domain || "commerce"),
              strategyUsed: String(body.strategyUsed),
              reward: Number(body?.reward ?? 1),
              promptSummary: String(body?.promptSummary || ""),
              winningRuleOrSnippet: body?.winningRuleOrSnippet ? String(body.winningRuleOrSnippet) : undefined,
            })
          : selectBestOnlineStrategy(String(body?.domain || "commerce"));
        return NextResponse.json(res, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "morph_widget": {
        const marker = buildMorphWidgetMarker(body?.widget);
        return NextResponse.json({ ok: true, marker }, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
      }

      case "solve_any":
      default: {
        const promptText = String(body?.prompt || "");
        const [res, powerResult] = await Promise.all([
          solveAnyScenarioUnified({
            prompt: promptText,
            brand,
            locale,
            requestedMode: body?.mode || "auto",
            offline: Boolean(body?.offline),
          }),
          runUnifiedFullPowerPipeline({
            prompt: promptText,
            locale,
            brand: brand === "kaspi_pos" ? "kaspi_pos" : "heyuka",
            mode: String(body?.mode || "auto"),
            thinkingEnabled: true,
            compact: true,
          }),
        ]);
        return NextResponse.json(
          { ...res, powerTelemetry: powerResult.trace },
          { status: res.ok ? 200 : 403, headers: HEYUKA_API_CORS_HEADERS }
        );
      }
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Dominance solver failed" },
      { status: 400, headers: HEYUKA_API_CORS_HEADERS }
    );
  }
}
