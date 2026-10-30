# SECURITY MODEL & TENANT ISOLATION ARCHITECTURE

> **Document Version:** 1.0.0  
> **Classification:** Platform Core Architecture  
> **Last Updated:** 2026-10-30

---

## 1. Multi-Tenant Isolation (Strict Non-Negotiable Boundary)

Kasbi POS SaaS operates on a **Single Database, Row-Level Tenant Isolation** model:
1. Every business and fiscal relation has a non-nullable `tenant_id UUID`.
2. Every business entity primary or composite unique key includes `tenantId`:
   - `@@unique([tenantId, id])`
   - Composite foreign keys: `[tenantId, foreignId] REFERENCES [tenantId, id]`
3. Regular application routes (`/api/v1/*`) **NEVER** accept `tenant_id` from client payloads. The `tenantId` is resolved strictly server-side by `getRequestContext()` from the authenticated user's active membership.
4. Cross-tenant leakage is a **RELEASE-BLOCKING defect**.

---

## 2. Platform Owner (Super Admin) Isolation Boundary

The SaaS platform owner requires cross-tenant oversight (monitoring onboarding, active subscriptions, MRR, platform health), while shop owners and staff must never see other tenants' data.

### 2.1 The `isSuperAdmin` Privilege
- Added to the `User` model: `isSuperAdmin Boolean @default(false) @map("is_super_admin")`.
- Default is strictly `false`.
- Only platform owners can have `isSuperAdmin: true`.

### 2.2 Route & API Boundary Isolation
- Super Admin capabilities are strictly restricted to the `/admin` path and `/api/admin/*` routes.
- **Middleware Guard:**
  - `src/middleware.ts` intercepts `/admin` and `/api/admin/*`.
  - Unauthenticated requests are rejected (401 JSON for APIs, redirect to `/ar/login?from=/admin` for UI).
- **Server-Side Enforcement (`src/server/admin/guard.ts`):**
  - All admin server components and API routes call `getSuperAdminUser()`.
  - Verifies session token in the database.
  - If `user.isSuperAdmin !== true`, immediately halts with `403 FORBIDDEN`.
- **Zero Tenant Pollution:**
  - Even if a Super Admin is logged in, when they navigate to `/pos` or `/products`, the system switches to normal tenant context (`getRequestContext()`). The Super Admin cannot interact with shop data unless they are an explicit member of that shop.

---

## 3. Financial & Data Integrity Controls
- Zero `Float` policy: All currency is stored as `DECIMAL(12,2)` and manipulated using `decimal.js` with `ROUND_HALF_UP`.
- Quantities are stored as `DECIMAL(12,3)` for weighted products.
- Moroccan Tax compliance: ICE, Identifiant Fiscal, and Registre de Commerce are snapshotted on invoices and cannot be mutated retroactively.
- Append-only financial ledgers: `inventory_movements`, `customer_credits`, and `loyalty_points` cannot be updated or deleted.

---

## 4. External AI Assistant (NEVEA) API Bridge (Phase 5 — Deferred)
- NEVEA will serve as an autonomous platform supervisor.
- All AI assistant communication will occur through isolated `/api/v1/integrations/nevea/*` endpoints protected by HMAC SHA-256 signatures and scoped platform tokens.
- Deferment: Execution scheduled for Phase 5 to avoid premature integration while NEVEA is under active external development.
