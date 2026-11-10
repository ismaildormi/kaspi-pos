"use client";

import React, { useState } from "react";
import { Mail, Send, X, Loader2, CheckCircle2, Sparkles } from "lucide-react";

export function AdminBroadcastButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("0.1.0");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/v1/admin/broadcast-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          version: version.trim() || undefined,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'envoi");

      setResult(`[OK] Annonce diffusée par email avec succès à ${data.sentCount} utilisateur(s) !`);
      setTitle("");
      setMessage("");
    } catch (err: any) {
      setResult(`[Erreur] ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
      >
        <Mail className="w-4 h-4 text-emerald-400" />
        <span>Diffuser Email Gmail</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Diffusion Email Officielle</h3>
                  <p className="text-[11px] text-zinc-400">Envoi via Gmail SMTP & Supabase User Directory</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setResult(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {result && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs">
                {result}
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Titre / Objet du courriel *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mise à jour majeure KASPI POS v0.1.0 disponible !"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Numéro de version (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="0.1.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono focus:outline-none focus:border-zinc-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Message / Détails de l&apos;annonce *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Écrivez le message qui sera envoyé à tous les commerçants enregistrés..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-500 transition resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  L&apos;email sera formaté avec le design sombre KASPI POS, le logo officiel et expédié depuis l&apos;adresse Gmail configurée.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSending || !title.trim() || !message.trim()}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Diffusion en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Diffuser à tous les commerces</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
