"use client";

import React, { useState } from "react";
import { Printer, Check, Copy, QrCode } from "lucide-react";

export function ReceiptSimulator() {
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");
  const [copied, setCopied] = useState(false);

  const handleCopySequence = () => {
    navigator.clipboard?.writeText("FAC-2026-000482");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center relative z-10 w-full overflow-hidden">
      {/* Width Switcher */}
      <div className="flex items-center gap-2 mb-4 bg-zinc-900 border border-zinc-800 p-1 rounded-full text-xs font-mono">
        <button
          onClick={() => setPaperWidth("80mm")}
          className={`px-3 py-1 rounded-full transition ${
            paperWidth === "80mm" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
          }`}
        >
          Format Standard 80mm
        </button>
        <button
          onClick={() => setPaperWidth("58mm")}
          className={`px-3 py-1 rounded-full transition ${
            paperWidth === "58mm" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
          }`}
        >
          Format Compact 58mm
        </button>
      </div>

      {/* Printer Slot Hardware Frame */}
      <div className="w-full max-w-sm rounded-t-2xl bg-zinc-900 border-t border-x border-zinc-700 p-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>ESC/POS Pure-Rust Rasterizer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-400">Prêt (USB/LAN)</span>
        </div>
      </div>

      {/* Printer Slot Mouth (Black slit) */}
      <div className="w-full max-w-sm h-2 bg-black border-x border-zinc-800 relative z-10 shadow-inner" />

      {/* Thermal Receipt Paper (Realistic white roll paper with slight grain) */}
      <div
        className={`w-full transition-all duration-300 bg-zinc-100 text-zinc-900 p-6 shadow-2xl relative font-mono text-xs select-none ${
          paperWidth === "80mm" ? "max-w-sm" : "max-w-[280px]"
        }`}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Store Header */}
        <div className="text-center space-y-1 pb-3 border-b border-dashed border-zinc-400">
          <h3 className="font-extrabold text-base tracking-tight text-zinc-950 font-sans" dir="rtl">
            بقالة الأمانة • Épicerie El Amana
          </h3>
          <p className="text-[10px] text-zinc-600">
            245 Boulevard Zerktouni, Casablanca
          </p>
          <div className="text-[9px] text-zinc-500 pt-1 space-y-0.5">
            <p>ICE : 002345678000045 • IF : 45892147</p>
            <p>RC : 38291 • Patente : 341209</p>
          </div>
        </div>

        {/* Invoice Metadata */}
        <div className="py-2.5 border-b border-dashed border-zinc-400 text-[10px] space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Ticket N°:</span>
            <button
              onClick={handleCopySequence}
              className="font-bold text-zinc-950 flex items-center gap-1 hover:underline"
              title="Copier le numéro séquentiel DGI"
            >
              <span>FAC-2026-000482</span>
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-zinc-400" />}
            </button>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Date :</span>
            <span className="text-zinc-700">03/11/2026 14:32:08</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Caissier :</span>
            <span className="text-zinc-700">Karim (Caisse 01)</span>
          </div>
        </div>

        {/* Line Items */}
        <div className="py-3 border-b border-dashed border-zinc-400 space-y-2">
          <div className="flex justify-between font-bold text-[10px] uppercase text-zinc-500 pb-1 border-b border-zinc-300">
            <span>Désignation</span>
            <span>Total</span>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="font-bold text-zinc-950">Coca Cola 33cl</p>
              <p className="text-[10px] text-zinc-500">1 x 6.00 DH</p>
            </div>
            <span className="font-bold">6.00 DH</span>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="font-bold text-zinc-950">Sidi Ali 1.5L</p>
              <p className="text-[10px] text-zinc-500">1 x 6.00 DH</p>
            </div>
            <span className="font-bold">6.00 DH</span>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="font-bold text-zinc-950">Biscuits Bimo Tagger</p>
              <p className="text-[10px] text-zinc-500">1 x 3.00 DH</p>
            </div>
            <span className="font-bold">3.00 DH</span>
          </div>
        </div>

        {/* Total & Tax Breakdown */}
        <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
          <div className="flex justify-between text-zinc-600">
            <span>Sous-Total HT :</span>
            <span>12.50 DH</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>TVA (20%) :</span>
            <span>2.50 DH</span>
          </div>
          <div className="flex justify-between text-base font-black text-zinc-950 pt-1">
            <span>TOTAL TTC :</span>
            <span>15.00 DH</span>
          </div>
          <div className="flex justify-between text-zinc-600 text-[10px] pt-1">
            <span>Espèces reçues :</span>
            <span>20.00 DH</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-800 text-[10px]">
            <span>الصرف / Rendu :</span>
            <span>5.00 DH</span>
          </div>
        </div>

        {/* Moroccan DGI QR Code & Footer */}
        <div className="pt-4 text-center space-y-2">
          {/* Authentic QR Code SVG */}
          <div className="w-20 h-20 mx-auto bg-white p-1.5 border border-zinc-300 shadow-sm flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="currentColor">
              <path d="M5,5 h26 v26 h-26 z M10,10 v16 h16 v-16 z M14,14 h8 v8 h-8 z" />
              <path d="M69,5 h26 v26 h-26 z M74,10 v16 h16 v-16 z M78,14 h8 v8 h-8 z" />
              <path d="M5,69 h26 v26 h-26 z M10,74 v16 h16 v-16 z M14,78 h8 v8 h-8 z" />
              <rect x="38" y="10" width="6" height="6" />
              <rect x="48" y="10" width="12" height="6" />
              <rect x="38" y="22" width="6" height="12" />
              <rect x="52" y="24" width="8" height="6" />
              <rect x="10" y="38" width="8" height="6" />
              <rect x="24" y="44" width="12" height="6" />
              <rect x="40" y="40" width="20" height="20" rx="2" />
              <rect x="45" y="45" width="10" height="10" fill="#ffffff" />
              <rect x="68" y="38" width="6" height="12" />
              <rect x="80" y="44" width="14" height="6" />
              <rect x="38" y="68" width="6" height="12" />
              <rect x="50" y="74" width="12" height="6" />
              <rect x="68" y="74" width="12" height="12" />
              <rect x="86" y="68" width="8" height="18" />
              <rect x="44" y="86" width="18" height="6" />
            </svg>
          </div>

          <p className="text-[10px] font-bold text-zinc-800" dir="rtl">
            شكراً لزيارتكم • Merci de votre visite
          </p>
          <p className="text-[8px] text-zinc-500 font-mono">
            KASPI POS v2.0 • Conforme DGI Maroc • Code vérifié
          </p>
        </div>

        {/* Serrated Paper Tear Bottom Edge */}
        <div
          className="absolute -bottom-2.5 left-0 right-0 h-3 bg-zinc-100"
          style={{
            clipPath:
              "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)",
          }}
        />
      </div>
    </div>
  );
}
