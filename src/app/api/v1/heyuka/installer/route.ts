import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const FALLBACK_WINDOWS_BAT = `@echo off
chcp 65001 >nul
title HEYUKA Desktop Launcher (Powered by KASPI)
set HEYUKA_PORTAL=https://kaspi-pos.vercel.app/en/heyuka
where msedge >nul 2>nul && (start "" msedge --app="%HEYUKA_PORTAL%" & goto :END)
where chrome >nul 2>nul && (start "" chrome --app="%HEYUKA_PORTAL%" & goto :END)
start "" "%HEYUKA_PORTAL%"
:END
`;

export async function GET(req: NextRequest) {
  const platform = (req.nextUrl.searchParams.get("platform") || "desktop_zip").toLowerCase();

  if (platform === "desktop_zip" || platform === "zip" || platform === "desktop") {
    const zipPath = path.join(process.cwd(), "public", "downloads", "HEYUKA-Desktop-App.zip");
    if (fs.existsSync(zipPath)) {
      const buf = fs.readFileSync(zipPath);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="HEYUKA-Desktop-App.zip"',
          "Content-Length": String(buf.byteLength),
          "Cache-Control": "public, max-age=300",
        },
      });
    }
  }

  if (platform === "windows" || platform === "bat") {
    const batPath = path.join(process.cwd(), "apps", "heyuka-desktop", "INSTALL_AND_RUN.bat");
    const fallbackBat = path.join(
      process.cwd(),
      "apps",
      "heyuka-desktop",
      "scripts",
      "HEYUKA_Auto_Installer_Windows.bat"
    );
    const scriptBody = fs.existsSync(batPath)
      ? fs.readFileSync(batPath, "utf8")
      : fs.existsSync(fallbackBat)
      ? fs.readFileSync(fallbackBat, "utf8")
      : FALLBACK_WINDOWS_BAT;

    return new NextResponse(scriptBody, {
      status: 200,
      headers: {
        "Content-Type": "application/x-bat; charset=utf-8",
        "Content-Disposition": 'attachment; filename="HEYUKA_Auto_Installer_Windows.bat"',
        "Cache-Control": "no-store",
      },
    });
  }

  const zipExists = fs.existsSync(
    path.join(process.cwd(), "public", "downloads", "HEYUKA-Desktop-App.zip")
  );

  return NextResponse.json({
    product: "HEYUKA Desktop App",
    owner: "KASPI",
    version: "12.0.0",
    platform,
    realDesktopBundleAvailable: zipExists,
    targets: {
      desktopZip: "/downloads/HEYUKA-Desktop-App.zip",
      desktopZipApi: "/api/v1/heyuka/installer?platform=desktop_zip",
      windowsLauncherBat: "/api/v1/heyuka/installer?platform=windows",
      githubReleases: "https://github.com/ismaildormi/kaspi-pos/releases",
      electronCiWorkflow: ".github/workflows/build-heyuka-desktop.yml",
    },
  });
}
