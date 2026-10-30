# RESUME HERE — Session Handoff

> Read this first on every `CONTINUE`. Then read `BUILD_STATUS.md`, then inspect actual code. Do **not** restart or rewrite. Do **not** ask permission for routine tasks.

## Where we are
- **Docker Compose Running:** `pos_saas_db` healthy on port 5432.
- **Database Migrated:** Migration `20261030012905_init` applied to PostgreSQL. All 34 tables created and verified.
- **Argon2id Authentication & Sessions Implemented:**
  - Password hashing with argon2id (`@node-rs/argon2`)
  - DB-backed Sessions with SHA-256 hashed tokens and `httpOnly; SameSite=Lax` cookies
  - `getRequestContext()` resolves active tenant membership from DB
  - Routes created: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/me`, `POST /api/v1/tenants/[tenantId]/switch`
  - Protection middleware created in `src/middleware.ts`
  - End-to-end integration test executed and passed (`src/server/auth/__tests__/auth-flow.ts`)
  - Full TypeScript typecheck passed (`tsc --noEmit`)

## Immediate Tasks (New Official Architectural Directives)
1. **NextAuth.js v5 (Auth.js) & Prisma Schema:**
   - Add standard NextAuth models: `Account`, adapt `Session`, add `VerificationToken`, plus `emailVerified`, `image` on `User`.
   - Run `npx prisma migrate dev --name add_nextauth`.
2. **NextAuth Implementation:**
   - Install `next-auth@beta` and `@auth/prisma-adapter`.
   - Setup `src/auth.ts` with `GoogleProvider` and `CredentialsProvider` (argon2id).
   - Setup Route Handlers `src/app/api/auth/[...nextauth]/route.ts`.
3. **Multilingual Support (i18n):**
   - Install `next-intl`.
   - Setup message catalogs: `messages/ar.json`, `messages/fr.json`, `messages/en.json`.
   - Integrate `next-intl` with NextAuth middleware.
4. **Cloud Deployment Strategy:**
   - Create `docs/DEPLOYMENT.md` covering Oracle Cloud Always Free (ARM Ampere A1), GitHub Codespaces, and Google Cloud Run.
   - Optimize `Dockerfile` and `docker-compose.yml`.

## Must-remember rules (full text: PROJECT_CONSTITUTION.md)
- `tenant_id` from server session/membership only; composite FKs; isolation tests are release-blocking.
- Money: `Decimal(12,2)` + `decimal.js`, strings over the wire, server computes totals.
- Idempotency keys on all important writes; ledgers append-only.
- Never claim a result you did not execute and observe.

## Open blockers
- KI-001 Docker daemon not running → DB tasks may need user action. Do DB-independent tasks meanwhile.
