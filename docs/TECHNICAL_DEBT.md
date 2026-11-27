# KASPI POS — Technical Debt & Architectural Audit

**Audit Date:** 2026-11-25  
**Auditor:** Principal Software Architect, Senior Full-Stack Engineer, Database Engineer & Security Auditor

---

## 1. Discovered Technical Weaknesses & Resolution Status

| Item | Location | Category | Severity | Description | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TD-01** | `src/lib/supabase.ts` | Architecture | **CRITICAL** | Top-level execution of `createClient` with service role key broke Vercel build evaluation. | **RESOLVED** (Isolated in `supabase-server.ts` with `server-only` and lazy initialization) |
| **TD-02** | `src/app/[locale]/pos/page.tsx`, `src/client/store/usePosStore.ts`, `src/components/pos/UnifiedCheckoutModal.tsx` | Financial | **HIGH** | Static device count in fee calculation rather than fetching active tenant `maxDevices`. | **RESOLVED** (`GET /api/v1/me` hydrates `currTenant.maxDevices` into `usePosStore.setDeviceCount` and `UnifiedCheckoutModal` passes `deviceCount` into `calculatePaymentFees`) |
| **TD-03** | `src/lib/payments/` | Integration | **HIGH** | Modular payment adapters lacked a unified polymorphic interface. | **RESOLVED** (`19` modular files implemented under `src/lib/payments/` including `PaymentOrchestrator.ts`, `PaymentGatewayManager.ts`, `FeeEngine.ts`, `WebhookProcessor.ts`, and gateway adapters) |
| **TD-04** | `src/components/landing/InteractivePosSimulator.tsx` | UI / Marketing | **MEDIUM** | Landing page simulator required real product imagery and serrated receipt styling. | **RESOLVED** (Verified by `scripts/audit-full-ui-cohesion.mjs`) |
| **TD-05** | `src-tauri/src/tpe_bridge.rs`, `src-tauri/src/desktop_handoff.rs` | Hardware / Rust | **MEDIUM** | Physical terminal communication bridge + unused field/constant compiler warnings in Rust crate. | **RESOLVED IN CODE (`0` cargo warnings)** (Physical terminal connection remains `BLOCKED_EXTERNAL_DEPENDENCY` without attached CMI/Ingenico hardware) |
| **TD-06** | `scripts/load-test.ts` | DevOps / QA | **HIGH** | Automated load/stress test script to benchmark concurrent PostgreSQL operations. | **RESOLVED & VERIFIED** (`410` concurrent operations executed against Neon PostgreSQL with `0` errors) |
| **SEC-P0-01..04** | `src/app/api/v1/products/route.ts`, `src/app/api/v1/products/[id]/route.ts`, `src/app/api/v1/products/barcode/route.ts`, `src/app/api/products/import/route.ts` | Security / Multi-Tenancy | **CRITICAL** | Unauthenticated fallback to `prisma.tenant.findFirst()` when no session was present. | **RESOLVED & VERIFIED** (All 4 routes now strictly reject unauthenticated requests with `401 UNAUTHORIZED`; verified by `scripts/verify-kaspi-workflows-a-to-g.ts` Workflow F) |
