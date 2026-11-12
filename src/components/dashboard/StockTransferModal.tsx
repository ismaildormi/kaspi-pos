"use client";

import React, { useState } from "react";
import { X, ArrowRightLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDictionary } from "@/i18n/schema";

export interface TransferStoreItem {
  id: string;
  name: string;
  code: string;
}

export interface TransferProductItem {
  id: string;
  name: string;
  sku: string;
  stockQuantity?: number;
}

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: TransferStoreItem[];
  products: TransferProductItem[];
  onTransferCompleted?: () => void;
}

export function StockTransferModal({
  isOpen,
  onClose,
  stores,
  products,
  onTransferCompleted,
}: StockTransferModalProps) {
  const { t, locale } = useAppDictionary();

  const [sourceStoreId, setSourceStoreId] = useState(stores[0]?.id || "");
  const [destStoreId, setDestStoreId] = useState(stores[1]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceStoreId || !destStoreId) {
      toast.error(
        locale === "ar"
          ? "يرجى تحديد فرع المصدر وفرع الوجهة"
          : locale === "en"
          ? "Please select source and destination stores"
          : "Veuillez sélectionner le magasin source et destination"
      );
      return;
    }

    if (sourceStoreId === destStoreId) {
      toast.error(
        locale === "ar"
          ? "لا يمكن أن يكون فرع المصدر والوجهة متطابقين"
          : locale === "en"
          ? "Source and destination store cannot be the same"
          : "Le magasin source et destination ne peuvent pas être identiques"
      );
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error(
        locale === "ar"
          ? "يرجى إدخال كمية صالحة أكبر من الصفر"
          : locale === "en"
          ? "Please enter a valid quantity greater than zero"
          : "Veuillez saisir une quantité valide"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/inventory/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceStoreId,
          destStoreId,
          notes: notes.trim() || undefined,
          items: [{ productId: selectedProductId, quantity: qtyNum }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Transfer failed");
      }

      toast.success(
        locale === "ar"
          ? "تم تحويل المخزون بين المستودعات بنجاح"
          : locale === "en"
          ? "Stock transferred successfully between stores"
          : "Transfert de stock inter-dépôts validé avec succès !"
      );

      if (onTransferCompleted) {
        onTransferCompleted();
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erreur de transfert");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xl animate-in fade-in"
    >
      <div className="kaspi-frosted-glass kaspi-polar-aurora-orbit relative w-full max-w-lg overflow-hidden rounded-2xl text-white shadow-2xl p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-800 text-white border border-zinc-700">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {locale === "ar"
                  ? "تحويل المخزون بين الفروع والمستودعات"
                  : locale === "en"
                  ? "Inter-Store Stock Transfer"
                  : "Transfert de Stock Inter-Dépôts"}
              </h3>
              <p className="text-xs text-zinc-400">
                {locale === "ar"
                  ? "نقل بضائع فوري مع تعديل المخزون التلقائي في النظام"
                  : locale === "en"
                  ? "Instant stock transfer with automatic inventory rebalancing"
                  : "Mouvement de stock immédiat avec traçabilité complète"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
          {/* Source & Destination Stores */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                {locale === "ar" ? "المستودع / الفرع المصدر" : locale === "en" ? "Source Warehouse / Store" : "Dépôt / Magasin Source"}
              </label>
              <select
                value={sourceStoreId}
                onChange={(e) => setSourceStoreId(e.target.value)}
                className="w-full kaspi-translucent-input rounded-xl px-3 py-2 text-xs focus:outline-none"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-950 text-white">
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                {locale === "ar" ? "فرع / مستودع الوجهة" : locale === "en" ? "Destination Store / Warehouse" : "Magasin / Dépôt Destination"}
              </label>
              <select
                value={destStoreId}
                onChange={(e) => setDestStoreId(e.target.value)}
                className="w-full kaspi-translucent-input rounded-xl px-3 py-2 text-xs focus:outline-none"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-950 text-white">
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              {locale === "ar" ? "المنتج المراد تحويله" : locale === "en" ? "Product to Transfer" : "Article à Transférer"}
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full kaspi-translucent-input rounded-xl px-3 py-2 text-xs focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-950 text-white">
                  {p.name} — SKU: {p.sku}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              {locale === "ar" ? "الكمية المحولة" : locale === "en" ? "Transfer Quantity" : "Quantité à Transférer"}
            </label>
            <input
              type="number"
              step="any"
              min="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full kaspi-translucent-input rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
              placeholder="1"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              {locale === "ar" ? "ملاحظات إضافية (اختياري)" : locale === "en" ? "Additional Notes (Optional)" : "Notes ou Référence (Optionnel)"}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full kaspi-translucent-input rounded-xl px-3 py-2 text-xs focus:outline-none"
              placeholder={locale === "ar" ? "مثلاً: شحنة تموين طارئة" : locale === "en" ? "e.g., Weekly replenishment" : "ex: Réapprovisionnement hebdomadaire"}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition font-semibold"
            >
              {locale === "ar" ? "إلغاء" : locale === "en" ? "Cancel" : "Annuler"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{locale === "ar" ? "جاري التحويل..." : locale === "en" ? "Transferring..." : "Transfert en cours..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{locale === "ar" ? "تأكيد التحويل" : locale === "en" ? "Confirm Transfer" : "Valider le Transfert"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
