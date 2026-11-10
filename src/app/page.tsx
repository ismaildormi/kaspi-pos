import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InteractivePosSimulator } from "@/components/landing/InteractivePosSimulator";
import { DataMigrationSimulator } from "@/components/landing/DataMigrationSimulator";
import { WhatsAppReportSimulator } from "@/components/landing/WhatsAppReportSimulator";
import { AiAnalyticsSimulator } from "@/components/landing/AiAnalyticsSimulator";
import { OfflineSyncSimulator } from "@/components/landing/OfflineSyncSimulator";
import { AiScannerSimulator } from "@/components/landing/AiScannerSimulator";
import { EnterpriseChainShowcase } from "@/components/landing/EnterpriseChainShowcase";
import { LocalGpuShowcase } from "@/components/landing/LocalGpuShowcase";
import { DevicePricingCalculator } from "@/components/landing/DevicePricingCalculator";
import { QuantumEnterpriseSections } from "@/components/landing/QuantumEnterpriseSections";
import {
  Download,
  LogIn,
  Zap,
  ShieldCheck,
  Cpu,
  WifiOff,
  Receipt,
  Store,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  Lock,
  ChevronRight,
  Database,
  BarChart3,
  HelpCircle,
  MessageSquare,
  FileSpreadsheet,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans antialiased overflow-x-hidden">
      {/* Floating Glassmorphism Navbar */}
      <Navbar />

      {/* =========================================================================
          HERO SECTION: 2027 AESTHETIC (Global Scale - Born in Morocco, Built for the World)
         ========================================================================= */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-36 border-b border-zinc-900/60">
        {/* Futuristic Subtle Radial Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.12),rgba(0,0,0,0)_70%)] pointer-events-none blur-2xl" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08),rgba(0,0,0,0)_70%)] pointer-events-none blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Global Announcement Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-zinc-300 mb-8 backdrop-blur-md shadow-inner transition hover:border-white/20">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-zinc-400">KASPI POS 2.0</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-200">Née au Maroc, Conçue pour le Monde • Born in Morocco, Built for the World</span>
          </div>

          {/* Transparent Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 opacity-20 blur group-hover:opacity-40 transition duration-500" />
              <img
                src="/logo.png"
                alt="KASPI POS Logo"
                className="relative h-20 w-20 sm:h-24 sm:w-24 object-contain bg-transparent transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Hero Headline */}
          <h1 className="mx-auto max-w-5xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl leading-[1.08] text-balance">
            La caisse tactile ultrarapide.{" "}
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Zéro coupure. Zéro latence.
            </span>
          </h1>

          {/* Hero Subtitle with Global Ambition */}
          <p className="mx-auto mt-6 max-w-3xl text-base sm:text-lg text-zinc-400 leading-relaxed text-pretty">
            Le système POS ultra-rapide qui fonctionne 100% hors-ligne, partout dans le monde.
            Conforme à la réglementation marocaine (DGI Art. 145 &amp; ICE), à la norme française NF525, et prêt pour l&apos;expansion internationale avec support natif multi-devises (MAD, EUR, USD, SAR, AED) et multi-langues.
          </p>

          {/* 2027 Tech CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
            <Link
              href="/download"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-bold text-black transition-all hover:bg-zinc-200 hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.25)] active:scale-95"
            >
              <Download className="h-4 w-4" />
              Télécharger pour Windows (.exe)
            </Link>

            <Link
              href="/login?demo=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-7 py-4 text-sm font-extrabold text-amber-300 backdrop-blur-md transition-all hover:bg-amber-500/25 hover:border-amber-400 active:scale-95 shadow-lg shadow-amber-500/10"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              Essayer la Démo Instantanée • تجربة فورية
            </Link>

            <a
              href="#simulator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-7 py-4 text-sm font-semibold text-zinc-200 backdrop-blur-md transition-all hover:bg-white/[0.1] hover:border-white/25 active:scale-95"
            >
              <Zap className="h-4 w-4 text-amber-400" />
              Tester la Simulation Interactive
            </a>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-6 py-4 text-sm font-medium text-zinc-400 transition hover:text-white hover:border-zinc-700"
            >
              <LogIn className="h-4 w-4" />
              Espace Client
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center items-center gap-6 text-xs text-zinc-500 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 100% Offline (SQLite Local)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Conforme DGI Maroc &amp; NF525
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Multi-Devises &amp; Multi-Langues
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Clôture quotidienne WhatsApp
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: MULTI-STORE POS TERMINAL (Supermarket, Restaurant, Clothing, Grocery)
         ========================================================================= */}
      <section id="simulator" className="py-24 border-b border-zinc-900 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-400 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Simulateur Métier Multi-Commerces &amp; International
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Une caisse modulaire adaptée à chaque métier et à chaque pays
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Supermarché, restaurant avec gestion de plan de salle et tables, boutique de prêt-à-porter avec tailles ou commerce de proximité : testez en direct la vitesse d&apos;encaissement instantanée sous 12ms.
            </p>
          </div>

          <InteractivePosSimulator />
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: WHATSAPP Z-REPORT & MONTHLY REPORTS
         ========================================================================= */}
      <section id="features" className="py-24 border-b border-zinc-900 bg-zinc-950/40 relative">
        <div id="whatsapp" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4">
              <MessageSquare className="h-3.5 w-3.5" />
              Clôtures Quotidiennes Automatisées
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              La tranquillité d&apos;esprit à chaque fin de journée
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Recevez les totaux de vente, le détail espèces/cartes et les alertes d&apos;anomalies directement sur votre smartphone via WhatsApp sans jamais ouvrir de logiciel.
            </p>
          </div>

          <WhatsAppReportSimulator />
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: DEEP AI BUSINESS ANALYTICS
         ========================================================================= */}
      <section id="ai-advisor" className="py-24 border-b border-zinc-900 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-300 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Conseiller Financier &amp; Prédictif IA
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Votre directeur financier personnel disponible 24h/24
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Analysez la rentabilité réelle de votre commerce, surveillez le carnet de crédit et recevez des recommandations d&apos;achat précises basées sur vos ventes réelles.
            </p>
          </div>

          <AiAnalyticsSimulator />
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: DATA MIGRATION SIMULATOR (Caissa, POSNEX, Excel, Sage)
         ========================================================================= */}
      <section id="migration" className="py-24 border-b border-zinc-900 bg-zinc-950/40 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-400 mb-4">
              <Database className="h-3.5 w-3.5" />
              Migration 100% Sécurisée
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Passez à KASPI POS en 2 minutes chrono
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Aucune saisie manuelle. Importez votre fichier Excel ou l&apos;export de votre ancien logiciel de caisse : nos algorithmes se chargent de mapper les familles, les prix et les codes-barres sans perte de crédit client.
            </p>
          </div>

          <DataMigrationSimulator />
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: OFFLINE-FIRST RESILIENCE (Dexie.js + SQLite Sync)
         ========================================================================= */}
      <section id="offline" className="py-24 border-b border-zinc-900 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 mb-4">
              <WifiOff className="h-3.5 w-3.5" />
              Résilience Réseau Totale
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Votre caisse ne s&apos;arrête JAMAIS. Même sans Internet.
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Coupure de réseau, panne 4G/5G ou problème de routeur ? KASPI POS enregistre chaque vente dans sa base locale chiffrée et synchronise automatiquement dès le retour du signal.
            </p>
          </div>

          <OfflineSyncSimulator />
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: GEMINI VISION AI PRODUCT SCANNER
         ========================================================================= */}
      <section id="ai" className="py-24 border-b border-zinc-900 bg-zinc-950/40 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-400 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Numérisation Intelligente de Stock
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Ajoutez 500 produits en 10 minutes grâce à l&apos;IA
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Pointez simplement l&apos;appareil photo sur l&apos;emballage d&apos;un article. Notre modèle Gemini Vision extrait instantanément le nom en arabe/français, le code-barres EAN-13, et suggère la marge optimale.
            </p>
          </div>

          <AiScannerSimulator />
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: LOCAL GPU & WEBGPU ENGINE (Zero Server Cost, 100% Privacy)
         ========================================================================= */}
      <section className="py-24 border-b border-zinc-900 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4">
              <Cpu className="h-3.5 w-3.5" />
              Performance Matérielle Embarquée
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Zéro coût de serveur. Confidentialité absolue.
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              KASPI POS utilise la puissance brute de votre processeur graphique (WebGPU &amp; Rust HAL). Vos chiffres d&apos;affaires restent chez vous.
            </p>
          </div>

          <LocalGpuShowcase />
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: ENTERPRISE MULTI-STORE CHAIN PROOF (Global Franchises)
         ========================================================================= */}
      <section id="enterprise" className="py-24 border-b border-zinc-900 bg-zinc-950/40 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 mb-4">
              <Store className="h-3.5 w-3.5" />
              Échelle Réseau Multi-Points de Vente &amp; Franchises
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              De l&apos;épicerie de quartier aux chaînes internationales de 50+ magasins
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Supervisez Casablanca, Paris, Dubaï et Madrid depuis un seul tableau de bord unifié. Gestion centralisée des stocks, transferts inter-boutiques, consolidation multi-devises et conformité fiscale internationale.
            </p>
          </div>

          <EnterpriseChainShowcase />
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: DEVICE-BASED PRICING MODEL (Multi-Currency Ready)
         ========================================================================= */}
      <section id="pricing" className="py-24 border-b border-zinc-900 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold text-zinc-300 mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Tarification Transparente par Caisse • Multi-Devises
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Payez uniquement pour le matériel que vous utilisez
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              200 MAD / mois (~20 $ / 20 €) pour votre première caisse, puis 150 MAD (~15 $ / 15 €) par caisse supplémentaire (ex: 2 Caisses = 350 DH, 3 Caisses = 500 DH). Pas de frais cachés, aucune commission prélevée sur votre chiffre d&apos;affaires.
            </p>
          </div>

          <DevicePricingCalculator />
        </div>
      </section>

      {/* =========================================================================
          QUANTUM ENTERPRISE CONVERSION SECTIONS (Migration, Hardware, V4.0 Changelog, Security)
         ========================================================================= */}
      <QuantumEnterpriseSections />

      {/* =========================================================================
          FAQ SECTION
         ========================================================================= */}
      <section className="py-24 border-b border-zinc-900 bg-zinc-950/40 relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-medium text-zinc-400 mb-4">
              <HelpCircle className="h-3.5 w-3.5" />
              Questions Fréquentes
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Tout ce que vous devez savoir avant de commencer
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
              <h4 className="text-base font-bold text-white mb-2">
                Le logiciel fonctionne-t-il si Internet est coupé toute la journée ?
              </h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Oui, à 100%. L&apos;application Windows utilise un moteur SQLite local ultra-performant. Toutes vos ventes, ouvertures de tiroir-caisse, impressions de tickets et calculs de monnaie se font instantanément sans connexion Internet. Dès la reconnexion, la synchronisation s&apos;effectue silencieusement en arrière-plan.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
              <h4 className="text-base font-bold text-white mb-2">
                Est-ce conforme aux réglementations fiscales (DGI Maroc, NF525 France) ?
              </h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Absolument. KASPI POS applique une numérotation continue sans trou (gap-less sequential numbering) protégée au niveau de la base de données. Chaque facture ou ticket mentionne les identifiants légaux (ICE, IF, RC, TVA) et inclut un QR code de vérification conforme aux directives fiscales en vigueur au Maroc et à l&apos;international.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
              <h4 className="text-base font-bold text-white mb-2">
                Quelles imprimantes thermiques sont compatibles ?
              </h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Toutes les imprimantes ESC/POS du marché (Epson, Xprinter, Rongta, Bixolon, etc.) en format 80mm et 58mm, connectées en USB, Réseau Ethernet (LAN) ou Bluetooth. Grâce à notre moteur Rust natif HarfBuzz, les textes en langue arabe et en caractères latins sont mis en forme correctement avec découpe automatique et ouverture tiroir.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
              <h4 className="text-base font-bold text-white mb-2">
                Le système gère-t-il plusieurs devises et langues ?
              </h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Oui. KASPI POS prend en charge le dirham marocain (MAD), l&apos;euro (EUR), le dollar (USD), le riyal saoudien (SAR) et le dirham émirati (AED). L&apos;interface bascule instantanément entre Français, Arabe et Anglais selon les préférences du caissier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL HIGH-CONVERSION CTA BANNER
         ========================================================================= */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 via-black to-black pointer-events-none" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-10 sm:p-16 backdrop-blur-2xl shadow-2xl relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Équipez votre commerce avec la caisse du futur dès aujourd&apos;hui.
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed">
              Téléchargez l&apos;application Windows gratuitement, configurez votre première boutique en 2 minutes et commencez à encaisser immédiatement.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/download"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-bold text-black transition-all hover:bg-zinc-200 hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.25)]"
              >
                <Download className="h-4 w-4" />
                Télécharger KASPI POS (.exe)
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.1] hover:border-white/20"
              >
                <LogIn className="h-4 w-4" />
                Créer un compte marchand
              </Link>
            </div>

            <p className="mt-6 text-xs text-zinc-500 font-mono">
              Windows 10 / 11 compatible • Mises à jour automatiques incluses
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
