"use client";

import React, { useState } from "react";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import { KaspiBrandMark } from "@/components/common/KaspiBrandMark";
import {
  ShieldAlert,
  Laptop,
  AlertTriangle,
  Send,
  PlusCircle,
  CheckCircle2,
  Lock,
  Camera,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface ConflictData {
  status: "ACTIVE" | "DUAL_LOCKDOWN" | "HARD_ADMIN_LOCK" | "GRACE_RECOVERED";
  isPrimary: boolean;
  strikes: number;
  bindingId?: string;
  fingerprint?: string;
  tenantId?: string;
  primarySummary?: {
    name?: string | null;
    os?: string | null;
    boundAt?: Date | string | null;
    lastHeartbeat?: Date | string | null;
  };
  secondarySummary?: {
    name?: string | null;
    os?: string | null;
    lastConflict?: Date | string | null;
  };
  message?: string;
}

interface PosteConflictLockModalProps {
  isOpen: boolean;
  conflictData: ConflictData | null;
  locale?: string;
  onRefreshHeartbeat?: () => Promise<void>;
}

export function PosteConflictLockModal({
  isOpen,
  conflictData,
  locale = "ar",
  onRefreshHeartbeat,
}: PosteConflictLockModalProps) {
  const router = useRouter();
  const [merchantNote, setMerchantNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSuccessId, setTicketSuccessId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCheckingGrace, setIsCheckingGrace] = useState(false);

  const isRtl = locale === "ar";
  const isHardLock = conflictData?.status === "HARD_ADMIN_LOCK";
  const strikes = conflictData?.strikes ?? 1;

  const t = {
    ar: {
      title: isHardLock ? "قفل إداري صارم: تم تجاوز حد المحاولات" : "تنبيه أمان: إيقاف جلسة الكاشير مؤقتاً",
      subtitle: "حماية مقاعد الكاشير وتراخيص الأجهزة (Anti-Account Sharing)",
      policyReason:
        "تم إيقاف الجلسة مؤقتاً بسبب محاولة تشغيل حساب البوست الواحد على أكثر من جهاز في نفس الوقت أو على جهاز غير مرخص.",
      primaryDevice: "الجهاز الأصلي المرخص (PC #1)",
      secondaryDevice: "الجهاز الثاني المتنازع عليه (PC #2)",
      strikeCount: `المحاولة ${strikes} من 3 (قبل القفل الإداري الدائم)`,
      hardLockNotice:
        "تم تجميد الاستعادة التلقائية لتكرار المخالفة أكثر من 3 مرات. لفتح الحساب، يرجى التواصل مع الإدارة أو الترقية لـ +1 بوست.",
      graceTip:
        "💡 حل فوري للتاجر الصادق: إذا أغلقت البرنامج على الجهازين، ثم أعدت تشغيل الجهاز الأصلي (PC #1) وحده، فسيتم فتح القفل تلقائياً دون انتظار الدعم.",
      notePlaceholder: "اكتب ملاحظتك للإدارة (مثال: تعطل الجهاز الأول ونرغب بنقل الترخيص للجهاز الجديد)...",
      sendTicket: "إرسال استفسار ولقطة شاشة للإدارة",
      ticketSuccess: "تم إرسال تذكرتك بنجاح للإدارة المركزية برقم مرجعي:",
      ticketPendingReview: "سيقوم المشرف الفني بمراجعة عتاد الجهازين وحل المشكلة فوراً.",
      addPosteBtn: "إضافة بوست إضافي (+150 MAD/شهر)",
      checkGraceBtn: "تحقق من إغلاق الجهاز الثاني وإعادة الفتح",
      boundSince: "تاريخ الربط الأول:",
      attemptTime: "وقت المحاولة المخالفة:",
    },
    fr: {
      title: isHardLock ? "Verrouillage Administratif Strict : Limite Dépassée" : "Alerte de Sécurité : Session Caisse Suspendue",
      subtitle: "Intégrité des Licences 1-Poste & Protection Matérielle",
      policyReason:
        "La session a été suspendue temporairement : Détection d'une tentative d'utilisation simultanée d'un compte 1-Poste sur un second appareil non autorisé.",
      primaryDevice: "Poste Principal Agréé (PC #1)",
      secondaryDevice: "Second Appareil Détecté (PC #2)",
      strikeCount: `Tentative ${strikes} sur 3 (avant verrouillage strict)`,
      hardLockNotice:
        "La récupération automatique est désactivée suite à 3 tentatives répétées. Veuillez contacter le support ou ajouter un poste.",
      graceTip:
        "💡 Solution immédiate : Si vous fermez l'application sur les deux PC, puis redémarrez UNIQUEMENT le PC principal agréé (#1), la caisse se débloquera automatiquement.",
      notePlaceholder: "Expliquez votre situation au support (ex: changement de PC de caisse)...",
      sendTicket: "Envoyer un Ticket & Capture au Support",
      ticketSuccess: "Votre ticket a été transmis avec succès sous la référence :",
      ticketPendingReview: "L'équipe technique analyse vos empreintes matérielles.",
      addPosteBtn: "Ajouter un Poste Supplémentaire (+150 MAD/mois)",
      checkGraceBtn: "Vérifier la fermeture du second PC & Débloquer",
      boundSince: "Lié depuis le :",
      attemptTime: "Heure de la tentative :",
    },
    en: {
      title: isHardLock ? "Hard Admin Lock: Strike Limit Exceeded" : "Security Alert: Cashier Session Paused",
      subtitle: "1-Poste Seat Integrity & Hardware License Protection",
      policyReason:
        "Session temporarily paused: Detected concurrent multi-device access or an unauthorized station attempt on a 1-Poste license.",
      primaryDevice: "Authorized Primary Terminal (PC #1)",
      secondaryDevice: "Conflicting Secondary Device (PC #2)",
      strikeCount: `Strike ${strikes} of 3 (prior to hard administrative lock)`,
      hardLockNotice:
        "Automatic reboot grace has been disabled due to 3+ policy triggers. Contact founder admin or upgrade license.",
      graceTip:
        "💡 Instant Merchant Grace: If both devices close the application, and ONLY the original authorized PC (#1) powers on, access restores automatically.",
      notePlaceholder: "Enter inquiry details for support (e.g. migrating to new shop register)...",
      sendTicket: "Send Inquiry & Viewport Snapshot to Support",
      ticketSuccess: "Support ticket filed successfully with reference:",
      ticketPendingReview: "The support team will review both hardware signatures.",
      addPosteBtn: "Add +1 Extra Poste (+150 MAD/month)",
      checkGraceBtn: "Check Clean Shutdown & Restore",
      boundSince: "Bound since:",
      attemptTime: "Attempt timestamp:",
    },
  }[locale as "ar" | "fr" | "en"] || {
    title: "Security Alert: Cashier Session Paused",
    subtitle: "1-Poste Seat Integrity & Hardware License Protection",
    policyReason: "Session paused due to unauthorized concurrent multi-device attempt on 1-Poste license.",
    primaryDevice: "Authorized Primary Terminal (PC #1)",
    secondaryDevice: "Conflicting Secondary Device (PC #2)",
    strikeCount: `Strike ${strikes} of 3`,
    hardLockNotice: "Automatic grace disabled. Upgrade or contact support.",
    graceTip: "💡 Shut down both devices, then boot PC #1 alone to recover automatically.",
    notePlaceholder: "Enter inquiry details...",
    sendTicket: "Send Inquiry & Screenshot to Support",
    ticketSuccess: "Ticket submitted with reference:",
    ticketPendingReview: "Admin is reviewing the device signatures.",
    addPosteBtn: "Add +1 Extra Poste (+150 MAD/month)",
    checkGraceBtn: "Check Clean Shutdown & Restore",
    boundSince: "Bound since:",
    attemptTime: "Attempt timestamp:",
  };

  const handleSendSupportTicket = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Capture lightweight sanitized canvas / viewport snapshot
      let screenshotData: string | undefined = undefined;
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#09090b";
            ctx.fillRect(0, 0, 640, 360);
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText("KASPI POS — CONFLICT SNAPSHOT", 24, 40);
            ctx.fillStyle = "#a1a1aa";
            ctx.font = "12px sans-serif";
            ctx.fillText(`Primary: ${conflictData?.primarySummary?.name || "PC #1"} (${conflictData?.primarySummary?.os || "win"})`, 24, 80);
            ctx.fillText(`Secondary: ${conflictData?.secondarySummary?.name || "PC #2"} (${conflictData?.secondarySummary?.os || "win"})`, 24, 110);
            ctx.fillText(`Strikes: ${strikes} | Time: ${new Date().toISOString()}`, 24, 140);
            ctx.fillText(`Merchant Note: ${(merchantNote || "None").slice(0, 80)}`, 24, 170);
            screenshotData = canvas.toDataURL("image/png");
          }
        } catch {
          // Non-fatal
        }
      }

      const res = await fetch("/api/v1/devices/conflict-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: conflictData?.fingerprint || "unknown",
          merchantNote: merchantNote.trim() || undefined,
          screenshotData,
          primarySummary: conflictData?.primarySummary,
          secondarySummary: conflictData?.secondarySummary,
          conflictReason: isHardLock ? "HARD_ADMIN_LOCK_EXCEEDED" : "UNAUTHORIZED_DUAL_DEVICE_ATTEMPT",
          tenantId: conflictData?.tenantId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error || "Failed to submit support ticket");
        setIsSubmitting(false);
        return;
      }

      setTicketSuccessId(data.ticketId);
    } catch {
      setErrorMessage("Network error connecting to support server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualGraceCheck = async () => {
    if (!onRefreshHeartbeat) return;
    setIsCheckingGrace(true);
    setErrorMessage("");
    try {
      await onRefreshHeartbeat();
    } catch {
      setErrorMessage("Failed to refresh heartbeat state");
    } finally {
      setIsCheckingGrace(false);
    }
  };

  const handleUpgradePoste = () => {
    router.push(`/${locale}/dashboard/billing`);
  };

  if (!isOpen) return null;

  return (
    <KaspiGlassModalPortal isOpen={isOpen} onClose={() => {}} dir={isRtl ? "rtl" : "ltr"}>
      <div
        data-kaspi-conflict-modal="true"
        className="w-full max-w-2xl bg-zinc-950/90 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-3xl text-white select-none animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header with Lock Icon & Brand Mark */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isHardLock ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
              {isHardLock ? <Lock className="w-7 h-7 animate-pulse" /> : <ShieldAlert className="w-7 h-7" />}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {t.title}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">{t.subtitle}</p>
            </div>
          </div>
          <KaspiBrandMark size="sm" />
        </div>

        {/* Policy Explanation Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-sm leading-relaxed text-zinc-200">
          <p className="font-medium">{t.policyReason}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
            <span className="font-mono bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-white/5">
              1-Poste License • 200 MAD/mo
            </span>
            <span className={`font-semibold px-2.5 py-1 rounded-lg ${isHardLock ? "bg-red-950 text-red-300 border border-red-800" : "bg-amber-950 text-amber-300 border border-amber-800"}`}>
              {t.strikeCount}
            </span>
          </div>
        </div>

        {/* Side-by-Side Hardware Comparison */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Primary PC Card */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Laptop className="w-4 h-4" />
              <span>{t.primaryDevice}</span>
            </div>
            <div className="mt-2 text-sm font-semibold text-white truncate">
              {conflictData?.primarySummary?.name || "Poste Principal (POS-01)"}
            </div>
            <div className="mt-1 text-xs text-zinc-400 flex flex-col gap-0.5">
              <span>OS: <strong className="text-zinc-300">{conflictData?.primarySummary?.os || "Windows"}</strong></span>
              <span className="truncate">{t.boundSince} {conflictData?.primarySummary?.boundAt ? new Date(conflictData.primarySummary.boundAt).toLocaleDateString() : "Active"}</span>
            </div>
          </div>

          {/* Secondary Conflicting PC Card */}
          <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>{t.secondaryDevice}</span>
            </div>
            <div className="mt-2 text-sm font-semibold text-white truncate">
              {conflictData?.secondarySummary?.name || "Second Appareil Non Autorisé"}
            </div>
            <div className="mt-1 text-xs text-zinc-400 flex flex-col gap-0.5">
              <span>OS: <strong className="text-zinc-300">{conflictData?.secondarySummary?.os || "Detecté"}</strong></span>
              <span className="truncate">{t.attemptTime} {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Hard Lock Alert vs Grace Tip */}
        <div className="mt-4">
          {isHardLock ? (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 leading-relaxed">
              <strong>⛔ {t.hardLockNotice}</strong>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 text-xs text-sky-200 leading-relaxed flex items-start justify-between gap-3">
              <div>{t.graceTip}</div>
              {onRefreshHeartbeat && (
                <button
                  type="button"
                  onClick={handleManualGraceCheck}
                  disabled={isCheckingGrace}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingGrace ? "animate-spin" : ""}`} />
                  {t.checkGraceBtn}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Support Ticket Submission Form */}
        <div className="mt-5 border-t border-white/10 pt-5">
          {ticketSuccessId ? (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>{t.ticketSuccess}</span>
              </div>
              <div className="text-xs font-mono font-bold text-white bg-black/40 px-3 py-1.5 rounded-xl inline-block border border-white/10">
                {ticketSuccessId}
              </div>
              <p className="text-xs text-zinc-300">{t.ticketPendingReview}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                {t.sendTicket}
              </label>
              <textarea
                value={merchantNote}
                onChange={(e) => setMerchantNote(e.target.value)}
                placeholder={t.notePlaceholder}
                rows={2}
                className="w-full rounded-2xl bg-white/[0.06] border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition resize-none"
              />
              {errorMessage && (
                <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSendSupportTicket}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white transition flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 text-zinc-400" />
                  <span>{isSubmitting ? "..." : t.sendTicket}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleUpgradePoste}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.addPosteBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </KaspiGlassModalPortal>
  );
}
