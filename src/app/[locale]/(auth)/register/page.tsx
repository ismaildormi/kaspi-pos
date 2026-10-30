"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

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
        setError(data?.error?.message || "Échec de l'inscription.");
      } else {
        if (data?.data?.user?.isSuperAdmin) {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Une erreur réseau inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      {/* Top Header with Language Switcher */}
      <div className="absolute top-4 inset-x-0 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            <img src="/logo.png" alt="Kasbi POS" className="h-full w-full object-contain" />
          </div>
          <span className="font-bold text-base text-white tracking-tight">
            Kasbi POS
          </span>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
          {t("register")}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {tCommon("tagline")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900/90 py-8 px-6 shadow-2xl rounded-2xl border border-zinc-800 sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
              >
                {t("fullName")}
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Youssef El Amrani"
                className="appearance-none block w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl placeholder-zinc-500 focus:outline-none focus:border-white text-sm text-white transition-all font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="shopName"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
              >
                {t("shopName")}
              </label>
              <input
                id="shopName"
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Épicerie Atlas"
                className="appearance-none block w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl placeholder-zinc-500 focus:outline-none focus:border-white text-sm text-white transition-all font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
              >
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@epicerieatlas.ma"
                className="appearance-none block w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl placeholder-zinc-500 focus:outline-none focus:border-white text-sm text-white transition-all font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
              >
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="appearance-none block w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl placeholder-zinc-500 focus:outline-none focus:border-white text-sm text-white transition-all font-mono"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-bold text-black bg-white hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-40"
              >
                {isLoading ? tCommon("loading") : t("register")}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            <span>{t("alreadyHaveAccount")} </span>
            <Link
              href="/login"
              className="font-semibold text-white hover:underline underline-offset-4"
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
