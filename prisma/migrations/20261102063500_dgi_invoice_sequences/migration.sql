-- ============================================================================
-- KASPI POS — DGI Gap-less Invoice Sequences (Article 145 CGI)
-- ============================================================================

DO $$ BEGIN
  ALTER TYPE "BillingProvider" ADD VALUE IF NOT EXISTS 'hyperswitch';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "invoice_sequences" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"   UUID         NOT NULL,
  "year"        INTEGER      NOT NULL,
  "prefix"      TEXT         NOT NULL DEFAULT 'FAC',
  "last_number" INTEGER      NOT NULL DEFAULT 0,
  "updated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoice_sequences_tenant_id_fkey" FOREIGN KEY ("tenant_id")
    REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoice_sequences_tenant_id_year_prefix_key"
  ON "invoice_sequences"("tenant_id", "year", "prefix");
CREATE INDEX IF NOT EXISTS "invoice_sequences_tenant_id_idx"
  ON "invoice_sequences"("tenant_id");

ALTER TABLE "invoice_sequences" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON "invoice_sequences";
CREATE POLICY tenant_isolation_policy ON "invoice_sequences" FOR ALL
  USING (NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
         OR tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
         OR tenant_id::text = current_setting('app.current_tenant_id', true));
