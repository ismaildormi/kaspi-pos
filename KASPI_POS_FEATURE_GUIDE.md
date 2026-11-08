# KASPI POS (كسب) — COMPLETE FEATURE & MODULE GUIDE

> **Platform:** KASPI POS / ZUVYR Ecosystem (`https://kaspi-pos.vercel.app`)  
> **Target Markets:** Morocco (`MAD`), MENA (`SAR`, `AED`), Europe (`EUR`), Turkey (`TRY`), International (`USD`)  
> **Supported Interface & Receipt Languages:** Arabic (`ar`), French (`fr`), English (`en`), Turkish (`tr`), Spanish (`es`), German (`de`)

---

## 1. Universal Store-Type Dynamic Onboarding Engine
Upon initial login (or via the **"Secteur Métier • تخصيص المتجر"** switcher in the Dashboard and POS Header), KASPI POS dynamically configures the merchant's workspace across **4 specialized industry modes**:

### A. Grocery & Supermarket (`grocery` — متجر بقالة / سوبرماركت)
- **Barcode Scanner Priority:** Instant `<15ms` USB/Bluetooth HID barcode scanning (`ProductSearch.tsx`) with automatic cart increment and sound/toast feedback.
- **Digital Weight Scale Calculator (`IndustryWorkspaceModal.tsx`):** One-click weight presets (`250g`, `500g`, `750g`, `1 Kg`, `1.5 Kg`, `2 Kg`) or custom gram input that automatically calculates fractional kilogram quantities (`Decimal(12, 3)`) and tags the cart item (`Poids pesé: 500g (0.5 Kg)`).
- **Thermal Barcode Label Studio (`40x30mm`):** Generates and prints crisp SVG EAN-13 / Code128 adhesive shelf/product stickers with store name, product title, price in `MAD`, and barcode bars.

### B. Restaurant, Cafe & Fast-Food (`restaurant` — مطعم / مقهى / سناك)
- **Interactive Dining Table Grid (`DiningTable`):** Visual floor plan (`T-01` to `T-06` + `Comptoir / À Emporter`) showing table capacity and live occupancy (`Libre` vs `Occupée`).
- **Real-Time Kitchen Display System (`KDS` — `/api/v1/kds`):** Send active POS cart items directly to the kitchen screen (`KDS-xxxxx`). Kitchen staff track and advance tickets through `new` → `in_progress` → `ready` → `served` (automatically freeing the dining table when served).
- **Dish Modifiers & Cooking Notes:** One-click modifier pills (`Sans Oignon • بدون بصل`, `Extra Fromage • جبن إضافي`, `Piquant (Harissa) • حار`, `Sans Sucre • بدون سكر`, `Bien Cuit • مطهو جيداً`) printed on both the kitchen ticket and customer receipt.

### C. Clothing, Fashion & Footwear (`fashion` — محل ملابس وأحذية)
- **Size & Color Matrix Selector (`IndustryWorkspaceModal.tsx`):** Interactive size matrix (`XS`, `S`, `M`, `L`, `XL`, `XXL` + Footwear sizes `38`–`44`) and color swatch selector (`Noir`, `Blanc`, `Bleu Marine`, `Beige`, `Émeraude`, `Bordeaux`) that attaches exact variant metadata (`Taille: L | Couleur: Noir`) to the sale line item and receipt.

### D. Electronics & General Retail (`electronics` — تجارة عامة / إلكترونيات)
- **Serial Number / IMEI Scanner & Warranty Certificate:** Captures device `IMEI / Serial Number` and attaches an official `6 Mois`, `12 Mois`, or `24 Mois` warranty certificate directly under the product line on the thermal receipt.

---

## 2. Point of Sale (POS) Terminal & Checkout (`/[locale]/pos`)
- **Offline-First Dexie.js Engine (`src/client/db.ts` & `src/client/sync-engine.ts`):** Continues operating at 100% speed during internet outages. Sales, stock deductions, and customer credit updates queue locally in IndexedDB (`syncQueue`) and automatically sync to `https://kaspi-pos.vercel.app/api/v1` with idempotency protection (`sale_<UUID>`) once connectivity returns.
- **Multi-Mode Payments (`CheckoutModal.tsx`):**
  - **Cash (Espèces):** Quick denomination chips (`Exact`, `+20 DH`, `+50 DH`, `+100 DH`, `+200 DH`) and automatic change calculation.
  - **Card / TPE CMI:** Automatic TPE fee breakdown (`calculatePaymentFees`) based on active device tier.
  - **Customer Credit (`Carnet / الكريدي`):** Atomic credit balance tracking (`CustomerCredit` ledger + `currentCreditBalance`) with credit limit enforcement.
- **Customer Loyalty Points Engine (`CartPanel.tsx` & `/api/v1/sales`):**
  - Automatically awards **1 loyalty point per 10 MAD** spent (`LoyaltyPoint` ledger `reason: "earn"`).
  - Instant 1-click **Loyalty Redemption** in the POS cart (`⭐ Utiliser X pts (-Y.YY DH)`, where `10 pts = 1 MAD`).
- **Hold / Park Orders (`HeldCartsModal.tsx`):** Park active carts to serve another customer in line and resume them with one click.
- **WhatsApp Digital Receipt (`src/lib/whatsapp.ts`):** Send formatted itemized receipts directly to the customer's WhatsApp number after checkout.

---

## 3. Cash Drawer Shift Management & X/Z Financial Closing (`CashShiftModal.tsx`)
- **Opening Float (`Fond de Caisse`):** Cashiers open a shift by declaring the starting drawer float (`openingCash`).
- **Petty Cash Movements (`Entrée / Sortie de Caisse`):** Record intermediate cash additions (`cash_in`) or supplier/expense payouts (`cash_out`) with mandatory reason audit notes.
- **Live X-Report (`Rapport X — Lecture Intermédiaire`):** Real-time snapshot of `Opening Float + Cash Sales - Cash Refunds + Cash In - Cash Out = Expected Drawer Cash`, plus Card (`TPE`), Credit (`Carnet`), and Transfer breakdowns without closing the shift.
- **End-of-Day Z-Report (`Rapport Z — Clôture Définitive`):** Cashier enters physical counted cash (`closingCashCounted`), computes exact variance (`Écart de Caisse`: `0.00` Perfect, `+Surplus`, or `-Shortage`), locks the `CashSession` in Neon PostgreSQL, and prints the thermal X/Z report (`80mm`/`58mm`).

---

## 4. Global 6-Language Thermal Receipt Engine (`ThermalReceipt.tsx` & `src-tauri`)
- **6 Built-In Receipt Languages:** Arabic (`ar` with RTL layout), French (`fr`), English (`en`), Turkish (`tr`), Spanish (`es`), and German (`de`).
- **Strict Western Numerals (`0-9`):** All dates, prices, quantities, tax rates, and totals are normalized through `toWesternNumerals()` so Arabic receipts always print clear `0123456789` digits.
- **Dual Paper Widths:** `80mm` standard desktop thermal printer & `58mm` compact handheld/TPE thermal roll.
- **Multi-Transport Hardware Bridge:** Native Rust `src-tauri` ESC/POS raw TCP/IP (`Port 9100`), USB/Serial (`COM`/`/dev/usb/lp0`), and browser `window.print()` fallback with automatic RJ11 cash drawer pulse (`0x1B 0x70`).

---

## 5. ERP Back-Office, Inventory, Suppliers & AI Assistant (`/[locale]/dashboard/*`)
- **Catalog & Excel/CSV Import (`/dashboard/products` & `/dashboard/products/import`):** Manage SKUs, EAN-13 barcodes, purchase/sale prices, TVA rates (`0%`, `7%`, `10%`, `14%`, `20%`), and bulk import thousands of products via CSV/Excel.
- **Inventory & Stock Ledger (`/dashboard/inventory`):** Real-time stock levels, low-stock alerts, manual stock adjustments, and immutable `StockMovement` audit history.
- **Customer Credit Ledger (`/dashboard/customers`):** Full `Carnet de Crédit` management with partial/full debt repayment (`Encaisser Règlement`) and payment receipts.
- **Suppliers & Purchase Orders (`/dashboard/suppliers`):** Manage B2B suppliers (`ICE`, contact info) and receive stock replenishments.
- **Financial Reports & Analytics (`/dashboard/reports`):** Revenue, profit margins, tax summaries, and payment method breakdowns.
- **Secure Authentication & Gmail OTP (`OtpVerification.tsx` & `mailer.ts`):**
  - Live Gmail SMTP (`kaspipos.official@gmail.com` over SSL Port 465) delivers 6-digit verification and password-reset codes.
  - Full clipboard paste (`Ctrl+V` / `Cmd+V`) support across the 6 OTP boxes and native browser `PasswordCredential` saving.
- **AI Business Assistant (`"مساعد كسب الذكي"` — `AIChatWidget.tsx`):** Strictly isolated to authenticated workspace pages (hidden on `/login`, `/register`, `/forgot-password`, and public routes).
