"use client";

import React, { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  Shirt,
  Smartphone,
  ShoppingBasket,
  ChefHat,
  Scale,
  Barcode,
  ShieldCheck,
  X,
  Send,
  RefreshCw,
  Printer,
  Sparkles,
} from "lucide-react";
import { StoreBusinessType, usePosStore } from "@/client/store/usePosStore";
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
  status: string;
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

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "38", "39", "40", "41", "42", "43", "44"];

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
  } = usePosStore();

  const [activeTab, setActiveTab] = useState<StoreBusinessType>(storeType);
  const [selectedCartItemId, setSelectedCartItemId] = useState<string>("");

  // Restaurant KDS & Tables state
  const [tables, setTables] = useState<DiningTableItem[]>([]);
  const [tickets, setTickets] = useState<KitchenTicketRecord[]>([]);
  const [loadingKds, setLoadingKds] = useState(false);
  const [sendingToKitchen, setSendingToKitchen] = useState(false);
  const [kdsFeedback, setKdsFeedback] = useState<string | null>(null);

  // Fashion state
  const [chosenSize, setChosenSize] = useState("L");
  const [chosenColor, setChosenColor] = useState(t.industryTools.colors[0]?.name || "Noir");

  // Electronics state
  const [serialNumber, setSerialNumber] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("12");

  // Grocery Scale & Barcode state
  const [weightGrams, setWeightGrams] = useState("500");
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

  const fetchKds = async () => {
    setLoadingKds(true);
    try {
      const res = await fetch("/api/v1/kds");
      const json = await res.json();
      if (json.ok && json.data) {
        setTables(json.data.tables || []);
        setTickets(json.data.tickets || []);
      }
    } catch {
      // ignore offline
    } finally {
      setLoadingKds(false);
    }
  };

  useEffect(() => {
    if (isOpen && storeType === "restaurant") {
      fetchKds();
    }
  }, [isOpen, storeType]);

  if (!isOpen) return null;

  const targetItem =
    items.find((i) => i.productId === selectedCartItemId) || items[items.length - 1];

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
          tableName: selectedTableName || "Comptoir",
          items: items.map((i) => ({
            productName: i.name,
            quantity: i.quantity,
            notes: i.notes || "",
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setKdsFeedback(t.common.success);
        await fetchKds();
      }
    } catch {
      setKdsFeedback(t.common.error);
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
      await fetchKds();
    } catch {
      // ignore
    }
  };

  const applyModifierToItem = (mod: string) => {
    if (!targetItem) return;
    const current = targetItem.notes ? `${targetItem.notes}, ${mod}` : mod;
    updateItemNotes(targetItem.productId, current);
  };

  const applyFashionVariant = () => {
    if (!targetItem) return;
    const variantTag = `[${chosenSize} / ${chosenColor}]`;
    const current = targetItem.notes ? `${targetItem.notes} ${variantTag}` : variantTag;
    updateItemNotes(targetItem.productId, current);
  };

  const applyElectronicsSerial = () => {
    if (!targetItem) return;
    const serialTag = `[IMEI/SN: ${serialNumber || "N/A"}] [Garantie: ${warrantyMonths}M]`;
    const current = targetItem.notes ? `${targetItem.notes} ${serialTag}` : serialTag;
    updateItemNotes(targetItem.productId, current);
  };

  const applyGroceryWeight = (grams: number) => {
    if (!targetItem) return;
    const kg = grams / 1000;
    updateQuantity(targetItem.productId, Number(kg.toFixed(3)));
    const note = `[${grams}g / ${kg}Kg]`;
    updateItemNotes(targetItem.productId, note);
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

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-3xl bg-[#0e1017] border border-white/10 shadow-2xl overflow-hidden my-auto">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-white/[0.03] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white">
              {t.industryTools.modalTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOnboardingSwitch();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-bold hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
            >
              {t.onboarding.businessSectorBtn}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sector Profile Header Banner */}
        <div className="px-6 py-3 border-b border-white/10 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {storeType === "restaurant"
                ? t.topbar.restaurant
                : storeType === "fashion"
                ? t.topbar.fashion
                : storeType === "electronics" || storeType === "tech"
                ? t.topbar.tech
                : storeType === "butchery"
                ? (locale === "ar" ? "مجزرة ولحوم" : locale === "en" ? "Butchery & Meats" : "Boucherie & Viandes")
                : storeType === "bakery"
                ? (locale === "ar" ? "مخبزة وحلويات" : locale === "en" ? "Bakery & Pastry" : "Boulangerie & Pâtisserie")
                : storeType === "wholesale"
                ? (locale === "ar" ? "تجارة الجملة والدروكري" : locale === "en" ? "Wholesale & Distribution" : "Grossiste & Droguerie")
                : t.topbar.grocery}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {locale === "ar" ? "الأدوات مفعلة ومخصصة لنشاطك" : locale === "en" ? "Tools customized for your business" : "Outils métiers adaptés à votre secteur"}
          </span>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Active Cart Item Selector */}
          {items.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-zinc-400">
                {t.industryTools.selectedCartItem}
              </span>
              <select
                value={targetItem?.productId || ""}
                onChange={(e) => setSelectedCartItemId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-bold"
              >
                {items.map((item) => (
                  <option key={item.productId} value={item.productId}>
                    {item.name} (x{item.quantity}) {item.notes ? `— [${item.notes}]` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1. RESTAURANT / CAFE WORKSPACE */}
          {storeType === "restaurant" && (
            <div className="space-y-6">
              {/* Dining Table Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                    <span>{t.industryTools.tablesTitle}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTable(null, null);
                    }}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    {t.common.cancel}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {(tables.length > 0
                    ? tables
                    : [
                        { id: "t1", name: "Table 1", capacity: 4, status: "free" },
                        { id: "t2", name: "Table 2", capacity: 2, status: "occupied" },
                        { id: "t3", name: "Table 3", capacity: 6, status: "free" },
                        { id: "t4", name: "Table 4", capacity: 4, status: "free" },
                        { id: "t5", name: "Terrasse 1", capacity: 4, status: "occupied" },
                        { id: "t6", name: "Terrasse 2", capacity: 2, status: "free" },
                      ]
                  ).map((tbl) => {
                    const isSelected = selectedTableId === tbl.id;
                    const isOccupied = tbl.status === "occupied";
                    return (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => setSelectedTable(tbl.id, tbl.name)}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                          isSelected
                            ? "bg-amber-500 text-black border-amber-400 font-bold shadow-lg shadow-amber-500/20"
                            : isOccupied
                            ? "bg-red-500/15 border-red-500/30 text-red-300 hover:bg-red-500/25"
                            : "bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.08]"
                        }`}
                      >
                        <div className="text-xs font-black">{tbl.name}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{tbl.capacity} places</div>
                        <div className="text-[10px] font-bold mt-1 uppercase">
                          {isOccupied ? t.industryTools.tableOccupied : t.industryTools.tableFree}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dish Modifiers */}
              <div>
                <h4 className="text-sm font-bold text-white mb-2.5">
                  {t.industryTools.modifiersTitle}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {t.industryTools.modifiers.map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => applyModifierToItem(mod)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-xs text-zinc-200 transition cursor-pointer"
                    >
                      + {mod}
                    </button>
                  ))}
                </div>
              </div>

              {/* KDS Kitchen Board */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-black text-white">
                      {t.industryTools.kdsTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchKds}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                      title={t.common.loading}
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingKds ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      type="button"
                      disabled={sendingToKitchen || items.length === 0}
                      onClick={handleDispatchKitchen}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t.common.confirm} (KDS)</span>
                    </button>
                  </div>
                </div>

                {kdsFeedback && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    {kdsFeedback}
                  </div>
                )}

                {tickets.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-500">
                    {t.industryTools.noItemInCart}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tickets.map((tk) => (
                      <div
                        key={tk.id}
                        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold mb-2">
                            <span className="text-amber-400">
                              #{tk.id.slice(-4).toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 uppercase text-[10px]">
                              {tk.status}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {tk.items.map((it) => (
                              <div key={it.id} className="text-xs text-zinc-200">
                                <span className="font-bold text-white">{Number(it.quantity)}x</span>{" "}
                                {it.productName}
                                {it.notes && (
                                  <div className="text-[10px] text-amber-300/90 pl-3">
                                    ↳ {it.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                          {tk.status === "new" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(tk.id, "preparing")}
                              className="flex-1 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-bold"
                            >
                              Preparing
                            </button>
                          )}
                          {tk.status !== "ready" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(tk.id, "ready")}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold"
                            >
                              Ready
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateTicketStatus(tk.id, "served", selectedTableId || undefined)}
                            className="flex-1 py-1.5 rounded-lg bg-zinc-700/50 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold"
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

          {/* 2. CLOTHING & FASHION WORKSPACE */}
          {storeType === "fashion" && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white mb-2.5">
                  {t.industryTools.sizeSelectorTitle}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {APPAREL_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setChosenSize(sz)}
                      className={`w-12 h-11 rounded-xl font-black text-xs border transition cursor-pointer ${
                        chosenSize === sz
                          ? "bg-fuchsia-500 text-white border-fuchsia-400 shadow-lg shadow-fuchsia-500/30"
                          : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-2.5">
                  {t.industryTools.colorTitle}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {t.industryTools.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setChosenColor(c.name)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        chosenColor === c.name
                          ? "bg-fuchsia-500/15 border-fuchsia-400 text-white"
                          : "bg-white/5 border-white/10 text-zinc-300"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={!targetItem}
                onClick={applyFashionVariant}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black text-sm shadow-lg disabled:opacity-40 cursor-pointer"
              >
                {t.common.confirm} ({chosenSize} — {chosenColor})
              </button>
            </div>
          )}

          {/* 3. ELECTRONICS & GENERAL RETAIL WORKSPACE */}
          {(storeType === "electronics" || storeType === "tech") && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    {t.industryTools.imeiTitle}
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="IMEI / SN (ex: 356938035643809)"
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    {t.industryTools.warrantyTitle}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["6", "12", "24"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setWarrantyMonths(m)}
                        className={`py-3 rounded-xl font-black text-xs border transition cursor-pointer ${
                          warrantyMonths === m
                            ? "bg-blue-500/25 border-blue-400 text-blue-300"
                            : "bg-white/5 border-white/10 text-zinc-400"
                        }`}
                      >
                        {m} M
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-200">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <span>
                  {t.industryTools.warrantyTitle}: {warrantyMonths} M
                </span>
              </div>

              <button
                type="button"
                disabled={!targetItem}
                onClick={applyElectronicsSerial}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-sm shadow-lg disabled:opacity-40 cursor-pointer"
              >
                {t.common.confirm} ({serialNumber || "SN"} — {warrantyMonths} M)
              </button>
            </div>
          )}

          {/* 4. GROCERY / BUTCHERY / BAKERY / WHOLESALE WORKSPACE */}
          {(storeType === "grocery" || storeType === "butchery" || storeType === "bakery" || storeType === "wholesale") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Digital Weight Scale Calculator */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <Scale className="w-4 h-4" />
                  <span>Balance (Kg / g)</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[250, 500, 750, 1000, 1500, 2000].map((g) => (
                    <button
                      key={g}
                      type="button"
                      disabled={!targetItem}
                      onClick={() => applyGroceryWeight(g)}
                      className="py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition disabled:opacity-40 cursor-pointer"
                    >
                      {g >= 1000 ? `${g / 1000} Kg` : `${g} g`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    placeholder="350 g"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                  />
                  <button
                    type="button"
                    disabled={!targetItem}
                    onClick={() => applyGroceryWeight(Number(weightGrams || 1000))}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-xs disabled:opacity-40 cursor-pointer"
                  >
                    {t.common.confirm}
                  </button>
                </div>
              </div>

              {/* Barcode Label Studio */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                  <Barcode className="w-4 h-4" />
                  <span>40x30mm Label Studio</span>
                </div>

                <input
                  type="text"
                  value={labelTitle}
                  onChange={(e) => setLabelTitle(e.target.value)}
                  placeholder={t.products.title}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={labelPrice}
                    onChange={(e) => setLabelPrice(e.target.value)}
                    placeholder={`${t.products.price} (DH)`}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                  />
                  <input
                    type="text"
                    value={labelBarcode}
                    onChange={(e) => setLabelBarcode(e.target.value)}
                    placeholder={t.products.barcode}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={printBarcodeLabel}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition cursor-pointer"
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
