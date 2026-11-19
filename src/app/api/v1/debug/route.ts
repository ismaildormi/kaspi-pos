import { NextRequest } from "next/server";
import {
  ALL_X_ZEBRA_SCOPES,
  authenticateXZebraRequest,
  isDeveloperApiToken,
} from "@/lib/zebra-x/api-auth";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { getRouterCandidates } from "@/lib/ai-router";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

async function handleDebugRequest(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = createRequestId();
  const authHeader = req.headers.get("authorization") || "";
  const apiKeyHeader =
    req.headers.get("x-api-key") ||
    req.headers.get("api-key") ||
    req.headers.get("x-goog-api-key") ||
    "";
  const keyIdHeader = req.headers.get("x-api-key-id") || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const rawToken = bearerToken || apiKeyHeader.trim();

  const auth = await authenticateXZebraRequest(req);
  const latencyMs = Date.now() - startedAt;

  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: "authentication_error",
      code: rawToken && !isDeveloperApiToken(rawToken) ? "invalid_token_prefix" : "unauthorized",
      requestId,
      hint: !rawToken
        ? "Send 'Authorization: Bearer hk-live-...' (or 'yk-live-...') in request headers."
        : keyIdHeader
        ? "Check that your Secret API Key is not revoked/expired and matches X-API-Key-Id."
        : "Verify that your Secret API Key is copied completely with no extra spaces or newlines.",
    });
  }

  const candidates = await getRouterCandidates();
  const activeGatewaysCount = new Set(candidates.map((c) => c.providerName)).size;

  return apiJsonResponse(
    {
      ok: true,
      requestId,
      latencyMs,
      auth: {
        mode: auth.authMode,
        authenticated: true,
        tenantId: auth.tenantId,
        keyId: auth.keyId || null,
        label: auth.keyMeta?.label || "Session",
        prefix: auth.keyMeta?.prefix || null,
        scopes: auth.keyMeta?.scopes || ALL_X_ZEBRA_SCOPES,
        usageCount: auth.keyMeta?.usageCount ?? null,
        lastUsedAt: auth.keyMeta?.lastUsedAt || null,
        keyIdHeaderVerified: Boolean(keyIdHeader && auth.keyId === keyIdHeader),
      },
      gateway: {
        openaiCompatibleBaseUrl: "/api/v1",
        rootAliasSupported: "/v1",
        corsEnabled: true,
        modelsAvailable: ["heyuka-omni", "heyuka-core", "heyuka-vision"],
        activeGatewaysCount,
      },
      endpoints: [
        "/api/v1/models",
        "/api/v1/chat/completions",
        "/api/v1/debug",
        "/api/v1/public-apis",
        "/api/v1/sandbox/execute",
        "/api/v1/web/research",
        "/api/v1/images/generate",
        "/api/v1/vision/remove-bg",
        "/api/v1/3d/assets",
        "/api/v1/3d/generate",
        "/api/v1/audio/transcribe",
        "/api/v1/audio/separate",
      ],
    },
    200,
    {
      "X-Request-Id": requestId,
      "X-HEYUKA-Latency-Ms": String(latencyMs),
      "X-HEYUKA-Key-Id": auth.keyId || "session",
    }
  );
}

export async function GET(req: NextRequest) {
  return handleDebugRequest(req);
}

export async function POST(req: NextRequest) {
  return handleDebugRequest(req);
}
