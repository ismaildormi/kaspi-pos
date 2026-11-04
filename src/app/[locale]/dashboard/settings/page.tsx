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
  Plus,
  Cpu,
  Monitor,
  Printer,
  Sparkles,
  Check,
  Building2,
  CreditCard,
} from "lucide-react";

interface StoreItem {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  devicesCount: number;
  salesCount: number;
}

export default function SettingsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Settings State
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

  // Multi-Store Network State (Phase 1)
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreCode, setNewStoreCode] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [storeCreateError, setStoreCreateError] = useState<string | null>(null);

  // Local GPU / WebGPU AI Preference (Phase 2)
  const [useLocalGpuAi, setUseLocalGpuAi] = useState(true);
  const [receiptPaperDark, setReceiptPaperDark] = useState(false);

  // Payment Gateway Configuration (Phase 2)
  const [selectedGateway, setSelectedGateway] = useState<"cmi_tpe" | "youcanpay" | "stripe" | "cash_only">("cmi_tpe");
  const [tpeTerminalIp, setTpeTerminalIp] = useState("192.168.1.150");
  const [youcanpayKey, setYoucanpayKey] = useState("");
  const [stripeKey, setStripeKey] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchStores();
    const storedGpu = localStorage.getItem("kaspi_use_local_gpu");
    if (storedGpu !== null) {
      setUseLocalGpuAi(storedGpu === "true");
    }
    const storedGw = localStorage.getItem("kaspi_payment_gateway") as any;
    if (storedGw) setSelectedGateway(storedGw);
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

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/v1/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreCode.trim()) return;

    setIsCreatingStore(true);
    setStoreCreateError(null);

    try {
      const res = await fetch("/api/v1/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStoreName.trim(),
          code: newStoreCode.trim().toUpperCase(),
          address: newStoreAddress.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de créer la succursale");
      }

      setNewStoreName("");
      setNewStoreCode("");
      setNewStoreAddress("");
      setIsAddingStore(false);
      await fetchStores();
    } catch (err: any) {
      setStoreCreateError(err.message || "Erreur de création du magasin");
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
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
    setTestResult("Envoi du Z-Report en cours...");
    try {
      const res = await fetch(
        `/api/reports/daily-whatsapp?autoSend=true&phone=${encodeURIComponent(
          whatsappReportNumber
        )}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult("Rapport WhatsApp envoyé avec succès !");
      } else {
        setTestResult(data.error || "Erreur d'envoi WhatsApp");
      }
    } catch (err) {
      setTestResult("Erreur de connexion avec l'API WhatsApp");
    }
  };

  const toggleGpuAi = (enabled: boolean) => {
    setUseLocalGpuAi(enabled);
    localStorage.setItem("kaspi_use_local_gpu", String(enabled));
  };

  return (
    <div className="space-y-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${locale}/dashboard`}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition flex items-center gap-1"
            >
              {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{isRtl ? "لوحة التحكم" : "Tableau de Bord"}</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-white" />
            {isRtl ? "إعدادات المتجر ونظام الكاشير" : "Paramètres du Commerce & Multi-Magasins"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Mentions légales DGI, succursales multi-boutiques, ticket thermique et automatisation WhatsApp
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Paramètres enregistrés avec succès !</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* CARD 1: MULTI-STORE BRANCH NETWORK */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">Réseau Multi-Boutiques (Stores &amp; Succursales)</h2>
                <p className="text-[11px] text-zinc-400">Gérez plusieurs magasins physiques sous un même compte</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingStore(!isAddingStore)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 transition border border-zinc-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une succursale</span>
            </button>
          </div>

          {/* New Store Drawer */}
          {isAddingStore && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 animate-in fade-in">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Créer une nouvelle succursale
              </h3>
              {storeCreateError && (
                <p className="text-xs text-rose-400 font-mono">{storeCreateError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nom (ex: Succursale Agdal)"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="h-10 px-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Code court (ex: AGDAL-01)"
                  value={newStoreCode}
                  onChange={(e) => setNewStoreCode(e.target.value)}
                  className="h-10 px-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white uppercase font-mono"
                />
                <input
                  type="text"
                  placeholder="Adresse (ex: Rabat)"
                  value={newStoreAddress}
                  onChange={(e) => setNewStoreAddress(e.target.value)}
                  className="h-10 px-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingStore(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateStore}
                  disabled={isCreatingStore}
                  className="px-4 py-1.5 bg-white text-black font-bold text-xs rounded-lg hover:bg-zinc-200"
                >
                  {isCreatingStore ? "Création..." : "Confirmer"}
                </button>
              </div>
            </div>
          )}

          {/* Stores List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stores.length === 0 ? (
              <div className="sm:col-span-3 p-4 rounded-xl bg-zinc-950 text-center text-xs text-zinc-500 font-mono">
                Boutique Principale (Siège Social) active par défaut.
              </div>
            ) : (
              stores.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{s.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {s.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{s.address || "Casablanca"}</p>
                  <div className="pt-2 border-t border-zinc-800/80 flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>{s.devicesCount} caisse(s)</span>
                    <span>{s.salesCount} ventes</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CARD 2: LEGAL & TAX IDENTIFIERS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <Store className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white">Identifiants Commerciaux &amp; Fiscaux (DGI Maroc)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Nom Commercial du Magasin (Enseigne)
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Épicerie de l'Océan SARL"
                className="w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Identifiant Commun de l&apos;Entreprise (ICE)
              </label>
              <input
                type="text"
                value={ice}
                onChange={(e) => setIce(e.target.value)}
                placeholder="001234567000089"
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

        {/* CARD 3: INTERACTIVE RECEIPT DESIGNER WITH LIVE THERMAL PREVIEW (Hidden Gem 3) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-sky-400" />
              <div>
                <h2 className="text-base font-bold text-white">Designer de Ticket de Caisse Thermique</h2>
                <p className="text-[11px] text-zinc-400">Aperçu en direct conforme aux imprimantes ESC/POS 80mm &amp; 58mm</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReceiptPaperDark(!receiptPaperDark)}
              className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-300 hover:text-white"
            >
              Mode Papier: {receiptPaperDark ? "Sombre" : "Blanc Thermique"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Input Customization */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  En-tête du ticket (Message d&apos;accueil)
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
                  Pied de page (Mentions légales &amp; retours)
                </label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Articles ni repris ni échangés après 48h. Merci !"
                  className="w-full h-11 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                <span className="font-bold text-white block">Mentions DGI intégrées automatiquement :</span>
                <p>• Numérotation séquentielle continue (FAC-2026-XXXXXX)</p>
                <p>• QR Code de signature électronique certifiée</p>
                <p>• Décomposition de la TVA marocaine (20%, 14%, 10%, 7%)</p>
              </div>
            </div>

            {/* Right: Live Realistic Thermal Receipt Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div
                className={`w-full max-w-xs font-mono text-xs p-5 shadow-2xl relative select-none rounded-sm transition-colors ${
                  receiptPaperDark
                    ? "bg-zinc-950 text-zinc-100 border border-zinc-800"
                    : "bg-[#fbfbfa] text-zinc-950 border border-zinc-200"
                }`}
                style={{
                  clipPath:
                    "polygon(0% 4px, 5% 0px, 10% 4px, 15% 0px, 20% 4px, 25% 0px, 30% 4px, 35% 0px, 40% 4px, 45% 0px, 50% 4px, 55% 0px, 60% 4px, 65% 0px, 70% 4px, 75% 0px, 80% 4px, 85% 0px, 90% 4px, 95% 0px, 100% 4px, 100% calc(100% - 4px), 95% 100%, 90% calc(100% - 4px), 85% 100%, 80% calc(100% - 4px), 75% 100%, 70% calc(100% - 4px), 65% 100%, 60% calc(100% - 4px), 55% 100%, 50% calc(100% - 4px), 45% 100%, 40% calc(100% - 4px), 35% 100%, 30% calc(100% - 4px), 25% 100%, 20% calc(100% - 4px), 15% 100%, 10% calc(100% - 4px), 5% 100%, 0% calc(100% - 4px))",
                }}
              >
                <div className="text-center space-y-1 pb-2 border-b border-dashed border-current/40">
                  <h4 className="font-extrabold text-sm tracking-tight">
                    {shopName || "KASPI POS STORE"}
                  </h4>
                  <p className="text-[10px] opacity-80">{address || "Casablanca, Maroc"}</p>
                  <p className="text-[9px] opacity-60">
                    ICE: {ice || "001234567000089"} • IF: {taxId || "12345678"}
                  </p>
                  {receiptHeader && (
                    <p className="text-[10px] italic pt-1">{receiptHeader}</p>
                  )}
                </div>

                <div className="py-2 space-y-1 text-[10px] border-b border-dashed border-current/40">
                  <div className="flex justify-between">
                    <span>N° Ticket :</span>
                    <span className="font-bold">FAC-2026-000412</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date :</span>
                    <span>Aujourd&apos;hui 15:42</span>
                  </div>
                </div>

                <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-current/40">
                  <div className="flex justify-between">
                    <span>1x Coca-Cola 33cl</span>
                    <span>6.00 DH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Huile Lesieur 1L</span>
                    <span>23.00 DH</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-current/20">
                    <span>TOTAL TTC :</span>
                    <span>29.00 DH</span>
                  </div>
                </div>

                <div className="pt-2 text-center text-[9px] opacity-75 space-y-1">
                  <p>{receiptFooter || "Merci de votre visite et à bientôt !"}</p>
                  <p className="font-mono text-[8px] opacity-50">Signature DGI #8f23befc</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: WHATSAPP AUTOMATION */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
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

        {/* CARD 5: LOCAL GPU & WEBGPU ACCELERATION TOGGLE (Phase 2) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-base font-bold text-white">Moteur IA &amp; Inférence Locale (WebGPU / GPU)</h2>
                <p className="text-[11px] text-zinc-400">Exécutez les analyses de stock et requêtes IA sur la puce graphique de votre terminal</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleGpuAi(!useLocalGpuAi)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono transition border ${
                useLocalGpuAi
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
            >
              {useLocalGpuAi ? "Actif (GPU Local)" : "Cloud API Uniquement"}
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Lorsque le moteur GPU local est activé, KASPI POS utilise les capacités de calcul WebGPU de votre matériel de caisse. Vos données restent 100% confidentielles en local et réduisent les coûts d&apos;infrastructure à zéro.
          </p>
        </div>

        {/* CARD 6: PASSERELLES DE PAIEMENT & TERMINAL TPE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Passerelles de Paiement &amp; Terminal TPE (4 Niveaux)</h2>
              <p className="text-[11px] text-zinc-400">Configurez votre terminal bancaire CMI, Stripe, ou YouCanPay Maroc</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: "cmi_tpe",
                name: "CMI / TPE Physique",
                desc: "Partage dynamique (Client 70% / Marchand 30%) - 2.0%",
                badge: "Physique",
              },
              {
                id: "youcanpay",
                name: "YouCanPay Maroc",
                desc: "Cartes nationales 3.9% + 2.00 MAD (Intl 4.9%)",
                badge: "En Ligne (MAD)",
              },
              {
                id: "stripe",
                name: "Stripe Global",
                desc: "Cartes internationales (2.9% + 0.30 $ USD)",
                badge: "International",
              },
              {
                id: "cash_only",
                name: "Espèces & Krediat",
                desc: "Sans frais bancaires (0% commission)",
                badge: "Standard",
              },
            ].map((gw) => (
              <button
                key={gw.id}
                type="button"
                onClick={() => {
                  setSelectedGateway(gw.id as any);
                  localStorage.setItem("kaspi_payment_gateway", gw.id);
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  selectedGateway === gw.id
                    ? "bg-zinc-950 border-amber-500 ring-1 ring-amber-500/50"
                    : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{gw.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {gw.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{gw.desc}</p>
                </div>
                {selectedGateway === gw.id && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Sélectionné</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {selectedGateway === "cmi_tpe" && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-white">Paramètres Terminal TPE CMI (Réseau local)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Adresse IP du TPE (Ingenico / Pax / Verifone)
                  </label>
                  <input
                    type="text"
                    value={tpeTerminalIp}
                    onChange={(e) => setTpeTerminalIp(e.target.value)}
                    placeholder="192.168.1.150"
                    className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Port de communication CMI
                  </label>
                  <input
                    type="text"
                    defaultValue="8888"
                    className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            </div>
          )}
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
    </div>
  );
}
