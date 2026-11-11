"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const LAUNCH_I18N = {
  ar: {
    dir: "rtl",
    heading: "تم توجيهك إلى تطبيق KASPI POS على جهازك",
    description:
      "جاري فتح الجلسة وتوجيهك مباشرة إلى حسابك داخل التطبيق المكتبي المثبت على جهازك. يمكنك إغلاق هذه النافذة بأمان.",
    retryBtn: "فتح تطبيق KASPI POS يدوياً",
    closeBtn: "إغلاق هذه النافذة",
    launching: "جاري إطلاق التطبيق المكتبي...",
  },
  fr: {
    dir: "ltr",
    heading: "Vous avez été redirigé vers l'application KASPI POS",
    description:
      "Votre session s'ouvre directement dans l'application de bureau installée sur votre ordinateur. Vous pouvez fermer cet onglet.",
    retryBtn: "Rouvrir l'application KASPI POS",
    closeBtn: "Fermer cet onglet",
    launching: "Lancement de l'application de bureau...",
  },
  en: {
    dir: "ltr",
    heading: "Redirected to your KASPI POS Desktop App",
    description:
      "Your session is opening directly inside the desktop application installed on your computer. You may close this window.",
    retryBtn: "Open KASPI POS App Manually",
    closeBtn: "Close this window",
    launching: "Launching desktop application...",
  },
};

function LaunchDesktopContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const langParam = searchParams.get("lang") || "ar";
  const lang = (langParam === "fr" || langParam === "en" ? langParam : "ar") as
    | "ar"
    | "fr"
    | "en";
  const target = searchParams.get("target") || `/${lang}/dashboard`;

  const t = LAUNCH_I18N[lang];
  const [attempted, setAttempted] = useState(false);

  const protocolUrl = `kaspipos://open?token=${encodeURIComponent(
    token
  )}&lang=${encodeURIComponent(lang)}&target=${encodeURIComponent(target)}`;

  const triggerDesktopHandoff = () => {
    if (!token) return;

    // 1. Local IPC Loopback Trigger: If KASPI POS desktop app is already open,
    // invoke its local listener on 127.0.0.1:41732 to restore, focus, and navigate window immediately
    const ipcUrl = `http://127.0.0.1:41732/handoff?token=${encodeURIComponent(
      token
    )}&lang=${encodeURIComponent(lang)}&target=${encodeURIComponent(target)}`;

    try {
      fetch(ipcUrl, { method: "GET", mode: "no-cors" }).catch(() => {});
    } catch {}

    // 2. Custom Protocol Launch: Triggers OS protocol association (kaspipos://open)
    // Starts the desktop application if it was not running
    try {
      window.location.href = protocolUrl;
    } catch {}

    // 3. Attempt to auto-close this temporary bridge tab
    setTimeout(() => {
      try {
        window.close();
      } catch {}
    }, 1200);

    setAttempted(true);
  };

  useEffect(() => {
    triggerDesktopHandoff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main
      dir="ltr"
      className="min-h-screen w-full flex items-center justify-center bg-[#f4f4f5] dark:bg-zinc-950 p-4 sm:p-6 select-none font-sans"
    >
      <div className="relative w-full max-w-[460px] mx-auto overflow-hidden rounded-[24px] bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-[#e5e7eb] dark:border-zinc-800 p-8 sm:p-10 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-8px_rgba(16,24,40,0.12),0_40px_80px_-32px_rgba(16,24,40,0.22)] text-center">
        {/* Subtle Decorative Corner Accents */}
        <svg
          viewBox="0 0 160 160"
          className="pointer-events-none absolute -top-px -left-px w-24 h-24 text-zinc-950 dark:text-zinc-800"
          aria-hidden="true"
        >
          <path d="M0 0H120C66 12 22 56 0 112Z" fill="currentColor" />
        </svg>

        {/* Brand Header */}
        <div dir="ltr" className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl overflow-hidden p-0 border border-zinc-200 dark:border-white/20 bg-zinc-950 shrink-0 shadow-md">
            <img src="/logo.png" alt="KASPI POS" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[28px] font-black tracking-[-0.03em] text-zinc-950 dark:text-white leading-none">
              KASPI
            </span>
            <span className="rounded-lg bg-[#09090b] dark:bg-white px-2.5 py-1 text-[22px] font-black tracking-[-0.02em] text-white dark:text-zinc-950 leading-none">
              POS
            </span>
          </div>
        </div>

        {/* Center Desktop Icon in Double-Ring Badge */}
        <div className="my-6 flex items-center justify-center">
          <div className="relative inline-block">
            <div className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 p-2 shadow-[inset_0_1px_2px_rgba(16,24,40,0.06)]">
              <div className="rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-1.5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#09090b] dark:bg-white text-white dark:text-zinc-950 shadow-md">
                  {/* Clean SVG Desktop Monitor Icon */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8"
                    aria-hidden="true"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Emerald Verified Checkmark */}
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#10b981] border-2 border-white dark:border-zinc-950 text-white flex items-center justify-center text-xs font-black shadow-sm">
              &#10003;
            </div>
          </div>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-[20px] sm:text-[22px] font-black tracking-tight text-zinc-950 dark:text-white leading-snug mb-3">
          {t.heading}
        </h1>
        <p className="text-[13px] sm:text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-[360px] mx-auto mb-7">
          {t.description}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 flex flex-col items-center">
          <button
            type="button"
            onClick={triggerDesktopHandoff}
            className="w-full h-12 max-w-[280px] rounded-full bg-[#09090b] dark:bg-white text-white dark:text-zinc-950 font-extrabold text-[14px] shadow-[0_10px_24px_-10px_rgba(9,9,11,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            {t.retryBtn}
          </button>

          <button
            type="button"
            onClick={() => {
              try {
                window.close();
              } catch {}
            }}
            className="text-[13px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LaunchDesktopPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f4f4f5] dark:bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
          Loading...
        </main>
      }
    >
      <LaunchDesktopContent />
    </Suspense>
  );
}
