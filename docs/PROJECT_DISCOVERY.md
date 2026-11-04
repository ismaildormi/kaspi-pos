# KASPI POS (كسب) — Complete Project Discovery Document

**Classification Date:** 2026-11-04  
**Audit Scope:** Full codebase audit covering frontend, backend, database schema, desktop Tauri layer, printing, payments, AI, and deployment infrastructure.

---

## 1. Executive Summary

KASPI POS is a multi-tenant Point of Sale (POS) and Enterprise Resource Planning (ERP) SaaS platform tailored for the Moroccan retail, café, restaurant, and supermarket sectors, designed with zero-infrastructure-cost architecture (Neon PostgreSQL serverless, Vercel Edge/Serverless, Supabase Realtime & Storage, Cloudflare R2, and client-side Dexie.js offline caching).

The platform features:
- Multi-tenant architecture isolated at both database and application levels.
- Full offline-first checkout engine with IndexedDB/Dexie.js outbox synchronization.
- Real-time Kitchen Display System (KDS) powered by Supabase WebSockets.
- Concurrency-safe DGI-compliant invoice numbering with PostgreSQL pessimistic locking (`SELECT ... FOR UPDATE`).
- Moroccan 4-tier payment fee engine with dynamic 70/30 fee splitting for physical CMI / TPE terminals.
- Desktop application built with Tauri v2 (Rust) providing low-level hardware USB/Serial ESC/POS thermal printing with Arabic RTL shaping via `rustybuzz` and `unicode-bidi`.
- Dual-role AI assistant restricted specifically to retail analytics and POS operations.

---

## 2. Repository Structure & Module Breakdown

```
pos-saas-morocco/
├── .github/workflows/          # CI/CD: Automated Windows .exe release build workflow
├── deploy/                     # Docker & deployment manifests
├── docs/                       # Technical architecture, requirements, and runbooks
├── prisma/                     # Prisma ORM schema (54 models) and migrations
├── public/                     # Static assets, logos, and receipt templates
├── scripts/                    # Maintenance & administrative scripts (seed-admin, etc.)
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── [locale]/           # Internationalized routes (ar, fr, en)
│   │   │   ├── (auth)/         # Login, Register
│   │   │   ├── admin/          # Super Admin Owner Studio
│   │   │   ├── dashboard/      # Merchant Back-Office (Products, Inventory, KDS, etc.)
│   │   │   ├── download/       # Windows / PWA client distribution portal
│   │   │   └── pos/            # Fullscreen High-Performance POS Terminal
│   │   └── api/                # REST API routes (v1 endpoints, webhooks, uploads)
│   ├── client/                 # Browser & offline state management (Dexie, Zustand)
│   ├── components/             # Reusable UI component library (Tailwind CSS v4)
│   ├── domain/                 # Financial arithmetic, money rounding, tax logic
│   ├── hooks/                  # Custom React hooks (app updater, shortcuts)
│   ├── i18n/                   # Next-intl routing and request configuration
│   ├── lib/                    # Shared libraries (fees, payments, Supabase, AI router)
│   └── server/                 # Backend services, database context, RLS, auth
└── src-tauri/                  # Tauri v2 Desktop Engine (Rust)
    ├── src/
    │   ├── main.rs             # Tauri command handlers & IPC entrypoint
    │   ├── printer.rs          # ESC/POS raster printer with Arabic text shaping
    │   ├── tpe_bridge.rs       # CMI / TPE electronic payment terminal bridge
    │   └── local_ai.rs         # Offline WebGPU / ONNX AI capabilities
    └── tauri.conf.json         # Desktop app configuration & window lifecycle
```

---

## 3. Technology Stack Inventory

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js App Router | 15.5.28 | Unified React Server Components & API |
| **Frontend UI** | React / Tailwind CSS | 19.3.1 / 4.3.3 | Responsive Dark-First 2027 Design System |
| **Icons & Charts** | Lucide React / Recharts | 1.64.0 / 3.10.1 | Visual iconography & financial analytics |
| **Database ORM** | Prisma | 6.19.3 | Schema management, migrations, typed client |
| **Primary Database** | Neon PostgreSQL | Serverless v16 | Scalable multi-tenant SQL store |
| **Client Storage** | Dexie.js (IndexedDB) | 4.4.7 | Offline cart, offline catalog & sync outbox |
| **Realtime Engine** | Supabase JS | 2.49.1 | WebSocket Realtime broadcast for KDS & POS |
| **Object Storage** | Supabase & Cloudflare R2 | S3-compatible | Product imagery & receipt document archiving |
| **Authentication** | NextAuth.js / Argon2 | 5.0.0-beta.32 / 2.2.2 | JWT sessions (30-day persistence) & hashing |
| **Desktop Shell** | Tauri v2 (Rust) | 2.0.0 | Native Windows installer, hardware printer & TPE |
| **Printing Engine** | Rustybuzz + Unicode-Bidi | 0.14 / 0.3 | Arabic glyph shaping & BiDi raster rendering |
| **Background Jobs** | Trigger.dev v3 | 3.3.17 | Asynchronous CSV catalog imports & sync |

---

## 4. Discovered Security & Architectural Boundaries

1. **Multi-Tenant Context Scope:** Enforced via `AsyncLocalStorage` in `src/server/db/rls.ts` and `src/server/auth/context.ts`. All queries require a validated `tenantId`.
2. **Server-Client Boundary:** Isolated `src/lib/supabase.ts` (server-only secrets with lazy initialization) and `src/lib/supabase-client.ts` (browser-safe anon keys) preventing environment variable leaks during static build evaluation.
3. **Pessimistic Locking on Sequences:** `src/server/db/invoice-sequence.ts` executes `SELECT ... FOR UPDATE` within PostgreSQL transactions to eliminate race conditions in consecutive receipt generation.
4. **Offline Resilience:** POS transactions can complete 100% offline; queued operations are stored in Dexie outbox with UUID idempotency keys and synced automatically upon reconnection.
