"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Toaster, toast } from "sonner";
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Clock,
  Radio,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  PlusCircle,
  RefreshCw,
  Utensils,
  AlertTriangle,
  Check,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

export interface KDSTicketItem {
  id: string;
  ticketId: string;
  productId?: string | null;
  productName: string;
  quantity: number | string;
  notes?: string | null;
}

export interface KDSTicket {
  id: string;
  ticketNumber: string;
  storeId: string;
  tenantId: string;
  tableId?: string | null;
  saleId?: string | null;
  status: "new" | "in_progress" | "ready" | "served" | "canceled";
  notes?: string | null;
  sentAt: string;
  readyAt?: string | null;
  servedAt?: string | null;
  items: KDSTicketItem[];
  table?: {
    id: string;
    tableNumber: string;
    name?: string | null;
  } | null;
}

export default function KitchenDisplayPage() {
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "in_progress" | "ready">("all");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio tone generator for kitchen chime
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch {
      // AudioContext may be restricted by browser policy before first interaction
    }
  }, [soundEnabled]);

  // Fetch active tickets from backend API
  const fetchTickets = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await fetch("/api/v1/restaurant/kds/tickets");
      if (res.ok) {
        const json = await res.json();
        const list: KDSTicket[] = json.data?.tickets || json.tickets || [];
        setTickets(list);
      }
    } catch (err) {
      console.error("[KDS] Error fetching tickets:", err);
      if (!isSilent) toast.error("Erreur de chargement des commandes de cuisine");
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  // Update clock every 5 seconds for elapsed cooking timers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Initialize tickets on mount
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // =========================================================================
  // SUPABASE REALTIME SUBSCRIPTION
  // Listens on broadcast channel for instant ticket creation & updates
  // =========================================================================
  useEffect(() => {
    // Channel name matches the tenant broadcast channel (or multi-tenant fallback)
    const channelName = "kds-tenant-default";

    const channel = supabase
      .channel(channelName)
      .on(
        "broadcast",
        { event: "ticket_change" },
        (payload: any) => {
          console.log("[Supabase Realtime KDS] Received live broadcast:", payload);
          const data = payload?.payload;

          if (data?.event === "ticket:created") {
            toast.info(`🔔 Nouvelle commande reçue: #${data?.ticketNumber || ""}`, {
              duration: 4000,
            });
            playAlertSound();
          } else if (data?.event === "ticket:updated") {
            toast.success(`Commande #${data?.ticketNumber || ""} mise à jour (${data?.status})`, {
              duration: 3000,
            });
          }

          // Instantly refresh ticket board
          fetchTickets(true);
        }
      )
      .subscribe((status) => {
        console.log("[Supabase Realtime KDS] Status:", status);
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets, playAlertSound]);

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, newStatus: "in_progress" | "ready" | "served" | "canceled") => {
    try {
      // Optimistic update
      setTickets((prev) =>
        prev
          .map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
          .filter((t) => (newStatus === "served" || newStatus === "canceled" ? false : true))
      );

      const res = await fetch(`/api/v1/restaurant/kds/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
    } catch {
      toast.error("Impossible de mettre à jour le statut du ticket");
      fetchTickets(true);
    }
  };

  // Quick simulation helper to test Supabase Realtime broadcast
  const handleSimulateNewOrder = async () => {
    setIsSubmitting(true);
    try {
      // Fetch available stores
      const storeRes = await fetch("/api/v1/stores");
      let storeId = "";
      if (storeRes.ok) {
        const storeJson = await storeRes.json();
        const stores = storeJson.data?.stores || storeJson.stores || [];
        if (stores.length > 0) storeId = stores[0].id;
      }

      if (!storeId) {
        // Fallback default store
        storeId = "00000000-0000-0000-0000-000000000001";
      }

      const mockItems = [
        { productName: "Tajine Poulet Citron", quantity: 1, notes: "Sans olives" },
        { productName: "Thé à la Menthe (Grand)", quantity: 2, notes: "Peu sucré" },
        { productName: "Couscous Royal Kaspi", quantity: 1, notes: "Sauce harissa à part" },
      ];

      const res = await fetch("/api/v1/restaurant/kds/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          notes: "Table 4 - Commande Express KDS",
          items: mockItems,
        }),
      });

      if (res.ok) {
        toast.success("Commande test créée et diffusée via Supabase Realtime !");
      } else {
        const errJson = await res.json();
        toast.error(errJson.error?.message || "Erreur de création de commande test");
      }
    } catch {
      toast.error("Erreur réseau lors de la simulation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Elapsed cooking time calculation
  const getElapsedMinutes = (sentAt: string) => {
    const diffMs = currentTime - new Date(sentAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });

  const countNew = tickets.filter((t) => t.status === "new").length;
  const countInProgress = tickets.filter((t) => t.status === "in_progress").length;
  const countReady = tickets.filter((t) => t.status === "ready").length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col select-none">
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#ffffff",
            border: "1px solid #27272a",
          },
        }}
      />

      {/* Top KDS Command Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-wide">
                KASPI KDS • Écran Cuisine
              </h1>
              {/* Supabase Realtime Live Indicator */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                  isRealtimeConnected
                    ? "bg-emerald-950/80 border-emerald-700 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : "bg-amber-950/80 border-amber-800 text-amber-300"
                }`}
              >
                <Radio className={`h-3 w-3 ${isRealtimeConnected ? "animate-pulse text-emerald-400" : ""}`} />
                {isRealtimeConnected ? "Supabase Realtime Live" : "Connexion Realtime..."}
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Synchronisation instantanée avec la Caisse POS & Tables
            </p>
          </div>
        </div>

        {/* Status Counters & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Pills */}
          <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Tous ({tickets.length})
            </button>
            <button
              onClick={() => setStatusFilter("new")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "new" ? "bg-amber-500 text-black" : "text-amber-400 hover:text-amber-300"
              }`}
            >
              Nouveau ({countNew})
            </button>
            <button
              onClick={() => setStatusFilter("in_progress")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "in_progress" ? "bg-blue-600 text-white" : "text-blue-400 hover:text-blue-300"
              }`}
            >
              En Préparation ({countInProgress})
            </button>
            <button
              onClick={() => setStatusFilter("ready")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "ready" ? "bg-emerald-600 text-white" : "text-emerald-400 hover:text-emerald-300"
              }`}
            >
              Prêt ({countReady})
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Couper le son" : "Activer le son"}
            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-zinc-500" />}
          </button>

          {/* Refresh Manual */}
          <button
            onClick={() => fetchTickets(false)}
            title="Actualiser les commandes"
            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Simulation Order Button */}
          <button
            onClick={handleSimulateNewOrder}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Simuler Ticket POS
          </button>
        </div>
      </header>

      {/* Main Kitchen Orders Board */}
      <main className="flex-1 p-6 overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 mb-4">
              <Utensils className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-300">Aucune commande en attente</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Toutes les commandes ont été servies. Dès qu’une nouvelle commande est validée sur la caisse, elle apparaîtra ici en temps réel via Supabase Realtime.
            </p>
            <button
              onClick={handleSimulateNewOrder}
              disabled={isSubmitting}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              Créer une commande de test
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTickets.map((ticket) => {
              const elapsedMin = getElapsedMinutes(ticket.sentAt);
              const isUrgent = elapsedMin >= 10;
              const isWarning = elapsedMin >= 5 && elapsedMin < 10;

              return (
                <div
                  key={ticket.id}
                  className={`flex flex-col rounded-2xl border transition shadow-xl overflow-hidden ${
                    ticket.status === "new"
                      ? "bg-zinc-900/90 border-amber-500/50 shadow-amber-500/5 ring-1 ring-amber-500/30"
                      : ticket.status === "in_progress"
                      ? "bg-zinc-900/90 border-blue-500/50 shadow-blue-500/5 ring-1 ring-blue-500/30"
                      : "bg-zinc-900/90 border-emerald-500/50 shadow-emerald-500/5 ring-1 ring-emerald-500/30"
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`px-4 py-3 flex items-center justify-between border-b ${
                      ticket.status === "new"
                        ? "bg-amber-950/40 border-amber-900/50"
                        : ticket.status === "in_progress"
                        ? "bg-blue-950/40 border-blue-900/50"
                        : "bg-emerald-950/40 border-emerald-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white tracking-wider">
                        #{ticket.ticketNumber}
                      </span>
                      {ticket.table ? (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-bold text-zinc-300">
                          Table {ticket.table.tableNumber}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-bold text-zinc-300">
                          À emporter
                        </span>
                      )}
                    </div>

                    {/* Timer Badge */}
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isUrgent
                          ? "bg-red-500 text-white animate-pulse"
                          : isWarning
                          ? "bg-amber-500 text-black"
                          : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {elapsedMin}m
                    </div>
                  </div>

                  {/* Order Notes (if any) */}
                  {ticket.notes && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 font-medium flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span>{ticket.notes}</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="flex-1 p-4 space-y-2.5 overflow-y-auto max-h-64">
                    {ticket.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 pb-2 border-b border-zinc-800/60 last:border-0 last:pb-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-amber-400">
                              {Number(item.quantity)}x
                            </span>
                            <span className="text-sm font-bold text-zinc-100">
                              {item.productName}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-amber-400 font-medium mt-0.5 bg-amber-950/40 px-2 py-0.5 rounded inline-block">
                              ★ {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Footer */}
                  <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center gap-2">
                    {ticket.status === "new" && (
                      <button
                        onClick={() => updateTicketStatus(ticket.id, "in_progress")}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
                      >
                        <Flame className="h-3.5 w-3.5" />
                        Démarrer Préparation
                      </button>
                    )}

                    {ticket.status === "in_progress" && (
                      <button
                        onClick={() => updateTicketStatus(ticket.id, "ready")}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Marquer Prêt
                      </button>
                    )}

                    {ticket.status === "ready" && (
                      <button
                        onClick={() => updateTicketStatus(ticket.id, "served")}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Servi / Terminé
                      </button>
                    )}

                    {/* Cancel Ticket Option */}
                    <button
                      onClick={() => {
                        if (confirm(`Annuler le ticket #${ticket.ticketNumber} ?`)) {
                          updateTicketStatus(ticket.id, "canceled");
                        }
                      }}
                      title="Annuler la commande"
                      className="p-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
