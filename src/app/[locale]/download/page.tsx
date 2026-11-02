"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DownloadPwaButton } from "@/components/DownloadPwaButton";
import {
  Download,
  Cpu,
  MessageSquare,
  WifiOff,
  FileSpreadsheet,
  Printer,
  HardDrive,
  Award,
  BookOpen,
  CreditCard,
  Check,
  X,
  ChevronDown,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

const FEATURE_GRID = [
  {
    icon: Cpu,
    title: "AI Business Advisor",
    description:
      "Ask questions about your daily revenue, profit margins, and stockout risks in Darija, Arabic, or French—plus snap supplier invoices with Gemini Vision OCR.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integration",
    description:
      "Send paperless digital receipts directly to customer phones via WhatsApp and receive an automated End-of-Day Z-Report summary every night.",
  },
  {
    icon: WifiOff,
    title: "Offline-First Mode",
    description:
      "Never stop selling when the internet drops. Transactions are sealed locally in IndexedDB/SQLite and synchronize automatically once connectivity returns.",
  },
  {
    icon: FileSpreadsheet,
    title: "Smart CSV Migration",
    description:
      "Migrate from Caissa, POSNEX, or Excel spreadsheets in under 2 minutes with automated duplicate SKU detection and price validation.",
  },
  {
    icon: Printer,
    title: "Thermal Printing (58mm/80mm)",
    description:
      "Direct ESC/POS command printing via our Rust/Tauri native bridge for instant 58mm and 80mm receipts with Moroccan ICE, IF, RC, and TVA breakdowns.",
  },
  {
    icon: HardDrive,
    title: "Cash Drawer Support",
    description:
      "Automatically triggers RJ11/RJ12 cash drawers and syncs with USB or Bluetooth 1D/2D barcode scanners at sub-20ms response times.",
  },
  {
    icon: Award,
    title: "Customer Loyalty",
    description:
      "Turn walk-in buyers into repeat customers with automatic loyalty point accrual per Dirham spent and instant reward redemption at checkout.",
  },
  {
    icon: BookOpen,
    title: "Credit (Krediat) Tracking",
    description:
      "Replace the paper credit notebook with a digital Krediat ledger that tracks customer balances, partial payments, and due dates.",
  },
  {
    icon: CreditCard,
    title: "Dual-Gateway Billing",
    description:
      "Subscribe effortlessly at a flat $10/month (100 MAD) rate using either Moroccan bank cards (YouCan Pay / CMI) or international cards (Paddle).",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Monthly Price",
    kaspi: "$10 / mo (100 MAD Flat Rate)",
    caissa: "300–600 MAD / mo",
    posnex: "2,500+ MAD License + Fees",
  },
  {
    feature: "Setup & Onboarding Fees",
    kaspi: "$0 (No Setup Fees)",
    caissa: "Paid Setup Required",
    posnex: "Paid Technician Required",
  },
  {
    feature: "AI Business Advisor & Vision OCR",
    kaspi: true,
    caissa: false,
    posnex: false,
  },
  {
    feature: "WhatsApp Digital Receipts & Z-Reports",
    kaspi: true,
    caissa: false,
    posnex: false,
  },
  {
    feature: "100% Offline-First Auto-Sync Engine",
    kaspi: true,
    caissa: "Partial",
    posnex: "Local Only (No Cloud Sync)",
  },
  {
    feature: "Smart 2-Minute CSV & Photo Migration",
    kaspi: true,
    caissa: false,
    posnex: false,
  },
  {
    feature: "Customer Credit (Krediat) & Loyalty",
    kaspi: true,
    caissa: true,
    posnex: true,
  },
  {
    feature: "Moroccan & International Card Billing",
    kaspi: true,
    caissa: "Local Only",
    posnex: "Manual Bank Transfer",
  },
];

const FAQS = [
  {
    q: "Does it work offline?",
    a: "Yes, 100%. KASPI POS uses a local-first database engine (Dexie.js + Tauri SQLite) so your cashiers can scan barcodes, print thermal receipts, and record cash or credit sales with zero internet connection. All queued operations sync automatically when your connection returns.",
  },
  {
    q: "Can I import my old products?",
    a: "Yes! Our Smart Migration importer lets you drag-and-drop any CSV or Excel file exported from Caissa, POSNEX, or Loyverse. You can also onboard products simply by taking a photo of the packaging using our AI Vision tool.",
  },
  {
    q: "How do I pay?",
    a: "Downloading and installing KASPI POS for Windows is completely free and requires no credit card. When you are ready to activate cloud sync and multi-branch features, it is a flat $10/month (100 MAD/month) payable via Moroccan cards (YouCan Pay) or international cards (Paddle).",
  },
  {
    q: "Can I use my existing thermal printer and cash drawer?",
    a: "Absolutely. KASPI POS works out-of-the-box with all standard 58mm and 80mm ESC/POS USB/LAN thermal printers, RJ11 cash drawers, and USB/Bluetooth barcode scanners.",
  },
];

export default function DownloadPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-['Inter',system-ui,sans-serif] selection:bg-white selection:text-black">
      <Navbar />

      <main className="px-4 sm:px-6 lg:px-8 pt-20 pb-28">
        {/* 1. HERO SECTION */}
        <section className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-1.5 text-xs font-mono text-zinc-300 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span>KASPI POS Desktop v2.0 • Native Windows Edition</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter mb-6">
            Get KASPI POS for Windows
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The ultimate AI-powered Point of Sale & ERP built for Moroccan retail. Works 100% offline, prints 58mm/80mm thermal receipts, sends WhatsApp Z-Reports, and tracks Krediat. No account required to download.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <DownloadPwaButton
              label="Install Desktop App (PWA)"
              size="lg"
              githubReleasesUrl="https://github.com/ismaildormi/kaspi-pos-morocco/releases"
            />

            <a
              href="https://github.com/ismaildormi/kaspi-pos-morocco/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-7 py-4 font-semibold text-base text-white hover:bg-zinc-800 transition-all"
            >
              GitHub Releases (.exe / .msi)
              <ExternalLink className="w-4 h-4" />
            </a>

            <Link
              href="/pos"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-6 py-4 font-semibold text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all"
            >
              Launch Web POS
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-5 max-w-xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-3 text-xs text-zinc-300">
            The Windows Installer (.exe) is being built. In the meantime, click here to install the Web App (PWA) directly to your desktop, or download native release binaries from{" "}
            <a
              href="https://github.com/ismaildormi/kaspi-pos-morocco/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline hover:text-zinc-200"
            >
              GitHub Releases
            </a>
            .
          </div>

          <p className="text-xs font-mono text-zinc-500 mt-4">
            Windows 10 / 11 (64-bit) • 4GB RAM • 500MB Disk • Built-in Auto-Updater
          </p>

          {/* Glowing Hero Mockup Container */}
          <div className="mt-16 border border-zinc-800 rounded-3xl overflow-hidden bg-zinc-900/50 p-2 shadow-[0_0_90px_-20px_rgba(255,255,255,0.18)]">
            <img
              src="/images/hero-mockup.png"
              alt="KASPI POS Windows Interface"
              className="w-full h-auto rounded-2xl object-cover"
            />
          </div>
        </section>

        {/* 2. COMPREHENSIVE 9-CARD FEATURE GRID */}
        <section className="mt-32 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">
              All-In-One Retail Operating System
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Every tool you need to run and scale your store.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURE_GRID.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-3 hover:border-zinc-700 hover:bg-zinc-900 transition"
                >
                  <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. ZIG-ZAG 3D SHOWCASE */}
        <section className="mt-32 max-w-6xl mx-auto space-y-28">
          {/* Row 1: AI Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono text-zinc-400">
                <Cpu className="h-3.5 w-3.5 text-white" /> AI Business Copilot & Vision OCR
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Smarter inventory decisions powered by Multi-Gateway AI.
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Stop guessing which products to reorder. KASPI POS analyzes your 30-day sales velocity to predict stockouts before they happen, and digitizes paper supplier invoices from a single photo.
              </p>
              <ul className="space-y-2 text-xs text-zinc-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  Conversational analytics in Darija, Arabic, French, and English
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  1-Click AI Product Onboarding from packaging photos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  Zero-downtime 5-Key AI Pool (OpenRouter, Gemini, Groq & BYOK)
                </li>
              </ul>
            </div>
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-2 shadow-2xl">
                <img
                  src="/images/ai-feature.png"
                  alt="AI Business Advisor Showcase"
                  className="w-full h-auto rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Hardware & Thermal Printing Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-2 shadow-2xl">
                <img
                  src="/images/hardware.png"
                  alt="Thermal Printer and Cash Drawer Hardware"
                  className="w-full h-auto rounded-2xl object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono text-zinc-400">
                <Printer className="h-3.5 w-3.5 text-white" /> Native Hardware Bridge
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Built for 58mm/80mm thermal printers, cash drawers & scanners.
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Connect your existing counter hardware and start ringing up sales immediately. Our native Windows shell talks directly to your ESC/POS printer and RJ11 cash drawer without annoying browser popups.
              </p>
              <ul className="space-y-2 text-xs text-zinc-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  Instant thermal receipts with legal Moroccan ICE, IF & TVA
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  Automatic cash drawer kick on cash payment completion
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  Keyboard-first shortcuts (F2 Search, F10 Checkout)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. COMPETITOR COMPARISON TABLE */}
        <section className="mt-32 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">
              Why Merchants Switch to KASPI
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              KASPI POS vs. Traditional Competitors
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Enterprise superpowers included as standard—no expensive hardware lock-in or hidden module fees.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-zinc-950 border-b border-zinc-800 font-mono text-xs uppercase text-zinc-400">
                  <tr>
                    <th className="py-4 px-6 font-semibold">Feature</th>
                    <th className="py-4 px-6 font-bold text-white bg-zinc-900/80">
                      KASPI POS
                    </th>
                    <th className="py-4 px-6 font-semibold">Caissa</th>
                    <th className="py-4 px-6 font-semibold">POSNEX / Legacy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-950/40 transition">
                      <td className="py-4 px-6 font-semibold text-zinc-200">
                        {row.feature}
                      </td>
                      <td className="py-4 px-6 font-bold text-white bg-zinc-900/40">
                        {typeof row.kaspi === "boolean" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-black">
                            <Check className="h-3.5 w-3.5" /> Included
                          </span>
                        ) : (
                          row.kaspi
                        )}
                      </td>
                      <td className="py-4 px-6 text-zinc-400">
                        {typeof row.caissa === "boolean" ? (
                          row.caissa ? (
                            <Check className="h-4 w-4 text-zinc-300" />
                          ) : (
                            <X className="h-4 w-4 text-zinc-600" />
                          )
                        ) : (
                          row.caissa
                        )}
                      </td>
                      <td className="py-4 px-6 text-zinc-400">
                        {typeof row.posnex === "boolean" ? (
                          row.posnex ? (
                            <Check className="h-4 w-4 text-zinc-300" />
                          ) : (
                            <X className="h-4 w-4 text-zinc-600" />
                          )
                        ) : (
                          row.posnex
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. HOW IT WORKS (3-STEP VISUAL GUIDE) */}
        <section className="mt-32 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">
              Zero Friction Setup
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              How It Works — Up and running in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-white text-black font-black flex items-center justify-center text-base shadow-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-white">1. Download & Install</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Click the download button above and run `kaspi-pos-setup.exe` on any Windows 10 or 11 PC or touch terminal.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-white text-black font-black flex items-center justify-center text-base shadow-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-white">2. Import via Excel or AI</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Import your existing product catalog via CSV/Excel in 2 minutes or photograph products with AI Vision onboarding.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-white text-black font-black flex items-center justify-center text-base shadow-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-white">3. Sell Offline & WhatsApp</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Ring up sales 100% offline, print thermal receipts, and receive your automated End-of-Day Z-Report on WhatsApp.
              </p>
            </div>
          </div>
        </section>

        {/* 6. FAQ SECTION */}
        <section className="mt-32 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Frequently Asked Questions
          </h2>
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
        </section>

        {/* 7. BOTTOM DOWNLOAD CTA & SUPPORT */}
        <section className="mt-28 pt-12 border-t border-zinc-900 max-w-4xl mx-auto text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to modernize your store?
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <DownloadPwaButton
              label="Install Desktop App (PWA)"
              size="md"
              githubReleasesUrl="https://github.com/ismaildormi/kaspi-pos-morocco/releases"
            />
            <a
              href="https://github.com/ismaildormi/kaspi-pos-morocco/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-6 py-4 text-sm font-semibold text-white hover:bg-zinc-800 transition"
            >
              <ExternalLink className="h-4 w-4" />
              Download .exe on GitHub Releases
            </a>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-6 py-4 text-sm font-semibold text-white hover:bg-zinc-800 transition"
            >
              <HelpCircle className="h-4 w-4" />
              Need help? Contact Support Inbox
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
