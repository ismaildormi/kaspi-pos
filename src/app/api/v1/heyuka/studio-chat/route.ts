import { NextRequest } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { generateTextWithRouter } from "@/lib/ai-router";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { runPreReplyReflectionGate } from "@/lib/zebra-x/core/reflection-gate";
import {
  getSpecializedProductById,
  recommendProductForPrompt,
} from "@/lib/heyuka/ecosystem/products-catalog";
import {
  classifyCognitiveIntentAndSources,
  getTotalIntegratedCapabilitiesCount,
} from "@/lib/zebra-x/core/cognitive-brain-registry";
import { searchSovereignVault } from "@/lib/heyuka/vault/sovereign-permanent-vault";
import { recordProductSelfEvolution } from "@/lib/heyuka/learning/self-evolution-engine";
import {
  evaluateZeroCostPolicy,
  recordTenantFreeTierUsage,
} from "@/lib/heyuka/compute/zero-cost-policy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = createRequestId();

  let tenantId = "";
  try {
    const ctx = await getRequestContext();
    tenantId = ctx.tenantId;
  } catch {
    return apiErrorResponse({
      status: 401,
      message: "Sign in required for studio workspace chat.",
      type: "authentication_error",
      requestId,
    });
  }

  const body = await req.json().catch(() => ({}));
  const productId = typeof body?.productId === "string" ? body.productId.trim() : "command-center";
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) {
    return apiErrorResponse({
      status: 400,
      message: "messages[] is required.",
      type: "invalid_request_error",
      requestId,
    });
  }

  const lastUserText =
    [...messages].reverse().find((m: any) => m?.role === "user")?.content || "";
  const studio = getSpecializedProductById(productId);
  const recommended = productId === "command-center" ? recommendProductForPrompt(lastUserText) : null;

  const callerComputeUrl =
    req.headers.get("x-heyuka-compute-url") ||
    req.headers.get("x-client-llm-url") ||
    (typeof body?.computeEndpoint === "string" ? body.computeEndpoint : undefined);

  const policy = await evaluateZeroCostPolicy({
    tenantId,
    callerComputeUrl,
  });

  const cognitiveRoute = classifyCognitiveIntentAndSources(lastUserText, "en");
  const vaultMatches = searchSovereignVault({
    query: lastUserText,
    clusterId: cognitiveRoute.primaryCluster.id,
    limit: 8,
  });
  const totals = getTotalIntegratedCapabilitiesCount();

  const domainContext = studio
    ? `${studio.specializedSystemPrompt}\nAllowed Endpoints: ${studio.allowedApiEndpoints.join(", ")}\nScope Rule: ${studio.excludedTaskGuidance}\nSovereign Vault (${totals.grandTotalSources}+ Sources Available): ${vaultMatches.map((v) => `${v.name} [${v.vaultUri}]`).join(", ")}\nDisclosure: ${studio.sharedEngineDisclosure.en}${
        typeof body?.workspaceContext === "string" && body.workspaceContext.trim()
          ? `\n\nActive Project Workspace Context:\n${body.workspaceContext.slice(0, 4000)}`
          : ""
      }`
    : `You are HEYUKA Intelligence Command Center by KASPI with unlimited access to ${totals.grandTotalSources}+ vaulted open-source tools (${vaultMatches.map((v) => v.name).join(", ")}). Compute executes on the user's device or connected server with zero daily caps.`;

  try {
    const res = await generateTextWithRouter({
      system: domainContext,
      messages: messages.slice(-14).map((m: any) => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: String(m?.content || ""),
      })),
      governance: {
        tenantId,
        allowOwnerPaidProviders: false,
        callerComputeUrl,
        callerModelId: typeof body?.computeModel === "string" ? body.computeModel : undefined,
      },
    } as any);

    await recordTenantFreeTierUsage(tenantId).catch(() => {});

    const audited = runPreReplyReflectionGate({
      draftText: String(res.text || ""),
      expectedLocale: /[\u0600-\u06FF]/.test(lastUserText) ? "ar" : "en",
    });

    const evo = recordProductSelfEvolution({
      prompt: lastUserText,
      clusterId: cognitiveRoute.primaryCluster.id,
      productKind: "project",
      sourcesUsed: vaultMatches.map((v) => v.name),
      outputFormats: cognitiveRoute.primaryCluster.outputFormats,
      artifactCount: Array.isArray((res as any).studioFiles) ? (res as any).studioFiles.length : 1,
      totalBytes: audited.cleanedText.length,
      executionMode: callerComputeUrl ? "caller_server" : "client_cpu",
    });

    return apiJsonResponse(
      {
        ok: true,
        unlimited: true,
        dailyRequestLimit: null,
        clientComputeFirst: true,
        requestId,
        durationMs: Date.now() - startedAt,
        productId,
        sharedEngineModel: res.activeModel || "heyuka-omni",
        executionTier: policy.tier,
        ownerCostExposureUSD: 0,
        reply: audited.cleanedText,
        vaultedSourcesCount: totals.grandTotalSources,
        vaultMatches: vaultMatches.map((v) => ({ name: v.name, vaultUri: v.vaultUri, url: v.url })),
        studioFiles: (res as any).studioFiles || undefined,
        evolutionTraceId: evo.trace.traceId,
        recommendedProduct: recommended
          ? { id: recommended.id, name: recommended.name, shortTag: recommended.shortTag }
          : null,
      },
      200,
      { "X-Request-Id": requestId }
    );
  } catch (err: any) {
    return apiErrorResponse({
      status: 502,
      message: err?.message || "Studio intelligence engine temporarily unavailable.",
      type: "server_error",
      requestId,
    });
  }
}
