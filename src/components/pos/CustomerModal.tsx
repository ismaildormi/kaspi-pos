"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  X,
  Search,
  UserCheck,
  UserPlus,
  Coins,
  CreditCard,
  User,
  Check,
} from "lucide-react";
import { usePosStore, type PosCustomer } from "@/client/store/usePosStore";
import { offlineDb } from "@/client/db";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const t = useTranslations("Pos");
  const tCommon = useTranslations("Common");

  const { customer: selectedCustomer, setCustomer } = usePosStore();

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newIce, setNewIce] = useState("");
  const [newCreditLimit, setNewCreditLimit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Search customers
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const query = search.trim();
        const res = await fetch(`/api/v1/customers${query ? `?search=${encodeURIComponent(query)}` : ""}`);
        if (res.ok) {
          const data = await res.json();
          const list: PosCustomer[] = data.data?.customers || [];
          setCustomers(list);

          // Update Dexie cache
          if (offlineDb && list.length > 0) {
            offlineDb.offlineCustomers.bulkPut(
              list.map((c) => ({
                id: c.id,
                tenantId: "current",
                name: c.name,
                phone: c.phone,
                ice: c.ice,
                currentCreditBalance: c.currentCreditBalance,
                creditLimit: c.creditLimit,
              }))
            ).catch(() => {});
          }
        }
      } catch (err) {
        // Fallback to Dexie local cache if offline
        if (offlineDb) {
          try {
            const cached = await offlineDb.offlineCustomers.toArray();
            setCustomers(
              cached.map((c: any) => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                ice: c.ice,
                currentCreditBalance: c.currentCreditBalance,
                creditLimit: c.creditLimit,
                loyaltyPoints: 0,
              }))
            );
          } catch {}
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen, search]);

  if (!isOpen) return null;

  const handleSelect = (c: PosCustomer | null) => {
    setCustomer(c);
    onClose();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim() || undefined,
          ice: newIce.trim() || undefined,
          creditLimit: newCreditLimit ? parseFloat(newCreditLimit) : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to create customer");
      }

      const data = await res.json();
      const created: PosCustomer = data.data.customer;

      if (offlineDb) {
        offlineDb.offlineCustomers.put({
          id: created.id,
          tenantId: "current",
          name: created.name,
          phone: created.phone,
          ice: created.ice,
          currentCreditBalance: 0,
          creditLimit: created.creditLimit,
        }).catch(() => {});
      }

      // Automatically select newly created customer
      handleSelect(created);
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de la création du client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {isCreating ? "Nouveau Client (إضافة زبون)" : t("customer")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toggle Bar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/50 flex gap-2">
          <button
            onClick={() => setIsCreating(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              !isCreating
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
            }`}
          >
            Rechercher existant
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              isCreating
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau client</span>
          </button>
        </div>

        {isCreating ? (
          /* Inline Creation Form */
          <form onSubmit={handleCreateCustomer} className="p-5 space-y-4 overflow-y-auto">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nom complet / Raison Sociale *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Mohammed Tazi ou Ste Atlas SARL"
                className="w-full h-11 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Téléphone (GSM)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0661234567"
                  className="w-full h-11 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  ICE (Pour entreprises)
                </label>
                <input
                  type="text"
                  value={newIce}
                  onChange={(e) => setNewIce(e.target.value)}
                  placeholder="15 chiffres"
                  className="w-full h-11 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Plafond de Crédit Autorisé (DH)
              </label>
              <input
                type="number"
                step="100"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(e.target.value)}
                placeholder="Ex: 2000"
                className="w-full h-11 px-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer mt-2"
            >
              {isSubmitting ? tCommon("loading") : "Enregistrer et Sélectionner"}
            </button>
          </form>
        ) : (
          /* Search & List */
          <div className="p-4 flex-1 flex flex-col overflow-hidden space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, téléphone ou ICE..."
                className="w-full h-11 ps-9 pe-4 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Quick Guest / Passager Button */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-start flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Client Comptoir (Passager)</span>
                  <span className="text-xs text-slate-400">Vente directe sans compte client</span>
                </div>
              </div>
              {selectedCustomer === null && (
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
            </button>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Recherche en cours...
                </div>
              ) : customers.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Aucun client trouvé.
                </div>
              ) : (
                customers.map((c) => {
                  const isSelected = selectedCustomer?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className={`w-full p-3 rounded-xl border text-start flex items-center justify-between gap-3 transition ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                          : "bg-slate-800/40 hover:bg-slate-800 border-slate-700/40 text-slate-200"
                      }`}
                    >
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{c.name}</span>
                          {c.ice && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                              ICE: {c.ice}
                            </span>
                          )}
                        </div>

                        {c.phone && (
                          <span className="text-xs text-slate-400 font-mono block mt-0.5">
                            {c.phone}
                          </span>
                        )}

                        {/* Credit & Loyalty Badges */}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                          {c.currentCreditBalance > 0 ? (
                            <span className="flex items-center gap-1 text-red-400 font-mono font-semibold">
                              <CreditCard className="w-3 h-3" />
                              Crédit: {c.currentCreditBalance.toFixed(2)} DH
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">
                              Crédit: 0.00 DH
                            </span>
                          )}

                          <span className="text-slate-600">•</span>

                          <span className="flex items-center gap-1 text-amber-400 font-mono font-semibold">
                            <Coins className="w-3 h-3" />
                            {c.loyaltyPoints ?? 0} pts
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
