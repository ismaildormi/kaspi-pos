"use client";

import React, { Suspense, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { EmailVerificationCard } from "@/components/auth/EmailVerificationCard";
import {
  VerificationLang,
  normalizeVerificationCode,
  normalizeVerificationLang,
} from "@/lib/email/verification-copy";

function VerifyCodeContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const code = normalizeVerificationCode(searchParams.get("code"));
  const lang = normalizeVerificationLang(
    searchParams.get("lang") || (params?.locale as string | undefined)
  );
  const purpose = searchParams.get("purpose") === "reset" ? "reset" : "login";
  const autoCopy = searchParams.get("copy") === "1";

  // Keep ?lang= in sync so a refresh or shared link keeps the chosen language.
  const handleLocaleChange = useCallback((next: VerificationLang) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    url.searchParams.delete("copy");
    window.history.replaceState(null, "", url.toString());
  }, []);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#f4f4f5] dark:bg-zinc-950 p-4 sm:p-6 transition-colors">
      <EmailVerificationCard
        code={code}
        initialLocale={lang}
        purpose={purpose}
        autoCopy={autoCopy}
        onLocaleChange={handleLocaleChange}
      />
    </main>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f4f5] dark:bg-zinc-950" />}>
      <VerifyCodeContent />
    </Suspense>
  );
}
