import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformLabView } from "@/components/zebra-portal/PlatformLabView";

export const metadata = {
  title: "Autonomous Testing Lab • HEYUKA AI Ecosystem",
  description:
    "Execute genuine multi-modal benchmarks, verify endpoints with SHA-256 provenance, and export HEYUKA_FULL_BENCHMARK.zip with Excel & Manifest.",
};

export default function ZebraLabPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="lab"
      pageTitle="Autonomous Testing Lab"
      pageSubtitle="Verified Benchmarks, Zero-Cost Guardrail & ZIP/XLSX Export"
    >
      <PlatformLabView />
    </HEYUKAPlatformShell>
  );
}
