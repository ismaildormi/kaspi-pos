"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  Printer,
  Barcode,
  Scale,
  CreditCard,
  Wifi,
  ShieldCheck,
  Lock,
  Database,
  Sparkles,
  GitCommit,
  ArrowRight,
  ExternalLink,
  Laptop,
} from "lucide-react";

export function QuantumEnterpriseSections() {
  const [migrationFormat, setMigrationFormat] = useState<"standard" | "loyverse" | "square" | "sage">("standard");
  const [isSimulatingImport, setIsSimulatingImport] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const sampleProducts = [
    { name: "Huile d'Olive Vierge 1L", barcode: "6111002340012", category: "Épicerie", cost: "52.00 DH", price: "68.00 DH", stock: "48 unités" },
    { name: "Thé Vert Gunpowder 200g", barcode: "6111004560098", category: "Boissons", cost: "14.50 DH", price: "19.00 DH", stock: "120 unités" },
    { name: "Fromage Rouge Tranché 250g", barcode: "6111007890123", category: "Frais & Laitier", cost: "24.00 DH", price: "32.00 DH", stock: "35 unités" },
    { name: "Couscous Fin Dari 1Kg", barcode: "6111009012345", category: "Féculents", cost: "11.20 DH", price: "15.00 DH", stock: "85 unités" },
  ];

  const handleSimulate = () => {
    setIsSimulatingImport(true);
    setImportDone(false);
    setTimeout(() => {
      setIsSimulatingImport(false);
      setImportDone(true);
    }, 600);
  };

  return (
    <div className="space-y-24 py-16">
      {/* =========================================================================
          1. INTERACTIVE CSV / EXCEL MIGRATION PREVIEW WIDGET
         ========================================================================= */}
      <section id="migration-preview" className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold text-zinc-300 mb-4">
              <FileSpreadsheet className="h-3.5 w-3.5 text-white" />
              Migration Instantanée Sans Saisie Manuelle
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Importez tout votre catalogue depuis Excel ou votre ancien logiciel
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Mappage automatique des colonnes, codes-barres EAN-13, prix d&apos;achat et stocks. Compatible Loyverse, Square, Sage, Caisse classique et fichiers Excel/CSV.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            {/* Format Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-4">
              {[
                { id: "standard", label: "Format Standard KASPI (Excel/CSV)" },
                { id: "loyverse", label: "Export Loyverse POS" },
                { id: "square", label: "Export Square POS" },
                { id: "sage", label: "Export Sage / Ciel Compta" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setMigrationFormat(tab.id as any);
                    setImportDone(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    migrationFormat === tab.id
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Live Mapped Table Preview */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Aperçu de la structure détectée (4 colonnes normalisées)</span>
                <span className="text-white font-bold">1 240 articles prêts</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs font-mono">
                  <thead className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3 text-start">Désignation</th>
                      <th className="p-3 text-start">Code-Barres</th>
                      <th className="p-3 text-start">Rayon</th>
                      <th className="p-3 text-end">Prix Achat</th>
                      <th className="p-3 text-end">Prix Vente</th>
                      <th className="p-3 text-end">Stock Initial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-medium">
                    {sampleProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/40">
                        <td className="p-3 text-white font-sans font-bold">{p.name}</td>
                        <td className="p-3 text-zinc-400">{p.barcode}</td>
                        <td className="p-3 text-zinc-300 font-sans">{p.category}</td>
                        <td className="p-3 text-end text-zinc-400">{p.cost}</td>
                        <td className="p-3 text-end text-white font-bold">{p.price}</td>
                        <td className="p-3 text-end text-zinc-300">{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-zinc-400 font-mono">
                {importDone ? (
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    1 240 articles importés avec succès en 0.23 seconde !
                  </span>
                ) : (
                  <span>Déduplication automatique par code-barres &amp; préservation des historiques</span>
                )}
              </div>

              <button
                onClick={handleSimulate}
                disabled={isSimulatingImport}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSimulatingImport ? "Importation en cours..." : "Simuler l'Importation Instantanée"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. 100% VERIFIED HARDWARE COMPATIBILITY MATRIX
         ========================================================================= */}
      <section id="hardware-matrix" className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold text-zinc-300 mb-4">
              <Laptop className="h-3.5 w-3.5 text-white" />
              Matériel &amp; Périphériques 100% Certifiés
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Branchez votre matériel existant. Ça fonctionne immédiatement.
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base leading-relaxed">
              KASPI POS est certifié compatible avec l&apos;ensemble des périphériques de caisse du marché marocain et international sans pilote complexe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Printers */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Imprimantes Thermiques ESC/POS</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Epson TM-T20III / TM-T88VI, Xprinter (XP-N160M, XP-Q200), Rongta, Bixolon, POS-58/80. Formats 80mm et 58mm en USB, Ethernet LAN et Bluetooth. Rendu bilingue arabe/français natif.
              </p>
              <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Découpe automatique &amp; ouverture tiroir RJ11
              </div>
            </div>

            {/* Scanners */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                <Barcode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Scanners Code-Barres &amp; QR</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Zebra Symbol DS2208, Honeywell Voyager, Datalogic QuickScan, Netum 1D/2D sans fil. Fonctionne instantanément en mode émulation clavier USB HID sans configuration.
              </p>
              <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Lecture instantanée sous 12ms (EAN-13, QR, Code-128)
              </div>
            </div>

            {/* Scales */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Balances Électroniques Poids-Prix</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Balances avec étiquetage code-barres (Dibal, Avery Berkel, Digi, Mettler Toledo). Décodage automatique des préfixes 20, 21, 28, 29 avec extraction du poids en grammes et du montant.
              </p>
              <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Connexion directe RS232 / USB ou scan d&apos;étiquette
              </div>
            </div>

            {/* Cash Drawers */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Tiroirs-Caisses RJ11 &amp; Monnayeurs</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tiroirs métalliques standards 4 à 8 compartiments avec connexion RJ11 12V/24V à l&apos;imprimante. Déclenchement automatique d&apos;ouverture à chaque encaissement espèces ou F10.
              </p>
              <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Impulsion électrique sécurisée &amp; clé manuelle
              </div>
            </div>

            {/* Network & 4G/5G */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                <Wifi className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Routeurs 4G / 5G &amp; Réseau Local</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Routeurs Huawei, TP-Link, D-Link, cartes SIM Maroc Telecom, Orange, Inwi. Le système gère automatiquement les micro-coupures et synchronise le cloud en tâche de fond sans ralentissement.
              </p>
              <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Zéro blocage caisse en cas de perte de connexion
              </div>
            </div>

            {/* TPE & Payments */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Terminaux TPE Bancaires CMI</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Terminaux Ingenico, PAX et Verifone agréés CMI Maroc (Centre Monétique Interbancaire). Prise en charge des cartes Visa, Mastercard, CMI sans contact et décomposition automatique des commissions.
              </p>
              <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Calcul transparent de la quote-part commerçant
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. LIVE RELEASE NOTES & CHANGELOG (V4.0 QUANTUM)
         ========================================================================= */}
      <section id="changelog" className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold text-zinc-300 mb-4">
              <GitCommit className="h-3.5 w-3.5 text-white" />
              Journal des Mises à Jour &amp; Évolutions
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Version 4.0 Quantum Edition
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Découvrez les dernières avancées architecturales déployées pour nos commerçants partenaires.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {/* Version 4.0 Entry */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span className="font-bold text-white text-base">KASPI POS v4.0 Quantum</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-zinc-300 border border-white/15">
                    Production Live
                  </span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">Novembre 2026</span>
              </div>

              <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-white font-bold shrink-0">•</span>
                  <p>
                    <strong className="text-white">Compression d&apos;Images WebP &amp; Déduplication SHA-256 CAS :</strong> Réduction de 90% du stockage d&apos;images sur le client avant téléversement. Zéro coût de stockage cloud redondant pour les produits PGC identiques.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-white font-bold shrink-0">•</span>
                  <p>
                    <strong className="text-white">Export Comptable Sage conforme Article 145 CGI :</strong> Génération en un clic d&apos;un journal des ventes conforme aux normes fiscales marocaines avec séparateurs DGI et gestion de la TVA (7%, 10%, 14%, 20%).
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-white font-bold shrink-0">•</span>
                  <p>
                    <strong className="text-white">Échéancier Fournisseurs &amp; Scanner OCR :</strong> Suivi des chèques et effets (Kembyala) dus sous 7 jours et numérisation intelligente des factures d&apos;achat grossistes avec mise à jour du stock en un clic.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-white font-bold shrink-0">•</span>
                  <p>
                    <strong className="text-white">Synchronisation E-Commerce en Direct :</strong> Passerelle bidirectionnelle avec YouCan et Shopify pour décrémenter automatiquement les stocks physiques lors d&apos;une vente en ligne.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. ENTERPRISE SECURITY & LEGAL COMPLIANCE BADGES
         ========================================================================= */}
      <section id="security-compliance" className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold text-zinc-300 mb-4">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
              Conformité Fiscale &amp; Sécurité Entreprise
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Une architecture conforme aux plus hautes exigences légales
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Vos données commerciales, financières et clients sont protégées et conformes aux réglementations nationales et internationales.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-zinc-950 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Article 145 CGI Maroc</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Numérotation séquentielle continue sans rupture, mention légale de l&apos;ICE et de l&apos;IF, et registres de ventes inaltérables.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-zinc-950 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white mb-3">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Protection Données CNDP</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Conformité stricte avec la Loi 09-08 relative à la protection des personnes physiques à l&apos;égard du traitement des données à caractère personnel.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-zinc-950 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white mb-3">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Empreintes SHA-256 CAS</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Chaque transaction et clôture financière Z est scellée par une empreinte cryptographique SHA-256 garantissant la non-répudiation.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-zinc-950 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Zéro-Downtime Local</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Disponibilité opérationnelle de 99.99% grâce au moteur local SQLite et Dexie.js qui continue à encaisser même en cas de panne cloud.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
