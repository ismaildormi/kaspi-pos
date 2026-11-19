import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { generateTextWithRouter } from "@/lib/ai-router";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import {
  getPublicEmbedProductInfo,
  type CustomMiniProductRecord,
} from "@/lib/heyuka/ecosystem/mini-products-store";
import {
  evaluateZeroCostPolicy,
  recordTenantFreeTierUsage,
} from "@/lib/heyuka/compute/zero-cost-policy";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function GET(req: NextRequest) {
  const requestId = createRequestId();
  const widgetId = req.nextUrl.searchParams.get("widgetId") || "";
  const info = await getPublicEmbedProductInfo(widgetId);
  if (!info) {
    return apiErrorResponse({
      status: 404,
      message: "Embedded product widget not found.",
      type: "invalid_request_error",
      requestId,
    });
  }
  return apiJsonResponse({ ok: true, requestId, widget: info }, 200, {
    "X-Request-Id": requestId,
  });
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const body = await req.json().catch(() => ({}));
  const widgetId = String(body?.widgetId || "").trim();
  const message = String(body?.message || "").trim();
  if (!widgetId || !message) {
    return apiErrorResponse({
      status: 400,
      message: "widgetId and non-empty message are required.",
      type: "invalid_request_error",
      requestId,
    });
  }

  const row = await prisma.idempotencyRecord.findFirst({
    where: { scope: "heyuka_custom_mini_products_v1", key: widgetId },
  });
  if (!row) {
    return apiErrorResponse({
      status: 404,
      message: "Widget product not found.",
      type: "invalid_request_error",
      requestId,
    });
  }

  const product = row.responseBody as unknown as CustomMiniProductRecord;
  if (!product.enabled) {
    return apiErrorResponse({
      status: 403,
      message: "This embedded HEYUKA mini-product is currently paused by its owner.",
      type: "permission_error",
      requestId,
    });
  }

  const policy = await evaluateZeroCostPolicy({ tenantId: product.tenantId });
  if (!policy.allowed) {
    return apiErrorResponse({
      status: 429,
      message: policy.reason,
      type: "permission_error",
      requestId,
    });
  }

  try {
    const res = await generateTextWithRouter({
      system: `${product.customInstructions}\nStrict Product Scope: ${product.domainContext}\nAllowed Capabilities: ${product.allowedCapabilities.join(", ")}\nDenied Capabilities (Must refuse politely): ${product.deniedCapabilities.join(", ") || "none"}`,
      messages: [{ role: "user", content: message.slice(0, 2000) }],
      governance: {
        tenantId: product.tenantId,
        allowOwnerPaidProviders: false,
      },
    } as any);

    if (policy.tier === "free_public_tier") {
      await recordTenantFreeTierUsage(product.tenantId).catch(() => {});
    }

    await prisma.idempotencyRecord.update({
      where: { id: row.id },
      data: {
        responseBody: {
          ...product,
          usageCount: (product.usageCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        } as any,
      },
    });

    return apiJsonResponse(
      {
        ok: true,
        requestId,
        widgetId: product.id,
        reply: String(res.text || ""),
      },
      200,
      { "X-Request-Id": requestId }
    );
  } catch (err: any) {
    await prisma.idempotencyRecord
      .update({
        where: { id: row.id },
        data: {
          responseBody: {
            ...product,
            errorCount: (product.errorCount || 0) + 1,
            lastErrorMessage: String(err?.message || "Gateway error").slice(0, 180),
          } as any,
        },
      })
      .catch(() => {});

    return apiErrorResponse({
      status: 502,
      message: err?.message || "Widget inference failed.",
      type: "server_error",
      requestId,
    });
  }
}
