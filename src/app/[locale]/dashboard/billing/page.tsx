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
import { AddDeviceModal } from "@/components/billing/AddDeviceModal";

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

export default function BillingDashboardPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
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
      setLicenseSuccessMsg(data.message || (isRtl ? "تم تفعيل الاشتراك بنجاح!" : "Licence activée avec succès !"));
      setLicenseCode("");
      await fetchSubscription();
    } catch (err: any) {
      setLicenseErrorMsg(err.message || (isRtl ? "رمز تفعيل غير صالح أو مستخدم مسبقاً" : "Code d'activation invalide"));
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
            <span>{isRtl ? "نشط" : "Actif"}</span>
          </span>
        );
      case "trialing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isRtl ? "فترة تجريبية" : "Essai Gratuit"}</span>
          </span>
        );
      case "past_due":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isRtl ? "متأخر في السداد" : "Paiement en attente"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
            <span>{status || (locale === "ar" ? "غير مفعل" : locale === "en" ? "Unsubscribed" : "Non souscrit")}</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20 select-none">
      {/* Top Bar */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
                <CreditCard className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-white">
                {isRtl ? "الاشتراكات والفواتير" : "Abonnement & Facturation"}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Header Hero */}
        <div className="bg-zinc-900 border border-zinc-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? "خطة كسب المتدرجة — 200 درهم شهرياً" : "Formule KASPI Évolutive — 200 MAD (1er poste)"}</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              {isRtl
                ? "برنامج كاشير سحابي متكامل بدون أي رسوم إضافية"
                : "La Solution POS Complète sans aucun frais caché"}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {isRtl
                ? "200 درهم للخادم/الجهاز الأول، و 150 درهم فقط لكل نقطة بيع إضافية. نظام مرن يواكب نمو متجرك."
                : "200 MAD/mois pour votre première caisse, puis +150 MAD/mois par poste supplémentaire. Évolutif, sans engagement."}
            </p>
          </div>
        </div>

        {/* Current Plan Card & Status */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-white">
                  {subscription?.planName || "KASPI All-in-One"}
                </h3>
                {getStatusBadge(subscription?.status)}
              </div>
              <p className="text-xs text-zinc-400">
                {isRtl
                  ? `بوابة الدفع المسجلة: ${subscription?.provider || "YouCan Pay / Paddle"}`
                  : `Passerelle : ${subscription?.provider?.toUpperCase() || "MANUAL"}`}
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-white font-mono">
                {subscription?.priceMAD ?? 200} <span className="text-sm font-bold text-zinc-400">MAD / {isRtl ? "شهر" : "mois"}</span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">(${subscription?.priceUSD ?? 20} USD / {isRtl ? "شهر" : "mois"})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <span className="text-xs text-zinc-500 block mb-1">
                {locale === "ar" ? "سعة نقاط البيع" : locale === "en" ? "Register Capacity" : "Capacité Caisses"}
              </span>
              <span className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-zinc-400" />
                {subscription?.maxDevices ?? 1} {locale === "ar" ? "أجهزة مرخصة" : locale === "en" ? "licensed devices" : (subscription?.maxDevices ?? 1) === 1 ? "poste autorisé" : "postes autorisés"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <span className="text-xs text-zinc-500 block mb-1">
                {locale === "ar" ? "الفترة الجارية" : locale === "en" ? "Current Period" : "Période en cours"}
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : locale === "ar" ? "بدون انتهاء" : locale === "en" ? "No expiration" : "Sans expiration"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <span className="text-xs text-zinc-500 block mb-1">
                {locale === "ar" ? "الأيام المتبقية" : locale === "en" ? "Days Remaining" : "Jours restants"}
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {subscription?.daysRemaining ?? 14} {locale === "ar" ? "أيام" : locale === "en" ? "days" : "jours"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <span className="text-xs text-zinc-500 block mb-1">
                {locale === "ar" ? "حالة الاشتراك" : locale === "en" ? "Billing Status" : "Statut facturation"}
              </span>
              <span className="text-sm font-bold text-white">
                {subscription?.status === "active"
                  ? locale === "ar" ? "مفعل تلقائياً" : locale === "en" ? "Automatic" : "Automatique"
                  : locale === "ar" ? "إجراء مطلوب" : locale === "en" ? "Action Required" : "Action requise"}
              </span>
            </div>
          </div>

          {/* Tiered Device Pricing Grid */}
          <div className="mb-6 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                {locale === "ar" ? "جدول تسعير نقاط البيع الإضافية :" : locale === "en" ? "Register Tier Pricing Grid:" : "Grille Tarifaire par Nombre de Caisses :"}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {locale === "ar" ? "+150 درهم لكل نقطة بيع إضافية" : locale === "en" ? "+150 MAD per extra register" : "+150 DH par caisse additionnelle"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className={`p-3 rounded-xl border text-center ${
                (subscription?.maxDevices ?? 1) === 1
                  ? "bg-zinc-800 border-white text-white font-bold ring-1 ring-white/20"
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
              }`}>
                <span className="block text-[11px] mb-0.5">{locale === "ar" ? "1 جهاز كاشير" : locale === "en" ? "1 Register" : "1 Caisse"}</span>
                <span className="font-mono text-sm font-black text-white">200 DH</span>
                <span className="block text-[9px] text-zinc-500">{locale === "ar" ? "محل فردي" : locale === "en" ? "Solo Store" : "Boutique Solo"}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${
                (subscription?.maxDevices ?? 1) === 2
                  ? "bg-zinc-800 border-white text-white font-bold ring-1 ring-white/20"
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
              }`}>
                <span className="block text-[11px] mb-0.5">{locale === "ar" ? "2 أجهزة كاشير" : locale === "en" ? "2 Registers" : "2 Caisses"}</span>
                <span className="font-mono text-sm font-black text-white">350 DH</span>
                <span className="block text-[9px] text-zinc-500">{locale === "ar" ? "سوبرماركت / مطعم" : locale === "en" ? "Supermarket / Cafe" : "Supérette / Restaurant"}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${
                (subscription?.maxDevices ?? 1) === 3
                  ? "bg-zinc-800 border-white text-white font-bold ring-1 ring-white/20"
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
              }`}>
                <span className="block text-[11px] mb-0.5">{locale === "ar" ? "3 أجهزة كاشير" : locale === "en" ? "3 Registers" : "3 Caisses"}</span>
                <span className="font-mono text-sm font-black text-white">500 DH</span>
                <span className="block text-[9px] text-zinc-500">{locale === "ar" ? "متعدد الصناديق" : locale === "en" ? "Multi-Register" : "Multi-Postes"}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${
                (subscription?.maxDevices ?? 1) >= 4
                  ? "bg-zinc-800 border-white text-white font-bold ring-1 ring-white/20"
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400"
              }`}>
                <span className="block text-[11px] mb-0.5">{locale === "ar" ? "4 أجهزة كاشير" : locale === "en" ? "4 Registers" : "4 Caisses"}</span>
                <span className="font-mono text-sm font-black text-white">650 DH</span>
                <span className="block text-[9px] text-zinc-500">{locale === "ar" ? "سوبرماركت كبير" : locale === "en" ? "Supermarket" : "Supermarché"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={() => setIsAddDeviceModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? "إضافة نقطة بيع جديدة (+150 درهم)" : locale === "en" ? "Add Extra Register (+150 MAD)" : "Ajouter un nouveau poste de caisse (+150 DH)"}</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-white border border-white/10 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              {isRtl ? "تجديد أو ترقية الاشتراك" : locale === "en" ? "Update Payment Method" : "Modifier le moyen de paiement"}
            </button>
          </div>
        </div>

        {/* Zero-Fee Bank Transfer & License Key Activation (Path B) */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {isRtl
                    ? "تفعيل فوري عبر التحويل البنكي المباشر (عمولة 0%)"
                    : "Activation Directe par Virement Bancaire (0% Commission)"}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {isRtl
                  ? "سدد اشتراكك مباشرة عبر حسابنا البنكي، وأدخل كود التفعيل لتجديد اشتراكك فوراً دون وسيط."
                  : "Payez directement via CIH, Attijari ou Barid Bank et activez instantanément votre licence sans frais tiers."}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 border border-amber-400/30 text-amber-400">
              {isRtl ? "توفير 100% من العمولات" : "0% Frais Passerelle"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Bank Coordinates */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold text-zinc-300 block uppercase tracking-wider">
                {isRtl ? "بيانات التحويل البنكي الوطني :" : "Coordonnées Bancaires Nationales :"}
              </span>
              <div className="font-mono text-xs space-y-1 text-zinc-300">
                <div><strong className="text-white">{locale === "ar" ? "البنك :" : locale === "en" ? "Bank:" : "Banque :"}</strong> CIH Bank / Attijariwafa Bank</div>
                <div><strong className="text-white">{locale === "ar" ? "رقم الحساب (RIB) :" : locale === "en" ? "RIB (24 digits):" : "RIB (24 chiffres) :"}</strong> 230 780 4567890123456701 45</div>
                <div><strong className="text-white">{locale === "ar" ? "اسم المستفيد :" : locale === "en" ? "Beneficiary:" : "Bénéficiaire :"}</strong> KASPI POS SARL AU</div>
                <div className="text-[11px] text-zinc-500 pt-1">
                  {isRtl
                    ? "بعد إجراء التحويل، أرسل الإشعار عبر واتساب (+212 687-597267) لاستلام كود التفعيل."
                    : "Envoyez l'ordre de virement par WhatsApp (+212 687-597267) pour recevoir votre code d'activation."}
                </div>
              </div>
            </div>

            {/* License Activation Input */}
            <form onSubmit={handleActivateLicense} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  {isRtl ? "أدخل كود التفعيل (License Key) :" : "Saisir votre Code d'Activation :"}
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
                    <span>{isRtl ? "تفعيل" : "Activer"}</span>
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <h3 className="text-base font-bold text-white">
                {isRtl ? "اختر طريقة الدفع المناسبة" : "Choisissez votre Moyen de Paiement"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkoutError && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs">
                {checkoutError}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {/* Option 1: Moroccan Card via YouCan Pay */}
              <label
                onClick={() => setSelectedProvider("youcanpay")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 block ${
                  selectedProvider === "youcanpay"
                    ? "border-white bg-zinc-900 shadow-xs"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value="youcanpay"
                  checked={selectedProvider === "youcanpay"}
                  onChange={() => setSelectedProvider("youcanpay")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {isRtl ? "بطاقة بنكية مغربية (YouCan Pay)" : "Carte Bancaire Marocaine (YouCan Pay)"}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">100 MAD</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isRtl
                      ? "دعم فوري لجميع البطاقات الوطنية (CMI, CIH, Attijariwafa, BCP, BMCE, Barid Bank)."
                      : "Paiement direct en Dirhams (CMI, CIH, Attijari, BCP, BMCE, Barid Bank)."}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isRtl ? "بوابة محلية مغربية سريعة وآمنة" : "Passerelle Nationale Sécurisée"}</span>
                  </div>
                </div>
              </label>

              {/* Option 2: International Card via Paddle (MoR) */}
              <label
                onClick={() => setSelectedProvider("paddle")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 block ${
                  selectedProvider === "paddle"
                    ? "border-white bg-zinc-900 shadow-xs"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value="paddle"
                  checked={selectedProvider === "paddle"}
                  onChange={() => setSelectedProvider("paddle")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {isRtl ? "بطاقة دولية / Merchant of Record (Paddle)" : "Carte Internationale (Paddle MoR)"}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">$10 USD</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isRtl
                      ? "يقبل بطاقات Visa, Mastercard, Apple Pay, PayPal مع إدارة الضرائب الدولية تلقائياً."
                      : "Paiement international (Visa, Mastercard, Apple Pay, PayPal). Gestion TVA incluse."}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                    <Globe className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isRtl ? "مطابق لمعايير الامتثال الضريبي العالمي" : "Merchant of Record Global"}</span>
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-semibold cursor-pointer"
              >
                {isRtl ? "إلغاء" : "Annuler"}
              </button>
              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={isCheckingOut}
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-sm disabled:opacity-40 flex items-center gap-2 cursor-pointer"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isRtl ? "جاري تحضير بوابة الدفع..." : "Connexion sécurisée..."}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isRtl ? "متابعة للدفع الآمن" : "Procéder au Paiement"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={isAddDeviceModalOpen}
        onClose={() => setIsAddDeviceModalOpen(false)}
        currentDevices={subscription?.maxDevices ?? 1}
        onDeviceAdded={(newMax) => {
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
          fetchSubscription();
        }}
        isRtl={isRtl}
      />
    </div>
  );
}
