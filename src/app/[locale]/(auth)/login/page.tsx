"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
} from "lucide-react";

type AuthMode = "password" | "gmail_otp" | "forgot_password";

function LoginForm() {
  const router = useRouter();
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Handle URL Magic Link parameters: ?email=...&code=...&purpose=...
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
        // Auto-verify Magic Link
        executeOtpLogin(queryEmail, queryCode);
      }
    }
  }, [searchParams]);

  const handleRedirect = (isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      window.location.href = `/${locale}/admin`;
    } else {
      window.location.href = `/${locale}/dashboard`;
    }
  };

  // 1. Password Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const apiRes = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const apiData = await apiRes.json().catch(() => null);

      if (!apiRes.ok) {
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
        console.error("[NextAuth signIn error]:", res.error);
        setError("فشل إنشاء جلسة الدخول. يرجى التحقق من البيانات والمحاولة مجدداً.");
        setLoading(false);
        return;
      }

      const isSuperAdmin = Boolean(
        apiData?.data?.user?.isSuperAdmin || apiData?.user?.isSuperAdmin
      );

      // Device-local native password storage (PasswordCredential API)
      if (typeof window !== "undefined" && "PasswordCredential" in window && navigator.credentials) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: email,
            password: password,
            name: email,
          });
          await navigator.credentials.store(cred);
        } catch {
          // Ignore if unsupported or dismissed
        }
      }

      handleRedirect(isSuperAdmin);
    } catch {
      setError("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Login Code to Gmail
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("يرجى إدخال بريد إلكتروني صالح");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/v1/auth/email-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "login" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || data.error || "فشل إرسال رمز التحقق إلى بريدك");
        setLoading(false);
        return;
      }

      setOtpStep("verify");
      setOtpTimer(60);
      setSuccess(`تم إرسال رمز الدخول السري ورابط الدخول إلى ${email}. يرجى التحقق من بريدك.`);
    } catch {
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
      const res = await fetch("/api/v1/auth/email-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, code: codeToVerify, purpose: "login" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || data.error || "رمز التحقق غير صحيح أو انتهت صلاحيته");
        setLoading(false);
        return;
      }

      // Establish NextAuth session
      const authRes = await signIn("credentials", {
        redirect: false,
        email: targetEmail,
        otpCode: codeToVerify,
      });

      if (authRes?.error) {
        console.warn("[NextAuth OTP SignIn Warning]:", authRes.error);
      }

      setSuccess("تم التحقق بنجاح! جاري تحويلك...");
      const isSuperAdmin = Boolean(data.data?.user?.isSuperAdmin);
      handleRedirect(isSuperAdmin);
    } catch {
      setError("حدث خطأ أثناء التحقق من الرمز");
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }
    executeOtpLogin(email, otpCode.trim());
  };

  // 4. Send Password Reset Code to Gmail
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("يرجى إدخال بريدك الإلكتروني المسجل");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/v1/auth/email-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || data.error || "لم نتمكن من إرسال رمز إعادة التعيين");
        setLoading(false);
        return;
      }

      setResetStep("verify_and_set");
      setSuccess(`تم إرسال رمز إعادة تعيين كلمة المرور إلى ${email}. أدخل الرمز أدناه.`);
    } catch {
      setError("حدث خطأ أثناء طلب رمز استعادة كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit New Password with Code
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || resetCode.trim().length < 4) {
      setError("يرجى إدخال رمز التحقق المستلم في بريدك");
      return;
    }
    if (newPassword.length < 6) {
      setError("كلمة المرور يجب ألا تقل عن 6 أحرف");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
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
        setError(data.error?.message || data.error || "فشل إعادة تعيين كلمة المرور");
        setLoading(false);
        return;
      }

      // Automatically sign in with NextAuth
      await signIn("credentials", {
        redirect: false,
        email,
        password: newPassword,
      });

      // Device-local native password storage after reset (PasswordCredential API)
      if (typeof window !== "undefined" && "PasswordCredential" in window && navigator.credentials) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: email,
            password: newPassword,
            name: email,
          });
          await navigator.credentials.store(cred);
        } catch {
          // Ignore if unsupported
        }
      }

      setSuccess("تم تغيير كلمة المرور بنجاح! جاري تحويلك...");
      const isSuperAdmin = Boolean(data.data?.user?.isSuperAdmin);
      handleRedirect(isSuperAdmin);
    } catch {
      setError("حدث خطأ أثناء حفظ كلمة المرور الجديدة");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans"
      dir="rtl"
    >
      <div className="w-full max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl transition-all">
        {/* Logo Section */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="KASPI POS"
            className="w-16 h-16 object-contain bg-transparent mx-auto mb-4"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {authMode === "forgot_password"
              ? "إعادة الحصول على الرمز"
              : authMode === "gmail_otp"
              ? "الدخول عبر الجيميل"
              : "تسجيل الدخول"}
          </h1>
          <p className="text-zinc-400 text-sm mt-1.5">
            {authMode === "forgot_password"
              ? "استعادة الحساب وتعيين كلمة المرور الجديدة"
              : authMode === "gmail_otp"
              ? "تسجيل دخول فوري وآمن بدون كلمة مرور"
              : "مرحباً بك في KASPI POS"}
          </p>
        </div>

        {/* Mode Selector Tabs (Hidden in forgot_password mode) */}
        {authMode !== "forgot_password" && (
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                authMode === "password"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              كلمة المرور
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("gmail_otp");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                authMode === "gmail_otp"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-red-400" />
              رمز الجيميل
              <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded-full border border-red-800">
                Gmail
              </span>
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-sm rounded-lg text-center font-medium shadow-sm animate-fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-sm rounded-lg text-center font-medium shadow-sm flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 1: Standard Password Login                                */}
        {/* ------------------------------------------------------------- */}
        {authMode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dormiismail02@gmail.com"
                required
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-zinc-300">
                  كلمة المرور
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("forgot_password");
                    setResetStep("request");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  نسيت كلمة المرور؟ / إعادة الحصول على الرمز
                </button>
              </div>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 cursor-pointer mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "دخول"}
            </button>

            {/* Quick Gmail Code Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("gmail_otp");
                  setError("");
                  setSuccess("");
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                نسيت كلمة المرور؟ يمكنك الدخول مباشرة عبر رمز الجيميل
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 2: Gmail OTP Login (Message to Gmail)                     */}
        {/* ------------------------------------------------------------- */}
        {authMode === "gmail_otp" && (
          <div className="space-y-4">
            {otpStep === "request" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    بريد الجيميل (Gmail)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dormiismail02@gmail.com"
                    required
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    ✉️ سنرسل رسالة فورية إلى حساب الجيميل تحتوي على رمز سري ورابط للدخول بنقرة واحدة.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-lg transition-all flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-red-950/50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      إرسال رمز الدخول إلى Gmail
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-zinc-300">
                      رمز التحقق المستلم (6 أرقام)
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpStep("request")}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      تغيير البريد ({email})
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    autoFocus
                    required
                    className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                  />
                  <p className="text-xs text-zinc-500 mt-2 text-center">
                    تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها (Spam) في الجيميل.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 4}
                  className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      تأكيد الرمز وتسجيل الدخول
                    </>
                  )}
                </button>

                {/* Resend Code Button */}
                <div className="text-center pt-1">
                  {otpTimer > 0 ? (
                    <span className="text-xs text-zinc-500">
                      يمكنك إعادة إرسال الرمز بعد ({otpTimer}) ثانية
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                      className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      لم يصلك الرمز؟ إعادة الإرسال إلى الجيميل
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE 3: Forgot Password / Recover Code                         */}
        {/* ------------------------------------------------------------- */}
        {authMode === "forgot_password" && (
          <div className="space-y-4">
            {resetStep === "request" ? (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    البريد الإلكتروني المسجل
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dormiismail02@gmail.com"
                    required
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    أدخل بريدك الإلكتروني ليصلك رمز إعادة تعيين كلمة المرور فوراً عبر رسالة في Gmail.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      إرسال رمز إعادة التعيين إلى Gmail
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    رمز التحقق من Gmail (6 أرقام)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    autoFocus
                    required
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-center text-xl font-mono tracking-widest placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    required
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "تأكيد وتغيير كلمة المرور والدخول"
                  )}
                </button>
              </form>
            )}

            {/* Back to Login link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setError("");
                  setSuccess("");
                }}
                className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                العودة إلى تسجيل الدخول
              </button>
            </div>
          </div>
        )}

        {/* Footer Registration Link */}
        <div className="mt-8 text-center text-sm text-zinc-400 border-t border-zinc-800/80 pt-6">
          <p>
            ليس لديك حساب؟{" "}
            <Link
              href={`/${locale}/register`}
              className="text-white hover:underline font-medium"
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white" dir="rtl">
          <div className="flex items-center gap-3 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
            <span>جاري تحميل KASPI POS...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
