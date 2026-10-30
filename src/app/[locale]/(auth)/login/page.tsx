"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate via custom session API (sets kasbi_session cookie for API routes)
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message || "Invalid email or password");
        return;
      }

      // 2. Also sign in with NextAuth credentials so NextAuth session stays synced
      await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      // 3. Route Super Admin to /admin, merchants to /dashboard
      if (data?.data?.user?.isSuperAdmin) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      {/* Top Header with Brand & Language Switcher */}
      <div className="absolute top-4 inset-x-0 px-4 sm:px-8 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="KASPI POS"
            width={32}
            height={32}
            className="h-8 w-8 object-contain rounded-lg"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span className="font-bold text-base text-white tracking-tight">
            {tCommon("appName")}
          </span>
        </Link>
        <LanguageSwitcher />
      </div>

      {/* Centered Logo & Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mt-8">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center mb-6 mx-auto shadow-xl overflow-hidden p-1.5">
          <img
            src="/logo.png"
            alt="KASPI POS Logo"
            width={56}
            height={56}
            className="w-12 h-12 object-contain"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {t("login")}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">{tCommon("tagline")}</p>
      </div>

      {/* Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900/90 py-8 px-6 shadow-2xl rounded-2xl border border-zinc-800 sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 text-start"
              >
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@commerce.ma"
                required
                className="appearance-none block w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl placeholder-zinc-500 focus:outline-none focus:border-white text-sm text-white transition-all font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 text-start"
              >
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="appearance-none block w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl placeholder-zinc-500 focus:outline-none focus:border-white text-sm text-white transition-all font-mono"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-black bg-white hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{tCommon("loading")}</span>
                  </>
                ) : (
                  t("login")
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            <span>{t("dontHaveAccount")} </span>
            <Link
              href="/register"
              className="font-semibold text-white hover:underline underline-offset-4"
            >
              {t("register")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

