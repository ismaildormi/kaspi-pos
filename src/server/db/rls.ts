import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma, PrismaClient } from "@prisma/client";

export interface TenantRlsContext {
  tenantId?: string;
  userId?: string;
  isSuperAdmin?: boolean;
}

export const tenantStorage = new AsyncLocalStorage<TenantRlsContext>();

export function setActiveTenantContext(context: TenantRlsContext): void {
  tenantStorage.enterWith(context);
}

export function runWithTenantContext<T>(
  context: TenantRlsContext,
  callback: () => T
): T {
  return tenantStorage.run(context, callback);
}

export function getActiveTenantContext(): TenantRlsContext | undefined {
  return tenantStorage.getStore();
}

const TENANT_SCOPED_MODELS = new Set([
  "Store",
  "Category",
  "TaxRate",
  "Product",
  "Device",
  "Customer",
  "CashSession",
  "Sale",
  "SaleItem",
  "SalePayment",
  "Refund",
  "RefundItem",
  "InventoryMovement",
  "StockLevel",
  "DocumentSequence",
  "ProductImportJob",
  "Subscription",
  "Payment",
  "Invoice",
  "LoyaltyPoint",
  "Supplier",
  "PurchaseOrder",
  "PurchaseOrderItem",
  "CustomerCredit",
  "DiningTable",
  "KitchenTicket",
  "AIChatSession",
  "StockTransfer",
  "InvoiceScanJob",
  "ZReport",
  "StockPrediction",
  "SupportMessage",
]);

/**
 * Prisma Client Extension that enforces PostgreSQL Row-Level Security (RLS)
 * by binding `app.current_tenant_id` in the active transaction scope using
 * the `tenantId` stored in `AsyncLocalStorage`.
 */
export function prismaRlsExtension() {
  return Prisma.defineExtension((client) =>
    client.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, args, query }) {
            const store = tenantStorage.getStore();
            const tenantId = store?.tenantId;

            if (
              !tenantId ||
              store?.isSuperAdmin ||
              !model ||
              !TENANT_SCOPED_MODELS.has(model)
            ) {
              return query(args);
            }

            const [, result] = await client.$transaction([
              client.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`,
              query(args),
            ]);
            return result;
          },
        },
      },
    })
  );
}

export function extendPrismaWithRls(baseClient: PrismaClient): PrismaClient {
  return baseClient.$extends(prismaRlsExtension()) as unknown as PrismaClient;
}
