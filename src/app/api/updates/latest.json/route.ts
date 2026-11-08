import { NextResponse } from "next/server";

export async function GET() {
  const payload = {
    version: "0.1.0",
    notes: "KASPI POS v0.1.0: Super Admin Master Control, Multi-Tenant Architecture, Gmail OTP Authentication, and Offline-first SQLite Sync.",
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": {
        signature: "",
        url: "https://github.com/ismaildormi/kaspi-pos/releases/latest/download/kaspi-pos-setup.exe"
      },
      "darwin-x86_64": {
        signature: "",
        url: "https://github.com/ismaildormi/kaspi-pos/releases/latest/download/kaspi-pos-mac.dmg"
      }
    }
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
