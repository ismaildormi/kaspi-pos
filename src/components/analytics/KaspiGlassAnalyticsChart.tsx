"use client";

import React, { useState, useRef, useId } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { AnalyticsPoint } from "@/lib/analytics/types";

interface KaspiGlassAnalyticsChartProps {
  points: AnalyticsPoint[];
  unitLabel?: string;
  locale?: string;
  height?: number;
  loading?: boolean;
}

function buildSpline(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    d += ` C ${cpX.toFixed(2)} ${p0.y.toFixed(2)}, ${cpX.toFixed(2)} ${p1.y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  return d;
}

export const KaspiGlassAnalyticsChart: React.FC<KaspiGlassAnalyticsChartProps> = ({
  points,
  unitLabel = "MAD",
  locale = "fr",
  height = 250,
  loading = false,
}) => {
  const uid = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const safePoints: AnalyticsPoint[] =
    points.length > 0
      ? points
      : [
          { key: "0", label: "--", fullDate: "--", value: 0, secondaryValue: 0, count: 0, deltaPct: 0 },
          { key: "1", label: "--", fullDate: "--", value: 0, secondaryValue: 0, count: 0, deltaPct: 0 },
        ];

  const width = 760;
  const padL = 58;
  const padR = 18;
  const padT = 18;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const rawMax = Math.max(...safePoints.map((p) => p.value), 0);
  const yMax = rawMax > 0 ? rawMax * 1.15 : 100;

  const coords = safePoints.map((pt, i) => {
    const x =
      safePoints.length > 1
        ? padL + (i / (safePoints.length - 1)) * plotW
        : padL + plotW / 2;
    const ratio = yMax > 0 ? pt.value / yMax : 0;
    const y = padT + plotH - ratio * plotH;
    return { x, y, pt };
  });

  const linePath = buildSpline(coords);
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${(padT + plotH).toFixed(2)} L ${coords[0].x.toFixed(2)} ${(padT + plotH).toFixed(2)} Z`
      : "";

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let minDist = Infinity;
    coords.forEach((c, idx) => {
      const dist = Math.abs(c.x - svgX);
      if (dist < minDist) {
        minDist = dist;
        nearest = idx;
      }
    });
    setHoverIdx(nearest);
  };

  const activePoint = hoverIdx !== null ? coords[hoverIdx] : null;
  const xTickStep = Math.max(1, Math.ceil(coords.length / 7));

  const formatTickVal = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    return unitLabel === "MAD" ? v.toFixed(0) : v.toFixed(0);
  };

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="relative w-full select-none"
    >
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/[0.03] backdrop-blur-[2px]">
          <span className="text-xs font-medium text-[var(--kaspi-text-muted)] animate-pulse">
            {locale === "ar" ? "جاري تحديث المنحنى..." : locale === "en" ? "Updating curve..." : "Actualisation..."}
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible touch-none cursor-crosshair"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
            <stop offset="65%" stopColor="#10b981" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id={`${uid}-stroke`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Horizontal Reference Gridlines + Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padT + plotH - frac * plotH;
          const val = yMax * frac;
          return (
            <g key={frac}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.10"
                strokeDasharray={frac === 0 ? undefined : "4 4"}
                className="text-[var(--kaspi-text-primary)]"
              />
              <text
                x={padL - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-[var(--kaspi-text-muted)] text-[10px] font-medium tabular-nums"
              >
                {formatTickVal(val)}
              </text>
            </g>
          );
        })}

        {/* Area Fill */}
        {areaPath && <path d={areaPath} fill={`url(#${uid}-area)`} />}

        {/* Smooth Glowing Curve */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${uid}-stroke)`}
            strokeWidth="2.6"
            strokeLinecap="round"
            filter={`url(#${uid}-glow)`}
          />
        )}

        {/* Subtle Node Dots */}
        {coords.map((c, idx) => {
          const isActive = hoverIdx === idx;
          if (!isActive && coords.length > 16 && c.pt.value === 0) return null;
          return (
            <circle
              key={c.pt.key}
              cx={c.x}
              cy={c.y}
              r={isActive ? 5 : 2.5}
              fill={isActive ? "#10b981" : "#34d399"}
              stroke="#ffffff"
              strokeWidth={isActive ? 2 : 0.75}
              opacity={isActive ? 1 : 0.75}
            />
          );
        })}

        {/* X-Axis Labels */}
        {coords.map((c, idx) => {
          if (idx % xTickStep !== 0 && idx !== coords.length - 1) return null;
          return (
            <text
              key={`lbl-${c.pt.key}`}
              x={c.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-[var(--kaspi-text-muted)] text-[10px] font-medium tabular-nums"
            >
              {c.pt.label}
            </text>
          );
        })}

        {/* Interactive Vertical Crosshair & Active Halo */}
        {activePoint && (
          <g>
            <line
              x1={activePoint.x}
              y1={padT}
              x2={activePoint.x}
              y2={padT + plotH}
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeDasharray="3 3"
              className="text-[var(--kaspi-text-primary)]"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="11"
              fill="#10b981"
              opacity="0.22"
            />
          </g>
        )}
      </svg>

      {/* Floating Apple Frosted Glass Hover Tooltip */}
      {activePoint && (
        <div
          className="pointer-events-none absolute top-2 z-30 kaspi-opaque-glass-modal rounded-xl px-3 py-2 border border-white/25 shadow-xl text-xs min-w-[168px] transition-all duration-75"
          style={{
            left: `clamp(8px, calc(${(activePoint.x / width) * 100}% - 84px), calc(100% - 180px))`,
          }}
        >
          <div className="text-[10px] font-semibold text-[var(--kaspi-text-muted)] mb-0.5 tabular-nums">
            {activePoint.pt.fullDate}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-[var(--kaspi-text-primary)] tabular-nums">
              {unitLabel === "MAD"
                ? `${activePoint.pt.value.toFixed(2)} MAD`
                : `${activePoint.pt.value} ${unitLabel}`}
            </span>
            {activePoint.pt.deltaPct !== null && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${
                  activePoint.pt.deltaPct > 0
                    ? "text-emerald-400"
                    : activePoint.pt.deltaPct < 0
                    ? "text-red-400"
                    : "text-[var(--kaspi-text-muted)]"
                }`}
              >
                {activePoint.pt.deltaPct > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : activePoint.pt.deltaPct < 0 ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : (
                  <Minus className="w-2.5 h-2.5" />
                )}
                {Math.abs(activePoint.pt.deltaPct).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-[10px] text-[var(--kaspi-text-muted)] mt-0.5 tabular-nums">
            {activePoint.pt.count}{" "}
            {locale === "ar" ? "عملية" : locale === "en" ? "orders" : "ventes"}
          </div>
        </div>
      )}
    </div>
  );
};

export default KaspiGlassAnalyticsChart;
