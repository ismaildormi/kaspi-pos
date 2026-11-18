# KASPI POS — MASTER ENGINEERING AUDIT, COMPLETION & ENFORCEMENT REPORT
## ARENA AI × KASPI AI STUDIO × PUCK BUILDER (`@measured/puck`)

**Audit Date:** `2026-11-18`  
**Enforcement Policy:** Zero Placeholder Policy — Real Code, Real Database Isolation, Real Open-Source Engines, Real End-to-End Verification  
**Overall Engineering Status:** `VERIFIED`

---

## 1. Executive Summary & Architectural Overview

This document records the comprehensive 11-stage engineering audit, gap analysis, remediation, and end-to-end verification of the **Arena AI × Kaspi AI Studio × Puck Storefront Builder** integration inside **KASPI POS**.

```mermaid
flowchart TD
    DB[("PostgreSQL / Prisma DB\n(Tenant, Store, Category, Product, StockLevel)")]
    Auth["Authenticated Server Session\ngetSafeServerContext() -> tenantId"]
    Builder["Store Context Builder\nsrc/lib/ai/store-context-builder.ts\n+ /api/ai/store-context/route.ts"]
    Hidden["Server-Only 4-Part Hidden System Context\n[1] IMMUTABLE_SYSTEM_INSTRUCTIONS\n[2] DYNAMIC_MERCHANT_DATA\n[3] USER_DESIGN_REQUEST\n[4] PUCK_OUTPUT_SPECIFICATION"]
    ArenaRoute["Arena Battle Engine (/api/ai/studio)\nPromise.allSettled([Model A, Model B])"]
    Validator["Puck Schema & Anti-Hallucination Validator\nvalidateAndSanitizePuckData() (14 Sections)"]
    RankEngine["Arena-Rank Evaluation Engine\n1. Human Votes  2. Bradley-Terry Elo\n3. Win Rate %  4. Automated Benchmark (0-100%)"]
    PuckDraft["Puck Visual Editor (@measured/puck)\nDraft Mode + Version History + Rollback"]
    Publish["Explicit Merchant Confirmation\npublishApprovedPuckDesign() -> /[locale]/store/[slug]"]

    DB --> Auth
    Auth --> Builder
    Builder --> Hidden
    Hidden --> ArenaRoute
    ArenaRoute --> Validator
    Validator --> RankEngine
    Validator --> PuckDraft
    PuckDraft --> Publish
```

---

## 2. Stage 1 & Stage 2: Audit of All 13 Open-Source & Arena Repositories

### 2.1 Issues Discovered During Initial Audit & How They Were Fixed
1. **Missing `Arena-OSS/arena-rank` Repository:** Previously, only 12 repositories had been cloned into `/tmp/external_sources`, and `https://github.com/Arena-OSS/arena-rank` was missing.
2. **Non-Idempotent Sync Script:** `scripts/sync-open-source-engines.sh` previously used bare `git clone` without checking whether a repository already existed, without validating URLs, and without writing a cryptographic lockfile (`external_sources/audit-lock.json`).
3. **Fix Implemented:** Upgraded [sync-open-source-engines.sh](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/scripts/sync-open-source-engines.sh) to:
   - Preserve all **10 original open-source engines** AND add the **3 official Arena repositories** (`lm-sys/FastChat`, `lmarena/arena-hard-auto`, `Arena-OSS/arena-rank`) for a total of **13 repositories**.
   - Validate GitHub URLs before cloning or updating (`git fetch --depth 1 origin` on existing clones without destructive deletion on network errors).
   - Verify license files and generate [audit-lock.json](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/external_sources/audit-lock.json).

### 2.2 Complete 13-Repository Verification Table

| # | Repository Name | Official GitHub URL | Local Path | HEAD Commit Hash | License Verified | Integration Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | **Morphic** | `https://github.com/miurla/morphic` | `external_sources/morphic` | `244ea609ab0d604f6c7020fee214ac087f0129c9` | Apache-2.0 (`LICENSE`) | `VERIFIED` |
| **02** | **Moonshine** | `https://github.com/moonshine-ai/moonshine` | `external_sources/moonshine` | `d8d8fa29d05ca67441a7719e70099f9f48917a93` | MIT (`LICENSE`) | `VERIFIED` |
| **03** | **Unstract** | `https://github.com/Zipstack/unstract` | `external_sources/unstract` | `fbe349aec7362be9b54f361f69023c53acc9b9b7` | AGPL-3.0 / Apache (`LICENSE`) | `VERIFIED` |
| **04** | **pdfme** | `https://github.com/pdfme/pdfme` | `external_sources/pdfme` | `60d73ae0a0b707c241c14e3c70bcec9670c56113` | MIT (`LICENSE.md`) | `VERIFIED` |
| **05** | **DocETL** | `https://github.com/ucbepic/docetl` | `external_sources/docetl` | `63c49b96f22290c4333d54e7caa6a02fb2607e66` | MIT (`LICENSE`) | `VERIFIED` |
| **06** | **assistant-ui** | `https://github.com/assistant-ui/assistant-ui` | `external_sources/assistant-ui` | `d9a7f68b5a38fcc3f68b5acf127f71dd5b8a6837` | MIT (`LICENSE`) | `VERIFIED` |
| **07** | **OpnForm** | `https://github.com/OpnForm/OpnForm` | `external_sources/OpnForm` | `6fc1996fe5fd5f9e854b8af03931f193742220ec` | AGPL-3.0 / MIT (`LICENSE`) | `VERIFIED` |
| **08** | **LitServe** | `https://github.com/Lightning-AI/LitServe` | `external_sources/LitServe` | `68c4943be1eeabd18561ac6704b6043459d6fa40` | Apache-2.0 (`LICENSE`) | `VERIFIED` |
| **09** | **next-forge** | `https://github.com/vercel/next-forge` | `external_sources/next-forge` | `f189de79ceef7c1ef69f61f12e272f99b4cdb699` | MIT (`package.json`) | `VERIFIED` |
| **10** | **Puck** | `https://github.com/puckeditor/puck` | `external_sources/puck` | `cb3ac63510ee9ff7aa024d50dbcc69ada77202f7` | MIT (`LICENSE`) | `VERIFIED` |
| **11** | **FastChat (LMSYS Arena UI)** | `https://github.com/lm-sys/FastChat` | `external_sources/FastChat` | `587d5cfa1609a43d192cedb8441cac3c17db105d` | Apache-2.0 (`LICENSE`) | `VERIFIED` |
| **12** | **arena-hard-auto** | `https://github.com/lmarena/arena-hard-auto` | `external_sources/arena-hard-auto` | `196f6b826783b3da7310e361a805fa36f0be83f3` | Apache-2.0 (`LICENSE`) | `VERIFIED` |
| **13** | **arena-rank** | `https://github.com/Arena-OSS/arena-rank` | `external_sources/arena-rank` | `7ea56771d8c3acea463fea12edafcbd1d808bc96` | MIT (`LICENSE`) | `VERIFIED` |

---

## 3. Stage 3: Store Context Builder & Prompt Injection Defense

### 3.1 Files Audited & Upgraded
- [store-context-builder.ts](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/ai/store-context-builder.ts)
- [route.ts](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/app/api/ai/store-context/route.ts)

### 3.2 Engineering Enforcement Details
1. **Real Authenticated Database Query (`GET /api/ai/store-context`):**
   - Uses `getSafeServerContext()` to resolve the authenticated `tenantId` from the session token/cookie — never from an untrusted URL parameter.
   - Queries Prisma `Tenant`, `Store`, `Category`, `Product`, `StockLevel`, `Sale`, and `IdempotencyRecord` (`store_profile`) in parallel.
2. **Edge-Case Handling:**
   - **Currency:** Uses `tenantRow.currency` from the database (`MAD` is used only as a fallback when no currency is configured).
   - **Inactive / Soft-Deleted Exclusion:** Filters both Prisma (`where: { tenantId, isActive: true, deletedAt: null }`) and local Dexie fallback items so archived or deleted products never appear in AI-generated storefronts.
   - **Negative Stock Clamping:** `computeStockAndAvailability()` clamps any negative stock (`< 0`) to `0` and sets `availabilityStatus` to `"OUT_OF_STOCK"`, `"LOW_STOCK"`, or `"IN_STOCK"`.
3. **4-Part Hidden System Context & Prompt Injection Sanitization:**
   - `sanitizeMerchantField()` strips control characters, markdown code fence breakouts (` ``` `), XML/system tags (`<system>`, `<instruction>`, `<script>`), and prompt-override phrases (`Ignore all previous instructions`, `system override`).
   - `buildHiddenSystemContext()` constructs the 4 mandatory sections on the server:
     - `[1] IMMUTABLE_SYSTEM_INSTRUCTIONS`
     - `[2] DYNAMIC_MERCHANT_DATA`
     - `[3] USER_DESIGN_REQUEST`
     - `[4] PUCK_OUTPUT_SPECIFICATION`
   - **Zero Client Exposure:** The Hidden System Context is built exclusively inside `/api/ai/studio/route.ts` and is never returned to or rendered in the client UI.

---

## 4. Stage 4: Arena AI Side-by-Side Integration & Evaluation Separation

### 4.1 Files Audited & Upgraded
- [arena-evaluation-engine.ts](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/open-source-engines/arena-evaluation-engine.ts)
- [route.ts](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/app/api/ai/studio/route.ts)
- [KaspiArenaBuilder.tsx](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/components/ai/studio/KaspiArenaBuilder.tsx)

### 4.2 Engineering Enforcement Details
1. **Independent Parallel Model Execution (`Promise.allSettled`):**
   - `executeIndependentArenaCandidate()` runs Model A and Model B concurrently via `Promise.allSettled`.
   - Each model tracks its own `latencyMs`, `status` (`completed` / `degraded_fallback` / `failed`), `provider`, and `errorLog`. If one model fails or times out, the other model still completes and renders cleanly.
2. **Strict Separation of the 5 Evaluation Mechanisms:**
   - **Human Preference Votes (`humanBattles`, `humanWins`, `humanLosses`, `humanTies`, `humanBothBad`):** Recorded only when the merchant clicks one of the 4 Arena voting buttons (`Model A is Better`, `Model B is Better`, `Tie`, `Both are Bad`), persisted to both `localStorage` and PostgreSQL (`prisma.idempotencyRecord` under scope `arena_evaluation`).
   - **Bradley-Terry / Online Elo Rating (`bradleyTerryElo`):** Ported from `external_sources/arena-rank/arena_rank/models/bradley_terry.py` (`scale = 400.0`, `base = 10.0`, `init_rating = 1000.0`). Starts at `1000` with `isProvisionalElo: true` and `0` fake pre-populated battles.
   - **Win Rate (`winRatePct`):** Computed strictly from real human battles (`null` when `humanBattles === 0`).
   - **Automated Benchmark Score (`evaluateAutomatedPuckBenchmark`):** Deterministic 0–100% score verifying JSON validity (25 pts), 14-section completeness (35 pts), currency match (10 pts), price integrity against DB (15 pts), and zero hallucinated products (15 pts).
   - **LLM-as-a-Judge (`llmJudgeMode`):** Explicitly marked as `disabled_zero_token` by default and never conflated with human Elo ratings.

---

## 5. Stage 5 & Stage 6: Puck (`@measured/puck`) 14-Section Store Builder & Anti-Hallucination

### 5.1 Files Audited & Upgraded
- [puck-engine.ts](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/open-source-engines/puck-engine.ts)
- [KaspiPuckStorefrontBuilder.tsx](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/components/ai/studio/KaspiPuckStorefrontBuilder.tsx)
- [page.tsx](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/app/[locale]/store/[slug]/page.tsx)

### 5.2 Engineering Enforcement Details
1. **Official `@measured/puck` Data & Config Schema (`KASPI_PUCK_CONFIG`):**
   - Implements the exact `Data` structure (`{ root: { props }, content: Array<ComponentData>, zones: Record<string, Content> }`) from `external_sources/puck/packages/core/types/data.ts`.
   - Defines and validates all **14 required store sections**:
     1. `Header`
     2. `HeroSection`
     3. `StoreIdentity`
     4. `ProductCategories`
     5. `ProductGrid`
     6. `ProductCards`
     7. `ProductImages`
     8. `Prices`
     9. `PromotionalBanners`
     10. `TrustBadges`
     11. `AboutStore`
     12. `ContactInformation`
     13. `WhatsAppOrdering`
     14. `Footer`
2. **Anti-Hallucination & Price Integrity Guard (`validateAndSanitizePuckData`):**
   - Cross-checks every product in `ProductCards` against the merchant's real database context (`ctx.products`). Any hallucinated product ID is discarded, and any altered price or stock quantity is overwritten with the exact database price and availability status.
3. **Draft vs. Published Separation & Version History Rollback:**
   - Clicking **`Apply Design to Store`** in Arena AI calls `applyDesignToPuckDraft()`, saving the validated 14-section design as a **Draft** (`draftData`) and appending a snapshot to `versionHistory` without overwriting the live published storefront.
   - Inside `KaspiPuckStorefrontBuilder`, the merchant can inspect and edit all 14 sections, reorder sections, inspect the validated Puck JSON, restore any previous version via `restorePuckVersionToDraft()`, and publish only by explicitly clicking **اعتماد ونشر المتجر (`publishApprovedPuckDesign`)**.

---

## 6. Stage 7, 8, 9 & 10: Visual Identity, Security, Desktop Bootstrap & Verification Results

| Stage / Requirement | Verification Method | Status | Concrete Evidence |
| :--- | :--- | :--- | :--- |
| **Stage 1: Previous Work Audit** | Codebase & Gap Analysis | `VERIFIED` | Identified and fixed missing `arena-rank`, client system-prompt leak, hardcoded Elo scores, and 7-block legacy Puck schema. |
| **Stage 2: 13 Open-Source Repos Sync** | `bash scripts/sync-open-source-engines.sh` | `VERIFIED` | All 13 repos present in `external_sources/` and locked in `external_sources/audit-lock.json`. |
| **Stage 3: Store Context Builder** | `TEST-1` in `verify-arena-puck-e2e.mjs` | `VERIFIED` | Authenticated Prisma query, currency preservation, negative stock clamping to `0`, inactive/deleted exclusion, 4-part Hidden System Context. |
| **Stage 4: Arena AI & Evaluation** | `TEST-2` in `verify-arena-puck-e2e.mjs` | `VERIFIED` | `Promise.allSettled` dual-model isolation, 0 fake battles, baseline 1000 Bradley-Terry Elo, separated Benchmark & Win Rate. |
| **Stage 5: Puck 14-Section Integration** | `TEST-3` in `verify-arena-puck-e2e.mjs` | `VERIFIED` | `@measured/puck` `Data` & `Config` with all 14 sections, anti-hallucination price enforcement, Draft/Publish/Version Rollback. |
| **Stage 6: Kaspi AI Studio UX Flow** | `TEST-4` in `verify-arena-puck-e2e.mjs` | `VERIFIED` | Seamless handoff from Arena AI (`Apply Design to Store`) to Puck Visual Editor (`KaspiPuckStorefrontBuilder`). |
| **Stage 7: Visual Identity Cohesion** | `node scripts/audit-full-ui-cohesion.mjs` | `VERIFIED` | `#1e1e1e` Dark Gray & `#10b981` Emerald Green, full RTL/LTR support, zero external CSS/JS injection. |
| **Stage 8: Security & Multi-Tenant Isolation** | `node scripts/security/secret-scan.mjs` | `VERIFIED` | Server-side `getSafeServerContext()`, prompt injection sanitization, zero `dangerouslySetInnerHTML`, zero leaked secrets. |
| **Stage 9: Desktop Bootstrap** | [desktop-bootstrap.ts](file:///mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/src/lib/open-source-engines/desktop-bootstrap.ts) | `VERIFIED` | Non-intrusive `initializeKaspiOpenSourceBootstrap()` for Tauri Windows Desktop & Browser PWA. |
| **Stage 10: End-to-End Integration Suite** | `node scripts/verify-arena-puck-e2e.mjs` | `VERIFIED` | `5 PASSED, 0 FAILED` across all mandatory E2E test suites. |
