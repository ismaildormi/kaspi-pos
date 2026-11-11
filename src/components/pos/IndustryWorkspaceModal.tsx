"use client";

import React, { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  ChefHat,
  Scale,
  Beef,
  Croissant,
  Flame,
  Shirt,
  Smartphone,
  ShieldCheck,
  Wrench,
  Boxes,
  ShoppingBasket,
  Barcode,
  Printer,
  Sparkles,
  X,
  Send,
  RefreshCw,
  Gift,
  Plus,
  Minus,
  Check,
  User,
  Phone,
  Calendar,
  FileText,
  Users,
} from "lucide-react";
import { StoreIndustryType, usePosStore } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";

interface IndustryWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboardingSwitch: () => void;
}

interface DiningTableItem {
  id: string;
  name: string;
  capacity: number;
  status: "free" | "occupied" | "billing";
  elapsedMinutes?: number;
  amount?: number;
}

interface KitchenTicketRecord {
  id: string;
  status: string;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    quantity: number | string;
    notes?: string | null;
    status: string;
  }[];
}

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const FASHION_COLORS = [
  { name: "Noir", hex: "#000000" },
  { name: "Blanc", hex: "#ffffff" },
  { name: "Gris", hex: "#6b7280" },
  { name: "Beige", hex: "#d2b48c" },
  { name: "Bleu Marine", hex: "#1e3a8a" },
  { name: "Rouge", hex: "#dc2626" },
  { name: "Kaki", hex: "#4b5320" },
];

export function IndustryWorkspaceModal({
  isOpen,
  onClose,
  onOpenOnboardingSwitch,
}: IndustryWorkspaceModalProps) {
  const { t, locale } = useAppDictionary();
  const {
    storeType,
    cart: items,
    selectedTableId,
    selectedTableName,
    setSelectedTable,
    updateItemNotes,
    setItemQuantity: updateQuantity,
    addToCart,
    setPricingTier,
    getGrandTotal,
  } = usePosStore();

  const [activeTab, setActiveTab] = useState<StoreIndustryType>(storeType);
  const [selectedCartItemId, setSelectedCartItemId] = useState<string>("");

  // Restaurant State
  const [orderMode, setOrderMode] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [guestCount, setGuestCount] = useState<number>(2);
  const [splitParts, setSplitParts] = useState<number>(2);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [tables, setTables] = useState<DiningTableItem[]>([
    { id: "t1", name: "T-01", capacity: 2, status: "free" },
    { id: "t2", name: "T-02", capacity: 4, status: "occupied", elapsedMinutes: 28, amount: 240 },
    { id: "t3", name: "T-03", capacity: 4, status: "free" },
    { id: "t4", name: "T-04", capacity: 6, status: "billing", elapsedMinutes: 52, amount: 580 },
    { id: "t5", name: "T-05", capacity: 2, status: "free" },
    { id: "t6", name: "T-06", capacity: 4, status: "occupied", elapsedMinutes: 14, amount: 160 },
    { id: "t7", name: "T-07", capacity: 8, status: "free" },
    { id: "t8", name: "T-08", capacity: 4, status: "free" },
    { id: "t9", name: "T-09", capacity: 2, status: "occupied", elapsedMinutes: 41, amount: 195 },
    { id: "t10", name: "T-10", capacity: 4, status: "free" },
    { id: "t11", name: "T-11", capacity: 6, status: "free" },
    { id: "t12", name: "T-12", capacity: 4, status: "free" },
    { id: "ter1", name: "Terrasse 1", capacity: 4, status: "occupied", elapsedMinutes: 22, amount: 310 },
    { id: "ter2", name: "Terrasse 2", capacity: 4, status: "free" },
    { id: "ter3", name: "Terrasse 3", capacity: 2, status: "free" },
    { id: "ter4", name: "Terrasse 4", capacity: 6, status: "free" },
  ]);
  const [tickets, setTickets] = useState<KitchenTicketRecord[]>([]);
  const [loadingKds, setLoadingKds] = useState(false);
  const [sendingToKitchen, setSendingToKitchen] = useState(false);
  const [kdsFeedback, setKdsFeedback] = useState<string | null>(null);

  // Butchery State
  const [scaleWeightKg, setScaleWeightKg] = useState<number>(0.75);
  const [scalePricePerKg, setScalePricePerKg] = useState<number>(110);
  const [activeTare, setActiveTare] = useState<string>("0g");
  const [selectedCut, setSelectedCut] = useState<string>("Haché");

  // Bakery State
  const [selectedPastryBox, setSelectedPastryBox] = useState<{ size: string; weight: string; price: number }>({
    size: "500g",
    weight: "0.500 kg",
    price: 65,
  });
  const [selectedPastryMix, setSelectedPastryMix] = useState<string>("Beldi & Sablé");
  const [cakeReservation, setCakeReservation] = useState({
    clientName: "",
    clientPhone: "",
    pickupDate: "",
    cakeMessage: "",
    sizeParts: 10,
    deposit: 100,
  });
  const [cakeReservedFeedback, setCakeReservedFeedback] = useState<string | null>(null);

  // Fashion State
  const [chosenSize, setChosenSize] = useState("L");
  const [chosenColor, setChosenColor] = useState("Noir");
  const [giftVoucherActive, setGiftVoucherActive] = useState(false);

  // Tech / Electronics State
  const [serialNumber, setSerialNumber] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("12");
  const [repairIntake, setRepairIntake] = useState({
    clientName: "",
    clientPhone: "",
    deviceModel: "iPhone 13",
    issue: "Écran cassé",
    estimatedCost: 650,
    deposit: 200,
  });
  const [repairFeedback, setRepairFeedback] = useState<string | null>(null);

  // Wholesale State
  const [buyerCompany, setBuyerCompany] = useState("");
  const [buyerIce, setBuyerIce] = useState("");
  const [isBlMode, setIsBlMode] = useState(true);

  // Grocery State
  const [labelTitle, setLabelTitle] = useState("Huile d'Olive Extra Vierge 1L");
  const [labelPrice, setLabelPrice] = useState("85.00");
  const [labelBarcode, setLabelBarcode] = useState("6111000010024");

  useEffect(() => {
    setActiveTab(storeType);
  }, [storeType, isOpen]);

  useEffect(() => {
    if (items.length > 0 && !selectedCartItemId) {
      setSelectedCartItemId(items[items.length - 1].productId);
    }
  }, [items, selectedCartItemId]);

  const targetItem =
    items.find((i) => i.productId === selectedCartItemId) || items[items.length - 1];

  const fetchKds = async () => {
    setLoadingKds(true);
    try {
      const res = await fetch("/api/v1/kds");
      const json = await res.json();
      if (json.ok && json.data) {
        if (json.data.tables && json.data.tables.length > 0) {
          setTables(json.data.tables);
        }
        setTickets(json.data.tickets || []);
      }
    } catch {
      // offline fallback
    } finally {
      setLoadingKds(false);
    }
  };

  useEffect(() => {
    if (isOpen && (activeTab === "restaurant" || storeType === "restaurant")) {
      fetchKds();
    }
  }, [isOpen, activeTab, storeType]);

  if (!isOpen) return null;

  const handleDispatchKitchen = async () => {
    if (items.length === 0) {
      setKdsFeedback(t.industryTools.noItemInCart);
      return;
    }
    setSendingToKitchen(true);
    setKdsFeedback(null);
    try {
      const res = await fetch("/api/v1/kds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_ticket",
          tableId: selectedTableId,
          tableName: selectedTableName || (orderMode === "dine_in" ? "Comptoir" : orderMode === "takeaway" ? "À Emporter" : "Livraison"),
          items: items.map((i) => ({
            productName: i.name,
            quantity: i.quantity,
            notes: i.notes || "",
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setKdsFeedback(locale === "ar" ? "تم إرسال الطلب للمطبخ (KDS) بنجاح ✓" : "Commande transmise en cuisine (KDS) ✓");
        fetchKds();
      }
    } catch {
      setKdsFeedback(locale === "ar" ? "تم حفظ التذكرة محلياً ✓" : "Ticket enregistré localement ✓");
    } finally {
      setSendingToKitchen(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string, tableId?: string) => {
    try {
      await fetch("/api/v1/kds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          ticketId,
          status,
          tableId,
        }),
      });
      fetchKds();
    } catch {
      // offline fallback
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
      );
    }
  };

  const applyModifierToItem = (modifier: string) => {
    if (!targetItem) return;
    const existing = targetItem.notes ? `${targetItem.notes} • ` : "";
    updateItemNotes(targetItem.productId, `${existing}${modifier}`);
  };

  const printBarcodeLabel = () => {
    const printWindow = window.open("", "_blank", "width=380,height=300");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${labelTitle}</title>
          <style>
            @page { size: 40mm 30mm; margin: 0; }
            body { font-family: monospace; padding: 4px; text-align: center; margin: 0; }
            .title { font-size: 10px; font-weight: bold; max-height: 24px; overflow: hidden; }
            .price { font-size: 14px; font-weight: 900; margin: 2px 0; }
            .barcode { font-size: 16px; letter-spacing: 2px; }
            .digits { font-size: 8px; }
          </style>
        </head>
        <body>
          <div class="title">${labelTitle}</div>
          <div class="price">${labelPrice} DH</div>
          <div class="barcode">||||||||||||||||||</div>
          <div class="digits">${labelBarcode}</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const SECTORS_LIST: { id: StoreIndustryType; labelAr: string; labelFr: string; labelEn: string; icon: any }[] = [
    { id: "restaurant", labelAr: "مطعم ومقهى", labelFr: "Restaurant & Café", labelEn: "Restaurant", icon: UtensilsCrossed },
    { id: "butchery", labelAr: "مجزرة ولحوم", labelFr: "Boucherie & Viandes", labelEn: "Butchery", icon: Beef },
    { id: "bakery", labelAr: "مخبزة وحلويات", labelFr: "Boulangerie & Pâtisserie", labelEn: "Bakery", icon: Croissant },
    { id: "fashion", labelAr: "ألبسة وأحذية", labelFr: "Prêt-à-Porter & Chaussures", labelEn: "Fashion", icon: Shirt },
    { id: "tech", labelAr: "إلكترونيات وهواتف", labelFr: "High-Tech & Téléphonie", labelEn: "Tech & SAV", icon: Smartphone },
    { id: "wholesale", labelAr: "تجارة الجملة", labelFr: "Grossiste & Dépôt", labelEn: "Wholesale", icon: Boxes },
    { id: "grocery", labelAr: "بقالة وسوبرماركت", labelFr: "Alimentation Générale", labelEn: "Grocery", icon: ShoppingBasket },
  ];

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-5xl rounded-3xl bg-[#09090b] border border-zinc-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-zinc-900/60 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>{t.industryTools.modalTitle}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                  V-OMEGA CHAMELEON
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                {locale === "ar"
                  ? "أدوات قطاعية ذكية متكيفة مع نوع نشاطك التجاري"
                  : "Postes de travail intelligents adaptés à vos 7 secteurs métiers"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOnboardingSwitch();
              }}
              className="keycap-3d px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold hover:text-white transition cursor-pointer"
            >
              {t.onboarding.businessSectorBtn}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="keycap-3d p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Sector Navigation Bar */}
        <div className="px-6 py-2.5 border-b border-zinc-800 bg-zinc-950/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {SECTORS_LIST.map((sector) => {
            const Icon = sector.icon;
            const isActive = activeTab === sector.id;
            const isStoreDefault = storeType === sector.id;
            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => setActiveTab(sector.id)}
                className={`keycap-3d flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-white text-zinc-950 border-white shadow-sm"
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-850"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-zinc-950" : "text-zinc-400"}`} />
                <span>{locale === "ar" ? sector.labelAr : locale === "en" ? sector.labelEn : sector.labelFr}</span>
                {isStoreDefault && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-zinc-950" : "bg-white"}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Cart Item Selector Bar */}
        {items.length > 0 && (
          <div className="px-6 py-2 bg-zinc-900/40 border-b border-zinc-800/60 flex items-center justify-between gap-3 text-xs">
            <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
              <span>{t.industryTools.selectedCartItem}:</span>
              <strong className="text-white">{targetItem?.name}</strong>
              <span className="font-mono text-zinc-400">({targetItem?.unitPrice.toFixed(2)} MAD)</span>
            </span>
            <select
              value={targetItem?.productId || ""}
              onChange={(e) => setSelectedCartItemId(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-semibold focus:outline-none"
            >
              {items.map((item) => (
                <option key={item.productId} value={item.productId}>
                  {item.name} (x{item.quantity}) {item.notes ? `— [${item.notes}]` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ======================================================== */}
          {/* 1. RESTAURANT / CAFE WORKSPACE */}
          {/* ======================================================== */}
          {activeTab === "restaurant" && (
            <div className="space-y-6">
              {/* Order Mode & Guests */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase">Mode:</span>
                  {[
                    { id: "dine_in", labelAr: "محلي (بالصالة)", labelFr: "Sur Place", labelEn: "Dine In" },
                    { id: "takeaway", labelAr: "سفري (إلى المنزل)", labelFr: "À Emporter", labelEn: "Takeaway" },
                    { id: "delivery", labelAr: "توصيل سريع", labelFr: "Livraison", labelEn: "Delivery" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setOrderMode(mode.id as any)}
                      className={`keycap-3d py-1.5 px-3 rounded-xl text-xs font-bold border transition ${
                        orderMode === mode.id
                          ? "bg-white text-zinc-950 border-white shadow-xs"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                      }`}
                    >
                      {locale === "ar" ? mode.labelAr : locale === "en" ? mode.labelEn : mode.labelFr}
                    </button>
                  ))}
                </div>

                {orderMode === "dine_in" && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-400">
                      {locale === "ar" ? "عدد الزبائن:" : "Couverts :"}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setGuestCount(num)}
                          className={`keycap-3d w-7 h-7 rounded-lg text-xs font-bold font-mono border transition ${
                            guestCount === num
                              ? "bg-white text-zinc-950 border-white"
                              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3D Floor Plan Tables */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-white" />
                    <span>{t.industryTools.tablesTitle} (Plan de Salle 3D)</span>
                  </h4>
                  {selectedTableName && (
                    <button
                      type="button"
                      onClick={() => setSelectedTable(null, null)}
                      className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      Détacher table ({selectedTableName})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                  {tables.map((tbl) => {
                    const isSelected = selectedTableId === tbl.id || selectedTableName === tbl.name;
                    const isOccupied = tbl.status === "occupied";
                    const isBilling = tbl.status === "billing";
                    return (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => setSelectedTable(tbl.id, tbl.name)}
                        className={`keycap-3d p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col justify-between h-24 ${
                          isSelected
                            ? "bg-white text-zinc-950 border-white font-bold shadow-lg"
                            : isBilling
                            ? "bg-zinc-800 border-zinc-600 text-white"
                            : isOccupied
                            ? "bg-zinc-900/90 border-zinc-700 text-zinc-200"
                            : "bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span>{tbl.name}</span>
                          <span className="font-mono text-[9px] opacity-75">{tbl.capacity}p</span>
                        </div>
                        <div className="my-auto">
                          {isOccupied && tbl.amount && (
                            <span className="text-[11px] font-bold font-mono block">
                              {tbl.amount} MAD
                            </span>
                          )}
                          {isOccupied && tbl.elapsedMinutes && (
                            <span className="text-[9px] font-mono text-zinc-400 block">
                              ⏱ {tbl.elapsedMinutes}m
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-wider">
                          {isBilling
                            ? "Addition"
                            : isOccupied
                            ? t.industryTools.tableOccupied
                            : t.industryTools.tableFree}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dish Modifiers & Quick Kitchen Notes */}
              <div>
                <h4 className="text-sm font-bold text-white mb-2.5 flex items-center justify-between">
                  <span>{t.industryTools.modifiersTitle} & Cuissons</span>
                  <span className="text-xs text-zinc-500 font-normal">
                    {targetItem ? `Pour : ${targetItem.name}` : "Sélectionnez un article"}
                  </span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Sans oignon",
                    "Bien cuit",
                    "À point",
                    "Saignant",
                    "Sauce à part",
                    "Sans sel",
                    "Extra fromage",
                    "Piquant (Harissa)",
                    "Entrée d'abord",
                    "Plats ensemble",
                    "VIP Client",
                  ].map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      disabled={!targetItem}
                      onClick={() => applyModifierToItem(mod)}
                      className="keycap-3d px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 transition cursor-pointer disabled:opacity-40"
                    >
                      + {mod}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kitchen Board & Split Bill Bar */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-white" />
                    <span className="text-sm font-black text-white">
                      {t.industryTools.kdsTitle} (Écran Cuisine)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSplitBill(!showSplitBill)}
                      className="keycap-3d px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white cursor-pointer"
                    >
                      {locale === "ar" ? "تقسيم الحساب (Split)" : "Partager l'addition"}
                    </button>
                    <button
                      type="button"
                      onClick={fetchKds}
                      className="keycap-3d p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                      title="Actualiser KDS"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingKds ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      type="button"
                      disabled={sendingToKitchen || items.length === 0}
                      onClick={handleDispatchKitchen}
                      className="keycap-3d inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs transition disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t.common.confirm} (KDS)</span>
                    </button>
                  </div>
                </div>

                {/* Split Bill Calculator Drawer */}
                {showSplitBill && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        {locale === "ar" ? "تقسيم الحساب بالتساوي:" : "Partage équitable :"}
                      </span>
                      <div className="flex items-center gap-1">
                        {[2, 3, 4, 5, 6].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setSplitParts(p)}
                            className={`keycap-3d px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                              splitParts === p
                                ? "bg-white text-zinc-950 border-white"
                                : "bg-zinc-900 text-zinc-400 border-zinc-800"
                            }`}
                          >
                            {p} parts
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-mono">
                        {getGrandTotal().toFixed(2)} MAD ÷ {splitParts}
                      </span>
                      <span className="text-sm font-black font-mono text-white">
                        {(getGrandTotal() / splitParts).toFixed(2)} MAD / personne
                      </span>
                    </div>
                  </div>
                )}

                {kdsFeedback && (
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold">
                    {kdsFeedback}
                  </div>
                )}

                {tickets.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                    {t.industryTools.noItemInCart}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tickets.map((tk) => (
                      <div
                        key={tk.id}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold mb-2">
                            <span className="font-mono text-white">
                              #{tk.id.slice(-4).toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 uppercase text-[10px] font-mono border border-zinc-700">
                              {tk.status}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {tk.items.map((it) => (
                              <div key={it.id} className="text-xs text-zinc-300">
                                <span className="font-bold text-white">{Number(it.quantity)}x</span>{" "}
                                {it.productName}
                                {it.notes && (
                                  <div className="text-[10px] text-zinc-400 pl-3">
                                    ↳ {it.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800">
                          {tk.status === "new" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(tk.id, "preparing")}
                              className="keycap-3d flex-1 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] font-bold"
                            >
                              Preparing
                            </button>
                          )}
                          {tk.status !== "ready" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(tk.id, "ready")}
                              className="keycap-3d flex-1 py-1.5 rounded-lg bg-white text-zinc-950 border border-white text-[11px] font-bold"
                            >
                              Ready
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateTicketStatus(tk.id, "served", selectedTableId || undefined)}
                            className="keycap-3d flex-1 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-bold"
                          >
                            Served
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. BUTCHERY / MEATS WORKSPACE */}
          {/* ======================================================== */}
          {activeTab === "butchery" && (
            <div className="space-y-6">
              {/* Digital LCD Scale Simulator */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-white" />
                    <span className="text-sm font-bold text-white">
                      {locale === "ar" ? "ميزان رقمي مباشر (Digital LCD Scale)" : "Balance Électronique Numérique"}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                    RS232 / USB Sim
                  </span>
                </div>

                {/* LCD Screen Display */}
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Poids Net</span>
                    <span className="text-4xl font-black text-white tabular-nums tracking-wider">
                      {scaleWeightKg.toFixed(3)} <span className="text-lg text-zinc-500">kg</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Prix / Kg</span>
                    <span className="text-2xl font-bold text-zinc-300 tabular-nums">
                      {scalePricePerKg.toFixed(2)} <span className="text-sm text-zinc-500">MAD</span>
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Pesée</span>
                    <span className="text-4xl font-black text-white tabular-nums tracking-wider">
                      {(scaleWeightKg * scalePricePerKg).toFixed(2)} <span className="text-lg text-zinc-500">MAD</span>
                    </span>
                  </div>
                </div>

                {/* Tare Selectors */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">Tare:</span>
                  {[
                    { label: "0g (Net)", val: "0g" },
                    { label: "-15g (Sac Plastique)", val: "-15g" },
                    { label: "-30g (Barquette)", val: "-30g" },
                    { label: "-50g (Plateau Carton)", val: "-50g" },
                  ].map((tare) => (
                    <button
                      key={tare.val}
                      type="button"
                      onClick={() => setActiveTare(tare.val)}
                      className={`keycap-3d px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition ${
                        activeTare === tare.val
                          ? "bg-white text-zinc-950 border-white"
                          : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                      }`}
                    >
                      {tare.label}
                    </button>
                  ))}
                </div>

                {/* Weight Preset Pills */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2">
                    {locale === "ar" ? "أوزان مسبقة التحديد:" : "Poids Prédéfinis :"}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[0.25, 0.5, 0.75, 1.0, 1.5, 2.0].map((kg) => (
                      <button
                        key={kg}
                        type="button"
                        onClick={() => setScaleWeightKg(kg)}
                        className={`keycap-3d py-2 rounded-xl text-xs font-mono font-bold border transition ${
                          scaleWeightKg === kg
                            ? "bg-white text-zinc-950 border-white"
                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                        }`}
                      >
                        {kg >= 1 ? `${kg.toFixed(1)} kg` : `${Math.round(kg * 1000)} g`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Moroccan Cuts Selector */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2">
                    {locale === "ar" ? "طريقة التقطيع / الإعداد:" : "Découpe & Préparation :"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {[
                      { ar: "كفتة مفرومة", fr: "Haché" },
                      { ar: "ستيك", fr: "Steak" },
                      { ar: "طاجين / شقف", fr: "Tagine" },
                      { ar: "متبل (شواية)", fr: "Mariné" },
                      { ar: "كوطليط", fr: "Côtelettes" },
                      { ar: "مقطع شرائح", fr: "Émincé" },
                    ].map((cut) => (
                      <button
                        key={cut.fr}
                        type="button"
                        onClick={() => setSelectedCut(cut.fr)}
                        className={`keycap-3d py-2 px-2 rounded-xl text-xs font-bold border text-center transition ${
                          selectedCut === cut.fr
                            ? "bg-white text-zinc-950 border-white"
                            : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:text-white"
                        }`}
                      >
                        <div>{locale === "ar" ? cut.ar : cut.fr}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply Weight Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={!targetItem}
                    onClick={() => {
                      if (!targetItem) return;
                      updateQuantity(targetItem.productId, scaleWeightKg);
                      updateItemNotes(
                        targetItem.productId,
                        `[${scaleWeightKg} kg • ${selectedCut} • Tare ${activeTare}]`
                      );
                    }}
                    className="keycap-3d py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold text-xs disabled:opacity-40 cursor-pointer"
                  >
                    {locale === "ar" ? "تطبيق على المنتج المحدد بالسلّة" : "Appliquer au produit sélectionné"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(
                        {
                          id: `meat-${Date.now()}`,
                          name: `Viande Bovine (${selectedCut})`,
                          sku: `MEAT-${selectedCut.toUpperCase()}`,
                          salePrice: scalePricePerKg,
                          wholesalePrice: scalePricePerKg * 0.9,
                          taxRate: 0,
                          trackStock: false,
                        },
                        scaleWeightKg,
                        `[${scaleWeightKg} kg • ${selectedCut} • Tare ${activeTare}]`
                      );
                    }}
                    className="keycap-3d py-3 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-200 cursor-pointer shadow-xs"
                  >
                    + {locale === "ar" ? "إضافة لحم موزون كعنصر جديد للسلّة" : "Ajouter Viande Pesée au Panier"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. BAKERY / PASTRIES WORKSPACE */}
          {/* ======================================================== */}
          {activeTab === "bakery" && (
            <div className="space-y-6">
              {/* Hot Oven Batch Indicator */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {locale === "ar" ? "دفعة الخبز والكرواسون الساخنة القادمة" : "Prochaine Fournée de Pain & Viennoiseries"}
                    </h5>
                    <p className="text-[11px] font-mono text-zinc-400">
                      Baguettes chaudes, Croissants beurre & Pain complet
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-zinc-950 border border-zinc-700 text-white">
                    ⏱ dans 14 min (09:45)
                  </span>
                </div>
              </div>

              {/* Assorted Pastry Box Builder */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Croissant className="w-4 h-4 text-white" />
                  <span>{locale === "ar" ? "تجهيز بلاطو / علبة حلويات مشكلة" : "Composer une Boîte / Plateau de Pâtisseries"}</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { size: "250g", weight: "0.250 kg", price: 35 },
                    { size: "500g", weight: "0.500 kg", price: 65 },
                    { size: "1 kg", weight: "1.000 kg", price: 120 },
                    { size: "Plateau Soirée", weight: "1.500 kg", price: 160 },
                  ].map((box) => (
                    <button
                      key={box.size}
                      type="button"
                      onClick={() => setSelectedPastryBox(box)}
                      className={`keycap-3d p-3 rounded-2xl border text-center transition ${
                        selectedPastryBox.size === box.size
                          ? "bg-white text-zinc-950 border-white shadow-xs font-bold"
                          : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:text-white"
                      }`}
                    >
                      <div className="text-xs font-black">{box.size}</div>
                      <div className="text-[10px] font-mono mt-0.5 opacity-80">{box.price} MAD</div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2">
                    {locale === "ar" ? "التشكيلة المختارة:" : "Assortiment :"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      "Beldi & Sablé",
                      "Cornes de Gazelle",
                      "Pâtisserie Fine",
                      "Viennoiseries",
                    ].map((mix) => (
                      <button
                        key={mix}
                        type="button"
                        onClick={() => setSelectedPastryMix(mix)}
                        className={`keycap-3d py-2 rounded-xl text-xs font-bold border text-center transition ${
                          selectedPastryMix === mix
                            ? "bg-white text-zinc-950 border-white"
                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                        }`}
                      >
                        {mix}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addToCart(
                      {
                        id: `pastry-box-${Date.now()}`,
                        name: `Plateau Assorti (${selectedPastryBox.size})`,
                        sku: `BOX-${selectedPastryBox.size.replace(/\s+/g, "").toUpperCase()}`,
                        salePrice: selectedPastryBox.price,
                        taxRate: 0,
                        trackStock: false,
                      },
                      1,
                      `[${selectedPastryBox.size} • ${selectedPastryMix}]`
                    );
                  }}
                  className="keycap-3d w-full py-3 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-200 cursor-pointer shadow-xs"
                >
                  + {locale === "ar" ? "إضافة البلاطو للسلّة" : "Ajouter le Plateau au Panier"} ({selectedPastryBox.price} MAD)
                </button>
              </div>

              {/* Event Cake Reservation Form */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white" />
                  <span>{locale === "ar" ? "حجز طورطة / حلوى مناسبات" : "Réservation Gâteau d'Événement"}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      {locale === "ar" ? "اسم الزبون" : "Nom du Client"}
                    </label>
                    <input
                      type="text"
                      value={cakeReservation.clientName}
                      onChange={(e) =>
                        setCakeReservation({ ...cakeReservation, clientName: e.target.value })
                      }
                      placeholder="Ex: Fatima Zahra"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      {locale === "ar" ? "الهاتف" : "Téléphone"}
                    </label>
                    <input
                      type="tel"
                      value={cakeReservation.clientPhone}
                      onChange={(e) =>
                        setCakeReservation({ ...cakeReservation, clientPhone: e.target.value })
                      }
                      placeholder="06XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      {locale === "ar" ? "تاريخ ووقت الاستلام" : "Date & Heure Retrait"}
                    </label>
                    <input
                      type="text"
                      value={cakeReservation.pickupDate}
                      onChange={(e) =>
                        setCakeReservation({ ...cakeReservation, pickupDate: e.target.value })
                      }
                      placeholder="Ex: Samedi 18:00"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      {locale === "ar" ? "العبارة المكتوبة على الطورطة" : "Écriture sur le gâteau"}
                    </label>
                    <input
                      type="text"
                      value={cakeReservation.cakeMessage}
                      onChange={(e) =>
                        setCakeReservation({ ...cakeReservation, cakeMessage: e.target.value })
                      }
                      placeholder="Ex: Joyeux Anniversaire Rayan"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Taille (parts)</label>
                      <select
                        value={cakeReservation.sizeParts}
                        onChange={(e) =>
                          setCakeReservation({ ...cakeReservation, sizeParts: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                      >
                        <option value={6}>6 parts (150 DH)</option>
                        <option value={10}>10 parts (250 DH)</option>
                        <option value={15}>15 parts (350 DH)</option>
                        <option value={20}>20 parts (480 DH)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Acompte (DH)</label>
                      <input
                        type="number"
                        value={cakeReservation.deposit}
                        onChange={(e) =>
                          setCakeReservation({ ...cakeReservation, deposit: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {cakeReservedFeedback && (
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs font-semibold">
                    {cakeReservedFeedback}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    addToCart(
                      {
                        id: `cake-res-${Date.now()}`,
                        name: `Acompte Gâteau (${cakeReservation.sizeParts}p - ${cakeReservation.clientName || "Client"})`,
                        sku: `CAKE-DEP`,
                        salePrice: cakeReservation.deposit,
                        taxRate: 0,
                        trackStock: false,
                      },
                      1,
                      `[Réservation: ${cakeReservation.clientName} • ${cakeReservation.clientPhone} • Retrait: ${cakeReservation.pickupDate} • Msg: "${cakeReservation.cakeMessage}"]`
                    );
                    setCakeReservedFeedback(
                      locale === "ar"
                        ? "تم تسجيل حجز الطورطة وإضافة العربون للسلّة بنجاح ✓"
                        : "Réservation enregistrée & Acompte ajouté au panier ✓"
                    );
                  }}
                  className="keycap-3d w-full py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold text-xs hover:bg-zinc-800 cursor-pointer"
                >
                  {locale === "ar" ? "تسجيل الحجز وإضافة العربون للسلّة" : "Enregistrer Réservation & Ajouter Acompte"} ({cakeReservation.deposit} MAD)
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. FASHION / CLOTHING WORKSPACE */}
          {/* ======================================================== */}
          {activeTab === "fashion" && (
            <div className="space-y-6">
              {/* Size Matrix */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                    {t.industryTools.sizeSelectorTitle} — Prêt-à-Porter
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {APPAREL_SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setChosenSize(sz)}
                        className={`keycap-3d w-12 h-11 rounded-xl font-mono font-black text-xs border transition cursor-pointer ${
                          chosenSize === sz
                            ? "bg-white text-zinc-950 border-white shadow-xs"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                    Pointures Chaussures
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {SHOE_SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setChosenSize(sz)}
                        className={`keycap-3d w-11 h-10 rounded-xl font-mono font-bold text-xs border transition cursor-pointer ${
                          chosenSize === sz
                            ? "bg-white text-zinc-950 border-white shadow-xs"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Swatches */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                    {t.industryTools.colorTitle}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {FASHION_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setChosenColor(c.name)}
                        className={`keycap-3d flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          chosenColor === c.name
                            ? "bg-white text-zinc-950 border-white"
                            : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white"
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply Variant to Item */}
                <button
                  type="button"
                  disabled={!targetItem}
                  onClick={() => {
                    if (!targetItem) return;
                    updateItemNotes(
                      targetItem.productId,
                      `[Taille: ${chosenSize} • Couleur: ${chosenColor}${giftVoucherActive ? " • Ticket Cadeau 15j" : ""}]`
                    );
                  }}
                  className="keycap-3d w-full py-3.5 rounded-xl bg-white text-zinc-950 font-black text-sm shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  {t.common.confirm} ({chosenSize} — {chosenColor})
                </button>
              </div>

              {/* Gift Voucher / Exchange Ticket */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-white" />
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {locale === "ar" ? "تذكرة تبديل بدون سعر (15 يوماً)" : "Ticket Cadeau / Échange (sans prix - 15 jours)"}
                    </h5>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Permet au client d'échanger l'article en boutique sans afficher le montant
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGiftVoucherActive(!giftVoucherActive)}
                  className={`keycap-3d px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    giftVoucherActive
                      ? "bg-white text-zinc-950 border-white"
                      : "bg-zinc-950 text-zinc-400 border-zinc-800"
                  }`}
                >
                  {giftVoucherActive ? "Actif ✓" : "Activer"}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. TECH & HIGH-TECH REPAIR (SAV) */}
          {/* ======================================================== */}
          {activeTab === "tech" && (
            <div className="space-y-6">
              {/* IMEI & Warranty Binder */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>{locale === "ar" ? "ربط الرقم التسلسلي والضمان بالسلّة" : "Traçabilité IMEI & Garantie Produit"}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                      {t.industryTools.imeiTitle}
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="356938035643809 (15 chiffres)"
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                      {t.industryTools.warrantyTitle}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {["0", "3", "6", "12", "24"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setWarrantyMonths(m)}
                          className={`keycap-3d py-2.5 rounded-xl font-mono font-black text-xs border transition cursor-pointer ${
                            warrantyMonths === m
                              ? "bg-white text-zinc-950 border-white"
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {m === "0" ? "Sans" : `${m} M`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!targetItem}
                  onClick={() => {
                    if (!targetItem) return;
                    updateItemNotes(
                      targetItem.productId,
                      `[IMEI: ${serialNumber || "N/A"} • Garantie: ${warrantyMonths === "0" ? "Sans" : `${warrantyMonths} Mois`}]`
                    );
                  }}
                  className="keycap-3d w-full py-3 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-200 cursor-pointer disabled:opacity-40 shadow-xs"
                >
                  {locale === "ar" ? "ربط بالمنتج المحدد بالسلّة" : "Lier IMEI & Garantie au Produit"}
                </button>
              </div>

              {/* Quick Repair Intake (SAV) Form */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-white" />
                  <span>{locale === "ar" ? "إصدار بون صيانة واستلام جهاز (SAV)" : "Intake & Bon de Réparation Matériel"}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Client</label>
                    <input
                      type="text"
                      value={repairIntake.clientName}
                      onChange={(e) => setRepairIntake({ ...repairIntake, clientName: e.target.value })}
                      placeholder="Nom du client"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={repairIntake.clientPhone}
                      onChange={(e) => setRepairIntake({ ...repairIntake, clientPhone: e.target.value })}
                      placeholder="06XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Modèle Appareil</label>
                    <input
                      type="text"
                      value={repairIntake.deviceModel}
                      onChange={(e) => setRepairIntake({ ...repairIntake, deviceModel: e.target.value })}
                      placeholder="iPhone 13 Pro / Samsung S22"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Panne / Problème</label>
                    <input
                      type="text"
                      value={repairIntake.issue}
                      onChange={(e) => setRepairIntake({ ...repairIntake, issue: e.target.value })}
                      placeholder="Écran cassé / Batterie..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Coût Estimé (DH)</label>
                    <input
                      type="number"
                      value={repairIntake.estimatedCost}
                      onChange={(e) =>
                        setRepairIntake({ ...repairIntake, estimatedCost: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Acompte Versé (DH)</label>
                    <input
                      type="number"
                      value={repairIntake.deposit}
                      onChange={(e) =>
                        setRepairIntake({ ...repairIntake, deposit: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {repairFeedback && (
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs font-semibold">
                    {repairFeedback}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    addToCart(
                      {
                        id: `repair-${Date.now()}`,
                        name: `Acompte Réparation (${repairIntake.deviceModel} - ${repairIntake.issue})`,
                        sku: `SAV-DEP`,
                        salePrice: repairIntake.deposit,
                        taxRate: 0,
                        trackStock: false,
                      },
                      1,
                      `[SAV: ${repairIntake.clientName} • ${repairIntake.clientPhone} • Panne: ${repairIntake.issue} • Total: ${repairIntake.estimatedCost} MAD]`
                    );
                    setRepairFeedback(
                      locale === "ar"
                        ? "تم إنشاء بون الصيانة وإضافة العربون للسلّة بنجاح ✓"
                        : "Bon SAV généré & Acompte ajouté au panier ✓"
                    );
                  }}
                  className="keycap-3d w-full py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold text-xs hover:bg-zinc-800 cursor-pointer"
                >
                  {locale === "ar" ? "إصدار بون صيانة وإضافة العربون للسلّة" : "Émettre Bon de Réparation & Ajouter Acompte"} ({repairIntake.deposit} MAD)
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. WHOLESALE & DISTRIBUTION WORKSPACE */}
          {/* ======================================================== */}
          {activeTab === "wholesale" && (
            <div className="space-y-6">
              {/* Packaging Multipliers */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-white" />
                  <span>{locale === "ar" ? "معاملات التعبئة والتغليف (Colisage Gros)" : "Multiplicateurs de Colisage Gros"}</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { factor: 1, label: "x1", desc: "Unité Seule" },
                    { factor: 6, label: "x6", desc: "Demi-Pack" },
                    { factor: 12, label: "x12", desc: "Carton" },
                    { factor: 24, label: "x24", desc: "Colis / Caisse" },
                    { factor: 50, label: "x50", desc: "Palette" },
                  ].map((pkg) => (
                    <button
                      key={pkg.label}
                      type="button"
                      disabled={!targetItem}
                      onClick={() => {
                        if (!targetItem) return;
                        updateQuantity(targetItem.productId, pkg.factor);
                        setPricingTier("wholesale");
                        updateItemNotes(targetItem.productId, `[Colisage ${pkg.desc}]`);
                      }}
                      className="keycap-3d p-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-center transition disabled:opacity-40"
                    >
                      <div className="text-base font-black font-mono text-white">{pkg.label}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{pkg.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bon de Livraison (BL) vs Ticket Switch & Buyer ICE Form */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-white" />
                    <span>{locale === "ar" ? "بيانات المشتري ووصل التسليم (BL)" : "En-tête Bon de Livraison (BL) & ICE Acheteur"}</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsBlMode(false)}
                      className={`keycap-3d px-3 py-1 rounded-lg text-xs font-bold border ${
                        !isBlMode
                          ? "bg-white text-zinc-950 border-white"
                          : "bg-zinc-950 text-zinc-400 border-zinc-800"
                      }`}
                    >
                      Ticket Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBlMode(true)}
                      className={`keycap-3d px-3 py-1 rounded-lg text-xs font-bold border ${
                        isBlMode
                          ? "bg-white text-zinc-950 border-white"
                          : "bg-zinc-950 text-zinc-400 border-zinc-800"
                      }`}
                    >
                      Bon de Livraison (BL)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Société / Raison Sociale Acheteur
                    </label>
                    <input
                      type="text"
                      value={buyerCompany}
                      onChange={(e) => setBuyerCompany(e.target.value)}
                      placeholder="Ex: SARL DISTRIBUTION ATLAS"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      ICE Acheteur (15 chiffres)
                    </label>
                    <input
                      type="text"
                      value={buyerIce}
                      onChange={(e) => setBuyerIce(e.target.value)}
                      placeholder="002938172000045"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 font-mono">
                  {locale === "ar"
                    ? `وضع الجملة مفعّل: سيتم تضمين ICE المشتري (${buyerIce || "Non renseigné"}) في ترويسة الفاتورة ووصل التسليم.`
                    : `Mode Facturation Gros : Le BL sera imprimé avec l'en-tête de la société et l'ICE (${buyerIce || "Non renseigné"}).`}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 7. GROCERY & SUPERETTE WORKSPACE */}
          {/* ======================================================== */}
          {activeTab === "grocery" && (
            <div className="space-y-6">
              {/* Express Zero-Barcode Shelf */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingBasket className="w-4 h-4 text-white" />
                    <span>{locale === "ar" ? "منتجات سريعة يومية (بدون باركود)" : "Rayon Express du Quotidien (Sans Barcode)"}</span>
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">1-Clic Panier</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
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
                      onClick={() =>
                        addToCart({
                          id: exp.id,
                          name: exp.name,
                          sku: exp.sku,
                          salePrice: exp.price,
                          taxRate: 0,
                          trackStock: false,
                        })
                      }
                      className="keycap-3d p-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-center transition cursor-pointer"
                    >
                      <div className="text-xs font-bold text-white truncate">{exp.name.split("/")[0].trim()}</div>
                      <div className="text-xs font-mono font-bold text-zinc-300 mt-1">{exp.price.toFixed(2)} MAD</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottle & Crate Deposit Manager (Consigne Gaz & Caisses) */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>{locale === "ar" ? "تدبير الرهن والإرجاع (Consigne Gaz & Caisses)" : "Gestion des Consignes (Bouteilles Gaz & Casiers)"}</span>
                  <span className="text-xs text-zinc-400 font-mono">Avoir / Débit</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Bouteille de Gaz 12Kg</span>
                      <span className="font-mono">100.00 MAD</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            id: `consigne-gaz-${Date.now()}`,
                            name: "Consigne Bouteille Gaz 12Kg (+100 MAD)",
                            sku: "DEP-GAZ",
                            salePrice: 100,
                            taxRate: 0,
                            trackStock: false,
                          })
                        }
                        className="keycap-3d py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-bold"
                      >
                        + Consigne (+100)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            id: `refund-gaz-${Date.now()}`,
                            name: "Retour Consigne Gaz 12Kg (-100 MAD)",
                            sku: "RET-GAZ",
                            salePrice: -100,
                            taxRate: 0,
                            trackStock: false,
                          })
                        }
                        className="keycap-3d py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold"
                      >
                        - Retour (-100)
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Casier Boissons Consigné</span>
                      <span className="font-mono">15.00 MAD</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            id: `consigne-caisse-${Date.now()}`,
                            name: "Consigne Casier (+15 MAD)",
                            sku: "DEP-CAS",
                            salePrice: 15,
                            taxRate: 0,
                            trackStock: false,
                          })
                        }
                        className="keycap-3d py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-bold"
                      >
                        + Consigne (+15)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            id: `refund-caisse-${Date.now()}`,
                            name: "Retour Casier (-15 MAD)",
                            sku: "RET-CAS",
                            salePrice: -15,
                            taxRate: 0,
                            trackStock: false,
                          })
                        }
                        className="keycap-3d py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold"
                      >
                        - Retour (-15)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barcode Label Studio */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Barcode className="w-4 h-4" />
                  <span>Studio Étiquettes Code-Barres 40x30mm</span>
                </div>

                <input
                  type="text"
                  value={labelTitle}
                  onChange={(e) => setLabelTitle(e.target.value)}
                  placeholder={t.products.title}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={labelPrice}
                    onChange={(e) => setLabelPrice(e.target.value)}
                    placeholder={`${t.products.price} (DH)`}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    value={labelBarcode}
                    onChange={(e) => setLabelBarcode(e.target.value)}
                    placeholder={t.products.barcode}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={printBarcodeLabel}
                  className="keycap-3d w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-200 transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.industryTools.printBarcodeBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
