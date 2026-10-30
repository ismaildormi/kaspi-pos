"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { Link, useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Email ou mot de passe incorrect.");
      } else {
        router.push("/pos");
      }
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/pos" });
    } catch {
      setError("Échec de connexion Google.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      {/* Top Header with Language Switcher */}
      <div className="absolute top-4 inset-x-0 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-black text-base shadow-sm">
            ك
          </div>
          <span className="font-bold text-base text-white tracking-tight">
            Kasbi POS
          </span>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
          {t("login")}
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

          {/* Google OAuth Button */}
          <button
            type="button"
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-950 text-sm font-semibold text-white hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-40"
          >
            <span>{isGoogleLoading ? tCommon("loading") : t("loginWithGoogle")}</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-3 text-zinc-500 font-mono">
                {t("or")}
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
              >
                {t("email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@commerce.ma"
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
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="appearance-none block w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl placeholder-zinc-500 focus:outline-none focus:border-white text-sm text-white transition-all font-mono"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-bold text-black bg-white hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-40"
              >
                {isLoading ? tCommon("loading") : t("login")}
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
