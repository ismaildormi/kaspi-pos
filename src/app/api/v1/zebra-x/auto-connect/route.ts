import { NextRequest } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import {
  discoverOpenApiSpec,
  registerWebhookOrMcpConnector,
} from "@/lib/zebra-x/core/auto-connector";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const auth = await authenticateXZebraRequest(req, "connector:discover");
  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: auth.status === 403 ? "permission_error" : "authentication_error",
      requestId,
    });
  }

  const body = await req.json().catch(() => ({}));
  if (body?.specUrl) {
    const res = await discoverOpenApiSpec(String(body.specUrl));
    return apiJsonResponse(
      { ...res, requestId },
      res.ok ? 200 : 400,
      { "X-Request-Id": requestId }
    );
  }

  if (body?.endpointUrl && body?.name) {
    const kind = body?.kind === "mcp" ? "mcp" : "webhook";
    const res = await registerWebhookOrMcpConnector({
      kind,
      name: String(body.name),
      endpointUrl: String(body.endpointUrl),
    });
    return apiJsonResponse(
      { ...res, requestId },
      res.ok ? 200 : 400,
      { "X-Request-Id": requestId }
    );
  }

  return apiErrorResponse({
    status: 400,
    message: "Provide 'specUrl' (OpenAPI/Swagger JSON) or '{ kind, name, endpointUrl }'.",
    type: "invalid_request_error",
    requestId,
  });
}
