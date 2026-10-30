import React from "react";
import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import {
  Layers,
  AlertTriangle,
  ArrowDownUp,
  Package,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const ctx = await getRequestContext();
  const tenantId = ctx.tenantId;

  // 1. Fetch products with stock levels
  const products = await prisma.product.findMany({
    where: { tenantId, trackStock: true },
    include: {
      stockLevels: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });

  // 2. Fetch recent inventory movements
  const recentMovements = await prisma.inventoryMovement.findMany({
    where: { tenantId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-white" />
            Gestion des Stocks & Mouvements
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Suivi des quantités réelles, alertes de stock bas et historique des entrées/sorties
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            <Package className="h-3.5 w-3.5" />
            Tous les Produits
          </Link>
        </div>
      </div>

      {/* Stock Summary Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Niveaux de Stock en Temps Réel</h2>
          <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
            {products.length} Articles Suivis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">Produit</th>
                <th className="py-3 px-4 text-start font-semibold">SKU / Code-barres</th>
                <th className="py-3 px-4 text-start font-semibold">Catégorie</th>
                <th className="py-3 px-4 text-start font-semibold">Prix Vente</th>
                <th className="py-3 px-4 text-end font-semibold">Quantité en Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    Aucun produit suivi en stock. Ajoutez vos articles depuis le catalogue.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const qty = Number(p.stockLevels[0]?.quantity || 0);
                  const isLow = qty <= 5;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-950/40 transition">
                      <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-zinc-400">{p.sku || p.barcode || "—"}</td>
                      <td className="py-3 px-4 text-zinc-400">{p.category?.name || "Général"}</td>
                      <td className="py-3 px-4 font-mono text-white">{Number(p.salePrice).toFixed(2)} MAD</td>
                      <td className="py-3 px-4 text-end">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                            isLow
                              ? "bg-zinc-800 text-white border border-zinc-600"
                              : "bg-zinc-950 text-zinc-300 border border-zinc-800"
                          }`}
                        >
                          {isLow && <AlertTriangle className="h-3 w-3" />}
                          {qty} unités
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements Log */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <ArrowDownUp className="h-4 w-4 text-white" />
          Derniers Mouvements de Stock
        </h2>

        {recentMovements.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">Aucun mouvement de stock récent enregistré.</p>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {recentMovements.map((m) => {
              const delta = Number(m.quantityDelta);
              return (
                <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{m.product?.name || "Article"}</span>
                    <span className="text-zinc-500 text-[11px] ml-2 font-mono">
                      Type: {m.movementType}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span className={delta >= 0 ? "text-white font-bold" : "text-zinc-400"}>
                      {delta >= 0 ? `+${delta}` : delta}
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
