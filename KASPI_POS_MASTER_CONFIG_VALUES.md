# KASPI POS (ZUVYR PLATFORM) — MASTER CONFIGURATION & INFRASTRUCTURE REFERENCE

> **Document Version:** Production Release `v1.0.0-omega`  
> **Platform Standard:** `https://kaspi-pos.vercel.app` / `https://kaspi-izn24nqt8-rox-ai.vercel.app/en`  
> **Architecture:** Hybrid Cloud-Edge SaaS (Next.js 15 App Router + Tauri v2 Rust Desktop + Neon Serverless PostgreSQL + Supabase Global Sync + Dexie.js Offline Engine)

---

## 1. Core Cloud & API Endpoints

| Service / Layer | Production Endpoint / Value | Purpose |
| :--- | :--- | :--- |
| **Primary Cloud Production URL** | `https://kaspi-pos.vercel.app` | Canonical web application & API host |
| **Desktop Static Cloud API Base** | `https://kaspi-pos.vercel.app/api/v1` | Bound in `src/client/sync-engine.ts` (`PRODUCTION_CLOUD_ORIGIN`) & `src-tauri/tauri.conf.json` |
| **Tauri Desktop Auto-Updater** | `https://kaspi-pos.vercel.app/api/updates/latest.json` | Ed25519 signed release manifest for Windows/Linux/macOS desktop updates |
| **Public Auth & OTP Endpoints** | `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/email-otp/send`, `/api/v1/auth/email-otp/verify`, `/api/v1/auth/reset-password` | Whitelisted in `src/middleware.ts` (`PUBLIC_API_PATHS`) |
| **Dynamic Onboarding Endpoint** | `/api/v1/onboarding/setup` | Configures industry workspace (`grocery`, `restaurant`, `fashion`, `electronics`) & starter catalog |
| **Restaurant KDS & Tables API** | `/api/v1/kds` | Real-time Kitchen Display System (`new` → `preparing` → `ready` → `served`) & `DiningTable` grid |
| **Cash Shift & X/Z Reports API** | `/api/v1/cash-sessions`, `/api/v1/cash-sessions/[id]/movements`, `/api/v1/cash-sessions/[id]/close` | Fond de Caisse, Cash-In/Out, and atomic X/Z financial closing |

---

## 2. Environment Variables & Infrastructure Keys (`.env` / Vercel Production)

Configure the following environment variables in **Vercel Project Settings → Environment Variables** and local `.env`:

```env
# ============================================================================
# 1. PRIMARY TRANSACTIONAL DATABASE (NEON SERVERLESS POSTGRESQL + PRISMA)
# ============================================================================
# Pooled connection string (PgBouncer) for high-concurrency serverless routes:
DATABASE_URL="postgresql://<NEON_USER>:<NEON_PASSWORD>@<NEON_ENDPOINT>-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"

# Direct connection string for Prisma schema migrations:
DIRECT_URL="postgresql://<NEON_USER>:<NEON_PASSWORD>@<NEON_ENDPOINT>.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# ============================================================================
# 2. SUPABASE GLOBAL USER DIRECTORY & REAL-TIME SYNC
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL="https://ffmtxefzbalymfnhjytb.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<SUPABASE_ANON_PUBLIC_JWT>"
SUPABASE_SERVICE_ROLE_KEY="<SUPABASE_SERVICE_ROLE_SECRET_JWT>"

# ============================================================================
# 3. OFFICIAL GMAIL SMTP TRANSPORTER (NODEMAILER SSL PORT 465 / TLS 587)
# ============================================================================
GMAIL_USER="kaspipos.official@gmail.com"
GMAIL_APP_PASSWORD="<16_CHAR_GOOGLE_APP_PASSWORD>"
SMTP_FROM="KASPI POS <kaspipos.official@gmail.com>"

# ============================================================================
# 4. APPLICATION URLS & SECURITY SECRETS
# ============================================================================
NEXT_PUBLIC_APP_URL="https://kaspi-pos.vercel.app"
JWT_SECRET="<64_CHAR_HEX_HMAC_SHA256_SECRET>"
ADMIN_BROADCAST_SECRET="<ADMIN_BROADCAST_TOKEN>"

# ============================================================================
# 5. AI ASSISTANT ("مساعد كسب الذكي") — MULTI-PROVIDER LLM ROUTER
# ============================================================================
GROQ_API_KEY="<GROQ_API_KEY>"
GEMINI_API_KEY="<GEMINI_API_KEY>"
OPENROUTER_API_KEY="<OPENROUTER_API_KEY>"
```

---

## 3. Database & Multi-Tenant Persistence Architecture

1. **Primary Transactional Engine (`prisma/schema.prisma`):**
   - **Core Entities:** `Tenant`, `TenantSettings`, `Store`, `User`, `UserTenantMembership`, `Category`, `Product`, `StockLevel`, `StockMovement`, `Customer`, `LoyaltyPoint`, `Supplier`, `PurchaseOrder`, `Sale`, `SaleItem`, `SalePayment`, `CashSession`, `CashMovement`, `CreditLedgerEntry`, `DiningTable`, `KitchenTicket`, `KitchenTicketItem`, `IdempotencyRecord`, `AuditLog`.
   - **Financial Precision:** All monetary columns use `Decimal(12, 2)` in PostgreSQL and `decimal.js` (`src/domain/money.ts`) in TypeScript with `ROUND_HALF_UP` to guarantee `0.00` floating-point drift.
2. **Zero-Migration Workspace & Printer Studio Persistence (`prisma.idempotencyRecord`):**
   - `scope: "printer_studio", key: "thermal_receipt_config"` → Persists 6-language thermal receipt configuration (`ar`, `fr`, `en`, `tr`, `es`, `de`), paper width (`80mm` / `58mm`), ESC/POS IP/USB connection mode, and custom headers/footers.
   - `scope: "workspace_config", key: "store_profile"` → Persists dynamic industry mode (`grocery` | `restaurant` | `fashion` | `electronics`), `onboardingCompleted`, and specialized module toggles.
3. **Offline-First Client Storage (`src/client/db.ts` & `src/client/sync-engine.ts`):**
   - IndexedDB via **Dexie.js** (`kasbi_pos_offline_db`) stores `offlineProducts`, `offlineCustomers`, `offlineSales`, `offlineHeldCarts`, and `syncQueue`.
   - Automatic background outbox synchronization with exponential backoff (`2000ms * 2^attempt`, max `60000ms`) and idempotency keys (`sale_<UUID>`).

---

## 4. Thermal Printing & Hardware Configuration (`src-tauri` + Web)

| Parameter | Supported Values | Default |
| :--- | :--- | :--- |
| **Supported Languages** | `ar` (Arabic), `fr` (French), `en` (English), `tr` (Turkish), `es` (Spanish), `de` (German) | `fr` / `ar` |
| **Numeral Formatting** | Forced Western Arabic numerals (`0123456789`) across all 6 locales via `toWesternNumerals()` | Enabled (`100%`) |
| **Paper Roll Widths** | `80mm` (Standard Thermal) / `58mm` (Compact Mobile/TPE) / `40x30mm` (Barcode Stickers) | `80mm` |
| **Hardware Transports** | Raw TCP/IP Socket (`Port 9100`), USB/Serial (`COM` / `/dev/ttyUSB*`, `/dev/usb/lp*`), Browser `window.print()` fallback | `auto` |
| **Cash Drawer Kick** | Standard ESC/POS RJ11/RJ12 pulse `0x1B 0x70 0x00 0x19 0xFA` | Enabled (`openDrawer: true`) |
