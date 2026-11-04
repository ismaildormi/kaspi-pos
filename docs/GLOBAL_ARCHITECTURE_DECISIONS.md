# KASPI GLOBAL ARCHITECTURE DECISION RECORDS (ADR)
**Standard:** Michael Nygard ADR Format
**Repository:** `pos-saas-morocco`

---

## ADR-001: Adoption of Multi-Provider Hybrid Resource Fabric

### Context
KASPI POS needs to provide high reliability, sub-50ms latency for Moroccan retailers, and extreme cost efficiency (< $0.25/store/month hosting cost) to sustainably offer subscriptions starting at 200 MAD/month ($20 USD). A single hyperscaler (e.g. AWS) imposes minimum multi-AZ cluster costs exceeding $500/month.

### Decision
Aggregate existing verified free-tier resources (Vercel Edge, Neon PostgreSQL, Supabase Storage/Realtime, Cloudflare CDN/R2) supplemented by physical local edge runtimes (Tauri 2.0).

### Status
Accepted & Implemented.

### Consequences
- **Positive:** Base infrastructure cost is $0.00/month on production-ready free tiers. Gross profit margin exceeds 98%.
- **Negative:** Requires rigorous abstraction layers (`orchestrator/registry.ts`, `orchestrator/scheduler.ts`) to avoid vendor coupling.

---

## ADR-002: Client-Side AES-256-GCM Encryption for Backup Replication

### Context
Disaster recovery requires replicating database snapshots across independent cloud failure domains (e.g., from Neon to Supabase and Cloudflare R2). Storing unencrypted customer and accounting data across secondary providers violates CNDP Law 09-08.

### Decision
Implement mandatory client-side encryption using AES-256-GCM with unique 96-bit initialization vectors and 128-bit authentication tags before dispatching any backup payload to remote object storage.

### Status
Accepted & Implemented.

### Consequences
- **Positive:** Complete Zero-Knowledge security. Storage providers hold only opaque ciphertext.
- **Negative:** Master tenant encryption keys must be managed with care; key loss results in unrecoverable backups.

---

## ADR-003: Strict Criticality Partitioning for Community Contributor Nodes

### Context
Section 2.E allows leveraging voluntary community computing resources. However, community computers are untrusted, unmonitored, and prone to abrupt shutdown.

### Decision
Strictly forbid `CRITICAL_TRANSACTIONAL` and `HIGH_REALTIME` workloads from ever running on community or best-effort nodes. Restrict community nodes to anonymized background analytics, batch reporting, and non-sensitive tasks.

### Status
Accepted & Implemented.

### Consequences
- **Positive:** Zero risk of fiscal sequence corruption, double-charges, or PII leakage on consumer hardware.
- **Negative:** Community compute capacity cannot be used to absorb database transaction spikes.
