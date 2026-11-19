import React, { Suspense } from "react";
import { HeyukaChatWorkspace } from "@/components/heyuka/HeyukaChatWorkspace";

export const metadata = {
  title: "HEYUKA • DeepThink, Search, Audio & Free Sovereign AI",
  description:
    "Chat with HEYUKA for free — DeepThink reasoning, live web search, voice/audio input, and Gmail conversation sharing.",
};

export default function HeyukaShowcasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#15161A]" />}>
      <HeyukaChatWorkspace />
    </Suspense>
  );
}
