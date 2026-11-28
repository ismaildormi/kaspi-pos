import Dexie, { type Table } from "dexie";

export interface OfflineSaleItem {
  productId: string;
  name: string;
  sku?: string;
  barcode?: string | null;
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
  imageUrl?: string | null;
  salePrice: number;
  price?: number;
  wholesalePrice?: number | null;
  costPrice?: number | null;
  taxRate: number;
  trackStock: boolean;
  stockQuantity?: number;
  categoryId?: string | null;
  categoryName?: string | null;
  unit?: string | null;
  isScaleItem?: boolean;
  syncedAt?: number;
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

export type SyncQueueEntityType = "SALE" | "CUSTOMER" | "PRODUCT";
export type SyncQueueStatus = "pending" | "syncing" | "failed";

export interface SyncQueueItem {
  id: string; // uuid
  type: SyncQueueEntityType;
  payload: Record<string, any>;
  status: SyncQueueStatus;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export class KasbiOfflineDatabase extends Dexie {
  offlineSales!: Table<OfflineSale, number>;
  offlineProducts!: Table<OfflineProduct, string>;
  offlineCustomers!: Table<OfflineCustomer, string>;
  offlineHeldCarts!: Table<OfflineHeldCart, string>;
  sync_queue!: Table<SyncQueueItem, string>;

  constructor(dbName: string = "kasbi_pos_offline_db") {
    super(dbName);

    this.version(1).stores({
      offlineSales:
        "++id, clientSaleId, tenantId, storeId, receiptNumber, status, createdAt",
      offlineProducts: "id, tenantId, barcode, sku, name, categoryId",
      offlineCustomers: "id, tenantId, name, phone, ice",
      offlineHeldCarts: "id, createdAt",
    });

    this.version(2).stores({
      offlineSales:
        "++id, clientSaleId, tenantId, storeId, receiptNumber, status, createdAt",
      offlineProducts: "id, tenantId, barcode, sku, name, categoryId",
      offlineCustomers: "id, tenantId, name, phone, ice",
      offlineHeldCarts: "id, createdAt",
      sync_queue: "id, type, status, createdAt, retryCount",
    });
  }
}

// Per-tenant partitioned IndexedDB instances so different accounts/Gmails on the same PC never mix data
const tenantDbInstances = new Map<string, KasbiOfflineDatabase>();

export function getActiveOfflineTenantId(): string {
  if (typeof window === "undefined") return "default";
  try {
    return window.localStorage.getItem("kaspi_active_tenant_id") || "default";
  } catch {
    return "default";
  }
}

export function getTenantOfflineDb(explicitTenantId?: string): KasbiOfflineDatabase {
  const tid = (explicitTenantId || getActiveOfflineTenantId()).replace(/[^a-zA-Z0-9_-]/g, "_");
  const dbName = tid === "default" ? "kasbi_pos_offline_db" : `kasbi_pos_offline_db_${tid}`;
  let instance = tenantDbInstances.get(dbName);
  if (!instance) {
    instance = new KasbiOfflineDatabase(dbName);
    tenantDbInstances.set(dbName, instance);
  }
  return instance;
}

// Tenant-aware browser Proxy: dynamically routes every table/method call to the active tenant's DB
export const offlineDb: KasbiOfflineDatabase =
  typeof window !== "undefined"
    ? (new Proxy({} as KasbiOfflineDatabase, {
        get(_target, prop) {
          const db = getTenantOfflineDb();
          const val = (db as any)[prop];
          return typeof val === "function" ? val.bind(db) : val;
        },
      }) as KasbiOfflineDatabase)
    : (null as any);
