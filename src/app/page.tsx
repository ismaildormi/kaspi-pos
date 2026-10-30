import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Download,
  ShoppingBag,
  Zap,
  WifiOff,
  Cpu,
  Receipt,
  MessageSquare,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white selection:text-black">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36 border-b border-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs font-medium text-zinc-300 mb-8 backdrop-blur">
            <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
            <span>KASPI POS 2.0 • Première Solution Caisse & ERP Dédiée au Maroc</span>
          </div>

          {/* Hero Branding with Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900/80 p-2 shadow-2xl shadow-black/80 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Kasbi POS Official Logo"
                width={64}
                height={64}
                style={{ width: 64, height: 64, objectFit: "contain" }}
                className="h-16 w-16 object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            La caisse intelligente pour les commerces exigeants.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
            Ultra-rapide, 100% fonctionnelle hors-ligne, conforme à la réglementation fiscale marocaine,
            propulsée par l’IA et connectée à WhatsApp pour vos clôtures quotidiennes.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/fr/download"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 shadow-xl"
            >
              <Download className="h-4 w-4" />
              Télécharger pour Windows (.exe)
            </Link>

            <Link
              href="/pos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-7 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800 hover:border-zinc-700"
            >
              <ShoppingBag className="h-4 w-4" />
              Ouvrir la Caisse Web (POS)
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-7 py-4 text-sm font-medium text-zinc-400 transition hover:text-white hover:border-zinc-700"
            >
              Tableau de Bord
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Subtext info */}
          <div className="mt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-zinc-500 font-mono">
            <span>✓ Aucun abonnement forcé</span>
            <span>✓ Synchronisation Dexie.js</span>
            <span>✓ 100% Conforme DGI & ICE</span>
            <span>✓ Prise en charge thermique 80mm & 58mm</span>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-24 border-b border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Super-pouvoirs métier
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Pensé pour le terrain. Conçu pour durer.
            </h3>
            <p className="mt-4 text-sm text-zinc-400">
              Chaque fonctionnalité a été taillée pour répondre aux réalités quotidiennes des commerçants au Maroc :
              coupures internet, crédit carnet (Krediat), TVA multi-taux et contrôle des stocks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: POS Engine */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Encaissement Éclair (&lt;20ms)</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Recherche instantanée et lecteur code-barres USB/Bluetooth. Clavier virtuel, tickets personnalisés et gestion multi-modes de paiement (Cash, Carte, Crédit).
              </p>
            </div>

            {/* Feature 2: Offline First */}
            <div id="offline" className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <WifiOff className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Mode Hors-Ligne Absolu</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Internet coupé ? La caisse continue d'enregistrer les ventes dans IndexedDB (Dexie.js). Dès le rétablissement du réseau, la file d'attente se synchronise silencieusement.
              </p>
            </div>

            {/* Feature 3: AI Assistant */}
            <div id="ai" className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <Cpu className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Assistant IA Multi-Fournisseur</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                OpenRouter, Google Gemini, Groq et BYOK (Bring Your Own Key). OCR intelligent pour scanner vos factures fournisseurs papier et on-boarding de produits par photo.
              </p>
            </div>

            {/* Feature 4: Moroccan Fiscal */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <Receipt className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Fiscalité & Conformité Maroc</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Gestion native de la TVA marocaine (20%, 14%, 10%, 7%, exonéré). Mentions obligatoires sur les tickets : ICE, Identifiant Fiscal (IF), RC, Patente et arrondi légal.
              </p>
            </div>

            {/* Feature 5: WhatsApp Z-Reports */}
            <div id="whatsapp" className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Z-Report WhatsApp Automatique</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Recevez le résumé de votre journée sur votre WhatsApp personnel à la clôture de caisse via une passerelle d'entreprise dédiée (UltraMsg/Meta) sans risque de ban.
              </p>
            </div>

            {/* Feature 6: Multi-Store ERP */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">ERP & Multi-Boutiques</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Supervisez plusieurs points de vente depuis un tableau de bord unique. Suivi des crédits clients (Carnet Krediat), alertes de stock bas et transferts inter-dépôts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 border-b border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Tarification Transparente
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Un plan tout-en-un, sans frais cachés
          </h3>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-16">
            Paiement simplifié au choix par carte marocaine (YouCan Pay) ou internationale (Paddle, TVA gérée à 100%).
          </p>

          <div className="max-w-md mx-auto rounded-3xl border border-zinc-700 bg-zinc-900/80 p-8 text-left shadow-2xl relative">
            <div className="absolute -top-3 right-6 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-black uppercase tracking-wider">
              Populaire
            </div>

            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h4 className="text-xl font-bold text-white">Formule Pro Commerçant</h4>
                <p className="text-xs text-zinc-400 mt-1">Tout inclus, mises à jour illimitées</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-white">100 MAD</span>
                <span className="text-xs text-zinc-400"> / mois</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 my-6" />

            <ul className="space-y-3 text-xs text-zinc-300 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Caisse POS illimitée & impressions tickets
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Mode hors-ligne complet (Sync Dexie.js)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Assistant IA Multi-Modèle & Vision OCR factures
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Clôtures journalières Z-Report par WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Gestion de crédits clients (Krediat) & fournisseurs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Application Bureau Windows & Mac (Tauri)
              </li>
            </ul>

            <Link
              href="/dashboard/billing"
              className="block w-full text-center rounded-xl bg-white py-3 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
            >
              Démarrer l'Essai Gratuit
            </Link>
            <p className="text-center text-[10px] text-zinc-500 mt-3">
              Annulable à tout moment. Support technique marocain 7j/7.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
