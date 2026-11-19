import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformPlaygroundView } from "@/components/zebra-portal/PlatformPlaygroundView";

export const metadata = {
  title: "Interactive Playground • HEYUKA AI Platform (KASPI)",
  description:
    "Test HEYUKA Chat Completions SSE streaming and all 13 live REST capabilities interactively in KASPI VisionOS Glass.",
};

export default function ZebraPlaygroundPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="playground"
      pageTitle="Interactive Playground"
      pageSubtitle="Live Chat SSE & 13 REST Capabilities"
    >
      <PlatformPlaygroundView />
    </HEYUKAPlatformShell>
  );
}
