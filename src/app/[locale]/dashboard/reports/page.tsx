import React from "react";
import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import {
  FileText,
  DollarSign,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Send,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const ctx = await getRequestContext();
  const tenantId = ctx.tenantId;

  // 1. Get today's start
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // 2. Query today's sales
  const todaySales = await prisma.sale.findMany({
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
  });

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

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-white" />
            Rapports de Caisse & Z-Report
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Synthèse financière journalière, répartition des encaissements et envoi automatique WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/api/reports/daily-whatsapp?autoSend=true`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
          >
            <Send className="h-3.5 w-3.5" />
            Envoyer le Z-Report WhatsApp
          </a>
        </div>
      </div>

      {/* Today's Z-Report Card */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Z-Report Journalier ({new Date().toLocaleDateString()})
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {todaySales.length} Transactions aujourd&apos;hui
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <span className="text-[11px] text-zinc-400 font-medium">Chiffre Global (TTC)</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {totalMad.toFixed(2)} MAD
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <span className="text-[11px] text-zinc-400 font-medium">Espèces (Cash)</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {cashMad.toFixed(2)} MAD
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <span className="text-[11px] text-zinc-400 font-medium">Carte Bancaire (CMI)</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {cardMad.toFixed(2)} MAD
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <span className="text-[11px] text-zinc-400 font-medium">Crédit Client (Krediat)</span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {creditMad.toFixed(2)} MAD
            </div>
          </div>
        </div>
      </div>

      {/* Today's Transactions Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Tickets & Ventes du Jour</h2>
          <span className="text-xs text-zinc-400 font-mono">
            Mis à jour en direct
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">N° Ticket</th>
                <th className="py-3 px-4 text-start font-semibold">Heure</th>
                <th className="py-3 px-4 text-start font-semibold">Articles</th>
                <th className="py-3 px-4 text-start font-semibold">Mode de Règlement</th>
                <th className="py-3 px-4 text-end font-semibold">Total Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {todaySales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    Aucune vente enregistrée aujourd&apos;hui.
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
                      {sale.items.length} articles
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] uppercase text-zinc-400">
                        {sale.payments.map((p) => p.method).join(", ") || "Espèces"}
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
