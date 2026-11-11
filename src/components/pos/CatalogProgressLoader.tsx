"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

interface CatalogProgressLoaderProps {
  isLoading?: boolean;
  onReady?: () => void;
}

export function CatalogProgressLoader({ isLoading = true, onReady }: CatalogProgressLoaderProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    // Phase 1: Asymptotic smooth climb up to 88% while isLoading is true
    if (isLoading) {
      hasFinishedRef.current = false;
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) return 88;
          // Dynamic acceleration easing smoothly towards 88%
          const step = Math.max(1, Math.round((88 - prev) * 0.18));
          return Math.min(88, prev + step);
        });
      }, 50);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isLoading]);

  useEffect(() => {
    // Phase 2: The exact millisecond isLoading becomes false, snap to 100% and unmount within <60ms
    if (!isLoading && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      const timer = setTimeout(() => {
        onReady?.();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onReady]);

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
