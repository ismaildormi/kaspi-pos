import { NextRequest, NextResponse } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import { executeAudioTranscribeTask } from "@/lib/zebra-x/sidecar-bridge";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await authenticateXZebraRequest(req, "audio:transcribe");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData().catch(() => null);
    const file = fd?.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json({ error: "No audio file uploaded under 'file'." }, { status: 400 });
    }
    const audioBuffer = Buffer.from(await file.arrayBuffer());
    const result = await executeAudioTranscribeTask({
      audioBuffer,
      mimeType: file.type || "audio/webm",
      language: typeof fd?.get("language") === "string" ? String(fd?.get("language")) : undefined,
    });
    return NextResponse.json({ ...result, authMode: auth.authMode });
  }

  const body = await req.json().catch(() => ({}));
  const mediaUrl = typeof body?.mediaUrl === "string" ? body.mediaUrl.trim() : undefined;
  const language = typeof body?.language === "string" ? body.language.trim() : undefined;

  const result = await executeAudioTranscribeTask({ mediaUrl, language });
  return NextResponse.json(
    { ...result, authMode: auth.authMode },
    { status: result.ok ? 200 : 400 }
  );
}
