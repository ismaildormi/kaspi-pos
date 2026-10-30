# RESUME HERE — Session Handoff

> Read this first on every `CONTINUE`. Then read `BUILD_STATUS.md`, then inspect actual code. Do **not** restart or rewrite. Do **not** ask permission for routine tasks.

## Where we are
- **Docker Compose Running:** `pos_saas_db` healthy on port 5432.
- **Database Migrated:** 43 tables + `is_super_admin` on `User`. Migration `20261030032000_add_super_admin` applied.
- **Platform Owner (Super Admin) Infrastructure Complete:**
  - `User.isSuperAdmin` boolean field with database migration.
  - Dedicated `/admin` route group & layout completely isolated from shop tenants.
  - Protected by `src/middleware.ts` and `src/server/admin/guard.ts`.
  - Admin Dashboard UI (`src/app/admin/page.tsx`) with live metrics:
    - Total registered Tenants (shops) & monthly growth.
    - Total active subscriptions ($10/mo).
    - Monthly Recurring Revenue (MRR in USD).
    - Platform GMV (MAD).
    - Full Directory Data Table of all registered tenants.
  - `docs/SECURITY_MODEL.md` created, documenting Super Admin vs Tenant isolation.
  - External AI Assistant (NEVEA) API Bridge deferred to Phase 5 in `docs/IMPLEMENTATION_PLAN.md`.
- **Verification:**
  - `npx tsx src/server/__tests__/super-admin-integration.ts` passed 100% against PostgreSQL.
  - `npx tsc --noEmit` passed with 0 errors.
  - `npm run build` compiled 22 pages and API routes with standalone output.

## Where we are
- **Docker Compose Running:** `pos_saas_db` healthy on port 5432.
- **Database Migrated:** 43 tables + `is_super_admin` on `User`.
- **Strategic Moats Documented:** `plan.txt`, `docs/ARCHITECTURE.md`, and `docs/IMPLEMENTATION_PLAN.md` updated with Competitor Smart Migration (Caissa/POSNEX), 1-Click Data Portability Exporter, Anonymized Market Research Insights, and Oracle Always Free $0/mo infrastructure tuning.
- **Complete POS Cashier Interface Verified (Steps 1, 2 & 3):**
  - High-performance, touch & keyboard-first POS layout at `/[locale]/pos` (`/ar/pos`, `/fr/pos`, `/en/pos`).
  - Interactive Product Grid with Category pill filters and real-time stock badges.
  - Auto-focused Barcode / Search input with `F2` global shortcut.
  - Customer Quick-Selection & Inline Creation Modal (`CustomerModal.tsx`) supporting Loyalty points and Credit balance oversight.
  - Cart Panel with line-item steppers, TVA breakdown, Park / Hold cart feature, and `F10` checkout trigger.
  - Checkout Modal supporting Cash (with quick-cash chips & dynamic change due calculation), Card, and Customer Credit.
  - Thermal Receipt Generator (`ThermalReceipt.tsx`) supporting 58mm & 80mm paper widths, bilingual Arabic/French, and Moroccan fiscal notices.
  - Full backend persistence via `POST /api/v1/sales` with atomic stock reduction, inventory movements, customer credit charge, and loyalty points earning.
  - Offline-first Dexie queue (`offlineDb.offlineSales`) with background sync.
- **Verification:**
  - `npx tsx src/server/__tests__/pos-e2e-checkout.ts` passed 100% against PostgreSQL.
  - `npx tsc --noEmit` passed with 0 errors.
  - `npm run build` compiled 29 pages and routes into standalone output.

## Next micro-task
Proceed to **Phase 3: Automated Billing & Paddle MoR Integration**:
1. Implement Paddle webhook listener (`POST /api/v1/webhooks/paddle`) verifying webhook signatures and updating `Subscription` records.
2. Build Merchant Billing Portal UI (`/[locale]/settings/billing`) displaying current plan, trial status, and Paddle checkout modal.
3. Add subscription feature guards (grace period handling, plan entitlements enforcement).
1. Implement the POS keyboard-first cash register interface (F2 search, Enter, cart preview, keypad).
2. Connect POS UI to `POST /api/v1/sales` with offline Dexie.js queue.
3. Build the UI tabs for:
   - "Fournisseurs & Commandes" (Purchase Orders)
   - "Factures & Devis" (PDF generation & printing)
   - "Crédits Clients" (Carnet de Crédit)
   - "Écran Cuisine (KDS)" & "Tables" (Restaurant mode)
   - "Rapports & TVA" (Dashboard & Tax declaration)

## Must-remember rules (full text: PROJECT_CONSTITUTION.md)
- `tenant_id` from server session/membership only; composite FKs; isolation tests are release-blocking.
- Money: `Decimal(12,2)` + `decimal.js`, strings over the wire, server computes totals.
- Idempotency keys on all important writes; ledgers append-only.
- Never claim a result you did not execute and observe.

## Open blockers
- KI-001 Docker daemon not running → DB tasks may need user action. Do DB-independent tasks meanwhile.
