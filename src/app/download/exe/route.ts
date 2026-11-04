import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

const WINDOWS_EXE_URL =
  "https://github.com/ismaildormi/kaspi-pos/releases/latest/download/kaspi-pos-setup.exe";

export async function GET(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Track download in database
    await prisma.downloadLog.create({
      data: {
        ip,
        userAgent,
        platform: "windows",
      },
    }).catch((err) => {
      console.warn("[Download Route] Notice: could not record log:", err);
    });
  } catch {
    // Non-blocking
  }

  // Direct 302 redirect to latest GitHub release installer
  return NextResponse.redirect(WINDOWS_EXE_URL, 302);
}
