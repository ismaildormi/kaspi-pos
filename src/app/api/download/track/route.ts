import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const body = await req.json().catch(() => ({}));
    const platform = body.platform || "windows";

    const log = await prisma.downloadLog.create({
      data: {
        ip,
        userAgent,
        platform,
      },
    });

    return NextResponse.json({ ok: true, id: log.id });
  } catch (err: any) {
    console.error("[Download Track API Error]:", err);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const count = await prisma.downloadLog.count();
    return NextResponse.json({ count });
  } catch (err: any) {
    return NextResponse.json({ count: 0, error: err?.message }, { status: 500 });
  }
}
