"use client";

import React, { useState, useEffect } from "react";
import {
  Barcode,
  ShoppingBag,
  CreditCard,
  Banknote,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Zap,
  Plus,
  Trash2,
  ArrowRight,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  category: string;
  badge?: string;
}

const DEMO_PRODUCTS: Product[] = [
  { id: "1", name: "Coca Cola 33cl", barcode: "5449000000996", price: 6.0, category: "Boissons", badge: "Populaire" },
  { id: "2", name: "Sidi Ali 1.5L", barcode: "6111035000121", price: 6.0, category: "Eaux" },
  { id: "3", name: "Biscuits Bimo Tagger", barcode: "6111245000456", price: 3.0, category: "Épicerie" },
  { id: "4", name: "Lait Centrale 1L", barcode: "6111002000888", price: 7.0, category: "Crèmerie" },
];

export function InteractivePosSimulator() {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([
    { product: DEMO_PRODUCTS[0], quantity: 1 },
    { product: DEMO_PRODUCTS[1], quantity: 1 },
    { product: DEMO_PRODUCTS[2], quantity: 1 },
  ]);
  const [tenderAmount, setTenderAmount] = useState<number>(20.0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [paidSuccess, setPaidSuccess] = useState<boolean>(false);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.2; // 20% TVA
  const total = subtotal;
  const changeDue = Math.max(0, tenderAmount - total);

  const handleScanProduct = (product: Product) => {
    setIsScanning(true);
    setLastScannedBarcode(product.barcode);

    setTimeout(() => {
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
      setIsScanning(false);
      setPaidSuccess(false);
    }, 350);
  };

  const handleClear = () => {
    setCart([]);
    setPaidSuccess(false);
  };

  const handleQuickPay = () => {
    setPaidSuccess(true);
    setTimeout(() => {
      setPaidSuccess(false);
    }, 3000);
  };

  return (
    <div className="relative w-full rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Laser Scanning Line Animation */}
      {isScanning && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.9)] z-30 pointer-events-none" />
      )}

      {/* Header bar of POS terminal */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-4 mb-5 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">KASPI POS Terminal #01</span>
              <span className="rounded-full bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                &lt;15ms Réactivité
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">Caissier: Karim • Session active #2026-04</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScanProduct(DEMO_PRODUCTS[3])}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition"
          >
            <Barcode className="h-3.5 w-3.5 text-red-400" />
            <span>Simuler Scan Douchette</span>
          </button>
          <button
            onClick={handleClear}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-500 hover:text-zinc-300 transition"
            title="Vider le panier"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: Shelf on Left, Cart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Quick Access Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Rayon Rapide (Cliquez pour scanner)
            </span>
            {lastScannedBarcode && (
              <span className="text-[11px] font-mono text-zinc-500">
                Dernier EAN: <span className="text-zinc-300">{lastScannedBarcode}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            {DEMO_PRODUCTS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleScanProduct(p)}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 text-left transition hover:border-zinc-700 hover:bg-zinc-900 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                      {p.category}
                    </span>
                    {p.badge && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-zinc-200 transition">
                    {p.name}
                  </h4>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <span className="text-base font-extrabold text-white">
                    {p.price.toFixed(2)} <span className="text-xs font-normal text-zinc-400">DH</span>
                  </span>
                  <div className="h-6 w-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-black transition">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Real-time scanner indicator */}
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950 p-3.5 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>Douchette USB &amp; Bluetooth connectée (HID Plug &amp; Play)</span>
            </div>
            <span className="text-zinc-600">Scan à froid : 0.012s</span>
          </div>
        </div>

        {/* Right: Real-time Ticket & Payment (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-inner">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" />
                Ticket en cours ({cart.reduce((a, b) => a + b.quantity, 0)} articles)
              </span>
              <span className="text-xs font-mono text-zinc-400">DH (MAD)</span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                  Scannez un article pour démarrer la vente
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-zinc-950/60 border border-zinc-800/50"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{item.product.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {item.quantity} x {item.product.price.toFixed(2)} DH
                      </span>
                    </div>
                    <span className="font-bold text-white font-mono">
                      {(item.product.price * item.quantity).toFixed(2)} DH
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals & Quick Pay */}
          <div className="mt-5 pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Sous-total HT</span>
              <span className="font-mono text-zinc-300">{(subtotal - tax).toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>TVA (20% DGI)</span>
              <span className="font-mono text-zinc-300">{tax.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-zinc-800/80">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Total TTC</span>
              <span className="text-2xl font-black text-white font-mono">{total.toFixed(2)} DH</span>
            </div>

            {/* Change Due (Robo) Real-time Calculation */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono">Espèces reçues : 20.00 DH</span>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                  الصرف / À Rendre
                </span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {changeDue.toFixed(2)} DH
                </span>
              </div>
            </div>

            {/* Action Pay Button */}
            <button
              onClick={handleQuickPay}
              disabled={cart.length === 0}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                paidSuccess
                  ? "bg-emerald-500 text-black shadow-emerald-500/20"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {paidSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ticket Encaissé &amp; Imprimé (Tiroir Ouvert)</span>
                </>
              ) : (
                <>
                  <Banknote className="h-4 w-4" />
                  <span>Valider l'Encaissement (20.00 DH)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
