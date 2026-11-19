import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformOverviewView } from "@/components/zebra-portal/PlatformOverviewView";

export const metadata = {
  title: "HEYUKA AI Platform (KASPI) • Overview & Platform Comparison",
  description:
    "Official KASPI VisionOS Crystal Glass developer platform for HEYUKA: models, SHA-256 API Keys, 7-point Live Debugger, and OpenAI/Microsoft comparison.",
};

export default function XZebraPortalPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="overview"
      pageTitle="HEYUKA AI Platform"
      pageSubtitle="Overview & OpenAI / Microsoft Benchmark"
    >
      <PlatformOverviewView />
    </HEYUKAPlatformShell>
  );
}
