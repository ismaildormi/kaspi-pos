# KASPI POS (كسب) — Zero-Downtime Deployment & Infrastructure Guide
**Target Platforms:** Vercel (Web / API), Neon (Database), Supabase (Storage & Realtime), GitHub Releases (Desktop .exe)
**Environment:** Node.js 20+, Rust 1.85+, Next.js 15 App Router

---

## 1. Environment Variable Configuration

Ensure the following variables are configured in Vercel Project Settings:

```bash
# Database (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-host.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth v5 Authentication
AUTH_SECRET="generated_32_byte_secret"
NEXTAUTH_URL="https://kaspi-pos.vercel.app"

# Supabase (Storage & Realtime)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_public_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_secret_key"

# AI Provider Gateway Pool (Optional BYOK)
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_key"
GROQ_API_KEY="your_groq_key"
```

---

## 2. Production Build & Deployment Pipeline

```bash
# 1. Database Schema Synchronization
npx prisma generate
npx prisma db push

# 2. Compile Verification
npm run typecheck
npm run build

# 3. Windows Desktop Executable Build (Tauri)
cargo tauri build --target x86_64-pc-windows-msvc
```

---

## 3. GitHub Actions Automated Desktop Release (`.github/workflows/build.yml`)

When a tag is pushed or workflow dispatched:
1. Runs `npm run build` to verify web assets.
2. Compiles Tauri desktop binary using Windows runner.
3. Automatically renames binary to `kaspi-pos-setup.exe`.
4. Uploads to GitHub Release via `softprops/action-gh-release@v2`.
5. Direct one-click download is served from:
   `https://github.com/ismaildormi/kaspi-pos/releases/latest/download/kaspi-pos-setup.exe`
