import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { generateTextWithRouter, getRouterCandidates } from "@/lib/ai-router";
import { getSafeServerContext } from "@/server/auth/context";
import { UNIVERSAL_INTEGRATIONS_CATALOG } from "@/lib/ai/integrations-registry";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

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

    const contentParts: any[] = [
      { type: "text", text: `Analyze these ${images.length} screenshot(s) and guide the user step by step: ${goal}` },
      ...images.map((img) => ({ type: "image", image: img })),
    ];

    let rawResponseText = "";
    let usedModel = "vision-router";

    // Prefer Groq Llama 4 Scout Vision for ~1.5s speed, then fallback to Gemini / router
    const allCandidates = await getRouterCandidates();
    const groqVision = allCandidates.find(
      (c) => c.provider === "groq" && c.supportsVision
    );

    if (groqVision) {
      try {
        const res = await generateText({
          model: groqVision.model as any,
          maxRetries: 0,
          maxOutputTokens: 1600,
          temperature: 0.2,
          abortSignal: AbortSignal.timeout(16000),
          system: systemPrompt,
          messages: [{ role: "user", content: contentParts }],
        });
        if (res.text?.trim()) {
          rawResponseText = res.text.trim();
          usedModel = groqVision.modelId;
        }
      } catch {}
    }

    if (!rawResponseText) {
      const routerRes = await generateTextWithRouter({
        system: systemPrompt,
        maxOutputTokens: 1600,
        temperature: 0.2,
        messages: [{ role: "user", content: contentParts }],
      });
      rawResponseText = routerRes.text.trim();
      usedModel = routerRes.activeModel;
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
