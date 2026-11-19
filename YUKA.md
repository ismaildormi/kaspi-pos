# HEYUKA / YUKA — Project Root Context Constitution (`YUKA.md`)

> Sovereign Intelligence Core owned by **KASPI** • Progressive Skills (`agentskills.io`) • Persistent Cowork Sessions • Strict POS Immutability

## 1. Core Identity & Architecture Boundaries
- **Primary Sovereign Brand:** **HEYUKA** (by KASPI). Legacy routes `/yuka` and `/zebra-x` coexist cleanly without breaking compatibility.
- **Immutable POS Core Lock (`POS_IMMUTABLE_CORE_LOCK = true`):**
  - Never mutate deterministic checkout, pricing, tax, or schema paths (`src/domain/`, `src/app/[locale]/pos/`, `prisma/schema.prisma`, `scripts/`) from runtime AI agents.
  - Runtime AI code generation, file organization, and sandbox experiments operate strictly inside external user workspaces, `LiveArtifactDrawer`, or isolated sandboxes.
- **Confidentiality Rule on Public UIs:** Never surface internal routing suppliers, credentials, or internal file system details on public developer marketing/docs views (`/zebra-x`, `/heyuka`, `/api/v1/zebra-x/openapi`, `/api/v1/models`).

## 2. Primary Codebase Modules
- **AI Gateway & Failover Router:** `src/lib/ai-router.ts`
- **API Keys & Key IDs (`hk-live-` / `yk-live-` / `zx-live-`):** `src/lib/zebra-x/api-auth.ts` + `src/middleware.ts`
- **Skills Vault (3-Tier Progressive `SKILL.md`):** `src/lib/zebra-x/core/skills-vault.ts` + `skills/<domain>/`
- **Persistent Cowork & Context Hygiene:** `src/lib/zebra-x/core/cowork-session.ts`
- **Big-Tech Catalog Indexer & Tool Hunter:** `src/lib/zebra-x/core/catalog-hunter.ts`
- **Dynamic Intent & Masking Router:** `src/lib/zebra-x/core/router.ts`
- **3D Companion Engine (`Three.js`):** `src/lib/heyuka/engine/` + `src/components/heyuka/HEYUKACreatureCanvas.tsx`
- **Chat Interface:** `src/components/ai/AIChatWidget.tsx` + `src/app/api/ai/chat/route.ts`

## 3. Verification Discipline
- Always verify changes with `tsc --noEmit --incremental false`, `scripts/security/secret-scan.mjs`, `scripts/audit-full-ui-cohesion.mjs`, and `next build`.
