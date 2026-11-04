# KASPI POS — Master Engineering Implementation Roadmap

```mermaid
flowchart TD
    P0["Phase 0: Complete Project Discovery & Audit"] --> P1["Phase 1: Exact Payment Fees & Financial Logic (70/30)"]
    P1 --> P2["Phase 2: Unified 4-Tier Payment Adapters (Stripe, YouCan, CMI)"]
    P2 --> P3["Phase 3: Landing Page Polish & POS Simulator (2027 UI)"]
    P3 --> P4["Phase 4: Desktop Hardening, Arabic Printing & Offline Sync"]
    P4 --> P5["Phase 5: Domain-Bounded AI & Owner Studio Analytics"]
    P5 --> P6["Phase 6: Scalability Benchmarks & Load Testing"]
    P6 --> P7["Phase 7: Security Audit & Tenant Isolation Verification"]
    P7 --> P8["Phase 8: Comprehensive Verification & Release"]
```

---

## Roadmap Milestones & Verifiable Deliverables

| Milestone | Deliverable File(s) | Primary Responsibility | Target Exit Criteria |
| :--- | :--- | :--- | :--- |
| **M1: Discovery** | `docs/PROJECT_DISCOVERY.md`<br>`docs/CURRENT_ARCHITECTURE.md`<br>`docs/TECHNICAL_DEBT.md` | Principal Architect | Complete codebase inventory documented |
| **M2: Fee Engine** | `src/lib/fees.ts`<br>`src/lib/__tests__/fees.test.ts`<br>`src/components/pos/CheckoutModal.tsx` | Financial Engineer | Exact fee formulas with integer rounding & test coverage |
| **M3: Payments** | `src/lib/payments/types.ts`<br>`src/lib/payments/stripe.ts`<br>`src/lib/payments/youcanpay.ts`<br>`src/lib/payments/cmi.ts`<br>`src-tauri/src/tpe_bridge.rs` | Integration Engineer | Unified payment adapter interface & webhook handlers |
| **M4: Landing UI** | `src/components/landing/InteractivePosSimulator.tsx`<br>`src/components/landing/DevicePricingCalculator.tsx` | UI/UX Architect | 2027 dark design, serrated receipt, Nike/Coca-Cola/Big Mac items |
| **M5: Core Hardening** | `src-tauri/src/printer.rs`<br>`src/server/db/invoice-sequence.ts`<br>`src/client/sync-engine.ts` | Systems Engineer | Concurrency-safe DGI numbering & Arabic RTL thermal printing |
| **M6: AI & Admin** | `src/app/api/ai/chat/route.ts`<br>`src/app/admin/page.tsx` | AI & Analytics Engineer | Strict domain restriction & real MRR/tenants Recharts dashboard |
| **M7: Scalability** | `scripts/load-test.ts`<br>`scripts/test-tenant-isolation.ts` | DevOps & QA Director | Verified cross-tenant isolation & latency benchmarks |
| **M8: Final Release** | `docs/FINAL_COMPLETION_REPORT.md` | CTO & Release Owner | `prisma generate`, `prisma db push`, `tsc`, `next build`, `cargo check` Exit 0 |
