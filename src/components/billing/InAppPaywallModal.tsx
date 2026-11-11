"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldAlert,
  KeyRound,
  Laptop,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  Sparkles,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { playTapSound, playSuccessSound, playErrorSound } from "@/lib/audio";
import { KaspiBrandMark } from "../common/KaspiBrandMark";

export type PaywallMode = "expired" | "device_conflict";

export interface InAppPaywallModalProps {
  initialOpen?: boolean;
  initialMode?: PaywallMode;
}

export function triggerPaywallModal(mode: PaywallMode = "expired") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("open-paywall-modal", { detail: { mode } })
    );
  }
}

const COPY = {
  ar: {
    expiredTitle: "انتهت صلاحية اشتراك متجرك",
    expiredSubtitle: "لمتابعة عمليات البيع وإصدار الفواتير، يرجى تفعيل مفتاح ترخيص رسمي أو ترقية الاشتراك.",
    deviceTitle: "تم بلوغ حد أجهزة الكاشير المتزامنة",
    deviceSubtitle: "يوجد جهاز كاشير آخر نشط حالياً على هذا المتجر. يمكنك تحويل نقطة البيع إلى هذا الجهاز مجاناً فوراً، أو إضافة جهاز كاشير إضافي.",
    licenseInputPlaceholder: "مثال: KASPI-30D-XXXX-XXXX",
    activateBtn: "تفعيل فوري",
    activating: "جاري التفعيل...",
    activatedSuccess: (days: number) => `تم تفعيل الاشتراك بنجاح لمدة ${days} يوماً!`,
    planTitle: "باقة كسب برو الشاملة",
    planPrice: "200 درهم",
    planPeriod: "/ شهر",
    planFeature1: "كاشير ونقطة بيع سحابية غير محدودة",
    planFeature2: "إدارة المخزون والتنبيهات بالذكاء الاصطناعي",
    planFeature3: "جهاز كاشير إضافي: +150 درهم / شهر",
    switchDeviceBtn: "تحويل نقطة البيع النشطة لهذا الجهاز (مجاناً — بنقرة واحدة)",
    switching: "جاري تحويل الجلسة...",
    switchedSuccess: "تم تحويل نقطة البيع لهذا الجهاز بنجاح! يمكنك الآن المتابعة.",
    addDeviceBtn: "إضافة جهاز كاشير إضافي (+150 درهم/شهر)",
    goToBillingBtn: "فتح صفحة الفوترة والترقية",
    closeBtn: "إغلاق",
  },
  fr: {
    expiredTitle: "Votre abonnement KASPI a expiré",
    expiredSubtitle: "Pour continuer à encaisser et émettre des tickets, activez une clé de licence officielle ou renouvelez votre abonnement.",
    deviceTitle: "Limite de caisses simultanées atteinte",
    deviceSubtitle: "Une autre caisse est actuellement active sur votre boutique. Vous pouvez basculer la caisse sur cet appareil gratuitement en 1 clic, ou ajouter un poste supplémentaire.",
    licenseInputPlaceholder: "Ex: KASPI-30D-XXXX-XXXX",
    activateBtn: "Activer la licence",
    activating: "Activation...",
    activatedSuccess: (days: number) => `Licence activée avec succès pour ${days} jours !`,
    planTitle: "Forfait KASPI Pro Tout-en-Un",
    planPrice: "200 DH",
    planPeriod: "/ mois",
    planFeature1: "Caisse & terminal de vente illimités",
    planFeature2: "Gestion des stocks & Assistant IA",
    planFeature3: "Caisse supplémentaire : +150 DH / mois",
    switchDeviceBtn: "Basculer la caisse active sur cet appareil (Gratuit — 1 Clic)",
    switching: "Basculement en cours...",
    switchedSuccess: "Caisse basculée avec succès sur cet appareil ! Vous pouvez continuer.",
    addDeviceBtn: "Ajouter une caisse supplémentaire (+150 DH/mois)",
    goToBillingBtn: "Gérer l'abonnement & Facturation",
    closeBtn: "Fermer",
  },
  en: {
    expiredTitle: "Your KASPI Subscription Has Expired",
    expiredSubtitle: "To continue processing sales and printing receipts, activate an official license key or renew your plan.",
    deviceTitle: "Simultaneous Register Limit Reached",
    deviceSubtitle: "Another POS terminal is currently active on your store. You can switch the active register to this device for free in 1 click, or add another register.",
    licenseInputPlaceholder: "E.g. KASPI-30D-XXXX-XXXX",
    activateBtn: "Activate License",
    activating: "Activating...",
    activatedSuccess: (days: number) => `Subscription activated successfully for ${days} days!`,
    planTitle: "KASPI Pro All-in-One",
    planPrice: "200 MAD",
    planPeriod: "/ mo",
    planFeature1: "Unlimited Cloud POS & Sales Terminal",
    planFeature2: "Smart Inventory & AI Assistant",
    planFeature3: "Extra POS Register: +150 MAD / mo",
    switchDeviceBtn: "Switch Active Register to This Device (Free — 1 Click)",
    switching: "Switching Register...",
    switchedSuccess: "Active register successfully moved to this device! You may continue.",
    addDeviceBtn: "Add +1 Simultaneous POS Register (+150 MAD/mo)",
    goToBillingBtn: "Open Billing & Subscription",
    closeBtn: "Close",
  },
};

export const InAppPaywallModal: React.FC<InAppPaywallModalProps> = ({
  initialOpen = false,
  initialMode = "expired",
}) => {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as "ar" | "fr" | "en") || "ar";
  const isRtl = locale === "ar";
  const t = COPY[locale] || COPY.ar;

  const [isOpen, setIsOpen] = useState(initialOpen);
  const [mode, setMode] = useState<PaywallMode>(initialMode);
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleOpenEvent = useCallback((e: Event) => {
    const custom = e as CustomEvent<{ mode?: PaywallMode }>;
    if (custom.detail?.mode) {
      setMode(custom.detail.mode);
    }
    setSuccessMessage("");
    setErrorMessage("");
    setIsOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener("open-paywall-modal", handleOpenEvent);
    return () => {
      window.removeEventListener("open-paywall-modal", handleOpenEvent);
    };
  }, [handleOpenEvent]);

  if (!isOpen) return null;

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    if (!licenseKey.trim()) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/v1/billing/activate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: licenseKey.trim().toUpperCase() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        playErrorSound();
        setErrorMessage(data?.error || "Invalid license key");
        setLoading(false);
        return;
      }

      playSuccessSound();
      setSuccessMessage(t.activatedSuccess(data.durationDays || 30));
      setLicenseKey("");
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload();
      }, 1500);
    } catch {
      playErrorSound();
      setErrorMessage("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRegister = async () => {
    playTapSound();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/v1/devices/switch-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        playErrorSound();
        setErrorMessage(data?.error || "Failed to switch register");
        setLoading(false);
        return;
      }

      playSuccessSound();
      setSuccessMessage(t.switchedSuccess);
      setTimeout(() => {
        setIsOpen(false);
      }, 1200);
    } catch {
      playErrorSound();
      setErrorMessage("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToBilling = () => {
    playTapSound();
    setIsOpen(false);
    router.push(`/${locale}/dashboard/billing`);
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-zinc-800 bg-[#09090B] p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)] text-white">
        {/* Subtle Titanium Radial Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <KaspiBrandMark className="w-8 h-8" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                KASPI POS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {mode === "expired" ? "Subscription Required" : "Device Handover"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setIsOpen(false);
            }}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
            aria-label={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-6 space-y-6">
          {/* Main Title & Alert Badge */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                {mode === "expired" ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <Laptop className="w-5 h-5" />
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {mode === "expired" ? t.expiredTitle : t.deviceTitle}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">
              {mode === "expired" ? t.expiredSubtitle : t.deviceSubtitle}
            </p>
          </div>

          {/* Feedback Messages */}
          {successMessage && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode 1: Expired Subscription */}
          {mode === "expired" && (
            <div className="space-y-5">
              {/* License Key Quick Activation Input */}
              <form onSubmit={handleActivateLicense} className="space-y-2.5">
                <label className="block text-xs font-bold text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                    <span>تفعيل مفتاح ترخيص رسمي • Clé de licence</span>
                  </div>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder={t.licenseInputPlaceholder}
                    disabled={loading}
                    dir="ltr"
                    className="flex-1 h-11 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-xs placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all uppercase"
                  />
                  <button
                    type="submit"
                    disabled={loading || !licenseKey.trim()}
                    className="sheen-btn inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.activating}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t.activateBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Pro Plan Card Summary */}
              <div className="p-4 rounded-2xl border border-zinc-800/90 bg-zinc-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-zinc-400" />
                    <span className="font-extrabold text-sm text-white">
                      {t.planTitle}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1" dir="ltr">
                    <span className="font-mono text-lg font-black text-white">
                      {t.planPrice}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold">
                      {t.planPeriod}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{t.planFeature1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{t.planFeature2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-zinc-300 font-semibold">{t.planFeature3}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGoToBilling}
                  className="flex-1 sheen-btn inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <span>{t.goToBillingBtn}</span>
                  {isRtl ? (
                    <ArrowLeft className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Multi-Device Conflict */}
          {mode === "device_conflict" && (
            <div className="space-y-4">
              {/* Primary 1-Click Free Takeover Action */}
              <button
                type="button"
                onClick={handleSwitchRegister}
                disabled={loading}
                className="w-full sheen-btn inline-flex items-center justify-center gap-2.5 h-13 px-4 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs sm:text-sm font-extrabold transition-all cursor-pointer disabled:opacity-50 shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>{t.switching}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-zinc-950" />
                    <span>{t.switchDeviceBtn}</span>
                  </>
                )}
              </button>

              {/* Secondary Action: Add extra register (+150 MAD) */}
              <button
                type="button"
                onClick={handleGoToBilling}
                className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <span>{t.addDeviceBtn}</span>
                {isRtl ? (
                  <ArrowLeft className="w-3.5 h-3.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InAppPaywallModal;
