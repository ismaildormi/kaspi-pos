# IMPLEMENTATION PLAN

> 5 phases, micro-tasks. Each task = one Inspect → Plan → Code → Test → Fix → Document loop, ideally one commit.
> Status markers: `[ ]` todo · `[~]` in progress · `[x]` done (verified by an executed command, recorded in BUILD_STATUS) · `[!]` blocked (see KNOWN_ISSUES).
> **Mapping to the Master Plan's 4-phase/10-week roadmap:** Plan-Ph1 (Core MVP) → our Phases 1–2; Plan-Ph2 (Reports+Subscriptions) → Phase 3; Plan-Ph3 (Print+Offline) → Phase 4; Plan-Ph4 (Advanced) → Phase 5.

---

## Phase 0 — Project Memory ✅
- [x] P0-01 Extract requirements from Master Plan (.docx) → `docs/source/`
- [x] P0-02 Create the 7 memory docs
- [x] P0-03 Toolchain inventory (recorded in BUILD_STATUS)

---

## Phase 1 — Database, Auth & Tenant Isolation
**Exit criteria:** a user can register → tenant + first store + owner membership created; login/logout works; `GET /api/v1/me` returns memberships; cross-tenant isolation test suite exists and passes against a real PostgreSQL; `tsc --noEmit`, `prisma validate`, `vitest` all green.

| ID | Task | Touches tenant/money | Acceptance (must be executed) | Status |
|---|---|---|---|---|
| P1-01 | Scaffold Next.js 15 (App Router, TS strict, Tailwind, `src/`); `tsconfig.json`, `.env.example`, `.env` | — | `npm run build` / `npm run typecheck` succeeds | [x] VERIFIED |
| P1-02 | Dev tooling: Vitest, `tsx`, Prettier, scripts `typecheck`, `test`, `test:int`, `db:*` | — | `npm run typecheck` + tsx runner functional | [x] VERIFIED |
| P1-03 | `docker-compose.yml` Postgres 16 (dev `pos_saas` on port 5432) | — | container healthy, `docker ps` verified | [x] VERIFIED |
| P1-04 | Install Prisma + `decimal.js` + Zod; `prisma/schema.prisma` with 34 tables, composite FKs, 0 Float | tenant, money | `npx prisma validate` PASSED (0 Float) | [x] VERIFIED |
| P1-05 | First migration `init_identity_tenancy` applied to PostgreSQL | tenant, money | `npx prisma migrate dev` applied; 34 tables in DB | [x] VERIFIED |
| P1-06 | `src/domain/money.ts` (Decimal helpers, parse/format, ROUND_HALF_UP, string transport) + unit tests | money | vitest/tsx: rounding, no-float, string round-trip, invalid input | [ ] |
| P1-07 | `src/server/http`: error envelope, `AppError` codes, `request_id`, Zod mapping, `jsonOk`, `jsonError` | — | unit & route execution verified | [x] VERIFIED |
| P1-08 | Auth core: argon2id password hashing (`@node-rs/argon2`), DB session token generation/hash, cookie set/clear, `getRequestContext()` | tenant | `tsx src/server/auth/__tests__/auth-flow.ts` PASSED | [x] VERIFIED |
| P1-08B | NextAuth.js v5 (Auth.js) integration: `@auth/prisma-adapter`, `next-auth`, GoogleProvider (OAuth) + CredentialsProvider (argon2id), NextAuth schema models (`accounts`, `sessions`, `verification_tokens`) | tenant | NextAuth config & migration verified | [x] VERIFIED |
| P1-09 | `tenantDb(ctx)` Prisma extension: injects `tenantId` into where/data for tenant models; raw client guard for tenant models; `withTenantTx(ctx, fn)` | **tenant** | unit + integration tests: create/find/update/delete scoped; attempt to pass foreign tenantId is overwritten/rejected | [ ] |
| P1-10 | RBAC: permission matrix (ARCHITECTURE §7), `assertCan(ctx, perm)` | tenant | table-driven unit tests per role | [ ] |
| P1-11 | API: `POST /api/v1/auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /api/v1/me`, `POST /api/v1/tenants/{id}/switch` | tenant | integration tests against postgres | [x] VERIFIED |
| P1-12 | RLS migration: `pos_app` role, policies on all tenant tables, `set_config('app.tenant_id')` in `withTenantTx` | **tenant** | integration test: raw query without setting → 0 rows | [ ] |
| P1-13 | **Isolation suite** `tests/isolation/`: two tenants seeded; for every implemented endpoint tenant A cannot read/modify tenant B (expects 404) | **tenant** | suite passes; documented as release-blocking | [ ] |
| P1-14 | Audit log helper `audit(ctx, action, entity, before, after, reason)` with PII redaction | tenant | unit tests | [ ] |
| P1-15 | Multilingual Support (i18n): `next-intl` with Arabic (RTL default), French (LTR), and English (LTR); messages dictionaries (`messages/{ar,fr,en}.json`); middleware and locale routing | — | locale routing & RTL rendering verified | [x] VERIFIED |
| P1-16 | `GET /healthz`, `GET /readyz`; dev seed (`prisma/seed.ts`, DEMO-tagged, 2 tenants) | tenant | curl results recorded | [ ] |
| P1-17 | `catalog/sources.json|csv` with deps actually installed + licenses | — | file present | [ ] |
| P1-18 | Cloud Deployment Strategy: `docs/DEPLOYMENT.md` (Oracle Cloud Always Free, GitHub Codespaces, Google Cloud Run) + multi-stage `Dockerfile` and production `docker-compose.yml` | — | documentation created & docker build verified | [x] VERIFIED |

---

## Phase 2 — Products, Inventory & POS
**Exit criteria (Master Plan Ph1 acceptance):** create tenant, add 20 products, make a sale, reload page, see the sale exactly once; double-submit creates one sale; stock ledger == stock_levels; isolation suite extended and green.

| ID | Task | Touches | Acceptance |
|---|---|---|---|
| P2-01 | Schema: categories, tax_rates, products, devices, customers, stock_levels, inventory_movements, sales, sale_items, sale_payments, cash_sessions, document_sequences, product_import_jobs + `sync_seq` trigger + pg_trgm | tenant, money | migrate dev + validate; `grep Float` = 0 |
| P2-02 | `src/domain/tax.ts` + `totals.ts` (TTC/HT, line discount, cart discount allocation) + property tests (fast-check) | money | `subtotal + tax == grand` for 1000 random carts |
| P2-03 | Idempotency middleware (`idempotency_records`, request hash, replay, key reuse 422) | tenant | integration tests: replay returns same body; concurrent duplicates → one row |
| P2-04 | Categories CRUD API + tests | tenant | isolation tests |
| P2-05 | Products API: list (search name/sku/barcode, cursor), get, create, patch with `version` (409 on stale), archive; cost_price hidden for cashier | tenant, money | tests incl. duplicate SKU → `SKU_ALREADY_EXISTS`, stale version, isolation |
| P2-06 | Entitlements: free plan cap 50 active products (create, activate, import) | tenant | tests at 49/50/51 |
| P2-07 | CSV import: upload → preview job (Papa Parse, Zod per row, duplicate SKU/barcode in-file & in-DB, price validation) → commit; export CSV | tenant, money | tests: invalid rows, duplicates, 5k-row file, cap enforcement |
| P2-08 | Inventory service: `recordMovement()` (ledger + stock_levels upsert in tx), adjustments API (permission + reason), `GET /stores/{id}/stock`, low-stock query | tenant | tests: duplicate idempotency → single movement; reconciliation check |
| P2-09 | Devices register API (device_code, token, receipt seq) | tenant | tests |
| P2-10 | Cash sessions open/close + Z-report data | tenant, money | tests: expected cash calc, one open session/device |
| P2-11 | **Sales service** `POST /api/v1/sales`: server recomputes totals from DB prices, snapshots, payments, change, stock movements, receipt number — single transaction; `client_sale_id` + Idempotency-Key | **tenant, money** | tests: double submit, price changed (server price wins + returns diff), out-of-stock policy, cashier discount limit, isolation |
| P2-12 | Sales list/get API (filters, cursor) | tenant | tests |
| P2-13 | Void & refund APIs (manager permission, reason, reverse stock, audit) | tenant, money | tests: refund qty ≤ sold, double refund idempotent |
| P2-14 | Customers API (minimal fields, consent) | tenant | isolation tests |
| P2-15 | UI: Products list/form, CSV import wizard with preview | — | build + manual test notes |
| P2-16 | UI: POS screen keyboard-first (F2/Enter/±/Esc), USB scanner input, cart preview using domain module, payment modal, receipt preview | money (preview only) | build + manual test notes |
| P2-17 | UI: sales history, sale detail, refund dialog; stock page | — | build |
| P2-18 | Extend isolation suite to every Phase-2 endpoint | **tenant** | green |

---

## Phase 3 — Reports, Invoices & Billing
**Exit criteria (Master Plan Ph2):** sandbox/mock checkout cycle works; duplicate webhook does not duplicate subscription/payment; reports match seeded test data; invoices immutable & sequential.

| ID | Task | Touches | Acceptance |
|---|---|---|---|
| P3-01 | Reports service: sales summary (day/month/year in tenant/store TZ), payment methods, discounts, tax, avg basket, top products, per-store, low stock, inventory valuation (method documented) | tenant, money | tests: Casablanca day boundaries, voided excluded, refunds netted |
| P3-02 | Dashboard UI with Recharts | — | build |
| P3-03 | Schema: plans, subscriptions, payments, webhook_events, invoices, loyalty_points | tenant, money | migrate + validate |
| P3-04 | Entitlements engine (trial 14d → free fallback / pro), `GET /subscription`, grace period | tenant | tests |
| P3-05 | `BillingProvider` interface + `MockBillingProvider` (MOCK label) + `POST /checkout-sessions` (price from plan) | tenant, money | tests |
| P3-06 | Webhook inbox `POST /webhooks/{provider}`: signature verify, `UNIQUE(provider,event_id)`, async processing, state machine | money | tests: duplicate, bad signature, out-of-order |
| P3-07 | Paddle (or Lemon Squeezy) real adapter — **only if sandbox keys provided** | money | sandbox e2e; else `[!]` blocked |
| P3-08 | Invoice service: gapless numbering, seller/buyer snapshots, TVA breakdown, immutability trigger, credit notes, `schema_version` | tenant, money | tests: retry doesn't renumber, issued invoice update rejected |
| P3-09 | Invoice PDF (Arabic + French font test) `GET /invoices/{id}/pdf` | — | generated PDF inspected |
| P3-10 | `docs/legal-open-items.md` (CGI Art.145, CNDP, MoR) | — | file |
| P3-11 | Loyalty ledger: earn on sale, redeem (no negative balance), reverse on refund | tenant | tests |
| P3-12 | Members & invitations (invite, accept single-use, revoke, role change audited) | tenant | tests + isolation |
| P3-13 | Settings UI (tenant legal info ICE/IF/RC, tax rates, stores, members, plan) | — | build |

---

## Phase 4 — Offline-First & Tauri Desktop
**Exit criteria (Master Plan Ph3):** 20 disconnect/resend scenarios with no duplicated sales or stock movements; receipts print via fake transport; real printer tests documented separately.

| ID | Task | Touches | Acceptance |
|---|---|---|---|
| P4-01 | Schema: sync_operations, sync_conflicts | tenant | migrate |
| P4-02 | `POST /sync/push` (batch, per-op idempotency via `client_op_id`, same service path) & `GET /sync/pull?cursor=` (server_seq pagination + entitlement snapshot) | tenant, money | tests: replay 100 ops ×3 → no dupes |
| P4-03 | Dexie DB + catalog cache + outbox (`src/client/`) | money (strings) | fake-indexeddb unit tests |
| P4-04 | Sync engine: backoff, online/offline events, state machine, conflict surfacing | — | tests with mocked fetch: network drop mid-request, restart |
| P4-05 | POS offline mode: local receipt numbers (ADR-007), local sale persistence before success UI | money | tests: app reload mid-sale |
| P4-06 | PWA: manifest, service worker (app shell caching) | — | Lighthouse PWA check |
| P4-07 | Sync status UI + admin conflict review screen | tenant | build |
| P4-08 | Clock-change & two-devices-last-unit scenarios | tenant | tests |
| P4-09 | Install Rust toolchain + Tauri v2 `src-tauri/` — **requires cargo (KI-003)** | — | `tauri build` |
| P4-10 | Rust ESC/POS: Receipt DTO, transports (fake, network, USB/spooler), 58/80mm, cut, QR, Arabic raster | — | Rust unit tests with fake transport |
| P4-11 | Commands: print_receipt, test_printer, get_printer_status, open_cash_drawer (permission + audit), export_local_backup | tenant | tests; real printer list stays empty until tested |
| P4-12 | Desktop SQLite outbox (optional; else reuse IndexedDB in WebView2) — ADR required | — | decision recorded |

---

## Phase 5 — Advanced & Hardening
**Exit criteria (Master Plan Ph4 + Go-Live checklist):** UAT-ready; full isolation/security suite; backup+restore tested with recorded RPO/RTO; no secrets; license report.

| ID | Task | Touches |
|---|---|---|
| P5-01 | Suppliers, purchase orders, receiving → purchase movements | tenant, money |
| P5-02 | Multi-store stock transfers + consolidated reports | tenant |
| P5-03 | Customer credit (receivables ledger, partial payments, statements) | tenant, money |
| P5-04 | Notifications service (email Resend/Brevo, Web Push; SMS off) with opt-in & retry | tenant |
| P5-05 | Tenant full export (CSV/JSON) + account closure workflow | tenant |
| P5-06 | Backups: `pg_dump` job, encryption, checksum, `backup_jobs`, restore runbook + executed restore test | — |
| P5-07 | Restaurant module (tables, kitchen tickets, KDS via SSE) behind feature flag | tenant, money |
| P5-08 | Glovo/Jumia adapter interfaces + MOCK, flag disabled | — |
| P5-09 | Training mode (is_training sales excluded from reports) | tenant |
| P5-10 | Security hardening: rate limiting (persistent), CSP/headers, session rotation, dependency audit, secret scan, OWASP review | — |
| P5-11 | Observability: structured logger with PII redaction, Sentry, metrics | — |
| P5-12 | E2E tests (Playwright): register → products → sale → refund → report; RTL screenshots | — |
| P5-13 | License report / SBOM, `catalog/sources.*` updated to `tested` where true | — |
| P5-14 | Release checklist, rollback plan, staging deployment docs | — |
