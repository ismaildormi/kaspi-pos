import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import {
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
        unboundedExecutionMode: "async_job_polling_plus_300s_streaming",
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
  const prompt = String(body?.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json(
      { ok: false, error: "Prompt is required to launch an unbounded deep job." },
      { status: 400, headers: HEYUKA_API_CORS_HEADERS }
    );
  }
  const job = startDeepAsyncJob({
    prompt,
    brand: body?.brand === "kaspi_pos" ? "kaspi_pos" : "heyuka",
    locale: body?.locale === "fr" || body?.locale === "en" ? body.locale : "ar",
    mode: typeof body?.mode === "string" ? body.mode : "deepthink",
    requestedModel: typeof body?.model === "string" ? body.model : undefined,
    byokKeys: body?.byokKeys && typeof body.byokKeys === "object" ? body.byokKeys : undefined,
  });
  return NextResponse.json({ ok: true, job }, { status: 202, headers: HEYUKA_API_CORS_HEADERS });
}
