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
import { PosteConflictLockModal, type ConflictData } from "@/components/pos/PosteConflictLockModal";
import { getDeviceFingerprint, sendCleanShutdownBeacon } from "@/lib/auth/device-identity";
import { Plus, LayoutGrid, Scale, ScanBarcode } from "lucide-react";
import { SquarePluScalePanel } from "@/components/pos/grocery/SquarePluScalePanel";
import { SquarePriceDlcModal } from "@/components/pos/grocery/SquarePriceDlcModal";
import type { ShiftFinancialSummary } from "@/server/cash-shift/engine";
import { usePosStore, type PosProduct } from "@/client/store/usePosStore";
import { offlineDb } from "@/client/db";
import { processSyncQueue, getApiUrl } from "@/client/sync-engine";
import { useAppDictionary } from "@/i18n/schema";
import { AutonomousSelfHealingBoundary } from "@/components/security/AutonomousSelfHealingBoundary";
import { bootEdgeClientNanoSwarm } from "@/lib/autonomous-fleet/edge-client-nano-swarm";

const SEEDED_DEMO_NAMES = new Set([
  "Huile d'Olive Extra Vierge Atlas 1L",
  "Thé Vert Sultan Habka 200g",
  "Amlou Beldi aux Amandes & Argan 500g",
  "Lait UHT Centrale Entier 1L",
  "Farine Finot Supérieure 5kg",
  "Eau Minérale Sidi Ali 1.5L",
  "Sucre Morceaux Tigre 1kg",
  "Café Moulu Dubois Gold 250g",
  "Espresso Noir Italien / Nous-Nous",
  "Écouteurs Sans Fil ANC Pro (Garantie 12m)",
  "Couscous Royal Vendredi (Tfaya)",
  "Tajine Poulet Citron Confit & Olives",
  "Chemise Lin Premium Casablanca (Taille L)",
  "Sultan Habka Tea 200g",
  "Atlas Olive Oil 1L",
  "Couscous Royal 1kg",
  "Atlalus Olive Oil 1kg",
]);

const SEEDED_DEMO_SKUS = new Set([
  "SKU-OIL-001", "SKU-TEA-002", "SKU-AML-003", "SKU-MLK-004",
  "SKU-FAR-005", "SKU-EAU-006", "SKU-SUC-007", "SKU-CAF-008",
  "DEMO-001", "DEMO-002", "DEMO-003", "DEMO-004", "DEMO-005", "DEMO-006", "DEMO-007", "DEMO-008"
]);

function isDemoProduct(p: { name?: string | null; sku?: string | null }) {
  if (!p) return false;
  if (p.name && SEEDED_DEMO_NAMES.has(p.name)) return true;
  if (p.sku && SEEDED_DEMO_SKUS.has(p.sku)) return true;
  if (p.sku && p.sku.startsWith("DEMO-")) return true;
  return false;
}

const SHOWCASE_PRODUCTS: PosProduct[] = [
  {
    id: "kaspi-show-01",
    name: "Adidas Originals Sweater",
    sku: "KASPI-SHOW-01",
    barcode: "6119990001112",
    salePrice: 150.0,
    wholesalePrice: 90.0,
    taxRate: 20,
    trackStock: true,
    stockQuantity: 24,
    categoryId: "fashion",
    categoryName: "fashion",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kaspi-show-02",
    name: "iPhone 18 Pro Max 256GB",
    sku: "KASPI-SHOW-02",
    barcode: "6119990001129",
    salePrice: 14500.0,
    wholesalePrice: 11000.0,
    taxRate: 20,
    trackStock: true,
    stockQuantity: 15,
    categoryId: "electronics",
    categoryName: "electronics",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kaspi-show-03",
    name: "لوز بلدي مغربي (Kg)",
    sku: "KASPI-SHOW-03",
    barcode: "6119990002225",
    salePrice: 150.0,
    wholesalePrice: 120.0,
    taxRate: 0,
    trackStock: true,
    stockQuantity: 50,
    isScaleItem: true,
    weightUnit: "kg",
    categoryId: "produce",
    categoryName: "produce",
    image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=400&q=80",
    imageUrl: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kaspi-show-04",
    name: "Apple Watch Ultra 2 Titanium",
    sku: "KASPI-SHOW-04",
    barcode: "6119990001136",
    salePrice: 8900.0,
    wholesalePrice: 6800.0,
    taxRate: 20,
    trackStock: true,
    stockQuantity: 8,
    categoryId: "electronics",
    categoryName: "electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kaspi-show-05",
    name: "Adit Sport Zip Sweater",
    sku: "KASPI-SHOW-05",
    barcode: "6119990001143",
    salePrice: 380.0,
    wholesalePrice: 220.0,
    taxRate: 20,
    trackStock: true,
    stockQuantity: 18,
    categoryId: "fashion",
    categoryName: "fashion",
    image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=400&q=80",
    imageUrl: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kaspi-show-06",
    name: "Chronograph Classic Silver Watch",
    sku: "KASPI-SHOW-06",
    barcode: "6119990001150",
    salePrice: 1250.0,
    wholesalePrice: 750.0,
    taxRate: 20,
    trackStock: true,
    stockQuantity: 12,
    categoryId: "fashion",
    categoryName: "fashion",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=400&q=80",
    imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kaspi-show-07",
    name: "iPhone 18 Pro Natural Titanium",
    sku: "KASPI-SHOW-07",
    barcode: "6119990001167",
    salePrice: 13900.0,
    wholesalePrice: 10500.0,
    taxRate: 20,
    trackStock: true,
    stockQuantity: 10,
    categoryId: "electronics",
    categoryName: "electronics",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80",
    imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "kaspi-show-08",
    name: "iPhone 18 Pro Alpine White",
    sku: "KASPI-SHOW-08",
    barcode: "6119990001174",
    salePrice: 13900.0,
    wholesalePrice: 10500.0,
    taxRate: 20,
    trackStock: true,
    stockQuantity: 14,
    categoryId: "electronics",
    categoryName: "electronics",
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80",
    imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80",
  },
];

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
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
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
    setSessionContext,
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

  // Seat Integrity: 1-Poste Hardware Binding & Dual-Device Conflict Watchdog
  const checkPosteSeatIntegrity = React.useCallback(async () => {
    try {
      const hw = await getDeviceFingerprint();
      const res = await fetch(getApiUrl("/api/v1/devices/poste-heartbeat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: hw.fingerprint,
          deviceName: hw.deviceName,
          os: hw.os,
          platform: hw.platform,
          action: "heartbeat",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === "DUAL_LOCKDOWN" || json.status === "HARD_ADMIN_LOCK") {
          setConflictData({
            status: json.status,
            isPrimary: json.isPrimary,
            strikes: json.strikes,
            bindingId: json.bindingId,
            fingerprint: hw.fingerprint,
            primarySummary: json.primarySummary,
            secondarySummary: json.secondarySummary,
            message: json.message,
          });
        } else if (json.status === "ACTIVE") {
          setConflictData(null);
        }
      }
    } catch {
      // Offline graceful fallback
    }
  }, []);

  useEffect(() => {
    checkPosteSeatIntegrity();
    const interval = setInterval(checkPosteSeatIntegrity, 18000);

    const handleBeforeUnload = () => {
      try {
        const cached = localStorage.getItem("kaspi_poste_hw_fp_v1") || "unknown";
        sendCleanShutdownBeacon(getApiUrl("/api/v1/devices/poste-heartbeat"), {
          fingerprint: cached,
        });
      } catch {}
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [checkPosteSeatIntegrity]);

  // Load products, categories, and tenant profile (with instant local-first hydration)
  useEffect(() => {
    let isMounted = true;

    // Phase 1: Instant Local-First Hydration (0ms wait if cached in Dexie)
    const hydrateLocal = async () => {
      try {
        if (offlineDb?.offlineProducts) {
          const cachedProds = await offlineDb.offlineProducts.toArray();
          const hasRealProds = (cachedProds || []).some((p: any) => !isDemoProduct(p));
          const cleanProds = hasRealProds
            ? (cachedProds || []).filter((p: any) => !isDemoProduct(p))
            : cachedProds || [];
          if (hasRealProds) {
            const demoIds = (cachedProds || []).filter((p: any) => isDemoProduct(p)).map((p: any) => p.id);
            if (demoIds.length > 0) {
              offlineDb.offlineProducts.bulkDelete(demoIds).catch(() => {});
            }
          }
          if (isMounted) {
            const isStoredAuth = typeof window !== "undefined" && Boolean(localStorage.getItem("kaspi_store_id"));
            const prodsToSet = isStoredAuth ? cleanProds : (cleanProds.length > 0 ? cleanProds : SHOWCASE_PRODUCTS);
            setProducts(
              prodsToSet.map((p: any) => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                barcode: p.barcode,
                salePrice: Number(p.salePrice) || 0,
                wholesalePrice: Number(p.wholesalePrice) || Number(p.costPrice) || 0,
                costPrice: Number(p.costPrice) || 0,
                taxRate: Number(p.taxRate) || 0,
                stockQuantity: p.stockQuantity ?? 10,
                trackStock: p.trackStock ?? true,
                categoryId: p.categoryId,
                unit: p.unit,
                isScaleItem: p.isScaleItem,
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
          const resolvedStoreId = meData.data?.storeIds?.[0] || currTenant?.stores?.[0]?.id || "";
          const resolvedUserId = meData.data?.user?.id || "";

          if (currTenant?.id && resolvedStoreId) {
            setSessionContext(currTenant.id, resolvedStoreId, resolvedUserId, currTenant?.maxDevices || 1);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("kaspi_store_id", resolvedStoreId);
              } catch {}
            }
          }

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
            receiptLanguage: sData.receiptLanguage || "ar",
            paperWidthMm: sData.paperWidthMm === 58 ? 58 : 80,
            printerConnectionMode: sData.printerConnectionMode || "auto",
            printer: sData.printer || "",
            printerIp: sData.printerIp || "192.168.1.50",
            printerPort: sData.printerPort || "9100",
            autoPrintReceipt: Boolean(sData.autoPrintReceipt),
            openDrawer: sData.openDrawer !== undefined ? Boolean(sData.openDrawer) : true,
            showStoreLogo: Boolean(sData.showStoreLogo),
            receiptHeader: sData.receiptHeader || "",
            receiptFooter: sData.receiptFooter || "",
            taxDisplayMode: sData.taxDisplayMode || "INCLUSIVE_CLEAN",
            showLegalIceOnReceipt: Boolean(sData.showLegalIceOnReceipt),
            receiptFooterCodeType: sData.receiptFooterCodeType || "NONE",
            receiptQrTargetUrl: sData.receiptQrTargetUrl || "",
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

        const isAuthMerchant = Boolean(meRes && meRes.ok);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const rawItems: PosProduct[] = prodData.data?.products || [];
          const hasRealItems = rawItems.some((p) => !isDemoProduct(p));
          const items = hasRealItems ? rawItems.filter((p) => !isDemoProduct(p)) : (isAuthMerchant ? [] : rawItems);
          // Authenticated real stores NEVER get fake showcase products injected
          const finalItems = isAuthMerchant ? items : (items.length > 0 ? items : SHOWCASE_PRODUCTS);
          setProducts(finalItems);

          // Cache in Dexie for offline lookup
          if (offlineDb?.offlineProducts) {
            await offlineDb.offlineProducts.bulkPut(
              finalItems.map((p) => ({
                id: p.id,
                tenantId: "current",
                name: p.name,
                sku: p.sku,
                barcode: p.barcode,
                salePrice: p.salePrice,
                wholesalePrice: p.wholesalePrice || (p as any).costPrice,
                taxRate: p.taxRate,
                stockQuantity: p.stockQuantity ?? 10,
                trackStock: p.trackStock ?? true,
                categoryId: p.categoryId,
                imageUrl: p.image || (p as any).imageUrl,
                syncedAt: Date.now(),
              }))
            );
          }
        } else if (offlineDb?.offlineProducts) {
          const cached = await offlineDb.offlineProducts.toArray();
          const cleanCached = (cached || []).filter((p: any) => !isDemoProduct(p));
          const finalCached = isAuthMerchant ? cleanCached : (cleanCached.length > 0 ? cleanCached : SHOWCASE_PRODUCTS);
          setProducts(
            finalCached.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              barcode: p.barcode,
              salePrice: p.salePrice,
              wholesalePrice: p.wholesalePrice || p.costPrice,
              taxRate: p.taxRate,
              stockQuantity: p.stockQuantity ?? 10,
              trackStock: p.trackStock,
              categoryId: p.categoryId,
              unit: p.unit,
              isScaleItem: p.isScaleItem,
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
        const isAuthMerchant = typeof window !== "undefined" && Boolean(localStorage.getItem("kaspi_store_id"));
        if (offlineDb?.offlineProducts) {
          const cached = await offlineDb.offlineProducts.toArray();
          const cleanCached = (cached || []).filter((p: any) => !isDemoProduct(p));
          const finalCached = isAuthMerchant ? cleanCached : (cleanCached.length > 0 ? cleanCached : SHOWCASE_PRODUCTS);
          setProducts(
            finalCached.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              barcode: p.barcode,
              salePrice: p.salePrice,
              wholesalePrice: p.wholesalePrice || p.costPrice,
              taxRate: p.taxRate,
              stockQuantity: p.stockQuantity ?? 10,
              trackStock: p.trackStock,
              categoryId: p.categoryId,
              unit: p.unit,
              isScaleItem: p.isScaleItem,
              image: p.imageUrl || p.image,
            }))
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setLoaderDone(true);
        }
      }
    }

    loadData();
    bootEdgeClientNanoSwarm({
      storeId: tenantInfo?.shopName || "kaspi-pos-terminal",
      posteCount: 1,
      countryCode: "MA",
    });
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
    <AutonomousSelfHealingBoundary scope="POS_TERMINAL">
    <div
      dir="ltr"
      style={getSectorCssVariables(storeType)}
      className="kaspi-transparent-shell flex flex-col h-screen overflow-hidden bg-transparent text-[var(--kaspi-text-primary)] font-sans"
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

            {/* Middle: Square Register Segmented View Switcher (Always Active) */}
            <div className="h-11 p-1 rounded-xl kaspi-glass-surface flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-kaspi-view-switch="grid"
                onClick={() => setGroceryView("grid")}
                className={`h-9 px-3 rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  groceryView === "grid"
                    ? "kaspi-glass-btn text-white font-black"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">
                  {locale === "ar" ? "الشبكة الذكية" : locale === "en" ? "Smart Grid" : "Grille Articles"}
                </span>
              </button>

              <button
                type="button"
                data-kaspi-view-switch="plu"
                onClick={() => setGroceryView("plu")}
                className={`h-9 px-3 rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  groceryView === "plu"
                    ? "kaspi-glass-btn text-white font-black"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">
                  {locale === "ar" ? "ميزان وخضر PLU" : locale === "en" ? "PLU & Scale" : "Balance & PLU"}
                </span>
              </button>

              <button
                type="button"
                data-kaspi-view-switch="price_check"
                onClick={() => setGroceryView("price_check")}
                className={`h-9 px-3 rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  groceryView === "price_check"
                    ? "kaspi-glass-btn text-white font-black"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <ScanBarcode className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">
                  {locale === "ar" ? "فاحص الثمن والصلاحية" : locale === "en" ? "Price & DLC" : "Vérif. Prix & DLC"}
                </span>
              </button>
            </div>

            {/* Right: + New Product */}
            <button
              type="button"
              onClick={() => setIsQuickProductModalOpen(true)}
              className="kaspi-glass-btn h-11 px-4 rounded-xl text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 transition-all active:scale-[0.98]"
              title={locale === "ar" ? "إضافة منتج جديد" : "Ajouter un produit"}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">
                {locale === "ar" ? "منتج جديد" : locale === "en" ? "New Product" : "Nouveau"}
              </span>
            </button>
          </div>

          {/* Zone L2: Flush Department Tabs & Scan Multiplier Bar */}
          <div className="flex items-center justify-between gap-2 h-10 pb-1 border-b border-white/[0.06]">
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
              <CategoryFilter categories={categories} />
            </div>

            {/* Scan Multiplier Bar (Always Active) */}
            <div className="h-8 p-0.5 rounded-lg kaspi-glass-surface flex items-center gap-0.5 shrink-0">
              <span className="font-mono text-[10px] font-bold text-zinc-400 px-2">
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
                      ? "kaspi-glass-btn text-white font-black shadow-xs"
                      : "text-zinc-400 hover:text-white font-bold hover:bg-white/[0.06]"
                  }`}
                >
                  {locale === "ar" ? item.labelAr : locale === "en" ? item.labelEn : item.labelFr}
                </button>
              ))}
            </div>
          </div>

          {/* Main Workspace (Smart Grid or PLU Scale Touch Keypad) */}
          <div className="flex-1 overflow-y-auto rounded-2xl kaspi-glass-card p-3 sm:p-3.5">
            {!loaderDone ? (
              <CatalogProgressLoader
                isLoading={isLoading}
                onReady={() => setLoaderDone(true)}
              />
            ) : groceryView === "plu" ? (
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
            isOpen={groceryView === "price_check"}
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

      {/* 1-Poste Hardware Seat Conflict Lock Modal */}
      <PosteConflictLockModal
        isOpen={Boolean(
          conflictData &&
            (conflictData.status === "DUAL_LOCKDOWN" || conflictData.status === "HARD_ADMIN_LOCK")
        )}
        conflictData={conflictData}
        locale={locale}
        onRefreshHeartbeat={checkPosteSeatIntegrity}
      />
    </div>
    </AutonomousSelfHealingBoundary>
  );
}
