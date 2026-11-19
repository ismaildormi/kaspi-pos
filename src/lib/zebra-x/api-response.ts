import crypto from "node:crypto";
import { NextResponse } from "next/server";

export const HEYUKA_API_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-API-Key, X-API-Key-Id, api-key, x-goog-api-key, OpenAI-Organization, x-request-id",
  "Access-Control-Expose-Headers":
    "X-Request-Id, X-HEYUKA-Key-Id, X-HEYUKA-Model, X-HEYUKA-Latency-Ms",
  "Cross-Origin-Resource-Policy": "cross-origin",
};

export function createRequestId(): string {
  return `req_${crypto.randomBytes(8).toString("hex")}`;
}

export function createApiOptionsResponse(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...HEYUKA_API_CORS_HEADERS,
      "Access-Control-Max-Age": "86400",
    },
  });
}

export function apiJsonResponse<T>(
  data: T,
  status = 200,
  extraHeaders: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      ...HEYUKA_API_CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export function apiErrorResponse(params: {
  status: number;
  message: string;
  type: "authentication_error" | "permission_error" | "invalid_request_error" | "server_error";
  code?: string | number;
  requestId?: string;
  hint?: string;
}): NextResponse {
  const requestId = params.requestId || createRequestId();
  return apiJsonResponse(
    {
      error: {
        message: params.message,
        type: params.type,
        code: params.code ?? params.status,
        request_id: requestId,
        ...(params.hint ? { debug_hint: params.hint } : {}),
      },
    },
    params.status,
    { "X-Request-Id": requestId }
  );
}
