# KASPI POS (كسب) — Resource & Infrastructure Cost Matrix
**Target Cost Profile:** Zero-Cost Baseline Architecture ($0.00 / month on Production-Ready Free Tiers)
**Target Scaling Profile:** High Operating Margin at Scale (> 92%)

---

## 1. Cloud Infrastructure & Service Topology

| Provider / Tier | Component | Free Tier Quota | KASPI Usage | Effective Monthly Cost |
|---|---|---|---|---|
| **Vercel Hobby** | Next.js 15 Web & API Hosting | 100 GB Bandwidth, Edge middleware, serverless functions | Web Frontend, PWA, API endpoints | **$0.00 / mo** |
| **Neon Serverless** | Primary PostgreSQL Database | 0.5 GiB storage, auto-suspend, connection pooling | Relational data, RLS, audit logs, DGI sequences | **$0.00 / mo** |
| **Supabase Cloud** | Object Storage & Realtime WebSockets | 1 GB File Storage, 200 Realtime concurrent connections | Product images (`product-images` bucket), KDS realtime channels | **$0.00 / mo** |
| **Google Cloud / AI Studio** | Gemini Flash API (Multimodal) | 15 RPM, 1,500 RPD, free tier rate limits | Product visual onboarding & AI retail assistant | **$0.00 / mo** |
| **Groq Cloud** | Llama 3.3 70B & GPT-OSS | 30 RPM, generous token throughput | Ultra-fast retail function calling fallback | **$0.00 / mo** |
| **Cloudflare** | DNS & CDN Caching | Unlimited DNS, DDoS mitigation, free SSL | Domain routing, CDN edge static assets | **$0.00 / mo** |
| **GitHub Actions** | CI/CD & Windows Desktop Builds | 2,000 Linux/Windows build minutes per month | Automated testing, Tauri Windows MSVC `.exe` releases | **$0.00 / mo** |
| **Total Baseline** | **Full Multi-Tenant SaaS Stack** | — | — | **$0.00 / mo** |

---

## 2. Revenue & Unit Economics per Merchant Store

- **1 Device Base Subscription:** 200 MAD / month
- **Additional Devices:** +150 MAD / device / month
- **Average Store (2 Devices):** 350 MAD / month ($35 USD)
- **Direct Variable Hosting Cost per Store:** ~$0.25 USD / month
- **Gross Margin:** **> 98%** on software subscription revenue.
- **Card Fee Revenue:** 0.60% to 1.40% split share on GMV processed through physical CMI terminals.
