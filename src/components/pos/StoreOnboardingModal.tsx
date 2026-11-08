"use client";

import React, { useState } from "react";
import {
  ShoppingBasket,
  UtensilsCrossed,
  Shirt,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Globe,
  Coins,
  PackagePlus,
  ArrowRight,
  X,
} from "lucide-react";
import { StoreBusinessType, usePosStore } from "@/client/store/usePosStore";

interface StoreOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShopName?: string;
  initialStoreType?: StoreBusinessType;
  canDismiss?: boolean;
  onSuccess?: (storeType: StoreBusinessType) => void;
}

const STORE_TYPES: {
  id: StoreBusinessType;
  titleAr: string;
  titleFr: string;
  descFr: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badgeColor: string;
}[] = [
  {
    id: "grocery",
    titleAr: "متجر بقالة / سوبرماركت",
    titleFr: "Épicerie & Supermarché",
    descFr: "Priorité lecteur code-barres, balance poids (Kg/g), grille rapide & étiquettes thermiques.",
    features: [
      "Calculateur Poids & Balance (Kg / g)",
      "Priorité Scan Code-Barres EAN-13",
      "Studio d'Étiquettes Code-Barres 40x30mm",
      "Suivi Fournisseurs & Péremption",
    ],
    icon: ShoppingBasket,
    gradient: "from-emerald-500/20 to-teal-500/5 border-emerald-500/40",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "restaurant",
    titleAr: "مطعم / مقهى / سناك",
    titleFr: "Restaurant, Café & Fast-Food",
    descFr: "Plan de salle (Tables T-01..T-06), Écran Cuisine (KDS Temps Réel) & modificateurs plats.",
    features: [
      "Gestion des Tables (Sur place / Emporter)",
      "Écran Cuisine KDS (Nouveau → Prêt → Servi)",
      "Options & Modificateurs (Sans oignon, Extra fromage)",
      "Impression Ticket Cuisine & Addition Table",
    ],
    icon: UtensilsCrossed,
    gradient: "from-amber-500/20 to-orange-500/5 border-amber-500/40",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "fashion",
    titleAr: "محل ملابس وأحذية",
    titleFr: "Mode, Vêtements & Chaussures",
    descFr: "Matrice Tailles (S/M/L/XL/XXL, Pointures 38-44) & Couleurs avec étiquetage textile.",
    features: [
      "Matrice Tailles (S / M / L / XL / XXL / 38-44)",
      "Sélecteur Couleurs & Collection Saison",
      "Impression Étiquettes Prix & Code-Barres",
      "Gestion Retours & Échanges Rapides",
    ],
    icon: Shirt,
    gradient: "from-fuchsia-500/20 to-pink-500/5 border-fuchsia-500/40",
    badgeColor: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
  },
  {
    id: "electronics",
    titleAr: "تجارة عامة / إلكترونيات",
    titleFr: "Électronique & Commerce Général",
    descFr: "Suivi N° Série / IMEI sur reçu, certificat de garantie (12/24 mois) & vente à crédit.",
    features: [
      "Scan & Suivi N° Série / IMEI par article",
      "Certificat de Garantie (6 / 12 / 24 Mois)",
      "Carnet de Crédit (الكريدي) & Acomptes",
      "Facturation TVA & Devis Professionnels",
    ],
    icon: Smartphone,
    gradient: "from-blue-500/20 to-indigo-500/5 border-blue-500/40",
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  },
];

export function StoreOnboardingModal({
  isOpen,
  onClose,
  initialShopName = "",
  initialStoreType = "grocery",
  canDismiss = true,
  onSuccess,
}: StoreOnboardingModalProps) {
  const { setStoreProfile } = usePosStore();
  const [selectedType, setSelectedType] = useState<StoreBusinessType>(initialStoreType);
  const [shopName, setShopName] = useState(initialShopName);
  const [currency, setCurrency] = useState("MAD");
  const [receiptLanguage, setReceiptLanguage] = useState("ar");
  const [seedCatalog, setSeedCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/onboarding/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeType: selectedType,
          shopName: shopName.trim() || undefined,
          currency,
          receiptLanguage,
          seedStarterCatalog: seedCatalog,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Impossible de configurer l'espace de travail");
      }

      setStoreProfile(selectedType, true);
      if (onSuccess) onSuccess(selectedType);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0e1017] border border-white/10 shadow-2xl overflow-hidden my-auto">
        {/* Top Accent Banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-500" />

        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>KASPI POS UNIVERSAL ONBOARDING ENGINE • إعداد مساحة العمل الذكية</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Choisissez votre secteur d&apos;activité • اختر نوع مشروعك
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                KASPI POS adapte automatiquement la caisse, les outils métier, les tables KDS, les variantes et le catalogue à votre commerce.
              </p>
            </div>
            {canDismiss && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 4 Store Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STORE_TYPES.map((item) => {
                const Icon = item.icon;
                const active = selectedType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedType(item.id)}
                    className={`text-left p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                      active
                        ? `bg-gradient-to-br ${item.gradient} ring-2 ring-amber-400/70 shadow-lg`
                        : "bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl border ${item.badgeColor}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-base font-bold text-white">{item.titleFr}</div>
                          <div className="text-xs font-semibold text-amber-400/90" dir="rtl">
                            {item.titleAr}
                          </div>
                        </div>
                      </div>
                      {active && <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0" />}
                    </div>

                    <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{item.descFr}</p>

                    <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-white/10">
                      {item.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Configuration Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Nom du Commerce • اسم المتجر
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ex: Café Atlas / Supermarché Nour"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Devise • العملة المعتمدة
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="MAD">MAD — Dirham Marocain (DH)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="SAR">SAR — Riyal Saoudien (ر.س)</option>
                  <option value="AED">AED — Dirham Émirati (د.إ)</option>
                  <option value="TRY">TRY — Lire Turque (₺)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Langue du Ticket • لغة الفاتورة الحرارية
                </label>
                <select
                  value={receiptLanguage}
                  onChange={(e) => setReceiptLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="ar">العربية (أرقام غربية 0-9 واضحة)</option>
                  <option value="fr">Français (Standard Maroc/Europe)</option>
                  <option value="en">English (International)</option>
                  <option value="tr">Türkçe (Türkiye)</option>
                  <option value="es">Español (España/LatAm)</option>
                  <option value="de">Deutsch (DACH)</option>
                </select>
              </div>
            </div>

            {/* Starter Catalog Checkbox + Submit */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={seedCatalog}
                  onChange={(e) => setSeedCatalog(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <div className="text-xs text-zinc-300 flex items-center gap-2">
                  <PackagePlus className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Pré-remplir avec des produits de démonstration adaptés (si mon catalogue est vide)
                  </span>
                </div>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                <span>
                  {saving
                    ? "Configuration en cours..."
                    : "Activer mon Espace Métier • تفعيل النظام"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
