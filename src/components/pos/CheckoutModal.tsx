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
  Send,
  MessageSquare,
} from "lucide-react";
import { usePosStore, type PaymentMethodType } from "@/client/store/usePosStore";
import { ThermalReceipt, type ReceiptData } from "./ThermalReceipt";
import { printReceipt } from "@/client/printing";
import { formatReceiptForWhatsApp, generateWhatsAppLink } from "@/lib/whatsapp";
import { calculatePaymentFees } from "@/lib/fees";

export const CheckoutModal: React.FC = () => {
  const t = useTranslations("Pos");
  const tCommon = useTranslations("Common");

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
  } = usePosStore();

  const [saleResult, setSaleResult] = useState<{
    completed: boolean;
    clientSaleId: string;
    isOffline: boolean;
    receiptData?: ReceiptData;
  } | null>(null);

  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const handleSendWhatsApp = (targetPhone?: string) => {
    if (!saleResult?.receiptData) return;
    const phone = targetPhone || recipientPhone || customer?.phone || "";
    if (!phone && !showPhoneInput) {
      setShowPhoneInput(true);
      return;
    }

    const message = formatReceiptForWhatsApp({
      storeName: saleResult.receiptData.shopName,
      receiptNumber: saleResult.receiptData.receiptNumber,
      createdAt: new Date().toISOString(),
      cashierName: saleResult.receiptData.cashierName,
      items: saleResult.receiptData.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
      subtotal: saleResult.receiptData.subtotal,
      taxTotal: saleResult.receiptData.taxTotal,
      grandTotal: saleResult.receiptData.grandTotal,
      paymentMethod: saleResult.receiptData.paymentMethod,
      paidTotal: saleResult.receiptData.paidTotal,
      changeDue: saleResult.receiptData.changeDue,
    });

    const link = generateWhatsAppLink(phone, message);
    if (typeof window !== "undefined") {
      window.open(link, "_blank");
    }
  };

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
    const current = parseFloat(amountTendered) || 0;
    setAmountTendered((current + extra).toFixed(2));
  };

  const handleExactCash = () => {
    setAmountTendered(grandTotal.toFixed(2));
  };

  const handleConfirmCheckout = async () => {
    const receiptSnapshot: ReceiptData = {
      shopName: "Kasbi Retail (كسب)",
      legalName: "Ste Kasbi SARL",
      ice: "002345678000045",
      taxId: "45892134",
      rcNumber: "98765 Casablanca",
      address: "123 Bd d'Anfa",
      city: "Casablanca",
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString("fr-MA"),
      cashierName: "Caisse 1",
      customerName: customer?.name || undefined,
      customerIce: customer?.ice || undefined,
      items: cart.map((i) => ({
        name: i.name,
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
    };

    const res = await completeSale();
    if (res.success) {
      setSaleResult({
        completed: true,
        clientSaleId: res.clientSaleId,
        isOffline: res.isOffline,
        receiptData: receiptSnapshot,
      });

      // If offline, automatically print the receipt locally
      if (res.isOffline) {
        printReceipt(receiptSnapshot).catch(() => {});
      }
    }
  };

  const handleClose = () => {
    setSaleResult(null);
    setShowReceiptPreview(false);
    setShowPhoneInput(false);
    closePaymentModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
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
                <ThermalReceipt data={saleResult.receiptData} width="80mm" />
              </div>
            )}

            {/* WhatsApp Digital Receipt Option */}
            <div className="pt-1">
              {showPhoneInput ? (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Numéro WhatsApp du client (ex: 0612345678) :
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="06 XX XX XX XX"
                      className="flex-1 px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-white font-mono"
                    />
                    <button
                      onClick={() => handleSendWhatsApp()}
                      className="px-3 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleSendWhatsApp()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-white font-semibold text-xs border border-zinc-800 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                  <span>Envoyer le ticket par WhatsApp</span>
                </button>
              )}
            </div>

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
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs space-y-2 shadow-inner">
                <div className="flex items-center justify-between font-bold text-amber-300">
                  <div className="flex items-center gap-2">
                    <span>Paiement Carte / TPE CMI</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      {deviceCount || 1} {((deviceCount || 1) > 1) ? "Appareils" : "Appareil"} ({feeInfo.customerPercentage}% / {feeInfo.merchantPercentage}%)
                    </span>
                  </div>
                  <span className="font-mono text-sm">{feeInfo.customerTotal.toFixed(2)} DH</span>
                </div>
                <p className="text-[11px] font-mono leading-relaxed text-amber-200/90 bg-amber-950/60 p-2.5 rounded-lg border border-amber-900/60 select-all">
                  {feeInfo.breakdownText}
                </p>
                <div className="flex items-center justify-between text-[10px] text-amber-300/80 pt-0.5">
                  <span>Part Commerçant ({feeInfo.merchantPercentage}%) : -{feeInfo.merchantFee.toFixed(2)} DH</span>
                  <span className="font-semibold text-emerald-400">Total Client ({feeInfo.customerPercentage}%) : {feeInfo.customerTotal.toFixed(2)} DH</span>
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
                      +{val} DH
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
                    Vente à crédit attribuée à <strong>{customer.name}</strong>.
                    Solde actuel : <strong>{customer.currentCreditBalance.toFixed(2)} DH</strong>.
                  </>
                ) : (
                  <span className="text-zinc-400 font-bold">
                    ⚠️ Veuillez d&apos;abord sélectionner un client avant d&apos;enregistrer une vente à crédit.
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
              <span>{isProcessingPayment ? "Traitement..." : t("completeSale")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
