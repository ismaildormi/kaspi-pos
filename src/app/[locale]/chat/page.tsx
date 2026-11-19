import React, { Suspense } from "react";
import { HeyukaChatWorkspace } from "@/components/heyuka/HeyukaChatWorkspace";

export const metadata = {
  title: "HEYUKA Chat • DeepThink, Live Search & Sovereign AI",
  description:
    "Chat with HEYUKA for free — DeepThink reasoning, live web search, audio input, and instant Gmail conversation sharing.",
};

export default function HeyukaChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--kaspi-bg)]" />}>
      <HeyukaChatWorkspace />
    </Suspense>
  );
}
