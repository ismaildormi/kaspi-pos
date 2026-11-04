"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface RevenueDataPoint {
  date: string;
  revenueMad: number;
  revenueUsd: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [currency, setCurrency] = useState<"MAD" | "USD">("MAD");

  const totalCurrent = data.reduce(
    (acc, cur) => acc + (currency === "MAD" ? cur.revenueMad : cur.revenueUsd),
    0
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
      {/* Header & Currency Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Croissance du Revenu • 30 Derniers Jours
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Total période :{" "}
            <span className="font-mono font-bold text-white">
              {totalCurrent.toLocaleString()}{" "}
              {currency === "MAD" ? "DH" : "USD"}
            </span>
          </p>
        </div>

        <div className="inline-flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setCurrency("MAD")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              currency === "MAD"
                ? "bg-white text-black font-bold shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            MAD (DH)
          </button>
          <button
            type="button"
            onClick={() => setCurrency("USD")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              currency === "USD"
                ? "bg-white text-black font-bold shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 sm:h-80 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="monochromeGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="#27272a"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
              tickFormatter={(val) =>
                currency === "MAD" ? `${val} DH` : `$${val}`
              }
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value as number;
                  return (
                    <div className="bg-zinc-950 border border-zinc-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                      <div className="text-[11px] font-mono text-zinc-400 mb-1">
                        Date: {label}
                      </div>
                      <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        <span>
                          {val.toLocaleString()}{" "}
                          {currency === "MAD" ? "MAD (DH)" : "USD ($)"}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={currency === "MAD" ? "revenueMad" : "revenueUsd"}
              stroke="#ffffff"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#monochromeGlow)"
              activeDot={{
                r: 6,
                fill: "#ffffff",
                stroke: "#09090b",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
