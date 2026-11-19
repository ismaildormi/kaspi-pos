import { NextRequest } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { executeAudioTranscribeTask } from "@/lib/zebra-x/sidecar-bridge";
import { findActiveEligibleWorker } from "@/lib/heyuka/compute/workers-registry";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const auth = await authenticateXZebraRequest(req, "audio:transcribe");
  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: auth.status === 403 ? "permission_error" : "authentication_error",
      requestId,
    });
  }

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData().catch(() => null);
    const file = fd?.get("file") as Blob | null;
    if (!file) {
      return apiErrorResponse({
        status: 400,
        message: "No audio file uploaded under 'file'.",
        type: "invalid_request_error",
        requestId,
      });
    }
    const audioBuffer = Buffer.from(await file.arrayBuffer());
    const result = await executeAudioTranscribeTask({
      audioBuffer,
      mimeType: file.type || "audio/webm",
      language: typeof fd?.get("language") === "string" ? String(fd?.get("language")) : undefined,
    });
    return apiJsonResponse(
      { ...result, requestId, authMode: auth.authMode },
      result.ok ? 200 : 400,
      { "X-Request-Id": requestId }
    );
  }

  const body = await req.json().catch(() => ({}));
  const mediaUrl = typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : undefined;
  const language = typeof body?.language === "string" ? body.language.trim() : undefined;

  const activeWorker = mediaUrl
    ? await findActiveEligibleWorker({
        tenantId: auth.tenantId,
        requiredCapability: "audio_transcribe",
      })
    : null;
  const result = await executeAudioTranscribeTask({
    mediaUrl,
    language,
    tenantWorker: activeWorker
      ? { endpointUrl: activeWorker.worker.endpointUrl, token: activeWorker.token }
      : null,
  });
  return apiJsonResponse(
    { ...result, requestId, authMode: auth.authMode },
    result.ok ? 200 : 400,
    { "X-Request-Id": requestId }
  );
}
