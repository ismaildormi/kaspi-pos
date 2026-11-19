import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformDocsView } from "@/components/zebra-portal/PlatformDocsView";

export const metadata = {
  title: "Documentation & SDKs • HEYUKA AI Platform (KASPI)",
  description:
    "Production SDK quickstarts (Node.js OpenAI SDK, Python OpenAI SDK, Azure api-key, cURL), error guides, and OpenAPI 3.1 reference.",
};

export default function ZebraDocsPage() {
  return (
    <HEYUKAPlatformShell
      activeNav="docs"
      pageTitle="Docs & SDKs"
      pageSubtitle="OpenAI SDK Drop-In, Error Codes & OpenAPI 3.1"
    >
      <PlatformDocsView />
    </HEYUKAPlatformShell>
  );
}
