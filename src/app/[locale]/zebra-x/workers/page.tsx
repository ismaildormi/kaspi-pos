import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformWorkersView } from "@/components/zebra-portal/PlatformWorkersView";

export const metadata = {
  title: "Distributed Compute, Workers & Zero-Cost Shield • HEYUKA AI",
  description:
    "Inspect browser WebGPU/WASM capabilities, register revocable Worker servers, and configure tenant-isolated encrypted BYOK API keys.",
};

export default function ZebraWorkersPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="workers"
      pageTitle="Compute & Distributed Workers"
      pageSubtitle="Device Hardware, Revocable Workers & AES-256-GCM BYOK"
    >
      <PlatformWorkersView />
    </HEYUKAPlatformShell>
  );
}
