import { NextRequest, NextResponse } from "next/server";
import {
  EpisodicMemoryBrainAgent,
  FiscalChainAndLedgerAuditorAgent,
  FleetSyncAndAntiStampedeAgent,
  runFullFleetDiagnosticSweep,
} from "@/lib/autonomous-fleet/fleet-orchestrator";
import { getRequestContext } from "@/server/auth/context";

async function isAuthorizedRequest(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  try {
    await getRequestContext();
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const runActive = req.nextUrl.searchParams.get("heal") === "1";
  try {
    const report = await runFullFleetDiagnosticSweep(runActive);
    return NextResponse.json({
      success: true,
      ...report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Fleet diagnostic sweep failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedRequest(req);
  if (!authorized && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized fleet operator" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "sweep");

    if (action === "heal_sync_dlq") {
      const syncResult = await FleetSyncAndAntiStampedeAgent.healStuckSyncOperations();
      return NextResponse.json({ success: true, action, syncResult });
    }

    if (action === "verify_fiscal_chains") {
      const fiscalResult = await FiscalChainAndLedgerAuditorAgent.auditRecentSalesSample();
      return NextResponse.json({ success: true, action, fiscalResult });
    }

    if (action === "record_immunity" && body?.symptomSignature) {
      const rule = EpisodicMemoryBrainAgent.learn({
        symptomSignature: String(body.symptomSignature),
        rootCause: String(body.rootCause || "Runtime anomaly"),
        verifiedFixAction: String(body.verifiedFixAction || "Autonomous recovery"),
        recoveryTimeMs: Number(body.recoveryTimeMs || 0),
      });
      return NextResponse.json({ success: true, action, rule });
    }

    const report = await runFullFleetDiagnosticSweep(true);
    return NextResponse.json({
      success: true,
      action: "sweep",
      ...report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Fleet self-healing failed" },
      { status: 500 }
    );
  }
}
