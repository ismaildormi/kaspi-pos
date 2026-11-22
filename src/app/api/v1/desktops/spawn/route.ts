import { NextRequest, NextResponse } from "next/server";
import {
  HEYUKA_API_CORS_HEADERS,
} from "@/lib/zebra-x/api-response";
import {
  getPanicStopState,
  manageVirtualDesktopBot,
  spawnVirtualDesktopBot,
  type VirtualDesktopBotSession,
} from "@/lib/heyuka/os/sovereign-pc-commander";
import { recordProductSelfEvolution } from "@/lib/heyuka/learning/self-evolution-engine";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  const status = manageVirtualDesktopBot({ action: "list" });
  return NextResponse.json(
    {
      ok: true,
      unlimited: true,
      dailyRequestLimit: null,
      clientComputeFirst: true,
      endpoint: "/api/v1/desktops/spawn",
      panicState: getPanicStopState(),
      activeBotsCount: status.bots.length,
      bots: status.bots,
      supportedDisplayEngines: [
        "kasmvnc",
        "neko_webrtc",
        "linuxserver_webtop",
        "waydroid_android",
        "gamescope",
      ],
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "spawn").trim();

  if (action === "list" || action === "takeover" || action === "resume" || action === "destroy") {
    const res = manageVirtualDesktopBot({
      action: action as "list" | "takeover" | "resume" | "destroy",
      botId: typeof body?.botId === "string" ? body.botId : undefined,
    });
    return NextResponse.json(
      {
        ok: res.ok,
        unlimited: true,
        clientComputeFirst: true,
        action,
        botsCount: res.bots.length,
        affectedBot: res.affectedBot,
        bots: res.bots,
      },
      { status: res.ok ? 200 : 404, headers: HEYUKA_API_CORS_HEADERS }
    );
  }

  const task = String(body?.task || body?.prompt || "Parallel Web Research & Document Synthesis").trim();
  const role = (body?.role || "researcher") as VirtualDesktopBotSession["role"];
  const displayEngine = (body?.displayEngine || "kasmvnc") as VirtualDesktopBotSession["displayEngine"];
  const resolution = typeof body?.resolution === "string" ? body.resolution : "1920x1080";

  const spawned = spawnVirtualDesktopBot({
    task,
    role,
    displayEngine,
    resolution,
  });

  recordProductSelfEvolution({
    prompt: task,
    clusterId: "pc_keyboard_mouse_and_virtual_desktop_bots",
    productKind: "project",
    sourcesUsed: spawned.matchedVaultTools.map((t) => t.name),
    outputFormats: ["Virtual Desktop JSON", "Docker Compose YAML"],
    artifactCount: 2,
    totalBytes: spawned.dockerComposeYaml.length,
    executionMode: "client_cpu",
  });

  return NextResponse.json(
    {
      ok: true,
      unlimited: true,
      dailyRequestLimit: null,
      clientComputeFirst: true,
      ownerCostExposureUSD: 0,
      ...spawned,
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}
