import { NextRequest, NextResponse, after } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import {
  cancelDeepAsyncJob,
  executeDeepAsyncJobPipeline,
  getDeepAsyncJob,
  listRecentDeepAsyncJobs,
  startDeepAsyncJob,
} from "@/lib/heyuka/deep-job-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const jobId = (req.nextUrl.searchParams.get("jobId") || "").trim();
  if (!jobId) {
    return NextResponse.json(
      {
        ok: true,
        endpoint: "/api/v1/heyuka/deep-job",
        unboundedExecutionMode: "nextjs15_after_durable_checkpoint_queue_plus_300s_streaming",
        recentJobs: listRecentDeepAsyncJobs(8),
      },
      { status: 200, headers: HEYUKA_API_CORS_HEADERS }
    );
  }
  const job = getDeepAsyncJob(jobId);
  if (!job) {
    return NextResponse.json(
      { ok: false, error: `Job not found: ${jobId}` },
      { status: 404, headers: HEYUKA_API_CORS_HEADERS }
    );
  }
  return NextResponse.json({ ok: true, job }, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "start").trim();

  if (action === "cancel") {
    const jobId = String(body?.jobId || "").trim();
    const cancelled = await cancelDeepAsyncJob(jobId);
    if (!cancelled) {
      return NextResponse.json(
        { ok: false, error: `Job not found for cancellation: ${jobId}` },
        { status: 404, headers: HEYUKA_API_CORS_HEADERS }
      );
    }
    return NextResponse.json({ ok: true, job: cancelled }, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
  }

  if (action === "resume") {
    const jobId = String(body?.jobId || "").trim();
    const existing = getDeepAsyncJob(jobId);
    if (!existing || !existing.prompt) {
      return NextResponse.json(
        { ok: false, error: `Job not found or missing prompt for resumption: ${jobId}` },
        { status: 404, headers: HEYUKA_API_CORS_HEADERS }
      );
    }
    existing.status = "running";
    const promise = executeDeepAsyncJobPipeline(jobId, {
      prompt: existing.prompt,
      brand: existing.brand,
      locale: existing.locale,
    });
    try {
      after(async () => {
        await promise;
      });
    } catch {
      void promise;
    }
    return NextResponse.json({ ok: true, job: existing, resumed: true }, { status: 202, headers: HEYUKA_API_CORS_HEADERS });
  }

  const prompt = String(body?.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json(
      { ok: false, error: "Prompt is required to launch an unbounded deep job." },
      { status: 400, headers: HEYUKA_API_CORS_HEADERS }
    );
  }

  const { executionPromise, ...job } = startDeepAsyncJob(
    {
      prompt,
      brand: body?.brand === "kaspi_pos" ? "kaspi_pos" : "heyuka",
      locale: body?.locale === "fr" || body?.locale === "en" ? body.locale : "ar",
      mode: typeof body?.mode === "string" ? body.mode : "deepthink",
      requestedModel: typeof body?.model === "string" ? body.model : undefined,
      byokKeys: body?.byokKeys && typeof body.byokKeys === "object" ? body.byokKeys : undefined,
    },
    { deferExecutionToCaller: true }
  );

  if (executionPromise) {
    try {
      after(async () => {
        await executionPromise;
      });
    } catch {
      // Fallback when called outside Next.js request scope (e.g. direct unit test runner)
      void executionPromise;
    }
  }

  return NextResponse.json({ ok: true, job }, { status: 202, headers: HEYUKA_API_CORS_HEADERS });
}
