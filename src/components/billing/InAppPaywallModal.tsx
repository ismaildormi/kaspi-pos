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
  Loader2,
  Sparkles,
  CreditCard,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { playTapSound, playSuccessSound, playErrorSound } from "@/lib/audio";
import { KaspiBrandMark } from "../common/KaspiBrandMark";
import { AppleBackButton } from "../common/AppleBackButton";
import { KaspiGlassModalPortal } from "../common/KaspiGlassModalPortal";

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
    expiredSubtitle: "لمتابعة عمليات البيع وإصدار الفواتير، يرجى تفعيل مفتاح ترخيص رسمي أو تفعيل التجديد التلقائي.",
    deviceTitle: "تم بلوغ حد أجهزة الكاشير المتزامنة",
    deviceSubtitle: "يوجد جهاز كاشير آخر نشط حالياً على هذا المتجر. يمكنك تحويل نقطة البيع إلى هذا الجهاز مجاناً فوراً، أو إضافة جهاز كاشير إضافي.",
    licenseInputPlaceholder: "مثال: KASPI-30D-XXXX-XXXX",
    activateBtn: "تفعيل فوري",
    activating: "جاري التفعيل...",
    activatedSuccess: (days: number) => `تم تفعيل الاشتراك بنجاح لمدة ${days} يوماً!`,
    planTitle: "باقة كسب برو الشاملة (100% جميع الميزات)",
    planPrice: "200 MAD",
    planPeriod: "/ شهر",
    planFeature1: "الجهاز الأول (1st Poste): 200 درهم/شهر شاملة 100% من الميزات",
    planFeature2: "كل جهاز كاشير إضافي (Extra Poste): +150 درهم/شهر فقط",
    planFeature3: "تفويض تجديد تلقائي مشفر (PCI-DSS 4.0.1 • NAPS / Stripe / YouCanPay) يُلغى بنقرة واحدة متى شئت",
    switchDeviceBtn: "تحويل نقطة البيع النشطة لهذا الجهاز (مجاناً — بنقرة واحدة)",
    switching: "جاري تحويل الجلسة...",
    switchedSuccess: "تم تحويل نقطة البيع لهذا الجهاز بنجاح! يمكنك الآن المتابعة.",
    addDeviceBtn: "إضافة جهاز كاشير إضافي (+150 درهم/شهر)",
    goToBillingBtn: "فتح بوابة الاشتراك والفوترة الآمنة",
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
    planTitle: "Forfait KASPI Pro Tout-en-Un (100% Complet)",
    planPrice: "200 MAD",
    planPeriod: "/ mois",
    planFeature1: "1er Poste : 200 MAD/mois avec 100% des fonctionnalités incluses",
    planFeature2: "Poste supplémentaire : +150 MAD / mois par caisse additionnelle",
    planFeature3: "Renouvellement automatique sécurisé (PCI-DSS 4.0.1 • NAPS / Stripe) annulable en 1 clic",
    switchDeviceBtn: "Basculer la caisse active sur cet appareil (Gratuit — 1 Clic)",
    switching: "Basculement en cours...",
    switchedSuccess: "Caisse basculée avec succès sur cet appareil ! Vous pouvez continuer.",
    addDeviceBtn: "Ajouter une caisse supplémentaire (+150 MAD/mois)",
    goToBillingBtn: "Ouvrir le Portail d'Abonnement & Facturation",
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
    planTitle: "KASPI Pro All-in-One (100% Features)",
    planPrice: "200 MAD",
    planPeriod: "/ mo",
    planFeature1: "1st Poste: 200 MAD/mo with 100% of features unlocked",
    planFeature2: "Extra POS Poste: +150 MAD / mo per additional register",
    planFeature3: "Tokenized Auto-Renewal Mandate (PCI-DSS 4.0.1 • Stripe / NAPS) — cancel in 1 click anytime",
    switchDeviceBtn: "Switch Active Register to This Device (Free — 1 Click)",
    switching: "Switching Register...",
    switchedSuccess: "Active register successfully moved to this device! You may continue.",
    addDeviceBtn: "Add +1 Simultaneous POS Register (+150 MAD/mo)",
    goToBillingBtn: "Open Billing & Subscription Portal",
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
    <KaspiGlassModalPortal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div
        data-kaspi-paywall-modal="true"
        className="kaspi-opaque-glass-modal kaspi-polar-aurora-orbit relative w-full max-w-xl max-h-[90vh] overflow-y-auto my-auto rounded-3xl p-6 sm:p-8 shadow-2xl text-[var(--kaspi-text-primary)]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.12] gap-3">
          <div className="flex items-center gap-3">
            <KaspiBrandMark size="sm" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm tracking-tight text-[var(--kaspi-text-primary)]">
                KASPI POS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {mode === "expired" ? "200 MAD / +150 MAD" : "Device Handover"}
              </span>
            </div>
          </div>

          <AppleBackButton
            onClick={() => {
              playTapSound();
              setIsOpen(false);
            }}
            locale={isRtl ? "ar" : "fr"}
            title={t.closeBtn}
          />
        </div>

        {/* Modal Body */}
        <div className="mt-5 space-y-5">
          {/* Main Title & Alert Badge */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl kaspi-glass-btn text-emerald-400">
                {mode === "expired" ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <Laptop className="w-5 h-5" />
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[var(--kaspi-text-primary)] tracking-tight">
                {mode === "expired" ? t.expiredTitle : t.deviceTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--kaspi-text-secondary)]">
              {mode === "expired" ? t.expiredSubtitle : t.deviceSubtitle}
            </p>
          </div>

          {/* Feedback Messages */}
          {successMessage && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode 1: Expired Subscription */}
          {mode === "expired" && (
            <div className="space-y-4">
              {/* License Key Quick Activation Input */}
              <form onSubmit={handleActivateLicense} className="space-y-2">
                <label className="block text-xs font-bold text-[var(--kaspi-text-secondary)]">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
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
                    className="flex-1 h-11 px-3.5 rounded-xl kaspi-translucent-input font-mono text-xs uppercase focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !licenseKey.trim()}
                    className="kaspi-glass-btn inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.activating}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.activateBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Pro Plan Card Summary */}
              <div className="p-4 rounded-2xl kaspi-frosted-card space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-sm text-[var(--kaspi-text-primary)]">
                      {t.planTitle}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1" dir="ltr">
                    <span className="font-mono text-lg font-black text-[var(--kaspi-text-primary)]">
                      {t.planPrice}
                    </span>
                    <span className="text-xs text-[var(--kaspi-text-muted)] font-semibold">
                      {t.planPeriod}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[var(--kaspi-text-secondary)]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{t.planFeature1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{t.planFeature2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="font-semibold">{t.planFeature3}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleGoToBilling}
                  className="flex-1 kaspi-emerald-checkout-btn inline-flex items-center justify-center gap-2 h-12 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
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
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={handleSwitchRegister}
                disabled={loading}
                className="w-full kaspi-emerald-checkout-btn inline-flex items-center justify-center gap-2.5 h-12 px-4 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer disabled:opacity-50 shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.switching}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>{t.switchDeviceBtn}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGoToBilling}
                className="w-full kaspi-glass-btn inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
    </KaspiGlassModalPortal>
  );
};

export default InAppPaywallModal;
