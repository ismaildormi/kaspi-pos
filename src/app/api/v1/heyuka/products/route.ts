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
  createTenantMiniProduct,
  deleteTenantMiniProduct,
  listTenantMiniProducts,
  updateTenantMiniProduct,
} from "@/lib/heyuka/ecosystem/mini-products-store";

export const dynamic = "force-dynamic";

const CreateProductSchema = z.object({
  baseProductId: z.enum([
    "3d-studio",
    "background-studio",
    "image-studio",
    "video-studio",
    "shorts-studio",
    "coding-studio",
    "audio-studio",
    "conversion-studio",
    "data-studio",
    "web-studio",
    "document-studio",
    "automation-studio",
  ]),
  name: z.string().min(1).max(64),
  tagline: z.string().max(140).optional(),
  domainContext: z.string().max(100).optional(),
  allowedCapabilities: z.array(z.string().max(64)).max(20).optional(),
  deniedCapabilities: z.array(z.string().max(64)).max(20).optional(),
  customInstructions: z.string().max(2000).optional(),
  accentColor: z.enum(["emerald", "teal", "violet", "amber", "titanium"]).optional(),
  widgetTitle: z.string().max(64).optional(),
  dailyRateLimit: z.number().int().min(10).max(5000).optional(),
});

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function GET() {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const products = await listTenantMiniProducts(ctx.tenantId);
    return apiJsonResponse(
      { ok: true, requestId, tenantId: ctx.tenantId, products },
      200,
      { "X-Request-Id": requestId }
    );
  } catch {
    return apiErrorResponse({
      status: 401,
      message: "Sign in required to manage your specialized mini-products.",
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
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return apiErrorResponse({
        status: 400,
        message: "Provide valid baseProductId and product name.",
        type: "invalid_request_error",
        requestId,
      });
    }

    const created = await createTenantMiniProduct({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      ...parsed.data,
    });
    return apiJsonResponse({ ok: true, requestId, ...created }, 201, {
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

export async function PATCH(req: NextRequest) {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const body = await req.json().catch(() => ({}));
    const productId = String(body?.productId || "");
    if (!productId) {
      return apiErrorResponse({
        status: 400,
        message: "productId is required.",
        type: "invalid_request_error",
        requestId,
      });
    }

    const updated = await updateTenantMiniProduct({
      tenantId: ctx.tenantId,
      productId,
      enabled: typeof body?.enabled === "boolean" ? body.enabled : undefined,
      name: typeof body?.name === "string" ? body.name : undefined,
      customInstructions:
        typeof body?.customInstructions === "string" ? body.customInstructions : undefined,
      dailyRateLimit:
        typeof body?.dailyRateLimit === "number" ? body.dailyRateLimit : undefined,
      accentColor: body?.accentColor,
    });
    if (!updated) {
      return apiErrorResponse({
        status: 404,
        message: "Product not found for this tenant.",
        type: "invalid_request_error",
        requestId,
      });
    }
    return apiJsonResponse({ ok: true, requestId, product: updated }, 200, {
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

export async function DELETE(req: NextRequest) {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const id = req.nextUrl.searchParams.get("id") || "";
    const ok = await deleteTenantMiniProduct(ctx.tenantId, id);
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
