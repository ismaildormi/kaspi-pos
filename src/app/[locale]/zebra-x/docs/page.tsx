import React, { Suspense } from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformDocsView } from "@/components/zebra-portal/PlatformDocsView";

export const metadata = {
  title: "HEYUKA API Docs • Quickstart, Models & FAQ",
  description:
    "Official HEYUKA API Docs: OpenAI SDK /v1 compatibility, $0.00 developer rate, Live Search, and FAQ.",
};

export default function ZebraDocsPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="docs"
      pageTitle="HEYUKA API Docs"
      pageSubtitle="OpenAI /v1 Compatible • $0.00 Coverage & FAQ"
    >
      <Suspense fallback={<div className="py-10 text-xs text-[var(--kaspi-text-muted)]">Loading docs...</div>}>
        <PlatformDocsView />
      </Suspense>
    </HEYUKAPlatformShell>
  );
}
