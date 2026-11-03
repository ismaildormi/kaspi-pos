"use client";

import { useAppUpdater } from "@/hooks/useAppUpdater";
import { Download, Sparkles, X, RefreshCw } from "lucide-react";

export function UpdateBanner() {
  const { hasUpdate, updateInfo, isInstalling, installUpdate, dismissUpdate } = useAppUpdater();

  if (!hasUpdate || !updateInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-white shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Mise à jour disponible</span>
              <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-black text-black">
                v{updateInfo.version}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 font-semibold mt-1">
              New version available. Restart to update.
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5 font-sans" dir="rtl">
              إصدار جديد متوفر. أعد التشغيل للتحديث.
            </p>
          </div>
        </div>

        <button
          onClick={dismissUpdate}
          className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-white transition"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-900">
        <button
          onClick={installUpdate}
          disabled={isInstalling}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50 shadow-md"
        >
          {isInstalling ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Installation &amp; Redémarrage...
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              Restart to update
            </>
          )}
        </button>
        <button
          onClick={dismissUpdate}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
