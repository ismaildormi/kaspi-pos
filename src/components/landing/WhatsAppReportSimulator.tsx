"use client";

import React, { useState } from "react";
import { CheckCheck, Clock, ShieldCheck, ArrowUpRight, Sparkles, AlertTriangle, Send } from "lucide-react";

export function WhatsAppReportSimulator() {
  const [activeReport, setActiveReport] = useState<"daily" | "monthly">("daily");

  const todayFormatted = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative w-full rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 md:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Background WhatsApp Emerald Glow */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center justify-between">
        {/* Left Column: Context & Conversion Selling Points */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            {/* Real WhatsApp SVG icon */}
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-emerald-400">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            La Sérénité Absolue du Commerçant
          </div>

          <div>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Votre magasin dans votre poche via WhatsApp.
            </h3>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Pas besoin d’ouvrir votre ordinateur portable ou d’installer une énième application complexe.
              Chaque soir à 23h59, recevez automatiquement le récapitulatif complet de votre caisse et de vos marges directement sur votre numéro WhatsApp personnel.
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex rounded-2xl bg-zinc-900/90 p-1.5 border border-zinc-800 max-w-md">
            <button
              onClick={() => setActiveReport("daily")}
              className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeReport === "daily"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Rapport Z Quotidien (23h59)
            </button>
            <button
              onClick={() => setActiveReport("monthly")}
              className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeReport === "monthly"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Bilan Mensuel Stratégique
            </button>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-1">
              <span className="text-emerald-400 font-bold block flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> 100% Chiffré de bout en bout
              </span>
              <p className="text-zinc-500 text-[11px]">Directement envoyé de votre terminal vers votre numéro privé.</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-1">
              <span className="text-white font-bold block flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" /> Zéro Application Requise
              </span>
              <p className="text-zinc-500 text-[11px]">Consultez vos chiffres en déplacement, à la maison ou en voyage.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Realistic WhatsApp Phone Mockup with Official WhatsApp Header */}
        <div className="w-full max-w-sm rounded-[38px] border-[5px] border-zinc-800 bg-[#0b141a] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden font-sans">
          {/* Phone Status Bar */}
          <div className="bg-[#1f2c34] px-5 py-2.5 flex items-center justify-between text-[11px] text-zinc-300 border-b border-zinc-800">
            <span className="font-semibold">23:59</span>
            <div className="w-20 h-4 bg-zinc-950 rounded-full" />
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2.5 border border-zinc-300 rounded-sm p-0.5">
                <div className="w-full h-full bg-emerald-400 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* WhatsApp Chat Header with Real WhatsApp Logo & Contact */}
          <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-zinc-700/60">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center p-2 shadow-md">
                  {/* Real WhatsApp SVG Logo */}
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#1f2c34]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">KASPI POS Officiel</span>
                  <span className="text-emerald-400 text-xs">✓</span>
                </div>
                <p className="text-[10px] text-emerald-400">Compte professionnel vérifié</p>
              </div>
            </div>
          </div>

          {/* Chat Body */}
          <div className="p-4 space-y-4 min-h-[420px] bg-[#0b141a] bg-opacity-95 flex flex-col justify-end">
            {/* Timestamp Badge */}
            <div className="flex justify-center">
              <span className="rounded-lg bg-[#182229] px-2.5 py-1 text-[10px] text-zinc-400 font-mono">
                AUJOURD&apos;HUI
              </span>
            </div>

            {/* Simulated Detailed Financial Report Bubble */}
            {activeReport === "daily" ? (
              <div className="self-end max-w-[95%] rounded-2xl rounded-tr-xs bg-[#005c4b] p-3.5 text-white shadow-md text-xs space-y-2.5 border border-emerald-600/40 animate-in fade-in duration-300">
                <div className="border-b border-emerald-400/30 pb-2">
                  <div className="font-black text-xs text-white tracking-wide">
                    📊 RAPPORT Z QUOTIDIEN - KASPI POS
                  </div>
                  <div className="text-[10px] text-emerald-200 font-mono mt-0.5">
                    Date: {todayFormatted} • 23:59
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[11px] bg-black/15 p-2 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-emerald-100">👥 Nombre de clients:</span>
                    <span className="font-bold text-white">142 clients</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-100">🛒 Articles vendus:</span>
                    <span className="font-bold text-white">385 articles</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-400/20 text-white font-extrabold text-xs">
                    <span className="text-emerald-200">💰 Chiffre d&apos;Affaires Total:</span>
                    <span className="text-amber-300">12,450.00 MAD</span>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[11px] bg-black/15 p-2 rounded-xl">
                  <span className="text-emerald-200 font-bold block text-[10px] uppercase">
                    💵 Répartition des paiements:
                  </span>
                  <div className="flex justify-between text-emerald-100 pl-1 text-[10px]">
                    <span>- Espèces (Cash):</span>
                    <span className="font-bold text-white">7,200.00 MAD</span>
                  </div>
                  <div className="flex justify-between text-emerald-100 pl-1 text-[10px]">
                    <span>- Carte CMI/TPE:</span>
                    <span className="font-bold text-white">5,250.00 MAD</span>
                  </div>
                </div>

                <div className="text-[11px] space-y-1 font-sans">
                  <p className="text-emerald-100">
                    🏆 <strong>Top Produit:</strong> Coca Cola 33cl (85 unités)
                  </p>
                  <p className="text-amber-200 text-[10px] flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <strong>Alerte Stock:</strong> 4 articles sous le seuil critique (Lait, Pain, Eau)
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-emerald-400/20 text-[9px] text-emerald-200 font-mono">
                  <span>🧾 Tickets: #842 à #984 (100% séquentiel DGI)</span>
                  <span className="flex items-center gap-0.5 text-[#53bdeb]">
                    <CheckCheck className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ) : (
              <div className="self-end max-w-[95%] rounded-2xl rounded-tr-xs bg-[#005c4b] p-3.5 text-white shadow-md text-xs space-y-2.5 border border-emerald-600/40 animate-in fade-in duration-300">
                <div className="border-b border-emerald-400/30 pb-2">
                  <div className="font-black text-xs text-white tracking-wide">
                    📈 BILAN MENSUEL AUTOMATIQUE - KASPI POS
                  </div>
                  <div className="text-[10px] text-emerald-200 font-mono mt-0.5">
                    Période: Clôture Mensuelle • 00:01
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[11px] bg-black/15 p-2 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Total Chiffre d&apos;Affaires:</span>
                    <span className="font-bold text-amber-300 text-xs">85,000.00 MAD</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-emerald-200">Progression Marge:</span>
                    <span className="text-emerald-300 font-bold">+15% vs Mois Précédent</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-emerald-200">Meilleur Jour:</span>
                    <span className="text-white">Vendredi (Moyenne 6,800 MAD)</span>
                  </div>
                </div>

                <div className="border-t border-emerald-400/20 pt-1 text-[10px] text-emerald-100">
                  <p>📁 <em>Export comptable FEC &amp; récapitulatif TVA générés en pièce jointe PDF conforme DGI.</em></p>
                </div>

                <div className="flex items-center justify-between pt-1 text-[9px] text-emerald-200 font-mono">
                  <span>Prêt pour le comptable</span>
                  <span className="flex items-center gap-0.5 text-[#53bdeb]">
                    <CheckCheck className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Fake Input Bar */}
            <div className="rounded-full bg-[#1f2c34] px-4 py-2 flex items-center justify-between text-zinc-400 text-xs mt-2 border border-zinc-700">
              <span className="text-[11px] text-zinc-500">Tapez &apos;Rapport&apos; pour actualiser...</span>
              <Send className="h-3.5 w-3.5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
