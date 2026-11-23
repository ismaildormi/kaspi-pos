import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import {
  getSwarmNodesSummary,
  recordSwarmNodeHeartbeat,
} from "@/lib/heyuka/swarm-node-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_HEADERS = {
  ...HEYUKA_API_CORS_HEADERS,
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

const HeartbeatSchema = z.object({
  nodeId: z.string().min(2).max(64),
  kind: z.enum([
    "github_matrix",
    "hf_space_docker",
    "cloudflare_edge",
    "kaggle_colab_warc",
    "gitlab_vercel_cron",
    "browser_p2p",
  ]),
  shardId: z.number().int().min(0).max(999),
  totalShards: z.number().int().min(1).max(1000).optional(),
  pagesProcessedDelta: z.number().int().min(0).max(10000).optional(),
  hllUniqueEstimate: z.number().int().min(0).optional(),
  lastDigest: z.string().max(40).optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: LIVE_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/v1/swarm/nodes",
      ...getSwarmNodesSummary(),
    },
    { status: 200, headers: LIVE_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const parsed = HeartbeatSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid swarm node heartbeat", issues: parsed.error.flatten() },
      { status: 400, headers: LIVE_HEADERS }
    );
  }

  const node = recordSwarmNodeHeartbeat(parsed.data);
  return NextResponse.json(
    {
      ok: true,
      node,
      summary: getSwarmNodesSummary(),
    },
    { status: 200, headers: LIVE_HEADERS }
  );
}
