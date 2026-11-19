import { NextRequest, NextResponse } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import { executeThreeDGenerateTask } from "@/lib/zebra-x/sidecar-bridge";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await authenticateXZebraRequest(req, "3d:generate");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : undefined;
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : undefined;
  const format =
    body?.format === "fbx" || body?.format === "blend" ? body.format : "glb";

  if (!prompt && !imageUrl) {
    return NextResponse.json(
      { error: "Provide 'prompt' or public 'imageUrl' for 3D generation." },
      { status: 400 }
    );
  }

  try {
    const result = await executeThreeDGenerateTask({
      prompt,
      imageUrl,
      format,
      targetPath: typeof body?.targetPath === "string" ? body.targetPath : undefined,
    });
    return NextResponse.json(
      { ...result, authMode: auth.authMode },
      { status: result.ok ? 200 : 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "3D generation blocked or failed" },
      { status: 403 }
    );
  }
}
