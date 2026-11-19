import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformFreeQuotaView } from "@/components/zebra-portal/PlatformBillingQuotaViews";

export const metadata = {
  title: "Free Quota ($0.00) • HEYUKA Platform",
};

export default function ZebraQuotaPage() {
  return (
    <HEYUKAPlatformShell activeNav="quota">
      <PlatformFreeQuotaView />
    </HEYUKAPlatformShell>
  );
}
