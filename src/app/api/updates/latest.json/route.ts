import { NextResponse } from "next/server";

export async function GET() {
  const payload = {
    version: "0.1.1",
    notes: "KASPI POS v0.1.1: Super Admin Master Control, UltraMsg WhatsApp automation, and offline sync improvements.",
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": {
        signature: "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHNpZ25hdHVyZQpSV1RFTVBfU0lHTkFUVVJFX1dJTkRPV1NfQklOQVJZX01PQ0tfUEVORElORw==",
        url: "https://github.com/kaspi-pos/releases/download/v0.1.1/Kasbi-POS-Setup-0.1.1.exe"
      },
      "darwin-x86_64": {
        signature: "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHNpZ25hdHVyZQpSV1RFTVBfU0lHTkFUVVJFX01BQ19CSU5BUllfTU9DS19QRU5ESU5H==",
        url: "https://github.com/kaspi-pos/releases/download/v0.1.1/Kasbi-POS-0.1.1.dmg"
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
