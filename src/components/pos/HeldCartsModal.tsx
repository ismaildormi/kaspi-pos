"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { X, Play, Trash2, Clock } from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";

interface HeldCartsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeldCartsModal: React.FC<HeldCartsModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("Pos");
  const tCommon = useTranslations("Common");
  const { heldCarts, resumeHeldCart, deleteHeldCart } = usePosStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-base">{t("heldOrders")}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto max-h-96 space-y-2.5">
          {heldCarts.length === 0 ? (
            <p className="py-8 text-center text-slate-500 text-sm">
              Aucune commande en attente.
            </p>
          ) : (
            heldCarts.map((h) => {
              const total = h.items.reduce((sum, i) => sum + i.lineTotal, 0);
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-700 transition"
                >
                  <div>
                    <h4 className="font-semibold text-white text-sm">{h.label}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {h.items.length} {t("itemsCount")} • {h.customer ? h.customer.name : "Client Comptoir"}
                    </p>
                    <p className="text-xs font-mono font-bold text-emerald-400 mt-1">
                      {total.toFixed(2)} {tCommon("currency")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        resumeHeldCart(h.id);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t("resumeCart")}</span>
                    </button>

                    <button
                      onClick={() => deleteHeldCart(h.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Supprimer"
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
