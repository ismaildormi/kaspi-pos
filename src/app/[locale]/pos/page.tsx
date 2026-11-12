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
import { OwnerProfileModal } from "@/components/layout/OwnerProfileModal";
import { QuickProductModal } from "@/components/pos/QuickProductModal";
import { CatalogProgressLoader } from "@/components/pos/CatalogProgressLoader";
import { GroceryScannerUtilityBar } from "@/components/pos/grocery/GroceryScannerUtilityBar";
import { getSectorCssVariables } from "@/lib/sector/sector-blueprint";
import { InAppPaywallModal, triggerPaywallModal } from "@/components/billing/InAppPaywallModal";
import { Plus, LayoutGrid, Scale, ScanBarcode } from "lucide-react";
import { SquarePluScalePanel } from "@/components/pos/grocery/SquarePluScalePanel";
import { SquarePriceDlcModal } from "@/components/pos/grocery/SquarePriceDlcModal";
import type { ShiftFinancialSummary } from "@/server/cash-shift/engine";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { offlineDb } from "@/client/db";
import { processSyncQueue, getApiUrl } from "@/client/sync-engine";
import { useAppDictionary } from "@/i18n/schema";

export default function PosPage() {
  const { t, locale } = useAppDictionary();
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loaderDone, setLoaderDone] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCashShiftModalOpen, setIsCashShiftModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isIndustryToolsOpen, setIsIndustryToolsOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [userName, setUserName] = useState("AYMANE");
  const [activeShift, setActiveShift] = useState<ShiftFinancialSummary | null>(null);
  const [recentShifts, setRecentShifts] = useState<ShiftFinancialSummary[]>([]);
  const [groceryView, setGroceryView] = useState<"grid" | "plu" | "price_check">("grid");
  const [scanMultiplier, setScanMultiplier] = useState<number>(1);

  const {
    openPaymentModal,
    closePaymentModal,
    isPaymentModalOpen,
    cart,
    addToCart,
    updateItemQuantity,
    setDeviceCount,
    setTenantInfo,
    setPrinterSettings,
    setStoreProfile,
    tenantInfo,
    storeType,
  } = usePosStore();

  const handleSetScanMultiplier = (m: number) => {
    setScanMultiplier(m);
    if (cart.length > 0 && m > 1) {
      const last = cart[cart.length - 1];
      updateItemQuantity(last.productId, m);
    }
  };

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
      fetch(getApiUrl("/api/v1/me"))
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.data?.user?.fullName || d?.data?.user?.email) {
            setUserName(d.data.user.fullName || d.data.user.email.split("@")[0]);
          }
        })
        .catch(() => {});
    }
    const handleOpenIndustry = () => setIsIndustryToolsOpen(true);
    const handleOpenVault = () => setIsOwnerModalOpen(true);
    const handleStockUpdate = (e: any) => {
      const soldItems: Array<{ productId: string; quantity: number }> = e.detail?.items;
      if (Array.isArray(soldItems)) {
        setProducts((prev) =>
          prev.map((p) => {
            const sold = soldItems.find((s) => s.productId === p.id);
            if (sold && p.trackStock) {
              return {
                ...p,
                stockQuantity: Math.max(0, (p.stockQuantity ?? 0) - sold.quantity),
              };
            }
            return p;
          })
        );
      }
    };
    window.addEventListener("open-industry-modal", handleOpenIndustry);
    window.addEventListener("open-owner-vault", handleOpenVault);
    window.addEventListener("kaspi_stock_updated", handleStockUpdate as EventListener);
    return () => {
      window.removeEventListener("open-industry-modal", handleOpenIndustry);
      window.removeEventListener("open-owner-vault", handleOpenVault);
      window.removeEventListener("kaspi_stock_updated", handleStockUpdate as EventListener);
    };
  }, [fetchCashShift]);

  // Refresh active cash shift summary when payment modal closes (e.g. after a completed sale)
  useEffect(() => {
    if (!isPaymentModalOpen && navigator.onLine) {
      fetchCashShift();
    }
  }, [isPaymentModalOpen, fetchCashShift]);

  // Load products, categories, and tenant profile (with instant local-first hydration)
  useEffect(() => {
    let isMounted = true;

    // Phase 1: Instant Local-First Hydration (0ms wait if cached in Dexie)
    const hydrateLocal = async () => {
      try {
        if (offlineDb?.offlineProducts) {
          const cachedProds = await offlineDb.offlineProducts.toArray();
          if (isMounted && cachedProds && cachedProds.length > 0) {
            setProducts(
              cachedProds.map((p: any) => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                barcode: p.barcode,
                salePrice: Number(p.salePrice) || 0,
                taxRate: Number(p.taxRate) || 0,
                stockQuantity: p.stockQuantity ?? 0,
                trackStock: p.trackStock ?? true,
                categoryId: p.categoryId,
                image: p.imageUrl || p.image,
              }))
            );
            setIsLoading(false);
            setLoaderDone(true);
          }
        }
      } catch (err) {
        console.warn("PosPage: Local cache hydration warning", err);
      }
    };

    hydrateLocal();

    // Phase 2: Live Network Revalidation
    async function loadData() {
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

        // Check active subscription status & trigger paywall if expired
        fetch(getApiUrl("/api/billing/subscription"))
          .then((res) => (res.ok ? res.json() : null))
          .then((subData) => {
            if (subData?.subscription) {
              const sub = subData.subscription;
              if (
                sub.status === "expired" ||
                sub.status === "past_due" ||
                (sub.status === "trialing" && sub.daysRemaining <= 0)
              ) {
                triggerPaywallModal("expired");
              }
            }
          })
          .catch(() => {});

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const items: PosProduct[] = prodData.data?.products || [];
          setProducts(items);

          // Cache in Dexie for offline lookup
          if (offlineDb?.offlineProducts) {
            await offlineDb.offlineProducts.bulkPut(
              items.map((p) => ({
                id: p.id,
                tenantId: "current",
                name: p.name,
                sku: p.sku,
                barcode: p.barcode,
                salePrice: p.salePrice,
                taxRate: p.taxRate,
                stockQuantity: p.stockQuantity ?? 0,
                trackStock: p.trackStock ?? true,
                categoryId: p.categoryId,
                imageUrl: p.image,
                syncedAt: Date.now(),
              }))
            );
          }
        } else if (offlineDb?.offlineProducts) {
          const cached = await offlineDb.offlineProducts.toArray();
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
              image: p.imageUrl || p.image,
            }))
          );
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.data?.categories || []);
        }
      } catch (err) {
        console.warn("PosPage: Network fetch failed, falling back to offline DB", err);
        if (offlineDb?.offlineProducts) {
          const cached = await offlineDb.offlineProducts.toArray();
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
              image: p.imageUrl || p.image,
            }))
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
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
    <div
      dir="ltr"
      style={getSectorCssVariables(storeType)}
      className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-white font-sans"
    >
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
        cashierName={userName}
        ownerAvatarUrl={tenantInfo?.logoUrl}
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
        <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 overflow-hidden space-y-2.5">
          {/* Zone L1: Top Command & Mode Switcher Row */}
          <div className="flex items-center gap-2.5 h-12">
            {/* Left: Barcode & Search Input */}
            <div className="flex-1 min-w-0">
              <ProductSearch products={products} />
            </div>

            {/* Middle: Square Register Segmented View Switcher */}
            {storeType === "grocery" && (
              <div className="h-11 p-1 rounded-xl bg-[#111113] border border-white/[0.08] flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setGroceryView("grid")}
                  className={`h-9 px-3 rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    groceryView === "grid"
                      ? "bg-white text-zinc-950"
                      : "text-zinc-400 hover:text-white hover:bg-[#18181B]"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">
                    {locale === "ar" ? "الشبكة الذكية" : locale === "en" ? "Smart Grid" : "Grille Articles"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGroceryView("plu")}
                  className={`h-9 px-3 rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    groceryView === "plu"
                      ? "bg-white text-zinc-950"
                      : "text-zinc-400 hover:text-white hover:bg-[#18181B]"
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">
                    {locale === "ar" ? "ميزان وخضر PLU" : locale === "en" ? "PLU & Scale" : "Balance & PLU"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGroceryView("price_check")}
                  className={`h-9 px-3 rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    groceryView === "price_check"
                      ? "bg-white text-zinc-950"
                      : "text-zinc-400 hover:text-white hover:bg-[#18181B]"
                  }`}
                >
                  <ScanBarcode className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">
                    {locale === "ar" ? "فاحص الثمن والصلاحية" : locale === "en" ? "Price & DLC" : "Vérif. Prix & DLC"}
                  </span>
                </button>
              </div>
            )}

            {/* Right: + New Product */}
            <button
              type="button"
              onClick={() => setIsQuickProductModalOpen(true)}
              className="h-11 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 transition-all active:scale-[0.98]"
              title={locale === "ar" ? "إضافة منتج جديد" : "Ajouter un produit"}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">
                {locale === "ar" ? "+ منتج جديد" : locale === "en" ? "+ New Product" : "+ Nouveau"}
              </span>
            </button>
          </div>

          {/* Zone L2: Flush Department Tabs & Scan Multiplier Bar */}
          <div className="flex items-center justify-between gap-2 h-10 pb-1 border-b border-white/[0.06]">
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
              <CategoryFilter categories={categories} />
            </div>

            {storeType === "grocery" && (
              <div className="h-8 p-0.5 rounded-lg bg-[#111113] border border-white/[0.08] flex items-center gap-0.5 shrink-0">
                <span className="font-mono text-[10px] font-bold text-zinc-500 px-2">
                  {locale === "ar" ? "الكمية:" : locale === "fr" ? "QTÉ:" : "QTY:"}
                </span>
                {[
                  { m: 1, labelAr: "×1", labelFr: "×1", labelEn: "×1" },
                  { m: 2, labelAr: "×2", labelFr: "×2", labelEn: "×2" },
                  { m: 6, labelAr: "×6 باك", labelFr: "×6 Pack", labelEn: "×6 Pack" },
                  { m: 12, labelAr: "×12 كرتونة", labelFr: "×12 Carton", labelEn: "×12 Carton" },
                  { m: 24, labelAr: "×24 صندوق", labelFr: "×24 Caisse", labelEn: "×24 Crate" },
                ].map((item) => (
                  <button
                    key={item.m}
                    type="button"
                    onClick={() => handleSetScanMultiplier(item.m)}
                    className={`h-7 px-2 rounded-md font-mono text-[11px] transition-colors cursor-pointer ${
                      scanMultiplier === item.m
                        ? "bg-white text-zinc-950 font-black shadow-xs"
                        : "text-zinc-400 hover:text-white font-bold"
                    }`}
                  >
                    {locale === "ar" ? item.labelAr : locale === "en" ? item.labelEn : item.labelFr}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Workspace (Smart Grid or PLU Scale Touch Keypad) */}
          <div className="flex-1 overflow-y-auto">
            {!loaderDone ? (
              <CatalogProgressLoader
                isLoading={isLoading}
                onReady={() => setLoaderDone(true)}
              />
            ) : groceryView === "plu" && storeType === "grocery" ? (
              <SquarePluScalePanel
                onBack={() => setGroceryView("grid")}
                products={products}
              />
            ) : (
              <ProductGrid
                products={products}
                onOpenQuickAdd={() => setIsQuickProductModalOpen(true)}
              />
            )}
          </div>

          {/* Price & DLC Check Modal */}
          <SquarePriceDlcModal
            isOpen={groceryView === "price_check" && storeType === "grocery"}
            onClose={() => setGroceryView("grid")}
            products={products}
          />
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
      {/* Owner Profile & Security Vault Modal */}
      <OwnerProfileModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        onProfileUpdated={({ shopName, logoUrl }) => {
          if (shopName) setTenantInfo({ ...tenantInfo, shopName });
          if (logoUrl !== undefined) setTenantInfo({ ...tenantInfo, logoUrl });
        }}
      />

      {/* Quick Add Product Modal */}
      <QuickProductModal
        isOpen={isQuickProductModalOpen}
        onClose={() => setIsQuickProductModalOpen(false)}
        onProductCreated={(newProduct) => {
          setProducts((prev) => [newProduct, ...prev]);
          addToCart(newProduct);
        }}
      />

      {/* Enterprise In-App Paywall & Device Handover Modal */}
      <InAppPaywallModal />
    </div>
  );
}
