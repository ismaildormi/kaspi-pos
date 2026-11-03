"use client";

import React, { useState } from "react";
import { Printer, Check, Copy, QrCode } from "lucide-react";

export function ReceiptSimulator() {
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");
  const [copied, setCopied] = useState(false);

  const handleCopySequence = () => {
    navigator.clipboard?.writeText("FAC-2026-000842");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center relative z-10 w-full overflow-hidden">
      {/* Width Switcher */}
      <div className="flex items-center gap-2 mb-4 bg-zinc-900 border border-zinc-800 p-1 rounded-full text-xs font-mono">
        <button
          onClick={() => setPaperWidth("80mm")}
          className={`px-3 py-1 rounded-full transition cursor-pointer ${
            paperWidth === "80mm" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
          }`}
        >
          Format Standard 80mm
        </button>
        <button
          onClick={() => setPaperWidth("58mm")}
          className={`px-3 py-1 rounded-full transition cursor-pointer ${
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

      {/* Real Paper Thermal Receipt with Serrated Sawtooth Edges */}
      <div
        className={`w-full transition-all duration-300 bg-[#f4f4f5] text-zinc-950 p-6 relative font-mono text-xs select-none shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_1px_rgba(0,0,0,0.3)] ${
          paperWidth === "80mm" ? "max-w-sm" : "max-w-[280px]"
        }`}
        style={{
          clipPath:
            "polygon(0% 4px, 2.5% 0px, 5% 4px, 7.5% 0px, 10% 4px, 12.5% 0px, 15% 4px, 17.5% 0px, 20% 4px, 22.5% 0px, 25% 4px, 27.5% 0px, 30% 4px, 32.5% 0px, 35% 4px, 37.5% 0px, 40% 4px, 42.5% 0px, 45% 4px, 47.5% 0px, 50% 4px, 52.5% 0px, 55% 4px, 57.5% 0px, 60% 4px, 62.5% 0px, 65% 4px, 67.5% 0px, 70% 4px, 72.5% 0px, 75% 4px, 77.5% 0px, 80% 4px, 82.5% 0px, 85% 4px, 87.5% 0px, 90% 4px, 92.5% 0px, 95% 4px, 97.5% 0px, 100% 4px, 100% calc(100% - 4px), 97.5% 100%, 95% calc(100% - 4px), 92.5% 100%, 90% calc(100% - 4px), 87.5% 100%, 85% calc(100% - 4px), 82.5% 100%, 80% calc(100% - 4px), 77.5% 100%, 75% calc(100% - 4px), 72.5% 100%, 70% calc(100% - 4px), 67.5% 100%, 65% calc(100% - 4px), 62.5% 100%, 60% calc(100% - 4px), 57.5% 100%, 55% calc(100% - 4px), 52.5% 100%, 50% calc(100% - 4px), 47.5% 100%, 45% calc(100% - 4px), 42.5% 100%, 40% calc(100% - 4px), 37.5% 100%, 35% calc(100% - 4px), 32.5% 100%, 30% calc(100% - 4px), 27.5% 100%, 25% calc(100% - 4px), 22.5% 100%, 20% calc(100% - 4px), 17.5% 100%, 15% calc(100% - 4px), 12.5% 100%, 10% calc(100% - 4px), 7.5% 100%, 5% calc(100% - 4px), 2.5% 100%, 0% calc(100% - 4px))",
        }}
      >
        {/* Store Header */}
        <div className="text-center space-y-1 pb-3 border-b border-dashed border-zinc-400">
          <h3 className="font-extrabold text-base tracking-tight text-zinc-950 font-sans" dir="rtl">
            بقالة الأمانة • KASPI STORE
          </h3>
          <p className="text-[10px] text-zinc-600 font-sans">
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
            <span className="text-zinc-600">Ticket N°:</span>
            <button
              onClick={handleCopySequence}
              className="font-bold text-zinc-950 flex items-center gap-1 hover:underline cursor-pointer"
              title="Copier le numéro séquentiel DGI"
            >
              <span>FAC-2026-000842</span>
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 text-zinc-500" />}
            </button>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Date :</span>
            <span className="text-zinc-800">Aujourd&apos;hui • 14:32:08</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Caissier :</span>
            <span className="text-zinc-800">Karim (Caisse #01)</span>
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
              <p className="font-bold text-zinc-950">Coca-Cola Original 330ml</p>
              <p className="text-[10px] text-zinc-600">2 x 6.50 DH</p>
            </div>
            <span className="font-bold text-zinc-950">13.00 DH</span>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="font-bold text-zinc-950">Lay&apos;s Classic Salted 175g</p>
              <p className="text-[10px] text-zinc-600">1 x 16.00 DH</p>
            </div>
            <span className="font-bold text-zinc-950">16.00 DH</span>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="font-bold text-zinc-950">Sidi Ali Eau Minérale 1.5L</p>
              <p className="text-[10px] text-zinc-600">1 x 6.00 DH</p>
            </div>
            <span className="font-bold text-zinc-950">6.00 DH</span>
          </div>
        </div>

        {/* Total & Tax Breakdown */}
        <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
          <div className="flex justify-between text-zinc-700">
            <span>Sous-Total HT :</span>
            <span>29.17 DH</span>
          </div>
          <div className="flex justify-between text-zinc-700">
            <span>TVA (20% DGI) :</span>
            <span>5.83 DH</span>
          </div>
          <div className="flex justify-between items-baseline pt-1.5 border-t border-zinc-400 font-extrabold text-sm text-zinc-950">
            <span>TOTAL TTC :</span>
            <span className="text-base font-black">35.00 DH</span>
          </div>
        </div>

        {/* Change breakdown */}
        <div className="py-2 border-b border-dashed border-zinc-400 text-[11px] space-y-0.5 bg-zinc-200/50 p-2 rounded">
          <div className="flex justify-between text-zinc-800">
            <span>Espèces reçues :</span>
            <span className="font-bold">50.00 DH</span>
          </div>
          <div className="flex justify-between text-emerald-800 font-extrabold">
            <span>الصرف / À Rendre :</span>
            <span>15.00 DH</span>
          </div>
        </div>

        {/* QR Code and Compliance Sign */}
        <div className="pt-3 pb-1 text-center space-y-1.5">
          <div className="flex justify-center">
            <div className="p-1.5 bg-white border border-zinc-300 rounded shadow-xs">
              <QrCode className="w-16 h-16 text-zinc-950" />
            </div>
          </div>
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">
            Merci de votre visite • شكراً لزيارتكم
          </p>
          <p className="text-[8px] text-zinc-500">
            Signature Électronique Certifiée • Conforme DGI Art. 145 &amp; NF525
          </p>
        </div>
      </div>
    </div>
  );
}
