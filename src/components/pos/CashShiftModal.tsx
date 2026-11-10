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
} from "lucide-react";
import { toast } from "sonner";
import { printReceipt } from "@/client/printing";
import { usePosStore } from "@/client/store/usePosStore";
import { getApiUrl } from "@/client/sync-engine";
import { useAppDictionary } from "@/i18n/schema";
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
  const { locale, t } = useAppDictionary();

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

  const shiftI18n = {
    ar: {
      modalTitle: "إدارة صندوق الكاشير وإقفال اليومية (X / Z)",
      modalSubtitle: "رصيد الافتتاح، حركات النقدية والمصروفات، وإقفال اليومية المعتمد",
      drawerOpen: "الصندوق مفتوح",
      drawerClosed: "الصندوق مغلق",
      tabXReport: "تقرير الوضع الحالي (X)",
      tabMovements: "حركات الصندوق",
      tabCloseZ: "إقفال الصندوق (Z)",
      tabHistory: "سجل الإقفالات",
      openShiftTitle: "فتح جلسة صندوق جديدة",
      openShiftSubtitle: "أدخل رصيد الفكة الأولي في الدرج لبدء جلسة البيع.",
      initialFloatLabel: "رصيد الفكة الأولي (MAD)",
      openingNotesLabel: "ملاحظات الافتتاح (اختياري)",
      openingNotesPlaceholder: "مثلاً: وردية الصباح - كاشير رقم 1",
      openShiftBtn: "فتح الصندوق وبدء العمل",
      openingShiftBtn: "جاري فتح الصندوق...",
      theoreticalCashTitle: "الرصيد النظري المتوقع في الدرج",
      openedBy: "فُتحت في",
      byUser: "بواسطة",
      printXBtn: "طباعة تقرير X",
      initialFloat: "رصيد الافتتاح",
      cashSales: "مبيعات نقدية",
      cashIn: "إيداعات إضافية (+In)",
      cashOut: "مصاريف وسحوبات (-Out)",
      cardSales: "مبيعات البطاقة (TPE)",
      creditSales: "مبيعات الكريدي (Krediat)",
      ticketsEncashed: "إجمالي الفواتير",
      totalRevenue: "إجمالي رقم المعاملات",
      newMovementTitle: "تسجيل حركة نقدية في الصندوق",
      pettyCash: "مصروفات نثرية",
      supplierPayout: "سداد مورد",
      cashOutAction: "سحب نقدي",
      cashInAction: "تزويد بفكة (+In)",
      movementAmountLabel: "المبلغ (MAD) *",
      movementReasonLabel: "السبب / البيان *",
      movementReasonPlaceholder: "مثال: شراء أكياس تعبئة / سداد موزع الحليب",
      validateMovementBtn: "تأكيد الحركة النقدية",
      movementsLogTitle: "سجل حركات الجلسة الحالية",
      noMovements: "لا توجد أي حركات نقدية مسجلة في هذه الجلسة.",
      expectedCashDrawer: "المبلغ المتوقع في الدرج (النظري)",
      exactAmountBtn: "المبلغ النظري بالكامل",
      actualCountedCash: "المبلغ الفعلي المعدود في الدرج (MAD) *",
      countedPlaceholder: "أدخل إجمالي النقود والقطع المعدنية المعدودة...",
      balancedTitle: "الصندوق متطابق تماماً بدون أي فارق",
      surplusTitle: "فائض في الصندوق (زيادة)",
      shortageTitle: "عجز في الصندوق (نقص)",
      closingNotesLabel: "ملاحظات الإقفال (اختياري)",
      closingNotesPlaceholder: "مثلاً: تم إيداع المبلغ في الخزنة الحديدية",
      closeZBtn: "إقفال الصندوق وطباعة تقرير Z الرسمي",
      closingZBtn: "جاري إقفال الصندوق...",
      recentZTitle: "آخر إقفالات Z المعتمدة",
      noZHistory: "لا توجد جلسات مقفلة سابقة لهذا المتجر.",
      reprintZ: "إعادة طباعة Z",
      diffLabel: "الفارق:",
      expectedLabel: "المتوقع:",
      countedLabel: "المعدود:",
      salesLabel: "مبيعات:",
    },
    fr: {
      modalTitle: "Gestion du Tiroir-Caisse & Clôture (X / Z)",
      modalSubtitle: "Fond de caisse, entrées/sorties espèces, paiements fournisseurs et clôture Z certifiée",
      drawerOpen: "CAISSE OUVERTE",
      drawerClosed: "CAISSE FERMÉE",
      tabXReport: "État Actuel (Rapport X)",
      tabMovements: "Mouvements Espèces",
      tabCloseZ: "Clôturer la Caisse (Rapport Z)",
      tabHistory: "Historique Clôtures",
      openShiftTitle: "Ouverture de Caisse",
      openShiftSubtitle: "Saisissez le fond de caisse initial (monnaie dans le tiroir) pour démarrer la journée.",
      initialFloatLabel: "Fond de Caisse Initial (MAD)",
      openingNotesLabel: "Note d'ouverture (Optionnel)",
      openingNotesPlaceholder: "Ex: Équipe du matin - Caisse N°1",
      openShiftBtn: "Ouvrir la Caisse & Démarrer le Service",
      openingShiftBtn: "Ouverture en cours...",
      theoreticalCashTitle: "Fond Théorique en Caisse (Attendu)",
      openedBy: "Ouvert à",
      byUser: "par",
      printXBtn: "Imprimer Rapport X",
      initialFloat: "Fond Initial",
      cashSales: "Ventes Espèces",
      cashIn: "Entrées Caisse (+In)",
      cashOut: "Sorties / Dépenses (-Out)",
      cardSales: "Ventes Carte TPE",
      creditSales: "Ventes Crédit (Krediat)",
      ticketsEncashed: "Total Tickets",
      totalRevenue: "Chiffre d'Affaires Total",
      newMovementTitle: "Nouveau Mouvement de Caisse",
      pettyCash: "Petite Dépense",
      supplierPayout: "Paiement Fournisseur",
      cashOutAction: "Retrait Caisse",
      cashInAction: "Apport Monnaie (+In)",
      movementAmountLabel: "Montant (MAD) *",
      movementReasonLabel: "Motif / Justification *",
      movementReasonPlaceholder: "Ex: Règlement livreur eau / Achat fournitures",
      validateMovementBtn: "Valider le Mouvement",
      movementsLogTitle: "Journal des Mouvements de la Session",
      noMovements: "Aucun mouvement d'espèces enregistré durant cette session.",
      expectedCashDrawer: "Espèces Attendues dans le Tiroir",
      exactAmountBtn: "Montant Exact",
      actualCountedCash: "Espèces Réelles Comptées (MAD) *",
      countedPlaceholder: "Saisissez le total des billets et pièces comptés...",
      balancedTitle: "Caisse Parfaitement Équilibrée",
      surplusTitle: "Excédent de Caisse (Surplus)",
      shortageTitle: "Déficit / Manquant de Caisse (Shortage)",
      closingNotesLabel: "Observations de Clôture (Optionnel)",
      closingNotesPlaceholder: "Ex: Dépôt coffre-fort effectué",
      closeZBtn: "Clôturer la Caisse & Imprimer le Rapport Z",
      closingZBtn: "Clôture en cours...",
      recentZTitle: "Dernières Clôtures Z Certifiées",
      noZHistory: "Aucune session clôturée enregistrée pour ce magasin.",
      reprintZ: "Réimprimer Z",
      diffLabel: "Écart:",
      expectedLabel: "Attendu:",
      countedLabel: "Compté:",
      salesLabel: "ventes:",
    },
    en: {
      modalTitle: "Cash Drawer Management & Shift Closure (X / Z)",
      modalSubtitle: "Cash float, cash-in/out expenses, supplier payouts, and certified Z-report",
      drawerOpen: "REGISTER OPEN",
      drawerClosed: "REGISTER CLOSED",
      tabXReport: "Live Shift (X-Report)",
      tabMovements: "Cash Movements",
      tabCloseZ: "Close Register (Z-Report)",
      tabHistory: "Shift History",
      openShiftTitle: "Open Cash Register",
      openShiftSubtitle: "Enter the initial starting float (coins and bills in drawer) to start shift.",
      initialFloatLabel: "Starting Cash Float (MAD)",
      openingNotesLabel: "Opening Note (Optional)",
      openingNotesPlaceholder: "e.g., Morning Shift - Till 1",
      openShiftBtn: "Open Register & Start Shift",
      openingShiftBtn: "Opening register...",
      theoreticalCashTitle: "Expected Theoretical Cash in Drawer",
      openedBy: "Opened at",
      byUser: "by",
      printXBtn: "Print X-Report",
      initialFloat: "Starting Float",
      cashSales: "Cash Sales",
      cashIn: "Cash In (+In)",
      cashOut: "Cash Out (-Out)",
      cardSales: "Card (POS) Sales",
      creditSales: "Credit (Ledger) Sales",
      ticketsEncashed: "Tickets Encashed",
      totalRevenue: "Total Revenue",
      newMovementTitle: "New Cash Movement",
      pettyCash: "Petty Cash",
      supplierPayout: "Supplier Payout",
      cashOutAction: "Cash Drop",
      cashInAction: "Change Top-Up (+In)",
      movementAmountLabel: "Amount (MAD) *",
      movementReasonLabel: "Reason / Memo *",
      movementReasonPlaceholder: "e.g., Delivery fee or grocery supplies purchase",
      validateMovementBtn: "Record Cash Movement",
      movementsLogTitle: "Current Shift Cash Journal",
      noMovements: "No cash movements recorded during this shift.",
      expectedCashDrawer: "Expected Cash in Drawer",
      exactAmountBtn: "Exact Expected",
      actualCountedCash: "Actual Counted Cash (MAD) *",
      countedPlaceholder: "Enter total bills and coins counted in drawer...",
      balancedTitle: "Register Perfectly Balanced",
      surplusTitle: "Cash Over / Surplus",
      shortageTitle: "Cash Shortage / Deficit",
      closingNotesLabel: "Closing Observations (Optional)",
      closingNotesPlaceholder: "e.g., Safe drop completed",
      closeZBtn: "Close Register & Print Official Z-Report",
      closingZBtn: "Closing register...",
      recentZTitle: "Recent Certified Z-Reports",
      noZHistory: "No closed shifts recorded for this store.",
      reprintZ: "Reprint Z",
      diffLabel: "Diff:",
      expectedLabel: "Expected:",
      countedLabel: "Counted:",
      salesLabel: "sales:",
    },
  }[locale] || {
    modalTitle: "Cash Drawer Management & Shift Closure (X / Z)",
    modalSubtitle: "Cash float, cash-in/out expenses, supplier payouts, and certified Z-report",
    drawerOpen: "REGISTER OPEN",
    drawerClosed: "REGISTER CLOSED",
    tabXReport: "Live Shift (X-Report)",
    tabMovements: "Cash Movements",
    tabCloseZ: "Close Register (Z-Report)",
    tabHistory: "Shift History",
    openShiftTitle: "Open Cash Register",
    openShiftSubtitle: "Enter the initial starting float to start shift.",
    initialFloatLabel: "Starting Cash Float (MAD)",
    openingNotesLabel: "Opening Note (Optional)",
    openingNotesPlaceholder: "e.g., Morning Shift - Till 1",
    openShiftBtn: "Open Register & Start Shift",
    openingShiftBtn: "Opening register...",
    theoreticalCashTitle: "Expected Theoretical Cash in Drawer",
    openedBy: "Opened at",
    byUser: "by",
    printXBtn: "Print X-Report",
    initialFloat: "Starting Float",
    cashSales: "Cash Sales",
    cashIn: "Cash In (+In)",
    cashOut: "Cash Out (-Out)",
    cardSales: "Card (POS) Sales",
    creditSales: "Credit (Ledger) Sales",
    ticketsEncashed: "Tickets Encashed",
    totalRevenue: "Total Revenue",
    newMovementTitle: "New Cash Movement",
    pettyCash: "Petty Cash",
    supplierPayout: "Supplier Payout",
    cashOutAction: "Cash Drop",
    cashInAction: "Change Top-Up (+In)",
    movementAmountLabel: "Amount (MAD) *",
    movementReasonLabel: "Reason / Memo *",
    movementReasonPlaceholder: "e.g., Delivery fee or supplies",
    validateMovementBtn: "Record Cash Movement",
    movementsLogTitle: "Current Shift Cash Journal",
    noMovements: "No cash movements recorded during this shift.",
    expectedCashDrawer: "Expected Cash in Drawer",
    exactAmountBtn: "Exact Expected",
    actualCountedCash: "Actual Counted Cash (MAD) *",
    countedPlaceholder: "Enter total bills and coins counted...",
    balancedTitle: "Register Perfectly Balanced",
    surplusTitle: "Cash Over / Surplus",
    shortageTitle: "Cash Shortage / Deficit",
    closingNotesLabel: "Closing Observations (Optional)",
    closingNotesPlaceholder: "e.g., Safe drop completed",
    closeZBtn: "Close Register & Print Official Z-Report",
    closingZBtn: "Closing register...",
    recentZTitle: "Recent Certified Z-Reports",
    noZHistory: "No closed shifts recorded for this store.",
    reprintZ: "Reprint Z",
    diffLabel: "Diff:",
    expectedLabel: "Expected:",
    countedLabel: "Counted:",
    salesLabel: "sales:",
  };

  if (!isOpen) return null;

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOpen(true);
    try {
      const res = await fetch(getApiUrl("/api/v1/cash-sessions"), {
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
      toast.success(locale === "ar" ? "تم فتح جلسة الصندوق بنجاح" : "Session de caisse ouverte avec succès !");
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
      toast.error(locale === "ar" ? "يرجى إدخال مبلغ صحيح وسبب الحركة" : "Veuillez saisir un montant valide et un motif");
      return;
    }

    setIsSubmittingMovement(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/cash-sessions/${activeShift.sessionId}/movements`), {
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
      toast.success(locale === "ar" ? "تم تسجيل الحركة النقدية بنجاح" : "Mouvement de caisse enregistré !");
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

    toast.success(`${reportType} OK`);
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const counted = parseFloat(countedCashInput);
    if (Number.isNaN(counted) || counted < 0) {
      toast.error(locale === "ar" ? "يرجى إدخال المبلغ الفعلي المعدود في الصندوق" : "Veuillez saisir le montant réel compté dans le tiroir-caisse");
      return;
    }

    setIsSubmittingClose(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/cash-sessions/${activeShift.sessionId}/close`), {
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
      toast.success(locale === "ar" ? "تم إقفال جلسة الصندوق بنجاح وتوليد تقرير Z" : "Session de caisse clôturée avec succès (Z-Report généré) !");

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
    <div dir="ltr" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-3xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-zinc-900 text-white">
              {activeShift ? <Unlock className="w-5 h-5 text-zinc-300" /> : <Lock className="w-5 h-5 text-zinc-400" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{shiftI18n.modalTitle}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.05] text-zinc-300">
                  {activeShift ? shiftI18n.drawerOpen : shiftI18n.drawerClosed}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {shiftI18n.modalSubtitle}
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
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{shiftI18n.tabXReport}</span>
              </button>

              <button
                onClick={() => setActiveTab("movements")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "movements"
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{shiftI18n.tabMovements} ({activeShift.movements.length})</span>
              </button>

              <button
                onClick={() => {
                  setCountedCashInput(activeShift.expectedCash.toFixed(2));
                  setActiveTab("close_z");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "close_z"
                    ? "bg-white text-zinc-950 shadow-xs"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-900 border border-white/10"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{shiftI18n.tabCloseZ}</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-zinc-950 shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{shiftI18n.tabHistory} ({recentShifts.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!activeShift && activeTab !== "history" ? (
            /* OPEN SHIFT VIEW */
            <form onSubmit={handleOpenShift} className="max-w-md mx-auto space-y-5 py-2">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 text-white flex items-center justify-center mx-auto">
                  <Banknote className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {shiftI18n.openShiftTitle}
                </h3>
                <p className="text-xs text-zinc-400">
                  {shiftI18n.openShiftSubtitle}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  {shiftI18n.initialFloatLabel}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-xl font-bold font-mono text-white text-center focus:outline-none focus:border-white"
                />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {["200.00", "500.00", "1000.00", "2000.00"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOpeningCashInput(preset)}
                      className="py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 cursor-pointer"
                    >
                      {preset} {t.common.currency}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {shiftI18n.openingNotesLabel}
                </label>
                <input
                  type="text"
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  placeholder={shiftI18n.openingNotesPlaceholder}
                  className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingOpen}
                className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isSubmittingOpen ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                <span>{isSubmittingOpen ? shiftI18n.openingShiftBtn : shiftI18n.openShiftBtn}</span>
              </button>
            </form>
          ) : activeShift && activeTab === "x_report" ? (
            /* LIVE X-REPORT VIEW */
            <div className="space-y-6">
              {/* Top Expected Cash Banner */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    {shiftI18n.theoreticalCashTitle}
                  </span>
                  <div className="text-3xl font-black text-white font-mono mt-1" dir="ltr">
                    {formatReceiptAmount(activeShift.expectedCash)} {t.common.currency}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {shiftI18n.openedBy} {formatReceiptDate(activeShift.openedAt, locale)} {shiftI18n.byUser}{" "}
                    <strong className="text-white">{activeShift.cashierName}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrintShiftReport(activeShift, "X-REPORT")}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{shiftI18n.printXBtn}</span>
                </button>
              </div>

              {/* 4-Card Drawer Cash Math Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block">{shiftI18n.initialFloat}</span>
                  <span className="text-base font-bold text-white font-mono mt-1 block" dir="ltr">
                    +{formatReceiptAmount(activeShift.openingCash)} {t.common.currency}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block">{shiftI18n.cashSales}</span>
                  <span className="text-base font-bold text-white font-mono mt-1 block" dir="ltr">
                    +{formatReceiptAmount(activeShift.cashSalesTotal)} {t.common.currency}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block">{shiftI18n.cashIn}</span>
                  <span className="text-base font-bold text-white font-mono mt-1 block" dir="ltr">
                    +{formatReceiptAmount(activeShift.cashInTotal)} {t.common.currency}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 block">{shiftI18n.cashOut}</span>
                  <span className="text-base font-bold text-white font-mono mt-1 block" dir="ltr">
                    -{formatReceiptAmount(activeShift.cashOutTotal)} {t.common.currency}
                  </span>
                </div>
              </div>

              {/* Secondary Revenue Breakdown */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400 block">{shiftI18n.cardSales}</span>
                  <span className="font-bold text-white font-mono" dir="ltr">
                    {formatReceiptAmount(activeShift.cardSalesTotal)} {t.common.currency}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">{shiftI18n.creditSales}</span>
                  <span className="font-bold text-white font-mono" dir="ltr">
                    {formatReceiptAmount(activeShift.creditSalesTotal)} {t.common.currency}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">{shiftI18n.ticketsEncashed}</span>
                  <span className="font-bold text-white font-mono" dir="ltr">
                    {activeShift.salesCount} {locale === "ar" ? "عملية" : "ventes"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">{shiftI18n.totalRevenue}</span>
                  <span className="font-bold text-white font-mono" dir="ltr">
                    {formatReceiptAmount(activeShift.totalSalesRevenue)} {t.common.currency}
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
                  <PlusCircle className="w-4 h-4 text-zinc-300" />
                  <span>{shiftI18n.newMovementTitle}</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "petty_cash" as const, label: shiftI18n.pettyCash, icon: ArrowUpRight },
                    { id: "supplier_payout" as const, label: shiftI18n.supplierPayout, icon: ArrowUpRight },
                    { id: "cash_out" as const, label: shiftI18n.cashOutAction, icon: ArrowUpRight },
                    { id: "cash_in" as const, label: shiftI18n.cashInAction, icon: ArrowDownLeft },
                  ].map((tItem) => (
                    <button
                      key={tItem.id}
                      type="button"
                      onClick={() => setMovementType(tItem.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        movementType === tItem.id
                          ? "bg-white text-zinc-950 shadow-xs border-white"
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
                      {shiftI18n.movementAmountLabel}
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
                      {shiftI18n.movementReasonLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      placeholder={shiftI18n.movementReasonPlaceholder}
                      className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingMovement}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingMovement && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{shiftI18n.validateMovementBtn}</span>
                  </button>
                </div>
              </form>

              {/* Movements History List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 font-mono">
                  {shiftI18n.movementsLogTitle} ({activeShift.movements.length})
                </h4>
                {activeShift.movements.length === 0 ? (
                  <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500 font-mono">
                    {shiftI18n.noMovements}
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
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
                              {mv.type.toUpperCase()} • {formatReceiptDate(mv.createdAt, locale)} •{" "}
                              {mv.createdByName || "Caissier"}
                            </div>
                          </div>
                          <div
                            className={`font-bold font-mono text-sm ${
                              isIn ? "text-emerald-400" : "text-rose-400"
                            }`}
                            dir="ltr"
                          >
                            {isIn ? "+" : "-"}
                            {formatReceiptAmount(mv.amount)} {t.common.currency}
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
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 block">
                    {shiftI18n.expectedCashDrawer}
                  </span>
                  <span className="text-2xl font-black text-white font-mono" dir="ltr">
                    {formatReceiptAmount(activeShift.expectedCash)} {t.common.currency}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCountedCashInput(activeShift.expectedCash.toFixed(2))}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 cursor-pointer"
                >
                  {shiftI18n.exactAmountBtn}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  {shiftI18n.actualCountedCash}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={countedCashInput}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  placeholder={shiftI18n.countedPlaceholder}
                  className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-xl font-black font-mono text-white text-center focus:outline-none focus:border-white"
                />
              </div>

              {liveVariance !== null && (
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    liveVariance === 0
                      ? "bg-zinc-900 border-white/20 text-white"
                      : liveVariance > 0
                      ? "bg-zinc-900 border-white/30 text-white"
                      : "bg-zinc-900 border-rose-500/40 text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {liveVariance === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    <span>
                      {liveVariance === 0
                        ? shiftI18n.balancedTitle
                        : liveVariance > 0
                        ? shiftI18n.surplusTitle
                        : shiftI18n.shortageTitle}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-base" dir="ltr">
                    {liveVariance > 0 ? "+" : ""}
                    {formatReceiptAmount(liveVariance)} {t.common.currency}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {shiftI18n.closingNotesLabel}
                </label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder={shiftI18n.closingNotesPlaceholder}
                  className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingClose}
                className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingClose ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>{isSubmittingClose ? shiftI18n.closingZBtn : shiftI18n.closeZBtn}</span>
              </button>
            </form>
          ) : (
            /* HISTORY OF CLOSED Z-REPORTS */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  {shiftI18n.recentZTitle} ({recentShifts.length})
                </h3>
              </div>

              {recentShifts.length === 0 ? (
                <div className="p-8 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500 font-mono">
                  {shiftI18n.noZHistory}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentShifts.map((s) => (
                    <div
                      key={s.sessionId}
                      className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-zinc-300"
                            dir="ltr"
                          >
                            {shiftI18n.diffLabel} {(s.discrepancy || 0) > 0 ? "+" : ""}
                            {formatReceiptAmount(s.discrepancy || 0)} {t.common.currency}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono" dir="ltr">
                          {shiftI18n.expectedLabel} {formatReceiptAmount(s.expectedCash)} {t.common.currency} • {shiftI18n.countedLabel}{" "}
                          {formatReceiptAmount(s.countedCash || 0)} {t.common.currency} • CA:{" "}
                          {formatReceiptAmount(s.totalSalesRevenue)} {t.common.currency} ({s.salesCount} {shiftI18n.salesLabel})
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePrintShiftReport(s, "Z-REPORT")}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 border border-zinc-700 cursor-pointer self-start sm:self-center"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{shiftI18n.reprintZ}</span>
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
