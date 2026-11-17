import { NextRequest, NextResponse } from "next/server";

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

    // 1. Primary Engine: Groq Whisper-large-v3-turbo (Zero-Cost, Ultra-Fast, Multilingual Code-Switching)
    const groqKeyPool = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    for (const key of groqKeyPool) {
      try {
        const groqBody = new FormData();
        const audioBlob = new Blob([buffer], { type: file.type || "audio/webm" });
        groqBody.append("file", audioBlob, "audio.webm");
        groqBody.append("model", "whisper-large-v3-turbo");
        groqBody.append("response_format", "json");
        // Prime Whisper for Moroccan retail vocabulary, French terms, and Darija
        groqBody.append(
          "prompt",
          "KASPI POS, Darija مغربية, Français, English, مبيعات اليوم, المخزون, شحال, السلع, الفاتورة, credit, stock, ventes, chiffre d'affaires, DH, MAD"
        );

        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
          },
          body: groqBody,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.text && data.text.trim()) {
            return NextResponse.json({ text: data.text.trim() });
          }
        }
      } catch (err) {
        console.warn("[KASPI Transcribe] Groq candidate notice:", err);
      }
    }

    // 2. Secondary Engine: Google Gemini Audio Model (Free Tier)
    const googleKeyPool = (process.env.GOOGLE_API_KEYS || process.env.GOOGLE_API_KEY || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    for (const key of googleKeyPool) {
      try {
        const base64Audio = buffer.toString("base64");
        const mimeType = file.type?.includes("webm") ? "audio/webm" : "audio/mp3";

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType,
                        data: base64Audio,
                      },
                    },
                    {
                      text: "Transcribe the spoken audio verbatim in its original spoken language (Moroccan Darija, Arabic, French, English, or mixed code-switching). Return strictly the exact transcript without commentary.",
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (candidateText) {
            return NextResponse.json({ text: candidateText });
          }
        }
      } catch (err) {
        console.warn("[KASPI Transcribe] Gemini candidate notice:", err);
      }
    }

    // 3. Fallback: Return success with client fallback indicator
    return NextResponse.json({
      text: "",
      fallback: true,
      message: "Audio received. Please use direct text or speech synthesis.",
    });
  } catch (error: any) {
    console.error("[KASPI Transcribe] Error:", error);
    return NextResponse.json(
      { error: "Transcription service encountered an error", details: error?.message },
      { status: 500 }
    );
  }
}
