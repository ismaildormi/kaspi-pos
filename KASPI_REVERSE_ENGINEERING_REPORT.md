# KASPI POS (كسب) — Reverse-Engineering & Compliance Audit Report

- **Audit Status:** ALL CHECKS PASSED (0 Failures)
- **Total Rules Verified:** 23
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
| 12 | **Live DOM (pearl-light)** | /ar/login — <KaspiBrandMark size='auth'> height <= 52px & 100% opacity | **PASS** | `height=48px, opacity=1` |
| 13 | **Live DOM (pearl-light)** | Circular Icon-Only Theme Switcher (36x36px, zero text inside button) | **PASS** | `size=36x36px, text=""` |
| 14 | **Live DOM (pearl-light)** | /ar/dashboard renders Daily Store Streak badge | **PASS** | `data-kaspi-daily-streak present` |
| 15 | **Live DOM (pearl-light)** | KaspiGlassAnalyticsModal portaled to BODY at z-index 9999, translucent alpha < 0.65, zero viewport leak | **PASS** | `parent=BODY, z=9999, alpha=0.46, fitsViewport=true` |
| 16 | **Live DOM (pearl-light)** | Scrolled /ar/dashboard/inventory locks Sidebar (720px) and scrolls Topbar out of view | **PASS** | `asideHeight=720px, headerTop=-500px` |
| 17 | **Live DOM (pearl-light)** | /ar/dashboard/settings?tab=terminals renders Universal TPE Hub & Custom Store Receipt Studio (ASIMA) | **PASS** | `KaspiTpeManagerPanel + Receipt Studio + Thermal Preview verified` |
| 18 | **Live DOM (fjord-twilight)** | /ar/login — <KaspiBrandMark size='auth'> height <= 52px & 100% opacity | **PASS** | `height=48px, opacity=1` |
| 19 | **Live DOM (fjord-twilight)** | Circular Icon-Only Theme Switcher (36x36px, zero text inside button) | **PASS** | `size=36x36px, text=""` |
| 20 | **Live DOM (fjord-twilight)** | /ar/dashboard renders Daily Store Streak badge | **PASS** | `data-kaspi-daily-streak present` |
| 21 | **Live DOM (fjord-twilight)** | KaspiGlassAnalyticsModal portaled to BODY at z-index 9999, translucent alpha < 0.65, zero viewport leak | **PASS** | `parent=BODY, z=9999, alpha=0.56, fitsViewport=true` |
| 22 | **Live DOM (fjord-twilight)** | Scrolled /ar/dashboard/inventory locks Sidebar (720px) and scrolls Topbar out of view | **PASS** | `asideHeight=720px, headerTop=-500px` |
| 23 | **Live DOM (fjord-twilight)** | /ar/dashboard/settings?tab=terminals renders Universal TPE Hub & Custom Store Receipt Studio (ASIMA) | **PASS** | `KaspiTpeManagerPanel + Receipt Studio + Thermal Preview verified` |
