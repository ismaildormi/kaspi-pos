import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Download,
  LogIn,
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
  Smartphone,
  Printer,
  Barcode,
  Layers,
  HelpCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white selection:text-black font-sans">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 border-b border-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs font-medium text-zinc-300 mb-8 backdrop-blur">
            <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
            <span>KASPI POS 2.0 • Première Solution Caisse &amp; ERP Dédiée au Maroc</span>
          </div>

          {/* Hero Branding with Transparent Logo (No black background box) */}
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="KASPI POS Official Logo"
              className="h-24 w-24 object-contain bg-transparent transition-transform hover:scale-105 duration-300"
            />
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            La caisse intelligente pour les commerces exigeants.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
            Ultra-rapide, 100% fonctionnelle hors-ligne, conforme à la réglementation fiscale marocaine (DGI &amp; ICE),
            propulsée par l’IA et connectée à WhatsApp pour vos clôtures quotidiennes.
          </p>

          {/* Action CTAs (Showcase Only: Direct Download & Login) */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/download"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 shadow-xl"
            >
              <Download className="h-4 w-4" />
              Télécharger pour Windows (.exe)
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-7 py-4 text-sm font-semibold text-white transition hover:bg-zinc-800 hover:border-zinc-700"
            >
              <LogIn className="h-4 w-4" />
              Espace Client / Connexion
            </Link>
          </div>

          {/* Subtext info */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-zinc-500 font-mono">
            <span>✓ Aucun abonnement forcé</span>
            <span>✓ Synchronisation Dexie.js locale</span>
            <span>✓ 100% Conforme DGI &amp; ICE</span>
            <span>✓ Impression thermique Arabe ESC/POS</span>
          </div>

          {/* 3D Hero Mockup Showcase */}
          <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-2 sm:p-4 shadow-2xl backdrop-blur-sm group">
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
              <img
                src="/hero-mockup.png"
                alt="KASPI POS 3D Interface Showcase"
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
              />
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-1.5 text-[11px] font-mono text-zinc-400 backdrop-blur shadow-lg">
              Interface Caisse Tactile Plein Écran • Réactivité &lt;20ms
            </div>
          </div>
        </div>
      </section>

      {/* HOW KASPI POS WORKS */}
      <section id="how-it-works" className="py-24 border-b border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Prise en main express
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Comment fonctionne KASPI POS ?
            </h3>
            <p className="mt-4 text-sm text-zinc-400">
              Une technologie hybride pensée pour éliminer tout point de rupture dans votre point de vente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 flex flex-col justify-between hover:border-zinc-700 transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white text-zinc-950 font-extrabold flex items-center justify-center text-lg mb-6 shadow-md">
                  01
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Installation instantanée</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Téléchargez l'application Windows (.exe) ou lancez la Web App. Vos catalogues de produits, prix et taxes se chargent en local dans SQLite et Dexie.js en quelques secondes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500 font-mono">
                Pas de configuration complexe de base de données.
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 flex flex-col justify-between hover:border-zinc-700 transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white text-zinc-950 font-extrabold flex items-center justify-center text-lg mb-6 shadow-md">
                  02
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Encaissez même sans Internet</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Coupure de réseau ? Aucun problème. Scannez vos codes-barres, appliquez vos remises, ouvrez le tiroir-caisse et imprimez vos tickets thermiques avec mise en forme arabe native.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500 font-mono">
                Zéro blocage caisse pendant les heures de pointe.
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 flex flex-col justify-between hover:border-zinc-700 transition">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white text-zinc-950 font-extrabold flex items-center justify-center text-lg mb-6 shadow-md">
                  03
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Synchronisation &amp; WhatsApp</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Dès la reconnexion, vos ventes sont réconciliées en arrière-plan sans doublon grâce aux clés d'idempotence. Le soir, recevez votre bilan Z-Report complet sur WhatsApp.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500 font-mono">
                Tranquillité d'esprit pour le propriétaire du commerce.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D VISUAL DEEP-DIVES */}
      <section id="offline" className="py-24 border-b border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24">
          
          {/* Deep Dive 1: Offline Engine */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono text-zinc-300 mb-6">
                <WifiOff className="h-3.5 w-3.5 text-white" />
                <span>Architecture 100% Offline-First</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Votre caisse ne s'arrête jamais, même en coupure totale d'Internet.
              </h3>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6">
                KASPI POS utilise un moteur de données décentralisé combinant SQLite local et Dexie.js (IndexedDB). Chaque transaction est signée, horodatée et stockée localement avant d'être transmise au cloud Neon PostgreSQL dès que la connexion est rétablie.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Enregistrement des ventes instantané (&lt;10 millisecondes)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Protection absolue contre les pertes de données ou doublons</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Synchronisation bidirectionnelle automatique des stocks et prix</span>
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-2xl">
              <img
                src="/offline-feature.png"
                alt="KASPI POS Offline-First Architecture"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
          </div>

          {/* Deep Dive 2: AI Advisor */}
          <div id="ai" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-2xl">
              <img
                src="/ai-feature.png"
                alt="KASPI AI Retail Advisor &amp; OCR"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono text-zinc-300 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span>Conseiller Commercial IA &amp; Vision OCR</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Un expert retail dans votre poche, connecté à vos chiffres réels.
              </h3>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6">
                KASPI AI est strictement conditionné pour analyser vos données de vente réelles sans aucune hallucination. Posez vos questions en Darija ou en Français : prévisions de réapprovisionnement, marges par rayon, et scannez vos factures fournisseurs par photo grâce à l'OCR intelligent.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Compréhension naturelle de la Darija marocaine et du Français</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Extraction automatique des articles et prix d'achat depuis les factures papier</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Calcul automatique de rentabilité et identification des articles dormants</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Deep Dive 3: Hardware & Arabic Printing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono text-zinc-300 mb-6">
                <Printer className="h-3.5 w-3.5 text-white" />
                <span>Matériel &amp; Impression Arabe ESC/POS</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Impression thermique bilingue arabe parfaite, sans pilotes complexes.
              </h3>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6">
                Fini les lettres arabes isolées ou imprimées de gauche à droite. Le moteur natif en Rust intègre HarfBuzz et FriBidi pour façonner le texte arabe et convertir les reçus en bitmaps 1-bit transmis directement aux imprimantes thermiques 58mm et 80mm via USB, Réseau ou Bluetooth.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Support natif des imprimantes Xprinter, Epson, Bixolon et génériques</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Ouverture automatique du tiroir-caisse (impulsion RJ11)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Lecture ultra-rapide des douchettes et scanners code-barres 1D/2D</span>
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-2xl">
              <img
                src="/hardware.png"
                alt="KASPI POS Hardware Compatibility"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
          </div>

          {/* Deep Dive 4: WhatsApp Daily Clôture */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-2xl">
              <img
                src="/whatsapp-feature.png"
                alt="KASPI POS WhatsApp Daily Z-Report"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono text-zinc-300 mb-6">
                <MessageSquare className="h-3.5 w-3.5 text-white" />
                <span>Z-Report WhatsApp Automatique</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                La clôture de caisse envoyée chaque soir sur votre WhatsApp.
              </h3>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6">
                Plus besoin d'attendre au magasin ou d'appeler le caissier. À la fermeture, un rapport complet et structuré est envoyé sur votre numéro WhatsApp personnel : chiffre d'affaires, répartition espèces/carte/crédit, total des remises et alertes d'anomalies.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Passerelle d'entreprise dédiée (UltraMsg &amp; Meta Cloud API)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Alerte instantanée en cas de remise suspecte ou d'écart de caisse</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                  <span>Historique des clôtures accessible en 1 clic pour votre comptable</span>
                </li>
              </ul>
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: DGI & ICE */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <Receipt className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Conformité DGI &amp; ICE</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Numérotation séquentielle stricte sans saut garantie par verrouillage PostgreSQL. Mentions légales obligatoires (ICE, IF, RC, Patente) imprimées automatiquement sur les factures et tickets.
              </p>
            </div>

            {/* Feature 2: Carnet Krediat */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Carnet Krediat (Crédits Clients)</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Remplacez le carnet papier par un suivi digital rigoureux. Plafonds de crédit par client, historique des remboursements partiels et rappels WhatsApp personnalisés.
              </p>
            </div>

            {/* Feature 3: Scan ultra-rapide */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <Barcode className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Scan Code-Barres &lt;20ms</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Recherche instantanée en mémoire locale (IndexedDB). Scannez des dizaines d'articles à la minute sans latence réseau ni chargement de page.
              </p>
            </div>

            {/* Feature 4: Multi-Boutiques */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Multi-Boutiques &amp; Dépôts</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Gérez plusieurs points de vente depuis un tableau de bord unique. Suivi des transferts de stock entre boutiques et isolation stricte des données par magasin (RLS).
              </p>
            </div>

            {/* Feature 5: Droits Caissiers */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Sessions &amp; Sécurité Caissiers</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Gestion des quarts de travail, vérification du fond de caisse au démarrage et à la clôture, avec journal d'audit complet de chaque modification ou annulation.
              </p>
            </div>

            {/* Feature 6: Auto-Updater */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Mises à Jour Transparentes</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Tauri Auto-Updater intégré. L'application télécharge les améliorations en arrière-plan sans interrompre vos encaissements et s'actualise en un clic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US (COMPARISON TABLE) */}
      <section id="why-us" className="py-24 border-b border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Comparatif
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Pourquoi choisir KASPI POS plutôt qu'un système traditionnel ?
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Old Systems */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-left">
              <h4 className="text-xl font-bold text-zinc-400 mb-4 flex items-center gap-2">
                <span className="text-red-400 font-mono">✕</span> Caisses traditionnelles obsolètes
              </h4>
              <ul className="space-y-4 text-xs sm:text-sm text-zinc-500">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 shrink-0 font-bold">✕</span>
                  <span>Coût initial exorbitant (10 000 à 25 000 DH de licence par poste).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 shrink-0 font-bold">✕</span>
                  <span>Matériel propriétaire verrouillé, impossible à remplacer facilement.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 shrink-0 font-bold">✕</span>
                  <span>Plantage dès que la connexion Internet ou le réseau local vacille.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 shrink-0 font-bold">✕</span>
                  <span>Aucun accès à distance pour le gérant depuis son smartphone.</span>
                </li>
              </ul>
            </div>

            {/* KASPI POS */}
            <div className="rounded-2xl border-2 border-white bg-zinc-900 p-8 text-left shadow-2xl relative">
              <div className="absolute -top-3 right-6 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-black uppercase tracking-wider">
                Solution d'Avenir
              </div>
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-white" /> KASPI POS 2.0 Enterprise
              </h4>
              <ul className="space-y-4 text-xs sm:text-sm text-zinc-200">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                  <span>Démarrage immédiat sans frais cachés (Formule transparente à 100 MAD/mois).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                  <span>Fonctionne sur n'importe quel PC Windows, tablette ou smartphone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                  <span>Résilience totale : continue d'encaisser à 100% même sans WiFi ni 4G.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white shrink-0 mt-0.5" />
                  <span>Clôture Z-Report quotidienne envoyée directement sur votre WhatsApp.</span>
                </li>
              </ul>
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
            Paiement simplifié par carte bancaire marocaine (YouCan Pay) ou internationale (Paddle).
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
                <CheckCircle2 className="h-4 w-4 text-white" /> Caisse POS illimitée &amp; impressions tickets
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Mode hors-ligne complet (Sync Dexie.js)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Conseiller IA &amp; Vision OCR factures
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Clôtures journalières Z-Report par WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Gestion de crédits clients (Carnet Krediat)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" /> Application Bureau Windows &amp; Mac (Tauri)
              </li>
            </ul>

            <div className="space-y-3">
              <Link
                href="/download"
                className="block w-full text-center rounded-xl bg-white py-3 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
              >
                Télécharger l'Application (.exe)
              </Link>
              <Link
                href="/login"
                className="block w-full text-center rounded-xl border border-zinc-700 bg-zinc-950 py-3 text-xs font-semibold text-zinc-300 transition hover:text-white hover:border-zinc-500"
              >
                Accéder à mon Espace Client
              </Link>
            </div>
            <p className="text-center text-[10px] text-zinc-500 mt-3">
              Annulable à tout moment. Support technique marocain 7j/7.
            </p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="py-20 bg-zinc-900 border-b border-zinc-800 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
            Prêt à transformer l'encaissement de votre commerce ?
          </h3>
          <p className="text-sm text-zinc-400 mb-8 max-w-xl mx-auto">
            Rejoignez des centaines de commerçants marocains qui ont choisi la rapidité, la sérénité hors-ligne et la puissance de l'IA.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/download"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition shadow-lg"
            >
              <Download className="h-4 w-4" />
              Télécharger KASPI POS (.exe)
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-8 py-3.5 text-xs font-semibold text-white hover:border-zinc-500 transition"
            >
              <LogIn className="h-4 w-4" />
              Se Connecter
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
