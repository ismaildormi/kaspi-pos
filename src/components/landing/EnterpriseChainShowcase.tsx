"use client";

import React, { useState } from "react";
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  Layers,
  ArrowRight,
  Receipt,
  Store,
  MapPin,
  CheckCircle2,
  Lock,
} from "lucide-react";

const DEMO_CHAIN_STORES = [
  { id: "1", name: "Magasin #01 — Casablanca Maarif", city: "Casablanca", todaySales: "48,250 DH", orders: 384, status: "En ligne" },
  { id: "2", name: "Magasin #02 — Rabat Agdal", city: "Rabat", todaySales: "39,120 DH", orders: 295, status: "En ligne" },
  { id: "3", name: "Magasin #03 — Marrakech Guéliz", city: "Marrakech", todaySales: "54,800 DH", orders: 412, status: "En ligne" },
  { id: "4", name: "Magasin #04 — Tanger City Center", city: "Tanger", todaySales: "42,650 DH", orders: 330, status: "En ligne" },
];

export function EnterpriseChainShowcase() {
  const [activeTab, setActiveTab] = useState<"stores" | "dgi">("stores");

  return (
    <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-zinc-800 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono text-zinc-300 mb-2">
            <Building2 className="w-3.5 h-3.5 text-white" />
            <span>Architecture Enterprise Multi-Boutiques</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Prêt pour 1 boutique comme pour un réseau de 50 magasins
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Supervisez tous vos points de vente en temps réel depuis Casablanca ou l'étranger avec isolation stricte des données.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs font-mono shrink-0">
          <button
            onClick={() => setActiveTab("stores")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "stores" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Supervision Réseau
          </button>
          <button
            onClick={() => setActiveTab("dgi")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "dgi" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Certification Fiscale DGI
          </button>
        </div>
      </div>

      {activeTab === "stores" ? (
        /* Multi-Store Grid View */
        <div className="pt-8 space-y-6">
          {/* KPI Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Chiffre d'Affaires Global (Aujourd'hui)</span>
              <p className="text-xl sm:text-2xl font-black text-white font-mono mt-1">184,820 MAD</p>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +14.2% vs semaine passée
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Points de Vente Connectés</span>
              <p className="text-xl sm:text-2xl font-black text-white font-mono mt-1">48 / 48 Stores</p>
              <span className="text-[10px] font-mono text-emerald-400 mt-1 block">100% opérationnels</span>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Volume de Transactions</span>
              <p className="text-xl sm:text-2xl font-black text-white font-mono mt-1">1,421 Tickets</p>
              <span className="text-[10px] font-mono text-zinc-400 mt-1 block">Moyenne: 130 MAD/panier</span>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Transferts Inter-Dépôts</span>
              <p className="text-xl sm:text-2xl font-black text-white font-mono mt-1">12 En Transit</p>
              <span className="text-[10px] font-mono text-zinc-400 mt-1 block">Équilibrage de stock</span>
            </div>
          </div>

          {/* Store Rows */}
          <div className="space-y-3">
            {DEMO_CHAIN_STORES.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900 transition gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white shrink-0">
                    <Store className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{s.name}</h4>
                    <p className="text-xs text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{s.city}</span>
                      <span>•</span>
                      <span>{s.orders} tickets émis</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <span className="text-sm font-black text-white font-mono">{s.todaySales}</span>
                    <span className="text-[10px] font-mono text-emerald-400 block">Z-Report prêt</span>
                  </div>
                  <span className="rounded-full bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 text-[10px] font-mono text-emerald-400">
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* DGI Compliance Deep Dive */
        <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white">
              <Receipt className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Numérotation Séquentielle Sans Saut</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              KASPI POS applique une politique stricte de verrouillage de ligne PostgreSQL (SELECT ... FOR UPDATE). Même en cas de 50 caissiers validant simultanément, chaque facture reçoit un numéro chronologique séquentiel infalsifiable (ex: FAC-2026-000001 à FAC-2026-000050) sans aucun doublon ni saut de numéro.
            </p>
            <ul className="space-y-2 text-xs text-zinc-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verrouillage transactionnel ACID niveau banque</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mentions légales obligatoires (ICE, IF, RC, Patente)</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white">
              <Lock className="w-5 h-5 text-indigo-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Isolation Stricte PostgreSQL RLS</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              La sécurité multi-locataire est assurée au niveau du moteur de la base de données via Row-Level Security (RLS). Aucune requête ne peut accéder aux chiffres d'affaires, marges ou clients d'un autre magasin. Chaque boutique dispose d'une cloison étanche garantie par code cryptographique.
            </p>
            <ul className="space-y-2 text-xs text-zinc-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Zéro fuite de données inter-magasins</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Audit trail complet de chaque opération caisse</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
