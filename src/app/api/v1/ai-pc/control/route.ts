import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import {
  buildUnstoppableAiComputerAction,
  getPanicStopState,
} from "@/lib/heyuka/os/sovereign-pc-commander";
import { resolveStrictCategoryDisambiguation } from "@/lib/zebra-x/core/cognitive-brain-registry";
import { recordProductSelfEvolution } from "@/lib/heyuka/learning/self-evolution-engine";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      unlimited: true,
      dailyRequestLimit: null,
      clientComputeFirst: true,
      endpoint: "/api/v1/ai-pc/control",
      panicState: getPanicStopState(),
      supportedActions: ["scroll", "zoom", "self_unblock", "webcam_vision", "panic_stop", "dispatch"],
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawAction = String(body?.action || "dispatch").trim();
  const action: "scroll" | "zoom" | "self_unblock" | "webcam_vision" | "panic_stop" | "dispatch" =
    rawAction === "scroll" ||
    rawAction === "zoom" ||
    rawAction === "self_unblock" ||
    rawAction === "webcam_vision" ||
    rawAction === "panic_stop"
      ? rawAction
      : "dispatch";

  const prompt = String(body?.prompt || action).trim();
  const disambiguation = resolveStrictCategoryDisambiguation(prompt);

  const res = buildUnstoppableAiComputerAction({
    action,
    direction: body?.direction === "up" || body?.direction === "left" || body?.direction === "right" ? body.direction : "down",
    amount: typeof body?.amount === "number" ? body.amount : 400,
    zoomDelta: typeof body?.zoomDelta === "number" ? body.zoomDelta : 1,
    blockedReason: typeof body?.blockedReason === "string" ? body.blockedReason : undefined,
    cameraMode: body?.cameraMode,
    prompt,
  });

  recordProductSelfEvolution({
    prompt,
    clusterId: "ai_computer_os_webcam_and_self_unblocking",
    productKind: "project",
    sourcesUsed: res.matchedVaultTools.map((t) => t.name),
    outputFormats: ["AI-PC Action Plan", "Python"],
    artifactCount: 1,
    totalBytes: JSON.stringify(res).length,
    executionMode: "client_cpu",
  });

  return NextResponse.json(
    {
      ...res,
      disambiguation,
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}
