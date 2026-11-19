import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { generateProductImageUrl } from "@/lib/pollinations";

export const dynamic = "force-dynamic";

function isForbiddenHost(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return true;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "0.0.0.0" ||
      host === "169.254.169.254" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.endsWith(".internal") ||
      host.endsWith(".local")
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export interface WebImageResult {
  title: string;
  imageUrl: string;
  thumbUrl: string;
  source: string;
}

const WIKI_UA = "KaspiPOS/1.0 (https://kaspi-pos.vercel.app)";

async function searchWikimediaImages(query: string): Promise<WebImageResult[]> {
  try {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      query
    )}&gsrlimit=8&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=520&format=json&origin=*`;
    const res = await fetch(endpoint, {
      headers: { "User-Agent": WIKI_UA },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
    const results: WebImageResult[] = [];
    for (const p of pages as any[]) {
      const info = p?.imageinfo?.[0];
      const mime = String(info?.mime || "");
      if (!info?.url || (!mime.includes("image/jpeg") && !mime.includes("image/png") && !mime.includes("image/webp"))) {
        continue;
      }
      results.push({
        title: String(p?.title || query).replace(/^File:/i, "").replace(/\.[^.]+$/, ""),
        imageUrl: String(info.url),
        thumbUrl: String(info.thumburl || info.url),
        source: "Wikimedia Commons",
      });
    }
    return results;
  } catch {
    return [];
  }
}

async function searchWikipediaPageImages(query: string): Promise<WebImageResult[]> {
  try {
    const endpoint = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrlimit=6&prop=pageimages&piprop=thumbnail|original&pithumbsize=520&format=json`;
    const res = await fetch(endpoint, {
      headers: { "User-Agent": WIKI_UA },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
    const results: WebImageResult[] = [];
    for (const p of pages as any[]) {
      const thumb = p?.thumbnail?.source;
      const orig = p?.original?.source || thumb;
      if (!thumb || isForbiddenHost(String(orig))) continue;
      results.push({
        title: String(p?.title || query),
        imageUrl: String(orig),
        thumbUrl: String(thumb),
        source: "Wikipedia",
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * GET /api/ai/media-tools
 * ?action=web_images&q=... -> Real web product photo search (Openverse + Wikimedia Commons)
 * ?action=image_proxy&url=... -> SSRF-guarded CORS proxy so @imgly/background-removal & UI read pixels cleanly
 */
export async function GET(req: NextRequest) {
  try {
    await getRequestContext().catch(() => null);
    const action = req.nextUrl.searchParams.get("action") || "web_images";

    if (action === "image_proxy") {
      const targetUrl = req.nextUrl.searchParams.get("url") || "";
      if (!targetUrl || isForbiddenHost(targetUrl)) {
        return NextResponse.json({ error: "Invalid or blocked image URL" }, { status: 400 });
      }
      const parsedTarget = new URL(targetUrl);
      if (parsedTarget.username || parsedTarget.password) {
        return NextResponse.json({ error: "URL credentials disallowed" }, { status: 400 });
      }
      const reconstructed = new URL(`${parsedTarget.pathname}${parsedTarget.search}`, parsedTarget.origin);
      const upstream = await fetch(reconstructed.href, {
        headers: { "User-Agent": WIKI_UA },
        redirect: "error",
        signal: AbortSignal.timeout(12000),
      });
      if (!upstream.ok) {
        return NextResponse.json({ error: `Upstream HTTP ${upstream.status}` }, { status: 502 });
      }
      const contentType = upstream.headers.get("content-type") || "image/png";
      if (!contentType.startsWith("image/")) {
        return NextResponse.json({ error: "Target is not an image" }, { status: 400 });
      }
      const bytes = await upstream.arrayBuffer();
      if (bytes.byteLength > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Image exceeds 10MB limit" }, { status: 413 });
      }
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (!q) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const [wikiImgs, commonsImgs] = await Promise.all([
      searchWikipediaPageImages(q),
      searchWikimediaImages(q),
    ]);
    const combined = [...wikiImgs, ...commonsImgs].slice(0, 12);

    return NextResponse.json({
      success: true,
      query: q,
      count: combined.length,
      results: combined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Media tool failed" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/media-tools
 * { action: "generate_image" | "web_images", prompt: string }
 */
export async function POST(req: NextRequest) {
  try {
    await getRequestContext().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "generate_image");
    const prompt = String(body?.prompt || body?.query || "").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (action === "web_images") {
      const [wikiImgs, commonsImgs] = await Promise.all([
        searchWikipediaPageImages(prompt),
        searchWikimediaImages(prompt),
      ]);
      const combined = [...wikiImgs, ...commonsImgs].slice(0, 12);
      return NextResponse.json({ success: true, query: prompt, results: combined });
    }

    // Real AI image URL generation (Pollinations + AI Horde async fallback URL)
    const imageUrl = generateProductImageUrl(prompt);
    let hordeJobId: string | null = null;
    try {
      const hordeRes = await fetch("https://aihorde.net/api/v2/generate/async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: "0000000000",
          "Client-Agent": "kaspi-pos:1.0:ai",
        },
        body: JSON.stringify({
          prompt: `${prompt}, commercial product photography, clean studio lighting`,
          params: { n: 1, width: 512, height: 512, steps: 20 },
        }),
        signal: AbortSignal.timeout(4500),
      });
      if (hordeRes.ok) {
        const hJson = await hordeRes.json().catch(() => null);
        hordeJobId = hJson?.id || null;
      }
    } catch {
      // Pollinations URL still returned directly
    }

    return NextResponse.json({
      success: true,
      prompt,
      imageUrl,
      proxyImageUrl: `/api/ai/media-tools?action=image_proxy&url=${encodeURIComponent(imageUrl)}`,
      hordeJobId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Image generation error" },
      { status: 500 }
    );
  }
}
