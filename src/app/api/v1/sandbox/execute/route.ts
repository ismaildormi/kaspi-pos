import { NextRequest, NextResponse } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  executePolyglotCodeSandbox,
  type SandboxLanguage,
} from "@/lib/zebra-x/tools/code-sandbox";

export const dynamic = "force-dynamic";

const SUPPORTED = new Set<SandboxLanguage>([
  "python",
  "javascript",
  "typescript",
  "bash",
  "php",
  "go",
  "c++",
]);

export async function POST(req: NextRequest) {
  const auth = await authenticateXZebraRequest(req, "sandbox:execute");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const language = String(body?.language || "python").toLowerCase() as SandboxLanguage;
  const code = String(body?.code || "");
  if (!code.trim() || code.length > 16000) {
    return NextResponse.json(
      { error: "Provide non-empty 'code' (max 16KB)." },
      { status: 400 }
    );
  }

  if (!SUPPORTED.has(language)) {
    return NextResponse.json(
      { error: "Unsupported language", supported: Array.from(SUPPORTED) },
      { status: 400 }
    );
  }

  const result = await executePolyglotCodeSandbox({
    language,
    code,
    stdin: typeof body?.stdin === "string" ? body.stdin : undefined,
  });

  return NextResponse.json(
    {
      ...result,
      auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
    },
    { status: result.error === "Sandbox execution unavailable" ? 502 : 200 }
  );
}
