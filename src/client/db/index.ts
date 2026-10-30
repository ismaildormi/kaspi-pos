import Dexie, { type Table } from "dexie";

export interface OfflineSaleItem {
  productId: string;
  name: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
  notes?: string;
}

export interface OfflineSalePayment {
  method: "cash" | "card" | "credit" | "transfer";
  amount: number;
  reference?: string;
}

export interface OfflineSale {
  id?: number;
  clientSaleId: string;
  tenantId: string;
  storeId: string;
  receiptNumber: string;
  customerId?: string | null;
  customerName?: string | null;
  cashierUserId: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidTotal: number;
  changeDue: number;
  items: OfflineSaleItem[];
  payments: OfflineSalePayment[];
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  idempotencyKey: string;
  createdAt: number; // timestamp
  syncedAt?: number;
  errorMessage?: string;
}

export interface OfflineProduct {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  barcode?: string | null;
  salePrice: number;
  costPrice?: number | null;
  taxRate: number;
  trackStock: boolean;
  stockQuantity?: number;
  categoryId?: string | null;
  categoryName?: string | null;
}

export interface OfflineCustomer {
  id: string;
  tenantId: string;
  name: string;
  phone?: string | null;
  ice?: string | null;
  currentCreditBalance: number;
  creditLimit?: number | null;
}

export interface OfflineHeldCart {
  id: string;
  label: string;
  createdAt: number;
  items: OfflineSaleItem[];
  customerId?: string | null;
  customerName?: string | null;
}

export class KasbiOfflineDatabase extends Dexie {
  offlineSales!: Table<OfflineSale, number>;
  offlineProducts!: Table<OfflineProduct, string>;
  offlineCustomers!: Table<OfflineCustomer, string>;
  offlineHeldCarts!: Table<OfflineHeldCart, string>;

  constructor() {
    super("kasbi_pos_offline_db");

    this.version(1).stores({
      offlineSales: "++id, clientSaleId, tenantId, storeId, receiptNumber, status, createdAt",
      offlineProducts: "id, tenantId, barcode, sku, name, categoryId",
      offlineCustomers: "id, tenantId, name, phone, ice",
      offlineHeldCarts: "id, createdAt",
    });
  }
}

// Global browser singleton
export const offlineDb =
  typeof window !== "undefined" ? new KasbiOfflineDatabase() : (null as any);
