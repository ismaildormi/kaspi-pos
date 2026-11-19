import { NextRequest, NextResponse } from "next/server";
import { transcribeAudioBuffer } from "@/lib/zebra-x/audio-transcribe-server";

export const dynamic = "force-dynamic";

/**
 * 100% Free Multilingual Audio Transcription Endpoint
 * Supports Moroccan Darija, Standard Arabic, French, English, and code-switching.
 * Powered by Groq Whisper-large-v3-turbo ($0 free tier) with Google Gemini audio fallback.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: "Empty audio payload" }, { status: 400 });
    }

    const result = await transcribeAudioBuffer({
      buffer,
      mimeType: file.type || "audio/webm",
    });

    if (result.fallback) {
      return NextResponse.json({
        text: "",
        fallback: true,
        message: "Audio received. Please use direct text or speech synthesis.",
      });
    }

    return NextResponse.json({ text: result.text });
  } catch (error: any) {
    console.error("[KASPI Transcribe] Error:", error);
    return NextResponse.json(
      { error: "Transcription service encountered an error", details: error?.message },
      { status: 500 }
    );
  }
}
