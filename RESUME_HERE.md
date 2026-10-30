# KASPI POS (كسب) — RESUME HERE & TESTING GUIDE

Welcome to **KASPI POS**, an Enterprise-grade, multi-tenant Point of Sale and ERP SaaS tailored for Moroccan and international retail/grocery/restaurant businesses.

---

## 1. Quick Start (Local Development)

### Prerequisites
- Node.js 20+ / 22+
- Docker & Docker Compose
- Git

### Commands to Run:
```bash
# 1. Start PostgreSQL (Port 5432)
docker compose up -d

# 2. Apply all database migrations
npx prisma migrate deploy

# 3. Start the Next.js development server
npm run dev
```

The application will be accessible at:
👉 **[http://localhost:3000](http://localhost:3000)** (Default redirects to Arabic RTL or selected language)
- French: **[http://localhost:3000/fr/login](http://localhost:3000/fr/login)**
- Arabic: **[http://localhost:3000/ar/login](http://localhost:3000/ar/login)**
- English: **[http://localhost:3000/en/login](http://localhost:3000/en/login)**

---

## 2. Step-by-Step End-to-End Testing Guide

### A. Register an Account & Tenant Setup
1. Open [http://localhost:3000/fr/register](http://localhost:3000/fr/register).
2. Enter your business details:
   - **Company / Shop Name:** e.g., `Superette Anfa`
   - **Your Name:** e.g., `Amine Alaoui`
   - **Email:** e.g., `amine@example.com`
   - **Password:** e.g., `Password123!`
3. Click **"Créer mon compte"**.
4. *Behind the scenes:* A new `Tenant`, a primary `Store`, and an `Owner` membership are atomically created in PostgreSQL. You will be redirected to the POS / Dashboard.

### B. Add Products (Manual & Smart CSV Migration)
1. **Manual / AI Onboarding:**
   - Go to [http://localhost:3000/fr/dashboard/products/ai-onboard](http://localhost:3000/fr/dashboard/products/ai-onboard).
   - Upload any product photo or packaging: Gemini Vision analyzes the name, category, EAN barcode, and estimated Moroccan retail/cost price in MAD with 1-click save.
2. **Smart CSV Import:**
   - Go to [http://localhost:3000/fr/dashboard/products/import](http://localhost:3000/fr/dashboard/products/import).
   - Click **"Télécharger le modèle CSV"** to get a sample template, or drop an existing CSV (supporting Caissa, POSNEX, and Excel formats in FR, AR, or EN).
   - Review the instant preview table (valid rows vs conflicts/duplicates).
   - Click **"Confirmer l'importation"** to atomically ingest the products, auto-create missing categories, and seed store inventory.

### C. Test POS Screen & Sale Checkout
1. Navigate to the POS screen: [http://localhost:3000/fr/pos](http://localhost:3000/fr/pos).
2. Filter categories with the pill buttons or scan/search a barcode.
3. Tap or click products to add them to the cart.
4. Press `F2` or click the green **"Encaisser"** button.
5. Select a payment method:
   - **Espèces (Cash):** Enter tendered amount (e.g., 100 DH) or click quick chips (`+20`, `+50`, `Exact`).
   - **Carte Bancaire (Card):** Instant card payment.
   - **Crédit Client (Krediat):** Attaches debt to selected customer.
6. Click **"Confirmer le paiement"**:
   - The sale is recorded immediately in PostgreSQL (or saved to the Dexie.js offline outbox if offline).
   - Click **"Aperçu du ticket"** to view the thermal receipt (with QR code and legal ICE info).
   - Click **"Envoyer le ticket par WhatsApp"**: Generates a pre-formatted WhatsApp message link with an itemized breakdown.

### D. Test the AI Business Advisor
1. In the bottom-right corner of the POS screen or Dashboard, click the floating **AI Chat Widget**.
2. Ask any question in Arabic, Darija, French, or English:
   - *"Quel est mon chiffre d'affaires aujourd'hui ?"*
   - *"Quels sont mes produits en rupture de stock ?"*
   - *"شكون هوما أكثر المنتجات مبيعا؟"*
3. The AI Router queries real-time database stats using function calling and responds with zero latency.

### E. Test Billing & Subscription Upgrades
1. Go to [http://localhost:3000/fr/dashboard/billing](http://localhost:3000/fr/dashboard/billing).
2. Click **"Passer à l'offre Pro"**:
   - Choose **"Carte Marocaine (YouCan Pay)"**: Redirects to the local Moroccan payment gateway sandbox.
   - Choose **"Carte Internationale (Paddle)"**: Redirects to the Merchant of Record sandbox.
3. Completing the simulated payment triggers the webhook (`/api/webhooks/youcanpay` or `/api/webhooks/paddle`), which updates your tenant subscription status to `ACTIVE`.

---

## 3. Git Push Instructions (New GitHub Repository)

All sensitive environment files (`.env`) are excluded in `.gitignore`. Follow these commands to push the codebase to your GitHub repository:

```bash
# 1. Inside C:\Users\hicha\.gemini\antigravity\scratch\pos-saas-morocco
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git branch -M master
git push -u origin master
```

---

## 4. Production Deployment to Oracle Cloud (Always Free)

Refer to [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full instructions:
```bash
# On your Oracle Cloud VM (Ubuntu 24.04 ARM64):
git clone <YOUR-REPO-URL> /opt/pos-saas
cd /opt/pos-saas
cp .env.example .env
# Fill in your production environment variables

# Start containers with Docker Compose:
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations:
docker exec -it kaspi_pos_app npx prisma migrate deploy
```
