# KASPI POS (كسب) — Marketing & Feature Catalog Architecture

> **Notice:** This document serves as the comprehensive product catalog and architecture specification for KASPI POS (كسب), designed for multi-channel merchant onboarding, Shopify store integration, and global enterprise deployment.

---

## 1. Executive Summary & Value Proposition

**KASPI POS (كسب)** is Morocco's premier offline-first, high-precision Point of Sale (POS) and Enterprise Retail ERP, engineered for modern retail networks, grocery chains, bustling cafés, butcheries, fashion boutiques, and electronics retailers.

Built on Apple **visionOS-inspired frosted crystal glass architecture** with deep Moroccan commercial compliance (CGI Article 145, ICE validation, BAM Law 103-12 direct merchant settlement), KASPI delivers zero-latency checkout, 100% offline survivability, instant hardware discovery, and unified omni-channel payment processing.

---

## 2. Six Tailored Industry Modes & Adaptive UI

KASPI automatically adapts its workspace layout, item grid, hardware controls, and receipt typography based on the selected store industry profile:

### 1. Supermarket & Hypermarket (`supermarket` / `grocery`)
- **UI Architecture:** Fast-scan barcode entry, integrated Marjane-style high-velocity cashier ergonomics.
- **Hardware Integration:** Dual scale integration (RS232/USB Avery Berkel & CAS scales), electronic price tag (ESL) sync, and DLC expiry tracking.
- **Receipt Template:** Itemized weights (`1.250 kg × 12.00 MAD`), piece quantities, promotional savings callouts, and clean category totals.

### 2. Café, Coffee Shop & Restaurant (`cafe_restaurant`)
- **UI Architecture:** Touch-first visual tile grid with modifier selection (temperature, sugar level, milk substitutions), table seating visual map, kitchen display system (KDS) routing.
- **Ergonomics:** Heavy grocery PLU and scale bars are tucked away by default to optimize space for high-volume order tapping.
- **Receipt Template:** Distinct **Hero Order Callout Box (`رقم طلبك: #42`)**, Service Mode badge (`محلي Dine-In` / `سفري Takeaway` / `توصيل Delivery`), server name, table identifier, and clean tax-inclusive pricing.

### 3. Boucherie & Halal Meats (`butchery`)
- **UI Architecture:** Tare auto-subtraction, price-per-kilogram live scale binding, traceability batch numbers, and health inspection seals.
- **Ergonomics:** Instant scale access with decimal weight stepper pills (`[-] 1.250 kg [+]`) and instant price recalculation.
- **Receipt Template:** Pre-packaging tare weight, net weight, price/kg, and slaughter/traceability batch reference.

### 4. Fruits & Légumes / Primeur (`produce`)
- **UI Architecture:** Visual PLU touchscreen directory with auto-categorized seasonal fruits, leafy greens, and root vegetables.
- **Ergonomics:** Instant 0-click item weighing via connected scale with automated weight drift protection.
- **Receipt Template:** Bold PLU code, net weight in kg (3 decimals), unit price, and certified non-VAT agricultural tax exemptions.

### 5. Fashion & Ready-to-Wear (`fashion`)
- **UI Architecture:** Matrix grid for size/color variations (S, M, L, XL, XXL × Colors), season tagging, and multi-barcode SKU management.
- **Ergonomics:** Clean catalog view without scale controls, instant barcode gun rapid-fire scanning, and customer styling notes.
- **Receipt Template:** Garment size/color line annotations, return/exchange 14-day policy, and merchant care QR code.

### 6. Electronics & Mobile Retail (`electronics`)
- **UI Architecture:** IMEI & serial number tracking on checkout, warranty certificate generator, and installment credit tracking.
- **Ergonomics:** Technical specifications lookup, battery health indicators, and high-value security lock features.
- **Receipt Template:** IMEI/Serial number per item, warranty expiration timestamp, and customer national ID verification.

---

## 3. Tax-Inclusive Clean Pricing & Zero-Surprise Receipts

In accordance with standard Moroccan retail regulations and consumer protection laws:
- **`taxDisplayMode: 'INCLUSIVE_CLEAN'` (Default):** All displayed product prices are tax-inclusive (TTC). A 100.00 MAD menu or retail item totals exactly **100.00 MAD** on customer receipts, eliminating hidden or surprise 20% TVA surcharges.
- **`TAX_BREAKDOWN` (Optional B2B/Supermarket):** Explicit HT / TVA 7%, 10%, 14%, 20% sub-totals for corporate customers with verified tax IDs (ICE).
- **Zero Fake Legal IDs:** Strict elimination of demo or mock tax identifiers (`002345678000045`, `45892134`, `DGI-...`). Real ICE is rendered only when legally configured and validated.
- **Zero Phone Spam:** Personal phone numbers are completely omitted from receipts to preserve privacy and prevent unauthorized customer contact.
- **Strict Western Digits in Timestamp:** Enforced Western Arabic numerals (`YYYY/MM/DD HH:mm:ss`) inside `dir="ltr"` isolate containers, preventing RTL/LTR bidirectional visual flip bugs.

---

## 4. Zero-Server-Cost Client-Side 1D Barcodes & 2D QR Codes

KASPI features custom-built, pure TypeScript vector generators (`src/lib/printing/client-codes.ts`):
- **Code 128 (Subset B) Barcodes:** Pure SVG generator computing standard start/stop codes, checksums, and quiet zones directly on the client. Enables instant thermal printing of ticket barcodes without external libraries or cloud APIs.
- **QR Code Generator:** Byte-mode QR Code generator (Versions 1–3) with Reed-Solomon Galois Field GF(256) error correction, rendering lightweight vector QR codes for merchant websites, menus, or Google Maps location reviews.
- **Operational Benefit:** **\$0.00 cloud infrastructure cost** and instant sub-millisecond receipt generation even when completely disconnected from the internet.

---

## 5. Global + Morocco Payment Orchestration

KASPI provides an omni-channel payment orchestrator supporting domestic and international transaction rails:
- **Moroccan Domestic Settlement (CMI & PayZone):** Direct merchant bank account settlement complying with Bank Al-Maghrib (BAM) Law 103-12. Zero intermediary escrow locks.
- **International Card Processing (Stripe):** Multi-currency support (MAD, USD, EUR, GBP, AED, SAR) with 3D Secure 2.0 authentication and automated chargeback protection.
- **Direct Debit & SEPA/Virement:** Automated B2B bank wire reconciliation and recurring invoice auto-debit.
- **SaaS Subscription Engine:** Fixed transparent pricing:
  - **1st Primary Poste:** `200 MAD/month` (Includes 100% enterprise features, unlimited products, unlimited transactions).
  - **Additional Postes:** `150 MAD/month` per additional register/terminal.
  - Automated recurring renewal with graceful retry buffers and instant receipt issuance.

---

## 6. Universal 7-Protocol TPE Auto-Discovery Hub

KASPI connects seamlessly to all major global and domestic Electronic Payment Terminals (TPE / Payment POS Terminals) via native Rust Tauri sockets and client-side protocols:
1. **nexo Retailer Protocol (ISO 20022 XML/JSON):** Global enterprise standard (Adyen, Worldline, Nexi, PAX, Ingenico, Verifone).
2. **OPI (Open Payment Initiative XML):** European & International retail dual-channel standard.
3. **Protocol Concert V3 / ECR (Ingenico & Verifone):** Dedicated French & North African retail standard with serial/USB & TCP Ethernet support.
4. **SPDH (Standard POS-Device-Host Protocol):** Financial host direct message format.
5. **ZVT (Zahlungsverkehrsterminal Protocol):** DACH region standard over TCP/IP and RS232.
6. **Pax POSLink Protocol:** Cloud and LAN IP API for PAX A-series smart payment terminals.
7. **Castle / Newland ECR Protocol:** High-speed RS232 and USB CDC virtual COM protocol.

---

## 7. Merchant Engagement, Operational Streak & Automation

- **Daily Store Streak (`سلسلة النشاط اليومي`):** Gamified visual milestone tracker celebrating merchant operational consistency, computed dynamically from actual register sales and cash shift openings.
- **WhatsApp Automated Z-Reports:** Automated end-of-day financial summaries (revenue, cash in drawer, card totals, debt repayments, margins) delivered directly to the store owner's WhatsApp upon shift close.
- **Offline-First Dexie Engine:** IndexedDB persistent transaction queue with automated background sync, conflict resolution, and optimistic UI updates.
