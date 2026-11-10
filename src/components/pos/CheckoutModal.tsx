"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { usePosStore, type PaymentMethodType } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";
import { ThermalReceipt, type ReceiptData } from "./ThermalReceipt";
import { printReceipt } from "@/client/printing";
import { formatReceiptDate, toWesternNumerals } from "@/lib/printing/receipt-translations";
import { calculatePaymentFees } from "@/lib/fees";
import { playTapSound, playSuccessSound, playErrorSound } from "@/lib/audio";

export const CheckoutModal: React.FC = () => {
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
  } = usePosStore();

  const [saleResult, setSaleResult] = useState<{
    completed: boolean;
    clientSaleId: string;
    isOffline: boolean;
    receiptData?: ReceiptData;
  } | null>(null);

  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  if (!isPaymentModalOpen) return null;

  const grandTotal = getGrandTotal();
  const subtotal = getSubtotal();
  const taxTotal = getTaxTotal();
  const changeDue = getChangeDue();

  const feeInfo = calculatePaymentFees(
    grandTotal,
    selectedPaymentMethod === "card" ? "cmi_tpe" : "cash",
    deviceCount || 1,
    "MAD"
  );

  const handleQuickCash = (extra: number) => {
    playTapSound();
    const current = parseFloat(amountTendered) || 0;
    setAmountTendered((current + extra).toFixed(2));
  };

  const handleExactCash = () => {
    playTapSound();
    setAmountTendered(grandTotal.toFixed(2));
  };

  const handleConfirmCheckout = async () => {
    const receiptLang = printerSettings?.receiptLanguage || "fr";
    const receiptSnapshot: ReceiptData = {
      shopName: tenantInfo?.shopName || "Kasbi Retail (كسب)",
      legalName: tenantInfo?.legalName || tenantInfo?.shopName || "Ste Kasbi SARL",
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
      customerIce: customer?.ice ? toWesternNumerals(customer.ice) : undefined,
      items: cart.map((i) => ({
        name: i.notes ? `${i.name} (${i.notes})` : i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
        lineTotal: i.lineTotal,
      })),
      subtotal,
      taxTotal,
      grandTotal,
      paidTotal:
        selectedPaymentMethod === "cash"
          ? Math.max(grandTotal, parseFloat(amountTendered) || grandTotal)
          : selectedPaymentMethod === "card"
          ? feeInfo.customerTotal
          : grandTotal,
      changeDue,
      paymentMethod: selectedPaymentMethod,
      currency: "MAD",
      tpeFeeCustomer: selectedPaymentMethod === "card" ? feeInfo.customerFee : undefined,
      tpeFeeMerchant: selectedPaymentMethod === "card" ? feeInfo.merchantFee : undefined,
      tpeBreakdown: selectedPaymentMethod === "card" ? feeInfo.breakdownText : undefined,
      receiptLanguage: receiptLang,
      receiptHeader: printerSettings?.receiptHeader || tenantInfo?.receiptHeader,
      receiptFooter: printerSettings?.receiptFooter || tenantInfo?.receiptFooter,
      showStoreLogo: printerSettings?.showStoreLogo ?? true,
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

      // Automatically print receipt if offline or autoPrintReceipt is enabled
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
    <div dir="ltr" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/40">
          <h3 className="font-bold text-white text-base">
            {saleResult?.completed ? t("saleSuccess") : t("paymentMethods")}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {saleResult?.completed ? (
          /* Success Screen with Receipt Preview Toggle */
          <div className="p-5 overflow-y-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{t("saleSuccess")}</h2>
              <p className="text-xs text-zinc-400 mt-1">
                {saleResult.isOffline
                  ? "Sale saved locally. Will sync when online."
                  : "Transaction enregistrée avec succès"}
              </p>
            </div>

            {/* Toggle Receipt Preview */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowReceiptPreview(!showReceiptPreview)}
                className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-semibold underline underline-offset-4 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {showReceiptPreview ? "Masquer le ticket" : "Aperçu du ticket de caisse"}
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

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => printReceipt(saleResult.receiptData)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm border border-zinc-800 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t("printReceipt")}</span>
              </button>

              <button
                onClick={handleClose}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t("newSale")}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <div className="p-5 space-y-5 overflow-y-auto">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedPaymentMethod === "cash"
                    ? "bg-white border-white text-black shadow-sm"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Banknote className="w-5 h-5 mb-1.5" />
                <span>{t("cash")}</span>
              </button>

              <button
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedPaymentMethod === "card"
                    ? "bg-white border-white text-black shadow-sm"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1.5" />
                <span>{t("card")}</span>
              </button>

              <button
                onClick={() => setPaymentMethod("credit")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedPaymentMethod === "credit"
                    ? "bg-white border-white text-black shadow-sm"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <UserCheck className="w-5 h-5 mb-1.5" />
                <span>{t("credit")}</span>
              </button>
            </div>

            {/* Total to pay highlight */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-zinc-400">{t("total")}</span>
              <span className="text-3xl font-black text-white font-mono">
                {(selectedPaymentMethod === "card" ? feeInfo.customerTotal : grandTotal).toFixed(2)} {tCommon("currency")}
              </span>
            </div>

            {/* TPE Fee Breakdown Notification */}
            {selectedPaymentMethod === "card" && (
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span>
                      {locale === "ar"
                        ? "دفع بالبطاقة البنكية / جهاز TPE"
                        : locale === "en"
                        ? "Card / POS Terminal Payment"
                        : "Paiement Carte / TPE CMI"}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-zinc-300">
                      {deviceCount || 1} {((deviceCount || 1) > 1) ? (locale === "ar" ? "أجهزة" : "Appareils") : (locale === "ar" ? "جهاز" : "Appareil")} ({feeInfo.customerPercentage}% / {feeInfo.merchantPercentage}%)
                    </span>
                  </div>
                  <span className="font-mono text-sm">{feeInfo.customerTotal.toFixed(2)} {tCommon("currency")}</span>
                </div>
                <p className="text-[11px] font-mono leading-relaxed text-zinc-400 bg-zinc-950 p-2.5 rounded-lg border border-white/10 select-all">
                  {feeInfo.breakdownText}
                </p>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                  <span>
                    {locale === "ar" ? "حصة التاجر" : "Part Commerçant"} ({feeInfo.merchantPercentage}%) : -{feeInfo.merchantFee.toFixed(2)} {tCommon("currency")}
                  </span>
                  <span className="font-semibold text-white">
                    {locale === "ar" ? "إجمالي الزبون" : "Total Client"} ({feeInfo.customerPercentage}%) : {feeInfo.customerTotal.toFixed(2)} {tCommon("currency")}
                  </span>
                </div>
              </div>
            )}

            {/* Cash Tendered & Change Section */}
            {selectedPaymentMethod === "cash" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    {t("tendered")} ({tCommon("currency")})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={grandTotal.toFixed(2)}
                    className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-xl font-bold focus:border-white focus:outline-none"
                  />
                </div>

                {/* Quick Cash Chips */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={handleExactCash}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 transition cursor-pointer"
                  >
                    {t("exactAmount")}
                  </button>
                  {[20, 50, 100, 200].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleQuickCash(val)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold text-white border border-zinc-800 transition cursor-pointer"
                    >
                      +{val} {tCommon("currency")}
                    </button>
                  ))}
                </div>

                {/* Change Due Display */}
                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-400">{t("changeDue")}</span>
                  <span className="text-2xl font-black text-white font-mono">
                    {changeDue.toFixed(2)} {tCommon("currency")}
                  </span>
                </div>
              </div>
            )}

            {/* Credit Notice if selected */}
            {selectedPaymentMethod === "credit" && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs leading-relaxed">
                {customer ? (
                  <>
                    {locale === "ar" ? (
                      <>
                        تسجيل البيع بالكريدي باسم <strong>{customer.name}</strong>.
                        الرصيد الجاري : <strong>{customer.currentCreditBalance.toFixed(2)} {tCommon("currency")}</strong>.
                      </>
                    ) : locale === "en" ? (
                      <>
                        Credit sale assigned to <strong>{customer.name}</strong>.
                        Current balance : <strong>{customer.currentCreditBalance.toFixed(2)} {tCommon("currency")}</strong>.
                      </>
                    ) : (
                      <>
                        Vente à crédit attribuée à <strong>{customer.name}</strong>.
                        Solde actuel : <strong>{customer.currentCreditBalance.toFixed(2)} {tCommon("currency")}</strong>.
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-zinc-300 shrink-0" />
                    <span>
                      {locale === "ar"
                        ? "يرجى تحديد زبون أولاً قبل تسجيل عملية بيع بالكريدي."
                        : locale === "en"
                        ? "Please select a customer first before recording a credit sale."
                        : "Veuillez d'abord sélectionner un client avant d'enregistrer une vente à crédit."}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleConfirmCheckout}
              disabled={
                isProcessingPayment ||
                (selectedPaymentMethod === "credit" && !customer)
              }
              className="w-full h-13 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed text-black font-extrabold text-base shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {isProcessingPayment
                  ? locale === "ar"
                    ? "جاري المعالجة..."
                    : locale === "en"
                    ? "Processing..."
                    : "Traitement..."
                  : t("completeSale")}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
