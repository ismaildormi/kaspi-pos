import React, { Suspense } from "react";
import { HeyukaUnifiedStudioWorkspace } from "@/components/studio/HeyukaUnifiedStudioWorkspace";

export const metadata = {
  title: "HEYUKA & KASPI POS Studio • Full Google AI Studio Parity + Elastic 12-Model Swarm",
  description:
    "Unified Dual-Brand AI Studio (HEYUKA Studio & KASPI POS Studio) with System Instructions, Thinking Mode, Structured Outputs, Build Preview, Live Browser, PowerShell, Yjs Multiplayer, and Offline Vault.",
};

export default function UnifiedStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#131314]" />}>
      <HeyukaUnifiedStudioWorkspace initialBrand="heyuka" />
    </Suspense>
  );
}
