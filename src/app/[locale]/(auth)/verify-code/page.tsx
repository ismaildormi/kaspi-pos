"use client";

import React, { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  EmailVerificationCard,
  VerificationCardLocale,
} from "@/components/auth/EmailVerificationCard";

function normalizeLocale(raw?: string): VerificationCardLocale {
  if (raw === "fr" || raw === "en" || raw === "ar") return raw;
  return "ar";
}

function VerifyCodeContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const initialLocale = normalizeLocale(params?.locale as string);
  const code = searchParams.get("code") || "673410";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 p-4 sm:p-6">
      <EmailVerificationCard code={code} initialLocale={initialLocale} />
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950" />
      }
    >
      <VerifyCodeContent />
    </Suspense>
  );
}
