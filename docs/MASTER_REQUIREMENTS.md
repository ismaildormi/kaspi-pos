# MASTER REQUIREMENTS (extracted from the Master Plan)

> Source: `docs/source/Master_Plan_POS_SaaS_Morocco_AR.docx` v1.0 (rev. 29 Oct 2026), Arabic. The user called it a PDF; the file provided was a **.docx**, extracted fully (1,628 paragraphs) to `docs/source/master_plan_extracted_ar.txt`. No content was unreadable. Tables were flattened to one cell per line — refer to the source for exact layout.
> IDs: `R-xxx` = requirement. Priority: **M** = Must (MVP), **S** = Should, **L** = Later.

## 1. Product Vision
- Multi-tenant POS SaaS for small/medium Moroccan shops: grocery, clothing, cosmetics, accessories, bookshops, electronics, bakeries, small cafés. First target segment: **general retail** (restaurants later).
- Price: **10 USD / shop / month** (Pro). **14-day trial**. **Free plan = 50 active products in total** (not per month). Local MAD pricing possible later.
- Platforms: **Windows desktop first (Tauri)**, then tablet/mobile **PWA**.
- Differentiators: price + simplicity + offline cash sales + correct Arabic thermal printing + Excel/CSV import + local support. Transparent pricing (no hidden print/inventory add-ons).

## 2. 90-day Success Metrics
| Metric | Target |
|---|---|
| Time to first sale | < 10 min after import |
| Local sale durability | 99.9% of sales survive app close / power cut |
| Sync | every local op reaches server logically **once** |
| Stock accuracy | no double stock movement per invoice (ledger == balance) |
| Retention | D7 / D30 activation tracked |
| Support | 80% of recurring issues solved by knowledge base |

## 3. Functional Requirements

### 3.1 Tenancy, Auth, RBAC
- R-001 (M) Tenant = paying shop/business; a tenant can own multiple **stores** (branches). Independent shop = separate tenant for billing.
- R-002 (M) `users` profile + `tenant_memberships(tenant_id, user_id, role, status)`; roles **owner/admin/manager/cashier/auditor**; optional `permissions_override` JSONB.
- R-003 (M) Active tenant resolved server-side after membership check; `POST /tenants/{id}/switch`.
- R-004 (M) Staff invitations by email with expiring, single-use token.
- R-005 (M) Onboarding: create tenant (spam/limit checks) + first store.
- R-006 (M) One auth approach only (doc suggests Supabase Auth or Firebase Auth; see ADR-003 in ARCHITECTURE).

### 3.2 Catalog
- R-010 (M) Categories (tree, per tenant, unique `(tenant_id, name, parent_id)`).
- R-011 (M) Products: sku (unique per tenant), barcode (optional, conditional unique), name, description, unit (piece/kg/liter/service), sale_price, cost_price (role-restricted), tax_code, tax_rate (configurable, not hard-coded), track_stock, is_active, `version` (optimistic concurrency / ETag).
- R-012 (M) Fast search (name/SKU/barcode), cursor pagination.
- R-013 (M) CSV import with **Preview step** (valid/invalid rows, duplicate SKU/barcode, invalid prices) — never import directly. Async import job. CSV/JSON export. (Papa Parse)
- R-014 (M) Free-plan cap (50 active products) enforced in API and import, not UI.
- R-015 (S) Barcode: USB keyboard-wedge scanner first; camera via `@zxing/browser` (html5-qrcode is in maintenance mode — fallback only).
- R-016 (L) Variants; wholesale/customer price lists.

### 3.3 POS & Sales
- R-020 (M) Keyboard-first POS: F2 search, Enter add, +/- qty, Esc close; touch-friendly; Arabic/French keyboards & USB scanner.
- R-021 (M) Cart, quantity change, authorized discount, customer select, payment cash (structure extensible to card/transfer/split/credit), totals, tax, change due.
- R-022 (M) Sale saved in **one DB transaction**: header + items + payments + stock movements. `client_sale_id` + `Idempotency-Key` unique per tenant. Receipt number unique per `(tenant_id, store_id)`.
- R-023 (M) `sale_items` snapshots: name, SKU, unit price, discount, tax rate/amount, line total, cost.
- R-024 (M) Sales history + receipt preview. Statuses: draft/completed/voided/refunded/part_refunded. Channel: pos/online/glovo/jumia.
- R-025 (M) Refund (partial/full) creates reversal + reason + permission; void with audit. Manager approval for refunds/discounts.
- R-026 (M) Tests: double click / resend, out of stock, price changed after cart opened.
- R-027 (M) Cash sessions (shift open/close), expected vs counted cash, discrepancy, **Z-report**.
- R-028 (S) Customer credit sales (receivables, partial payments, statement).
- R-029 (S) Training/demo mode that never mixes with production sales.
- R-030 (L) Customer-facing second display.

### 3.4 Inventory
- R-040 (M) Append-only `inventory_movements` (sale/purchase/return/adjustment/transfer_in/transfer_out/waste) with reference + idempotency key; stock balance computed/cached.
- R-041 (M) Stock adjustment screen: permission + mandatory reason.
- R-042 (M) Low-stock alerts.
- R-043 (S) Suppliers, purchase orders, receiving, stock counts (needed early for serious inventory).
- R-044 (L) Multi-store transfers.

### 3.5 Customers & Loyalty
- R-050 (M) Customers with minimum data (name, phone, email, tax_identifier only when invoicing, address, marketing_consent with timestamp/source). No CIN unless legally required.
- R-051 (S) Loyalty ledger (earn/redeem/refund/adjustment/expiry), redeem in transaction that prevents negative balance; refunds reverse points.

### 3.6 Reports
- R-060 (M) Sales today/month/year, invoice count, average basket, discounts, tax, payment methods, top products (from snapshots), sales per store, low stock.
- R-061 (M) Timezone `Africa/Casablanca` (or store TZ); store UTC; correct local day boundaries. Excludes voided, handles refunds.
- R-062 (S) Inventory valuation (cost method documented). Don't show profit if costs are missing without a warning.
- R-063 (M) Single chart lib (Recharts **or** Chart.js).

### 3.7 Moroccan Invoicing
- R-070 (M) Invoice service independent from PDF: number (server sequence, no renumbering on retry), issued_at, seller/buyer JSONB snapshots, lines, TVA amounts, totals as separate columns, payment method, `schema_version`, `external_compliance_ref`.
- R-071 (M) Issued invoices immutable; credit notes for cancellation; voided numbers never reused.
- R-072 (M) Configurable legal fields (ICE, IF/tax_id, RC) per CGI 2026 Art. 145 — to be reviewed by an accountant. Track open items in `docs/legal-open-items.md`.
- R-073 (L) DGI e-invoicing connector (UBL/CII adapters) **only after official specs**. Never claim DGI compliance.
- R-074 (M) PDF generation from snapshot.

### 3.8 Subscriptions & Billing
- R-080 (M) Plans: trial (14 d), free (50 active SKU), pro (10 USD/month). Server-side entitlements.
- R-081 (M) Hosted checkout via Paddle or Lemon Squeezy (MoR) — price from server plan, never from client. No card data stored.
- R-082 (M) Webhook inbox: signature verification, unique `event_id`, idempotent processing, states trialing/active/past_due/canceled/paused, grace period.
- R-083 (M) If keys absent: adapter interface + clearly labelled sandbox MOCK.
- R-084 (M) Tests: duplicate webhook, plan switch, bad signature.

### 3.9 Offline-First & Sync
- R-090 (M) PWA local layer: Dexie (catalog cache + outbox). Desktop: SQLite via Tauri.
- R-091 (M) Ops: create_sale, refund_sale, inventory_adjustment, customer_upsert — immutable, with `client_op_id`, `device_id`, `schema_version`, `created_at`; state pending/synced/conflict/failed.
- R-092 (M) `POST /sync/push` (batch) + `GET /sync/pull?cursor=` (stable cursor, pagination, retention). Exponential backoff.
- R-093 (M) Conflict policy: catalog fields → server version wins; cash/sales/stock → reconcile/reject/admin review.
- R-094 (M) Offline subscription grace period cached in advance; no unlimited offline use.
- R-095 (M) Tests: app close mid-sale, restart, clock change, duplicate messages, network drop mid-request, two devices selling the last unit.
- R-096 (M) Devices registry (`devices`), revocation, last sync.

### 3.10 Desktop Bridge, Printing, Hardware
- R-100 (M) Tauri shell over same web UI; narrow Rust commands: `print_receipt`, `test_printer`, `get_printer_status`, `open_cash_drawer`, `export_local_backup`, `apply_local_migration`. No generic shell execution.
- R-101 (M) ESC/POS transports (USB/Serial/Network/Windows spooler), 58mm & 80mm, cut, QR/barcode, Arabic RTL shaping (raster fallback).
- R-102 (M) Cash drawer kick only after paid sale or "open drawer" permission; audited.
- R-103 (M) Fake transport tests; real tests on ≥3 printers before claiming support; certified hardware list.

### 3.11 Advanced (Phase 4+)
- R-110 (L) Restaurants: dining_tables, kitchen_tickets, order_items, preparation stations, KDS (SSE/WebSocket), statuses new/in_progress/ready/served/canceled, table transfer, split bill — behind feature flags.
- R-111 (S) Notifications service: email (Resend/Brevo), push (FCM/Web Push), opt-in, rate limits, retry; SMS disabled by default.
- R-112 (M) Backups: encrypted daily, checksums, retention, restore runbook + periodic restore test (RPO/RTO recorded); `backup_jobs`.
- R-113 (L) Glovo/Jumia adapters behind disabled feature flag; no scraping; only with official API/contract.
- R-114 (M) Full tenant export (CSV/JSON/PDF) + export log; account closure.
- R-115 (M) Audit logs for sensitive actions.

## 4. Non-Functional Requirements
- NFR-01 i18n: Arabic (RTL) + French (LTR) from day one, persisted language switch; tenant locale for numbers/dates/currency.
- NFR-02 Security: rate limiting, OpenAPI, standard error shape, no secrets in client, RLS + service checks.
- NFR-03 Observability: structured logs (no PII), Sentry, uptime, `/healthz`, `/readyz`.
- NFR-04 Licensing: `catalog/sources.json|csv` with fields name, repository, website, license, verified_version, last_checked, platform, usage, state, integration_mode, tests, blockers, notes. States: discovered → … → tested/blocked/deprecated. License scan in CI; SBOM.
- NFR-05 Hosting (initial): static/PWA front, API on Cloud Run (or equivalent), managed PostgreSQL (Supabase Pro when real), R2 for files. Don't rely on auto-pausing free DBs for production.
- NFR-06 Data protection: Law 09-08 / CNDP declaration, international transfer procedure, minimal data, retention policy, DPA in merchant contract.

## 5. Legal Open Items (must be reviewed by a Moroccan accountant/lawyer)
- CGI 2026 Art. 145-III (invoice mandatory fields), 145-VIII (ICE), 145-IX (e-invoicing system — specs not yet published as of doc date).
- CNDP formalities and cross-border transfers (Cloudflare/Firebase/Paddle/email providers).
- MoR (Paddle/Lemon Squeezy) seller eligibility & payouts to Morocco — verify before production.
- OMPIC trademark check for name candidates: **Kasbi POS**, **Mizan Caisse** (conflict risk with MizanPOS), **Darb POS**.

## 6. API Surface (prefix `/api/v1`)
`GET /me` · `POST /tenants` · `POST /tenants/{id}/switch` · `POST /invitations` · `POST /invitations/{id}/accept` · `GET|POST /products` · `GET|PATCH /products/{id}` · `POST /products/imports` · `GET /products/imports/{jobId}` · `POST /products/exports` · `GET /stores/{storeId}/stock` · `POST /inventory/adjustments` · `GET|POST /sales` · `GET /sales/{id}` · `POST /sales/{id}/refunds` · `POST /sales/{id}/void` · `GET|POST /customers` · `POST /loyalty/redeem` · `GET /reports/sales-summary|top-products|inventory-valuation` · `POST /invoices` · `GET /invoices/{id}/pdf` · `GET /subscription` · `POST /checkout-sessions` · `POST /subscription/cancel` · `POST /webhooks/paddle|lemonsqueezy` · `POST /sync/push` · `GET /sync/pull` · `POST /devices/register` · `GET /healthz` · `GET /readyz`.

## 7. Go-Live Checklist (from plan)
Security (tenant isolation suite, no secrets, rate limit, RBAC) · Data (migrations tested, backup+restore, tenant export, retention) · POS (money/tax/refund tests, ledger matches, idempotency+offline proven) · Hardware (certified Windows printers, Arabic 58/80mm, drawer protected) · Payments (seller approval, sandbox e2e, webhook signature + duplicate tested) · Legal (accountant review, CNDP, ToS/Privacy) · Ops (staging, alerts, runbook, rollback) · Marketing (only tested features advertised).

## 8. Deviations from the Master Plan (decided by user directive)
- Plan suggests React+Vite UI and a separate Fastify/NestJS API. **User directive mandates Next.js App Router** → API implemented as Next.js Route Handlers under `/api/v1` with a framework-agnostic service layer (`src/server/services`) so it can be extracted to a standalone API later. Recorded as ADR-001.
- Plan suggests a pnpm monorepo; pnpm is not installed → single npm package with `src/domain` for shared pure logic and standard `src-tauri/` for the desktop shell (ADR-002).
- Plan suggests Supabase/Firebase Auth; no credentials available → built-in argon2id session auth with provider columns for later migration (ADR-003).
