"use client";

import { useAppUpdater } from "@/hooks/useAppUpdater";
import { Download, Sparkles, X, RefreshCw } from "lucide-react";
import { useAppDictionary } from "@/i18n/schema";

export function UpdateBanner() {
  const { hasUpdate, updateInfo, isInstalling, installUpdate, dismissUpdate } = useAppUpdater();
  const { locale } = useAppDictionary();

  if (!hasUpdate || !updateInfo) return null;

  const copy = {
    ar: {
      title: "تحديث جديد متوفر",
      desc: "إصدار جديد متوفر. أعد تشغيل التطبيق للتحديث.",
      restart: "إعادة التشغيل للتحديث",
      installing: "جاري التثبيت وإعادة التشغيل...",
      later: "لاحقاً",
      close: "إغلاق",
    },
    fr: {
      title: "Mise à jour disponible",
      desc: "Nouvelle version prête. Redémarrez pour mettre à jour.",
      restart: "Redémarrer et mettre à jour",
      installing: "Installation & Redémarrage...",
      later: "Plus tard",
      close: "Fermer",
    },
    en: {
      title: "Update Available",
      desc: "A new version is ready. Restart to apply update.",
      restart: "Restart to update",
      installing: "Installing & Restarting...",
      later: "Later",
      close: "Close",
    },
  }[locale] || {
    title: "Mise à jour disponible",
    desc: "Nouvelle version prête. Redémarrez pour mettre à jour.",
    restart: "Redémarrer et mettre à jour",
    installing: "Installation & Redémarrage...",
    later: "Plus tard",
    close: "Fermer",
  };

  return (
    <div
      dir="ltr"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-white shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{copy.title}</span>
              <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-black text-black">
                v{updateInfo.version}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 font-semibold mt-1">
              {copy.desc}
            </p>
          </div>
        </div>

        <button
          onClick={dismissUpdate}
          className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-white transition cursor-pointer"
          aria-label={copy.close}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-900">
        <button
          onClick={installUpdate}
          disabled={isInstalling}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50 shadow-md cursor-pointer"
        >
          {isInstalling ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {copy.installing}
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              {copy.restart}
            </>
          )}
        </button>
        <button
          onClick={dismissUpdate}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          {copy.later}
        </button>
      </div>
    </div>
  );
}
