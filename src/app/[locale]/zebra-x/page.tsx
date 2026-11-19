import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { XZebraPlatformPortal } from "@/components/zebra-portal/XZebraPlatformPortal";

export const metadata = {
  title: "HEYUKA AI Platform Portal • HEYUKA-Core & Vision APIs (KASPI)",
  description:
    "Unified developer platform for HEYUKA by KASPI: Live API keys, BG Remover, Blender 3D Hub, Transcription, and Vocal Stem Separation.",
};

export default function XZebraPortalPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between selection:bg-emerald-400 selection:text-black font-sans">
      <Navbar />
      <main className="flex-1">
        <XZebraPlatformPortal />
      </main>
      <Footer />
    </div>
  );
}
