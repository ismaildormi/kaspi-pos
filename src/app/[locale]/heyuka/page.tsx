import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HEYUKALandingShowcase } from "@/components/heyuka/HEYUKALandingShowcase";

export const metadata = {
  title: "HEYUKA Desktop OS by KASPI • 60 FPS 3D Companion & OS Control",
  description:
    "Download HEYUKA Desktop OS owned by KASPI: 32 interactive WebGL2 fur characters, Ghost Cursor OS automation, 120 Zero-Key Cosmic & Cyber sources, and live zx-live API keys.",
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
