"use client";

import React, { useState, useRef, useEffect } from "react";
import { Package, ChevronDown, Check, Plus, Minus, Layers } from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";

interface PackQuantityPopoverProps {
  locale?: string;
}

export const PRESET_PACKS = [
  { m: 1, labelAr: "×1 (وحدة)", labelFr: "×1 (Unité)", labelEn: "×1 (Unit)" },
  { m: 2, labelAr: "×2 (زوج)", labelFr: "×2 (Duo)", labelEn: "×2 (Duo)" },
  { m: 6, labelAr: "×6 (باك)", labelFr: "×6 (Pack)", labelEn: "×6 (Pack)" },
  { m: 12, labelAr: "×12 (كرتونة)", labelFr: "×12 (Carton)", labelEn: "×12 (Carton)" },
  { m: 24, labelAr: "×24 (صندوق)", labelFr: "×24 (Caisse)", labelEn: "×24 (Crate)" },
];

export const PackQuantityPopover: React.FC<PackQuantityPopoverProps> = ({ locale = "ar" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    scanMultiplier = 1,
    setScanMultiplier,
    cart,
    updateItemQuantity,
  } = usePosStore();

  const [customInput, setCustomInput] = useState<string>(String(scanMultiplier || 1));

  // Sync custom input whenever external multiplier changes
  useEffect(() => {
    setCustomInput(String(scanMultiplier || 1));
  }, [scanMultiplier]);

  // Click outside to dismiss popover
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectMultiplier = (m: number) => {
    const val = Math.max(1, Math.floor(m));
    if (setScanMultiplier) {
      setScanMultiplier(val);
    }
    // Also apply to last cart item if requested
    if (cart.length > 0 && val > 1) {
      const last = cart[cart.length - 1];
      updateItemQuantity(last.productId, val);
    }
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    const parsed = parseInt(customInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      handleSelectMultiplier(parsed);
    } else {
      handleSelectMultiplier(1);
    }
  };

  const handleIncrement = () => {
    const curr = parseInt(customInput, 10) || 1;
    setCustomInput(String(curr + 1));
  };

  const handleDecrement = () => {
    const curr = parseInt(customInput, 10) || 1;
    if (curr > 1) {
      setCustomInput(String(curr - 1));
    }
  };

  // Derive compact trigger label
  const getTriggerLabel = () => {
    const m = scanMultiplier || 1;
    if (m === 1) {
      return locale === "ar" ? "العبوة: ×1" : locale === "en" ? "Pack: ×1" : "Pack: ×1";
    }
    if (m === 2) return locale === "ar" ? "×2 زوج" : locale === "en" ? "×2 Duo" : "×2 Duo";
    if (m === 6) return locale === "ar" ? "×6 باك" : locale === "en" ? "×6 Pack" : "×6 Pack";
    if (m === 12) return locale === "ar" ? "×12 كرتونة" : locale === "en" ? "×12 Carton" : "×12 Carton";
    if (m === 24) return locale === "ar" ? "×24 صندوق" : locale === "en" ? "×24 Caisse" : "×24 Crate";
    return locale === "ar" ? `×${m} عبوة` : `×${m} Qty`;
  };

  const lastCartItem = cart.length > 0 ? cart[cart.length - 1] : null;

  return (
    <div ref={containerRef} className="relative inline-block text-start select-none shrink-0">
      {/* Compact Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 touch-manipulation ${
          isOpen || scanMultiplier > 1
            ? "kaspi-glass-btn kaspi-orbit-active text-[var(--kaspi-text-primary)] font-bold border-emerald-500/40 shadow-sm"
            : "kaspi-glass-surface text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)] border-white/[0.08] hover:border-white/20"
        }`}
        title={
          locale === "ar"
            ? "تحديد كمية العبوات والصناديق تلقائياً"
            : "Sélecteur de conditionnement & quantité"
        }
        aria-expanded={isOpen}
      >
        <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-mono text-[11px] font-bold whitespace-nowrap">{getTriggerLabel()}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable Glass Popover Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Pack Quantity Selector"
          className="absolute end-0 top-full mt-2 w-72 sm:w-80 p-3.5 rounded-2xl kaspi-opaque-glass-modal kaspi-polar-aurora-orbit border border-white/20 shadow-2xl z-50 space-y-3.5 animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--kaspi-text-primary)]">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {locale === "ar"
                  ? "حجم الصندوق والعبوة"
                  : locale === "en"
                  ? "Pack & Crate Multiplier"
                  : "Conditionnement & Colisage"}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              ×{scanMultiplier}
            </span>
          </div>

          {/* Preset Buttons Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
              {locale === "ar"
                ? "اختيار سريع جاهز:"
                : locale === "en"
                ? "Quick Presets:"
                : "Formats Standards :"}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PRESET_PACKS.map((p) => {
                const isActive = scanMultiplier === p.m;
                const label =
                  locale === "ar" ? p.labelAr : locale === "en" ? p.labelEn : p.labelFr;
                return (
                  <button
                    key={p.m}
                    type="button"
                    onClick={() => handleSelectMultiplier(p.m)}
                    className={`h-8 px-2 rounded-lg text-xs font-medium font-mono flex items-center justify-between transition-all cursor-pointer border ${
                      isActive
                        ? "kaspi-glass-btn kaspi-orbit-active text-white font-bold border-emerald-500/40 shadow-xs"
                        : "kaspi-glass-surface text-zinc-300 hover:text-white border-white/[0.06] hover:border-white/15"
                    }`}
                  >
                    <span>{label}</span>
                    {isActive && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Quantity Input Row */}
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <label
              htmlFor="kaspi-custom-pack-input"
              className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block"
            >
              {locale === "ar"
                ? "أو أدخل كمية مخصصة (اكتب رقمك):"
                : locale === "en"
                ? "Or type custom pack quantity:"
                : "Ou saisir une quantité libre :"}
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-8 h-8 rounded-lg kaspi-glass-surface border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer active:scale-95 shrink-0"
                title="Decrement"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                id="kaspi-custom-pack-input"
                type="number"
                min="1"
                max="9999"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyCustom();
                  }
                }}
                placeholder="1"
                className="flex-1 min-w-0 h-8 px-2.5 rounded-lg kaspi-glass-surface border border-white/15 text-center font-mono text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
              />

              <button
                type="button"
                onClick={handleIncrement}
                className="w-8 h-8 rounded-lg kaspi-glass-surface border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer active:scale-95 shrink-0"
                title="Increment"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleApplyCustom}
                className="h-8 px-3 rounded-lg kaspi-glass-btn text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{locale === "ar" ? "تطبيق" : "OK"}</span>
              </button>
            </div>
          </div>

          {/* Live Calculation Preview Note */}
          <div className="text-[11px] text-zinc-400 bg-white/[0.03] p-2 rounded-xl border border-white/[0.05] leading-relaxed">
            {locale === "ar" ? (
              <span>
                كل نقرة على المنتج ستضيف <strong className="text-emerald-400">×{scanMultiplier}</strong> قطع مباشرة بالسلة مع حساب السعر الإجمالي تلقائياً.
              </span>
            ) : locale === "en" ? (
              <span>
                Each item click will add <strong className="text-emerald-400">×{scanMultiplier}</strong> units to cart with automated total calculation.
              </span>
            ) : (
              <span>
                Chaque article ajouté sera multiplié par <strong className="text-emerald-400">×{scanMultiplier}</strong> avec calcul automatique du montant TTC.
              </span>
            )}
          </div>

          {/* Quick Apply to Last Cart Item if Present */}
          {lastCartItem && (
            <button
              type="button"
              onClick={() => {
                updateItemQuantity(lastCartItem.productId, scanMultiplier);
                setIsOpen(false);
              }}
              className="w-full py-1.5 px-2.5 rounded-xl text-start kaspi-glass-surface border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer text-[11px] flex items-center justify-between gap-2"
            >
              <span className="truncate text-zinc-300">
                {locale === "ar" ? "تطبيق على آخر سلعة:" : "Appliquer au dernier article :"} {" "}
                <strong className="text-white">{lastCartItem.name}</strong>
              </span>
              <span className="font-mono text-emerald-400 font-bold shrink-0">
                {(lastCartItem.unitPrice * scanMultiplier).toFixed(2)} MAD
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PackQuantityPopover;
