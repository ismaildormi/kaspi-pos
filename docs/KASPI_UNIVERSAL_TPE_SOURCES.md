# KASPI POS (كسب) — Universal TPE Protocols & Terminal Receipt Architecture
## Official Technical Specifications, Regional Compliance & Hardware Integration Guide

---

## 1. Executive Architecture Overview

KASPI POS integrates with in-store physical Payment Terminals (TPE - *Terminal de Paiement Électronique*) across Morocco, EMEA, North America, and global retail environments. The integration architecture adheres to a strict dual-separation design:

1. **Regulatory & Payment Separation (Bank Al-Maghrib Law 103-12 & PCI-DSS 4.0.1):**
   - KASPI POS operates exclusively as a **Point of Sale Software (Software Vendor / ECR)**.
   - KASPI POS **never** acts as a payment intermediary, custodian of customer funds, or card data store.
   - Settlements flow **100% directly from acquiring banks or licensed payment institutions (CMI, Stripe, Adyen, Square, SumUp, NAPS, Payzone)** into the merchant's dedicated bank account.
   - **Zero PAN, PIN block, or CVV/CVC** data is ever captured, processed, or persisted in the KASPI application database, browser storage, or local filesystem. All cardholder data remains strictly inside the tamper-resistant hardware cryptographic perimeter (PTS-POI) of the certified TPE terminal.

2. **Universal Multi-Protocol Engine (`src/lib/tpe/` & `src-tauri/src/tpe_bridge.rs`):**
   - Implements native builders, parsers, and transport adapters for **all 7 major global TPE protocol families**.
   - Supports dual-mode execution: Native Desktop (via Tauri Rust socket & serial bridges) and Cloud/Web (via secure TLS WebSocket, REST endpoints, and WebSerial/WebUSB APIs).
   - Provides an **Honest Automation Level** flag for every protocol (`FULLY_AUTOMATED`, `ASSISTED_AUTO`, or `MANUAL_FALLBACK`) — guaranteeing zero simulated fake approvals.

---

## 2. The 7 Global TPE Protocol Families

```
+---------------------------------------------------------------------------------------------------+
|                                     KASPI POS CORE APPLICATION                                    |
|              (Unified Checkout / Transaction Orchestrator / Zero Amount Re-entry)                 |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 UNIVERSAL TPE INTEGRATION HUB                                     |
|                       (Device Fingerprinting / Regional Compatibility Registry)                   |
+---------------------------------------------------------------------------------------------------+
      |              |               |               |              |               |             |
      v              v               v               v              v               v             v
 [Family 1]     [Family 2]      [Family 3]      [Family 4]     [Family 5]      [Family 6]    [Family 7]
    nexo           OPI           Concert V3      ZVT / ECR       Cloud REST     Android POS   Near-Field
 Retailer      CardService       (CMI Telium/    (DACH ZVT /      Terminals     Smart AXIUM/   Desktop
ISO 20022      TCP Socket       AXIUM Tetra)    Verifone ECR)   Stripe/Adyen/   PAX/Sunmi/     Discovery
 XML/JSON       Port 20002       TCP 8888/Serial  Port 20007     Square/SumUp    Castles 9100   Rust Bridge
```

---

### Family 1: nexo Retailer Protocol (ISO 20022 XML/JSON)
* **Standard:** ISO 20022 / nexo standards (formerly EPAS). Supported by Adyen, Worldline, Nexi, PAX, Ingenico, Verifone, and Castles nexo-compliant builds.
* **Architecture:** Point-of-Interaction (POI) to Electronic Cash Register (ECR) standard interface.
* **Message Format:** Standard XML or JSON envelope containing `SaleToPOIRequest` and `SaleToPOIResponse`.
* **Transport:** TLS-TCP LAN socket (default port 20107 / 20002) or HTTPS Cloud relay.
* **Supported Categories:** `Payment`, `Reversal`, `Reconciliation`, `Print`, `TransactionStatus`, `Diagnosis`.
* **Key Implementation:**
  - `NexoRetailerProtocol` in `src/lib/tpe/ProtocolAdapters.ts`.
  - Builds standard ISO 20022 `SaleToPOIRequest` envelopes with unique message IDs, timestamps, and merchant store IDs.

---

### Family 2: OPI (Open Payment Initiative XML)
* **Standard:** OPI Retail Standard (Dual-Socket XML over TCP/IP). Widely deployed in European and international supermarkets, department stores, and fuel stations.
* **Architecture:**
  - Channel 1 (ECR -> POI): `CardServiceRequest` (Sale, Refund, Void).
  - Channel 2 (POI -> ECR): `DeviceRequest` (Display prompts and raw receipt text streams) and `ServiceResponse` (Authorization results).
* **Transport:** Raw TCP/IP stream on port `20002` (Request) and `20003` (Device notification).
* **Key Implementation:**
  - `OpiProtocol` in `src/lib/tpe/ProtocolAdapters.ts`.
  - Zero Amount Re-entry: The exact sale total is locked in the XML payload (`<Amount Total="150.00" Currency="MAD" />`); the cashier never manually types the amount on the terminal keypad.

---

### Family 3: Protocol Concert V3 / ECR (Ingenico Telium / Tetra / AXIUM — Morocco CMI)
* **Standard:** Protocol Concert V3 (ECR-CMI protocol standard across Morocco, France, and Francophone Africa).
* **Architecture:** Binary framing protocol using ASCII control characters:
  - Frame layout: `[STX (0x02)] [Type (1B)] [Len (2B)] [Data] [ETX (0x03)] [LRC (1B)]`.
  - LRC (Longitudinal Redundancy Check) = XOR sum of all bytes between STX (exclusive) and ETX (inclusive).
* **Transport:**
  - Ethernet TCP/IP LAN socket (standard CMI ports: `8888`, `10000`, or `20002`).
  - USB Virtual COM (CDC-ACM) / RS232 Serial (`9600 8N1` or `115200 8N1`).
* **Moroccan CMI Merchant Reality Guardrail:**
  - **Prerequisite:** CMI bank terminals (Ingenico ICT220, ICT250, Desk/5000, Move/5000, AXIUM DX8000) default to standalone ("Autonome") mode upon bank delivery.
  - In standalone mode, the terminal ignores all external POS messages.
  - To enable POS pairing, the merchant's bank or CMI service technician must enable **"Mode Caisse / Liaison ECR"** in the terminal Manager menu.
  - KASPI POS automatically detects when a CMI terminal is selected and displays clear Moroccan Arabic/French onboarding guidance:
    > "يرجى التأكد من تفعيل وضع الربط (Mode Caisse / Liaison ECR) على جهاز CMI من طرف التقني البنكي للاستجابة التلقائية لمبالغ الكاسة."

---

### Family 4: ZVT Protocol & Verifone ECR
* **Standard 4A: ZVT Protocol (Zahlungsverkehrsterminal):**
  - Predominant protocol in DACH (Germany, Austria, Switzerland) retail.
  - Byte-oriented protocol: APDU commands starting with `0x06` (`06 01` Registration, `06 00` Payment Auth, `06 30` End of Day / Cloture).
  - Transport: Raw TCP port `20007` or Serial RS232.
* **Standard 4B: Verifone ECR Protocol:**
  - Global Verifone standard (V400m, P400, MX925).
  - Packet protocol: `[STX] [Packet ID] [Command: SALE, REFUND, VOID] [Amount in Cents] [FS] [Currency] [ETX] [LRC]`.
  - Transport: Serial COM port or TCP port `8000` / `9000`.

---

### Family 5: Cloud-to-Terminal REST APIs
* **Providers:** Stripe Terminal (BBPOS WisePOS E, Stripe Reader S700), Adyen Terminal API, Square Terminal API, SumUp Solo Cloud API.
* **Architecture:**
  - Server-to-Cloud dispatch: POS backend connects to Provider Cloud API; Provider Cloud pushes WebSocket notification to physical terminal.
  - Requires **Zero Local Bridge**: Eliminates local LAN firewall or IP routing issues.
* **Endpoints & Operations:**
  - Stripe Terminal: `POST /v1/terminal/readers/{id}/process_payment_intent`.
  - Adyen Terminal: `POST https://terminal-api-live.adyen.com/sync` (JSON / nexo payload).
  - Square Terminal: `POST /v2/terminals/checkouts`.
  - SumUp Solo: `POST /v0.1/merchants/{merchant_code}/readers/{reader_id}/checkout`.

---

### Family 6: Android Smart POS Direct Engines
* **Hardware:** PAX A920 / A920 Pro / A35 / E-Series, Ingenico AXIUM DX8000, Castles Saturn 1000, Sunmi P2 / V2.
* **Architecture:**
  - Built-in thermal printer, camera scanner, and EMV PTS level 6 contact/contactless reader.
  - Communicates via local WebSocket / HTTP bridge service (`http://127.0.0.1:8080/tpe` or IP LAN socket) or standard ESC/POS raw port (`9100`).

---

### Family 7: Desktop Near-Field Auto-Discovery (`src-tauri/src/tpe_bridge.rs`)
* **Architecture:**
  - High-performance native Rust background scanner running on desktop POS machines.
  - Rapid parallel TCP port probe across standard TPE ports: `20002` (OPI/nexo), `8000` (Verifone), `8888` (Concert/CMI), `9100` (RAW ESC-POS), `20007` (ZVT).
  - Serial port enumerate: Scans USB Virtual COM ports with FTDI, Prolific, Ingenico CDC, and PAX vendor IDs (`0x079b`, `0x0b00`, `0x2e04`).
  - WebSerial & WebUSB browser fallbacks for Chrome/Edge running without Tauri native wrapper.

---

## 3. Custom Merchant Terminal Receipt Printing Architecture

KASPI POS implements an intelligent 4-Path Receipt Printing Engine (`src/lib/tpe/TpeReceiptPrinterEngine.ts`) that prints custom sales receipts directly onto built-in TPE thermal printers (58mm 32-column or 80mm 42-column).

### Strict Brand Invariance Rule
> **100% Merchant Branding — 0% Kaspi Logo:**
> Paper receipts handed to customers must proudly feature the **Merchant Store Name** (e.g. `ASIMA`, `Supermarché Atlas`, `Boutique Charaf`) and merchant ICE/IF/Tax identifiers. The KASPI POS software logo is strictly excluded from customer paper receipts.

```
+-----------------------------------------------------------------------------------+
|                        TpeReceiptPrinterEngine Architecture                       |
+-----------------------------------------------------------------------------------+
                                          |
        +------------------+--------------+---------------+-------------------+
        |                  |                              |                   |
        v                  v                              v                   v
   [PATH A]           [PATH B]                       [PATH C]            [PATH D]
  Adyen / nexo     Stripe Terminal               Android Smart POS     Bank-Locked
  ISO 20022 XML     print_content                 Raw ESC/POS Stream   Receipt Fallback
(DocumentQualifier  (384px 1-bit                   (Port 9100 / USB)   (Merge Card Auth
 = CustomerReceipt)  Monochrome PNG <100KB)                            into 80mm POS slip)
```

### Path A: Adyen / nexo ISO 20022 Print Command
* **Message Category:** `Print` (`DocumentQualifier: "CustomerReceipt"`).
* **Payload Structure:** XML/JSON text stream formatted with standard receipt tokens (`FormattedReceipt`, bold tags, and column alignment).
* **Execution:** Sent via `SaleToPOIRequest` envelope. The terminal prints the customer receipt immediately following authorization.

### Path B: Stripe Terminal 384px 1-Bit Raster PNG
* **Requirements:** High-contrast monochrome (1-bit black/white) raster image, exactly 384px wide (standard 57mm printhead width), file size strictly `< 100KB`.
* **Execution:**
  - Browser/Canvas: Generates clean black-on-white canvas with store title, date, itemized table, total MAD, and payment verification, exporting to base64 PNG data URL.
  - Server/SSR: Generates deterministic SVG with embedded monospace fonts and converts to PNG buffer without external binary dependencies.

### Path C: Android Smart POS & Network Thermal Printer ESC/POS
* **Format:** Standard ESC/POS binary byte sequence:
  - `0x1B, 0x40`: Initialize printer (`ESC @`).
  - `0x1B, 0x61, 0x01`: Center alignment (`ESC a 1`) for store header.
  - `0x1D, 0x21, 0x11`: Double height & width for store name (`GS ! 0x11`).
  - `0x1B, 0x61, 0x00`: Left alignment (`ESC a 0`) for itemized lines.
  - `0x1D, 0x56, 0x41, 0x10`: Full paper cut (`GS V 65 16`).
* **Transport:** Direct TCP socket on port `9100` (via Tauri Rust `print_tpe_receipt` command) or local USB bridge.

### Path D: Compliance-Locked Bank Terminals Fallback
* **Context:** Moroccan CMI and traditional European bank terminals possess locked firmware that enforces printing of the bank debit voucher only and refuses external print jobs.
* **Mechanism:**
  - KASPI POS captures the card authorization response metadata: `terminalId`, `authCode`, `maskedPan`, `cardBrand`, `transactionRef`, and `date`.
  - The `mergeTpeCardDataIntoPosReceipt` engine automatically injects this authorization block at the bottom of KASPI's main 80mm cash register receipt.
  - Result: Customer receives a single consolidated receipt fulfilling both commercial invoicing and bank audit requirements.

---

## 4. Hardware Port Matrix & Connectivity Reference

| Protocol / Standard | Default TCP Port | Serial Baud Rate | Flow Control | Primary Hardware Vendors |
| :--- | :--- | :--- | :--- | :--- |
| **nexo Retailer (ISO 20022)** | `20002` / `20107` | N/A (TCP/TLS) | N/A | Adyen, Worldline, Nexi, PAX, Castles |
| **OPI Retail XML** | `20002` (Req) / `20003` (Resp) | N/A (TCP) | N/A | Diebold Nixdorf, Gilbarco, Verifone |
| **Concert V3 / ECR** | `8888` / `10000` | `9600` / `115200` | None / RTS-CTS | CMI Morocco, Ingenico Telium/Tetra |
| **ZVT (Zahlungsverkehr)** | `20007` | `9600` / `19200` | RTS/CTS | FEIG, CCV, Ingenico DACH, Verifone |
| **Verifone ECR Packet** | `8000` / `9000` | `115200` | None / XON-XOFF | Verifone V400m, P400, MX925 |
| **Android Smart POS / ESC-POS**| `9100` / `8080` (WS) | USB CDC | None | PAX A920, Ingenico AXIUM, Sunmi |
| **Stripe / Square / SumUp Cloud**| `443` (HTTPS Cloud) | N/A | N/A | WisePOS E, S700, Square Terminal |

---

## 5. Regional Regulatory & Compliance Standards

### Bank Al-Maghrib (BAM) Law 103-12 (Morocco)
* **Direct Merchant Settlement:** All funds processed through CMI or Moroccan payment institutions (NAPS, Payzone) must settle directly into the merchant's licensed Moroccan bank account (RIB). KASPI POS holds no funds.
* **Store Identifiers:** Paper receipts generated in Morocco display the merchant's **ICE** (Identifiant Commun de l’Entreprise), **IF** (Identifiant Fiscal), and **RC** (Registre de Commerce).

### PCI-DSS v4.0.1 Compliance
* **Requirement 3.2:** Never store sensitive authentication data (SAD) after authorization (PIN blocks, CVV2/CVC2).
* **Requirement 3.4:** Primary Account Numbers (PAN) rendered on receipts or UI displays are strictly masked (showing at most the first 6 and last 4 digits: `4111 11** **** 1111`).
* **Requirement 4.1:** All transit over open networks must employ strong TLS 1.3 cryptography.

### EMVCo Level 1 & Level 2 Tokenization
* Terminals generate unique transaction cryptograms (ARQC, TC) and masked PAN references. KASPI stores only the external `authCode`, `rrn` (Retrieval Reference Number), and `maskedPan`.

---

## 6. Verification & Automated CI Gate

The integrity of this integration is verified on every build via `scripts/reverse-engineer-verify.mjs`:
- Verifies that all 7 protocol adapters and receipt printing engines exist and compile cleanly.
- Verifies that zero raw PAN/CVV columns exist in the database schema.
- Verifies that the live settings studio renders the thermal receipt simulator displaying the merchant's store name (`ASIMA`) with zero Kaspi logo bleed.
