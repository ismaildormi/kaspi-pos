# KASPI POS (كسب) — Master Required API Keys & Configuration Checklist

This checklist documents every single environment variable required to run KASPI POS in 100% production mode with zero ongoing infrastructure costs.

---

## Master API Keys Table

| Variable Name | Category | Description | Where to Get It (Portal URL) | Free / Paid Tier Status | Required vs Optional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Database | Neon Serverless PostgreSQL connection string (Pooled with Supavisor) | [https://console.neon.tech](https://console.neon.tech) | **100% Free** (0.5GB, autoscaling, 100+ branches) | **REQUIRED** |
| `DIRECT_URL` | Database | Direct connection string for Prisma migrations and schema push | [https://console.neon.tech](https://console.neon.tech) | **100% Free** | **REQUIRED** |
| `NEXTAUTH_SECRET` | Authentication | Cryptographic key (32+ chars) used to sign and encrypt JWT session tokens | Run: `openssl rand -hex 32` | **Free (Local)** | **REQUIRED** |
| `NEXTAUTH_URL` | Authentication | Base URL of your deployed application (e.g. `https://kaspi-pos.vercel.app`) | Your deployment dashboard | **Free** | **REQUIRED** |
| `APP_SECRET` | Security | Secondary master secret for internal HMAC signatures and webhook hashing | Run: `openssl rand -hex 32` | **Free (Local)** | **REQUIRED** |
| `NEXT_PUBLIC_APP_URL` | Application | Public domain exposed to the browser client and receipt QR codes | Your custom domain or Vercel URL | **Free** | **REQUIRED** |
| `NODE_ENV` | Environment | Runtime environment mode (`production` or `development`) | Configured in deployment settings | **Free** | **REQUIRED** |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Artificial Intelligence | Google Gemini API Key for multimodal receipts, voice, and chat | [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | **100% Free Tier** (15 RPM, 1M TPM) | **REQUIRED for AI** |
| `GOOGLE_API_KEYS` | Artificial Intelligence | Comma-separated Gemini key pool for automatic quota rotation | [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | **100% Free Tier** | Optional (Failover) |
| `GROQ_API_KEY` | Artificial Intelligence | Ultra-fast LPU inference API key (LLaMA 3.3 70B & gpt-oss) | [https://console.groq.com/keys](https://console.groq.com/keys) | **100% Free Tier** (30 RPM, 14.4k RPD) | Highly Recommended |
| `GROQ_API_KEYS` | Artificial Intelligence | Comma-separated Groq key pool for failover rotation | [https://console.groq.com/keys](https://console.groq.com/keys) | **100% Free Tier** | Optional (Failover) |
| `MISTRAL_API_KEY` | Artificial Intelligence | Mistral AI API Key for French/Arabic parsing and vision fallback | [https://console.mistral.ai/api-keys/](https://console.mistral.ai/api-keys/) | **Free Experimenter Tier** | Optional (Failover) |
| `TOGETHER_API_KEY` | Artificial Intelligence | Together AI API key for open-source model failover | [https://api.together.xyz/settings/api-keys](https://api.together.xyz/settings/api-keys) | **Free Credits on Signup** | Optional (Failover) |
| `OPENROUTER_API_KEY` | Artificial Intelligence | Universal gateway to 100+ AI models fallback | [https://openrouter.ai/keys](https://openrouter.ai/keys) | **Free models available** | Optional (Fallback) |
| `LOCAL_AI_BASE_URL` | Artificial Intelligence | Self-hosted Ollama/vLLM endpoint (e.g., `http://localhost:11434/v1`) | Self-hosted on local GPU | **100% Free & Offline** | Optional |
| `LOCAL_AI_MODEL` | Artificial Intelligence | Model ID for local GPU (e.g., `llama3.2` or `mistral`) | Local Ollama library | **100% Free** | Optional |
| `UPSTASH_REDIS_REST_URL` | Rate Limiting & Cache | Serverless Redis REST endpoint for distributed rate-limiting | [https://console.upstash.com/redis](https://console.upstash.com/redis) | **100% Free** (10,000 commands/day) | Recommended (In-memory fallback built-in) |
| `UPSTASH_REDIS_REST_TOKEN` | Rate Limiting & Cache | Secret token for Upstash Redis REST access | [https://console.upstash.com/redis](https://console.upstash.com/redis) | **100% Free** | Required if Upstash is used |
| `TRIGGER_API_URL` | Background Jobs | Trigger.dev v3 background task scheduler endpoint | [https://cloud.trigger.dev](https://cloud.trigger.dev) (or self-hosted) | **100% Free** (10k runs/month free) | Optional (Async jobs) |
| `TRIGGER_SECRET_KEY` | Background Jobs | API Secret key from your Trigger.dev project | [https://cloud.trigger.dev](https://cloud.trigger.dev) | **100% Free** | Optional |
| `TRIGGER_PROJECT_ID` | Background Jobs | Project identifier from Trigger.dev dashboard | [https://cloud.trigger.dev](https://cloud.trigger.dev) | **100% Free** | Optional |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Cloud | Supabase Project URL (`https://tqoqsgaymygmgqrzddvtu.supabase.co`) | [https://supabase.com/dashboard](https://supabase.com/dashboard) | **100% Free Tier** (1GB storage, 50k Realtime msgs) | **ACTIVE** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Cloud | Supabase Public Publishable Anon Key for client storage & Realtime subscriptions | [https://supabase.com/dashboard](https://supabase.com/dashboard) | **100% Free Tier** | **ACTIVE** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Cloud | Supabase Secret Service Role Key for server-side admin operations | [https://supabase.com/dashboard](https://supabase.com/dashboard) | **100% Free Tier** | **ACTIVE** |
| `R2_ACCESS_KEY_ID` | Object Storage | Cloudflare R2 S3-compatible Access Key ID | [https://dash.cloudflare.com/?to=/:account/r2](https://dash.cloudflare.com/?to=/:account/r2) | **100% Free** (10 GB storage, 10M reads/mo) | Recommended |
| `R2_SECRET_ACCESS_KEY` | Object Storage | Cloudflare R2 Secret Access Key | [https://dash.cloudflare.com/?to=/:account/r2](https://dash.cloudflare.com/?to=/:account/r2) | **100% Free** | Recommended |
| `R2_BUCKET_NAME` | Object Storage | R2 Bucket Name (e.g., `kaspi-pos-uploads`) | Cloudflare R2 Dashboard | **100% Free** | Recommended |
| `R2_ENDPOINT` | Object Storage | S3 endpoint URL (`https://<account-id>.r2.cloudflarestorage.com`) | Cloudflare R2 Bucket Details | **100% Free** | Recommended |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Object Storage | Public URL domain for media (`https://pub-<id>.r2.dev`) | Cloudflare R2 Public Access | **100% Free** | Recommended |
| `YOUCANPAY_PRIVATE_KEY` | Moroccan Payments | Private API Key for Moroccan credit/debit card processing (MAD) | [https://youcanpay.com/](https://youcanpay.com/) | Standard processing fee (no monthly fee) | Required for MAD Cards |
| `YOUCANPAY_PUBLIC_KEY` | Moroccan Payments | Public Key for Moroccan payment checkout widget | [https://youcanpay.com/](https://youcanpay.com/) | Standard processing fee (no monthly fee) | Required for MAD Cards |
| `PADDLE_API_KEY` | Global Payments | Paddle Billing API key for international cards & subscriptions | [https://vendors.paddle.com/authentication](https://vendors.paddle.com/authentication) | Merchant of Record fee (no monthly fee) | Required for USD/EUR Cards |
| `PADDLE_WEBHOOK_SECRET` | Global Payments | Secret for verifying incoming Paddle subscription webhooks | Paddle Developer Webhook settings | **Free** | Required for Paddle Webhooks |
| `HYPERSWITCH_API_URL` | Unified Payments | Hyperswitch unified router endpoint (`https://sandbox.hyperswitch.io` or Docker) | [https://hyperswitch.io](https://hyperswitch.io) | **Open Source / Free Self-Hosted** | Optional |
| `HYPERSWITCH_API_KEY` | Unified Payments | API key for Hyperswitch payment orchestration | Hyperswitch Control Center | **Open Source** | Optional |
| `WHATSAPP_API_PROVIDER` | Messaging | WhatsApp provider (`evolution-api` / `wasender` / `infobip`) | Self-hosted Docker on Oracle VPS | **100% Free** (Self-hosted Evolution API) | Recommended |
| `WHATSAPP_API_TOKEN` | Messaging | API Token for WhatsApp instance authentication | Evolution API Manager | **100% Free** | Recommended |
| `WHATSAPP_INSTANCE_ID` | Messaging | Instance identifier for merchant's connected WhatsApp number | Evolution API Manager | **100% Free** | Recommended |
| `ADMIN_WHATSAPP_NUMBER` | Messaging | Super-admin emergency WhatsApp phone number (with country code e.g. `212600000000`) | Personal or business WhatsApp | **Free** | Optional |

---

## Zero-Downtime Graceful Fallbacks

Even if you only fill the bare minimum keys (`DATABASE_URL`, `NEXTAUTH_SECRET`, `APP_SECRET`, and `GOOGLE_GENERATIVE_AI_API_KEY`), the entire application functions flawlessly without 500 errors:
- **Missing Redis?** Internal in-memory sliding window rate-limiter activates automatically.
- **Missing Cloudflare R2?** Built-in storage engine automatically falls back to Base64 data URLs.
- **Missing Trigger.dev?** Synchronous background handlers execute in Next.js Serverless runtime.
- **Missing Payment Gateways?** Interactive simulation and manual cash/bank transfer checkout modes remain active.
