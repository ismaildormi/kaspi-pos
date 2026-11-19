import { NextRequest, NextResponse } from "next/server";
import { generateTextWithRouter, getRouterCandidates, parseKeyPool } from "@/lib/ai-router";
import { getSafeServerContext } from "@/server/auth/context";
import { UNIVERSAL_INTEGRATIONS_CATALOG } from "@/lib/ai/integrations-registry";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

function parseImageDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function discoverAndCallGoogleVision(params: {
  apiKeys: string[];
  systemPrompt: string;
  userPrompt: string;
  images: string[];
  errors: string[];
}): Promise<{ text: string; modelUsed: string } | null> {
  const parsedImages = params.images.map(parseImageDataUrl).filter(Boolean) as Array<{
    mimeType: string;
    data: string;
  }>;
  if (parsedImages.length === 0 || params.apiKeys.length === 0) return null;

  for (const apiKey of params.apiKeys) {
    let modelNames = [
      "models/gemini-3.8-flash",
      "models/gemini-flash-latest",
      "models/gemini-3.7-flash",
    ];
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (listRes.ok) {
        const listJson = await listRes.json();
        const available: string[] = (listJson.models || [])
          .filter(
            (m: any) =>
              Array.isArray(m.supportedGenerationMethods) &&
              m.supportedGenerationMethods.includes("generateContent") &&
              /gemini-(3|2\.5|flash-latest)/i.test(String(m.name || "")) &&
              !/(tts|image-generation|image|live|embedding|aqa|robotics|1\.5|gemini-2\.0)/i.test(
                String(m.name || "")
              )
          )
          .map((m: any) => String(m.name));
        if (available.length > 0) {
          const preferred = available.sort((a, b) => {
            const score = (n: string) =>
              n.includes("3.8-flash")
                ? 0
                : n.includes("gemini-3") && n.includes("flash")
                ? 1
                : n.includes("flash-latest")
                ? 2
                : 3;
            return score(a) - score(b);
          });
          modelNames = preferred.slice(0, 3);
        }
      }
    } catch {
      // Keep default Gemini 3.x list when discovery times out
    }

    for (const modelName of modelNames) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(14000),
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: params.systemPrompt }] },
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: params.userPrompt },
                    ...parsedImages.map((img) => ({
                      inlineData: { mimeType: img.mimeType, data: img.data },
                    })),
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1600,
                responseMimeType: "application/json",
              },
            }),
          }
        );
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p?.text || "")
          .join("")
          .trim();
        if (res.ok && text) {
          return { text, modelUsed: modelName.replace(/^models\//, "") };
        }
        params.errors.push(`Google (${modelName}): ${data?.error?.message || `HTTP ${res.status}`}`);
      } catch (err: any) {
        params.errors.push(`Google (${modelName}): ${String(err?.message || err)}`);
      }
    }
  }
  return null;
}

async function discoverAndCallGroqVision(params: {
  apiKeys: string[];
  systemPrompt: string;
  userPrompt: string;
  images: string[];
  errors: string[];
}): Promise<{ text: string; modelUsed: string } | null> {
  if (params.apiKeys.length === 0) return null;
  const openAiContent = [
    { type: "text", text: params.userPrompt },
    ...params.images.map((url) => ({ type: "image_url", image_url: { url } })),
  ];

  for (const apiKey of params.apiKeys) {
    let visionModels: string[] = [];
    try {
      const mRes = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(4500),
      });
      if (mRes.ok) {
        const mJson = await mRes.json();
        visionModels = (mJson.data || [])
          .map((m: any) => String(m?.id || ""))
          .filter((id: string) => /(vision|llama-4|maverick|scout)/i.test(id));
      }
    } catch {
      visionModels = [];
    }

    for (const modelId of visionModels.slice(0, 2)) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: AbortSignal.timeout(13000),
          body: JSON.stringify({
            model: modelId,
            max_tokens: 1600,
            temperature: 0.2,
            messages: [
              { role: "system", content: params.systemPrompt },
              { role: "user", content: openAiContent },
            ],
          }),
        });
        const data = await res.json();
        const text = String(data?.choices?.[0]?.message?.content || "").trim();
        if (res.ok && text) return { text, modelUsed: modelId };
        params.errors.push(`Groq (${modelId}): ${data?.error?.message || `HTTP ${res.status}`}`);
      } catch (err: any) {
        params.errors.push(`Groq (${modelId}): ${String(err?.message || err)}`);
      }
    }
  }
  return null;
}

async function callOpenRouterVisionPool(params: {
  apiKeys: string[];
  systemPrompt: string;
  userPrompt: string;
  images: string[];
  errors: string[];
}): Promise<{ text: string; modelUsed: string } | null> {
  if (params.apiKeys.length === 0) return null;
  const openAiContent = [
    { type: "text", text: params.userPrompt },
    ...params.images.map((url) => ({ type: "image_url", image_url: { url } })),
  ];
  const freeModels = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3.5-super-vl:free",
  ];

  for (const apiKey of params.apiKeys) {
    for (const modelId of freeModels) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://kaspi-pos.vercel.app",
            "X-Title": "KASPI Visual Setup Assistant",
          },
          signal: AbortSignal.timeout(14000),
          body: JSON.stringify({
            model: modelId,
            max_tokens: 1500,
            temperature: 0.2,
            messages: [
              { role: "system", content: params.systemPrompt },
              { role: "user", content: openAiContent },
            ],
          }),
        });
        const data = await res.json();
        const text = String(data?.choices?.[0]?.message?.content || "").trim();
        if (res.ok && text) return { text, modelUsed: modelId };
        params.errors.push(`OpenRouter (${modelId}): ${data?.error?.message || `HTTP ${res.status}`}`);
      } catch (err: any) {
        params.errors.push(`OpenRouter (${modelId}): ${String(err?.message || err)}`);
      }
    }
  }
  return null;
}

export interface ScreenshotMarker {
  number: number;
  xPct: number;
  yPct: number;
  label: string;
  color?: string;
}

export interface VisualSetupAnalysisResult {
  detectedApp: string;
  detectedPage: string;
  currentStepSummary: string;
  nextAction: string;
  clickByClickSteps: string[];
  requiredFieldsHelp: Array<{ field: string; whatToEnter: string }>;
  missingCredentialsOrErrors: string[];
  markers: ScreenshotMarker[];
  recommendedServiceId?: string;
}

/**
 * ============================================================================
 * KASPI AI — VISUAL SETUP ASSISTANT (EXTREME SCREENSHOT INTELLIGENCE)
 * Inspects uploaded or live-captured screenshots from external developer
 * portals (LinkedIn, Meta/Instagram, Stripe, GitHub, Vercel, Google Cloud, etc.),
 * identifies buttons/forms/errors, responds in the user's preferred language,
 * and generates exact % coordinates for annotated arrow & circle markers.
 * ============================================================================
 */
export async function POST(req: NextRequest) {
  try {
    await getSafeServerContext();
    const body = await req.json();

    const images: string[] = Array.isArray(body.images)
      ? body.images
          .filter((img: unknown) => typeof img === "string" && img.startsWith("data:image/"))
          .slice(0, 4)
      : [];

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one screenshot (data:image/...) is required." },
        { status: 400 }
      );
    }

    const goal = String(body.goal || "Help me connect this application and find the API key / OAuth settings.").trim();
    const serviceId = body.serviceId ? String(body.serviceId) : undefined;
    const preferredLanguage = String(body.preferredLanguage || "Arabic / Darija / User language");
    const serviceSpec = serviceId
      ? UNIVERSAL_INTEGRATIONS_CATALOG.find((s) => s.id === serviceId)
      : undefined;

    const systemPrompt = `You are KASPI Visual AI Setup Assistant — an extreme screenshot-reading & API onboarding specialist.
Examine the uploaded screenshot(s) visually with surgical accuracy.
Target App Context: ${serviceSpec ? `${serviceSpec.name} (${serviceSpec.devDocsUrl})` : "Auto-detect application from screenshot"}
User Goal: ${goal}
Target Response Language: ${preferredLanguage} (If user wrote Arabic or Moroccan Darija, explain clearly in Moroccan Darija / clear Arabic; otherwise respond in the exact language of User Goal!).

Analyze every visible menu, button, input field, warning banner, URL bar, or error message in the screenshot.
Estimate approximate (xPct, yPct) percentage coordinates (0 to 100 from top-left) for up to 5 exact UI elements the user must click or fill in so KASPI UI draws numbered marker badges & directional arrows right on the screenshot!

Output STRICTLY valid JSON matching this schema:
{
  "detectedApp": "Exact application / developer console seen in screenshot",
  "detectedPage": "Exact page or tab currently visible",
  "currentStepSummary": "Clear explanation of what is currently on screen",
  "nextAction": "The single most important next click or input action right now",
  "clickByClickSteps": ["1. ...", "2. ...", "3. ..."],
  "requiredFieldsHelp": [{"field": "Field Name", "whatToEnter": "Exact value or where to copy it from"}],
  "missingCredentialsOrErrors": ["Any visible error, disabled permission, or missing value"],
  "markers": [{"number": 1, "xPct": 24, "yPct": 38, "label": "Click Create App", "color": "#10b981"}],
  "recommendedServiceId": "${serviceId || ""}"
}`;

    const userPrompt = `Analyze these ${images.length} screenshot(s) and guide the user step by step: ${goal}`;
    const contentParts: any[] = [
      { type: "text", text: userPrompt },
      ...images.map((img) => ({ type: "image", image: img })),
    ];

    let rawResponseText = "";
    let usedModel = "vision-router";
    const errors: string[] = [];

    const allCandidates = await getRouterCandidates();
    const googleKeys = Array.from(
      new Set([
        ...parseKeyPool(process.env.GOOGLE_API_KEYS || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
        ...allCandidates.filter((c) => c.provider === "google" && c.apiKey).map((c) => c.apiKey),
      ])
    ).filter((k) => !k.includes("mock"));
    const groqKeys = Array.from(
      new Set([
        ...parseKeyPool(process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY),
        ...allCandidates.filter((c) => c.provider === "groq" && c.apiKey).map((c) => c.apiKey),
      ])
    ).filter((k) => !k.includes("mock"));
    const openRouterKeys = Array.from(
      new Set([
        ...parseKeyPool(process.env.OPENROUTER_API_KEY),
        ...allCandidates.filter((c) => c.provider === "openrouter" && c.apiKey).map((c) => c.apiKey),
      ])
    ).filter((k) => !k.includes("mock"));

    // 1. Live-discovered Google Gemini Vision (gemini-2.5-flash / dynamic v1beta)
    const googleHit = await discoverAndCallGoogleVision({
      apiKeys: googleKeys,
      systemPrompt,
      userPrompt,
      images,
      errors,
    });
    if (googleHit) {
      rawResponseText = googleHit.text;
      usedModel = googleHit.modelUsed;
    }

    // 2. Live-discovered Groq Vision (/openai/v1/models filter)
    if (!rawResponseText) {
      const groqHit = await discoverAndCallGroqVision({
        apiKeys: groqKeys,
        systemPrompt,
        userPrompt,
        images,
        errors,
      });
      if (groqHit) {
        rawResponseText = groqHit.text;
        usedModel = groqHit.modelUsed;
      }
    }

    // 3. OpenRouter Free Vision Pool (gemma-4-31b-it:free / nemotron-3.5-super-vl:free)
    if (!rawResponseText) {
      const orHit = await callOpenRouterVisionPool({
        apiKeys: openRouterKeys,
        systemPrompt,
        userPrompt,
        images,
        errors,
      });
      if (orHit) {
        rawResponseText = orHit.text;
        usedModel = orHit.modelUsed;
      }
    }

    // 4. Final Router Failover (BYOK / Mistral Pixtral / Local Ollama Vision)
    if (!rawResponseText) {
      try {
        const routerRes = await generateTextWithRouter({
          system: systemPrompt,
          maxOutputTokens: 1600,
          temperature: 0.2,
          messages: [{ role: "user", content: contentParts }],
        });
        rawResponseText = routerRes.text.trim();
        usedModel = routerRes.activeModel;
      } catch (routerErr: any) {
        errors.push(String(routerErr?.message || routerErr));
        throw new Error(errors.join(" | "));
      }
    }

    let parsed: VisualSetupAnalysisResult;
    try {
      const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
      const obj = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponseText);
      parsed = {
        detectedApp: String(obj.detectedApp || serviceSpec?.name || "Detected Application"),
        detectedPage: String(obj.detectedPage || "Configuration Screen"),
        currentStepSummary: String(obj.currentStepSummary || rawResponseText),
        nextAction: String(obj.nextAction || "Follow the highlighted numbered steps on screen."),
        clickByClickSteps: Array.isArray(obj.clickByClickSteps)
          ? obj.clickByClickSteps.map(String)
          : [],
        requiredFieldsHelp: Array.isArray(obj.requiredFieldsHelp)
          ? obj.requiredFieldsHelp.slice(0, 6).map((x: any) => ({
              field: String(x?.field || "Field"),
              whatToEnter: String(x?.whatToEnter || ""),
            }))
          : [],
        missingCredentialsOrErrors: Array.isArray(obj.missingCredentialsOrErrors)
          ? obj.missingCredentialsOrErrors.map(String)
          : [],
        markers: Array.isArray(obj.markers)
          ? obj.markers.slice(0, 6).map((m: any, idx: number) => ({
              number: Number(m?.number || idx + 1),
              xPct: Math.min(94, Math.max(6, Number(m?.xPct ?? 25 + idx * 15))),
              yPct: Math.min(92, Math.max(8, Number(m?.yPct ?? 30 + idx * 12))),
              label: String(m?.label || `Step ${idx + 1}`).slice(0, 60),
              color: m?.color ? String(m.color) : "#10b981",
            }))
          : [],
        recommendedServiceId: obj.recommendedServiceId || serviceId || undefined,
      };
    } catch {
      parsed = {
        detectedApp: serviceSpec?.name || "Uploaded Screenshot",
        detectedPage: "Developer / Settings Screen",
        currentStepSummary: rawResponseText,
        nextAction: "Review the detailed instructions above and click the highlighted configuration button.",
        clickByClickSteps: rawResponseText.split("\n").filter((l) => l.trim()).slice(0, 6),
        requiredFieldsHelp: [],
        missingCredentialsOrErrors: [],
        markers: [{ number: 1, xPct: 50, yPct: 45, label: "Check highlighted section", color: "#10b981" }],
        recommendedServiceId: serviceId,
      };
    }

    return NextResponse.json({
      success: true,
      modelUsed: usedModel,
      analysis: parsed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Visual Setup analysis failed: ${String(err?.message || err)}` },
      { status: 500 }
    );
  }
}
