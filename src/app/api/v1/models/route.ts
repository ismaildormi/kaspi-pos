import { NextRequest } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import {
  HEYUKA_CLOUD_FLEET_GATEWAYS,
  HEYUKA_COSMIC_DOMAINS,
  HEYUKA_CYBER_DEFENSE_FEEDS,
} from "@/lib/heyuka/heyuka-universe";
import { PUBLIC_APIS_CATALOG_COUNT } from "@/lib/zebra-x/tools/public-apis-hub";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function GET(req: NextRequest) {
  const now = Math.floor(Date.now() / 1000);
  const requestId = createRequestId();
  const totalCosmicSources = HEYUKA_COSMIC_DOMAINS.reduce((acc, d) => acc + d.count, 0);

  const hasAuthAttempt = Boolean(
    req.headers.get("authorization") ||
      req.headers.get("x-api-key") ||
      req.headers.get("api-key") ||
      req.headers.get("x-goog-api-key")
  );
  let authCheck: Record<string, unknown> = { checked: false };
  if (hasAuthAttempt) {
    const auth = await authenticateXZebraRequest(req);
    authCheck = auth.ok
      ? {
          checked: true,
          valid: true,
          mode: auth.authMode,
          keyId: auth.keyId || null,
          label: auth.keyMeta?.label || null,
          scopes: auth.keyMeta?.scopes || [],
        }
      : {
          checked: true,
          valid: false,
          status: auth.status,
          error: auth.error,
        };
  }

  return apiJsonResponse(
    {
      object: "list",
      provider: "HEYUKA by KASPI",
      requestId,
      authCheck,
      capabilities: {
        totalCosmicSources,
        totalCyberDefenseFeeds: HEYUKA_CYBER_DEFENSE_FEEDS.length,
        cloudFleetGateways: HEYUKA_CLOUD_FLEET_GATEWAYS.length,
        noKeyPublicApiCategories: PUBLIC_APIS_CATALOG_COUNT,
        openaiCompatibleChatEndpoint: "/api/v1/chat/completions",
        debugEndpoint: "/api/v1/debug",
      },
      data: [
        {
          id: "heyuka-omni",
          object: "model",
          created: now,
          owned_by: "kaspi",
          context_window: 128000,
          capabilities: ["reasoning", "code", "vision", "tools", "arabic-darija-french-english"],
          description:
            "HEYUKA Omni — Unified flagship multimodal and agentic intelligence combining HEYUKA-Core, HEYUKA-Vision, code execution, and live research.",
        },
        {
          id: "heyuka-core",
          object: "model",
          created: now,
          owned_by: "kaspi",
          context_window: 128000,
          capabilities: ["reasoning", "code", "math", "tools", "multilingual"],
          description:
            "HEYUKA Core — Strategic reasoning, software engineering, precise math/tax logic, real-time knowledge feeds, and multilingual fluency.",
        },
        {
          id: "heyuka-vision",
          object: "model",
          created: now,
          owned_by: "kaspi",
          context_window: 128000,
          capabilities: ["vision", "image-gen", "cutout", "3d", "audio"],
          description:
            "HEYUKA Vision — Multimodal perception, studio image synthesis, background cutout, 3D scene workflows, and speech intelligence.",
        },
        {
          id: "x-core",
          object: "model",
          created: now,
          owned_by: "kaspi",
          description: "Backward-compatible alias mapped directly to heyuka-core.",
        },
        {
          id: "zebra-vision",
          object: "model",
          created: now,
          owned_by: "kaspi",
          description: "Backward-compatible alias mapped directly to heyuka-vision.",
        },
      ],
    },
    200,
    { "X-Request-Id": requestId }
  );
}
