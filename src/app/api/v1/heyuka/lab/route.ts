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
  buildBenchmarkExportZip,
  listBenchmarkRuns,
  runAutonomousBenchmarkSuite,
  updateBenchmarkHumanReview,
  type BenchmarkCategoryId,
} from "@/lib/heyuka/ecosystem/benchmark-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function GET() {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const runs = await listBenchmarkRuns(ctx.tenantId);
    return apiJsonResponse({ ok: true, requestId, runs }, 200, {
      "X-Request-Id": requestId,
    });
  } catch {
    return apiErrorResponse({
      status: 401,
      message: "Sign in required to inspect benchmark lab history.",
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

    if (body?.action === "export_zip") {
      const runs = await listBenchmarkRuns(ctx.tenantId);
      const targetRun = body?.runId
        ? runs.find((r) => r.runId === String(body.runId))
        : runs[0];
      if (!targetRun) {
        return apiErrorResponse({
          status: 404,
          message: "No completed benchmark run found to export.",
          type: "invalid_request_error",
          requestId,
        });
      }
      const zipBytes = await buildBenchmarkExportZip({
        tenantId: ctx.tenantId,
        run: targetRun,
      });
      return new Response(new Blob([new Uint8Array(zipBytes)], { type: "application/zip" }), {
        status: 200,
        headers: {
          ...HEYUKA_API_CORS_HEADERS,
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="HEYUKA_FULL_BENCHMARK_${targetRun.runId}.zip"`,
          "X-Request-Id": requestId,
        },
      });
    }

    const categories = Array.isArray(body?.categories)
      ? (body.categories as BenchmarkCategoryId[])
      : undefined;
    const run = await runAutonomousBenchmarkSuite({
      tenantId: ctx.tenantId,
      categories,
    });
    return apiJsonResponse({ ok: true, requestId, run }, 200, {
      "X-Request-Id": requestId,
    });
  } catch (err: any) {
    const msg = String(err?.message || "Benchmark run failed");
    const status = msg.includes("AUTHENTICATED") ? 401 : msg.includes("quota") ? 429 : 400;
    return apiErrorResponse({
      status,
      message: msg,
      type: status === 401 ? "authentication_error" : "invalid_request_error",
      requestId,
    });
  }
}

export async function PATCH(req: NextRequest) {
  const requestId = createRequestId();
  try {
    const ctx = await getRequestContext();
    const body = await req.json().catch(() => ({}));
    if (!body?.runId || !body?.testId) {
      return apiErrorResponse({
        status: 400,
        message: "Provide runId and testId.",
        type: "invalid_request_error",
        requestId,
      });
    }
    const updated = await updateBenchmarkHumanReview({
      tenantId: ctx.tenantId,
      runId: String(body.runId),
      testId: String(body.testId),
      promptAdherence:
        typeof body.promptAdherence === "number" ? body.promptAdherence : null,
      visualOrTechnicalQuality:
        typeof body.visualOrTechnicalQuality === "number"
          ? body.visualOrTechnicalQuality
          : null,
      notes: String(body.notes || ""),
    });
    return apiJsonResponse({ ok: Boolean(updated), requestId, run: updated }, updated ? 200 : 404, {
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
