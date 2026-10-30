"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  CreditCard,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";

interface CartPanelProps {
  onOpenCustomerModal?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ onOpenCustomerModal }) => {
  const t = useTranslations("Pos");
  const tCommon = useTranslations("Common");

  const {
    cart,
    customer,
    setCustomer,
    updateItemQuantity,
    removeItem,
    clearCart,
    holdCurrentCart,
    getSubtotal,
    getTaxTotal,
    getDiscountTotal,
    getGrandTotal,
    openPaymentModal,
  } = usePosStore();

  const subtotal = getSubtotal();
  const taxTotal = getTaxTotal();
  const discountTotal = getDiscountTotal();
  const grandTotal = getGrandTotal();
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-x border-slate-800 select-none">
      {/* Top: Customer & Cart Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
        {customer ? (
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl w-full">
            <div className="flex items-center gap-2 truncate">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate">
                  {customer.name}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {customer.phone || (customer.ice ? `ICE: ${customer.ice}` : "Client")}
                </span>
              </div>
            </div>
            <button
              onClick={() => setCustomer(null)}
              className="p-1 hover:bg-emerald-500/20 text-slate-400 hover:text-white rounded-md transition"
              title="Détacher client"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenCustomerModal}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>{t("addCustomer")}</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <ShoppingCart className="w-12 h-12 mb-3 text-slate-700 stroke-[1.2]" />
            <p className="text-sm font-medium text-slate-400">{t("emptyCart")}</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-700 transition"
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm truncate leading-snug">
                  {item.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                  <span>{item.unitPrice.toFixed(2)} {tCommon("currency")}</span>
                  {item.taxRate > 0 && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-700/50 text-slate-300">
                      TVA {item.taxRate}%
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
                <button
                  onClick={() => updateItemQuantity(item.productId, -1)}
                  className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded active:scale-95 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold font-mono text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateItemQuantity(item.productId, 1)}
                  className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Line Total & Remove */}
              <div className="flex items-center gap-2 text-end">
                <span className="text-sm font-bold text-emerald-400 font-mono min-w-[50px]">
                  {item.lineTotal.toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Action Buttons */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
        {/* Subtotal, TVA, Grand Total */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>{t("subtotal")}</span>
            <span className="font-mono text-slate-300">{subtotal.toFixed(2)} {tCommon("currency")}</span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>{t("tax")}</span>
            <span className="font-mono text-slate-300">{taxTotal.toFixed(2)} {tCommon("currency")}</span>
          </div>

          {discountTotal > 0 && (
            <div className="flex justify-between text-amber-400">
              <span>{t("discount")}</span>
              <span className="font-mono">-{discountTotal.toFixed(2)} {tCommon("currency")}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">{t("total")}</span>
              <span className="text-xs text-slate-500">
                ({itemsCount} {t("itemsCount")})
              </span>
            </div>
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {grandTotal.toFixed(2)} {tCommon("currency")}
            </span>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            onClick={() => holdCurrentCart()}
            disabled={cart.length === 0}
            className="col-span-1 h-12 flex flex-col items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 hover:text-white transition"
            title={t("holdCart")}
          >
            <PauseCircle className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-semibold">{t("holdCart")}</span>
          </button>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="col-span-1 h-12 flex flex-col items-center justify-center rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 transition"
            title={t("clearCart")}
          >
            <Trash2 className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-semibold">{t("clearCart")}</span>
          </button>

          <button
            onClick={openPaymentModal}
            disabled={cart.length === 0}
            className="col-span-2 h-12 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <CreditCard className="w-5 h-5 stroke-[2.2]" />
            <span>{t("checkout")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
