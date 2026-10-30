# PROJECT CONSTITUTION — Multi-Tenant POS SaaS (Morocco)

> Non-negotiable rules. Every session MUST re-read this file before changing code.
> Source of truth for requirements: `docs/source/Master_Plan_POS_SaaS_Morocco_AR.docx` (extracted text: `docs/source/master_plan_extracted_ar.txt`).

## Article 1 — Tenant Isolation (RELEASE-BLOCKING)
1. Every merchant-owned table has `tenant_id UUID NOT NULL`. Exceptions (identity / global tables: `users`, `sessions`, `webhook_events`, `plans`) must be listed in `DATABASE_DESIGN.md` with a justification.
2. `tenant_id` is **never** trusted from request body, query, header, or cookie payload. It is resolved server-side from the authenticated session → active `tenant_memberships` row (status = `active`).
3. Every Prisma query on a tenant table goes through the tenant-scoped data layer (`withTenant(ctx)` / scoped repository) that injects `tenant_id` into `where` / `data`. Raw `prisma.<model>` access on tenant tables outside that layer is forbidden (enforced by lint rule + code review grep).
4. Composite uniques and composite FKs `(tenant_id, id)` prevent cross-tenant linking (e.g. a `sale_item` cannot reference another tenant's product).
5. PostgreSQL Row-Level Security is defense-in-depth, not a replacement for service-layer checks.
6. Every endpoint has a cross-tenant test: user of tenant A requesting/modifying tenant B IDs MUST fail (404, not 403, to avoid existence leaks). Any leak = stop all feature work.

## Article 2 — Financial Precision
1. Money is stored as `Decimal @db.Decimal(12,2)` (PostgreSQL `NUMERIC(12,2)`). Quantities: `NUMERIC(12,3)`. Tax rates: `NUMERIC(5,2)`. **Never FLOAT/DOUBLE/JS `number` for money.**
2. In TypeScript, money is handled with `decimal.js` (Prisma `Decimal`) via the shared `money` module only. Money crosses the API as **strings** (`"12.50"`).
3. The **server is the calculator of record**. The UI may show a preview using the same shared domain module, but the persisted totals are always recomputed server-side from DB prices/tax snapshots.
4. Rounding policy: half-up to 2 decimals at line level; totals = sum of rounded lines (documented in `ARCHITECTURE.md §Money`).
5. Sales store snapshots (product name, SKU, unit price, tax rate, discount, cost) — historical documents never change when the catalog changes.
6. Currency default `MAD`; subscription billing currency `USD`. Never mix currencies in one sum.

## Article 3 — Ledgers, Not Mutations
1. Stock is an append-only `inventory_movements` ledger. No direct quantity edits without a movement + reason + reference.
2. Loyalty points are an append-only ledger; reversals create opposite entries.
3. Completed sales are never deleted — only voided/refunded with audit trail.
4. Issued invoices are immutable; corrections via credit notes. Invoice numbers are never reused.

## Article 4 — Idempotency & Offline
1. Every important write (sale, refund, adjustment, invoice, loyalty, sync push, webhook) accepts an `Idempotency-Key` and is unique on `(tenant_id, idempotency_key)`. Replays return the original result, never a duplicate.
2. Offline sales are queued in IndexedDB (Dexie) outbox with `client_op_id` (UUIDv4), `device_id`, `schema_version`, and persisted **before** the UI shows "saved".
3. No last-write-wins for money or stock. Conflicts → reject / reconcile / admin review.
4. Printing failure never cancels a saved sale.

## Article 5 — Tech Stack (fixed)
Next.js (App Router) + TypeScript (strict) + Tailwind CSS + Prisma + PostgreSQL + Zod + Dexie.js + `next-intl` (Arabic RTL default, French LTR, English LTR) + NextAuth.js v5 (Auth.js with `@auth/prisma-adapter`, Google OAuth + Credentials with argon2id). Tauri (Rust) for the Windows desktop bridge in Phase 4. Cloud deployment targeted for Oracle Cloud Always Free, GitHub Codespaces, and Google Cloud Run. Adding another ORM, a second DB for business data, or a second chart library requires an ADR in `ARCHITECTURE.md`.

## Article 6 — Security
1. Authentication ≠ authorization. Each API checks membership + role (RBAC: owner/admin/manager/cashier/auditor) + entitlement (plan limits) server-side. Hiding a button is never a control.
2. No secrets in repo or client bundle. `.env.example` only. No card data ever stored. No PII/secrets/tokens in logs.
3. API errors: `{ "error": { "code", "message", "request_id", "details?" } }` — no stack traces, SQL, or provider secrets.
4. Sensitive actions (price change, refund, void, discount over threshold, drawer open, role change, tax change) write `audit_logs`.

## Article 7 — Honesty (Never Fake Success)
1. Do not claim a test passed, migration ran, build succeeded, payment worked, or a printer is supported unless the command was actually executed and the output observed. Record the command + result in `BUILD_STATUS.md`.
2. Mocks (payment, Glovo/Jumia, printers) are clearly labelled `MOCK` and can never be counted as a real integration.
3. Never market/describe the product as "DGI compliant" / "e-invoicing certified" / "Glovo/Jumia integrated" without official specs, contracts, and tests.

## Article 8 — Process
1. Micro-task loop: **Inspect → Plan → Code → Test (tsc / prisma validate / vitest) → Fix → Document → Next**.
2. Before modifying any file, ask: *does this touch `tenant_id` or money?* If yes, re-read Articles 1–2 and add/extend tests.
3. Failure policy: read error → fix → retry (max 3) → log in `KNOWN_ISSUES.md` → move to an independent task.
4. After each micro-task: update `BUILD_STATUS.md` and `RESUME_HERE.md`. Small commits with clear messages.
5. Never rewrite the whole project. Never delete working code to "start fresh".
6. Third-party code: check LICENSE before copying anything (OSPOS footer clause, GPL, Elastic). Prefer studying ideas over copying code.
