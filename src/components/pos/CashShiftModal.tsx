"use client";

import React, { useState } from "react";
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Lock,
  Unlock,
  History,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PlusCircle,
  FileSpreadsheet,
  Banknote,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { printReceipt } from "@/client/printing";
import { usePosStore } from "@/client/store/usePosStore";
import {
  formatReceiptAmount,
  formatReceiptDate,
  toWesternNumerals,
} from "@/lib/printing/receipt-translations";
import type {
  ShiftFinancialSummary,
  CashMovementType,
} from "@/server/cash-shift/engine";

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: ShiftFinancialSummary | null;
  recentShifts: ShiftFinancialSummary[];
  onShiftUpdated: () => Promise<void>;
}

export const CashShiftModal: React.FC<CashShiftModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  recentShifts,
  onShiftUpdated,
}) => {
  const { tenantInfo, printerSettings } = usePosStore();

  const [activeTab, setActiveTab] = useState<"x_report" | "movements" | "close_z" | "history">(
    "x_report"
  );

  // Open Shift State
  const [openingCashInput, setOpeningCashInput] = useState("500.00");
  const [openingNotes, setOpeningNotes] = useState("");
  const [isSubmittingOpen, setIsSubmittingOpen] = useState(false);

  // Cash Movement State
  const [movementType, setMovementType] = useState<CashMovementType>("petty_cash");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);

  // Close Shift (Z-Report) State
  const [countedCashInput, setCountedCashInput] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  if (!isOpen) return null;

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOpen(true);
    try {
      const res = await fetch("/api/v1/cash-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingCash: parseFloat(openingCashInput) || 0,
          openingNotes: openingNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Impossible d'ouvrir la caisse");
      }
      toast.success("Session de caisse ouverte avec succès !");
      await onShiftUpdated();
      setActiveTab("x_report");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ouverture de caisse");
    } finally {
      setIsSubmittingOpen(false);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const amt = parseFloat(movementAmount);
    if (!amt || amt <= 0 || !movementReason.trim()) {
      toast.error("Veuillez saisir un montant valide et un motif");
      return;
    }

    setIsSubmittingMovement(true);
    try {
      const res = await fetch(`/api/v1/cash-sessions/${activeShift.sessionId}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: movementType,
          amount: amt,
          reason: movementReason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Erreur d'enregistrement du mouvement");
      }
      toast.success("Mouvement de caisse enregistré !");
      setMovementAmount("");
      setMovementReason("");
      await onShiftUpdated();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du mouvement de caisse");
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  const handlePrintShiftReport = async (
    shift: ShiftFinancialSummary,
    reportType: "X-REPORT" | "Z-REPORT"
  ) => {
    const lang = printerSettings?.receiptLanguage || "fr";
    const items = [
      {
        name: "Fond de Caisse Initial (Float)",
        quantity: 1,
        unitPrice: shift.openingCash,
        lineTotal: shift.openingCash,
      },
      {
        name: `Ventes Espèces (${shift.salesCount} tickets)`,
        quantity: 1,
        unitPrice: shift.cashSalesTotal,
        lineTotal: shift.cashSalesTotal,
      },
      {
        name: "Ventes Carte TPE",
        quantity: 1,
        unitPrice: shift.cardSalesTotal,
        lineTotal: shift.cardSalesTotal,
      },
      {
        name: "Ventes Crédit Client",
        quantity: 1,
        unitPrice: shift.creditSalesTotal,
        lineTotal: shift.creditSalesTotal,
      },
      {
        name: "Entrées Espèces (+Cash In)",
        quantity: 1,
        unitPrice: shift.cashInTotal,
        lineTotal: shift.cashInTotal,
      },
      {
        name: "Sorties & Fournisseurs (-Cash Out)",
        quantity: 1,
        unitPrice: -shift.cashOutTotal,
        lineTotal: -shift.cashOutTotal,
      },
    ];

    if (reportType === "Z-REPORT" && shift.countedCash !== null) {
      items.push({
        name: "Espèces Comptées (Counted)",
        quantity: 1,
        unitPrice: shift.countedCash,
        lineTotal: shift.countedCash,
      });
      items.push({
        name: "Écart de Caisse (Discrepancy)",
        quantity: 1,
        unitPrice: shift.discrepancy || 0,
        lineTotal: shift.discrepancy || 0,
      });
    }

    await printReceipt({
      receiptNumber: toWesternNumerals(`${reportType}-${shift.sessionId.slice(0, 6).toUpperCase()}`),
      shopName: tenantInfo?.shopName || "KASPI POS",
      address: tenantInfo?.address || "Casablanca, Maroc",
      ice: toWesternNumerals(tenantInfo?.ice || ""),
      taxId: toWesternNumerals(tenantInfo?.taxId || ""),
      cashierName: shift.cashierName,
      createdAt: formatReceiptDate(new Date(), lang),
      items,
      subtotal: shift.totalSalesRevenue,
      taxTotal: 0,
      grandTotal: shift.expectedCash,
      paidTotal: shift.countedCash ?? shift.expectedCash,
      changeDue: 0,
      paymentMethod: reportType,
      currency: "MAD",
      receiptLanguage: lang,
      paperWidthMm: printerSettings?.paperWidthMm || 80,
      openDrawer: true,
      receiptHeader: `=== ${reportType} OFFICIEL ===`,
      receiptFooter:
        reportType === "Z-REPORT"
          ? `Clôture certifiée • Écart: ${formatReceiptAmount(shift.discrepancy || 0)} MAD`
          : "Rapport X intermédiaire (Caisse Ouverte)",
    });

    toast.success(`${reportType} envoyé à l'imprimante thermique !`);
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const counted = parseFloat(countedCashInput);
    if (Number.isNaN(counted) || counted < 0) {
      toast.error("Veuillez saisir le montant réel compté dans le tiroir-caisse");
      return;
    }

    setIsSubmittingClose(true);
    try {
      const res = await fetch(`/api/v1/cash-sessions/${activeShift.sessionId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countedCash: counted,
          closingNotes: closingNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Impossible de clôturer la caisse");
      }

      const closedSession: ShiftFinancialSummary = json.data?.session;
      toast.success("Session de caisse clôturée avec succès (Z-Report généré) !");

      if (closedSession) {
        await handlePrintShiftReport(closedSession, "Z-REPORT").catch(() => {});
      }

      setCountedCashInput("");
      setClosingNotes("");
      await onShiftUpdated();
      setActiveTab("history");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la clôture de caisse");
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const liveCountedNum = parseFloat(countedCashInput);
  const liveVariance =
    activeShift && !Number.isNaN(liveCountedNum)
      ? Number((liveCountedNum - activeShift.expectedCash).toFixed(2))
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-3xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                activeShift
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              {activeShift ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Gestion du Tiroir-Caisse &amp; Clôture (X / Z Report)</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    activeShift
                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                      : "bg-amber-950 text-amber-400 border-amber-800"
                  }`}
                >
                  {activeShift ? "CAISSE OUVERTE" : "CAISSE FERMÉE"}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Fond de caisse, entrées/sorties espèces, paiements fournisseurs et clôture Z certifiée
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-zinc-900/30 border-b border-zinc-800 overflow-x-auto">
          {activeShift && (
            <>
              <button
                onClick={() => setActiveTab("x_report")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "x_report"
                    ? "bg-white text-black shadow"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>État Actuel (Rapport X)</span>
              </button>

              <button
                onClick={() => setActiveTab("movements")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "movements"
                    ? "bg-white text-black shadow"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Mouvements Espèces ({activeShift.movements.length})</span>
              </button>

              <button
                onClick={() => {
                  setCountedCashInput(activeShift.expectedCash.toFixed(2));
                  setActiveTab("close_z");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "close_z"
                    ? "bg-rose-500 text-white shadow"
                    : "text-rose-400 hover:bg-rose-950/40"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Clôturer la Caisse (Rapport Z)</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-black shadow"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historique Clôtures ({recentShifts.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!activeShift && activeTab !== "history" ? (
            /* OPEN SHIFT VIEW */
            <form onSubmit={handleOpenShift} className="max-w-md mx-auto space-y-5 py-2">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Banknote className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">
                  Ouverture de Caisse • فتح صندوق الكاشير
                </h3>
                <p className="text-xs text-zinc-400">
                  Saisissez le fond de caisse initial (monnaie dans le tiroir) pour démarrer la journée.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Fond de Caisse Initial (MAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-xl font-black font-mono text-white text-center focus:outline-none focus:border-emerald-400"
                />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {["200.00", "500.00", "1000.00", "2000.00"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOpeningCashInput(preset)}
                      className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 cursor-pointer"
                    >
                      {preset} DH
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Note d&apos;ouverture (Optionnel)
                </label>
                <input
                  type="text"
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  placeholder="Ex: Équipe du matin - Caisse N°1"
                  className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingOpen}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
              >
                {isSubmittingOpen ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                <span>Ouvrir la Caisse &amp; Démarrer le Service</span>
              </button>
            </form>
          ) : activeShift && activeTab === "x_report" ? (
            /* LIVE X-REPORT VIEW */
            <div className="space-y-6">
              {/* Top Highlighted Expected Cash Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/40 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    Fond Théorique en Caisse (Expected Cash in Drawer)
                  </span>
                  <div className="text-3xl font-black text-white font-mono mt-1" dir="ltr">
                    {formatReceiptAmount(activeShift.expectedCash)} MAD
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Ouvert à {formatReceiptDate(activeShift.openedAt, "fr")} par{" "}
                    <strong className="text-white">{activeShift.cashierName}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrintShiftReport(activeShift, "X-REPORT")}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-2 shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer Rapport X • طباعة تقرير X</span>
                </button>
              </div>

              {/* 4-Card Drawer Cash Math Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block">Fond Initial (Float)</span>
                  <span className="text-lg font-black text-white font-mono mt-1 block" dir="ltr">
                    +{formatReceiptAmount(activeShift.openingCash)} DH
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block">Ventes Espèces (Cash)</span>
                  <span className="text-lg font-black text-emerald-400 font-mono mt-1 block" dir="ltr">
                    +{formatReceiptAmount(activeShift.cashSalesTotal)} DH
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block">Entrées Caisse (In)</span>
                  <span className="text-lg font-black text-sky-400 font-mono mt-1 block" dir="ltr">
                    +{formatReceiptAmount(activeShift.cashInTotal)} DH
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block">Sorties / Dépenses (Out)</span>
                  <span className="text-lg font-black text-rose-400 font-mono mt-1 block" dir="ltr">
                    -{formatReceiptAmount(activeShift.cashOutTotal)} DH
                  </span>
                </div>
              </div>

              {/* Secondary Revenue Breakdown (Card / Credit / Total Revenue) */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400 block">Ventes Carte (TPE)</span>
                  <span className="font-bold text-white font-mono" dir="ltr">
                    {formatReceiptAmount(activeShift.cardSalesTotal)} MAD
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Ventes Crédit (Krediat)</span>
                  <span className="font-bold text-white font-mono" dir="ltr">
                    {formatReceiptAmount(activeShift.creditSalesTotal)} MAD
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Total Tickets Encaissés</span>
                  <span className="font-bold text-white font-mono" dir="ltr">
                    {activeShift.salesCount} ventes
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Chiffre d&apos;Affaires Total</span>
                  <span className="font-black text-amber-400 font-mono" dir="ltr">
                    {formatReceiptAmount(activeShift.totalSalesRevenue)} MAD
                  </span>
                </div>
              </div>
            </div>
          ) : activeShift && activeTab === "movements" ? (
            /* CASH MOVEMENTS VIEW */
            <div className="space-y-6">
              <form
                onSubmit={handleRecordMovement}
                className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4"
              >
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-sky-400" />
                  <span>Nouveau Mouvement de Caisse (Entrée / Dépense / Fournisseur)</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "petty_cash" as const, label: "Petite Dépense", icon: ArrowUpRight },
                    { id: "supplier_payout" as const, label: "Paiement Fournisseur", icon: ArrowUpRight },
                    { id: "cash_out" as const, label: "Retrait Caisse", icon: ArrowUpRight },
                    { id: "cash_in" as const, label: "Apport Monnaie (+In)", icon: ArrowDownLeft },
                  ].map((tItem) => (
                    <button
                      key={tItem.id}
                      type="button"
                      onClick={() => setMovementType(tItem.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        movementType === tItem.id
                          ? tItem.id === "cash_in"
                            ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                            : "bg-rose-950 border-rose-500 text-rose-300"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <tItem.icon className="w-3.5 h-3.5" />
                      <span>{tItem.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Montant (MAD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={movementAmount}
                      onChange={(e) => setMovementAmount(e.target.value)}
                      placeholder="Ex: 120.00"
                      className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Motif / Justification *
                    </label>
                    <input
                      type="text"
                      required
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      placeholder="Ex: Règlement livreur eau minérale / Achat sacs plastique"
                      className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingMovement}
                    className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingMovement && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Valider le Mouvement</span>
                  </button>
                </div>
              </form>

              {/* Movements History List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Journal des Mouvements de la Session ({activeShift.movements.length})
                </h4>
                {activeShift.movements.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
                    Aucun mouvement d&apos;espèces enregistré durant cette session.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    {activeShift.movements.map((mv) => {
                      const isIn = mv.type === "cash_in";
                      return (
                        <div
                          key={mv.id}
                          className="p-3.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{mv.reason}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {mv.type.toUpperCase()} • {formatReceiptDate(mv.createdAt, "fr")} •{" "}
                              {mv.createdByName || "Caissier"}
                            </div>
                          </div>
                          <div
                            className={`font-black font-mono text-sm ${
                              isIn ? "text-emerald-400" : "text-rose-400"
                            }`}
                            dir="ltr"
                          >
                            {isIn ? "+" : "-"}
                            {formatReceiptAmount(mv.amount)} MAD
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : activeShift && activeTab === "close_z" ? (
            /* CLOSE SHIFT & Z-REPORT VIEW */
            <form onSubmit={handleCloseShift} className="max-w-lg mx-auto space-y-5">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 block">
                    Espèces Attendues dans le Tiroir (Fond Théorique)
                  </span>
                  <span className="text-2xl font-black text-white font-mono" dir="ltr">
                    {formatReceiptAmount(activeShift.expectedCash)} MAD
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCountedCashInput(activeShift.expectedCash.toFixed(2))}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 cursor-pointer"
                >
                  Montant Exact
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Espèces Réelles Comptées (Actual Counted Cash en MAD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  placeholder="Saisissez le total des billets et pièces comptés..."
                  className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-xl font-black font-mono text-white text-center focus:outline-none focus:border-white"
                />
              </div>

              {liveVariance !== null && (
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    liveVariance === 0
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                      : liveVariance > 0
                      ? "bg-sky-950/30 border-sky-500/40 text-sky-300"
                      : "bg-rose-950/30 border-rose-500/40 text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {liveVariance === 0 ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>
                      {liveVariance === 0
                        ? "Caisse Parfaitement Équilibrée"
                        : liveVariance > 0
                        ? "Excédent de Caisse (Surplus)"
                        : "Déficit / Manquant de Caisse (Shortage)"}
                    </span>
                  </div>
                  <span className="font-mono font-black text-base" dir="ltr">
                    {liveVariance > 0 ? "+" : ""}
                    {formatReceiptAmount(liveVariance)} MAD
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Observations de Clôture (Optionnel)
                </label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Ex: Dépôt coffre-fort effectué"
                  className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingClose}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
              >
                {isSubmittingClose ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>Clôturer la Caisse &amp; Imprimer le Rapport Z Officiel</span>
              </button>
            </form>
          ) : (
            /* HISTORY OF CLOSED Z-REPORTS */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Dernières Clôtures Z Certifiées ({recentShifts.length})
                </h3>
              </div>

              {recentShifts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
                  Aucune session clôturée enregistrée pour ce magasin.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentShifts.map((s) => (
                    <div
                      key={s.sessionId}
                      className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white font-mono">
                            Z-{s.sessionId.slice(0, 6).toUpperCase()}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            • {s.cashierName}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              s.varianceStatus === "balanced"
                                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                                : s.varianceStatus === "surplus"
                                ? "bg-sky-950 text-sky-400 border-sky-800"
                                : "bg-rose-950 text-rose-400 border-rose-800"
                            }`}
                            dir="ltr"
                          >
                            Écart: {(s.discrepancy || 0) > 0 ? "+" : ""}
                            {formatReceiptAmount(s.discrepancy || 0)} DH
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono" dir="ltr">
                          Attendu: {formatReceiptAmount(s.expectedCash)} DH • Compté:{" "}
                          {formatReceiptAmount(s.countedCash || 0)} DH • CA:{" "}
                          {formatReceiptAmount(s.totalSalesRevenue)} DH ({s.salesCount} ventes)
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePrintShiftReport(s, "Z-REPORT")}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 border border-zinc-700 cursor-pointer self-start sm:self-center"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Réimprimer Z</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
