# KASPI GLOBAL INFRASTRUCTURE BLUEPRINT
**Document Version:** 2.0.0
**Target Architecture:** Multi-Cloud Global Resource Fabric & Edge Runtime

---

## 1. Global Topology & Network Architecture

```mermaid
graph TD
    subgraph Edge Layer (Global Anycast & Local Stores)
        MerchantPOS[Local Physical POS Terminal - Casablanca/Rabat]
        WebClient[Web Cashier / PWA Browser]
        CloudflareEdge[Cloudflare 330+ Anycast Edge PoPs]
    end

    subgraph Application & Compute Plane
        VercelFrontend[Vercel Serverless & Edge App Router - Paris]
        WorkerCluster[Discovered Background Workers - OCI / Hetzner]
        AIOrchestrator[Multi-Gateway AI Router - Gemini / Groq LPU]
    end

    subgraph Data & Storage Plane
        NeonDB[(Neon Serverless PostgreSQL 16 - Frankfurt)]
        SupabaseStorage[(Supabase Product S3 Storage - Frankfurt)]
        CloudflareR2[(Cloudflare R2 Encrypted Backup Cold Storage)]
    end

    MerchantPOS -->|Local IPC & ESC/POS| PhysicalPrinter[Thermal Receipt Printer]
    MerchantPOS -->|Direct USB/Serial| PhysicalTPE[CMI Electronic Card Terminal]
    MerchantPOS -->|Offline IndexedDB Sync| CloudflareEdge
    WebClient --> CloudflareEdge
    CloudflareEdge --> VercelFrontend
    VercelFrontend --> NeonDB
    VercelFrontend --> SupabaseStorage
    VercelFrontend --> AIOrchestrator
    VercelFrontend -->|Client-Side AES-256 Backups| CloudflareR2
    VercelFrontend -->|Async Batch Jobs| WorkerCluster
```

---

## 2. Separation of Planes

### 2.1 Global Control Plane
- **Authentication & Multi-Tenant Registry:** Managed via NextAuth v5 session tokens and PostgreSQL memberships.
- **Tenant Quota Enforcement:** Real-time quota check in `prisma/schema.prisma` (`ai_messages_used_today`, `csv_imports_used_this_month`).
- **Owner Studio (`/admin`):** Global metrics, MRR calculation, BYOK configuration, and tenant telemetry.

### 2.2 Regional Data Plane
- **In-Store Checkout Execution:** Runs 100% locally on desktop or browser edge via Dexie.js offline outbox.
- **DGI Sequential Invoice Numbering:** Synchronously coordinated with `SELECT next_val FROM invoice_sequences WHERE tenant_id = $1 FOR UPDATE`.
- **Media Delivery:** Cached at Cloudflare edge PoPs (Casablanca, Madrid, Paris) with sub-15ms response times.
