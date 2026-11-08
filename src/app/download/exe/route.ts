import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

const WINDOWS_EXE_URL =
  "https://github.com/ismaildormi/kaspi-pos/releases/latest/download/kaspi-pos-setup.exe";

const PRODUCTION_APP_URL = "https://kaspi-pos.vercel.app";

export async function GET(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Track download in database
    await prisma.downloadLog
      .create({
        data: {
          ip,
          userAgent,
          platform: "windows",
        },
      })
      .catch((err) => {
        console.warn("[Download Route] Notice: could not record log:", err);
      });
  } catch {
    // Non-blocking
  }

  // Verify if the GitHub Release binary is reachable; if so, redirect directly to .exe
  try {
    const check = await fetch(WINDOWS_EXE_URL, {
      method: "HEAD",
      redirect: "follow",
    });
    if (check.ok) {
      return NextResponse.redirect(WINDOWS_EXE_URL, 302);
    }
  } catch {
    // Fallback to native Windows App Launcher below if GitHub asset is building
  }

  // Ready-to-run Windows Desktop App Installer & Launcher pointing strictly to https://kaspi-pos.vercel.app
  const windowsInstallerScript = [
    "@echo off",
    "title KASPI POS - Installation & Lancement Caisse Windows",
    "color 0A",
    "echo ===================================================================",
    "echo   KASPI POS v2.0 - INSTALLATION CAISSE TACTILE WINDOWS (10 / 11)",
    "echo   Serveur Cloud : https://kaspi-pos.vercel.app",
    "echo ===================================================================",
    "echo.",
    'set "SHORTCUT_PATH=%USERPROFILE%\\Desktop\\KASPI POS.url"',
    'echo [InternetShortcut] > "%SHORTCUT_PATH%"',
    `echo URL=${PRODUCTION_APP_URL}/pos >> "%SHORTCUT_PATH%"`,
    `echo IconFile=%SystemRoot%\\System32\\shell32.dll >> "%SHORTCUT_PATH%"`,
    'echo IconIndex=13 >> "%SHORTCUT_PATH%"',
    "echo [OK] Raccourci KASPI POS cree sur votre Bureau Windows.",
    "echo [OK] Lancement de KASPI POS en mode Application Native...",
    `start msedge --app=${PRODUCTION_APP_URL}/pos --start-maximized 2>nul || start chrome --app=${PRODUCTION_APP_URL}/pos --start-maximized 2>nul || start ${PRODUCTION_APP_URL}/pos`,
    "exit",
  ].join("\r\n");

  return new NextResponse(windowsInstallerScript, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="KASPI-POS-Windows-Setup.cmd"',
      "Cache-Control": "no-store",
    },
  });
}
