"use client";

import React, { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { PosHeader } from "@/components/pos/PosHeader";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { CategoryFilter, type PosCategory } from "@/components/pos/CategoryFilter";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { UnifiedCheckoutModal } from "@/components/pos/UnifiedCheckoutModal";
import { PosSectorLiveDock } from "@/components/pos/PosSectorLiveDock";
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

  const [restaurantCenterView, setRestaurantCenterView] = useState<"menu" | "tables" | "kds">("menu");
  const [kdsTickets, setKdsTickets] = useState<Array<{ id: string; status: string; items: Array<{ id: string; productName: string; quantity: number | string; notes?: string | null }> }>>([]);

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
    selectedTableId,
    selectedTableName,
    setSelectedTable,
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
        // Fallback to Dexie cache if offline
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
        {/* Left Side (or Right in RTL): Catalog & Search Area */}
        <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 overflow-hidden space-y-3">
          {/* Top Bar: Barcode / Search Input */}
          <ProductSearch products={products} />

          {/* 3D Chameleon Hardware Live Dock Mounted Directly on Canvas */}
          <PosSectorLiveDock
            currentView={restaurantCenterView}
            onViewChange={setRestaurantCenterView}
            onOpenIndustryTools={() => setIsIndustryToolsOpen(true)}
          />

          {/* RESTAURANT CENTER VIEWS: TABLES OR KDS OR MENU */}
          {storeType === "restaurant" && restaurantCenterView === "tables" ? (
            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🪑</span>
                  <span>{t.industryTools.tablesTitle} — Plan de Salle 3D</span>
                </h4>
                {selectedTableName && (
                  <button
                    type="button"
                    onClick={() => setSelectedTable(null, null)}
                    className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Détacher table ({selectedTableName})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {[
                  { id: "t1", name: "T-01", capacity: 2, status: "free" },
                  { id: "t2", name: "T-02", capacity: 4, status: "occupied", elapsedMinutes: 28, amount: 240 },
                  { id: "t3", name: "T-03", capacity: 4, status: "free" },
                  { id: "t4", name: "T-04", capacity: 6, status: "billing", elapsedMinutes: 52, amount: 580 },
                  { id: "t5", name: "T-05", capacity: 2, status: "free" },
                  { id: "t6", name: "T-06", capacity: 4, status: "occupied", elapsedMinutes: 14, amount: 160 },
                  { id: "t7", name: "T-07", capacity: 8, status: "free" },
                  { id: "t8", name: "T-08", capacity: 4, status: "free" },
                  { id: "t9", name: "T-09", capacity: 2, status: "occupied", elapsedMinutes: 41, amount: 195 },
                  { id: "t10", name: "T-10", capacity: 4, status: "free" },
                  { id: "t11", name: "T-11", capacity: 6, status: "free" },
                  { id: "t12", name: "T-12", capacity: 4, status: "free" },
                  { id: "ter1", name: "Terrasse 1", capacity: 4, status: "occupied", elapsedMinutes: 22, amount: 310 },
                  { id: "ter2", name: "Terrasse 2", capacity: 4, status: "free" },
                  { id: "ter3", name: "Terrasse 3", capacity: 2, status: "free" },
                  { id: "ter4", name: "Terrasse 4", capacity: 6, status: "free" },
                ].map((tbl) => {
                  const isSelected = selectedTableId === tbl.id || selectedTableName === tbl.name;
                  const isOccupied = tbl.status === "occupied";
                  const isBilling = tbl.status === "billing";
                  return (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTable(tbl.id, tbl.name);
                        setRestaurantCenterView("menu");
                      }}
                      className={`keycap-3d p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col justify-between h-28 ${
                        isSelected
                          ? "bg-white text-zinc-950 border-white font-bold shadow-lg"
                          : isBilling
                          ? "bg-zinc-800 border-zinc-600 text-white"
                          : isOccupied
                          ? "bg-zinc-900 border-zinc-700 text-zinc-200"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <span>{tbl.name}</span>
                        <span className="font-mono text-[9px] opacity-75">{tbl.capacity}p</span>
                      </div>
                      <div className="my-auto">
                        {isOccupied && tbl.amount && (
                          <span className="text-xs font-bold font-mono block text-white">
                            {tbl.amount} MAD
                          </span>
                        )}
                        {isOccupied && tbl.elapsedMinutes && (
                          <span className="text-[10px] font-mono text-zinc-400 block">
                            ⏱ {tbl.elapsedMinutes}m
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wider">
                        {isBilling
                          ? "Addition"
                          : isOccupied
                          ? t.industryTools.tableOccupied
                          : t.industryTools.tableFree}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : storeType === "restaurant" && restaurantCenterView === "kds" ? (
            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>👨‍🍳</span>
                  <span>{t.industryTools.kdsTitle} (Écran Cuisine Live)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsIndustryToolsOpen(true)}
                  className="keycap-3d px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-white"
                >
                  Gérer Tickets
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    id: "TK-0841",
                    table: "Table T-02",
                    time: "Il y a 6 min",
                    status: "PREPARING",
                    items: ["2x Burger Gourmet", "1x Tagliatelles Saumon", "2x Coca Cola Zero"],
                  },
                  {
                    id: "TK-0842",
                    table: "Terrasse 1",
                    time: "Il y a 2 min",
                    status: "NEW",
                    items: ["1x Pizza Margherita", "1x Salade César", "1x Eau Minérale"],
                  },
                  {
                    id: "TK-0840",
                    table: "Table T-06",
                    time: "Il y a 14 min",
                    status: "READY",
                    items: ["1x Café Expresso", "1x Tiramisu Maison"],
                  },
                ].map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                        <span className="text-white">{ticket.id} • {ticket.table}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ticket.status === "READY"
                              ? "bg-white text-zinc-950"
                              : ticket.status === "PREPARING"
                              ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                              : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-zinc-300">
                        {ticket.items.map((line, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                      ⏱ {ticket.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Right Side (or Left in RTL): Cart & Checkout Panel */}
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

      {/* Cash Drawer Shift Management Modal (Fond de Caisse / X-Report / Z-Report) */}
      <CashShiftModal
        isOpen={isCashShiftModalOpen}
        onClose={() => setIsCashShiftModalOpen(false)}
        activeShift={activeShift}
        recentShifts={recentShifts}
        onShiftUpdated={fetchCashShift}
      />

      {/* Industry Workspace Tools Modal (KDS / Tables / Variants / Weight / Barcode Studio) */}
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
