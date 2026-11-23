"use client";

import React, { useMemo, useState } from "react";
import { Calculator, SlidersHorizontal, TrendingUp } from "lucide-react";
import type { MorphWidgetPayload } from "@/lib/zebra-x/omega/secret12_generative_ui";

export function KaspiMorphWidgetCard({ payload }: { payload: MorphWidgetPayload }) {
  // Interactive Profit / TVA Calculator State
  const [unitPrice, setUnitPrice] = useState(payload.kind === "profit_calculator" ? payload.unitPrice : 150);
  const [unitCost, setUnitCost] = useState(payload.kind === "profit_calculator" ? payload.unitCost : 90);
  const [monthlyUnits, setMonthlyUnits] = useState(payload.kind === "profit_calculator" ? payload.monthlyUnits : 200);
  const [vatPct, setVatPct] = useState(payload.kind === "profit_calculator" ? payload.vatPct : 20);
  const [discountPct, setDiscountPct] = useState(payload.kind === "profit_calculator" ? payload.discountPct : 0);

  // Interactive Decision Matrix Weight Sliders
  const [wBenefit, setWBenefit] = useState(payload.kind === "decision_matrix" ? payload.weights.benefit : 0.5);
  const [wSpeed, setWSpeed] = useState(payload.kind === "decision_matrix" ? payload.weights.speed : 0.3);
  const [wRisk, setWRisk] = useState(payload.kind === "decision_matrix" ? payload.weights.lowRisk : 0.2);

  const calcStats = useMemo(() => {
    const netUnitHt = unitPrice * (1 - discountPct / 100);
    const revenueHt = netUnitHt * monthlyUnits;
    const tva = revenueHt * (vatPct / 100);
    const revenueTtc = revenueHt + tva;
    const cogs = unitCost * monthlyUnits;
    const netProfit = revenueHt - cogs;
    const marginPct = revenueHt > 0 ? (netProfit / revenueHt) * 100 : 0;
    return {
      revenueHt: revenueHt.toFixed(2),
      tva: tva.toFixed(2),
      revenueTtc: revenueTtc.toFixed(2),
      netProfit: netProfit.toFixed(2),
      marginPct: marginPct.toFixed(1),
    };
  }, [unitPrice, unitCost, monthlyUnits, vatPct, discountPct]);

  const rankedOptions = useMemo(() => {
    if (payload.kind !== "decision_matrix") return [];
    const totalW = wBenefit + wSpeed + wRisk || 1;
    const wb = wBenefit / totalW;
    const ws = wSpeed / totalW;
    const wr = wRisk / totalW;
    return [...payload.options]
      .map((o) => ({
        ...o,
        score: Number(((o.benefit * wb + o.speed * ws + o.lowRisk * wr) * 10).toFixed(1)),
      }))
      .sort((a, b) => b.score - a.score);
  }, [payload, wBenefit, wSpeed, wRisk]);

  if (payload.kind === "profit_calculator") {
    return (
      <div
        dir="auto"
        className="my-3 rounded-2xl border border-emerald-500/30 bg-[#14171D] p-4 space-y-3 text-zinc-100 shadow-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Calculator className="w-4 h-4 shrink-0" />
            <span>{payload.title}</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
            Generative Live UI
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">سعر الوحدة HT ({payload.currency})</span>
              <span className="font-mono font-semibold">{unitPrice}</span>
            </div>
            <input
              type="range"
              min={5}
              max={Math.max(1000, payload.unitPrice * 3)}
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </label>

          <label className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">تكلفة الشراء HT ({payload.currency})</span>
              <span className="font-mono font-semibold">{unitCost}</span>
            </div>
            <input
              type="range"
              min={1}
              max={Math.max(900, payload.unitPrice * 2.5)}
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </label>

          <label className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">المبيعات الشهرية (وحدة)</span>
              <span className="font-mono font-semibold">{monthlyUnits}</span>
            </div>
            <input
              type="range"
              min={10}
              max={Math.max(2000, payload.monthlyUnits * 4)}
              step={10}
              value={monthlyUnits}
              onChange={(e) => setMonthlyUnits(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-zinc-400 block">TVA % (DGI)</span>
              <select
                value={vatPct}
                onChange={(e) => setVatPct(Number(e.target.value))}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs"
              >
                {[0, 7, 10, 14, 20].map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-zinc-400 block">تخفيض ({discountPct}%)</span>
              <input
                type="range"
                min={0}
                max={50}
                value={discountPct}
                onChange={(e) => setDiscountPct(Number(e.target.value))}
                className="w-full accent-emerald-500 mt-1.5"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
          <div className="p-2 rounded-xl bg-black/25">
            <div className="text-[11px] text-zinc-400">الإجمالي TTC</div>
            <div className="font-bold text-white">{calcStats.revenueTtc} {payload.currency}</div>
          </div>
          <div className="p-2 rounded-xl bg-black/25">
            <div className="text-[11px] text-zinc-400">الضريبة TVA</div>
            <div className="font-bold text-amber-400">{calcStats.tva} {payload.currency}</div>
          </div>
          <div className="p-2 rounded-xl bg-black/25">
            <div className="text-[11px] text-zinc-400">صافي الربح</div>
            <div className={`font-bold ${Number(calcStats.netProfit) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {calcStats.netProfit} {payload.currency}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-black/25">
            <div className="text-[11px] text-zinc-400">الهامش</div>
            <div className="font-bold text-emerald-300">{calcStats.marginPct}%</div>
          </div>
        </div>
      </div>
    );
  }

  if (payload.kind === "decision_matrix") {
    return (
      <div
        dir="auto"
        className="my-3 rounded-2xl border border-amber-500/30 bg-[#14171D] p-4 space-y-3 text-zinc-100 shadow-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>{payload.title}</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
            TOPSIS Live Decision Matrix
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <label>
            <span className="text-zinc-400">العائد ({Math.round(wBenefit * 100)}%)</span>
            <input type="range" min={0} max={1} step={0.05} value={wBenefit} onChange={(e) => setWBenefit(Number(e.target.value))} className="w-full accent-emerald-400" />
          </label>
          <label>
            <span className="text-zinc-400">السرعة ({Math.round(wSpeed * 100)}%)</span>
            <input type="range" min={0} max={1} step={0.05} value={wSpeed} onChange={(e) => setWSpeed(Number(e.target.value))} className="w-full accent-amber-400" />
          </label>
          <label>
            <span className="text-zinc-400">الأمان ({Math.round(wRisk * 100)}%)</span>
            <input type="range" min={0} max={1} step={0.05} value={wRisk} onChange={(e) => setWRisk(Number(e.target.value))} className="w-full accent-emerald-400" />
          </label>
        </div>

        <div className="space-y-1.5 text-xs">
          {rankedOptions.map((opt, idx) => (
            <div key={opt.name} className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/30 border border-white/10">
              <div className="font-medium">
                #{idx + 1} {opt.name}
              </div>
              <div className="font-mono text-emerald-400 font-bold">{opt.score} / 100</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // market_chart
  const maxVal = Math.max(1, ...payload.bars.map((b) => b.value));
  return (
    <div
      dir="auto"
      className="my-3 rounded-2xl border border-emerald-500/30 bg-[#14171D] p-4 space-y-3 text-zinc-100 shadow-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>{payload.title}</span>
        </div>
        {payload.subtitle && <span className="text-[11px] text-zinc-400">{payload.subtitle}</span>}
      </div>
      <div className="space-y-2">
        {payload.bars.map((bar) => (
          <div key={bar.label} className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-300">{bar.label}</span>
              <span className="font-mono font-semibold text-emerald-400">
                {bar.value.toLocaleString()} {payload.unitLabel}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                style={{ width: `${Math.max(4, Math.round((bar.value / maxVal) * 100))}%` }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
