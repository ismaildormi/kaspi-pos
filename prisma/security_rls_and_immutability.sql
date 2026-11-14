-- ============================================================================
-- KASPI POS — LAYER 2: NEON POSTGRESQL RLS, APPEND-ONLY FORENSIC IMMUTABILITY,
--                      pgAudit & PITR COMPLIANCE POLICY
-- ============================================================================
-- Execute against Neon PostgreSQL (or compatible PostgreSQL 15+):
--   psql "$DATABASE_URL" -f prisma/security_rls_and_immutability.sql
-- ============================================================================

-- 1. STRICT MULTI-TENANT ROW-LEVEL SECURITY (RLS)
-- Uses session parameter `app.current_tenant_id` set per transaction by `db-rls-guard.ts`.

ALTER TABLE IF EXISTS stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stores FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sale_items FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppliers FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices FORCE ROW LEVEL SECURITY;

-- Drop existing policies cleanly if re-running
DROP POLICY IF EXISTS kaspi_tenant_isolation_stores ON stores;
DROP POLICY IF EXISTS kaspi_tenant_isolation_products ON products;
DROP POLICY IF EXISTS kaspi_tenant_isolation_sales ON sales;
DROP POLICY IF EXISTS kaspi_tenant_isolation_sale_items ON sale_items;
DROP POLICY IF EXISTS kaspi_tenant_isolation_customers ON customers;
DROP POLICY IF EXISTS kaspi_tenant_isolation_suppliers ON suppliers;
DROP POLICY IF EXISTS kaspi_tenant_isolation_audit_logs ON audit_logs;
DROP POLICY IF EXISTS kaspi_tenant_isolation_invoices ON invoices;

-- Create strict tenant isolation policies
CREATE POLICY kaspi_tenant_isolation_stores ON stores
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY kaspi_tenant_isolation_products ON products
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY kaspi_tenant_isolation_sales ON sales
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY kaspi_tenant_isolation_sale_items ON sale_items
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY kaspi_tenant_isolation_customers ON customers
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY kaspi_tenant_isolation_suppliers ON suppliers
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY kaspi_tenant_isolation_audit_logs ON audit_logs
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY kaspi_tenant_isolation_invoices ON invoices
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));


-- 2. IMMUTABLE APPEND-ONLY DATABASE TRIGGERS (استحالة محو الأدلة)
-- Permanently blocks UPDATE, DELETE, and TRUNCATE on forensic audit & raw webhook evidence.

CREATE OR REPLACE FUNCTION forbid_forensic_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'FORENSIC_IMMUTABILITY_LOCK: UPDATE and DELETE are permanently forbidden on forensic evidence tables (table=%, op=%)', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable_upd_del ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable_upd_del
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION forbid_forensic_mutation();

DROP TRIGGER IF EXISTS trg_audit_logs_immutable_truncate ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable_truncate
  BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_forensic_mutation();

DROP TRIGGER IF EXISTS trg_webhook_events_immutable_del ON webhook_events;
CREATE TRIGGER trg_webhook_events_immutable_del
  BEFORE DELETE ON webhook_events
  FOR EACH ROW EXECUTE FUNCTION forbid_forensic_mutation();

DROP TRIGGER IF EXISTS trg_webhook_events_immutable_truncate ON webhook_events;
CREATE TRIGGER trg_webhook_events_immutable_truncate
  BEFORE TRUNCATE ON webhook_events
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_forensic_mutation();


-- 3. pgAudit & PITR COMPLIANCE SETTINGS (Enable in Neon / Managed Postgres Parameters)
-- CREATE EXTENSION IF NOT EXISTS pgaudit;
-- ALTER SYSTEM SET pgaudit.log = 'write, ddl, role';
-- ALTER SYSTEM SET pgaudit.log_parameter = on;
-- PITR Retention: Enable Neon Point-in-Time Recovery (minimum 7-30 days history) +
-- run `node scripts/security/offsite-backup-321.mjs` via nightly cron for Rule 3-2-1.
