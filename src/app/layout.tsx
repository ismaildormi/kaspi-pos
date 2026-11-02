import "@/app/globals.css";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { UpdateBanner } from "@/components/UpdateBanner";
import { OfflineSyncBootstrap } from "@/client/sync-engine";

export const metadata = {
  title: "Kasbi POS — Système de Caisse & ERP Intelligent Maroc",
  description: "Solution de caisse tactile, gestion des stocks, conformité DGI, offline-first et intégration WhatsApp.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let locale = "fr";
  let messages = {};

  try {
    locale = await getLocale();
    messages = await getMessages();
  } catch {
    // fallback
  }

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-zinc-950 text-white min-h-screen antialiased selection:bg-white selection:text-black">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <OfflineSyncBootstrap />
          {children}
          <AIChatWidget />
          <UpdateBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
