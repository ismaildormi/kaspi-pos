import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HEYUKALandingShowcase } from "@/components/heyuka/HEYUKALandingShowcase";

export const metadata = {
  title: "HEYUKA by KASPI • 3D Interactive Desktop App & Sovereign Intelligence",
  description:
    "Download HEYUKA Desktop App owned by KASPI: 32 interactive 3D characters, multimodal intelligence, and unique API Keys + Key IDs for developers.",
};

export default function HeyukaShowcasePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between selection:bg-emerald-400 selection:text-black font-sans">
      <Navbar />
      <main className="flex-1">
        <HEYUKALandingShowcase />
      </main>
      <Footer />
    </div>
  );
}
