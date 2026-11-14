"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getApiUrl } from "@/client/sync-engine";
import { AuthGlassShell, AuthLocale } from "@/components/auth/MonochromePosBackground";
import { playTapSound, playSuccessSound, playErrorSound } from "@/lib/audio";
import { getLocalizedAuthError } from "@/lib/auth-errors";

type StoreVertical = "grocery" | "butchery" | "produce" | "restaurant" | "fashion" | "electronics";

const REGISTER_I18N: Record<
  AuthLocale,
  {
    title: string;
    verticals: Record<StoreVertical, string>;
    fullNamePlaceholder: string;
    shopNamePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    submitBtn: string;
    hasAccountText: string;
    signInLink: string;
    errFailed: string;
    errNetwork: string;
  }
> = {
  ar: {
    title: "إنشاء حساب جديد",
    verticals: {
      grocery: "سوبرماركت وبقالة",
      butchery: "جزارة ولحوم",
      produce: "خضر وفواكه وتمور",
      restaurant: "مقهى ومطعم ومأكولات",
      fashion: "ملابس وأزياء",
      electronics: "إلكترونيات وتجارة",
    },
    fullNamePlaceholder: "الاسم الكامل",
    shopNamePlaceholder: "اسم المتجر",
    emailPlaceholder: "البريد الإلكتروني",
    passwordPlaceholder: "كلمة المرور",
    submitBtn: "إطلاق المتجر الآن",
    hasAccountText: "لديك حساب بالفعل؟",
    signInLink: "تسجيل الدخول",
    errFailed: "تعذر إنشاء الحساب، يرجى التحقق من البيانات",
    errNetwork: "حدث خطأ غير متوقع في الاتصال بالخادم",
  },
  fr: {
    title: "Créer un compte",
    verticals: {
      grocery: "Supermarché & Épicerie",
      butchery: "Boucherie & Viandes",
      produce: "Fruits, Légumes & Dattes",
      restaurant: "Café, Snack & Restaurant",
      fashion: "Mode & Vêtements",
      electronics: "Électronique & Commerce",
    },
    fullNamePlaceholder: "Nom complet",
    shopNamePlaceholder: "Nom de la boutique",
    emailPlaceholder: "Adresse e-mail",
    passwordPlaceholder: "Mot de passe",
    submitBtn: "Lancer la boutique maintenant",
    hasAccountText: "Vous avez déjà un compte ?",
    signInLink: "Se connecter",
    errFailed: "Impossible de créer le compte",
    errNetwork: "Erreur de connexion au serveur",
  },
  en: {
    title: "Create New Account",
    verticals: {
      grocery: "Supermarket & Grocery",
      butchery: "Butchery & Meats",
      produce: "Fruits, Vegetables & Dates",
      restaurant: "Cafe, Snack & Restaurant",
      fashion: "Fashion & Apparel",
      electronics: "Electronics & Retail",
    },
    fullNamePlaceholder: "Full Name",
    shopNamePlaceholder: "Store Name",
    emailPlaceholder: "Email Address",
    passwordPlaceholder: "Password",
    submitBtn: "Launch Store Now",
    hasAccountText: "Already have an account?",
    signInLink: "Sign In",
    errFailed: "Unable to create account, please check your details",
    errNetwork: "Unexpected network error occurred",
  },
};

function normalizeLocale(raw?: string): AuthLocale {
  if (raw === "fr" || raw === "en" || raw === "ar") return raw;
  return "ar";
}

const VERTICAL_ORDER: StoreVertical[] = [
  "grocery",
  "butchery",
  "produce",
  "restaurant",
  "fashion",
  "electronics",
];

export default function RegisterPage() {
  const params = useParams();
  const initialLocale = normalizeLocale(params?.locale as string);

  const [locale, setLocale] = useState<AuthLocale>(initialLocale);
  const t = REGISTER_I18N[locale];
  const isRtl = locale === "ar";

  const [storeType, setStoreType] = useState<StoreVertical>("grocery");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLocaleChange = (nextLocale: AuthLocale) => {
    setLocale(nextLocale);
    setError("");
    if (typeof window !== "undefined") {
      const nextPath = window.location.pathname.replace(/^\/(ar|fr|en)(\/|$)/, `/${nextLocale}$2`);
      window.history.replaceState(null, "", `${nextPath}${window.location.search}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/api/v1/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          shopName,
          email,
          password,
          storeType,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        playErrorSound();
        const rawErr =
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message || data?.message || data?.code || t.errFailed;
        const errorMsg = getLocalizedAuthError(rawErr, locale);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Sign in with NextAuth credentials so both cookies are synchronized
      await signIn("credentials", {
        redirect: false,
        email,
        password,
      }).catch(() => {});

      // Seed starter catalog for selected vertical in background
      await fetch(getApiUrl("/api/v1/onboarding/setup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeType,
          shopName,
          currency: "MAD",
          receiptLanguage: locale,
          seedStarterCatalog: false,
        }),
      }).catch(() => {});

      // Native browser credential storage
      if (
        typeof window !== "undefined" &&
        "PasswordCredential" in window &&
        navigator.credentials
      ) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: email,
            password,
            name: fullName || email,
          });
          await navigator.credentials.store(cred);
        } catch {}
      }

      playSuccessSound();
      window.location.href = `/${locale}/dashboard`;
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
      title={t.title}
    >
      {/* 6 Clean, Emoji-Free Business Vertical Selector Tiles (2-Column Grid) */}
      <div dir="ltr" className="grid grid-cols-2 gap-2 mb-3.5">
        {VERTICAL_ORDER.map((vertical) => {
          const selected = storeType === vertical;
          return (
            <button
              key={vertical}
              type="button"
              onClick={() => {
                playTapSound();
                setStoreType(vertical);
              }}
              className={`h-10 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center text-center ${
                selected
                  ? "kaspi-polar-aurora-orbit kaspi-orbit-active border-transparent text-white"
                  : "border border-white/12 bg-zinc-900/70 text-zinc-300 hover:border-white/30 hover:bg-zinc-900/90"
              }`}
            >
              {t.verticals[vertical]}
            </button>
          );
        })}
      </div>

      {/* Monochrome Error Feedback */}
      {error && (
        <div className="mb-3 px-3.5 py-2 bg-zinc-900/95 border border-white/25 text-zinc-200 text-xs rounded-2xl text-center font-medium">
          {error}
        </div>
      )}

      {/* Compact Registration Form (Zero Vertical Scrolling) */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="relative rounded-2xl kaspi-polar-aurora-orbit">
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t.fullNamePlaceholder}
            required
            className={`w-full h-11 px-4 kaspi-translucent-input rounded-2xl text-sm placeholder-zinc-400 focus:outline-none transition-all ${
              isRtl ? "text-right" : "text-left"
            }`}
          />
        </div>

        <div className="relative rounded-2xl kaspi-polar-aurora-orbit">
          <input
            type="text"
            name="organization"
            autoComplete="organization"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder={t.shopNamePlaceholder}
            minLength={2}
            required
            className={`w-full h-11 px-4 kaspi-translucent-input rounded-2xl text-sm placeholder-zinc-400 focus:outline-none transition-all ${
              isRtl ? "text-right" : "text-left"
            }`}
          />
        </div>

        <div className="relative rounded-2xl kaspi-polar-aurora-orbit">
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            required
            className={`w-full h-11 px-4 kaspi-translucent-input rounded-2xl text-sm placeholder-zinc-400 focus:outline-none transition-all ${
              isRtl ? "text-right" : "text-left"
            }`}
          />
        </div>

        <div className="relative rounded-2xl kaspi-polar-aurora-orbit">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder}
            minLength={6}
            required
            className={`w-full h-11 kaspi-translucent-input rounded-2xl text-sm placeholder-zinc-400 focus:outline-none transition-all ${
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

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-[15px] rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all flex justify-center items-center cursor-pointer mt-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : t.submitBtn}
        </button>
      </form>

      {/* Sign-In Footer Link */}
      <div
        dir="auto"
        className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-400"
      >
        <span>{t.hasAccountText}</span>
        <Link
          href={`/${locale}/login`}
          onClick={() => playTapSound()}
          className="text-sky-400 hover:underline font-bold"
        >
          {t.signInLink}
        </Link>
      </div>
    </AuthGlassShell>
  );
}
