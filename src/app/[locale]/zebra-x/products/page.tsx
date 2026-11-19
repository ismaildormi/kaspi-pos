import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformProductsFactoryView } from "@/components/zebra-portal/PlatformProductsFactoryView";

export const metadata = {
  title: "Mini-Product Factory & External Embeds • HEYUKA AI",
  description:
    "Build tailored HEYUKA mini-products with scoped API keys, custom instructions, usage metering, and website iframe embeds.",
};

export default function ZebraProductsFactoryPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="products"
      pageTitle="Mini-Product Factory"
      pageSubtitle="Custom Scoped Products, Keys & Website Embeds"
    >
      <PlatformProductsFactoryView />
    </HEYUKAPlatformShell>
  );
}
