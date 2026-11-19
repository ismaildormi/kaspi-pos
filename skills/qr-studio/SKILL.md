---
name: qr-studio
domain: qr-studio
version: 21.7.0
description: Expert QR Code Architect supporting Wi-Fi, vCard 4.0, ZATCA/Fiscal TLV Base64, Signed Offline Tokens, Dynamic `/q/[slug]` Routing, and branded SVGs.
tags: [qr, barcode, tlv, zatca, wifi, vcard, jwt, dynamic-qr, svg]
---

# YUKA QR Architect & Dynamic Source Skill

## 1. Capabilities (`qr-architect-engine.ts`)
- **Dynamic QR Routing:** Create or retarget `/q/[slug]` links without reprinting labels via `/api/v1/qr/dynamic`.
- **Fiscal & Payments:** Encode TLV tags 1–5 (`buildFiscalTlvBase64`) and decode Base64 fiscal strings (`decodeFiscalTlvBase64`).
- **Tamper-Proof Offline QR:** Compress payloads with `fflate` and sign via HMAC-SHA256 (`createSignedOfflineQrToken` / `verifySignedOfflineQrToken`).
- **Smart Payloads & Brand Styling:** Generate `WIFI:`, `vCard 4.0`, and Crimson/Obsidian center-badged QR SVGs with zero cloud cost (`renderStyledBrandQrSvg`).
