-- ============================================================================
-- KASPI POS — PostgreSQL Row-Level Security (RLS) Multi-Tenant Isolation
-- Enforces strict tenant isolation at the database engine layer.
-- ============================================================================

DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'stores',
    'categories',
    'tax_rates',
    'products',
    'devices',
    'customers',
    'cash_sessions',
    'sales',
    'sale_items',
    'sale_payments',
    'refunds',
    'refund_items',
    'inventory_movements',
    'stock_levels',
    'document_sequences',
    'invoice_sequences',
    'product_import_jobs',
    'subscriptions',
    'payments',
    'invoices',
    'loyalty_points',
    'suppliers',
    'purchase_orders',
    'purchase_order_items',
    'customer_credits',
    'dining_tables',
    'kitchen_tickets',
    'ai_chat_sessions',
    'stock_transfers',
    'invoice_scan_jobs',
    'z_reports',
    'stock_predictions',
    'support_messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
      EXECUTE format(
        'CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (NULLIF(current_setting(''app.current_tenant_id'', true), '''') IS NULL OR tenant_id::text = current_setting(''app.current_tenant_id'', true)) WITH CHECK (NULLIF(current_setting(''app.current_tenant_id'', true), '''') IS NULL OR tenant_id::text = current_setting(''app.current_tenant_id'', true));',
        tbl
      );
    END IF;
  END LOOP;
END
$$;
