"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Settings,
  Store,
  Receipt,
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  Send,
} from "lucide-react";

export default function SettingsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [ice, setIce] = useState("");
  const [taxId, setTaxId] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [whatsappReportNumber, setWhatsappReportNumber] = useState("");
  const [isWhatsappReportsActive, setIsWhatsappReportsActive] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings");
      if (res.ok) {
        const data = await res.json();
        const s = data.settings;
        if (s) {
          setShopName(s.shopName || "");
          setAddress(s.address || "");
          setIce(s.ice || "");
          setTaxId(s.taxId || "");
          setRcNumber(s.rcNumber || "");
          setPhone(s.phone || "");
          setReceiptHeader(s.receiptHeader || "");
          setReceiptFooter(s.receiptFooter || "");
          setWhatsappReportNumber(s.whatsappReportNumber || "");
          setIsWhatsappReportsActive(s.isWhatsappReportsActive ?? true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/v1/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          address,
          ice,
          taxId,
          rcNumber,
          phone,
          receiptHeader,
          receiptFooter,
          whatsappReportNumber,
          isWhatsappReportsActive,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWhatsAppReport = async () => {
    if (!whatsappReportNumber) return;
    setTestResult("Envoi du rapport de test...");

    try {
      const res = await fetch(
        `/api/reports/daily-whatsapp?phone=${encodeURIComponent(whatsappReportNumber)}&autoSend=true`
      );
      const data = await res.json();
      if (data.success) {
        setTestResult("✅ Rapport Z test envoyé avec succès via la passerelle WhatsApp !");
      } else {
        setTestResult(`❌ Erreur: ${data.error || "Échec d'envoi"}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Erreur réseau: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20 select-none">
      {/* Top Bar */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/pos`}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              {isRtl ? (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة لنقطة البيع (POS)</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour au POS</span>
                </>
              )}
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold shadow-xs">
                <Settings className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-white">
                {isRtl ? "إعدادات المتجر والتواصل" : "Paramètres du Commerce"}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-xs flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Paramètres enregistrés avec succès.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Shop & Legal Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Store className="w-5 h-5 text-white" />
              <h2 className="text-base font-bold text-white">Identité Commerciale & Fiscale (Maroc)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Nom commercial du magasin *
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Superette Anfa"
                  className="w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Numéro ICE (15 chiffres)
                </label>
                <input
                  type="text"
                  value={ice}
                  onChange={(e) => setIce(e.target.value)}
                  placeholder="001234567000045"
                  className="w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Identifiant Fiscal (IF)
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="12345678"
                  className="w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Registre de Commerce (RC)
                </label>
                <input
                  type="text"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  placeholder="98765 Casablanca"
                  className="w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Adresse physique du point de vente
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Boulevard d'Anfa, Casablanca"
                  className="w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Receipt Customization */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Receipt className="w-5 h-5 text-white" />
              <h2 className="text-base font-bold text-white">Personnalisation du Ticket Thermique</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  En-tête du ticket (Message de bienvenue)
                </label>
                <input
                  type="text"
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  placeholder="Bienvenue chez Kasbi Market !"
                  className="w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Pied de page (Message de remerciement ou mentions légales)
                </label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Les articles vendus ne sont ni repris ni échangés après 48h. Merci !"
                  className="w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Automated WhatsApp Reports Configuration */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <MessageSquare className="w-5 h-5 text-white" />
              <h2 className="text-base font-bold text-white">Rapports Journaliers WhatsApp (Z-Report)</h2>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Recevez chaque soir automatiquement sur votre WhatsApp un récapitulatif clair de votre chiffre d&apos;affaires, répartition des paiements (Cash/Carte/Crédit), top des ventes et alertes rupture de stock.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Numéro WhatsApp du Propriétaire / Gérant (ex: +212661234567 ou 0661234567)
                </label>
                <input
                  type="tel"
                  value={whatsappReportNumber}
                  onChange={(e) => setWhatsappReportNumber(e.target.value)}
                  placeholder="+2126XXXXXXXX"
                  className="w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activeWhatsapp"
                  checked={isWhatsappReportsActive}
                  onChange={(e) => setIsWhatsappReportsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-white focus:ring-0"
                />
                <label htmlFor="activeWhatsapp" className="text-xs text-zinc-300 font-medium cursor-pointer">
                  Activer l&apos;envoi automatique des rapports Z en fin de journée
                </label>
              </div>

              {whatsappReportNumber && (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestWhatsAppReport}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Tester l&apos;envoi WhatsApp maintenant</span>
                  </button>
                  {testResult && <span className="text-xs text-zinc-300 font-mono">{testResult}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les paramètres</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
