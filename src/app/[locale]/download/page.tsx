"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Download,
  WifiOff,
  Cpu,
  FileSpreadsheet,
  MessageSquare,
  Layers,
  CreditCard,
  ChevronDown,
  HelpCircle,
  CheckCircle2,
  Printer,
  ArrowRight,
} from "lucide-react";

const FAQS = [
  {
    q: "Does it work offline?",
    a: "Yes, 100%. KASPI POS stores your catalog, sales, and receipts locally using an offline-first database engine. When your internet reconnects, all transactions sync automatically in the background.",
  },
  {
    q: "How do I pay?",
    a: "You can download and test the application immediately without an account. For full cloud sync and multi-device features, our All-in-One Pro plan is $10/month (100 MAD/month), payable via Moroccan bank cards (YouCan Pay / CMI) or international cards (Paddle).",
  },
  {
    q: "Can I use my own printer?",
    a: "Yes. KASPI POS supports all standard 58mm and 80mm ESC/POS USB, Ethernet, and Bluetooth thermal receipt printers, RJ11 cash drawers, and barcode scanners out of the box.",
  },
  {
    q: "How do I get support?",
    a: "Our dedicated engineering and merchant support team in Morocco is available 7 days a week via WhatsApp (+212 687-597267) and the built-in support portal.",
  },
];

export default function DownloadPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-['Inter',system-ui,sans-serif] selection:bg-white selection:text-black">
      <Navbar />

      <main className="px-4 sm:px-6 lg:px-8 pt-20 pb-28">
        {/* 1. CHATGPT-STYLE HERO SECTION */}
        <section className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs font-mono text-zinc-400 mb-8">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span>KASPI POS Desktop v2.0 • Native Tauri Engine</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
            KASPI POS for Windows
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            The ultimate AI-powered Point of Sale for Morocco. Works 100% offline, prints receipts, and manages your inventory. No account required to download.
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <a
              href="/downloads/kaspi-pos-setup.exe"
              download
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-8 py-4 font-semibold text-lg hover:bg-zinc-200 transition-all shadow-2xl"
            >
              <Download className="w-5 h-5" /> Download for Windows (.exe)
            </a>

            <p className="text-xs font-mono text-zinc-500 mt-2">
              Windows 10/11 (64-bit) • 4GB RAM • 500MB Disk
            </p>
          </div>

          <div className="mt-16 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-zinc-900/40">
            <img
              src="/images/hero-mockup.png"
              alt="KASPI POS Interface"
              className="w-full h-auto"
            />
          </div>
        </section>

        {/* 2. SQUARE-STYLE HARDWARE SECTION */}
        <section className="mt-32 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-5 text-center md:text-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono text-zinc-400">
              <Printer className="h-3.5 w-3.5 text-white" /> Plug & Play Hardware
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Built for your hardware. Seamlessly connects with 58mm/80mm thermal printers and cash drawers.
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed">
              Zero complex driver configuration. Connect your USB or network thermal printer, barcode scanner, and RJ11 cash drawer for sub-20ms checkout speed.
            </p>
            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4 text-xs font-mono text-zinc-300">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" /> 58mm / 80mm ESC/POS
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" /> 1D / 2D Barcode Scanners
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" /> Auto Cash Drawer Kick
              </span>
            </div>
          </div>

          <div className="flex-1 w-full">
            <img
              src="/images/hardware.png"
              alt="Hardware"
              className="w-full rounded-2xl border border-zinc-800 shadow-2xl"
            />
          </div>
        </section>

        {/* 3. CAISSA-STYLE UI SHOWCASE (TRUST BUILDING) */}
        <section className="mt-32 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              A beautiful interface, designed for speed.
            </h2>
            <p className="mt-4 text-base text-zinc-400">
              Engineered with a high-contrast monochrome aesthetic to eliminate cashier eye strain and maximize transaction throughput.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Showcase Card 1: AI Assistant */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col">
              <div className="border-b border-zinc-800">
                <img
                  src="/images/ai-feature.png"
                  alt="AI Business Advisor"
                  className="w-full h-72 object-cover"
                />
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-xl font-bold text-white">AI Business & Vision Copilot</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Real-time sales analytics, 30-day stockout velocity predictions, and instant supplier invoice OCR powered by our Multi-Gateway AI router.
                </p>
              </div>
            </div>

            {/* Showcase Card 2: WhatsApp Receipts */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col">
              <div className="border-b border-zinc-800">
                <img
                  src="/images/whatsapp-feature.png"
                  alt="WhatsApp Digital Receipts & Z-Reports"
                  className="w-full h-72 object-cover"
                />
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-xl font-bold text-white">WhatsApp Receipts & Automated Z-Reports</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Send paperless thermal receipts directly to customers on WhatsApp and receive your automated End-of-Day Z-Report every evening.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. POSNEX-STYLE FEATURE GRID (THE CORE FEATURES) */}
        <section className="mt-32 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Everything your store needs in one system.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-3 hover:border-zinc-700 transition">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-white">
                <WifiOff className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Offline-First</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Keep selling even if the internet goes down. Automatic sync when back online.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-3 hover:border-zinc-700 transition">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-white">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Business Advisor</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Ask questions about your sales in Darija, Arabic, or French.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-3 hover:border-zinc-700 transition">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-white">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Migration</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Import your products from Caissa, POSNEX, or Excel in 2 minutes.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-3 hover:border-zinc-700 transition">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-white">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">WhatsApp Receipts</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Send digital receipts directly to customers via WhatsApp.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-3 hover:border-zinc-700 transition">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-white">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Inventory & Krediat</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Track stock levels and manage customer credit balances.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-3 hover:border-zinc-700 transition">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Dual Billing</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Pay via Moroccan cards or international cards.
              </p>
            </div>
          </div>
        </section>

        {/* 5. LOYVERSE-STYLE "HOW IT WORKS" & FAQ */}
        <section className="mt-32 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Get started in 3 simple steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center space-y-3">
              <div className="mx-auto h-10 w-10 rounded-full bg-white text-black font-black flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-white">1. Download & Install</h3>
              <p className="text-xs text-zinc-400">
                Run the lightweight Windows `.exe` installer. No technical setup required.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center space-y-3">
              <div className="mx-auto h-10 w-10 rounded-full bg-white text-black font-black flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-white">2. Import Products</h3>
              <p className="text-xs text-zinc-400">
                Upload your existing Excel/CSV catalog or snap product photos with AI onboarding.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center space-y-3">
              <div className="mx-auto h-10 w-10 rounded-full bg-white text-black font-black flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-white">3. Start Selling</h3>
              <p className="text-xs text-zinc-400">
                Scan barcodes, print receipts, and receive your daily WhatsApp Z-Report.
              </p>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="mt-24 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {FAQS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-bold text-white hover:bg-zinc-900/80 transition cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-zinc-400 transition-transform ${
                          isOpen ? "rotate-180 text-white" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. SUPPORT CTA */}
        <section className="mt-24 pt-12 border-t border-zinc-900 max-w-4xl mx-auto text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <a
              href="https://wa.me/212687597267?text=Hello%20KASPI%20POS%20Support,%20I%20need%20help%20with%20the%20Windows%20Download"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition"
            >
              <HelpCircle className="h-4 w-4" />
              Need help? Contact Support
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
