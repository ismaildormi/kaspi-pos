"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { X, Play, Trash2, Clock } from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";
import { useAppDictionary } from "@/i18n/schema";

interface HeldCartsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeldCartsModal: React.FC<HeldCartsModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("Pos");
  const tCommon = useTranslations("Common");
  const { locale } = useAppDictionary();
  const { heldCarts, resumeHeldCart, deleteHeldCart } = usePosStore();

  if (!isOpen) return null;

  return (
    <div dir="ltr" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="kaspi-frosted-glass relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <h3 className="font-bold text-white text-base">{t("heldOrders")}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto max-h-96 space-y-2.5">
          {heldCarts.length === 0 ? (
            <p className="py-8 text-center text-zinc-500 text-sm font-mono">
              {locale === "ar"
                ? "لا توجد طلبات معلقة حالياً."
                : locale === "en"
                ? "No held orders currently."
                : "Aucune commande en attente."}
            </p>
          ) : (
            heldCarts.map((h) => {
              const total = h.items.reduce((sum, i) => sum + i.lineTotal, 0);
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition"
                >
                  <div>
                    <h4 className="font-semibold text-white text-sm">{h.label}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {h.items.length} {t("itemsCount")} • {h.customer ? h.customer.name : (locale === "ar" ? "زبون عادي" : locale === "en" ? "Walk-in" : "Client Comptoir")}
                    </p>
                    <p className="text-xs font-mono font-bold text-white mt-1">
                      {total.toFixed(2)} {tCommon("currency")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        resumeHeldCart(h.id);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{t("resumeCart")}</span>
                    </button>

                    <button
                      onClick={() => deleteHeldCart(h.id)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                      title={locale === "ar" ? "حذف" : locale === "en" ? "Delete" : "Supprimer"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
