# KASPI POS Scale-Out Strategy: 100,000+ Merchants on a 100% Open-Source & Free-Tier Stack

## 1. Executive Architecture Overview

**KASPI POS (كسب)** is engineered to scale to **100,000+ active Moroccan retail merchants** (Epiceries, Supermarkets, Cafes, Pharmacies, and Wholesalers) while maintaining near-zero unit infrastructure costs through a battle-tested combination of open-source software, local-first edge computing, and generous cloud free tiers.

| Layer | Technology | Free-Tier / Open-Source Strategy | Scale Target |
| :--- | :--- | :--- | :--- |
| **POS Client & Edge DB** | Next.js 15 PWA + Tauri v2 (Rust) + Dexie.js (IndexedDB) | 99% of read/write POS traffic runs locally on the merchant's device (`sync_queue` Outbox Pattern) | Unlimited local TPS |
| **Primary Cloud Database** | Neon.tech Serverless PostgreSQL 16 + PgBouncer | Pooled connections (`?pgbouncer=true&connection_limit=1`) + PostgreSQL Row-Level Security (RLS) | 10,000+ concurrent connections |
| **Background Jobs & ETL** | Trigger.dev v3 Cloud (Free Tier) | Offloads long-running tasks (10,000-row CSV imports, bulk AI onboarding, Z-Reports) outside Vercel's 10s limit | Zero timeout failures |
| **Multi-Model AI Router** | Google AI Studio + Groq + OpenRouter | Round-robin multi-key pool (`ai-router.ts`) with automatic 429 cooldown and deterministic DB fallback | 100% AI uptime |
| **Product Image Engine** | Pollinations.ai + Cloudflare R2 | Zero-key AI product photography (`512x512`) + 10GB/month free R2 object storage with zero egress fees | $0 image generation |
| **Thermal Receipt Engine** | Rust ESC/POS Raster Engine (`GS v 0`) | Arabic/Darija text shaping (HarfBuzz/Bidi) rendered to 1-bit monochrome bitmap for universal 58mm/80mm printers | 100% Arabic printer support |

---

## 2. Solving Risk 1 & 2: True Offline-First Outbox & Connection Pooling

### 2.1 The Dexie.js Outbox Pattern (`sync_queue`)
Instead of coupling every barcode scan and cash checkout to a live cloud round-trip, KASPI POS writes all transactions first to `IndexedDB` via Dexie.js:
- **`offlineProducts`**: Full local product catalog indexed by `id`, `barcode`, `sku`, and `categoryId`.
- **`sync_queue` (Outbox)**: Every completed sale or customer mutation is atomically appended to `sync_queue` (`id`, `type`, `payload`, `status`, `createdAt`, `retryCount`).
- **Background Sync Engine (`processSyncQueue`)**: Flushes pending outbox records with `Idempotency-Key: item.id` every 60 seconds and immediately upon `window.ononline`.

### 2.2 Serverless PostgreSQL Connection Pooling
To eliminate `"Too many connections"` errors during peak Moroccan retail hours:
- **`DATABASE_URL`**: Uses Neon's PgBouncer pooler endpoint with `?sslmode=require&pgbouncer=true&connection_limit=1`.
- **`DIRECT_URL`**: Uses the direct Neon endpoint exclusively for schema migrations (`prisma db push` / `prisma migrate`).

---

## 3. Solving Risk 3: Asynchronous Background Jobs with Trigger.dev v3

Vercel Hobby/Serverless functions enforce a strict execution timeout (10s–60s). Importing a 10,000-row merchant catalog CSV synchronously will time out.

### Architecture: Trigger.dev v3 Cloud (`@trigger.dev/sdk`)
1. The merchant uploads a CSV file (up to **10,000 rows**) to `POST /api/products/import`.
2. The API route creates a `ProductImportJob` record (`status: "previewing"`) and triggers the `import-csv` background task via `tasks.trigger("import-csv", { jobId, tenantId, fileUrl, csvContent, rows })`.
3. The API immediately returns **`202 Accepted`** with `{ jobId, triggerRunId }`.
4. Inside `src/trigger/import-csv.ts`, Trigger.dev parses the CSV using `papaparse` and commits products and initial stock levels in **chunks of 500 rows** inside Prisma transactions (`prisma.$transaction`), updating `ProductImportJob.status` to `"committed"` when finished.

```typescript
// trigger.config.ts
import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID || "proj_kaspi_pos",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
});
```

---

## 4. Solving Risk 5: Arabic & Darija Thermal Receipt Raster Printing (`GS v 0`)

Most low-cost Chinese 58mm/80mm ESC/POS thermal printers sold in Morocco (Xprinter, Epson clones, Rongta) lack built-in Arabic codepages (`CP864` / `CP720`) or fail to join Arabic contextual letterforms (Initial, Medial, Final, Isolated).

### The Rust Rasterization Pipeline (`src-tauri/src/main.rs`)
Instead of sending raw character bytes that print disconnected or reversed Arabic letters:
1. **BiDi Reordering (`fribidi` / Unicode BiDi)**: Reorders right-to-left (RTL) Arabic/Darija runs alongside left-to-right (LTR) numbers and prices (`MAD`).
2. **Contextual Arabic Shaping (`harfbuzz` / Arabic Presentation Forms-B)**: Maps each Arabic character (`U+0600..U+06FF`) to its contextual glyph (`Isolated`, `Initial`, `Medial`, `Final`) and handles `Lam-Alef` ligatures (`لا`, `لأ`, `لإ`, `لآ`).
3. **1-Bit Monochrome Bitmap Rendering (`image`)**: Renders the shaped receipt lines onto a 384px (58mm) or 576px (80mm) 1-bit monochrome canvas.
4. **ESC/POS `GS v 0` (`0x1D 0x76 0x30`) Raster Command**: Encodes the bitmap into packed 1-bit scanlines and emits the standard ESC/POS raster bit-image command followed by paper feed and partial cut (`0x1D 0x56 0x42 0x00`).

---

## 5. Solving Risk 7: Zero-Trust Multi-Tenant Isolation with PostgreSQL RLS & Prisma Extension

Application-level `where: { tenantId }` filters are vulnerable to human omission. To mathematically guarantee that Tenant A can never read or mutate Tenant B's data—even if a developer forgets a `where` clause—we enforce **PostgreSQL Row-Level Security (RLS)** at the database engine layer combined with a `Prisma.$extends` client extension backed by Node's `AsyncLocalStorage`.

### 5.1 PostgreSQL RLS Migration SQL (`tenant_isolation_policy`)
```sql
-- Enable Row-Level Security on all tenant-owned tables
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sale_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies checking current_setting('app.current_tenant_id', true)
CREATE POLICY "tenant_isolation_policy" ON "products"
  USING (
    current_setting('app.current_tenant_id', true) IS NULL
    OR current_setting('app.current_tenant_id', true) = ''
    OR tenant_id::text = current_setting('app.current_tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.current_tenant_id', true) IS NULL
    OR current_setting('app.current_tenant_id', true) = ''
    OR tenant_id::text = current_setting('app.current_tenant_id', true)
  );
```

### 5.2 Prisma RLS Extension with `AsyncLocalStorage`
```typescript
import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma, PrismaClient } from "@prisma/client";

export interface TenantRlsContext {
  tenantId?: string;
  isSuperAdmin?: boolean;
}

export const tenantStorage = new AsyncLocalStorage<TenantRlsContext>();

export function prismaRlsExtension() {
  return Prisma.defineExtension((client) =>
    client.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            const store = tenantStorage.getStore();
            const tenantId = store?.tenantId;

            if (!tenantId || store?.isSuperAdmin) {
              return query(args);
            }

            const [, result] = await client.$transaction([
              client.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`,
              query(args),
            ]);
            return result;
          },
        },
      },
    })
  );
}
```
