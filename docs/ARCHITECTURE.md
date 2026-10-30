# ARCHITECTURE

> Status: **Design (Phase 0)** — no app code exists yet. Update this file whenever a decision changes (add an ADR, never silently rewrite history).

## 1. System Overview

```mermaid
flowchart TD
    subgraph Clients
        PWA["PWA (browser/tablet) - Dexie IndexedDB outbox"]
        DESK["Tauri Desktop (Windows) - same UI + Rust print bridge"]
    end
    subgraph NextApp["Next.js App Router (single deployable)"]
        UI["React UI - RSC + client components - ar RTL / fr LTR"]
        API["Route Handlers /api/v1/*"]
        SVC["Service layer src/server/services (framework-agnostic)"]
        TEN["Tenant context + RBAC + entitlements"]
        DOM["Domain src/domain (pure TS: money, tax, totals, sync schema)"]
    end
    DB[("PostgreSQL - tenant_id everywhere - composite FKs - RLS")]
    EXT["Adapters: Paddle/LemonSqueezy, Email, Push, Glovo/Jumia (MOCK until contracted)"]
    PWA -->|"HTTPS + session cookie / device token"| API
    DESK -->|HTTPS| API
    DESK -.->|"invoke print_receipt / open_cash_drawer"| RUST["Rust ESC/POS transports"]
    UI --> API
    API --> TEN --> SVC --> DB
    SVC --> DOM
    UI --> DOM
    SVC --> EXT
```

## 2. Architecture Decision Records

| ADR | Decision | Reason / Consequence |
|---|---|---|
| ADR-001 | **Next.js App Router** hosts UI **and** API (Route Handlers under `/api/v1`). Business logic lives in `src/server/services/*` with no `next/*` imports. | User directive. Keeps a path to extract a standalone API (Fastify/Cloud Run) later as the Master Plan suggests. |
| ADR-002 | **Single package** (no monorepo). Tauri added in Phase 4 under standard `src-tauri/`. Shared pure logic in `src/domain/`. | pnpm not installed; Tauri's default layout wraps the same web app; avoids workspace tooling overhead. Revisit if a separate API package is extracted. |
| ADR-003 | **NextAuth.js v5 (Auth.js) + @auth/prisma-adapter**: Combines **GoogleProvider** (OAuth) for instant frictionless sign-in with **CredentialsProvider** (email/password with argon2id). Standard NextAuth models (`accounts`, `sessions`, `verification_tokens`) stored in PostgreSQL, with user profile linking to `tenant_memberships` for strict multi-tenant authorization. Devices retain separate revocable device tokens for sync. | Standardizes enterprise OAuth & credentials authentication across web, PWA, and desktop clients. |
| ADR-004 | **Tenant scoping via `tenantDb(ctx)`** — a Prisma Client extension that injects `tenant_id` into every `where`/`data` for tenant models and throws if a tenant model is accessed through the raw client. Plus composite FKs and (Phase 1, task P1-12) PostgreSQL **RLS** with `set_config('app.tenant_id', …, true)` inside request transactions. | Defense in depth (Constitution Art. 1). |
| ADR-005 | **Money = `decimal.js`** (Prisma `Decimal`), DB `NUMERIC(12,2)`; API transports money as strings; Zod schemas validate `^\d{1,10}(\.\d{1,2})?$`. | Constitution Art. 2. |
| ADR-006 | **Prices tax-inclusive (TTC) by default** (`tenants.prices_include_tax = true`), configurable. | Moroccan retail displays TTC; invoices still show HT/TVA/TTC split. |
| ADR-007 | **Receipt numbers per device**: `{STORE_CODE}-{DEVICE_CODE}-{seq:000000}`; device code + sequence allocated on device registration → unique per `(tenant_id, store_id)` and safe offline. **Legal invoice numbers** are server-only, gapless per `(tenant_id, series, year)` via row-locked `document_sequences`. | Offline tickets need a number at print time; invoices need strict sequencing. |
| ADR-008 | **Stock** = `inventory_movements` ledger + `stock_levels` cache updated in the same transaction; nightly/CI reconciliation asserts `SUM(ledger) == cache`. Negative stock allowed by default (offline sales are facts) but flagged; setting `allow_negative_stock`. | Plan §3, §6.3. |
| ADR-009 | **Sync cursor** = monotonically increasing `server_seq BIGINT` (global sequence, set by trigger on insert/update) on syncable tables; pull = `WHERE tenant_id=? AND server_seq > cursor ORDER BY server_seq LIMIT n`. Soft deletes (`deleted_at`) so deletions sync. | Plan: "updated_at alone is not enough". |
| ADR-010 | **Charts: Recharts** (only). **CSV: Papa Parse**. **Barcode camera: @zxing/browser**. **PDF: @react-pdf/renderer** or pdf-lib (decide in Phase 3 after Arabic font test). | Plan: one lib per concern. |
| ADR-011 | **Payments**: `BillingProvider` interface; `MockBillingProvider` (labelled MOCK, dev only) until Paddle/Lemon Squeezy sandbox keys exist. | Constitution Art. 7. |
| ADR-012 | **Multilingual Support (i18n)**: `next-intl` supporting **Arabic (`ar`, RTL default)**, **French (`fr`, LTR)**, and **English (`en`, LTR)**. URL routing via `[locale]` prefix, cookie detection, and Tailwind logical utilities (`ms-*`, `pe-*`). | Complete linguistic coverage for Moroccan retail, tourists, and international business. |
| ADR-013 | **Cloud Deployment Strategy**: Multi-stage `Dockerfile` (Node.js standalone output) and production-ready `docker-compose.yml` supporting Oracle Cloud Always Free (ARM64 Ampere / x86_64), GitHub Codespaces, and Google Cloud Run. | Documented in `docs/DEPLOYMENT.md` for low-cost, scalable deployment. |

## 3. Directory Layout (target)

```
pos-saas-morocco/
├─ docs/                      # persistent memory (this folder)
├─ catalog/sources.json|csv   # third-party source & license registry
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/             # SQL visible & reviewed (incl. RLS, triggers)
│  └─ seed.ts                 # DEV ONLY, data tagged DEMO
├─ src/
│  ├─ app/                    # Next.js App Router
│  │  ├─ [locale]/(auth)/login, register
│  │  ├─ [locale]/(app)/dashboard, pos, products, sales, customers, reports, settings
│  │  └─ api/v1/**/route.ts   # thin: parse → auth ctx → service → JSON
│  ├─ domain/                 # PURE TS, no IO: money.ts, tax.ts, totals.ts, receipt.ts, sync-schema.ts
│  ├─ server/
│  │  ├─ db/                  # prisma client, tenantDb extension, tx helpers
│  │  ├─ auth/                # password, session, device tokens, getRequestContext()
│  │  ├─ rbac/                # permissions matrix, assertCan()
│  │  ├─ entitlements/        # plan limits
│  │  ├─ services/            # products, sales, inventory, invoices, sync, billing...
│  │  ├─ adapters/            # billing, email, push, delivery (MOCKs labelled)
│  │  └─ http/                # error envelope, request_id, idempotency, rate limit
│  ├─ client/                 # Dexie db, outbox, sync engine, hooks
│  ├─ components/
│  └─ i18n/                   # messages ar.json / fr.json
├─ tests/
│  ├─ unit/                   # domain (money/tax/totals)
│  ├─ integration/            # services against real Postgres (test DB)
│  └─ isolation/              # cross-tenant suite — RELEASE-BLOCKING
├─ src-tauri/                 # Phase 4
├─ docker-compose.yml         # postgres:16 for dev/test
└─ .env.example
```

## 4. Request Lifecycle (every API call)

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Route Handler
    participant A as getRequestContext
    participant S as Service
    participant D as PostgreSQL
    C->>R: HTTP + cookie/device token (+ Idempotency-Key)
    R->>R: assign request_id, Zod-parse input (no tenant_id accepted)
    R->>A: resolve session → user → active membership
    A-->>R: ctx {userId, tenantId, role, storeIds, plan}
    R->>S: service(ctx, input)
    S->>S: assertCan(ctx, permission) + entitlement check
    S->>D: BEGIN; set_config(app.tenant_id); idempotency lookup; writes; COMMIT
    S-->>R: result (money as strings)
    R-->>C: 2xx JSON or {error:{code,message,request_id}}
```

## 5. Money & Tax Algorithm (`src/domain/totals.ts`)
All arithmetic in `Decimal`, rounding `ROUND_HALF_UP` to 2 dp **per line**, then totals are sums of rounded line values.

Tax-inclusive (default):
```
gross_i   = round(qty_i × unit_price_i) − line_discount_i
tax_i     = round(gross_i × rate_i / (100 + rate_i))
net_i     = gross_i − tax_i
```
Tax-exclusive:
```
net_i     = round(qty_i × unit_price_i) − line_discount_i
tax_i     = round(net_i × rate_i / 100)
gross_i   = net_i + tax_i
```
Sale: `subtotal = Σnet`, `tax_total = Σtax`, `grand_total = Σgross` (cart-level discount is allocated proportionally to lines before tax, remainder cent to the largest line). `change_due = paid_total − grand_total` (cash only, ≥ 0). Property-based tests ensure `subtotal + tax_total == grand_total` always.

## 6. Offline Sync Protocol
1. Client creates op `{client_op_id: uuidv4, op_type, schema_version, device_id, created_at_device, payload}`; writes to Dexie `outbox` in a transaction with local sale record **before** showing success.
2. Sync engine pushes batches (≤ 50) to `POST /api/v1/sync/push` with device token; per op the server: checks `sync_operations(tenant_id, client_op_id)` → if exists, returns stored result; else executes the service (same code path as online) in a transaction and stores the result.
3. Results per op: `applied | duplicate | conflict | rejected` (with code). Conflicts go to an admin review queue (`sync_conflicts`).
4. Pull: `GET /api/v1/sync/pull?cursor=` returns catalog/price/stock changes since `server_seq`, paginated, plus `entitlement` snapshot with `offline_grace_until`.
5. Server time (`completed_at`) is the audit reference; `offline_created_at` is kept but never trusted for ordering of money.
6. Backoff: 1s, 2s, 4s … max 5 min, jitter; triggered on `online` event and interval.

## 7. RBAC Matrix (initial)
| Permission | owner | admin | manager | cashier | auditor |
|---|---|---|---|---|---|
| tenant.settings / billing | ✔ | ✔ (no billing cancel) | | | |
| members.manage | ✔ | ✔ | | | |
| products.write / prices | ✔ | ✔ | ✔ | | |
| products.read / cost_price.read | ✔/✔ | ✔/✔ | ✔/✔ | ✔/✗ | ✔/✔ |
| sales.create | ✔ | ✔ | ✔ | ✔ | |
| sales.refund / void / discount>threshold | ✔ | ✔ | ✔ | approval | |
| inventory.adjust | ✔ | ✔ | ✔ | | |
| cash_drawer.open (no sale) | ✔ | ✔ | ✔ | | |
| cash_session.open/close | ✔ | ✔ | ✔ | ✔ (own) | |
| reports.read | ✔ | ✔ | ✔ | own shift | ✔ |
| audit_logs.read | ✔ | ✔ | | | ✔ |

## 8. Environments
- **dev**: Postgres 16 via `docker compose` (or any local Postgres via `DATABASE_URL`); `.env.local`.
- **test**: separate database `pos_test`, migrated with `prisma migrate deploy` before integration tests; truncated between suites.
- **staging/prod**: managed Postgres (e.g. Supabase Pro / Cloud SQL), app on Cloud Run/Vercel. Not configured yet.
