"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAppDictionary } from "@/i18n/schema";
import { getCachedData, setCachedData } from "@/lib/cache/client-cache";
import { compressImage } from "@/lib/storage/compression-engine";
import { KineticSupplierInvoiceScanEmpty } from "@/components/ui/KineticEmptyState";
import {
  Truck,
  Plus,
  ArrowLeft,
  X,
  Loader2,
  FileText,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Upload,
  RefreshCw,
  Wallet,
  Clock,
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

interface SupplierLedgerItem {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string | null;
  invoiceNumber: string;
  amountMAD: number;
  balanceOwedMAD: number;
  paymentMethod: "check" | "effet" | "cash" | "virement";
  checkNumber?: string | null;
  dueDate: string;
  status: "pending" | "settled" | "overdue";
  notes?: string | null;
  createdAt: string;
}

interface OcrExtractedItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  quantity: number;
  unitCost: number;
  salePrice: number;
  taxRate: number;
}

export default function SuppliersPage() {
  const { t, locale } = useAppDictionary();

  const [suppliers, setSuppliers] = useState<SupplierItem[]>(() => {
    return getCachedData<SupplierItem[]>("suppliers_cache", []).data;
  });
  const [ledgerItems, setLedgerItems] = useState<SupplierLedgerItem[]>([]);
  const [summary, setSummary] = useState({
    totalSuppliers: 0,
    totalDebtOwedMAD: 0,
    upcomingMaturitiesCount: 0,
    upcomingMaturitiesAmountMAD: 0,
  });

  const [isLoading, setIsLoading] = useState(() => {
    return !getCachedData<SupplierItem[]>("suppliers_cache", []).isCached;
  });

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // New Supplier Form State
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [ice, setIce] = useState("");
  const [address, setAddress] = useState("");
  const [supplierCategory, setSupplierCategory] = useState("fmcg_dairy");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Debt Form State
  const [debtSupplierId, setDebtSupplierId] = useState("");
  const [debtInvoiceNumber, setDebtInvoiceNumber] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtPaymentMethod, setDebtPaymentMethod] = useState<"check" | "effet" | "cash" | "virement">("effet");
  const [debtCheckNumber, setDebtCheckNumber] = useState("");
  const [debtDueDate, setDebtDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [deliveryDlcDate, setDeliveryDlcDate] = useState("");
  const [debtNotes, setDebtNotes] = useState("");

  // OCR Scanner State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrItems, setOcrItems] = useState<OcrExtractedItem[]>([]);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string | null>(null);
  const [isCommittingOcr, setIsCommittingOcr] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    fetchLedger();
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

  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/v1/suppliers/ledger");
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setLedgerItems(data.data.items || []);
          setSummary(data.data.summary || {
            totalSuppliers: 0,
            totalDebtOwedMAD: 0,
            upcomingMaturitiesCount: 0,
            upcomingMaturitiesAmountMAD: 0,
          });
        }
      }
    } catch (err) {
      console.error(err);
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

      setIsSupplierModalOpen(false);
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

  const handleRecordDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtSupplierId || !debtInvoiceNumber || !debtAmount) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const sup = suppliers.find((s) => s.id === debtSupplierId);
    const amountNum = parseFloat(debtAmount);

    try {
      const res = await fetch("/api/v1/suppliers/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_invoice",
          supplierId: debtSupplierId,
          supplierName: sup?.name || "Fournisseur",
          supplierPhone: sup?.phone || undefined,
          invoiceNumber: debtInvoiceNumber,
          amountMAD: amountNum,
          balanceOwedMAD: amountNum,
          paymentMethod: debtPaymentMethod,
          checkNumber: debtCheckNumber.trim() || undefined,
          dueDate: debtDueDate,
          notes: debtNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Échec d'enregistrement de la dette");
      }

      setIsDebtModalOpen(false);
      setDebtInvoiceNumber("");
      setDebtAmount("");
      setDebtCheckNumber("");
      setDebtNotes("");
      fetchLedger();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettleDebt = async (item: SupplierLedgerItem) => {
    try {
      await fetch("/api/v1/suppliers/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "settle_payment",
          id: item.id,
          amountSettledMAD: item.balanceOwedMAD,
        }),
      });
      fetchLedger();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOcrFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setOcrSuccessMsg(null);

    try {
      // 1. Client-side WebP compression (<50KB)
      const compressed = await compressImage(file, {
        maxDimension: 1200,
        quality: 0.8,
        targetSizeKB: 75,
      });

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch("/api/v1/suppliers/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
          });
          const data = await res.json();
          if (data.data?.items) {
            setOcrItems(data.data.items);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(compressed.blob);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  const handleCommitOcr = async () => {
    if (ocrItems.length === 0) return;
    setIsCommittingOcr(true);
    try {
      const res = await fetch("/api/v1/suppliers/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          items: ocrItems,
        }),
      });
      if (res.ok) {
        setOcrSuccessMsg(t.suppliers.ocrCommitSuccess);
        setTimeout(() => {
          setIsOcrModalOpen(false);
          setOcrItems([]);
          setOcrSuccessMsg(null);
        }, 1600);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommittingOcr(false);
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOcrModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span>{t.suppliers.scanInvoiceOcr}</span>
            </button>

            <button
              onClick={() => setIsDebtModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-300" />
              <span>{t.suppliers.recordDebtInvoice}</span>
            </button>

            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="sheen-btn px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.suppliers.addSupplier}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* KPI Summary Cards (Multi-Layered Frosted Glass) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Suppliers */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.16] bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_48%,rgba(14,19,24,0.92)_100%)] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.24),0_14px_32px_-10px_rgba(0,0,0,0.65)] backdrop-blur-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-300 text-xs font-semibold mb-2">
              <span>{t.suppliers.title}</span>
              <Truck className="w-4 h-4 text-[#2DD4BF]" />
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight mt-2">
              {summary.totalSuppliers || suppliers.length}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {t.suppliers.registeredPartners}
            </div>
          </div>

          {/* Total Debt Owed */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.16] bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_48%,rgba(14,19,24,0.92)_100%)] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.24),0_14px_32px_-10px_rgba(0,0,0,0.65)] backdrop-blur-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-300 text-xs font-semibold mb-2">
              <span>{t.suppliers.totalDebtOwed}</span>
              <Wallet className="w-4 h-4 text-[#2DD4BF]" />
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight mt-2">
              {summary.totalDebtOwedMAD.toLocaleString()} <span className="text-sm font-semibold text-zinc-400">MAD</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {t.suppliers.totalDebtDesc}
            </div>
          </div>

          {/* Upcoming Maturities */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.16] bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_48%,rgba(14,19,24,0.92)_100%)] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.24),0_14px_32px_-10px_rgba(0,0,0,0.65)] backdrop-blur-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-300 text-xs font-semibold mb-2">
              <span>{t.suppliers.upcomingMaturities}</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight mt-2 flex items-baseline gap-2">
              <span>{summary.upcomingMaturitiesCount}</span>
              <span className="text-sm font-semibold text-zinc-400">
                ({summary.upcomingMaturitiesAmountMAD.toLocaleString()} MAD)
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {t.suppliers.maturitiesDesc}
            </div>
          </div>
        </div>

        {/* Supplier Debt & Checks Ledger */}
        {ledgerItems.length > 0 && (
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t.suppliers.ledgerTitle}
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {t.suppliers.activeInvoicesCount.replace("{count}", String(ledgerItems.filter((i) => i.status !== "settled").length))}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 font-mono">
                  <tr>
                    <th className="p-3 text-start">{t.suppliers.name}</th>
                    <th className="p-3 text-start">{t.suppliers.invoiceNumber}</th>
                    <th className="p-3 text-start">{t.suppliers.paymentModeCheck}</th>
                    <th className="p-3 text-start">{t.suppliers.dueDate}</th>
                    <th className="p-3 text-end">{t.common.currency}</th>
                    <th className="p-3 text-end">{t.suppliers.balanceRemaining}</th>
                    <th className="p-3 text-center">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {ledgerItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-950/40 transition">
                      <td className="p-3 text-white font-bold">{item.supplierName}</td>
                      <td className="p-3 text-zinc-300 font-mono">{item.invoiceNumber}</td>
                      <td className="p-3 text-zinc-300">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono uppercase text-zinc-300 border border-zinc-700">
                          {item.paymentMethod} {item.checkNumber ? `#${item.checkNumber}` : ""}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400 font-mono">{item.dueDate}</td>
                      <td className="p-3 text-end text-zinc-300 font-mono">{item.amountMAD.toFixed(2)}</td>
                      <td className="p-3 text-end font-mono font-bold text-white">
                        {item.balanceOwedMAD.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        {item.balanceOwedMAD > 0 ? (
                          <button
                            onClick={() => handleSettleDebt(item)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-zinc-200 text-black text-[11px] font-bold cursor-pointer transition shadow-2xs"
                          >
                            {t.suppliers.settleDebt}
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                            {t.suppliers.settled}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Suppliers Directory Table */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {t.suppliers.subtitle}
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {suppliers.length} {locale === "ar" ? "موردين" : locale === "en" ? "suppliers" : "fournisseurs"}
            </span>
          </div>
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
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      <KineticSupplierInvoiceScanEmpty
                        title={t.suppliers.noSuppliers}
                        subtitle={t.suppliers.subtitle}
                      />
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
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-white text-base">{t.suppliers.addSupplier}</h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
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

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {locale === "ar" ? "نوع موزع السلع الاستهلاكية (FMCG)" : "Catégorie Distributeur FMCG"}
                </label>
                <select
                  value={supplierCategory}
                  onChange={(e) => setSupplierCategory(e.target.value)}
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                >
                  <option value="fmcg_dairy">{locale === "ar" ? "منتجات الحليب والأجبان (Laiterie & Frais)" : "Laiterie & Frais"}</option>
                  <option value="fmcg_drinks">{locale === "ar" ? "المشروبات والمياه (Boissons & Eaux)" : "Boissons & Eaux"}</option>
                  <option value="fmcg_dry">{locale === "ar" ? "البقالة الجافة والمعلبات (Épicerie Sèche)" : "Épicerie Sèche"}</option>
                  <option value="fmcg_cleaning">{locale === "ar" ? "مواد التنظيف والورقيات (Entretien & Droguerie)" : "Entretien & Droguerie"}</option>
                  <option value="fmcg_gas">{locale === "ar" ? "قنينات الغاز والصناديق (Gaz & Consignes)" : "Gaz & Consignes"}</option>
                  <option value="general">{locale === "ar" ? "موزع عام (Distributeur Général)" : "Distributeur Général"}</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
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

      {/* Record Debt / Invoice Modal */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-bold text-white text-base">{t.suppliers.recordDebtInvoice}</h3>
              <button
                onClick={() => setIsDebtModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t.suppliers.title} *
                </label>
                <select
                  required
                  value={debtSupplierId}
                  onChange={(e) => setDebtSupplierId(e.target.value)}
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                >
                  <option value="">{t.suppliers.selectSupplierOption}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.suppliers.invoiceNumberLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={debtInvoiceNumber}
                    onChange={(e) => setDebtInvoiceNumber(e.target.value)}
                    placeholder="FAC-2026-001"
                    className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.suppliers.amountTtcLabel}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder="4500.00"
                    className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.suppliers.paymentMethodLabel}
                  </label>
                  <select
                    value={debtPaymentMethod}
                    onChange={(e) => setDebtPaymentMethod(e.target.value as any)}
                    className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                  >
                    <option value="effet">{t.suppliers.paymentMethodEffet}</option>
                    <option value="check">{t.suppliers.paymentMethodCheck}</option>
                    <option value="cash">{t.suppliers.paymentMethodCash}</option>
                    <option value="virement">{t.suppliers.paymentMethodVirement}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.suppliers.checkNumber}
                  </label>
                  <input
                    type="text"
                    value={debtCheckNumber}
                    onChange={(e) => setDebtCheckNumber(e.target.value)}
                    placeholder="CHQ-984102 / EFF-119"
                    className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t.suppliers.dueDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={debtDueDate}
                    onChange={(e) => setDebtDueDate(e.target.value)}
                    className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {locale === "ar" ? "تاريخ صلاحية الشحنة (DLC)" : "Date DLC Livraison"}
                  </label>
                  <input
                    type="date"
                    value={deliveryDlcDate}
                    onChange={(e) => setDeliveryDlcDate(e.target.value)}
                    className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t.suppliers.notesLabel}
                </label>
                <input
                  type="text"
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  placeholder={t.suppliers.notesPlaceholder}
                  className="w-full h-11 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !debtSupplierId || !debtInvoiceNumber || !debtAmount}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition disabled:opacity-40 cursor-pointer"
                >
                  {isSubmitting ? t.customers.submitting : t.suppliers.recordDebtInvoice}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OCR Wholesale Invoice Scanner Modal */}
      {isOcrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {t.suppliers.ocrModalTitle}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {t.suppliers.ocrModalSubtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOcrModalOpen(false);
                  setOcrItems([]);
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dropzone */}
            {ocrItems.length === 0 && (
              <div className="p-8 border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-2xl flex flex-col items-center justify-center text-center transition bg-zinc-900/40 cursor-pointer mb-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleOcrFileSelect}
                />
                {isScanning ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                    <p className="text-xs font-bold text-white">{t.suppliers.ocrProcessing}</p>
                    <p className="text-[11px] text-zinc-500">{t.suppliers.ocrCompressionNote}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{t.suppliers.ocrDropzoneText}</p>
                      <p className="text-[11px] text-zinc-500 mt-1">{t.suppliers.ocrWholesaleExamples}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extracted Items Table */}
            {ocrItems.length > 0 && (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>{ocrItems.length} {t.suppliers.extractedItemsCount}</span>
                  <button
                    onClick={() => {
                      setOcrItems([]);
                      fileInputRef.current?.click();
                    }}
                    className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t.suppliers.rescan}</span>
                  </button>
                </div>

                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  <table className="w-full text-start text-xs font-medium">
                    <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 font-mono">
                      <tr>
                        <th className="p-2.5 text-start">{t.suppliers.item}</th>
                        <th className="p-2.5 text-start">{t.products.sku} / {t.products.barcode}</th>
                        <th className="p-2.5 text-center">{t.suppliers.quantity}</th>
                        <th className="p-2.5 text-end">{t.suppliers.costPrice}</th>
                        <th className="p-2.5 text-end">{t.suppliers.salePrice}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {ocrItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-zinc-950/40">
                          <td className="p-2.5 text-white font-sans font-bold">{item.name}</td>
                          <td className="p-2.5 text-zinc-400 text-[11px]">{item.barcode}</td>
                          <td className="p-2.5 text-center text-white font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-end text-zinc-300">{item.unitCost.toFixed(2)} {t.common.currency}</td>
                          <td className="p-2.5 text-end text-white font-bold">{item.salePrice.toFixed(2)} {t.common.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {ocrSuccessMsg && (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{ocrSuccessMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2 shrink-0 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsOcrModalOpen(false);
                  setOcrItems([]);
                }}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                {t.common.cancel}
              </button>
              {ocrItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleCommitOcr}
                  disabled={isCommittingOcr}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition disabled:opacity-40 cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  {isCommittingOcr ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{t.suppliers.ocrCommitBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
