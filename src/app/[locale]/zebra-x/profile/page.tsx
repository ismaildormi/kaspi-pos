import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformProfileView } from "@/components/zebra-portal/PlatformProfileView";

export const metadata = {
  title: "HEYUKA Platform • Account & Devices Profile",
};

export default function ZebraProfilePage() {
  return (
    <HEYUKAPlatformShell
      activeNav="profile"
      pageTitle="Profile & Devices"
      pageSubtitle="Gmail Account, Language, Theme & Active Sessions"
    >
      <PlatformProfileView />
    </HEYUKAPlatformShell>
  );
}
