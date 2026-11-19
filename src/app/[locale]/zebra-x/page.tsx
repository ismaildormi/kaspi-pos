import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { XZebraPlatformPortal } from "@/components/zebra-portal/XZebraPlatformPortal";

export const metadata = {
  title: "HEYUKA AI Platform (KASPI) • Sovereign Models, API Keys & Studio",
  description:
    "Official HEYUKA developer platform by KASPI: issue cryptographically unique API Keys & Key IDs for OpenAI-compatible Chat, Vision, 3D, Code Sandbox, and Audio APIs.",
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
