# RESUME HERE — Session Handoff

> Read this first on every `CONTINUE`. Then read `docs/BUILD_STATUS.md`, `docs/KNOWN_ISSUES.md`, and `docs/TRACEABILITY_MATRIX.md`. Do **not** restart or rewrite. Preserve existing working code and architecture.

## Current Repository State (`2026-11-25`)
- **Branch:** `main` (`https://github.com/ismaildormi/kaspi-pos`)
- **Cloud Database:** Neon PostgreSQL 16 (`eu-central-1` pooler) configured via `.env.local` (`DATABASE_URL` & `DIRECT_URL`), `50` Prisma models across `10` applied migrations.
- **All Core KASPI POS Workflows (`A` through `G`) Verified End-to-End Against PostgreSQL (`scripts/verify-kaspi-workflows-a-to-g.ts`):**
  1. **Workflow A (Product, Barcode & Stock Lifecycle):** Product creation, price update, case-insensitive barcode resolution, and `StockLevel` tracking (`25` units) verified.
  2. **Workflow B (Atomic POS Checkout, Price Authority & DGI Receipt):** Server-side anti-tampering price authority (`>0.15 MAD` deviation rejected & audited), DGI Article 145 CGI gapless sequence (`REC-2026-000001`), atomic stock decrement (`25 -> 23`), and `InventoryMovement` (`-2`) verified.
  3. **Workflow C (4-Tier Payment Fee Engine & Dynamic TPE Device Split):**
     - `Stripe`: `2.9% + $0.30 USD` (`3.00 MAD` -> `5.90 MAD` on `100 MAD`).
     - `YouCanPay Morocco Local`: `3.9% + 2.00 MAD` (`41.00 MAD` on `1,000 MAD`) + `30%` rolling reserve tracking (`287.70 MAD` on `959.00 MAD` net settlement).
     - `YouCanPay International`: `4.9% + 2.00 MAD` (`6.90 MAD` on `100 MAD`).
     - `CMI / TPE Physical Terminal`: `2.0%` fee dynamically split by active tenant `maxDevices` (`1` device = `70%` Customer / `30%` Merchant; `2` devices = `60%` / `40%`; `3+` devices = `50%` / `50%`) with zero-centime-loss integer conservation.
  4. **Workflow D (Customer Management, Carnet de Crédit & Loyalty):** Customer creation, credit charge (`300.00 MAD`), partial repayment (`120.00 MAD` -> `180.00 MAD` balance), and loyalty points accrual (`1 pt / 10 MAD` -> `25 pts`) & redemption (`10 pts = 1.00 MAD`) verified.
  5. **Workflow E (Offline Sync Replay & Duplicate Prevention):** Replaying an identical `clientSaleId` / `idempotencyKey` resolves the existing sale with zero duplicate sales or double stock decrements.
  6. **Workflow F (Strict Multi-Tenant Isolation & Unauthenticated Rejection):** Cross-tenant queries return `0` leaked records (`scripts/test-tenant-isolation.ts` `100%` PASSED), and unauthenticated requests to `/api/v1/products`, `/api/v1/products/[id]`, `/api/v1/products/barcode`, and `/api/products/import` strictly return HTTP `401 UNAUTHORIZED`.
  7. **Workflow G (Chunked CSV Import Engine):** `executeCsvImportChunked` (`src/trigger/import-csv.ts`) parses both snake_case and camelCase CSV headers, persists valid products + initial stock in chunks of `500`, and isolates invalid rows with detailed error reasons.

## Remaining External Dependencies (`BLOCKED_EXTERNAL_DEPENDENCY`)
1. **Physical CMI / Ingenico / PAX TPE Terminal (`EXT-01`):** Rust TCP OPI/NEXO bridge (`src-tauri/src/tpe_bridge.rs`) and `RECONCILIATION_REQUIRED` state machine are implemented and compiled for Windows MSVC (`x86_64-pc-windows-msvc`), awaiting physical LAN/COM terminal attachment.
2. **Physical ESC/POS Thermal Printer (`EXT-02`):** Rust HarfBuzz Arabic shaping (`src-tauri/src/arabic_shaper.rs`) and ESC/POS rasterizer (`src-tauri/src/printer.rs`) are implemented and compiled, awaiting physical USB/LAN printer attachment.
3. **Live Production Merchant PSP Keys (`EXT-03`):** Live production credentials for Stripe (`sk_live_*`), YouCanPay, CMI Web, and Hyperswitch must be provisioned in Vercel production environment variables before processing real cardholder funds.

## Must-Remember Rules
- `tenantId` is resolved strictly from authenticated server session/membership (`getRequestContext()` / `auth()`); never fall back to `prisma.tenant.findFirst()` on tenant-scoped routes.
- Financial math uses `Decimal(12,2)` / `decimal.js` and integer centimes; never use naive floating-point arithmetic.
- On Windows PowerShell 5.1, never use `&&`, `||`, `??`, or `--exclude-list-file=NUL`; use explicit `if ($LASTEXITCODE -ne 0)` checks.
