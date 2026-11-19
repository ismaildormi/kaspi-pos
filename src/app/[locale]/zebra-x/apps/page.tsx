import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformAppsView } from "@/components/zebra-portal/PlatformAppsView";

export const metadata = {
  title: "HEYUKA Apps & Download Center • Verified Releases",
  description:
    "Dedicated HEYUKA Applications & Downloads center cleanly separated from Models Registry, reporting authentic release statuses only.",
};

export default function ZebraAppsDownloadCenterPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="apps"
      pageTitle="Apps & Download Center"
      pageSubtitle="Official Web App, Launchers & Honest Binary Release Status"
    >
      <PlatformAppsView />
    </HEYUKAPlatformShell>
  );
}
