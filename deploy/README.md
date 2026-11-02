# KASPI POS — Oracle Cloud VPS Deployment

This folder runs the self-hosted part of the hybrid architecture (see `docs/MASTER_ARCHITECTURE.md`):

| Service | Purpose | Port |
| :--- | :--- | :--- |
| **Supavisor** | Connection pooler between Vercel and Neon (transaction mode) | `6543` (public), `4000` (localhost API) |
| **Trigger.dev** (webapp + supervisor) | Background jobs (`import-csv`, AI pipelines) | via Caddy → `https://$TRIGGER_DOMAIN` |
| **Hyperswitch** router | Payment orchestration | via Caddy → `https://$HYPERSWITCH_DOMAIN` |
| **Caddy** | Automatic HTTPS (Let's Encrypt) | `80`, `443` |
| Postgres 16 + Redis 7 | Metadata for the three services above (**not** KASPI business data, which stays in Neon) | internal |

> [!IMPORTANT]
> Pick the Oracle Cloud region **Germany Central (Frankfurt)**. Neon runs in `eu-central-1` (Frankfurt), so every query that goes through Supavisor adds the VPS↔Neon round trip. Any other region adds noticeable latency.

---

## 1. Create the VM (Always Free)

1. Oracle Cloud Console → **Compute → Instances → Create instance**.
2. Image: **Ubuntu 24.04** (Canonical). Shape: **VM.Standard.A1.Flex** (Ampere, arm64), **4 OCPU / 24 GB RAM** (the Always-Free maximum).
3. Upload your SSH public key and create the instance. Note the **public IP**.
4. **Open ports in the cloud firewall:** VCN → Subnet → Security List → *Add Ingress Rules* for TCP `80`, `443`, `6543` from `0.0.0.0/0`.
   - For `6543` you can restrict the source to Vercel's egress IPs if you have a plan with static IPs.
5. **Open the same ports in the OS firewall.** Oracle Ubuntu images ship with restrictive iptables rules:

```bash
ssh ubuntu@<VPS_PUBLIC_IP>
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80   -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443  -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 6543 -j ACCEPT
sudo netfilter-persistent save
```

## 2. Install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git openssl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker
docker compose version
```

## 3. DNS

Create two **A records** that point to the VPS public IP:

- `trigger.your-domain.com`
- `pay.your-domain.com`

Caddy requests TLS certificates for both names on first start.

## 4. Configure the VPS `.env`

```bash
git clone https://github.com/ismaildormi/kaspi-pos.git
cd kaspi-pos/deploy
cp .env.vps.example .env
chmod 600 .env
```

Fill every `change_me_*` value. Generate secrets with:

```bash
openssl rand -hex 32   # 64-char secrets (SECRET_KEY_BASE, MASTER_ENC_KEY, passwords)
openssl rand -hex 16   # 32-char secrets (Trigger.dev keys, SUPAVISOR_VAULT_ENC_KEY)
```

Set `NEON_HOST` to the **direct** Neon host (without `-pooler`) and `NEON_PASSWORD` to your Neon password.

## 5. Start the stack

```bash
docker compose pull
docker compose up -d
docker compose ps
docker compose logs -f --tail=100
```

## 6. Post-start setup

### 6a. Supavisor → Neon

```bash
chmod +x scripts/register-supavisor-tenant.sh
./scripts/register-supavisor-tenant.sh
```

The script prints the new `DATABASE_URL`. Put it in **Vercel → Settings → Environment Variables**:

```
DATABASE_URL=postgresql://neondb_owner.kaspi:<NEON_PASSWORD>@<VPS_PUBLIC_IP>:6543/neondb?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://neondb_owner:<NEON_PASSWORD>@<NEON_DIRECT_HOST>/neondb?sslmode=require   # unchanged
```

Test it from your PC with `psql "<DATABASE_URL without the prisma params>" -c "select 1"`.

> [!NOTE]
> RLS keeps working in transaction-pooling mode. `prismaRlsExtension` sets `app.current_tenant_id` with `set_config(..., true)` (transaction-local), and it does so inside the same transaction as the query.

### 6b. Trigger.dev

1. Open `https://trigger.your-domain.com` and sign in with `TRIGGER_ADMIN_EMAIL`. If SMTP isn't configured, get the magic link from `docker compose logs trigger-webapp | grep -i magic`.
2. Create the organization and the project **kaspi-pos**. Copy the **project ref** (`proj_...`) and the **prod secret key** (`tr_prod_...`).
3. In Vercel, set:
   ```
   TRIGGER_API_URL=https://trigger.your-domain.com
   TRIGGER_SECRET_KEY=tr_prod_...
   TRIGGER_PROJECT_ID=proj_...
   ```
4. Deploy the tasks from your PC (repo root):
   ```bash
   npx trigger.dev@<same-major-as-server> login -a https://trigger.your-domain.com
   npx trigger.dev@<same-major-as-server> deploy --self-hosted
   ```

> [!WARNING]
> **Trigger.dev version:** current self-hosted images (`ghcr.io/triggerdotdev/*`) are **v4**, and the app currently uses `@trigger.dev/sdk@3`. Before switching `TRIGGER_API_URL` to the VPS, upgrade with `npm i @trigger.dev/sdk@4` and change the imports in `src/trigger/import-csv.ts`, `trigger.config.ts` and `src/app/api/products/import/route.ts` from `@trigger.dev/sdk/v3` to `@trigger.dev/sdk`. The `task()` and `tasks.trigger()` APIs are the same. Until then, keep using Trigger.dev Cloud. When no key is set, the import route falls back to in-process execution.
>
> Trigger.dev changes its self-hosting layout often. If a container fails to start, compare this file with the official `hosting/docker` folder in the `triggerdotdev/trigger.dev` repo for the image tag you use.

### 6c. Hyperswitch

1. Check health: `curl https://pay.your-domain.com/health` should return `200`.
2. Run migrations if `hyperswitch-migrations` printed "run migrations manually":
   ```bash
   docker compose run --rm --entrypoint sh hyperswitch-router -c "ls /local"   # locate migrations
   ```
   Or follow the official Hyperswitch `docker-compose` quick start for your image tag.
3. Create a merchant account with the admin API key:
   ```bash
   curl -X POST https://pay.your-domain.com/accounts \
     -H "api-key: $HYPERSWITCH_ADMIN_API_KEY" -H "Content-Type: application/json" \
     -d '{"merchant_id":"kaspi_pos","merchant_name":"KASPI POS","return_url":"https://kaspi-pos.vercel.app/dashboard/billing"}'
   ```
4. Create an API key for the merchant (`POST /api_keys/kaspi_pos`) and copy the `profile_id` from the account response.
5. Configure connectors and the webhook URL `https://kaspi-pos.vercel.app/api/webhooks/hyperswitch`. Copy the profile's `payment_response_hash_key`.
6. In Vercel, set:
   ```
   HYPERSWITCH_API_URL=https://pay.your-domain.com
   HYPERSWITCH_API_KEY=snd_...           # TODO
   HYPERSWITCH_PUBLISHABLE_KEY=pk_snd_... # TODO
   HYPERSWITCH_PROFILE_ID=pro_...         # TODO
   HYPERSWITCH_WEBHOOK_SECRET=<payment_response_hash_key>  # TODO
   ```

> [!WARNING]
> **Connector availability:** check in the Hyperswitch connector list that **YouCanPay** and **Paddle** are supported in your version. Paddle is a Merchant of Record, not a classic card processor, and YouCanPay is a Moroccan regional gateway. Either one may need a custom connector. The existing direct integrations (`/api/billing/checkout`, `/api/webhooks/paddle`, `/api/webhooks/youcanpay`) stay active. `/api/payments/hyperswitch` returns `503` with a fallback hint until Hyperswitch is configured.

> [!NOTE]
> **arm64:** Supavisor, Postgres, Redis, Caddy and Trigger.dev publish multi-arch images. If `juspaydotin/hyperswitch-router` has no arm64 build for your tag, `docker compose pull` fails with "no matching manifest". In that case build the image from source on the VPS (`docker build` in the hyperswitch repo) or run Hyperswitch on an x86 (AMD) Always-Free micro instance.

---

## Operations

```bash
docker compose ps                         # status
docker compose logs -f supavisor          # follow one service
docker compose pull && docker compose up -d   # upgrade
docker compose exec vps-postgres pg_dumpall -U kaspi > backup-$(date +%F).sql   # metadata backup
```
