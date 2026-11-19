import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformStudiosDirectoryView } from "@/components/zebra-portal/PlatformStudiosDirectoryView";

export const metadata = {
  title: "Specialized AI Studios • HEYUKA AI Ecosystem",
  description:
    "Explore 12 verified domain AI studios: 3D, Background Cutout, Image, Video, Shorts 9:16, Coding IDE, Audio, Conversion, Data, Web, Document & Automation.",
};

export default function ZebraStudiosDirectoryPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="studios"
      pageTitle="Specialized AI Studios"
      pageSubtitle="12 Domain-Focused Workspaces & Shared Core Engine"
    >
      <PlatformStudiosDirectoryView />
    </HEYUKAPlatformShell>
  );
}
