import { NextRequest, NextResponse } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import { executeAudioSeparateTask } from "@/lib/zebra-x/sidecar-bridge";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await authenticateXZebraRequest(req, "audio:separate");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const mediaUrl = typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : undefined;
  const stems = body?.stems === "4stems" ? "4stems" : "2stems";

  if (!mediaUrl) {
    return NextResponse.json(
      { error: "Provide public 'mediaUrl' of the audio/video track to separate stems." },
      { status: 400 }
    );
  }

  const result = await executeAudioSeparateTask({ mediaUrl, stems });
  return NextResponse.json(
    { ...result, authMode: auth.authMode },
    { status: result.ok ? 200 : 400 }
  );
}
