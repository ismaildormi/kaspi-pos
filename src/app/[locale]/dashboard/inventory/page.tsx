import React from "react";
import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import {
  Layers,
  AlertTriangle,
  ArrowDownUp,
  Package,
  Sparkles,
  TrendingDown,
  Clock,
  ShoppingCart,
} from "lucide-react";
import { StockAuditClient } from "@/components/dashboard/StockAuditClient";

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

  // 3. AI Predictive Stockout Velocity (Last 14 days sales velocity) - Hidden Gem 1
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const salesVelocity = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      tenantId,
      createdAt: { gte: fourteenDaysAgo },
    },
    _sum: {
      quantity: true,
    },
  });

  const velocityMap = new Map<string, number>();
  salesVelocity.forEach((sv) => {
    if (sv.productId) {
      velocityMap.set(sv.productId, Number(sv._sum.quantity || 0));
    }
  });

  const predictedStockouts = products
    .map((p) => {
      const currentQty = Number(p.stockLevels[0]?.quantity || 0);
      const unitsSold = velocityMap.get(p.id) || 0;
      const dailyVelocity = unitsSold / 14;
      const daysRemaining =
        dailyVelocity > 0
          ? Math.floor(currentQty / dailyVelocity)
          : currentQty <= 5
          ? 3
          : 999;
      const suggestedReorder = Math.max(
        12,
        Math.ceil((dailyVelocity > 0 ? dailyVelocity : 1) * 14)
      );

      return {
        product: p,
        currentQty,
        unitsSold,
        dailyVelocity,
        daysRemaining,
        suggestedReorder,
      };
    })
    .filter((item) => item.daysRemaining <= 10 || item.currentQty <= 5)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 4);

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-white" />
            Gestion des Stocks &amp; Mouvements
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Suivi des quantités réelles, alertes de stock bas et prédiction IA des ruptures
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StockAuditClient
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku || null,
              barcode: p.barcode || null,
              currentQty: Number(p.stockLevels[0]?.quantity || 0),
            }))}
          />
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            <Package className="h-3.5 w-3.5" />
            Tous les Produits
          </Link>
        </div>
      </div>

      {/* HIDDEN GEM 1: AI PREDICTIVE STOCKOUT ANTICIPATION MODULE */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-zinc-900/60 p-6 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Anticipation Prédictive IA des Ruptures de Stock</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Modèle Vélocité 14j
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Prévisions calculées en continu d&apos;après le rythme d&apos;écoulement réel en caisse
              </p>
            </div>
          </div>
        </div>

        {predictedStockouts.length === 0 ? (
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center text-xs text-zinc-400 font-mono">
            ✨ Tous vos stocks sont à des niveaux optimaux. Aucune rupture imminente détectée sous 10 jours.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {predictedStockouts.map((item) => (
              <div
                key={item.product.id}
                className="p-4 rounded-2xl bg-zinc-950/90 border border-purple-900/40 flex flex-col justify-between space-y-2.5 hover:border-purple-500/50 transition"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                    <span className="truncate">{item.product.category?.name || "Rayon"}</span>
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.daysRemaining <= 1 ? "Aujourd'hui" : `Dans ${item.daysRemaining}j`}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white line-clamp-1">{item.product.name}</h4>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Reste : <span className="text-white font-bold">{item.currentQty} unités</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-mono">Conseil Réappro :</span>
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    +{item.suggestedReorder} u.
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
