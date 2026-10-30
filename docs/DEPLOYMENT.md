# CLOUD DEPLOYMENT STRATEGY — Multi-Tenant POS SaaS (Morocco)

> Target: Low, predictable operational cost (under $10–$25/month initial) with high reliability and zero cross-tenant leakage.

---

## 1. Target Platforms Overview

| Platform | Best For | Architecture / Tiers | Cost Profile |
|---|---|---|---|
| **Oracle Cloud (Always Free)** | Production / Staging Dedicated VM | Ampere A1 Compute (ARM64, up to 4 OCPU, 24 GB RAM) + Docker Compose | **$0/month** (within Free Tier limits) |
| **GitHub Codespaces** | Development / Pair Programming | 2-core / 4-core Linux container with Docker-in-Docker | 60 hours/month free with GitHub Pro |
| **Google Cloud (Cloud Run)** | Scalable Serverless Production | Containerized Next.js on Cloud Run + Managed Cloud SQL / Supabase Postgres | Pay-per-request (~$5–$20/month depending on volume) |

---

## 2. Platform 1: Oracle Cloud Always Free (Recommended Host)

Oracle Cloud Infrastructure (OCI) provides an Always Free tier with ARM-based Ampere A1 instances:
- Up to 4 OCPU cores and 24 GB memory (can be partitioned into 1 or 2 VMs).
- 200 GB block storage (ample for PostgreSQL database and local automated backups).

### Deployment Steps on OCI:
1. **Provision VM:**
   - Image: Ubuntu 24.04 LTS (AArch64 / ARM64).
   - Shape: `VM.Standard.A1.Flex` with 2 OCPU and 12 GB RAM.
   - VCN Security List: Ingress rules for port 80 (HTTP), 443 (HTTPS), and 22 (SSH).
2. **Setup Server:**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin git caddy
   sudo usermod -aG docker $USER
   ```
3. **Deploy with Production Docker Compose:**
   ```bash
   git clone <REPO_URL> /opt/pos-saas
   cd /opt/pos-saas
   cp .env.example .env
   # Populate production secrets (AUTH_SECRET, DATABASE_URL, AI key pools, Billing API keys, etc.)
   docker compose -f docker-compose.prod.yml up -d --build
   
   # Run production database migrations
   docker exec -it kaspi_pos_app npx prisma migrate deploy
   ```
4. **Reverse Proxy & SSL via Caddy:**
   `/etc/caddy/Caddyfile`:
   ```caddy
   app.kasbipos.ma {
       reverse_proxy localhost:3000
   }
   ```
   Caddy automatically provisions and renews Let's Encrypt SSL certificates.

---

## 3. Platform 2: GitHub Codespaces

For instant onboarding and cloud development without local machine dependencies:

### Configuration:
1. Push repository to GitHub.
2. Open in Codespace (`Code` → `Codespaces` → `Create codespace on main`).
3. Inside Codespace terminal:
   ```bash
   docker compose up -d postgres
   npx prisma migrate dev
   npm run dev
   ```
4. Codespaces automatically forwards:
   - Port `3000` (Next.js Application)
   - Port `5432` (PostgreSQL Database)

---

## 4. Platform 3: Google Cloud (Serverless Cloud Run)

For hands-off autoscaling with zero-maintenance containers:

### Architecture:
- **Compute:** Cloud Run service running the multi-stage `Dockerfile`.
- **Database:** Supabase Pro or Google Cloud SQL (PostgreSQL 16) connected via Cloud SQL Auth Proxy or VPC connector.
- **Storage:** Cloudflare R2 or Google Cloud Storage for tenant document backups and invoice PDFs.

### Build & Deploy:
```bash
# Build & submit container image
gcloud builds submit --tag gcr.io/[PROJECT_ID]/pos-saas:latest

# Deploy to Cloud Run
gcloud run deploy pos-saas \
  --image gcr.io/[PROJECT_ID]/pos-saas:latest \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=3000 \
  --set-secrets DATABASE_URL=pos-db-url:latest,AUTH_SECRET=auth-secret:latest
```

---

## 5. Environment Variables & Production Secrets

| Variable | Description | Example / Note |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/pos_saas?schema=public` |
| `AUTH_SECRET` | NextAuth encryption secret | 32+ character random hex (`openssl rand -hex 32`) |
| `NEXTAUTH_URL` | Canonical app URL | `https://app.kasbipos.ma` |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | From Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | From Google Cloud Console |
| `NODE_ENV` | Environment identifier | `production` |

---

## 6. Zero-Downtime Migration Policy

1. Always run `npx prisma migrate deploy` in the CI/CD pipeline before traffic hits updated containers.
2. All database migrations must be backwards-compatible (additive columns with defaults, expand-and-contract pattern for schema refactors).
3. Automated backup runs nightly:
   ```bash
   docker exec pos_saas_db pg_dump -U pos_user pos_saas | gzip > /backups/pos_saas_$(date +%F).sql.gz
   ```
