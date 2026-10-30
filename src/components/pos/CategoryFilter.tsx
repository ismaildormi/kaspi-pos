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
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
          activeCategoryId === null
            ? "bg-white text-black shadow-sm"
            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? "bg-white text-black shadow-sm"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
            }`}
          >
            <span>{cat.name}</span>
            {cat.productCount !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
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
