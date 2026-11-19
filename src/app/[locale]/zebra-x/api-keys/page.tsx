import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformKeysView } from "@/components/zebra-portal/PlatformKeysView";

export const metadata = {
  title: "API Keys (IPK) Vault • HEYUKA AI Platform (KASPI)",
  description:
    "Create cryptographically unique SHA-256 Secret API Keys paired with verifiable X-API-Key-Id credentials.",
};

export default function ZebraApiKeysPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="api-keys"
      pageTitle="API Keys (IPK)"
      pageSubtitle="Tenant-Isolated SHA-256 Vault & Key IDs"
    >
      <PlatformKeysView />
    </HEYUKAPlatformShell>
  );
}
