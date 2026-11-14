"use client";

import React, { useState, useEffect, useRef, useTransition, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getApiUrl } from "@/client/sync-engine";
import { OtpVerification } from "@/components/auth/OtpVerification";
import { AuthGlassShell, AuthLocale } from "@/components/auth/MonochromePosBackground";
import { playTapSound, playSuccessSound, playErrorSound, playSystemEntryChime } from "@/lib/audio";
import { getLocalizedAuthError } from "@/lib/auth-errors";

type AuthMode = "password" | "gmail_otp" | "forgot_password";

const LOGIN_I18N: Record<
  AuthLocale,
  {
    titleLogin: string;
    titleForgot: string;
    tabPassword: string;
    tabGmailOtp: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    signInBtn: string;
    forgotPasswordLink: string;
    noAccountText: string;
    createAccountLink: string;
    sendOtpBtn: string;
    verifyOtpBtn: string;
    resendCountdown: (sec: number) => string;
    resendBtn: string;
    sendResetBtn: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    savePasswordBtn: string;
    backToLogin: string;
    errInvalidEmail: string;
    errInvalidCredentials: string;
    errInvalidOtp: string;
    errPasswordShort: string;
    errPasswordMismatch: string;
    errNetwork: string;
    msgOtpSent: string;
    msgVerified: string;
  }
> = {
  ar: {
    titleLogin: "تسجيل الدخول",
    titleForgot: "استعادة كلمة المرور",
    tabPassword: "كلمة المرور",
    tabGmailOtp: "رمز التحقق Gmail",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "contact@store.ma",
    passwordLabel: "كلمة المرور",
    passwordPlaceholder: "••••••••••",
    signInBtn: "تسجيل الدخول",
    forgotPasswordLink: "نسيت كلمة المرور؟",
    noAccountText: "ليس لديك حساب؟",
    createAccountLink: "إنشاء حساب جديد",
    sendOtpBtn: "إرسال رمز التحقق",
    verifyOtpBtn: "تأكيد الرمز والدخول",
    resendCountdown: (sec) => `إعادة إرسال الرمز بعد ${sec} ثانية`,
    resendBtn: "إعادة إرسال الرمز",
    sendResetBtn: "إرسال رمز الاستعادة",
    newPasswordLabel: "كلمة المرور الجديدة",
    confirmPasswordLabel: "تأكيد كلمة المرور",
    savePasswordBtn: "تحديث كلمة المرور والدخول",
    backToLogin: "العودة لتسجيل الدخول",
    errInvalidEmail: "يرجى إدخال بريد إلكتروني صالح",
    errInvalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    errInvalidOtp: "يرجى إدخال رمز التحقق المكون من 6 أرقام",
    errPasswordShort: "كلمة المرور يجب ألا تقل عن 6 أحرف",
    errPasswordMismatch: "كلمتا المرور غير متطابقتين",
    errNetwork: "تعذر الاتصال بالخادم، يرجى المحاولة مجدداً",
    msgOtpSent: "تم إرسال رمز التحقق المكون من 6 أرقام إلى بريدك الإلكتروني",
    msgVerified: "تم التحقق بنجاح، جاري الدخول...",
  },
  fr: {
    titleLogin: "Connexion",
    titleForgot: "Mot de passe oublié",
    tabPassword: "Mot de passe",
    tabGmailOtp: "Code Gmail",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "contact@store.ma",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "••••••••••",
    signInBtn: "Se connecter",
    forgotPasswordLink: "Mot de passe oublié ?",
    noAccountText: "Vous n'avez pas de compte ?",
    createAccountLink: "Créer un compte",
    sendOtpBtn: "Envoyer le code Gmail",
    verifyOtpBtn: "Confirmer le code et entrer",
    resendCountdown: (sec) => `Renvoyer le code dans ${sec}s`,
    resendBtn: "Renvoyer le code",
    sendResetBtn: "Envoyer le code de récupération",
    newPasswordLabel: "Nouveau mot de passe",
    confirmPasswordLabel: "Confirmer le mot de passe",
    savePasswordBtn: "Mettre à jour et entrer",
    backToLogin: "Retour à la connexion",
    errInvalidEmail: "Veuillez saisir une adresse e-mail valide",
    errInvalidCredentials: "Adresse e-mail ou mot de passe incorrect",
    errInvalidOtp: "Veuillez saisir le code de vérification à 6 chiffres",
    errPasswordShort: "Le mot de passe doit contenir au moins 6 caractères",
    errPasswordMismatch: "Les mots de passe ne correspondent pas",
    errNetwork: "Erreur de connexion au serveur",
    msgOtpSent: "Code de vérification à 6 chiffres envoyé sur votre boîte Gmail",
    msgVerified: "Vérification réussie, redirection...",
  },
  en: {
    titleLogin: "Sign In",
    titleForgot: "Reset Password",
    tabPassword: "Password",
    tabGmailOtp: "Gmail OTP",
    emailLabel: "Email Address",
    emailPlaceholder: "contact@store.ma",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••••",
    signInBtn: "Sign In",
    forgotPasswordLink: "Forgot password?",
    noAccountText: "Don't have an account?",
    createAccountLink: "Create new account",
    sendOtpBtn: "Send Verification Code",
    verifyOtpBtn: "Verify Code & Sign In",
    resendCountdown: (sec) => `Resend code in ${sec}s`,
    resendBtn: "Resend verification code",
    sendResetBtn: "Send Recovery Code",
    newPasswordLabel: "New Password",
    confirmPasswordLabel: "Confirm Password",
    savePasswordBtn: "Update Password & Sign In",
    backToLogin: "Back to Sign In",
    errInvalidEmail: "Please enter a valid email address",
    errInvalidCredentials: "Incorrect email address or password",
    errInvalidOtp: "Please enter the 6-digit verification code",
    errPasswordShort: "Password must be at least 6 characters",
    errPasswordMismatch: "Passwords do not match",
    errNetwork: "Unable to reach the server, please try again",
    msgOtpSent: "6-digit verification code sent to your Gmail inbox",
    msgVerified: "Verified successfully, signing in...",
  },
};

function normalizeLocale(raw?: string): AuthLocale {
  if (raw === "fr" || raw === "en" || raw === "ar") return raw;
  return "ar";
}

function LoginForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const initialLocale = normalizeLocale(params?.locale as string);

  const [locale, setLocale] = useState<AuthLocale>(initialLocale);
  const t = LOGIN_I18N[locale];
  const isRtl = locale === "ar";

  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP States
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Forgot / Reset Password States
  const [resetStep, setResetStep] = useState<"request" | "verify_and_set">("request");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  const [loading, setLoading] = useState(false);
  const [loginProgress, setLoginProgress] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Prefetch target routes on mount
  useEffect(() => {
    try {
      router.prefetch(`/${locale}/dashboard`);
      router.prefetch(`/${locale}/pos`);
    } catch {}
  }, [locale, router]);

  const startAuthProgress = () => {
    setLoginProgress(12);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setLoginProgress((prev) => {
        if (prev < 65) return prev + 6;
        return prev;
      });
    }, 70);
  };

  const stopLoginProgress = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    hasNavigatedRef.current = false;
    setLoginProgress(0);
  };

  const executeInstantNavigation = (targetUrl: string) => {
    hasNavigatedRef.current = true;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    // Smoothly step 65% -> 96% while transition commits
    progressTimerRef.current = setInterval(() => {
      setLoginProgress((prev) => {
        if (prev < 96) return Math.min(96, prev + 8);
        return prev;
      });
    }, 35);

    startTransition(() => {
      router.replace(targetUrl);
    });
  };

  // Instant snap to 100% and chime the exact millisecond route transition commits
  useEffect(() => {
    if (hasNavigatedRef.current && !isNavigating && loginProgress >= 60) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setLoginProgress(100);
      playSystemEntryChime();
    }
  }, [isNavigating, loginProgress]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleLocaleChange = (nextLocale: AuthLocale) => {
    setLocale(nextLocale);
    setError("");
    setSuccess("");
    if (typeof window !== "undefined") {
      const nextPath = window.location.pathname.replace(/^\/(ar|fr|en)(\/|$)/, `/${nextLocale}$2`);
      window.history.replaceState(null, "", `${nextPath}${window.location.search}`);
    }
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Handle URL parameters: ?email=...&code=...&purpose=...
  useEffect(() => {
    const queryEmail = searchParams.get("email");
    const queryCode = searchParams.get("code");
    const queryPurpose = searchParams.get("purpose");

    if (queryEmail) {
      setEmail(queryEmail);
    }

    if (queryCode && queryEmail) {
      if (queryPurpose === "reset") {
        setAuthMode("forgot_password");
        setResetStep("verify_and_set");
        setResetCode(queryCode);
      } else {
        setAuthMode("gmail_otp");
        setOtpStep("verify");
        setOtpCode(queryCode);
        executeOtpLogin(queryEmail, queryCode);
      }
    }
  }, [searchParams]);

  // 1. Password Login (Parallel execution: zero redundant sequential delays)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    setLoading(true);
    startAuthProgress();
    setError("");
    setSuccess("");

    try {
      const [apiRes, nextAuthRes] = await Promise.all([
        fetch(getApiUrl("/api/v1/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, locale }),
        }),
        signIn("credentials", {
          redirect: false,
          email,
          password,
        }),
      ]);

      const apiData = await apiRes.json().catch(() => null);

      if (!apiRes.ok) {
        stopLoginProgress();
        setLoading(false);
        playErrorSound();
        const rawErr =
          apiData?.error?.message ||
          (typeof apiData?.error === "string" ? apiData.error : null) ||
          apiData?.code ||
          apiData?.message;
        const errMsg = getLocalizedAuthError(rawErr, locale);
        setError(errMsg);
        return;
      }

      if (nextAuthRes?.error) {
        stopLoginProgress();
        setLoading(false);
        playErrorSound();
        setError(getLocalizedAuthError(nextAuthRes.error, locale));
        return;
      }

      // Non-blocking credential store
      if (
        typeof window !== "undefined" &&
        "PasswordCredential" in window &&
        navigator.credentials
      ) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: email,
            password,
            name: email,
          });
          navigator.credentials.store(cred).catch(() => {});
        } catch {}
      }

      executeInstantNavigation(`/${locale}/dashboard`);
    } catch {
      stopLoginProgress();
      setLoading(false);
      playErrorSound();
      setError(t.errNetwork);
    }
  };

  // 2. Send Login Code to Gmail
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
        body: JSON.stringify({ email, purpose: "login", locale }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        playErrorSound();
        const rawErr = data?.error?.message || data?.error || data?.code || t.errNetwork;
        setError(getLocalizedAuthError(rawErr, locale));
        setLoading(false);
        return;
      }

      playSuccessSound();
      setOtpStep("verify");
      setOtpTimer(60);
      setSuccess(t.msgOtpSent);
    } catch {
      playErrorSound();
      setError(t.errNetwork);
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP & Log In (Parallel validation + instant transition)
  const executeOtpLogin = async (targetEmail: string, codeToVerify: string) => {
    setLoading(true);
    startAuthProgress();
    setError("");
    setSuccess("");

    try {
      const [res, nextAuthRes] = await Promise.all([
        fetch(getApiUrl("/api/v1/auth/email-otp/verify"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: targetEmail,
            code: codeToVerify,
            purpose: "login",
            locale,
          }),
        }),
        signIn("credentials", {
          redirect: false,
          email: targetEmail,
          otpCode: codeToVerify,
        }).catch(() => null),
      ]);

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        stopLoginProgress();
        setLoading(false);
        playErrorSound();
        const rawErr = data?.error?.message || data?.error || data?.code || t.errInvalidOtp;
        setError(getLocalizedAuthError(rawErr, locale));
        return;
      }

      setSuccess(t.msgVerified);
      executeInstantNavigation(`/${locale}/dashboard`);
    } catch {
      stopLoginProgress();
      setLoading(false);
      playErrorSound();
      setError(t.errNetwork);
    }
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    if (!otpCode || otpCode.trim().length < 6) {
      playErrorSound();
      setError(t.errInvalidOtp);
      return;
    }
    executeOtpLogin(email, otpCode.trim());
  };

  // 4. Send Password Reset Code to Gmail
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
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
        body: JSON.stringify({ email, purpose: "reset", locale }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        playErrorSound();
        const rawErr = data?.error?.message || data?.error || data?.code || t.errNetwork;
        setError(getLocalizedAuthError(rawErr, locale));
        setLoading(false);
        return;
      }

      playSuccessSound();
      setResetStep("verify_and_set");
      setSuccess(t.msgOtpSent);
    } catch {
      playErrorSound();
      setError(t.errNetwork);
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit New Password with Code
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    if (!resetCode || resetCode.trim().length < 6) {
      playErrorSound();
      setError(t.errInvalidOtp);
      return;
    }
    if (newPassword.length < 6) {
      playErrorSound();
      setError(t.errPasswordShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      playErrorSound();
      setError(t.errPasswordMismatch);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(getApiUrl("/api/v1/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: resetCode.trim(),
          newPassword,
          locale,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        playErrorSound();
        const rawErr = data?.error?.message || data?.error || data?.code || t.errNetwork;
        setError(getLocalizedAuthError(rawErr, locale));
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        redirect: false,
        email,
        password: newPassword,
      });

      setSuccess(t.msgVerified);
      executeInstantNavigation(`/${locale}/dashboard`);
    } catch {
      playErrorSound();
      setError(t.errNetwork);
      setLoading(false);
    }
  };

  return (
    <AuthGlassShell
      locale={locale}
      onLocaleChange={handleLocaleChange}
      title={authMode === "forgot_password" ? t.titleForgot : t.titleLogin}
    >
      {/* Segmented Control (Password | Gmail OTP) */}
      {authMode !== "forgot_password" && (
        <div className="grid grid-cols-2 bg-zinc-900/85 p-1 rounded-2xl border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setAuthMode("password");
              setError("");
              setSuccess("");
            }}
            className={`py-2 text-xs sm:text-[13px] rounded-xl transition-all cursor-pointer ${
              authMode === "password"
                ? "border border-white bg-zinc-900/95 text-white font-bold shadow-[0_0_16px_rgba(255,255,255,0.28)]"
                : "border border-transparent text-zinc-400 hover:text-zinc-200 font-medium"
            }`}
          >
            {t.tabPassword}
          </button>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setAuthMode("gmail_otp");
              setOtpStep("request");
              setError("");
              setSuccess("");
            }}
            className={`py-2 text-xs sm:text-[13px] rounded-xl transition-all cursor-pointer ${
              authMode === "gmail_otp"
                ? "border border-white bg-zinc-900/95 text-white font-bold shadow-[0_0_16px_rgba(255,255,255,0.28)]"
                : "border border-transparent text-zinc-400 hover:text-zinc-200 font-medium"
            }`}
          >
            {t.tabGmailOtp}
          </button>
        </div>
      )}

      {/* Monochrome Feedback Banners */}
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

      {/* MODE 1: Standard Password Login */}
      {authMode === "password" && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-200 mb-2">
              {t.emailLabel}
            </label>
            <div className="relative rounded-2xl kaspi-polar-aurora-orbit">
              <input
                type="email"
                name="email"
                dir="ltr"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                className="w-full h-12 px-4 kaspi-translucent-input rounded-2xl text-sm placeholder-zinc-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-200 mb-2">
              {t.passwordLabel}
            </label>
            <div className="relative rounded-2xl kaspi-polar-aurora-orbit">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                dir="ltr"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                className={`w-full h-12 kaspi-translucent-input rounded-2xl text-sm placeholder-zinc-400 focus:outline-none transition-all ${
                  isRtl ? "pl-11 pr-4 text-right" : "pl-4 pr-11 text-left"
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  playTapSound();
                  setShowPassword((prev) => !prev);
                }}
                aria-label="Toggle password visibility"
                className={`absolute top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                  isRtl ? "left-3.5" : "right-3.5"
                }`}
              >
                {showPassword ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full h-12 bg-white text-black font-extrabold text-sm sm:text-[15px] rounded-2xl shadow-[0_0_28px_rgba(255,255,255,0.45)] hover:shadow-[0_0_38px_rgba(255,255,255,0.65)] hover:bg-zinc-100 active:scale-[0.99] transition-all flex justify-center items-center cursor-pointer mt-2 overflow-hidden disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div
                  className="absolute inset-y-0 left-0 bg-zinc-200 transition-all duration-100 ease-out z-0"
                  style={{ width: `${loginProgress}%` }}
                />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-black shrink-0" />
                  <span className="font-bold text-black text-sm">
                    {locale === "ar"
                      ? "جاري الدخول... "
                      : locale === "fr"
                      ? "Connexion... "
                      : "Signing in... "}
                  </span>
                  <span className="font-mono font-black text-black tabular-nums text-sm">
                    {loginProgress}%
                  </span>
                </div>
              </>
            ) : (
              t.signInBtn
            )}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setAuthMode("forgot_password");
                setResetStep("request");
                setError("");
                setSuccess("");
              }}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-colors cursor-pointer"
            >
              {t.forgotPasswordLink}
            </button>
          </div>
        </form>
      )}

      {/* MODE 2: Gmail 6-Digit OTP Login */}
      {authMode === "gmail_otp" && (
        <div className="space-y-4">
          {otpStep === "request" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-2">
                  {t.emailLabel}
                </label>
                <div className="relative rounded-2xl kaspi-polar-aurora-orbit">
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    className="w-full h-12 px-4 kaspi-translucent-input rounded-2xl text-sm placeholder-zinc-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-white text-black font-extrabold text-sm sm:text-[15px] rounded-2xl shadow-[0_0_28px_rgba(255,255,255,0.45)] hover:shadow-[0_0_38px_rgba(255,255,255,0.65)] hover:bg-zinc-100 active:scale-[0.99] transition-all flex justify-center items-center cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  t.sendOtpBtn
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              {/* Static Frosted Active Email Container (Zero Distraction) */}
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
                className="relative w-full h-12 bg-white text-black font-extrabold text-sm sm:text-[15px] rounded-2xl shadow-[0_0_28px_rgba(255,255,255,0.45)] hover:shadow-[0_0_38px_rgba(255,255,255,0.65)] hover:bg-zinc-100 active:scale-[0.99] transition-all flex justify-center items-center cursor-pointer overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div
                      className="absolute inset-y-0 left-0 bg-zinc-200 transition-all duration-100 ease-out z-0"
                      style={{ width: `${loginProgress}%` }}
                    />
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-black shrink-0" />
                      <span className="font-bold text-black text-sm">
                        {locale === "ar"
                          ? "جاري الدخول... "
                          : locale === "fr"
                          ? "Connexion... "
                          : "Signing in... "}
                      </span>
                      <span className="font-mono font-black text-black tabular-nums text-sm">
                        {loginProgress}%
                      </span>
                    </div>
                  </>
                ) : (
                  t.verifyOtpBtn
                )}
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
        </div>
      )}

      {/* MODE 3: Forgot Password / Reset */}
      {authMode === "forgot_password" && (
        <div className="space-y-4">
          {resetStep === "request" ? (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-2">
                  {t.emailLabel}
                </label>
                <div className="relative rounded-2xl kaspi-polar-aurora-orbit">
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    className="w-full h-12 px-4 kaspi-translucent-input rounded-2xl text-sm placeholder-zinc-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-white text-black font-extrabold text-sm sm:text-[15px] rounded-2xl shadow-[0_0_28px_rgba(255,255,255,0.45)] hover:shadow-[0_0_38px_rgba(255,255,255,0.65)] hover:bg-zinc-100 transition-all flex justify-center items-center cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  t.sendResetBtn
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div
                dir="ltr"
                className="w-full h-11 px-4 rounded-2xl bg-zinc-900/80 border border-white/15 flex items-center justify-center text-sm font-mono text-zinc-200"
              >
                {email}
              </div>

              <OtpVerification
                value={resetCode}
                onChange={setResetCode}
                disabled={loading}
                autoFocus
              />

              <div className="relative rounded-2xl kaspi-polar-aurora-orbit">
                <input
                  type={showNewPassword ? "text" : "password"}
                  dir="ltr"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.newPasswordLabel}
                  required
                  className={`w-full h-11 kaspi-translucent-input rounded-2xl text-sm placeholder-zinc-400 focus:outline-none transition-all ${
                    isRtl ? "pl-11 pr-4 text-right" : "pl-4 pr-11 text-left"
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className={`absolute top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer ${
                    isRtl ? "left-3.5" : "right-3.5"
                  }`}
                >
                  {showNewPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl kaspi-polar-aurora-orbit">
                <input
                  type={showNewPassword ? "text" : "password"}
                  dir="ltr"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPasswordLabel}
                  required
                  className={`w-full h-11 px-4 kaspi-translucent-input rounded-2xl text-sm placeholder-zinc-400 focus:outline-none transition-all ${
                    isRtl ? "text-right" : "text-left"
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-white text-black font-extrabold text-sm sm:text-[15px] rounded-2xl shadow-[0_0_28px_rgba(255,255,255,0.45)] hover:shadow-[0_0_38px_rgba(255,255,255,0.65)] transition-all flex justify-center items-center cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  t.savePasswordBtn
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setAuthMode("password");
                setError("");
                setSuccess("");
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {t.backToLogin}
            </button>
          </div>
        </div>
      )}

      {/* Subtle Horizontal Divider & Registration Footer Link */}
      <div
        dir="auto"
        className="mt-5 pt-4 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs text-zinc-400"
      >
        <span>{t.noAccountText}</span>
        <Link
          href={`/${locale}/register`}
          onClick={() => playTapSound()}
          className="text-sky-400 hover:underline font-bold"
        >
          {t.createAccountLink}
        </Link>
      </div>
    </AuthGlassShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#040405] flex items-center justify-center text-white">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
