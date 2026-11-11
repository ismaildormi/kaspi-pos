"use client";

import React, { useState } from "react";
import {
  ShoppingBasket,
  UtensilsCrossed,
  Shirt,
  Smartphone,
  Beef,
  Croissant,
  Boxes,
  Sparkles,
  CheckCircle2,
  Globe,
  Coins,
  PackagePlus,
  ArrowRight,
  X,
} from "lucide-react";
import { StoreBusinessType, usePosStore } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";

interface StoreOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShopName?: string;
  initialStoreType?: StoreBusinessType;
  canDismiss?: boolean;
  onSuccess?: (storeType: StoreBusinessType) => void;
}

export function StoreOnboardingModal({
  isOpen,
  onClose,
  initialShopName = "",
  initialStoreType = "grocery",
  canDismiss = true,
  onSuccess,
}: StoreOnboardingModalProps) {
  const { t, locale } = useAppDictionary();
  const { setStoreProfile } = usePosStore();
  const [selectedType, setSelectedType] = useState<StoreBusinessType>(initialStoreType);
  const [shopName, setShopName] = useState(initialShopName);
  const [currency, setCurrency] = useState("MAD");
  const [receiptLanguage, setReceiptLanguage] = useState("fr");
  const [seedCatalog, setSeedCatalog] = useState(false);
  const [hasConfirmedSectorChange, setHasConfirmedSectorChange] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const storeTypes: {
    id: StoreBusinessType;
    title: string;
    desc: string;
    features: string[];
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "grocery",
      title: locale === "ar" ? "بقالة وسوبرماركت" : locale === "en" ? "Grocery & Supermarket" : "Épicerie & Supermarché",
      desc: locale === "ar" ? "مسح باركود سريع، ميزان الوزن، وإيصالات حرارية للمواد الغذائية." : locale === "en" ? "Rapid barcode scanning, weight scale integration, and thermal grocery receipts." : "Scan code-barres rapide, intégration balance au poids et tickets alimentaires.",
      features: locale === "ar" ? ["ميزان الوزن (كغ / غ)", "باركود موازين EAN-13", "مراقبة الصلاحيات"] : locale === "en" ? ["Weight Scale (kg/g)", "EAN-13 Barcode Support", "Expiry Tracking"] : ["Balance au poids (kg/g)", "Codes balances EAN-13", "Suivi des dates d'expiration"],
      icon: ShoppingBasket,
    },
    {
      id: "butchery",
      title: locale === "ar" ? "مجزرة ولحوم" : locale === "en" ? "Butchery & Meats" : "Boucherie & Viandes",
      desc: locale === "ar" ? "تسعير فوري بالوزن، تتبع الذبائح والتقطيع، وملصقات الميزان الإلكتروني." : locale === "en" ? "Live weight calculation, cuts tracking, and scale barcode labels." : "Tarification au poids vif/découpé, étiquettes balance et gestion des lots.",
      features: locale === "ar" ? ["حساب السعر بالوزن الفوري", "تتبع الذبائح والتقطيع", "تسعير خاص للمطاعم"] : locale === "en" ? ["Instant Price-by-Weight", "Cuts & Carcass Tracking", "Wholesale Restaurant Pricing"] : ["Calcul instantané prix au poids", "Suivi des carcasses et découpes", "Tarifs de gros pour restaurants"],
      icon: Beef,
    },
    {
      id: "restaurant",
      title: locale === "ar" ? "مطعم ومقهى" : locale === "en" ? "Restaurant & Café" : "Restaurant & Café",
      desc: locale === "ar" ? "خريطة طاولات الصالة، شاشة المطبخ (KDS)، إضافات الأطباق والطلبات السفرية." : locale === "en" ? "Table floor plan, Kitchen Display System (KDS), dish modifiers, and takeout." : "Plan de tables, écran cuisine KDS, modificateurs de plats et commandes à emporter.",
      features: locale === "ar" ? ["خريطة الطاولات الحية", "شاشة تحضير المطبخ (KDS)", "تعديلات المطبخ (بدون بصل/حار)"] : locale === "en" ? ["Interactive Table Floorplan", "Kitchen Display System (KDS)", "Dish Customization Modifiers"] : ["Plan de tables interactif", "Écran cuisine direct (KDS)", "Modificateurs (sans oignons, piment...)"],
      icon: UtensilsCrossed,
    },
    {
      id: "bakery",
      title: locale === "ar" ? "مخبزة وحلويات" : locale === "en" ? "Bakery & Pastry" : "Boulangerie & Pâtisserie",
      desc: locale === "ar" ? "بيع بالقطعة أو الوزن، حجوزات الكعك والمناسبات، وسرعة فائقة في أوقات الذروة." : locale === "en" ? "Item & weight checkout, custom cake pre-orders, and peak hour speed." : "Vente à la pièce et au kilo, commandes de gâteaux personnalisés et rapidité.",
      features: locale === "ar" ? ["أزرار لمس سريعة بدون باركود", "دفتر طلبيات الحلويات والمناسبات", "ميزان حلويات بالغرام"] : locale === "en" ? ["Touch Quick-Keys (No Barcode)", "Special Order & Event Bookings", "Gram Precision Scale"] : ["Touches tactiles rapides", "Carnet de commandes gâteaux", "Balance au gramme"],
      icon: Croissant,
    },
    {
      id: "fashion",
      title: locale === "ar" ? "ملابس وأزياء" : locale === "en" ? "Fashion & Apparel" : "Mode & Prêt-à-Porter",
      desc: locale === "ar" ? "مصفوفة المقاسات والألوان، لاصقات الملابس، وتتبع حركة الموديلات والمخزون." : locale === "en" ? "Size & color matrix, clothing barcode tags, and fashion inventory lifecycle." : "Matrice tailles & coloris, étiquettes vêtements et rotation des collections.",
      features: locale === "ar" ? ["مصفوفة المقاس واللون", "طباعة لاصقات الملابس 40x30", "تتبع الموديلات والأحجام"] : locale === "en" ? ["Size & Color Variant Grid", "Apparel Barcode Tag Studio", "Collection & Model Tracking"] : ["Matrice tailles & couleurs", "Impression étiquettes vêtements", "Suivi des collections et modèles"],
      icon: Shirt,
    },
    {
      id: "electronics",
      title: locale === "ar" ? "إلكترونيات وتقنية" : locale === "en" ? "Tech & Electronics" : "Électronique & Tech",
      desc: locale === "ar" ? "تتبع الأرقام التسلسلية وIMEI، شهادات الضمان المطبوعة، وإكسسوارات الأجهزة." : locale === "en" ? "IMEI & serial number tracking, printed warranty certificates, and accessories." : "Traçabilité IMEI et numéros de série, garanties imprimées et SAV.",
      features: locale === "ar" ? ["تسجيل IMEI والرقم التسلسلي", "تحديد مدة الضمان على الإيصال", "سجل الصيانة والإصلاح"] : locale === "en" ? ["IMEI & Serial Number Tracking", "Warranty Period on Receipt", "Repair & Service History"] : ["Enregistrement IMEI & n° série", "Mention garantie sur le ticket", "Fiches SAV et réparations"],
      icon: Smartphone,
    },
    {
      id: "wholesale",
      title: locale === "ar" ? "تجارة الجملة والدروكري" : locale === "en" ? "Wholesale & Distribution" : "Grossiste & Droguerie",
      desc: locale === "ar" ? "أسعار الجملة والكرتون، إدارة دفعات الموردين، وإصدار فواتير ببيانات ICE الرسمية." : locale === "en" ? "Carton & case tier pricing, supplier bills & effects, and ICE B2B invoices." : "Prix de gros & cartons, effets fournisseurs et factures professionnelles ICE.",
      features: locale === "ar" ? ["تسعير تلقائي بالكرتون والتقسيط", "فواتير رسمية بـ ICE والضريبة", "دفتر كمبيالات الموردين"] : locale === "en" ? ["Box / Carton Tier Pricing", "Official Moroccan ICE Invoices", "Supplier Bills & Effets Ledger"] : ["Tarifs dégressifs au carton", "Facturation ICE et TVA marocaine", "Gestion des effets fournisseurs"],
      icon: Boxes,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType !== initialStoreType && !hasConfirmedSectorChange) {
      setError(
        locale === "ar"
          ? "يرجى وضع علامة تأكيد تغيير وضع النشاط للمتابعة"
          : locale === "en"
          ? "Please confirm the sector change to proceed"
          : "Veuillez cocher la confirmation du changement de secteur pour continuer"
      );
      return;
    }

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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec de l'initialisation");
      }

      setStoreProfile(selectedType, true);
      if (onSuccess) onSuccess(selectedType);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0e1017] border border-white/10 shadow-2xl overflow-hidden my-auto">
        {/* Top Accent Banner (Strict Monochrome) */}
        <div className="h-1 w-full bg-white/20" />

        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-xl overflow-hidden p-0 border border-white/20 bg-zinc-900 shrink-0 shadow-sm">
                  <img src="/logo.png" alt="KASPI POS" className="w-full h-full object-cover rounded-xl" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.onboarding.businessSectorBtn}</span>
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {t.onboarding.modalTitle}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {t.onboarding.modalSubtitle}
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
            {/* Sector Profile Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {storeTypes.map((item) => {
                const Icon = item.icon;
                const active = selectedType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedType(item.id)}
                    className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden cursor-pointer ${
                      active
                        ? "bg-zinc-900 border-white ring-1 ring-white/60 shadow-lg"
                        : "bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl border transition-colors ${
                            active
                              ? "border-white bg-white text-zinc-950 shadow-xs"
                              : "border-white/10 bg-white/[0.04] text-white"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-bold text-white">
                          {item.title}
                        </div>
                      </div>
                      {active && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                    </div>

                    <p className="text-[11px] text-zinc-400 mb-2.5 leading-relaxed">
                      {item.desc}
                    </p>

                    <div className="grid grid-cols-1 gap-1 pt-2 border-t border-white/10">
                      {item.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[10px] text-zinc-300">
                          <span
                            className={`w-1 h-1 rounded-full shrink-0 ${
                              active ? "bg-white" : "bg-zinc-500"
                            }`}
                          />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Smart Warning Banner when switching sectors */}
            {selectedType !== initialStoreType && (
              <div
                dir="auto"
                style={{ unicodeBidi: "plaintext" }}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm leading-relaxed space-y-3"
              >
                <div className="font-semibold flex items-start gap-2">
                  <span className="shrink-0 text-base">⚠️</span>
                  <span>
                    {locale === "ar"
                      ? "تنبيه هام: تغيير وضع النشاط للمتجر الحالي قد لا يتوافق مع المنتجات والبيانات التي قمت بجمعها مسبقاً. إذا كان لديك محل آخر بنشاط مختلف، ننصحك بإضافة فرع جديد (+150 د.م/شهر) وتحديد نشاطه المستقل، أو اضغط تأكيد للمتابعة."
                      : locale === "en"
                      ? "Warning: Changing the sector of an existing store may not match your previously collected products and categories. If you own another shop with a different activity, we recommend adding a new branch (+150 MAD/mo) with its own dedicated sector."
                      : "Attention : Changer le secteur d'un magasin existant peut affecter l'organisation de vos produits actuels. Si vous avez un autre commerce, créez plutôt une nouvelle succursale (+150 MAD/mois) avec son propre secteur."}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-amber-500/20">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                    <input
                      type="checkbox"
                      checked={hasConfirmedSectorChange}
                      onChange={(e) => setHasConfirmedSectorChange(e.target.checked)}
                      className="rounded border-amber-500/50 text-amber-500 focus:ring-0"
                    />
                    <span>
                      {locale === "ar"
                        ? "فهمت، تأكيد تغيير وضع المتجر الحالي"
                        : locale === "en"
                        ? "Confirm Sector Change"
                        : "Confirmer le changement"}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Quick Configuration Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  {t.onboarding.storeNameLabel}
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ex: Atlas Market / KASPI Store"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.onboarding.currencyLabel}</span>
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
                  <Globe className="w-3.5 h-3.5 text-zinc-300" />
                  <span>{t.onboarding.ticketLanguageLabel}</span>
                </label>
                <select
                  value={receiptLanguage}
                  onChange={(e) => setReceiptLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-white"
                >
                  <option value="ar">العربية (Standard DGI)</option>
                  <option value="fr">Français (Standard Maroc/Europe)</option>
                  <option value="en">English (International)</option>
                </select>
              </div>
            </div>

            {/* Clean Zero-State Notice + Submit */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Zero-State: 100% Clean Database</span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 text-zinc-950 font-black text-sm shadow-xl transition disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {saving ? t.onboarding.activatingBtn : t.onboarding.activateBtn}
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
