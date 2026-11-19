import { NextRequest, NextResponse } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import { runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await authenticateXZebraRequest(req, "web:research");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const query = typeof body?.query === "string" ? body.query.trim() : undefined;
  const url = typeof body?.url === "string" ? body.url.trim() : undefined;
  const lang = typeof body?.lang === "string" ? body.lang.slice(0, 2) : "en";

  if (!query && !url) {
    return NextResponse.json(
      { error: "Provide 'query' (open web search) or 'url' (SSRF-safe page extraction)." },
      { status: 400 }
    );
  }

  const res = await runUnrestrictedWebResearch({ query, url, lang });
  return NextResponse.json(
    {
      ...res,
      auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
    },
    { status: res.ok ? 200 : 400 }
  );
}
