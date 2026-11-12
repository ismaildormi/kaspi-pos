"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Globe,
  Building2,
  X,
  Receipt,
  AlertTriangle,
  Monitor,
  Plus,
} from "lucide-react";
import { UnifiedCheckoutModal } from "@/components/billing/UnifiedCheckoutModal";

interface SubscriptionData {
  id: string | null;
  planCode: string;
  planName: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  provider: string;
  billingInterval: string;
  currentPeriodEnd: string | null;
  trialEndAt: string | null;
  daysRemaining: number;
  priceUSD: number;
  priceMAD: number;
  maxDevices?: number;
  activeDevicesCount?: number;
}

interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  provider: string;
}

const BILLING_DICT = {
  ar: {
    backPos: "العودة لنقطة البيع (POS)",
    pageTitle: "الاشتراكات والفوترة",
    heroBadge: "خطة كسب المتدرجة — 200 درهم شهرياً",
    heroTitle: "برنامج كاشير سحابي شامل بدون أي رسوم إضافية",
    heroDesc: "200 درهم للخادم/الجهاز الأول، و 150 درهم فقط لكل نقطة بيع إضافية. نظام مرن يواكب نمو متجرك.",
    gatewayPrefix: "بوابة الدفع المسجلة :",
    perMonth: "شهر",
    registerCapacity: "سعة نقاط البيع",
    licensedDevices: "أجهزة مرخصة",
    currentPeriod: "الفترة الجارية",
    noExpiration: "بدون انتهاء",
    daysRemaining: "الأيام المتبقية",
    days: "أيام",
    billingStatus: "حالة الاشتراك",
    statusAuto: "مفعل تلقائياً",
    statusActionRequired: "إجراء مطلوب",
    tierGridTitle: "جدول تسعير نقاط البيع الإضافية :",
    tierGridSubtitle: "+150 درهم لكل نقطة بيع إضافية",
    tier1Title: "1 جهاز كاشير",
    tier1Desc: "جميع الميزات مفتوحة 100% من أول نقطة بيع",
    tier2Title: "2 أجهزة كاشير",
    tier2Desc: "سوبرماركت / مطعم",
    tier3Title: "3 أجهزة كاشير",
    tier3Desc: "متعدد الصناديق",
    tier4Title: "4 أجهزة كاشير",
    tier4Desc: "سوبرماركت كبير",
    addRegisterBtn: "إضافة نقطة بيع جديدة (+150 درهم)",
    updatePaymentBtn: "تجديد أو ترقية الاشتراك",
    bankTransferTitle: "تفعيل فوري عبر التحويل البنكي المباشر (عمولة 0%)",
    bankTransferDesc: "سدد اشتراكك مباشرة عبر حسابنا البنكي، وأدخل كود التفعيل لتجديد اشتراكك فوراً دون وسيط.",
    zeroFeeBadge: "توفير 100% من العمولات",
    bankCoordsTitle: "بيانات التحويل البنكي الوطني :",
    bankLabel: "البنك :",
    ribLabel: "رقم الحساب (RIB) :",
    beneficiaryLabel: "اسم المستفيد :",
    bankNotice: "يتم إرسال تأكيد التحويل وتفعيل الترخيص الرسمي مباشرة عبر البريد الإلكتروني المعتمد (Gmail) مع إشعار رسمي 3D فور التأكيد.",
    enterLicenseLabel: "أدخل كود التفعيل (License Key) :",
    activateBtn: "تفعيل",
    licenseSuccess: "تم تفعيل الاشتراك بنجاح!",
    licenseError: "رمز تفعيل غير صالح أو مستخدم مسبقاً",
    choosePaymentModalTitle: "اختر طريقة الدفع المناسبة",
    moroccanCardTitle: "بطاقة بنكية مغربية (YouCan Pay)",
    moroccanCardDesc: "دعم فوري لجميع البطاقات الوطنية (CMI, CIH, Attijariwafa, BCP, BMCE, Barid Bank).",
    moroccanCardBadge: "بوابة محلية مغربية سريعة وآمنة",
    intlCardTitle: "بطاقة دولية / Merchant of Record (Paddle)",
    intlCardDesc: "يقبل بطاقات Visa, Mastercard, Apple Pay, PayPal مع إدارة الضرائب الدولية تلقائياً.",
    intlCardBadge: "مطابق لمعايير الامتثال الضريبي العالمي",
    cancel: "إلغاء",
    connectingGateway: "جاري تحضير بوابة الدفع...",
    proceedCheckout: "متابعة للدفع الآمن",
    statusActive: "نشط",
    statusTrial: "فترة تجريبية",
    statusPastDue: "متأخر في السداد",
    statusUnsubscribed: "غير مفعل",
  },
  fr: {
    backPos: "Retour au POS",
    pageTitle: "Abonnement & Facturation",
    heroBadge: "Formule KASPI Évolutive — 200 MAD (1er poste)",
    heroTitle: "La Solution POS Complète sans aucun frais caché",
    heroDesc: "200 MAD/mois pour votre première caisse, puis +150 MAD/mois par poste supplémentaire. Évolutif, sans engagement.",
    gatewayPrefix: "Passerelle :",
    perMonth: "mois",
    registerCapacity: "Capacité Caisses",
    licensedDevices: "postes autorisés",
    currentPeriod: "Période en cours",
    noExpiration: "Sans expiration",
    daysRemaining: "Jours restants",
    days: "jours",
    billingStatus: "Statut facturation",
    statusAuto: "Automatique",
    statusActionRequired: "Action requise",
    tierGridTitle: "Grille Tarifaire par Nombre de Caisses :",
    tierGridSubtitle: "+150 MAD par caisse additionnelle",
    tier1Title: "1 Caisse",
    tier1Desc: "Toutes les fonctionnalités incluses dès le 1er poste",
    tier2Title: "2 Caisses",
    tier2Desc: "Supérette / Restaurant",
    tier3Title: "3 Caisses",
    tier3Desc: "Multi-Postes",
    tier4Title: "4 Caisses",
    tier4Desc: "Supermarché",
    addRegisterBtn: "Ajouter un nouveau poste de caisse (+150 MAD)",
    updatePaymentBtn: "Modifier le moyen de paiement",
    bankTransferTitle: "Activation Directe par Virement Bancaire (0% Commission)",
    bankTransferDesc: "Payez directement via CIH, Attijari ou Barid Bank et activez instantanément votre licence sans frais tiers.",
    zeroFeeBadge: "0% Frais Passerelle",
    bankCoordsTitle: "Coordonnées Bancaires Nationales :",
    bankLabel: "Banque :",
    ribLabel: "RIB (24 chiffres) :",
    beneficiaryLabel: "Bénéficiaire :",
    bankNotice: "La confirmation du virement et la clé d'activation officielle vous sont transmises directement par email officiel (Gmail) avec reçu officiel 3D dès validation.",
    enterLicenseLabel: "Saisir votre Code d'Activation :",
    activateBtn: "Activer",
    licenseSuccess: "Licence activée avec succès !",
    licenseError: "Code d'activation invalide",
    choosePaymentModalTitle: "Choisissez votre Moyen de Paiement",
    moroccanCardTitle: "Carte Bancaire Marocaine (YouCan Pay)",
    moroccanCardDesc: "Paiement direct en Dirhams (CMI, CIH, Attijari, BCP, BMCE, Barid Bank).",
    moroccanCardBadge: "Passerelle Nationale Sécurisée",
    intlCardTitle: "Carte Internationale (Paddle MoR)",
    intlCardDesc: "Paiement international (Visa, Mastercard, Apple Pay, PayPal). Gestion TVA incluse.",
    intlCardBadge: "Merchant of Record Global",
    cancel: "Annuler",
    connectingGateway: "Connexion sécurisée...",
    proceedCheckout: "Procéder au Paiement",
    statusActive: "Actif",
    statusTrial: "Essai Gratuit",
    statusPastDue: "Paiement en attente",
    statusUnsubscribed: "Non souscrit",
  },
  en: {
    backPos: "Back to POS",
    pageTitle: "Subscription & Billing",
    heroBadge: "KASPI Tiered Formula — 200 MAD (1st register)",
    heroTitle: "The All-in-One Cloud POS with Zero Hidden Fees",
    heroDesc: "200 MAD/mo for your primary register, then +150 MAD/mo per extra device. Scalable with no lock-in.",
    gatewayPrefix: "Payment Gateway:",
    perMonth: "month",
    registerCapacity: "Register Capacity",
    licensedDevices: "licensed devices",
    currentPeriod: "Current Period",
    noExpiration: "No expiration",
    daysRemaining: "Days Remaining",
    days: "days",
    billingStatus: "Billing Status",
    statusAuto: "Automatic",
    statusActionRequired: "Action Required",
    tierGridTitle: "Register Tier Pricing Grid:",
    tierGridSubtitle: "+150 MAD per extra register",
    tier1Title: "1 Register",
    tier1Desc: "All Features 100% Included from 1st Register",
    tier2Title: "2 Registers",
    tier2Desc: "Supermarket / Restaurant",
    tier3Title: "3 Registers",
    tier3Desc: "Multi-Register",
    tier4Title: "4 Registers",
    tier4Desc: "Large Supermarket",
    addRegisterBtn: "Add Extra Register (+150 MAD)",
    updatePaymentBtn: "Update Payment Method",
    bankTransferTitle: "Instant Activation via Direct Bank Transfer (0% Fee)",
    bankTransferDesc: "Pay directly via CIH, Attijari, or Barid Bank and instantly activate your license key without third-party fees.",
    zeroFeeBadge: "100% Fee Savings",
    bankCoordsTitle: "National Bank Coordinates:",
    bankLabel: "Bank:",
    ribLabel: "RIB (24 digits):",
    beneficiaryLabel: "Beneficiary:",
    bankNotice: "Bank transfer confirmation and official license activation keys are delivered directly via official Gmail with 3D receipt upon verification.",
    enterLicenseLabel: "Enter Activation License Key:",
    activateBtn: "Activate",
    licenseSuccess: "Subscription activated successfully!",
    licenseError: "Invalid or already used activation code",
    choosePaymentModalTitle: "Choose Payment Method",
    moroccanCardTitle: "Moroccan Bank Card (YouCan Pay)",
    moroccanCardDesc: "Direct checkout in MAD (CMI, CIH, Attijari, BCP, BMCE, Barid Bank).",
    moroccanCardBadge: "Fast & Secure National Gateway",
    intlCardTitle: "International Card (Paddle MoR)",
    intlCardDesc: "Visa, Mastercard, Apple Pay, PayPal with global automated VAT compliance.",
    intlCardBadge: "Global Merchant of Record",
    cancel: "Cancel",
    connectingGateway: "Connecting securely...",
    proceedCheckout: "Proceed to Payment",
    statusActive: "Active",
    statusTrial: "Free Trial",
    statusPastDue: "Payment Past Due",
    statusUnsubscribed: "Unsubscribed",
  },
};

export default function BillingDashboardPage() {
  const locale = (useLocale() || "fr") as "ar" | "fr" | "en";
  const t = BILLING_DICT[locale] || BILLING_DICT.fr;

  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<"plan" | "add_device">("plan");
  const [selectedProvider, setSelectedProvider] = useState<"paddle" | "youcanpay">("youcanpay");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // License Key Activation State (0% Fee Bank Transfer)
  const [licenseCode, setLicenseCode] = useState("");
  const [isActivatingLicense, setIsActivatingLicense] = useState(false);
  const [licenseSuccessMsg, setLicenseSuccessMsg] = useState<string | null>(null);
  const [licenseErrorMsg, setLicenseErrorMsg] = useState<string | null>(null);

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = licenseCode.trim();
    if (!clean) return;
    setIsActivatingLicense(true);
    setLicenseErrorMsg(null);
    setLicenseSuccessMsg(null);
    try {
      const res = await fetch("/api/v1/billing/activate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec d'activation de la licence");
      }
      setLicenseSuccessMsg(data.message || t.licenseSuccess);
      setLicenseCode("");
      await fetchSubscription();
    } catch (err: any) {
      setLicenseErrorMsg(err.message || t.licenseError);
    } finally {
      setIsActivatingLicense(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/billing/subscription");
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscription(data.subscription);
        setPayments(data.recentPayments || []);
      }
    } catch (err) {
      console.error("Failed to load subscription:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          planCode: "PRO_MONTHLY",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible d'initialiser le paiement");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Lien de paiement non fourni.");
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Erreur de connexion avec la passerelle.");
      setIsCheckingOut(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-white border border-zinc-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.statusActive}</span>
          </span>
        );
      case "trialing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.statusTrial}</span>
          </span>
        );
      case "past_due":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t.statusPastDue}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
            <span>{status || t.statusUnsubscribed}</span>
          </span>
        );
    }
  };

  return (
    <div dir="ltr" className="min-h-screen bg-zinc-950 text-white pb-20 select-none">
      {/* Top Bar */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/pos`}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backPos}</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold shadow-xs">
                <CreditCard className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-white">
                {t.pageTitle}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Header Hero */}
        <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.heroBadge}</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-normal leading-relaxed sm:leading-normal pt-1.5 pb-1 mb-2">
              {t.heroTitle}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {t.heroDesc}
            </p>
          </div>
        </div>

        {/* Current Plan Card & Status */}
        <div className="kaspi-frosted-card rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-white">
                  {subscription?.planName || "KASPI All-in-One"}
                </h3>
                {getStatusBadge(subscription?.status)}
              </div>
              <p className="text-xs text-zinc-400">
                {t.gatewayPrefix} {subscription?.provider?.toUpperCase() || "YOUCAN PAY / MANUAL"}
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-titanium-gradient font-mono tracking-tight">
                {subscription?.priceMAD ?? 200} <span className="text-sm font-bold text-zinc-400">MAD / {t.perMonth}</span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">(${subscription?.priceUSD ?? 20} USD / {t.perMonth})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="kaspi-frosted-card kaspi-frosted-card-hover relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs text-zinc-300 font-semibold block mb-1">
                {t.registerCapacity}
              </span>
              <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5 mt-2">
                <Monitor className="w-3.5 h-3.5 text-[#2DD4BF]" />
                {subscription?.maxDevices ?? 1} {t.licensedDevices}
              </span>
            </div>

            <div className="kaspi-frosted-card kaspi-frosted-card-hover relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs text-zinc-300 font-semibold block mb-1">
                {t.currentPeriod}
              </span>
              <span className="text-sm font-bold text-white font-mono mt-2 block">
                {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : t.noExpiration}
              </span>
            </div>

            <div className="kaspi-frosted-card kaspi-frosted-card-hover relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs text-zinc-300 font-semibold block mb-1">
                {t.daysRemaining}
              </span>
              <span className="text-sm font-bold text-[#5EEAD4] font-mono mt-2 block">
                {subscription?.daysRemaining ?? 14} {t.days}
              </span>
            </div>

            <div className="kaspi-frosted-card kaspi-frosted-card-hover relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs text-zinc-300 font-semibold block mb-1">
                {t.billingStatus}
              </span>
              <span className="text-sm font-bold text-white mt-2 block">
                {subscription?.status === "active"
                  ? t.statusAuto
                  : t.statusActionRequired}
              </span>
            </div>
          </div>

          {/* Tiered Device Pricing Grid */}
          <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                {t.tierGridTitle}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {t.tierGridSubtitle}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className={`p-3 rounded-xl border text-center ${
                (subscription?.maxDevices ?? 1) === 1
                  ? "bg-zinc-800 border-white text-white font-bold ring-1 ring-white/20"
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
              }`}>
                <span className="block text-[11px] mb-0.5">{t.tier1Title}</span>
                <span className="font-mono text-sm font-black text-white">200 MAD</span>
                <span className="block text-[9.5px] font-semibold text-emerald-400 mt-0.5 leading-tight">{t.tier1Desc}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${
                (subscription?.maxDevices ?? 1) === 2
                  ? "bg-zinc-800 border-white text-white font-bold ring-1 ring-white/20"
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
              }`}>
                <span className="block text-[11px] mb-0.5">{t.tier2Title}</span>
                <span className="font-mono text-sm font-black text-white">350 MAD</span>
                <span className="block text-[9px] text-zinc-500">{t.tier2Desc}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${
                (subscription?.maxDevices ?? 1) === 3
                  ? "bg-zinc-800 border-white text-white font-bold ring-1 ring-white/20"
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
              }`}>
                <span className="block text-[11px] mb-0.5">{t.tier3Title}</span>
                <span className="font-mono text-sm font-black text-white">500 MAD</span>
                <span className="block text-[9px] text-zinc-500">{t.tier3Desc}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${
                (subscription?.maxDevices ?? 1) >= 4
                  ? "bg-zinc-800 border-white text-white font-bold ring-1 ring-white/20"
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
              }`}>
                <span className="block text-[11px] mb-0.5">{t.tier4Title}</span>
                <span className="font-mono text-sm font-black text-white">650 MAD</span>
                <span className="block text-[9px] text-zinc-500">{t.tier4Desc}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setCheckoutMode("add_device");
                setCheckoutModalOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addRegisterBtn}</span>
            </button>

            <button
              onClick={() => {
                setCheckoutMode("plan");
                setCheckoutModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-white border border-white/10 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              {t.updatePaymentBtn}
            </button>
          </div>
        </div>

        {/* Zero-Fee Bank Transfer & License Key Activation (Path B) */}
        <div className="kaspi-frosted-card rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {t.bankTransferTitle}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {t.bankTransferDesc}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 border border-amber-400/30 text-amber-400">
              {t.zeroFeeBadge}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Bank Coordinates */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-zinc-300 block uppercase tracking-wider">
                {t.bankCoordsTitle}
              </span>
              <div className="font-mono text-xs space-y-1 text-zinc-300">
                <div><strong className="text-white">{t.bankLabel}</strong> CIH Bank / Attijariwafa Bank</div>
                <div><strong className="text-white">{t.ribLabel}</strong> 230 780 4567890123456701 45</div>
                <div><strong className="text-white">{t.beneficiaryLabel}</strong> KASPI POS SARL AU</div>
                <div className="text-[11px] text-zinc-500 pt-1">
                  {t.bankNotice}
                </div>
              </div>
            </div>

            {/* License Activation Input */}
            <form onSubmit={handleActivateLicense} className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  {t.enterLicenseLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={licenseCode}
                    onChange={(e) => setLicenseCode(e.target.value)}
                    placeholder="KASPI-30D-XXXX-XXXX"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs placeholder-zinc-500 focus:outline-none focus:border-white uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isActivatingLicense || !licenseCode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
                  >
                    {isActivatingLicense ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{t.activateBtn}</span>
                  </button>
                </div>
              </div>

              {licenseSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{licenseSuccessMsg}</span>
                </div>
              )}

              {licenseErrorMsg && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-bold">
                  {licenseErrorMsg}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Payments History */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 sm:p-8">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-zinc-400" />
            <span>{locale === "ar" ? "سجل المدفوعات والاشتراكات" : locale === "en" ? "Payment History" : "Historique des paiements"}</span>
          </h3>

          {payments.length === 0 ? (
            <p className="py-6 text-center text-zinc-500 text-xs font-mono">
              {locale === "ar" ? "لا توجد دفعات مسجلة لهذا المتجر حالياً." : locale === "en" ? "No payment history found for this store." : "Aucun historique de paiement pour ce commerce."}
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">
                      {p.amount} {p.currency}
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      {new Date(p.date).toLocaleDateString()} • {p.provider}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Checkout Modal */}
      {/* Unified Smart Auto-Detect Payment & Subscription Modal */}
      <UnifiedCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        mode={checkoutMode}
        locale={locale}
        currentDevices={subscription?.maxDevices ?? 1}
        onSuccess={(updatedData) => {
          if (checkoutMode === "add_device") {
            const newMax = typeof updatedData === "number" ? updatedData : (subscription?.maxDevices ?? 1) + 1;
            setSubscription((prev) =>
              prev
                ? {
                    ...prev,
                    maxDevices: newMax,
                    priceMAD: 200 + (newMax - 1) * 150,
                    priceUSD: 20 + (newMax - 1) * 15,
                  }
                : null
            );
          }
          fetchSubscription();
        }}
      />
    </div>
  );
}
