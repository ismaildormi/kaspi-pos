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
    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none select-none">
      <button
        onClick={() => setActiveCategory(null)}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
          activeCategoryId === null
            ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]"
            : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>{t("allCategories")}</span>
      </button>

      {categories.map((cat) => {
        const isActive = activeCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              isActive
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
            }`}
          >
            <span>{cat.name}</span>
            {cat.productCount !== undefined && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-slate-900/40 text-slate-950 font-bold" : "bg-slate-700 text-slate-300"
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
