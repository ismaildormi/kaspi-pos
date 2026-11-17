"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  Laptop,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  PlusCircle,
  XCircle,
  Eye,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import { KaspiBrandMark } from "@/components/common/KaspiBrandMark";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";

interface ConflictTicket {
  id: string;
  tenantId: string;
  conflictReason: string;
  screenshotData: string | null;
  primarySummary: any;
  secondarySummary: any;
  merchantNote: string | null;
  strikeCount: number;
  status: string;
  resolutionAction: string | null;
  adminNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  tenant?: {
    id: string;
    displayName: string;
    legalName: string;
    city: string | null;
    maxDevices: number;
    subscriptions?: Array<{ planCode: string; status: string }>;
  };
  posteBinding?: {
    id: string;
    status: string;
    conflictStrikes: number;
    primaryDeviceName: string | null;
    secondaryDeviceName: string | null;
  };
}

export default function AdminConflictTicketsPage() {
  const [tickets, setTickets] = useState<ConflictTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/conflict-tickets");
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Error fetching conflict tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleResolveAction = async (
    ticketId: string,
    action: "UNLOCK_PRIMARY" | "AUTHORIZE_NEW_PC" | "REQUIRE_EXTRA_POSTE" | "SUSPEND"
  ) => {
    setProcessingId(ticketId);
    setSuccessBanner(null);

    try {
      const res = await fetch("/api/admin/conflict-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(data.message || `Action ${action} appliquée avec succès.`);
        await fetchTickets();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      alert("Network error executing action");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === "OPEN") return t.status === "OPEN";
    if (filter === "RESOLVED") return t.status === "RESOLVED";
    return true;
  });

  return (
    <div className="space-y-8 pb-16 font-sans text-white select-none">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-5">
          <KaspiBrandMark size="md" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                تذاكر الدعم وحماية لي بوست (Seat Conflict & Anti-Sharing)
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Contrôle strict des licences 1-Poste (200 MAD/mois) • Prévention du partage de compte • Déblocage gracieux
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour Command Center
          </Link>
          <button
            onClick={fetchTickets}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-zinc-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4 text-xs font-bold">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-xl transition ${
            filter === "ALL" ? "bg-white text-black shadow" : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          Toutes les têtes de conflit ({tickets.length})
        </button>
        <button
          onClick={() => setFilter("OPEN")}
          className={`px-4 py-2 rounded-xl transition ${
            filter === "OPEN" ? "bg-amber-400 text-black shadow" : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          En attente / Bloqués ({tickets.filter((t) => t.status === "OPEN").length})
        </button>
        <button
          onClick={() => setFilter("RESOLVED")}
          className={`px-4 py-2 rounded-xl transition ${
            filter === "RESOLVED" ? "bg-emerald-500 text-black shadow" : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          Résolus ({tickets.filter((t) => t.status === "RESOLVED").length})
        </button>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-20 text-zinc-500 text-sm">Chargement des alertes de conflit matériel...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-zinc-400">
          <ShieldAlert className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Aucun conflit matériel actif</h3>
          <p className="text-xs text-zinc-500 mt-1">Tous les commerces respectent leur quota de terminaux 1-Poste.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredTickets.map((ticket) => {
            const isResolved = ticket.status === "RESOLVED";
            const isProcessing = processingId === ticket.id;

            return (
              <div
                key={ticket.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-zinc-800 text-amber-400 border border-zinc-700">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">
                          {ticket.tenant?.displayName || ticket.tenant?.legalName || "Commerce KASPI"}
                        </h2>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {ticket.tenant?.city || "Maroc"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Capacité souscrite: <strong className="text-white">{ticket.tenant?.maxDevices || 1} Poste(s)</strong> •
                        Plan: <strong className="text-white">{ticket.tenant?.subscriptions?.[0]?.planCode || "standard-200mad"}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        isResolved
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                          : ticket.strikeCount >= 3
                          ? "bg-red-950/60 text-red-300 border-red-800 animate-pulse"
                          : "bg-amber-950/60 text-amber-300 border-amber-800"
                      }`}
                    >
                      {isResolved
                        ? "RÉSOLU"
                        : ticket.strikeCount >= 3
                        ? `HARD ADMIN LOCK (${ticket.strikeCount} Frappes)`
                        : `DUAL LOCKDOWN (${ticket.strikeCount}/3)`}
                    </span>
                  </div>
                </div>

                {/* Device Comparison Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary PC */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <Laptop className="w-4 h-4" />
                      <span>Poste Agréé #1 (Propriétaire du slot)</span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-white">
                      {ticket.primarySummary?.name || ticket.posteBinding?.primaryDeviceName || "PC Primaire"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400 space-y-0.5">
                      <div>OS: {ticket.primarySummary?.os || "Windows"}</div>
                      <div>Lié initialement: {ticket.primarySummary?.boundAt ? new Date(ticket.primarySummary.boundAt).toLocaleDateString() : "Active"}</div>
                    </div>
                  </div>

                  {/* Secondary PC */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Poste #2 Détecté (Tentative de connexion)</span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-white">
                      {ticket.secondarySummary?.name || ticket.posteBinding?.secondaryDeviceName || "Second Appareil"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400 space-y-0.5">
                      <div>OS: {ticket.secondarySummary?.os || "Inconnu"}</div>
                      <div>Date du conflit: {new Date(ticket.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Merchant Note & Screenshot Viewer */}
                <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 space-y-2">
                  <div className="text-xs font-semibold text-zinc-400">Message / Justification du commerçant :</div>
                  <p className="text-sm text-zinc-200 italic">
                    "{ticket.merchantNote || "Aucune note explicative transmise."}"
                  </p>

                  {ticket.screenshotData && (
                    <div className="pt-2">
                      <button
                        onClick={() => setSelectedScreenshot(ticket.screenshotData)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                        Voir la capture écran transmise
                      </button>
                    </div>
                  )}
                </div>

                {/* Instant Admin Actions */}
                {!isResolved && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => handleResolveAction(ticket.id, "UNLOCK_PRIMARY")}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isProcessing ? "..." : "فك القفل للجهاز الأصلي (Unlock Primary PC)"}</span>
                    </button>

                    <button
                      onClick={() => handleResolveAction(ticket.id, "AUTHORIZE_NEW_PC")}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs transition flex items-center gap-2"
                    >
                      <Laptop className="w-4 h-4" />
                      <span>{isProcessing ? "..." : "اعتماد الجهاز الجديد كجهاز رسمي (Authorize New PC)"}</span>
                    </button>

                    <button
                      onClick={() => handleResolveAction(ticket.id, "REQUIRE_EXTRA_POSTE")}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{isProcessing ? "..." : "إلزام إضافة بوست +150 MAD (Require +1 Poste)"}</span>
                    </button>

                    <button
                      onClick={() => handleResolveAction(ticket.id, "SUSPEND")}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs transition flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{isProcessing ? "..." : "تعليق الحساب (Suspend)"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Preview Lightbox */}
      <KaspiGlassModalPortal
        isOpen={Boolean(selectedScreenshot)}
        onClose={() => setSelectedScreenshot(null)}
      >
        <div className="max-w-3xl w-full bg-zinc-900 border border-zinc-700 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white">Capture d'écran du terminal au moment du conflit</h3>
            <button onClick={() => setSelectedScreenshot(null)} className="text-zinc-400 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedScreenshot || ""} alt="Conflict Screenshot" className="w-full h-auto object-contain" />
          </div>
        </div>
      </KaspiGlassModalPortal>
    </div>
  );
}
