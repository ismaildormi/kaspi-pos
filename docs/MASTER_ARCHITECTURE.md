# KASPI POS (كسب) — Master Enterprise Architecture (100,000+ Merchants)

## 1. Executive Summary & Hybrid Infrastructure Topology

**KASPI POS** is engineered to scale to **100,000+ Moroccan retail merchants and restaurants** with **zero single points of failure** and **near-zero infrastructure cost** initially, strictly protecting the platform owner's cash flow. 

The system leverages a **Hybrid Multi-Cloud Topology**:
- **Global Serverless Edge (Vercel)**: Next.js 15 App Router, React 19, dynamic rendering, fast CDN, and lightweight API routing with `AsyncLocalStorage` tenant context injection.
- **Dedicated Self-Hosted Core (Oracle Cloud Always-Free ARM VPS)**: A 4 OCPU, 24 GB RAM Ampere A1 instance hosting Docker containers for **Supavisor** (database connection pooling), **Trigger.dev** (long-running background jobs), **Hyperswitch** (payment routing), and **Caddy** (automated SSL/TLS).
- **Serverless PostgreSQL (Neon.tech)**: PostgreSQL 16 database with engine-level **Row-Level Security (RLS)**, automated point-in-time recovery, and atomic row locking (`SELECT ... FOR UPDATE`) for Moroccan tax compliance.
- **Local-First Native Terminal (Tauri v2 + PWA)**: Local SQLite and Dexie.js (IndexedDB) with CRDT / Watermark outbox sync and direct USB ESC/POS thermal printing.

```mermaid
flowchart TD
    subgraph ClientTier["1. Client & Terminal Tier (100% Offline POS)"]
        Tauri["Tauri v2 Native Desktop (.exe)\nLocal SQLite + Rust ESC/POS (HarfBuzz / BiDi / Raster)"]
        PWA["Next.js 15 PWA Terminal\nDexie.js (IndexedDB) + CRDT/Watermark Outbox Sync"]
        R2["Cloudflare R2 (10 GB Free Tier)\nStatic Assets & Auto-Updater Distribution"]
    end

    subgraph VercelEdge["2. Global Serverless Edge Tier (Vercel)"]
        NextApp["Next.js 15 App Router & API Endpoints\nAsyncLocalStorage Request Context"]
        PrismaExt["Prisma Client + prismaRlsExtension\nAutomatic Tenant Isolation Injection"]
    end

    subgraph OracleVPS["3. Self-Hosted VPS Tier (Oracle Cloud Always-Free Docker)"]
        CaddyProxy["Caddy 2 Reverse Proxy\nAutomatic Let's Encrypt TLS"]
        Supavisor["Supavisor (Port 6543)\nElixir Multi-Tenant Connection Pooler"]
        TriggerDev["Trigger.dev v3 Worker & Supervisor\nLong-Running CSV Imports & Heavy Async Tasks"]
        Hyperswitch["Hyperswitch Router\nUnified Payment Switch"]
        VPSPostgres[("Internal PostgreSQL 16\nMetadata Store for VPS Services")]
        VPSRedis[("Redis 7 Cache\nQueue & Worker Broker")]
    end

    subgraph DataGateways["4. Persistence & Payment Gateways"]
        NeonDB[("Neon Serverless PostgreSQL 16\nDatabase RLS + DGI Gap-Less Sequence Locking")]
        Paddle["Paddle (Global MoR - USD/EUR)"]
        YouCanPay["YouCanPay (Morocco - MAD / CMI / CashPlus)"]
    end

    Tauri <-->|"CRDT / Watermark Sync"| NextApp
    PWA <-->|"Outbox Sync (/api/sales)"| NextApp
    R2 -->|"Zero-Egress Static Assets"| Tauri
    NextApp --> PrismaExt
    PrismaExt -->|"Pooled Transaction Queries (:6543)"| Supavisor
    NextApp -->|"Async Task Dispatch (:8030)"| TriggerDev
    NextApp -->|"Unified Payment Intent (:8080)"| Hyperswitch
    Supavisor -->|"Multiplexed Physical Connections"| NeonDB
    Hyperswitch -->|"International Subscriptions"| Paddle
    Hyperswitch -->|"Local Moroccan Checkouts"| YouCanPay
    CaddyProxy --- Supavisor
    CaddyProxy --- TriggerDev
    CaddyProxy --- Hyperswitch
    TriggerDev --- VPSRedis
    TriggerDev --- VPSPostgres
    Hyperswitch --- VPSPostgres
    Supavisor --- VPSPostgres
```

---

## 2. Infrastructure Layer Matrix

| Layer | Technology | Infrastructure Target | Function & Capacity |
| :--- | :--- | :--- | :--- |
| **Edge Frontend & API** | Next.js 15 App Router, React 19, Auth.js | **Vercel** Edge Network | Global SSR, API routing, auth validation, and sub-second edge responses. |
| **Desktop & Offline Terminal** | Tauri v2 (Rust) + SQLite + Dexie.js | **Merchant Terminal (Windows / Web)** | Complete offline sale operations, local inventory caching, and USB ESC/POS printing. |
| **Connection Pooler** | **Supavisor 2.5** (Elixir BEAM) | **Oracle Cloud VPS** (Docker, Port 6543) | Multiplexes 100,000+ serverless connections into Neon PostgreSQL with zero pool exhaustion. |
| **Background Workers** | **Trigger.dev v3** (Webapp + Supervisor) | **Oracle Cloud VPS** (Docker, Port 8030) | Non-blocking execution of 10,000-row CSV catalog imports, AI OCR, and Z-report generations. |
| **Payment Orchestrator** | **Hyperswitch** (Rust Standalone Router) | **Oracle Cloud VPS** (Docker, Port 8080) | Smart routing between YouCanPay (MAD) and Paddle (USD/EUR) with unified webhook handling. |
| **Primary Database** | **PostgreSQL 16** | **Neon.tech Serverless** | Multi-tenant relational storage with engine-level RLS and ACID compliance. |
| **Static Storage & CDN** | **Cloudflare R2** (S3-compatible) | **Cloudflare Edge** (Zero Egress Fees) | Product image storage, receipt assets, and desktop binary releases (10 GB/mo free). |

---

## 3. The 7 Critical Risks & Open-Source Solutions

### 1. Offline Risk → Tauri + Local SQLite + Dexie.js (CRDT / Watermark Sync)
* **Risk**: Moroccan internet connectivity can fluctuate in souks, medinas, and commercial centers. Offline drops must never halt a merchant's checkout queue.
* **Architecture**:
  * **Dexie.js Outbox**: The PWA and web UI store local sales in an IndexedDB `sync_queue` table. Sales generate unique UUIDs (`clientSaleId`) and local receipt numbers immediately.
  * **Tauri Desktop SQLite**: Native desktop terminals store catalog state in an embedded SQLite database.
  * **Watermark Synchronization**: Products and categories maintain monotonic `serverSeq` sequence numbers. Terminals request updates using `WHERE server_seq > :last_watermark`, minimizing payload size and bandwidth.
  * **Idempotent Reconciliation**: When connectivity restores, outbox operations replay against `/api/sales` using atomic idempotency keys. Conflicts resolve with last-write-wins timestamps.

### 2. Database Connection Pooling Risk → Supavisor (VPS) Routing to Neon
* **Risk**: Serverless architectures spin up hundreds of transient container instances during traffic surges. Direct PostgreSQL connections quickly exceed connection limits (`max_connections` reached).
* **Architecture**:
  * **Supavisor Transaction Pooler**: Hosted on the Oracle Cloud VPS on port `6543`.
  * **Tenant-Based Routing**: Application traffic targets `postgresql://user.kaspi:password@vps-ip:6543/neondb?pgbouncer=true&connection_limit=1`.
  * **Direct Migration Channel**: Schema migrations (`prisma migrate` and `prisma db push`) connect directly to Neon's unpooled port `5432` (`DIRECT_URL`), while runtime application queries flow through Supavisor.

### 3. Vercel Serverless Timeout Risk → Trigger.dev (VPS) Background Jobs
* **Risk**: Vercel Hobby has a strict 10-second request timeout. Importing a 10,000-row CSV file or running multi-page AI OCR runs far beyond this limit.
* **Architecture**:
  * **Trigger.dev v3 Worker**: Self-hosted worker and supervisor container cluster on Oracle Cloud VPS.
  * **Immediate 202 Accepted Response**: When a merchant submits a CSV upload, `/api/products/import` creates a tracking record in `ProductImportJob`, dispatches the task payload to Trigger.dev (`tasks.trigger("import-csv", ...)`), and returns `HTTP 202 Accepted` in `< 150ms`.
  * **Chunked Batch Processing**: The Trigger.dev worker streams the file in memory, validates headers (French, Arabic, English), deduplicates against existing tenant SKUs, and persists rows in atomic `500-row` Prisma transactions (`CHUNK_SIZE = 500`) up to a strict `10,000` row safety cap.

### 4. Moroccan DGI Tax Compliance Risk → PostgreSQL `SELECT FOR UPDATE` Gap-Less Sequences
* **Risk**: Moroccan Tax Authority (DGI) Article 145 of the CGI strictly mandates gap-less, monotonically increasing sequential numbering for official invoices and credit notes (`FAC-2026-000001`). Random identifiers, timestamps, or naive `COUNT(*)+1` queries cause numbering gaps during concurrency or aborted checkouts, exposing merchants to heavy regulatory penalties. Mandatory ICE (Identifiant Commun de l’Entreprise), IF (Identifiant Fiscal), and RC (Registre de Commerce) details must also be stamped.
* **Architecture**:
  * **Dedicated Sequence Store**: An `InvoiceSequence` table tracks `(tenantId, year, prefix, lastNumber)` per tenant and fiscal year.
  * **Pessimistic Locking**: `generateNextInvoiceNumber` executes:
    ```sql
    SELECT "id", "last_number"
    FROM "invoice_sequences"
    WHERE "tenant_id" = $1 AND "year" = $2 AND "prefix" = $3
    FOR UPDATE;
    ```
  * **Atomic Single-Transaction Scope**: The sequence increment and the `Invoice` creation occur inside the exact same database transaction (`prisma.$transaction`). If invoice creation fails, the sequence rollback is automatic—guaranteeing zero gaps in the official fiscal series.

### 5. Arabic Thermal Printing Risk → Pure-Rust HarfBuzz / BiDi / 1-Bit Raster ESC/POS
* **Risk**: Generic 58mm and 80mm thermal receipt printers lack Arabic codepages or reverse Arabic letters left-to-right (`م ر ح ب ا`) with broken glyph connections.
* **Architecture**:
  * **Pure-Rust Text Shaping**: `rustybuzz` (complete Rust implementation of HarfBuzz) shapes Arabic Unicode codepoints into contextually connected glyphs (Isolated, Initial, Medial, Final) and `Lam-Alef` ligatures.
  * **BiDi Reordering**: `unicode-bidi` applies the Unicode Bidirectional Algorithm (UAX #9) to properly align mixed Arabic right-to-left text and Latin left-to-right prices (`15.00 MAD`).
  * **TrueType Outline Rasterizer**: `ab_glyph` renders shaped characters using embedded SIL OFL Noto Sans Arabic fonts into a crisp 1-bit monochrome bitmap (`GrayImage`, 384px for 58mm, 576px for 80mm).
  * **Banded `GS v 0` Commands**: The bitmap encodes into 128-row ESC/POS `GS v 0` (`0x1D 0x76 0x30`) raster bit-image bands and transmits over Windows Print Spooler (RAW), TCP socket (`tcp://<ip>:9100`), or serial paths (`COM3`).

### 6. Payment Fragmentation Risk → Hyperswitch (VPS) Multi-Gateway Router
* **Risk**: Managing fragmented Moroccan payment gateways (YouCanPay for local CMI, MAD, CashPlus) and international gateways (Paddle for USD/EUR subscriptions) directly inside frontend checkouts leads to duplicated webhook handling and fragile failovers.
* **Architecture**:
  * **Unified Hyperswitch Gateway**: Hosted on Oracle Cloud VPS on port `8080`.
  * **Smart Currency Routing**: Payment intents in `MAD` route automatically to YouCanPay; payment intents in `USD`/`EUR` route to Paddle.
  * **Idempotent Webhooks**: `/api/webhooks/hyperswitch` verifies HMAC-SHA512 signatures (`x-webhook-signature-512`) and updates tenant subscription state through a centralized `WebhookEvent` table.

### 7. Multi-Tenant Data Leak Risk → PostgreSQL Engine RLS + `prismaRlsExtension`
* **Risk**: In a shared multi-tenant database serving 100,000+ merchants, a single omitted `where: { tenantId }` in application code could leak sensitive commercial data to another shop.
* **Architecture**:
  * **Engine-Level Row Security**: Every tenant table has `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` with:
    ```sql
    CREATE POLICY tenant_isolation_policy ON <table> FOR ALL
    USING (NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL OR tenant_id::text = current_setting('app.current_tenant_id', true));
    ```
  * **Context Propagation**: Request authentication binds `tenantId` into Node's `AsyncLocalStorage`. The global `prismaRlsExtension` intercepts queries and sets `SELECT set_config('app.current_tenant_id', ${tenantId}, true)` within the active transaction scope.

---

## 4. Cash Flow Protection & Anti-Abuse Controls

To protect the platform owner from unexpected infrastructure costs or abuse by heavy users while scaling on free/low-cost tiers:

### 1. Strict AI Usage Quotas (30 Messages / Day per Tenant)
* **Daily Quota Ceiling**: Each merchant tenant receives an allowance of **30 AI chat/assistant queries per calendar day** powered by the platform owner's free-tier Google Gemini 2.5 Flash / Groq pool.
* **Graceful Degradation & BYOK (Bring Your Own Key)**: Once 30 daily messages are exhausted, the AI chat does not crash; instead, it prompts the merchant:
  * *"Daily AI quota reached (30/30). Upgrade to KASPI Pro or enter your own free Google Gemini API key in Settings → AI to continue."*
* **Tenant BYOK Override**: If a merchant provides their own API key (`SystemSetting` / `TenantSettings`), queries route through the merchant's key, incurring zero API cost for the platform owner.

### 2. Catalog Import Rate Limiting (3 CSV Imports / Month per Tenant)
* **Monthly Cap**: Each merchant is limited to **3 CSV catalog imports per calendar month** (maximum 10,000 rows per import).
* **Prevention of Compute Saturation**: Prevents malicious or misconfigured scripts from spamming the background Trigger.dev worker or overwhelming database write bandwidth.
* **Enforcement**: Checked synchronously at `POST /api/products/import` before scheduling background jobs.

### 3. Usage & Capacity Alerts (80% Safety Threshold)
* **Vercel Serverless Invocation Alerts**: Automated metrics track daily edge function execution volume. If consumption exceeds **80% of Vercel monthly allocations**, an automated WhatsApp and e-mail alert notifies the platform owner (`ADMIN_WHATSAPP_NUMBER`).
* **Neon Storage & Compute Quota Monitoring**: When database size reaches **80% of Neon free tier capacity (0.4 GB / 0.5 GB)**, the system flags proactive alerts to enable read replicas or migrate heavy historic tables to cold storage on Cloudflare R2.

---

## 5. Deployment Strategy: Vercel to Oracle VPS Communication

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Merchant Terminal
    participant Vercel as Vercel Edge API (kaspi-pos.vercel.app)
    participant Caddy as VPS Caddy Proxy (TLS 443)
    participant Supavisor as Supavisor Pooler (:6543)
    participant Trigger as Trigger.dev Supervisor (:8030)
    participant Hyper as Hyperswitch Router (:8080)
    participant Neon as Neon PostgreSQL 16

    Note over Vercel,OracleVPS: Secure Communication via Public VPS Endpoints with TLS & API Keys
    Merchant->>Vercel: POST /api/v1/invoices (Create Invoice)
    Vercel->>Supavisor: Transactional Query via DATABASE_URL (:6543)
    Supavisor->>Neon: Multiplexed Connection (SELECT ... FOR UPDATE)
    Neon-->>Vercel: Verified Invoice Sequence & Record
    Vercel-->>Merchant: 201 Created (FAC-2026-000001)

    Merchant->>Vercel: POST /api/products/import (10,000 Row CSV)
    Vercel->>Caddy: HTTPS POST https://trigger.your-vps.com/api/v1/tasks/import-csv
    Caddy->>Trigger: Internal Forward (Port 8030)
    Vercel-->>Merchant: 202 Accepted (Background Job Queued)

    Merchant->>Vercel: POST /api/payments/hyperswitch (Checkout)
    Vercel->>Caddy: HTTPS POST https://pay.your-vps.com/payments
    Caddy->>Hyper: Internal Forward (Port 8080)
    Hyper-->>Vercel: Client Secret & Routed Connector
    Vercel-->>Merchant: Unified Payment Intent
```

1. **DNS & Networking**:
   - The Oracle Cloud VPS runs a single public IP with DNS records:
     - `trigger.your-domain.com` → VPS Public IP
     - `pay.your-domain.com` → VPS Public IP
   - Caddy automatically provisions and renews Let's Encrypt SSL/TLS certificates for both subdomains.
2. **Environment Secret Binding**:
   - Vercel connects to Supavisor via `DATABASE_URL="postgresql://user.kaspi:pass@<VPS_IP>:6543/neondb?pgbouncer=true&connection_limit=1"`.
   - Vercel triggers background jobs via `TRIGGER_API_URL="https://trigger.your-domain.com"` authenticated by `TRIGGER_SECRET_KEY`.
   - Vercel coordinates checkouts via `HYPERSWITCH_API_URL="https://pay.your-domain.com"` authenticated by `HYPERSWITCH_API_KEY`.
3. **Fail-Safe Fallbacks**:
   - If the VPS is temporarily unreachable, the Next.js API automatically routes local MAD checkouts directly to YouCanPay, international checkouts to Paddle, and executes background CSV preview parsing in-process.
