"use client";

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

interface SupportTicket {
  id: string;
  senderName: string;
  senderPhone: string | null;
  subject: string | null;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
}

export default function TenantSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/support");
      const data = await res.json();
      if (data.success) {
        setTickets(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load support messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/v1/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          senderPhone,
          subject,
          message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback("Votre message a été transmis directement à l'équipe Super Admin.");
        setSubject("");
        setMessage("");
        await fetchTickets();
      }
    } catch {
      setFeedback("Erreur lors de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <HelpCircle className="h-6 w-6 text-white" />
            Aide & Support Direct (Super Admin)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Envoyez un message directement à la boîte de réception interne du propriétaire de la plateforme
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Send a Support Message Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Nouveau Message au Support
            </h2>

            {feedback && (
              <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                Votre Nom / Magasin
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Ex: Youssef - Supermarché Atlas"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                Téléphone WhatsApp (pour réponse rapide)
              </label>
              <input
                type="text"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="Ex: +212 600-000000"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                Sujet de la demande
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Configuration imprimante 80mm / Facturation"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                Message détaillé
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre besoin ou problème technique..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-black hover:bg-zinc-200 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Envoi en cours..." : "Envoyer au Super Admin"}
            </button>
          </form>
        </div>

        {/* Right: Ticket History & Replies */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Vos Messages & Réponses de l&apos;Admin
              </h2>
              <span className="text-xs font-mono text-zinc-400">
                {tickets.length} Tickets
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-zinc-500">
                Chargement de vos tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500">
                Aucun message envoyé pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {tickets.map((t) => (
                  <div key={t.id} className="p-5 space-y-3 hover:bg-zinc-950/40 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold text-white">
                          {t.subject || "Assistance Technique"}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          {new Date(t.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          t.status === "resolved" || t.status === "replied"
                            ? "bg-white text-black"
                            : t.status === "read"
                            ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                            : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                        }`}
                      >
                        {t.status === "unread"
                          ? "Envoyé"
                          : t.status === "read"
                          ? "Lu par l'Admin"
                          : t.status === "replied"
                          ? "Répondu"
                          : "Résolu"}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {t.message}
                    </p>

                    {t.adminReply && (
                      <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3.5 space-y-1">
                        <div className="text-[10px] font-mono font-bold uppercase text-white">
                          Réponse du Super Admin :
                        </div>
                        <p className="text-xs text-zinc-300">{t.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
