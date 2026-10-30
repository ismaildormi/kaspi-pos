"use client";

import React, { useState, useEffect } from "react";
import { PosHeader } from "@/components/pos/PosHeader";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { CategoryFilter, type PosCategory } from "@/components/pos/CategoryFilter";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { CheckoutModal } from "@/components/pos/CheckoutModal";
import { HeldCartsModal } from "@/components/pos/HeldCartsModal";
import { CustomerModal } from "@/components/pos/CustomerModal";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { offlineDb } from "@/client/db";

export default function PosPage() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const { openPaymentModal, closePaymentModal, isPaymentModalOpen, cart } = usePosStore();

  // Load products and categories (with Dexie caching)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch from API
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/v1/products"),
          fetch("/api/v1/categories"),
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const items: PosProduct[] = prodData.data?.products || [];
          setProducts(items);

          // Cache in Dexie for offline lookup
          if (offlineDb) {
            offlineDb.offlineProducts.bulkPut(
              items.map((i) => ({
                id: i.id,
                tenantId: "current",
                name: i.name,
                sku: i.sku,
                barcode: i.barcode,
                salePrice: i.salePrice,
                taxRate: i.taxRate,
                trackStock: i.trackStock,
                stockQuantity: i.stockQuantity,
                categoryId: i.categoryId,
                categoryName: i.categoryName,
              }))
            ).catch(() => {});
          }
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.data?.categories || []);
        }
      } catch (err) {
        // If offline on initial load, read from Dexie cache!
        if (offlineDb) {
          try {
            const cached = await offlineDb.offlineProducts.toArray();
            if (cached.length > 0) {
              setProducts(cached as PosProduct[]);
            }
          } catch {}
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Global Keyboard shortcuts: F10 for Checkout, Escape to close modals
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F10") {
        e.preventDefault();
        if (cart.length > 0 && !isPaymentModalOpen) {
          openPaymentModal();
        }
      } else if (e.key === "Escape") {
        if (isPaymentModalOpen) {
          closePaymentModal();
        } else if (isHeldModalOpen) {
          setIsHeldModalOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [cart, isPaymentModalOpen, isHeldModalOpen, openPaymentModal, closePaymentModal]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <PosHeader onOpenHeldCarts={() => setIsHeldModalOpen(true)} />

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side (or Right in RTL): Catalog & Search Area */}
        <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 overflow-hidden space-y-3">
          {/* Top Bar: Barcode / Search Input */}
          <ProductSearch products={products} />

          {/* Categories Pill Selector */}
          <CategoryFilter categories={categories} />

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm font-medium">
                Chargement du catalogue...
              </div>
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </div>

        {/* Right Side (or Left in RTL): Cart & Checkout Panel */}
        <div className="w-full md:w-96 lg:w-[420px] shrink-0 h-full border-t md:border-t-0 md:border-s border-slate-800">
          <CartPanel onOpenCustomerModal={() => setIsCustomerModalOpen(true)} />
        </div>
      </div>

      {/* Checkout Payment Modal */}
      <CheckoutModal />

      {/* Held Carts Modal */}
      <HeldCartsModal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
      />

      {/* Customer Quick-Selection & Creation Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
      />
    </div>
  );
}
