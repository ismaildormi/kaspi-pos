import React, { Suspense } from "react";
import { PlatformDocsView } from "@/components/zebra-portal/PlatformDocsView";

export const metadata = {
  title: "HEYUKA API Docs • Quickstart, Models & FAQ",
  description:
    "Official HEYUKA API Docs: OpenAI /v1 compatibility, $0.00 developer rate, Live Search, and FAQ.",
};

export default function ZebraDocsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#141518]" />}>
      <PlatformDocsView />
    </Suspense>
  );
}
