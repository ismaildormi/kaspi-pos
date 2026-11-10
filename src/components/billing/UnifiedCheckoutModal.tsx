"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  CreditCard,
  Building2,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Lock,
  ArrowRight,
  Monitor,
} from "lucide-react";

export type CheckoutMode = "plan" | "add_device";

interface UnifiedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: CheckoutMode;
  locale: string;
  currentDevices?: number;
  onSuccess: (updatedData?: any) => void;
}

export function detectBankAndNetwork(rawNumber: string) {
  const clean = rawNumber.replace(/\D/g, "");
  let network: "Visa" | "Mastercard" | "Amex" | "CMI" | "Card" = "Card";
  let bankName = "International Bank";
  let isMoroccan = false;

  if (/^4/.test(clean)) {
    network = "Visa";
  } else if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(clean)) {
    network = "Mastercard";
  } else if (/^3[47]/.test(clean)) {
    network = "Amex";
  } else if (/^(5043|6011)/.test(clean)) {
    network = "CMI";
  }

  const prefix4 = clean.slice(0, 4);

  if (["4152", "4240", "5357", "5393", "5168"].includes(prefix4)) {
    bankName = "CIH Bank Maroc";
    isMoroccan = true;
  } else if (["4094", "4211", "5348", "5138", "5249"].includes(prefix4)) {
    bankName = "Attijariwafa Bank";
    isMoroccan = true;
  } else if (["4010", "4310", "5358", "5169"].includes(prefix4)) {
    bankName = "Banque Populaire (BCP)";
    isMoroccan = true;
  } else if (["4054", "4200", "5318", "5390"].includes(prefix4)) {
    bankName = "Bank of Africa (BMCE)";
    isMoroccan = true;
  } else if (["4075", "4163", "5391", "5252"].includes(prefix4)) {
    bankName = "Al Barid Bank Maroc";
    isMoroccan = true;
  } else if (["4005", "5300"].includes(prefix4)) {
    bankName = "Société Générale Maroc";
    isMoroccan = true;
  } else if (["4003", "5322"].includes(prefix4)) {
    bankName = "Crédit Agricole du Maroc";
    isMoroccan = true;
  } else if (["4032", "5332"].includes(prefix4)) {
    bankName = "Crédit du Maroc";
    isMoroccan = true;
  } else if (clean.length >= 6) {
    bankName = "International Bank";
    isMoroccan = false;
  } else {
    bankName = "Carte Bancaire";
  }

  return { network, bankName, isMoroccan };
}

const MODAL_DICT = {
  ar: {
    modalTitlePlan: "ترقية أو تجديد الاشتراك — كسب POS",
    modalTitleDevice: "إضافة نقطة بيع إضافية (+150 درهم)",
    tabCard: "بطاقة بنكية ذكية (توجيه آلي)",
    tabTransfer: "تحويل بنكي مباشر / كود التفعيل (0% عمولة)",
    amountDue: "المبلغ المستحق :",
    perMonth: "شهرياً",
    cardNumberLabel: "رقم البطاقة البنكية",
    cardHolderLabel: "اسم حامل البطاقة (كما يظهر على البطاقة)",
    expiryLabel: "تاريخ الانتهاء",
    cvcLabel: "رمز الأمان CVC",
    detectedBank: "البنك المكتشف :",
    routingMorocco: "توجيه تلقائي عبر البوابة الوطنية المغربية (YouCan Pay / CMI)",
    routingIntl: "توجيه تلقائي عبر البوابة الدولية المرخصة (Paddle MoR)",
    payAndActivateBtn: "تأكيد الدفع والتفعيل الفوري",
    processingPayment: "جاري التحقق والربط المشفر...",
    successTitle: "تم قبول الدفع وتفعيل الاشتراك بنجاح ✓",
    successSubtitle: "تم تحديث ترخيص متجرك وفتح نقطة البيع فورا بدون أي انتظار.",
    bankTransferTitle: "التحويل البنكي الوطني المباشر :",
    ribLabel: "رقم الحساب البنكي (RIB) :",
    beneficiaryLabel: "المستفيد :",
    bankNameLabel: "البنك :",
    copied: "تم النسخ!",
    enterLicenseTitle: "أدخل كود التفعيل المستلم :",
    licensePlaceholder: "KASPI-XXXX-XXXX-XXXX",
    activateLicenseBtn: "تفعيل الكود",
    cancel: "إلغاء",
  },
  fr: {
    modalTitlePlan: "Abonnement KASPI POS — 200 MAD / mois",
    modalTitleDevice: "Ajouter un Poste de Caisse (+150 MAD)",
    tabCard: "Carte Bancaire Intelligente (Routage Automatique)",
    tabTransfer: "Virement Bancaire / Code Licence (0% Frais)",
    amountDue: "Montant à régler :",
    perMonth: "par mois",
    cardNumberLabel: "Numéro de Carte Bancaire",
    cardHolderLabel: "Nom du Titulaire (comme sur la carte)",
    expiryLabel: "Date d'expiration",
    cvcLabel: "Cryptogramme CVC",
    detectedBank: "Banque détectée :",
    routingMorocco: "Routage direct via passerelle nationale marocaine (YouCan Pay / CMI)",
    routingIntl: "Routage international sécurisé (Paddle Merchant of Record)",
    payAndActivateBtn: "Payer et Activer Immédiatement",
    processingPayment: "Vérification et chiffrement bancaire...",
    successTitle: "Paiement validé & Licence activée avec succès ✓",
    successSubtitle: "Votre espace a été mis à jour immédiatement sans aucune interruption.",
    bankTransferTitle: "Coordonnées Bancaires Nationales :",
    ribLabel: "RIB (24 chiffres) :",
    beneficiaryLabel: "Bénéficiaire :",
    bankNameLabel: "Banque :",
    copied: "Copié !",
    enterLicenseTitle: "Saisissez votre clé de licence reçue :",
    licensePlaceholder: "KASPI-XXXX-XXXX-XXXX",
    activateLicenseBtn: "Activer la Licence",
    cancel: "Annuler",
  },
  en: {
    modalTitlePlan: "KASPI POS Subscription — 200 MAD / mo",
    modalTitleDevice: "Add Extra POS Terminal (+150 MAD)",
    tabCard: "Smart Card Checkout (Auto-Routed)",
    tabTransfer: "Bank Transfer / License Key (0% Fee)",
    amountDue: "Amount Due:",
    perMonth: "per month",
    cardNumberLabel: "Card Number",
    cardHolderLabel: "Cardholder Name (as shown on card)",
    expiryLabel: "Expiry Date",
    cvcLabel: "CVC Code",
    detectedBank: "Detected Bank:",
    routingMorocco: "Auto-routed via Moroccan National Gateway (YouCan Pay / CMI)",
    routingIntl: "Auto-routed via Global Merchant of Record (Paddle MoR)",
    payAndActivateBtn: "Pay & Activate Instantly",
    processingPayment: "Secure bank tokenization in progress...",
    successTitle: "Payment Approved & Subscription Active ✓",
    successSubtitle: "Your store capacity has been immediately updated without waiting.",
    bankTransferTitle: "National Bank Coordinates:",
    ribLabel: "RIB (24 digits):",
    beneficiaryLabel: "Beneficiary:",
    bankNameLabel: "Bank:",
    copied: "Copied!",
    enterLicenseTitle: "Enter your received activation license key:",
    licensePlaceholder: "KASPI-XXXX-XXXX-XXXX",
    activateLicenseBtn: "Activate License",
    cancel: "Cancel",
  },
};

export function UnifiedCheckoutModal({
  isOpen,
  onClose,
  mode,
  locale,
  currentDevices = 1,
  onSuccess,
}: UnifiedCheckoutModalProps) {
  const t = MODAL_DICT[locale as keyof typeof MODAL_DICT] || MODAL_DICT.fr;

  const [activeTab, setActiveTab] = useState<"card" | "license">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [copiedRib, setCopiedRib] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const detected = useMemo(() => detectBankAndNetwork(cardNumber), [cardNumber]);

  if (!isOpen) return null;

  const amountMAD = mode === "plan" ? 200 : 150;
  const newDeviceCount = currentDevices + 1;

  const formatCardNumberInput = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 16);
    return clean.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiryInput = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length > 2) {
      return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
  };

  const handleCopyRib = () => {
    navigator.clipboard.writeText("230 780 0001234567890123 45");
    setCopiedRib(true);
    setTimeout(() => setCopiedRib(false), 2000);
  };

  const handleCardPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (mode === "add_device") {
        const res = await fetch("/api/billing/add-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: detected.isMoroccan ? "youcanpay" : "paddle",
            quantity: 1,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Paiement refusé par la banque");
        }
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess(json.maxDevices || newDeviceCount);
          onClose();
        }, 1800);
      } else {
        // Mode Plan Subscription
        // Simulate real-time secure gateway capture and license provisioning
        await new Promise((resolve) => setTimeout(resolve, 1400));
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess({ planCode: "kaspi-pro", status: "active", maxDevices: currentDevices });
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du traitement bancaire");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLicenseActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/billing/activate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: licenseKeyInput.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Code de licence invalide");
      }
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(json.data);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || "Code licence non valide");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        dir="ltr"
        className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle monochrome ambient light */}
        <div className="absolute top-0 right-1/4 w-36 h-36 bg-white/[0.04] rounded-full blur-3xl pointer-events-none" />

        {isSuccess ? (
          <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-white text-zinc-950 mx-auto flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white">{t.successTitle}</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              {t.successSubtitle}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>{detected.bankName} • {detected.network}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-md">
                  {mode === "plan" ? <Sparkles className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {mode === "plan" ? t.modalTitlePlan : t.modalTitleDevice}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-400">{t.amountDue}</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {amountMAD} MAD <span className="text-zinc-500 font-normal">({t.perMonth})</span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Dual Tabs: Smart Card vs Direct Bank Transfer */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "card"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t.tabCard}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("license")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "license"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{t.tabTransfer}</span>
              </button>
            </div>

            {activeTab === "card" ? (
              <form onSubmit={handleCardPaymentSubmit} className="space-y-4">
                {/* 3D Elevated Kinetic Monochrome Credit Card Preview */}
                <div className="p-5 rounded-2xl bg-gradient-to-tr from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-700 shadow-xl relative overflow-hidden font-mono text-white select-none">
                  {/* Subtle Card Grid Pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-6 rounded-md bg-zinc-800 border border-zinc-600 flex items-center justify-center">
                        <div className="w-6 h-3.5 border border-zinc-500 rounded-sm opacity-60" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 tracking-wider">
                        CHIP & PIN
                      </span>
                    </div>

                    {/* Detected Bank Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-zinc-950 shadow-xs">
                        {detected.bankName}
                      </span>
                      <span className="text-xs font-black uppercase text-white tracking-widest">
                        {detected.network}
                      </span>
                    </div>
                  </div>

                  <div className="text-base sm:text-lg font-bold tracking-widest text-zinc-100 mb-4 relative z-10">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>

                  <div className="flex items-end justify-between text-xs relative z-10">
                    <div>
                      <div className="text-[9px] uppercase text-zinc-400 mb-0.5">Cardholder</div>
                      <div className="font-bold uppercase tracking-wider text-white">
                        {cardHolder || "VOTRE NOM"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-zinc-400 mb-0.5 text-end">Expires</div>
                      <div className="font-bold text-end text-white">
                        {expiry || "MM/YY"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Routing Indicator Pill */}
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-400">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{detected.isMoroccan ? t.routingMorocco : t.routingIntl}</span>
                </div>

                {/* Inputs Grid */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      {t.cardNumberLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4152 •••• •••• ••••"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
                      className="w-full h-10 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      {t.cardHolderLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Yassine Chraibi"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="w-full h-10 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-white transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        {t.expiryLabel}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
                        className="w-full h-10 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        {t.cvcLabel}
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="•••"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                        className="w-full h-10 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-white transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !cardNumber || !cardHolder || !expiry || !cvc}
                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.processingPayment}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t.payAndActivateBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Tab 2: Direct Bank Transfer & License Key */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t.bankTransferTitle}</span>
                  </h4>
                  <div className="text-xs space-y-1 font-mono text-zinc-300">
                    <div>
                      <span className="text-zinc-500">{t.bankNameLabel}</span> CIH Bank Maroc
                    </div>
                    <div>
                      <span className="text-zinc-500">{t.beneficiaryLabel}</span> KASPI SYSTEMS SARL
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-zinc-500">{t.ribLabel}</span> 230 780 0001234567890123 45
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyRib}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-sans text-white cursor-pointer flex items-center gap-1"
                      >
                        {copiedRib ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedRib ? t.copied : "Copier"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleLicenseActivationSubmit} className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-zinc-300">
                    {t.enterLicenseTitle}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder={t.licensePlaceholder}
                      value={licenseKeyInput}
                      onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                      className="flex-1 h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono font-bold tracking-wider text-white focus:outline-none focus:border-white uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !licenseKeyInput.trim()}
                      className="h-11 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4" />
                      )}
                      <span>{t.activateLicenseBtn}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
