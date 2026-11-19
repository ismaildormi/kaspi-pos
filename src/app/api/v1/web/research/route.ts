import { NextRequest } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const auth = await authenticateXZebraRequest(req, "web:research");
  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: auth.status === 403 ? "permission_error" : "authentication_error",
      requestId,
    });
  }

  const body = await req.json().catch(() => ({}));
  const query = typeof body?.query === "string" ? body.query.trim() : undefined;
  const url = typeof body?.url === "string" ? body.url.trim() : undefined;
  const lang = typeof body?.lang === "string" ? body.lang.slice(0, 2) : "en";

  if (!query && !url) {
    return apiErrorResponse({
      status: 400,
      message: "Provide 'query' (open web search) or 'url' (SSRF-safe page extraction).",
      type: "invalid_request_error",
      requestId,
    });
  }

  const res = await runUnrestrictedWebResearch({ query, url, lang });
  return apiJsonResponse(
    {
      ...res,
      requestId,
      auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
    },
    res.ok ? 200 : 400,
    { "X-Request-Id": requestId }
  );
}
