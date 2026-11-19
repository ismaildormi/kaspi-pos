import { NextRequest } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { executeThreeDGenerateTask } from "@/lib/zebra-x/sidecar-bridge";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const auth = await authenticateXZebraRequest(req, "3d:generate");
  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: auth.status === 403 ? "permission_error" : "authentication_error",
      requestId,
    });
  }

  const body = await req.json().catch(() => ({}));
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : undefined;
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : undefined;
  const format =
    body?.format === "fbx" || body?.format === "blend" ? body.format : "glb";

  if (!prompt && !imageUrl) {
    return apiErrorResponse({
      status: 400,
      message: "Provide 'prompt' or public 'imageUrl' for 3D generation.",
      type: "invalid_request_error",
      requestId,
    });
  }

  try {
    const result = await executeThreeDGenerateTask({
      prompt,
      imageUrl,
      format,
      targetPath: typeof body?.targetPath === "string" ? body.targetPath : undefined,
    });
    return apiJsonResponse(
      { ...result, requestId, authMode: auth.authMode },
      result.ok ? 200 : 400,
      { "X-Request-Id": requestId }
    );
  } catch (err: any) {
    return apiErrorResponse({
      status: 403,
      message: err?.message || "3D generation blocked or failed",
      type: "permission_error",
      requestId,
    });
  }
}
