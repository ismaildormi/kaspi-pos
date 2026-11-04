"use client";

import React, { useState } from "react";
import {
  X,
  Monitor,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  Globe,
  Sparkles,
} from "lucide-react";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDevices: number;
  onDeviceAdded: (newMaxDevices: number) => void;
  isRtl?: boolean;
}

export function AddDeviceModal({
  isOpen,
  onClose,
  currentDevices,
  onDeviceAdded,
  isRtl = false,
}: AddDeviceModalProps) {
  const [provider, setProvider] = useState<"youcanpay" | "paddle">("youcanpay");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTotalMAD = 200 + Math.max(0, currentDevices - 1) * 150;
  const newTotalMAD = currentTotalMAD + 150;
  const newDeviceCount = currentDevices + 1;

  const handleAddDevice = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/add-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Impossible d'ajouter le poste de caisse");
      }

      setSuccess(true);
      setTimeout(() => {
        onDeviceAdded(data.maxDevices || newDeviceCount);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erreur lors du traitement du paiement.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Glowing backdrop pill */}
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-md">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isRtl ? "إضافة نقطة بيع إضافية" : "Ajouter un Poste de Caisse"}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {isRtl ? "توسيع شبكة أجهزتك فورياً" : "Extension instantanée de matériel"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* State Banner: Success or Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white">
              {isRtl ? "تمت إضافة نقطة البيع بنجاح !" : "Nouveau poste activé avec succès !"}
            </h4>
            <p className="text-xs text-zinc-400 font-mono">
              {isRtl
                ? `يمكنك الآن تشغيل ${newDeviceCount} أجهزة كاشير في نفس الوقت.`
                : `Votre commerce supporte désormais ${newDeviceCount} terminaux simultanés.`}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Context Box */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-medium">
                  {isRtl ? "سعة الأجهزة الحالية :" : "Capacité actuelle :"}
                </span>
                <span className="font-mono font-bold text-white flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-zinc-400" />
                  {currentDevices} {currentDevices === 1 ? "poste" : "postes"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-medium">
                  {isRtl ? "السعة الجديدة بعد الترقية :" : "Nouvelle capacité :"}
                </span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {newDeviceCount} postes simultanés
                </span>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>{isRtl ? "سعر التفعيل الإضافي :" : "Poste additionnel :"}</span>
                <span className="text-white font-bold">+150.00 MAD / mois</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>{isRtl ? "الفاتورة الشهرية الحالية :" : "Forfait actuel :"}</span>
                <span>{currentTotalMAD}.00 MAD / mois</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline text-sm font-bold text-white">
                <span>{isRtl ? "المجموع الشهري الجديد :" : "Nouveau total mensuel :"}</span>
                <span className="text-emerald-400 font-black text-base">{newTotalMAD}.00 MAD / mois</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans pt-1">
                {isRtl
                  ? "سيتم اقتطاع 150 درهم فورياً من بطاقتك وتعديل دورة الفوترة القادمة تلقائياً."
                  : "Le montant de 150 MAD sera débité instantanément et reconduit sur vos prochaines factures."}
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300 block">
                {isRtl ? "طريقة الاقتطاع :" : "Mode de règlement :"}
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setProvider("youcanpay")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    provider === "youcanpay"
                      ? "bg-zinc-800 border-white text-white shadow-xs"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">Carte Maroc (CMI)</span>
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">YouCan Pay • 150 DH</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider("paddle")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    provider === "paddle"
                      ? "bg-zinc-800 border-white text-white shadow-xs"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">Carte Internationale</span>
                    <Globe className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Paddle MoR • $15 USD</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-semibold transition cursor-pointer"
              >
                {isRtl ? "إلغاء" : "Annuler"}
              </button>

              <button
                type="button"
                onClick={handleAddDevice}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isRtl ? "جاري تفعيل الجهاز..." : "Paiement en cours..."}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isRtl ? "تأكيد ودفع 150 درهم" : "Confirmer et Payer 150 DH"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddDeviceModal;
