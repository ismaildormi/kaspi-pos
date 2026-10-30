-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('draft', 'in_transit', 'completed', 'canceled');

-- CreateEnum
CREATE TYPE "InvoiceScanStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- AlterEnum
ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'partially_received';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'branch_manager';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'warehouse_keeper';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'accountant';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "whatsapp_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "whatsapp_phone" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supplier_id" UUID;

-- CreateTable
CREATE TABLE IF NOT EXISTS "stock_transfers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "transfer_number" TEXT NOT NULL,
    "source_store_id" UUID NOT NULL,
    "dest_store_id" UUID NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "shipped_at" TIMESTAMPTZ(6),
    "received_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "stock_transfer_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "transfer_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "received_qty" DECIMAL(12,3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "invoice_scan_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "supplier_id" UUID,
    "purchase_order_id" UUID,
    "image_url" TEXT NOT NULL,
    "status" "InvoiceScanStatus" NOT NULL DEFAULT 'pending',
    "extracted_data" JSONB,
    "confidence_score" DECIMAL(5,2),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoice_scan_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "z_reports" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "report_number" TEXT NOT NULL,
    "report_date" DATE NOT NULL,
    "opening_balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "cash_sales" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "card_sales" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "credit_sales" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total_sales" DECIMAL(12,2) NOT NULL,
    "total_tax" DECIMAL(12,2) NOT NULL,
    "transactions_count" INTEGER NOT NULL DEFAULT 0,
    "closing_balance" DECIMAL(12,2) NOT NULL,
    "cash_difference" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "sent_via_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "z_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "stock_predictions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "daily_velocity" DECIMAL(12,3) NOT NULL,
    "days_remaining" INTEGER NOT NULL,
    "predicted_stockout_at" TIMESTAMPTZ(6),
    "suggested_reorder_qty" DECIMAL(12,3) NOT NULL,
    "confidence_score" DECIMAL(5,2) NOT NULL,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_transfers_tenant_id_source_store_id_idx" ON "stock_transfers"("tenant_id", "source_store_id");
CREATE INDEX IF NOT EXISTS "stock_transfers_tenant_id_dest_store_id_idx" ON "stock_transfers"("tenant_id", "dest_store_id");
CREATE UNIQUE INDEX IF NOT EXISTS "stock_transfers_tenant_id_id_key" ON "stock_transfers"("tenant_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "stock_transfers_tenant_id_transfer_number_key" ON "stock_transfers"("tenant_id", "transfer_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_transfer_items_tenant_id_transfer_id_idx" ON "stock_transfer_items"("tenant_id", "transfer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "stock_transfer_items_tenant_id_id_key" ON "stock_transfer_items"("tenant_id", "id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoice_scan_jobs_tenant_id_status_idx" ON "invoice_scan_jobs"("tenant_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "invoice_scan_jobs_tenant_id_id_key" ON "invoice_scan_jobs"("tenant_id", "id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "z_reports_tenant_id_report_date_idx" ON "z_reports"("tenant_id", "report_date");
CREATE UNIQUE INDEX IF NOT EXISTS "z_reports_tenant_id_id_key" ON "z_reports"("tenant_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "z_reports_tenant_id_store_id_report_date_key" ON "z_reports"("tenant_id", "store_id", "report_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_predictions_tenant_id_days_remaining_idx" ON "stock_predictions"("tenant_id", "days_remaining");
CREATE UNIQUE INDEX IF NOT EXISTS "stock_predictions_tenant_id_id_key" ON "stock_predictions"("tenant_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "stock_predictions_tenant_id_store_id_product_id_key" ON "stock_predictions"("tenant_id", "store_id", "product_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_tenant_id_supplier_id_idx" ON "products"("tenant_id", "supplier_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_supplier_id_fkey" FOREIGN KEY ("tenant_id", "supplier_id") REFERENCES "suppliers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_tenant_id_source_store_id_fkey" FOREIGN KEY ("tenant_id", "source_store_id") REFERENCES "stores"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_tenant_id_dest_store_id_fkey" FOREIGN KEY ("tenant_id", "dest_store_id") REFERENCES "stores"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_tenant_id_transfer_id_fkey" FOREIGN KEY ("tenant_id", "transfer_id") REFERENCES "stock_transfers"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_tenant_id_product_id_fkey" FOREIGN KEY ("tenant_id", "product_id") REFERENCES "products"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "invoice_scan_jobs" ADD CONSTRAINT "invoice_scan_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "invoice_scan_jobs" ADD CONSTRAINT "invoice_scan_jobs_tenant_id_supplier_id_fkey" FOREIGN KEY ("tenant_id", "supplier_id") REFERENCES "suppliers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "invoice_scan_jobs" ADD CONSTRAINT "invoice_scan_jobs_tenant_id_purchase_order_id_fkey" FOREIGN KEY ("tenant_id", "purchase_order_id") REFERENCES "purchase_orders"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "z_reports" ADD CONSTRAINT "z_reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "z_reports" ADD CONSTRAINT "z_reports_tenant_id_store_id_fkey" FOREIGN KEY ("tenant_id", "store_id") REFERENCES "stores"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "stock_predictions" ADD CONSTRAINT "stock_predictions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "stock_predictions" ADD CONSTRAINT "stock_predictions_tenant_id_store_id_fkey" FOREIGN KEY ("tenant_id", "store_id") REFERENCES "stores"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "stock_predictions" ADD CONSTRAINT "stock_predictions_tenant_id_product_id_fkey" FOREIGN KEY ("tenant_id", "product_id") REFERENCES "products"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
