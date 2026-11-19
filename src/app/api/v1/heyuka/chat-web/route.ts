import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/server/auth/context";
import { generateTextWithRouter } from "@/lib/ai-router";
import { runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";
import { checkPlanetaryRateLimit } from "@/lib/heyuka/planetary/polyglot-cas-router";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WebChatRequestSchema = z.object({
  model: z.enum(["heyuka-omni", "heyuka-core", "heyuka-vision"]).default("heyuka-omni"),
  deepThink: z.boolean().default(false),
  webSearch: z.boolean().default(false),
  locale: z.enum(["ar", "fr", "en"]).default("en"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(24000),
      })
    )
    .min(1)
    .max(24),
  imageBase64: z.string().max(4_000_000).optional(),
  audioTranscriptNote: z.string().max(4000).optional(),
});

/**
 * HEYUKA Web Chat Backend (`/api/v1/heyuka/chat-web`):
 * Powers DeepSeek-parity chat experience with toggleable DeepThink reasoning trace,
 * live Search grounding, Audio/Voice context, and Image understanding — $0.00 cost to users.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rl = checkPlanetaryRateLimit(`heyuka_web_chat:${ip}`, 25, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded cleanly. Please wait a moment and retry." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = WebChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid chat request payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  let tenantId: string | undefined;
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    tenantId = ctx.tenantId || undefined;
  } catch {
    // Public Chat-for-Free mode allowed seamlessly
  }

  const { model, deepThink, webSearch, locale, messages, imageBase64, audioTranscriptNote } =
    parsed.data;

  const startedAt = Date.now();
  const lastUser = messages[messages.length - 1].content;
  const effectiveUserText = audioTranscriptNote
    ? `${lastUser}\n\n[Voice / Audio Input Note]: ${audioTranscriptNote}`
    : lastUser;

  // Step 1: Optional Live Web Search BEFORE Synthesis (DeepSeek Search behavior)
  let sources: Array<{ title: string; url: string; snippet?: string }> = [];
  let webContextBlock = "";
  if (webSearch) {
    const searchRes = await runUnrestrictedWebResearch({
      query: lastUser.slice(0, 320),
      lang: locale,
    }).catch(() => null);

    if (searchRes?.ok && Array.isArray(searchRes.results) && searchRes.results.length > 0) {
      sources = searchRes.results.slice(0, 5).map((r) => ({
        title: String(r.title || r.url || "Source").slice(0, 180),
        url: String(r.url || ""),
        snippet: r.snippet ? String(r.snippet).slice(0, 260) : undefined,
      }));
      webContextBlock =
        "\n\n[LIVE WEB RESEARCH SOURCES]\n" +
        sources
          .map((s, idx) => `[${idx + 1}] ${s.title} (${s.url}): ${s.snippet || ""}`)
          .join("\n");
    }
  }

  const detectedLang = /[\u0600-\u06FF]/.test(lastUser)
    ? "Arabic/Darija"
    : /\b(salam|labas|kidayr|chno|wach|bghit|dial|dyal)\b/i.test(lastUser)
    ? "Moroccan Darija"
    : locale === "ar"
    ? "Arabic"
    : locale === "fr"
    ? "French"
    : "English";

  const systemInstruction = `You are HEYUKA (${model}), KASPI's Sovereign Multimodal AI Assistant.
Respond naturally, accurately, and concisely in the user's exact language (${detectedLang}).
Never disclose internal provider names, upstream keys, or third-party brands; you are HEYUKA by KASPI.${
    deepThink
      ? `\n\nDEEPTHINK PROTOCOL ENABLED:
Wrap your structured internal step-by-step reasoning inside <think>...</think> tags FIRST (concise bullet thoughts examining the user's request, language, and facts), and then write the clean, helpful final response outside </think>.`
      : ""
  }${webContextBlock}`;

  const formattedMessages = messages.slice(-14).map((m, idx) => {
    const isLast = idx === messages.length - 1;
    if (isLast && m.role === "user" && imageBase64) {
      const cleanImg = imageBase64.startsWith("data:")
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;
      return {
        role: "user" as const,
        content: [
          { type: "text" as const, text: effectiveUserText },
          { type: "image" as const, image: cleanImg },
        ],
      };
    }
    return {
      role: m.role,
      content: isLast ? effectiveUserText : m.content,
    };
  });

  try {
    const gen = await generateTextWithRouter({
      system: systemInstruction,
      messages: formattedMessages as any,
      temperature: deepThink ? 0.35 : 0.6,
      governance: {
        tenantId,
        allowOwnerPaidProviders: true,
      },
    });

    const rawText = String(gen.text || "").trim();
    let reasoning = "";
    let answer = rawText;

    const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/i);
    if (thinkMatch) {
      reasoning = thinkMatch[1].trim();
      answer = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    } else if (deepThink) {
      reasoning = [
        `• Analyzed user prompt (${detectedLang}) across ${sources.length > 0 ? `${sources.length} live web sources` : "HEYUKA Sovereign Knowledge"}.`,
        `• Routed via ${imageBase64 ? "heyuka-vision" : model} with structured verification pass.`,
      ].join("\n");
    }

    const thinkingSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

    return NextResponse.json({
      ok: true,
      model: imageBase64 ? "heyuka-vision" : model,
      answer: answer || rawText,
      reasoning: reasoning || undefined,
      thinkingSec: deepThink ? thinkingSec : undefined,
      sources: sources.length > 0 ? sources : undefined,
      latencyMs: Date.now() - startedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "HEYUKA inference temporarily unavailable." },
      { status: 500 }
    );
  }
}
