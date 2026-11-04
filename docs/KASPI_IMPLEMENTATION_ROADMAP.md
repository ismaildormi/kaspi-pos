# KASPI POS — GLOBAL IMPLEMENTATION ROADMAP & DELIVERY BLUEPRINT
**Document Version:** 1.0.0-OMEGA  
**Classification:** Strategic Engineering & Operational Roadmap  
**Execution Horizon:** 2026 – 2027  

---

## 1. STRATEGIC ROADMAP OVERVIEW

The KASPI POS platform follows a six-phase evolutionary delivery roadmap designed to ensure rock-solid stability, zero regression, and unmatched unit economics at every milestone.

```
2026 Q1 - Q2                2026 Q2 - Q3                2026 Q3 - Q4                2027+
+---------------------+     +---------------------+     +---------------------+     +---------------------+
| PHASE 1 & 2         |     | PHASE 3             |     | PHASE 4             |     | PHASE 5 & 6         |
| Baseline & Fabric   | ==> | Pilot Deployment    | ==> | FinOps Autopilot    | ==> | Planetary Mesh      |
| - Offline Core      |     | - 50 Pilot Stores   |     | - Automated Drills  |     | - Multi-Region Active|
| - Fees 70/30 Engine |     | - Hardware Cert     |     | - Dynamic Scale     |     | - MENA Expansion    |
| - Zero-Knowledge R2 |     | - Casablanca Beta   |     | - Self-Healing DB   |     | - Sovereign Nodes   |
+---------------------+     +---------------------+     +---------------------+     +---------------------+
```

---

## 2. DETAILED PHASE SPECIFICATIONS & ACCEPTANCE GATES

### Phase 1: Core Stabilisation & Multi-Tenant Foundations (COMPLETED ✓)
*Objective: Solidify rock-solid core application logic, database multi-tenancy, and desktop runtime.*

- **Milestones Completed:**
  - [x] Zod validation error handling refactored across registration API and UI with exact field messaging.
  - [x] Tauri desktop application navigation overhauled; unified sidebar architecture deployed across POS, Admin, Settings, and Analytics.
  - [x] Super Admin seeding engine (`scripts/seed-admin.ts`) verified with persistent session credentials.
  - [x] Supabase Storage client (`src/lib/supabase-storage.ts`) and Realtime engine (`src/lib/supabase.ts`) deployed with safe build-time fallbacks.
  - [x] Exact 4-tier Moroccan payment fee calculation engine and 70/30 dynamic splitting (`src/lib/fees.ts`) built with integer minor unit arithmetic and zero centime loss guarantee.
  - [x] Checkout modal dynamic device count billing integration.
  - [x] Cross-tenant RLS isolation test suite (`scripts/test-tenant-isolation.ts`) passed 100%.
  - [x] Load and latency benchmark (`scripts/load-test.ts`) executed 410 ops with zero errors and $< 18\text{ ms}$ average response time.

---

### Phase 2: Global Resource Fabric & Orchestrator (COMPLETED ✓)
*Objective: Unify worldwide infrastructure, free tiers, and backup replication into a single cohesive fabric.*

- **Milestones Completed:**
  - [x] Global Resource Intelligence Engine and comprehensive catalogs established in `tools/global-resource-intelligence/catalog/` and `catalog/`.
  - [x] Provider limits, free tiers, pricing models, terms of service, and low-latency availability matrix documented across 12 infrastructure providers.
  - [x] Universal Resource Orchestrator (`src/lib/orchestrator/`) implemented with strict criticality guards:
    - Guaranteed tier reserved exclusively for checkout, billing, and fiscal transactions.
    - Zero transactional or PII data dispatched to untrusted or community worker nodes.
  - [x] Client-Side Zero-Knowledge Backup Fabric (`src/lib/backup/`) implemented with AES-256-GCM encryption and multi-destination replication (Supabase S3 + Cloudflare R2).
  - [x] Universal Test Suite (`src/lib/__tests__/global-fabric.test.ts`) passing 4/4 verification tests with 100% success rate.
  - [x] Rust desktop compilation (`cargo check`) and Next.js TypeScript typecheck (`tsc --noEmit`) verified at Exit Code 0.

---

### Phase 3: Field Pilot & Hardware Certification (WEEKS 1 – 6)
*Objective: Onboard the first 50 retail beta stores across Casablanca, Rabat, and Marrakech.*

- **Action Items:**
  1. **Hardware Driver Certification:**
     - Certify USB and Network ESC-POS thermal receipt printers (Epson TM-T20III, Xprinter XP-N160II, Bixolon SRP-330).
     - Certify 1D/2D USB and Bluetooth barcode scanners (Honeywell Voyager 1250g, Zebra DS2208, Netum NT-1228).
     - Certify cash drawer RJ11 kick-out pulses.
  2. **Production Cloud Provisioning:**
     - Deploy production Next.js application to Vercel Pro with custom domain (`app.kaspi.ma`).
     - Configure Neon production compute branch with Supavisor connection pooling.
     - Establish Cloudflare Pro edge rules with Casablanca CMN PoP acceleration.
  3. **Merchant Onboarding:**
     - Provision 50 pilot store accounts with multi-language (French, Moroccan Darija Arabic) interfaces.
     - Run 7-day shadow cashiering alongside legacy cash registers to verify penny-perfect accounting.
- **Acceptance Criteria:**
  - Zero critical crashes over 10,000 live retail transactions.
  - Offline mode successfully handles simulated store internet disconnection without cashier disruption.

---

### Phase 4: FinOps Autopilot & Self-Healing Operations (WEEKS 7 – 14)
*Objective: Automate infrastructure scaling, backup verification drills, and continuous cost optimization.*

- **Action Items:**
  1. **Automated Restore Drills:**
     - Deploy scheduled cron job (`scripts/nightly-restore-drill.ts`) executing daily synthetic backup restoration tests from Cloudflare R2.
  2. **FinOps Threshold Alerts:**
     - Integrate Slack / WhatsApp webhook alerts triggering when Neon compute or Vercel bandwidth reaches 80% of monthly allocation.
  3. **Automated Database Maintenance:**
     - Configure automated `VACUUM ANALYZE` and index re-indexing schedules during retail off-peak hours (04:00 AM local time).
  4. **Multi-Carrier SMS Integration:**
     - Implement fallback SMS routes across Maroc Telecom, Orange Maroc, and Inwi for receipt delivery and OTP authentication.
- **Acceptance Criteria:**
  - Nightly backup drill passes 30 consecutive days with zero failures.
  - Gross infrastructure margin maintained above 95% at 500 active stores.

---

### Phase 5: Regional MENA Expansion & Active-Active Federation (MONTHS 4 – 8)
*Objective: Expand KASPI across Morocco, North Africa (Tunisia, Egypt), and GCC countries.*

- **Action Items:**
  1. **Multi-Region Read-Replicas:**
     - Deploy Neon read-replicas in Frankfurt and Bahrain to serve Middle East stores with $< 30\text{ ms}$ query latency.
  2. **Multi-Currency & Regional Tax Modules:**
     - Add dynamic currency formatting and fiscal tax rules for AED (UAE VAT 5%), SAR (Saudi ZATCA Phase 2 E-Invoicing), and TND (Tunisian Dinar).
  3. **Decentralized Contributor Edge Mesh:**
     - Activate optional community-contributed worker nodes for heavy batch workloads (historical sales forecasting, bulk catalog OCR).
- **Acceptance Criteria:**
  - Sub-50ms API latency verified across all target geographies.
  - Full compliance with Saudi ZATCA e-invoicing cryptographic signing specifications.

---

## 3. DEPENDENCY & RISK MITIGATION MATRIX

| Risk Factor | Probability | Impact | Mitigation Strategy | Owner |
|---|---|---|---|---|
| **Thermal Printer Driver Incompatibility** | Medium | High | Tauri raw ESC-POS serial/USB bridge with generic fallback bitmap rasterizer. | Lead Desktop Engineer |
| **Store Power Outage Corrupting Local DB**| High | Medium | IndexedDB transactional ACID writes; journaled write-ahead logs in Dexie; uninterruptible power supply (UPS) recommendation in merchant onboarding kit. | Systems Architect |
| **Cloudflare R2 API Credential Expiration**| Low | High | Automated credential rotation script with multi-cloud fallback to Supabase Storage. | DevOps Director |
| **Moroccan Tax Law Changes (DGI)** | Low | Critical | Configurable fiscal rules engine in `src/lib/fees.ts` allowing instantaneous updates to VAT rates and invoice sequence formats. | FinOps / Compliance Lead |
