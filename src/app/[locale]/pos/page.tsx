"use client";

import React, { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { PosHeader } from "@/components/pos/PosHeader";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { CategoryFilter, type PosCategory } from "@/components/pos/CategoryFilter";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { UnifiedCheckoutModal } from "@/components/pos/UnifiedCheckoutModal";
import { HeldCartsModal } from "@/components/pos/HeldCartsModal";
import { CustomerModal } from "@/components/pos/CustomerModal";
import { CashShiftModal } from "@/components/pos/CashShiftModal";
import { StoreOnboardingModal } from "@/components/pos/StoreOnboardingModal";
import { IndustryWorkspaceModal } from "@/components/pos/IndustryWorkspaceModal";
import type { ShiftFinancialSummary } from "@/server/cash-shift/engine";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { offlineDb } from "@/client/db";
import { processSyncQueue, getApiUrl } from "@/client/sync-engine";
import { useAppDictionary } from "@/i18n/schema";

export default function PosPage() {
  const { t } = useAppDictionary();
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCashShiftModalOpen, setIsCashShiftModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isIndustryToolsOpen, setIsIndustryToolsOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<ShiftFinancialSummary | null>(null);
  const [recentShifts, setRecentShifts] = useState<ShiftFinancialSummary[]>([]);

  const {
    openPaymentModal,
    closePaymentModal,
    isPaymentModalOpen,
    cart,
    setDeviceCount,
    setTenantInfo,
    setPrinterSettings,
    setStoreProfile,
    tenantInfo,
    storeType,
  } = usePosStore();

  const fetchCashShift = React.useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/api/v1/cash-sessions"));
      if (res.ok) {
        const json = await res.json();
        setActiveShift(json.data?.activeSession || null);
        setRecentShifts(json.data?.recentSessions || []);
      }
    } catch {
      // Ignore network errors while offline
    }
  }, []);

  // Trigger Dexie outbox synchronization & shift fetch on POS mount & online events
  useEffect(() => {
    if (navigator.onLine) {
      processSyncQueue().catch(() => {});
      fetchCashShift();
    }
    const handleOpenIndustry = () => setIsIndustryToolsOpen(true);
    window.addEventListener("open-industry-modal", handleOpenIndustry);
    return () => window.removeEventListener("open-industry-modal", handleOpenIndustry);
  }, [fetchCashShift]);

  // Refresh active cash shift summary when payment modal closes (e.g. after a completed sale)
  useEffect(() => {
    if (!isPaymentModalOpen && navigator.onLine) {
      fetchCashShift();
    }
  }, [isPaymentModalOpen, fetchCashShift]);

  // Load products, categories, and tenant profile (with Dexie caching)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [prodRes, catRes, meRes, settingsRes] = await Promise.all([
          fetch(getApiUrl("/api/v1/products")),
          fetch(getApiUrl("/api/v1/categories")),
          fetch(getApiUrl("/api/v1/me")).catch(() => null),
          fetch(getApiUrl("/api/v1/settings")).catch(() => null),
        ]);

        const sData = settingsRes && settingsRes.ok ? (await settingsRes.json())?.settings : null;

        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          const currTenant = meData.data?.currentTenant;
          if (currTenant?.maxDevices) {
            setDeviceCount(currTenant.maxDevices);
          }
          if (currTenant || sData) {
            setTenantInfo({
              shopName: sData?.shopName || currTenant?.displayName || currTenant?.legalName,
              legalName: currTenant?.legalName || sData?.shopName,
              ice: sData?.ice || currTenant?.ice,
              taxId: sData?.taxId || currTenant?.taxId,
              rcNumber: sData?.rcNumber || currTenant?.rcNumber,
              address: sData?.address || currTenant?.address,
              city: currTenant?.city,
              phone: sData?.phone || currTenant?.phone,
              receiptHeader: sData?.receiptHeader,
              receiptFooter: sData?.receiptFooter,
            });
          }
        }

        if (sData) {
          if (sData.storeType) {
            setStoreProfile(sData.storeType, Boolean(sData.onboardingCompleted));
          }
          if (sData.onboardingCompleted === false) {
            setIsOnboardingOpen(true);
          }
          setPrinterSettings({
            receiptLanguage: sData.receiptLanguage || "fr",
            paperWidthMm: sData.paperWidthMm === 58 ? 58 : 80,
            printerConnectionMode: sData.printerConnectionMode || "auto",
            printer: sData.printer || "",
            printerIp: sData.printerIp || "192.168.1.50",
            printerPort: sData.printerPort || "9100",
            autoPrintReceipt: Boolean(sData.autoPrintReceipt),
            openDrawer: sData.openDrawer !== undefined ? Boolean(sData.openDrawer) : true,
            showStoreLogo: sData.showStoreLogo !== undefined ? Boolean(sData.showStoreLogo) : true,
            receiptHeader: sData.receiptHeader || "",
            receiptFooter: sData.receiptFooter || "",
          });
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const items: PosProduct[] = prodData.data?.products || [];
          setProducts(items);

          // Cache in Dexie for offline lookup
          if (offlineDb) {
            await offlineDb.products.bulkPut(
              items.map((p) => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                barcode: p.barcode,
                salePrice: p.salePrice,
                taxRate: p.taxRate,
                stockQuantity: p.stockQuantity ?? 0,
                trackStock: p.trackStock ?? true,
                categoryId: p.categoryId,
                image: p.image,
                isScaleItem: p.isScaleItem ?? false,
                scaleBarcodePrefix: p.scaleBarcodePrefix,
                weightUnit: p.weightUnit,
                tareWeightGrams: p.tareWeightGrams,
                syncedAt: Date.now(),
              }))
            );
          }
        } else if (offlineDb) {
          const cached = await offlineDb.products.toArray();
          setProducts(
            cached.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              barcode: p.barcode,
              salePrice: p.salePrice,
              taxRate: p.taxRate,
              stockQuantity: p.stockQuantity,
              trackStock: p.trackStock,
              categoryId: p.categoryId,
              image: p.image,
              isScaleItem: p.isScaleItem,
              scaleBarcodePrefix: p.scaleBarcodePrefix,
              weightUnit: p.weightUnit,
              tareWeightGrams: p.tareWeightGrams,
            }))
          );
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.data?.categories || []);
        }
      } catch (err) {
        console.warn("PosPage: Network fetch failed, falling back to offline DB", err);
        if (offlineDb) {
          const cached = await offlineDb.products.toArray();
          setProducts(
            cached.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              barcode: p.barcode,
              salePrice: p.salePrice,
              taxRate: p.taxRate,
              stockQuantity: p.stockQuantity,
              trackStock: p.trackStock,
              categoryId: p.categoryId,
              image: p.image,
              isScaleItem: p.isScaleItem,
              scaleBarcodePrefix: p.scaleBarcodePrefix,
              weightUnit: p.weightUnit,
              tareWeightGrams: p.tareWeightGrams,
            }))
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [setDeviceCount, setTenantInfo, setPrinterSettings, setStoreProfile]);

  // Global Keyboard Shortcuts (F10 checkout, F4 search, F8 hold, ESC close)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F10") {
        e.preventDefault();
        if (cart.length > 0 && !isPaymentModalOpen) {
          openPaymentModal();
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        setIsHeldModalOpen((prev) => !prev);
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
    <div dir="ltr" className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "#09090b",
            color: "#ffffff",
            border: "1px solid #27272a",
          },
        }}
      />
      {/* Top Header */}
      <PosHeader
        storeName={tenantInfo?.shopName || "Magasin Principal"}
        onOpenHeldCarts={() => setIsHeldModalOpen(true)}
        onOpenIndustryTools={() => setIsIndustryToolsOpen(true)}
        onOpenCashShift={() => {
          fetchCashShift();
          setIsCashShiftModalOpen(true);
        }}
        isShiftOpen={Boolean(activeShift)}
        expectedCash={activeShift?.expectedCash || 0}
      />

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Clean Catalog & Search Area */}
        <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 overflow-hidden space-y-3">
          {/* Top Bar: Barcode / Search Input */}
          <ProductSearch products={products} />

          {/* Categories Pill Selector */}
          <CategoryFilter categories={categories} />

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-zinc-500 text-sm font-medium">
                {t.pos.loadingCatalog}
              </div>
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </div>

        {/* Right Side: Clean Cart & Checkout Panel */}
        <div className="w-full md:w-96 lg:w-[420px] shrink-0 h-full border-t md:border-t-0 md:border-s border-zinc-800">
          <CartPanel
            onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
            onOpenIndustryTools={() => setIsIndustryToolsOpen(true)}
          />
        </div>
      </div>

      {/* Checkout Payment Modal */}
      <UnifiedCheckoutModal />

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

      {/* Cash Drawer Shift Management Modal */}
      <CashShiftModal
        isOpen={isCashShiftModalOpen}
        onClose={() => setIsCashShiftModalOpen(false)}
        activeShift={activeShift}
        recentShifts={recentShifts}
        onShiftUpdated={fetchCashShift}
      />

      {/* Unified Sector Configuration Modal */}
      <IndustryWorkspaceModal
        isOpen={isIndustryToolsOpen}
        onClose={() => setIsIndustryToolsOpen(false)}
        onOpenOnboardingSwitch={() => setIsOnboardingOpen(true)}
      />

      {/* Universal Store-Type Dynamic Onboarding Wizard */}
      <StoreOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        initialShopName={tenantInfo?.shopName || ""}
        initialStoreType={storeType}
        onSuccess={async () => {
          try {
            const [pRes, cRes] = await Promise.all([
              fetch(getApiUrl("/api/v1/products")),
              fetch(getApiUrl("/api/v1/categories")),
            ]);
            if (pRes.ok) {
              const pData = await pRes.json();
              setProducts(pData.data?.products || []);
            }
            if (cRes.ok) {
              const cData = await cRes.json();
              setCategories(cData.data?.categories || []);
            }
          } catch {}
        }}
      />
    </div>
  );
}
