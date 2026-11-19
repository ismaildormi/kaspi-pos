import { NextRequest } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/server/auth/context";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import {
  deleteTenantByokProvider,
  getTenantDailyFreeUsage,
  listTenantByokProviders,
  saveTenantByokProvider,
} from "@/lib/heyuka/compute/zero-cost-policy";

export const dynamic = "force-dynamic";

const SaveByokSchema = z.object({
  providerKind: z.enum([
    "openai_compatible",
    "groq",
    "google",
    "openrouter",
    "mistral",
    "local_ollama",
  ]),
  label: z.string().min(1).max(64),
  apiKey: z.string().min(1).max(300),
  modelId: z.string().min(1).max(100),
  baseUrl: z.string().max(300).optional(),
});

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function GET() {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const [providers, dailyBudget] = await Promise.all([
      listTenantByokProviders(ctx.tenantId),
      getTenantDailyFreeUsage(ctx.tenantId),
    ]);
    return apiJsonResponse(
      {
        ok: true,
        requestId,
        providers,
        dailyBudget,
        ownerCostExposureUSD: 0,
      },
      200,
      { "X-Request-Id": requestId }
    );
  } catch {
    return apiErrorResponse({
      status: 401,
      message: "Sign in required to inspect tenant BYOK credentials.",
      type: "authentication_error",
      requestId,
    });
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const body = await req.json().catch(() => ({}));
    const parsed = SaveByokSchema.safeParse(body);
    if (!parsed.success) {
      return apiErrorResponse({
        status: 400,
        message: "Provide valid providerKind, label, apiKey, and modelId.",
        type: "invalid_request_error",
        requestId,
      });
    }
    const provider = await saveTenantByokProvider({
      tenantId: ctx.tenantId,
      ...parsed.data,
    });
    return apiJsonResponse({ ok: true, requestId, provider }, 201, {
      "X-Request-Id": requestId,
    });
  } catch (err: any) {
    return apiErrorResponse({
      status: 401,
      message: err?.message || "Authentication required",
      type: "authentication_error",
      requestId,
    });
  }
}

export async function DELETE(req: NextRequest) {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const id = req.nextUrl.searchParams.get("id") || "";
    const ok = await deleteTenantByokProvider(ctx.tenantId, id);
    return apiJsonResponse({ ok, requestId, id }, ok ? 200 : 404, {
      "X-Request-Id": requestId,
    });
  } catch {
    return apiErrorResponse({
      status: 401,
      message: "Authentication required",
      type: "authentication_error",
      requestId,
    });
  }
}
