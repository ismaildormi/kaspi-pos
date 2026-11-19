import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformModelsView } from "@/components/zebra-portal/PlatformModelsView";

export const metadata = {
  title: "Models Directory • HEYUKA AI Platform (KASPI)",
  description:
    "Explore HEYUKA-Omni, HEYUKA-Core, and HEYUKA-Vision specifications, modalities, context windows, and competitor tier benchmarks.",
};

export default function ZebraModelsPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="models"
      pageTitle="Models Directory"
      pageSubtitle="heyuka-omni • heyuka-core • heyuka-vision"
    >
      <PlatformModelsView />
    </HEYUKAPlatformShell>
  );
}
