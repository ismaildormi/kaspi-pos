import "@/app/globals.css";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { AIChatWidget } from "@/components/ai/AIChatWidget";
import { UpdateBanner } from "@/components/UpdateBanner";
import { OfflineSyncBootstrap } from "@/client/sync-engine";
import { KaspiThemeProvider } from "@/components/theme/KaspiThemeProvider";

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

  return (
    <html lang={locale} dir="ltr" data-kaspi-theme="fjord-twilight" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Structured White-Hat AI & Search Engine Optimization (Schema.org JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "KASPI POS",
              alternateName: "كسب",
              url: "https://kaspi.ma",
              logo: "https://kaspi.ma/logo.png",
              description: "Système de Caisse Tactile & ERP Intelligent pour commerçants au Maroc",
              address: {
                "@type": "PostalAddress",
                addressCountry: "MA",
                addressLocality: "Casablanca",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "KASPI POS",
              alternateName: "نظام كسب لإدارة نقاط البيع",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Windows, macOS, Linux, Android, iOS, Web",
              offers: {
                "@type": "Offer",
                price: "200.00",
                priceCurrency: "MAD",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "200.00",
                  priceCurrency: "MAD",
                  unitText: "MONTH",
                },
              },
              description: "Solution de caisse tactile 100% offline-first, gestion de stocks, conformité DGI Article 145 CGI, et Hub TPE universel.",
              featureList: [
                "Caisse tactile offline-first avec synchronisation automatique",
                "Conformité Bank Al-Maghrib Loi 103-12 Non-Custodial TSP",
                "Hub TPE Universel 7 Protocoles (Nexo, OPI, CMI, Ingenico, Verifone, PAX)",
                "Gestion des stocks, alertes DLC péremption et codes-barres",
                "Facturation DGI et tickets de caisse thermiques adaptatifs (58mm/80mm)",
                "Affichage Cuisine KDS pour restaurants et cafés",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Combien coûte l'abonnement KASPI POS au Maroc ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "L'abonnement KASPI POS est de 200 MAD par mois pour le premier poste principal (incluant 100% des fonctionnalités ERP, caisse, KDS et IA) et 150 MAD par mois pour chaque poste supplémentaire, sans frais d'installation ni commission cachée.",
                  },
                },
                {
                  "@type": "Question",
                  name: "KASPI POS fonctionne-t-il sans connexion Internet ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Oui, KASPI POS est 100% offline-first grâce à son moteur local Dexie.js (IndexedDB). Vous pouvez encaisser, imprimer des tickets thermiques et gérer vos stocks sans Internet. La synchronisation s'effectue automatiquement au retour du réseau.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Quels terminaux de paiement électronique (TPE) sont compatibles avec KASPI POS ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "KASPI POS intègre le Hub TPE Universel supportant 7 familles de protocoles mondiaux et nationaux : CMI Direct Maroc, nexo Retailer (ISO 20022), OPI, Ingenico Telium/TETRA, Verifone VIPA, PAX POSLink et relais Cloud Webhook.",
                  },
                },
                {
                  "@type": "Question",
                  name: "KASPI POS est-il conforme à la législation fiscale marocaine et à Bank Al-Maghrib ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Oui, KASPI POS respecte l'article 145 du CGI marocain (numérotation continue sans rupture, mentions légales ICE, IF, RC, CNSS) et opère strictement comme Prestataire de Services Techniques (TSP) non-dépositaire conformément à la loi 103-12 de Bank Al-Maghrib.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-white/25 selection:text-white">
        <KaspiThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <OfflineSyncBootstrap />
            {children}
            <AIChatWidget />
            <UpdateBanner />
          </NextIntlClientProvider>
        </KaspiThemeProvider>
      </body>
    </html>
  );
}
