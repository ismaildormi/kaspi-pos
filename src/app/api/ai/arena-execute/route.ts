import { NextRequest, NextResponse } from "next/server";
import { getSafeServerContext } from "@/server/auth/context";
import { generateTextWithRouter } from "@/lib/ai-router";
import { prisma } from "@/server/db/prisma";
import {
  ARENA_REAL_MODELS,
  selectBattleModelPair,
  type ArenaExecutionMode,
  type ArenaModality,
  type ArenaModelOutput,
  type ArenaProjectFileItem,
  type ArenaRealModelSpec,
  type ArenaWebCitation,
} from "@/lib/ai/arena-models";

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
// 2. REAL MODALITY CLASSIFIER & RUNTIME FILE EXTRACTOR
// ============================================================================

function detectEffectiveModality(
  requested: ArenaModality,
  prompt: string
): "code" | "text" | "search" | "image" {
  if (requested === "code" || requested === "text" || requested === "search" || requested === "image") {
    return requested;
  }

  const p = prompt.toLowerCase();
  if (
    /(\bdraw\b|\bgenerate\s+(an?\s+)?image\b|\bcreate\s+(a\s+)?(photo|picture|logo|illustration|art)\b|ارسم|توليد صورة|صورة لـ|انشئ صورة|صمم شعار)/i.test(
      p
    )
  ) {
    return "image";
  }

  if (
    /(\bsearch\s+(the\s+)?web\b|\bfetch\b|https?:\/\/|\blatest\s+news\b|ابحث في الانترنت|بحث في الويب|معلومات محدثة)/i.test(
      p
    )
  ) {
    return "search";
  }

  if (
    /(build\s+|create\s+|make\s+|design\s+|develop\s+|write\s+(a\s+)?(game|website|web\s*app|site|page|html|dashboard|app|store|shop|calculator|portfolio|landing)|website|web\s*app|landing\s*page|racing\s*game|arcade|three\.?js|tetris|snake|chess|puzzle|block\s*blast|html5|canvas|صفحة|موقع|متجر|تطبيق|لعبة|صمم|أنشئ|برمج|واجهة|منصة|حاسبة|نظام)/i.test(
      p
    )
  ) {
    return "code";
  }

  return "text";
}

function bundlePreviewHtml(files: ArenaProjectFileItem[], rawText: string): string | null {
  const htmlFile = files.find((f) => f.name.toLowerCase().endsWith(".html"));
  const cssFiles = files.filter((f) => f.name.toLowerCase().endsWith(".css"));
  const jsFiles = files.filter(
    (f) => f.name.toLowerCase().endsWith(".js") && !f.name.includes("config")
  );

  let html = htmlFile?.content || "";
  if (!html) {
    const htmlMatch = rawText.match(/<!DOCTYPE\s+html[\s\S]*?<\/html>/i) || rawText.match(/<html[\s\S]*?<\/html>/i);
    if (htmlMatch) html = htmlMatch[0];
  }

  if (!html.trim()) return null;

  // Inject CSS files inline if index.html references them cleanly or lacks styles
  const combinedCss = cssFiles.map((c) => c.content).join("\n\n");
  if (combinedCss.trim()) {
    const styleTag = `<style>\n${combinedCss}\n</style>`;
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${styleTag}\n</head>`);
    } else {
      html = `${styleTag}\n${html}`;
    }
  }

  // Inject JS files inline if separated
  const combinedJs = jsFiles.map((j) => j.content).join("\n\n");
  if (combinedJs.trim()) {
    const scriptTag = `<script>\n${combinedJs}\n</script>`;
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);
    } else {
      html = `${html}\n${scriptTag}`;
    }
  }

  // Strip external stylesheet links to styles.css or external script src app.js to prevent 404 console errors inside srcDoc
  html = html.replace(/<link[^>]+href=["'](?:\.\/)?styles?\.css["'][^>]*>/gi, "");
  html = html.replace(/<script[^>]+src=["'](?:\.\/)?(?:app|main|script)\.js["'][^>]*><\/script>/gi, "");

  return html;
}

function extractProjectFromResponse(rawText: string): {
  explanation: string;
  files: ArenaProjectFileItem[];
  previewHtml: string | null;
} {
  const files: ArenaProjectFileItem[] = [];
  let explanation = rawText;

  // 1. Try parsing JSON block (either inside ```json ... ``` or embedded object)
  const jsonFence = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const rawBraceMatch = rawText.match(/\{[\s\S]*"files"\s*:\s*\[[\s\S]*\}/);
  const candidateJsonStr = jsonFence
    ? jsonFence[1].trim()
    : rawBraceMatch
    ? rawBraceMatch[0].trim()
    : "";

  if (candidateJsonStr.startsWith("{")) {
    try {
      const parsed = JSON.parse(candidateJsonStr);
      if (typeof parsed.explanation === "string" && parsed.explanation.trim()) {
        explanation = parsed.explanation.trim();
      }
      if (Array.isArray(parsed.files)) {
        for (const f of parsed.files) {
          if (f?.path && typeof f.content === "string") {
            const name = String(f.path).split("/").pop() || String(f.path);
            files.push({
              path: String(f.path),
              name,
              language: String(f.language || name.split(".").pop() || "txt"),
              content: f.content,
            });
          }
        }
      }
    } catch {
      // Fallback to fenced block extraction below
    }
  }

  // 2. If no JSON files parsed, extract fenced code blocks (html, css, js/ts/tsx)
  if (files.length === 0) {
    const fenceRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    let codeBlockIdx = 0;

    while ((match = fenceRegex.exec(rawText)) !== null) {
      const lang = (match[1] || "txt").toLowerCase();
      const content = match[2].trim();
      if (!content) continue;
      codeBlockIdx++;

      if (lang === "html" || content.includes("<!DOCTYPE html") || content.includes("<html")) {
        files.push({
          path: "index.html",
          name: "index.html",
          language: "html",
          content,
        });
      } else if (lang === "css") {
        files.push({
          path: "styles.css",
          name: "styles.css",
          language: "css",
          content,
        });
      } else if (lang === "js" || lang === "javascript") {
        files.push({
          path: "app.js",
          name: "app.js",
          language: "javascript",
          content,
        });
      } else if (lang === "tsx" || lang === "ts" || lang === "jsx") {
        files.push({
          path: `src/App.${lang}`,
          name: `App.${lang}`,
          language: lang,
          content,
        });
      } else {
        files.push({
          path: `snippet-${codeBlockIdx}.${lang || "txt"}`,
          name: `snippet-${codeBlockIdx}.${lang || "txt"}`,
          language: lang || "txt",
          content,
        });
      }
    }

    // Remove giant raw code blocks from the conversational explanation bubble cleanly
    const stripped = rawText.replace(/```[\s\S]*?```/g, "").trim();
    if (stripped.length > 20) {
      explanation = stripped;
    } else if (files.length > 0) {
      explanation = "تم بناء التطبيق البرمجي بالكامل وجاهز للتشغيل والمعاينة المباشرة.";
    }
  }

  // 3. Also check inline <!DOCTYPE html> if raw text wasn't fenced
  if (files.length === 0 && /<!DOCTYPE\s+html|<html[\s>]/i.test(rawText)) {
    const htmlMatch = rawText.match(/<!DOCTYPE\s+html[\s\S]*?<\/html>/i) || rawText.match(/<html[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      files.push({
        path: "index.html",
        name: "index.html",
        language: "html",
        content: htmlMatch[0],
      });
      explanation = "تم بناء المشروع وتشغيله في بيئة المعاينة المباشرة.";
    }
  }

  const previewHtml = bundlePreviewHtml(files, rawText);
  return { explanation, files, previewHtml };
}

// ============================================================================
// 3. REAL OPEN-WEIGHT MODEL RUNNER WITH RETRY & FAILOVER
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
      // Failover 2: Pollinations OpenAI Gateway
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
      if (pRes.ok && typeof pText === "string" && pText.trim()) {
        return {
          text: pText.trim(),
          usedModel: pData.model || "gpt-oss-20b",
          usedProvider: "Open-Weight Failover (Pollinations)",
        };
      }
      throw new Error(pData?.error?.message || "All open gateways busy");
    }
  }

  if (spec.upstream === "pollinations") {
    try {
      const res = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
        signal: AbortSignal.timeout(40000),
      });
      const data = await res.json().catch(() => null);
      const text = data?.choices?.[0]?.message?.content;
      if (res.ok && typeof text === "string" && text.trim()) {
        return {
          text: text.trim(),
          usedModel: data.model || "gpt-oss-20b",
          usedProvider: spec.providerLabel,
        };
      }
    } catch {}
    // Failover to Gemma-4-31B on LLM7 or Configured Router
    const routerRes = await generateTextWithRouter({
      system: systemPrompt,
      messages,
    });
    return {
      text: routerRes.text,
      usedModel: routerRes.activeModel,
      usedProvider: `${routerRes.activeProvider} (Failover)`,
    };
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
    const requestedModality: ArenaModality = ["auto", "code", "text", "search", "image"].includes(
      body.modality
    )
      ? body.modality
      : "auto";
    const effectiveModality = detectEffectiveModality(requestedModality, prompt);

    // Pick models according to mode
    let specA: ArenaRealModelSpec;
    let specB: ArenaRealModelSpec | null = null;

    if (mode === "battle") {
      const [mA, mB] = selectBattleModelPair(prompt);
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
    let citations: ArenaWebCitation[] = [];
    if (effectiveModality === "search") {
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
    // SYSTEM PROMPTS BY MODALITY (Unrestricted — builds whatever user asked!)
    // ------------------------------------------------------------------------
    const systemPrompt =
      effectiveModality === "code"
        ? `You are an expert Senior Full-Stack & Creative Web Developer inside KASPI AI Arena.
The user can ask you to build ANYTHING: interactive websites, 2D/3D HTML5 Canvas games, web applications, e-commerce storefronts (fashion, abaya, food, SaaS, etc.), dashboards, utilities, calculators, portfolios, animations, or custom tools. Fulfill their exact request completely and creatively in their requested language (Arabic, French, English, or Darija).${storeContextSnippet}${attachmentContext}${searchContextText}

CRITICAL TECHNICAL OUTPUT FORMAT (MUST FOLLOW FOR LIVE SANDBOX RENDERING):
1. Write a brief 2-3 sentence summary explaining what you built in the user's language.
2. Output the complete working code using clean fenced code blocks (` + "```html" + `, ` + "```css" + `, ` + "```javascript" + `).
3. Use pure HTML5 + CSS3 + modern ES6 JavaScript (plus HTML5 Canvas / inline SVG icons if needed) with ZERO external unbundled npm imports so it executes immediately inside a sandboxed iframe.`
        : effectiveModality === "search"
        ? `You are KASPI AI Research Assistant powered by live web search.
Answer the user's question accurately in the same language as the prompt using the Live Web Search Results provided below. Cite source numbers like [1], [2].${storeContextSnippet}${attachmentContext}${searchContextText}`
        : `You are KASPI AI, a versatile, helpful, unrestricted frontier AI assistant.
Respond clearly, thoughtfully, and accurately in the exact language used by the user (Arabic, Moroccan Darija, French, English, etc.). If the user asks follow-up questions about previously generated code or ideas, help them directly.${storeContextSnippet}${attachmentContext}`;

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
        const res = await callSingleRealModel({
          spec,
          systemPrompt,
          messages: messagesForModel,
          delayBeforeMs: delayMs,
        });
        const latencyMs = Date.now() - start;

        if (effectiveModality === "code" || /<!DOCTYPE html|<html|```html/i.test(res.text)) {
          const parsed = extractProjectFromResponse(res.text);
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
          };
        }

        return {
          modelId: spec.id,
          modelName: spec.displayName,
          providerLabel: res.usedProvider,
          status: "completed",
          latencyMs,
          replyMarkdown: res.text,
          stepsLog:
            citations.length > 0
              ? [`Explored ${citations.length} live web sources`, `Synthesized reply via ${res.usedModel}`]
              : [`Responded via ${res.usedModel} in ${latencyMs}ms`],
          modalityExecuted: effectiveModality === "search" ? "search" : "text",
          files: [],
          previewHtml: null,
          citations: citations.length > 0 ? citations : undefined,
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
