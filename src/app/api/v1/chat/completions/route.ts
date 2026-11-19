import { NextRequest } from "next/server";
import { stepCountIs, tool } from "ai";
import { z } from "zod";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
  HEYUKA_API_CORS_HEADERS,
} from "@/lib/zebra-x/api-response";
import { generateTextWithRouter } from "@/lib/ai-router";
import {
  evaluateZeroCostPolicy,
  recordTenantFreeTierUsage,
} from "@/lib/heyuka/compute/zero-cost-policy";
import { runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";
import { queryPublicApiHub } from "@/lib/zebra-x/tools/public-apis-hub";
import { executePolyglotCodeSandbox } from "@/lib/zebra-x/tools/code-sandbox";
import {
  computeExactRetailFinance,
  evaluateMathOrAlgebra,
  getHijriAndSolarAstronomy,
  inspectCronExpression,
  planParallelDagWaves,
  validatePhoneNumberSafe,
} from "@/lib/zebra-x/tools/math-logic-engine";
import { generateProductImageUrl } from "@/lib/pollinations";
import { runPreReplyReflectionGate } from "@/lib/zebra-x/core/reflection-gate";
import { planXZebraToolRoute } from "@/lib/zebra-x/core/router";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS() {
  return createApiOptionsResponse();
}

function normalizeOpenAiMessageContent(raw: any): any {
  if (typeof raw === "string") return raw;
  if (!Array.isArray(raw)) return String(raw ?? "");
  const parts = raw
    .map((part: any) => {
      if (part?.type === "text" && typeof part.text === "string") {
        return { type: "text", text: part.text };
      }
      if (part?.type === "input_text" && typeof part.text === "string") {
        return { type: "text", text: part.text };
      }
      if (part?.type === "image_url" && part?.image_url?.url) {
        return { type: "image", image: String(part.image_url.url) };
      }
      if (part?.type === "image" && part?.image) {
        return { type: "image", image: String(part.image) };
      }
      return null;
    })
    .filter(Boolean);
  return parts.length > 0 ? parts : "Analyze the attached content.";
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = createRequestId();
  const auth = await authenticateXZebraRequest(req, "chat:universal");
  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: auth.status === 403 ? "permission_error" : "authentication_error",
      code: auth.status,
      requestId,
      hint:
        auth.status === 403
          ? "Generate a Full Access API key or enable 'chat:universal' scope."
          : "Pass header 'Authorization: Bearer hk-live-...' (or 'yk-live-...'). Optional: verify Key ID via 'X-API-Key-Id'.",
    });
  }

  const body = await req.json().catch(() => null);
  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  if (rawMessages.length === 0) {
    return apiErrorResponse({
      status: 400,
      message: "messages[] array is required.",
      type: "invalid_request_error",
      code: "missing_messages",
      requestId,
      hint: "Provide JSON body: { model: 'heyuka-omni', messages: [{ role: 'user', content: 'Hello' }] }.",
    });
  }

  const requestedModel = String(body?.model || "heyuka-omni").trim();
  const streamMode = Boolean(body?.stream);
  const enableTools = body?.enableTools !== false;

  // Separate optional caller system/developer directives & normalize OpenAI multimodal content
  const callerSystem = rawMessages
    .filter((m: any) => m?.role === "system" || m?.role === "developer")
    .map((m: any) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)))
    .join("\n")
    .trim();

  const chatMessages = rawMessages
    .filter((m: any) => m?.role === "user" || m?.role === "assistant")
    .slice(-16)
    .map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: normalizeOpenAiMessageContent(m.content),
    }));

  if (chatMessages.length === 0) {
    return apiErrorResponse({
      status: 400,
      message: "At least one user or assistant message is required.",
      type: "invalid_request_error",
      code: "empty_messages",
      requestId,
    });
  }

  const lastUserRaw = chatMessages[chatMessages.length - 1]?.content;
  const lastUserText =
    typeof lastUserRaw === "string"
      ? lastUserRaw
      : Array.isArray(lastUserRaw)
      ? lastUserRaw
          .map((p: any) => (p?.type === "text" ? p.text : ""))
          .join(" ")
          .trim() || "Analyze media"
      : "help";

  const expectedLocale: "ar" | "fr" | "en" = /[\u0600-\u06FF]/.test(lastUserText)
    ? "ar"
    : /\b(bonjour|merci|comment|pourquoi|avec|dans)\b/i.test(lastUserText)
    ? "fr"
    : "en";

  const routePlan = planXZebraToolRoute(lastUserText, false);

  const heyukaApiTools = {
    unrestrictedWebSearch: tool({
      description:
        "Search the public web or extract readable Markdown from a public URL via Jina Reader / SearXNG / DuckDuckGo / Wikipedia.",
      inputSchema: z.object({
        query: z.string().optional(),
        url: z.string().optional(),
      }),
      execute: async (input) =>
        runUnrestrictedWebResearch({ query: input.query, url: input.url, lang: expectedLocale }),
    }),

    queryPublicApi: tool({
      description:
        "Query 34 live No-Key APIs (cyber_threat_intel, nador_marine_weather, fx_rates, crypto_market, weather, geocode, wikipedia, openalex_science, openfda_drug, pubmed_papers, soilgrids_agri, nasa_power_agri, b2b_overpass, openverse_media, polyhaven_3d, transit_stops, air_quality, etc.).",
      inputSchema: z.object({
        category: z.enum([
          "openfoodfacts",
          "openbeautyfacts",
          "openproductfacts",
          "fx_rates",
          "crypto_market",
          "weather",
          "geocode",
          "b2b_overpass",
          "gleif_company",
          "country_info",
          "wikipedia",
          "wikidata_sparql",
          "duckduckgo",
          "world_bank",
          "openalex_science",
          "openfda_drug",
          "pubmed_papers",
          "soilgrids_agri",
          "nasa_power_agri",
          "paleobiology_fossils",
          "open_tree_of_life",
          "patents_inventor",
          "nobel_prize",
          "hacker_news",
          "remote_jobs",
          "iconify_logos",
          "openverse_media",
          "met_museum",
          "polyhaven_3d",
          "transit_stops",
          "smart_city_poi",
          "air_quality",
          "nador_marine_weather",
          "cyber_threat_intel",
        ]),
        query: z.string().min(1),
        base: z.string().optional(),
        limit: z.number().optional().default(6),
      }),
      execute: async (input) =>
        queryPublicApiHub({
          category: input.category,
          query: input.query,
          base: input.base,
          lang: expectedLocale,
          limit: input.limit,
        }),
    }),

    executeCodeSandbox: tool({
      description:
        "Execute Python, JavaScript, TypeScript, Bash, PHP, Go, or C++ cleanly inside an isolated HEYUKA sandbox.",
      inputSchema: z.object({
        language: z.enum(["python", "javascript", "typescript", "bash", "php", "go", "c++"]),
        code: z.string().min(1).max(16000),
        stdin: z.string().optional(),
      }),
      execute: async ({ language, code, stdin }) =>
        executePolyglotCodeSandbox({ language, code, stdin }),
    }),

    generateImage: tool({
      description: "Generate a studio visual image URL via HEYUKA Vision Diffusion.",
      inputSchema: z.object({ prompt: z.string().min(2) }),
      execute: async ({ prompt }) => {
        const imageUrl = generateProductImageUrl(prompt);
        return {
          imageUrl,
          proxyUrl: `/api/ai/media-tools?action=image_proxy&url=${encodeURIComponent(imageUrl)}`,
        };
      },
    }),

    evaluateMathAndFinance: tool({
      description: "Evaluate symbolic algebra, TVA/margin math, or DAG execution waves.",
      inputSchema: z.object({
        mode: z.enum(["math_algebra", "retail_finance", "dag_plan"]),
        expression: z.string().optional(),
        unitPrice: z.number().optional(),
        quantity: z.number().optional(),
        vatPercent: z.number().optional(),
        discountPercent: z.number().optional(),
        currencyCode: z.enum(["MAD", "USD", "EUR", "GBP", "SAR", "AED"]).optional(),
        dagTasks: z
          .array(
            z.object({
              id: z.string(),
              label: z.string().optional(),
              dependsOn: z.array(z.string()).optional(),
            })
          )
          .optional(),
      }),
      execute: async (input) => {
        if (input.mode === "retail_finance") {
          return computeExactRetailFinance({
            unitPrice: input.unitPrice ?? 0,
            quantity: input.quantity,
            vatPercent: input.vatPercent,
            discountPercent: input.discountPercent,
            currencyCode: input.currencyCode,
          });
        }
        if (input.mode === "dag_plan") {
          return planParallelDagWaves(input.dagTasks || []);
        }
        return evaluateMathOrAlgebra(input.expression || "0", true);
      },
    }),

    checkPhoneCalendarOrCron: tool({
      description: "Validate phone numbers, get Hijri/Solar times, or inspect cron schedules.",
      inputSchema: z.object({
        mode: z.enum(["phone", "hijri_sun", "cron"]),
        phone: z.string().optional(),
        cronExpr: z.string().optional(),
      }),
      execute: async (input) => {
        if (input.mode === "phone") return validatePhoneNumberSafe(input.phone || "", "MA");
        if (input.mode === "cron") return inspectCronExpression(input.cronExpr || "0 9 * * *", 5);
        return getHijriAndSolarAstronomy({});
      },
    }),
  };

  const baseSystem = `You are HEYUKA (${requestedModel}), the Sovereign Unified AI Model owned by KASPI.
You have direct live access to Web Research, Live Global Knowledge APIs, Isolated Polyglot Code Sandbox, Math/Finance/DAG engine, and Studio Image Generation.
Always answer accurately, honestly, and cleanly in the user's language (Arabic/Darija/French/English). Never disclose internal provider names or third-party model brands.
Planned Route: ${routePlan.complexity}${
    callerSystem ? `\n\nCaller Context:\n${callerSystem}` : ""
  }`;

  const policyDecision = await evaluateZeroCostPolicy({
    tenantId: auth.tenantId,
  });
  if (!policyDecision.allowed) {
    return apiErrorResponse({
      status: 429,
      message: policyDecision.reason,
      type: "permission_error",
      code: "zero_cost_budget_reached",
      requestId,
      hint: "Configure a tenant BYOK provider or connect a local Worker node under /zebra-x/workers to bypass shared free-tier daily caps.",
    });
  }

  try {
    const result = await generateTextWithRouter({
      system: baseSystem,
      messages: chatMessages,
      governance: {
        tenantId: auth.tenantId,
        allowOwnerPaidProviders: false,
      },
      ...(enableTools ? { tools: heyukaApiTools, stopWhen: stepCountIs(5) } : {}),
    } as any);

    if (policyDecision.tier === "free_public_tier") {
      await recordTenantFreeTierUsage(auth.tenantId).catch(() => {});
    }

    const audited = runPreReplyReflectionGate({
      draftText: String(result.text || ""),
      expectedLocale,
    });

    const completionId = `chatcmpl-heyuka-${Date.now().toString(36)}`;
    const createdTs = Math.floor(Date.now() / 1000);
    const toolsExecuted = Array.isArray((result as any).steps)
      ? Array.from(
          new Set(
            (result as any).steps.flatMap((s: any) =>
              Array.isArray(s?.toolCalls) ? s.toolCalls.map((t: any) => String(t?.toolName || "")) : []
            )
          )
        ).filter(Boolean)
      : [];

    if (streamMode) {
      const encoder = new TextEncoder();
      const content = audited.cleanedText;
      const sseStream = new ReadableStream({
        start(controller) {
          const chunkSize = 24;
          for (let i = 0; i < content.length; i += chunkSize) {
            const delta = content.slice(i, i + chunkSize);
            const frame = {
              id: completionId,
              object: "chat.completion.chunk",
              created: createdTs,
              model: requestedModel,
              choices: [
                {
                  index: 0,
                  delta: i === 0 ? { role: "assistant", content: delta } : { content: delta },
                  finish_reason: null,
                },
              ],
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
          }
          const finalFrame = {
            id: completionId,
            object: "chat.completion.chunk",
            created: createdTs,
            model: requestedModel,
            choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalFrame)}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      const latencyMs = Date.now() - startedAt;
      return new Response(sseStream, {
        status: 200,
        headers: {
          ...HEYUKA_API_CORS_HEADERS,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Request-Id": requestId,
          "X-HEYUKA-Latency-Ms": String(latencyMs),
          "X-HEYUKA-Model": requestedModel,
          "X-HEYUKA-Key-Id": auth.keyId || "session",
          "x-kaspi-heyuka-key-id": auth.keyId || "session",
        },
      });
    }

    const latencyMs = Date.now() - startedAt;
    return apiJsonResponse(
      {
        id: completionId,
        object: "chat.completion",
        created: createdTs,
        model: requestedModel,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: audited.cleanedText,
            },
            finish_reason: "stop",
          },
        ],
        usage: (result as any).usage || {
          prompt_tokens: lastUserText.length,
          completion_tokens: audited.cleanedText.length,
          total_tokens: lastUserText.length + audited.cleanedText.length,
        },
        kaspi_heyuka: {
          requestId,
          latencyMs,
          authMode: auth.authMode,
          keyId: auth.keyId || null,
          tenantId: auth.tenantId,
          toolsExecuted,
        },
      },
      200,
      {
        "X-Request-Id": requestId,
        "X-HEYUKA-Latency-Ms": String(latencyMs),
        "X-HEYUKA-Model": requestedModel,
        "X-HEYUKA-Key-Id": auth.keyId || "session",
      }
    );
  } catch (err: any) {
    return apiErrorResponse({
      status: 503,
      message: err?.message || "HEYUKA completion gateways temporarily unavailable",
      type: "server_error",
      code: "gateway_unavailable",
      requestId,
      hint: "Run GET /api/v1/debug with your API key to verify gateway health and request headers.",
    });
  }
}
