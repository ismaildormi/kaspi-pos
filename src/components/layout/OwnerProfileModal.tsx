"use client";

import React, { useState, useRef } from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Phone,
  CreditCard,
  Upload,
  Check,
  X,
  Loader2,
  Sparkles,
  KeyRound,
  Wallet,
} from "lucide-react";
import { compressImage } from "@/lib/storage/compression-engine";
import { useAppDictionary } from "@/i18n/schema";

interface OwnerVaultData {
  email: string;
  fullName: string;
  logoUrl: string;
  shopName: string;
  ownerPhone: string;
  bankName: string;
  bankRib: string;
  tpeTerminalId: string;
  selectedGateway: string;
}

interface OwnerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: { shopName?: string; logoUrl?: string }) => void;
}

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

  // Vault form state
  const [vaultData, setVaultData] = useState<OwnerVaultData>({
    email: "",
    fullName: "",
    logoUrl: "",
    shopName: "",
    ownerPhone: "",
    bankName: "",
    bankRib: "",
    tpeTerminalId: "",
    selectedGateway: "cash_only",
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

      setVaultData(data.vault);
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
      // Compress client-side to WebP < 40KB
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

      // Broadcast event so Navbar and Sidebar can update the logo in 0ms
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
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-6 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-5 h-5 text-white" />
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
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                  {isUnlocked ? "UNLOCKED" : "LOCKED"}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {locale === "ar"
                  ? "حماية مشددة للبيانات البنكية ورقم المالك عن الموظفين"
                  : locale === "en"
                  ? "Protected financial details & owner phone hidden from cashiers"
                  : "Données financières protégées et masquées aux employés"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ====================================================================
           STEP 1: MANDATORY PASSWORD GATE
           ==================================================================== */}
        {!isUnlocked ? (
          <form onSubmit={handleUnlockGate} className="space-y-5 py-2">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 leading-relaxed">
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

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:text-white transition"
              >
                {locale === "ar" ? "إلغاء" : locale === "en" ? "Cancel" : "Annuler"}
              </button>
              <button
                type="submit"
                disabled={isVerifying || !password.trim()}
                className="sheen-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>
                  {locale === "ar"
                    ? "فتح الخزنة المشفرة"
                    : locale === "en"
                    ? "Unlock Secure Vault"
                    : "Déverrouiller le Coffre"}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* ====================================================================
             STEP 2: UNLOCKED SENSITIVE VAULT & STORE LOGO
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

            {/* 1. Store Logo & Avatar */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <span className="block text-xs font-bold text-white uppercase tracking-wider">
                {locale === "ar" ? "شعار وهوية المتجر الرسمية" : "Logo & Identité Visuelle"}
              </span>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                  {vaultData.logoUrl ? (
                    <img
                      src={vaultData.logoUrl}
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
                  <p className="text-[10px] text-zinc-500">
                    {locale === "ar"
                      ? "ضغط WebP تلقائي (<40KB) يظهر فوراً في الإيصالات والواجهة"
                      : "Compression WebP auto (<40KB), affiché sur tickets et entête"}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Owner & Shop Identity */}
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
                  className="w-full h-10 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none"
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
                  className="w-full h-10 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none"
                />
              </div>
            </div>

            {/* 3. Sensitive Financial Vault */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>
                  {locale === "ar"
                    ? "البيانات المالية والبنكية الحساسة"
                    : "Coordonnées Bancaires & TPE Sécurisées"}
                </span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "اسم البنك المغربي" : "Banque"}
                  </label>
                  <input
                    type="text"
                    value={vaultData.bankName}
                    onChange={(e) => setVaultData({ ...vaultData, bankName: e.target.value })}
                    placeholder="Attijariwafa, BCP, CIH, BMCE..."
                    className="w-full h-10 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {locale === "ar" ? "رقم جهاز TPE الإلكتروني" : "Identifiant TPE"}
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

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {locale === "ar" ? "بوابة الدفع الإلكتروني المعتمدة" : "Passerelle de Paiement"}
                </label>
                <select
                  value={vaultData.selectedGateway}
                  onChange={(e) => setVaultData({ ...vaultData, selectedGateway: e.target.value })}
                  className="w-full h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none"
                >
                  <option value="cash_only">Espèces & Chèques (Sans Passerelle)</option>
                  <option value="cmi">Centre Monétique Interbancaire (CMI)</option>
                  <option value="youcanpay">YouCan Pay Maroc</option>
                  <option value="stripe">Stripe International</option>
                  <option value="hyperswitch">Hyperswitch Router</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {locale === "ar"
                    ? "رقم WhatsApp الشخصي للمالك (للتقارير الليلية الذكية)"
                    : "Numéro WhatsApp Privé Propriétaire"}
                </label>
                <input
                  type="text"
                  value={vaultData.ownerPhone}
                  onChange={(e) => setVaultData({ ...vaultData, ownerPhone: e.target.value })}
                  placeholder="+212 600-000000"
                  className="w-full h-10 px-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-white focus:border-white focus:outline-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  {locale === "ar"
                    ? "هذا الرقم مشفر ومخفي تماماً عن الموظفين في شاشات التقارير والإعدادات."
                    : "Ce numéro est masqué aux employés dans les écrans Rapports et Réglages."}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:text-white transition"
              >
                {locale === "ar" ? "إغلاق" : locale === "en" ? "Close" : "Fermer"}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="sheen-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>
                  {locale === "ar"
                    ? "حفظ البيانات وتأمين الخزنة"
                    : locale === "en"
                    ? "Save & Seal Vault"
                    : "Enregistrer & Verrouiller"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
