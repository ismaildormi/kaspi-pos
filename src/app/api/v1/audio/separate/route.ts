import { NextRequest } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { executeAudioSeparateTask } from "@/lib/zebra-x/sidecar-bridge";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const auth = await authenticateXZebraRequest(req, "audio:separate");
  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: auth.status === 403 ? "permission_error" : "authentication_error",
      requestId,
    });
  }

  const body = await req.json().catch(() => ({}));
  const mediaUrl = typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : undefined;
  const stems = body?.stems === "4stems" ? "4stems" : "2stems";

  if (!mediaUrl) {
    return apiErrorResponse({
      status: 400,
      message: "Provide public 'mediaUrl' of the audio/video track to separate stems.",
      type: "invalid_request_error",
      requestId,
    });
  }

  const result = await executeAudioSeparateTask({ mediaUrl, stems });
  return apiJsonResponse(
    { ...result, requestId, authMode: auth.authMode },
    result.ok ? 200 : 400,
    { "X-Request-Id": requestId }
  );
}
