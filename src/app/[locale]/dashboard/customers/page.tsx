"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDictionary } from "@/i18n/schema";
import { getCachedData, setCachedData } from "@/lib/cache/client-cache";
import { ObsidianMetalVipCardWhiteCanvas } from "@/components/ui/KineticEmptyState";
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Coins,
  ArrowLeft,
  ArrowRight,
  Phone,
  Building2,
  X,
  Loader2,
  Check,
} from "lucide-react";

interface CustomerItem {
  id: string;
  name: string;
  phone: string | null;
  ice: string | null;
  currentCreditBalance: number;
  creditLimit: number | null;
  loyaltyPoints: number;
  createdAt: string;
}

export default function CustomersPage() {
  const { t, locale } = useAppDictionary();

  const [customers, setCustomers] = useState<CustomerItem[]>(() => {
    return getCachedData<CustomerItem[]>("customers_list", []).data;
  });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(() => {
    return !getCachedData<CustomerItem[]>("customers_list", []).isCached;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Customer Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ice, setIce] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Credit Ledger / Repayment Modal State
  const [activeCustomerForCredit, setActiveCustomerForCredit] = useState<CustomerItem | null>(null);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [creditActionType, setCreditActionType] = useState<"payment" | "charge">("payment");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNotes, setCreditNotes] = useState("");
  const [savingCredit, setSavingCredit] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);

  const openCreditModal = async (cust: CustomerItem) => {
    setActiveCustomerForCredit(cust);
    setCreditActionType(cust.currentCreditBalance > 0 ? "payment" : "charge");
    setCreditAmount(cust.currentCreditBalance > 0 ? cust.currentCreditBalance.toFixed(2) : "");
    setCreditNotes("");
    setCreditError(null);
    setLoadingCredits(true);
    try {
      const res = await fetch(`/api/v1/customers/${cust.id}/credits`);
      if (res.ok) {
        const json = await res.json();
        setCreditHistory(json.data?.credits || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingCredits(false);
    }
  };

  const handleRecordCreditTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomerForCredit) return;
    const amt = parseFloat(creditAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      setCreditError("Veuillez saisir un montant valide (> 0 MAD).");
      return;
    }

    setSavingCredit(true);
    setCreditError(null);
    try {
      const res = await fetch(`/api/v1/customers/${activeCustomerForCredit.id}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: creditActionType,
          amount: amt,
          notes:
            creditNotes.trim() ||
            (creditActionType === "payment"
              ? "Règlement espèce au comptoir (Karné)"
              : "Crédit manuel ajouté au carnet"),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message || "Impossible d'enregistrer l'opération");
      }

      await fetchCustomers();
      await openCreditModal({
        ...activeCustomerForCredit,
        currentCreditBalance: parseFloat(json.data.balanceAfter),
      });
      setCreditAmount("");
      setCreditNotes("");
    } catch (err: any) {
      setCreditError(err.message || "Erreur");
    } finally {
      setSavingCredit(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async (isBackground = false) => {
    if (!isBackground && !search) {
      const hasCached = getCachedData<CustomerItem[]>("customers_list", []).isCached;
      if (!hasCached) setIsLoading(true);
    } else if (search) {
      setIsLoading(true);
    }
    try {
      const res = await fetch(`/api/v1/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.customers || [];
        setCustomers(list);
        if (!search) {
          setCachedData("customers_list", list);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const optimisticCust: CustomerItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim() || null,
      ice: ice.trim() || null,
      currentCreditBalance: 0,
      creditLimit: creditLimit ? parseFloat(creditLimit) : null,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update in 0ms
    setCustomers((prev) => {
      const updated = [optimisticCust, ...prev];
      if (!search) setCachedData("customers_list", updated);
      return updated;
    });

    try {
      const res = await fetch("/api/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          ice: ice.trim() || undefined,
          creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Échec de création du client");
      }

      setIsModalOpen(false);
      setName("");
      setPhone("");
      setIce("");
      setCreditLimit("");
      await fetchCustomers(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion");
      await fetchCustomers();
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCredit = customers.reduce((sum, c) => sum + (c.currentCreditBalance || 0), 0);
  const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20 select-none">
      {/* Top Bar */}
      <header dir="ltr" className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/pos`}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.customers.backPos}</span>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold shadow-xs">
                <Users className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-white">
                {t.customers.title}
              </h1>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="sheen-btn px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.customers.addCustomer}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="group relative p-5 rounded-3xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-dot-matrix opacity-10 pointer-events-none" />
            <div className="relative">
              <span className="text-xs text-zinc-500 block mb-1 group-hover:text-zinc-400 transition-colors">{t.customers.totalCustomers}</span>
              <span className="text-2xl font-black text-white font-mono">{customers.length}</span>
            </div>
          </div>

          <div className="group relative p-5 rounded-3xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-dot-matrix opacity-10 pointer-events-none" />
            <div className="relative">
              <span className="text-xs text-zinc-500 block mb-1 group-hover:text-zinc-400 transition-colors">{t.customers.totalActiveCredits}</span>
              <span className="text-2xl font-black text-white font-mono">
                {totalCredit.toFixed(2)} MAD
              </span>
            </div>
          </div>

          <div className="group relative p-5 rounded-3xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-dot-matrix opacity-10 pointer-events-none" />
            <div className="relative">
              <span className="text-xs text-zinc-500 block mb-1 group-hover:text-zinc-400 transition-colors">{t.customers.loyaltyPointsAccumulated}</span>
              <span className="text-2xl font-black text-white font-mono">{totalPoints} pts</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute inset-y-0 start-3.5 my-auto pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.customers.searchPlaceholder}
            className="w-full h-11 ps-10 pe-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
          />
        </div>

        {/* Customer Data Table */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 font-mono">
                <tr>
                  <th className="p-3.5 text-start">{t.customers.customerName}</th>
                  <th className="p-3.5 text-start">{t.customers.phone}</th>
                  <th className="p-3.5 text-start">{t.customers.ice}</th>
                  <th className="p-3.5 text-end">{t.customers.currentCredit}</th>
                  <th className="p-3.5 text-end">{t.customers.creditLimit}</th>
                  <th className="p-3.5 text-end">{t.customers.loyaltyPoints}</th>
                  <th className="p-3.5 text-center">{t.customers.karneActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      {t.customers.loadingCustomers}
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 sm:p-6">
                      <ObsidianMetalVipCardWhiteCanvas
                        title={t.customers.noCustomersRegistered}
                        subtitle={t.customers.subtitle}
                      />
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-950/40 transition">
                      <td className="p-3.5 text-white font-bold">{c.name}</td>
                      <td className="p-3.5 text-zinc-400 font-mono">{c.phone || "—"}</td>
                      <td className="p-3.5 text-zinc-400 font-mono">{c.ice || "—"}</td>
                      <td className="p-3.5 text-end font-mono font-bold text-white">
                        {c.currentCreditBalance > 0 ? (
                          <span className="text-amber-400 font-extrabold">{c.currentCreditBalance.toFixed(2)} MAD</span>
                        ) : (
                          <span className="text-zinc-500">0.00</span>
                        )}
                      </td>
                      <td className="p-3.5 text-end font-mono text-zinc-400">
                        {c.creditLimit ? `${c.creditLimit.toFixed(2)} MAD` : t.customers.unlimited}
                      </td>
                      <td className="p-3.5 text-end font-mono text-zinc-300">
                        {c.loyaltyPoints ?? 0} pts
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openCreditModal(c)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-[11px] font-bold transition cursor-pointer"
                          >
                            <Coins className="w-3 h-3" />
                            <span>
                              {c.currentCreditBalance > 0
                                ? t.customers.karneCollect
                                : t.customers.karneRecord}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-white text-base">{t.customers.modalTitle}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t.customers.fullNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mohammed Benjelloun"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t.customers.phoneLabel}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0661234567"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t.customers.iceLabel}
                </label>
                <input
                  type="text"
                  value={ice}
                  onChange={(e) => setIce(e.target.value)}
                  placeholder="001234567000045"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t.customers.creditLimitLabel}
                </label>
                <input
                  type="number"
                  step="100"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="2000"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition disabled:opacity-40 cursor-pointer"
                >
                  {isSubmitting ? t.customers.submitting : t.customers.submitCustomer}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Carnet de Crédit (Repayment & Ledger History) Modal */}
      {activeCustomerForCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  {t.customers.ledgerTitle} • {activeCustomerForCredit.name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {t.customers.currentBalance}:{" "}
                  <span className="text-amber-400 font-extrabold">
                    {activeCustomerForCredit.currentCreditBalance.toFixed(2)} MAD
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomerForCredit(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {creditError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                {creditError}
              </div>
            )}

            <form onSubmit={handleRecordCreditTx} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCreditActionType("payment")}
                  className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    creditActionType === "payment"
                      ? "bg-emerald-500 text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  ✓ {t.customers.paymentCollect}
                </button>
                <button
                  type="button"
                  onClick={() => setCreditActionType("charge")}
                  className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    creditActionType === "charge"
                      ? "bg-amber-500 text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  + {t.customers.newCharge}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.customers.amountMad} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="150.00"
                    className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white font-mono font-bold focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.customers.notes}
                  </label>
                  <input
                    type="text"
                    value={creditNotes}
                    onChange={(e) => setCreditNotes(e.target.value)}
                    placeholder="Règlement espèce"
                    className="w-full h-10 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingCredit}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs transition disabled:opacity-40 cursor-pointer"
              >
                {savingCredit
                  ? t.customers.submitting
                  : t.customers.recordOperation}
              </button>
            </form>

            {/* Credit Ledger History */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase font-mono">
                {t.customers.historyTitle}
              </h4>
              {loadingCredits ? (
                <div className="text-xs text-zinc-500 py-4 text-center">
                  {t.customers.loadingCustomers}
                </div>
              ) : creditHistory.length === 0 ? (
                <div className="text-xs text-zinc-500 py-4 text-center">
                  {t.customers.noHistory}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {creditHistory.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span
                          className={`font-bold ${
                            entry.type === "payment"
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }`}
                        >
                          {entry.type === "payment"
                            ? "Règlement Reçu"
                            : "Crédit Ajouté"}
                        </span>
                        {entry.notes && (
                          <p className="text-[11px] text-zinc-400">{entry.notes}</p>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <div
                          className={`font-black ${
                            entry.type === "payment"
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }`}
                        >
                          {entry.type === "payment" ? "-" : "+"}
                          {Number(entry.amount).toFixed(2)} MAD
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Solde: {Number(entry.balanceAfter).toFixed(2)} DH
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
