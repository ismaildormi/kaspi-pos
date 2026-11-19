import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformDebugView } from "@/components/zebra-portal/PlatformDebugView";

export const metadata = {
  title: "Live API Debugger • HEYUKA AI Platform (KASPI)",
  description:
    "Run a live 7-point diagnostic check against any HEYUKA API Key: CORS preflight, hash auth, OpenAI /v1 routing, SSE stream, and Sandbox.",
};

export default function ZebraDebugPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="debug"
      pageTitle="Live API Debugger"
      pageSubtitle="7-Point Key, CORS, SSE & Gateway Diagnostic Suite"
    >
      <PlatformDebugView />
    </HEYUKAPlatformShell>
  );
}
