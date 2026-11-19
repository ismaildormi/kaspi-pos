import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformVaultView } from "@/components/zebra-portal/PlatformVaultView";

export const metadata = {
  title: "HEYUKA Real Output Vault • Verified Provenance",
  description:
    "Review and export real HEYUKA outputs separated from previews and failed runs with SHA-256 digests and actual engine metadata.",
};

export default function ZebraVaultPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="vault"
      pageTitle="Real Output Vault"
      pageSubtitle="SHA-256 Verified Artifacts & Zip Exports"
    >
      <PlatformVaultView />
    </HEYUKAPlatformShell>
  );
}
