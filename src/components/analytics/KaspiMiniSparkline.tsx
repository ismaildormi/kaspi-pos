"use client";

import React, { useId } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface KaspiMiniSparklineProps {
  values?: number[];
  deltaPct?: number;
  positiveIsGood?: boolean;
  height?: number;
  className?: string;
}

function buildSmoothPath(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
  let d = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx.toFixed(2)} ${p0.y.toFixed(2)}, ${cx.toFixed(2)} ${p1.y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  return d;
}

export const KaspiMiniSparkline: React.FC<KaspiMiniSparklineProps> = ({
  values = [],
  deltaPct = 0,
  positiveIsGood = true,
  height = 30,
  className = "",
}) => {
  const uid = useId().replace(/:/g, "");
  const series = values.length >= 2 ? values : [0, 0, 0, 0];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min;
  const w = 112;
  const padY = 4;
  const innerH = height - padY * 2;

  const coords = series.map((val, i) => {
    const x = (i / (series.length - 1)) * (w - 6) + 3;
    const norm = span > 0 ? (val - min) / span : 0.12;
    const y = padY + innerH - norm * innerH;
    return { x, y };
  });

  const linePath = buildSmoothPath(coords);
  const lastPt = coords[coords.length - 1];
  const firstPt = coords[0];
  const areaPath = `${linePath} L ${lastPt.x.toFixed(2)} ${height} L ${firstPt.x.toFixed(2)} ${height} Z`;

  const isUp = deltaPct > 0.1;
  const isDown = deltaPct < -0.1;
  const goodColor = "#10b981";
  const warnColor = "#f87171";
  const neutralStroke = "currentColor";
  const strokeColor = isUp
    ? positiveIsGood
      ? goodColor
      : warnColor
    : isDown
    ? positiveIsGood
      ? warnColor
      : goodColor
    : neutralStroke;

  const badgeTone = isUp
    ? positiveIsGood
      ? "text-emerald-400 bg-emerald-500/12 border-emerald-500/25"
      : "text-red-400 bg-red-500/12 border-red-500/25"
    : isDown
    ? positiveIsGood
      ? "text-red-400 bg-red-500/12 border-red-500/25"
      : "text-emerald-400 bg-emerald-500/12 border-emerald-500/25"
    : "text-[var(--kaspi-text-muted)] bg-white/[0.06] border-white/15";

  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="flex-1 h-7 overflow-visible text-[var(--kaspi-text-muted)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${uid}-grad)`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.85"
          strokeLinecap="round"
        />
        <circle cx={lastPt.x} cy={lastPt.y} r="2.75" fill={strokeColor} />
        <circle cx={lastPt.x} cy={lastPt.y} r="5.5" fill={strokeColor} opacity="0.22" />
      </svg>

      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold tabular-nums shrink-0 ${badgeTone}`}
      >
        {isUp ? (
          <ArrowUpRight className="w-3 h-3" />
        ) : isDown ? (
          <ArrowDownRight className="w-3 h-3" />
        ) : (
          <Minus className="w-2.5 h-2.5" />
        )}
        <span>{Math.abs(deltaPct).toFixed(1)}%</span>
      </span>
    </div>
  );
};

export default KaspiMiniSparkline;
