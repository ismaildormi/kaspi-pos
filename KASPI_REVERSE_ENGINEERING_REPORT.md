# KASPI POS (كسب) — Reverse-Engineering & Compliance Audit Report

- **Audit Status:** ALL CHECKS PASSED (0 Failures)
- **Total Rules Verified:** 17
- **Pricing Rule Lock:** `200 MAD/month` (1st Poste, 100% features) + `150 MAD/month` per extra Poste
- **Legal & Security Lock:** Bank Al-Maghrib Law 103-12 Software Separation + PCI-DSS 4.0.1 Tokenized-Only Storage

| # | Category | Compliance Rule | Status | Measured Metric / Proof |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Payment Architecture** | All 16+ modular Global & Morocco Payment Engine files exist under src/lib/payments/ | **PASS** | `19 modules verified` |
| 2 | **PCI-DSS 4.0.1 & Law 103-12** | Zero raw card numbers (PAN) or CVV/CVC columns in prisma/schema.prisma | **PASS** | `Tokenized references only` |
| 3 | **Recurring Billing Mandate** | Auto-Renew Recurring Mandate (200 MAD 1st Poste + 150 MAD extra Postes) & Verified Webhook/Portal APIs exist | **PASS** | `200 MAD / +150 MAD + Auto-Renew Mandate verified` |
| 4 | **Visual UI** | KaspiBrandMark dimensions locked to h-11 sm:h-12 (auth), h-7 (POS header), h-8 (Sidebar) | **PASS** | `sm=28px, md=32px, auth=44-48px` |
| 5 | **Visual UI** | KaspiThemeToggle is strictly circular icon-only (rounded-full w-9 h-9 p-0) with zero visible text | **PASS** | `36x36px icon-only button` |
| 6 | **Modal Portal & Stacking** | All modal & drawer components use <KaspiGlassModalPortal> (createPortal + z-[9999]) with 0 unportaled fixed inset-0 overlays and .kaspi-emerald-checkout-btn z-index: 0 | **PASS** | `100% modals portaled to document.body (0 stray overlays)` |
| 7 | **Crystal Glass Optics** | Zero opaque 0.94/0.97 modal walls in globals.css; modals use translucent blur(36px) crystal (<0.65 alpha) | **PASS** | `Light modal alpha=0.46, Dark modal alpha=0.56` |
| 8 | **POS & Merchant Features** | Product (...) menu opens Change Photo / Edit Details / Change Category modal; PLU modal has photo dropzone; Dashboard shows Daily Store Streak | **PASS** | `All 3 feature suites verified` |
| 9 | **Universal TPE Architecture** | All Universal TPE Hub modules, 7 Global Protocols & 4-Path Receipt Engine exist with docs/KASPI_UNIVERSAL_TPE_SOURCES.md | **PASS** | `18 TPE modules + 7 Protocols + 4 Print Paths verified` |
| 10 | **TPE State Machine** | Exact 11-State Machine, Zero Amount Re-entry & Disconnect Recovery enforced in TpeTransactionBridge | **PASS** | `11 states + Zero Re-entry + Disconnect Recovery verified` |
| 11 | **Tauri Bridge & Tenant Isolation** | Tauri tpe_bridge.rs implements TCP OPI/NEXO, probe_tpe_endpoint & print_tpe_receipt; Prisma schema defines tenant/store-isolated TPE models | **PASS** | `Tauri Rust TCP bridge + probe/print + scoped schema models verified` |
| 12 | **Client Vector Codes** | Pure TypeScript client-side SVG generators for 1D Code 128 & 2D QR Code (Reed-Solomon GF(256)) with $0 server cost | **PASS** | `Code128 + QR Byte-mode SVG engine verified` |
| 13 | **Tax-Inclusive Retail Pricing** | taxDisplayMode defaults to INCLUSIVE_CLEAN; grand total displays clean TTC price without forced +20% TVA surcharge | **PASS** | `Default TTC clean pricing verified` |
| 14 | **Thermal Receipt Integrity** | Zero demo tax IDs rendered on receipts, zero phone numbers on customer receipts, Western digits in ISO timestamps | **PASS** | `Zero phone, zero fake IDs, clean Western timestamps verified` |
| 15 | **Live Data Sync & Catalog** | Sales API resolves storeId automatically, decrements stockLevel, revalidates dashboard cache, and marketing catalog covers 6 industry modes | **PASS** | `Atomic Postgres sync + 6-mode marketing catalog verified` |
| 16 | **1-Poste Hardware Binding & Dual Lockdown** | PosteBinding & SupportConflictTicket models, WebCrypto/Tauri fingerprinting, DUAL_LOCKDOWN, Clean-Shutdown Grace Recovery, and /admin Support Conflict Inbox | **PASS** | `Hardware Binding + DUAL_LOCKDOWN + Customer Grace Recovery + Admin Inbox verified` |
| 17 | **Proprietary Defense-in-Depth, WebCrypto Tamper Seal & Free Security Bots** | kaspi-ironclad-guard (CWE-1321/352/434/918/208/209), offline-tamper-seal ECDSA P-256 chain, CVE-2025-29927 middleware guard, Gitleaks, TruffleHog, CodeQL, and Dependabot | **PASS** | `Ironclad Guard + CVE-2025-29927 Shield + WebCrypto P-256 Seal + Free GitHub Bots verified` |
