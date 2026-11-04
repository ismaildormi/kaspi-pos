# KASPI POS (كسب) — Operations Runbook & Disaster Recovery
**Operational Tier:** Tier-1 Merchant Critical
**Audience:** Site Reliability Engineers, DevOps, Platform Administrators

---

## 1. Incident Management & Severity Levels

| Severity | Description | Target Response | Target Resolution |
|---|---|---|---|
| **P0 - Outage** | Database unreachable, POS checkouts completely failing | < 5 mins | < 30 mins |
| **P1 - Degraded** | Realtime KDS offline, offline mode active, sync queue paused | < 15 mins | < 2 hours |
| **P2 - Moderate** | AI assistant responding slowly, image upload failure | < 1 hour | < 8 hours |
| **P3 - Low** | Minor UI layout glitch, reporting styling correction | < 1 business day | Next sprint release |

---

## 2. Emergency Recovery Procedures

### 2.1 Database Connection Pool Exhaustion (Neon)
If requests fail with `P2024: Timed out fetching a new connection from the pool`:
1. Check active database connections in Neon console.
2. Ensure `?pgbouncer=true&connection_limit=15` is configured on the `DATABASE_URL` pooler endpoint.
3. Restart the Vercel deployment to drain stale connections.

### 2.2 Offline POS Fallback
If cloud internet connectivity drops at the merchant store:
1. Cashiers continue ringing sales without interruption.
2. Dexie.js captures transactions in `offlineSales` table and updates local inventory counts.
3. Upon network reconnection, `sync_queue` flushes automatically via exponential backoff.
4. Receipts printed locally remain valid with client-generated serial identifiers.

### 2.3 Super Admin Emergency Account Recovery
To re-seed or verify the Super Admin account in the production Neon database:
```bash
/usr/bin/node ./node_modules/tsx/dist/cli.mjs scripts/seed-admin.ts
```
