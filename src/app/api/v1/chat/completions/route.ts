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
import {
  classifyCognitiveIntentAndSources,
  getTotalIntegratedCapabilitiesCount,
} from "@/lib/zebra-x/core/cognitive-brain-registry";
import {
  buildSovereignVaultLockManifest,
  resolveVaultEntryWithMirrorFallback,
  searchSovereignVault,
} from "@/lib/heyuka/vault/sovereign-permanent-vault";
import {
  buildAtoZProjectDirectorBundle,
  buildImageStudioPipelineBundle,
  buildPhotorealistic3DFurEyesBundle,
  buildPhotorealisticCinemaVideoBundle,
} from "@/lib/heyuka/tools/photorealistic-video-builder";
import {
  exportEvolutionChatMlDataset,
  getSelfEvolutionContextForPrompt,
  recordProductSelfEvolution,
} from "@/lib/heyuka/learning/self-evolution-engine";

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

    querySovereignSourceVault: tool({
      description:
        "Search ALL 1,100+ pre-classified open-source engines, datasets, GithubSignals/AskGPTs repos, and Permanent Sovereign Vault mirrors (v7..v39), guaranteed offline/dead-link safe.",
      inputSchema: z.object({
        query: z.string().optional(),
        pack: z.string().optional(),
        offlineMode: z.boolean().optional(),
        limit: z.number().int().min(1).max(30).optional().default(12),
      }),
      execute: async (input) => {
        const hits = searchSovereignVault({
          query: input.query,
          pack: input.pack,
          limit: input.limit,
        });
        const firstResolved = input.query
          ? resolveVaultEntryWithMirrorFallback(input.query, { offlineMode: input.offlineMode })
          : null;
        return {
          unlimited: true,
          manifest: buildSovereignVaultLockManifest(),
          matches: hits,
          firstResolvedMirror: firstResolved,
        };
      },
    }),

    buildPhotorealisticVideoStudio: tool({
      description:
        "Generate a structured, multi-scene Photorealistic Long-Horizon Cinema Video pipeline (v34.0: SkyReels-V2, FramePack, OpenColorIO ACES, MMAudio, OpenTimelineIO) with a runnable client HTML5/WebAudio player.",
      inputSchema: z.object({
        prompt: z.string().min(2),
      }),
      execute: async ({ prompt }) => buildPhotorealisticCinemaVideoBundle(prompt),
    }),

    buildImageMattingInpaintTypography: tool({
      description:
        "Generate a client-GPU Image Studio bundle (v36.0: FLUX.1, BiRefNet 4K Matting, LaMa Inpainting, AnyText2 Arabic/Latin Typography).",
      inputSchema: z.object({
        prompt: z.string().min(2),
      }),
      execute: async ({ prompt }) => buildImageStudioPipelineBundle(prompt),
    }),

    build3DFurEyesRealismScene: tool({
      description:
        "Generate a photorealistic 3D Fur Shell-Texturing + Wet Cornea (IOR 1.38 Clearcoat) Viewer + React Three Fiber component (v37.0: TRELLIS, Hunyuan3D-2, MeshPhysicalMaterial).",
      inputSchema: z.object({
        prompt: z.string().min(2),
      }),
      execute: async ({ prompt }) => buildPhotorealistic3DFurEyesBundle(prompt),
    }),

    orchestrateAtoZProjectDeploy: tool({
      description:
        "Build an A-to-Z Project Director execution plan, modern Next.js/React 19 stack, parallel web research links, and deployment config (v38.0 + v39.0).",
      inputSchema: z.object({
        prompt: z.string().min(2),
      }),
      execute: async ({ prompt }) => buildAtoZProjectDirectorBundle(prompt),
    }),

    inspectAndLearnEvolution: tool({
      description:
        "Record product evolution feedback or export ChatML JSONL training traces so HEYUKA continuously learns from every built artifact.",
      inputSchema: z.object({
        action: z.enum(["export_jsonl", "record"]),
        prompt: z.string().optional(),
        productKind: z
          .enum(["video", "3d", "image", "code", "document", "project", "research"])
          .optional(),
        sourcesUsed: z.array(z.string()).optional(),
      }),
      execute: async (input) => {
        if (input.action === "export_jsonl") {
          return exportEvolutionChatMlDataset();
        }
        return recordProductSelfEvolution({
          prompt: input.prompt || lastUserText,
          clusterId: cognitiveRoute.primaryCluster.id,
          productKind: input.productKind || "project",
          sourcesUsed: input.sourcesUsed || ["Sovereign Vault"],
          outputFormats: ["JSON", "Code"],
          artifactCount: 1,
          totalBytes: 1024,
        });
      },
    }),
  };

  const cognitiveRoute = classifyCognitiveIntentAndSources(lastUserText, expectedLocale);
  const vaultContextHits = searchSovereignVault({
    query: lastUserText,
    clusterId: cognitiveRoute.primaryCluster.id,
    limit: 10,
  });
  const totals = getTotalIntegratedCapabilitiesCount();
  const evolutionHints = getSelfEvolutionContextForPrompt({
    prompt: lastUserText,
    clusterId: cognitiveRoute.primaryCluster.id,
  });

  const baseSystem = `You are HEYUKA (${requestedModel}), the Sovereign Unified AI Model owned by KASPI.
UNLIMITED SOVEREIGN EXECUTION POLICY (0 Request Limits): All computation executes on caller hardware (WebGPU/WASM/Canvas/Three.js) or caller-connected server at $0.00 owner cost.
You have FULL live access to ALL ${totals.grandTotalSources}+ Permanently Vaulted & Pre-Classified Sources (v7..v39), including Web Research, ${totals.livePublicApisCount} Live Public APIs, Sandbox Execution, Long Cinema Video Studio (v34.0), Image/Inpainting/Arabic Typography Studio (v36.0), 3D Fur/Eyes Realism (v37.0), A-to-Z Project Director (v38.0), Parallel Multi-Site Research (v39.0), Permanent Mirror Vault (v35.0+v35.1), and Continuous Self-Evolution.
Matched Vault Engines for this prompt: ${vaultContextHits.map((v) => `${v.name} [${v.vaultUri}]`).join(", ")}.
Learned Evolution Memory: ${evolutionHints.evolutionSummary}
Always answer accurately, honestly, and clearly in the user's language (Arabic/Darija/French/English). Never disclose internal paid upstream provider names.
Planned Route: ${routePlan.complexity}${
    callerSystem ? `\n\nCaller Context:\n${callerSystem}` : ""
  }`;

  const callerComputeUrl =
    req.headers.get("x-heyuka-compute-url") ||
    req.headers.get("x-client-llm-url") ||
    (typeof body?.computeEndpoint === "string" ? body.computeEndpoint : undefined);

  const policyDecision = await evaluateZeroCostPolicy({
    tenantId: auth.tenantId,
    callerComputeUrl,
  });

  try {
    const result = await generateTextWithRouter({
      system: baseSystem,
      messages: chatMessages,
      governance: {
        tenantId: auth.tenantId,
        allowOwnerPaidProviders: false,
        callerComputeUrl,
        callerModelId: typeof body?.computeModel === "string" ? body.computeModel : requestedModel,
      },
      ...(enableTools ? { tools: heyukaApiTools, stopWhen: stepCountIs(5) } : {}),
    } as any);

    await recordTenantFreeTierUsage(auth.tenantId).catch(() => {});

    const audited = runPreReplyReflectionGate({
      draftText: String(result.text || ""),
      expectedLocale,
    });

    const evoResult = recordProductSelfEvolution({
      prompt: lastUserText,
      clusterId: cognitiveRoute.primaryCluster.id,
      productKind: "project",
      sourcesUsed: vaultContextHits.map((v) => v.name),
      outputFormats: cognitiveRoute.primaryCluster.outputFormats,
      artifactCount: Array.isArray((result as any).studioFiles) ? (result as any).studioFiles.length : 1,
      totalBytes: audited.cleanedText.length,
      executionMode: callerComputeUrl ? "caller_server" : "client_cpu",
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
          unlimited: true,
          dailyRequestLimit: null,
          clientComputeFirst: true,
          executionTier: policyDecision.tier,
          vaultedSourcesCount: totals.grandTotalSources,
          matchedVaultSources: vaultContextHits.map((v) => ({ name: v.name, vaultUri: v.vaultUri, url: v.url })),
          evolutionTraceId: evoResult.trace.traceId,
          learnedTracesTotal: evoResult.totalLearnedTraces,
          studioFiles: (result as any).studioFiles || undefined,
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
