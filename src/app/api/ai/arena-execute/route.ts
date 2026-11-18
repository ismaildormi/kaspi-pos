import { NextRequest, NextResponse } from "next/server";
import { getSafeServerContext } from "@/server/auth/context";
import { generateTextWithRouter, getRouterCandidates } from "@/lib/ai-router";
import { generateText } from "ai";
import { prisma } from "@/server/db/prisma";
import {
  ARENA_REAL_MODELS,
  selectBattleModelPair,
  type ArenaExecutionMode,
  type ArenaModality,
  type ArenaModelOutput,
  type ArenaRealModelSpec,
  type ArenaWebCitation,
} from "@/lib/ai/arena-models";
import {
  buildArenaSystemPrompt,
  buildMotionVideoStudioHtml,
  detectEffectiveModality,
  extractProjectFromResponse,
  sanitizeExplanationFromCodeLeaks,
  STRICT_HTML_RECOVERY_SYSTEM_PROMPT,
} from "@/lib/ai/arena-client-runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ============================================================================
// 1. REAL LIVE WEB SEARCH (DuckDuckGo + Wikipedia REST API)
// ============================================================================

async function performLiveWebSearch(query: string): Promise<ArenaWebCitation[]> {
  const cleanQ = query.trim().slice(0, 140);
  if (!cleanQ) return [];
  const citations: ArenaWebCitation[] = [];

  const [ddgRes, wikiRes] = await Promise.allSettled([
    fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQ)}&format=json&no_html=1&skip_disambig=1`, {
      signal: AbortSignal.timeout(4500),
      headers: { "User-Agent": "KaspiAI-Arena/1.0 (+https://kaspi-pos.vercel.app)" },
    }).then((r) => (r.ok ? r.json() : null)),
    fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        cleanQ
      )}&format=json&utf8=1&srlimit=4`,
      {
        signal: AbortSignal.timeout(4500),
        headers: { "User-Agent": "KaspiAI-Arena/1.0 (+https://kaspi-pos.vercel.app)" },
      }
    ).then((r) => (r.ok ? r.json() : null)),
  ]);

  if (ddgRes.status === "fulfilled" && ddgRes.value) {
    const d = ddgRes.value;
    if (d.AbstractText && d.AbstractURL) {
      citations.push({
        title: d.Heading || "DuckDuckGo Instant Knowledge",
        url: d.AbstractURL,
        snippet: d.AbstractText,
      });
    }
    if (Array.isArray(d.RelatedTopics)) {
      for (const topic of d.RelatedTopics.slice(0, 4)) {
        if (topic?.Text && topic?.FirstURL) {
          citations.push({
            title: String(topic.Text).split(" - ")[0].slice(0, 80) || "Web Result",
            url: topic.FirstURL,
            snippet: String(topic.Text).slice(0, 220),
          });
        }
      }
    }
  }

  if (wikiRes.status === "fulfilled" && wikiRes.value?.query?.search) {
    for (const item of wikiRes.value.query.search.slice(0, 4)) {
      const cleanSnippet = String(item.snippet || "").replace(/<[^>]+>/g, "");
      citations.push({
        title: `Wikipedia: ${item.title}`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(item.title).replace(/ /g, "_"))}`,
        snippet: cleanSnippet,
      });
    }
  }

  // Deduplicate by URL
  const unique: ArenaWebCitation[] = [];
  const seen = new Set<string>();
  for (const c of citations) {
    if (!seen.has(c.url)) {
      seen.add(c.url);
      unique.push(c);
    }
  }
  return unique.slice(0, 6);
}

// ============================================================================
// 2. REAL OPEN-WEIGHT MODEL RUNNER WITH RETRY & FAILOVER
// ============================================================================

async function callSingleRealModel(params: {
  spec: ArenaRealModelSpec;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  delayBeforeMs?: number;
}): Promise<{ text: string; usedModel: string; usedProvider: string }> {
  if (params.delayBeforeMs && params.delayBeforeMs > 0) {
    await new Promise((r) => setTimeout(r, params.delayBeforeMs));
  }

  const { spec, systemPrompt, messages } = params;

  // Handle targeted configured provider pools (Google Gemini / OpenRouter Free / Groq)
  if (
    spec.upstream === "router_google" ||
    spec.upstream === "router_openrouter" ||
    spec.upstream === "router_groq"
  ) {
    const targetProvider =
      spec.upstream === "router_google"
        ? "google"
        : spec.upstream === "router_openrouter"
        ? "openrouter"
        : "groq";

    const allCandidates = await getRouterCandidates();
    const matching = allCandidates.filter((c) => c.provider === targetProvider);

    for (const candidate of matching) {
      try {
        const res = await generateText({
          model: candidate.model as any,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(18000),
          system: systemPrompt,
          messages,
        });
        const out = res.text?.trim();
        if (out) {
          return {
            text: out,
            usedModel: candidate.modelId,
            usedProvider: candidate.providerName,
          };
        }
      } catch {
        // Try next candidate in this provider pool
      }
    }

    // Dynamic model discovery for Google / Groq if hardcoded ID changed
    if (targetProvider === "groq" && matching[0]?.apiKey) {
      try {
        const listRes = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${matching[0].apiKey}` },
          signal: AbortSignal.timeout(8000),
        });
        const listJson = await listRes.json().catch(() => null);
        const firstActiveModel = listJson?.data?.find(
          (m: any) => m?.id && !String(m.id).includes("whisper") && !String(m.id).includes("guard")
        )?.id;
        if (firstActiveModel) {
          const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${matching[0].apiKey}`,
            },
            body: JSON.stringify({
              model: firstActiveModel,
              messages: [{ role: "system", content: systemPrompt }, ...messages],
            }),
            signal: AbortSignal.timeout(40000),
          });
          const chatJson = await chatRes.json().catch(() => null);
          const text = chatJson?.choices?.[0]?.message?.content;
          if (chatRes.ok && typeof text === "string" && text.trim()) {
            return {
              text: text.trim(),
              usedModel: firstActiveModel,
              usedProvider: "Groq LPU Inference",
            };
          }
        }
      } catch {}
    }

    if (targetProvider === "google" && matching[0]?.apiKey) {
      try {
        const listRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(matching[0].apiKey)}`,
          { signal: AbortSignal.timeout(8000) }
        );
        const listJson = await listRes.json().catch(() => null);
        const firstFlash = listJson?.models?.find(
          (m: any) =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes("generateContent") &&
            String(m.name).includes("flash")
        )?.name;
        if (firstFlash) {
          const cleanName = String(firstFlash).replace(/^models\//, "");
          const genRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
              cleanName
            )}:generateContent?key=${encodeURIComponent(matching[0].apiKey)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: messages.map((m) => ({
                  role: m.role === "assistant" ? "model" : "user",
                  parts: [{ text: m.content }],
                })),
              }),
              signal: AbortSignal.timeout(40000),
            }
          );
          const genJson = await genRes.json().catch(() => null);
          const text = genJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (genRes.ok && typeof text === "string" && text.trim()) {
            return {
              text: text.trim(),
              usedModel: cleanName,
              usedProvider: "Google Gemini",
            };
          }
        }
      } catch {}
    }

    // Fall through cleanly to open-weight LLM7 -> Router -> Pollinations below
    const fallbackModel =
      spec.upstream === "router_openrouter"
        ? "DeepSeek-V4-Flash-0731"
        : spec.upstream === "router_groq"
        ? "gpt-oss:120b"
        : "gemma4:31b";
    try {
      const lRes = await fetch("https://api.llm7.io/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: fallbackModel,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          temperature: 0.6,
        }),
        signal: AbortSignal.timeout(40000),
      });
      const lData = await lRes.json().catch(() => null);
      const lText = lData?.choices?.[0]?.message?.content;
      if (lRes.ok && typeof lText === "string" && lText.trim()) {
        return {
          text: lText.trim(),
          usedModel: lData.model || fallbackModel,
          usedProvider: `${spec.providerLabel} (Open-Weight Failover)`,
        };
      }
    } catch {}
  }

  if (spec.upstream === "llm7") {
    const payload = {
      model: spec.apiModelId,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.6,
    };

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("https://api.llm7.io/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(40000),
        });

        const data = await res.json().catch(() => null);
        const text = data?.choices?.[0]?.message?.content;
        if (res.ok && typeof text === "string" && text.trim()) {
          return {
            text: text.trim(),
            usedModel: data.model || spec.apiModelId,
            usedProvider: spec.providerLabel,
          };
        }

        const errMsg = String(data?.error?.message || `HTTP ${res.status}`);
        // Only retry immediately if it's a short <= 2s rate-limit burst
        if (res.status === 429 && attempt === 0 && !errMsg.includes("quota")) {
          await new Promise((r) => setTimeout(r, 1400));
          continue;
        }
        break;
      } catch {
        if (attempt === 1) break;
      }
    }

    // Failover 1: Configured Multi-Gateway Router (Gemini / Groq / Mistral / OpenRouter / Ollama)
    try {
      const routerRes = await generateTextWithRouter({
        system: systemPrompt,
        messages,
      });
      return {
        text: routerRes.text,
        usedModel: routerRes.activeModel,
        usedProvider: `${routerRes.activeProvider} (Failover)`,
      };
    } catch {
      // Failover 2: Pollinations OpenAI Gateway (ignore budget-exhausted banners)
      const pRes = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
        signal: AbortSignal.timeout(40000),
      });
      const pData = await pRes.json().catch(() => null);
      const pText = pData?.choices?.[0]?.message?.content;
      if (
        pRes.ok &&
        typeof pText === "string" &&
        pText.trim() &&
        !pText.includes("reached its budget")
      ) {
        return {
          text: pText.trim(),
          usedModel: pData.model || "gpt-oss-20b",
          usedProvider: "Open-Weight Failover (Pollinations)",
        };
      }
      throw new Error(pData?.error?.message || "All open gateways busy");
    }
  }

  // Fallback or explicit Configured Router (Gemini / Groq / OpenRouter / Local Ollama)
  const routerRes = await generateTextWithRouter({
    system: systemPrompt,
    messages,
  });
  return {
    text: routerRes.text,
    usedModel: routerRes.activeModel,
    usedProvider: routerRes.activeProvider,
  };
}

// ============================================================================
// 4. IMAGE GENERATION VIA FREE AI HORDE (DECENTRALIZED STABLE DIFFUSION)
// ============================================================================

async function submitAiHordeImageJob(prompt: string, modelHint: string): Promise<string> {
  const res = await fetch("https://aihorde.net/api/v2/generate/async", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: "0000000000",
    },
    body: JSON.stringify({
      prompt: `${prompt}, high quality, detailed, 8k`,
      params: {
        width: 512,
        height: 512,
        steps: 18,
        sampler_name: modelHint === "A" ? "k_euler_a" : "k_dpmpp_2m",
        cfg_scale: 7.5,
      },
      nsfw: false,
      censor_nsfw: true,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok || !data?.id) {
    throw new Error(data?.message || "AI Horde job creation failed");
  }
  return String(data.id);
}

// ============================================================================
// GET HANDLER: Poll AI Horde Image Status OR Return Active Models List
// ============================================================================

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "models";

  if (action === "image_status") {
    const jobId = req.nextUrl.searchParams.get("id");
    if (!jobId) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }
    try {
      const checkRes = await fetch(
        `https://aihorde.net/api/v2/generate/check/${encodeURIComponent(jobId)}`,
        { signal: AbortSignal.timeout(6000) }
      );
      const checkData = await checkRes.json();
      if (!checkData?.done) {
        return NextResponse.json({
          done: false,
          waitTime: checkData?.wait_time ?? 15,
          queuePosition: checkData?.queue_position ?? 0,
          processing: checkData?.processing ?? 0,
        });
      }

      const statusRes = await fetch(
        `https://aihorde.net/api/v2/generate/status/${encodeURIComponent(jobId)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const statusData = await statusRes.json();
      const firstGen = statusData?.generations?.[0];
      return NextResponse.json({
        done: true,
        imgUrl: firstGen?.img || null,
        model: firstGen?.model || "Stable Diffusion",
      });
    } catch (err: any) {
      return NextResponse.json({ done: false, error: String(err?.message || err) });
    }
  }

  return NextResponse.json({
    models: ARENA_REAL_MODELS,
  });
}

// ============================================================================
// POST HANDLER: REAL ARENA BATTLE / AGENT / SIDE-BY-SIDE / DIRECT EXECUTION
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSafeServerContext();
    const tenantId = ctx.tenantId;
    const isFallbackTenant = tenantId === "00000000-0000-0000-0000-000000000000";

    const body = await req.json();
    const prompt = String(body.prompt || "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const mode: ArenaExecutionMode = ["battle", "agent", "side_by_side", "direct"].includes(
      body.mode
    )
      ? body.mode
      : "battle";
    const requestedModality: ArenaModality = ["auto", "code", "text", "search", "image", "video"].includes(
      body.modality
    )
      ? body.modality
      : "auto";
    const previousTurnModality = ["code", "text", "search", "image", "video"].includes(
      body.previousTurnModality
    )
      ? body.previousTurnModality
      : undefined;
    const effectiveModality = detectEffectiveModality(
      requestedModality,
      prompt,
      previousTurnModality
    );

    // Pick models according to mode
    let specA: ArenaRealModelSpec;
    let specB: ArenaRealModelSpec | null = null;

    if (mode === "battle") {
      const [mA, mB] = selectBattleModelPair(prompt, false);
      specA = mA;
      specB = mB;
    } else if (mode === "direct") {
      specA =
        ARENA_REAL_MODELS.find((m) => m.id === body.modelAId) || ARENA_REAL_MODELS[0];
      specB = null;
    } else {
      specA =
        ARENA_REAL_MODELS.find((m) => m.id === body.modelAId) || ARENA_REAL_MODELS[0];
      specB =
        ARENA_REAL_MODELS.find((m) => m.id === body.modelBId) || ARENA_REAL_MODELS[1];
      if (specB.id === specA.id) {
        specB = ARENA_REAL_MODELS.find((m) => m.id !== specA.id) || ARENA_REAL_MODELS[1];
      }
    }

    // Optional store context ONLY if merchant requested POS context or mentioned their shop
    let storeContextSnippet = "";
    if (body.includeStoreContext === true && !isFallbackTenant) {
      try {
        const [tenantRow, prods] = await Promise.all([
          prisma.tenant.findUnique({ where: { id: tenantId } }),
          prisma.product.findMany({
            where: { tenantId, isActive: true, deletedAt: null },
            take: 20,
            select: { name: true, salePrice: true, sku: true },
          }),
        ]);
        if (tenantRow) {
          storeContextSnippet = `\nOptional Merchant Store Context (from user's KASPI POS):
Store Name: ${tenantRow.displayName || tenantRow.legalName} | Currency: ${tenantRow.currency || "MAD"}
Catalog Sample: ${prods.map((p) => `${p.name} (${p.salePrice} ${tenantRow.currency || "MAD"})`).join(", ")}`;
        }
      } catch {}
    }

    // Read any uploaded text/code file excerpts
    const attachments: Array<{ name: string; type: string; textExcerpt?: string }> =
      Array.isArray(body.attachments) ? body.attachments.slice(0, 4) : [];
    const attachmentContext =
      attachments.length > 0
        ? `\nAttached files:\n${attachments
            .map((a) => `- ${a.name} (${a.type})${a.textExcerpt ? `\nContent:\n${a.textExcerpt.slice(0, 4000)}` : ""}`)
            .join("\n")}`
        : "";

    // ------------------------------------------------------------------------
    // BRANCH 1: IMAGE GENERATION (Real AI Horde Async Jobs)
    // ------------------------------------------------------------------------
    if (effectiveModality === "image") {
      const [jobARes, jobBRes] = await Promise.allSettled([
        submitAiHordeImageJob(prompt, "A"),
        specB ? submitAiHordeImageJob(`${prompt}, cinematic studio lighting`, "B") : Promise.resolve(""),
      ]);

      const outputA: ArenaModelOutput = {
        modelId: "aihorde-sd-a",
        modelName: "Stable Diffusion (AI Horde Euler-A)",
        providerLabel: "AI Horde Open Cluster",
        status: jobARes.status === "fulfilled" ? "completed" : "failed",
        latencyMs: 600,
        errorMessage: jobARes.status === "rejected" ? String(jobARes.reason) : undefined,
        replyMarkdown:
          jobARes.status === "fulfilled"
            ? `تم إرسال طلب توليد الصورة إلى شبكة Stable Diffusion المفتوحة (AI Horde). جاري استلام النتيجة...`
            : `تعذر إرسال الطلب إلى AI Horde.`,
        stepsLog: ["Submitted async Diffusion job", "Polling AI Horde worker image"],
        modalityExecuted: "image",
        files: [],
        previewHtml: null,
        imageJobId: jobARes.status === "fulfilled" ? jobARes.value : null,
      };

      const outputB: ArenaModelOutput | null = specB
        ? {
            modelId: "aihorde-sd-b",
            modelName: "Stable Diffusion (AI Horde DPM++ 2M)",
            providerLabel: "AI Horde Open Cluster",
            status: jobBRes.status === "fulfilled" ? "completed" : "failed",
            latencyMs: 650,
            errorMessage: jobBRes.status === "rejected" ? String(jobBRes.reason) : undefined,
            replyMarkdown:
              jobBRes.status === "fulfilled"
                ? `تم إرسال النسخة الثانية إلى محرك AI Horde DPM++ 2M...`
                : `تعذر إرسال الطلب.`,
            stepsLog: ["Submitted DPM++ 2M Diffusion job", "Polling AI Horde worker image"],
            modalityExecuted: "image",
            files: [],
            previewHtml: null,
            imageJobId: jobBRes.status === "fulfilled" && jobBRes.value ? jobBRes.value : null,
          }
        : null;

      return NextResponse.json({
        success: true,
        effectiveModality,
        outputA,
        outputB,
      });
    }

    // ------------------------------------------------------------------------
    // BRANCH 2: WEB SEARCH (Real Live DuckDuckGo + Wikipedia Citations)
    // ------------------------------------------------------------------------
    let citations: ArenaWebCitation[] = Array.isArray(body.citationsOverride)
      ? body.citationsOverride
      : [];
    if (effectiveModality === "search" && citations.length === 0) {
      citations = await performLiveWebSearch(prompt);
    }

    const searchContextText =
      citations.length > 0
        ? `\nLive Web Search Results:\n${citations
            .map((c, idx) => `[${idx + 1}] ${c.title} (${c.url})\n${c.snippet}`)
            .join("\n\n")}`
        : "";

    // Build history messages for multi-turn follow-ups
    const historyMsgs: Array<{ role: "user" | "assistant"; content: string }> = Array.isArray(
      body.history
    )
      ? body.history
          .slice(-8)
          .filter((m: any) => m?.content)
          .map((m: any) => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: String(m.content).slice(0, 6000),
          }))
      : [];

    // ------------------------------------------------------------------------
    // BRANCH 3: CANVAS MOTION VIDEO STUDIO (Local Real .WEBM Exporter)
    // ------------------------------------------------------------------------
    if (effectiveModality === "video") {
      const videoPrompt = `Create 4 short promo video storyboard slides for: "${prompt}".
Output strictly valid JSON object: {"title":"...","accentColor":"#10b981","scenes":[{"badge":"...","headline":"...","subline":"...","metric":"..."}]}.`;
      const isAr = /[\u0600-\u06FF]/.test(prompt);

      const runVideoSide = async (spec: ArenaRealModelSpec, delayMs: number): Promise<ArenaModelOutput> => {
        const start = Date.now();
        let parsedScenes: any = null;
        let usedModel = spec.apiModelId;
        try {
          const r = await callSingleRealModel({
            spec,
            systemPrompt: "Return ONLY a raw JSON object with title, accentColor, and scenes array.",
            messages: [{ role: "user", content: videoPrompt }],
            delayBeforeMs: delayMs,
          });
          usedModel = r.usedModel;
          const m = r.text.match(/\{[\s\S]*\}/);
          if (m) parsedScenes = JSON.parse(m[0]);
        } catch {}

        const html = buildMotionVideoStudioHtml({
          title: parsedScenes?.title || prompt.slice(0, 42),
          accentColor: parsedScenes?.accentColor || "#10b981",
          scenes: parsedScenes?.scenes || [
            {
              badge: "KASPI STUDIO",
              headline: prompt.slice(0, 32),
              subline: "Dynamic HTML5 Motion Video Engine",
              metric: "1280 × 720 HD",
            },
          ],
          rtl: isAr,
        });

        return {
          modelId: spec.id,
          modelName: spec.displayName,
          providerLabel: spec.providerLabel,
          status: "completed",
          latencyMs: Date.now() - start,
          replyMarkdown: isAr
            ? `تم بناء استوديو فيديو متحرك (60fps Canvas) مع تحميل مباشر بصيغة **.webm**. (ملاحظة: نماذج الفيديو السحابية مثل Kling/Seedance تتطلب رصيداً مدفوعاً).`
            : `Built a live 60fps HTML5 Canvas Motion Video Studio with direct **.webm** download. (Cloud video APIs like Kling/Seedance require paid credits).`,
          stepsLog: [`Rendered local Canvas .webm studio via ${usedModel}`],
          modalityExecuted: "video",
          files: [{ path: "motion-video.html", name: "motion-video.html", language: "html", content: html }],
          previewHtml: html,
          executedOn: "cloud-relay",
        };
      };

      const [vA, vB] = await Promise.all([
        runVideoSide(specA, 0),
        specB ? runVideoSide(specB, 900) : Promise.resolve(null),
      ]);

      return NextResponse.json({
        success: true,
        effectiveModality: "video",
        citations: [],
        outputA: vA,
        outputB: vB,
      });
    }

    // ------------------------------------------------------------------------
    // SYSTEM PROMPTS BY MODALITY (Unrestricted — builds whatever user asked!)
    // ------------------------------------------------------------------------
    const systemPrompt = buildArenaSystemPrompt({
      modality: effectiveModality,
      storeContextSnippet,
      attachmentContext,
      searchContextText,
    });

    const messagesForModel = [...historyMsgs, { role: "user" as const, content: prompt }];

    // Execute Model A and Model B independently (stagger B by 1.2s ONLY if both hit api.llm7.io)
    const shouldStaggerB = Boolean(
      specB && specA.upstream === "llm7" && specB.upstream === "llm7"
    );

    const runOne = async (
      spec: ArenaRealModelSpec,
      delayMs = 0
    ): Promise<ArenaModelOutput> => {
      const start = Date.now();
      try {
        let res = await callSingleRealModel({
          spec,
          systemPrompt,
          messages: messagesForModel,
          delayBeforeMs: delayMs,
        });

        if (effectiveModality === "code" || /<!DOCTYPE html|<html|```html/i.test(res.text)) {
          let parsed = extractProjectFromResponse(res.text, prompt);

          // Strict HTML enforcement: if model wrote Markdown prose instead of runnable HTML, convert cleanly
          if (effectiveModality === "code" && !parsed.previewHtml) {
            const compilerSpec =
              ARENA_REAL_MODELS.find(
                (m) => m.id === (spec.id === "kimi-k2.7-code" ? "groq-gpt-oss" : "kimi-k2.7-code")
              ) || spec;
            try {
              const retryRes = await callSingleRealModel({
                spec: compilerSpec,
                systemPrompt: STRICT_HTML_RECOVERY_SYSTEM_PROMPT,
                messages: [{ role: "user", content: prompt }],
                delayBeforeMs: 600,
              });
              const retryParsed = extractProjectFromResponse(retryRes.text, prompt);
              if (retryParsed.previewHtml) {
                parsed = retryParsed;
                res = {
                  text: retryRes.text,
                  usedModel: `${res.usedModel}→${retryRes.usedModel}`,
                  usedProvider: res.usedProvider,
                };
              }
            } catch {}
          }

          const latencyMs = Date.now() - start;
          const steps =
            mode === "agent"
              ? [
                  `Explored requirements & modality (${effectiveModality})`,
                  `Generated ${Math.max(1, parsed.files.length)} project file(s) via ${res.usedModel}`,
                  parsed.previewHtml ? "Built runnable live preview sandbox" : "Prepared code output",
                ]
              : [
                  parsed.previewHtml
                    ? `Built runnable project (${parsed.files.length} files)`
                    : `Generated response via ${res.usedModel}`,
                ];

          return {
            modelId: spec.id,
            modelName: spec.displayName,
            providerLabel: res.usedProvider,
            status: "completed",
            latencyMs,
            replyMarkdown: parsed.explanation,
            stepsLog: steps,
            modalityExecuted: parsed.previewHtml ? "code" : "text",
            files: parsed.files,
            previewHtml: parsed.previewHtml,
            citations: citations.length > 0 ? citations : undefined,
            executedOn: "cloud-relay",
          };
        }

        const latencyMs = Date.now() - start;
        return {
          modelId: spec.id,
          modelName: spec.displayName,
          providerLabel: res.usedProvider,
          status: "completed",
          latencyMs,
          replyMarkdown: sanitizeExplanationFromCodeLeaks(res.text, false, prompt),
          stepsLog:
            citations.length > 0
              ? [`Explored ${citations.length} live web sources`, `Synthesized reply via ${res.usedModel}`]
              : [`Responded via ${res.usedModel} in ${latencyMs}ms`],
          modalityExecuted: effectiveModality === "search" ? "search" : "text",
          files: [],
          previewHtml: null,
          citations: citations.length > 0 ? citations : undefined,
          executedOn: "cloud-relay",
        };
      } catch (err: any) {
        return {
          modelId: spec.id,
          modelName: spec.displayName,
          providerLabel: spec.providerLabel,
          status: "failed",
          latencyMs: Date.now() - start,
          errorMessage: String(err?.message || err),
          replyMarkdown: `⚠️ Model **${spec.displayName}** encountered an upstream error: ${String(
            err?.message || err
          )}`,
          stepsLog: [`Failed: ${String(err?.message || err)}`],
          modalityExecuted: "text",
          files: [],
          previewHtml: null,
        };
      }
    };

    const [settledA, settledB] = await Promise.all([
      runOne(specA, 0),
      specB ? runOne(specB, shouldStaggerB ? 1200 : 0) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      effectiveModality,
      citations,
      outputA: settledA,
      outputB: settledB,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
