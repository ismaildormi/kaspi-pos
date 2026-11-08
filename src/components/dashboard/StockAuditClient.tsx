"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Barcode,
  Plus,
  Minus,
  CheckCircle2,
  X,
  RefreshCw,
} from "lucide-react";

export interface StockAuditProductItem {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  currentQty: number;
}

export function StockAuditClient({
  products,
}: {
  products: StockAuditProductItem[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ""
  );
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [mode, setMode] = useState<"set_counted" | "delta">("set_counted");
  const [movementType, setMovementType] = useState<
    "adjustment" | "purchase" | "waste" | "return"
  >("adjustment");
  const [inputValue, setInputValue] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const handleBarcodeSearch = (val: string) => {
    setBarcodeQuery(val);
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return;
    const match = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === trimmed) ||
        (p.sku && p.sku.toLowerCase() === trimmed) ||
        p.name.toLowerCase().includes(trimmed)
    );
    if (match) {
      setSelectedProductId(match.id);
      if (mode === "set_counted") {
        setInputValue(String(match.currentQty));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const numVal = Number(inputValue);
      if (Number.isNaN(numVal)) {
        throw new Error("Veuillez saisir une quantité numérique valide.");
      }

      const payload =
        mode === "set_counted"
          ? {
              productId: selectedProduct.id,
              mode: "set_counted",
              countedQuantity: numVal,
              movementType: "adjustment",
              reason: reason.trim() || "Inventaire physique (Comptage réel)",
            }
          : {
              productId: selectedProduct.id,
              mode: "delta",
              quantityDelta:
                movementType === "waste" ? -Math.abs(numVal) : numVal,
              movementType,
              reason: reason.trim() || `Mouvement manuel (${movementType})`,
            };

      const res = await fetch("/api/v1/inventory/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(
          json.error?.message || "Erreur lors de la mise à jour du stock"
        );
      }

      setFeedback(
        `Stock mis à jour: ${json.data.productName} (${json.data.previousQuantity} → ${json.data.newQuantity} u.)`
      );
      setInputValue("");
      setReason("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (selectedProduct && mode === "set_counted" && !inputValue) {
            setInputValue(String(selectedProduct.currentQty));
          }
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition cursor-pointer shadow-sm"
      >
        <ClipboardCheck className="h-3.5 w-3.5" />
        <span>Inventaire Physique &amp; Ajustement • جرد المخزون</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Inventaire Physique &amp; Ajustement de Stock
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Comptage réel par douchette code-barres, réapprovisionnement ou démarque
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Barcode / SKU quick scanner */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scanner Code-Barres / Rechercher Produit</span>
                </label>
                <input
                  type="text"
                  value={barcodeQuery}
                  onChange={(e) => handleBarcodeSearch(e.target.value)}
                  placeholder="Scannez le code EAN-13 ou tapez le nom..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Article Sélectionné
                </label>
                <select
                  value={selectedProduct?.id || ""}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const found = products.find((p) => p.id === e.target.value);
                    if (found && mode === "set_counted") {
                      setInputValue(String(found.currentQty));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-bold focus:outline-none focus:border-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — (Stock système actuel: {p.currentQty} u.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode("set_counted");
                    if (selectedProduct) {
                      setInputValue(String(selectedProduct.currentQty));
                    }
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition ${
                    mode === "set_counted"
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  = Comptage Physique Réel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("delta");
                    setInputValue("10");
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition ${
                    mode === "delta"
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  ± Entrée / Sortie Stock
                </button>
              </div>

              {mode === "delta" && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "purchase", label: "+ Réappro (Entrée)" },
                    { id: "return", label: "+ Retour Client" },
                    { id: "waste", label: "- Perte / Casse" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMovementType(t.id as any)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition ${
                        movementType === t.id
                          ? "bg-amber-500/20 border-amber-400 text-amber-300"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {mode === "set_counted"
                      ? "Quantité Physique Comptée *"
                      : "Quantité à Ajouter / Retirer *"}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ex: 25"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm font-mono font-bold focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Motif / Note d&apos;Audit
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Inventaire fin de mois"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !selectedProduct}
                className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                <span>
                  {saving
                    ? "Enregistrement dans Neon PostgreSQL..."
                    : "Valider l'Ajustement de Stock"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
