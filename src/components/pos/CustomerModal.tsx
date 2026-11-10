"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  UserPlus,
  Coins,
  CreditCard,
  User,
  Check,
} from "lucide-react";
import { usePosStore, type PosCustomer } from "@/client/store/usePosStore";
import { offlineDb } from "@/client/db";
import { getApiUrl } from "@/client/sync-engine";
import { useAppDictionary } from "@/i18n/schema";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, locale } = useAppDictionary();
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

  const modalI18n = {
    ar: {
      title: "قائمة الزبائن",
      newTitle: "إضافة زبون جديد",
      searchTab: "البحث في القائمة",
      newTab: "زبون جديد",
      fullName: "الاسم الكامل / الشركة *",
      fullNamePlaceholder: "مثال: محمد التازي أو شركة أطلس",
      phone: "رقم الهاتف (GSM)",
      ice: "التعريف الموحد (ICE)",
      creditLimit: "سقف الكريدي المسموح به (MAD)",
      saveBtn: "حفظ واختيار الزبون",
      saving: "جاري الحفظ...",
      searchPlaceholder: "بحث بالاسم، رقم الهاتف أو ICE...",
      guestTitle: "زبون عادي (بدون حساب)",
      guestSubtitle: "بيع مباشر نقداً بدون تسجيل في السجل",
      searching: "جاري البحث...",
      noResults: "لا يوجد أي زبون مطابق للبحث.",
      credit: "كريدي",
      pts: "نقطة",
    },
    fr: {
      title: "Clients",
      newTitle: "Nouveau Client",
      searchTab: "Rechercher existant",
      newTab: "Nouveau client",
      fullName: "Nom complet / Raison Sociale *",
      fullNamePlaceholder: "Ex: Mohammed Tazi ou Ste Atlas SARL",
      phone: "Téléphone (GSM)",
      ice: "ICE (Pour entreprises)",
      creditLimit: "Plafond de Crédit Autorisé (MAD)",
      saveBtn: "Enregistrer et Sélectionner",
      saving: "Enregistrement...",
      searchPlaceholder: "Rechercher par nom, téléphone ou ICE...",
      guestTitle: "Client Comptoir (Passager)",
      guestSubtitle: "Vente directe sans compte client",
      searching: "Recherche en cours...",
      noResults: "Aucun client trouvé.",
      credit: "Crédit",
      pts: "pts",
    },
    en: {
      title: "Customers",
      newTitle: "New Customer",
      searchTab: "Search Existing",
      newTab: "New Customer",
      fullName: "Full Name / Company Name *",
      fullNamePlaceholder: "e.g., John Doe or Atlas Corp",
      phone: "Phone Number",
      ice: "Tax ID / ICE",
      creditLimit: "Authorized Credit Limit (MAD)",
      saveBtn: "Save & Select Customer",
      saving: "Saving...",
      searchPlaceholder: "Search by name, phone or tax ID...",
      guestTitle: "Walk-in Customer (Guest)",
      guestSubtitle: "Direct cash sale without account",
      searching: "Searching...",
      noResults: "No customers found.",
      credit: "Credit",
      pts: "pts",
    },
  }[locale] || {
    title: "Customers",
    newTitle: "New Customer",
    searchTab: "Search Existing",
    newTab: "New Customer",
    fullName: "Full Name / Company Name *",
    fullNamePlaceholder: "e.g., John Doe or Atlas Corp",
    phone: "Phone Number",
    ice: "Tax ID / ICE",
    creditLimit: "Authorized Credit Limit (MAD)",
    saveBtn: "Save & Select Customer",
    saving: "Saving...",
    searchPlaceholder: "Search by name, phone or tax ID...",
    guestTitle: "Walk-in Customer (Guest)",
    guestSubtitle: "Direct cash sale without account",
    searching: "Searching...",
    noResults: "No customers found.",
    credit: "Credit",
    pts: "pts",
  };

  // Search customers
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const query = search.trim();
        const res = await fetch(getApiUrl(`/api/v1/customers${query ? `?search=${encodeURIComponent(query)}` : ""}`));
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
      } catch {
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
      const res = await fetch(getApiUrl("/api/v1/customers"), {
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
        throw new Error(errorData.error?.message || "Customer creation failed");
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

      handleSelect(created);
    } catch (err: any) {
      setErrorMessage(err.message || "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="ltr" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-white" />
            <h3 className="font-bold text-white text-base">
              {isCreating ? modalI18n.newTitle : modalI18n.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toggle Bar */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/20 flex gap-2">
          <button
            onClick={() => setIsCreating(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              !isCreating
                ? "bg-white text-black"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            {modalI18n.searchTab}
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              isCreating
                ? "bg-white text-black"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{modalI18n.newTab}</span>
          </button>
        </div>

        {isCreating ? (
          /* Inline Creation Form */
          <form onSubmit={handleCreateCustomer} className="p-5 space-y-4 overflow-y-auto">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                {modalI18n.fullName}
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={modalI18n.fullNamePlaceholder}
                className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:border-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {modalI18n.phone}
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0661234567"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:border-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {modalI18n.ice}
                </label>
                <input
                  type="text"
                  value={newIce}
                  onChange={(e) => setNewIce(e.target.value)}
                  placeholder="15 chiffres"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:border-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                {modalI18n.creditLimit}
              </label>
              <input
                type="number"
                step="100"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(e.target.value)}
                placeholder="Ex: 2000"
                className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:border-white focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="w-full h-12 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-40 text-black font-bold text-sm transition cursor-pointer mt-2"
            >
              {isSubmitting ? modalI18n.saving : modalI18n.saveBtn}
            </button>
          </form>
        ) : (
          /* Search & List */
          <div className="p-4 flex-1 flex flex-col overflow-hidden space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={modalI18n.searchPlaceholder}
                className="w-full h-11 ps-9 pe-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:border-white focus:outline-none"
              />
            </div>

            {/* Quick Guest / Passager Button */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-start flex items-center justify-between transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">{modalI18n.guestTitle}</span>
                  <span className="text-xs text-zinc-400">{modalI18n.guestSubtitle}</span>
                </div>
              </div>
              {selectedCustomer === null && (
                <Check className="w-5 h-5 text-white shrink-0" />
              )}
            </button>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="py-8 text-center text-zinc-500 text-sm font-mono">
                  {modalI18n.searching}
                </div>
              ) : customers.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm font-mono">
                  {modalI18n.noResults}
                </div>
              ) : (
                customers.map((c) => {
                  const isSelected = selectedCustomer?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className={`w-full p-3 rounded-xl border text-start flex items-center justify-between gap-3 transition cursor-pointer ${
                        isSelected
                          ? "bg-zinc-800 border-white text-white"
                          : "bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 text-zinc-200"
                      }`}
                    >
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{c.name}</span>
                          {c.ice && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                              ICE: {c.ice}
                            </span>
                          )}
                        </div>

                        {c.phone && (
                          <span className="text-xs text-zinc-400 font-mono block mt-0.5">
                            {c.phone}
                          </span>
                        )}

                        {/* Credit & Loyalty Badges */}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                          {c.currentCreditBalance > 0 ? (
                            <span className="flex items-center gap-1 text-zinc-300 font-mono font-semibold">
                              <CreditCard className="w-3 h-3 text-zinc-500" />
                              {modalI18n.credit}: {c.currentCreditBalance.toFixed(2)} {t.common.currency}
                            </span>
                          ) : (
                            <span className="text-zinc-500 font-mono">
                              {modalI18n.credit}: 0.00 {t.common.currency}
                            </span>
                          )}

                          <span className="text-zinc-700">•</span>

                          <span className="flex items-center gap-1 text-zinc-400 font-mono font-medium">
                            <Coins className="w-3 h-3 text-zinc-500" />
                            {c.loyaltyPoints ?? 0} {modalI18n.pts}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shrink-0 font-bold">
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
