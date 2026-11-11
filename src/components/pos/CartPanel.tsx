"use client";

import React, { useState } from "react";
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
  UtensilsCrossed,
  Tag,
  Boxes,
  Percent,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";

interface CartPanelProps {
  onOpenCustomerModal?: () => void;
  onOpenIndustryTools?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ onOpenCustomerModal }) => {
  const t = useTranslations("Pos");
  const tCommon = useTranslations("Common");
  const { t: tDict, locale } = useAppDictionary();
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [orderMode, setOrderMode] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");

  const {
    cart,
    customer,
    setCustomer,
    pricingTier,
    setPricingTier,
    selectedTableName,
    setSelectedTable,
    storeType,
    loyaltyPointsToRedeem,
    setLoyaltyPointsToRedeem,
    discountPercent,
    discountFixed,
    setDiscount,
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

  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === "PROMO10" || code === "KASPI10") {
      setDiscount(10, 0);
      setCouponMsg({ text: `${tDict.pos.couponApplied} (10%)` });
    } else if (code === "VIP20" || code === "KASPI20") {
      setDiscount(20, 0);
      setCouponMsg({ text: `${tDict.pos.couponApplied} (20%)` });
    } else if (code === "BUY2GET1" || code === "SAVE15") {
      setDiscount(15, 0);
      setCouponMsg({ text: `${tDict.pos.couponApplied} (15%)` });
    } else if (/^\d+[%]$/.test(code)) {
      const pct = Math.min(100, Math.max(0, parseInt(code)));
      setDiscount(pct, 0);
      setCouponMsg({ text: `${tDict.pos.couponApplied} (${pct}%)` });
    } else if (/^\d+(\.\d+)?$/.test(code)) {
      const val = parseFloat(code);
      setDiscount(0, val);
      setCouponMsg({ text: `${tDict.pos.couponApplied} (${val} MAD)` });
    } else {
      setCouponMsg({ text: tDict.pos.invalidCoupon, error: true });
    }
  };

  const handleClearDiscount = () => {
    setDiscount(0, 0);
    setCouponCode("");
    setCouponMsg(null);
  };

  const subtotal = getSubtotal();
  const taxTotal = getTaxTotal();
  const discountTotal = getDiscountTotal();
  const grandTotal = getGrandTotal();
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const availablePoints = customer?.loyaltyPoints || 0;
  const maxRedeemablePoints = Math.min(
    availablePoints,
    Math.floor((subtotal + taxTotal) * 10)
  );

  const retailLabel =
    locale === "ar" ? "بيع بالتقسيط" : locale === "en" ? "Retail" : "Vente Détail";
  const wholesaleLabel =
    locale === "ar" ? "بيع بالجملة" : locale === "en" ? "Wholesale" : "Vente en Gros";

  const restaurantTables = [
    { id: "t1", name: "T-01" },
    { id: "t2", name: "T-02" },
    { id: "t3", name: "T-03" },
    { id: "t4", name: "T-04" },
    { id: "t5", name: "T-05" },
    { id: "t6", name: "T-06" },
    { id: "t7", name: "T-07" },
    { id: "t8", name: "T-08" },
    { id: "t9", name: "T-09" },
    { id: "t10", name: "T-10" },
    { id: "t11", name: "T-11" },
    { id: "t12", name: "T-12" },
    { id: "ter1", name: "Terrasse 1" },
    { id: "ter2", name: "Terrasse 2" },
    { id: "ter3", name: "Terrasse 3" },
    { id: "ter4", name: "Terrasse 4" },
  ];

  return (
    <div dir="ltr" className="flex flex-col h-full bg-zinc-950 border-s border-zinc-800 select-none">
      {/* Top Header: Customer + Retail/Wholesale + Restaurant Mode */}
      <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/60 space-y-2.5">
        {/* Customer Select / Detach */}
        <div className="flex items-center justify-between gap-2">
          {customer ? (
            <div className="flex flex-col gap-1.5 bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <UserCheck className="w-4 h-4 text-white shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">
                      {customer.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-mono">
                      {customer.phone || (customer.ice ? `ICE: ${customer.ice}` : "Client")}
                      {availablePoints > 0 ? ` • ${availablePoints} pts` : ""}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomer(null)}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition cursor-pointer"
                  title="Détacher client"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {maxRedeemablePoints >= 10 && (
                <button
                  type="button"
                  onClick={() =>
                    setLoyaltyPointsToRedeem(
                      loyaltyPointsToRedeem > 0 ? 0 : maxRedeemablePoints
                    )
                  }
                  className={`w-full py-1 px-2 rounded text-[11px] font-bold border transition cursor-pointer ${
                    loyaltyPointsToRedeem > 0
                      ? "bg-zinc-800 border-white text-white"
                      : "bg-zinc-900 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {loyaltyPointsToRedeem > 0
                    ? `- ${(loyaltyPointsToRedeem * 0.1).toFixed(2)} ${tCommon("currency")} (${loyaltyPointsToRedeem} pts)`
                    : `${maxRedeemablePoints} pts (- ${(maxRedeemablePoints * 0.1).toFixed(2)} ${tCommon("currency")})`}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenCustomerModal}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] text-xs font-bold text-white transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>{t("addCustomer")}</span>
            </button>
          )}
        </div>

        {/* Retail vs Wholesale Dual Pricing Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setPricingTier("retail")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              pricingTier === "retail"
                ? "bg-white text-zinc-950 font-black shadow-[0_2px_10px_rgba(255,255,255,0.2)] border border-white"
                : "bg-zinc-900/90 text-zinc-200 hover:text-white hover:bg-zinc-800 border border-white/10 font-bold"
            }`}
          >
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span>{retailLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setPricingTier("wholesale")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              pricingTier === "wholesale"
                ? "bg-white text-zinc-950 font-black shadow-[0_2px_10px_rgba(255,255,255,0.2)] border border-white"
                : "bg-zinc-900/90 text-zinc-200 hover:text-white hover:bg-zinc-800 border border-white/10 font-bold"
            }`}
          >
            <Boxes className="w-3.5 h-3.5 shrink-0" />
            <span>{wholesaleLabel}</span>
          </button>
        </div>

        {/* Clean Restaurant 3-Pill Mode + Table Dropdown */}
        {storeType === "restaurant" && (
          <div className="space-y-2 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center gap-1">
              {[
                { id: "dine_in", labelAr: "محلي", labelFr: "Sur Place", labelEn: "Dine In" },
                { id: "takeaway", labelAr: "سفري", labelFr: "À Emporter", labelEn: "Takeaway" },
                { id: "delivery", labelAr: "توصيل", labelFr: "Livraison", labelEn: "Delivery" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setOrderMode(mode.id as any)}
                  className={`keycap-3d flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    orderMode === mode.id
                      ? "bg-white text-zinc-950 border-white shadow-xs"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                >
                  {locale === "ar" ? mode.labelAr : locale === "en" ? mode.labelEn : mode.labelFr}
                </button>
              ))}
            </div>

            {orderMode === "dine_in" && (
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-[11px] font-bold text-zinc-300 shrink-0">
                  {locale === "ar" ? "الطاولة:" : "Table :"}
                </span>
                <select
                  value={selectedTableName || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const found = restaurantTables.find((t) => t.name === val);
                    setSelectedTable(found ? found.id : null, val || null);
                  }}
                  className="flex-1 bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-900 text-zinc-400">
                    {locale === "ar" ? "-- اختر طاولة --" : "-- Choisir table --"}
                  </option>
                  {restaurantTables.map((tbl) => (
                    <option key={tbl.id} value={tbl.name} className="bg-zinc-900 text-white">
                      {tbl.name}
                    </option>
                  ))}
                </select>
                {selectedTableName && (
                  <button
                    type="button"
                    onClick={() => setSelectedTable(null, null)}
                    className="text-zinc-500 hover:text-white p-0.5"
                    title="Détacher table"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden bg-dot-matrix rounded-2xl border border-dashed border-white/5">
            {/* Interactive Supermarket Trolley SVG Scene */}
            <div className="relative group w-32 h-32 flex items-center justify-center mb-2 cursor-pointer">
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22)_0%,transparent_75%)] transition-all duration-500" />
              <div className="relative w-24 h-24 rounded-2xl bg-zinc-900/90 border border-white/10 group-hover:border-white/30 transition-all duration-500 shadow-2xl backdrop-blur-xs flex items-center justify-center overflow-hidden animate-float">
                {/* Laser scan */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent top-0 animate-laser pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* 1. Empty Wire Supermarket Trolley (Default Visible -> Fades & Scales Down on Hover) */}
                <svg
                  className="w-12 h-12 text-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] transform opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-75 pointer-events-none"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 18H14L20 40H46L52 24H18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M24 24V40M30 24V40M36 24V40M42 24V40M19 32H48"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeOpacity="0.5"
                  />
                  <path
                    d="M22 46H44"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="22" cy="51" r="4.5" stroke="currentColor" strokeWidth="2" fill="#18181b" />
                  <circle cx="44" cy="51" r="4.5" stroke="currentColor" strokeWidth="2" fill="#18181b" />
                </svg>

                {/* 2. Physical Product Packages (Hidden Above -> Smoothly Drops & Settles in Center on Hover) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] opacity-0 -translate-y-6 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    {/* Ambient Glow */}
                    <div className="absolute inset-1 rounded-full bg-white/10 blur-sm -z-10" />

                    {/* Vector Items Composite */}
                    <svg
                      className="w-14 h-14 text-white filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]"
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Left Item: Milk / Beverage Bottle with Cap (-6 deg tilt) */}
                      <g transform="translate(4, 14) rotate(-6, 12, 22)">
                        {/* Bottle body */}
                        <path
                          d="M6 14C6 11 8 9 10 7L10 3C10 2 11 1 12 1L14 1C15 1 16 2 16 3L16 7C18 9 20 11 20 14L20 32C20 34 18 36 16 36L10 36C8 36 6 34 6 32Z"
                          fill="#18181b"
                          stroke="#ffffff"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        {/* Cap */}
                        <rect x="9.5" y="0.5" width="7" height="3" rx="1" fill="#ffffff" />
                        {/* Bottle label */}
                        <rect x="8.5" y="16" width="9" height="12" rx="1" fill="rgba(255,255,255,0.18)" stroke="#ffffff" strokeWidth="0.8" />
                        <line x1="10.5" y1="20" x2="15.5" y2="20" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
                        <line x1="10.5" y1="23" x2="14" y2="23" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
                      </g>

                      {/* Right Item: Shopping Bag with Handles (+8 deg tilt) */}
                      <g transform="translate(36, 16) rotate(8, 12, 20)">
                        {/* Bag Body */}
                        <path
                          d="M3 10L21 10L23 34C23 35.5 21.5 36.5 20 36.5L4 36.5C2.5 36.5 1 35.5 1 34Z"
                          fill="#27272a"
                          stroke="#ffffff"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        {/* Handles */}
                        <path
                          d="M7 10C7 5 9 3 12 3C15 3 17 5 17 10"
                          stroke="#ffffff"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        {/* Bag Brand Tag */}
                        <circle cx="12" cy="22" r="3.5" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                        <path d="M10.5 22L13.5 22M12 20.5L12 23.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
                      </g>

                      {/* Center Item: Packaged Merchandise Box (Prominent in Foreground) */}
                      <g transform="translate(18, 20)">
                        {/* Box Front Face */}
                        <rect
                          x="0"
                          y="6"
                          width="28"
                          height="24"
                          rx="3"
                          fill="#09090b"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        {/* Sealing Tape Stripe */}
                        <rect x="11.5" y="6" width="5" height="24" fill="#ffffff" fillOpacity="0.25" />
                        {/* Barcode on Box */}
                        <g transform="translate(4, 18)">
                          <rect x="0" y="0" width="12" height="8" rx="1" fill="#ffffff" />
                          <line x1="2" y1="2" x2="2" y2="6" stroke="#09090b" strokeWidth="1" />
                          <line x1="4" y1="2" x2="4" y2="6" stroke="#09090b" strokeWidth="0.6" />
                          <line x1="6" y1="2" x2="6" y2="6" stroke="#09090b" strokeWidth="1.2" />
                          <line x1="8.5" y1="2" x2="8.5" y2="6" stroke="#09090b" strokeWidth="0.8" />
                          <line x1="10" y1="2" x2="10" y2="6" stroke="#09090b" strokeWidth="1" />
                        </g>
                        {/* Mini Kaspi POS check icon */}
                        <path
                          d="M19 22L21 24L24 19"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm font-bold text-white tracking-tight">{t("emptyCart")}</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-[200px]">
              {locale === "ar"
                ? "امسح الباركود أو اختر منتجاً من القائمة"
                : locale === "fr"
                ? "Scannez un code-barres ou sélectionnez un article"
                : "Scan a barcode or select an item from catalog"}
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition"
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm truncate leading-snug">
                  {item.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400 font-mono">
                  <span>{item.unitPrice.toFixed(2)} {tCommon("currency")}</span>
                  {item.taxRate > 0 && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      TVA {item.taxRate}%
                    </span>
                  )}
                </div>
                {item.notes && (
                  <div className="mt-1 text-[10px] font-semibold text-zinc-300 bg-white/[0.05] border border-white/10 px-1.5 py-0.5 rounded truncate">
                    {item.notes}
                  </div>
                )}
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => updateItemQuantity(item.productId, -1)}
                  className="keycap-3d w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-700/60 rounded active:scale-95 transition cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center text-xs font-bold font-mono text-white">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateItemQuantity(item.productId, 1)}
                  className="keycap-3d w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-700/60 rounded active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Line Total & Remove */}
              <div className="flex items-center gap-2 text-end">
                <span className="text-sm font-bold text-white font-mono min-w-[50px]">
                  {item.lineTotal.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
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
      <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-3">
        {/* Promo / Coupon Bar */}
        <div className="border border-zinc-800 rounded-xl bg-zinc-900/60 overflow-hidden">
          <div
            onClick={() => setIsCouponOpen(!isCouponOpen)}
            className="px-3 py-2 flex items-center justify-between text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer transition select-none"
          >
            <div className="flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t("discount")} / Coupon</span>
              {(discountPercent > 0 || discountFixed > 0) && (
                <span className="px-1.5 py-0.2 rounded-md bg-white text-black font-mono text-[10px] font-bold">
                  {discountPercent > 0 ? `-${discountPercent}%` : `-${discountFixed} MAD`}
                </span>
              )}
            </div>
            {isCouponOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </div>

          {isCouponOpen && (
            <div className="p-2.5 pt-0 border-t border-zinc-800/60 space-y-2 mt-1">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={tDict.pos.couponPlaceholder}
                  className="flex-1 h-8 px-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white uppercase font-mono placeholder:normal-case placeholder:text-zinc-500 focus:outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  className="px-3 h-8 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs cursor-pointer transition"
                >
                  {tDict.pos.applyCoupon}
                </button>
              </div>

              {/* Quick Preset Pills */}
              <div className="flex items-center gap-1 pt-0.5">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setDiscount(pct, 0);
                      setCouponMsg({ text: `${tDict.pos.couponApplied} (${pct}%)` });
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition cursor-pointer ${
                      discountPercent === pct
                        ? "bg-white text-black border-white"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    -{pct}%
                  </button>
                ))}
                {(discountPercent > 0 || discountFixed > 0) && (
                  <button
                    type="button"
                    onClick={handleClearDiscount}
                    className="ml-auto text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {couponMsg && (
                <p className={`text-[11px] font-medium ${couponMsg.error ? "text-zinc-400" : "text-white font-bold"}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Subtotal, TVA, Grand Total */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>{t("subtotal")}</span>
            <span className="font-mono text-zinc-300">{subtotal.toFixed(2)} {tCommon("currency")}</span>
          </div>

          <div className="flex justify-between text-zinc-400">
            <span>{t("tax")}</span>
            <span className="font-mono text-zinc-300">{taxTotal.toFixed(2)} {tCommon("currency")}</span>
          </div>

          {discountTotal > 0 && (
            <div className="flex justify-between text-zinc-300">
              <span>{t("discount")}</span>
              <span className="font-mono">-{discountTotal.toFixed(2)} {tCommon("currency")}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">{t("total")}</span>
              <span className="text-xs text-zinc-500 font-mono">
                ({itemsCount} {t("itemsCount")})
              </span>
            </div>
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {grandTotal.toFixed(2)} {tCommon("currency")}
            </span>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => holdCurrentCart()}
            disabled={cart.length === 0}
            className="group col-span-1 h-12 flex flex-col items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-850 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title={t("holdCart")}
          >
            <PauseCircle className="w-4 h-4 mb-0.5 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-[10px] font-semibold">{t("holdCart")}</span>
          </button>

          <button
            type="button"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="group col-span-1 h-12 flex flex-col items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-850 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title={t("clearCart")}
          >
            <Trash2 className="w-4 h-4 mb-0.5 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-[10px] font-semibold">{t("clearCart")}</span>
          </button>

          <button
            type="button"
            onClick={openPaymentModal}
            disabled={cart.length === 0}
            className="group sheen-btn col-span-2 h-12 flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none text-zinc-950 font-bold text-base shadow-sm transition-all duration-200 cursor-pointer"
          >
            <CreditCard className="w-5 h-5 stroke-[2.2] group-hover:scale-105 transition-transform duration-200" />
            <span>{t("checkout")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
