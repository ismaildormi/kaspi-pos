import React from "react";
import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import {
  Package,
  Plus,
  FileSpreadsheet,
  Sparkles,
  Search,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsListPage() {
  const ctx = await getRequestContext();
  const tenantId = ctx.tenantId;

  const products = await prisma.product.findMany({
    where: { tenantId },
    include: {
      category: true,
      stockLevels: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Package className="h-6 w-6 text-white" />
            Catalogue des Produits
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gérez vos références d&apos;articles, codes-barres, prix de vente et taux de TVA
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products/ai-onboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            On-Boarding par IA (Photo)
          </Link>
          <Link
            href="/dashboard/products/import"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Importer Excel/CSV
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Articles Enregistrés</h2>
          <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
            {products.length} Produits
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">Nom de l&apos;Article</th>
                <th className="py-3 px-4 text-start font-semibold">Code SKU / Barres</th>
                <th className="py-3 px-4 text-start font-semibold">Catégorie</th>
                <th className="py-3 px-4 text-start font-semibold">Taux TVA</th>
                <th className="py-3 px-4 text-end font-semibold">Prix Vente (TTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                    Aucun article dans le catalogue. Importez un fichier CSV ou utilisez l&apos;on-boarding IA.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-950/40 transition">
                    <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{p.sku || p.barcode || "—"}</td>
                    <td className="py-3 px-4 text-zinc-400">{p.category?.name || "Général"}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{Number(p.taxRate)}%</td>
                    <td className="py-3 px-4 text-end font-mono font-bold text-white">
                      {Number(p.salePrice).toFixed(2)} MAD
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
