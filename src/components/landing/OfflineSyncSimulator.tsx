"use client";

import React, { useState } from "react";
import {
  Wifi,
  WifiOff,
  Cloud,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Server,
} from "lucide-react";

export function OfflineSyncSimulator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("À l'instant");

  const toggleConnection = () => {
    if (isOnline) {
      // Go offline
      setIsOnline(false);
      setOfflineQueue((prev) => (prev === 0 ? 3 : prev));
    } else {
      // Reconnect & flush
      setIsOnline(true);
      if (offlineQueue > 0) {
        setIsSyncing(true);
        setTimeout(() => {
          setIsSyncing(false);
          setOfflineQueue(0);
          setLastSyncTime("Maintenant (0 doublons)");
        }, 1200);
      }
    }
  };

  const addOfflineSale = () => {
    setOfflineQueue((prev) => prev + 1);
  };

  return (
    <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl overflow-hidden relative">
      {/* Background ambient glow */}
      <div
        className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isOnline ? "bg-emerald-500/10" : "bg-amber-500/10"
        }`}
      />

      {/* Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"
              }`}
            />
            <span className="text-sm font-bold text-white tracking-tight">
              {isOnline ? "Connexion Réseau Active" : "Coupure Totale Internet (Mode Hors-Ligne)"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-mono border ${
                isOnline
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                  : "bg-amber-950/60 text-amber-400 border-amber-800"
              }`}
            >
              {isOnline ? "Cloud Sync Live" : "Zero Crash Engine"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Testez la résilience : simulez une coupure WiFi pendant un encaissement.
          </p>
        </div>

        {/* Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleConnection}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
              isOnline
                ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                : "bg-emerald-500 text-black hover:bg-emerald-400 font-extrabold"
            }`}
          >
            {isOnline ? (
              <>
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span>Simuler Coupure WiFi</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span>Rétablir le WiFi</span>
              </>
            )}
          </button>

          {!isOnline && (
            <button
              onClick={addOfflineSale}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 transition"
            >
              <span>+ Encaisser une vente</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Sync Pipeline Visualizer */}
      <div className="py-8 grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        
        {/* Node 1: Local Device (SQLite + Dexie) */}
        <div className="md:col-span-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Caisse Locale (Client)
            </span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white">SQLite &amp; Dexie.js</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Base de données locale intégrée. Sauvegarde en mémoire &lt;5ms.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-mono">Boîte d'envoi locale :</span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded ${
                offlineQueue > 0
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-zinc-900 text-zinc-400"
              }`}
            >
              {offlineQueue} vente{offlineQueue > 1 ? "s" : ""} en attente
            </span>
          </div>
        </div>

        {/* Center: Data Stream Bridge (3 cols) */}
        <div className="md:col-span-3 flex flex-col items-center justify-center py-4 space-y-2">
          {isSyncing ? (
            <div className="flex flex-col items-center space-y-2">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
              <span className="text-[11px] font-mono text-emerald-400 font-bold animate-pulse">
                Vidage de la file ({offlineQueue} ventes)...
              </span>
            </div>
          ) : isOnline ? (
            <div className="flex flex-col items-center space-y-1 text-center">
              <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3 h-3" /> Clés d'Idempotence Actives
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1 text-center">
              <div className="h-0.5 w-full bg-zinc-800" />
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 pt-1">
                <AlertTriangle className="w-3 h-3" /> Mode Déconnecté Sécurisé
              </span>
            </div>
          )}
        </div>

        {/* Node 2: Neon Cloud DB (PostgreSQL) */}
        <div className="md:col-span-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Cloud Centralisé
            </span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white">Neon PostgreSQL &amp; Supavisor</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Agrégation multi-boutiques avec isolation stricte RLS.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Dernier Sync :</span>
            <span className="text-zinc-200 font-bold">{lastSyncTime}</span>
          </div>
        </div>

      </div>

      {/* Footer Guarantee */}
      <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-500 font-mono gap-2">
        <span>✓ Zéro risque de double encaissement (Idempotency UUIDv4)</span>
        <span>✓ Stock tampon chiffré sur le disque local</span>
        <span>✓ Rapprochement automatique à la seconde</span>
      </div>
    </div>
  );
}
