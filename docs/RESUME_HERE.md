# RESUME HERE — Session Handoff

> Read this first on every `CONTINUE`. Then read `BUILD_STATUS.md`, then inspect actual code. Do **not** restart or rewrite. Do **not** ask permission for routine tasks.

## Where we are
- **Docker Compose Running:** `pos_saas_db` healthy on port 5432.
- **Database Migrated:** 43 tables in PostgreSQL. Migration `20261030030900_all_in_one_features` applied.
- **All-in-One Modules Implemented & Tested:**
  1. **Advanced Inventory:** `Supplier` CRUD, `PurchaseOrder` creation, atomic PO receiving updating `StockLevel` and `InventoryMovement` with batch number and expiry tracking.
  2. **Invoicing & Credit:** Invoices and Quotes (Devis) with Moroccan ICE/IF/RC snapshots, printable HTML/PDF generator, Customer Credit ledger (Carnet de Crédit) with strict limit enforcement.
  3. **Loyalty Program:** Points calculation (1 point per 10 MAD), balance ledger, and redemption API.
  4. **Restaurant Mode & KDS:** Table management, Kitchen Display System tickets and real-time status transitions.
  5. **Advanced Reporting:** Sales summary, Top products, and Moroccan TVA breakdown report.
- **Verification:**
  - `npx tsx src/server/__tests__/all-in-one-integration.ts` passed 100% against PostgreSQL.
  - `npx tsc --noEmit` passed with 0 errors.
  - `npm run build` completed successfully (21 routes generated).

## Next micro-task
Proceed to **Phase 2 POS Frontend UI & Register Screen**:
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
