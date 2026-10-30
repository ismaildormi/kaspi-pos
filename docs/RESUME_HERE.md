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
- **Platform Owner Super Admin Console Complete:** `/admin` dashboard live with MRR and tenant directory.
- **POS Cashier Split-Screen Interface Complete (Step 2):**
  - High-performance, touch & keyboard-first POS layout at `/[locale]/pos` (`/ar/pos`, `/fr/pos`, `/en/pos`).
  - Interactive Product Grid with Category pill filters and real-time stock badges.
  - Auto-focused Barcode / Search input with `F2` global shortcut.
  - Cart Panel with line-item steppers, TVA breakdown, Park / Hold cart feature, and `F10` checkout trigger.
  - Checkout Modal supporting Cash (with quick-cash chips & change due calculation), Card, and Customer Credit.
  - Offline-first Dexie queue (`offlineDb.offlineSales`) with background sync.

## Next micro-task
Proceed to **Phase 2 POS Step 3 & Supporting UI Modules**:
1. Customer Selection & Quick Add modal inside POS (for Loyalty points & Credit sales).
2. Receipt print preview generator (thermal 58mm/80mm style with Moroccan ICE and QR code).
3. Connect sales submission to server `POST /api/v1/sales` transaction route and verify end-to-end sync.
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
