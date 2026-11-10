"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDictionary } from "@/i18n/schema";
import { getCachedData, setCachedData } from "@/lib/cache/client-cache";
import {
  Truck,
  Plus,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  X,
  Loader2,
  FileText,
} from "lucide-react";

interface SupplierItem {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  ice: string | null;
  address: string | null;
  createdAt: string;
}

export default function SuppliersPage() {
  const { t, locale } = useAppDictionary();

  const [suppliers, setSuppliers] = useState<SupplierItem[]>(() => {
    return getCachedData<SupplierItem[]>("suppliers_cache", []).data;
  });
  const [isLoading, setIsLoading] = useState(() => {
    return !getCachedData<SupplierItem[]>("suppliers_cache", []).isCached;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [ice, setIce] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/v1/suppliers");
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.suppliers || [];
        setSuppliers(list);
        setCachedData("suppliers_cache", list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contactName: contactName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          ice: ice.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Échec de création du fournisseur");
      }

      setIsModalOpen(false);
      setName("");
      setContactName("");
      setPhone("");
      setEmail("");
      setIce("");
      setAddress("");
      fetchSuppliers();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="ltr" className="min-h-screen bg-zinc-950 text-white pb-20 select-none">
      {/* Top Bar */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
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
                <Truck className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-white">
                {t.suppliers.title}
              </h1>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.suppliers.addSupplier}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 font-mono">
                <tr>
                  <th className="p-3.5 text-start">{t.suppliers.name}</th>
                  <th className="p-3.5 text-start">{t.suppliers.contact}</th>
                  <th className="p-3.5 text-start">{t.suppliers.phone}</th>
                  <th className="p-3.5 text-start">{t.suppliers.email}</th>
                  <th className="p-3.5 text-start">{t.suppliers.ice}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      {t.common.loading}
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      {t.suppliers.noSuppliers}
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-950/40 transition">
                      <td className="p-3.5 text-white font-bold">{s.name}</td>
                      <td className="p-3.5 text-zinc-300">{s.contactName || "—"}</td>
                      <td className="p-3.5 text-zinc-400 font-mono">{s.phone || "—"}</td>
                      <td className="p-3.5 text-zinc-400 font-mono">{s.email || "—"}</td>
                      <td className="p-3.5 text-zinc-400 font-mono">{s.ice || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-white text-base">{t.suppliers.addSupplier}</h3>
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

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t.suppliers.name} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Centrale Danone SARL"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t.suppliers.contact}
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Amine (Commercial)"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.suppliers.phone}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0522XXXXXX"
                    className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.suppliers.ice}
                  </label>
                  <input
                    type="text"
                    value={ice}
                    onChange={(e) => setIce(e.target.value)}
                    placeholder="000123456000089"
                    className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t.suppliers.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="commandes@fournisseur.ma"
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
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
                  {isSubmitting ? t.customers.submitting : t.suppliers.addSupplier}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
