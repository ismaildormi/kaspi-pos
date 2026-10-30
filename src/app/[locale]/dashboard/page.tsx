import React from "react";
import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Plus,
  FileSpreadsheet,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const ctx = await getRequestContext();
  const tenantId = ctx.tenantId;

  // 1. Fetch counts & stats
  const [productsCount, salesCount, customersCount] = await Promise.all([
    prisma.product.count({ where: { tenantId } }),
    prisma.sale.count({ where: { tenantId, status: "completed" } }),
    prisma.customer.count({ where: { tenantId } }),
  ]);

  // 2. Sum of sales
  const salesAgg = await prisma.sale.aggregate({
    where: { tenantId, status: "completed" },
    _sum: { grandTotal: true },
  });
  const totalSalesMad = Number(salesAgg._sum.grandTotal || 0).toFixed(2);

  // 3. Low stock alerts (< 5 items)
  const lowStockProducts = await prisma.product.findMany({
    where: { tenantId, trackStock: true },
    include: { stockLevels: true },
    take: 5,
  });

  return (
    <div className="space-y-8 select-none">
      {/* Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {ctx.activeTenant?.displayName || "Tableau de Bord"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            {ctx.activeTenant?.legalName || "Commerce de détail"} • Devise : MAD (Dirham Marocain)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products/import"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Importer Excel/CSV
          </Link>
          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Ouvrir la Caisse POS
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Chiffre d&apos;Affaires Global</span>
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono">{totalSalesMad} MAD</div>
            <p className="text-[11px] text-zinc-400 mt-1">Total des ventes enregistrées</p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Total Transactions</span>
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono">{salesCount}</div>
            <p className="text-[11px] text-zinc-400 mt-1">Tickets de caisse validés</p>
          </div>
        </div>

        {/* Total Products */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Articles en Catalogue</span>
            <Package className="h-4 w-4 text-white" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono">{productsCount}</div>
            <p className="text-[11px] text-zinc-400 mt-1">Produits référencés</p>
          </div>
        </div>

        {/* Customers */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Clients & Carnet (Krediat)</span>
            <Users className="h-4 w-4 text-white" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white font-mono">{customersCount}</div>
            <p className="text-[11px] text-zinc-400 mt-1">Comptes clients enregistrés</p>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fast POS CTA */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-white">
              Mode Hors-Ligne Actif
            </div>
            <h2 className="text-lg font-bold text-white">Caisse Tactile Rapide (POS)</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Compatible écrans tactiles, douchettes de code-barres USB/Bluetooth, et imprimantes thermiques 80mm/58mm.
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/pos"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
            >
              Lancer le Point de Vente
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* WhatsApp Reports CTA */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-white">
              Automatisation
            </div>
            <h2 className="text-lg font-bold text-white">Clôtures & Z-Report Quotidien</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Consultez vos ventes de la journée réparties par mode de règlement et recevez un résumé automatique par WhatsApp.
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800"
            >
              Consulter les Rapports
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
