"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getApiUrl } from "@/client/sync-engine";
import { OtpVerification } from "@/components/auth/OtpVerification";
import { AuthGlassShell, AuthLocale } from "@/components/auth/MonochromePosBackground";
import { playTapSound, playSuccessSound, playErrorSound } from "@/lib/audio";

const OTP_I18N: Record<
  AuthLocale,
  {
    title: string;
    emailPlaceholder: string;
    sendOtpBtn: string;
    verifyOtpBtn: string;
    resendCountdown: (sec: number) => string;
    resendBtn: string;
    backToLogin: string;
    errInvalidEmail: string;
    errInvalidOtp: string;
    errNetwork: string;
    msgOtpSent: string;
    msgVerified: string;
  }
> = {
  ar: {
    title: "رمز التحقق Gmail",
    emailPlaceholder: "contact@store.ma",
    sendOtpBtn: "إرسال رمز التحقق",
    verifyOtpBtn: "تأكيد الرمز والدخول",
    resendCountdown: (sec) => `إعادة إرسال الرمز بعد ${sec} ثانية`,
    resendBtn: "إعادة إرسال الرمز",
    backToLogin: "العودة لتسجيل الدخول",
    errInvalidEmail: "يرجى إدخال بريد إلكتروني صالح",
    errInvalidOtp: "يرجى إدخال رمز التحقق المكون من 6 أرقام",
    errNetwork: "تعذر الاتصال بالخادم، يرجى المحاولة مجدداً",
    msgOtpSent: "تم إرسال رمز التحقق المكون من 6 أرقام إلى بريدك الإلكتروني",
    msgVerified: "تم التحقق بنجاح، جاري الدخول...",
  },
  fr: {
    title: "Vérification Gmail",
    emailPlaceholder: "contact@store.ma",
    sendOtpBtn: "Envoyer le code Gmail",
    verifyOtpBtn: "Confirmer le code et entrer",
    resendCountdown: (sec) => `Renvoyer le code dans ${sec}s`,
    resendBtn: "Renvoyer le code",
    backToLogin: "Retour à la connexion",
    errInvalidEmail: "Veuillez saisir une adresse e-mail valide",
    errInvalidOtp: "Veuillez saisir le code de vérification à 6 chiffres",
    errNetwork: "Erreur de connexion au serveur",
    msgOtpSent: "Code de vérification à 6 chiffres envoyé sur votre boîte Gmail",
    msgVerified: "Vérification réussie, redirection...",
  },
  en: {
    title: "Gmail Verification",
    emailPlaceholder: "contact@store.ma",
    sendOtpBtn: "Send Verification Code",
    verifyOtpBtn: "Verify Code & Sign In",
    resendCountdown: (sec) => `Resend code in ${sec}s`,
    resendBtn: "Resend verification code",
    backToLogin: "Back to Sign In",
    errInvalidEmail: "Please enter a valid email address",
    errInvalidOtp: "Please enter the 6-digit verification code",
    errNetwork: "Unable to reach the server, please try again",
    msgOtpSent: "6-digit verification code sent to your Gmail inbox",
    msgVerified: "Verified successfully, signing in...",
  },
};

function normalizeLocale(raw?: string): AuthLocale {
  if (raw === "fr" || raw === "en" || raw === "ar") return raw;
  return "ar";
}

function OtpVerifyView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const initialLocale = normalizeLocale(params?.locale as string);

  const [locale, setLocale] = useState<AuthLocale>(initialLocale);
  const t = OTP_I18N[locale];

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [step, setStep] = useState<"request" | "verify">(
    searchParams.get("email") ? "verify" : "request"
  );
  const [otpCode, setOtpCode] = useState(searchParams.get("code") || "");
  const [otpTimer, setOtpTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleLocaleChange = (nextLocale: AuthLocale) => {
    setLocale(nextLocale);
    setError("");
    setSuccess("");
    if (typeof window !== "undefined") {
      const nextPath = window.location.pathname.replace(/^\/(ar|fr|en)(\/|$)/, `/${nextLocale}$2`);
      window.history.replaceState(null, "", `${nextPath}${window.location.search}`);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playTapSound();
    if (!email || !email.includes("@")) {
      playErrorSound();
      setError(t.errInvalidEmail);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(getApiUrl("/api/v1/auth/email-otp/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "login" }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        playErrorSound();
        setError(data?.error?.message || data?.error || t.errNetwork);
        setLoading(false);
        return;
      }

      playSuccessSound();
      setStep("verify");
      setOtpTimer(60);
      setSuccess(t.msgOtpSent);
    } catch {
      playErrorSound();
      setError(t.errNetwork);
    } finally {
      setLoading(false);
    }
  };

  const executeOtpLogin = async (targetEmail: string, codeToVerify: string) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(getApiUrl("/api/v1/auth/email-otp/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          code: codeToVerify,
          purpose: "login",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        playErrorSound();
        setError(data?.error?.message || data?.error || t.errInvalidOtp);
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        redirect: false,
        email: targetEmail,
        otpCode: codeToVerify,
      }).catch(() => {});

      playSuccessSound();
      setSuccess(t.msgVerified);
      window.location.href = `/${locale}/dashboard`;
    } catch {
      playErrorSound();
      setError(t.errNetwork);
      setLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    if (!otpCode || otpCode.trim().length < 6) {
      playErrorSound();
      setError(t.errInvalidOtp);
      return;
    }
    executeOtpLogin(email, otpCode.trim());
  };

  return (
    <AuthGlassShell locale={locale} onLocaleChange={handleLocaleChange} title={t.title}>
      {error && (
        <div className="mb-4 px-3.5 py-2.5 bg-zinc-900/95 border border-white/25 text-zinc-200 text-xs rounded-2xl text-center font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 px-3.5 py-2.5 bg-white/[0.08] border border-white/30 text-white text-xs rounded-2xl text-center font-medium">
          {success}
        </div>
      )}

      {step === "request" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            required
            className="w-full h-12 px-4 bg-zinc-900/75 border border-white/15 rounded-2xl text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-white/60 focus:shadow-[0_0_16px_rgba(255,255,255,0.14)] transition-all"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-white text-black font-extrabold text-sm sm:text-[15px] rounded-2xl shadow-[0_0_28px_rgba(255,255,255,0.45)] hover:shadow-[0_0_38px_rgba(255,255,255,0.65)] hover:bg-zinc-100 active:scale-[0.99] transition-all flex justify-center items-center cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : t.sendOtpBtn}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          {/* Static Frosted Active Email Container */}
          <div
            dir="ltr"
            className="w-full h-11 px-4 rounded-2xl bg-zinc-900/80 border border-white/15 flex items-center justify-center text-sm font-mono text-zinc-200 select-all"
          >
            {email}
          </div>

          {/* 6 Individual Illuminated Glass Digit Boxes */}
          <OtpVerification
            value={otpCode}
            onChange={setOtpCode}
            onComplete={(fullCode) => {
              setOtpCode(fullCode);
              executeOtpLogin(email, fullCode);
            }}
            disabled={loading}
            autoFocus
          />

          <button
            type="submit"
            disabled={loading || otpCode.length < 6}
            className="w-full h-12 bg-white text-black font-extrabold text-sm sm:text-[15px] rounded-2xl shadow-[0_0_28px_rgba(255,255,255,0.45)] hover:shadow-[0_0_38px_rgba(255,255,255,0.65)] hover:bg-zinc-100 active:scale-[0.99] transition-all flex justify-center items-center cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : t.verifyOtpBtn}
          </button>

          <div className="text-center pt-1">
            {otpTimer > 0 ? (
              <span className="text-xs text-zinc-400 font-mono">
                {t.resendCountdown(otpTimer)}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={loading}
                className="text-xs text-zinc-300 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
              >
                {t.resendBtn}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-5 pt-4 border-t border-white/10 text-center text-xs text-zinc-400">
        <Link
          href={`/${locale}/login`}
          onClick={() => playTapSound()}
          className="text-white hover:underline font-bold"
        >
          {t.backToLogin}
        </Link>
      </div>
    </AuthGlassShell>
  );
}

export default function OtpLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#040405] flex items-center justify-center text-white">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        </div>
      }
    >
      <OtpVerifyView />
    </Suspense>
  );
}
