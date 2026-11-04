# KASPI POS — Technical Debt & Architectural Audit

**Audit Date:** 2026-11-04  
**Auditor:** Principal Architect & QA Director

---

## 1. Discovered Technical Weaknesses & Status

| Item | Location | Category | Severity | Description | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TD-01** | `src/lib/supabase.ts` | Architecture | **CRITICAL** | Top-level execution of `createClient` with service role key broke Vercel build evaluation. | **RESOLVED** (Isolated in `supabase-server.ts` with `server-only` and lazy initialization) |
| **TD-02** | `src/components/pos/CheckoutModal.tsx` | Financial | **HIGH** | Static device count used in fee calculation rather than fetching active tenant `maxDevices`. | **OPEN** (Requires dynamic `maxDevices` resolution) |
| **TD-03** | `src/lib/payments/` | Integration | **HIGH** | Modular payment adapters lacked a unified polymorphic interface. | **OPEN** (Needs unified interface across Stripe, YouCanPay, CMI) |
| **TD-04** | `src/app/page.tsx` | UI / Marketing | **MEDIUM** | Landing page simulator required real product imagery and serrated receipt styling. | **OPEN** (Needs visual enhancement and image fallbacks) |
| **TD-05** | `src-tauri/src/tpe_bridge.rs` | Hardware | **MEDIUM** | Physical terminal communication is in simulation mode; needs serial port & network socket test hooks. | **OPEN** (Bridge interface built, real hardware blocked without terminal) |
| **TD-06** | `scripts/load-test.ts` | DevOps / QA | **HIGH** | Lack of automated load/stress test script to benchmark p50/p95 response times. | **OPEN** (Needs reproducible benchmark test suite) |

---

## 2. Elimination Strategy

1. **Phase 1:** Upgrade `src/lib/fees.ts` with comprehensive unit tests and dynamic `maxDevices` extraction from tenant settings.
2. **Phase 2:** Build unified payment adapter architecture under `src/lib/payments/` with full webhook simulation.
3. **Phase 3:** Restore and harden landing page interactive simulator with real product imagery (Nike, Coca-Cola, Big Mac) and CSS serrated receipt edges.
4. **Phase 4:** Create automated load testing and cross-tenant security verification tests.
