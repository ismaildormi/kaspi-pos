import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { sanitizeOutboundEndpoint } from "@/lib/security/integration-vault";
import { checkPlanetaryRateLimit } from "@/lib/heyuka/planetary/polyglot-cas-router";
import { renderStyledBrandQrSvg } from "@/lib/zebra-x/tools/qr-architect-engine";

export const dynamic = "force-dynamic";

const DYN_QR_PREFIX = "heyuka_dyn_qr_";

const DynamicQrUpsertSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .regex(/^[a-zA-Z0-9_-]+$/, "Slug must contain letters, numbers, hyphens, or underscores only"),
  targetUrl: z.string().trim().min(8).max(1000),
  title: z.string().trim().max(120).optional(),
  centerLabel: z.string().trim().max(6).optional(),
});

export async function GET(req: NextRequest) {
  const slug = String(req.nextUrl.searchParams.get("slug") || "").trim();
  if (!slug || !/^[a-zA-Z0-9_-]{2,48}$/.test(slug)) {
    return NextResponse.json({ ok: false, error: "Invalid dynamic QR slug" }, { status: 400 });
  }
  const row = await prisma.systemSetting.findUnique({
    where: { providerName: `${DYN_QR_PREFIX}${slug}` },
  });
  if (!row || !row.isActive) {
    return NextResponse.json({ ok: false, error: "Dynamic QR not found" }, { status: 404 });
  }
  const meta = JSON.parse(row.apiKey);
  return NextResponse.json({ ok: true, qr: meta });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = checkPlanetaryRateLimit(`dyn_qr:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = DynamicQrUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid dynamic QR specification", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  let safeTarget: string;
  try {
    safeTarget = sanitizeOutboundEndpoint(parsed.data.targetUrl);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Invalid destination URL" },
      { status: 400 }
    );
  }

  const keyName = `${DYN_QR_PREFIX}${parsed.data.slug}`;
  const existing = await prisma.systemSetting.findUnique({ where: { providerName: keyName } });
  const prevMeta = existing ? JSON.parse(existing.apiKey) : null;

  const origin = (
    req.nextUrl.origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://kaspi-pos.vercel.app"
  ).replace(/\/$/, "");
  const shortUrl = `${origin}/q/${parsed.data.slug}`;

  const payload = {
    slug: parsed.data.slug,
    targetUrl: safeTarget,
    title: parsed.data.title || "Dynamic HEYUKA QR",
    scansCount: Number(prevMeta?.scansCount || 0),
    shortUrl,
    updatedAt: new Date().toISOString(),
  };

  await prisma.systemSetting.upsert({
    where: { providerName: keyName },
    update: { apiKey: JSON.stringify(payload), baseUrl: safeTarget, isActive: true },
    create: {
      providerName: keyName,
      apiKey: JSON.stringify(payload),
      baseUrl: safeTarget,
      isActive: true,
    },
  });

  const svg = renderStyledBrandQrSvg({
    payload: shortUrl,
    sizePx: 220,
    centerLabel: parsed.data.centerLabel || "HYK",
  });

  return NextResponse.json({ ok: true, qr: payload, svg });
}
