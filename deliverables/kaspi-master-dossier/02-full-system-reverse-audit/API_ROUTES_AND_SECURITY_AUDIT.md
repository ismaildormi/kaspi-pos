# KASPI POS (كسب) — Complete API Route Directory & Security Architecture Audit

**Document Version:** 2.4.0  
**Classification:** DevSecOps, API Reference & Cryptographic Security Specification  
**Audit Scope:** All 80+ Server Endpoints under `src/app/api/`

---

## 1. Security Architecture Principles

All KASPI POS application programming interfaces (APIs) are implemented under the principle of **Zero Trust, Cryptographic Auditability, and Strict Multi-Tenant Isolation**:

1. **Mandatory Tenant Scoping:** Every authenticated request extracts the caller's verified `tenantId` and `storeId` directly from the cryptographically signed JWT session (`jose`) or hashed API key. Client-provided tenant overrides are strictly rejected.
2. **Parameterized Data Access:** All database queries utilize Prisma ORM with prepared parameter binding, eliminating SQL injection vectors.
3. **Constant-Time Verification:** Webhook signatures from Stripe, PayZone, and CMI are validated using `crypto.timingSafeEqual` to prevent timing side-channel attacks.
4. **Token Bucket Rate Limiting:** Applied globally via Redis to prevent brute-force attacks on PIN logins, barcode lookups, and payment callbacks.

---

## 2. Exhaustive API Route Catalog

### Group 1: Core Authentication & Staff Access (`src/app/api/auth/` & `src/app/api/v1/auth/`)
| HTTP Method | Route Path | Auth Requirement | RBAC Scope | Primary Function |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public (Rate Limited) | Anonymous | Authenticates staff email/password or PIN; sets HTTP-only secure cookie |
| `POST` | `/api/v1/auth/register` | Public (Rate Limited) | Anonymous | Onboards new store tenant, creates owner user and default store branch |
| `POST` | `/api/v1/auth/logout` | Session Cookie | All Roles | Revokes active session token and clears browser cookies |
| `POST` | `/api/v1/auth/pin-login` | Public (Terminal Scoped) | Cashier+ | Fast cashier switching via 4-to-6 digit numeric PIN code |
| `GET` | `/api/v1/me` | Session Cookie | All Roles | Resolves current authenticated user, tenant metadata, and store assignments |
| `POST` | `/api/v1/auth/forgot-password` | Public | Anonymous | Generates time-limited cryptographic password reset token |
| `POST` | `/api/v1/auth/reset-password` | Public | Token Bearer | Updates password hash upon verified reset token submission |

### Group 2: Product Catalog & Category Management (`src/app/api/v1/products/` & `categories/`)
| HTTP Method | Route Path | Auth Requirement | RBAC Scope | Primary Function |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products` | Session / API Key | Cashier+ | Lists active products, stock levels, barcodes, and prices for POS |
| `POST` | `/api/v1/products` | Session / API Key | Manager+ | Creates new product SKU with category, tax, unit, and image URL |
| `GET` | `/api/v1/products/[id]` | Session / API Key | Cashier+ | Retrieves detailed SKU metadata, stock movements, and price tiers |
| `PATCH` | `/api/v1/products/[id]` | Session / API Key | Manager+ | Updates product name, sale price, cost, barcode, or category |
| `DELETE` | `/api/v1/products/[id]` | Session / API Key | Owner | Soft-deletes product from active catalog |
| `GET` | `/api/v1/categories` | Session / API Key | Cashier+ | Retrieves hierarchical category tree |
| `POST` | `/api/v1/categories` | Session / API Key | Manager+ | Creates new product category |
| `PATCH` | `/api/v1/categories/[id]` | Session / API Key | Manager+ | Renames or re-orders category hierarchy |

### Group 3: Sales, Checkout & Cash Shifts (`src/app/api/v1/sales/` & `shifts/`)
| HTTP Method | Route Path | Auth Requirement | RBAC Scope | Primary Function |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sales` | Session / API Key | Cashier+ | Commits retail sale, decrements stock, issues sequential ticket, updates streak |
| `GET` | `/api/v1/sales` | Session / API Key | Manager+ | Query sales history with filters by date, cashier, payment method, or store |
| `GET` | `/api/v1/sales/[id]` | Session / API Key | Cashier+ | Retrieves complete sale receipt detail and payment breakdown |
| `POST` | `/api/v1/sales/[id]/refund`| Session / API Key | Manager+ | Processes partial or full ticket return, restores stock, logs refund |
| `POST` | `/api/v1/shifts/open` | Session / API Key | Cashier+ | Opens cash register shift with starting float amount |
| `POST` | `/api/v1/shifts/close` | Session / API Key | Cashier+ | Closes shift, records actual cash count, calculates discrepancy |
| `GET` | `/api/v1/shifts/current` | Session / API Key | Cashier+ | Fetches active shift status and real-time cash balance |
| `POST` | `/api/v1/shifts/movement` | Session / API Key | Manager+ | Records cash drop (Pay-Out) or float addition (Pay-In) |

### Group 4: Inventory, Suppliers & OCR (`src/app/api/v1/inventory/`)
| HTTP Method | Route Path | Auth Requirement | RBAC Scope | Primary Function |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/inventory` | Session / API Key | Manager+ | Real-time multi-branch stock levels and low-stock warnings |
| `POST` | `/api/v1/inventory/adjust`| Session / API Key | Manager+ | Manual inventory adjustment with mandatory audit reason |
| `POST` | `/api/v1/inventory/ocr` | Session / API Key | Manager+ | Multi-modal AI OCR parsing supplier paper invoices into line items |
| `GET` | `/api/v1/inventory/suppliers`| Session / API Key | Manager+ | Lists vendor contacts, commercial terms, and ICE numbers |
| `POST` | `/api/v1/inventory/suppliers`| Session / API Key | Manager+ | Registers new commercial wholesale supplier |
| `POST` | `/api/v1/inventory/po` | Session / API Key | Manager+ | Issues inbound replenishment Purchase Order |
| `POST` | `/api/v1/inventory/audit` | Session / API Key | Manager+ | Initiates and reconciles physical stocktaking count |

### Group 5: Customers, Debt Ledger & Loyalty (`src/app/api/v1/customers/`)
| HTTP Method | Route Path | Auth Requirement | RBAC Scope | Primary Function |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/customers` | Session / API Key | Cashier+ | Searches customer directory by name, phone, or ICE |
| `POST` | `/api/v1/customers` | Session / API Key | Cashier+ | Registers new retail or wholesale commercial client |
| `GET` | `/api/v1/customers/[id]/ledger` | Session / API Key | Cashier+ | Retrieves customer notebook debt (`Karné`) transaction log |
| `POST` | `/api/v1/customers/[id]/credit-payment` | Session / API Key | Cashier+ | Records customer debt repayment settlement |
| `GET` | `/api/v1/customers/[id]/loyalty` | Session / API Key | Cashier+ | Fetches loyalty points balance and reward tiers |

### Group 6: Universal TPE Integration Hub (`src/app/api/v1/tpe/`)
| HTTP Method | Route Path | Auth Requirement | RBAC Scope | Primary Function |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tpe/terminals` | Session / API Key | Manager+ | Lists configured physical payment terminals and protocols |
| `POST` | `/api/v1/tpe/terminals` | Session / API Key | Manager+ | Pairs new TPE terminal (IP, port, protocol, merchant ID) |
| `POST` | `/api/v1/tpe/transaction`| Session / API Key | Cashier+ | Initiates locked payment transaction to physical terminal |
| `POST` | `/api/v1/tpe/cancel` | Session / API Key | Cashier+ | Cancels active pending transaction on terminal |
| `POST` | `/api/v1/tpe/print` | Session / API Key | Cashier+ | Spools custom merchant receipt to terminal integrated printer |
| `POST` | `/api/v1/tpe/probe` | Session / API Key | Manager+ | Probes terminal LAN IP/port reachability and protocol ping |

### Group 7: SaaS Platform Billing & Subscriptions (`src/app/api/billing/`)
| HTTP Method | Route Path | Auth Requirement | RBAC Scope | Primary Function |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/billing/subscription`| Session Cookie | Owner | Retrieves merchant SaaS subscription status, active Postes, and renewal date |
| `POST` | `/api/billing/create-checkout-session` | Session Cookie | Owner | Generates Stripe/PayZone/CMI payment session (200 MAD + 150 MAD) |
| `POST` | `/api/billing/customer-portal` | Session Cookie | Owner | Creates billing portal session for card update or invoice downloads |
| `POST` | `/api/billing/webhook/stripe` | Webhook Signature | Stripe System | Validates HMAC signature; activates or extends subscription |
| `POST` | `/api/billing/webhook/payzone`| Webhook Signature | PayZone System| Validates HMAC signature for Moroccan card recurring charges |

### Group 8: Edge Synchronization & Devices (`src/app/api/v1/sync/`)
| HTTP Method | Route Path | Auth Requirement | RBAC Scope | Primary Function |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sync/batch` | Session / API Key | Cashier+ | Flushes offline sales batch from Dexie.js with idempotency checks |
| `GET` | `/api/v1/sync/delta` | Session / API Key | Cashier+ | Fetches delta updates of products/prices changed since last sync timestamp |
| `POST` | `/api/v1/devices/pair` | Public (Challenge) | Cashier+ | Pairs new hardware tablet or PC using one-time activation code |

---

## 3. Cryptographic & Security Verification Matrix

| Vulnerability Vector | Defense Implementation | Forensic Audit Verification |
| :--- | :--- | :--- |
| **SQL Injection** | Prisma ORM 100% Parameterized Binding | Passed (0 raw unescaped queries) |
| **Cross-Site Scripting (XSS)** | React JSX Virtual DOM automatic escaping + CSP | Passed (0 dangerouslySetInnerHTML leaks) |
| **Cross-Site Request Forgery** | SameSite=Lax HTTP-only cookies + Origin verification | Passed (Protected mutation endpoints) |
| **Timing Side-Channel Attacks**| `crypto.timingSafeEqual` on all webhook secrets | Passed (Constant-time comparison enforced) |
| **Broken Object Level Auth** | Strict `tenantId` session filter on every query | Passed (0 cross-tenant data leaks) |
| **Rate Limit Exhaustion** | Upstash Redis sliding window token bucket | Passed (Protected auth, POS & payment routes) |
| **Card Data Theft (PCI-DSS)** | Zero PAN / Zero CVV storage across all routes | Passed (Tokenized / Direct terminal isolation) |
