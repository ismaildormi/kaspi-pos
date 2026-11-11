"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Building2,
  Phone,
  CreditCard,
  Upload,
  Check,
  X,
  Loader2,
  KeyRound,
  Wallet,
  Clock,
  Radio,
  Landmark,
  MessageSquare,
} from "lucide-react";
import { compressImage } from "@/lib/storage/compression-engine";
import { useAppDictionary } from "@/i18n/schema";
import { usePosStore } from "@/client/store/usePosStore";

interface OwnerVaultData {
  email: string;
  fullName: string;
  logoUrl: string;
  shopName: string;
  ownerPhone: string;
  bankName: string;
  bankRib: string;
  beneficiaryName: string;
  tpeIp: string;
  tpeTerminalId: string;
  selectedGateway: string;
  newPassword?: string;
  nightlyReportHour?: string;
  dailyReportEnabled?: boolean;
  monthlyReportEnabled?: boolean;
}

interface OwnerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: { shopName?: string; logoUrl?: string }) => void;
}

const MOROCCAN_BANKS = [
  { id: "attijariwafa", label: "Attijariwafa Bank (التجاري وفا بنك)" },
  { id: "bcp", label: "Banque Populaire (البنك الشعبي)" },
  { id: "bmce", label: "Bank of Africa / BMCE (بنك أفريقيا)" },
  { id: "cih", label: "CIH Bank (بنك القرض العقاري والسياحي)" },
  { id: "cdm", label: "Crédit du Maroc (مصرف المغرب)" },
  { id: "sgmb", label: "Société Générale Maroc (الشركة العامة)" },
  { id: "cam", label: "Crédit Agricole du Maroc (القرض الفلاحي)" },
  { id: "albarid", label: "Al Barid Bank (البريد بنك)" },
  { id: "cfg", label: "CFG Bank (سي إف جي بنك)" },
];

const GATEWAYS = [
  { id: "cash_only", label: "Cash & Checks Only", desc: "بدون بوابة إلكترونية" },
  { id: "cmi_tpe", label: "CMI TPE Direct", desc: "جهاز الدفع الإلكتروني المباشر" },
  { id: "youcanpay", label: "YouCan Pay Maroc", desc: "البوابة المغربية للبطاقات البنكية" },
  { id: "stripe", label: "Stripe International", desc: "بطاقات دولية وفيزا/ماستركارد" },
];

export function OwnerProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: OwnerProfileModalProps) {
  const { locale } = useAppDictionary();

  // Step 1: Gate, Step 2: Vault
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [storeLogoUrl, setStoreLogoUrl] = useState<string>("");
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      // 1. Memory / Store
      try {
        const posTenantLogo = usePosStore.getState().tenantInfo?.logoUrl;
        if (posTenantLogo) {
          setStoreLogoUrl(posTenantLogo);
          return;
        }
      } catch {}

      // 2. localStorage
      if (typeof window !== "undefined") {
        const saved =
          localStorage.getItem("kaspi_store_logo") ||
          localStorage.getItem("kaspi_store_profile_logo") ||
          "";
        if (saved) {
          setStoreLogoUrl(saved);
          return;
        }
      }

      // 3. API
      try {
        const res = await fetch("/api/v1/settings");
        if (res.ok) {
          const data = await res.json();
          if (data?.settings?.logoUrl) {
            setStoreLogoUrl(data.settings.logoUrl);
            if (typeof window !== "undefined") {
              localStorage.setItem("kaspi_store_logo", data.settings.logoUrl);
            }
          }
        }
      } catch {}
    };

    fetchLogo();

    const handleProfileUpdate = (e: any) => {
      const url = e.detail?.logoUrl;
      if (url) setStoreLogoUrl(url);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("kaspi_store_profile_updated", handleProfileUpdate);
      window.addEventListener("kaspi-Head-Profile-Updated", handleProfileUpdate);
      window.addEventListener("storage", fetchLogo);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("kaspi_store_profile_updated", handleProfileUpdate);
        window.removeEventListener("kaspi-Head-Profile-Updated", handleProfileUpdate);
        window.removeEventListener("storage", fetchLogo);
      }
    };
  }, [isOpen]);

  // Vault form state
  const [vaultData, setVaultData] = useState<OwnerVaultData>({
    email: "",
    fullName: "",
    logoUrl: "",
    shopName: "",
    ownerPhone: "",
    bankName: "attijariwafa",
    bankRib: "",
    beneficiaryName: "",
    tpeIp: "",
    tpeTerminalId: "",
    selectedGateway: "cash_only",
    newPassword: "",
    nightlyReportHour: "22:00",
    dailyReportEnabled: true,
    monthlyReportEnabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleUnlockGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsVerifying(true);
    setGateError(null);

    try {
      const res = await fetch("/api/v1/owner/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlock", password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            (locale === "ar"
              ? "كلمة المرور غير صحيحة"
              : locale === "en"
              ? "Invalid account password"
              : "Mot de passe incorrect")
        );
      }

      setVaultData((prev) => ({
        ...prev,
        ...data.vault,
        bankName: data.vault?.bankName || prev.bankName,
      }));
      setIsUnlocked(true);
    } catch (err: any) {
      setGateError(err.message || "Erreur de déverrouillage");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingLogo(true);
    try {
      const compressed = await compressImage(file, {
        maxDimension: 512,
        quality: 0.85,
        targetSizeKB: 40,
      });

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setVaultData((prev) => ({ ...prev, logoUrl: base64 }));
      };
      reader.readAsDataURL(compressed.blob);
    } catch (err) {
      console.error("Logo compression error:", err);
    } finally {
      setIsCompressingLogo(false);
    }
  };

  const handleSaveVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch("/api/v1/owner/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          password,
          data: vaultData,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur de sauvegarde");
      }

      setSaveSuccess(
        locale === "ar"
          ? "تم حفظ وتأمين بيانات الخزنة والشعار بنجاح"
          : locale === "en"
          ? "Vault & logo updated successfully"
          : "Données du coffre-fort et logo mis à jour avec succès"
      );

      if (onProfileUpdated) {
        onProfileUpdated({
          shopName: vaultData.shopName,
          logoUrl: vaultData.logoUrl,
        });
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("kaspi_store_profile_updated", {
            detail: {
              shopName: vaultData.shopName,
              logoUrl: vaultData.logoUrl,
            },
          })
        );
      }
    } catch (err: any) {
      setSaveError(err.message || "Erreur");
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setIsUnlocked(false);
    setPassword("");
    setGateError(null);
    setSaveSuccess(null);
    setSaveError(null);
    onClose();
  };

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-6 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            {/* Live Kinetic Profile Avatar */}
            <div className="relative group shrink-0">
              <div className="w-12 h-12 rounded-2xl border border-white/20 bg-zinc-900 shadow-[0_8px_24px_rgba(255,255,255,0.08)] animate-float group-hover:scale-105 transition-all overflow-hidden relative shrink-0 flex items-center justify-center">
                {vaultData.logoUrl || storeLogoUrl ? (
                  <img
                    src={vaultData.logoUrl || storeLogoUrl}
                    alt="Store Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-white font-mono font-black text-lg">
                    {(vaultData.shopName || "K")[0]?.toUpperCase() || "K"}
                  </div>
                )}
              </div>
              <span
                className={`absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-zinc-950 ${
                  isUnlocked ? "bg-emerald-400" : "bg-white/40"
                } shadow-xs`}
              />
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>
                  {locale === "ar"
                    ? "خزنة المالك والملف الشخصي"
                    : locale === "en"
                    ? "Owner Profile & Secure Vault"
                    : "Profil Propriétaire & Coffre-Fort"}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-200 border border-white/15 inline-flex items-center gap-1.5">
                  {isUnlocked ? (
                    <Unlock className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-zinc-400" />
                  )}
                  <span>
                    {locale === "ar"
                      ? isUnlocked
                        ? "مفتوحة"
                        : "مقفلة"
                      : locale === "fr"
                      ? isUnlocked
                        ? "DÉVERROUILLÉ"
                        : "VERROUILLÉ"
                      : isUnlocked
                      ? "UNLOCKED"
                      : "LOCKED"}
                  </span>
                </span>
              </h3>
              <p
                dir="auto"
                style={{ unicodeBidi: "plaintext" }}
                className="text-xs text-zinc-400 mt-0.5"
              >
                {locale === "ar"
                  ? "حماية مشددة للبيانات البنكية ورقم المالك عن الموظفين"
                  : locale === "en"
                  ? "Protected financial details & owner phone hidden from cashiers"
                  : "Données financières protégées et masquées aux employés"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                type="button"
                onClick={() => setIsUnlocked(false)}
                title={locale === "ar" ? "قفل الخزنة" : locale === "en" ? "Lock Vault" : "Verrouiller"}
                className="keycap-3d text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3 h-3 text-zinc-400" />
                <span>{locale === "ar" ? "← قفل" : locale === "en" ? "← Lock" : "← Verrouiller"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleModalClose}
              className="keycap-3d px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <span>{locale === "ar" ? "← رجوع" : locale === "en" ? "← Back" : "← Retour"}</span>
            </button>
          </div>
        </div>

        {/* ====================================================================
           STEP 1: MANDATORY PASSWORD GATE
           ==================================================================== */}
        {!isUnlocked ? (
          <form onSubmit={handleUnlockGate} className="space-y-5 py-2">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
              <div
                dir="auto"
                style={{ unicodeBidi: "plaintext" }}
                className="text-xs text-zinc-300 leading-relaxed"
              >
                {locale === "ar"
                  ? "أدخل كلمة مرور حسابك للتأكد من هويتك كمالك للمتجر وفتح الخزنة المالية الحساسة."
                  : locale === "en"
                  ? "Enter your account password to verify your owner identity and unlock the sensitive financial vault."
                  : "Entrez votre mot de passe pour confirmer votre identité propriétaire et ouvrir le coffre-fort."}
              </div>
            </div>

            {gateError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                {gateError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                {locale === "ar" ? "كلمة مرور الحساب" : locale === "en" ? "Account Password" : "Mot de passe du compte"}
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 ps-4 pe-11 bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl text-xs sm:text-sm text-white focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isVerifying}
                onClick={(e) => {
                  if (!password.trim()) {
                    e.preventDefault();
                    passwordInputRef.current?.focus();
                  }
                }}
                className="sheen-btn keycap-3d w-full h-12 inline-flex items-center justify-center gap-2 px-6 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs sm:text-sm font-black transition cursor-pointer shadow-md active:scale-[0.98]"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                ) : (
                  <Lock className="w-4 h-4 text-zinc-950" />
                )}
                <span>
                  {locale === "ar"
                    ? "فتح الخزنة المشفرة"
                    : locale === "en"
                    ? "Unlock Encrypted Vault"
                    : "Déverrouiller le Coffre"}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* ====================================================================
             STEP 2: UNLOCKED SENSITIVE VAULT & 4 SECTIONS
             ==================================================================== */
          <form onSubmit={handleSaveVault} className="space-y-5 max-h-[72vh] overflow-y-auto pe-1">
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                {saveError}
              </div>
            )}

            {/* SECTION 1: Store Identity & Profile */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-zinc-300" />
                <span>
                  {locale === "ar" ? "1. هوية المتجر والملف الشخصي" : "1. Store Identity & Profile"}
                </span>
              </div>

              {/* Logo Uploader with WebP <40KB */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                  {vaultData.logoUrl || storeLogoUrl ? (
                    <img
                      src={vaultData.logoUrl || storeLogoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-zinc-500" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressingLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white transition cursor-pointer"
                  >
                    {isCompressingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {locale === "ar" ? "تغيير شعار المتجر" : "Changer le logo"}
                    </span>
                  </button>
                  <p
                    dir="auto"
                    style={{ unicodeBidi: "plaintext" }}
                    className="text-[10px] text-zinc-400"
                  >
                    {locale === "ar"
                      ? "ضغط WebP تلقائي (<40KB) يظهر فوراً في الإيصالات والواجهة"
                      : "Compression WebP auto (<40KB), affiché sur tickets et entête"}
                  </p>
                </div>
              </div>

              {/* Shop Name & Owner Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "اسم المتجر التجاري" : "Nom de l'enseigne"}
                  </label>
                  <input
                    type="text"
                    required
                    value={vaultData.shopName}
                    onChange={(e) => setVaultData({ ...vaultData, shopName: e.target.value })}
                    className="w-full h-10 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "اسم المالك" : "Nom du Propriétaire"}
                  </label>
                  <input
                    type="text"
                    value={vaultData.fullName}
                    onChange={(e) => setVaultData({ ...vaultData, fullName: e.target.value })}
                    className="w-full h-10 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Email & Change Vault Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "البريد الإلكتروني (الحساب)" : "Email du compte"}
                  </label>
                  <input
                    type="email"
                    disabled
                    value={vaultData.email}
                    className="w-full h-10 px-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs text-zinc-400 cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar"
                      ? "تغيير كلمة مرور الخزنة (اختياري)"
                      : "Nouveau mot de passe coffre (opt)"}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={vaultData.newPassword || ""}
                    onChange={(e) => setVaultData({ ...vaultData, newPassword: e.target.value })}
                    className="w-full h-10 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:border-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Bank Account & Settlement RIB */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span>
                  {locale === "ar"
                    ? "2. الحساب البنكي وتسوية المستحقات (RIB)"
                    : "2. Bank Account & Settlement RIB"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "البنك المغربي" : "Banque Marocaine"}
                  </label>
                  <select
                    value={vaultData.bankName}
                    onChange={(e) => setVaultData({ ...vaultData, bankName: e.target.value })}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none cursor-pointer"
                  >
                    {MOROCCAN_BANKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "اسم صاحب الحساب (المستفيد)" : "Nom du Bénéficiaire"}
                  </label>
                  <input
                    type="text"
                    value={vaultData.beneficiaryName}
                    onChange={(e) => setVaultData({ ...vaultData, beneficiaryName: e.target.value })}
                    placeholder="Ex: SARL KASPI RETAIL"
                    className="w-full h-10 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {locale === "ar" ? "رقم الحساب البنكي (RIB 24 رقماً)" : "RIB Bancaire (24 chiffres)"}
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={vaultData.bankRib}
                  onChange={(e) => setVaultData({ ...vaultData, bankRib: e.target.value.replace(/\s+/g, "") })}
                  placeholder="230780000000000000000000"
                  className="w-full h-10 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-white focus:border-white focus:outline-none tracking-wider"
                />
              </div>
            </div>

            {/* SECTION 3: Payment Gateways & Local TPE */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-sky-400" />
                <span>
                  {locale === "ar"
                    ? "3. بوابات الدفع الإلكتروني وأجهزة TPE"
                    : "3. Payment Gateways & TPE Terminal"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  {locale === "ar" ? "بوابة الدفع المعتمدة" : "Passerelle de Paiement"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GATEWAYS.map((gw) => {
                    const isSelected = vaultData.selectedGateway === gw.id;
                    return (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setVaultData({ ...vaultData, selectedGateway: gw.id })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                          isSelected
                            ? "bg-white text-zinc-950 border-white shadow-sm"
                            : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-xs font-bold">{gw.label}</span>
                        <span
                          className={`text-[10px] ${
                            isSelected ? "text-zinc-700" : "text-zinc-500"
                          }`}
                        >
                          {gw.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "عنوان IP جهاز TPE المحلي" : "Adresse IP TPE Local"}
                  </label>
                  <input
                    type="text"
                    value={vaultData.tpeIp}
                    onChange={(e) => setVaultData({ ...vaultData, tpeIp: e.target.value })}
                    placeholder="192.168.1.150:8080"
                    className="w-full h-10 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "رقم جهاز TPE الإلكتروني" : "Identifiant TPE Terminal"}
                  </label>
                  <input
                    type="text"
                    value={vaultData.tpeTerminalId}
                    onChange={(e) => setVaultData({ ...vaultData, tpeTerminalId: e.target.value })}
                    placeholder="Ex: TPE-CAS-001"
                    className="w-full h-10 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: WhatsApp Nightly Report Automation */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>
                  {locale === "ar"
                    ? "4. أتمتة التقارير الليلية عبر WhatsApp"
                    : "4. WhatsApp Nightly Report Automation"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {locale === "ar"
                    ? "رقم WhatsApp الشخصي للمالك (مشفر ومخفي عن الموظفين)"
                    : "Numéro WhatsApp Privé Propriétaire"}
                </label>
                <input
                  type="text"
                  value={vaultData.ownerPhone}
                  onChange={(e) => setVaultData({ ...vaultData, ownerPhone: e.target.value })}
                  placeholder="+212 600-000000"
                  className="w-full h-10 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-white focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "وقت إرسال التقرير" : "Heure d'envoi"}
                  </label>
                  <select
                    value={vaultData.nightlyReportHour || "22:00"}
                    onChange={(e) => setVaultData({ ...vaultData, nightlyReportHour: e.target.value })}
                    className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none"
                  >
                    <option value="20:00">20:00 (8:00 PM)</option>
                    <option value="21:00">21:00 (9:00 PM)</option>
                    <option value="22:00">22:00 (10:00 PM)</option>
                    <option value="23:00">23:00 (11:00 PM)</option>
                    <option value="00:00">00:00 (Minuit)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-4 pt-4 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                    <input
                      type="checkbox"
                      checked={vaultData.dailyReportEnabled ?? true}
                      onChange={(e) =>
                        setVaultData({ ...vaultData, dailyReportEnabled: e.target.checked })
                      }
                      className="rounded border-zinc-700 text-white focus:ring-0"
                    />
                    <span>{locale === "ar" ? "تقرير يومي تلقائي" : "Rapport quotidien"}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                    <input
                      type="checkbox"
                      checked={vaultData.monthlyReportEnabled ?? true}
                      onChange={(e) =>
                        setVaultData({ ...vaultData, monthlyReportEnabled: e.target.checked })
                      }
                      className="rounded border-zinc-700 text-white focus:ring-0"
                    />
                    <span>{locale === "ar" ? "تقرير شهري شامل" : "Rapport mensuel"}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsUnlocked(false)}
                className="keycap-3d px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{locale === "ar" ? "← قفل ورجوع" : locale === "en" ? "← Lock & Back" : "← Verrouiller & Retour"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  {locale === "ar" ? "إغلاق" : locale === "en" ? "Close" : "Fermer"}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="sheen-btn keycap-3d inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black transition disabled:opacity-50 cursor-pointer shadow-md active:scale-[0.98]"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  ) : (
                    <Check className="w-4 h-4 text-zinc-950" />
                  )}
                  <span>
                    {locale === "ar"
                      ? "حفظ البيانات وتأمين الخزنة"
                      : locale === "en"
                      ? "Save & Seal Vault"
                      : "Enregistrer & Verrouiller"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
