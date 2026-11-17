"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, ArrowDown, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

export function KaspiPullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartRef = useRef<{ y: number; active: boolean }>({ y: 0, active: false });
  const pathname = usePathname() || "";

  // Resolve current active language
  const isAr = pathname.startsWith("/ar") || (!pathname.startsWith("/fr") && !pathname.startsWith("/en"));
  const isFr = pathname.startsWith("/fr");

  const THRESHOLD = 68;

  // Complete Cache-Busting Hard Refresh
  // Clears Service Worker cache, drops stale bundles, and reloads exactly like restarting the app
  const executeFullHardRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(THRESHOLD);

    try {
      // 1. Clear all browser CacheStorage (drop old compiled Next.js chunks)
      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
        } catch {}
      }

      // 2. Force Service Worker update
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.update();
          }
        } catch {}
      }

      // 3. Clear session storage flags for stale bundle warnings
      if (typeof window !== "undefined" && window.sessionStorage) {
        try {
          window.sessionStorage.clear();
        } catch {}
      }
    } catch {}

    // Brief animation so the user sees the confirmation and rotating emerald spinner
    setTimeout(() => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("_krefresh", Date.now().toString());
        window.location.href = url.toString();
      }
    }, 450);
  }, [THRESHOLD]);

  // Global Keyboard Shortcuts: Ctrl + F5, F5, Ctrl + R, Ctrl + Shift + R
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isF5 = e.key === "F5";
      const isCtrlR = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r";

      if (isF5 || isCtrlR) {
        e.preventDefault();
        executeFullHardRefresh();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [executeFullHardRefresh]);

  // Mouse and Touch Pull-to-Refresh Listeners
  useEffect(() => {
    const isAtTop = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      return scrollY <= 2;
    };

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      if (isAtTop()) {
        pullStartRef.current = { y: e.touches[0].clientY, active: true };
      } else {
        pullStartRef.current.active = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pullStartRef.current.active || isRefreshing) return;
      if (!isAtTop()) {
        pullStartRef.current.active = false;
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - pullStartRef.current.y;

      if (deltaY > 0) {
        // Apply smooth resistance curve
        const pull = Math.min(95, Math.pow(deltaY, 0.85) * 1.5);
        setPullDistance(pull);
        setIsPulling(true);
        if (pull > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    const handleTouchEnd = () => {
      if (!pullStartRef.current.active || isRefreshing) return;
      pullStartRef.current.active = false;

      if (pullDistance >= THRESHOLD) {
        executeFullHardRefresh();
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    // Mouse drag handlers (Hold mouse near top and pull downwards)
    const handleMouseDown = (e: MouseEvent) => {
      if (isRefreshing) return;
      // Allow mouse pull when initiated near top (top 150px) and scroll is at top
      if (isAtTop() && e.clientY < 180 && e.button === 0) {
        const target = e.target as HTMLElement;
        // Don't intercept button clicks or inputs
        if (target.closest("button") || target.closest("input") || target.closest("a") || target.closest("select")) {
          return;
        }
        pullStartRef.current = { y: e.clientY, active: true };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!pullStartRef.current.active || isRefreshing) return;
      if (!isAtTop()) {
        pullStartRef.current.active = false;
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      const deltaY = e.clientY - pullStartRef.current.y;
      if (deltaY > 0) {
        const pull = Math.min(95, Math.pow(deltaY, 0.85) * 1.5);
        setPullDistance(pull);
        setIsPulling(true);
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    const handleMouseUp = () => {
      if (!pullStartRef.current.active || isRefreshing) return;
      pullStartRef.current.active = false;

      if (pullDistance >= THRESHOLD) {
        executeFullHardRefresh();
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isRefreshing, pullDistance, THRESHOLD, executeFullHardRefresh]);

  const isReady = pullDistance >= THRESHOLD;
  const rotationAngle = Math.min(360, (pullDistance / THRESHOLD) * 270);

  if (!isPulling && !isRefreshing && pullDistance === 0) {
    return null;
  }

  return (
    <div
      style={{
        transform: `translate(-50%, ${Math.min(pullDistance - 50, 20)}px)`,
        opacity: Math.min(1, pullDistance / 25),
      }}
      className="fixed top-2 left-1/2 z-[99999] pointer-events-none transition-transform duration-75 ease-out select-none"
    >
      <div className="kaspi-polar-aurora-orbit flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-950/95 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-emerald-500/10 text-white font-sans text-xs">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            isReady || isRefreshing ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30" : "bg-white/10 text-zinc-300"
          }`}
        >
          {isRefreshing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : isReady ? (
            <Sparkles className="w-3.5 h-3.5 animate-bounce" />
          ) : (
            <ArrowDown
              style={{ transform: `rotate(${rotationAngle}deg)` }}
              className="w-3.5 h-3.5 transition-transform duration-75"
            />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-bold text-[11px] sm:text-xs tracking-tight text-zinc-100 truncate">
            {isRefreshing
              ? isAr
                ? "جارٍ التحديث الشامل وجلب آخر نسخة..."
                : isFr
                ? "Actualisation complète en cours..."
                : "Hard refreshing latest version..."
              : isReady
              ? isAr
                ? "أفلت الماوس الآن لتحديث التطبيق"
                : isFr
                ? "Relâchez pour actualiser"
                : "Release to hard refresh"
              : isAr
              ? "اسحب للأسفل للتحديث الشامل"
              : isFr
              ? "Glissez vers le bas pour actualiser"
              : "Pull down to hard refresh"}
          </span>
          <span className="text-[9px] text-zinc-400 font-mono">
            {isRefreshing
              ? isAr
                ? "مسح الكاش وجلب التحديثات الجديدة"
                : "Vidage du cache et nouveaux bundles"
              : "Ctrl + F5"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default KaspiPullToRefresh;
