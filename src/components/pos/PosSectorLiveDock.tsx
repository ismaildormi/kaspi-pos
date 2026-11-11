"use client";

import React, { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  Scale,
  Beef,
  Croissant,
  Flame,
  Shirt,
  Smartphone,
  Boxes,
  ShoppingBasket,
  ChevronDown,
  ChevronUp,
  ChefHat,
  Gift,
  Wrench,
  FileText,
  Sparkles,
  Send,
  Users,
} from "lucide-react";
import { usePosStore, type StoreIndustryType } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";

export interface PosSectorLiveDockProps {
  currentView?: "menu" | "tables" | "kds";
  onViewChange?: (view: "menu" | "tables" | "kds") => void;
  onOpenIndustryTools?: () => void;
}

export function PosSectorLiveDock({
  currentView = "menu",
  onViewChange,
  onOpenIndustryTools,
}: PosSectorLiveDockProps) {
  const { locale } = useAppDictionary();
  const {
    storeType,
    cart,
    selectedTableId,
    selectedTableName,
    setSelectedTable,
    updateItemNotes,
    setItemQuantity,
    addToCart,
    setPricingTier,
  } = usePosStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Butchery state
  const [scaleKg, setScaleKg] = useState<number>(0.5);
  const [scalePricePerKg, setScalePricePerKg] = useState<number>(110);
  const [activeTare, setActiveTare] = useState<string>("0g");

  // Tech state
  const [imeiInput, setImeiInput] = useState("");

  // Wholesale state
  const [wholesaleIce, setWholesaleIce] = useState("");
  const [isBlActive, setIsBlActive] = useState(false);

  // Restaurant state
  const [guestCount, setGuestCount] = useState<number>(2);

  const activeItem = cart.length > 0 ? cart[cart.length - 1] : null;

  const handleApplyNoteToActive = (noteText: string) => {
    if (!activeItem) return;
    const existing = activeItem.notes ? `${activeItem.notes} • ` : "";
    updateItemNotes(activeItem.productId, `${existing}${noteText}`);
  };

  const handleExpressAdd = (item: {
    id: string;
    name: string;
    sku: string;
    salePrice: number;
    wholesalePrice?: number;
    taxRate?: number;
  }) => {
    addToCart({
      id: item.id,
      name: item.name,
      sku: item.sku,
      salePrice: item.salePrice,
      wholesalePrice: item.wholesalePrice || item.salePrice,
      taxRate: item.taxRate ?? 0,
      trackStock: false,
    });
  };

  return (
    <div
      dir="ltr"
      className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden surface-obsidian-3d select-none transition-all duration-300"
    >
      {/* Top Header Ribbon */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/60 border-b border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            {storeType === "restaurant" && <UtensilsCrossed className="w-3.5 h-3.5 text-white" />}
            {storeType === "butchery" && <Beef className="w-3.5 h-3.5 text-white" />}
            {storeType === "bakery" && <Croissant className="w-3.5 h-3.5 text-white" />}
            {storeType === "fashion" && <Shirt className="w-3.5 h-3.5 text-white" />}
            {(storeType === "tech" || (storeType as string) === "electronics") && (
              <Smartphone className="w-3.5 h-3.5 text-white" />
            )}
            {storeType === "wholesale" && <Boxes className="w-3.5 h-3.5 text-white" />}
            {storeType === "grocery" && <ShoppingBasket className="w-3.5 h-3.5 text-white" />}
            <span>
              {storeType === "restaurant"
                ? locale === "ar" ? "ركن المطعم والمقهى" : "Console Restaurant & KDS"
                : storeType === "butchery"
                ? locale === "ar" ? "ركن المجزرة والميزان الرقمي" : "Console Boucherie & Balance"
                : storeType === "bakery"
                ? locale === "ar" ? "ركن المخبزة والحلويات" : "Console Boulangerie & Fournée"
                : storeType === "fashion"
                ? locale === "ar" ? "ركن الأزياء والمقاسات" : "Console Prêt-à-Porter & Tailles"
                : storeType === "tech" || (storeType as string) === "electronics"
                ? locale === "ar" ? "ركن الإلكترونيات وتتبع IMEI" : "Console High-Tech & SAV"
                : storeType === "wholesale"
                ? locale === "ar" ? "ركن تجارة الجملة والطرود" : "Console Grossiste & Colisage"
                : locale === "ar" ? "ركن البقالة والسلع السريعة" : "Console Alimentation Générale"}
            </span>
          </span>
          {activeItem && (
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 truncate max-w-[200px]">
              {activeItem.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenIndustryTools && (
            <button
              type="button"
              onClick={onOpenIndustryTools}
              className="keycap-3d px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-[10px] font-bold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-white" />
              <span>{locale === "ar" ? "كل الأدوات" : "Outils Métier"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title={isCollapsed ? "Déplier" : "Replier"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Console Content */}
      {!isCollapsed && (
        <div className="p-3 bg-zinc-950 space-y-2.5 text-xs">
          {/* ==================================================== */}
          {/* 1. RESTAURANT & CAFE DOCK */}
          {/* ==================================================== */}
          {storeType === "restaurant" && (
            <div className="space-y-2">
              {/* Center View Switcher */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => onViewChange?.("menu")}
                    className={`keycap-3d py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      currentView === "menu"
                        ? "bg-white text-zinc-950 border-white shadow-xs"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>📦</span>
                    <span>{locale === "ar" ? "القائمة / Menu" : "Menu Produits"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewChange?.("tables")}
                    className={`keycap-3d py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      currentView === "tables"
                        ? "bg-white text-zinc-950 border-white shadow-xs"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>{locale === "ar" ? "خريطة الطاولات 3D" : "Plan de Salle (Tables)"}</span>
                    {selectedTableName && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-white">
                        {selectedTableName}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewChange?.("kds")}
                    className={`keycap-3d py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      currentView === "kds"
                        ? "bg-white text-zinc-950 border-white shadow-xs"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>{locale === "ar" ? "شاشة المطبخ (KDS)" : "Écran Cuisine (KDS)"}</span>
                  </button>
                </div>

                {/* Quick Kitchen Dispatch Actions */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                    <Users className="w-3 h-3 text-zinc-300" />
                    <span>{guestCount}p</span>
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.min(12, guestCount + 1))}
                      className="text-white hover:text-zinc-300 font-black px-1 cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="text-white hover:text-zinc-300 font-black px-1 cursor-pointer"
                    >
                      -
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => onOpenIndustryTools?.()}
                    className="keycap-3d px-3 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{locale === "ar" ? "إرسال للمطبخ" : "Envoyer Cuisine"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Cooking & Service Modifiers */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">
                  {locale === "ar" ? "ملاحظات فورية:" : "Notes :"}
                </span>
                {[
                  { ar: "بدون بصل", fr: "Sans oignon" },
                  { ar: "طهي جيد", fr: "Bien cuit" },
                  { ar: "صلصة جانبية", fr: "Sauce à part" },
                  { ar: "جبن إضافي", fr: "Extra fromage" },
                  { ar: "مشروب بارد", fr: "Boisson fraîche" },
                  { ar: "زبون VIP", fr: "VIP Client" },
                ].map((mod) => (
                  <button
                    key={mod.fr}
                    type="button"
                    disabled={!activeItem}
                    onClick={() => handleApplyNoteToActive(locale === "ar" ? mod.ar : mod.fr)}
                    className="keycap-3d px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-300 hover:text-white shrink-0 disabled:opacity-40"
                  >
                    +{locale === "ar" ? mod.ar : mod.fr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. BUTCHERY & MEATS DOCK */}
          {/* ==================================================== */}
          {storeType === "butchery" && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* 3D Recessed Obsidian LCD Scale Screen */}
                <div className="p-2.5 px-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-4 font-mono">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Poids Net</span>
                    <span className="text-xl font-black text-white tabular-nums tracking-wider">
                      {scaleKg.toFixed(3)} <span className="text-xs text-zinc-500">kg</span>
                    </span>
                  </div>
                  <div className="border-s border-zinc-800 ps-3">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Prix / Kg</span>
                    <span className="text-sm font-bold text-zinc-300 tabular-nums">
                      {scalePricePerKg.toFixed(2)} <span className="text-[10px] text-zinc-500">MAD</span>
                    </span>
                  </div>
                  <div className="border-s border-zinc-800 ps-3">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Total</span>
                    <span className="text-xl font-black text-white tabular-nums tracking-wider">
                      {(scaleKg * scalePricePerKg).toFixed(2)} <span className="text-xs text-zinc-500">MAD</span>
                    </span>
                  </div>
                </div>

                {/* Tare Buttons */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Tare:</span>
                  {[
                    { label: "0g", val: "0g" },
                    { label: "-15g Sac", val: "-15g" },
                    { label: "-30g Barq.", val: "-30g" },
                    { label: "-50g Plat.", val: "-50g" },
                  ].map((tare) => (
                    <button
                      key={tare.val}
                      type="button"
                      onClick={() => {
                        setActiveTare(tare.val);
                        handleApplyNoteToActive(`Tare: ${tare.val}`);
                      }}
                      className={`keycap-3d px-2 py-1 rounded text-[10px] font-mono font-bold border ${
                        activeTare === tare.val
                          ? "bg-white text-zinc-950 border-white"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                      }`}
                    >
                      {tare.label}
                    </button>
                  ))}
                </div>

                {/* Quick Weight Presets */}
                <div className="flex items-center gap-1">
                  {[0.25, 0.5, 1.0, 2.0].map((kg) => (
                    <button
                      key={kg}
                      type="button"
                      onClick={() => {
                        setScaleKg(kg);
                        if (activeItem) {
                          setItemQuantity(activeItem.productId, kg);
                          handleApplyNoteToActive(`${kg} kg`);
                        }
                      }}
                      className={`keycap-3d px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                        scaleKg === kg
                          ? "bg-white text-zinc-950 border-white"
                          : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white"
                      }`}
                    >
                      {kg >= 1 ? `${kg.toFixed(1)} kg` : `${Math.round(kg * 1000)} g`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Moroccan Cut Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">
                  {locale === "ar" ? "التقطيع:" : "Découpe :"}
                </span>
                {[
                  { ar: "كفتة مفرومة", fr: "Haché" },
                  { ar: "ستيك بقر", fr: "Steak" },
                  { ar: "طاجين / شقف", fr: "Tagine" },
                  { ar: "متبل شواية", fr: "Mariné" },
                  { ar: "كوطليط غنمي", fr: "Côtelettes" },
                ].map((cut) => (
                  <button
                    key={cut.fr}
                    type="button"
                    onClick={() => handleApplyNoteToActive(locale === "ar" ? cut.ar : cut.fr)}
                    className="keycap-3d flex-1 py-1 px-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white text-center shrink-0"
                  >
                    {locale === "ar" ? cut.ar : cut.fr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 3. BAKERY & PASTRIES DOCK */}
          {/* ==================================================== */}
          {storeType === "bakery" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-white" />
                  <span className="font-bold text-white">
                    {locale === "ar" ? "دفعة الفرن الساخنة:" : "Fournée Chaude :"}
                  </span>
                  <span className="font-mono text-xs text-zinc-300 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-zinc-800">
                    ⏱ dans 14 min (09:45)
                  </span>
                </div>

                {onOpenIndustryTools && (
                  <button
                    type="button"
                    onClick={onOpenIndustryTools}
                    className="keycap-3d px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white hover:bg-zinc-850 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🎂</span>
                    <span>{locale === "ar" ? "حجز طورطة مناسبات" : "Réservation Gâteau"}</span>
                  </button>
                )}
              </div>

              {/* 1-Click Assorted Box Multipliers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "250g", price: 35 },
                  { label: "500g", price: 65 },
                  { label: "1 kg", price: 120 },
                  { label: "Plateau Soirée", price: 160 },
                ].map((box) => (
                  <button
                    key={box.label}
                    type="button"
                    onClick={() =>
                      handleExpressAdd({
                        id: `box-${box.label.toLowerCase().replace(/\s+/g, "-")}`,
                        name: `Plateau Assorti (${box.label})`,
                        sku: `BOX-${box.label.toUpperCase().replace(/\s+/g, "-")}`,
                        salePrice: box.price,
                      })
                    }
                    className="keycap-3d p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between"
                  >
                    <span className="font-bold text-white text-xs">{box.label}</span>
                    <span className="font-mono text-zinc-400 text-xs">{box.price} MAD</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 4. FASHION & APPAREL DOCK */}
          {/* ==================================================== */}
          {storeType === "fashion" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Size Pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">Taille:</span>
                  {["XS", "S", "M", "L", "XL", "XXL", "38", "40", "42", "44"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleApplyNoteToActive(`Taille: ${sz}`)}
                      className="keycap-3d px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 hover:text-white"
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">Couleur:</span>
                  {[
                    { name: "Noir", bg: "#000000" },
                    { name: "Blanc", bg: "#ffffff" },
                    { name: "Gris", bg: "#6b7280" },
                    { name: "Beige", bg: "#d2b48c" },
                    { name: "Bleu", bg: "#1e3a8a" },
                    { name: "Rouge", bg: "#dc2626" },
                  ].map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleApplyNoteToActive(`Couleur: ${c.name}`)}
                      className="w-4 h-4 rounded-full border border-white/20 active:scale-95 transition"
                      style={{ backgroundColor: c.bg }}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* Gift / Exchange Voucher Toggle */}
                <button
                  type="button"
                  onClick={() => handleApplyNoteToActive("Ticket Cadeau / Échange 15j")}
                  className="keycap-3d px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-[10px] font-bold text-zinc-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Gift className="w-3 h-3 text-white" />
                  <span>{locale === "ar" ? "تذكرة تبديل (15j)" : "Échange (15j)"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 5. TECH & HIGH-TECH SAV DOCK */}
          {/* ==================================================== */}
          {(storeType === "tech" || (storeType as string) === "electronics") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* 15-Digit IMEI Scanner Recessed Input */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
                  <input
                    type="text"
                    value={imeiInput}
                    onChange={(e) => setImeiInput(e.target.value)}
                    placeholder="Scanner ou saisir IMEI (15 chiffres)..."
                    className="flex-1 h-8 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imeiInput.trim()) {
                        handleApplyNoteToActive(`IMEI: ${imeiInput.trim()}`);
                        setImeiInput("");
                      }
                    }}
                    className="keycap-3d h-8 px-3 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-200 cursor-pointer"
                  >
                    OK
                  </button>
                </div>

                {/* Warranty Duration Pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">Garantie:</span>
                  {["Sans", "3M", "6M", "1 An", "2 Ans"].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleApplyNoteToActive(`Garantie: ${w}`)}
                      className="keycap-3d px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 hover:text-white"
                    >
                      {w}
                    </button>
                  ))}
                </div>

                {/* Device Repair Intake (SAV) */}
                {onOpenIndustryTools && (
                  <button
                    type="button"
                    onClick={onOpenIndustryTools}
                    className="keycap-3d px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white hover:bg-zinc-850 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-white" />
                    <span>{locale === "ar" ? "بون صيانة SAV" : "Intake Réparation"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 6. WHOLESALE & DISTRIBUTION DOCK */}
          {/* ==================================================== */}
          {storeType === "wholesale" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Packaging Multiplier Pills */}
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">Colisage:</span>
                  {[
                    { factor: 1, label: "x1" },
                    { factor: 6, label: "x6 Demi-Pack" },
                    { factor: 12, label: "x12 Carton" },
                    { factor: 24, label: "x24 Colis" },
                    { factor: 50, label: "x50 Palette" },
                  ].map((pkg) => (
                    <button
                      key={pkg.label}
                      type="button"
                      disabled={!activeItem}
                      onClick={() => {
                        if (activeItem) {
                          setItemQuantity(activeItem.productId, pkg.factor);
                          setPricingTier("wholesale");
                          handleApplyNoteToActive(`Colisage ${pkg.label}`);
                        }
                      }}
                      className="keycap-3d flex-1 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 hover:text-white text-center disabled:opacity-40"
                    >
                      {pkg.label}
                    </button>
                  ))}
                </div>

                {/* BL Mode Switch & Buyer ICE Input */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={wholesaleIce}
                    onChange={(e) => setWholesaleIce(e.target.value)}
                    placeholder="ICE Acheteur (15 chiffres)..."
                    className="h-8 px-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsBlActive(!isBlActive);
                      handleApplyNoteToActive(`BL Mode: ICE ${wholesaleIce || "Comptoir"}`);
                    }}
                    className={`keycap-3d px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      isBlActive
                        ? "bg-white text-zinc-950 border-white shadow-xs"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 inline me-1" />
                    <span>Bon de Livraison (BL)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 7. GROCERY & SUPERETTE DOCK */}
          {/* ==================================================== */}
          {storeType === "grocery" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
                <span>{locale === "ar" ? "مقضيات سريعة بنقرة واحدة (بدون باركود)" : "Rayon Express du Quotidien (Sans Barcode)"}</span>
                <span className="font-mono text-zinc-400">1-Clic Panier</span>
              </div>

              {/* Express Staples */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: "exp-pain", name: "Pain Rond / خبز", sku: "EXP-PAIN", price: 1.2 },
                  { id: "exp-lait", name: "Lait Pasteurisé / حليب", sku: "EXP-LAIT", price: 3.5 },
                  { id: "exp-eau", name: "Eau Minérale 1.5L / ماء", sku: "EXP-EAU", price: 6.0 },
                  { id: "exp-oeuf", name: "Œuf Frais / بيض", sku: "EXP-OEUF", price: 1.5 },
                  { id: "exp-sac", name: "Sac Plastique / كيس", sku: "EXP-SAC", price: 0.1 },
                  { id: "exp-sucre", name: "Sucre Morceaux / سكر", sku: "EXP-SUCRE", price: 6.0 },
                ].map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => handleExpressAdd({ id: exp.id, name: exp.name, sku: exp.sku, salePrice: exp.price })}
                    className="keycap-3d py-1.5 px-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-center"
                  >
                    <div className="text-[11px] font-bold text-white truncate">{exp.name.split("/")[0].trim()}</div>
                    <div className="text-[10px] font-mono font-bold text-zinc-300 mt-0.5">{exp.price.toFixed(2)} MAD</div>
                  </button>
                ))}
              </div>

              {/* Quick Consigne Pills */}
              <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60 text-[10px]">
                <span className="font-bold text-zinc-400 uppercase">Consigne:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleExpressAdd({
                      id: `dep-gaz-${Date.now()}`,
                      name: "Consigne Gaz 12Kg (+100 MAD)",
                      sku: "DEP-GAZ",
                      salePrice: 100,
                    })
                  }
                  className="keycap-3d px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                >
                  + Gaz (+100)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleExpressAdd({
                      id: `ret-gaz-${Date.now()}`,
                      name: "Retour Consigne Gaz (-100 MAD)",
                      sku: "RET-GAZ",
                      salePrice: -100,
                    })
                  }
                  className="keycap-3d px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono"
                >
                  - Retour Gaz (-100)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleExpressAdd({
                      id: `dep-cas-${Date.now()}`,
                      name: "Consigne Casier (+15 MAD)",
                      sku: "DEP-CAS",
                      salePrice: 15,
                    })
                  }
                  className="keycap-3d px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono"
                >
                  + Casier (+15)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
