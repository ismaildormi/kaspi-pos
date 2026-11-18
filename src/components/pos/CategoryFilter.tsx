"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { LayoutGrid } from "lucide-react";
import { usePosStore } from "@/client/store/usePosStore";

export interface PosCategory {
  id: string;
  name: string;
  productCount?: number;
}

interface CategoryFilterProps {
  categories: PosCategory[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories }) => {
  const t = useTranslations("Pos");
  const { activeCategoryId, setActiveCategory } = usePosStore();

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 px-1.5 scrollbar-none select-none touch-scroll-x">
      <button
        onClick={() => setActiveCategory(null)}
        className={`flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 touch-manipulation border ${
          activeCategoryId === null
            ? "kaspi-glass-btn kaspi-orbit-active text-[var(--kaspi-text-primary)] font-bold border-emerald-500/40 shadow-sm"
            : "kaspi-glass-surface text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)] border-white/[0.08] hover:border-white/20"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>{t("allCategories")}</span>
      </button>

      {categories.map((cat) => {
        const isActive = activeCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 touch-manipulation border ${
              isActive
                ? "kaspi-glass-btn kaspi-orbit-active text-[var(--kaspi-text-primary)] font-bold border-emerald-500/40 shadow-sm"
                : "kaspi-glass-surface text-[var(--kaspi-text-secondary)] hover:text-[var(--kaspi-text-primary)] border-white/[0.08] hover:border-white/20"
            }`}
          >
            <span>{cat.name}</span>
            {cat.productCount !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? "bg-black text-white font-bold" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {cat.productCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
