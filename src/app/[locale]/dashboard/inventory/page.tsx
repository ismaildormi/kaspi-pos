import React from "react";
import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getSafeServerContext } from "@/server/auth/context";
import {
  Layers,
  AlertTriangle,
  ArrowDownUp,
  Package,
  Sparkles,
  TrendingDown,
  Clock,
  ShoppingCart,
  ArrowRightLeft,
  Plus,
} from "lucide-react";
import { StockAuditClient } from "@/components/dashboard/StockAuditClient";
import { GroceryInventoryConsole } from "@/components/dashboard/GroceryInventoryConsole";
import { getDictionary, type Locale } from "@/i18n/schema";
import { KineticWarehouseRadarEmpty } from "@/components/ui/KineticEmptyState";
import { FloatingCommerceCanvas } from "@/components/ui/FloatingCommerceCanvas";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === "ar" || rawLocale === "en" ? rawLocale : "fr") as Locale;
  const t = getDictionary(locale);

  const ctx = await getSafeServerContext();
  const tenantId = ctx.tenantId;
  const isFallbackTenant = tenantId === "00000000-0000-0000-0000-000000000000";

  // 1. Fetch products with stock levels
  const products = isFallbackTenant
    ? []
    : await prisma.product
        .findMany({
          where: { tenantId, trackStock: true },
          include: {
            stockLevels: true,
            category: true,
          },
          orderBy: { name: "asc" },
        })
        .catch(() => []);

  // 2. Fetch recent inventory movements
  const recentMovements = isFallbackTenant
    ? []
    : await prisma.inventoryMovement
        .findMany({
          where: { tenantId },
          include: { product: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
        .catch(() => []);

  // 4. Fetch stores & warehouses
  let stores = isFallbackTenant
    ? []
    : await prisma.store
        .findMany({
          where: { tenantId },
          select: { id: true, name: true, code: true },
          orderBy: { name: "asc" },
        })
        .catch(() => []);

  if (stores.length === 0) {
    stores = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: locale === "ar" ? "المستودع الرئيسي" : locale === "en" ? "Main Warehouse" : "Dépôt Principal",
        code: "MAIN",
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        name: locale === "ar" ? "نقطة البيع الرئيسية" : locale === "en" ? "POS Register Store" : "Magasin Caisse",
        code: "POS",
      },
    ];
  } else if (stores.length === 1) {
    stores.push({
      id: "00000000-0000-0000-0000-000000000002",
      name: locale === "ar" ? "مستودع التخزين الاحتياطي" : locale === "en" ? "Reserve Storage" : "Dépôt Réserve",
      code: "RES",
    });
  }

  // 5. Fetch recent stock transfers
  const recentTransfers = isFallbackTenant
    ? []
    : await prisma.stockTransfer
        .findMany({
          where: { tenantId },
          include: {
            sourceStore: { select: { name: true, code: true } },
            destStore: { select: { name: true, code: true } },
            items: { include: { product: { select: { name: true, sku: true } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
        .catch(() => []);
  // 6. Fetch workspace profile for storeType
  const workspaceRecord = isFallbackTenant
    ? null
    : await prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: {
              tenantId,
              scope: "workspace_config",
              key: "store_profile",
            },
          },
        })
        .catch(() => null);

  const workspacePayload =
    workspaceRecord?.responseBody && typeof workspaceRecord.responseBody === "object"
      ? (workspaceRecord.responseBody as Record<string, unknown>)
      : {};
  const currentStoreType = String(workspacePayload.storeType || "grocery");

  const groceryProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku || "",
    barcode: p.barcode || "",
    salePrice: Number(p.salePrice || 0),
    stockQuantity: Number(p.stockLevels[0]?.quantity ?? 12),
    aisle: p.category?.name || (locale === "ar" ? "البقالة العامة" : "Épicerie Générale"),
    dlc: "2026-11-28",
    unit: p.unit || "unit",
  }));

  // 3. AI Predictive Stockout Velocity (Last 14 days sales velocity)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const salesVelocity = isFallbackTenant
    ? []
    : await prisma.saleItem
        .groupBy({
          by: ["productId"],
          where: {
            tenantId,
            createdAt: { gte: fourteenDaysAgo },
          },
          _sum: {
            quantity: true,
          },
        })
        .catch(() => []);

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
    <div dir="ltr" className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-white" />
            <span>
              {locale === "ar"
                ? "إدارة المخزون والصلاحية DLC"
                : locale === "fr"
                ? "Gestion des Stocks & DLC"
                : "Inventory & DLC Management"}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t.inventory.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StockAuditClient
            stores={stores}
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku || null,
              barcode: p.barcode || null,
              currentQty: Number(p.stockLevels[0]?.quantity || 0),
            }))}
          />
          <Link
            href={`/${locale}/dashboard/products`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            <Package className="h-3.5 w-3.5" />
            <span>{t.products.title}</span>
          </Link>
        </div>
      </div>

      {/* SUPERMARKET & GROCERY CONSOLE (Mode 1) */}
      {currentStoreType === "grocery" && (
        <GroceryInventoryConsole initialProducts={groceryProducts} />
      )}

      {/* AI PREDICTIVE STOCKOUT ANTICIPATION MODULE */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.16] bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_48%,rgba(14,19,24,0.92)_100%)] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.24),0_14px_32px_-10px_rgba(0,0,0,0.65)] backdrop-blur-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{t.inventory.aiAnticipationTitle}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/[0.06] text-zinc-300 border border-white/10">
                  {t.inventory.velocityModel}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                {t.inventory.velocitySubtitle}
              </p>
            </div>
          </div>
        </div>

        {predictedStockouts.length === 0 ? (
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 text-center text-xs text-zinc-400 font-mono">
            {t.inventory.optimalStockBanner}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {predictedStockouts.map((item) => (
              <div
                key={item.product.id}
                className="p-4 rounded-xl bg-zinc-950 border border-white/10 flex flex-col justify-between space-y-2.5 hover:border-white/25 transition"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                    <span className="truncate">{item.product.category?.name || "Rayon"}</span>
                    <span className="text-zinc-200 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {item.daysRemaining <= 1 ? t.inventory.today : t.inventory.inDays.replace("{days}", String(item.daysRemaining))}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white line-clamp-1">{item.product.name}</h4>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    {t.inventory.currentQty} : <span className="text-white font-bold">{item.currentQty} {t.inventory.units}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-mono">{t.inventory.reorderAdvice}</span>
                  <span className="font-mono font-bold text-white flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3 text-zinc-400" />
                    +{item.suggestedReorder} {t.inventory.units}
                  </span>
                </div>

                <div className="w-full mt-2.5 p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-zinc-300 font-medium">
                    <span className="text-zinc-400">
                      {t.inventory.suggestedReorderBadge.replace("{qty}", String(item.suggestedReorder)).replace("{unit}", t.inventory.units)}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 pt-0.5 border-t border-zinc-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span className="leading-tight">
                      {t.inventory.nightlyReportNotice}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock Summary Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">{t.inventory.realtimeLevels}</h2>
          <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
            {products.length} {t.inventory.trackedItemsCount}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">{t.inventory.productName}</th>
                <th className="py-3 px-4 text-start font-semibold">{t.products.sku} / {t.products.barcode}</th>
                <th className="py-3 px-4 text-start font-semibold">{t.products.category}</th>
                <th className="py-3 px-4 text-start font-semibold">{t.products.salePrice}</th>
                <th className="py-3 px-4 text-end font-semibold">{t.inventory.currentQty}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="relative py-14 text-center text-zinc-500 overflow-hidden">
                    <FloatingCommerceCanvas opacity="opacity-10" />
                    <div className="relative z-10 flex flex-col items-center justify-center py-4">
                      <KineticWarehouseRadarEmpty
                        title={
                          locale === "ar"
                            ? "لا توجد منتجات في المخزون حالياً"
                            : locale === "fr"
                            ? "Aucun produit en stock actuellement"
                            : "No products currently in stock"
                        }
                        subtitle={t.inventory.optimalStockBanner}
                      />
                      <Link
                        href={`/${locale}/dashboard/products`}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {locale === "ar"
                            ? "+ إضافة منتج جديد"
                            : locale === "fr"
                            ? "+ Ajouter un nouveau produit"
                            : "+ Add New Product"}
                        </span>
                      </Link>
                    </div>
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
                      <td className="py-3 px-4 text-zinc-400">{p.category?.name || "—"}</td>
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
                          {qty} {t.inventory.units}
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
          {t.inventory.auditLog}
        </h2>

        {recentMovements.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">{t.inventory.auditLog}</p>
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

      {/* Inter-Store Stock Transfers Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-white" />
            <span>
              {locale === "ar"
                ? "سجل التحويلات بين الفروع والمستودعات"
                : locale === "en"
                ? "Inter-Store Stock Transfers History"
                : "Historique des Transferts Inter-Dépôts"}
            </span>
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            {recentTransfers.length} {locale === "ar" ? "عملية" : "transferts"}
          </span>
        </div>

        {recentTransfers.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            {locale === "ar"
              ? "لم يتم تسجيل أي تحويل بين الفروع حتى الآن."
              : locale === "en"
              ? "No stock transfers recorded yet."
              : "Aucun transfert de stock enregistré pour l'instant."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-mono">
                  <th className="py-2.5 px-3">N° Transfert</th>
                  <th className="py-2.5 px-3">{locale === "ar" ? "المصدر" : "Source"}</th>
                  <th className="py-2.5 px-3">{locale === "ar" ? "الوجهة" : "Destination"}</th>
                  <th className="py-2.5 px-3">{locale === "ar" ? "المنتجات المحولة" : "Articles Transférés"}</th>
                  <th className="py-2.5 px-3 text-end">{locale === "ar" ? "الحالة" : "Statut"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {recentTransfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-zinc-950/40 transition">
                    <td className="py-3 px-3 font-bold text-white">{trf.transferNumber}</td>
                    <td className="py-3 px-3 text-zinc-300">{trf.sourceStore?.name || trf.sourceStore?.code}</td>
                    <td className="py-3 px-3 text-zinc-300">{trf.destStore?.name || trf.destStore?.code}</td>
                    <td className="py-3 px-3 text-zinc-400">
                      {trf.items.map((it) => `${it.product.name} (x${Number(it.quantity)})`).join(", ")}
                    </td>
                    <td className="py-3 px-3 text-end">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                        {locale === "ar" ? "مكتمل" : "Complété"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
