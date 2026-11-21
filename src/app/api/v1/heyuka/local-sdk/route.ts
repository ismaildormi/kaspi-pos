import { NextRequest, NextResponse } from "next/server";
import {
  buildPortableLocalApiBundleFiles,
  detectUniversalWorldLanguage,
  runLocalOnDeviceHeyukaBrain,
} from "@/lib/heyuka/local-sovereign-brain";
import {
  COGNITIVE_BRAIN_CLUSTERS,
  getTotalIntegratedCapabilitiesCount,
} from "@/lib/zebra-x/core/cognitive-brain-registry";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Heyuka-Client",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const downloadKind = req.nextUrl.searchParams.get("download");
  const bundleFiles = buildPortableLocalApiBundleFiles();
  const totals = getTotalIntegratedCapabilitiesCount();

  if (downloadKind === "server") {
    const serverFile = bundleFiles.find((f) => f.path === "heyuka-local-api-server.mjs")!;
    return new NextResponse(serverFile.content, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/javascript; charset=utf-8",
        "Content-Disposition": 'attachment; filename="heyuka-local-api-server.mjs"',
      },
    });
  }

  if (downloadKind === "sdk") {
    const sdkFile = bundleFiles.find((f) => f.path === "heyuka-mobile-browser-sdk.js")!;
    return new NextResponse(sdkFile.content, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/javascript; charset=utf-8",
        "Content-Disposition": 'attachment; filename="heyuka-mobile-browser-sdk.js"',
      },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      engine: "HEYUKA Portable Local Sovereign API & Mobile SDK v29.0",
      cost: "$0.00",
      offlineReady: true,
      supportedPlatforms: [
        "Local Node.js / Bun / Deno Server (http://127.0.0.1:4040)",
        "Android / iOS / Capacitor / React Native / Termux Mobile",
        "Browser WebWorker / PWA On-Device CPU",
        "Tauri / Electron Desktop OS",
      ],
      totals,
      clusters: COGNITIVE_BRAIN_CLUSTERS.map((c) => ({
        id: c.id,
        badge: `${c.badgeIcon} ${c.titleEn}`,
        titleAr: c.titleAr,
        enginesCount: c.enginesCount,
        outputFormats: c.outputFormats,
      })),
      downloadEndpoints: {
        localServerScript: "/api/v1/heyuka/local-sdk?download=server",
        mobileBrowserSdk: "/api/v1/heyuka/local-sdk?download=sdk",
      },
      bundleFiles,
    },
    { status: 200, headers: CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const lastMessageContent =
      messages.length > 0 ? String(messages[messages.length - 1]?.content || "") : "";
    const prompt = String(body?.prompt || lastMessageContent || "Hello HEYUKA").trim();
    const locale: "ar" | "fr" | "en" =
      body?.locale === "ar" || body?.locale === "fr" || body?.locale === "en"
        ? body.locale
        : "ar";
    const mode = String(body?.mode || "auto");

    const lang = detectUniversalWorldLanguage(prompt, locale);
    const localRes = runLocalOnDeviceHeyukaBrain({
      prompt,
      mode,
      locale: lang.shortLocale,
    });

    return NextResponse.json(
      {
        ok: true,
        id: `heyuka-local-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "heyuka-local-omni",
        provider: localRes.provider,
        detectedLanguage: localRes.detectedLanguage,
        answer: localRes.answer,
        sources: localRes.sources,
        studioFiles: localRes.studioFiles,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: localRes.answer,
            },
            finish_reason: "stop",
          },
        ],
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || "Local SDK request error") },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
