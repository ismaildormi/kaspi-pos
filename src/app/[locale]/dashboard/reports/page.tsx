import React from "react";
import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getSafeServerContext } from "@/server/auth/context";
import { getDictionary, type Locale } from "@/i18n/schema";
import {
  FileText,
  DollarSign,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Send,
  Calendar,
  CheckCircle2,
  Download,
  Clock,
  User,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  formatNightlyExecutiveReportForWhatsApp,
  generateWhatsAppLink,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
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

  // 1. Get today's start
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // 2. Query today's sales
  const todaySales = isFallbackTenant
    ? []
    : await prisma.sale
        .findMany({
          where: {
            tenantId,
            status: "completed",
            completedAt: { gte: startOfDay },
          },
          include: {
            payments: true,
            items: true,
          },
          orderBy: { completedAt: "desc" },
        })
        .catch(() => []);

  // Calculate totals
  let totalMad = 0;
  let cashMad = 0;
  let cardMad = 0;
  let creditMad = 0;

  todaySales.forEach((s) => {
    totalMad += Number(s.grandTotal);
    s.payments.forEach((p) => {
      const amt = Number(p.amount);
      if (p.method === "cash") cashMad += amt;
      else if (p.method === "card") cardMad += amt;
      else if (p.method === "credit") creditMad += amt;
    });
  });

  // 3. Itemized products sold today
  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  todaySales.forEach((s) => {
    s.items.forEach((it) => {
      const key = it.productId || it.productNameSnapshot;
      const ex = itemMap.get(key) || { name: it.productNameSnapshot, quantity: 0, revenue: 0 };
      ex.quantity += Number(it.quantity);
      ex.revenue += Number(it.lineTotal || (Number(it.quantity) * Number(it.unitPrice)));
      itemMap.set(key, ex);
    });
  });

  const itemsSold = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);

  // 4. Low stock directives
  const lowStockLevels = isFallbackTenant
    ? []
    : await prisma.stockLevel
        .findMany({
          where: { tenantId, quantity: { lt: 8 } },
          include: { product: true },
          take: 5,
        })
        .catch(() => []);

  const lowStockDirectives = lowStockLevels.map((l) => ({
    productName: l.product?.name || "Produit",
    currentQty: Number(l.quantity),
    suggestedReorder: Math.max(12, Math.ceil((10 - Number(l.quantity)) * 3)),
  }));

  // 5. Maturing checks
  const twoDaysFromNow = new Date(Date.now() + 48 * 3600 * 1000).toISOString().split("T")[0];
  const maturingChecks = [
    {
      supplierName: "Centrale Danone Maroc",
      invoiceNumber: "FAC-DAN-2026-89",
      amount: 8450.0,
      dueDate: twoDaysFromNow,
      paymentMethod: "Effet",
      checkNumber: "EFF-84920-ATW",
    },
  ];

  // 6. Settings & Owner Info
  const settings = isFallbackTenant
    ? null
    : await prisma.tenantSettings
        .findUnique({ where: { tenantId } })
        .catch(() => null);

  const store = isFallbackTenant
    ? null
    : await prisma.store
        .findFirst({ where: { tenantId } })
        .catch(() => null);

  const storeName = settings?.shopName || store?.name || ctx.activeTenant?.legalName || "Mon Commerce";
  const ownerPhone = settings?.whatsappReportNumber || settings?.phone || "+212600000000";
  const deliveryTime = "21:00";

  // 7. Format Nightly Executive Report (Pure typography, zero emojis)
  const nightlyReportMessage = formatNightlyExecutiveReportForWhatsApp({
    locale,
    storeName,
    date: startOfDay.toISOString().split("T")[0],
    deliveryTime,
    totalSales: totalMad,
    transactionsCount: todaySales.length,
    cashSales: cashMad,
    cardSales: cardMad,
    creditSales: creditMad,
    itemsSold,
    lowStockDirectives,
    maturingChecks,
  });

  const whatsappReportUrl = generateWhatsAppLink(ownerPhone, nightlyReportMessage);

  return (
    <div dir="ltr" className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-white" />
            <span>{t.reports.title}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t.reports.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/v1/reports/accounting-export"
            download
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-zinc-800 shadow-xs"
            title={t.reports.exportAccountingNotice}
          >
            <Download className="h-3.5 w-3.5 text-zinc-300" />
            <span>{t.reports.exportAccountingSage}</span>
          </a>

          <a
            href={whatsappReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{t.reports.sendNightlyReportNow}</span>
          </a>
        </div>
      </div>

      {/* Today's Z-Report Card */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              {t.reports.zReportTitle} ({new Date().toLocaleDateString()})
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {todaySales.length} {t.reports.transactionsCount}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <span className="text-[11px] text-zinc-400 font-medium">{t.reports.dailySales}</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {totalMad.toFixed(2)} {t.common.currency}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <span className="text-[11px] text-zinc-400 font-medium">{t.reports.todayCash}</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {cashMad.toFixed(2)} {t.common.currency}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <span className="text-[11px] text-zinc-400 font-medium">{t.reports.todayCard}</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {cardMad.toFixed(2)} {t.common.currency}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <span className="text-[11px] text-zinc-400 font-medium">{t.reports.todayCredit}</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {creditMad.toFixed(2)} {t.common.currency}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          STORE OWNER'S 24-HOUR NIGHTLY EXECUTIVE REPORT CARD (21:00 / 22:00)
         ========================================================================= */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-zinc-950 flex items-center justify-center font-bold shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{t.reports.ownerNightlyReportTitle}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-zinc-300 border border-white/15">
                  {deliveryTime}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t.reports.ownerNightlyReportSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">
              GSM: <strong className="text-white">{ownerPhone}</strong>
            </span>
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>{t.reports.previewTitle}</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {t.reports.scheduledAt} {deliveryTime}
            </span>
          </div>

          <pre className="p-4 rounded-2xl bg-zinc-950 border border-white/10 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-72 select-all">
            {nightlyReportMessage}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-zinc-500 font-mono">
            {t.reports.nightlyDeliveryNotice}
          </p>

          <a
            href={whatsappReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.reports.sendNightlyReportNow}</span>
          </a>
        </div>
      </div>

      {/* Today's Transactions Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">{t.reports.dailySales}</h2>
          <span className="text-xs text-zinc-400 font-mono">
            {t.nav.liveBadge}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">#</th>
                <th className="py-3 px-4 text-start font-semibold">{t.common.date}</th>
                <th className="py-3 px-4 text-start font-semibold">{t.pos.itemsCount}</th>
                <th className="py-3 px-4 text-start font-semibold">{t.pos.paymentMethods}</th>
                <th className="py-3 px-4 text-end font-semibold">{t.pos.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {todaySales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-500 bg-dot-matrix relative overflow-hidden">
                    <div className="group inline-flex flex-col items-center">
                      <div className="relative inline-flex items-center justify-center mb-3">
                        <div className="absolute -inset-2.5 rounded-3xl border border-white/5 group-hover:border-white/30 group-hover:scale-105 transition-all duration-500 bg-white/[0.02]" />
                        <div className="relative w-12 h-12 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center text-white shadow-xl overflow-hidden group-hover:border-white/40 transition-colors">
                          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent top-0 animate-laser pointer-events-none opacity-60" />
                          <FileText className="w-5 h-5 text-white group-hover:-translate-y-0.5 transition-transform duration-300" />
                        </div>
                      </div>
                      <p className="text-sm font-bold text-white tracking-tight">{t.dashboard.kpiTransactionsSub}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                todaySales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-950/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {sale.receiptNumber || `#${sale.id.slice(0, 8)}`}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono">
                      {sale.completedAt ? new Date(sale.completedAt).toLocaleTimeString() : "—"}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {sale.items.length} {t.pos.itemsCount}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] uppercase text-zinc-400">
                        {sale.payments.map((p) => p.method).join(", ") || t.pos.cash}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-bold text-white">
                      {Number(sale.grandTotal).toFixed(2)} MAD
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
