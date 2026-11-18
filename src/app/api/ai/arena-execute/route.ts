import { NextRequest, NextResponse } from "next/server";
import { getSafeServerContext } from "@/server/auth/context";
import { generateTextWithRouter, getRouterCandidates } from "@/lib/ai-router";
import { sanitizeOutboundEndpoint } from "@/lib/security/integration-vault";
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

/**
 * Safely fetches public webpage text/metadata for URLs included in user prompts
 * (enforcing SSRF protections and private/loopback IP blocking).
 */
async function fetchSafeUrlContextFromPrompt(prompt: string): Promise<string> {
  const urlMatches = prompt.match(/https?:\/\/[^\s"'<>)]+/gi);
  if (!urlMatches || urlMatches.length === 0) return "";

  const snippets: string[] = [];
  for (const rawUrl of Array.from(new Set(urlMatches)).slice(0, 2)) {
    try {
      const safeUrl = sanitizeOutboundEndpoint(rawUrl);
      const parsed = new URL(safeUrl);
      const host = parsed.hostname.toLowerCase();
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.startsWith("10.") ||
        host.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host)
      ) {
        continue;
      }
      const res = await fetch(safeUrl, {
        headers: { "User-Agent": "KASPI-Arena-Bot/1.0 (+https://kaspi-pos.vercel.app)" },
        signal: AbortSignal.timeout(5500),
      });
      if (!res.ok) continue;
      const html = (await res.text()).slice(0, 60000);
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
      const desc =
        html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || "";
      const bodyText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2400);
      if (title || desc || bodyText) {
        snippets.push(
          `[Fetched Website Summary: ${safeUrl}]\nTitle: ${title}\nDescription: ${desc}\nExtracted Highlights: ${bodyText}`
        );
      }
    } catch {
      // Skip unreachable or blocked URL cleanly
    }
  }
  return snippets.join("\n\n");
}

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
  maxOutputTokens?: number;
}): Promise<{ text: string; usedModel: string; usedProvider: string }> {
  if (params.delayBeforeMs && params.delayBeforeMs > 0) {
    await new Promise((r) => setTimeout(r, params.delayBeforeMs));
  }

  const { spec, systemPrompt, messages } = params;
  const maxOutputTokens = params.maxOutputTokens ?? 7500;
  const deadline = Date.now() + 45000;
  const remainingMs = () => Math.max(0, deadline - Date.now());

  const groqTierRank = (modelId: string): number => {
    const m = modelId.toLowerCase();
    if (m.includes("kimi-k2") || m.includes("120b")) return 0;
    if (m.includes("llama-3.3-70b")) return 1;
    if (m.includes("qwen")) return 2;
    if (m.includes("20b") || m.includes("gpt-oss")) return 3;
    if (m.includes("8b-instant")) return 9;
    return 4;
  };

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
    const matching = allCandidates
      .filter((c) => c.provider === targetProvider)
      .sort((a, b) => {
        if (a.modelId === spec.apiModelId) return -1;
        if (b.modelId === spec.apiModelId) return 1;
        if (targetProvider === "groq") return groqTierRank(a.modelId) - groqTierRank(b.modelId);
        return 0;
      });

    let lastErr = "Upstream provider busy";

    // Explicit flagship OpenRouter :free chain with realistic 24s timeout before router pool
    if (targetProvider === "openrouter" && matching[0]?.apiKey && remainingMs() > 8000) {
      const orModels = Array.from(
        new Set([
          spec.apiModelId,
          "nvidia/nemotron-3-ultra-550b-a55b:free",
          "google/gemma-4-31b-it:free",
          "cohere/north-mini-code:free",
          "openrouter/free",
        ])
      );
      for (const orModel of orModels.slice(0, 3)) {
        if (remainingMs() < 6000) break;
        try {
          const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${matching[0].apiKey}`,
              "HTTP-Referer": "https://kaspi-pos.vercel.app",
              "X-Title": "KASPI AI Arena",
            },
            body: JSON.stringify({
              model: orModel,
              max_tokens: maxOutputTokens,
              temperature: 0.4,
              messages: [{ role: "system", content: systemPrompt }, ...messages],
            }),
            signal: AbortSignal.timeout(Math.min(24000, remainingMs())),
          });
          const d = await r.json().catch(() => null);
          const text = d?.choices?.[0]?.message?.content;
          if (r.ok && typeof text === "string" && text.trim()) {
            return {
              text: text.trim(),
              usedModel: d?.model || orModel,
              usedProvider: "OpenRouter Flagship",
            };
          }
          lastErr = String(d?.error?.message || `HTTP ${r.status}`);
        } catch (err: any) {
          lastErr = String(err?.message || err);
        }
      }
    }

    for (let idx = 0; idx < Math.min(3, matching.length); idx++) {
      if (remainingMs() < 4000) break;
      const candidate = matching[idx];
      const timeoutMs = Math.min(
        remainingMs(),
        targetProvider === "openrouter" ? 20000 : targetProvider === "google" ? 26000 : 22000
      );
      try {
        const res = await generateText({
          model: candidate.model as any,
          maxRetries: 0,
          maxOutputTokens,
          temperature: 0.45,
          abortSignal: AbortSignal.timeout(timeoutMs),
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
      } catch (err: any) {
        lastErr = String(err?.message || err);
      }
    }

    // Dynamic flagship model discovery on Groq (prioritize 70B / 120B / Kimi-K2, avoid 8b unless alone)
    if (targetProvider === "groq" && matching[0]?.apiKey && remainingMs() > 6000) {
      try {
        const listRes = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${matching[0].apiKey}` },
          signal: AbortSignal.timeout(Math.min(4500, remainingMs())),
        });
        const listJson = await listRes.json().catch(() => null);
        const candidatesRanked: string[] = (listJson?.data || [])
          .map((m: any) => String(m?.id || ""))
          .filter(
            (id: string) =>
              id &&
              !/(whisper|guard|tts|audio|safeguard|prompt-guard|orpheus)/i.test(id)
          )
          .sort((a: string, b: string) => groqTierRank(a) - groqTierRank(b));

        for (const bestModel of candidatesRanked.slice(0, 2)) {
          if (remainingMs() < 4000) break;
          const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${matching[0].apiKey}`,
            },
            body: JSON.stringify({
              model: bestModel,
              max_tokens: maxOutputTokens,
              temperature: 0.42,
              messages: [{ role: "system", content: systemPrompt }, ...messages],
            }),
            signal: AbortSignal.timeout(remainingMs()),
          });
          const chatJson = await chatRes.json().catch(() => null);
          const text = chatJson?.choices?.[0]?.message?.content;
          if (chatRes.ok && typeof text === "string" && text.trim()) {
            return {
              text: text.trim(),
              usedModel: bestModel,
              usedProvider: "Groq Flagship Engine",
            };
          }
        }
      } catch {}
    }

    if (targetProvider === "google" && matching[0]?.apiKey && remainingMs() > 6000) {
      try {
        const listRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(matching[0].apiKey)}`,
          { signal: AbortSignal.timeout(6000) }
        );
        const listJson = await listRes.json().catch(() => null);
        const firstFlash = listJson?.models?.find(
          (m: any) =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes("generateContent") &&
            /gemini-(2\.5|3)/i.test(String(m.name || "")) &&
            !/(tts|image|live|embedding|1\.5|2\.0)/i.test(String(m.name || ""))
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
                generationConfig: { maxOutputTokens, temperature: 0.45 },
              }),
              signal: AbortSignal.timeout(Math.min(26000, remainingMs())),
            }
          );
          const genJson = await genRes.json().catch(() => null);
          const text = genJson?.candidates?.[0]?.content?.parts
            ?.map((p: any) => p?.text || "")
            .join("")
            .trim();
          if (genRes.ok && text) {
            return {
              text,
              usedModel: cleanName,
              usedProvider: "Google Gemini",
            };
          }
        }
      } catch {}
    }

    // Cross-provider flagship failover (Groq 70B or Google Gemini 2.5 Flash) before returning error
    if (remainingMs() > 5000) {
      const backupCandidates = allCandidates
        .filter((c) => c.provider !== targetProvider && (c.provider === "groq" || c.provider === "google"))
        .sort((a, b) => groqTierRank(a.modelId) - groqTierRank(b.modelId))
        .slice(0, 2);
      for (const candidate of backupCandidates) {
        try {
          const res = await generateText({
            model: candidate.model as any,
            maxRetries: 0,
            maxOutputTokens,
            abortSignal: AbortSignal.timeout(Math.min(20000, remainingMs())),
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
        } catch {}
      }
    }

    throw new Error(lastErr);
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
          signal: AbortSignal.timeout(14000),
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
    if (remainingMs() > 4000) {
      try {
        const routerRes = await generateTextWithRouter({
          system: systemPrompt,
          messages,
          maxOutputTokens,
          temperature: 0.45,
        });
        return {
          text: routerRes.text,
          usedModel: routerRes.activeModel,
          usedProvider: `${routerRes.activeProvider} (Failover)`,
        };
      } catch {}
    }

    // Failover 2: Pollinations OpenAI Gateway (ignore budget-exhausted banners)
    if (remainingMs() > 3500) {
      const pRes = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
        signal: AbortSignal.timeout(Math.min(6000, remainingMs())),
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
    }
    throw new Error("All open gateways busy or timed out");
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

  if (action === "image_proxy") {
    const rawUrl = req.nextUrl.searchParams.get("url") || "";
    try {
      const safeUrl = sanitizeOutboundEndpoint(rawUrl);
      const parsed = new URL(safeUrl);
      const host = parsed.hostname.toLowerCase();
      const allowedHost =
        host.endsWith("r2.cloudflarestorage.com") ||
        host.endsWith("aihorde.net") ||
        host.endsWith("wikimedia.org") ||
        host.endsWith("googleusercontent.com");
      if (!allowedHost) {
        return NextResponse.json({ error: "Host not allowlisted for image proxy" }, { status: 403 });
      }
      const imgRes = await fetch(safeUrl, { signal: AbortSignal.timeout(10000) });
      if (!imgRes.ok) {
        return NextResponse.json({ error: `Image upstream ${imgRes.status}` }, { status: 502 });
      }
      const contentType = imgRes.headers.get("content-type") || "image/webp";
      const buf = await imgRes.arrayBuffer();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (err: any) {
      return NextResponse.json({ error: String(err?.message || err) }, { status: 400 });
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

    const mode: ArenaExecutionMode = [
      "battle",
      "agent",
      "side_by_side",
      "direct",
      "autonomous",
      "integration",
    ].includes(body.mode)
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

    const phase = ["plan", "build_core", "refine_qa", "video_director", "single"].includes(
      body.phase
    )
      ? String(body.phase)
      : "single";

    const urlContext =
      typeof body.urlContext === "string" && body.urlContext.trim()
        ? body.urlContext.trim()
        : await fetchSafeUrlContextFromPrompt(prompt);

    const libraryContextSnippet = body.libraryContextSnippet
      ? String(body.libraryContextSnippet).slice(0, 2600)
      : "";
    const previousFilesSummary =
      typeof body.previousFilesSummary === "string"
        ? body.previousFilesSummary.slice(0, 12000)
        : "";
    const combinedMemory = `${storeContextSnippet}${libraryContextSnippet}${
      urlContext ? `\n\n${urlContext}` : ""
    }${attachmentContext}${searchContextText}`;

    // ------------------------------------------------------------------------
    // PHASE HANDLERS FOR MULTI-STAGE FRONTIER BUILDING & VIDEO DIRECTION
    // ------------------------------------------------------------------------
    if (phase === "plan") {
      const planSystem = `You are a Principal Full-Stack Architect inside KASPI AI Arena.
Inspect the user request, any fetched website context, and any POS store data.${combinedMemory}
Respond in the user's language in concise, confident architectural prose (2–3 short sentences describing what you are building — storefront/app capabilities, visual themes, key modules: styles/tokens.css, styles/layout.css, data/catalog.js, index.html, scripts/app.js — plus 4 crisp bullet checklist items). NEVER output HTML/CSS code blocks yet.`;
      const planMsgs = [
        ...historyMsgs,
        {
          role: "user" as const,
          content: previousFilesSummary
            ? `Existing project files summary:\n${previousFilesSummary}\n\nFollow-up edit/build request:\n${prompt}`
            : prompt,
        },
      ];
      const planRes = await callSingleRealModel({
        spec: specA,
        systemPrompt: planSystem,
        messages: planMsgs,
        maxOutputTokens: 1200,
      });
      return NextResponse.json({
        success: true,
        phase: "plan",
        planText: sanitizeExplanationFromCodeLeaks(planRes.text, false, prompt),
        urlContext,
      });
    }

    if (phase === "video_director") {
      const isAr = /[\u0600-\u06FF]/.test(prompt);
      const directorSystem = `You are a Senior Commercial Video Director.
Create a compelling 6-scene to 7-scene promotional ad video script for the user's project/URL.${combinedMemory}
Return STRICTLY valid JSON (no markdown fences needed):
{"title":"Brand / Project Name","accentColor":"#10b981","scenes":[{"badge":"SHORT TAG","headline":"Impactful Headline (max 30 chars)","subline":"Clear value benefit (max 48 chars)","metric":"KEY STAT OR CTA"}]}.
CRITICAL: Write all badge/headline/subline/metric texts in the exact language of the prompt (${
        isAr ? "Arabic / Moroccan Darija" : "same language as prompt"
      }). Reflect real features found in the fetched URL content when present!`;
      const vidRes = await callSingleRealModel({
        spec: specA,
        systemPrompt: directorSystem,
        messages: [{ role: "user", content: prompt }],
        maxOutputTokens: 1600,
      });
      let videoPlan: any = null;
      const m = vidRes.text.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          videoPlan = JSON.parse(m[0]);
        } catch {}
      }
      return NextResponse.json({
        success: true,
        phase: "video_director",
        videoPlan,
        urlContext,
      });
    }

    if (phase === "build_core") {
      const planCtx = body.planText ? `\nApproved Architecture Plan:\n${String(body.planText).slice(0, 2200)}` : "";
      const coreSystem = `${buildArenaSystemPrompt({
        modality: "code",
        storeContextSnippet,
        libraryContextSnippet,
        attachmentContext,
        searchContextText,
        mode,
      })}${urlContext ? `\n${urlContext}` : ""}${planCtx}

STAGE FOCUS (CORE DESIGN SYSTEM + CATALOG DATA + SEMANTIC HTML):
Output clean, deep modular files in this EXACT order:
<!-- FILE: styles/tokens.css -->
\`\`\`css
/* Complete CSS custom properties for dark & light theme, typography, spacing, glass cards */
\`\`\`
<!-- FILE: styles/layout.css -->
\`\`\`css
/* Responsive navigation, hero showcase, filter bar, bento grid, cart drawer, checkout modal, admin panel */
\`\`\`
<!-- FILE: data/catalog.js -->
\`\`\`javascript
/* Rich realistic items/products/specs array with inline bespoke crisp SVG artwork (data URIs or inline SVG strings — NEVER dog/random placeholder stock images!), pricing in correct currency, variants, reviews */
\`\`\`
<!-- FILE: index.html -->
\`\`\`html
<!DOCTYPE html>
<!-- Complete semantic HTML application shell matching all CSS classes & interactive IDs -->
\`\`\``;

      const coreRes = await callSingleRealModel({
        spec: specA,
        systemPrompt: coreSystem,
        messages: [
          ...historyMsgs,
          {
            role: "user",
            content: previousFilesSummary
              ? `Update/extend the existing project below for this request:\n\nExisting files:\n${previousFilesSummary}\n\nRequest:\n${prompt}`
              : prompt,
          },
        ],
        maxOutputTokens: 8000,
      });

      const parsed = extractProjectFromResponse(coreRes.text, prompt);
      return NextResponse.json({
        success: true,
        phase: "build_core",
        effectiveModality: "code",
        outputA: {
          modelId: specA.id,
          modelName: "Option A",
          providerLabel: "KASPI Engine",
          status: "completed",
          latencyMs: 0,
          replyMarkdown: parsed.explanation,
          stepsLog: ["Generated foundation styles, catalog & HTML structure"],
          modalityExecuted: "code",
          files: parsed.files,
          previewHtml: parsed.previewHtml,
          executedOn: "cloud-relay",
        },
      });
    }

    if (phase === "refine_qa") {
      const builtSummary = String(body.builtFilesSummary || "").slice(0, 12000);
      const refineSystem = `You are a Principal Frontend & QA Engineer finishing a multi-file web application.
Review the foundation files provided and complete/upgrade them cleanly.${combinedMemory}

STRICT REQUIREMENTS:
1. Output complete working client application logic in:
<!-- FILE: scripts/app.js -->
\`\`\`javascript
// Wire ALL buttons, category/search/price filters, product variant pickers, slide-over Cart drawer with localStorage persistence, multi-step Checkout with COD/Card & WhatsApp summary, Dark/Light [data-theme] toggle, EN/AR/FR switcher with RTL dir switch, Wishlist, and working Admin Dashboard CRUD for products & orders!
// Ensure EVERY SVG/image renders crisp domain visuals (zero broken src or random off-topic photos).
\`\`\`
2. If index.html or CSS needs missing element IDs, modals, contrast fixes, or closing tags to wire scripts/app.js cleanly, ALSO output the updated <!-- FILE: index.html --> or <!-- FILE: styles/layout.css -->.
3. Also output a concise <!-- FILE: README.md -->.`;

      const qaRes = await callSingleRealModel({
        spec: specA,
        systemPrompt: refineSystem,
        messages: [
          {
            role: "user",
            content: `Original User Request:\n${prompt}\n\nFoundation Files Built So Far:\n${builtSummary}`,
          },
        ],
        maxOutputTokens: 7500,
      });

      const parsed = extractProjectFromResponse(qaRes.text, prompt);
      return NextResponse.json({
        success: true,
        phase: "refine_qa",
        effectiveModality: "code",
        outputA: {
          modelId: specA.id,
          modelName: "Option A",
          providerLabel: "KASPI Engine",
          status: "completed",
          latencyMs: 0,
          replyMarkdown: parsed.explanation,
          stepsLog: ["Engineered interactive scripts & verified UI completeness"],
          modalityExecuted: "code",
          files: parsed.files,
          previewHtml: parsed.previewHtml,
          executedOn: "cloud-relay",
        },
      });
    }

    // ------------------------------------------------------------------------
    // BRANCH 3: PROMO VIDEO PLAYER (Default single API fallback)
    // ------------------------------------------------------------------------
    if (effectiveModality === "video") {
      const isAr = /[\u0600-\u06FF]/.test(prompt);
      const videoPrompt = `Create 6 dynamic commercial promo video scenes for: "${prompt}".${
        urlContext ? `\nFetched Project Info:\n${urlContext}` : ""
      }
Output strictly valid JSON object: {"title":"...","accentColor":"#10b981","scenes":[{"badge":"...","headline":"...","subline":"...","metric":"..."}]}.`;

      const runVideoSide = async (
        spec: ArenaRealModelSpec,
        sideLabel: "A" | "B",
        delayMs: number
      ): Promise<ArenaModelOutput> => {
        const start = Date.now();
        let parsedScenes: any = null;
        try {
          const r = await callSingleRealModel({
            spec,
            systemPrompt: "Return ONLY a raw JSON object with title, accentColor, and 6-7 scenes.",
            messages: [{ role: "user", content: videoPrompt }],
            delayBeforeMs: delayMs,
          });
          const m = r.text.match(/\{[\s\S]*\}/);
          if (m) parsedScenes = JSON.parse(m[0]);
        } catch {}

        const cleanTitle =
          parsedScenes?.title || prompt.replace(/https?:\/\/\S+/g, "").trim().slice(0, 42) || "Product Ad";
        const html = buildMotionVideoStudioHtml({
          title: cleanTitle,
          accentColor: parsedScenes?.accentColor || (sideLabel === "A" ? "#10b981" : "#38bdf8"),
          scenes: parsedScenes?.scenes || [
            {
              badge: "LAUNCH",
              headline: cleanTitle,
              subline: "Dynamic Commercial Promo Experience",
              metric: "1280 × 720 HD",
            },
          ],
          rtl: isAr,
        });

        return {
          modelId: spec.id,
          modelName: `Option ${sideLabel}`,
          providerLabel: "KASPI Video Engine",
          status: "completed",
          latencyMs: Date.now() - start,
          replyMarkdown: isAr
            ? `تم إنتاج الفيديو الإعلاني لمشروعك بدقة HD، ويمكنك تشغيله أو تحميله بصيغة **.webm**.`
            : `Produced your HD promotional video player with direct **.webm** download.`,
          stepsLog: ["Analyzed project context", "Rendered multi-scene HD promo video"],
          modalityExecuted: "video",
          files: [{ path: "promo-video.html", name: "promo-video.html", language: "html", content: html }],
          previewHtml: html,
          executedOn: "cloud-relay",
        };
      };

      const [vA, vB] = await Promise.all([
        runVideoSide(specA, "A", 0),
        specB ? runVideoSide(specB, "B", 600) : Promise.resolve(null),
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
    // SYSTEM PROMPTS BY MODALITY (Single-shot execution + clean blind labels)
    // ------------------------------------------------------------------------
    const systemPrompt = buildArenaSystemPrompt({
      modality: effectiveModality,
      storeContextSnippet,
      libraryContextSnippet,
      attachmentContext,
      searchContextText: `${urlContext ? `\n${urlContext}` : ""}${searchContextText}`,
      mode,
    });

    const messagesForModel = [...historyMsgs, { role: "user" as const, content: prompt }];

    const runOne = async (
      spec: ArenaRealModelSpec,
      sideLabel: "A" | "B",
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

          // Strict HTML enforcement using flagship recovery (never tiny 8B!)
          if (effectiveModality === "code" && !parsed.previewHtml && Date.now() - start < 22000) {
            const compilerSpec =
              ARENA_REAL_MODELS.find(
                (m) => m.id === (spec.id === "groq-llama33" ? "gemini-2.5-flash" : "groq-llama33")
              ) || spec;
            try {
              const retryRes = await callSingleRealModel({
                spec: compilerSpec,
                systemPrompt: STRICT_HTML_RECOVERY_SYSTEM_PROMPT,
                messages: [{ role: "user", content: prompt }],
                delayBeforeMs: 250,
                maxOutputTokens: 7000,
              });
              const retryParsed = extractProjectFromResponse(retryRes.text, prompt);
              if (retryParsed.previewHtml) {
                parsed = retryParsed;
                res = retryRes;
              }
            } catch {}
          }

          const latencyMs = Date.now() - start;
          const steps = [
            "Inspected project requirements & context",
            `Generated modular project (${Math.max(1, parsed.files.length)} files)`,
            parsed.previewHtml ? "Built runnable live preview" : "Prepared source output",
          ];

          return {
            modelId: spec.id,
            modelName: `Option ${sideLabel}`,
            providerLabel: "KASPI AI",
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
          modelName: `Option ${sideLabel}`,
          providerLabel: "KASPI AI",
          status: "completed",
          latencyMs,
          replyMarkdown: sanitizeExplanationFromCodeLeaks(res.text, false, prompt),
          stepsLog:
            citations.length > 0
              ? [`Explored ${citations.length} live web sources`, "Synthesized grounded answer"]
              : ["Completed response"],
          modalityExecuted: effectiveModality === "search" ? "search" : "text",
          files: [],
          previewHtml: null,
          citations: citations.length > 0 ? citations : undefined,
          executedOn: "cloud-relay",
        };
      } catch (err: any) {
        return {
          modelId: spec.id,
          modelName: `Option ${sideLabel}`,
          providerLabel: "KASPI AI",
          status: "failed",
          latencyMs: Date.now() - start,
          errorMessage: String(err?.message || err),
          replyMarkdown: `⚠️ تعذر إتمام هذه المحاولة مؤقتاً: ${String(err?.message || err)}`,
          stepsLog: ["Execution interrupted"],
          modalityExecuted: "text",
          files: [],
          previewHtml: null,
        };
      }
    };

    const [settledA, settledB] = await Promise.all([
      runOne(specA, "A", 0),
      specB ? runOne(specB, "B", 250) : Promise.resolve(null),
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
