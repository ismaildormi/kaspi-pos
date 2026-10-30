"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        router.push("/admin"); // Redirect to admin or dashboard
        router.refresh();
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        
        {/* Logo Section - Fixed size and centered */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-black rounded-xl border border-zinc-700 flex items-center justify-center mb-4 overflow-hidden">
            {/* Fallback to a simple shape if logo breaks, or use the image safely */}
            <img 
              src="/logo.png" 
              alt="KASPI POS" 
              className="w-12 h-12 object-contain" 
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">تسجيل الدخول</h1>
          <p className="text-zinc-400 text-sm mt-2">مرحباً بك في KASPI POS</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@commerce.ma"
              required
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">كلمة المرور</label>
            <input
              type="password"
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
            className="w-full py-3 px-4 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "دخول"}
          </button>
        </form>

        {/* Links */}
        <div className="mt-8 text-center text-sm text-zinc-400">
          <p>
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-white hover:underline font-medium">
              إنشاء حساب جديد
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
