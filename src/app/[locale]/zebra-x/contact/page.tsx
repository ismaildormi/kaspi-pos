import React from "react";
import { HEYUKAPlatformShell } from "@/components/zebra-portal/HEYUKAPlatformShell";
import { PlatformFeedbackView } from "@/components/zebra-portal/PlatformFeedbackView";

export const dynamic = "force-dynamic";

export default function HeyukaContactFeedbackPage() {
  return (
    <HEYUKAPlatformShell activeNav="faq">
      <PlatformFeedbackView />
    </HEYUKAPlatformShell>
  );
}
