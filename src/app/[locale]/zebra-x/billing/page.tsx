import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformBillingStatsView } from "@/components/zebra-portal/PlatformBillingQuotaViews";

export const metadata = {
  title: "Billing & Network Stats • HEYUKA Platform",
};

export default function ZebraBillingPage() {
  return (
    <HEYUKAPlatformShell activeNav="products">
      <PlatformBillingStatsView />
    </HEYUKAPlatformShell>
  );
}
