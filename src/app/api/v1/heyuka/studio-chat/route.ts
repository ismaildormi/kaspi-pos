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

  const policy = await evaluateZeroCostPolicy({ tenantId });
  if (!policy.allowed) {
    return apiErrorResponse({
      status: 429,
      message: policy.reason,
      type: "permission_error",
      code: "zero_cost_budget_reached",
      requestId,
    });
  }

  const domainContext = studio
    ? `${studio.specializedSystemPrompt}\nAllowed Endpoints: ${studio.allowedApiEndpoints.join(", ")}\nScope Rule: ${studio.excludedTaskGuidance}\nDisclosure: ${studio.sharedEngineDisclosure.en}${
        typeof body?.workspaceContext === "string" && body.workspaceContext.trim()
          ? `\n\nActive Project Workspace Context:\n${body.workspaceContext.slice(0, 4000)}`
          : ""
      }`
    : `You are HEYUKA Intelligence Command Center by KASPI. Answer helpful requests accurately without inventing tools or files. If a specialized studio aligns with the user's goal, mention it briefly while helping directly.`;

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
      },
    } as any);

    if (policy.tier === "free_public_tier") {
      await recordTenantFreeTierUsage(tenantId).catch(() => {});
    }

    const audited = runPreReplyReflectionGate({
      draftText: String(res.text || ""),
      expectedLocale: /[\u0600-\u06FF]/.test(lastUserText) ? "ar" : "en",
    });

    return apiJsonResponse(
      {
        ok: true,
        requestId,
        durationMs: Date.now() - startedAt,
        productId,
        sharedEngineModel: res.activeModel || "heyuka-omni",
        executionTier: policy.tier,
        ownerCostExposureUSD: 0,
        reply: audited.cleanedText,
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
