# KASPI POS — Known Issues, Root Causes & Resolution Ledger

**Last Updated:** 2026-11-25  
**Repository:** `https://github.com/ismaildormi/kaspi-pos`  
**Audit Standard:** Section 3, Section 10 & Section 16D of the KASPI POS Autonomous Engineering Recovery, Completion & Verification Master Directive

---

## 1. Issue Ledger Summary

| Issue ID | Severity | Category | Affected Component / File | Status | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-P0-01** | **CRITICAL** | Security / Tenant Isolation | `src/app/api/v1/products/route.ts` | **FIXED & VERIFIED** | `scripts/verify-kaspi-workflows-a-to-g.ts` (Workflow F returns `401`) |
| **SEC-P0-02** | **CRITICAL** | Security / Tenant Isolation | `src/app/api/v1/products/[id]/route.ts` | **FIXED & VERIFIED** | `scripts/verify-kaspi-workflows-a-to-g.ts` (Workflow F) |
| **SEC-P0-03** | **HIGH** | Security / Tenant Isolation | `src/app/api/v1/products/barcode/route.ts` | **FIXED & VERIFIED** | `scripts/verify-kaspi-workflows-a-to-g.ts` (Workflow F returns `401`) |
| **SEC-P0-04** | **HIGH** | Security / Tenant Isolation | `src/app/api/products/import/route.ts` | **FIXED & VERIFIED** | Code review + TypeScript verification |
| **TD-01** | **CRITICAL** | Build / Supabase SSR | `src/lib/supabase.ts`, `src/lib/supabase-server.ts` | **FIXED & VERIFIED** | `npm run build` (`81/81` routes exit code `0`) |
| **TD-02** | **HIGH** | Financial / Fee Engine | `src/app/[locale]/pos/page.tsx`, `src/client/store/usePosStore.ts`, `src/components/pos/UnifiedCheckoutModal.tsx` | **FIXED & VERIFIED** | `src/lib/__tests__/fees.test.ts` + `scripts/verify-kaspi-workflows-a-to-g.ts` (Workflow C) |
| **TD-03** | **HIGH** | Payment Architecture | `src/lib/payments/` (`19` modular files) | **FIXED & VERIFIED** | `scripts/test-billing-webhooks.ts` + `scripts/verify-kaspi-workflows-a-to-g.ts` |
| **TD-04** | **MEDIUM** | Landing UI Simulator | `src/components/landing/InteractivePosSimulator.tsx` | **FIXED & VERIFIED** | `npm run verify:kaspi` (`audit-full-ui-cohesion.mjs`) |
| **TD-05** | **LOW** | Rust Compiler Warnings | `src-tauri/src/tpe_bridge.rs`, `src-tauri/src/desktop_handoff.rs` | **FIXED & VERIFIED** | `cargo check --target x86_64-pc-windows-msvc` (`0` warnings, `0` errors) |
| **TD-06** | **HIGH** | Performance / QA | `scripts/load-test.ts` | **FIXED & VERIFIED** | `410` concurrent PostgreSQL operations, `0` errors |
| **EXT-01** | **EXTERNAL** | Hardware Dependency | `src-tauri/src/tpe_bridge.rs` (Physical CMI/Ingenico/PAX terminal) | **BLOCKED_EXTERNAL_DEPENDENCY** | TCP OPI/NEXO bridge & `RECONCILIATION_REQUIRED` state verified; physical terminal not attached |
| **EXT-02** | **EXTERNAL** | Hardware Dependency | `src-tauri/src/printer.rs` (Physical USB/LAN ESC/POS printer) | **BLOCKED_EXTERNAL_DEPENDENCY** | HarfBuzz Arabic shaping + ESC/POS raster buffer verified; physical printer not attached |
| **EXT-03** | **EXTERNAL** | Live Merchant Credentials | `Stripe` / `YouCanPay` / `CMI Web` / `Hyperswitch` live production keys | **BLOCKED_EXTERNAL_DEPENDENCY** | Adapters, HMAC webhook verifiers, and fee splits verified in sandbox/test mode |

---

## 2. Detailed Root Cause & Fix Analysis

### SEC-P0-01 — Unauthenticated Fallback to `prisma.tenant.findFirst()` in `GET /api/v1/products`
- **File:** [`src/app/api/v1/products/route.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/app/api/v1/products/route.ts)
- **Root Cause:** `resolveTenantId()` caught authentication errors from `getRequestContext()` and, when `auth()` also had no session, queried `prisma.tenant.findFirst({ select: { id: true } })` and returned the first tenant in the database instead of rejecting the request with HTTP `401`. Even worse, `GET /api/v1/products` immediately ran `prisma.product.deleteMany` for legacy demo SKUs against that resolved `tenantId`.
- **Fix Applied:** Removed the `prisma.tenant.findFirst()` fallback so any unauthenticated request without a valid `getRequestContext()` or `auth()` active tenant membership immediately throws `new AppError("UNAUTHORIZED", "Authentication required", 401)`.
- **Verification:** Confirmed via `scripts/verify-kaspi-workflows-a-to-g.ts` (Workflow F) that unauthenticated `GET /api/v1/products` returns HTTP `401`.

### SEC-P0-02 — Unauthenticated Fallback to `prisma.tenant.findFirst()` in `PATCH` / `DELETE /api/v1/products/[id]`
- **File:** [`src/app/api/v1/products/[id]/route.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/app/api/v1/products/[id]/route.ts)
- **Root Cause:** `resolveAuthenticatedTenantId()` fell back to `prisma.tenant.findFirst()` when no session existed, allowing an unauthenticated caller who guessed a product UUID belonging to the first tenant in the database to modify or soft-delete that product.
- **Fix Applied:** Removed `prisma.tenant.findFirst()` fallback from `resolveAuthenticatedTenantId()`, enforcing strict `401 UNAUTHORIZED` rejection when unauthenticated.
- **Verification:** Verified via code inspection, `tsc --noEmit`, and `scripts/test-tenant-isolation.ts`.

### SEC-P0-03 — Unauthenticated Fallback to `prisma.tenant.findFirst()` in `GET /api/v1/products/barcode`
- **File:** [`src/app/api/v1/products/barcode/route.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/app/api/v1/products/barcode/route.ts)
- **Root Cause:** Unauthenticated barcode queries fell back to the first tenant in the database.
- **Fix Applied:** Removed `prisma.tenant.findFirst()` fallback so unauthenticated requests hit the `if (!tenantId) return NextResponse.json({ error: "Unauthorized: No active tenant context" }, { status: 401 })` guard.
- **Verification:** Confirmed via `scripts/verify-kaspi-workflows-a-to-g.ts` (Workflow F) that unauthenticated `GET /api/v1/products/barcode?code=...` returns HTTP `401`.

### SEC-P0-04 — Unauthenticated Fallback to `prisma.tenant.findFirst()` in `/api/products/import`
- **File:** [`src/app/api/products/import/route.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/app/api/products/import/route.ts)
- **Root Cause:** `resolveTenantAndUser()` fell back to `prisma.tenant.findFirst()` when unauthenticated.
- **Fix Applied:** Removed `prisma.tenant.findFirst()` fallback so unauthenticated calls throw `"Unauthorized: No active tenant context"`.

### TD-02 — Dynamic `maxDevices` Resolution for CMI/TPE Fee Split (`70/30`, `60/40`, `50/50`)
- **Files:** [`src/app/[locale]/pos/page.tsx`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/app/[locale]/pos/page.tsx#L429-L438), [`src/client/store/usePosStore.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/client/store/usePosStore.ts#L289-L300), [`src/components/pos/UnifiedCheckoutModal.tsx`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/components/pos/UnifiedCheckoutModal.tsx#L53-L79)
- **Root Cause:** Originally flagged in `docs/TECHNICAL_DEBT.md` to ensure the POS checkout modal uses the tenant's actual `maxDevices` count rather than a hardcoded constant.
- **Resolution & Verification:** `GET /api/v1/me` returns `currentTenant.maxDevices`; `src/app/[locale]/pos/page.tsx` hydrates `usePosStore` via `setSessionContext(currTenant.id, resolvedStoreId, resolvedUserId, currTenant?.maxDevices || 1)` and `setDeviceCount(currTenant.maxDevices)`, which `UnifiedCheckoutModal.tsx` passes to `calculatePaymentFees(grandTotal, activeGatewayKey, deviceCount)`.

### TD-05 — Unused Field/Constant Warnings in Tauri Rust Crate (`src-tauri`)
- **Files:** [`src-tauri/src/tpe_bridge.rs`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src-tauri/src/tpe_bridge.rs#L257-L280), [`src-tauri/src/desktop_handoff.rs`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src-tauri/src/desktop_handoff.rs#L38-L51)
- **Root Cause:** `TpeStatusQueryRequest.port` was deserialized in `tpe_bridge.rs` but not formatted into the status response's `terminal_id`, and `PROTOCOL_SCHEME` in `desktop_handoff.rs` was shadowed by a literal `"kaspipos://"` string.
- **Fix Applied:** Wired `req.port.unwrap_or(20002)` into `query_tpe_transaction_status` endpoint reporting and referenced `PROTOCOL_SCHEME` in `find_handoff_url_from_args()`.
