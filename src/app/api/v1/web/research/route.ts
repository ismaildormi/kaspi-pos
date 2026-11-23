import { NextRequest, NextResponse } from "next/server";
import { runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = typeof body?.url === "string" ? body.url.trim() : undefined;
    const query = typeof body?.query === "string" ? body.query.trim() : undefined;
    const lang = typeof body?.lang === "string" ? body.lang.trim() : "en";
    const result = await runUnrestrictedWebResearch({ url, query, lang });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Web research failed" },
      { status: 500 }
    );
  }
}
