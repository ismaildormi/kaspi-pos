import { NextResponse } from "next/server";
import {
  HEYUKA_CLOUD_FLEET_GATEWAYS,
  HEYUKA_COSMIC_DOMAINS,
  HEYUKA_CYBER_DEFENSE_FEEDS,
} from "@/lib/heyuka/heyuka-universe";
import { PUBLIC_APIS_CATALOG_COUNT } from "@/lib/zebra-x/tools/public-apis-hub";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Math.floor(Date.now() / 1000);
  const totalCosmicSources = HEYUKA_COSMIC_DOMAINS.reduce((acc, d) => acc + d.count, 0);

  return NextResponse.json({
    object: "list",
    provider: "HEYUKA by KASPI",
    capabilities: {
      totalCosmicSources,
      totalCyberDefenseFeeds: HEYUKA_CYBER_DEFENSE_FEEDS.length,
      cloudFleetGateways: HEYUKA_CLOUD_FLEET_GATEWAYS.length,
      noKeyPublicApiCategories: PUBLIC_APIS_CATALOG_COUNT,
      openaiCompatibleChatEndpoint: "/api/v1/chat/completions",
    },
    data: [
      {
        id: "heyuka-core",
        object: "model",
        created: now,
        owned_by: "kaspi",
        description:
          "HEYUKA Core — Strategic reasoning, software engineering, precise math/tax logic, real-time knowledge feeds, and multilingual fluency.",
      },
      {
        id: "heyuka-vision",
        object: "model",
        created: now,
        owned_by: "kaspi",
        description:
          "HEYUKA Vision — Multimodal perception, studio image synthesis, background cutout, 3D scene workflows, and speech intelligence.",
      },
      {
        id: "heyuka-omni",
        object: "model",
        created: now,
        owned_by: "kaspi",
        description:
          "HEYUKA Omni — Unified flagship multimodal and agentic intelligence combining HEYUKA-Core, HEYUKA-Vision, code execution, and live research.",
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
  });
}
