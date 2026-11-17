# KASPI POS (كسب) — Thermal Receipt Architecture & Client-Side Vector Code Generation

**Document Version:** 2.4.0  
**Classification:** Fiscal Print Engineering, Vector Graphics & Cryptographic Barcode Generation  
**Source Implementation:** `src/components/pos/ThermalReceipt.tsx`, `src/client/printing/index.ts`, `src/lib/tpe/client-codes.ts`

---

## 1. Thermal Receipt Engineering & Visual Hygiene

Thermal receipts represent the physical face of the store. A cluttered, redundant, or confusing receipt damages merchant credibility. KASPI POS enforces **strict visual hygiene and fiscal compliance**:

```
+------------------------------------------+
|             KASPI SHOWROOM               |  <- Store Name printed ONCE only
|          Bd d'Anfa, Casablanca           |  <- City/Address printed ONCE only
|               ICE: 002345678000045       |  <- Real fiscal ID (if configured)
+------------------------------------------+
| Ticket #0042        2026-11-17 14:30:22  |  <- Western digits in ISO timestamp
| Cashier: Youssef    Terminal: Pos-01     |
+------------------------------------------+
| Article                Qté    Prix   Total|
| ---------------------------------------- |
| Adidas Originals         1  150.00  150.00|
| iPhone 18 Pro Max        1   14500   14500|
| لوز بلدي مغربي      1.25kg  120.00  150.00|
+------------------------------------------+
| TOTAL TTC                     14800.00 MAD|  <- Clean TTC consumer price
+------------------------------------------+
| Mode de Paiement: TPE Carte Bancaire     |
| Auth Code: 894102   STAN: 001429         |
| Carte: **** **** **** 8821 (CMI / VISA)  |
+------------------------------------------+
| Détail TVA        Base HT      TVA    TTC|
| TVA 20%          12208.33  2441.67 14650.00|
| TVA 0% (Agri)      150.00     0.00  150.00|
+------------------------------------------+
|          [ CLIENT SVG QR CODE ]          |  <- Vector QR generated in client
|        Merci de votre visite à bientôt   |
+------------------------------------------+
```

### 1.1 Strict Receipt Hygiene Rules Implemented
1. **Single Store Header:** Store name printed exactly once (never twice or duplicated in subtitle).
2. **Single Address Header:** City and street address printed once (never `Casablanca` repeated).
3. **Customer Privacy (Zero Phone):** Telephone numbers removed from customer receipts to prevent personal data exposure.
4. **Zero Demo Tax IDs:** The receipt engine inspects configured tax IDs; if blank or containing demo placeholders, the line is cleanly omitted rather than printing fake data.
5. **Tax-Inclusive Retail Pricing (`INCLUSIVE_CLEAN`):** Grand total displays the exact agreed consumer shelf price without a surprise +20% surcharge added at the register.
6. **Western Digits in Timestamps:** Enforces standard Western numerals (`0-9`) in date and time strings (`YYYY-MM-DD HH:mm:ss`) for cross-cultural legibility.

---

## 2. Zero-Server-Cost Client-Side Vector Code Engine (`src/lib/tpe/client-codes.ts`)

Commercial retail platforms typically generate barcodes and QR codes by calling remote server APIs (e.g. Google Chart API, Barcode Web APIs). In an offline-first Moroccan retail context, this approach fails completely:
- When the internet drops, barcodes stop rendering.
- Calling external image APIs introduces 200–500ms network latency per printed receipt.
- Cloud image rendering burns expensive server compute.

**The KASPI Client Code Engine** is written in **pure TypeScript** with **zero external libraries**, generating scalable vector graphics (SVG) directly inside the browser or desktop client:

### 2.1 Code 128 (1D High-Density Alphanumeric Barcode)
- Implements Code 128 (Auto-switching subsets A, B, and C).
- Computes modulo 103 checksum in pure TypeScript.
- Renders crisp, printer-optimized black-and-white SVG paths with sub-millimeter bar widths for 203 DPI and 300 DPI thermal heads.

### 2.2 2D QR Code with Galois Field GF(256) Reed-Solomon Error Correction
- Implements ISO/IEC 18004 QR Code standard entirely on the client side:
  - Byte-mode alphanumeric and URL data encoding.
  - Galois Field arithmetic ($GF(2^8) = GF(256)$ with primitive polynomial $x^8 + x^4 + x^3 + x^2 + 1 = 0x11D$).
  - Synthetic Reed-Solomon polynomial division generating error-correction codewords.
  - Standard 2D QR matrix assembly (Finder patterns, Timing patterns, Alignment patterns, Format information).
  - Dynamic mask evaluation selecting the minimum penalty pattern.
- **Compute Cost:** **$0.00 USD / MAD**. Generates complex QR code SVGs in **<1.2 milliseconds** directly in client CPU memory.
