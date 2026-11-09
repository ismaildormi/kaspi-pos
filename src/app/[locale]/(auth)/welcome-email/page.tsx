"use client";

import React, { Suspense, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { WelcomeEmailCard } from "@/components/email/WelcomeEmailCard";
import {
  WelcomeLang,
  normalizeWelcomeLang,
} from "@/lib/email/welcome-copy";

function WelcomeEmailContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const lang = normalizeWelcomeLang(
    searchParams.get("lang") || (params?.locale as string | undefined)
  );

  const data = {
    userName: searchParams.get("name") || "أمين العلوي",
    storeName: searchParams.get("store") || "سوبرماركت النخيل",
    storeCategory: searchParams.get("category") || "grocery",
    userEmail: searchParams.get("email") || "contact@store.ma",
    loginDate: searchParams.get("date") || new Date().toISOString(),
  };

  const handleLocaleChange = useCallback((nextLang: WelcomeLang) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLang);
    window.history.replaceState(null, "", url.toString());
  }, []);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#f4f4f5] dark:bg-zinc-950 p-4 sm:p-6 transition-colors">
      <WelcomeEmailCard
        data={data}
        initialLocale={lang}
        onLocaleChange={handleLocaleChange}
      />
    </main>
  );
}

export default function WelcomeEmailPreviewPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f4f5] dark:bg-zinc-950" />}>
      <WelcomeEmailContent />
    </Suspense>
  );
}
