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
  Zap,
  Receipt,
  AlertTriangle,
} from "lucide-react";

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
  const [selectedProvider, setSelectedProvider] = useState<"paddle" | "youcanpay">("youcanpay");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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
          planId: "pro",
          provider: selectedProvider,
          billingInterval: "monthly",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Failed to initiate checkout session");
      }

      // Redirect to provider checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setCheckoutError(err?.message || "Checkout initialization error");
      setIsCheckingOut(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isRtl ? "نشط ومفعل" : "Actif & Valide"}</span>
          </span>
        );
      case "trialing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{isRtl ? "فترة تجريبية" : "Période d'essai"}</span>
          </span>
        );
      case "past_due":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isRtl ? "متأخر في السداد" : "Paiement en attente"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span>{status || "Non souscrit"}</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/pos`}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
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
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CreditCard className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-slate-900">
                {isRtl ? "الاشتراكات والفواتير" : "Abonnement & Facturation"}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? "خطة كسب الشاملة — $10 شهرياً" : "Formule KASPI Tout-en-Un — 10$/mois"}</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              {isRtl
                ? "برنامج كاشير سحابي متكامل بدون أي رسوم إضافية"
                : "La Solution POS Complète sans aucun frais caché"}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isRtl
                ? "تفعيل فوري لجميع ميزات نقاط البيع، المخزون، الفواتير، برامج الولاء، وتطبيق الذكاء الاصطناعي بسعر موحد 100 درهم فقط شهرياً."
                : "Toutes les fonctionnalités avancées (POS, Stock, Factures ICE, Fidélité, IA) pour 100 MAD/mois sans surprise."}
            </p>
          </div>
        </div>

        {/* Current Plan Card & Status */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {subscription?.planName || "KASPI All-in-One"}
                </h3>
                {getStatusBadge(subscription?.status)}
              </div>
              <p className="text-xs text-slate-500">
                {isRtl
                  ? `بوابة الدفع المسجلة: ${subscription?.provider || "YouCan Pay / Paddle"}`
                  : `Passerelle : ${subscription?.provider?.toUpperCase() || "MANUAL"}`}
              </p>
            </div>

            <div className="text-right rtl:text-left">
              <div className="text-2xl font-black text-slate-900">
                100 <span className="text-sm font-bold text-slate-500">MAD / {isRtl ? "شهر" : "mois"}</span>
              </div>
              <span className="text-xs text-slate-400">($10 USD / {isRtl ? "شهر" : "mois"})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">
                {isRtl ? "الأيام المتبقية في الفترة" : "Jours Restants"}
              </span>
              <span className="text-xl font-bold text-emerald-700">
                {subscription ? `${subscription.daysRemaining} ${isRtl ? "يوم" : "jours"}` : "—"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">
                {isRtl ? "تاريخ التجديد القادم" : "Prochain Renouvellement"}
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString(locale)
                  : subscription?.trialEndAt
                  ? new Date(subscription.trialEndAt).toLocaleDateString(locale)
                  : "30 jours"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">
                {isRtl ? "حالة الضرائب والفواتير" : "Conformité Fiscale"}
              </span>
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span>{isRtl ? "تلقائي وبدون أعباء" : "TVA 100% Gérée"}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {isRtl
                  ? "دفع آمن مع إمكانية الإلغاء في أي وقت بنقرة واحدة"
                  : "Paiement 100% sécurisé et résiliation à tout moment"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>{isRtl ? "ترقية / تجديد الاشتراك" : "Renouveler / S'abonner"}</span>
            </button>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>{isRtl ? "سجل المدفوعات والفواتير" : "Historique des Transactions"}</span>
          </h3>

          {payments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {isRtl ? "لا توجد معاملات دفع سابقة حتى الآن." : "Aucun historique de paiement pour le moment."}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">
                      {p.amount} {p.currency}
                    </span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-slate-500 uppercase">{p.provider}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{new Date(p.date).toLocaleDateString(locale)}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Checkout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-base font-bold text-slate-900">
                {isRtl ? "اختر طريقة الدفع المناسبة" : "Choisissez votre Moyen de Paiement"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkoutError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                {checkoutError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              {/* Option 1: Moroccan Card via YouCan Pay */}
              <label
                onClick={() => setSelectedProvider("youcanpay")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 block ${
                  selectedProvider === "youcanpay"
                    ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value="youcanpay"
                  checked={selectedProvider === "youcanpay"}
                  onChange={() => setSelectedProvider("youcanpay")}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {isRtl ? "بطاقة بنكية مغربية (YouCan Pay)" : "Carte Bancaire Marocaine (YouCan Pay)"}
                    </span>
                    <span className="text-xs font-bold text-emerald-800">100 MAD</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isRtl
                      ? "دعم فوري لجميع البطاقات الوطنية (CMI, CIH, Attijariwafa, BCP, BMCE, Barid Bank)."
                      : "Paiement direct en Dirhams (CMI, CIH, Attijari, BCP, BMCE, Barid Bank)."}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isRtl ? "بوابة محلية مغربية سريعة وآمنة" : "Passerelle Nationale Sécurisée"}</span>
                  </div>
                </div>
              </label>

              {/* Option 2: International Card via Paddle (MoR) */}
              <label
                onClick={() => setSelectedProvider("paddle")}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 block ${
                  selectedProvider === "paddle"
                    ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  value="paddle"
                  checked={selectedProvider === "paddle"}
                  onChange={() => setSelectedProvider("paddle")}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {isRtl ? "بطاقة دولية / Merchant of Record (Paddle)" : "Carte Internationale (Paddle MoR)"}
                    </span>
                    <span className="text-xs font-bold text-slate-800">$10 USD</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isRtl
                      ? "يقبل بطاقات Visa, Mastercard, Apple Pay, PayPal مع إدارة الضرائب الدولية تلقائياً."
                      : "Paiement international (Visa, Mastercard, Apple Pay, PayPal). Gestion TVA incluse."}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isRtl ? "مطابق لمعايير الامتثال الضريبي العالمي" : "Merchant of Record Global"}</span>
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                {isRtl ? "إلغاء" : "Annuler"}
              </button>
              <button
                type="button"
                onClick={handleStartCheckout}
                disabled={isCheckingOut}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
    </div>
  );
}
