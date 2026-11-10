"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, ShoppingBag, ShieldAlert } from "lucide-react";
import { useAppDictionary } from "@/i18n/schema";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, locale } = useAppDictionary();

  useEffect(() => {
    console.warn("[KASPI Dashboard Error Boundary]:", error);
  }, [error]);

  const title =
    locale === "ar"
      ? "مزامنة مساحة العمل"
      : locale === "fr"
      ? "Synchronisation de l'espace de travail"
      : "Workspace Synchronization";

  const description =
    locale === "ar"
      ? "حدث انقطاع مؤقت في المزامنة — اضغط على إعادة المحاولة أو انتقل مباشرة إلى نقطة البيع."
      : locale === "fr"
      ? "Une synchronisation est en cours — cliquez sur Réessayer ou retournez à la caisse."
      : "A synchronization is in progress — click Retry or return to the POS register.";

  const retryLabel =
    locale === "ar" ? "إعادة المحاولة" : locale === "fr" ? "Réessayer" : "Retry";

  const posLabel =
    locale === "ar"
      ? "العودة إلى الكاشير"
      : locale === "fr"
      ? "Retourner à la Caisse"
      : "Back to POS Register";

  return (
    <div dir="ltr" className="min-h-[75vh] flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-md rounded-3xl bg-zinc-900/90 backdrop-blur-2xl border border-white/15 p-8 text-center shadow-2xl space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-extrabold text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto flex-1 h-10 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs inline-flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{retryLabel}</span>
          </button>

          <Link
            href={`/${locale}/pos`}
            className="w-full sm:w-auto flex-1 h-10 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>{posLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
