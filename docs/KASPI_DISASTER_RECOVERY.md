# KASPI POS — DISASTER RECOVERY & BUSINESS CONTINUITY RUNBOOK
**Document Version:** 1.0.0-OMEGA  
**Classification:** Mission-Critical Operations Runbook  
**Target Recovery Metrics:** RPO < 15 Minutes | RTO < 5 Minutes  

---

## 1. RECOVERY METRICS & OBJECTIVES

Retail businesses cannot tolerate sales interruptions during operating hours. A system crash at peak checkout time damages customer trust and causes immediate revenue loss.

KASPI defines two core disaster recovery metrics:

| Metric | Target | Operational Guarantee |
|---|---|---|
| **RPO (Recovery Point Objective)** | **0 Seconds (Edge)**<br>**< 15 Mins (Cloud)** | Every transaction is immediately committed to local IndexedDB before the receipt prints. Cloud transactions sync continuously with a maximum 15-minute sync window under degraded network. |
| **RTO (Recovery Time Objective)** | **< 2 Seconds (Edge)**<br>**< 5 Minutes (Cloud)** | Edge switches to offline mode instantly upon network loss with zero cashier intervention. Serverless cloud failover switches to healthy replicas in $< 5\text{ minutes}$. |

```
+-----------------------------------------------------------------------------------------+
|                               DISASTER RECOVERY ARCHITECTURE                             |
|                                                                                         |
|       [Local Retail Store]                               [Global Cloud Replicas]        |
|  +----------------------------+                  +-----------------------------------+  |
|  | POS Terminal (Dexie DB)    |                  | Neon DB Primary (Frankfurt)       |  |
|  | - 100% Offline Resilience  |                  | - Continuous WAL Archiving (PITR) |  |
|  | - Encrypted Local Storage  |                  +-----------------------------------+  |
|  +----------------------------+                                    |                    |
|                |                                                   v                    |
|                | Client-Side AES-256-GCM           +-----------------------------------+  |
|                | Zero-Knowledge Backup Snapshots   | Cloudflare R2 Disaster Vault      |  |
|                +---------------------------------> | - Zero-Egress Secondary Replica   |  |
|                |                                   +-----------------------------------+  |
|                |                                                   |                    |
|                v                                                   v                    |
|  +----------------------------+                  +-----------------------------------+  |
|  | Local USB / Air-Gapped     |                  | Supabase S3 Backup Bucket         |  |
|  | Encrypted .kaspi-vault     |                  | - Multi-Region Encrypted Archive  |  |
|  +----------------------------+                  +-----------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. DISASTER SCENARIOS & OPERATIONAL RUNBOOKS

### Scenario 1: Total Internet Outage at Retail Store
*Context: Optical fiber cut or 4G mobile outage in the retail neighborhood.*

- **Automatic Trigger:** The POS terminal detects network loss on health check ping failure ($> 3000\text{ ms}$).
- **Immediate Edge Behavior:**
  1. The UI displays an amber status banner: `Offline Mode Active — Local Operations Normal`.
  2. Cash register continues scanning barcodes and processing cash/credit sales at full speed.
  3. Receipts print locally via direct USB/ESC-POS thermal printer driver without cloud dependence.
  4. Transactions are appended to the encrypted local Dexie pending queue.
- **Restoration Procedure:**
  1. Network connectivity restores.
  2. Background sync worker automatically triggers exponential backoff reconciliation.
  3. Queued transactions upload to `/api/v1/sync` in batches of 50.
  4. Server acknowledges transactions and client marks local queue as synced.
- **RTO:** **0 seconds** (Immediate, seamless failover).
- **RPO:** **0 seconds** (Zero data loss).

---

### Scenario 2: Cloud Database Outage (Neon Unavailability)
*Context: Central Neon PostgreSQL cluster suffers an upstream outage.*

- **Detection:** Cloudflare Edge and Vercel middleware detect upstream 500 errors on database connection handshakes.
- **Immediate Cloud Behavior:**
  1. Cloudflare Workers edge router routes traffic to static maintenance fallback page for web back-office visitors.
  2. POS terminals in the field detect cloud failure and remain in autonomous Offline Mode.
  3. Stores continue checking out customers locally without interruption.
- **Restoration Procedure (Platform Operator):**
  1. Check Neon status page (`neonstatus.com`) and cloud console.
  2. If primary compute is degraded, trigger instant compute restart via Neon CLI:
     ```bash
     neon compute start <compute-id> --project-id <project-id>
     ```
  3. If primary branch is corrupted, perform Point-In-Time-Recovery (PITR) to a timestamp 5 minutes prior to corruption:
     ```bash
     neon branch create --project-id <project-id> --name pitr-recovery --parent main --timestamp "2026-11-04T07:15:00Z"
     ```
  4. Update `DATABASE_URL` in Vercel environment variables pointing to `pitr-recovery`.
  5. Redeploy edge production: `vercel --prod`.
- **RTO:** **< 8 minutes**.
- **RPO:** **< 5 minutes**.

---

### Scenario 3: Physical Theft, Water Damage, or Hardware Destruction of POS Terminal
*Context: Cash register tablet or PC is physically destroyed or stolen from the store.*

- **Security Containment:**
  1. Merchant calls or logs into KASPI Web Admin from a mobile phone or laptop.
  2. Revoke the lost terminal session token under **Settings $\rightarrow$ Devices $\rightarrow$ Revoke Access**.
  3. Because local Dexie data is encrypted and cannot be queried without the cashier PIN/password, stolen data is rendered useless.
- **Hardware Replacement & Store Restoration:**
  1. Merchant acquires a replacement PC, laptop, or tablet.
  2. Download and install KASPI POS Tauri desktop client (or open modern browser).
  3. Log in with Store Master Account credentials.
  4. Navigate to **Settings $\rightarrow$ Backup & Recovery $\rightarrow$ Restore from Cloud**.
  5. Enter the Store Master Password to decrypt the latest encrypted `.kaspi-vault` snapshot stored in Cloudflare R2 / Supabase.
  6. The system pulls and decrypts catalog, inventory balances, customer debts, and configuration in $< 60\text{ seconds}$.
- **RTO:** **< 15 minutes** (Time required to power on new hardware and enter credentials).
- **RPO:** **< 15 minutes** (Latest cloud sync snapshot).

---

### Scenario 4: Accidental Database Tampering or Malicious SQL Mutation
*Context: An operator or unauthorized administrator accidentally deletes product categories or modifies pricing.*

- **Zero-Knowledge Backup Restoration Runbook:**
  1. Identify the corrupt tenant UUID: `tenant_xyz`.
  2. Locate the most recent automated snapshot in Cloudflare R2:
     ```bash
     aws s3 ls s3://kaspi-pos-uploads/backups/tenant_xyz/ --endpoint-url $R2_ENDPOINT
     ```
  3. Download the encrypted archive: `snapshot_2026-11-04_06-00-00.kaspi-vault`.
  4. Execute the automated restore verification script:
     ```bash
     node scripts/restore-tenant.js --tenant=tenant_xyz --file=snapshot_2026-11-04_06-00-00.kaspi-vault --master-key=$STORE_MASTER_KEY
     ```
  5. The restore engine verifies the 128-bit AES-GCM authentication tag and SHA-256 payload checksum.
  6. Restores rows into a temporary staging table, verifies integrity, and executes an atomic PostgreSQL table swap.
- **RTO:** **< 20 minutes**.
- **RPO:** **< 1 hour** (Nightly snapshot or intra-day checkpoint).

---

## 3. AUTOMATED BACKUP VERIFICATION & INTEGRITY DRIFT AUDIT

A backup that has never been tested is not a backup. KASPI includes an automated **Nightly Synthetic Restore Drill** built into [`src/lib/backup/fabric.ts`](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/backup/fabric.ts):

1. **Drill Step 1 (Snapshot Generation):** Every night at 03:00 UTC, an encrypted snapshot of every active tenant is compiled.
2. **Drill Step 2 (Dual Replication):** The snapshot is replicated concurrently to:
   - Supabase Object Storage (Primary Hot Target).
   - Cloudflare R2 (Off-Site Zero-Egress Target).
3. **Drill Step 3 (Synthetic Decryption & Validation):** A headless worker downloads the archive from Cloudflare R2, tests decryption against the known verification hash, validates schema conformity, and logs the result.
4. **Drill Step 4 (Alerting):** If a backup fails verification or tampering is detected (invalid GCM auth tag), an urgent P1 alert is dispatched via email and SMS to the engineering team.

---

## 4. BUSINESS CONTINUITY TESTING SCHEDULE

| Exercise | Frequency | Responsible Team | Success Criteria |
|---|---|---|---|
| **Edge Offline Simulation** | Weekly (Automated CI) | QA Automation | 1,000 simulated sales completed with network disabled and synced cleanly upon reconnect. |
| **PITR Database Snapshot Rollback**| Monthly | DevOps / Principal Architect | Test database restored from PITR branch in $< 10\text{ minutes}$ with zero record loss. |
| **Cloudflare R2 Failover Audit** | Bi-monthly | Security Engineer | Read/write failover to Cloudflare secondary bucket executed successfully. |
| **Full Disaster Recovery Drill** | Semi-annually | CTO & Infrastructure Director | Simulated total platform outage restored to secondary cloud within 30 minutes. |
