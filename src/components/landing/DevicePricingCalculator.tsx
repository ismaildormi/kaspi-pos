"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Monitor, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export function DevicePricingCalculator() {
  const [deviceCount, setDeviceCount] = useState<number>(1);
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [currency, setCurrency] = useState<"MAD" | "USD">("MAD");

  // Base: 200 MAD / $20 for 1st device
  // Extra: +150 MAD / +$15 per additional device
  const basePriceMAD = 200;
  const extraPriceMAD = 150;

  const totalMonthlyMAD = basePriceMAD + Math.max(0, deviceCount - 1) * extraPriceMAD;
  const effectiveMonthlyMAD = isAnnual ? Math.round(totalMonthlyMAD * 0.8) : totalMonthlyMAD;

  const displayPrice =
    currency === "MAD"
      ? `${effectiveMonthlyMAD} MAD`
      : `$${Math.round(effectiveMonthlyMAD / 10)}`;

  const savingsMAD = (totalMonthlyMAD - effectiveMonthlyMAD) * 12;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Popular Badge */}
      <div className="absolute top-6 right-6">
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-black uppercase tracking-wider shadow-md">
          Tarif Transparent Sans Engagement
        </span>
      </div>

      <div className="text-left space-y-2 mb-8 max-w-xl">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Calculez votre tarif sur-mesure
        </h3>
        <p className="text-sm text-zinc-400">
          Une seule caisse pour votre épicerie ou 10 caisses pour votre supermarché : payez uniquement ce que vous utilisez.
        </p>
      </div>

      {/* Switchers Row: Billing Cycle & Currency */}
      <div className="flex flex-wrap items-center justify-between pb-8 border-b border-zinc-800 gap-4">
        {/* Monthly / Annual Toggle */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-full text-xs font-mono">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-1.5 rounded-full transition ${
              !isAnnual ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Facturation Mensuelle
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 ${
              isAnnual ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>Annuel (-20%)</span>
            <span className="rounded bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 font-bold">
              Économisez 2 mois
            </span>
          </button>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg text-xs font-mono">
          <button
            onClick={() => setCurrency("MAD")}
            className={`px-2.5 py-1 rounded transition ${
              currency === "MAD" ? "bg-zinc-800 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            MAD (درهم)
          </button>
          <button
            onClick={() => setCurrency("USD")}
            className={`px-2.5 py-1 rounded transition ${
              currency === "USD" ? "bg-zinc-800 text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* Interactive Slider Section */}
      <div className="py-8 space-y-6">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Nombre de Caisses Actives</span>
            <p className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-1">
              <Monitor className="w-5 h-5 text-zinc-400" />
              <span>
                {deviceCount} {deviceCount === 1 ? "Caisse / Terminal" : "Caisses / Terminaux"}
              </span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-zinc-500">Tarif par mois</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {displayPrice}
              <span className="text-xs font-normal text-zinc-400"> / mois</span>
            </div>
            {isAnnual && (
              <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                Économie annuelle : {savingsMAD} MAD
              </p>
            )}
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={deviceCount}
            onChange={(e) => setDeviceCount(Number(e.target.value))}
            className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-[11px] font-mono text-zinc-500">
            <span>1 Caisse (200 MAD)</span>
            <span>2 Caisses (350 MAD)</span>
            <span>3 Caisses (500 MAD)</span>
            <span>5 Caisses (800 MAD)</span>
            <span>10 Caisses (1,550 MAD)</span>
          </div>
        </div>

        {/* Dynamic Scale Description */}
        <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-300 gap-3">
          <div className="space-y-1">
            <span className="font-bold text-white">
              {deviceCount === 1 && "Formule Idéale Épicerie de Quartier (1 Poste - 200 DH)"}
              {deviceCount === 2 && "Formule Supérette (2 Postes Simultanés - 350 DH)"}
              {deviceCount === 3 && "Formule Commerce Établi (3 Postes - 500 DH)"}
              {deviceCount > 3 && deviceCount < 6 && `Formule Supermarché (${deviceCount} Postes - ${200 + (deviceCount - 1) * 150} DH)`}
              {deviceCount >= 6 && `Formule Grande Distribution & Chaîne (${deviceCount} Postes)`}
            </span>
            <p className="text-zinc-400 text-[11px]">
              Comprend 1 caisse principale ({currency === "MAD" ? "200 MAD" : "$20"}) + {deviceCount - 1} caisse
              {deviceCount - 1 > 1 ? "s" : ""} additionnelle{deviceCount - 1 > 1 ? "s" : ""} (+
              {currency === "MAD" ? "150 MAD" : "$15"}/caisse).
            </p>
          </div>
          <span className="shrink-0 text-emerald-400 font-mono font-bold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
            Évolue selon votre croissance
          </span>
        </div>
      </div>

      {/* Features Checklist */}
      <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>Ventes &amp; encaissements 100% hors-ligne illimités</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>Numérotation séquentielle certifiée DGI &amp; ICE</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>Rapports Z-Report quotidiens envoyés sur WhatsApp</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>Conseiller IA &amp; scan factures par photo (Vision OCR)</span>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <span className="text-xs text-zinc-400">Paiement sécurisé par carte marocaine (YouCan Pay) ou internationale (Paddle).</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/download"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition shadow-lg text-center"
          >
            Télécharger pour Windows (.exe)
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-semibold text-xs hover:bg-zinc-800 transition text-center"
          >
            Espace Client
          </Link>
        </div>
      </div>
    </div>
  );
}
