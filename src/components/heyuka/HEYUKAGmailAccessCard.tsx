"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";

interface HEYUKAGmailAccessCardProps {
  locale: "ar" | "fr" | "en";
  onAuthenticated: () => void | Promise<void>;
  compact?: boolean;
  source?: string;
}

const COPY = {
  ar: {
    badge: "وصول فوري عبر Gmail — بدون حساب متجر POS",
    title: "ادخل ببريدك Gmail مباشرة للحصول على مفاتيح API والمحادثة",
    placeholder: "example@gmail.com",
    otpPlaceholder: "أدخل رمز التحقق (6 أرقام)",
    submit: "متابعة عبر Gmail",
    verify: "تأكيد الرمز والدخول",
    sentHint: "تم إرسال رمز تحقق إلى بريدك الإلكتروني لتأمين حسابك.",
    googleBtn: "المتابعة بحساب Google",
  },
  fr: {
    badge: "Accès Instantané Gmail — Sans boutique POS requise",
    title: "Entrez simplement votre Gmail pour obtenir vos clés API et accéder à HEYUKA",
    placeholder: "example@gmail.com",
    otpPlaceholder: "Code de vérification (6 chiffres)",
    submit: "Continuer avec Gmail",
    verify: "Vérifier et accéder",
    sentHint: "Un code à 6 chiffres a été envoyé à votre boîte Gmail.",
    googleBtn: "Continuer avec Google",
  },
  en: {
    badge: "Instant Gmail Access — No POS Store Registration Required",
    title: "Enter your Gmail directly to unlock API Keys, HEYUKA Chat & Downloads",
    placeholder: "you@gmail.com",
    otpPlaceholder: "Enter 6-digit verification code",
    submit: "Continue with Gmail",
    verify: "Verify Code & Enter",
    sentHint: "A 6-digit verification code has been sent to your Gmail inbox.",
    googleBtn: "Continue with Google",
  },
} as const;

export function HEYUKAGmailAccessCard({
  locale,
  onAuthenticated,
  compact = false,
  source = "heyuka_gmail_access",
}: HEYUKAGmailAccessCardProps) {
  const t = COPY[locale];
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequired, setOtpRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    fetch("/api/v1/heyuka/gmail-access", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.googleOAuthReady) setGoogleReady(true);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/heyuka/gmail-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source,
          ...(otpRequired ? { otpCode: otpCode.trim() } : {}),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Unable to verify email.");
        return;
      }
      if (json?.otpRequired) {
        setOtpRequired(true);
        return;
      }
      if (json?.authenticated) {
        await onAuthenticated();
      }
    } catch (err: any) {
      setError(err?.message || "Connection error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? "space-y-3" : "kaspi-frosted-surface rounded-2xl p-5 space-y-3.5"}>
      <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-rose-500">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>{t.badge}</span>
      </div>
      <p className="text-xs sm:text-sm font-semibold text-[var(--kaspi-text-primary)] leading-relaxed">
        {t.title}
      </p>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 text-[var(--kaspi-text-muted)] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
            <input
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setOtpRequired(false);
              }}
              placeholder={t.placeholder}
              className="w-full kaspi-translucent-input rounded-xl ps-10 pe-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-rose-500/60"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="kaspi-primary-cta-btn rounded-xl px-5 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            <span>{otpRequired ? t.verify : t.submit}</span>
          </button>
        </div>

        {otpRequired && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] text-rose-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{t.sentHint}</span>
            </p>
            <input
              type="text"
              dir="ltr"
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder={t.otpPlaceholder}
              className="w-full sm:w-64 kaspi-translucent-input rounded-xl px-3.5 py-2 text-xs font-mono tracking-widest focus:outline-none focus:border-rose-500/60"
            />
          </div>
        )}
      </form>

      {googleReady && (
        <div className="pt-1">
          <a
            href="/api/auth/signin/google"
            className="kaspi-glass-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
          >
            <span>{t.googleBtn}</span>
          </a>
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
