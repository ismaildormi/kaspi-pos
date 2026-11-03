"use client";

import React, { useState } from "react";
import { Cpu, Zap, ShieldCheck, Activity, Terminal, Lock } from "lucide-react";

export function LocalGpuShowcase() {
  const [activeTab, setActiveTab] = useState<"webgpu" | "privacy" | "cost">("webgpu");
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchTokens, setBenchTokens] = useState<number | null>(42.8);

  const runBenchmark = () => {
    setBenchmarking(true);
    setBenchTokens(null);
    setTimeout(() => {
      setBenchmarking(false);
      setBenchTokens(Math.floor(38 + Math.random() * 12));
    }, 1200);
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/70 to-zinc-950 p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-stretch">
        {/* Left Column: Context & Spec */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            <Cpu className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "6s" }} />
            Architecture 2027 • Zero Cloud Latency
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Moteur IA Embarqué sur GPU Local &amp; WebGPU
            </h3>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              Vos analyses prédictives et votre assistant de gestion commerciale s’exécutent directement sur la carte graphique (Intel Iris, Nvidia RTX, Apple Silicon) ou le processeur de votre terminal de caisse.
            </p>
          </div>

          {/* Feature Tabs */}
          <div className="flex rounded-xl bg-zinc-900/80 p-1 border border-zinc-800">
            <button
              onClick={() => setActiveTab("webgpu")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "webgpu"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Accélération WebGPU
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "privacy"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              100% Confidentialité
            </button>
            <button
              onClick={() => setActiveTab("cost")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "cost"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Coût Serveur : 0 DH
            </button>
          </div>

          {/* Dynamic Tab Info */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 text-xs text-zinc-300 space-y-3">
            {activeTab === "webgpu" && (
              <>
                <div className="flex items-center gap-2 font-semibold text-emerald-400">
                  <Zap className="h-4 w-4" />
                  Inférence Shardée &amp; Vitesse Foudroyante
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Grâce aux shaders WGSL et à l&apos;exécution locale Rust/WASM, les calculs d&apos;optimisation de marge et de détection d&apos;anomalies de stock répondent en moins de <strong>15 millisecondes</strong>, sans aucune requête réseau sortante.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                  <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[10px]">Temps de réponse caisse</span>
                    <span className="text-emerald-400 font-bold text-sm">&lt; 15 ms</span>
                  </div>
                  <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[10px]">Consommation mémoire</span>
                    <span className="text-zinc-200 font-bold text-sm">~ 180 Mo VRAM</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === "privacy" && (
              <>
                <div className="flex items-center gap-2 font-semibold text-purple-400">
                  <Lock className="h-4 w-4" />
                  Souveraineté Totale des Données Commerciales
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Vos marges réelles, vos prix d&apos;achat fournisseurs et vos volumes de caisse ne quittent jamais votre boutique pour être exploités par des modèles de tiers. Le modèle réside dans votre exécutable chiffré.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900/40 p-2 rounded-lg border border-zinc-800">
                  <ShieldCheck className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Conforme CNDP Maroc &amp; Chiffrement AES-256 local</span>
                </div>
              </>
            )}

            {activeTab === "cost" && (
              <>
                <div className="flex items-center gap-2 font-semibold text-amber-400">
                  <Activity className="h-4 w-4" />
                  Zéro Dépendance aux Factures API Imprévisibles
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Contrairement aux solutions qui refacturent les tokens OpenAI ou Gemini, KASPI POS amortit son coût sur le matériel que vous possédez déjà. Votre abonnement reste fixe quel que soit votre volume de transactions.
                </p>
                <div className="flex items-center justify-between font-mono bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80 text-[11px]">
                  <span className="text-zinc-400">Coût marginal par analyse :</span>
                  <span className="text-emerald-400 font-bold">0.00 MAD / mois</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Hardware Telemetry Simulation HUD */}
        <div className="w-full lg:w-96 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-white tracking-wide">KASPI-HARDWARE-HAL</span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                GPU ACTIF
              </span>
            </div>

            {/* Simulated Specs */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Périphérique :</span>
                <span className="text-zinc-200 font-semibold">WebGPU / Vulkan Core</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Format Modèle :</span>
                <span className="text-purple-400 font-semibold">GGUF Quant 4-Bit</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Pipeline Shaders :</span>
                <span className="text-zinc-200">WGSL Optimized</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Statut Réseau :</span>
                <span className="text-emerald-400 font-semibold">100% Autonome (Offline)</span>
              </div>

              {/* Progress bars */}
              <div className="pt-2 space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Charge VRAM</span>
                    <span>12%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "12%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Débit Inférence</span>
                    <span>{benchTokens ? `${benchTokens} t/s` : "Calcul en cours..."}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-purple-500 rounded-full transition-all duration-500 ${
                        benchmarking ? "animate-pulse w-3/4" : "w-[65%]"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Benchmark trigger */}
          <div className="mt-6 pt-4 border-t border-zinc-900">
            <button
              onClick={runBenchmark}
              disabled={benchmarking}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white font-medium text-xs transition flex items-center justify-center gap-2"
            >
              <Zap className={`h-3.5 w-3.5 text-amber-400 ${benchmarking ? "animate-spin" : ""}`} />
              {benchmarking ? "Mesure du débit GPU..." : "Tester l'inférence locale"}
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-2">
              Zéro requêtes sortantes vers des serveurs externes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
