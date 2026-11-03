"use client";

import React, { useState } from "react";
import { Camera, Sparkles, CheckCircle2, ScanLine, Tag, TrendingUp, Layers } from "lucide-react";

interface ScannedItem {
  id: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: number;
  salePrice: number;
  margin: number;
  supplier: string;
}

const DEMO_SCANS: ScannedItem[] = [
  {
    id: "1",
    name: "Café Moulu Samar 250g",
    barcode: "6111245001289",
    category: "Épicerie Chaude",
    costPrice: 19.5,
    salePrice: 26.0,
    margin: 33.3,
    supplier: "Distributeur Casa Centre",
  },
  {
    id: "2",
    name: "Huile d'Olive Oued Souss 1L",
    barcode: "6111098004521",
    category: "Huiles & Condiments",
    costPrice: 65.0,
    salePrice: 85.0,
    margin: 30.7,
    supplier: "Souss Distribution SARL",
  },
  {
    id: "3",
    name: "Thé Vert Sultan Lion 200g",
    barcode: "6111005003312",
    category: "Thé & Infusions",
    costPrice: 14.0,
    salePrice: 18.0,
    margin: 28.5,
    supplier: "Grossiste Derb Omar",
  },
];

export function AiScannerSimulator() {
  const [selectedScanIndex, setSelectedScanIndex] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [added, setAdded] = useState<boolean>(false);

  const current = DEMO_SCANS[selectedScanIndex];

  const handleNextScan = () => {
    setIsAnalyzing(true);
    setAdded(false);
    setTimeout(() => {
      setSelectedScanIndex((prev) => (prev + 1) % DEMO_SCANS.length);
      setIsAnalyzing(false);
    }, 450);
  };

  const handleAddToCatalog = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-6 border-b border-zinc-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">KASPI Vision AI • Onboarding Express</h4>
            <p className="text-xs text-zinc-400">Extrayez nom, prix et code-barres par simple photo de l'emballage</p>
          </div>
        </div>

        <button
          onClick={handleNextScan}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition"
        >
          <Camera className="w-3.5 h-3.5 text-purple-400" />
          <span>Scanner un autre article</span>
        </button>
      </div>

      {/* Grid: Viewfinder Left, Extracted Data Right */}
      <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left: Futuristic Smartphone Camera Viewfinder (5 cols) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-64 h-80 rounded-3xl border-2 border-zinc-700 bg-zinc-900/90 p-4 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Camera Corner Brackets */}
            <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-purple-400" />
            <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-purple-400" />
            <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-purple-400" />
            <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-purple-400" />

            {/* Sweeping Laser Beam */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse shadow-[0_0_12px_rgba(192,132,252,0.8)]" />

            {/* Top HUD */}
            <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-purple-300 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                OCR Actif
              </span>
              <span>1080p • 60 FPS</span>
            </div>

            {/* Simulated Product Target in Viewfinder */}
            <div className="my-auto text-center space-y-2 py-4">
              <div className="w-24 h-28 mx-auto rounded-xl bg-zinc-800/90 border border-zinc-700 flex flex-col items-center justify-center p-2 shadow-inner">
                <Tag className="w-8 h-8 text-zinc-500 mb-1" />
                <span className="text-[10px] font-mono text-zinc-300 font-bold truncate max-w-[80px]">
                  {current.name.split(" ")[0]}
                </span>
                <span className="text-[8px] font-mono text-zinc-500">{current.barcode.slice(-5)}</span>
              </div>
              <p className="text-[11px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-md inline-block">
                Cible identifiée en 0.28s
              </p>
            </div>

            {/* Bottom HUD */}
            <div className="relative z-10 text-center">
              <span className="text-[10px] font-mono text-zinc-400 bg-black/50 px-3 py-1 rounded-full">
                Gemini 2.5 Flash Vision Engine
              </span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Extracted Data (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Données Extraites Instantanément
            </span>
            <span className="text-[11px] font-mono text-zinc-500">Précision : 99.8%</span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-500">Désignation Produit</span>
              <h3 className="text-lg font-bold text-white mt-0.5">{current.name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500">Code-Barres (EAN-13)</span>
                <p className="text-sm font-mono font-bold text-zinc-200 mt-0.5">{current.barcode}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500">Catégorie Suggérée</span>
                <p className="text-sm font-semibold text-zinc-200 mt-0.5">{current.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800/80">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Prix d'Achat HT</span>
                <p className="text-sm font-black text-white font-mono mt-0.5">{current.costPrice.toFixed(2)} DH</p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Prix de Vente</span>
                <p className="text-sm font-black text-emerald-400 font-mono mt-0.5">{current.salePrice.toFixed(2)} DH</p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Marge Nette</span>
                <p className="text-sm font-black text-purple-400 font-mono mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{current.margin.toFixed(1)}%
                </p>
              </div>
            </div>

            <button
              onClick={handleAddToCatalog}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                added
                  ? "bg-emerald-500 text-black shadow-emerald-500/20"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {added ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Produit Enregistré dans le Catalogue Local</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Enregistrer dans mon Catalogue en 1 Clic</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
