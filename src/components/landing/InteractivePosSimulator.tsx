"use client";

import React, { useState } from "react";
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
  Utensils,
  Shirt,
  ShoppingCart,
  Store,
  Tag,
} from "lucide-react";

export type VerticalType = "supermarket" | "restaurant" | "clothing" | "grocery";

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  category: string;
  badge?: string;
  options?: string[];
}

const VERTICAL_CATALOGS: Record<
  VerticalType,
  { label: string; icon: any; tables?: string[]; sizes?: string[]; products: Product[] }
> = {
  supermarket: {
    label: "Supermarché",
    icon: ShoppingCart,
    products: [
      { id: "sm-1", name: "Pack Lait 6x1L Centrale", barcode: "6111002000888", price: 42.0, category: "Frais", badge: "Pack Éco" },
      { id: "sm-2", name: "Huile Lesieur 5 Litres", barcode: "6111003450912", price: 85.0, category: "Épicerie" },
      { id: "sm-3", name: "Lessive Poudre Ariel 3kg", barcode: "5410076402319", price: 72.0, category: "Ménage", badge: "Promo" },
      { id: "sm-4", name: "Coca Cola Bouteille 2L", barcode: "5449000000996", price: 12.0, category: "Boissons" },
    ],
  },
  restaurant: {
    label: "Restaurant & Fast-Food",
    icon: Utensils,
    tables: ["Table 1 (Salle)", "Table 2 (Salle)", "Terrasse 4", "À Emporter"],
    products: [
      { id: "res-1", name: "Tacos Mixte Gratiné Sauce Algérienne", barcode: "RES-TAC-01", price: 38.0, category: "Tacos", badge: "Best-Seller" },
      { id: "res-2", name: "Pizza 4 Saisons Cuite au Feu", barcode: "RES-PIZ-02", price: 45.0, category: "Pizzas" },
      { id: "res-3", name: "Burger Gourmet Steak Frites", barcode: "RES-BUR-03", price: 40.0, category: "Burgers" },
      { id: "res-4", name: "Soda Canette Fraîche 33cl", barcode: "RES-SOD-04", price: 10.0, category: "Boissons" },
    ],
  },
  clothing: {
    label: "Prêt-à-Porter & Chaussures",
    icon: Shirt,
    sizes: ["Taille S", "Taille M", "Taille L", "Taille XL"],
    products: [
      { id: "cl-1", name: "Sneakers Urban Street Edition", barcode: "CL-SNK-01", price: 280.0, category: "Chaussures", badge: "Nouvelle Collec" },
      { id: "cl-2", name: "T-Shirt Coton Bio Coupe Regular", barcode: "CL-TSH-02", price: 95.0, category: "T-Shirts" },
      { id: "cl-3", name: "Jean Denim Slim Stretch", barcode: "CL-JEA-03", price: 190.0, category: "Pantalons" },
      { id: "cl-4", name: "Casquette Vintage KASPI Edition", barcode: "CL-CAP-04", price: 65.0, category: "Accessoires" },
    ],
  },
  grocery: {
    label: "Épicerie de Quartier (Hanout)",
    icon: Store,
    products: [
      { id: "gr-1", name: "Huile de Table Lesieur 1L", barcode: "6111003450110", price: 18.0, category: "Essentiel", badge: "Indispensable" },
      { id: "gr-2", name: "Eau Minérale Sidi Ali 1.5L", barcode: "6111035000121", price: 6.0, category: "Eaux" },
      { id: "gr-3", name: "Biscuits Bimo Tagger x1", barcode: "6111245000456", price: 3.0, category: "Goûter" },
      { id: "gr-4", name: "Pain Rond Frais Traditionnel", barcode: "6111880000100", price: 1.5, category: "Boulangerie" },
    ],
  },
};

export function InteractivePosSimulator() {
  const [activeVertical, setActiveVertical] = useState<VerticalType>("supermarket");
  const [selectedTable, setSelectedTable] = useState<string>("Table 1 (Salle)");
  const [selectedSize, setSelectedSize] = useState<string>("Taille M");

  const currentConfig = VERTICAL_CATALOGS[activeVertical];

  const [cart, setCart] = useState<{ product: Product; quantity: number; meta?: string }[]>([
    { product: VERTICAL_CATALOGS.supermarket.products[0], quantity: 1 },
    { product: VERTICAL_CATALOGS.supermarket.products[3], quantity: 2 },
  ]);

  const [tenderAmount, setTenderAmount] = useState<number>(100.0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [paidSuccess, setPaidSuccess] = useState<boolean>(false);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.2; // 20% TVA
  const total = subtotal;
  const changeDue = Math.max(0, tenderAmount - total);

  const handleVerticalSwitch = (vertical: VerticalType) => {
    setActiveVertical(vertical);
    const newProducts = VERTICAL_CATALOGS[vertical].products;
    setCart([
      { product: newProducts[0], quantity: 1 },
      { product: newProducts[1], quantity: 1 },
    ]);
    setTenderAmount(vertical === "clothing" ? 400 : vertical === "restaurant" ? 100 : 100);
    setPaidSuccess(false);
  };

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
        const meta =
          activeVertical === "restaurant"
            ? selectedTable
            : activeVertical === "clothing"
            ? selectedSize
            : undefined;
        return [...prev, { product, quantity: 1, meta }];
      });
      setIsScanning(false);
      setPaidSuccess(false);
    }, 300);
  };

  const handleClear = () => {
    setCart([]);
    setPaidSuccess(false);
  };

  const handleQuickPay = () => {
    setPaidSuccess(true);
    setTimeout(() => {
      setPaidSuccess(false);
    }, 3500);
  };

  return (
    <div className="relative w-full rounded-3xl border border-zinc-800 bg-zinc-950/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Laser Scanning Line Animation */}
      {isScanning && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.9)] z-30 pointer-events-none" />
      )}

      {/* TOP MULTI-STORE VERTICAL SELECTOR TABS */}
      <div className="mb-5 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              Adapté à Votre Métier (Sélectionnez votre type de commerce) :
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline-block">
            Moteur Caisse Hybride Modulaire
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { key: "supermarket", icon: ShoppingCart, label: "🛒 Supermarché" },
              { key: "restaurant", icon: Utensils, label: "🍔 Restaurant / Café" },
              { key: "clothing", icon: Shirt, label: "👕 Prêt-à-Porter" },
              { key: "grocery", icon: Store, label: "🏪 Épicerie (Hanout)" },
            ] as const
          ).map((tab) => {
            const isActive = activeVertical === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleVerticalSwitch(tab.key)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? "bg-white text-black border-white shadow-md scale-[1.02]"
                    : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Context Header (e.g., Table picker for restaurant, Size picker for clothing) */}
        {activeVertical === "restaurant" && currentConfig.tables && (
          <div className="mt-3 flex items-center gap-2 flex-wrap bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/60 text-xs">
            <span className="text-zinc-400 font-mono text-[11px]">Affectation Salle/Table :</span>
            {currentConfig.tables.map((table) => (
              <button
                key={table}
                onClick={() => setSelectedTable(table)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedTable === table
                    ? "bg-amber-500 text-black shadow-xs font-bold"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {table}
              </button>
            ))}
          </div>
        )}

        {activeVertical === "clothing" && currentConfig.sizes && (
          <div className="mt-3 flex items-center gap-2 flex-wrap bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/60 text-xs">
            <span className="text-zinc-400 font-mono text-[11px]">Déclinaison Taille Active :</span>
            {currentConfig.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedSize === size
                    ? "bg-sky-500 text-black shadow-xs font-bold"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* POS Terminal Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-3 mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">KASPI POS Terminal #01</span>
              <span className="rounded-full bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
                Mode {currentConfig.label}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Caissier: Karim • Session active #2026-04</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScanProduct(currentConfig.products[0])}
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
              Articles Dédiés {currentConfig.label} (Cliquez pour ajouter)
            </span>
            {lastScannedBarcode && (
              <span className="text-[11px] font-mono text-zinc-500">
                Code: <span className="text-zinc-300">{lastScannedBarcode}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentConfig.products.map((p) => (
              <button
                key={p.id}
                onClick={() => handleScanProduct(p)}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-3.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">
                      {p.category}
                    </span>
                    {p.badge && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-zinc-200 transition line-clamp-2">
                    {p.name}
                  </h4>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <span className="text-sm font-extrabold text-white">
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
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950 p-3 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>Matériel supporté : Tiroir RJ11, Douchette laser, Balance poids/prix</span>
            </div>
            <span className="text-zinc-600">&lt;12ms latence</span>
          </div>
        </div>

        {/* Right: Real-time Ticket & Payment (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 shadow-inner">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" />
                Panier ({cart.reduce((a, b) => a + b.quantity, 0)} articles)
              </span>
              <span className="text-xs font-mono text-zinc-400">DH (MAD)</span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                  Scannez ou cliquez sur un article pour démarrer
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-zinc-950/60 border border-zinc-800/50"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-white line-clamp-1">{item.product.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {item.quantity} x {item.product.price.toFixed(2)} DH {item.meta ? `• ${item.meta}` : ""}
                      </span>
                    </div>
                    <span className="font-bold text-white font-mono shrink-0">
                      {(item.product.price * item.quantity).toFixed(2)} DH
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals & Quick Pay */}
          <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2.5">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Sous-total HT</span>
              <span className="font-mono text-zinc-300">{(subtotal - tax).toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>TVA (20% DGI)</span>
              <span className="font-mono text-zinc-300">{tax.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-zinc-800/80">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Total TTC</span>
              <span className="text-2xl font-black text-white font-mono">{total.toFixed(2)} DH</span>
            </div>

            {/* Change Due (الصرف) Real-time Calculation */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono text-[11px]">Espèces : {tenderAmount.toFixed(2)} DH</span>
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
                  <span>Valider l&apos;Encaissement ({tenderAmount.toFixed(2)} DH)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
