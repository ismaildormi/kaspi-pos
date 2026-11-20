"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { CheckCircle2, Cpu, Loader2, Mail, MessageSquare, Send } from "lucide-react";
import { probeClientHardware } from "@/lib/heyuka/client-cpu-engine";
import type { PortalLocale } from "./platform-data";

interface SentTicket {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

const COPY: Record<
  PortalLocale,
  {
    title: string;
    subtitle: string;
    nameLabel: string;
    emailLabel: string;
    categoryLabel: string;
    subjectLabel: string;
    messageLabel: string;
    attachHw: string;
    sendBtn: string;
    recentTitle: string;
    noHistory: string;
  }
> = {
  ar: {
    title: "المراسلات، الدعم والتواصل (Help & Messaging)",
    subtitle:
      "أرسل رسائلك، اقتراحاتك، بلاغات الأعطاب أو طلبات مفاتيح API مباشرة إلى فريق KASPI & HEYUKA. يتم حفظ بريدك Gmail وتتبّع الردود فوراً.",
    nameLabel: "الاسم الكامل",
    emailLabel: "البريد الإلكتروني / Gmail",
    categoryLabel: "نوع المراسلة",
    subjectLabel: "الموضوع",
    messageLabel: "تفاصيل الرسالة",
    attachHw: "إرفاق مواصفات جهازي (معالج CPU / متصفح) لتسريع التشخيص",
    sendBtn: "إرسال الرسالة الآن",
    recentTitle: "سجل مراسلاتك السابقة",
    noHistory: "لا توجد مراسلات سابقة مسجلة لهذا البريد بعد.",
  },
  fr: {
    title: "Messagerie, Support & Feedback",
    subtitle:
      "Envoyez vos messages, suggestions ou demandes d'assistance directement à l'équipe HEYUKA / KASPI. Votre Gmail est automatiquement synchronisé dans le répertoire.",
    nameLabel: "Nom complet",
    emailLabel: "Adresse Gmail / Email",
    categoryLabel: "Catégorie",
    subjectLabel: "Objet",
    messageLabel: "Message",
    attachHw: "Joindre les specs CPU locales (sans données privées)",
    sendBtn: "Envoyer le message",
    recentTitle: "Historique de vos messages",
    noHistory: "Aucun message envoyé pour ce compte pour le moment.",
  },
  en: {
    title: "Help, Messaging & Feedback",
    subtitle:
      "Send support inquiries, product feedback, bug reports, or API partnership outreach directly to the KASPI & HEYUKA team. Your Gmail is synced cleanly to our project outreach vault.",
    nameLabel: "Your Name",
    emailLabel: "Gmail / Email Address",
    categoryLabel: "Message Type",
    subjectLabel: "Subject",
    messageLabel: "Message",
    attachHw: "Attach local browser CPU telemetry for faster diagnostics",
    sendBtn: "Send Message",
    recentTitle: "Your Sent Messages",
    noHistory: "No prior outreach messages recorded yet.",
  },
};

export function PlatformFeedbackView() {
  const localeRaw = useLocale();
  const locale: PortalLocale =
    localeRaw === "ar" ? "ar" : localeRaw === "en" ? "en" : "fr";
  const t = COPY[locale];

  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [category, setCategory] = useState<
    "feedback" | "support" | "outreach" | "bug" | "api_request"
  >("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [includeHw, setIncludeHw] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SentTicket[]>([]);

  const loadContext = useCallback(async () => {
    try {
      const [profRes, fbRes] = await Promise.all([
        fetch("/api/v1/zebra-x/profile", { cache: "no-store" }),
        fetch("/api/v1/heyuka/feedback", { cache: "no-store" }),
      ]);
      const prof = await profRes.json().catch(() => null);
      if (prof?.authenticated && prof.profile) {
        setSenderName((p) => p || prof.profile.name || "");
        setSenderEmail((p) => p || prof.profile.email || "");
      }
      const fb = await fbRes.json().catch(() => null);
      if (fb?.ok && Array.isArray(fb.messages)) {
        setHistory(fb.messages);
      }
    } catch {}
  }, []);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      let hwString: string | undefined;
      if (includeHw) {
        const hw = probeClientHardware();
        hwString = `Cores=${hw.cpuCores}, RAM=${hw.deviceMemoryGb || "unknown"}GB, GPU=${hw.gpuRenderer}`;
      }

      const res = await fetch("/api/v1/heyuka/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: senderName.trim() || "HEYUKA User",
          senderEmail: senderEmail.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
          locale,
          deviceTelemetry: hwString,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Unable to send message.");
        return;
      }
      setNotice(json?.message || "Message sent successfully.");
      setSubject("");
      setMessage("");
      if (json?.ticket) {
        setHistory((prev) => [json.ticket, ...prev]);
      }
    } catch (err: any) {
      setError(err?.message || "Connection error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-rose-500" />
          <span>{t.title}</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{t.subtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-5 sm:p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium block">{t.nameLabel}</label>
            <input
              type="text"
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Ismail / Developer"
              className="w-full rounded-xl bg-[#131418] border border-white/[0.08] px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.emailLabel}</span>
            </label>
            <input
              type="email"
              dir="ltr"
              required
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="w-full rounded-xl bg-[#131418] border border-white/[0.08] px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium block">{t.categoryLabel}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full rounded-xl bg-[#131418] border border-white/[0.08] px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500"
            >
              <option value="feedback">Product Feedback / Suggestion</option>
              <option value="support">Technical Support</option>
              <option value="bug">Report UI or Model Issue</option>
              <option value="outreach">Business &amp; Outreach Inquiry</option>
              <option value="api_request">Enterprise / High-Rate API Request</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium block">{t.subjectLabel}</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Coding Studio / Audio Question"
              className="w-full rounded-xl bg-[#131418] border border-white/[0.08] px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="text-zinc-300 font-medium block">{t.messageLabel}</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here in Arabic, Darija, French, or English..."
            className="w-full rounded-xl bg-[#131418] border border-white/[0.08] p-3.5 text-zinc-100 focus:outline-none focus:border-rose-500 resize-none"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={includeHw}
            onChange={(e) => setIncludeHw(e.target.checked)}
            className="accent-rose-600 w-3.5 h-3.5"
          />
          <Cpu className="w-3.5 h-3.5 text-rose-400" />
          <span>{t.attachHw}</span>
        </label>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {notice && (
          <p className="text-xs text-zinc-100 bg-rose-600/20 border border-rose-500/40 rounded-lg px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{notice}</span>
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DC2626] hover:bg-[#EF4444] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{t.sendBtn}</span>
          </button>
        </div>
      </form>

      {/* Sent History */}
      <div className="rounded-xl bg-[#1D1E23] border border-white/[0.06] p-5 space-y-3">
        <h2 className="text-sm font-bold text-white">{t.recentTitle}</h2>
        {history.length === 0 ? (
          <p className="text-xs text-zinc-500">{t.noHistory}</p>
        ) : (
          <div className="space-y-2.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-[#131418] border border-white/[0.06] p-3.5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{item.subject}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-mono text-[10px]">
                    {item.category} • {item.status}
                  </span>
                </div>
                <p className="text-zinc-400 whitespace-pre-wrap">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
