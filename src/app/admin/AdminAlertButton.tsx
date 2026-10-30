"use client";

import React, { useState } from "react";
import { MessageSquare, Send, X, Loader2, CheckCircle2 } from "lucide-react";

export function AdminAlertButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"admin_only" | "all_tenants">("admin_only");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/whatsapp-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), target }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'envoi");

      if (target === "admin_only") {
        setResult("✅ Alerte envoyée sur votre WhatsApp (+212 687-597267) !");
      } else {
        setResult(`✅ Alerte diffusée avec succès à ${data.dispatchedCount} commerces !`);
      }
      setMessage("");
    } catch (err: any) {
      setResult(`❌ ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Diffuser Alerte WhatsApp</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white text-base">Alerte WhatsApp Plateforme</h3>
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
                  Destinataire :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTarget("admin_only")}
                    className={`p-3 rounded-xl border text-xs font-bold transition text-start ${
                      target === "admin_only"
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    <span>Mon WhatsApp</span>
                    <span className="block text-[10px] font-mono mt-0.5 opacity-80">+212 687-597267</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget("all_tenants")}
                    className={`p-3 rounded-xl border text-xs font-bold transition text-start ${
                      target === "all_tenants"
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    <span>Tous les Commerces</span>
                    <span className="block text-[10px] font-mono mt-0.5 opacity-80">Diffusion Générale</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Message à diffuser :
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: Mise à jour majeure de Kasbi POS disponible cette nuit à 02h00..."
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={isSending || !message.trim()}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer l&apos;alerte</span>
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
