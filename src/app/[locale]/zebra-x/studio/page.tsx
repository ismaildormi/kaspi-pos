import React, { Suspense } from "react";
import { HeyukaUnifiedStudioWorkspace } from "@/components/studio/HeyukaUnifiedStudioWorkspace";

export const metadata = {
  title: "HEYUKA AI Studio • Developer Workbench (/zebra-x/studio)",
  description:
    "Full Google AI Studio parity inside HEYUKA Platform with 18 Cognitive Clusters, Elastic 3/6/12 Swarm, Live Preview, and API Keys.",
};

export default function ZebraStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#131314]" />}>
      <HeyukaUnifiedStudioWorkspace initialBrand="heyuka" />
    </Suspense>
  );
}
