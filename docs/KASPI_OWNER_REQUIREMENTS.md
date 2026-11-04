# KASPI POS — PLATFORM OWNER REQUIREMENTS & OPERATIONAL CHECKLIST
**Document Version:** 1.0.0-OMEGA  
**Target Audience:** Platform Founder, Managing Director, and Operations Lead  
**Language:** English (Clear, Actionable, Non-Technical / Semi-Technical)  

---

## 1. EXECUTIVE WELCOME & OVERVIEW

Congratulations on launching **KASPI POS (كسب)**.  
The core software is engineered, hardened, and tested to world-class standards. This document is your comprehensive operational guide detailing everything you need to create, configure, and maintain your live production environment.

No deep programming knowledge is required to complete this setup. Follow each section step by step.

---

## 2. CLOUD & THIRD-PARTY ACCOUNTS TO SET UP

All services recommended below provide **generous free tiers** that cost $0.00 to set up initially, scaling only as your paid store subscribers grow.

| Service | Purpose | Free Tier Quota | Registration Link |
|---|---|---|---|
| **Vercel** | Hosts the web app, API endpoints, and admin dashboard | 100 GB bandwidth, unlimited deploys | [vercel.com/signup](https://vercel.com/signup) |
| **Neon** | Primary cloud database (Serverless PostgreSQL) | 0.5 GB storage, autoscaling compute | [neon.tech](https://neon.tech) |
| **Supabase** | Product image storage & instant Kitchen Display (KDS) sync | 500 MB storage, 200 realtime connections | [supabase.com](https://supabase.com) |
| **Cloudflare** | Domain DNS, security shield, and zero-cost disaster backups (R2) | Unlimited DNS, DDoS protection, 10 GB R2 | [cloudflare.com](https://cloudflare.com) |
| **Resend** | Transactional receipt emails and password reset emails | 3,000 emails / month free | [resend.com](https://resend.com) |
| **YouCan Pay / CMI** | Moroccan card payments & TPE terminal integration | Pay-as-you-go per transaction | [youcanpay.com](https://youcanpay.com) |

---

## 3. MASTER ENVIRONMENT SECRETS CHECKLIST

These configuration keys must be added into your **Vercel Project Settings $\rightarrow$ Environment Variables** before pushing to production:

```env
# ==============================================================================
# 1. APPLICATION & AUTHENTICATION (NEXTAUTH)
# ==============================================================================
NEXTAUTH_URL=https://app.kaspi.ma
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=generate_a_secure_random_string_here_32_chars

# ==============================================================================
# 2. NEON CLOUD DATABASE (PRIMARY)
# ==============================================================================
# Use the pooled connection string (port 6543) for serverless performance:
DATABASE_URL="postgresql://neondb_owner:password@ep-kaspi-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
# Direct connection for schema migrations (Prisma migrate):
DIRECT_URL="postgresql://neondb_owner:password@ep-kaspi.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# ==============================================================================
# 3. SUPABASE (IMAGES & REALTIME KDS)
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://tqoqsgaymygmgqrzddvtu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key

# ==============================================================================
# 4. CLOUDFLARE R2 (ZERO-EGRESS DISASTER RECOVERY BACKUPS)
# ==============================================================================
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=kaspi-pos-uploads
R2_ENDPOINT=https://your_cloudflare_account_id.r2.cloudflarestorage.com
NEXT_PUBLIC_R2_PUBLIC_URL=https://cdn.kaspi.ma

# ==============================================================================
# 5. TRANSACTIONAL EMAIL (RESEND)
# ==============================================================================
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM=KASPI POS <noreply@kaspi.ma>

# ==============================================================================
# 6. PAYMENT PROCESSORS (MOROCCO & INTERNATIONAL)
# ==============================================================================
YOUCANPAY_PRIVATE_KEY=your_youcanpay_private_key
YOUCANPAY_PUBLIC_KEY=your_youcanpay_public_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

---

## 4. RECOMMENDED STORE HARDWARE SPECIFICATIONS

For your sales team when recommending hardware to Moroccan shop owners (grocery stores, cafes, bakeries, fashion boutiques):

### Recommended POS Terminal Hardware:
- **Option A (Desktop PC or All-in-One POS):**
  - Processor: Intel Core i3 or Celeron J4125 / N5095 (or better).
  - RAM: 4 GB minimum (8 GB recommended).
  - Storage: 120 GB SSD.
  - OS: Windows 10/11 (64-bit) or Ubuntu Linux 22.04 LTS.
- **Option B (Tablet / Touchscreen):**
  - Windows Touchscreen All-In-One (e.g., Elo Touch, Posiflex) or Android Tablet with Chrome.

### Certified Peripherals (Plug-and-Play):
1. **Thermal Receipt Printers (80mm or 58mm):**
   - *USB / Network:* Epson TM-T20III, Xprinter XP-N160II, Xprinter XP-Q800, Bixolon SRP-330.
   - *Protocol:* Standard ESC-POS (Supported natively by KASPI).
2. **Barcode Scanners:**
   - Any 1D/2D USB Barcode Scanner operating in Keyboard HID mode (e.g., Honeywell Voyager, Netum NT-1228, Zebra DS2208).
   - Supports Moroccan and international EAN-13, EAN-8, UPC, Code 128, and QR codes.
3. **Cash Drawer:**
   - Standard metal cash drawer with RJ11 connector plugged directly into the thermal printer.
   - Automatically kicks open on cash sale completion.
4. **Power Protection (Crucial for Moroccan Retail):**
   - 650VA to 1000VA Uninterruptible Power Supply (UPS / Onduleur) such as APC or Eaton (~400 to 700 MAD) to keep the POS register running during neighborhood power cuts.

---

## 5. FIRST-DAY MERCHANT ONBOARDING CHECKLIST

Follow these steps when bringing a new store onto KASPI POS:

1. **Create Store Account:**
   - Navigate to `https://app.kaspi.ma/register`.
   - Enter Store Name, Owner Email, Password, and Phone Number.
   - The system automatically provisions an isolated database tenant, default categories (Food, Drinks, General), and standard Moroccan VAT tax rates (20%, 14%, 10%, 7%, 0%).
2. **Import or Add Products:**
   - Bulk upload existing inventory using CSV file (`Products -> Import CSV`), or scan barcodes directly to add items in seconds.
3. **Download Desktop POS App:**
   - Download the Windows installer (`kaspi-pos-setup.exe`) from the dashboard download link.
   - Install and log in once. The offline database automatically downloads and caches the entire store catalog.
4. **Connect Printer:**
   - Plug the thermal printer via USB. Run a test receipt from **Settings $\rightarrow$ Printers $\rightarrow$ Print Test Receipt**.
5. **Start Selling!**
   - The cashier can scan items and process sales immediately with or without internet.
