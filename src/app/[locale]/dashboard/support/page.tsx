"use client";

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  RefreshCw,
  Barcode,
  Scale,
  Printer,
} from "lucide-react";
import { useAppDictionary } from "@/i18n/schema";
import { KineticSupportShieldPulseEmpty } from "@/components/ui/KineticEmptyState";

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
  const { t, locale } = useAppDictionary();
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
    <div dir="ltr" className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <HelpCircle className="h-6 w-6 text-white" />
            <span>{t.support.title}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t.support.subtitle}
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-white" : ""}`} />
          <span>{loading ? t.common.loading : (locale === "ar" ? "تحديث" : locale === "en" ? "Refresh" : "Actualiser")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Send a Support Message Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/[0.14] bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_48%,rgba(14,19,24,0.92)_100%)] p-6 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)] backdrop-blur-2xl"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              {t.support.newTicket}
            </h2>

            {feedback && (
              <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                {t.customers.fullNameLabel}
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Youssef"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                {t.customers.phoneLabel}
              </label>
              <input
                type="text"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="+212 600-000000"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                {t.support.subject}
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t.support.subject}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">
                {t.support.message}
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.support.message}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full sheen-btn inline-flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-black hover:bg-zinc-200 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? t.common.loading : t.support.sendTicket}
            </button>
          </form>
        </div>

        {/* Right: Ticket History & Replies */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-white/[0.14] bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_48%,rgba(14,19,24,0.92)_100%)] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)] backdrop-blur-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t.support.myTickets}
              </h2>
              <span className="text-xs font-mono text-zinc-400">
                {tickets.length}
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-zinc-500">
                {t.common.loading}
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center w-full mx-auto my-auto min-h-[340px]">
                <KineticSupportShieldPulseEmpty
                  title={t.support.noTickets}
                  subtitle={
                    locale === "ar"
                      ? "فريق الدعم الفني كسب في خدمتك على مدار الساعة"
                      : locale === "en"
                      ? "KASPI technical support is at your service 24/7"
                      : "L'équipe technique KASPI est à votre écoute 24/7"
                  }
                />
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

      {/* SUPERMARKET HARDWARE INTERACTIVE QUICK GUIDES */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              {locale === "ar"
                ? "دليل تشغيل عتاد السوبرماركت ونقاط البيع (Mode Supermarché)"
                : "Guides d'Installation Matériel Supermarché & Caisse"}
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-mono font-bold">
            Hardware Docs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <Barcode className="w-4 h-4 text-teal-400" />
              <span>{locale === "ar" ? "قارئ الباركود USB" : "Lecteur Code-barres USB"}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {locale === "ar"
                ? "يدعم التوصيل الفوري Plug & Play. قم بمسح باركود السلعة مباشرة دون الحاجة للضغط على الفأرة؛ يرسل تلقائياً مفتاح Enter لإضافة المنتج للسلة فوراً."
                : "Connexion Plug & Play directe. Scannez n'importe quel code EAN-13; le lecteur transmet un suffixe Entrée pour l'ajout immédiat au panier."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <Scale className="w-4 h-4 text-teal-400" />
              <span>{locale === "ar" ? "ميزان الأوزان EAN-13" : "Balance Poids-Prix EAN-13"}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {locale === "ar"
                ? "فك تشفير تلقائي لباركود الميزان المطبوع (بادئة 20 أو 21) وحساب الوزن الإجمالي والسعر بالدرهم بدقة مئوية في أجزاء من الثانية."
                : "Décodage automatique du code balance (préfixe 20 ou 21) extrayant instantanément le code PLU et le poids en kilogrammes."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <Printer className="w-4 h-4 text-teal-400" />
              <span>{locale === "ar" ? "طابعة ملصقات الرف 40×30mm" : "Étiqueteuse Rayon 40×30mm"}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {locale === "ar"
                ? "طباعة بنقرة واحدة من صفحة المنتجات والمخزون لملصقات الرفوف بالمقاس القياسي 40×30 مم متضمنة اسم السلعة، السعر والباركود."
                : "Impression 1-clic au format standard 40×30 mm avec nom de l'article, prix TTC et code-barres net prêt pour les rayons."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
