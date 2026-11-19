import { NextRequest } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
  HEYUKA_API_CORS_HEADERS,
} from "@/lib/zebra-x/api-response";
import {
  deleteVaultOutput,
  listVaultOutputs,
  saveVaultOutput,
  type OutputTruthClass,
} from "@/lib/heyuka/ecosystem/output-vault";
import { buildBinarySafeZipArchive } from "@/lib/heyuka/pkzip";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function GET(req: NextRequest) {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const productId = req.nextUrl.searchParams.get("productId") || undefined;
    const truthClass = (req.nextUrl.searchParams.get("truthClass") || undefined) as
      | OutputTruthClass
      | undefined;

    const outputs = await listVaultOutputs({
      tenantId: ctx.tenantId,
      productId,
      truthClass,
      limit: 80,
    });

    if (req.nextUrl.searchParams.get("downloadZip") === "1") {
      const entries = [
        {
          path: "HEYUKA_OUTPUT_VAULT/MANIFEST.json",
          data: JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              tenantId: ctx.tenantId,
              count: outputs.length,
              items: outputs,
            },
            null,
            2
          ),
        },
        ...outputs
          .filter((o) => o.inlineTextPreview)
          .map((o) => ({
            path: `HEYUKA_OUTPUT_VAULT/${o.productId}/${o.id}.${o.format || "txt"}`,
            data: o.inlineTextPreview || "",
          })),
      ];
      const zipBytes = buildBinarySafeZipArchive(entries);
      return new Response(new Blob([new Uint8Array(zipBytes)], { type: "application/zip" }), {
        status: 200,
        headers: {
          ...HEYUKA_API_CORS_HEADERS,
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="HEYUKA_REAL_OUTPUT_VAULT.zip"',
          "X-Request-Id": requestId,
        },
      });
    }

    return apiJsonResponse({ ok: true, requestId, outputs }, 200, {
      "X-Request-Id": requestId,
    });
  } catch {
    return apiErrorResponse({
      status: 401,
      message: "Sign in required to access your HEYUKA Real Output Vault.",
      type: "authentication_error",
      requestId,
    });
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const body = await req.json().catch(() => ({}));
    if (!body?.taskName || !body?.productId) {
      return apiErrorResponse({
        status: 400,
        message: "Provide taskName and productId to log a verified vault artifact.",
        type: "invalid_request_error",
        requestId,
      });
    }
    const saved = await saveVaultOutput({
      tenantId: ctx.tenantId,
      taskName: String(body.taskName),
      productId: String(body.productId),
      actualModel: String(body.actualModel || "heyuka-omni"),
      actualEngine: String(body.actualEngine || "HEYUKA Studio Pipeline"),
      status: body.status || "completed",
      truthClass: body.truthClass || "real_output",
      durationMs: Number(body.durationMs || 0),
      format: String(body.format || "txt"),
      byteSize: typeof body.byteSize === "number" ? body.byteSize : undefined,
      dimensions: typeof body.dimensions === "string" ? body.dimensions : undefined,
      accessUrl: typeof body.accessUrl === "string" ? body.accessUrl : undefined,
      inlineTextPreview:
        typeof body.inlineTextPreview === "string" ? body.inlineTextPreview : undefined,
      errorLog: typeof body.errorLog === "string" ? body.errorLog : undefined,
    });
    return apiJsonResponse({ ok: true, requestId, output: saved }, 201, {
      "X-Request-Id": requestId,
    });
  } catch {
    return apiErrorResponse({
      status: 401,
      message: "Authentication required",
      type: "authentication_error",
      requestId,
    });
  }
}

export async function DELETE(req: NextRequest) {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const id = req.nextUrl.searchParams.get("id") || "";
    const ok = await deleteVaultOutput(ctx.tenantId, id);
    return apiJsonResponse({ ok, requestId, id }, ok ? 200 : 404, {
      "X-Request-Id": requestId,
    });
  } catch {
    return apiErrorResponse({
      status: 401,
      message: "Authentication required",
      type: "authentication_error",
      requestId,
    });
  }
}
