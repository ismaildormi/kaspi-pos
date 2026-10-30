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
} from "lucide-react";
import { usePosStore, type PaymentMethodType } from "@/client/store/usePosStore";
import { ThermalReceipt, type ReceiptData } from "./ThermalReceipt";
import { printReceipt } from "@/client/printing";

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

  const handleQuickCash = (extra: number) => {
    const current = parseFloat(amountTendered) || 0;
    setAmountTendered((current + extra).toFixed(2));
  };

  const handleExactCash = () => {
    setAmountTendered(grandTotal.toFixed(2));
  };

  const handleConfirmCheckout = async () => {
    const receiptSnapshot: ReceiptData = {
      shopName: "Kasbi Market (كسب ماركت)",
      legalName: "Ste Kasbi Retail SARL",
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
          : grandTotal,
      changeDue,
      paymentMethod: selectedPaymentMethod,
      currency: "MAD",
    };

    const res = await completeSale();
    if (res.success) {
      setSaleResult({
        completed: true,
        clientSaleId: res.clientSaleId,
        isOffline: res.isOffline,
        receiptData: receiptSnapshot,
      });
    }
  };

  const handleClose = () => {
    setSaleResult(null);
    setShowReceiptPreview(false);
    closePaymentModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">
            {saleResult?.completed ? t("saleSuccess") : t("paymentMethods")}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {saleResult?.completed ? (
          /* Success Screen with Receipt Preview Toggle */
          <div className="p-5 overflow-y-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{t("saleSuccess")}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {saleResult.isOffline
                  ? "Vente stockée localement (Synchronisation automatique en arrière-plan)"
                  : "Transaction enregistrée avec succès"}
              </p>
            </div>

            {/* Toggle Receipt Preview */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowReceiptPreview(!showReceiptPreview)}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
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

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => printReceipt(saleResult.receiptData)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t("printReceipt")}</span>
              </button>

              <button
                onClick={handleClose}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition"
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
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedPaymentMethod === "cash"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <Banknote className="w-6 h-6 mb-1.5" />
                <span>{t("cash")}</span>
              </button>

              <button
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedPaymentMethod === "card"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-6 h-6 mb-1.5" />
                <span>{t("card")}</span>
              </button>

              <button
                onClick={() => setPaymentMethod("credit")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedPaymentMethod === "credit"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <UserCheck className="w-6 h-6 mb-1.5" />
                <span>{t("credit")}</span>
              </button>
            </div>

            {/* Total to pay highlight */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-400">{t("total")}</span>
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {grandTotal.toFixed(2)} {tCommon("currency")}
              </span>
            </div>

            {/* Cash Tendered & Change Section */}
            {selectedPaymentMethod === "cash" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    {t("tendered")} ({tCommon("currency")})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={grandTotal.toFixed(2)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xl font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Quick Cash Chips */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={handleExactCash}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition"
                  >
                    {t("exactAmount")}
                  </button>
                  {[20, 50, 100, 200].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleQuickCash(val)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-emerald-400 border border-slate-700 transition"
                    >
                      +{val} DH
                    </button>
                  ))}
                </div>

                {/* Change Due Display */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-400">{t("changeDue")}</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {changeDue.toFixed(2)} {tCommon("currency")}
                  </span>
                </div>
              </div>
            )}

            {/* Credit Notice if selected */}
            {selectedPaymentMethod === "credit" && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                {customer ? (
                  <>
                    Vente à crédit attribuée à <strong>{customer.name}</strong>.
                    Solde actuel : <strong>{customer.currentCreditBalance.toFixed(2)} DH</strong>.
                  </>
                ) : (
                  <span className="text-red-400 font-bold">
                    ⚠️ Veuillez d&apos;abord sélectionner un client avant d&apos;enregistrer une vente à crédit.
                  </span>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleConfirmCheckout}
              disabled={isProcessingPayment || (selectedPaymentMethod === "credit" && !customer)}
              className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold text-lg shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isProcessingPayment ? tCommon("loading") : `${t("pay")} ${grandTotal.toFixed(2)} ${tCommon("currency")}`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
