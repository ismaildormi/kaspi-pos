"use client";

import React from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 font-sans select-none">
        <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-white/15 p-8 text-center shadow-2xl space-y-5">
          <h2 className="text-lg font-extrabold text-white">
            KASPI POS • Reconnexion
          </h2>
          <p className="text-xs text-zinc-400">
            Une actualisation rapide est requise pour synchroniser votre session.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="h-10 px-4 rounded-xl bg-white text-black font-bold text-xs cursor-pointer"
            >
              Réessayer • إعادة المحاولة
            </button>
            <a
              href="/pos"
              className="h-10 px-4 rounded-xl bg-zinc-800 border border-white/15 text-white font-bold text-xs inline-flex items-center justify-center"
            >
              Retourner à la Caisse • الكاشير
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
