#!/usr/bin/env bash
# Registers (or updates) the KASPI tenant in Supavisor so it pools connections to Neon.
# Run on the VPS from the deploy/ directory:  ./scripts/register-supavisor-tenant.sh
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

b64url() { openssl base64 -e -A | tr '+/' '-_' | tr -d '='; }
HEADER=$(printf '{"alg":"HS256","typ":"JWT"}' | b64url)
PAYLOAD=$(printf '{"role":"service_role","iat":%s,"exp":%s}' "$(date +%s)" "$(( $(date +%s) + 3600 ))" | b64url)
SIG=$(printf '%s.%s' "$HEADER" "$PAYLOAD" | openssl dgst -sha256 -hmac "$SUPAVISOR_API_JWT_SECRET" -binary | b64url)
JWT="$HEADER.$PAYLOAD.$SIG"

curl -fsS -X PUT "http://127.0.0.1:4000/api/tenants/${SUPAVISOR_TENANT_ID}" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "tenant": {
    "db_host": "${NEON_HOST}",
    "db_port": 5432,
    "db_database": "${NEON_DB}",
    "ip_version": "auto",
    "enforce_ssl": false,
    "upstream_ssl": true,
    "require_user": true,
    "users": [
      {
        "db_user": "${NEON_USER}",
        "db_password": "${NEON_PASSWORD}",
        "pool_size": ${SUPAVISOR_POOL_SIZE},
        "mode_type": "transaction",
        "is_manager": true
      }
    ]
  }
}
JSON
echo
echo "Tenant '${SUPAVISOR_TENANT_ID}' registered."
echo "Vercel DATABASE_URL:"
echo "  postgresql://${NEON_USER}.${SUPAVISOR_TENANT_ID}:<NEON_PASSWORD>@<VPS_PUBLIC_IP>:6543/${NEON_DB}?pgbouncer=true&connection_limit=1"
