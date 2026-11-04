# KASPI POS — GLOBAL INFRASTRUCTURE COST ANALYSIS & FINOPS BLUEPRINT
**Document Version:** 1.0.0-OMEGA  
**Classification:** Financial & Engineering Architecture Specification  
**Exchange Reference:** 1 USD ≈ 10.00 MAD | 1 EUR ≈ 10.80 MAD  

---

## 1. EXECUTIVE SUMMARY

The KASPI Global Resource Fabric is engineered with strict **FinOps principles** to ensure hyper-efficient unit economics. By combining:
1. **Edge computing on client hardware** (Tauri desktop POS and offline Dexie database eliminate ~85% of standard cloud server queries),
2. **Generous perpetual cloud free tiers** (Cloudflare zero-egress R2, Neon serverless compute, Supabase storage/realtime),
3. **Optimized pooled PostgreSQL connections** (Supavisor connection pooling), and
4. **Targeted paid infrastructure upgrades** only when active store volume drives recurring SaaS subscription revenue,

KASPI achieves an industry-leading **gross infrastructure margin exceeding 91%** across all stages of business growth.

```
+-----------------------------------------------------------------------------------------+
|                              INFRASTRUCTURE UNIT MARGINS                                |
|                                                                                         |
|  Subscription Revenue (1 Store Pro Plan): 349.00 MAD / month ($34.90 USD)               |
|  Infrastructure Operating Cost (1 Store):    8.45 MAD / month ($0.845 USD)              |
|                                                                                         |
|  =============================================================================          |
|  GROSS SOFTWARE MARGIN: 97.58%                                                          |
|  =============================================================================          |
+-----------------------------------------------------------------------------------------+
```

---

## 2. DETAILED FINOPS PROFILES (SCALE RUNWAY)

### Profile A: Maximum Free-Tier Optimization (Bootstrapping & Development)
*Target: 1 to 50 Beta Stores | $0.00 to $5.00 USD / month (0 to 50 MAD / month)*

At this initial phase, the entire platform operates within verified perpetual free tiers.

| Provider / Resource | Quota Utilized | Raw List Cost | Actual Cost |
|---|---|---|---|
| **Vercel Hobby** | 100 GB Bandwidth, Edge Middleware, Static Hosting | $20.00 | **$0.00** |
| **Neon PostgreSQL Free** | 0.5 GiB Storage, Autosuspending Serverless Compute | $15.00 | **$0.00** |
| **Supabase Free Tier** | 500 MB Storage (Images), 200 Concurrent Realtime KDS Conns | $25.00 | **$0.00** |
| **Cloudflare Free / R2** | 10 GB Encrypted Disaster Recovery Backups, $0 Egress | $15.00 | **$0.00** |
| **Tauri Client Edge** | 50 Local Store Machines (Intel/AMD/ARM POS Terminals) | Distributed | **$0.00** |
| **Custom Domain & DNS** | Cloudflare Managed DNS + SSL | $0.00 | **$0.00** |
| **Domain Name Registration**| `.ma` commercial domain | $1.25/mo ($15/yr) | **$1.25** |
| **TOTAL MONTHLY RUNWAY** | **50 Stores Fully Operational** | **$71.25** | **$1.25 USD (12.50 MAD)** |

---

### Profile B: Low-Cost Production (1,000 Active Stores)
*Target: 1,000 Stores (Average 150 daily transactions/store = 4.5M monthly transactions)*

| Infrastructure Component | Architecture Allocation | Monthly Cost (USD) | Monthly Cost (MAD) |
|---|---|---|---|
| **Vercel Pro (Production)** | 1 Team Seat, 1TB Bandwidth, Fast Data Cache | $20.00 | 200.00 MAD |
| **Neon Launch Tier** | 10 GB Dedicated Storage, Auto-scaling Compute up to 4 CU | $19.00 | 190.00 MAD |
| **Supabase Pro Tier** | 100 GB Storage, 500 Realtime Connections, Daily Backups | $25.00 | 250.00 MAD |
| **Cloudflare Pro + R2** | Web Application Firewall (WAF) Rules + 50 GB R2 Storage | $25.00 | 250.00 MAD |
| **Upstash Redis (Serverless)** | Rate Limiting & Distributed Locking (10M requests) | $10.00 | 100.00 MAD |
| **Transactional Email (Resend)**| 50,000 Monthly Receipts & Password Resets | $20.00 | 200.00 MAD |
| **Telemetry (Sentry/BetterStack)**| Crash Reporting & Heartbeat Uptime Monitoring | $20.00 | 200.00 MAD |
| **TOTAL MONTHLY COST** | **1,000 Active Stores ($0.139 per store/mo)** | **$139.00** | **1,390.00 MAD** |

*Revenue Comparison:*  
1,000 stores × 199 MAD/mo (Basic Subscription) = **199,000 MAD / month ($19,900 USD)**.  
*Infrastructure Cost Ratio:* **0.69% of revenue** (Gross Margin: **99.31%**).

---

### Profile C: Standard SaaS Production (5,000 Active Stores)
*Target: 5,000 Stores (22.5M monthly transactions, Multi-Device POS + Kitchen Display)*

| Infrastructure Component | Architecture Allocation | Monthly Cost (USD) | Monthly Cost (MAD) |
|---|---|---|---|
| **Vercel Pro + Compute Overages**| Additional Serverless Invocation & Fast Cache Bandwidth | $120.00 | 1,200.00 MAD |
| **Neon Scale Tier** | 50 GB High-Throughput DB, Supavisor Connection Pooling | $150.00 | 1,500.00 MAD |
| **Supabase Pro + Compute Add-on**| 8 GB RAM Dedicated Instance for Realtime KDS Mesh | $85.00 | 850.00 MAD |
| **Cloudflare Enterprise WAF** | Advanced Moroccan Bot Mitigation, Rate Limiting, R2 | $75.00 | 750.00 MAD |
| **Upstash Redis Dedicated** | High-availability Cluster for active checkout locks | $50.00 | 500.00 MAD |
| **Resend Email / SMS Gateway** | 200,000 Invoices & SMS OTP authentication | $120.00 | 1,200.00 MAD |
| **Logtail / Datadog APM** | Centralized audit log streaming & latency tracing | $80.00 | 800.00 MAD |
| **TOTAL MONTHLY COST** | **5,000 Active Stores ($0.136 per store/mo)** | **$680.00** | **6,800.00 MAD** |

*Revenue Comparison:*  
5,000 stores × 299 MAD/mo (Blended ARPU) = **1,495,000 MAD / month ($149,500 USD)**.  
*Infrastructure Cost Ratio:* **0.45% of revenue** (Gross Margin: **99.55%**).

---

### Profile D: High-Availability Multi-Region (20,000 Active Stores)
*Target: 20,000 Stores (90M monthly transactions across Morocco, North Africa, Middle East)*

| Infrastructure Component | Architecture Allocation | Monthly Cost (USD) | Monthly Cost (MAD) |
|---|---|---|---|
| **Vercel Enterprise / Custom** | Multi-region edge deployment with guaranteed SLA | $500.00 | 5,000.00 MAD |
| **Neon Enterprise HA** | Read-replicas (Frankfurt, Madrid, Bahrain), 250 GB SSD | $850.00 | 8,500.00 MAD |
| **Supabase Enterprise Dedicated**| High-frequency WebSocket clusters for instant KDS delivery | $350.00 | 3,500.00 MAD |
| **Cloudflare R2 + Workers Edge** | Multi-TB encrypted vault archives, zero egress transfer | $220.00 | 2,200.00 MAD |
| **Hetzner Dedicated Disaster Node**| AMD EPYC 64GB Bare Metal for independent off-grid replica | $90.00 | 900.00 MAD |
| **Multi-Carrier SMS & Resend** | Wholesale SMS gateway (Maroc Telecom / Orange / Inwi) | $450.00 | 4,500.00 MAD |
| **Security & SIEM Monitoring** | Real-time intrusion detection and SOC audit pipeline | $250.00 | 2,500.00 MAD |
| **TOTAL MONTHLY COST** | **20,000 Active Stores ($0.135 per store/mo)** | **$2,710.00** | **27,100.00 MAD** |

---

### Profile E: Global Enterprise Multi-Cloud (100,000 Active Stores)
*Target: 100,000 Stores (450M monthly transactions worldwide)*

| Infrastructure Layer | Redundant Providers | Monthly Cost (USD) | Monthly Cost (MAD) |
|---|---|---|---|
| **Global Web & Edge Routing** | Vercel Enterprise + Cloudflare Anycast CDN | $2,200.00 | 22,000.00 MAD |
| **Primary Distributed Database** | Neon PostgreSQL Distributed Cluster + PgBouncer/Supavisor | $3,800.00 | 38,000.00 MAD |
| **Realtime KDS & Event Streaming**| Supabase Dedicated Clusters + Redis Pub/Sub Shards | $1,600.00 | 16,000.00 MAD |
| **Cold Storage & Vault Backups** | Cloudflare R2 + Oracle Cloud Always Free 200GB + Wasabi | $750.00 | 7,500.00 MAD |
| **Private Bare Metal Storage Nodes**| 3x Hetzner / OVH Dedicated Storage Clusters | $650.00 | 6,500.00 MAD |
| **Communication Infrastructure**| Twilio / Wholesale Telecom direct routes + SendGrid | $1,800.00 | 18,000.00 MAD |
| **Enterprise SIEM, Audit & 24/7 Ops**| Splunk Cloud / Datadog Enterprise with CNDP/GDPR vault | $1,400.00 | 14,000.00 MAD |
| **TOTAL MONTHLY COST** | **100,000 Stores ($0.122 per store/mo)** | **$12,200.00** | **122,000.00 MAD** |

*Revenue Comparison:*  
100,000 stores × 250 MAD/mo (Weighted ARPU) = **25,000,000 MAD / month ($2,500,000 USD)**.  
*Infrastructure Cost Ratio:* **0.49% of revenue** (Gross Software Margin: **99.51%**).

---

## 3. UNIT ECONOMICS BREAKDOWN

The fundamental strength of KASPI's unit economics is driven by the fact that the POS terminal itself executes barcode scanning, receipt calculation, inventory deductions, and local state management:

$$\text{Cloud Query Ratio} = \frac{\text{Sync Events}}{\text{Total Cashier Operations}} \approx \frac{1 \text{ batch}}{25 \text{ sales}} = 4\%$$

| Operation Type | Cloud Resource Incurred | Cost per Unit (USD) | Cost per Unit (MAD) |
|---|---|---|---|
| **1 Local Checkout & Cash Sale** | 0 Cloud Calls (Local Tauri + Dexie) | **$0.000000** | **0.000000 MAD** |
| **1 Cloud Sales Sync Batch (25 orders)** | Vercel Serverless + Neon DB Insert | **$0.000018** | **0.000180 MAD** |
| **1 Realtime KDS Ticket Dispatch** | Supabase WebSocket Message payload | **$0.000004** | **0.000040 MAD** |
| **1 Customer Loyalty SMS Balance Alert**| Local SMS Gateway / Wholesale SMS | **$0.015000** | **0.150000 MAD** |
| **1 Full Nightly Encrypted Store Backup**| AES-256-GCM + Cloudflare R2 PUT | **$0.000045** | **0.000450 MAD** |
| **1 AI Supplier Invoice OCR Scan** | Groq Llama-3 Vision / Community Edge Node | **$0.000550** | **0.005500 MAD** |

---

## 4. PRICING TIERS & GROSS MARGIN ANALYSIS

KASPI's SaaS business model provides high value to Moroccan retail merchants while generating recurring subscription cash flow:

| Subscription Plan | Monthly Price (MAD) | Monthly Cost per Tenant | Net Gross Profit | Gross Margin |
|---|---|---|---|---|
| **Starter (1 POS Terminal)** | 149.00 MAD ($14.90) | 1.39 MAD ($0.139) | **147.61 MAD** | **99.07%** |
| **Standard (2 POS + 1 KDS)** | 249.00 MAD ($24.90) | 2.50 MAD ($0.250) | **246.50 MAD** | **99.00%** |
| **Business Plus (Multi-Branch)** | 499.00 MAD ($49.90) | 5.20 MAD ($0.520) | **493.80 MAD** | **98.96%** |
| **Enterprise Chain (20+ Stores)**| Custom (from 2,500 MAD) | 28.00 MAD ($2.800) | **2,472.00 MAD** | **98.88%** |

---

## 5. TOP 5 CLOUD COST TRAPS & AUTOMATED MITIGATIONS

1. **Trap: Unbounded Serverless Invocations on Polling**
   *Risk:* POS clients polling `/api/orders` every second creates $86,400 \times 1,000 = 86.4M$ requests/day, costing hundreds of dollars.  
   *KASPI Fix:* Instant WebSockets via Supabase Realtime replace all polling; local polling is strictly forbidden in code review.
2. **Trap: Neon Unpooled Connection Exhaustion**
   *Risk:* Serverless functions opening direct PostgreSQL connections exhaust DB connection limits and incur high memory overhead.  
   *KASPI Fix:* All serverless routes connect through Neon's transaction pooler (Supavisor) on port 6543 with query caching.
3. **Trap: Cloud Storage Egress Fee Shock**
   *Risk:* AWS S3 charges $0.09/GB for data egress. Restoring backups or serving images scales egress costs uncontrollably.  
   *KASPI Fix:* Cloudflare R2 charges $0.00 per GB egress globally, saving 100% of data egress costs.
4. **Trap: Heavy AI LLM Costs on Routine POS Tasks**
   *Risk:* Routing simple barcode classification through expensive commercial models ($0.03/request) destroys margins.  
   *KASPI Fix:* Tiered routing: Regex dictionary first (cost $0) $\rightarrow$ Groq Fast Free Tier $\rightarrow$ Contributor Nodes $\rightarrow$ Paid Fallback.
5. **Trap: Inefficient Image Storage**
   *Risk:* Store owners uploading raw 12MB smartphone camera photos for menu items exhausts storage quotas.  
   *KASPI Fix:* Client-side browser Canvas/WebP compression converts images to $< 120\text{ KB}$ WebP before upload to Supabase bucket.
