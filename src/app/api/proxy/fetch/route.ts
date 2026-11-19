import { NextRequest } from "next/server";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { resilientFetchWithFallback } from "@/lib/heyuka/shield/resilient-fetch";
import { checkPlanetaryRateLimit } from "@/lib/heyuka/planetary/polyglot-cas-router";
import { assertPayloadWithinServerlessLimit } from "@/lib/heyuka/shield/magic-validator";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * SSRF-Safe Public Proxy Fetcher (`v15.4` Layer-6 3-Tier Resilient Fallback)
 * Prevents client-side CORS blocks and flaky upstream dropouts while strictly blocking private IPs.
 */
export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rl = checkPlanetaryRateLimit(`proxy:${clientIp}`, 60, 60_000);
  if (!rl.allowed) {
    return apiErrorResponse({
      status: 429,
      message: `Rate limit exceeded. Retry in ${Math.ceil(rl.resetMs / 1000)}s.`,
      type: "invalid_request_error",
      code: "rate_limit_exceeded",
      requestId,
    });
  }

  const body = await req.json().catch(() => ({}));
  const urls: string[] = Array.isArray(body?.urls)
    ? body.urls.map(String).slice(0, 4)
    : typeof body?.url === "string"
    ? [body.url]
    : [];

  if (urls.length === 0) {
    return apiErrorResponse({
      status: 400,
      message: "Provide 'url' or 'urls' (public HTTP/HTTPS endpoints only).",
      type: "invalid_request_error",
      requestId,
    });
  }

  const result = await resilientFetchWithFallback(urls, {
    timeoutMs: Math.min(12_000, Math.max(2000, Number(body?.timeoutMs || 6500))),
    retries: 1,
  });

  if (!result.ok) {
    return apiErrorResponse({
      status: result.status,
      message: result.errors.join(" | ") || "Upstream fetch blocked or unavailable",
      type: "server_error",
      code: "upstream_unavailable",
      requestId,
    });
  }

  try {
    assertPayloadWithinServerlessLimit(Buffer.byteLength(result.text, "utf8"));
  } catch (err: any) {
    return apiErrorResponse({
      status: 413,
      message: err?.message || "Payload exceeds serverless threshold",
      type: "invalid_request_error",
      requestId,
    });
  }

  return apiJsonResponse(
    {
      ok: true,
      requestId,
      resolvedUrl: result.url,
      tierUsed: result.tierUsed,
      attemptCount: result.attemptCount,
      content: result.text.slice(0, 250_000),
    },
    200,
    { "X-Request-Id": requestId }
  );
}
