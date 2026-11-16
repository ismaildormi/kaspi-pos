"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { useAppDictionary } from "@/i18n/schema";
import { KaspiTpeManagerPanel } from "@/components/settings/KaspiTpeManagerPanel";

export default function SettingsTerminalsPage() {
  const { locale, t } = useAppDictionary();

  return (
    <div dir="ltr" className="space-y-6 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${locale}/dashboard/settings`}
              className="text-xs font-medium text-zinc-400 hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.settings.title}</span>
            </Link>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5 text-white" />
            <span>{locale === "ar" ? "أجهزة الدفع TPE" : "Payment Terminals (TPE)"}</span>
          </h1>
        </div>
      </div>

      <KaspiTpeManagerPanel locale={locale} />
    </div>
  );
}
