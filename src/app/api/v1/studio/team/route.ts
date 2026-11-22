import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import {
  buildAirGappedOfflineManifest,
  computeTeamGamificationSummary,
} from "@/lib/heyuka/studio/studio-orchestrator-v55-v60";

export const dynamic = "force-dynamic";

const teamXpEvents: Array<{ member: string; xp: number; badge?: string; reason: string; at: string }> = [
  { member: "Ismail", xp: 450, badge: "🧠 Prompt Master", reason: "Initialized HEYUKA & KASPI POS Dual Studio", at: "2026-11-22T01:00:00Z" },
  { member: "@heyuka", xp: 320, badge: "⚡ Speed Demon", reason: "Zero-Error 12-Model Titan Swarm Synthesis", at: "2026-11-22T02:00:00Z" },
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      unlimited: true,
      endpoint: "/api/v1/studio/team",
      rbacRoles: ["Owner", "Admin", "Developer", "Designer", "Cashier", "Viewer"],
      gamification: computeTeamGamificationSummary(teamXpEvents),
      events: teamXpEvents.slice(0, 20),
      offlineManifest: buildAirGappedOfflineManifest(),
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body?.action === "offline_manifest") {
    return NextResponse.json(buildAirGappedOfflineManifest(), {
      status: 200,
      headers: HEYUKA_API_CORS_HEADERS,
    });
  }
  const member = String(body?.member || "Team Member").slice(0, 48);
  const xp = Math.min(500, Math.max(10, Number(body?.xp || 50)));
  const badge = typeof body?.badge === "string" && body.badge.trim() ? body.badge.trim().slice(0, 40) : undefined;
  const reason = String(body?.reason || "Studio collaboration milestone").slice(0, 140);
  teamXpEvents.unshift({ member, xp, badge, reason, at: new Date().toISOString() });
  if (teamXpEvents.length > 60) teamXpEvents.length = 60;

  return NextResponse.json(
    {
      ok: true,
      unlimited: true,
      gamification: computeTeamGamificationSummary(teamXpEvents),
      events: teamXpEvents.slice(0, 20),
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}
