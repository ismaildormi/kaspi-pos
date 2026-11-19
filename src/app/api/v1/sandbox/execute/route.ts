import { NextRequest } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import {
  executePolyglotCodeSandbox,
  type SandboxLanguage,
} from "@/lib/zebra-x/tools/code-sandbox";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

const SUPPORTED = new Set<SandboxLanguage>([
  "python",
  "javascript",
  "typescript",
  "bash",
  "php",
  "go",
  "c++",
]);

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const auth = await authenticateXZebraRequest(req, "sandbox:execute");
  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: auth.status === 403 ? "permission_error" : "authentication_error",
      requestId,
      hint: "Ensure your key includes 'sandbox:execute' scope or pass a full-access key.",
    });
  }

  const body = await req.json().catch(() => ({}));
  const language = String(body?.language || "python").toLowerCase() as SandboxLanguage;
  const code = String(body?.code || "");
  if (!code.trim() || code.length > 16000) {
    return apiErrorResponse({
      status: 400,
      message: "Provide non-empty 'code' (max 16KB).",
      type: "invalid_request_error",
      requestId,
    });
  }

  if (!SUPPORTED.has(language)) {
    return apiErrorResponse({
      status: 400,
      message: `Unsupported language '${language}'. Supported: ${Array.from(SUPPORTED).join(", ")}.`,
      type: "invalid_request_error",
      requestId,
    });
  }

  const result = await executePolyglotCodeSandbox({
    language,
    code,
    stdin: typeof body?.stdin === "string" ? body.stdin : undefined,
  });

  return apiJsonResponse(
    {
      ...result,
      requestId,
      auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
    },
    result.error === "Sandbox execution unavailable" ? 502 : 200,
    { "X-Request-Id": requestId }
  );
}
