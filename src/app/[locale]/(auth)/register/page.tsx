"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          shopName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message || data?.message || "فشل إنشاء الحساب";
        setError(errorMsg);
      } else {
        if (data?.data?.user?.isSuperAdmin) {
          router.push("/ar/admin");
        } else {
          router.push("/ar/pos");
        }
        router.refresh();
      }
    } catch {
      setError("حدث خطأ غير متوقع في الشبكة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans"
      dir="rtl"
    >
      <div className="w-full max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="KASPI POS"
            className="w-16 h-16 object-contain bg-transparent mx-auto mb-4"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            إنشاء حساب جديد
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            ابدأ إدارة متجرك مع KASPI POS
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-850 text-red-200 text-sm rounded-lg text-center font-medium shadow-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              الاسم الكامل
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="أمين العلوي"
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              اسم المحل التجاري
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="ميني ماركت أنفا"
              minLength={2}
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
            />
            <p className="text-[11px] text-zinc-500 mt-1">Minimum 2 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@commerce.ma"
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "إنشاء الحساب"
            )}
          </button>
        </form>

        {/* Links */}
        <div className="mt-8 text-center text-sm text-zinc-400">
          <p>
            لديك حساب بالفعل؟{" "}
            <Link
              href="/ar/login"
              className="text-white hover:underline font-medium"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
