"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { getApiUrl } from "@/client/sync-engine";
import { OtpVerification } from "@/components/auth/OtpVerification";
import { playTapSound, playSuccessSound, playErrorSound } from "@/lib/audio";

type AuthMode = "password" | "gmail_otp" | "forgot_password";

function LoginForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || "ar";

  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP States
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Forgot / Reset Password States
  const [resetStep, setResetStep] = useState<"request" | "verify_and_set">("request");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [founderLoading, setFounderLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleQuickFounderLogin = async () => {
    playTapSound();
    setFounderLoading(true);
    setError("");
    setSuccess("جاري تسجيل الدخول السريع لحساب المؤسس (@kaspipos)...");
    try {
      const res = await fetch(getApiUrl("/api/v1/auth/founder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error?.message || "تعذر تشغيل الدخول السريع");
      }

      await signIn("credentials", {
        redirect: false,
        email: data.data.email,
        otpCode: data.data.otpCode,
      }).catch(() => {});

      playSuccessSound();
      window.location.href = `/${locale}/dashboard`;
    } catch (err: any) {
      playErrorSound();
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول السريع");
      setSuccess("");
      setFounderLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    playTapSound();
    setDemoLoading(true);
    setError("");
    setSuccess("جاري تجهيز نسخة العرض التفاعلية (KASPI Showroom)...");
    try {
      const res = await fetch(getApiUrl("/api/v1/auth/demo"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error?.message || "تعذر تشغيل الوضع التجريبي");
      }

      await signIn("credentials", {
        redirect: false,
        email: data.data.email,
        password: data.data.password,
      }).catch(() => {});

      playSuccessSound();
      window.location.href = `/${locale}/pos`;
    } catch (err: any) {
      playErrorSound();
      setError(err.message || "حدث خطأ أثناء تشغيل النسخة التجريبية");
      setSuccess("");
      setDemoLoading(false);
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

  // Handle URL parameters: ?email=...&code=...&purpose=...&demo=true
  useEffect(() => {
    const queryEmail = searchParams.get("email");
    const queryCode = searchParams.get("code");
    const queryPurpose = searchParams.get("purpose");
    const queryDemo = searchParams.get("demo");

    if (queryDemo === "true") {
      handleInstantDemoLogin();
      return;
    }

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

  const handleRedirect = (_isSuperAdmin?: boolean) => {
    playSuccessSound();
    window.location.href = `/${locale}/dashboard`;
  };

  // 1. Password Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const apiRes = await fetch(getApiUrl("/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const apiData = await apiRes.json().catch(() => null);

      if (!apiRes.ok) {
        playErrorSound();
        if (apiData?.code === "DEVICE_LIMIT_EXCEEDED") {
          setError(
            apiData.error ||
              "تم الوصول للحد الأقصى لعدد الأجهزة المصرح بها. يرجى إضافة نقطة بيع جديدة من لوحة الفوترة."
          );
        } else {
          const errMsg =
            apiData?.error?.message ||
            (typeof apiData?.error === "string" ? apiData.error : null) ||
            "البريد الإلكتروني أو كلمة المرور غير صحيحة";
          setError(errMsg);
        }
        setLoading(false);
        return;
      }

      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        playErrorSound();
        setError("فشل إنشاء جلسة الدخول. يرجى التحقق من البيانات والمحاولة مجدداً.");
        setLoading(false);
        return;
      }

      const isSuperAdmin = Boolean(
        apiData?.data?.user?.isSuperAdmin || apiData?.user?.isSuperAdmin
      );

      if (
        typeof window !== "undefined" &&
        "PasswordCredential" in window &&
        navigator.credentials
      ) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: email,
            password: password,
            name: email,
          });
          await navigator.credentials.store(cred);
        } catch {}
      }

      handleRedirect(isSuperAdmin);
    } catch {
      playErrorSound();
      setError("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Login Code to Gmail
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playTapSound();
    if (!email || !email.includes("@")) {
      playErrorSound();
      setError("يرجى إدخال بريد إلكتروني صالح");
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

      const data = await res.json();
      if (!res.ok) {
        playErrorSound();
        setError(data.error?.message || data.error || "فشل إرسال رمز التحقق إلى بريدك");
        setLoading(false);
        return;
      }

      playSuccessSound();
      setOtpStep("verify");
      setOtpTimer(60);
      setSuccess(
        `تم إرسال رمز التحقق المكون من 6 أرقام إلى ${email}. انسخ الرمز والصقه هنا (Ctrl+V).`
      );
    } catch {
      playErrorSound();
      setError("حدث خطأ في الاتصال بالسيرفر لإرسال الرمز");
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP & Log In
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

      const data = await res.json();
      if (!res.ok) {
        playErrorSound();
        setError(
          data.error?.message || data.error || "رمز التحقق غير صحيح أو انتهت صلاحيته"
        );
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        redirect: false,
        email: targetEmail,
        otpCode: codeToVerify,
      }).catch(() => {});

      setSuccess("تم التحقق بنجاح! جاري تحويلك...");
      const isSuperAdmin = Boolean(data.data?.user?.isSuperAdmin);
      handleRedirect(isSuperAdmin);
    } catch {
      playErrorSound();
      setError("حدث خطأ أثناء التحقق من الرمز");
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    if (!otpCode || otpCode.trim().length < 4) {
      playErrorSound();
      setError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
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
      setError("يرجى إدخال بريدك الإلكتروني المسجل");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(getApiUrl("/api/v1/auth/email-otp/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset" }),
      });

      const data = await res.json();
      if (!res.ok) {
        playErrorSound();
        setError(data.error?.message || data.error || "لم نتمكن من إرسال رمز إعادة التعيين");
        setLoading(false);
        return;
      }

      playSuccessSound();
      setResetStep("verify_and_set");
      setSuccess(
        `تم إرسال رمز إعادة تعيين كلمة المرور إلى ${email}. أدخل الرمز أدناه.`
      );
    } catch {
      playErrorSound();
      setError("حدث خطأ أثناء طلب رمز استعادة كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit New Password with Code
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    if (!resetCode || resetCode.trim().length < 4) {
      playErrorSound();
      setError("يرجى إدخال رمز التحقق المستلم في بريدك");
      return;
    }
    if (newPassword.length < 6) {
      playErrorSound();
      setError("كلمة المرور يجب ألا تقل عن 6 أحرف");
      return;
    }
    if (newPassword !== confirmPassword) {
      playErrorSound();
      setError("كلمتا المرور غير متطابقتين");
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        playErrorSound();
        setError(data.error?.message || data.error || "فشل إعادة تعيين كلمة المرور");
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        redirect: false,
        email,
        password: newPassword,
      });

      setSuccess("تم تغيير كلمة المرور بنجاح! جاري تحويلك...");
      const isSuperAdmin = Boolean(data.data?.user?.isSuperAdmin);
      handleRedirect(isSuperAdmin);
    } catch {
      playErrorSound();
      setError("حدث خطأ أثناء حفظ كلمة المرور الجديدة");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans relative overflow-hidden"
      dir="rtl"
    >
      {/* Subtle Ambient Radial Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[560px] h-[320px] rounded-full bg-white/[0.04] blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-auto backdrop-blur-2xl bg-zinc-900/90 border border-white/15 rounded-3xl p-7 sm:p-8 shadow-2xl transition-all">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="KASPI POS"
            className="w-14 h-14 object-contain bg-transparent mx-auto mb-3.5"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {authMode === "forgot_password"
              ? "استعادة كلمة المرور"
              : authMode === "gmail_otp"
              ? "الدخول عبر رمز Gmail"
              : "تسجيل الدخول • Connexion"}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            {authMode === "forgot_password"
              ? "أدخل بريدك الإلكتروني لتعيين كلمة مرور جديدة"
              : authMode === "gmail_otp"
              ? "رمز تحقق فوري مكون من 6 أرقام بدون كلمة مرور"
              : "منصة إدارة نقاط البيع والمتاجر المتكاملة • KASPI POS"}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        {authMode !== "forgot_password" && (
          <div className="flex bg-zinc-950/90 p-1 rounded-xl border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setAuthMode("password");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === "password"
                  ? "bg-white text-zinc-950 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>كلمة المرور</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setAuthMode("gmail_otp");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === "gmail_otp"
                  ? "bg-white text-zinc-950 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-red-500" />
              <span>رمز التحقق Gmail</span>
            </button>
          </div>
        )}

        {/* Feedback Banners */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/40 text-red-200 text-xs sm:text-sm rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm rounded-xl text-center font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* MODE 1: Standard Password Login */}
        {authMode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                البريد الإلكتروني المهني • Adresse Email
              </label>
              <input
                type="email"
                name="email"
                dir="ltr"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@votre-magasin.com"
                required
                className="w-full h-11 px-3.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/25 focus:border-white/40 transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  كلمة المرور • Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setAuthMode("forgot_password");
                    setResetStep("request");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <input
                type="password"
                name="password"
                dir="ltr"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-11 px-3.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/25 focus:border-white/40 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-white text-zinc-950 font-bold text-sm rounded-xl hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 cursor-pointer shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "دخول • Se connecter"}
            </button>
          </form>
        )}

        {/* MODE 2: Gmail 6-Digit OTP Login */}
        {authMode === "gmail_otp" && (
          <div className="space-y-4">
            {otpStep === "request" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    البريد الإلكتروني (Gmail)
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kaspipos.com"
                    required
                    className="w-full h-11 px-3.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/25 focus:border-white/40 transition-all"
                  />
                  <p className="text-[11px] text-zinc-400 mt-2">
                    سنرسل رمز تحقق فوري مكون من 6 أرقام إلى بريدك الإلكتروني لتسجيل الدخول.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>إرسال رمز التحقق (6 أرقام)</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      رمز التحقق المستلم (6 أرقام)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setOtpStep("request");
                      }}
                      className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                    >
                      تغيير البريد
                    </button>
                  </div>
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
                  <p className="text-[11px] text-zinc-400 mt-2.5 text-center">
                    يدعم اللصق الفوري عبر{" "}
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-200 font-mono">
                      Ctrl+V
                    </kbd>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 4}
                  className="w-full h-11 bg-white text-zinc-950 font-bold text-sm rounded-xl hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>تأكيد الرمز والدخول</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  {otpTimer > 0 ? (
                    <span className="text-xs text-zinc-500">
                      إعادة الإرسال متاحة بعد ({otpTimer}) ثانية
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>إعادة إرسال الرمز</span>
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
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    البريد الإلكتروني المسجل
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@votre-magasin.com"
                    required
                    className="w-full h-11 px-3.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/25 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-white text-zinc-950 font-bold text-sm rounded-xl hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>إرسال رمز استعادة الحساب</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    رمز التحقق (6 أرقام — يدعم Ctrl+V)
                  </label>
                  <OtpVerification
                    value={resetCode}
                    onChange={setResetCode}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    required
                    className="w-full h-11 px-3.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/25 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-11 px-3.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/25 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-white text-zinc-950 font-bold text-sm rounded-xl hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "تحديث كلمة المرور والدخول"
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
                className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة إلى تسجيل الدخول</span>
              </button>
            </div>
          </div>
        )}

        {/* Prominent 1-Click Demo & Founder Action Badges */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              disabled={demoLoading || founderLoading || loading}
              onClick={handleInstantDemoLogin}
              className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            >
              {demoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              )}
              <span>
                {demoLoading
                  ? "جاري فتح نقطة البيع التجريبية..."
                  : "Essayer la Démo Instantanée • تجربة فورية للنظام"}
              </span>
            </button>

            <button
              type="button"
              disabled={founderLoading || demoLoading || loading}
              onClick={handleQuickFounderLogin}
              className="w-full h-10 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-zinc-200 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {founderLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span dir="ltr">
                {founderLoading
                  ? "Signing in @kaspipos..."
                  : "Quick Founder Sign-In (@kaspipos)"}
              </span>
            </button>
          </div>

          {/* Registration Link */}
          <div className="pt-2 text-center text-xs text-zinc-400">
            <p>
              ليس لديك حساب؟{" "}
              <Link
                href={`/${locale}/register`}
                className="text-white hover:underline font-semibold"
              >
                إنشاء حساب جديد • Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-zinc-950 flex items-center justify-center text-white"
          dir="rtl"
        >
          <div className="flex items-center gap-3 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
            <span className="text-sm">جاري تحميل KASPI POS...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
