import "@/app/globals.css";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../../../messages/en.json";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Super Admin Console | Kasbi POS",
  description: "Platform Administration and Master Control for Kasbi POS",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased font-sans selection:bg-white selection:text-black">
      <NextIntlClientProvider locale="fr" messages={enMessages}>
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-1">
              <Image
                src="/logo.png"
                alt="Kasbi POS Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">Kasbi POS</span>
                <span className="bg-white text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">Master Control Room • لوحة تحكم مالك المنصة</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour au Magasin (POS/ERP)
            </Link>
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4 text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="font-mono text-[11px]">System: Nominal</span>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </NextIntlClientProvider>
    </div>
  );
}
