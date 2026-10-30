# ARCHITECTURE DECISION RECORDS (ADR LOG)

> Status: Canonical record of architectural choices. Every decision must remain immutable or be explicitly superseded by a later ADR.

---

### ADR-001: Next.js App Router for UI & Route Handlers
- **Context:** System directive mandated Next.js (App Router) + TypeScript + Tailwind CSS.
- **Decision:** Next.js serves both the frontend web app/PWA and API Route Handlers under `/api/v1/*`.
- **Consequences:** Backend business logic is isolated in `src/server/*` without `next/*` dependencies so it can be extracted to a standalone service if needed.

---

### ADR-002: Single Package Repository
- **Context:** `pnpm` not installed on developer environment.
- **Decision:** Use npm single package layout with pure domain logic in `src/domain/` and desktop bridge in `src-tauri/`.

---

### ADR-003: NextAuth.js v5 (Auth.js) + Argon2id Credentials
- **Context:** Need both enterprise Google OAuth and self-managed email/password login.
- **Decision:** NextAuth v5 with `@auth/prisma-adapter`. GoogleProvider for OAuth; CredentialsProvider with native SIMD-accelerated argon2id (`@node-rs/argon2`). User profile links to `tenant_memberships` for strict multi-tenant authorization.

---

### ADR-004: Tenant Scoping via Scoped Data Layer & PostgreSQL Constraints
- **Context:** Multi-tenancy leak prevention is RELEASE-BLOCKING.
- **Decision:** Every merchant table has `tenant_id NOT NULL`. Cross-table relations use composite keys `@@unique([tenantId, id])` and composite foreign keys `@relation(fields: [tenantId, ...Id], references: [tenantId, id])`. All queries go through server-verified tenant context.

---

### ADR-005: Financial Precision — No Floating Point Numbers
- **Context:** Financial rounding errors and currency truncation destroy trust and violate tax regulations.
- **Decision:** Money stored as `Decimal @db.Decimal(12, 2)` (PostgreSQL `NUMERIC(12, 2)`). Quantities: `NUMERIC(12, 3)`. Tax rates: `NUMERIC(5, 2)`. Server is the calculator of record. Money transported as strings. Zero `Float` fields in Prisma.

---

### ADR-006: Moroccan Retail Tax-Inclusive (TTC) Pricing
- **Context:** In Moroccan shops, displayed prices include TVA (TTC).
- **Decision:** `tenants.prices_include_tax = true` by default. Item net and TVA breakdown calculated on server using `ROUND_HALF_UP` line-by-line algorithm.

---

### ADR-007: Device-Specific Offline Receipt Numbers & Server Gapless Invoices
- **Context:** Sales happen offline and must print instantly; legal invoices require gapless numbering.
- **Decision:** POS receipts use `{STORE_CODE}-{DEVICE_CODE}-{seq:000000}` allocated locally per device. Formal invoices use server-locked `document_sequences` per `(tenant_id, kind, series, year)`.

---

### ADR-008: Append-Only Inventory Ledger
- **Context:** Direct stock quantity mutations cause phantom discrepancies.
- **Decision:** All stock changes recorded as immutable `inventory_movements` (sale, purchase, return, adjustment, transfer). `stock_levels` acts as a fast cache updated in the same transaction.

---

### ADR-009: Stable Monotonic Sync Cursor
- **Context:** `updated_at` timestamp alone misses concurrent writes across offline devices.
- **Decision:** `server_seq BIGINT` on syncable catalog tables updated via sequence trigger. Devices pull changes `WHERE tenant_id=? AND server_seq > cursor`.

---

### ADR-010: Single Library per Concern
- **Decision:** Recharts (visualization), Papa Parse (CSV), @zxing/browser (barcode camera). No redundant dependencies.

---

### ADR-011 & ADR-014: Paddle as Merchant of Record (MoR) for Global Billing
- **Context:** Managing VAT, GST, state sales tax, and multi-currency compliance globally or cross-border is complex and legally hazardous for a nascent SaaS.
- **Decision:** **Paddle** is the official Merchant of Record (MoR).
- **Rationale:**
  - Paddle assumes full legal responsibility for collecting and remitting global sales tax/VAT.
  - Generates tax-compliant invoices and handles international buyer currency conversions.
  - Protects the Moroccan SaaS entity from foreign tax registration burdens.
  - Merchant pricing ($10/month Pro plan, 14-day trial) is defined on our server; checkout sessions are initialized via server API; client cannot tamper with prices.
  - Webhooks are verified with cryptographic signatures and processed idempotently via `webhook_events`.
- **Implementation:** Abstracted via `BillingProvider` interface with a `MockPaddleProvider` for local offline/sandbox development.

---

### ADR-012: Multilingual Support via `next-intl` (Arabic RTL, French LTR, English LTR)
- **Context:** Moroccan retail operates primarily in Arabic and French, with English for international businesses.
- **Decision:** `next-intl` with route prefixing (`/[locale]/*`). Arabic (`ar`) defaults to `dir="rtl"`, French (`fr`) and English (`en`) `dir="ltr"`. Tailwind logical properties (`ms-*`, `pe-*`) ensure bidirectional layout fidelity.

---

### ADR-013: Cloud Deployment Architecture
- **Decision:** Docker multi-stage build (`Dockerfile` with `standalone` output) targeting Oracle Cloud Always Free (ARM Ampere A1 2-4 OCPU, 12-24GB RAM) for zero-cost dedicated hosting, GitHub Codespaces for developer velocity, and Google Cloud Run for elastic serverless scaling.
