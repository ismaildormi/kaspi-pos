import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";

export const dynamic = "force-dynamic";

const SHARE_PREFIX = "heyuka_share_";

const SharedTurnSchema = z.object({
  id: z.string().max(80).optional(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(32000),
  reasoning: z.string().max(16000).optional(),
  thinkingSec: z.number().min(0).max(300).optional(),
  sources: z
    .array(
      z.object({
        title: z.string().max(200),
        url: z.string().max(500),
        snippet: z.string().max(500).optional(),
      })
    )
    .max(10)
    .optional(),
});

const CreateShareSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  locale: z.enum(["ar", "fr", "en"]).optional(),
  model: z.string().max(64).optional(),
  turns: z.array(SharedTurnSchema).min(1).max(100),
});

export async function GET(req: NextRequest) {
  const id = String(req.nextUrl.searchParams.get("id") || "").trim();
  if (!id || !/^sh_[a-zA-Z0-9_-]{8,40}$/.test(id)) {
    return NextResponse.json({ ok: false, error: "Invalid share link ID." }, { status: 400 });
  }

  try {
    const record = await prisma.systemSetting.findUnique({
      where: { providerName: `${SHARE_PREFIX}${id}` },
    });
    if (!record || !record.isActive) {
      return NextResponse.json({ ok: false, error: "Shared conversation not found." }, { status: 404 });
    }
    const payload = JSON.parse(record.apiKey);
    return NextResponse.json({ ok: true, share: payload });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load shared conversation." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateShareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid shared turns payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  let authorLabel = "HEYUKA Creator";
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    if (ctx.userEmail) {
      authorLabel = ctx.userEmail.split("@")[0] || authorLabel;
    }
  } catch {
    // Allow public link sharing cleanly
  }

  const shareId = `sh_${crypto.randomBytes(8).toString("hex")}`;
  const locale = parsed.data.locale || "en";
  const payload = {
    shareId,
    title:
      parsed.data.title?.trim() ||
      parsed.data.turns.find((t) => t.role === "user")?.content.slice(0, 64) ||
      "Shared HEYUKA Conversation",
    locale,
    model: parsed.data.model || "heyuka-omni",
    authorLabel,
    turns: parsed.data.turns,
    createdAt: new Date().toISOString(),
  };

  try {
    await prisma.systemSetting.create({
      data: {
        providerName: `${SHARE_PREFIX}${shareId}`,
        apiKey: JSON.stringify(payload),
        baseUrl: authorLabel,
        isActive: true,
      },
    });

    const origin =
      req.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://kaspi-pos.vercel.app";

    return NextResponse.json({
      ok: true,
      shareId,
      path: `/${locale}/share/${shareId}`,
      shareUrl: `${origin.replace(/\/$/, "")}/${locale}/share/${shareId}`,
      share: payload,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to persist public share link." },
      { status: 500 }
    );
  }
}
