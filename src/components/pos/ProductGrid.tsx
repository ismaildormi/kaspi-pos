"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Package, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { playBarcodeScanSound } from "@/lib/audio";
import { useAppDictionary } from "@/i18n/schema";

export const MOROCCAN_GROCERY_DEMO_ITEMS: PosProduct[] = [
  {
    id: "demo-gro-01",
    name: "Huile d'Olive Extra Vierge Atlas 1L",
    sku: "DEMO-GRO-01",
    barcode: "6111000900011",
    salePrice: 85.0,
    wholesalePrice: 80.0,
    stockQuantity: 48,
    trackStock: true,
    taxRate: 20,
    categoryId: "grocery",
    categoryName: "Épicerie & Huiles",
  },
  {
    id: "demo-gro-02",
    name: "Thé Vert Sultan Habka 200g",
    sku: "DEMO-GRO-02",
    barcode: "6111000900028",
    salePrice: 18.5,
    wholesalePrice: 17.0,
    stockQuantity: 120,
    trackStock: true,
    taxRate: 7,
    categoryId: "grocery",
    categoryName: "Thé & Café",
  },
  {
    id: "demo-gro-03",
    name: "Amlou Beldi aux Amandes & Argan 500g",
    sku: "DEMO-GRO-03",
    barcode: "6111000900035",
    salePrice: 110.0,
    wholesalePrice: 102.0,
    stockQuantity: 30,
    trackStock: true,
    taxRate: 20,
    categoryId: "grocery",
    categoryName: "Tartinables & Terroir",
  },
  {
    id: "demo-gro-04",
    name: "Lait UHT Centrale Entier 1L",
    sku: "DEMO-GRO-04",
    barcode: "6111000900042",
    salePrice: 6.5,
    wholesalePrice: 6.0,
    stockQuantity: 180,
    trackStock: true,
    taxRate: 14,
    categoryId: "grocery",
    categoryName: "Laiterie & Frais",
  },
  {
    id: "demo-gro-05",
    name: "Farine Finot Supérieure 5kg",
    sku: "DEMO-GRO-05",
    barcode: "6111000900059",
    salePrice: 42.0,
    wholesalePrice: 39.5,
    stockQuantity: 65,
    trackStock: true,
    taxRate: 0,
    categoryId: "grocery",
    categoryName: "Farines & Semoules",
  },
  {
    id: "demo-gro-06",
    name: "Eau Minérale Sidi Ali 1.5L",
    sku: "DEMO-GRO-06",
    barcode: "6111000900066",
    salePrice: 6.0,
    wholesalePrice: 5.5,
    stockQuantity: 240,
    trackStock: true,
    taxRate: 7,
    categoryId: "grocery",
    categoryName: "Boissons & Eaux",
  },
  {
    id: "demo-gro-07",
    name: "Sucre Morceaux Tigre 1kg",
    sku: "DEMO-GRO-07",
    barcode: "6111000900073",
    salePrice: 6.0,
    wholesalePrice: 5.75,
    stockQuantity: 150,
    trackStock: true,
    taxRate: 0,
    categoryId: "grocery",
    categoryName: "Épicerie de Base",
  },
  {
    id: "demo-gro-08",
    name: "Café Moulu Dubois Gold 250g",
    sku: "DEMO-GRO-08",
    barcode: "6111000900080",
    salePrice: 28.0,
    wholesalePrice: 26.0,
    stockQuantity: 85,
    trackStock: true,
    taxRate: 20,
    categoryId: "grocery",
    categoryName: "Thé & Café",
  },
];

interface ProductGridProps {
  products: PosProduct[];
  onOpenQuickAdd?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onOpenQuickAdd }) => {
  const t = useTranslations("Pos");
  const tCommon = useTranslations("Common");
  const { locale } = useAppDictionary();
  const { searchQuery, activeCategoryId, addToCart, storeType, cart } = usePosStore();

  const baseProducts = useMemo(() => {
    if (storeType === "grocery") {
      const nonGrocerySkus = ["DEMO-RES-", "DEMO-FAS-", "DEMO-ELC-", "DEMO-BUT-", "DEMO-BAK-"];
      const filtered = products.filter(
        (p) =>
          !nonGrocerySkus.some(
            (prefix) =>
              p.sku?.toUpperCase().startsWith(prefix) ||
              p.barcode?.toUpperCase().startsWith(prefix)
          )
      );

      const hasDemo = filtered.some((p) => p.sku?.startsWith("DEMO-GRO-"));
      if (hasDemo || filtered.length === 0) {
        const existingSkus = new Set(filtered.map((p) => p.sku));
        const missingDemos = MOROCCAN_GROCERY_DEMO_ITEMS.filter((d) => !existingSkus.has(d.sku));
        return [...filtered, ...missingDemos];
      }
      return filtered;
    }
    return products;
  }, [products, storeType]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const isCommand = q.startsWith("/");

    return baseProducts.filter((p) => {
      if (activeCategoryId && p.categoryId !== activeCategoryId) {
        return false;
      }
      if (q && !isCommand) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
        return matchName || matchSku || matchBarcode;
      }
      return true;
    });
  }, [baseProducts, activeCategoryId, searchQuery]);

  if (filteredProducts.length === 0) {
    const emptyI18n = {
      ar: {
        title: "لا توجد منتجات مطابقة",
        subtitle: "أضف منتجاتك من الكتالوج أو قم باستيراد ملف Excel و CSV مباشرة",
        manage: "كتالوج المنتجات",
        import: "استيراد CSV",
      },
      fr: {
        title: "Aucun article trouvé",
        subtitle: "Ajoutez vos articles depuis le catalogue ou importez un fichier Excel/CSV",
        manage: "Gérer les Produits",
        import: "Importer CSV",
      },
      en: {
        title: "No products found",
        subtitle: "Add items from the catalog or import an Excel/CSV file directly",
        manage: "Manage Products",
        import: "Import CSV",
      },
    }[locale] || {
      title: "No products found",
      subtitle: "Add items from the catalog or import an Excel/CSV file directly",
      manage: "Manage Products",
      import: "Import CSV",
    };

    return (
      <div className="group h-80 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-2xl p-8 text-center select-none bg-zinc-900/30 bg-dot-matrix relative overflow-hidden transition-all duration-300">
        {/* Soft Radial Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_75%)] transition-all duration-500 pointer-events-none" />

        {/* Interactive Multi-Ring Kinetic Badge */}
        <div className="relative mb-4 cursor-pointer">
          {/* Outer ring scales and illuminates on hover */}
          <div className="absolute -inset-3 rounded-3xl border border-white/5 group-hover:border-white/30 group-hover:scale-105 transition-all duration-500 bg-white/[0.02]" />
          
          {/* Inner 3D Container with sweeping laser */}
          <div className="relative w-14 h-14 rounded-2xl bg-zinc-900/90 border border-white/15 flex items-center justify-center text-white shadow-xl overflow-hidden group-hover:border-white/40 transition-colors">
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent top-0 animate-laser pointer-events-none opacity-60" />
            <Package className="w-6 h-6 stroke-[1.8] group-hover:-translate-y-1 transition-transform duration-300 text-white" />
          </div>
        </div>

        <p className="text-sm font-bold text-white tracking-tight">{emptyI18n.title}</p>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          {emptyI18n.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          {onOpenQuickAdd && (
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="sheen-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{locale === "ar" ? "+ منتج جديد" : locale === "en" ? "+ New Product" : "+ Nouvel Article"}</span>
            </button>
          )}
          <Link
            href={`/${locale}/dashboard/products`}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/10 hover:border-white/20 font-bold text-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <span>{emptyI18n.manage}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/${locale}/dashboard/products/import`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/10 hover:border-white/20 font-semibold text-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <span>{emptyI18n.import}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pb-4 select-none">
      {filteredProducts.map((product) => {
        const inCartItem = cart.find((i) => i.productId === product.id);
        const inCartQty = inCartItem ? inCartItem.quantity : 0;

        return (
          <button
            key={product.id}
            onClick={() => {
              playBarcodeScanSound();
              addToCart(product);
            }}
            className="group relative h-[142px] rounded-xl bg-[#0D1116] hover:bg-[#11171E] border border-white/[0.08] hover:border-[#14B8A6]/50 p-3.5 flex flex-col justify-between overflow-hidden transition-all duration-150 active:scale-[0.985] cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_20px_-8px_rgba(0,0,0,0.6)] text-start"
          >
            {/* Top 3px Square Department Accent Bar */}
            <div
              className="absolute top-0 inset-x-0 h-[3px] transition-opacity"
              style={{
                background: inCartQty > 0 ? "#14B8A6" : "rgba(20, 184, 166, 0.35)",
              }}
            />

            {/* Row 1 (Top Header of Tile): Left Icon Box + Right Stock/Cart Pill */}
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="w-9 h-9 rounded-lg bg-[#131920] border border-white/[0.07] flex items-center justify-center shrink-0 overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-[#2DD4BF]" />
                )}
              </div>

              {inCartQty > 0 ? (
                <span className="px-2.5 py-0.5 rounded-md bg-[#14B8A6] text-[#041E1B] font-mono font-black text-[11px] shadow-sm">
                  ×{inCartQty}
                </span>
              ) : (
                product.trackStock && (
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] font-mono text-[10.5px] font-semibold text-zinc-300">
                    Stock: {product.stockQuantity ?? 0}
                  </span>
                )
              )}
            </div>

            {/* Row 2 (Middle Title & Code) */}
            <div className="my-auto pt-1">
              <h3 className="font-sans font-semibold text-[13.5px] leading-[1.28] text-white line-clamp-2">
                {product.name}
              </h3>
            </div>

            {/* Row 3 (Bottom Price & Uniform Plus Keycap) */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between w-full">
              <div className="flex items-baseline">
                <span className="font-mono font-extrabold text-[15px] text-white tabular-nums tracking-tight">
                  {product.salePrice.toFixed(2)}
                </span>
                <span className="text-[10.5px] font-semibold text-zinc-400 ms-1">
                  MAD
                </span>
              </div>

              <div className="w-7 h-7 rounded-lg bg-[#151C24] group-hover:bg-[#14B8A6] text-zinc-300 group-hover:text-[#041E1B] border border-white/[0.08] group-hover:border-[#2DD4BF] flex items-center justify-center transition-colors">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
