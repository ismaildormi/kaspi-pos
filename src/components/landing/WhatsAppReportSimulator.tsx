"use client";

import React, { useState } from "react";
import { MessageSquare, CheckCheck, Clock, ShieldCheck, ArrowUpRight, Sparkles, AlertTriangle, Send } from "lucide-react";

export function WhatsAppReportSimulator() {
  const [activeReport, setActiveReport] = useState<"daily" | "monthly">("daily");

  return (
    <div className="relative w-full rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 md:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Background WhatsApp Emerald Glow */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center justify-between">
        {/* Left Column: Context & Conversion Selling Points */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
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

        {/* Right Column: Realistic WhatsApp Phone Mockup */}
        <div className="w-full max-w-sm rounded-[38px] border-[5px] border-zinc-800 bg-[#0b141a] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden font-sans">
          {/* Phone Notch & Status Bar */}
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

          {/* WhatsApp Chat Header */}
          <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-zinc-700/60">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="KASPI Bot"
                  className="w-9 h-9 rounded-full bg-zinc-950 object-contain p-1 border border-zinc-700"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#1f2c34]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">KASPI POS Assistant</span>
                  <span className="rounded bg-emerald-500/20 text-emerald-400 px-1 py-0.2 text-[9px] font-mono">OFFICIEL</span>
                </div>
                <p className="text-[10px] text-emerald-400">en ligne</p>
              </div>
            </div>
          </div>

          {/* Chat Body */}
          <div className="p-4 space-y-4 min-h-[380px] bg-[#0b141a] bg-opacity-95 flex flex-col justify-end">
            {/* Timestamp Badge */}
            <div className="flex justify-center">
              <span className="rounded-lg bg-[#182229] px-2.5 py-1 text-[10px] text-zinc-400 font-mono">
                AUJOURD&apos;HUI
              </span>
            </div>

            {/* Simulated Report Bubble */}
            {activeReport === "daily" ? (
              <div className="self-end max-w-[92%] rounded-2xl rounded-tr-xs bg-[#005c4b] p-3.5 text-white shadow-md text-xs space-y-2 border border-emerald-600/40 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-emerald-400/30 pb-1.5 font-bold text-[11px] text-emerald-100">
                  <span>📊 RAPPORT Z DU JOUR • CAISSE #01</span>
                  <span className="font-mono text-[10px]">23:59</span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Ventes Totales :</span>
                    <span className="font-bold text-white text-sm">4,500.00 MAD</span>
                  </div>
                  <div className="flex justify-between text-emerald-200 text-[10px]">
                    <span>• Espèces en caisse :</span>
                    <span>3,000.00 MAD</span>
                  </div>
                  <div className="flex justify-between text-emerald-200 text-[10px]">
                    <span>• Carte CMI / TPE :</span>
                    <span>1,500.00 MAD</span>
                  </div>
                </div>

                <div className="border-t border-emerald-400/20 pt-1.5 text-[11px] space-y-1">
                  <p className="text-emerald-100">
                    🏆 <strong>Top Produit :</strong> Coca Cola 33cl (48 unités)
                  </p>
                  <p className="text-amber-200 flex items-center gap-1 text-[10px]">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <strong>Alerte Stock :</strong> 3 articles sous le seuil critique (Lait Centrale, Biscuits Bimo)
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-emerald-400/20 text-[9px] text-emerald-200 font-mono">
                  <span>Tickets #482 à #582 (100% séquentiel)</span>
                  <span className="flex items-center gap-0.5 text-[#53bdeb]">
                    <CheckCheck className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ) : (
              <div className="self-end max-w-[92%] rounded-2xl rounded-tr-xs bg-[#005c4b] p-3.5 text-white shadow-md text-xs space-y-2 border border-emerald-600/40 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-emerald-400/30 pb-1.5 font-bold text-[11px] text-emerald-100">
                  <span>📈 BILAN MENSUEL AUTOMATIQUE</span>
                  <span className="font-mono text-[10px]">00:01</span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Total Chiffre d&apos;Affaires :</span>
                    <span className="font-bold text-white text-sm">85,000.00 MAD</span>
                  </div>
                  <div className="flex justify-between text-emerald-200 text-[10px]">
                    <span>• Progression Marge Nette :</span>
                    <span className="text-emerald-300 font-bold">+15% vs Mois Précédent</span>
                  </div>
                  <div className="flex justify-between text-emerald-200 text-[10px]">
                    <span>• Meilleur Jour de Vente :</span>
                    <span>Vendredi (Moyenne 6,800 MAD)</span>
                  </div>
                </div>

                <div className="border-t border-emerald-400/20 pt-1.5 text-[10px] text-emerald-100">
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
