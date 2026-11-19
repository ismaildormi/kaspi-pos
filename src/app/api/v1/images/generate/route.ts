import { NextRequest } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiOptionsResponse,
  createRequestId,
} from "@/lib/zebra-x/api-response";
import { generateProductImageUrl } from "@/lib/pollinations";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return createApiOptionsResponse();
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const auth = await authenticateXZebraRequest(req, "images:generate");
  if (!auth.ok) {
    return apiErrorResponse({
      status: auth.status,
      message: auth.error,
      type: auth.status === 403 ? "permission_error" : "authentication_error",
      requestId,
    });
  }

  const body = await req.json().catch(() => ({}));
  const prompt = String(body?.prompt || "").trim();
  if (!prompt) {
    return apiErrorResponse({
      status: 400,
      message: "Provide 'prompt' describing the image.",
      type: "invalid_request_error",
      requestId,
    });
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
      return apiJsonResponse(
        {
          ok: true,
          requestId,
          mode: "web_images",
          query: prompt,
          results,
          auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
        },
        200,
        { "X-Request-Id": requestId }
      );
    } catch {
      return apiJsonResponse(
        { ok: true, requestId, mode: "web_images", query: prompt, results: [] },
        200,
        { "X-Request-Id": requestId }
      );
    }
  }

  const imageUrl = generateProductImageUrl(prompt);
  const proxyUrl = `/api/ai/media-tools?action=image_proxy&url=${encodeURIComponent(imageUrl)}`;

  return apiJsonResponse(
    {
      ok: true,
      requestId,
      mode: "heyuka_studio_diffusion",
      prompt,
      imageUrl,
      proxyUrl,
      auth: { mode: auth.authMode, keyId: auth.keyId || null, tenantId: auth.tenantId },
    },
    200,
    { "X-Request-Id": requestId }
  );
}
