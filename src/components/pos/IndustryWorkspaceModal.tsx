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
  Check,
  Send,
  RefreshCw,
  Printer,
  Sparkles,
} from "lucide-react";
import { StoreBusinessType, usePosStore } from "@/client/store/usePosStore";

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

const MODIFIER_PRESETS = [
  "Sans Oignon • بدون بصل",
  "Extra Fromage • جبن إضافي",
  "Piquant (Harissa) • حار",
  "Sans Sucre • بدون سكر",
  "Bien Cuit • مطهو جيداً",
  "À Emporter • سفري",
];

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "38", "39", "40", "41", "42", "43", "44"];
const APPAREL_COLORS = [
  { name: "Noir • أسود", hex: "#18181b" },
  { name: "Blanc • أبيض", hex: "#f4f4f5" },
  { name: "Bleu Marine • كحلي", hex: "#1e3a8a" },
  { name: "Beige • بيج", hex: "#d6d3d1" },
  { name: "Émeraude • أخضر", hex: "#047857" },
  { name: "Bordeaux • أحمر", hex: "#991b1b" },
];

export function IndustryWorkspaceModal({
  isOpen,
  onClose,
  onOpenOnboardingSwitch,
}: IndustryWorkspaceModalProps) {
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
  const [chosenColor, setChosenColor] = useState("Noir • أسود");

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
    if (isOpen && activeTab === "restaurant") {
      fetchKds();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const targetItem =
    items.find((i) => i.productId === selectedCartItemId) || items[items.length - 1];

  const handleDispatchKitchen = async () => {
    if (items.length === 0) {
      setKdsFeedback("Ajoutez d'abord des articles au panier pour les envoyer en cuisine.");
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
          tableName: selectedTableName || "Comptoir / À Emporter",
          items: items.map((i) => ({
            productName: i.name,
            quantity: i.quantity,
            notes: i.notes || "",
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setKdsFeedback("Ticket envoyé à l'écran Cuisine (KDS) avec succès !");
        await fetchKds();
      }
    } catch {
      setKdsFeedback("Erreur lors de l'envoi en cuisine.");
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
    updateItemNotes(targetItem.productId, `Taille: ${chosenSize} | Couleur: ${chosenColor}`);
    onClose();
  };

  const applyElectronicsSerial = () => {
    if (!targetItem) return;
    const tag = `S/N-IMEI: ${serialNumber || "SCAN-OK"} | Garantie: ${warrantyMonths} Mois`;
    updateItemNotes(targetItem.productId, tag);
    setSerialNumber("");
    onClose();
  };

  const applyGroceryWeight = (grams: number) => {
    if (!targetItem) return;
    const kg = Number((grams / 1000).toFixed(3));
    updateQuantity(targetItem.productId, kg > 0 ? kg : 1);
    updateItemNotes(targetItem.productId, `Poids pesé: ${grams}g (${kg} Kg)`);
    onClose();
  };

  const printBarcodeLabel = () => {
    const win = window.open("", "_blank", "width=420,height=320");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Étiquette Code-Barres 40x30mm</title>
          <style>
            @page { size: 40mm 30mm; margin: 0; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 3mm; text-align: center; }
            .shop { font-size: 8pt; font-weight: bold; text-transform: uppercase; }
            .name { font-size: 9pt; font-weight: bold; margin: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .price { font-size: 13pt; font-weight: 900; margin: 2px 0; }
            .bars { font-family: monospace; letter-spacing: 2px; font-size: 10pt; margin-top: 2px; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 400);">
          <div class="shop">KASPI POS</div>
          <div class="name">${labelTitle}</div>
          <div class="price">${Number(labelPrice || 0).toFixed(2)} DH</div>
          <svg width="135" height="32" viewBox="0 0 135 32">
            ${Array.from({ length: 28 })
              .map((_, idx) => {
                const w = (idx + labelBarcode.charCodeAt(idx % labelBarcode.length)) % 3 === 0 ? 3 : 1.5;
                return `<rect x="${idx * 4.6 + 4}" y="2" width="${w}" height="28" fill="#000" />`;
              })
              .join("")}
          </svg>
          <div class="bars">${labelBarcode}</div>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-[#0e1017] border border-white/10 shadow-2xl overflow-hidden my-auto">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-white/[0.03] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white">
              Outils Métier Spécialisés • أدوات القطاع الذكية
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOnboardingSwitch();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition"
            >
              Changer le Type de Commerce
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-white/10 bg-black/40">
          {[
            { id: "grocery", label: "Épicerie & Balance", icon: ShoppingBasket },
            { id: "restaurant", label: "Restaurant & KDS", icon: UtensilsCrossed },
            { id: "fashion", label: "Mode (Tailles/Couleurs)", icon: Shirt },
            { id: "electronics", label: "Électronique (IMEI)", icon: Smartphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StoreBusinessType)}
                className={`flex items-center justify-center gap-2 py-3.5 px-3 text-xs font-bold border-b-2 transition ${
                  active
                    ? "border-amber-400 text-amber-400 bg-amber-500/10"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Active Cart Item Selector */}
          {items.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-zinc-400">
                Article du panier sélectionné • المنتج المحدد في السلة:
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
          {activeTab === "restaurant" && (
            <div className="space-y-6">
              {/* Dining Table Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                    <span>Plan des Tables (Salle & Terrasse) • طاولات المطعم</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedTable(null, null)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      !selectedTableId
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-white/5 border-white/10 text-zinc-400"
                    }`}
                  >
                    Comptoir / À Emporter (سفري)
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {tables.map((t) => {
                    const isSelected = selectedTableId === t.id;
                    const isOccupied = t.status === "occupied";
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTable(t.id, t.name)}
                        className={`p-3 rounded-2xl border text-center transition ${
                          isSelected
                            ? "bg-amber-500/25 border-amber-400 text-white ring-2 ring-amber-400/50"
                            : isOccupied
                            ? "bg-red-500/10 border-red-500/30 text-red-300"
                            : "bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        <div className="text-xs font-black">{t.name}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{t.capacity} places</div>
                        <div className="text-[10px] font-bold mt-1 uppercase">
                          {isOccupied ? "Occupée" : "Libre"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dish Modifiers */}
              <div>
                <h4 className="text-sm font-bold text-white mb-2.5">
                  Options & Modificateurs Rapides • إضافات وملاحظات المطبخ
                </h4>
                <div className="flex flex-wrap gap-2">
                  {MODIFIER_PRESETS.map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => applyModifierToItem(mod)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-xs text-zinc-200 transition"
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
                      Écran Cuisine Temps Réel (KDS) • شاشة المطبخ الفورية
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchKds}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300"
                      title="Actualiser KDS"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingKds ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      type="button"
                      disabled={sendingToKitchen || items.length === 0}
                      onClick={handleDispatchKitchen}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer le Panier en Cuisine</span>
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
                    Aucun ticket en attente en cuisine.
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
                              En Préparation
                            </button>
                          )}
                          {tk.status !== "ready" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketStatus(tk.id, "ready")}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold"
                            >
                              Prêt !
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateTicketStatus(tk.id, "served", selectedTableId || undefined)}
                            className="flex-1 py-1.5 rounded-lg bg-zinc-700/50 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold"
                          >
                            Servi ✓
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
          {activeTab === "fashion" && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white mb-2.5">
                  Sélecteur de Taille / Pointure • اختيار المقاس
                </h4>
                <div className="flex flex-wrap gap-2">
                  {APPAREL_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setChosenSize(sz)}
                      className={`w-12 h-11 rounded-xl font-black text-xs border transition ${
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
                  Couleur & Nuance • اختيار اللون
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {APPAREL_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setChosenColor(c.name)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition ${
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
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black text-sm shadow-lg disabled:opacity-40"
              >
                Appliquer Variante ({chosenSize} — {chosenColor}) à l&apos;article du panier
              </button>
            </div>
          )}

          {/* 3. ELECTRONICS & GENERAL RETAIL WORKSPACE */}
          {activeTab === "electronics" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Numéro de Série / IMEI • الرقم التسلسلي أو IMEI
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Scannez ou saisissez l'IMEI (ex: 356938035643809)"
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Durée de Garantie Officielle • مدة الضمان المطبوعة على الفاتورة
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["6", "12", "24"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setWarrantyMonths(m)}
                        className={`py-3 rounded-xl font-black text-xs border transition ${
                          warrantyMonths === m
                            ? "bg-blue-500/25 border-blue-400 text-blue-300"
                            : "bg-white/5 border-white/10 text-zinc-400"
                        }`}
                      >
                        {m} Mois
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-200">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <span>
                  Le N° IMEI / Série et la mention de garantie ({warrantyMonths} mois) seront imprimés directement sous l&apos;article sur le reçu thermique du client.
                </span>
              </div>

              <button
                type="button"
                disabled={!targetItem}
                onClick={applyElectronicsSerial}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-sm shadow-lg disabled:opacity-40"
              >
                Attacher N° Série / IMEI & Garantie ({warrantyMonths} Mois)
              </button>
            </div>
          )}

          {/* 4. GROCERY / SUPERMARKET WORKSPACE */}
          {activeTab === "grocery" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Digital Weight Scale Calculator */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <Scale className="w-4 h-4" />
                  <span>Balance Poids Numérique (Kg / Grammes)</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[250, 500, 750, 1000, 1500, 2000].map((g) => (
                    <button
                      key={g}
                      type="button"
                      disabled={!targetItem}
                      onClick={() => applyGroceryWeight(g)}
                      className="py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition disabled:opacity-40"
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
                    placeholder="Poids en grammes (ex: 350)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                  />
                  <button
                    type="button"
                    disabled={!targetItem}
                    onClick={() => applyGroceryWeight(Number(weightGrams || 1000))}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-xs disabled:opacity-40"
                  >
                    Appliquer Poids
                  </button>
                </div>
              </div>

              {/* Barcode Label Studio */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                  <Barcode className="w-4 h-4" />
                  <span>Studio d&apos;Étiquettes Code-Barres (40x30mm)</span>
                </div>

                <input
                  type="text"
                  value={labelTitle}
                  onChange={(e) => setLabelTitle(e.target.value)}
                  placeholder="Nom du produit"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={labelPrice}
                    onChange={(e) => setLabelPrice(e.target.value)}
                    placeholder="Prix DH"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                  />
                  <input
                    type="text"
                    value={labelBarcode}
                    onChange={(e) => setLabelBarcode(e.target.value)}
                    placeholder="Code EAN-13"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={printBarcodeLabel}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer Étiquette Code-Barres • طباعة اللاصق</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
