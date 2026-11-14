"use client";

import React, { useState, useMemo } from "react";
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
  RefreshCw,
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
  const [isConsigneDrawerOpen, setIsConsigneDrawerOpen] = useState(false);
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
    setItemQuantity,
    removeItem,
    clearCart,
    holdCurrentCart,
    getSubtotal,
    getTaxTotal,
    getDiscountTotal,
    getGrandTotal,
    openPaymentModal,
  } = usePosStore();

  // Ensure most recently scanned/updated cart item is pinned to the top of CartPanel
  const displayedCart = useMemo(() => {
    return [...cart].sort((a, b) => (b.lastUpdatedAt ?? 0) - (a.lastUpdatedAt ?? 0));
  }, [cart]);

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
    storeType === "grocery"
      ? (locale === "ar" ? "بيع بالحبة (Unité)" : locale === "en" ? "Unit Price" : "Vente Unité")
      : (locale === "ar" ? "بيع بالتقسيط" : locale === "en" ? "Retail" : "Vente Détail");
  const wholesaleLabel =
    storeType === "grocery"
      ? (locale === "ar" ? "بيع بالباك (Pack)" : locale === "en" ? "Pack / Carton" : "Vente Pack")
      : (locale === "ar" ? "بيع بالجملة" : locale === "en" ? "Wholesale" : "Vente en Gros");

  const handleConsigneDeposit = (type: string, amount: number) => {
    const isGas = type.includes("gas");
    const isReturn = amount < 0;
    const name = isGas
      ? (isReturn
          ? (locale === "ar" ? "إرجاع رهن قنينة غاز" : locale === "fr" ? "Retour Consigne Gaz" : "Gas Bottle Return")
          : (locale === "ar" ? "رهن قنينة غاز فارغة" : locale === "fr" ? "Consigne Bouteille Gaz" : "Gas Bottle Deposit"))
      : (isReturn
          ? (locale === "ar" ? "إرجاع رهن صندوق مشروبات" : locale === "fr" ? "Retour Consigne Casier" : "Crate Return")
          : (locale === "ar" ? "رهن صندوق مشروبات" : locale === "fr" ? "Consigne Casier Boissons" : "Beverage Crate Deposit"));

    const consigneProduct = {
      id: `consigne_${type}_${Date.now()}`,
      name,
      sku: `CONSIGNE-${type.toUpperCase()}`,
      barcode: `CONSIGNE-${type.toUpperCase()}`,
      salePrice: amount,
      taxRate: 0,
      trackStock: false,
      categoryId: "consigne",
    };
    usePosStore.getState().addToCart(consigneProduct, 1);
  };

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
    <div
      dir="ltr"
      className="kaspi-frosted-glass flex flex-col h-full select-none !border-y-0 !border-r-0 !rounded-none"
    >
      {/* Zone R1: Top Customer & Unit/Pack Switcher */}
      <div className="p-3 border-b border-white/[0.08] bg-white/[0.02] space-y-2">
        {/* Customer Select / Detach */}
        <div className="flex items-center justify-between gap-2">
          {customer ? (
            <div className="h-9 w-full px-3 rounded-lg bg-[#0D1116] border border-white/[0.08] hover:border-white/[0.16] flex items-center justify-between text-xs font-semibold text-zinc-200">
              <div className="flex items-center gap-2 truncate">
                <UserCheck className="w-3.5 h-3.5 text-white shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate">
                    {customer.name}
                  </span>
                </div>
                {availablePoints > 0 && (
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    • {availablePoints} pts
                  </span>
                )}
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
          ) : (
            <button
              type="button"
              onClick={onOpenCustomerModal}
              className="h-9 w-full px-3 rounded-lg bg-[#0D1116] border border-white/[0.08] hover:border-white/[0.16] flex items-center justify-between text-xs font-semibold text-zinc-200 cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t("addCustomer")}</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">F3</span>
            </button>
          )}
        </div>

        {/* Unit vs. Pack Segmented Switch */}
        <div className="h-9 p-1 rounded-lg bg-[#080B0E] border border-white/[0.07] grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setPricingTier("retail")}
            className={`flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              pricingTier === "retail"
                ? "bg-white text-zinc-950 font-bold text-xs rounded-md shadow-xs"
                : "text-zinc-400 hover:text-white font-semibold text-xs rounded-md"
            }`}
          >
            <Tag className="w-3 h-3 shrink-0" />
            <span>{retailLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setPricingTier("wholesale")}
            className={`flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              pricingTier === "wholesale"
                ? "bg-white text-zinc-950 font-bold text-xs rounded-md shadow-xs"
                : "text-zinc-400 hover:text-white font-semibold text-xs rounded-md"
            }`}
          >
            <Boxes className="w-3 h-3 shrink-0" />
            <span>{wholesaleLabel}</span>
          </button>
        </div>

        {/* Loyalty Points Reducer if Selected */}
        {customer && maxRedeemablePoints >= 10 && (
          <button
            type="button"
            onClick={() =>
              setLoyaltyPointsToRedeem(
                loyaltyPointsToRedeem > 0 ? 0 : maxRedeemablePoints
              )
            }
            className={`w-full py-1 px-2 rounded text-[11px] font-bold border transition cursor-pointer ${
              loyaltyPointsToRedeem > 0
                ? "bg-white text-zinc-950 border-white font-bold"
                : "bg-zinc-900 border-white/10 text-zinc-300 hover:bg-zinc-850 hover:text-white"
            }`}
          >
            {loyaltyPointsToRedeem > 0
              ? `- ${(loyaltyPointsToRedeem * 0.1).toFixed(2)} ${tCommon("currency")} (${loyaltyPointsToRedeem} pts)`
              : `${maxRedeemablePoints} pts (- ${(maxRedeemablePoints * 0.1).toFixed(2)} ${tCommon("currency")})`}
          </button>
        )}

        {/* Clean Restaurant 3-Pill Mode + Table Dropdown */}
        {storeType === "restaurant" && (
          <div className="space-y-1.5 pt-1">
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
                  className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
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
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1">
                <UtensilsCrossed className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="text-[10px] font-bold text-zinc-400 shrink-0">
                  {locale === "ar" ? "الطاولة:" : "Table :"}
                </span>
                <select
                  value={selectedTableName || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const found = restaurantTables.find((t) => t.name === val);
                    setSelectedTable(found ? found.id : null, val || null);
                  }}
                  className="flex-1 bg-transparent text-[11px] font-mono font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="">
                    {locale === "ar" ? "-- اختر طاولة --" : "-- Choisir table --"}
                  </option>
                  {restaurantTables.map((tbl) => (
                    <option key={tbl.id} value={tbl.name}>
                      {tbl.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paper-Receipt Line Items Sheet */}
      <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-white/[0.07]">
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
          displayedCart.map((item, idx) => (
            <div
              key={item.productId}
              className={`py-2.5 px-2 rounded-xl flex flex-col justify-between group transition-all ${
                idx === 0 ? "kaspi-polar-aurora-orbit kaspi-orbit-active" : ""
              }`}
            >
              {/* Top Row: Product Name + Accumulated Line Price (Auto-doubles live) */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {Boolean((item as any).imageUrl || (item as any).image) && (
                    <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs border border-white/80">
                      <img
                        src={(item as any).imageUrl || (item as any).image}
                        alt={item.name}
                        className="w-[92%] h-[92%] object-contain"
                      />
                    </div>
                  )}
                  <span className="font-sans font-semibold text-[13.5px] text-zinc-100 truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono font-extrabold text-[14.5px] text-white tabular-nums shrink-0">
                  {item.lineTotal.toFixed(2)}{" "}
                  <span className="text-[10.5px] text-zinc-400 font-normal">MAD</span>
                </span>
              </div>

              {/* Bottom Row: Unit & Qty on Left, Unit Price & Controls on Right */}
              <div className="flex items-center justify-between text-[11.5px] text-zinc-400 font-mono mt-1">
                <div className="flex items-center gap-2">
                  <span>
                    {(item as any).unit === "kg" ? "kg" : locale === "ar" ? "قطعة" : "Unité"} × {item.quantity}
                  </span>
                  {item.taxRate > 0 && (
                    <span className="text-[9.5px] px-1 py-0.2 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                      TVA {item.taxRate}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[11px]">
                    ({item.unitPrice.toFixed(2)} MAD)
                  </span>
                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.productId, -1)}
                      className="w-5 h-5 rounded flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="-1"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.productId, 1)}
                      className="w-5 h-5 rounded flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="+1"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer ml-0.5"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Zone R3: Square Register 4-Action Utility Dock */}
      <div className="px-3 py-2 border-t border-white/[0.08] bg-white/[0.02]">
        <div className="grid grid-cols-4 divide-x divide-white/[0.07] rounded-xl border border-white/[0.12] bg-[#12171E] overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => {
              setIsCouponOpen(!isCouponOpen);
              if (isConsigneDrawerOpen) setIsConsigneDrawerOpen(false);
            }}
            className={`h-9 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              isCouponOpen || discountPercent > 0 || discountFixed > 0
                ? "bg-white text-zinc-950 font-bold"
                : "hover:bg-white/[0.06] text-zinc-300 hover:text-white"
            }`}
          >
            <Percent className="w-3 h-3" />
            <span>{locale === "ar" ? "تخفيض" : locale === "en" ? "Discount" : "Remise"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsConsigneDrawerOpen(!isConsigneDrawerOpen);
              if (isCouponOpen) setIsCouponOpen(false);
            }}
            className={`h-9 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              isConsigneDrawerOpen
                ? "bg-white text-zinc-950 font-bold"
                : "hover:bg-white/[0.06] text-zinc-300 hover:text-white"
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>{locale === "ar" ? "رهن" : locale === "en" ? "Deposit" : "Consigne"}</span>
          </button>

          <button
            type="button"
            onClick={() => holdCurrentCart()}
            disabled={cart.length === 0}
            className="h-9 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <PauseCircle className="w-3 h-3" />
            <span>{locale === "ar" ? "تعليق" : locale === "en" ? "Hold" : "Attente"}</span>
          </button>

          <button
            type="button"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="h-9 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>{locale === "ar" ? "إفراغ" : locale === "en" ? "Clear" : "Vider"}</span>
          </button>
        </div>
      </div>

      {/* Zone R4: Square Register Totals & Full-Width Charge CTA Button */}
      <div className="p-3.5 border-t border-white/[0.08] bg-white/[0.02] space-y-2.5">
        {/* Consigne Drawer Popover */}
        {isConsigneDrawerOpen && (
          <div className="p-2.5 rounded-xl bg-[#111113] border border-white/[0.12] space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-300">
              <span>{locale === "ar" ? "رهن القنينات والصناديق (Consigne)" : locale === "en" ? "Gas & Crate Deposits" : "Consignes Bouteilles & Casiers"}</span>
              <button
                type="button"
                onClick={() => setIsConsigneDrawerOpen(false)}
                className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handleConsigneDeposit("gas_deposit", 100)}
                className="py-1 px-2 rounded-lg bg-[#18181B] border border-white/[0.08] hover:border-white/20 text-white flex items-center justify-between cursor-pointer"
              >
                <span>{locale === "ar" ? "+ الغاز" : locale === "en" ? "+ Gas" : "+ Gaz"}</span>
                <span className="font-mono font-black">+100 DH</span>
              </button>
              <button
                type="button"
                onClick={() => handleConsigneDeposit("gas_return", -100)}
                className="py-1 px-2 rounded-lg bg-[#18181B] border border-white/[0.08] hover:border-white/20 text-zinc-300 flex items-center justify-between cursor-pointer"
              >
                <span>{locale === "ar" ? "- إرجاع الغاز" : locale === "en" ? "- Gas Return" : "- Retour Gaz"}</span>
                <span className="font-mono font-black">-100 DH</span>
              </button>
              <button
                type="button"
                onClick={() => handleConsigneDeposit("crate_deposit", 15)}
                className="py-1 px-2 rounded-lg bg-[#18181B] border border-white/[0.08] hover:border-white/20 text-white flex items-center justify-between cursor-pointer"
              >
                <span>{locale === "ar" ? "+ الصندوق" : locale === "en" ? "+ Crate" : "+ Casier"}</span>
                <span className="font-mono font-black">+15 DH</span>
              </button>
              <button
                type="button"
                onClick={() => handleConsigneDeposit("crate_return", -15)}
                className="py-1 px-2 rounded-lg bg-[#18181B] border border-white/[0.08] hover:border-white/20 text-zinc-300 flex items-center justify-between cursor-pointer"
              >
                <span>{locale === "ar" ? "- إرجاع الصندوق" : locale === "en" ? "- Crate Return" : "- Retour Casier"}</span>
                <span className="font-mono font-black">-15 DH</span>
              </button>
            </div>
          </div>
        )}

        {/* Coupon Discount Drawer */}
        {isCouponOpen && (
          <div className="p-2.5 rounded-xl bg-[#0D1116] border border-white/[0.12] space-y-2 animate-fadeIn">
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
                      : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
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
          </div>
        )}

        {/* Totals Subtotal & Tax */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-zinc-400 font-mono">
            <span>{t("subtotal")}</span>
            <span className="text-zinc-300">{subtotal.toFixed(2)} MAD</span>
          </div>
          <div className="flex justify-between text-zinc-400 font-mono">
            <span>{t("tax")} (TVA)</span>
            <span className="text-zinc-300">{taxTotal.toFixed(2)} MAD</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between text-zinc-300 font-mono font-bold">
              <span>{t("discount")}</span>
              <span>-{discountTotal.toFixed(2)} MAD</span>
            </div>
          )}
        </div>

        {/* Square Register Full-Width Primary Charge CTA Button */}
        <button
          type="button"
          onClick={openPaymentModal}
          disabled={cart.length === 0}
          className="kaspi-polar-aurora-orbit h-12 w-full rounded-xl bg-white text-black hover:bg-white/95 active:scale-[0.99] font-semibold text-[15px] shadow-[0_8px_28px_-6px_rgba(255,255,255,0.35)] flex items-center justify-between px-5 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          <span className="flex items-center gap-2 font-sans font-extrabold text-[15px] tracking-wide">
            <CreditCard className="w-4 h-4 stroke-[2.5]" />
            <span>{t("checkout")}</span>
          </span>
          <span className="font-mono font-black text-base tabular-nums">
            {grandTotal.toFixed(2)} MAD
          </span>
        </button>
      </div>
    </div>
  );
};
