import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const FALLBACK_WINDOWS_BAT = `@echo off
chcp 65001 >nul
title HEYUKA Desktop OS Installer (Powered by KASPI)
set HEYUKA_PORTAL=https://kaspi-pos.vercel.app/ar/heyuka
where msedge >nul 2>nul && (start "" msedge --app="%HEYUKA_PORTAL%" & goto :END)
where chrome >nul 2>nul && (start "" chrome --app="%HEYUKA_PORTAL%" & goto :END)
start "" "%HEYUKA_PORTAL%"
:END
echo HEYUKA Desktop OS by KASPI launched cleanly.
`;

export async function GET(req: NextRequest) {
  const platform = (req.nextUrl.searchParams.get("platform") || "windows").toLowerCase();

  if (platform === "windows" || platform === "bat") {
    const batPath = path.join(
      process.cwd(),
      "apps",
      "heyuka-desktop",
      "scripts",
      "HEYUKA_Auto_Installer_Windows.bat"
    );
    const scriptBody = fs.existsSync(batPath)
      ? fs.readFileSync(batPath, "utf8")
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

  return NextResponse.json({
    product: "HEYUKA Desktop App",
    owner: "KASPI",
    version: "12.0.0",
    platform,
    targets: {
      windows: {
        autoInstallerUrl: "/api/v1/heyuka/installer?platform=windows",
        packagingTargets: ["Windows 10/11 x64 Installer (.exe)", "One-Click Bootstrapper (.bat)"],
        windowsDesktopBridge: "/download/exe",
      },
      macos: {
        packagingTargets: ["Universal DMG (Apple Silicon & Intel)", "Signed ZIP Bundle"],
        requirements: "macOS 13+ (Apple Silicon M1/M2/M3/M4 or Intel x64)",
      },
      linux: {
        packagingTargets: ["AppImage (x64)", "Flatpak", "Snap"],
        requirements: "Ubuntu 22.04+, Fedora, Debian, or Arch with WebGL2/Vulkan",
      },
    },
  });
}
