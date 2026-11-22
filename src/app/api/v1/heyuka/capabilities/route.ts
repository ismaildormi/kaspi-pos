import { NextRequest } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import {
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { discoverDynamicCapabilities } from "@/lib/heyuka/compute/capability-registry";
import { SPECIALIZED_PRODUCTS } from "@/lib/heyuka/ecosystem/products-catalog";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function GET(req: NextRequest) {
  const requestId = createRequestId();
  let tenantId: string | undefined;
  try {
    const ctx = await getRequestContext();
    tenantId = ctx.tenantId;
  } catch {
    // Public discovery allowed cleanly without exposing tenant workers
  }

  const registry = await discoverDynamicCapabilities({ tenantId });
  const includeProducts = req.nextUrl.searchParams.get("products") !== "0";

  return apiJsonResponse(
    {
      ok: true,
      unlimited: true,
      dailyRequestLimit: null,
      clientComputeFirst: true,
      requestId,
      owner: "KASPI",
      platform: "HEYUKA AI Multi-Intelligence Ecosystem",
      zeroCostOwnerSafeguard: true,
      ...registry,
      ...(includeProducts ? { products: SPECIALIZED_PRODUCTS } : {}),
    },
    200,
    { "X-Request-Id": requestId }
  );
}
