/**
 * HEYUKA v114.0 — CROSS-SESSION PROJECT MEMORY & TENANT ISOLATION VERIFICATION
 */
import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "../../src/app/api/v1/heyuka/memory/route";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`[CROSS-SESSION MEMORY TEST FAILED] ${msg}`);
}

async function main() {
  console.log("=================================================================");
  console.log("  HEYUKA v114.0 — CROSS-SESSION MEMORY & ISOLATION VERIFICATION");
  console.log("=================================================================\n");

  const tenantA = `user_mem_a_${Date.now()}`;
  const tenantB = `user_mem_b_${Date.now()}`;
  const projectId = "kaspi-atlas-project";
  const key = `decision_${Date.now()}`;

  // 1. Save project memory in Session 1
  const postReq = new NextRequest("http://localhost:3000/api/v1/heyuka/memory", {
    method: "POST",
    body: JSON.stringify({
      tenantId: tenantA,
      projectId,
      layer: "project",
      key,
      title: "Architecture decision: Moroccan DGI Art. 145 & PostgreSQL RLS",
      content: "Always use Decimal(12,2) with FOR UPDATE invoice sequence locks and strict RLS tenant isolation.",
      tags: ["architecture", "dgi", "rls"],
    }),
  });
  const postRes = await POST(postReq);
  assert(postRes.status === 200, `POST /memory must return 200 (got ${postRes.status})`);
  const postJson = (await postRes.json()) as { ok: boolean; record: { id: string } };
  assert(postJson.ok && postJson.record.id, "POST /memory must persist and return record ID");
  console.log(`  ✓ Session 1 saved project memory record: ${postJson.record.id}`);

  // 2. Recall in brand-new Session 2
  const getReq = new NextRequest(
    `http://localhost:3000/api/v1/heyuka/memory?tenantId=${tenantA}&projectId=${projectId}&q=Decimal+invoice+sequence+RLS`
  );
  const getRes = await GET(getReq);
  assert(getRes.status === 200, `GET /memory must return 200 (got ${getRes.status})`);
  const getJson = (await getRes.json()) as { ok: boolean; matches: Array<{ id: string; content: string }> };
  assert(
    getJson.matches.some((m) => m.id === postJson.record.id),
    "Session 2 must recall the exact project memory stored in Session 1"
  );
  console.log("  ✓ Session 2 recalled Session 1 project memory cleanly.");

  // 3. Verify cross-tenant isolation
  const leakReq = new NextRequest(
    `http://localhost:3000/api/v1/heyuka/memory?tenantId=${tenantB}&q=Decimal+invoice+sequence+RLS`
  );
  const leakRes = await GET(leakReq);
  const leakJson = (await leakRes.json()) as { matches: Array<{ id: string }> };
  assert(
    !leakJson.matches.some((m) => m.id === postJson.record.id),
    "Tenant B must NEVER see Tenant A project memories"
  );
  console.log("  ✓ Cross-tenant memory isolation verified (0 leaks).");

  // 4. Cleanup via DELETE
  const delReq = new NextRequest(
    `http://localhost:3000/api/v1/heyuka/memory?tenantId=${tenantA}&id=${postJson.record.id}`,
    { method: "DELETE" }
  );
  const delRes = await DELETE(delReq);
  assert(delRes.status === 200, "DELETE /memory must return 200");
  console.log("  ✓ Memory record deleted cleanly.\n");
  console.log(">>> ALL CROSS-SESSION MEMORY TESTS PASSED (100%) <<<");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
