# KASPI POS — DOWNLOAD CENTER SERVICES, MULTI-PLATFORM MATRIX & COMMERCIAL PRIVILEGES
**Document Reference:** `KASPI-SPEC-06-PRIVILEGES-2027`  
**Classification:** Official Executive, Banking, Acquirer, Investor, and Technical Architecture Dossier  
**Target:** Multi-Platform Distribution, Certified Hardware Ecosystem, 10 Core Services & Merchant Privileges  
**Status:** In Production (`v2.0.0` / `v4.0.0 Quantum Edition`)

---

## 1. Executive Summary & Multi-Platform Distribution Architecture

KASPI POS is architected as an **omnichannel, high-performance retail execution platform** designed to eliminate network dependency, eliminate point-of-sale hardware incompatibility, and democratize enterprise-grade store management for independent merchants and expanding retail chains across Morocco and internationally.

```
                           +-------------------------------------------------------------+
                           |               KASPI POS MASTER ECOSYSTEM                    |
                           |   (Born in Morocco, Built for the World - Multi-Currency)   |
                           +-------------------------------------------------------------+
                                            /                  |                  \
                                           /                   |                   \
                                          v                    v                    v
          +----------------------------------+ +-------------------------------+ +--------------------------------+
          |      WINDOWS DESKTOP (.exe)      | |        WEB APP (PWA)          | |      MOBILE & TABLET POS       |
          |  Native Tauri (Rust) Engine      | |  Next.js + Service Worker     | |  iOS Safari / Android Chrome   |
          |  Direct USB/LAN ESC/POS Printer  | |  IndexedDB Dexie.js Engine    | |  QR Code Direct Camera Scan    |
          |  RJ11 12V/24V Drawer Trigger     | |  One-Click Browser Install    | |  Mobile Waiter & AI Scanner    |
          |  Sub-20ms Barcode USB/HID        | |  Pins to Taskbar / Desktop    | |  Live Owner Analytics Card     |
          |  Offline-First SQLite Local DB   | |  Offline Sales Queue + Sync   | |  https://kaspi-pos.vercel.app  |
          +----------------------------------+ +-------------------------------+ +--------------------------------+
                                          \                    |                   /
                                           \                   |                  /
                                            v                  v                 v
                           +-------------------------------------------------------------+
                           |            CENTRAL ARBITER & CERTIFIED HARDWARE             |
                           |   - Dual-Input Engine: Touch (0ms lag) + Mouse (Sub-pixel)  |
                           |   - Universal 7-Protocol TPE Hub (CMI, nexo, OPI, PAX)      |
                           |   - DGI Article 145 CGI Morocco & French NF525 Tax Seals    |
                           |   - Cryptographic 1-Poste Hardware Lock (PosteBinding)      |
                           +-------------------------------------------------------------+
```

---

## 2. The 3 Official Deployment Tiers (Download Site Architecture)

### Tier 1: Windows Desktop Native Application (`kaspi-pos-setup.exe`)
* **Underlying Runtime:** Tauri framework with native Rust backend (`src-tauri/`) and Chromium Webview2 runtime.
* **Architecture:** 64-bit Windows 10 & 11 executable.
* **Thermal Printing Pipeline:** Direct raw binary ESC/POS communication over USB, Ethernet LAN (`TCP:9100`), or Bluetooth COM port without Windows print spooler lag.
* **Text Shaping Engine:** HarfBuzz native Rust font shaper for cursive Arabic ligature alignment and French accented characters.
* **Cash Drawer Control:** Native ESC/POS pulse generation (`ESC p m t1 t2` / `\x1b\x70\x00\x19\xfa`) triggering standard RJ11 solenoid coils (12V/24V) with auto-cut (`GS V 0` / `\x1d\x56\x00`).
* **Barcode Scanning Velocity:** Native USB HID keyboard emulation reading EAN-13, QR, and Code-128 barcodes in under 12ms to 20ms.
* **Local Offline Database:** SQLite embedded database providing zero-latency transactions during complete internet blackouts.
* **Desktop Deep-Linking & Handoff:**
  * Custom OS Protocol: `kaspipos://open?token=...&lang=...&target=...`
  * Local IPC Loopback Trigger: `http://127.0.0.1:41732/handoff` for zero-latency browser-to-desktop session restoration.

### Tier 2: Progressive Web App (PWA)
* **Installation Mechanism:** Instant zero-wait installation from Google Chrome, Microsoft Edge, or Apple Safari.
* **OS Integration:** Pins directly to Windows Taskbar, Desktop shortcuts, Start Menu, macOS Dock, or Linux application menus.
* **Offline Storage Engine:** IndexedDB powered by `Dexie.js`, buffering local sales in an encrypted queue when offline.
* **Sync Engine:** Automatic cloud background synchronization upon internet reconnection with optimistic UI updates and deduplication.
* **Platform Reach:** Universal cross-platform compatibility across Windows, macOS, Ubuntu/Debian Linux, and ChromeOS.

### Tier 3: iOS & Android Mobile & Tablet POS
* **Quick Access:** Direct QR Code camera scan pointing to `https://kaspi-pos.vercel.app/pos`.
* **Mobile Cashiering:** Touch-calibrated interfaces for handheld smartphones and retail tablets.
* **Mobile Waiter Mode:** Tableside ordering, seat assignment, and dish splits for restaurants and cafes.
* **Smart AI Scanner:** Native mobile camera integration for Gemini Vision AI stock scanning and price checking.
* **Live Owner Dashboard:** Real-time revenue, gross margin, cash drawer balance, and staff attendance monitoring from anywhere.

---

## 3. The 10 Core Services & Commercial Privileges

| # | Service / Privilege | Commercial Benefit to Merchant | Technical Implementation in Codebase |
|---|---|---|---|
| **01** | **100% Offline-First Zero-Downtime Engine** | Store continues sales during internet cuts, 4G outages, or fiber optic breaks with zero downtime. | SQLite (Tauri) + Dexie.js (Web/PWA) + optimistic sales queues in `src/client/db/dexie.ts` |
| **02** | **2-Minute Zero-Downtime Data Migration** | Switch from legacy POS systems in 120 seconds with zero manual data entry. | Auto column mapper for Excel/CSV, Loyverse, Square, Sage, Caissa, POSNEX in `DataMigrationSimulator.tsx` |
| **03** | **Automated WhatsApp Daily Z-Reports** | Daily closing summaries sent to owner's smartphone automatically without opening software. | Automated Z-report generator, cash/card/credit breakdown, anomaly alerts in `WhatsAppReportSimulator.tsx` |
| **04** | **24/7 Deep AI Business & Financial Advisor** | Real-time profit analysis, dead-stock warnings, and predictive purchasing recommendations. | Multi-factor profit model, customer credit tracker, stock reorder formulas in `AiAnalyticsSimulator.tsx` |
| **05** | **Gemini Vision AI Smart Stock Scanner** | Add 500 products in 10 minutes by photographing product packaging. | Multimodal Gemini Vision API extracting Arabic/French titles, EAN-13, and margins in `AiScannerSimulator.tsx` |
| **06** | **Embedded WebGPU & Zero-Cloud-Cost Architecture** | Eliminates expensive cloud GPU servers while providing 100% merchant financial privacy. | WebGPU + Rust Hardware Abstraction Layer running locally on store machine in `LocalGpuShowcase.tsx` |
| **07** | **Multi-Store Enterprise Chain Centralization** | Scales from 1 grocery store to 50+ branches across Casablanca, Paris, Dubai, Madrid. | Multi-store inventory sync, inter-branch transfers, multi-currency (MAD/EUR/USD/SAR/AED) in `EnterpriseChainShowcase.tsx` |
| **08** | **Certified Hardware & Peripherals Compatibility** | Plug and play compatibility with all existing POS printers, barcode scanners, and scales. | Driverless USB HID, ESC/POS, RS232, and weight-embedded barcode decoders in `QuantumEnterpriseSections.tsx` |
| **09** | **Version 4.0 Quantum Edition Capabilities** | WebP 90% image compression, Sage CGI Art. 145 export, supplier check maturity, and live Shopify sync. | Content-Addressable Storage (CAS), DGI accounting format, Kembyala maturity tracker in `QuantumEnterpriseSections.tsx` |
| **10** | **Device-Based Transparent Pricing Model** | 200 MAD/month (1st Poste) + 150 MAD/month (extra Postes), 0% sales commission, full fiscal compliance. | Hardware-bound seats (`PosteBinding`), gap-less sequential numbering (Art. 145 / NF525) in `prisma/schema.prisma` |

---

## 4. 100% Certified Hardware Compatibility Matrix

```
+---------------------------------------------------------------------------------------------------------+
|                               CERTIFIED PERIPHERALS & HARDWARE SPECIFICATIONS                           |
+----------------------+-----------------------------------------------+-------------------+--------------+
| Peripheral Category  | Supported Manufacturers & Models              | Interface Types   | Latency / Perf|
+----------------------+-----------------------------------------------+-------------------+--------------+
| ESC/POS Printers     | Epson TM-T20III / TM-T88VI, Xprinter XP-N160M/| USB 2.0/3.0,      | < 8ms print  |
|                      | XP-Q200, Rongta, Bixolon, POS-58/80           | LAN TCP:9100, BT  | Auto-Cut + RJ11|
+----------------------+-----------------------------------------------+-------------------+--------------+
| Barcode Scanners     | Zebra DS2208, Honeywell Voyager 1200g,        | USB HID Keyboard, | < 12ms decode|
|                      | Datalogic QuickScan, Netum 1D/2D Wireless     | Bluetooth SPP     | 1D/2D QR/Code128|
+----------------------+-----------------------------------------------+-------------------+--------------+
| Electronic Scales    | Dibal, Avery Berkel, Digi, Mettler Toledo     | RS232 Serial COM, | Auto-detect   |
|                      | (Barcode prefix 20, 21, 28, 29 weight-price)  | USB, Barcode Scan | Grams & Price|
+----------------------+-----------------------------------------------+-------------------+--------------+
| Cash Drawers         | Heavy-duty 4 to 8 bill compartments, steel     | RJ11 / RJ12 12V/24V| 100ms pulse  |
|                      | construction with key override                | via Printer Kick  | Auto-open F10|
+----------------------+-----------------------------------------------+-------------------+--------------+
| 4G/5G Network Gear   | Huawei B310/B535, TP-Link Archer, D-Link,     | Ethernet LAN,     | Instant drop |
|                      | SIMs: Maroc Telecom, Orange Maroc, Inwi       | Wi-Fi 5/6, LTE    | failover to DB|
+----------------------+-----------------------------------------------+-------------------+--------------+
| TPE Bank Terminals   | Ingenico Desk/Move 5000, PAX A920/S920,        | Ethernet, Wi-Fi,  | 11-State FSM |
|                      | Verifone V200c / V240m (CMI, nexo, OPI)       | USB COM Serial    | Zero re-entry|
+----------------------+-----------------------------------------------+-------------------+--------------+
```

---

## 5. Version 4.0 Quantum Edition Changelog & Advanced Privileges

1. **WebP Image Compression & SHA-256 CAS Deduplication:**
   * Automatically compresses product images on the client machine before upload, slashing image payloads by over 90%.
   * Uses cryptographic Content-Addressable Storage (CAS) so identical standard FMCG packaged goods share single cloud blobs, preventing storage bloat.
2. **Moroccan Tax Code Article 145 CGI & Sage Accounting Export:**
   * One-click financial journal generation matching DGI official export formats.
   * Full TVA rate classification: 7% (water, sugar, pharmaceuticals), 10% (hospitality, food products), 14% (electricity, transport), and 20% (standard merchandise).
3. **Supplier Maturity Tracker & Cheque/Draft OCR (Échéancier Fournisseurs):**
   * Real-time monitoring of commercial papers, cheques, and drafts (Kembyala) maturing within 7 days.
   * Smart optical recognition scanner for wholesale supplier invoices with automated 1-click inventory replenishment.
4. **Bi-Directional E-Commerce Omnichannel Sync:**
   * Live webhook pipeline connecting physical store shelves with YouCan and Shopify storefronts.
   * Automatically decrements physical shelf inventory when an online order is placed, preventing overselling.

---

## 6. Real Codebase File Mapping

* **Download Center UI:** `src/app/[locale]/download/page.tsx`
* **Desktop Deep-Link Handoff:** `src/app/launch-desktop/page.tsx`
* **Marketing Showcase & Landing Page:** `src/app/page.tsx`
* **Hardware Matrix & V4.0 Changelog Component:** `src/components/landing/QuantumEnterpriseSections.tsx`
* **Transparent Pricing Calculator:** `src/components/landing/DevicePricingCalculator.tsx`
* **Offline IndexedDB Dexie Storage:** `src/client/db/dexie.ts`
* **Tauri Desktop Backend:** `src-tauri/src/main.rs`, `src-tauri/src/tpe_bridge.rs`
* **Prisma Licensing Model:** `prisma/schema.prisma` (`PosteBinding`, `SupportConflictTicket`)
