# KASPI POS — ENTERPRISE SECURITY ARCHITECTURE & THREAT MODEL
**Document Version:** 1.0.0-OMEGA  
**Classification:** Confidential — Core Engineering Specification  
**Compliance Standards:** Moroccan CNDP Law 09-08, DGI Article 145 CGI, EU GDPR, OWASP Top 10, NIST SP 800-53  

---

## 1. EXECUTIVE SUMMARY & SECURITY PRINCIPLES

KASPI POS operates under a strict **Zero-Trust Distributed Security Model**. The architecture assumes that:
1. The local network in retail environments is untrusted and hostile (e.g., public store Wi-Fi, shared commercial internet).
2. Edge devices (cash registers, tablets) may suffer sudden hardware theft or power interruption.
3. Third-party cloud providers, while SOC2 certified, must never have access to unencrypted commercial secrets or personal data.
4. Community worker nodes are untrusted and must never receive Personally Identifiable Information (PII) or financial transactions.

```
+-----------------------------------------------------------------------------------------+
|                                ZERO-TRUST SECURITY ENVELOPE                             |
|                                                                                         |
|  +--------------------+         +---------------------+         +--------------------+  |
|  |  Tauri Desktop POS |         | Vercel Serverless   |         | Neon DB (Central)  |  |
|  |  (Local Auth /     | <=====> | (NextAuth / JWT     | <=====> | (Tenant RLS /      |  |
|  |   Encrypted Dexie) |  mTLS   |  Input Sanitization)|  mTLS   |  Gapless Audit)    |  |
|  +--------------------+         +---------------------+         +--------------------+  |
|           |                                                                 |           |
|           | AES-256-GCM (Zero-Knowledge)                                    | RLS       |
|           v                                                                 v           |
|  +--------------------+                                         +--------------------+  |
|  | Multi-Cloud Backup |                                         | Supabase Realtime  |  |
|  | (Cloudflare R2 /   |                                         | (KDS WebSocket /   |  |
|  |  Supabase S3)      |                                         |  Strict JWT Guard) |  |
|  +--------------------+                                         +--------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. STRIDE THREAT MODEL & MITIGATION MATRIX

Each layer of the KASPI POS ecosystem has been audited using the Microsoft STRIDE methodology.

| Threat Category | Target Layer | Potential Attack Vector | KASPI Mitigation Architecture | Residual Risk |
|---|---|---|---|---|
| **Spoofing (Identity)** | POS Terminal / API | Forged JWT tokens or spoofed device headers. | Ephemeral HMAC-SHA256 JWT sessions signed with server secret; hardware-bound device fingerprints verified on sync; bcrypt password hashing ($rounds \ge 12$). | Negligible |
| **Spoofing (Node)** | Orchestrator Nodes | Malicious rogue node claiming to be an authorized worker. | Ed25519 cryptographic handshake with registration token challenge; node capability validation before job dispatch. | Negligible |
| **Tampering (Data)** | Offline Transactions | Cashier altering local IndexedDB transaction logs before sync. | Transaction records signed with device cryptographic signature; sequential client-side nonce chained with previous hash; server-side reconciliation rejects out-of-sequence orders. | Negligible |
| **Tampering (Backups)**| Cloud Storage | Cloud provider employee or compromised S3 credential modifying backup archive. | AES-256-GCM with 128-bit authentication tag and SHA-256 payload integrity checksums verified prior to decryption. | Zero |
| **Repudiation** | Fiscal Sales & Returns | Cashier denying processing a discount, void, or cash drawer opening. | Immutable audit log in Neon DB recording `actorId`, `tenantId`, `action`, `clientIp`, `deviceFingerprint`, `timestamp`, and `before/after` delta state. Gapless sequence numbers cannot be deleted. | Zero |
| **Information Disclosure** | Customer Ledgers (Credit) | Creditor names, phone numbers, and debts intercepted or exposed in transit. | Moroccan CNDP Law 09-08 compliance: TLS 1.3 in-transit; field-level hashing where search is required; zero PII sent to analytics or community nodes. | Negligible |
| **Information Disclosure** | Cloud Backups | Cloudflare R2 bucket breach exposing store financial ledgers. | Client-side Zero-Knowledge AES-256-GCM encryption. Encryption key is derived from Store Master Secret never transmitted to backup storage. R2 only sees encrypted ciphertext. | Zero |
| **Denial of Service** | Store POS Terminal | Loss of upstream internet connection disabling sales operations. | 100% offline-first engine: Dexie.js (IndexedDB) holds complete local catalog, barcode dictionary, and receipt printer spooler. Sales continue uninterrupted. | Zero |
| **Denial of Service** | Cloud API | Volumetric DDoS attack against `api.kaspi.ma`. | Cloudflare DDoS mitigation, edge caching, and upstream rate-limiting (Upstash Redis token bucket: max 100 requests/minute per IP/tenant). | Negligible |
| **Elevation of Privilege**| Multi-Tenant API | Tenant A injecting `tenantId = B` into GraphQL or REST payload to read Tenant B sales. | Architectural Prisma Client Extensions force `where: { tenantId }` filter on every query; PostgreSQL Row-Level Security (RLS) policies block cross-tenant reads even if Prisma is bypassed. | Zero |

---

## 3. MULTI-TENANT DATA ISOLATION ARCHITECTURE

Multi-tenancy in KASPI is guaranteed through a defense-in-depth model across three independent layers:

```
                  Client Request (Session Token)
                                |
                                v
               +----------------------------------+
               | Layer 1: Next.js API Middleware  |
               | - Extract & verify JWT session   |
               | - Validate active tenant status  |
               | - Reject mismatched tenantId     |
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               | Layer 2: Prisma Extension Shield |
               | - Prisma Client Extension hooks  |
               | - Auto-inject tenantId filter    |
               | - Strip tenantId from body mutations
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               | Layer 3: PostgreSQL RLS Engine   |
               | - SET LOCAL app.current_tenant   |
               | - Row-Level Security Policies    |
               | - Hardware-enforced DB isolation |
               +----------------------------------+
```

### 3.1 Layer 1: Middleware & Session Guard
Every authenticated request parses the cryptographically signed JWT. The user's assigned `tenantId` is stamped onto the server execution context:
```typescript
// Enforced in src/lib/auth-guard.ts
export async function enforceTenantAccess(req: Request, targetTenantId?: string): Promise<SessionContext> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new SecurityException("UNAUTHENTICATED", 401);
  }
  if (!session.user.isSuperAdmin && targetTenantId && session.user.tenantId !== targetTenantId) {
    throw new SecurityException("CROSS_TENANT_ACCESS_DENIED", 403);
  }
  return { userId: session.user.id, tenantId: session.user.tenantId, role: session.user.role };
}
```

### 3.2 Layer 2: Prisma Client Extension Injection
To eliminate human developer error (forgetting `where: { tenantId }`), the Prisma client enforces automatic query scoping:
```typescript
export const db = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (TENANT_SCOPED_MODELS.includes(model) && !isSystemOperation()) {
          const tenantId = getCurrentTenantId();
          if (operation === 'findMany' || operation === 'findFirst') {
            args.where = { ...args.where, tenantId };
          }
          if (operation === 'create') {
            args.data = { ...args.data, tenantId };
          }
        }
        return query(args);
      },
    },
  },
});
```

### 3.3 Layer 3: PostgreSQL Row-Level Security (RLS)
At the database engine level, RLS policies guarantee that even if an attacker executes raw SQL via SQL injection, rows belonging to other tenants are invisible:
```sql
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON "Order"
    AS RESTRICTIVE
    USING (tenant_id = current_setting('app.current_tenant_id', true)::text);
```

---

## 4. ZERO-KNOWLEDGE CLIENT-SIDE BACKUP CRYPTOGRAPHY

Backups exported to multi-cloud storage (Supabase S3, Cloudflare R2, local USB) utilize the **KASPI Zero-Knowledge Envelope**. The cloud providers host encrypted blobs without possessing the decryption keys.

### 4.1 Cryptographic Key Derivation Flow
```
Store Master Password + Tenant UUID
               |
               v
  Argon2id (Salt = Store Registration Nonce, Memory = 64MB, Iterations = 3)
               |
               v
       256-bit Master Key
               |
               +--------------------------------------+
               |                                      |
               v                                      v
    Payload Encryption (AES-256-GCM)       Key Integrity MAC (HMAC-SHA256)
               |                                      |
               +-------------------+------------------+
                                   |
                                   v
             Exported Encrypted Archive (.kaspi-vault)
             - 16 bytes IV
             - 16 bytes GCM Auth Tag
             - Ciphertext
             - 32 bytes SHA-256 Payload Hash
```

### 4.2 Algorithm Specifications
- **Symmetric Cipher:** AES-256 in Galois/Counter Mode (GCM).
- **Authentication:** 128-bit authentication tag appended to the ciphertext to ensure tamper-evidence.
- **Initialization Vector:** 12-byte cryptographically secure random IV generated per backup snapshot via `crypto.getRandomValues()`. IVs are never reused.
- **Key Derivation:** WebCrypto PBKDF2 with SHA-512 ($100,000$ iterations) or Argon2id where native assembly is supported.

---

## 5. COMMUNITY CONTRIBUTOR NODE SECURITY & PRIVACY SHIELD

KASPI supports optional community-contributed worker nodes for batch analytics, optical character recognition (OCR) on supplier invoices, and LLM inference. To maintain absolute enterprise security:

```
[Store Client]
      |
      | 1. Ingest Supplier Invoice Image
      v
+-------------------------------------------------------+
| Privacy Shield Interceptor (Edge Sanitizer)          |
| - Strips store name, address, ICE, IF, RC numbers     |
| - Strips customer phone numbers and names             |
| - Retains only line-item descriptions and SKU text    |
+-------------------------------------------------------+
      |
      | 2. Anonymized Job Payload
      v
+-------------------------------------------------------+
| Community Worker Node (Untrusted Sandbox)             |
| - Executes OCR / Item Classification                  |
| - Zero access to tenant databases or credentials      |
| - Resource quotas: max 25% CPU, max 500MB RAM         |
+-------------------------------------------------------+
      |
      | 3. Raw Line Items Result
      v
[Central Secure Server] ===> Matches Back to Tenant Private Context
```

### 5.1 Privacy Invariants:
1. **Zero Transactional Processing:** Checkout calculations, receipt signing, and cash transactions NEVER leave the secure local POS terminal and Neon DB.
2. **Explicit Contributor Consent:** Community node contribution requires signed terms of service, opt-in toggle, thermal/battery ceiling monitoring, and one-click immediate termination.
3. **Regex PII Scrubbing:** All text payloads dispatched to community nodes pass through `cleanPII()` regex sanitization removing Moroccan identity cards (CIN), tax IDs (IF/ICE), phone numbers, and addresses.

---

## 6. MOROCCAN REGULATORY COMPLIANCE ARCHITECTURE

### 6.1 Law 09-08 (Protection of Personal Data - CNDP)
- **Data Minimization:** KASPI stores only the minimum necessary customer data (name, phone number, credit balance).
- **Consent Tracking:** Stores obtain customer consent during loyalty enrollment; customers can request deletion (`Right to Erasure`) with automated data purging scripts.
- **Data Sovereignty:** Database connections to Neon and Cloudflare are configured within compliant European/North African low-latency corridors, with local encrypted disk persistence at the retail establishment in Morocco.

### 6.2 Article 145 CGI (Direction Générale des Impôts - DGI)
Moroccan Tax Law requires computerized point-of-sale systems to maintain immutable, continuous, and tamper-evident transaction accounting:
1. **Gapless Sequential Numbering:** Invoices and fiscal receipts must possess continuous numbering without gaps (`NUM-2026-000001`, `NUM-2026-000002`). This is strictly enforced in PostgreSQL using atomic sequence locks:
   ```sql
   SELECT nextval('tenant_' || current_tenant_id || '_invoice_seq');
   ```
2. **Zero In-Place Deletions:** Deleting an issued transaction is physically prohibited by database triggers. Corrections require issuing a signed credit note (`Avoir`) referencing the original invoice UUID.
3. **Daily Z-Report Archiving:** At the end of each fiscal day, an immutable Z-Report is generated, cryptographically signed, and replicated to redundant backup storage.

---

## 7. SECURE DEVELOPMENT LIFECYCLE (SDLC) & SUPPLY CHAIN

1. **Dependency Pinning:** All npm and cargo packages are locked to exact versions in `package-lock.json` and `Cargo.lock`.
2. **Automated Vulnerability Scanning:** Every GitHub Actions CI build runs `npm audit --audit-level=high` and `cargo audit`.
3. **Software Bill of Materials (SBOM):** Continuous SPDX 2.3 SBOM generation using Syft and Grype ensures no GPL-3.0 or infectious copyleft licenses violate commercial confidentiality.
4. **Secret Scanning:** Pre-commit hooks block git commits containing API keys, private keys, or credentials.
