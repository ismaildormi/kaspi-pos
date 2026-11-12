import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { offlineDb, type OfflineSale, type OfflineSaleItem } from "../db";
import { enqueueSyncItem, processSyncQueue, getSyncQueueCounts } from "../sync-engine";
import { toDecimal, roundMoney } from "@/domain/money";
import { getCachedData, setCachedData } from "@/lib/cache/client-cache";

export interface PosProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  price?: number;
  salePrice: number;
  wholesalePrice?: number | null;
  taxRate: number;
  trackStock: boolean;
  stockQuantity?: number;
  categoryId?: string | null;
  categoryName?: string | null;
  image?: string | null;
  isScaleItem?: boolean;
  scaleBarcodePrefix?: string | null;
  weightUnit?: string | null;
  tareWeightGrams?: number | null;
}

export interface PosCustomer {
  id: string;
  name: string;
  phone?: string | null;
  ice?: string | null;
  currentCreditBalance: number;
  creditLimit?: number | null;
  loyaltyPoints?: number;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  barcode?: string | null;
  unitPrice: number;
  retailPrice?: number;
  wholesalePrice?: number | null;
  quantity: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
  notes?: string;
  lastUpdatedAt?: number;
}

export interface HeldCart {
  id: string;
  label: string;
  createdAt: number;
  items: CartItem[];
  customer: PosCustomer | null;
}

export type PaymentMethodType = "cash" | "card" | "credit" | "transfer";
export type StoreIndustryType =
  | "grocery"
  | "butchery"
  | "restaurant"
  | "bakery"
  | "fashion"
  | "electronics"
  | "tech"
  | "wholesale";
export type StoreBusinessType = StoreIndustryType;

interface PosState {
  // Session & Store Context
  tenantId: string;
  storeId: string;
  cashierUserId: string;
  deviceCount: number;
  storeType: StoreIndustryType;
  onboardingCompleted: boolean;
  selectedTableId: string | null;
  selectedTableName: string | null;
  loyaltyPointsToRedeem: number;
  tenantInfo?: {
    shopName?: string;
    legalName?: string;
    logoUrl?: string;
    ice?: string;
    taxId?: string;
    rcNumber?: string;
    address?: string;
    city?: string;
    phone?: string;
    receiptHeader?: string;
    receiptFooter?: string;
  };
  printerSettings: {
    receiptLanguage: "ar" | "fr" | "en" | "tr" | "es" | "de";
    paperWidthMm: 58 | 80;
    printerConnectionMode: "auto" | "usb_serial" | "network" | "browser";
    printer: string;
    printerIp: string;
    printerPort: string;
    autoPrintReceipt: boolean;
    openDrawer: boolean;
    showStoreLogo: boolean;
    receiptHeader: string;
    receiptFooter: string;
  };

  // Active Cart State
  cart: CartItem[];
  customer: PosCustomer | null;
  pricingTier: "retail" | "wholesale";
  discountPercent: number; // 0 to 100
  discountFixed: number;

  // Navigation & Filtering
  searchQuery: string;
  activeCategoryId: string | null;
  lastInteractedProductId: string | null;

  // Checkout & Payment State
  isPaymentModalOpen: boolean;
  selectedPaymentMethod: PaymentMethodType;
  amountTendered: string; // for cash input
  isProcessingPayment: boolean;

  // Parked / Held Carts
  heldCarts: HeldCart[];

  // Offline Sync State
  isOnline: boolean;
  pendingOfflineCount: number;

  // Getters / Calculated Totals
  getSubtotal: () => number;
  getTaxTotal: () => number;
  getDiscountTotal: () => number;
  getGrandTotal: () => number;
  getChangeDue: () => number;

  // Actions
  setSessionContext: (tenantId: string, storeId: string, cashierUserId: string, deviceCount?: number) => void;
  setDeviceCount: (count: number) => void;
  setStoreProfile: (storeType: StoreIndustryType, onboardingCompleted?: boolean) => void;
  setSelectedTable: (tableId: string | null, tableName?: string | null) => void;
  setLoyaltyPointsToRedeem: (points: number) => void;
  setTenantInfo: (info: PosState["tenantInfo"]) => void;
  setPrinterSettings: (settings: Partial<PosState["printerSettings"]>) => void;
  addToCart: (product: PosProduct, quantity?: number, notes?: string) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  addProductByBarcode: (product: PosProduct, quantity?: number) => void;
  setPricingTier: (tier: "retail" | "wholesale") => void;
  updateItemQuantity: (productId: string, delta: number) => void;
  setItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCustomer: (customer: PosCustomer | null) => void;
  setDiscount: (percent: number, fixed?: number) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (categoryId: string | null) => void;

  // Payment Actions
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  setPaymentMethod: (method: PaymentMethodType) => void;
  setAmountTendered: (amount: string) => void;
  completeSale: () => Promise<{ success: boolean; clientSaleId: string; isOffline: boolean; error?: string }>;

  // Park / Hold Cart Actions
  holdCurrentCart: (label?: string) => Promise<void>;
  resumeHeldCart: (heldCartId: string) => void;
  deleteHeldCart: (heldCartId: string) => void;

  // Offline Sync Actions
  setIsOnline: (online: boolean) => void;
  refreshOfflineQueueCount: () => Promise<void>;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      tenantId: "",
      storeId: "",
      cashierUserId: "",
      deviceCount: 1,
      storeType: "grocery",
      onboardingCompleted: true,
      selectedTableId: null,
      selectedTableName: null,
      loyaltyPointsToRedeem: 0,
      printerSettings: {
        receiptLanguage: "fr",
        paperWidthMm: 80,
        printerConnectionMode: "auto",
        printer: "",
        printerIp: "192.168.1.50",
        printerPort: "9100",
        autoPrintReceipt: false,
        openDrawer: true,
        showStoreLogo: true,
        receiptHeader: "",
        receiptFooter: "",
      },

      cart: [],
      customer: null,
      pricingTier: "retail",
      discountPercent: 0,
      discountFixed: 0,

      searchQuery: "",
      activeCategoryId: null,
      lastInteractedProductId: null,

      isPaymentModalOpen: false,
      selectedPaymentMethod: "cash",
      amountTendered: "",
      isProcessingPayment: false,

      heldCarts: [],
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      pendingOfflineCount: 0,

      getSubtotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => {
          const itemNet = (item.unitPrice * item.quantity) - item.discountAmount;
          return sum + Math.max(0, itemNet);
        }, 0);
      },

      getTaxTotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => {
          const itemNet = (item.unitPrice * item.quantity) - item.discountAmount;
          const tax = (Math.max(0, itemNet) * item.taxRate) / 100;
          return sum + tax;
        }, 0);
      },

      getDiscountTotal: () => {
        const { cart, discountPercent, discountFixed, loyaltyPointsToRedeem } = get();
        const baseSubtotal = cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
        const percentDiscount = (baseSubtotal * discountPercent) / 100;
        const loyaltyDiscountMad = (loyaltyPointsToRedeem || 0) * 0.1; // 10 points = 1 MAD
        return roundMoney(toDecimal(percentDiscount).plus(discountFixed).plus(loyaltyDiscountMad)).toNumber();
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTaxTotal();
        const loyaltyDiscountMad = (get().loyaltyPointsToRedeem || 0) * 0.1;
        const total = Math.max(0, subtotal + tax - loyaltyDiscountMad);
        return roundMoney(toDecimal(total)).toNumber();
      },

      getChangeDue: () => {
        const { amountTendered, selectedPaymentMethod } = get();
        if (selectedPaymentMethod !== "cash") return 0;
        const tendered = parseFloat(amountTendered) || 0;
        const grandTotal = get().getGrandTotal();
        return Math.max(0, roundMoney(toDecimal(tendered).minus(grandTotal)).toNumber());
      },

      setSessionContext: (tenantId, storeId, cashierUserId, deviceCount) => {
        set({
          tenantId,
          storeId,
          cashierUserId,
          ...(deviceCount !== undefined ? { deviceCount: Math.max(1, deviceCount) } : {}),
        });
      },

      setDeviceCount: (deviceCount) => {
        set({ deviceCount: Math.max(1, deviceCount) });
      },

      setStoreProfile: (storeType, onboardingCompleted = true) => {
        set({ storeType, onboardingCompleted });
      },

      setSelectedTable: (selectedTableId, selectedTableName = null) => {
        set({ selectedTableId, selectedTableName });
      },

      setLoyaltyPointsToRedeem: (points) => {
        set({ loyaltyPointsToRedeem: Math.max(0, Math.floor(points)) });
      },

      setTenantInfo: (tenantInfo) => {
        set({ tenantInfo });
      },

      setPrinterSettings: (newSettings) => {
        set((state) => {
          const updated = { ...state.printerSettings, ...newSettings };
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("kaspi.printer.settings", JSON.stringify(updated));
            } catch {
              // ignore storage error
            }
          }
          return { printerSettings: updated };
        });
      },

      setPricingTier: (tier) => {
        set((state) => {
          const updated = state.cart.map((item) => {
            const unitPrice =
              tier === "wholesale" && item.wholesalePrice && item.wholesalePrice > 0
                ? item.wholesalePrice
                : (item.retailPrice ?? item.unitPrice);
            const netAmount = (unitPrice * item.quantity) - item.discountAmount;
            const taxAmount = (netAmount * item.taxRate) / 100;
            const lineTotal = roundMoney(toDecimal(netAmount).plus(taxAmount)).toNumber();
            return {
              ...item,
              unitPrice,
              lineTotal,
            };
          });
          return { pricingTier: tier, cart: updated };
        });
      },

      addToCart: (product, quantity = 1, notes) => {
        // Stock Availability Check
        if (product.trackStock && (product.stockQuantity ?? 0) <= 0) {
          toast.warning(`Warning: ${product.name} is out of stock!`, {
            style: {
              background: "#09090b",
              color: "#facc15",
              border: "1px solid #854d0e",
            },
          });
        }

        set((state) => {
          const now = Date.now();
          const existingIndex = state.cart.findIndex((i) => i.productId === product.id);
          const retailPrice = Number(product.salePrice ?? product.price ?? 0);
          const wholesalePrice = product.wholesalePrice ? Number(product.wholesalePrice) : null;
          const resolvedUnitPrice =
            state.pricingTier === "wholesale" && wholesalePrice && wholesalePrice > 0
              ? wholesalePrice
              : retailPrice;
          const resolvedTaxRate = Number(product.taxRate ?? 20);

          if (existingIndex > -1) {
            const current = state.cart[existingIndex];
            const newQty = roundMoney(toDecimal(current.quantity).plus(quantity)).toNumber();
            const netAmount = (current.unitPrice * newQty) - current.discountAmount;
            const taxAmount = (netAmount * current.taxRate) / 100;
            const lineTotal = roundMoney(toDecimal(netAmount).plus(taxAmount)).toNumber();

            const updatedItem: CartItem = {
              ...current,
              quantity: newQty,
              lineTotal,
              notes: notes || current.notes,
              lastUpdatedAt: now,
            };

            const otherItems = state.cart.filter((_, idx) => idx !== existingIndex);
            return {
              cart: [updatedItem, ...otherItems],
              lastInteractedProductId: product.id,
            };
          }

          const unitPrice = resolvedUnitPrice;
          const net = unitPrice * quantity;
          const tax = (net * resolvedTaxRate) / 100;
          const lineTotal = roundMoney(toDecimal(net).plus(tax)).toNumber();

          const newItem: CartItem = {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            unitPrice,
            retailPrice,
            wholesalePrice,
            quantity,
            taxRate: resolvedTaxRate,
            discountAmount: 0,
            lineTotal,
            notes,
            lastUpdatedAt: now,
          };

          return {
            cart: [newItem, ...state.cart],
            lastInteractedProductId: product.id,
          };
        });
      },

      updateItemNotes: (productId, notes) => {
        set((state) => ({
          cart: state.cart.map((item) =>
            item.productId === productId ? { ...item, notes } : item
          ),
        }));
      },

      addProductByBarcode: (product, quantity = 1) => {
        // 1. Stock Availability Check
        if (product.trackStock && (product.stockQuantity ?? 0) <= 0) {
          toast.warning(`Warning: ${product.name} is out of stock!`, {
            style: {
              background: "#09090b",
              color: "#fb923c",
              border: "1px solid #9a3412",
            },
          });
        } else {
          toast.success(`${product.name} added to cart`, {
            style: {
              background: "#09090b",
              color: "#ffffff",
              border: "1px solid #27272a",
            },
          });
        }

        // 2. Add or increment item in cart & recalculate line and cart totals (including tax)
        set((state) => {
          const now = Date.now();
          const existingIndex = state.cart.findIndex((i) => i.productId === product.id);
          const retailPrice = Number(product.salePrice ?? product.price ?? 0);
          const wholesalePrice = product.wholesalePrice ? Number(product.wholesalePrice) : null;
          const resolvedUnitPrice =
            state.pricingTier === "wholesale" && wholesalePrice && wholesalePrice > 0
              ? wholesalePrice
              : retailPrice;
          const resolvedTaxRate = Number(product.taxRate ?? 20);

          if (existingIndex > -1) {
            const current = state.cart[existingIndex];
            const newQty = roundMoney(toDecimal(current.quantity).plus(quantity)).toNumber();
            const netAmount = (current.unitPrice * newQty) - current.discountAmount;
            const taxAmount = (netAmount * current.taxRate) / 100;
            const lineTotal = roundMoney(toDecimal(netAmount).plus(taxAmount)).toNumber();

            const updatedItem: CartItem = {
              ...current,
              quantity: newQty,
              lineTotal,
              lastUpdatedAt: now,
            };

            const otherItems = state.cart.filter((_, idx) => idx !== existingIndex);
            return {
              cart: [updatedItem, ...otherItems],
              lastInteractedProductId: product.id,
            };
          }

          const net = resolvedUnitPrice * quantity;
          const tax = (net * resolvedTaxRate) / 100;
          const lineTotal = roundMoney(toDecimal(net).plus(tax)).toNumber();

          const newItem: CartItem = {
            productId: product.id,
            name: product.name || "Unknown Product",
            sku: product.sku || product.barcode || "SKU",
            barcode: product.barcode,
            unitPrice: resolvedUnitPrice,
            retailPrice,
            wholesalePrice,
            quantity,
            taxRate: resolvedTaxRate,
            discountAmount: 0,
            lineTotal,
            lastUpdatedAt: now,
          };

          return {
            cart: [newItem, ...state.cart],
            lastInteractedProductId: product.id,
          };
        });
      },

      updateItemQuantity: (productId, delta) => {
        set((state) => {
          const now = Date.now();
          const item = state.cart.find((i) => i.productId === productId);
          if (!item) return state;

          const newQty = item.quantity + delta;
          if (newQty <= 0) {
            return {
              cart: state.cart.filter((i) => i.productId !== productId),
              lastInteractedProductId: state.lastInteractedProductId === productId ? null : state.lastInteractedProductId,
            };
          }

          const net = (item.unitPrice * newQty) - item.discountAmount;
          const tax = (net * item.taxRate) / 100;
          const lineTotal = roundMoney(toDecimal(net).plus(tax)).toNumber();

          const updatedItem: CartItem = {
            ...item,
            quantity: newQty,
            lineTotal,
            lastUpdatedAt: now,
          };

          const otherItems = state.cart.filter((i) => i.productId !== productId);
          return {
            cart: [updatedItem, ...otherItems],
            lastInteractedProductId: productId,
          };
        });
      },

      setItemQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const now = Date.now();
          const item = state.cart.find((i) => i.productId === productId);
          if (!item) return state;

          const net = (item.unitPrice * quantity) - item.discountAmount;
          const tax = (net * item.taxRate) / 100;
          const lineTotal = roundMoney(toDecimal(net).plus(tax)).toNumber();

          const updatedItem: CartItem = {
            ...item,
            quantity,
            lineTotal,
            lastUpdatedAt: now,
          };

          const otherItems = state.cart.filter((i) => i.productId !== productId);
          return {
            cart: [updatedItem, ...otherItems],
            lastInteractedProductId: productId,
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          cart: state.cart.filter((i) => i.productId !== productId),
          lastInteractedProductId: state.lastInteractedProductId === productId ? null : state.lastInteractedProductId,
        }));
      },

      clearCart: () => {
        set({
          cart: [],
          customer: null,
          discountPercent: 0,
          discountFixed: 0,
          loyaltyPointsToRedeem: 0,
          amountTendered: "",
          isPaymentModalOpen: false,
          lastInteractedProductId: null,
        });
      },

      setCustomer: (customer) => set({ customer, loyaltyPointsToRedeem: 0 }),
      setDiscount: (percent, fixed = 0) => set({ discountPercent: percent, discountFixed: fixed }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setActiveCategory: (activeCategoryId) => set({ activeCategoryId }),

      openPaymentModal: () => {
        const grandTotal = get().getGrandTotal();
        set({
          isPaymentModalOpen: true,
          amountTendered: grandTotal.toFixed(2), // default cash to exact grand total
        });
      },

      closePaymentModal: () => set({ isPaymentModalOpen: false, isProcessingPayment: false }),
      setPaymentMethod: (selectedPaymentMethod) => set({ selectedPaymentMethod }),
      setAmountTendered: (amountTendered) => set({ amountTendered }),

      // Complete Checkout with Offline-First Dexie Queue
      completeSale: async () => {
        const {
          cart,
          customer,
          tenantId,
          storeId,
          cashierUserId,
          selectedPaymentMethod,
          selectedTableId,
          loyaltyPointsToRedeem,
          amountTendered,
          getSubtotal,
          getTaxTotal,
          getDiscountTotal,
          getGrandTotal,
          getChangeDue,
          clearCart,
          refreshOfflineQueueCount,
        } = get();

        if (cart.length === 0) {
          return { success: false, clientSaleId: "", isOffline: false, error: "Cart is empty" };
        }

        set({ isProcessingPayment: true });

        const clientSaleId = crypto.randomUUID();
        const idempotencyKey = `sale_${clientSaleId}`;
        const subtotal = getSubtotal();
        const taxTotal = getTaxTotal();
        const discountTotal = getDiscountTotal();
        const grandTotal = getGrandTotal();
        const paidTotal = selectedPaymentMethod === "cash" ? Math.max(grandTotal, parseFloat(amountTendered) || grandTotal) : grandTotal;
        const changeDue = getChangeDue();
        const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

        const offlineSaleRecord: OfflineSale = {
          clientSaleId,
          tenantId,
          storeId,
          receiptNumber,
          customerId: customer?.id || null,
          customerName: customer?.name || null,
          cashierUserId,
          subtotal,
          taxTotal,
          discountTotal,
          grandTotal,
          paidTotal,
          changeDue,
          status: "PENDING",
          idempotencyKey,
          createdAt: Date.now(),
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            sku: i.sku,
            barcode: i.barcode || undefined,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            taxRate: i.taxRate,
            discountAmount: i.discountAmount,
            lineTotal: i.lineTotal,
            notes: i.notes,
          })),
          payments: [
            {
              method: selectedPaymentMethod,
              amount: grandTotal,
            },
          ],
        };

        const saleApiPayload = {
          clientSaleId,
          idempotencyKey,
          storeId,
          customerId: customer?.id,
          tableId: selectedTableId || undefined,
          redeemedPoints: loyaltyPointsToRedeem > 0 ? loyaltyPointsToRedeem : undefined,
          subtotal,
          taxTotal,
          discountTotal,
          grandTotal,
          paidTotal,
          changeDue,
          paymentMethod: selectedPaymentMethod,
          items: cart.map((i, idx) => ({
            productId: i.productId,
            lineNo: idx + 1,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            taxRate: i.taxRate,
            discountAmount: i.discountAmount,
            notes: i.notes,
          })),
        };

        // 1. Save to local Dexie database (sales, products stock, customers credit) + Outbox `sync_queue`
        try {
          if (offlineDb) {
            await offlineDb.offlineSales.add(offlineSaleRecord);

            // Decrement local Dexie product stock for true offline stock tracking
            for (const item of cart) {
              const localProd = await offlineDb.offlineProducts.get(item.productId);
              if (localProd && localProd.trackStock) {
                const updatedStock = Math.max(0, (localProd.stockQuantity ?? 0) - item.quantity);
                await offlineDb.offlineProducts.update(item.productId, {
                  stockQuantity: updatedStock,
                });
              }
            }

            // Real-Time 0ms Client Cache Deduction (products_catalog)
            try {
              const cached = getCachedData<any[]>("products_catalog", []);
              if (Array.isArray(cached.data) && cached.data.length > 0) {
                const updated = cached.data.map((p) => {
                  const sold = cart.find((i) => i.productId === p.id);
                  if (sold && p.trackStock) {
                    return {
                      ...p,
                      stockQuantity: Math.max(0, (p.stockQuantity ?? 0) - sold.quantity),
                    };
                  }
                  return p;
                });
                setCachedData("products_catalog", updated);
              }
            } catch (cacheErr) {
              console.warn("Could not update products_catalog in client-cache:", cacheErr);
            }

            // Broadcast real-time stock deduction event to all open tabs and POS canvas
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("kaspi_stock_updated", {
                  detail: {
                    items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
                  },
                })
              );
            }

            // Update local customer credit balance if credit sale
            if (selectedPaymentMethod === "credit" && customer?.id) {
              const localCust = await offlineDb.offlineCustomers.get(customer.id);
              if (localCust) {
                await offlineDb.offlineCustomers.update(customer.id, {
                  currentCreditBalance: (localCust.currentCreditBalance || 0) + grandTotal,
                });
              }
            }

            // 2. Add entry to Dexie `sync_queue` with status 'pending'
            await enqueueSyncItem("SALE", saleApiPayload, clientSaleId);
          }
        } catch (dbErr) {
          console.warn("Could not save to local Dexie:", dbErr);
        }

        await refreshOfflineQueueCount();

        // 3. Check network connectivity & process outbox queue
        let isOffline = !navigator.onLine;
        if (!navigator.onLine) {
          toast.success("Sale saved locally. Will sync when online.", {
            style: {
              background: "#09090b",
              color: "#ffffff",
              border: "1px solid #27272a",
            },
          });
        } else {
          try {
            const syncRes = await processSyncQueue();
            isOffline = syncRes.remainingPending > 0;
          } catch {
            isOffline = true;
          }
        }

        await refreshOfflineQueueCount();
        clearCart();
        set({ isProcessingPayment: false });

        return {
          success: true,
          clientSaleId,
          isOffline,
        };
      },

      // Hold / Park Cart
      holdCurrentCart: async (label) => {
        const { cart, customer, heldCarts, clearCart } = get();
        if (cart.length === 0) return;

        const heldId = `hold_${Date.now()}`;
        const newHeld: HeldCart = {
          id: heldId,
          label: label || `Commande #${heldCarts.length + 1} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          createdAt: Date.now(),
          items: [...cart],
          customer: customer ? { ...customer } : null,
        };

        if (offlineDb) {
          await offlineDb.offlineHeldCarts.put({
            id: newHeld.id,
            label: newHeld.label,
            createdAt: newHeld.createdAt,
            items: newHeld.items,
            customerId: customer?.id,
            customerName: customer?.name,
          });
        }

        set({ heldCarts: [newHeld, ...heldCarts] });
        clearCart();
      },

      resumeHeldCart: (heldCartId) => {
        const { heldCarts, cart } = get();
        const target = heldCarts.find((h) => h.id === heldCartId);
        if (!target) return;

        // If active cart has items, prompt or hold it first
        if (cart.length > 0) {
          get().holdCurrentCart();
        }

        set({
          cart: target.items,
          customer: target.customer,
          heldCarts: heldCarts.filter((h) => h.id !== heldCartId),
        });

        if (offlineDb) {
          offlineDb.offlineHeldCarts.delete(heldCartId).catch(() => {});
        }
      },

      deleteHeldCart: (heldCartId) => {
        set((state) => ({ heldCarts: state.heldCarts.filter((h) => h.id !== heldCartId) }));
        if (offlineDb) {
          offlineDb.offlineHeldCarts.delete(heldCartId).catch(() => {});
        }
      },

      setIsOnline: (isOnline) => set({ isOnline }),

      refreshOfflineQueueCount: async () => {
        if (!offlineDb) return;
        try {
          const counts = await getSyncQueueCounts();
          set({ pendingOfflineCount: counts.pending });
        } catch {
          // ignore in SSR
        }
      },
    }),
    {
      name: "kasbi_pos_cart_storage",
      partialize: (state) => ({
        cart: state.cart,
        customer: state.customer,
        heldCarts: state.heldCarts,
        discountPercent: state.discountPercent,
        tenantInfo: state.tenantInfo,
        printerSettings: state.printerSettings,
        storeType: state.storeType,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);
