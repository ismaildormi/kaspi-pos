import { create } from "zustand";
import { persist } from "zustand/middleware";
import { offlineDb, type OfflineSale, type OfflineSaleItem } from "../db";
import { toDecimal, roundMoney } from "@/domain/money";

export interface PosProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  salePrice: number;
  taxRate: number;
  trackStock: boolean;
  stockQuantity?: number;
  categoryId?: string | null;
  categoryName?: string | null;
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
  quantity: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
  notes?: string;
}

export interface HeldCart {
  id: string;
  label: string;
  createdAt: number;
  items: CartItem[];
  customer: PosCustomer | null;
}

export type PaymentMethodType = "cash" | "card" | "credit" | "transfer";

interface PosState {
  // Session & Store Context
  tenantId: string;
  storeId: string;
  cashierUserId: string;

  // Active Cart State
  cart: CartItem[];
  customer: PosCustomer | null;
  discountPercent: number; // 0 to 100
  discountFixed: number;

  // Navigation & Filtering
  searchQuery: string;
  activeCategoryId: string | null;

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
  setSessionContext: (tenantId: string, storeId: string, cashierUserId: string) => void;
  addToCart: (product: PosProduct, quantity?: number) => void;
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

      cart: [],
      customer: null,
      discountPercent: 0,
      discountFixed: 0,

      searchQuery: "",
      activeCategoryId: null,

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
        const { cart, discountPercent, discountFixed } = get();
        const baseSubtotal = cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
        const percentDiscount = (baseSubtotal * discountPercent) / 100;
        return roundMoney(toDecimal(percentDiscount).plus(discountFixed)).toNumber();
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTaxTotal();
        const total = subtotal + tax;
        return roundMoney(toDecimal(total)).toNumber();
      },

      getChangeDue: () => {
        const { amountTendered, selectedPaymentMethod } = get();
        if (selectedPaymentMethod !== "cash") return 0;
        const tendered = parseFloat(amountTendered) || 0;
        const grandTotal = get().getGrandTotal();
        return Math.max(0, roundMoney(toDecimal(tendered).minus(grandTotal)).toNumber());
      },

      setSessionContext: (tenantId, storeId, cashierUserId) => {
        set({ tenantId, storeId, cashierUserId });
      },

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.cart.findIndex((i) => i.productId === product.id);

          if (existingIndex > -1) {
            const updated = [...state.cart];
            const current = updated[existingIndex];
            const newQty = current.quantity + quantity;
            const netAmount = (current.unitPrice * newQty) - current.discountAmount;
            const taxAmount = (netAmount * current.taxRate) / 100;
            const lineTotal = roundMoney(toDecimal(netAmount).plus(taxAmount)).toNumber();

            updated[existingIndex] = {
              ...current,
              quantity: newQty,
              lineTotal,
            };
            return { cart: updated };
          }

          const unitPrice = product.salePrice;
          const net = unitPrice * quantity;
          const tax = (net * product.taxRate) / 100;
          const lineTotal = roundMoney(toDecimal(net).plus(tax)).toNumber();

          const newItem: CartItem = {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            unitPrice,
            quantity,
            taxRate: product.taxRate,
            discountAmount: 0,
            lineTotal,
          };

          return { cart: [...state.cart, newItem] };
        });
      },

      updateItemQuantity: (productId, delta) => {
        set((state) => {
          const item = state.cart.find((i) => i.productId === productId);
          if (!item) return state;

          const newQty = item.quantity + delta;
          if (newQty <= 0) {
            return { cart: state.cart.filter((i) => i.productId !== productId) };
          }

          const net = (item.unitPrice * newQty) - item.discountAmount;
          const tax = (net * item.taxRate) / 100;
          const lineTotal = roundMoney(toDecimal(net).plus(tax)).toNumber();

          const updated = state.cart.map((i) =>
            i.productId === productId ? { ...i, quantity: newQty, lineTotal } : i
          );
          return { cart: updated };
        });
      },

      setItemQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const updated = state.cart.map((item) => {
            if (item.productId !== productId) return item;
            const net = (item.unitPrice * quantity) - item.discountAmount;
            const tax = (net * item.taxRate) / 100;
            const lineTotal = roundMoney(toDecimal(net).plus(tax)).toNumber();
            return { ...item, quantity, lineTotal };
          });
          return { cart: updated };
        });
      },

      removeItem: (productId) => {
        set((state) => ({ cart: state.cart.filter((i) => i.productId !== productId) }));
      },

      clearCart: () => {
        set({
          cart: [],
          customer: null,
          discountPercent: 0,
          discountFixed: 0,
          amountTendered: "",
          isPaymentModalOpen: false,
        });
      },

      setCustomer: (customer) => set({ customer }),
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

        // 1. Immediately store to Dexie Offline Database (Guaranteed Durability)
        try {
          if (offlineDb) {
            await offlineDb.offlineSales.add(offlineSaleRecord);
          }
        } catch (dbErr) {
          console.warn("Could not save to local Dexie:", dbErr);
        }

        await refreshOfflineQueueCount();

        // 2. Try online sync if network is available
        let isOffline = true;
        try {
          if (navigator.onLine) {
            const res = await fetch("/api/v1/sales", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientSaleId,
                idempotencyKey,
                storeId,
                customerId: customer?.id,
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
                })),
              }),
            });

            if (res.ok) {
              isOffline = false;
              if (offlineDb) {
                await offlineDb.offlineSales
                  .where("clientSaleId")
                  .equals(clientSaleId)
                  .modify({ status: "SYNCED", syncedAt: Date.now() });
              }
            }
          }
        } catch (netErr) {
          // Stays PENDING in Dexie for offline worker to synchronize
          isOffline = true;
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
          const count = await offlineDb.offlineSales
            .where("status")
            .equals("PENDING")
            .count();
          set({ pendingOfflineCount: count });
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
      }),
    }
  )
);
