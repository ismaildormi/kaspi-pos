import {
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { PUBLIC_APIS_CATALOG_COUNT } from "@/lib/zebra-x/tools/public-apis-hub";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function GET() {
  const requestId = createRequestId();
  return apiJsonResponse(
    {
      openapi: "3.1.0",
      info: {
        title: "HEYUKA AI Platform API (KASPI)",
        version: "15.0.0",
        description:
          "Unified OpenAI-compatible sovereign AI platform by KASPI for reasoning, multilingual chat completions, vision analysis, image synthesis, 3D workflows, audio processing, real-time web intelligence, and isolated code execution.",
      },
      servers: [{ url: "/" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "hk-live-...",
          },
          keyIdHeader: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key-Id",
          },
        },
      },
      security: [{ bearerAuth: [] }],
      "x-zebra-platform": {
        owner: "KASPI",
        unlimitedRequests: true,
        dailyRequestLimit: null,
        clientComputeHeader: "X-HEYUKA-Compute-URL",
        models: ["heyuka-omni", "heyuka-core", "heyuka-vision"],
        noKeyPublicApisCount: PUBLIC_APIS_CATALOG_COUNT,
        cognitiveClustersCount: 18,
        sovereignVaultEndpoint: "/api/v1/heyuka/local-sdk?vault=1",
        osAndBotEndpoints: [
          "/api/v1/desktops/spawn",
          "/api/v1/os/exec",
          "/api/v1/ai-pc/control",
          "/api/v1/studio/council",
          "/api/v1/studio/browser-factory",
          "/api/v1/studio/team",
          "/api/v1/magic",
        ],
        openaiCompatible: true,
        debugEndpoint: "/api/v1/debug",
      },
      paths: {
        "/api/v1/models": {
          get: {
            operationId: "listHeyukaModels",
            summary: "List available HEYUKA Sovereign AI models and live platform capabilities.",
            responses: { "200": { description: "OpenAI-compatible model catalog JSON" } },
          },
        },
        "/api/v1/debug": {
          get: {
            operationId: "debugApiKeyDiagnostics",
            summary: "Verify API key validity, Key ID match, active scopes, and gateway health.",
            responses: { "200": { description: "Live gateway & API key diagnostics JSON" } },
          },
        },
        "/api/v1/chat/completions": {
        post: {
          operationId: "createChatCompletion",
          summary:
            "Create multi-turn OpenAI-compatible chat completions with optional autonomous web, math, data, and code execution tools.",
          responses: { "200": { description: "OpenAI ChatCompletion JSON or SSE stream" } },
        },
      },
      "/api/v1/public-apis": {
        post: {
          operationId: "queryPublicApiCatalog",
          summary:
            "Query live verified global data feeds (currency rates, weather, scientific literature, market telemetry, and security advisories).",
          responses: { "200": { description: "Normalized live data JSON payload" } },
        },
      },
      "/api/v1/images/generate": {
        post: {
          operationId: "generateStudioImage",
          summary: "Generate studio visuals from natural language prompts or search high-resolution media assets.",
          responses: { "200": { description: "Generated image URLs and proxy URIs" } },
        },
      },
      "/api/v1/sandbox/execute": {
        post: {
          operationId: "executeCodeSandbox",
          summary: "Execute Python, JavaScript, TypeScript, Go, PHP, C++, or Bash snippets inside an isolated sandbox.",
          responses: { "200": { description: "Execution stdout, stderr, and exitCode" } },
        },
      },
      "/api/v1/web/research": {
        post: {
          operationId: "runWebResearch",
          summary: "Perform live web research or retrieve structured Markdown content from public URLs.",
          responses: { "200": { description: "Search snippets or clean extracted Markdown" } },
        },
      },
      "/api/v1/vision/remove-bg": {
        post: {
          operationId: "removeImageBackground",
          summary: "Produce crisp transparent PNG foreground cutouts from product photos or portraits.",
          responses: { "200": { description: "Transparent foreground asset result" } },
        },
      },
      "/api/v1/3d/assets": {
        get: {
          operationId: "listThreeDAssets",
          summary: "Browse studio 3D meshes, PBR materials, HDRI lighting, and transparent textures.",
          responses: { "200": { description: "Catalog of 3D assets and materials" } },
        },
      },
      "/api/v1/3d/generate": {
        post: {
          operationId: "generateThreeDMesh",
          summary: "Generate or prepare downloadable 3D mesh scenes (.glb, .fbx, .blend) from prompts.",
          responses: { "200": { description: "3D scene generation job output" } },
        },
      },
      "/api/v1/audio/transcribe": {
        post: {
          operationId: "transcribeAudioOrVideo",
          summary: "Transcribe multilingual audio and video streams (Arabic, Darija, Tarifit, French, English).",
          responses: { "200": { description: "Timestamped transcript JSON" } },
        },
      },
      "/api/v1/audio/separate": {
        post: {
          operationId: "separateVocalAndMusicStems",
          summary: "Isolate vocal and instrumental audio stems from mixed tracks.",
          responses: { "200": { description: "Separated stem asset references" } },
        },
      },
      "/api/v1/zebra-x/auto-connect": {
        post: {
          operationId: "autoDiscoverOpenApi",
          summary: "Connect external OpenAPI/Swagger specifications into your tenant's authenticated HEYUKA workspace.",
          responses: { "200": { description: "Registered connector metadata & available operations" } },
        },
      },
      "/api/v1/desktops/spawn": {
        get: {
          operationId: "listVirtualDesktopBots",
          summary: "List isolated Virtual Desktop Bot Farm sessions (v52.0 KasmVNC / Neko / Webtop).",
          responses: { "200": { description: "Active isolated desktop bots JSON" } },
        },
        post: {
          operationId: "spawnOrControlVirtualDesktopBot",
          summary:
            "Spawn, pause for human takeover, resume, or destroy isolated Virtual Desktop bots with dedicated virtual mouse/keyboard and live screen/audio streams (v52.0).",
          responses: { "200": { description: "Virtual desktop bot session & Docker/KasmVNC stack" } },
        },
      },
      "/api/v1/os/exec": {
        get: {
          operationId: "getSovereignOsCapabilities",
          summary: "Inspect v53.0 Sovereign OS Shell, File Surgeon (.yuka-bak + Send2Trash), and 24/7 Sentinel status.",
          responses: { "200": { description: "OS execution capabilities & POS_CORE_LOCK safety status" } },
        },
        post: {
          operationId: "executeSovereignOsAndFileSurgeon",
          summary:
            "Generate and dispatch PowerShell/Bash shell commands, reversible DOCX/XLSX/PDF File Surgeon plans, Any-App UIA actions, or 24/7 Watchdog/osquery sentinel probes (v53.0).",
          responses: { "200": { description: "OS control plan and scripts with safety guarantees" } },
        },
      },
      "/api/v1/ai-pc/control": {
        get: {
          operationId: "getAiComputerPanicAndVisionState",
          summary: "Inspect v54.0 AI Computer OS state, Esc+Esc Panic Stop state, and Webcam Vision / Smooth Scroll engines.",
          responses: { "200": { description: "AI Computer OS runtime state" } },
        },
        post: {
          operationId: "controlAiComputerVisionScrollPanic",
          summary:
            "Execute v54.0 smooth mouse Scroll/Zoom, self-unblocking fallback chain, live OpenCV/MediaPipe Webcam sight, or 0ms Esc+Esc Hardware Panic Stop.",
          responses: { "200": { description: "AI Computer action dispatch JSON" } },
        },
      },
      "/api/v1/studio/council": {
        get: {
          operationId: "getStudioElasticCouncilPresets",
          summary: "List Dual-Brand Studio starter templates & Elastic 3->6->12 swarm configurations (v55.0 + v56.0).",
          responses: { "200": { description: "Elastic council config JSON" } },
        },
        post: {
          operationId: "runElasticModelCouncilSwarm",
          summary: "Evaluate complexity and dispatch 3, 6, or 12 cooperating specialist models + Worker Bots (v56.0).",
          responses: { "200": { description: "12-node swarm plan, edges & worker bot logs" } },
        },
      },
      "/api/v1/studio/browser-factory": {
        post: {
          operationId: "planBrowserAutopilotCloudFactory",
          summary: "Orchestrate Human-in-the-Loop OAuth/Gmail handshake & multi-cloud GitHub/Vercel/Supabase/Docker provisioning (v57.0).",
          responses: { "200": { description: "Persistent browser & CLI cloud factory manifest" } },
        },
      },
      "/api/v1/studio/team": {
        get: {
          operationId: "getStudioTeamGamificationAndOffline",
          summary: "Inspect v59.0 Multiplayer Kanban/RBAC/Gamification XP & v60.0 Air-Gapped Offline Manifest.",
          responses: { "200": { description: "Team XP/badges + offline manifest" } },
        },
        post: {
          operationId: "awardStudioTeamXpOrFetchOffline",
          summary: "Record collaborative XP/badge milestones or fetch v60.0 air-gapped bundle manifest.",
          responses: { "200": { description: "Updated XP progression JSON" } },
        },
      },
      "/api/v1/magic": {
        get: {
          operationId: "describeMagicPromptAndSwarmEngine",
          summary: "Inspect Magic Prompt Refinement, Strict Disambiguation, and Elastic 3/6/12 Swarm synthesis status.",
          responses: { "200": { description: "Magic engine capabilities JSON" } },
        },
        post: {
          operationId: "executeMagicPromptAndSwarm",
          summary: "Enhance any prompt, resolve strict v52-v60 routing, run Elastic Swarm planning, and synthesize Studio files.",
          responses: { "200": { description: "Magic enhancement + Studio artifacts JSON" } },
        },
      },
    },
  });
}
