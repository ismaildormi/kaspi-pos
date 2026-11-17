# KASPI POS (كسب) — AI Engineering Handoff & Architecture Context Specification

**Document Version:** 2.4.0  
**Classification:** Machine-Readable Architecture Context, System Invariants & AI Pair-Programming Directive  
**Target Audience:** Autonomous Coding Agents, Future AI Pair Programmers & Lead Systems Architects

---

## 1. Quick-Start Invariant Commandments

When working on the `pos-saas-morocco` codebase, you MUST adhere strictly and without exception to these fundamental invariants:

```
+----------------------------------------------------------------------------------------------------+
|                                    STRICT SYSTEM INVARIANTS                                        |
+----------------------------------------------------------------------------------------------------+
| 1. LANDING & DOWNLOAD PAGES LOCKED: Never modify the public landing page (src/app/page.tsx) or     |
|    download page (src/app/[locale]/download/page.tsx) UI without explicit user instruction.       |
|                                                                                                    |
| 2. WSL / 9P FILESYSTEM INTEGRITY: NEVER copy node_modules across WSL /mnt/c/... mounts! Never write|
|    temporary scripts or screenshots into Windows NTFS mounts. Use native Linux Node & /tmp/.       |
|                                                                                                    |
| 3. SAAS PRICING LOCK: Monthly pricing is strictly 200 MAD (1st Poste 100% unlocked) + 150 MAD/mo  |
|    per extra Poste. Never create artificial feature paywalls on the 1st terminal.                  |
|                                                                                                    |
| 4. PCI-DSS 4.0.1 & LAW 103-12: Zero raw card numbers (PAN) or CVV/CVC columns allowed in Prisma or|
|    Dexie databases. Tokenized gateway identifiers and direct terminal PIN-pads only.               |
|                                                                                                    |
| 5. VISIONOS CRYSTAL GLASS OPTICS: Translucent frosted glass (backdrop-blur(36px), alpha < 0.65),  |
|    circular 36x36px icon-only theme toggle, natural KaspiBrandMark (44-48px auth, 28-32px header),  |
|    and 100% modals portaled to document.body at z-[9999] strictly above checkout CTA (z: 0).       |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Repository File Map & High-Value Directories

```
pos-saas-morocco/
├── src/
│   ├── app/                                # Next.js 15 App Router pages & API routes
│   │   ├── [locale]/                       # Trilingual localized routes (ar, fr, en)
│   │   │   ├── (auth)/                     # Login, Register, Forgot Password
│   │   │   ├── pos/                        # Real-time POS register interface
│   │   │   ├── restaurant/kds/             # Kitchen Display System
│   │   │   └── dashboard/                  # Merchant admin (billing, inventory, products)
│   │   └── api/                            # 80+ REST & RPC backend endpoints
│   ├── client/                             # Frontend stores & offline DB
│   │   ├── db.ts                           # Dexie.js IndexedDB schema (offlineProducts, sales)
│   │   ├── store/usePosStore.ts            # Zustand master POS state engine
│   │   ├── sync-engine.ts                  # Background edge synchronization worker
│   │   └── printing/                       # Silent thermal print spooler
│   ├── components/                         # Modular React 19 UI components
│   │   ├── common/                         # KaspiBrandMark, KaspiThemeToggle, KaspiGlassModalPortal
│   │   ├── pos/                            # ProductGrid, QuickProductModal, SquarePluScalePanel
│   │   └── restaurant/                     # KDS components, TableSelectionModal
│   ├── lib/                                # Domain logic & external integrations
│   │   ├── payments/                       # 18+ Modular payment gateway files (Stripe, CMI, PayZone)
│   │   ├── tpe/                            # Universal TPE 7-Protocol Hub & Client Vector Codes
│   │   └── image-compression.ts            # Client-side WebP image optimizer & background cutout
│   └── middleware.ts                       # Edge multi-tenant routing & JWT auth verification
├── src-tauri/                              # Native Tauri 2.0 Rust desktop backend
│   └── src/
│       ├── main.rs                         # Tauri runtime initialization
│       └── tpe_bridge.rs                   # Raw TCP socket bridge for nexo/OPI/CMI terminals
├── prisma/
│   └── schema.prisma                       # 77 Normalized relational models (PostgreSQL)
├── scripts/                                # Verification & Compliance Enforcement Gates
│   ├── audit-full-ui-cohesion.mjs          # VisionOS glass & UI component static audit
│   ├── reverse-engineer-verify.mjs         # 15-Rule static & live browser compliance gate
│   ├── verify-dossier-completeness.mjs     # Zero-omission master dossier verification gate
│   └── security/secret-scan.mjs            # Hardcoded secret & CHD forensic scanner
└── deliverables/kaspi-master-dossier/      # Complete official executive & technical package
```

---

## 3. The 5 Mandatory Verification Gates

Before committing, merging, or deploying changes to this codebase, all 5 verification gates must execute with zero failures:

1. **Gate 1 — TypeScript Strict Compilation:**
   ```bash
   node ./node_modules/typescript/bin/tsc --noEmit
   ```
2. **Gate 2 — VisionOS Glass & UI Cohesion Audit:**
   ```bash
   node scripts/audit-full-ui-cohesion.mjs
   ```
3. **Gate 3 — Reverse-Engineering & Live Browser Audit:**
   ```bash
   node scripts/reverse-engineer-verify.mjs
   ```
4. **Gate 4 — Security & Cryptographic Forensic Scan:**
   ```bash
   node scripts/security/secret-scan.mjs
   ```
5. **Gate 5 — Master Dossier Zero-Omission Gate:**
   ```bash
   node scripts/verify-dossier-completeness.mjs
   ```

---

## 4. Key Symbols & Architectural Anchor Points

- **`KaspiBrandMark` (`src/components/common/KaspiBrandMark.tsx`):**
  Renders the frameless cutout `/logo-mark.png` across both light and dark themes. Preserves natural proportions: `auth` (44-48px), `header` (28px), `sidebar` (32px).
- **`KaspiThemeToggle` (`src/components/common/KaspiThemeToggle.tsx`):**
  Strictly a circular 36x36px icon-only button (`rounded-full w-9 h-9 p-0`) toggling between `pearl-light` and `fjord-twilight`. Zero visible text labels inside the button.
- **`KaspiGlassModalPortal` (`src/components/common/KaspiGlassModalPortal.tsx`):**
  Wraps all modals and drawers using React `createPortal(..., document.body)` at `z-[9999]`. Guarantees modals render directly in the body stacking context above all checkout CTAs (`z: 0`).
- **`TpeTransactionBridge` (`src/lib/tpe/TpeTransactionBridge.ts`):**
  Enforces the 11-State Finite State Machine with Zero Amount Re-entry and automated timeout reversal.
- **`SubscriptionManager` (`src/lib/payments/subscription-manager.ts`):**
  Implements the mathematical SaaS billing rule: `200 + (max(0, extraPostes) * 150) MAD`.
