"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  X,
  Banknote,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Printer,
  RotateCcw,
  FileText,
  AlertTriangle,
  Layers,
  UtensilsCrossed,
  Beef,
  Shirt,
  Smartphone,
  Boxes,
  Gift,
  Building2,
} from "lucide-react";
import { usePosStore, type PaymentMethodType } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";
import { ThermalReceipt, type ReceiptData } from "./ThermalReceipt";
import { printReceipt } from "@/client/printing";
import { formatReceiptDate, toWesternNumerals } from "@/lib/printing/receipt-translations";
import { calculatePaymentFees } from "@/lib/fees";
import { playTapSound, playSuccessSound, playErrorSound } from "@/lib/audio";

// Moroccan Bank BIN Detector Dictionary
const MOROCCAN_BIN_MAP: Record<string, string> = {
  "5160": "Attijariwafa Bank (التجاري وفا بنك)",
  "5300": "Attijariwafa Bank (التجاري وفا بنك)",
  "4032": "Banque Populaire (البنك الشعبي - BCP)",
  "5358": "Banque Populaire (البنك الشعبي - BCP)",
  "4152": "Bank of Africa (BMCE)",
  "5241": "Bank of Africa (BMCE)",
  "4286": "CIH Bank (القرض العقاري والسياحي)",
  "5432": "CIH Bank (القرض العقاري والسياحي)",
  "4921": "Crédit du Maroc (مصرف المغرب)",
  "4211": "Société Générale Maroc (الشركة العامة)",
  "4054": "Al Barid Bank (بريد بنك)",
  "5219": "CFG Bank",
};

export function UnifiedCheckoutModal() {
  const t = useTranslations("Pos");
  const tCommon = useTranslations("Common");
  const { locale } = useAppDictionary();

  const {
    isPaymentModalOpen,
    closePaymentModal,
    selectedPaymentMethod,
    setPaymentMethod,
    amountTendered,
    setAmountTendered,
    getGrandTotal,
    getSubtotal,
    getTaxTotal,
    getChangeDue,
    cart,
    customer,
    completeSale,
    isProcessingPayment,
    deviceCount,
    tenantInfo,
    printerSettings,
    storeType,
    selectedTableName,
  } = usePosStore();

  const [saleResult, setSaleResult] = useState<{
    completed: boolean;
    clientSaleId: string;
    isOffline: boolean;
    receiptData?: ReceiptData;
  } | null>(null);

  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [cardBinInput, setCardBinInput] = useState("");
  const [splitCashAmount, setSplitCashAmount] = useState<string>("");
  const [isGiftVoucherRequested, setIsGiftVoucherRequested] = useState(false);
  const [isBlRequested, setIsBlRequested] = useState(false);
  const [buyerIceInput, setBuyerIceInput] = useState(customer?.ice || "");

  if (!isPaymentModalOpen) return null;

  const grandTotal = getGrandTotal();
  const subtotal = getSubtotal();
  const taxTotal = getTaxTotal();
  const changeDue = getChangeDue();

  // Moroccan Bank detector
  const detectedBank = useMemo(() => {
    const clean = cardBinInput.replace(/\s+/g, "").slice(0, 4);
    return MOROCCAN_BIN_MAP[clean] || (cardBinInput.length >= 4 ? "Carte Bancaire Marocaine / CMI" : null);
  }, [cardBinInput]);

  const feeInfo = calculatePaymentFees(
    grandTotal,
    selectedPaymentMethod === "card" ? "cmi_tpe" : "cash",
    deviceCount || 1,
    "MAD"
  );

  const splitCardAmount = useMemo(() => {
    const cash = parseFloat(splitCashAmount) || 0;
    return Math.max(0, grandTotal - cash);
  }, [splitCashAmount, grandTotal]);

  const handleQuickCash = (extra: number) => {
    playTapSound();
    const current = parseFloat(amountTendered) || 0;
    setAmountTendered((current + extra).toFixed(2));
  };

  const handleExactCash = () => {
    playTapSound();
    setAmountTendered(grandTotal.toFixed(2));
  };

  const handleNumpadPress = (digit: string) => {
    playTapSound();
    if (digit === "C") {
      setAmountTendered("");
      return;
    }
    if (digit === "." && amountTendered.includes(".")) return;
    setAmountTendered(`${amountTendered}${digit}`);
  };

  // Compile Sector Metadata for Receipt and DGI Audit
  const sectorMetadataList: string[] = useMemo(() => {
    const list: string[] = [];

    // Restaurant
    if (storeType === "restaurant" && selectedTableName) {
      list.push(`Table : ${selectedTableName}`);
    }

    // Butchery
    if (storeType === "butchery") {
      const cuts = cart
        .map((i) => i.notes)
        .filter(Boolean)
        .join(", ");
      if (cuts) list.push(`Préparation / Tare : ${cuts}`);
    }

    // Tech
    if (storeType === "tech" || (storeType as string) === "electronics") {
      const imeis = cart
        .map((i) => i.notes)
        .filter(Boolean)
        .join(" | ");
      if (imeis) list.push(`Traçabilité : ${imeis}`);
    }

    // Fashion
    if (storeType === "fashion") {
      const variants = cart
        .map((i) => i.notes)
        .filter(Boolean)
        .join(", ");
      if (variants) list.push(`Variantes : ${variants}`);
      if (isGiftVoucherRequested) {
        list.push("Ticket d'Échange Cadeau (15 Jours)");
      }
    }

    // Wholesale
    if (storeType === "wholesale" || isBlRequested) {
      list.push(`Régime : Bon de Livraison (BL)`);
      if (buyerIceInput || customer?.ice) {
        list.push(`ICE Acheteur : ${toWesternNumerals(buyerIceInput || customer?.ice || "")}`);
      }
    }

    return list;
  }, [storeType, selectedTableName, cart, isGiftVoucherRequested, isBlRequested, buyerIceInput, customer]);

  const handleConfirmCheckout = async () => {
    const receiptLang = printerSettings?.receiptLanguage || "fr";

    const receiptSnapshot: ReceiptData = {
      shopName: tenantInfo?.shopName || "Kasbi Retail (كسب)",
      legalName: tenantInfo?.legalName || tenantInfo?.shopName || "Ste Kasbi SARL",
      logoUrl: tenantInfo?.logoUrl || undefined,
      ice: toWesternNumerals(tenantInfo?.ice || "002345678000045"),
      taxId: toWesternNumerals(tenantInfo?.taxId || "45892134"),
      rcNumber: toWesternNumerals(tenantInfo?.rcNumber || "98765 Casablanca"),
      address: tenantInfo?.address || "123 Bd d'Anfa",
      city: tenantInfo?.city || "Casablanca",
      phone: toWesternNumerals(tenantInfo?.phone || ""),
      receiptNumber: toWesternNumerals(`REC-${Date.now().toString().slice(-6)}`),
      date: formatReceiptDate(new Date(), receiptLang),
      cashierName: "Caisse 1",
      customerName: customer?.name || undefined,
      customerIce: (buyerIceInput || customer?.ice) ? toWesternNumerals(buyerIceInput || customer?.ice || "") : undefined,
      items: cart.map((i) => ({
        name: i.notes ? `${i.name} (${i.notes})` : i.name,
        quantity: i.quantity,
        unitPrice: isGiftVoucherRequested ? 0 : i.unitPrice,
        taxRate: i.taxRate,
        lineTotal: isGiftVoucherRequested ? 0 : i.lineTotal,
      })),
      subtotal: isGiftVoucherRequested ? 0 : subtotal,
      taxTotal: isGiftVoucherRequested ? 0 : taxTotal,
      grandTotal: isGiftVoucherRequested ? 0 : grandTotal,
      paidTotal:
        selectedPaymentMethod === "cash"
          ? Math.max(grandTotal, parseFloat(amountTendered) || grandTotal)
          : selectedPaymentMethod === "card"
          ? feeInfo.customerTotal
          : grandTotal,
      changeDue: selectedPaymentMethod === "cash" ? changeDue : 0,
      paymentMethod: selectedPaymentMethod === "transfer" ? "split" : selectedPaymentMethod,
      currency: "MAD",
      tpeFeeCustomer: selectedPaymentMethod === "card" ? feeInfo.customerFee : undefined,
      tpeFeeMerchant: selectedPaymentMethod === "card" ? feeInfo.merchantFee : undefined,
      tpeBreakdown: selectedPaymentMethod === "card" ? feeInfo.breakdownText : undefined,
      receiptLanguage: receiptLang,
      receiptHeader: printerSettings?.receiptHeader || tenantInfo?.receiptHeader,
      receiptFooter: printerSettings?.receiptFooter || tenantInfo?.receiptFooter,
      showStoreLogo: printerSettings?.showStoreLogo ?? true,
      sectorBadge: storeType,
      sectorMetadata: sectorMetadataList,
      isGiftVoucher: isGiftVoucherRequested,
      isDeliveryNote: isBlRequested || storeType === "wholesale",
    };

    const res = await completeSale();
    if (res.success) {
      playSuccessSound();
      setSaleResult({
        completed: true,
        clientSaleId: res.clientSaleId,
        isOffline: res.isOffline,
        receiptData: receiptSnapshot,
      });

      if (res.isOffline || printerSettings?.autoPrintReceipt) {
        printReceipt({
          ...receiptSnapshot,
          createdAt: receiptSnapshot.date,
          paperWidthMm: printerSettings?.paperWidthMm || 80,
          openDrawer: printerSettings?.openDrawer ?? true,
          receiptLanguage: receiptLang,
        }).catch(() => {});
      }
    } else {
      playErrorSound();
    }
  };

  const handleClose = () => {
    setSaleResult(null);
    setShowReceiptPreview(false);
    closePaymentModal();
  };

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
    >
      <div className="kaspi-frosted-glass w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">
                {saleResult?.completed
                  ? locale === "ar" ? "تم تسجيل العملية بنجاح" : "Encaissement Validé DGI"
                  : locale === "ar" ? "نافذة الدفع الموحدة المتعددة" : "Terminal d'Encaissement Multi-Paiement"}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {locale === "ar" ? "توافق كامل مع معايير DGI والبطاقات المغربية CMI" : "Standard Fiscal Marocain • Conformité DGI & CMI"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="keycap-3d p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900 border border-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {saleResult?.completed ? (
          /* ======================================================== */
          /* SUCCESS SCREEN */
          /* ======================================================== */
          <div className="p-6 overflow-y-auto space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-white text-zinc-950 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {locale === "ar" ? "تمت المعاملة بنجاح" : "Paiement Validé avec Succès"}
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                {saleResult.isOffline
                  ? "Vente enregistrée en mémoire locale (Hors-ligne / Auto-Sync)"
                  : "Transaction synchronisée en temps réel avec le grand livre"}
              </p>
            </div>

            {/* Toggle Receipt Preview */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowReceiptPreview(!showReceiptPreview)}
                className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-semibold underline underline-offset-4 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {showReceiptPreview
                    ? locale === "ar" ? "إخفاء تذكرة الصندوق" : "Masquer l'aperçu du ticket"
                    : locale === "ar" ? "معاينة تذكرة الصندوق الحرارية DGI" : "Aperçu du ticket thermique DGI"}
                </span>
              </button>
            </div>

            {/* Thermal Receipt Preview */}
            {showReceiptPreview && saleResult.receiptData && (
              <div className="pt-2">
                <ThermalReceipt
                  data={saleResult.receiptData}
                  width={printerSettings?.paperWidthMm === 58 ? "58mm" : "80mm"}
                  language={printerSettings?.receiptLanguage || "fr"}
                  onPrint={() => {
                    if (saleResult.receiptData) {
                      printReceipt({
                        ...saleResult.receiptData,
                        createdAt: saleResult.receiptData.date,
                        paperWidthMm: printerSettings?.paperWidthMm || 80,
                        openDrawer: printerSettings?.openDrawer ?? true,
                        receiptLanguage: printerSettings?.receiptLanguage || "fr",
                      }).catch(() => {});
                    }
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  if (saleResult.receiptData) {
                    printReceipt({
                      ...saleResult.receiptData,
                      createdAt: saleResult.receiptData.date,
                      paperWidthMm: printerSettings?.paperWidthMm || 80,
                      openDrawer: printerSettings?.openDrawer ?? true,
                      receiptLanguage: printerSettings?.receiptLanguage || "fr",
                    }).catch(() => {});
                  }
                }}
                className="keycap-3d flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold text-xs transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{locale === "ar" ? "إعادة طباعة التذكرة" : "Réimprimer Ticket"}</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="keycap-3d flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs transition cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{locale === "ar" ? "معاملة جديدة" : "Nouvelle Vente"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* ACTIVE CHECKOUT FORM */
          /* ======================================================== */
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Total Highlight Bar */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-zinc-400 block">
                  {locale === "ar" ? "المجموع المستحق الصافي" : "Total Net à Payer"}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {cart.length} {locale === "ar" ? "عناصر بالسلة" : "articles dans le panier"}
                </span>
              </div>
              <span className="text-3xl font-black text-white font-mono tracking-tight tabular-nums">
                {(selectedPaymentMethod === "card" ? feeInfo.customerTotal : grandTotal).toFixed(2)}{" "}
                <span className="text-sm text-zinc-400">MAD</span>
              </span>
            </div>

            {/* 4 Multi-Payment Method Cards */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {locale === "ar" ? "اختر وسيلة الأداء:" : "Mode de Paiement :"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`keycap-3d flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                    selectedPaymentMethod === "cash"
                      ? "bg-white text-zinc-950 border-white shadow-sm"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Banknote className="w-5 h-5 mb-1.5" />
                  <span>{locale === "ar" ? "نقداً (كاش)" : "Espèces"}</span>
                </button>

                {/* Card / TPE */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`keycap-3d flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                    selectedPaymentMethod === "card"
                      ? "bg-white text-zinc-950 border-white shadow-sm"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1.5" />
                  <span>{locale === "ar" ? "بطاقة TPE" : "Carte TPE"}</span>
                </button>

                {/* Karné Credit */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("credit")}
                  className={`keycap-3d flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                    selectedPaymentMethod === "credit"
                      ? "bg-white text-zinc-950 border-white shadow-sm"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <UserCheck className="w-5 h-5 mb-1.5" />
                  <span>{locale === "ar" ? "كناش الكريدي" : "Carnet Crédit"}</span>
                </button>

                {/* Mixed / Split */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("transfer")}
                  className={`keycap-3d flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                    selectedPaymentMethod === "transfer"
                      ? "bg-white text-zinc-950 border-white shadow-sm"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-5 h-5 mb-1.5" />
                  <span>{locale === "ar" ? "دفع مجزأ" : "Mixte / Split"}</span>
                </button>
              </div>
            </div>

            {/* 1. CASH PAYMENT VIEW */}
            {selectedPaymentMethod === "cash" && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-400">
                      {locale === "ar" ? "المبلغ المستلم من الزبون (د.م):" : "Montant Reçu du Client (MAD) :"}
                    </label>
                    <span className="font-mono text-xs text-zinc-400">
                      Rendu: <strong className="text-white">{changeDue.toFixed(2)} MAD</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={grandTotal.toFixed(2)}
                    className="w-full h-12 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-2xl font-black focus:outline-none focus:border-zinc-700 tabular-nums"
                  />
                </div>

                {/* Quick Cash Bills Pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="keycap-3d px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white hover:bg-zinc-850 cursor-pointer"
                  >
                    {locale === "ar" ? "المبلغ بالضبط" : "Montant Exact"}
                  </button>
                  {[20, 50, 100, 200].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickCash(val)}
                      className="keycap-3d px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-white hover:bg-zinc-850 cursor-pointer"
                    >
                      +{val} MAD
                    </button>
                  ))}
                </div>

                {/* Touch Numpad */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "C"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleNumpadPress(d)}
                      className="keycap-3d py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono font-black text-sm hover:border-zinc-700 cursor-pointer"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. CARD / TPE VIEW WITH MOROCCAN BIN DETECTOR */}
            {selectedPaymentMethod === "card" && (
              <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Paiement Terminal CMI / TPE</span>
                  <span className="font-mono text-xs text-zinc-400">
                    {deviceCount || 1} Appareil(s) • Commission: {feeInfo.customerPercentage}%
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    {locale === "ar" ? "كاشف البنك المغربي (أدخل أول 4 أرقام من البطاقة):" : "Détecteur de Banque Marocaine (4 premiers chiffres) :"}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={cardBinInput}
                    onChange={(e) => setCardBinInput(e.target.value)}
                    placeholder="Ex: 5160 (Attijari) / 4032 (BCP) / 4286 (CIH)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                {detectedBank && (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-2.5 text-xs text-white">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold">{detectedBank}</span>
                  </div>
                )}

                <div className="text-[11px] font-mono text-zinc-400 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 select-all leading-relaxed">
                  {feeInfo.breakdownText}
                </div>
              </div>
            )}

            {/* 3. KARNE CREDIT VIEW */}
            {selectedPaymentMethod === "credit" && (
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{locale === "ar" ? "سجل الكريدي والديون" : "Carnet Crédit Client"}</span>
                  <UserCheck className="w-4 h-4 text-white" />
                </div>

                {customer ? (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{customer.name}</span>
                      <span className="font-mono">{customer.phone || "Sans téléphone"}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 font-mono text-[11px]">
                      <span>{locale === "ar" ? "الرصيد الجاري المستحق:" : "Solde Débiteur Actuel :"}</span>
                      <span className="text-white font-bold">{customer.currentCreditBalance.toFixed(2)} MAD</span>
                    </div>
                    {customer.creditLimit && (
                      <div className="flex justify-between text-zinc-400 font-mono text-[11px]">
                        <span>{locale === "ar" ? "سقف الائتمان المسموح:" : "Plafond Autorisé :"}</span>
                        <span>{customer.creditLimit.toFixed(2)} MAD</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      {locale === "ar"
                        ? "يجب تحديد زبون في السلة قبل تفعيل البيع بالكريدي."
                        : "Veuillez rattacher un client dans le panier pour enregistrer la vente à crédit."}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 4. SPLIT / MIXTE PAYMENT VIEW */}
            {selectedPaymentMethod === "transfer" && (
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{locale === "ar" ? "دفع مجزأ (نقداً + بطاقة)" : "Paiement Mixte (Espèces + TPE)"}</span>
                  <Layers className="w-4 h-4 text-white" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      {locale === "ar" ? "جزء الكاش (د.م)" : "Part Espèces (MAD)"}
                    </label>
                    <input
                      type="number"
                      value={splitCashAmount}
                      onChange={(e) => setSplitCashAmount(e.target.value)}
                      placeholder={(grandTotal / 2).toFixed(2)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      {locale === "ar" ? "جزء البطاقة (TPE)" : "Part Carte TPE (MAD)"}
                    </label>
                    <div className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs">
                      {splitCardAmount.toFixed(2)} MAD
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sector Specific Toggles */}
            <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs flex-wrap">
              {/* Fashion Gift Voucher Toggle */}
              {storeType === "fashion" && (
                <button
                  type="button"
                  onClick={() => setIsGiftVoucherRequested(!isGiftVoucherRequested)}
                  className={`keycap-3d px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer ${
                    isGiftVoucherRequested
                      ? "bg-white text-zinc-950 border-white"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800"
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>{locale === "ar" ? "تذكرة تبديل بدون سعر" : "Ticket Cadeau (sans prix)"}</span>
                </button>
              )}

              {/* Wholesale BL Toggle */}
              {(storeType === "wholesale" || isBlRequested) && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBlRequested(!isBlRequested)}
                    className={`keycap-3d px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer ${
                      isBlRequested
                        ? "bg-white text-zinc-950 border-white"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Bon de Livraison (BL)</span>
                  </button>
                  <input
                    type="text"
                    value={buyerIceInput}
                    onChange={(e) => setBuyerIceInput(e.target.value)}
                    placeholder="ICE Acheteur..."
                    className="h-8 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Confirm & Complete Sale CTA */}
            <button
              type="button"
              onClick={handleConfirmCheckout}
              disabled={isProcessingPayment || (selectedPaymentMethod === "credit" && !customer)}
              className="keycap-3d sheen-btn w-full h-14 rounded-2xl bg-white hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed text-zinc-950 font-black text-sm shadow-xl flex items-center justify-center gap-2.5 cursor-pointer transition"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>
                {isProcessingPayment
                  ? locale === "ar" ? "جاري توثيق العملية..." : "Traitement & Validation..."
                  : locale === "ar" ? "تأكيد الدفع وطباعة التذكرة DGI" : "Valider l'Encaissement & Imprimer DGI"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
