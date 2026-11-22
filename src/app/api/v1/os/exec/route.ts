import { NextRequest, NextResponse } from "next/server";
import { HEYUKA_API_CORS_HEADERS } from "@/lib/zebra-x/api-response";
import { assertPosCoreImmutable } from "@/lib/zebra-x/arsenal-vault";
import { buildSovereignOsAndFileSurgeonPlan } from "@/lib/heyuka/os/sovereign-pc-commander";
import { searchSovereignVault } from "@/lib/heyuka/vault/sovereign-permanent-vault";
import { recordProductSelfEvolution } from "@/lib/heyuka/learning/self-evolution-engine";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEYUKA_API_CORS_HEADERS });
}

export async function GET() {
  const engines = searchSovereignVault({ pack: "v53.0", limit: 15 });
  return NextResponse.json(
    {
      ok: true,
      unlimited: true,
      dailyRequestLimit: null,
      clientComputeFirst: true,
      endpoint: "/api/v1/os/exec",
      supportedActions: ["shell", "file_lifecycle", "sentinel_health", "app_operate"],
      safetyGuarantee: "POS_CORE_LOCK=true + .yuka-bak Shadow Backup + Send2Trash Reversible Delete (Executes on Caller Local Desktop/Client Companion)",
      v53SampleEngines: engines.map((e) => ({ name: e.name, vaultUri: e.vaultUri, url: e.url })),
    },
    { status: 200, headers: HEYUKA_API_CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawAction = String(body?.action || "file_lifecycle").trim();
  const action: "shell" | "file_lifecycle" | "sentinel_health" | "app_operate" =
    rawAction === "shell" || rawAction === "sentinel_health" || rawAction === "app_operate"
      ? rawAction
      : "file_lifecycle";

  const targetPath = typeof body?.targetPath === "string" ? body.targetPath.trim() : "./workspace/sample-note.txt";
  try {
    assertPosCoreImmutable(targetPath);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "IMMUTABLE_POS_CORE_LOCK", posCoreProtected: true },
      { status: 403, headers: HEYUKA_API_CORS_HEADERS }
    );
  }

  const plan = buildSovereignOsAndFileSurgeonPlan({
    action,
    command: typeof body?.command === "string" ? body.command : undefined,
    targetPath,
    appTitle: typeof body?.appTitle === "string" ? body.appTitle : undefined,
    editSnippet: typeof body?.editSnippet === "string" ? body.editSnippet : undefined,
  });

  recordProductSelfEvolution({
    prompt: `${action}: ${body?.command || targetPath}`,
    clusterId: "sovereign_os_shell_file_surgeon_and_sentinel",
    productKind: "code",
    sourcesUsed: plan.matchedVaultTools.map((t) => t.name),
    outputFormats: ["PowerShell", "Bash", "Python"],
    artifactCount: 3,
    totalBytes: JSON.stringify(plan.generatedScripts).length,
    executionMode: "client_cpu",
  });

  return NextResponse.json(plan, { status: 200, headers: HEYUKA_API_CORS_HEADERS });
}
