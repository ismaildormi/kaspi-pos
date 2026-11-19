import { NextRequest, NextResponse } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import { generateProductImageUrl } from "@/lib/pollinations";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await authenticateXZebraRequest(req, "images:generate");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const prompt = String(body?.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Provide 'prompt' describing the image." }, { status: 400 });
  }

  const action = String(body?.action || "generate");
  if (action === "web_images") {
    try {
      const wRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
          prompt
        )}&gsrlimit=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=640&format=json`,
        {
          headers: { "User-Agent": "KaspiPOS-HEYUKA/3.0 (https://kaspi-pos.vercel.app)" },
          signal: AbortSignal.timeout(6000),
        }
      );
      const wJson = wRes.ok ? await wRes.json().catch(() => null) : null;
      const pages = wJson?.query?.pages ? Object.values(wJson.query.pages) : [];
      const results = (pages as any[])
        .map((p) => ({
          title: String(p?.title || prompt).replace(/^File:/i, ""),
          imageUrl: String(p?.imageinfo?.[0]?.url || ""),
          thumbUrl: String(p?.imageinfo?.[0]?.thumburl || p?.imageinfo?.[0]?.url || ""),
          proxyUrl: p?.imageinfo?.[0]?.url
            ? `/api/ai/media-tools?action=image_proxy&url=${encodeURIComponent(
                String(p.imageinfo[0].thumburl || p.imageinfo[0].url)
              )}`
            : "",
        }))
        .filter((x) => x.imageUrl);
      return NextResponse.json({
        ok: true,
        mode: "web_images",
        query: prompt,
        results,
        auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
      });
    } catch {
      return NextResponse.json({ ok: true, mode: "web_images", query: prompt, results: [] });
    }
  }

  const imageUrl = generateProductImageUrl(prompt);
  const proxyUrl = `/api/ai/media-tools?action=image_proxy&url=${encodeURIComponent(imageUrl)}`;

  return NextResponse.json({
    ok: true,
    mode: "heyuka_studio_diffusion",
    prompt,
    imageUrl,
    proxyUrl,
    auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
  });
}
