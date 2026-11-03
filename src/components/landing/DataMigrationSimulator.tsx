"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Database,
  RefreshCw,
  Sparkles,
  FileCheck,
} from "lucide-react";

export function DataMigrationSimulator() {
  const [stage, setStage] = useState<"idle" | "uploading" | "mapping" | "validating" | "success">("idle");
  const [progress, setProgress] = useState(0);

  const startSimulation = () => {
    setStage("uploading");
    setProgress(15);

    setTimeout(() => {
      setStage("mapping");
      setProgress(55);
    }, 900);

    setTimeout(() => {
      setStage("validating");
      setProgress(85);
    }, 1800);

    setTimeout(() => {
      setStage("success");
      setProgress(100);
    }, 2700);
  };

  const resetSimulation = () => {
    setStage("idle");
    setProgress(0);
  };

  return (
    <div className="relative w-full rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 md:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-10 -translate-y-1/2 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center justify-between">
        {/* Left Column: Context & Conversion */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-400">
            <Database className="h-3.5 w-3.5" />
            Transition Sans Frictions • Zéro Risque
          </div>

          <div>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Migrez depuis Caissa, POSNEX ou Excel en 2 minutes.
            </h3>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              La peur de perdre son catalogue, ses prix d&apos;achat ou le carnet de crédit des clients fidèles (Carnet Krediat) ne doit plus vous bloquer. KASPI POS importe automatiquement vos fichiers bruts en quelques clics.
            </p>
          </div>

          {/* Guarantee Badges */}
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-emerald-300">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>Garantie 100% Intégrité des Données : Aucun doublon, zéro perte d&apos;historique.</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-zinc-400">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <span className="text-white font-bold block text-sm">✓ Carnet Krediat</span>
                <span className="text-[11px] text-zinc-500">Soldes clients préservés à l&apos;identique.</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <span className="text-white font-bold block text-sm">✓ Codes EAN-13</span>
                <span className="text-[11px] text-zinc-500">Douchette prête sans re-saisie.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Dropzone Mockup */}
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>IMPORTATEUR UNIVERSEL KASPI</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">CSV • XLSX • SQL</span>
          </div>

          {/* Drag & Drop Simulation Canvas */}
          {stage === "idle" && (
            <div
              onClick={startSimulation}
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-zinc-700/80 bg-zinc-900/40 p-8 text-center transition hover:border-sky-400 hover:bg-sky-500/5"
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 group-hover:text-sky-400 group-hover:scale-110 transition duration-300 mb-4">
                <UploadCloud className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-white mb-1">
                Glissez votre ancien fichier de stock ici
              </p>
              <p className="text-xs text-zinc-500 mb-4 font-mono">
                Compatible exports Caissa, POSNEX, Sage ou Excel standard
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-sky-400 shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Lancer la Simulation d&apos;Import
              </button>
            </div>
          )}

          {/* Running Progress State */}
          {(stage === "uploading" || stage === "mapping" || stage === "validating") && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs font-bold text-white mb-1">
                    <span>
                      {stage === "uploading" && "Téléversement de catalogue_ancien_pos.xlsx..."}
                      {stage === "mapping" && "Correspondance automatique des rayons..."}
                      {stage === "validating" && "Vérification des codes-barres & TVA..."}
                    </span>
                    <span className="font-mono text-sky-400">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 font-mono text-[11px] text-zinc-400 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span>Articles détectés :</span>
                  <span className="text-white font-bold">2 450 lignes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Comptes clients Krediat :</span>
                  <span className="text-emerald-400 font-bold">142 comptes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Conflits / Erreurs :</span>
                  <span className="text-emerald-400 font-bold">0 anomalie</span>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {stage === "success" && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 space-y-4 text-center animate-in zoom-in-95 duration-300">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white">
                  2 450 Produits Importés avec Succès
                </h4>
                <p className="text-xs text-emerald-200/80 font-mono mt-1">
                  Tous les codes-barres, marges et soldes clients sont prêts à l&apos;emploi.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={resetSimulation}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
                >
                  Réessayer
                </button>
                <button
                  onClick={resetSimulation}
                  className="rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-black hover:bg-zinc-200 transition"
                >
                  Ouvrir la Caisse
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Support de transition personnalisé offert</span>
            <span className="text-emerald-400 font-semibold">0 DH de frais</span>
          </div>
        </div>
      </div>
    </div>
  );
}
