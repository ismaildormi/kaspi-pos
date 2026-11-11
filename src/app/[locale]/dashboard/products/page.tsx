"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import {
  Package,
  FileSpreadsheet,
  Sparkles,
  Search,
  MoreVertical,
  Image as ImageIcon,
  DollarSign,
  Loader2,
  X,
  Check,
  LayoutGrid,
  List,
  Barcode,
  Upload,
  Plus,
  Printer,
} from "lucide-react";
import { generateProductImageUrl } from "@/lib/pollinations";
import { uploadProductImage } from "@/lib/supabase-storage";
import { useAppDictionary } from "@/i18n/schema";
import { getCachedData, setCachedData } from "@/lib/cache/client-cache";
import { usePosStore } from "@/client/store/usePosStore";
import { KineticProductCubeBarcodeEmpty } from "@/components/ui/KineticEmptyState";
import { FloatingCommerceCanvas } from "@/components/ui/FloatingCommerceCanvas";
import { MOROCCAN_GROCERY_DEMO_ITEMS } from "@/components/pos/ProductGrid";
import {
  Scale,
  Shirt,
  Smartphone,
  UtensilsCrossed,
  Boxes,
  Calendar,
  ShieldCheck,
} from "lucide-react";

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  imageUrl?: string | null;
  salePrice: number;
  wholesalePrice?: number | null;
  taxRate: number;
  trackStock: boolean;
  stockQuantity?: number;
  categoryId?: string | null;
  categoryName?: string | null;
}

export default function ProductsListPage() {
  const { t, locale } = useAppDictionary();
  const [products, setProducts] = useState<CatalogProduct[]>(() => {
    return getCachedData<CatalogProduct[]>("products_catalog", []).data;
  });
  const [isLoading, setIsLoading] = useState(() => {
    return !getCachedData<CatalogProduct[]>("products_catalog", []).isCached;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // 3-Dot Dropdown State
  const [openMenuProductId, setOpenMenuProductId] = useState<string | null>(
    null
  );
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  // Per-Product Loading State (for AI Image Gen or inline updates)
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null
  );

  // Modal State: Change Image URL
  const [imageModalProduct, setImageModalProduct] =
    useState<CatalogProduct | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isUploadingToSupabase, setIsUploadingToSupabase] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal State: Edit Price
  const [priceModalProduct, setPriceModalProduct] =
    useState<CatalogProduct | null>(null);
  const [newSalePrice, setNewSalePrice] = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Pos Store Sector Type
  const { storeType } = usePosStore();

  // Modal State: Create New Product
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSku, setCreateSku] = useState("");
  const [createBarcode, setCreateBarcode] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [createSalePrice, setCreateSalePrice] = useState("");
  const [createWholesalePrice, setCreateWholesalePrice] = useState("");
  const [createCostPrice, setCreateCostPrice] = useState("");
  const [createTaxRate, setCreateTaxRate] = useState("20");
  const [createInitialStock, setCreateInitialStock] = useState("25");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Sector-Specific Product Field States
  const [createUnit, setCreateUnit] = useState<"piece" | "kg" | "g">("piece");
  const [createScalePlu, setCreateScalePlu] = useState("");
  const [createExpiryDate, setCreateExpiryDate] = useState("");
  const [createAisle, setCreateAisle] = useState("");
  const [createPackPrice, setCreatePackPrice] = useState("");
  const [createFashionSize, setCreateFashionSize] = useState("");
  const [createFashionColor, setCreateFashionColor] = useState("");
  const [createSerialImei, setCreateSerialImei] = useState("");
  const [createWarrantyMonths, setCreateWarrantyMonths] = useState("12");
  const [createPrepStation, setCreatePrepStation] = useState("cuisine");
  const [createCartonPackQty, setCreateCartonPackQty] = useState("");

  const handlePrintProductBarcode = (product: CatalogProduct) => {
    setOpenMenuProductId(null);
    const code = product.barcode || product.sku || "6111000010017";
    const win = window.open("", "_blank", "width=420,height=320");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Étiquette ${product.name}</title>
          <style>
            @page { size: 40mm 30mm; margin: 0; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 3mm; text-align: center; }
            .shop { font-size: 8pt; font-weight: bold; text-transform: uppercase; }
            .name { font-size: 9pt; font-weight: bold; margin: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .price { font-size: 13pt; font-weight: 900; margin: 2px 0; }
            .bars { font-family: monospace; letter-spacing: 2px; font-size: 9pt; margin-top: 2px; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 400);">
          <div class="shop">KASPI POS</div>
          <div class="name">${product.name}</div>
          <div class="price">${Number(product.salePrice).toFixed(2)} DH</div>
          <svg width="135" height="30" viewBox="0 0 135 30">
            ${Array.from({ length: 28 })
              .map((_, idx) => {
                const w = (idx + code.charCodeAt(idx % code.length)) % 3 === 0 ? 3 : 1.5;
                return `<rect x="${idx * 4.6 + 4}" y="2" width="${w}" height="26" fill="#000" />`;
              })
              .join("")}
          </svg>
          <div class="bars">${code}</div>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setIsCreatingProduct(true);

    const optimisticProduct: CatalogProduct = {
      id: crypto.randomUUID(),
      name: createName.trim(),
      sku: createSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: createBarcode.trim() || null,
      categoryName: createCategory.trim() || null,
      salePrice: parseFloat(createSalePrice) || 0,
      wholesalePrice: createWholesalePrice ? parseFloat(createWholesalePrice) : null,
      taxRate: parseFloat(createTaxRate) || 20,
      trackStock: true,
      stockQuantity: parseFloat(createInitialStock) || 0,
    };

    // Optimistic UI update in 0ms
    setProducts((prev) => {
      const updated = [optimisticProduct, ...prev];
      setCachedData("products_catalog", updated);
      return updated;
    });

    try {
      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          sku: createSku.trim() || undefined,
          barcode: createBarcode.trim() || undefined,
          categoryName: createCategory.trim() || undefined,
          salePrice: parseFloat(createSalePrice) || 0,
          wholesalePrice: createWholesalePrice ? parseFloat(createWholesalePrice) : undefined,
          costPrice: createCostPrice ? parseFloat(createCostPrice) : undefined,
          taxRate: parseFloat(createTaxRate) || 20,
          initialStock: parseFloat(createInitialStock) || 0,
          unit: createUnit,
          scalePlu: createScalePlu.trim() || undefined,
          expiryDate: createExpiryDate || undefined,
          fashionSize: createFashionSize.trim() || undefined,
          fashionColor: createFashionColor.trim() || undefined,
          serialImei: createSerialImei.trim() || undefined,
          warrantyMonths: createWarrantyMonths ? parseInt(createWarrantyMonths) : undefined,
          prepStation: createPrepStation,
          cartonPackQty: createCartonPackQty ? parseInt(createCartonPackQty) : undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(
          locale === "ar"
            ? "تعذر إضافة المنتج إلى الكتالوج"
            : locale === "en"
            ? "Unable to create product"
            : "Impossible de créer le produit"
        );
      }
      toast.success(
        locale === "ar"
          ? "تمت إضافة المنتج إلى الكتالوج بنجاح"
          : locale === "en"
          ? "Product created successfully"
          : "Produit ajouté au catalogue avec succès !"
      );
      setIsCreateModalOpen(false);
      setCreateName("");
      setCreateSku("");
      setCreateBarcode("");
      setCreateCategory("");
      setCreateSalePrice("");
      setCreateWholesalePrice("");
      setCreateCostPrice("");
      setCreateInitialStock("25");
      setCreateUnit("piece");
      setCreateScalePlu("");
      setCreateExpiryDate("");
      setCreateFashionSize("");
      setCreateFashionColor("");
      setCreateSerialImei("");
      setCreateWarrantyMonths("12");
      setCreatePrepStation("cuisine");
      setCreateCartonPackQty("");
      await fetchProducts(true);
    } catch (err: any) {
      toast.error(
        err.message ||
          (locale === "ar"
            ? "حدث خطأ أثناء إنشاء المنتج"
            : locale === "en"
            ? "Error while creating product"
            : "Erreur lors de la création")
      );
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Fetch Products on Mount (Stale-While-Revalidate with Local Cache)
  const fetchProducts = async (isBackground = false) => {
    if (!isBackground) {
      const hasCached = getCachedData<CatalogProduct[]>("products_catalog", []).isCached;
      if (!hasCached) setIsLoading(true);
    }
    try {
      const res = await fetch("/api/v1/products");
      if (res.ok) {
        const json = await res.json();
        const list: CatalogProduct[] = json.data?.products || json.products || [];
        setProducts(list);
        setCachedData("products_catalog", list);
      }
    } catch {
      console.warn("[Products] Network error during silent revalidation");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Close 3-dot dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setOpenMenuProductId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Action: Generate AI Image via Pollinations.ai (100% Free, No API Key)
  const handleGenerateAiImage = async (product: CatalogProduct) => {
    setOpenMenuProductId(null);
    setUpdatingProductId(product.id);

    try {
      const aiImageUrl = generateProductImageUrl(product.name);

      const res = await fetch(`/api/v1/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: aiImageUrl }),
      });

      if (!res.ok) {
        throw new Error("Failed to save AI image");
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, imageUrl: aiImageUrl } : p
        )
      );

      toast.success("Image updated successfully", {
        description: `AI photo generated for ${product.name}`,
      });
    } catch {
      toast.error("Failed to generate AI image");
    } finally {
      setUpdatingProductId(null);
    }
  };

  // 2. Action: Open & Save Custom Image URL Modal
  const openImageModal = (product: CatalogProduct) => {
    setOpenMenuProductId(null);
    setImageModalProduct(product);
    setNewImageUrl(product.imageUrl || "");
  };

  const handleSaveCustomImageUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageModalProduct) return;

    setIsSavingImage(true);
    setUpdatingProductId(imageModalProduct.id);

    try {
      const trimmedUrl = newImageUrl.trim() || null;
      const res = await fetch(`/api/v1/products/${imageModalProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: trimmedUrl }),
      });

      if (!res.ok) {
        throw new Error("Failed to update image URL");
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === imageModalProduct.id ? { ...p, imageUrl: trimmedUrl } : p
        )
      );

      toast.success("Image updated successfully");
      setImageModalProduct(null);
    } catch {
      toast.error("Could not update product image");
    } finally {
      setIsSavingImage(false);
      setUpdatingProductId(null);
    }
  };

  const handleFileUploadToSupabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageModalProduct) return;

    setIsUploadingToSupabase(true);
    const toastId = toast.loading("Téléversement vers Supabase Storage...");
    try {
      const publicUrl = await uploadProductImage(file, "tenant-default");
      setNewImageUrl(publicUrl);
      toast.success("Image uploadée sur Supabase Storage avec succès !", { id: toastId });
    } catch (err: any) {
      console.error("[Supabase Storage Error]:", err);
      toast.error(err.message || "Échec de l'upload vers Supabase", { id: toastId });
    } finally {
      setIsUploadingToSupabase(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 3. Action: Open & Save Edit Price Modal
  const openPriceModal = (product: CatalogProduct) => {
    setOpenMenuProductId(null);
    setPriceModalProduct(product);
    setNewSalePrice(Number(product.salePrice).toFixed(2));
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalProduct) return;

    const parsedPrice = parseFloat(newSalePrice);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Please enter a valid price in MAD");
      return;
    }

    setIsSavingPrice(true);
    setUpdatingProductId(priceModalProduct.id);

    try {
      const res = await fetch(`/api/v1/products/${priceModalProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salePrice: parsedPrice }),
      });

      if (!res.ok) {
        throw new Error("Failed to update price");
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === priceModalProduct.id ? { ...p, salePrice: parsedPrice } : p
        )
      );

      toast.success("Price updated");
      setPriceModalProduct(null);
    } catch {
      toast.error("Failed to update product price");
    } finally {
      setIsSavingPrice(false);
      setUpdatingProductId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (storeType === "grocery") {
      const nonGrocerySkus = ["DEMO-RES-", "DEMO-FAS-", "DEMO-ELC-", "DEMO-BUT-", "DEMO-BAK-"];
      list = list.filter((p) => {
        const code = ((p.sku || "") + (p.barcode || "")).toUpperCase();
        return !nonGrocerySkus.some((prefix) => code.includes(prefix));
      });
      const hasDemo = list.some((p) => p.sku?.startsWith("DEMO-GRO-"));
      if (hasDemo || list.length === 0) {
        const existingSkus = new Set(list.map((p) => p.sku));
        const missing = MOROCCAN_GROCERY_DEMO_ITEMS.filter((d) => !existingSkus.has(d.sku)).map((d) => ({
          id: d.id,
          name: d.name,
          sku: d.sku,
          barcode: d.barcode,
          salePrice: d.salePrice,
          wholesalePrice: d.wholesalePrice,
          taxRate: d.taxRate || 20,
          trackStock: true,
          stockQuantity: d.stockQuantity,
          categoryName: d.categoryName,
        }));
        list = [...list, ...missing];
      }
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        Boolean(p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [products, searchQuery, storeType]);

  return (
    <div dir="ltr" className="space-y-8 select-none">
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "#09090b",
            color: "#ffffff",
            border: "1px solid #27272a",
          },
        }}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Package className="h-6 w-6 text-white" />
            <span>{t.products.title}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t.products.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="group sheen-btn inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] px-4 py-2 text-xs font-bold text-zinc-950 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300" />
            <span>{t.products.addProduct}</span>
          </button>
          <Link
            href={`/${locale}/dashboard/products/ai-onboard`}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 hover:-translate-y-0.5 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
            <span>{t.products.aiStudio}</span>
          </Link>
          <Link
            href={`/${locale}/dashboard/products/import`}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-zinc-900/90 hover:bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:-translate-y-0.5 transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white group-hover:scale-105 transition-all duration-200" />
            <span>{t.dashboard.importExcel}</span>
          </Link>
        </div>
      </div>

      {/* Filter & View Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.products.searchPlaceholder}
            className="w-full h-10 ps-10 pe-9 bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
            {filteredProducts.length} {t.products.productsCount}
          </span>

          <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading / Empty States */}
      {isLoading ? (
        <div className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
          <span className="text-xs font-medium">
            {t.products.loadingCatalog}
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="relative py-14 rounded-3xl border border-white/10 bg-zinc-900/40 text-center select-none overflow-hidden">
          <FloatingCommerceCanvas opacity="opacity-10" />
          <div className="relative z-10">
            <KineticProductCubeBarcodeEmpty
              title={t.products.noProductsFound}
              subtitle={t.products.noProductsSub}
            />
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* ====================================================================
           PREMIUM MONOCHROME PRODUCT GRID WITH 3-DOT MENU
           ==================================================================== */
        <div
          ref={menuContainerRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredProducts.map((product) => {
            const isUpdating = updatingProductId === product.id;
            const initial = (product.name || "P").charAt(0).toUpperCase();
            const isMenuOpen = openMenuProductId === product.id;

            return (
              <div
                key={product.id}
                className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 transition-all flex flex-col overflow- visible"
              >
                {/* Product Image Container */}
                <div className="relative h-44 w-full bg-zinc-950 rounded-t-2xl overflow-hidden border-b border-zinc-800 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-600">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-black text-white">
                        {initial}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {t.products.noPhoto}
                      </span>
                    </div>
                  )}

                  {/* Loading Overlay when AI Image or Price is updating */}
                  {isUpdating && (
                    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                      <span className="text-[11px] font-bold text-white">
                        {t.products.updating}
                      </span>
                    </div>
                  )}

                  {/* Category Badge */}
                  {product.categoryName && (
                    <span className="absolute top-3 start-3 px-2.5 py-1 rounded-lg bg-zinc-950/90 border border-zinc-800 text-[10px] font-bold text-zinc-300">
                      {product.categoryName}
                    </span>
                  )}

                  {/* 3-Dot Action Button */}
                  <div className="absolute top-2.5 end-2.5 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuProductId(isMenuOpen ? null : product.id);
                      }}
                      disabled={isUpdating}
                      className="h-8 w-8 rounded-xl bg-zinc-950/90 hover:bg-white text-zinc-200 hover:text-black border border-zinc-800 flex items-center justify-center transition cursor-pointer"
                      aria-label="Product options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* 3-Dot Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute end-0 mt-2 w-60 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl py-1.5 z-50 divide-y divide-zinc-900">
                        <button
                          type="button"
                          onClick={() => handleGenerateAiImage(product)}
                          className="w-full px-3.5 py-2.5 text-start text-xs font-semibold text-white hover:bg-zinc-900 flex items-center justify-between gap-2 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
                            <span>{t.products.generateAiImage}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openImageModal(product)}
                          className="w-full px-3.5 py-2.5 text-start text-xs font-semibold text-zinc-200 hover:bg-zinc-900 hover:text-white flex items-center justify-between gap-2 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>{t.products.changeImage}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openPriceModal(product)}
                          className="w-full px-3.5 py-2.5 text-start text-xs font-semibold text-zinc-200 hover:bg-zinc-900 hover:text-white flex items-center justify-between gap-2 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>{t.products.editPrice}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintProductBarcode(product)}
                          className="w-full px-3.5 py-2.5 text-start text-xs font-semibold text-amber-300 hover:bg-zinc-900 flex items-center justify-between gap-2 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Printer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{t.products.printBarcodeLabel}</span>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Details Footer */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-zinc-400">
                      <span>SKU: {product.sku}</span>
                      {product.barcode && (
                        <span className="inline-flex items-center gap-1 text-zinc-500">
                          • <Barcode className="w-3 h-3" /> {product.barcode}
                        </span>
                      )}
                    </div>
                    {storeType === "grocery" && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-mono font-bold">
                          {locale === "ar" ? "هامش ~24%" : "Marge ~24%"}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-mono">
                          {product.categoryName || (locale === "ar" ? "جناح عام" : "Rayon Général")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                        {t.products.priceTtc}
                      </span>
                      <span className="text-base font-black font-mono text-white">
                        {Number(product.salePrice).toFixed(2)}{" "}
                        <span className="text-xs font-normal text-zinc-400">
                          MAD
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePrintProductBarcode(product)}
                        title={locale === "ar" ? "طباعة ملصق الرف 40×30mm" : "Imprimer Étiquette Rayon 40×30mm"}
                        className="h-9 px-2.5 rounded-lg bg-[#0D1116] hover:bg-[#14B8A6] text-zinc-300 hover:text-[#041E1B] border border-white/[0.08] hover:border-[#14B8A6] flex items-center justify-center gap-1.5 text-xs font-semibold transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-mono">40×30mm</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openPriceModal(product)}
                        className="h-9 px-3 rounded-lg bg-[#0D1116] hover:bg-white text-zinc-300 hover:text-black border border-white/[0.08] text-xs font-bold transition cursor-pointer"
                      >
                        {locale === "ar" ? "تعديل الثمن" : "Prix"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ====================================================================
           MONOCHROME TABLE VIEW WITH 3-DOT MENU
           ==================================================================== */
        <div
          ref={menuContainerRef}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-visible"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 text-start font-semibold">
                    {t.inventory.productName}
                  </th>
                  <th className="py-3.5 px-4 text-start font-semibold">
                    {t.products.sku} / {t.products.barcode}
                  </th>
                  <th className="py-3.5 px-4 text-start font-semibold">
                    {t.products.category}
                  </th>
                  <th className="py-3.5 px-4 text-end font-semibold">
                    {t.products.salePrice} (MAD)
                  </th>
                  <th className="py-3.5 px-4 text-end font-semibold w-16">
                    {t.common.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {filteredProducts.map((p) => {
                  const isUpdating = updatingProductId === p.id;
                  const isMenuOpen = openMenuProductId === p.id;
                  const initial = (p.name || "P").charAt(0).toUpperCase();

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-950/40 transition relative"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-black text-white">
                                {initial}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-white">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        {p.sku}
                        {p.barcode ? ` • ${p.barcode}` : ""}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {p.categoryName || "Général"}
                      </td>
                      <td className="py-3 px-4 text-end font-mono font-bold text-white">
                        {Number(p.salePrice).toFixed(2)} MAD
                      </td>
                      <td className="py-3 px-4 text-end relative">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintProductBarcode(p)}
                            title={locale === "ar" ? "طباعة ملصق الرف 40×30mm" : "Imprimer Étiquette Rayon 40×30mm"}
                            className="h-9 px-2.5 rounded-lg bg-[#0D1116] hover:bg-[#14B8A6] text-zinc-300 hover:text-[#041E1B] border border-white/[0.08] hover:border-[#14B8A6] inline-flex items-center justify-center gap-1.5 transition cursor-pointer text-xs font-semibold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px] font-mono">40×30mm</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuProductId(isMenuOpen ? null : p.id)
                            }
                            disabled={isUpdating}
                            className="h-9 w-9 rounded-lg bg-[#0D1116] hover:bg-white text-zinc-300 hover:text-black border border-white/[0.08] inline-flex items-center justify-center transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {isMenuOpen && (
                          <div className="absolute end-4 mt-2 w-60 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl py-1.5 z-50 divide-y divide-zinc-900 text-start">
                            <button
                              type="button"
                              onClick={() => handlePrintProductBarcode(p)}
                              className="w-full px-3.5 py-2.5 text-start text-xs font-semibold text-teal-300 hover:bg-zinc-900 flex items-center gap-2 transition cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                              <span>{locale === "ar" ? "طباعة ملصق الرف 40×30mm" : "Imprimer Étiquette Rayon 40×30mm"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenerateAiImage(p)}
                              className="w-full px-3.5 py-2.5 text-start text-xs font-semibold text-white hover:bg-zinc-900 flex items-center gap-2 transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
                              <span>توليد صورة بالذكاء الاصطناعي</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openImageModal(p)}
                              className="w-full px-3.5 py-2.5 text-start text-xs font-semibold text-zinc-200 hover:bg-zinc-900 flex items-center gap-2 transition cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span>تغيير الصورة</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openPriceModal(p)}
                              className="w-full px-3.5 py-2.5 text-start text-xs font-semibold text-zinc-200 hover:bg-zinc-900 flex items-center gap-2 transition cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span>تعديل الثمن</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
         MODAL 1: CHANGE IMAGE URL ("تغيير الصورة")
         ==================================================================== */}
      {imageModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {locale === "ar" ? "تغيير صورة المنتج" : locale === "fr" ? "Modifier l'image" : "Change Product Image"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {imageModalProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImageModalProduct(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomImageUrl} className="space-y-4">
              {/* Direct Supabase File Upload Option */}
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-4 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUploadToSupabase}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  id="supabase-product-file"
                />
                <label
                  htmlFor="supabase-product-file"
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-zinc-600 transition">
                    {isUploadingToSupabase ? (
                      <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:underline">
                      {isUploadingToSupabase
                        ? "جاري الرفع إلى Supabase..."
                        : "رفع صورة من جهازك (Supabase Storage)"}
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      PNG, JPG, WEBP jusqu&apos;à 5MB • Bucket: product-images
                    </p>
                  </div>
                </label>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                  أو رابط مباشر
                </span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  رابط الصورة (Image URL)
                </label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://tqoqsgaymygmgqrzddvtu.supabase.co/storage/..."
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-white rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              {newImageUrl.trim() && (
                <div className="h-36 w-full rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
                  <img
                    src={newImageUrl.trim()}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImageModalProduct(null)}
                  className="px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingImage}
                  className="px-5 py-2.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>حفظ الصورة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
         MODAL 2: EDIT PRICE ("تعديل الثمن")
         ==================================================================== */}
      {priceModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {locale === "ar" ? "تعديل سعر البيع" : locale === "fr" ? "Modifier le prix de vente" : "Edit Selling Price"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {priceModalProduct.name} ({priceModalProduct.sku})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPriceModalProduct(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  ثمن البيع الجديد (MAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newSalePrice}
                  onChange={(e) => setNewSalePrice(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-white rounded-lg text-base font-mono font-bold text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPriceModalProduct(null)}
                  className="px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrice}
                  className="px-5 py-2.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPrice ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>حفظ الثمن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
         MODAL 3: CREATE NEW PRODUCT ("+ Nouveau Produit")
         ==================================================================== */}
      {isCreateModalOpen && (() => {
        const modalI18n = {
          ar: {
            title: "إضافة منتج جديد",
            subtitle: "إنشاء مباشر مع رمز SKU، الباركود الدولي EAN-13 والمخزون الأولي",
            name: "اسم وتعيين المنتج *",
            namePlaceholder: "مثال: زيت زيتون بكر ممتاز 1 لتر",
            category: "القسم / التصنيف",
            categoryPlaceholder: "مثال: بقالة / مشروبات",
            sku: "رمز SKU (اختياري)",
            skuPlaceholder: "توليد تلقائي في حال تركه فارغاً",
            barcode: "رمز الباركود EAN-13",
            generateBarcode: "+ توليد باركود مغربي (611)",
            barcodePlaceholder: "امسح بالماسح أو ولّد كود EAN-13",
            salePrice: "سعر البيع للعموم (MAD) *",
            wholesalePrice: "سعر الجملة (MAD)",
            costPrice: "سعر الشراء والتكلفة (MAD)",
            initialStock: "المخزون الأولي",
            cancel: "إلغاء",
            submit: "حفظ المنتج في الكتالوج",
            submitting: "جاري الحفظ...",
          },
          fr: {
            title: "Nouveau Produit",
            subtitle: "Création directe avec SKU, Code-barres EAN-13 et stock initial",
            name: "Désignation du Produit *",
            namePlaceholder: "Ex: Huile d'Olive Extra Vierge 1L",
            category: "Catégorie / Rayon",
            categoryPlaceholder: "Ex: Épicerie / Boissons",
            sku: "Code SKU (Optionnel)",
            skuPlaceholder: "Auto-généré si vide",
            barcode: "Code-barres EAN-13",
            generateBarcode: "+ Générer EAN-13 Maroc (611)",
            barcodePlaceholder: "Scannez ou générez un code EAN-13",
            salePrice: "Prix Vente Détail (MAD) *",
            wholesalePrice: "Prix de Gros (MAD)",
            costPrice: "Prix d'Achat (MAD)",
            initialStock: "Stock Initial",
            cancel: "Annuler",
            submit: "Créer le Produit",
            submitting: "Création en cours...",
          },
          en: {
            title: "New Product",
            subtitle: "Direct product creation with SKU, EAN-13 barcode, and initial stock",
            name: "Product Name *",
            namePlaceholder: "e.g., Extra Virgin Olive Oil 1L",
            category: "Category / Department",
            categoryPlaceholder: "e.g., Grocery / Beverages",
            sku: "SKU Code (Optional)",
            skuPlaceholder: "Auto-generated if blank",
            barcode: "EAN-13 Barcode",
            generateBarcode: "+ Generate Moroccan EAN-13 (611)",
            barcodePlaceholder: "Scan or generate EAN-13 barcode",
            salePrice: "Retail Price (MAD) *",
            wholesalePrice: "Wholesale Price (MAD)",
            costPrice: "Cost / Purchase Price (MAD)",
            initialStock: "Initial Stock",
            cancel: "Cancel",
            submit: "Create Product",
            submitting: "Creating...",
          },
        }[locale] || {
          title: "New Product",
          subtitle: "Direct product creation with SKU, EAN-13 barcode, and initial stock",
          name: "Product Name *",
          namePlaceholder: "e.g., Extra Virgin Olive Oil 1L",
          category: "Category / Department",
          categoryPlaceholder: "e.g., Grocery / Beverages",
          sku: "SKU Code (Optional)",
          skuPlaceholder: "Auto-generated if blank",
          barcode: "EAN-13 Barcode",
          generateBarcode: "+ Generate Moroccan EAN-13 (611)",
          barcodePlaceholder: "Scan or generate EAN-13 barcode",
          salePrice: "Retail Price (MAD) *",
          wholesalePrice: "Wholesale Price (MAD)",
          costPrice: "Cost / Purchase Price (MAD)",
          initialStock: "Initial Stock",
          cancel: "Cancel",
          submit: "Create Product",
          submitting: "Creating...",
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl my-auto">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-white" />
                    <span>{modalI18n.title}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {modalI18n.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {modalI18n.name}
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder={modalI18n.namePlaceholder}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      {modalI18n.category}
                    </label>
                    <input
                      type="text"
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value)}
                      placeholder={modalI18n.categoryPlaceholder}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      {modalI18n.sku}
                    </label>
                    <input
                      type="text"
                      value={createSku}
                      onChange={(e) => setCreateSku(e.target.value)}
                      placeholder={modalI18n.skuPlaceholder}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      {modalI18n.barcode}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCreateBarcode(
                          `6111${Math.floor(100000000 + Math.random() * 899999999)}`
                        )
                      }
                      className="text-[11px] font-bold text-zinc-300 hover:text-white hover:underline cursor-pointer"
                    >
                      {modalI18n.generateBarcode}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={createBarcode}
                    onChange={(e) => setCreateBarcode(e.target.value)}
                    placeholder={modalI18n.barcodePlaceholder}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono focus:border-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      {modalI18n.salePrice}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={createSalePrice}
                      onChange={(e) => setCreateSalePrice(e.target.value)}
                      placeholder="85.00"
                      className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-white focus:border-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      {modalI18n.wholesalePrice}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createWholesalePrice}
                      onChange={(e) => setCreateWholesalePrice(e.target.value)}
                      placeholder="70.00"
                      className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:border-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      {modalI18n.costPrice}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createCostPrice}
                      onChange={(e) => setCreateCostPrice(e.target.value)}
                      placeholder="65.00"
                      className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:border-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      {modalI18n.initialStock}
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={createInitialStock}
                      onChange={(e) => setCreateInitialStock(e.target.value)}
                      placeholder="25"
                      className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono font-bold text-white focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* ====================================================================
                   SECTOR-SPECIFIC SPECIALIZED FIELDS
                   ==================================================================== */}
                {(storeType === "butchery" || storeType === "grocery" || storeType === "bakery") && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Scale className="w-3.5 h-3.5 text-white" />
                      <span>
                        {locale === "ar"
                          ? "إعدادات السوبرماركت والميزان والصلاحية"
                          : locale === "en"
                          ? "Supermarket, Scale PLU & Expiry Settings"
                          : "Paramètres Supermarché, PLU & DLC"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          {locale === "ar" ? "وحدة البيع" : locale === "en" ? "Sale Unit" : "Unité de Vente"}
                        </label>
                        <select
                          value={createUnit}
                          onChange={(e) => setCreateUnit(e.target.value as any)}
                          className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:border-white focus:outline-none"
                        >
                          <option value="piece">{locale === "ar" ? "قطعة (Pièce)" : "Pièce"}</option>
                          <option value="kg">{locale === "ar" ? "كيلوغرام (KG)" : "KG"}</option>
                          <option value="g">{locale === "ar" ? "غرام (Gram)" : "Gramme"}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          {locale === "ar" ? "رمز الميزان (PLU)" : locale === "en" ? "Scale PLU" : "Code PLU Balance"}
                        </label>
                        <input
                          type="text"
                          value={createScalePlu}
                          onChange={(e) => setCreateScalePlu(e.target.value)}
                          placeholder="Ex: 4011"
                          className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono focus:border-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          {locale === "ar" ? "تاريخ الصلاحية (DLC)" : locale === "en" ? "Expiry Date" : "Date DLC"}
                        </label>
                        <input
                          type="date"
                          value={createExpiryDate}
                          onChange={(e) => setCreateExpiryDate(e.target.value)}
                          className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {storeType === "grocery" && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-900">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                            {locale === "ar" ? "جناح الرف (Rayon)" : "Rayon / Aisle"}
                          </label>
                          <input
                            type="text"
                            value={createAisle}
                            onChange={(e) => setCreateAisle(e.target.value)}
                            placeholder={locale === "ar" ? "ألبان، مشروبات..." : "Boissons, Frais..."}
                            className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:border-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                            {locale === "ar" ? "سعر الباك (Pack MAD)" : "Prix Pack (MAD)"}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={createPackPrice}
                            onChange={(e) => setCreatePackPrice(e.target.value)}
                            placeholder="Ex: 24.00"
                            className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-white focus:border-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                            {locale === "ar" ? "قطع بالباك (Unités/Pack)" : "Unités / Pack"}
                          </label>
                          <input
                            type="number"
                            step="1"
                            value={createCartonPackQty}
                            onChange={(e) => setCreateCartonPackQty(e.target.value)}
                            placeholder="Ex: 6"
                            className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-white focus:border-white focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {storeType === "fashion" && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Shirt className="w-3.5 h-3.5 text-white" />
                      <span>
                        {locale === "ar"
                          ? "المقاس واللون (الملابس والأزياء)"
                          : locale === "en"
                          ? "Size & Color (Fashion & Apparel)"
                          : "Taille & Coloris (Prêt-à-Porter)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          {locale === "ar" ? "المقاس" : locale === "en" ? "Size" : "Taille"}
                        </label>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {["S", "M", "L", "XL", "XXL", "38", "40", "42"].map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setCreateFashionSize(sz)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                                createFashionSize === sz
                                  ? "bg-white text-black"
                                  : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={createFashionSize}
                          onChange={(e) => setCreateFashionSize(e.target.value)}
                          placeholder="Autre taille..."
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          {locale === "ar" ? "اللون / الموسم" : locale === "en" ? "Color / Season" : "Couleur / Saison"}
                        </label>
                        <input
                          type="text"
                          value={createFashionColor}
                          onChange={(e) => setCreateFashionColor(e.target.value)}
                          placeholder={locale === "ar" ? "أسود، أبيض، كحلي..." : "Noir, Blanc, Bleu Ciel..."}
                          className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(storeType === "electronics" || storeType === "tech") && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Smartphone className="w-3.5 h-3.5 text-white" />
                      <span>
                        {locale === "ar"
                          ? "الرقم التسلسلي IMEI والضمان"
                          : locale === "en"
                          ? "Serial Number IMEI & Warranty"
                          : "Numéro de Série IMEI & Garantie"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          {locale === "ar" ? "رقم IMEI / Serial" : "Numéro IMEI / Serial"}
                        </label>
                        <input
                          type="text"
                          value={createSerialImei}
                          onChange={(e) => setCreateSerialImei(e.target.value)}
                          placeholder="35894109..."
                          className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono focus:border-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          {locale === "ar" ? "مدة الضمان (أشهر)" : locale === "en" ? "Warranty (Months)" : "Garantie (Mois)"}
                        </label>
                        <select
                          value={createWarrantyMonths}
                          onChange={(e) => setCreateWarrantyMonths(e.target.value)}
                          className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:border-white focus:outline-none"
                        >
                          <option value="3">3 {locale === "ar" ? "أشهر" : "Mois"}</option>
                          <option value="6">6 {locale === "ar" ? "أشهر" : "Mois"}</option>
                          <option value="12">12 {locale === "ar" ? "شهراً" : "Mois"}</option>
                          <option value="24">24 {locale === "ar" ? "شهراً" : "Mois"}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {storeType === "restaurant" && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
                      <span>
                        {locale === "ar"
                          ? "شاشة المطبخ KDS ومحطة التحضير"
                          : locale === "en"
                          ? "KDS Kitchen Station & Routing"
                          : "Poste de Préparation KDS"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          {locale === "ar" ? "محطة التحضير" : locale === "en" ? "Preparation Station" : "Poste KDS"}
                        </label>
                        <select
                          value={createPrepStation}
                          onChange={(e) => setCreatePrepStation(e.target.value)}
                          className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:border-white focus:outline-none"
                        >
                          <option value="cuisine">{locale === "ar" ? "المطبخ الرئيسي (Cuisine)" : "Cuisine Principale"}</option>
                          <option value="bar">{locale === "ar" ? "البار والمشروبات (Bar)" : "Bar & Boissons"}</option>
                          <option value="patisserie">{locale === "ar" ? "الحلويات (Pâtisserie)" : "Pâtisserie & Desserts"}</option>
                          <option value="grill">{locale === "ar" ? "الشواية (Grill)" : "Grillade"}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          {locale === "ar" ? "توجيه الطابعة" : locale === "en" ? "Ticket Routing" : "Routage Ticket"}
                        </label>
                        <div className="text-[11px] font-mono text-zinc-400 p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                          POS &rarr; KDS {createPrepStation.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {storeType === "wholesale" && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Boxes className="w-3.5 h-3.5 text-white" />
                      <span>
                        {locale === "ar"
                          ? "بيانات الجملة والكرتون (B2B)"
                          : locale === "en"
                          ? "Wholesale & Carton Pack (B2B)"
                          : "Colisage & Grossiste (B2B)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          {locale === "ar" ? "كمية الصندوق / الكرتون" : locale === "en" ? "Box/Carton Qty" : "Unités par Carton"}
                        </label>
                        <input
                          type="number"
                          value={createCartonPackQty}
                          onChange={(e) => setCreateCartonPackQty(e.target.value)}
                          placeholder="Ex: 12, 24, 48"
                          className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono focus:border-white focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <p className="text-[10px] text-zinc-500 leading-tight">
                          {locale === "ar"
                            ? "يتم تطبيق سعر الجملة آلياً عند بيع الكرتون الكامل في نقطة البيع."
                            : "Le prix de gros s'applique automatiquement au colisage complet."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    {modalI18n.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingProduct}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingProduct ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isCreatingProduct ? modalI18n.submitting : modalI18n.submit}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
