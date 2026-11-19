/**
 * X × Zebra — Shared Server Multilingual Audio Transcription Helper
 * Extracted cleanly for shared reuse across `/api/ai/transcribe` and `/api/v1/audio/transcribe`.
 */

export async function transcribeAudioBuffer(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<{
  text: string;
  engine: string;
  fallback?: boolean;
  message?: string;
}> {
  const { buffer, mimeType } = params;

  // 1. Primary Engine: Whisper-large-v3-turbo (Multilingual + Darija + French + English)
  const groqKeyPool = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  for (const key of groqKeyPool) {
    try {
      const groqBody = new FormData();
      const audioBlob = new Blob([new Uint8Array(buffer)], {
        type: mimeType || "audio/webm",
      });
      groqBody.append("file", audioBlob, "audio.webm");
      groqBody.append("model", "whisper-large-v3-turbo");
      groqBody.append("response_format", "json");
      groqBody.append(
        "prompt",
        "KASPI POS, Darija مغربية, Français, English, مبيعات اليوم, المخزون, شحال, السلع, الفاتورة, credit, stock, ventes, chiffre d'affaires, DH, MAD"
      );

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: groqBody,
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.text && String(data.text).trim()) {
          return {
            text: String(data.text).trim(),
            engine: "HEYUKA Whisper-Turbo",
          };
        }
      }
    } catch (err) {
      console.warn("[HEYUKA Transcribe] Primary candidate notice:", err);
    }
  }

  // 2. Secondary Engine: Multimodal Audio Reasoning
  const googleKeyPool = (process.env.GOOGLE_API_KEYS || process.env.GOOGLE_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  for (const key of googleKeyPool) {
    try {
      const base64Audio = buffer.toString("base64");
      const safeMime = mimeType?.includes("webm") ? "audio/webm" : "audio/mp3";

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
                      mimeType: safeMime,
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
          return {
            text: candidateText,
            engine: "HEYUKA Multimodal Audio",
          };
        }
      }
    } catch (err) {
      console.warn("[HEYUKA Transcribe] Secondary candidate notice:", err);
    }
  }

  return {
    text: "",
    engine: "client-fallback",
    fallback: true,
    message: "Audio received. Configure server whisper keys or attach Sidecar Faster-Whisper worker.",
  };
}
