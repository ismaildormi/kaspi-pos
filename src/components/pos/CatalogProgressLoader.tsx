"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface CatalogProgressLoaderProps {
  onComplete?: () => void;
}

export function CatalogProgressLoader({ onComplete }: CatalogProgressLoaderProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress simulation 0% -> 100%
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate initially, ease towards 95%
        const increment = Math.max(1, Math.floor((100 - prev) / 4) + Math.floor(Math.random() * 5));
        const next = Math.min(100, prev + increment);
        if (next === 100 && onComplete) {
          setTimeout(onComplete, 120);
        }
        return next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  const subtitle =
    locale === "ar"
      ? "جاري تجهيز كتالوج المنتجات..."
      : locale === "fr"
      ? "Chargement du catalogue produits..."
      : "Loading product catalog...";

  return (
    <div className="h-72 w-full flex flex-col items-center justify-center gap-4 select-none animate-fadeIn" dir="ltr">
      {/* 3D Hardware Badge Ring / Monospace Counter */}
      <div className="flex flex-col items-center justify-center">
        <span className="font-mono font-black text-4xl text-white tabular-nums tracking-tight drop-shadow-[0_4px_16px_rgba(255,255,255,0.2)]">
          {progress}%
        </span>
      </div>

      {/* 3D Recessed Progress Track */}
      <div className="w-64 h-2.5 rounded-full bg-zinc-950 border border-white/10 overflow-hidden p-0.5 shadow-inner">
        <div
          className="h-full rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.85)] transition-all duration-75 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Localized Status Subtitle */}
      <p
        className="text-xs font-medium text-zinc-400 tracking-wide mt-1 text-center"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {subtitle}
      </p>
    </div>
  );
}
